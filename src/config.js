// Configuración global del sistema
require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portal-prestamos',
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM
    },
    jwtSecret: process.env.JWT_SECRET || 'clave_secreta_desarrollo'
};

module.exports = config;