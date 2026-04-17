/**
 * Script para verificar schema completo via Supabase REST API
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('🔍 Verificando schema completo...\n');

    // Obtener info via RPC de información_schema
    const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', {}).catch(() => ({ data: null, error: 'no rpc' }));
    
    // Alternativa: usar information_schema via query directa
    const query = `
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('usuarios', 'grupos', 'tickets', 'grupo_miembros', 'ticket_estados', 'ticket_prioridades')
        ORDER BY table_name, ordinal_position
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: query }).catch(() => ({ data: null, error: 'no exec_sql' }));
    
    if (error) {
        console.log('RPC no disponible, intentando consulta directa...');
        
        // Intentar insertar en grupos para ver columnas reales
        const { error: groupInsErr } = await supabase.from('grupos').insert([{ nombre: 'TEST_SCHEMA', descripcion: 'test', creador_id: 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9' }]);
        if (groupInsErr) {
            console.log('Error grupos insert:', groupInsErr);
        } else {
            // Leer el registro recién creado
            const { data: g } = await supabase.from('grupos').select('*').eq('nombre', 'TEST_SCHEMA').single();
            console.log('✅ Columnas de GRUPOS:', g ? Object.keys(g) : 'N/A');
            console.log('   Ejemplo:', JSON.stringify(g, null, 2));
            // Borrar test
            await supabase.from('grupos').delete().eq('nombre', 'TEST_SCHEMA');
        }
        
        // Intentar insertar ticket de prueba
        const { error: tickInsErr } = await supabase.from('tickets').insert([{ titulo: 'TEST_SCHEMA', descripcion: 'test', grupo_id: 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9', estado_id: 'Pendiente', prioridad_id: 'Alta', autor_id: 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9' }]);
        if (tickInsErr) {
            console.log('\nError tickets insert (muestra columnas):', tickInsErr.message);
        } else {
            const { data: t } = await supabase.from('tickets').select('*').eq('titulo', 'TEST_SCHEMA').single();
            console.log('\n✅ Columnas de TICKETS:', t ? Object.keys(t) : 'N/A');
            console.log('   Ejemplo:', JSON.stringify(t, null, 2));
            await supabase.from('tickets').delete().eq('titulo', 'TEST_SCHEMA');
        }
        
        // Check grupo_miembros
        const { error: gmInsErr } = await supabase.from('grupo_miembros').insert([{ grupo_id: 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9', usuario_id: 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9' }]);
        if (gmInsErr) {
            console.log('\nError grupo_miembros insert:', gmInsErr.message);
        } else {
            const { data: gm } = await supabase.from('grupo_miembros').select('*').limit(1);
            console.log('\n✅ Columnas de GRUPO_MIEMBROS:', gm && gm[0] ? Object.keys(gm[0]) : 'N/A');
            await supabase.from('grupo_miembros').delete().eq('grupo_id', 'd4a7a1f0-e7ca-4585-8ee7-97e126783db9');
        }
        
        return;
    }
    
    console.log('Schema completo:', JSON.stringify(data, null, 2));
}

checkSchema().catch(console.error);
