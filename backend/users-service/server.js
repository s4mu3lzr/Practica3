require('dotenv').config();
const Fastify = require('fastify');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const fastify = Fastify({ logger: true });

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_KEY || 'dummy_key'
);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Permisos por email (temporal hasta que se agregue columna permisos a BD)
// Soporta también columna permisos si existe en la BD
const DEFAULT_PERMISSIONS = {
    'admin_sys@demo.com': ['user:crud', 'group:add', 'group:edit', 'group:delete', 'ticket:create', 'ticket:edit'],
    'maria.g@demo.com': ['group:add', 'ticket:create', 'ticket:edit'],
    'carlos.r@demo.com': ['ticket:create'],
    'luis.p@demo.com': [],
    'usuario_r@demo.com': ['ticket:create', 'group:add'],
    'soporte_t@demo.com': ['ticket:create']
};

// Almacenamiento temporal de permisos en memoria (se pierde si el servicio se reinicia)
const permissionsOverride = {};

function getPermissions(email, dbPermisos) {
    // Si se han sobrescrito localmente, usar esos
    if (permissionsOverride[email] !== undefined) return permissionsOverride[email];
    // Si la BD tiene permisos, usar esos
    if (dbPermisos !== null && dbPermisos !== undefined) {
        try { return typeof dbPermisos === 'string' ? JSON.parse(dbPermisos) : dbPermisos; } catch(e) {}
    }
    // Usar defaults
    return DEFAULT_PERMISSIONS[email] || [];
}

// POST /login
fastify.post('/login', async (request, reply) => {
    let { email, password } = request.body;
    email = (email || '').toLowerCase().trim();
    try {
        const { data: user, error } = await supabase.from('usuarios').select('*').eq('email', email).single();
        if (error || !user) {
            return reply.status(401).send({ statusCode: 401, intoperationCode: 0, data: [{ error: 'Credenciales inválidas' }] });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return reply.status(401).send({ statusCode: 401, intoperationCode: 0, data: [{ error: 'Credenciales inválidas' }] });
        }

        const perms = getPermissions(email, user.permisos);
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.nombre_completo, permissions: perms },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        await supabase.from('usuarios').update({ last_login: new Date().toISOString() }).eq('id', user.id);

        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ token, message: 'Login exitoso' }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno' }] });
    }
});

// POST /register
fastify.post('/register', async (request, reply) => {
    const { nombre_completo, email, username, password } = request.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: user, error } = await supabase.from('usuarios').insert([{
            nombre_completo, email, username, password: hashedPassword
        }]).select().single();
        if (error) throw error;
        return reply.status(201).send({ statusCode: 201, intoperationCode: 1, data: [{ message: 'Usuario registrado', user }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error al registrar' }] });
    }
});

// POST /add - Crear usuario desde admin
fastify.post('/add', async (request, reply) => {
    const { nombre_completo, email, username, password, permissions } = request.body;
    try {
        const hashedPassword = await bcrypt.hash(password || 'Default1234!', 10);
        const { data: user, error } = await supabase.from('usuarios').insert([{
            nombre_completo, email, username: username || email.split('@')[0], password: hashedPassword
        }]).select().single();
        if (error) throw error;

        // Guardar permisos en memoria
        if (permissions !== undefined) {
            permissionsOverride[email] = permissions;
        }

        return reply.status(201).send({ statusCode: 201, intoperationCode: 1, data: [{ message: 'Usuario añadido', user }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: error.message || 'Error interno' }] });
    }
});

// GET / - Listar todos los usuarios con permisos
fastify.get('/', async (request, reply) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('id, nombre_completo, email, username, last_login').order('nombre_completo');
        if (error) throw error;

        const usersWithPerms = (data || []).map(u => ({
            id: u.id,
            name: u.nombre_completo,
            email: u.email,
            username: u.username,
            last_login: u.last_login,
            permissions: getPermissions(u.email, null)
        }));

        return reply.send({ statusCode: 200, intoperationCode: 1, data: usersWithPerms });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno al obtener usuarios' }] });
    }
});

// GET /:id - Obtener usuario por ID
fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const { data: u, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
        if (error) throw error;
        return reply.send({
            statusCode: 200, intoperationCode: 1, data: [{
                id: u.id, name: u.nombre_completo, email: u.email,
                username: u.username, permissions: getPermissions(u.email, null)
            }]
        });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

// PUT /:id - Actualizar usuario (incluyendo permisos)
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, email, permissions } = request.body;
    try {
        // Actualizar datos básicos en BD
        const updateData = {};
        if (name) updateData.nombre_completo = name;

        if (Object.keys(updateData).length > 0) {
            await supabase.from('usuarios').update(updateData).eq('id', id);
        }

        // Actualizar permisos en memoria
        if (permissions !== undefined && email) {
            permissionsOverride[email] = permissions;
            fastify.log.info(`Permisos actualizados para ${email}: ${JSON.stringify(permissions)}`);
        }

        const { data: u } = await supabase.from('usuarios').select('*').eq('id', id).single();
        return reply.send({
            statusCode: 200, intoperationCode: 1,
            data: [{ message: 'Usuario actualizado', user: { ...u, permissions: email ? getPermissions(email, null) : [] } }]
        });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno' }] });
    }
});

// DELETE /:id
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const { data: u } = await supabase.from('usuarios').select('email').eq('id', id).single();
        if (u) delete permissionsOverride[u.email];

        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Usuario eliminado' }] });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log(`👤 Users Service escuchando en http://localhost:3001`);
        console.log(`   📋 Permisos iniciales cargados para ${Object.keys(DEFAULT_PERMISSIONS).length} usuarios`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
