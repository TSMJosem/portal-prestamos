// Configuración de la base de datos
const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        console.log('Utilizando almacenamiento local como respaldo...');
        global.localDB = {
            clientes: [],
            prestamos: [],
            pagos: []
        };
        return false;
    }
};

// Verificar si estamos usando MongoDB o almacenamiento local
const getStorageType = () => {
    return mongoose.connection.readyState === 1 ? 'mongodb' : 'local';
};

// Crear una función para acceder al storage correcto (MongoDB o local)
const getStorage = (collection) => {
    if (getStorageType() === 'mongodb') {
        // Usar el modelo de mongoose
        return require(`./models/${collection}`);
    } else {
        // Usar el almacenamiento local
        return global.localDB[collection];
    }
};

// AÑADIR ESTE CÓDIGO PARA MEJORAR LA GESTIÓN DEL ALMACENAMIENTO LOCAL:
const guardarDatosLocales = () => {
    if (!global.localDB) return;
    
    const fs = require('fs');
    const path = require('path');
    const dirData = path.join(__dirname, '../data');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dirData)) {
        fs.mkdirSync(dirData, { recursive: true });
    }
    
    // Guardar clientes
    fs.writeFileSync(
        path.join(dirData, 'clientes.json'),
        JSON.stringify(global.localDB.clientes, null, 2)
    );
    
    // Guardar préstamos
    fs.writeFileSync(
        path.join(dirData, 'prestamos.json'),
        JSON.stringify(global.localDB.prestamos, null, 2)
    );
    
    // Guardar pagos
    fs.writeFileSync(
        path.join(dirData, 'pagos.json'),
        JSON.stringify(global.localDB.pagos, null, 2)
    );
    
    console.log('Datos guardados en almacenamiento local');
};

// Añadir esta función al objeto exportado
module.exports = {
    connectDB,
    getStorageType,
    getStorage,
    guardarDatosLocales
};