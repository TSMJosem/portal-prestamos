// Script para restaurar respaldos de la base de datos
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
 * Restaura un respaldo de la base de datos
 * @param {string} fileName - Nombre del archivo de respaldo
 * @returns {Promise<void>}
 */
const restoreBackup = async (fileName) => {
    try {
        // Verificar si estamos usando MongoDB
        if (getStorageType() !== 'mongodb') {
            throw new Error('Solo se pueden restaurar respaldos cuando se utiliza MongoDB');
        }
        
        // Ruta completa del archivo
        const filePath = path.join(__dirname, '../backups', fileName);
        
        // Verificar si existe el archivo
        if (!fs.existsSync(filePath)) {
            throw new Error(`El archivo ${fileName} no existe`);
        }
        
        // Leer el archivo
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Verificar versión del respaldo
        if (!backupData.version || backupData.version !== '1.0') {
            throw new Error('Formato de respaldo no compatible');
        }
        
        // Iniciar restauración dentro de una transacción
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Limpiar colecciones existentes
            await Cliente.deleteMany({}, { session });
            await Prestamo.deleteMany({}, { session });
            await Pago.deleteMany({}, { session });
            
            // Restaurar clientes
            if (backupData.collections.clientes && backupData.collections.clientes.length > 0) {
                await Cliente.insertMany(backupData.collections.clientes, { session });
            }
            
            // Restaurar préstamos
            if (backupData.collections.prestamos && backupData.collections.prestamos.length > 0) {
                await Prestamo.insertMany(backupData.collections.prestamos, { session });
            }
            
            // Restaurar pagos
            if (backupData.collections.pagos && backupData.collections.pagos.length > 0) {
                await Pago.insertMany(backupData.collections.pagos, { session });
            }
            
            // Confirmar transacción
            await session.commitTransaction();
            session.endSession();
            
            console.log(`Restauración completada desde ${fileName}`);
        } catch (error) {
            // Si hay error, revertir cambios
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        throw error;
    }
};

// Obtener la lista de respaldos disponibles
const getBackupList = () => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        
        // Verificar si existe el directorio
        if (!fs.existsSync(backupDir)) {
            return [];
        }
        
        // Leer archivos del directorio
        const files = fs.readdirSync(backupDir);
        
        // Filtrar solo archivos JSON
        return files.filter(file => file.endsWith('.json'))
            .map(file => ({
                fileName: file,
                fullPath: path.join(backupDir, file),
                size: fs.statSync(path.join(backupDir, file)).size,
                createdAt: fs.statSync(path.join(backupDir, file)).birthtime
            }))
            .sort((a, b) => b.createdAt - a.createdAt); // Ordenar por fecha, más reciente primero
    } catch (error) {
        console.error('Error al obtener lista de respaldos:', error);
        return [];
    }
};

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
    // Verificar argumentos
    if (process.argv.length < 3) {
        console.log('Uso: node restore.js <nombre-archivo>');
        console.log('Respaldos disponibles:');
        
        const backups = getBackupList();
        if (backups.length === 0) {
            console.log('No hay respaldos disponibles');
        } else {
            backups.forEach(backup => {
                const size = (backup.size / 1024).toFixed(2) + ' KB';
                const date = backup.createdAt.toLocaleString();
                console.log(`- ${backup.fileName} (${size}) - ${date}`);
            });
        }
        
        process.exit(0);
    }
    
    const fileName = process.argv[2];
    
    // Conectar a la base de datos
    mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Conectado a MongoDB, iniciando restauración...');
        return restoreBackup(fileName);
    })
    .then(() => {
        console.log('Restauración completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
}

module.exports = {
    restoreBackup,
    getBackupList
};