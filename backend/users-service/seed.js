const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Iniciando seed de datos...");
    
    // 1. Crear 3 Usuarios
    console.log("Creando usuarios...");
    const passHashes = await Promise.all([
        bcrypt.hash('Admin123!', 10),
        bcrypt.hash('Soporte123!', 10),
        bcrypt.hash('Normal123!', 10)
    ]);

    const usersToInsert = [
        { nombre_completo: 'Administrador Supremo', username: 'admin_sys', email: 'admin_sys@demo.com', password: passHashes[0], permisos: '["group:add", "group:edit", "group:delete", "user:crud", "ticket:create", "ticket:edit"]' },
        { nombre_completo: 'Técnico de Soporte', username: 'soporte_t', email: 'soporte_t@demo.com', password: passHashes[1], permisos: '["ticket:create", "ticket:edit"]' },
        { nombre_completo: 'Usuario Regular', username: 'usuario_r', email: 'usuario_r@demo.com', password: passHashes[2], permisos: '["ticket:create"]' }
    ];

    let users = [];
    for (let u of usersToInsert) {
        let { data, error } = await supabase.from('usuarios').insert([u]).select().single();
        if (error) {
            console.log("    -> Fallo al insertar con permisos, reintentando sin columna permisos. Error:", error.message);
            const { permisos, ...uSimple } = u;
            const res2 = await supabase.from('usuarios').insert([uSimple]).select().single();
            if (res2.error) {
                console.error("    -> Error CRÍTICO insertando usuario:", res2.error);
                continue;
            }
            data = res2.data;
        }
        users.push(data);
    }
    console.log(`✅ ${users.length} usuarios creados.`);
    if (users.length < 3) return console.log("Faltan usuarios, abortando.");

    // 2. Crear 2 Grupos
    console.log("Creando grupos...");
    const adminId = users[0].id;
    const groupsToInsert = [
        { nombre: 'Operaciones', descripcion: 'Gestión operativa (Todos)', creador_id: adminId },
        { nombre: 'Redes y Servidores', descripcion: 'Gestión técnica (Todos)', creador_id: adminId }
    ];

    let groups = [];
    for (let g of groupsToInsert) {
        let { data, error } = await supabase.from('grupos').insert([g]).select().single();
        if (error) {
            console.error("    -> Error insertando grupo:", error);
            continue;
        }
        groups.push(data);
    }
    console.log(`✅ ${groups.length} grupos creados.`);

    // Members (si la tabla de grupo_miembros o la columna members_ids existe)
    console.log("Intentando actualizar miembros de grupo...");
    const allUserIds = users.map(u => u.id);
    for (let g of groups) {
        // Intentar actualizar columna como jsonb array
        await supabase.from('grupos').update({ memberIds: allUserIds }).eq('id', g.id);
    }

    // 3. Crear Tickets: 1 por cada usuario en cada grupo (6 tickets)
    console.log("Creando tickets asignados a cada usuario por grupo...");
    let ticketsToInsert = [];
    const statuses = ['Pendiente', 'En Progreso', 'Revisión'];

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        for (let j = 0; j < users.length; j++) {
            const user = users[j];
            ticketsToInsert.push({
                titulo: `Mantenimiento G${i + 1} - U${j + 1}`,
                descripcion: `Ticket de comprobación para ${user.nombre_completo} en ${group.nombre}`,
                grupo_id: group.id,
                estado_id: statuses[j % statuses.length],
                prioridad_id: 'Alta',
                autor_id: adminId,
                assignedTo: user.email // En el frontend es correo electrónico
            });
        }
    }

    let tCount = 0;
    for (let t of ticketsToInsert) {
        let { error } = await supabase.from('tickets').insert([t]);
        if (error) {
            // Reintentar sin assignedTo si falla
            console.log("    -> Fallo al insertar con assignedTo, probando con assigned_to. Error:", error.message);
            const { assignedTo, ...t2base } = t;
            let { error: err2 } = await supabase.from('tickets').insert([{ ...t2base, assigned_to: assignedTo }]);
            if (err2) {
                console.log("    -> Fallo al insertar con assigned_to, quitando campo. Error:", err2.message);
                await supabase.from('tickets').insert([t2base]);
            }
        }
        tCount++;
    }
    console.log(`✅ ${tCount} tickets inyectados.`);
    console.log("🎉 Seed completado.");
}

seed();
