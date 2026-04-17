const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    // Get a real group id
    const { data: grupos } = await supabase.from('grupos').select('id').limit(1);
    const grupoId = grupos[0].id;
    const adminId = 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9';
    
    // Get real estado and prioridad IDs
    const { data: estados } = await supabase.from('estados').select('id, nombre');
    const { data: prioridades } = await supabase.from('prioridades').select('id, nombre');
    
    const estadoId = estados[0].id;
    const prioridadId = prioridades[0].id;
    
    console.log('Test con:', { grupoId, adminId, estadoId, prioridadId });
    
    // Try minimal ticket
    const { data: t1, error: e1 } = await supabase.from('tickets')
        .insert([{ titulo: 'TEST', descripcion: 'test', grupo_id: grupoId, estado_id: estadoId, prioridad_id: prioridadId, autor_id: adminId }])
        .select();
    
    if (e1) { console.log('Error minimal:', e1.message); }
    else {
        console.log('✅ Cols:', Object.keys(t1[0]));
        console.log('Data:', JSON.stringify(t1[0], null, 2));
        await supabase.from('tickets').delete().eq('titulo', 'TEST');
    }
}
check().catch(console.error);
