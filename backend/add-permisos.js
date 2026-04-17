/**
 * Agrega columna 'permisos' a la tabla usuarios y tabla 'usuario_permisos'
 * si no existen
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwdysuumigqdpiggbhad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZHlzdXVtaWdxZHBpZ2diaGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4OTI5OCwiZXhwIjoyMDkwMDY1Mjk4fQ.nXLjXpLuhxtGBVRUlQgnaSeKpoDFkc1WdjGSsokTMC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addPermisos() {
    console.log('🔧 Agregando sistema de permisos...\n');

    // Intentar agregar la columna 'permisos' via SQL usando la API de Supabase
    // Primero intentamos via una tabla de permisos separada
    console.log('Intentando crear tabla usuario_permisos...');
    
    // Test: ¿existe tabla usuario_permisos?
    const { data, error } = await supabase.from('usuario_permisos').select('*').limit(1);
    
    if (error && error.code === '42P01') {
        console.log('❌ tabla usuario_permisos no existe.');
        console.log('\n📋 SOLUCIÓN: Necesitas ejecutar el siguiente SQL en Supabase Dashboard:');
        console.log('   (Dashboard > SQL Editor)\n');
        console.log(`
-- Agregar columna permisos a usuarios (tipo jsonb)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos jsonb DEFAULT '[]'::jsonb;

-- Actualizar permisos de usuarios existentes
UPDATE usuarios SET permisos = '["user:crud","group:add","group:edit","group:delete","ticket:create","ticket:edit"]'::jsonb WHERE email = 'admin_sys@demo.com';
UPDATE usuarios SET permisos = '["group:add","ticket:create","ticket:edit"]'::jsonb WHERE email = 'maria.g@demo.com';
UPDATE usuarios SET permisos = '["ticket:create"]'::jsonb WHERE email = 'carlos.r@demo.com';
UPDATE usuarios SET permisos = '[]'::jsonb WHERE email = 'luis.p@demo.com';
-- Usuarios legados
UPDATE usuarios SET permisos = '["ticket:create","group:add"]'::jsonb WHERE email = 'usuario_r@demo.com';
UPDATE usuarios SET permisos = '["ticket:create"]'::jsonb WHERE email = 'soporte_t@demo.com';
        `);
    } else if (!error) {
        console.log('✅ tabla usuario_permisos ya existe');
        const cols = data && data[0] ? Object.keys(data[0]) : 'sin datos';
        console.log('Columnas:', cols);
    } else {
        console.log('Error desconocido:', error.message);
    }

    // Test si ya se puede usar la columna permisos en usuarios
    const { data: utest, error: ute } = await supabase.from('usuarios').select('id, email, permisos').limit(1);
    if (ute) {
        console.log('\n❌ Columna "permisos" no disponible en usuarios:', ute.message);
        console.log('\n🚨 ACCIÓN REQUERIDA: Ejecuta el SQL de arriba en Supabase Dashboard.');
        console.log('\n🔗 URL: https://supabase.com/dashboard/project/jwdysuumigqdpiggbhad/sql/new');
    } else {
        console.log('\n✅ Columna "permisos" disponible en usuarios!');
        console.log('Datos:', utest);
    }
}

addPermisos().catch(console.error);
