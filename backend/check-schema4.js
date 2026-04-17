/**
 * Schema check v4 - Descubrir estructura de tickets
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    const adminId = 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9';
    
    // Create a group first
    const { data: grupo } = await supabase.from('grupos')
        .insert([{ nombre: 'TEST_GROUP_SCHEMA', descripcion: 'test', creador_id: adminId }])
        .select().single();
    
    console.log('Grupo creado:', grupo.id);

    // Test tickets with text estado/prioridad
    console.log('\n--- TICKETS (intento 1: strings) ---');
    const { data: t1, error: te1 } = await supabase.from('tickets')
        .insert([{ titulo: 'TEST_COL', descripcion: 'test', grupo_id: grupo.id, estado_id: 'Pendiente', prioridad_id: 'Alta', autor_id: adminId }])
        .select();
    console.log('Error:', te1?.message || 'NINGUNO');
    if (t1) {
        console.log('Cols:', Object.keys(t1[0]));
        console.log('Data:', JSON.stringify(t1[0], null, 2));
    }

    // Test tickets with integers
    console.log('\n--- TICKETS (intento 2: integers) ---');
    const { data: t2, error: te2 } = await supabase.from('tickets')
        .insert([{ titulo: 'TEST_COL2', descripcion: 'test', grupo_id: grupo.id, estado_id: 1, prioridad_id: 1, autor_id: adminId }])
        .select();
    console.log('Error:', te2?.message || 'NINGUNO');
    if (t2) {
        console.log('Cols:', Object.keys(t2[0]));
        console.log('Data:', JSON.stringify(t2[0], null, 2));
    }

    // Test tickets without estado/prioridad
    console.log('\n--- TICKETS (intento 3: sin estado/prioridad) ---');
    const { data: t3, error: te3 } = await supabase.from('tickets')
        .insert([{ titulo: 'TEST_COL3', descripcion: 'test', grupo_id: grupo.id, autor_id: adminId }])
        .select();
    console.log('Error:', te3?.message || 'NINGUNO');
    if (t3) {
        console.log('Cols:', Object.keys(t3[0]));
        console.log('Data:', JSON.stringify(t3[0], null, 2));
    }

    // Check grupo_miembros with real group id
    console.log('\n--- GRUPO_MIEMBROS (con grupo real) ---');
    const { data: gm, error: gme } = await supabase.from('grupo_miembros')
        .insert([{ grupo_id: grupo.id, usuario_id: adminId }])
        .select();
    console.log('Error:', gme?.message || 'NINGUNO');
    if (gm) {
        console.log('Cols:', Object.keys(gm[0]));
        console.log('Data:', JSON.stringify(gm[0], null, 2));
    }

    // Check all tables that exist
    console.log('\n--- OTRAS TABLAS ---');
    const potentialTables = ['ticket_estados', 'ticket_prioridades', 'catalogos', 'estado_tickets', 'prioridad_tickets', 'estados', 'prioridades'];
    for (const table of potentialTables) {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (!error) {
            console.log(`✅ Tabla "${table}":`, data ? JSON.stringify(data) : 'vacía');
        } else if (error.code !== '42P01') {
            console.log(`⚠️  Tabla "${table}": ${error.message}`);
        }
    }
    
    // Cleanup
    await supabase.from('tickets').delete().like('titulo', 'TEST_COL%');
    await supabase.from('grupo_miembros').delete().eq('grupo_id', grupo.id);
    await supabase.from('grupos').delete().eq('id', grupo.id);
    console.log('\n✅ Limpieza hecha');
}

checkSchema().catch(console.error);
