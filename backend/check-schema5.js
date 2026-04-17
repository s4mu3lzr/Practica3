/**
 * Schema check v5 - Ver estados y prioridades
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    // Check estados columns
    console.log('--- ESTADOS ---');
    const { data: e1, error: ee1 } = await supabase.from('estados').insert([{ nombre: 'TEST' }]).select();
    if (ee1) console.log('Error:', ee1.message);
    else {
        console.log('Cols:', Object.keys(e1[0]));
        console.log('Data:', JSON.stringify(e1[0]));
        await supabase.from('estados').delete().eq('nombre', 'TEST');
    }
    
    // Check prioridades columns
    console.log('\n--- PRIORIDADES ---');
    const { data: p1, error: pe1 } = await supabase.from('prioridades').insert([{ nombre: 'TEST' }]).select();
    if (pe1) console.log('Error:', pe1.message);
    else {
        console.log('Cols:', Object.keys(p1[0]));
        console.log('Data:', JSON.stringify(p1[0]));
        await supabase.from('prioridades').delete().eq('nombre', 'TEST');
    }

    // Check usuarios columns - all columns
    console.log('\n--- USUARIOS (todos los existentes) ---');
    const { data: users } = await supabase.from('usuarios').select('*').limit(3);
    if (users && users.length > 0) {
        console.log('Cols:', Object.keys(users[0]));
        users.forEach(u => console.log(' -', u.email, '|', Object.keys(u).join(', ')));
    }
    
    // Try adding permisos column test
    console.log('\n--- TEST USUARIOS insert con permisos ---');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('TestPass123!', 10);
    const { data: utest, error: ute } = await supabase.from('usuarios')
        .insert([{ nombre_completo: 'TEST USER SCHEMA', email: 'test_schema@test.com', username: 'test_schema', password: hash, permisos: '[]' }])
        .select();
    if (ute) console.log('Error con permisos:', ute.message);
    else {
        console.log('OK con permisos! Cols:', Object.keys(utest[0]));
        console.log(JSON.stringify(utest[0], null, 2));
        await supabase.from('usuarios').delete().eq('email', 'test_schema@test.com');
    }
}

check().catch(console.error);
