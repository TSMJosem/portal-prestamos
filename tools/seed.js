// Script para poblar la base de datos con datos de ejemplo
const mongoose = require('mongoose');
const { getStorageType } = require('../src/database');
const config = require('../src/config');

// Importar modelos
const Cliente = require('../src/models/cliente');
const Prestamo = require('../src/models/prestamo');
const Pago = require('../src/models/pago');

// Datos de ejemplo para clientes
const clientesEjemplo = [
    {
        nombreCompleto: 'Juan Pérez López',
        tipoDocumento: 'INE',
        numeroDocumento: 'PELJ800101',
        telefono: '9551234567',
        correoElectronico: 'juan.perez@example.com',
        estado: 'Activo'
    },
    {
        nombreCompleto: 'María Rodríguez Gómez',
        tipoDocumento: 'INE',
        numeroDocumento: 'ROGM750620',
        telefono: '9557654321',
        correoElectronico: 'maria.rodriguez@example.com',
        estado: 'Activo'
    },
    {
        nombreCompleto: 'Carlos Sánchez Martínez',
        tipoDocumento: 'CURP',
        numeroDocumento: 'SAMC850415HDFNRL09',
        telefono: '9559876543',
        correoElectronico: 'carlos.sanchez@example.com',
        estado: 'Activo'
    },
    {
        nombreCompleto: 'Laura González Hernández',
        tipoDocumento: 'Pasaporte',
        numeroDocumento: 'G123456789',
        telefono: '9553456789',
        correoElectronico: 'laura.gonzalez@example.com',
        estado: 'Inactivo'
    },
    {
        nombreCompleto: 'Roberto Torres Flores',
        tipoDocumento: 'INE',
        numeroDocumento: 'TOFR900830',
        telefono: '9558765432',
        correoElectronico: 'roberto.torres@example.com',
        estado: 'Activo'
    }
];

/**
 * Crea préstamos de ejemplo para los clientes
 * @param {Array} clientes - Lista de clientes creados
 * @returns {Promise<Array>} - Lista de préstamos creados
 */
const crearPrestamosEjemplo = async (clientes) => {
    const prestamos = [];
    
    // Para cada cliente activo, crear 1 o 2 préstamos
    for (const cliente of clientes) {
        if (cliente.estado === 'Activo') {
            // Préstamo 1
            const prestamo1 = {
                clienteId: cliente.clienteId,
                cantidadPrestamo: 10000 + Math.floor(Math.random() * 90000), // Entre 10,000 y 100,000
                interesMensual: 5 + Math.floor(Math.random() * 10), // Entre 5% y 15%
                plazoMeses: 6 + Math.floor(Math.random() * 7), // Entre 6 y 12 meses
                frecuenciaPago: ['Semanal', 'Quincenal', 'Mensual'][Math.floor(Math.random() * 3)],
                fechaSolicitud: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // En el último mes
            };
            
            // Crear el préstamo
            const prestamoCreado1 = await Prestamo.createPrestamo(prestamo1);
            prestamos.push(prestamoCreado1);
            
            // 50% de probabilidad de tener un segundo préstamo
            if (Math.random() > 0.5) {
                const prestamo2 = {
                    clienteId: cliente.clienteId,
                    cantidadPrestamo: 5000 + Math.floor(Math.random() * 25000), // Entre 5,000 y 30,000
                    interesMensual: 5 + Math.floor(Math.random() * 10), // Entre 5% y 15%
                    plazoMeses: 3 + Math.floor(Math.random() * 10), // Entre 3 y 12 meses
                    frecuenciaPago: ['Semanal', 'Quincenal', 'Mensual'][Math.floor(Math.random() * 3)],
                    fechaSolicitud: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000), // En los últimos 2 meses
                    estado: Math.random() > 0.7 ? 'Pagado' : 'Activo' // 30% de probabilidad de estar pagado
                };
                
                // Crear el préstamo
                const prestamoCreado2 = await Prestamo.createPrestamo(prestamo2);
                
                // Si está pagado, marcar todas las cuotas como pagadas
                if (prestamoCreado2.estado === 'Pagado') {
                    prestamoCreado2.tablaAmortizacion.forEach(cuota => {
                        cuota.pagado = true;
                    });
                    await prestamoCreado2.save();
                }
                
                prestamos.push(prestamoCreado2);
            }
        }
    }
    
    return prestamos;
};

/**
 * Crea pagos de ejemplo para los préstamos
 * @param {Array} prestamos - Lista de préstamos creados
 * @returns {Promise<Array>} - Lista de pagos creados
 */
const crearPagosEjemplo = async (prestamos) => {
    const pagos = [];
    
    // Para cada préstamo, generar pagos para algunas cuotas
    for (const prestamo of prestamos) {
        // Si el préstamo está activo
        if (prestamo.estado === 'Activo') {
            // Generar pagos para las primeras N cuotas (donde N es un número aleatorio)
            const numPagos = Math.floor(Math.random() * (prestamo.tablaAmortizacion.length / 2)) + 1;
            
            for (let i = 0; i < numPagos && i < prestamo.tablaAmortizacion.length; i++) {
                const cuota = prestamo.tablaAmortizacion[i];
                
                // Si la cuota no está pagada
                if (!cuota.pagado) {
                    const pagoData = {
                        prestamoId: prestamo.prestamoId,
                        numeroPago: cuota.numeroPago,
                        cantidadPagada: cuota.cuotaMensual,
                        fechaPago: new Date(Date.now() - (numPagos - i) * 30 * 24 * 60 * 60 * 1000), // Fechas pasadas
                        tipoPago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)]
                    };
                    
                    // Crear el pago
                    try {
                        const pagoCreado = await Pago.createPago(pagoData);
                        pagos.push(pagoCreado);
                    } catch (error) {
                        console.error(`Error al crear pago para préstamo ${prestamo.prestamoId}, cuota ${cuota.numeroPago}:`, error.message);
                    }
                }
            }
        }
    }
    
    return pagos;
};

/**
 * Pobla la base de datos con datos de ejemplo
 * @returns {Promise<Object>} - Estadísticas de los datos creados
 */
const seedDatabase = async () => {
    try {
        // Verificar si estamos usando MongoDB
        if (getStorageType() !== 'mongodb') {
            throw new Error('Solo se puede poblar la base de datos cuando se utiliza MongoDB');
        }
        
        console.log('Creando clientes de ejemplo...');
        // Crear clientes
        const clientesCreados = [];
        for (const clienteData of clientesEjemplo) {
            const cliente = await Cliente.createCliente(clienteData);
            clientesCreados.push(cliente);
        }
        
        console.log('Creando préstamos de ejemplo...');
        // Crear préstamos
        const prestamosCreados = await crearPrestamosEjemplo(clientesCreados);
        
        console.log('Creando pagos de ejemplo...');
        // Crear pagos
        const pagosCreados = await crearPagosEjemplo(prestamosCreados);
        
        return {
            clientes: clientesCreados.length,
            prestamos: prestamosCreados.length,
            pagos: pagosCreados.length
        };
    } catch (error) {
        console.error('Error al poblar la base de datos:', error);
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
        console.log('Conectado a MongoDB, iniciando población de datos...');
        return seedDatabase();
    })
    .then((stats) => {
        console.log('Base de datos poblada correctamente');
        console.log(`Datos creados: ${stats.clientes} clientes, ${stats.prestamos} préstamos, ${stats.pagos} pagos`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
}

module.exports = {
    seedDatabase
};