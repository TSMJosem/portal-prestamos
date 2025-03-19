// Modelo de Pago
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Prestamo = require('./prestamo');

// Esquema para MongoDB
const PagoSchema = new mongoose.Schema({
    pagoId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    prestamoId: {
        type: String,
        required: [true, 'El ID del préstamo es obligatorio']
    },
    clienteId: {
        type: String,
        required: [true, 'El ID del cliente es obligatorio']
    },
    numeroPago: {
        type: Number,
        required: [true, 'El número de pago es obligatorio']
    },
    cantidadPagada: {
        type: Number,
        required: [true, 'La cantidad pagada es obligatoria']
    },
    fechaPago: {
        type: Date,
        default: Date.now
    },
    tipoPago: {
        type: String,
        enum: ['Efectivo', 'Transferencia', 'Tarjeta'],
        required: [true, 'El tipo de pago es obligatorio']
    },
    deuda: {
        type: Number,
        required: true
    },
    interesPagado: {
        type: Number,
        required: true
    },
    interesGenerado: {
        type: Number,
        required: true
    },
    abonoCapital: {
        type: Number,
        required: true
    },
    deudaRestante: {
        type: Number,
        required: true
    },
    reciboGenerado: {
        type: Boolean,
        default: false
    },
    reciboURL: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Métodos estáticos para compatibilidad con almacenamiento local
PagoSchema.statics.findAll = async function() {
    return await this.find({});
};

PagoSchema.statics.findById = async function(pagoId) {
    return await this.findOne({ pagoId });
};

PagoSchema.statics.findByPrestamoId = async function(prestamoId) {
    return await this.find({ prestamoId });
};

PagoSchema.statics.findByClienteId = async function(clienteId) {
    return await this.find({ clienteId });
};

PagoSchema.statics.createPago = async function(pagoData) {
    // Obtener información del préstamo para calcular el pago correctamente
    const prestamo = await Prestamo.findById(pagoData.prestamoId);
    
    if (!prestamo) {
        throw new Error('Préstamo no encontrado');
    }
    
    if (prestamo.estado !== 'Activo') {
        throw new Error('No se puede registrar pago a un préstamo que no está activo');
    }
    
    // Encontrar la cuota correspondiente en la tabla de amortización
    const cuota = prestamo.tablaAmortizacion.find(c => c.numeroPago === pagoData.numeroPago);
    
    if (!cuota) {
        throw new Error('Número de pago no encontrado en la tabla de amortización');
    }
    
    if (cuota.pagado) {
        throw new Error('Esta cuota ya ha sido pagada');
    }
    
    // Complementar datos del pago
    pagoData.clienteId = prestamo.clienteId;
    pagoData.deuda = cuota.saldoPendiente + cuota.interes; // Deuda original
    pagoData.interesPagado = cuota.interes;
    pagoData.interesGenerado = cuota.interes;
    pagoData.abonoCapital = pagoData.cantidadPagada - cuota.interes;
    pagoData.deudaRestante = Math.max(0, cuota.saldoPendiente - pagoData.abonoCapital);
    
    // Crear el registro de pago
    const pago = await this.create(pagoData);
    
    // Actualizar el estado de la cuota en el préstamo
    await Prestamo.actualizarEstadoPago(pagoData.prestamoId, pagoData.numeroPago);
    
    return pago;
};

PagoSchema.statics.actualizarRecibo = async function(pagoId, reciboURL) {
    return await this.findOneAndUpdate(
        { pagoId },
        { 
            reciboGenerado: true,
            reciboURL
        },
        { new: true }
    );
};

// Crear y exportar el modelo
const Pago = mongoose.model('Pago', PagoSchema);

module.exports = Pago;