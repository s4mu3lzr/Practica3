/**
 * API Gateway - Versión Express con http-proxy-middleware
 * Funcionamiento simple y confiable para proxear requests
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 4000;

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost',
    process.env.SUPABASE_SERVICE_KEY || 'stub_key'
);

// CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] }));

// Parsear body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter Global (Cortafuegos de seguridad)
// ─────────────────────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // Límite de 100 peticiones por minuto por IP
    message: { 
        statusCode: 429, 
        intoperationCode: -1, 
        data: [{ error: 'Demasiadas peticiones. Por favor, intenta más tarde.' }] 
    },
    standardHeaders: true, // Retorna info del rate limit en los encabezados `RateLimit-*`
    legacyHeaders: false, // Deshabilita los encabezados `X-RateLimit-*`
});

// Aplicar el limitador a todas las rutas que comiencen con /api/
app.use('/api/', apiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// Proxy helper - reenvía request a microservicio
// ─────────────────────────────────────────────────────────────────────────────
function proxyTo(port, pathRewrite) {
    return (req, res) => {
        // Calcular path de destino
        let targetPath = req.url;
        
        // Si se especifica rewrite, aplicarlo
        if (pathRewrite) {
            const prefix = Object.keys(pathRewrite)[0];
            targetPath = req.originalUrl.replace(new RegExp(prefix), pathRewrite[prefix]);
        }

        const bodyStr = req.body && Object.keys(req.body).length > 0 
            ? JSON.stringify(req.body) 
            : '';

        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: targetPath || '/',
            method: req.method,
            headers: {
                'content-type': 'application/json',
                'authorization': req.headers.authorization || '',
                'content-length': Buffer.byteLength(bodyStr)
            }
        };

        const proxyReq = http.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode || 200);
                res.setHeader('content-type', proxyRes.headers['content-type'] || 'application/json');
                res.send(data);
            });
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy error:', err.message);
            res.status(502).json({ statusCode: 502, intoperationCode: -1, data: [{ error: 'Gateway error', detail: err.message }] });
        });

        if (bodyStr) {
            proxyReq.write(bodyStr);
        }
        proxyReq.end();

        // Logging async
        setImmediate(async () => {
            try {
                await supabase.from('api_logs').insert([{
                    endpoint: req.originalUrl,
                    method: req.method,
                    ip: req.ip,
                    status_code: res.statusCode
                }]);
            } catch (e) { /* tabla puede no existir */ }
        });
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rutas proxeadas
// Formato: /api/{servicio}/...restPath -> microservice:port/...restPath
// ─────────────────────────────────────────────────────────────────────────────

// USERS -> Puerto 3001
app.all('/api/users', (req, res) => {
    req.url = '/';
    proxyTo(3001)(req, res);
});
app.all('/api/users/*', (req, res) => {
    req.url = '/' + req.params[0];
    proxyTo(3001)(req, res);
});

// TICKETS -> Puerto 3002
app.all('/api/tickets', (req, res) => {
    req.url = '/';
    proxyTo(3002)(req, res);
});
app.all('/api/tickets/*', (req, res) => {
    req.url = '/' + req.params[0];
    proxyTo(3002)(req, res);
});

// GROUPS -> Puerto 3003
app.all('/api/groups', (req, res) => {
    req.url = '/';
    proxyTo(3003)(req, res);
});
app.all('/api/groups/*', (req, res) => {
    req.url = '/' + req.params[0];
    proxyTo(3003)(req, res);
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Gateway (Express) en http://localhost:${PORT}`);
    console.log(`   /api/users   -> localhost:3001`);
    console.log(`   /api/tickets -> localhost:3002`);
    console.log(`   /api/groups  -> localhost:3003`);
});
