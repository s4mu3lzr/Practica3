/**
 * Schema check v3 - Simple y directo
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    const adminId = 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9';
    
    // Test grupos
    console.log('--- GRUPOS ---');
    const { data: g, error: ge } = await supabase.from('grupos')
        .insert([{ nombre: 'TEST_COL', descripcion: 'test', creador_id: adminId }])
        .select();
    if (ge) console.log('Error:', ge.message);
    else {
        console.log('Cols:', Object.keys(g[0]));
        console.log('Data:', JSON.stringify(g[0], null, 2));
        await supabase.from('grupos').delete().eq('nombre', 'TEST_COL');
    }

    // Test tickets
    console.log('\n--- TICKETS ---');
    // First get a group ID
    const { data: groups } = await supabase.from('grupos').select('id').limit(1);
    const groupId = groups && groups[0] ? groups[0].id : adminId;
    
    const { data: t, error: te } = await supabase.from('tickets')
        .insert([{ titulo: 'TEST_COL', descripcion: 'test', grupo_id: groupId, estado_id: 'Pendiente', prioridad_id: 'Alta', autor_id: adminId }])
        .select();
    if (te) console.log('Error:', te.message);
    else {
        console.log('Cols:', Object.keys(t[0]));
        console.log('Data:', JSON.stringify(t[0], null, 2));
        await supabase.from('tickets').delete().eq('titulo', 'TEST_COL');
    }

    // Test grupo_miembros
    console.log('\n--- GRUPO_MIEMBROS ---');
    const { data: gm, error: gme } = await supabase.from('grupo_miembros')
        .insert([{ grupo_id: groupId, usuario_id: adminId }])
        .select();
    if (gme) console.log('Error:', gme.message);
    else {
        console.log('Cols:', Object.keys(gm[0]));
        console.log('Data:', JSON.stringify(gm[0], null, 2));
        await supabase.from('grupo_miembros').delete().eq('grupo_id', groupId);
    }
}

checkSchema().catch(console.error);
