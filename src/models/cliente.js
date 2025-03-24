const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ClienteSchema = new mongoose.Schema({
    clienteId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres']
    },
    tipoDocumento: {
        type: String,
        enum: ['INE', 'CURP', 'Pasaporte', 'Otro'],
        required: [true, 'El tipo de documento es obligatorio']
    },
    numeroDocumento: {
        type: String,
        required: [true, 'El número de documento es obligatorio'],
        trim: true,
        unique: true // Asegurar documentos únicos
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        trim: true,
       // match: [/^\d{10}$/, 'El teléfono debe tener 10 dígitos numéricos']
    },
    correoElectronico: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        unique: true, // Asegurar correos únicos
        sparse: true, // Permite nulos únicos
        validate: {
            validator: function(v) {
                // Si no hay valor, es válido
                if (!v) return true;
                
                // Validación de formato de correo más estricta
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return emailRegex.test(v);
            },
            message: props => `${props.value} no es un correo electrónico válido`
        }
    },
    estado: {
        type: String,
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
ClienteSchema.index({ nombreCompleto: 1 });
ClienteSchema.index({ numeroDocumento: 1 }, { unique: true });
ClienteSchema.index({ telefono: 1 });
ClienteSchema.index({ correoElectronico: 1 }, { unique: true, sparse: true });

// Transformar documento antes de enviarlo como JSON
ClienteSchema.options.toJSON = {
    transform: function(doc, ret) {
        ret.id = ret.clienteId;
        // Remover campos internos de MongoDB
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

// Middleware para normalizar datos antes de guardar
ClienteSchema.pre('save', function(next) {
    // Normalizar datos
    this.nombreCompleto = this.nombreCompleto.trim();
    this.numeroDocumento = this.numeroDocumento.trim();
    this.telefono = this.telefono.trim();
    
    // Establecer correo electrónico como null si está vacío
    if (this.correoElectronico === '') {
        this.correoElectronico = null;
    }
    
    next();
});

// Métodos estáticos para compatibilidad y flexibilidad
ClienteSchema.statics.findAll = async function() {
    return await this.find({}).sort({ nombreCompleto: 1 });
};

ClienteSchema.statics.findById = async function(clienteId) {
    return await this.findOne({ clienteId });
};

// Método para encontrar cliente de manera más flexible
ClienteSchema.statics.findByDocument = async function(identificador) {
    return await this.findOne({
        $or: [
            { numeroDocumento: identificador },
            { correoElectronico: identificador }
        ]
    });
};

ClienteSchema.statics.createCliente = async function(clienteData) {
    // Normalizar datos antes de crear
    const datosNormalizados = {
        ...clienteData,
        nombreCompleto: clienteData.nombreCompleto?.trim(),
        numeroDocumento: clienteData.numeroDocumento?.trim(),
        telefono: clienteData.telefono?.trim(),
        correoElectronico: clienteData.correoElectronico?.trim() || null
    };
    
    return await this.create(datosNormalizados);
};

ClienteSchema.statics.updateCliente = async function(clienteId, clienteData) {
    // Crear un objeto con solo los datos proporcionados
    const datosActualizados = {};
    
    // Solo incluir campos que existen en clienteData
    if (clienteData.nombreCompleto !== undefined) {
        datosActualizados.nombreCompleto = clienteData.nombreCompleto.trim();
    }
    
    if (clienteData.numeroDocumento !== undefined) {
        datosActualizados.numeroDocumento = clienteData.numeroDocumento.trim();
    }
    
    if (clienteData.telefono !== undefined) {
        datosActualizados.telefono = clienteData.telefono.trim();
    }
    
    if (clienteData.correoElectronico !== undefined) {
        // Si se proporciona un correo, lo limpiamos, pero no lo cambiamos a null si está vacío
        datosActualizados.correoElectronico = clienteData.correoElectronico.trim() || 
            `cliente-${Date.now()}-${Math.random().toString().slice(2,8)}@sistema.local`;
    }
    
    if (clienteData.estado !== undefined) {
        datosActualizados.estado = clienteData.estado;
    }
    
    // Actualizar solo los campos proporcionados usando $set
    return await this.findOneAndUpdate(
        { clienteId },
        { $set: datosActualizados },
        {new: true, runValidators: true, context: 'query'}
    );
};

ClienteSchema.statics.deleteCliente = async function(clienteId) {
    return await this.findOneAndUpdate(
        { clienteId },
        { estado: 'Inactivo' },
        { new: true }
    );
};

// Crear y exportar el modelo
const Cliente = mongoose.model('Cliente', ClienteSchema);

module.exports = Cliente;