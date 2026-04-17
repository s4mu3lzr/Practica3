/**
 * SEED FINAL - Basado en schema real de Supabase
 * 
 * Schema descubierto:
 * - usuarios: id, nombre_completo, email, username, telefono, direccion, fecha_inicio, last_login, password
 * - grupos: id, nombre, descripcion, creador_id, creado_en
 * - estados: id, nombre, color
 * - prioridades: id, nombre, orden
 * - tickets: grupo_id, estado_id(UUID), prioridad_id(UUID), autor_id, titulo, descripcion, ...
 * - grupo_miembros: grupo_id, usuario_id, fecha_unido
 * 
 * NOTA: permisos se maneja en el JWT (users-service lo genera)
 * Para que el admin pueda gestionar permisos, los guardaremos en una tabla separada
 * o los manejaremos en el JSON del token.
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
    console.log('🌱 SEED FINAL - Iniciando...\n');

    // ===== 1. LIMPIAR =====
    console.log('🧹 Limpiando datos...');
    await supabase.from('tickets').delete().not('id', 'is', null);
    await supabase.from('grupo_miembros').delete().not('grupo_id', 'is', null);
    await supabase.from('grupos').delete().not('id', 'is', null);
    await supabase.from('estados').delete().not('id', 'is', null);
    await supabase.from('prioridades').delete().not('id', 'is', null);
    console.log('✅ Limpieza hecha\n');

    // ===== 2. CREAR ESTADOS =====
    console.log('📊 Creando estados de tickets...');
    const { data: estados, error: eErr } = await supabase.from('estados').insert([
        { nombre: 'Pendiente', color: '#f59e0b' },
        { nombre: 'En Progreso', color: '#3b82f6' },
        { nombre: 'Revisión', color: '#8b5cf6' },
        { nombre: 'Finalizado', color: '#10b981' }
    ]).select();
    if (eErr) { console.error('Error estados:', eErr.message); return; }
    
    const estadoMap = {};
    estados.forEach(e => { estadoMap[e.nombre] = e.id; });
    console.log('✅ Estados creados:', Object.keys(estadoMap));

    // ===== 3. CREAR PRIORIDADES =====
    console.log('\n⚡ Creando prioridades...');
    const { data: prioridades, error: pErr } = await supabase.from('prioridades').insert([
        { nombre: 'Baja', orden: 1 },
        { nombre: 'Media', orden: 2 },
        { nombre: 'Alta', orden: 3 }
    ]).select();
    if (pErr) { console.error('Error prioridades:', pErr.message); return; }
    
    const prioridadMap = {};
    prioridades.forEach(p => { prioridadMap[p.nombre] = p.id; });
    console.log('✅ Prioridades creadas:', Object.keys(prioridadMap));

    // ===== 4. OBTENER/CREAR USUARIOS =====
    console.log('\n👤 Configurando usuarios...');
    
    // Obtener usuarios existentes
    const { data: existingUsers } = await supabase.from('usuarios').select('id, email, nombre_completo');
    const userMap = {};
    if (existingUsers) {
        existingUsers.forEach(u => { userMap[u.email] = u.id; });
    }
    console.log('Usuarios existentes:', Object.keys(userMap));

    // Crear usuarios que falten (necesitamos 3 + admin)
    const usersNeeded = [
        { nombre_completo: 'Administrador Supremo', email: 'admin_sys@demo.com', username: 'admin_sys', password: 'Admin1234!' },
        { nombre_completo: 'María González', email: 'maria.g@demo.com', username: 'maria_g', password: 'Maria1234!' },
        { nombre_completo: 'Carlos Ramírez', email: 'carlos.r@demo.com', username: 'carlos_r', password: 'Carlos1234!' },
        { nombre_completo: 'Luis Pérez', email: 'luis.p@demo.com', username: 'luis_p', password: 'Luis1234!' }
    ];

    for (const u of usersNeeded) {
        if (userMap[u.email]) {
            console.log(`  ℹ️  ${u.email} ya existe`);
        } else {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            const { data, error } = await supabase.from('usuarios')
                .insert([{ nombre_completo: u.nombre_completo, email: u.email, username: u.username, password: hashedPassword }])
                .select('id').single();
            if (error) {
                console.error(`  ❌ Error: ${u.email}:`, error.message);
            } else {
                userMap[u.email] = data.id;
                console.log(`  ✅ Creado: ${u.email}`);
            }
        }
    }

    // Re-check all users
    for (const u of usersNeeded) {
        if (!userMap[u.email]) {
            const { data } = await supabase.from('usuarios').select('id').eq('email', u.email).single();
            if (data) userMap[u.email] = data.id;
        }
    }

    console.log('\n📋 User IDs:', userMap);

    const adminId = userMap['admin_sys@demo.com'];
    const mariaId = userMap['maria.g@demo.com'];
    const carlosId = userMap['carlos.r@demo.com'];
    const luisId = userMap['luis.p@demo.com'];

    if (!adminId) {
        console.error('❌ No se pudo encontrar el admin, abortando...');
        return;
    }

    // ===== 5. CREAR GRUPOS =====
    console.log('\n👥 Creando grupos...');
    const { data: grupo1, error: g1e } = await supabase.from('grupos')
        .insert([{ nombre: 'Operaciones', descripcion: 'Gestión operativa del sistema ERP', creador_id: adminId }])
        .select().single();
    if (g1e) { console.error('Error grupo1:', g1e.message); return; }
    console.log(`  ✅ Grupo "Operaciones" (ID: ${grupo1.id})`);

    const { data: grupo2, error: g2e } = await supabase.from('grupos')
        .insert([{ nombre: 'Redes y Servidores', descripcion: 'Gestión técnica de infraestructura y servidores', creador_id: adminId }])
        .select().single();
    if (g2e) { console.error('Error grupo2:', g2e.message); return; }
    console.log(`  ✅ Grupo "Redes y Servidores" (ID: ${grupo2.id})`);

    // ===== 6. ASIGNAR MIEMBROS =====
    console.log('\n🔗 Asignando miembros a grupos...');
    
    const memberships = [
        { grupo_id: grupo1.id, usuario_id: mariaId },
        { grupo_id: grupo1.id, usuario_id: carlosId },
        { grupo_id: grupo1.id, usuario_id: luisId },
        { grupo_id: grupo2.id, usuario_id: mariaId },
        { grupo_id: grupo2.id, usuario_id: carlosId },
        { grupo_id: grupo2.id, usuario_id: luisId }
    ].filter(m => m.usuario_id); // Filter out any undefined IDs

    for (const m of memberships) {
        const { error } = await supabase.from('grupo_miembros').insert([m]);
        if (error && error.code !== '23505') {
            console.error('  ❌ Membresía error:', error.message);
        }
    }
    console.log(`  ✅ ${memberships.length} membresías asignadas`);

    // ===== 7. CREAR TICKETS =====
    console.log('\n🎫 Creando tickets...');

    // Tickets para Grupo 1 (Operaciones) - uno por cada usuario no-admin
    const ticketsG1 = [
        {
            titulo: 'Revisión de reportes mensuales',
            descripcion: 'Verificar y validar los reportes financieros del mes de marzo. Incluye balance general y estado de resultados.',
            grupo_id: grupo1.id,
            estado_id: estadoMap['Pendiente'],
            prioridad_id: prioridadMap['Alta'],
            autor_id: mariaId || adminId,
            assigned_to: 'maria.g@demo.com',
            due_date: new Date(Date.now() + 3 * 86400000).toISOString()
        },
        {
            titulo: 'Actualización de inventario del almacén',
            descripcion: 'Actualizar el sistema con las nuevas entradas del almacén. Revisar discrepancias en las entradas de abril.',
            grupo_id: grupo1.id,
            estado_id: estadoMap['En Progreso'],
            prioridad_id: prioridadMap['Media'],
            autor_id: carlosId || adminId,
            assigned_to: 'carlos.r@demo.com',
            due_date: new Date(Date.now() + 5 * 86400000).toISOString()
        },
        {
            titulo: 'Capacitación nuevo personal',
            descripcion: 'Preparar material de capacitación y coordinar sesiones de entrenamiento para los nuevos integrantes del equipo operativo.',
            grupo_id: grupo1.id,
            estado_id: estadoMap['Pendiente'],
            prioridad_id: prioridadMap['Baja'],
            autor_id: luisId || adminId,
            assigned_to: 'luis.p@demo.com',
            due_date: new Date(Date.now() + 7 * 86400000).toISOString()
        }
    ];

    // Tickets para Grupo 2 (Redes y Servidores) - uno por cada usuario no-admin
    const ticketsG2 = [
        {
            titulo: 'Configuración servidor de producción',
            descripcion: 'Instalar y configurar el nuevo servidor web con NGINX, PHP-FPM y certificado SSL. Optimizar para carga alta.',
            grupo_id: grupo2.id,
            estado_id: estadoMap['En Progreso'],
            prioridad_id: prioridadMap['Alta'],
            autor_id: carlosId || adminId,
            assigned_to: 'carlos.r@demo.com',
            due_date: new Date(Date.now() + 2 * 86400000).toISOString()
        },
        {
            titulo: 'Monitoreo y alertas de red',
            descripcion: 'Revisar y configurar alertas en el sistema de monitoreo para detección temprana de fallos de conectividad.',
            grupo_id: grupo2.id,
            estado_id: estadoMap['Revisión'],
            prioridad_id: prioridadMap['Media'],
            autor_id: luisId || adminId,
            assigned_to: 'luis.p@demo.com',
            due_date: new Date(Date.now() + 4 * 86400000).toISOString()
        },
        {
            titulo: 'Implementar backup automático BD',
            descripcion: 'Crear script de backup automático con retención de 30 días y notificaciones por correo al completarse.',
            grupo_id: grupo2.id,
            estado_id: estadoMap['Pendiente'],
            prioridad_id: prioridadMap['Alta'],
            autor_id: mariaId || adminId,
            assigned_to: 'maria.g@demo.com',
            due_date: new Date(Date.now() + 6 * 86400000).toISOString()
        }
    ];

    const allTickets = [...ticketsG1, ...ticketsG2];
    for (const ticket of allTickets) {
        const { data, error } = await supabase.from('tickets').insert([ticket]).select('id').single();
        if (error) {
            console.error(`  ❌ Error ticket "${ticket.titulo}":`, error.message);
        } else {
            console.log(`  ✅ Ticket creado: "${ticket.titulo}"`);
        }
    }

    // ===== RESUMEN FINAL =====
    console.log('\n' + '='.repeat(65));
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(65));
    console.log('\n🔑 CREDENCIALES DE ACCESO:\n');
    console.log('  👑 ADMINISTRADOR (acceso total):');
    console.log('     Email:      admin_sys@demo.com');
    console.log('     Contraseña: Admin1234!');
    console.log('     Rol:        Administrador Supremo');
    console.log('');
    console.log('  👤 USUARIO 1 - María González:');
    console.log('     Email:      maria.g@demo.com');
    console.log('     Contraseña: Maria1234!');
    console.log('     Permisos:   group:add, ticket:create, ticket:edit');
    console.log('');
    console.log('  👤 USUARIO 2 - Carlos Ramírez:');
    console.log('     Email:      carlos.r@demo.com');
    console.log('     Contraseña: Carlos1234!');
    console.log('     Permisos:   ticket:create');
    console.log('');
    console.log('  👤 USUARIO 3 - Luis Pérez (SIN PERMISOS):');
    console.log('     Email:      luis.p@demo.com');
    console.log('     Contraseña: Luis1234!');
    console.log('     Permisos:   NINGUNO (usuario nuevo)');
    console.log('');
    console.log('  📦 GRUPOS: Operaciones | Redes y Servidores');
    console.log('  🎫 TICKETS: 3 por grupo (6 total)');
    console.log('='.repeat(65));
    console.log('\n⚠️  NOTA IMPORTANTE:');
    console.log('   Los permisos NO están en la BD (no existe columna "permisos").');
    console.log('   Se gestionan en el JWT al hacer login.');
    console.log('   Para que funcione el admin panel de permisos, se necesita');
    console.log('   agregar la columna "permisos" a la tabla "usuarios" en Supabase.');
    console.log('   O se puede usar una tabla separada de permisos.\n');
}

seed().catch(console.error);
