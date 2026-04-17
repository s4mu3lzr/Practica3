/**
 * SEED SCRIPT - Crea todos los datos de prueba en Supabase
 * Ejecutar: node backend/seed-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
    console.log('🌱 Iniciando seed de datos...\n');

    // ===== 1. LIMPIAR DATOS EXISTENTES (orden correcto por FK) =====
    console.log('🧹 Limpiando datos existentes...');
    await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('grupo_miembros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('grupos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // No borramos usuarios para no perder el admin
    console.log('✅ Limpieza completada\n');

    // ===== 2. CREAR USERS =====
    console.log('👤 Creando usuarios...');
    
    const usersToCreate = [
        {
            nombre_completo: 'Administrador Supremo',
            email: 'admin_sys@demo.com',
            username: 'admin_sys',
            password: 'Admin1234!',
            permisos: JSON.stringify(['user:crud', 'group:add', 'group:edit', 'group:delete', 'ticket:create', 'ticket:edit'])
        },
        {
            nombre_completo: 'María González',
            email: 'maria.g@demo.com',
            username: 'maria_g',
            password: 'Maria1234!',
            permisos: JSON.stringify(['group:add', 'ticket:create', 'ticket:edit'])
        },
        {
            nombre_completo: 'Carlos Ramírez',
            email: 'carlos.r@demo.com',
            username: 'carlos_r',
            password: 'Carlos1234!',
            permisos: JSON.stringify(['ticket:create'])
        },
        {
            nombre_completo: 'Luis Pérez',
            email: 'luis.p@demo.com',
            username: 'luis_p',
            password: 'Luis1234!',
            permisos: JSON.stringify([])  // Sin permisos
        }
    ];

    const createdUsers = {};

    for (const u of usersToCreate) {
        // Check if user exists
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id, email')
            .eq('email', u.email)
            .single();

        if (existing) {
            console.log(`  ℹ️  Usuario ${u.email} ya existe, actualizando permisos...`);
            await supabase
                .from('usuarios')
                .update({ permisos: u.permisos, nombre_completo: u.nombre_completo, username: u.username })
                .eq('email', u.email);
            createdUsers[u.email] = existing.id;
        } else {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            const { data, error } = await supabase
                .from('usuarios')
                .insert([{ nombre_completo: u.nombre_completo, email: u.email, username: u.username, password: hashedPassword, permisos: u.permisos }])
                .select('id')
                .single();

            if (error) {
                console.error(`  ❌ Error creando ${u.email}:`, error.message);
            } else {
                console.log(`  ✅ Creado: ${u.email} (ID: ${data.id})`);
                createdUsers[u.email] = data.id;
            }
        }
    }

    // getIDs
    for (const u of usersToCreate) {
        if (!createdUsers[u.email]) {
            const { data } = await supabase.from('usuarios').select('id').eq('email', u.email).single();
            if (data) createdUsers[u.email] = data.id;
        }
    }

    console.log('\n📋 IDs de usuarios:', createdUsers);

    // ===== 3. CREAR GRUPOS =====
    console.log('\n👥 Creando grupos...');

    const adminId = createdUsers['admin_sys@demo.com'];

    const { data: grupo1, error: g1err } = await supabase
        .from('grupos')
        .insert([{
            nombre: 'Operaciones',
            descripcion: 'Gestión operativa del sistema ERP',
            nivel: 'Intermedio',
            creador_id: adminId
        }])
        .select()
        .single();

    if (g1err) console.error('Error grupo1:', g1err.message);
    else console.log(`  ✅ Grupo creado: Operaciones (ID: ${grupo1.id})`);

    const { data: grupo2, error: g2err } = await supabase
        .from('grupos')
        .insert([{
            nombre: 'Redes y Servidores',
            descripcion: 'Gestión técnica de infraestructura',
            nivel: 'Avanzado',
            creador_id: adminId
        }])
        .select()
        .single();

    if (g2err) console.error('Error grupo2:', g2err.message);
    else console.log(`  ✅ Grupo creado: Redes y Servidores (ID: ${grupo2.id})`);

    // ===== 4. AGREGAR MIEMBROS A GRUPOS =====
    console.log('\n🔗 Asignando miembros a grupos...');

    const mariaId = createdUsers['maria.g@demo.com'];
    const carlosId = createdUsers['carlos.r@demo.com'];
    const luisId = createdUsers['luis.p@demo.com'];

    // Verificar si la tabla grupo_miembros existe
    const { error: tableCheck } = await supabase.from('grupo_miembros').select('id').limit(1);
    
    if (tableCheck && tableCheck.code === '42P01') {
        console.log('  ⚠️  Tabla grupo_miembros no existe, actualizando grupos con array de miembros...');
        // Actualizar grupos con memberIds si se usa columna en grupos
        await supabase.from('grupos').update({ 
            member_ids: [mariaId, carlosId] 
        }).eq('id', grupo1.id);
        await supabase.from('grupos').update({ 
            member_ids: [carlosId, luisId] 
        }).eq('id', grupo2.id);
    } else {
        // Grupo 1: María y Carlos
        for (const userId of [mariaId, carlosId]) {
            if (!userId) continue;
            const { error } = await supabase.from('grupo_miembros').insert([{ grupo_id: grupo1.id, usuario_id: userId }]);
            if (error && error.code !== '23505') console.error('Error miembro grupo1:', error.message);
        }
        // Grupo 2: Carlos y Luis
        for (const userId of [carlosId, luisId]) {
            if (!userId) continue;
            const { error } = await supabase.from('grupo_miembros').insert([{ grupo_id: grupo2.id, usuario_id: userId }]);
            if (error && error.code !== '23505') console.error('Error miembro grupo2:', error.message);
        }
        console.log('  ✅ Miembros asignados correctamente');
    }

    // ===== 5. CREAR TICKETS =====
    console.log('\n🎫 Creando tickets...');

    const ticketsData = [
        // Tickets del Grupo 1 (Operaciones) - un ticket por usuario
        {
            titulo: 'Revisión de reportes mensuales',
            descripcion: 'Verificar y validar los reportes financieros del mes de marzo',
            grupo_id: grupo1.id,
            estado_id: 'Pendiente',
            prioridad_id: 'Alta',
            autor_id: mariaId,
            assigned_to: 'maria.g@demo.com',
            due_date: new Date(Date.now() + 3 * 86400000).toISOString()
        },
        {
            titulo: 'Actualización de inventario',
            descripcion: 'Actualizar el sistema de inventario con las nuevas entradas del almacén',
            grupo_id: grupo1.id,
            estado_id: 'En Progreso',
            prioridad_id: 'Media',
            autor_id: carlosId,
            assigned_to: 'carlos.r@demo.com',
            due_date: new Date(Date.now() + 5 * 86400000).toISOString()
        },
        {
            titulo: 'Capacitación del nuevo personal',
            descripcion: 'Preparar material y capacitar a los nuevos integrantes del equipo',
            grupo_id: grupo1.id,
            estado_id: 'Pendiente',
            prioridad_id: 'Baja',
            autor_id: luisId || carlosId,
            assigned_to: 'luis.p@demo.com',
            due_date: new Date(Date.now() + 7 * 86400000).toISOString()
        },
        // Tickets del Grupo 2 (Redes y Servidores) - un ticket por usuario
        {
            titulo: 'Configuración del servidor de producción',
            descripcion: 'Instalar y configurar el nuevo servidor web con NGINX y SSL',
            grupo_id: grupo2.id,
            estado_id: 'En Progreso',
            prioridad_id: 'Alta',
            autor_id: carlosId,
            assigned_to: 'carlos.r@demo.com',
            due_date: new Date(Date.now() + 2 * 86400000).toISOString()
        },
        {
            titulo: 'Monitoreo de alertas de red',
            descripcion: 'Revisar y configurar alertas en Grafana para monitoreo de red',
            grupo_id: grupo2.id,
            estado_id: 'Revisión',
            prioridad_id: 'Media',
            autor_id: luisId || carlosId,
            assigned_to: 'luis.p@demo.com',
            due_date: new Date(Date.now() + 4 * 86400000).toISOString()
        },
        {
            titulo: 'Backup automático de base de datos',
            descripcion: 'Implementar script de backup automático diario con retención de 30 días',
            grupo_id: grupo2.id,
            estado_id: 'Pendiente',
            prioridad_id: 'Alta',
            autor_id: mariaId,
            assigned_to: 'maria.g@demo.com',
            due_date: new Date(Date.now() + 6 * 86400000).toISOString()
        }
    ];

    for (const ticket of ticketsData) {
        if (!ticket.autor_id) {
            console.log(`  ⚠️  Saltando ticket sin autor_id: ${ticket.titulo}`);
            continue;
        }
        const { data, error } = await supabase.from('tickets').insert([ticket]).select('id').single();
        if (error) {
            console.error(`  ❌ Error ticket "${ticket.titulo}":`, error.message);
        } else {
            console.log(`  ✅ Ticket creado: "${ticket.titulo}" (ID: ${data.id})`);
        }
    }

    // ===== RESUMEN =====
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETADO - RESUMEN DE USUARIOS:');
    console.log('='.repeat(60));
    console.log('');
    console.log('👑 ADMIN:');
    console.log('   Email:      admin_sys@demo.com');
    console.log('   Contraseña: Admin1234!');
    console.log('   Permisos:   TODOS (acceso completo)');
    console.log('');
    console.log('👤 USUARIO 1 - María González:');
    console.log('   Email:      maria.g@demo.com');
    console.log('   Contraseña: Maria1234!');
    console.log('   Permisos:   group:add, ticket:create, ticket:edit');
    console.log('   Grupos:     Operaciones, Redes y Servidores');
    console.log('');
    console.log('👤 USUARIO 2 - Carlos Ramírez:');
    console.log('   Email:      carlos.r@demo.com');
    console.log('   Contraseña: Carlos1234!');
    console.log('   Permisos:   ticket:create');
    console.log('   Grupos:     Operaciones, Redes y Servidores');
    console.log('');
    console.log('👤 USUARIO 3 - Luis Pérez (SIN PERMISOS):');
    console.log('   Email:      luis.p@demo.com');
    console.log('   Contraseña: Luis1234!');
    console.log('   Permisos:   NINGUNO');
    console.log('   Grupos:     Operaciones, Redes y Servidores');
    console.log('');
    console.log('📦 GRUPOS:');
    console.log('   1. Operaciones (3 tickets)');
    console.log('   2. Redes y Servidores (3 tickets)');
    console.log('='.repeat(60));
}

seed().catch(console.error);
