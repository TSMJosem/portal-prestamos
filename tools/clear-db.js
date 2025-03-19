// Script para limpiar la base de datos (solo para desarrollo)
const mongoose = require('mongoose');
const config = require('../src/config');

// Importar modelos
const Cliente = require('../src/models/cliente');
const Prestamo = require('../src/models/prestamo');
const Pago = require('../src/models/pago');

/**
 * Limpia todas las colecciones de la base de datos
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
    try {
        // Verificar entorno
        if (process.env.NODE_ENV === 'production') {
            throw new Error('No se puede limpiar la base de datos en producción');
        }
        
        // Limpiar colecciones sin usar transacciones
        await Cliente.deleteMany({});
        console.log('Colección de Clientes limpiada correctamente');
        
        await Prestamo.deleteMany({});
        console.log('Colección de Préstamos limpiada correctamente');
        
        await Pago.deleteMany({});
        console.log('Colección de Pagos limpiada correctamente');
        
        console.log('Base de datos limpiada correctamente');
    } catch (error) {
        console.error('Error al limpiar la base de datos:', error);
        throw error;
    }
};

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
    // Solicitar confirmación
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('¿Está seguro de que desea limpiar la base de datos? (s/n): ', (answer) => {
        readline.close();
        
        if (answer.toLowerCase() === 's') {
            // Conectar a la base de datos
            const dbUri = config.db ? config.db.uri : 'mongodb://localhost:27017/portal-prestamos';
            
            mongoose.connect(dbUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            .then(() => {
                console.log('Conectado a MongoDB, iniciando limpieza...');
                return clearDatabase();
            })
            .then(() => {
                console.log('Limpieza completada');
                mongoose.connection.close();
                process.exit(0);
            })
            .catch((error) => {
                console.error('Error:', error);
                mongoose.connection.close();
                process.exit(1);
            });
        } else {
            console.log('Operación cancelada');
            process.exit(0);
        }
    });
}

module.exports = {
    clearDatabase
};