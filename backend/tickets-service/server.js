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

// GET /  - Obtener todos los tickets con joins
fastify.get('/', async (request, reply) => {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                id, titulo, descripcion, autor_id, asignado_id, creado_en, fecha_final,
                grupo_id,
                estados:estado_id (id, nombre, color),
                prioridades:prioridad_id (id, nombre, orden)
            `)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        // Normalizar para el frontend
        const normalized = (data || []).map(t => ({
            id: t.id,
            grupo_id: t.grupo_id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            autor_id: t.autor_id,
            asignado_id: t.asignado_id,
            assigned_to: t.asignado_id, // Compatibilidad
            estado_id: t.estados?.nombre || 'Pendiente',
            estado_nombre: t.estados?.nombre || 'Pendiente',
            prioridad_id: t.prioridades?.nombre || 'Media',
            prioridad_nombre: t.prioridades?.nombre || 'Media',
            created_at: t.creado_en,
            due_date: t.fecha_final
        }));

        return reply.send({ statusCode: 200, intoperationCode: 1, data: normalized });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error al obtener tickets' }] });
    }
});

// GET /group/:groupId - Tickets por grupo
fastify.get('/group/:groupId', async (request, reply) => {
    const { groupId } = request.params;
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                id, titulo, descripcion, autor_id, asignado_id, creado_en, fecha_final,
                grupo_id,
                estados:estado_id (id, nombre, color),
                prioridades:prioridad_id (id, nombre, orden)
            `)
            .eq('grupo_id', groupId)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map(t => ({
            id: t.id,
            grupo_id: t.grupo_id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            autor_id: t.autor_id,
            asignado_id: t.asignado_id,
            assigned_to: t.asignado_id,
            estado_id: t.estados?.nombre || 'Pendiente',
            estado_nombre: t.estados?.nombre || 'Pendiente',
            prioridad_id: t.prioridades?.nombre || 'Media',
            prioridad_nombre: t.prioridades?.nombre || 'Media',
            created_at: t.creado_en,
            due_date: t.fecha_final
        }));

        return reply.send({ statusCode: 200, intoperationCode: 1, data: normalized });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error al obtener tickets del grupo' }] });
    }
});

// POST / - Crear ticket
fastify.post('/', async (request, reply) => {
    try {
        const { titulo, descripcion, grupo_id, estado_id, prioridad_id, autor_id, asignado_id, fecha_final } = request.body;

        // Resolver estado_id y prioridad_id por nombre si se envía texto
        let estadoUUID = estado_id;
        let prioridadUUID = prioridad_id;

        // Si no es UUID, buscar por nombre
        if (estado_id && !isUUID(estado_id)) {
            const { data: e } = await supabase.from('estados').select('id').eq('nombre', estado_id).single();
            estadoUUID = e?.id;
        }
        if (prioridad_id && !isUUID(prioridad_id)) {
            const { data: p } = await supabase.from('prioridades').select('id').eq('nombre', prioridad_id).single();
            prioridadUUID = p?.id;
        }

        const { data, error } = await supabase.from('tickets').insert([{
            titulo, descripcion, grupo_id,
            estado_id: estadoUUID,
            prioridad_id: prioridadUUID,
            autor_id,
            asignado_id: asignado_id || null,
            fecha_final: fecha_final || null
        }]).select().single();

        if (error) throw error;
        return reply.status(201).send({ statusCode: 201, intoperationCode: 1, data: [{ message: 'Ticket creado', ticket: data }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: error.message || 'Error al crear ticket' }] });
    }
});

// PUT /:id - Actualizar ticket
fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const body = { ...request.body };

        // Resolver nombre -> UUID para estado y prioridad
        if (body.estado_id && !isUUID(body.estado_id)) {
            const { data: e } = await supabase.from('estados').select('id').eq('nombre', body.estado_id).single();
            body.estado_id = e?.id;
        }
        if (body.prioridad_id && !isUUID(body.prioridad_id)) {
            const { data: p } = await supabase.from('prioridades').select('id').eq('nombre', body.prioridad_id).single();
            body.prioridad_id = p?.id;
        }

        const { data, error } = await supabase.from('tickets').update(body).eq('id', id).select().single();
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Ticket actualizado', ticket: data }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno' }] });
    }
});

// PUT /:id/status - Actualizar estado
fastify.put('/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { estado_id } = request.body;
    try {
        let estadoUUID = estado_id;
        if (estado_id && !isUUID(estado_id)) {
            const { data: e } = await supabase.from('estados').select('id').eq('nombre', estado_id).single();
            estadoUUID = e?.id;
        }

        const { data, error } = await supabase.from('tickets').update({ estado_id: estadoUUID }).eq('id', id).select().single();
        if (error) throw error;
        return reply.send({ statusCode: 200, intoperationCode: 1, data: [{ message: 'Estado actualizado', ticket: data }] });
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [{ error: 'Error interno' }] });
    }
});

// GET /catalogs - Obtener estados y prioridades
fastify.get('/catalogs', async (request, reply) => {
    try {
        const [e, p] = await Promise.all([
            supabase.from('estados').select('*').order('nombre'),
            supabase.from('prioridades').select('*').order('orden')
        ]);
        return reply.send({
            statusCode: 200, intoperationCode: 1,
            data: [{ estados: e.data || [], prioridades: p.data || [] }]
        });
    } catch (error) {
        return reply.status(500).send({ statusCode: 500, intoperationCode: -1, data: [] });
    }
});

function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log(`🎫 Tickets Service escuchando en http://localhost:3002`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
