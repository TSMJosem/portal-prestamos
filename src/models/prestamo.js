// Modelo de Préstamo
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Esquema para la tabla de amortización
const CuotaSchema = new mongoose.Schema({
    numeroPago: {
        type: Number,
        required: true
    },
    fechaPago: {
        type: Date,
        required: true
    },
    cuotaMensual: {
        type: Number,
        required: true
    },
    capital: {
        type: Number,
        required: true
    },
    interes: {
        type: Number,
        required: true
    },
    saldoPendiente: {
        type: Number,
        required: true
    },
    pagado: {
        type: Boolean,
        default: false
    }
});

// Esquema principal de préstamo
const PrestamoSchema = new mongoose.Schema({
    prestamoId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    clienteId: {
        type: String,
        required: [true, 'El ID del cliente es obligatorio']
    },
    cantidadPrestamo: {
        type: Number,
        required: [true, 'La cantidad del préstamo es obligatoria']
    },
    interesMensual: {
        type: Number,
        required: [true, 'La tasa de interés mensual es obligatoria']
    },
    plazoMeses: {
        type: Number,
        required: [true, 'El plazo en meses es obligatorio']
    },
    frecuenciaPago: {
        type: String,
        enum: ['Semanal', 'Quincenal', 'Mensual'],
        required: [true, 'La frecuencia de pago es obligatoria']
    },
    fechaSolicitud: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['Activo', 'Pagado', 'Cancelado'],
        default: 'Activo'
    },
    tablaAmortizacion: [CuotaSchema],
    cuotaMensual: {
        type: Number,
        required: true
    },
    totalAPagar: {
        type: Number,
        required: true
    },
    totalInteres: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Métodos estáticos para compatibilidad con almacenamiento local
PrestamoSchema.statics.findAll = async function() {
    return await this.find({});
};

PrestamoSchema.statics.findById = async function(prestamoId) {
    return await this.findOne({ prestamoId });
};

PrestamoSchema.statics.findByClienteId = async function(clienteId) {
    return await this.find({ clienteId });
};

PrestamoSchema.statics.createPrestamo = async function(prestamoData) {
    // Calcular tabla de amortización antes de guardar
    prestamoData = this.calcularTablaAmortizacion(prestamoData);
    return await this.create(prestamoData);
};

PrestamoSchema.statics.updatePrestamo = async function(prestamoId, prestamoData) {
    // Recalcular tabla de amortización si es necesario
    if (prestamoData.cantidadPrestamo || prestamoData.interesMensual || prestamoData.plazoMeses) {
        const prestamo = await this.findOne({ prestamoId });
        prestamoData = this.calcularTablaAmortizacion({
            ...prestamo.toObject(),
            ...prestamoData
        });
    }
    
    return await this.findOneAndUpdate(
        { prestamoId },
        prestamoData,
        { new: true, runValidators: true }
    );
};

PrestamoSchema.statics.cancelarPrestamo = async function(prestamoId) {
    return await this.findOneAndUpdate(
        { prestamoId },
        { estado: 'Cancelado' },
        { new: true }
    );
};

PrestamoSchema.statics.actualizarEstadoPago = async function(prestamoId, numeroPago, pagado = true) {
    const prestamo = await this.findOne({ prestamoId });
    
    if (!prestamo) {
        throw new Error('Préstamo no encontrado');
    }
    
    // Actualizar el estado del pago en la tabla de amortización
    const cuotaIndex = prestamo.tablaAmortizacion.findIndex(c => c.numeroPago === numeroPago);
    if (cuotaIndex === -1) {
        throw new Error('Cuota no encontrada');
    }
    
    prestamo.tablaAmortizacion[cuotaIndex].pagado = pagado;
    
    // Verificar si todas las cuotas están pagadas
    const todasPagadas = prestamo.tablaAmortizacion.every(c => c.pagado);
    if (todasPagadas) {
        prestamo.estado = 'Pagado';
    }
    
    return await prestamo.save();
};

// Método para calcular la tabla de amortización
PrestamoSchema.statics.calcularTablaAmortizacion = function(prestamoData) {
    const { cantidadPrestamo, interesMensual, plazoMeses } = prestamoData;
    
    // Convertir tasa de interés de porcentaje a decimal
    const tasaDecimal = interesMensual / 100;
    
    // Cálculo de la cuota mensual usando la fórmula francesa
    const cuotaMensual = (cantidadPrestamo * tasaDecimal * Math.pow(1 + tasaDecimal, plazoMeses)) / 
                        (Math.pow(1 + tasaDecimal, plazoMeses) - 1);
    
    // Calcular la tabla de amortización
    const tabla = [];
    let saldoPendiente = cantidadPrestamo;
    let totalInteres = 0;
    
    for (let i = 1; i <= plazoMeses; i++) {
        // Calcular interés del mes
        const interesMes = saldoPendiente * tasaDecimal;
        totalInteres += interesMes;
        
        // Calcular abono a capital
        const capitalMes = cuotaMensual - interesMes;
        
        // Actualizar saldo pendiente
        saldoPendiente -= capitalMes;
        
        // Calcular fecha de pago
        const fechaPago = new Date(prestamoData.fechaSolicitud || new Date());
        fechaPago.setMonth(fechaPago.getMonth() + i);
        
        // Agregar cuota a la tabla
        tabla.push({
            numeroPago: i,
            fechaPago,
            cuotaMensual,
            capital: capitalMes,
            interes: interesMes,
            saldoPendiente: Math.max(0, saldoPendiente), // Evitar saldo negativo por redondeo
            pagado: false
        });
    }
    
    // Actualizar los datos del préstamo con los cálculos
    prestamoData.tablaAmortizacion = tabla;
    prestamoData.cuotaMensual = cuotaMensual;
    prestamoData.totalAPagar = cuotaMensual * plazoMeses;
    prestamoData.totalInteres = totalInteres;
    
    return prestamoData;
};

// Crear y exportar el modelo
const Prestamo = mongoose.model('Prestamo', PrestamoSchema);

module.exports = Prestamo;