const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updatePasswords() {
    const updates = [
        { email: 'admin_sys@demo.com', password: 'Admin1234!' },
        { email: 'maria.g@demo.com', password: 'Maria1234!' },
        { email: 'carlos.r@demo.com', password: 'Carlos1234!' },
        { email: 'luis.p@demo.com', password: 'Luis1234!' },
        { email: 'usuario_r@demo.com', password: 'User1234!' },
        { email: 'soporte_t@demo.com', password: 'Soporte1234!' }
    ];

    console.log('🔑 Actualizando contraseñas...\n');
    for (const u of updates) {
        const hash = await bcrypt.hash(u.password, 10);
        const { error } = await supabase.from('usuarios').update({ password: hash }).eq('email', u.email);
        if (error) {
            console.error(`❌ Error ${u.email}: ${error.message}`);
        } else {
            console.log(`✅ ${u.email} -> ${u.password}`);
        }
    }
    console.log('\n✅ Contraseñas actualizadas!');
}

updatePasswords().catch(console.error);
