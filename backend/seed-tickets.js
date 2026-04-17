/**
 * SEED CORRECTO - Schema real verificado:
 * tickets: id, grupo_id, titulo, descripcion, autor_id, asignado_id(UUID), estado_id(UUID), prioridad_id(UUID), creado_en, fecha_final
 * usuarios: id, nombre_completo, email, username, password, telefono, direccion, fecha_inicio, last_login
 * grupos: id, nombre, descripcion, creador_id, creado_en
 * estados: id, nombre, color
 * prioridades: id, nombre, orden
 * grupo_miembros: grupo_id, usuario_id, fecha_unido
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
    console.log('🌱 SEED CORRECTO - Iniciando...\n');

    // Get IDs
    const { data: estados } = await supabase.from('estados').select('id, nombre');
    const { data: prioridades } = await supabase.from('prioridades').select('id, nombre');
    
    if (!estados || estados.length === 0) {
        console.error('❌ No hay estados. Ejecuta seed-final.js primero.');
        return;
    }
    
    const eMap = {};
    estados.forEach(e => eMap[e.nombre] = e.id);
    const pMap = {};
    prioridades.forEach(p => pMap[p.nombre] = p.id);
    
    console.log('Estados:', eMap);
    console.log('Prioridades:', pMap);

    // Get users
    const { data: users } = await supabase.from('usuarios').select('id, email');
    const uMap = {};
    users.forEach(u => uMap[u.email] = u.id);
    console.log('Usuarios:', Object.keys(uMap));

    // Get groups
    const { data: grupos } = await supabase.from('grupos').select('id, nombre');
    const gMap = {};
    grupos.forEach(g => gMap[g.nombre] = g.id);
    console.log('Grupos:', Object.keys(gMap));

    const adminId = uMap['admin_sys@demo.com'];
    const mariaId = uMap['maria.g@demo.com'];
    const carlosId = uMap['carlos.r@demo.com'];
    const luisId = uMap['luis.p@demo.com'];
    const grupo1Id = gMap['Operaciones'];
    const grupo2Id = gMap['Redes y Servidores'];

    if (!adminId || !mariaId || !carlosId || !luisId || !grupo1Id || !grupo2Id) {
        console.error('❌ Faltan datos básicos. Ejecuta seed-final.js primero.');
        console.error({ adminId, mariaId, carlosId, luisId, grupo1Id, grupo2Id });
        return;
    }

    // Limpiar tickets existentes
    await supabase.from('tickets').delete().not('id', 'is', null);
    console.log('\n🎫 Creando tickets...');

    const tickets = [
        // Grupo 1: Operaciones
        {
            titulo: 'Revisión de reportes mensuales',
            descripcion: 'Verificar y validar los reportes financieros del mes de marzo. Incluye balance general y estado de resultados.',
            grupo_id: grupo1Id,
            estado_id: eMap['Pendiente'],
            prioridad_id: pMap['Alta'],
            autor_id: mariaId,
            asignado_id: mariaId,
            fecha_final: new Date(Date.now() + 3 * 86400000).toISOString()
        },
        {
            titulo: 'Actualización de inventario del almacén',
            descripcion: 'Actualizar el sistema con las nuevas entradas del almacén. Revisar discrepancias en entradas de abril.',
            grupo_id: grupo1Id,
            estado_id: eMap['En Progreso'],
            prioridad_id: pMap['Media'],
            autor_id: carlosId,
            asignado_id: carlosId,
            fecha_final: new Date(Date.now() + 5 * 86400000).toISOString()
        },
        {
            titulo: 'Capacitación nuevo personal',
            descripcion: 'Preparar material de capacitación y coordinar sesiones de entrenamiento para nuevos integrantes del equipo operativo.',
            grupo_id: grupo1Id,
            estado_id: eMap['Pendiente'],
            prioridad_id: pMap['Baja'],
            autor_id: luisId,
            asignado_id: luisId,
            fecha_final: new Date(Date.now() + 7 * 86400000).toISOString()
        },
        // Grupo 2: Redes y Servidores
        {
            titulo: 'Configuración servidor de producción',
            descripcion: 'Instalar y configurar el nuevo servidor web con NGINX, PHP-FPM y certificado SSL para producción.',
            grupo_id: grupo2Id,
            estado_id: eMap['En Progreso'],
            prioridad_id: pMap['Alta'],
            autor_id: carlosId,
            asignado_id: carlosId,
            fecha_final: new Date(Date.now() + 2 * 86400000).toISOString()
        },
        {
            titulo: 'Monitoreo y alertas de red',
            descripcion: 'Configurar alertas en el sistema de monitoreo para detección temprana de fallos de conectividad y latencia.',
            grupo_id: grupo2Id,
            estado_id: eMap['Revisión'],
            prioridad_id: pMap['Media'],
            autor_id: luisId,
            asignado_id: luisId,
            fecha_final: new Date(Date.now() + 4 * 86400000).toISOString()
        },
        {
            titulo: 'Implementar backup automático BD',
            descripcion: 'Crear script de backup automático con retención de 30 días y notificaciones por correo al completarse.',
            grupo_id: grupo2Id,
            estado_id: eMap['Pendiente'],
            prioridad_id: pMap['Alta'],
            autor_id: mariaId,
            asignado_id: mariaId,
            fecha_final: new Date(Date.now() + 6 * 86400000).toISOString()
        }
    ];

    let created = 0;
    for (const t of tickets) {
        const { error } = await supabase.from('tickets').insert([t]);
        if (error) {
            console.error(`  ❌ "${t.titulo}": ${error.message}`);
        } else {
            console.log(`  ✅ "${t.titulo}"`);
            created++;
        }
    }

    console.log(`\n✅ ${created}/6 tickets creados exitosamente.`);
    console.log('\n🎉 ¡El seed está completo!');
}

seed().catch(console.error);
