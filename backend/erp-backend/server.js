require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Configuración de AJV para JSON Schema
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL || 'fallo', process.env.SUPABASE_KEY || 'fallo');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ==========================================================
// SCHEMAS JSON DE VALIDACIÓN
// ==========================================================
const userSchema = {
    type: "object",
    properties: {
        nombre_completo: { type: "string", minLength: 2 },
        email: { type: "string", format: "email" },
        username: { type: "string", minLength: 3 },
        password: { type: "string", minLength: 6 },
        telefono: { type: "string" },
        direccion: { type: "string" }
    },
    required: ["nombre_completo", "email", "username", "password"],
    additionalProperties: false
};

const loginSchema = {
    type: "object",
    properties: {
        email: { type: "string", format: "email" },
        username: { type: "string" },
        password: { type: "string", minLength: 1 }
    },
    required: ["password"],
    anyOf: [
        { required: ["email"] },
        { required: ["username"] }
    ],
    additionalProperties: false
};

const validateRegister = ajv.compile(userSchema);
const validateLogin = ajv.compile(loginSchema);

// Middleware genérico para ejecutar validación JSON Schema
function validateSchema(ajvValidate) {
    return (req, res, next) => {
        const valid = ajvValidate(req.body);
        if (!valid) {
            return res.status(400).json({
                error: "Dato inválido según el JSON Schema",
                detalles: ajvValidate.errors
            });
        }
        next();
    };
}

// ==========================================================
// 1. POST /api/auth/register (Registro Externo)
// ==========================================================
app.post('/api/auth/register', validateSchema(validateRegister), async (req, res) => {
    const { nombre_completo, email, username, password, telefono, direccion } = req.body;

    try {
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: 'El email o username ya está en uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre_completo,
                email,
                username,
                password: hashedPassword,
                telefono,
                direccion,
                fecha_inicio: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        const newUser = data[0];
        delete newUser.password;

        res.status(201).json({ message: 'Usuario externo registrado exitosamente', user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

// ==========================================================
// 2. POST /api/auth/login (Inicio de sesión)
// ==========================================================
app.post('/api/auth/login', validateSchema(validateLogin), async (req, res) => {
    const { email, username, password } = req.body;
    const identifier = email || username;

    try {
        const { data: users, error } = await supabase
            .from('usuarios')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier}`);

        if (error) throw error;
        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas (usuario no encontrado)' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
        }

        await supabase
            .from('usuarios')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        delete user.password;

        res.status(200).json({
            message: 'Login exitoso',
            token,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

// ==========================================================
// 3. POST /api/users (Agregar usuario desde Panel Interno)
// ==========================================================
app.post('/api/users', validateSchema(validateRegister), async (req, res) => {
    const { nombre_completo, email, username, password, telefono, direccion } = req.body;
    
    try {
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: 'El email o username ya existe en el sistema' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([{
                nombre_completo,
                email,
                username,
                password: hashedPassword,
                telefono,
                direccion,
                fecha_inicio: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        const newUser = data[0];
        delete newUser.password;

        res.status(201).json({ message: 'Usuario creado exitosamente desde el panel interno', user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor al crear usuario', details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API REST del ERP ejecutándose en http://localhost:${PORT}`);
});
