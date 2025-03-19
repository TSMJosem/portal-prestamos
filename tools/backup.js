// Script para realizar respaldos de la base de datos
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getStorageType } = require('../src/database');
const config = require('../src/config');

// Importar modelos
const Cliente = require('../src/models/cliente');
const Prestamo = require('../src/models/prestamo');
const Pago = require('../src/models/pago');

/**
 * Genera un respaldo de la base de datos
 * @returns {Promise<string>} Nombre del archivo de respaldo generado
 */
const generateBackup = async () => {
    try {
        // Verificar si estamos usando MongoDB
        if (getStorageType() !== 'mongodb') {
            throw new Error('Solo se pueden generar respaldos cuando se utiliza MongoDB');
        }
        
        // Crear directorio de respaldos si no existe
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Generar nombre de archivo con fecha y hora
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.json`;
        const filePath = path.join(backupDir, fileName);
        
        // Obtener todos los datos
        const clientes = await Cliente.find({});
        const prestamos = await Prestamo.find({});
        const pagos = await Pago.find({});
        
        // Crear objeto de respaldo
        const backup = {
            timestamp,
            version: '1.0',
            database: config.mongoURI,
            collections: {
                clientes,
                prestamos,
                pagos
            }
        };
        
        // Guardar en archivo
        fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
        
        console.log(`Respaldo generado: ${fileName}`);
        return fileName;
    } catch (error) {
        console.error('Error al generar respaldo:', error);
        throw error;
    }
};

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
    // Conectar a la base de datos
    mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Conectado a MongoDB, iniciando respaldo...');
        return generateBackup();
    })
    .then((fileName) => {
        console.log(`Respaldo completado: ${fileName}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
}

module.exports = {
    generateBackup
};