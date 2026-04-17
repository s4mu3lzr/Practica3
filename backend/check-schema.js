/**
 * Script para verificar el schema de las tablas
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('🔍 Verificando schema de tablas...\n');

    const tables = ['usuarios', 'grupos', 'tickets', 'grupo_miembros'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.code === '42P01') {
                console.log(`❌ Tabla "${table}": NO EXISTE`);
            } else {
                console.log(`⚠️  Tabla "${table}": Error - ${error.message}`);
            }
        } else {
            const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
            if (cols.length > 0) {
                console.log(`✅ Tabla "${table}": ${cols.join(', ')}`);
                if (table === 'usuarios') {
                    console.log(`   -> Ejemplo:`, JSON.stringify(data[0], null, 2));
                }
            } else {
                // Try to get columns from an empty table via RPC
                console.log(`✅ Tabla "${table}": EXISTE (vacía)`);
                // Try insert to see columns
                const { error: insertError } = await supabase.from(table).insert([{}]);
                if (insertError) {
                    console.log(`   -> Info: ${insertError.message}`);
                }
            }
        }
    }
}

checkSchema().catch(console.error);
