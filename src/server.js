
// Archivo principal del servidor 
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { connectDB } = require('./database');
const config = require('./config');

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const prestamosRoutes = require('./routes/prestamos');
const pagosRoutes = require('./routes/pagos');

// Inicializar Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression()); // Comprimir todas las respuestas

// Servir archivos estáticos - MODIFICADO
app.use(express.static(path.join(__dirname, '../public')));
// Ruta adicional para servir vistas como archivos estáticos 
// desde la raíz, esto resolverá los errores 404
app.use(express.static(path.join(__dirname, '../views')));

// Configurar rutas de la API
app.use('/api/clientes', clientesRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/pagos', pagosRoutes);

// Ruta para backup
app.get('/api/backup', (req, res) => {
    try {
        const backupScript = require('../tools/backup');
        backupScript.generateBackup()
            .then(fileName => {
                res.json({ success: true, fileName });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: err.message });
            });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ruta para restore
app.post('/api/restore', (req, res) => {
    try {
        const { fileName } = req.body;
        const restoreScript = require('../tools/restore');
        restoreScript.restoreBackup(fileName)
            .then(() => {
                res.json({ success: true });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: err.message });
            });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ruta para reset de base de datos (solo en desarrollo)
app.post('/api/admin/reset-database', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'No permitido en producción' });
    }
    
    try {
        const clearDbScript = require('../tools/clear-db');
        clearDbScript.clearDatabase()
            .then(() => {
                res.json({ success: true });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: err.message });
            });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// NUEVO: Ruta para exportar plantillas HTML desde /views para uso directo
app.use('/views', express.static(path.join(__dirname, '../views')));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// MODIFICADO: Manejar rutas para las diferentes vistas
// Ahora sirve el mismo index.html y deja que el frontend maneje la navegación
app.get(['/clientes', '/prestamos', '/pagos', '/reportes', '/nuevo-prestamo', '/dashboard'], (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// NUEVO: Manejar rutas alternativas con extensión .html
app.get(['/*.html'], (req, res, next) => {
    // Si es una petición a una vista HTML directa, servir el index
    const pageName = req.path.replace(/^\/|\.html$/g, '');
    if (['clientes', 'prestamos', 'pagos', 'reportes', 'nuevo-prestamo', 'dashboard'].includes(pageName)) {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    } else {
        // Si no es una de las páginas conocidas, continuar con el siguiente handler
        next();
    }
});

// NUEVO: Ruta para templates HTML individuales
// Esto permite que fetch('/views/pagename.html') funcione
app.get('/views/:template', (req, res) => {
    const templatePath = path.join(__dirname, '../views', req.params.template);
    
    // Verificar si existe el archivo
    try {
        if (require('fs').existsSync(templatePath)) {
            res.sendFile(templatePath);
        } else {
            // Si no existe el archivo específico, servir un template genérico
            res.send(`<div class="container-fluid"><h2 class="mb-4">${req.params.template.replace('.html', '')}</h2><div class="alert alert-info">Contenido en construcción...</div></div>`);
        }
    } catch (error) {
        // En caso de error, servir un template genérico
        res.send(`<div class="container-fluid"><h2 class="mb-4">${req.params.template.replace('.html', '')}</h2><div class="alert alert-warning">Error al cargar la página</div></div>`);
    }
});

// Manejar errores 404
app.use((req, res, next) => {
    // Verificar si es una solicitud de API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            success: false, 
            error: 'Endpoint no encontrado' 
        });
    }
    
    // Para rutas normales, redirigir al index (SPA)
    res.status(404).sendFile(path.join(__dirname, '../views/index.html'));
});

// Iniciar el servidor
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Añadir esto a server.js
app.get('/api/test/db', async (req, res) => {
    try {
        // Probar conexión directa a MongoDB
        const collections = await mongoose.connection.db.listCollections().toArray();
        const dbStatus = {
            connected: mongoose.connection.readyState === 1,
            collections: collections.map(c => c.name),
            dbName: mongoose.connection.db.databaseName
        };
        
        // Intentar obtener un cliente directamente
        let clientSample = null;
        try {
            clientSample = await mongoose.connection.db.collection('clientes').findOne({});
        } catch (err) {
            console.error('Error al obtener cliente de muestra:', err);
        }
        
        res.json({
            status: 'success',
            message: 'Prueba de conexión a base de datos',
            timestamp: new Date(),
            dbStatus,
            clientSample
        });
    } catch (error) {
        console.error('Error en prueba de base de datos:', error);
        res.status(500).json({
            status: 'error',
            message: 'Falló prueba de conexión a base de datos',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : null
        });
    }
});