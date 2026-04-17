require('dotenv').config();
const Fastify = require('fastify');
const { createClient } = require('@supabase/supabase-js');

const fastify = Fastify({ logger: true });

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_KEY || 'dummy_key'
);

const standardResponseSchema = {
    type: 'object',
    properties: {
        statusCode: { type: 'integer' },
        intoperationCode: { type: 'integer' },
        data: { type: 'array' }
    }
};

// GET / - Obtener todos los grupos con conteo de miembros
fastify.get('/', async (request, reply) => {
    try {
        const { data: grupos, error: ge } = await supabase
            .from('grupos')
            .select('*')
            .order('creado_en', { ascending: false });
        if (ge) throw ge;

        // Para cada grupo, obtener sus miembros
        const result = await Promise.all((grupos || []).map(async (g) => {
            const { data: miembros } = await supabase
                .from('grupo_miembros')
                .select('usuario_id')
                .eq('grupo_id', g.id);

            const memberIds = (miembros || []).map(m => m.usuario_id);

            return {
                id: g.id,
                nombre: g.nombre,
                descripcion: g.descripcion,
                creador_id: g.creador_id,
                creado_en: g.creado_en,
                memberIds: memberIds,
                membersCount: memberIds.length
            };
        }));

        return reply.send({ statusCode: 200, intoperationCode: 1, data: result });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno' }] });
    }
});

// GET /:id - Obtener grupo por ID
fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const { data: g, error: ge } = await supabase
            .from('grupos').select('*').eq('id', id).single();
        if (ge) throw ge;

        const { data: miembros } = await supabase
            .from('grupo_miembros')
            .select('usuario_id')
            .eq('grupo_id', id);

        const memberIds = (miembros || []).map(m => m.usuario_id);

        return reply.send({
            statusCode: 200, intoperationCode: 1, data: [{
                ...g, memberIds, membersCount: memberIds.length
            }]
        });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

// POST / - Crear grupo
fastify.post('/', async (request, reply) => {
    try {
        const { nombre, descripcion, creador_id } = request.body;
        const { data, error } = await supabase.from('grupos')
            .insert([{ nombre, descripcion, creador_id }])
            .select().single();
        if (error) throw error;
        return reply.status(201).send({ statusCode: 201, intoperationCode: 1, data: [{ message: 'Grupo creado', grupo: data }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error al crear el grupo' }] });
    }
});

// PUT /:id - Actualizar grupo
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const { nombre, descripcion } = request.body;
        const { data, error } = await supabase.from('grupos')
            .update({ nombre, descripcion })
            .eq('id', id).select().single();
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Grupo actualizado', grupo: data }] });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

// DELETE /:id - Eliminar grupo
fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        await supabase.from('grupo_miembros').delete().eq('grupo_id', id);
        const { error } = await supabase.from('grupos').delete().eq('id', id);
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Grupo eliminado' }] });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

// POST /:id/members - Agregar miembro al grupo
fastify.post('/:id/members', async (request, reply) => {
    const { id } = request.params;
    const { email, usuario_id } = request.body;
    try {
        let userId = usuario_id;
        if (!userId && email) {
            const { data: u } = await supabase.from('usuarios').select('id').eq('email', email).single();
            if (!u) {
                return reply.status(404).send({ statusCode: 404, intoperationCode: 0, data: [{ error: 'Usuario no encontrado' }] });
            }
            userId = u.id;
        }

        const { error } = await supabase.from('grupo_miembros').insert([{ grupo_id: id, usuario_id: userId }]);
        if (error && error.code !== '23505') throw error;

        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Miembro agregado' }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error al agregar' }] });
    }
});

// DELETE /:id/members/:userId - Remover miembro
fastify.delete('/:id/members/:userId', async (request, reply) => {
    const { id, userId } = request.params;
    try {
        const { error } = await supabase.from('grupo_miembros')
            .delete().eq('grupo_id', id).eq('usuario_id', userId);
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Miembro removido' }] });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

// GET /:id/members - Obtener miembros del grupo
fastify.get('/:id/members', async (request, reply) => {
    const { id } = request.params;
    try {
        const { data: miembros, error } = await supabase
            .from('grupo_miembros')
            .select('usuario_id, usuarios:usuario_id (id, nombre_completo, email, username)')
            .eq('grupo_id', id);
        if (error) throw error;

        const members = (miembros || []).map(m => m.usuarios).filter(Boolean);
        return reply.send({ statusCode: 200, intoperationCode: 1, data: members });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log(`👥 Groups Service escuchando en http://localhost:3003`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
