/**
 * Rutas para la gestión de clientes
 */
const express = require('express');
const router = express.Router();
const Cliente = require('../models/cliente');
const Prestamo = require('../models/prestamo');

// Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        console.log('Procesando solicitud GET /api/clientes');
        
        // Envolver en try-catch para manejar posibles errores de procesamiento
        let clientes = [];
        try {
            clientes = await Cliente.find({}).sort({ nombreCompleto: 1 });
            console.log(`Encontrados ${clientes.length} clientes en la base de datos`);
        } catch (dbError) {
            console.error('Error al consultar base de datos:', dbError);
            return res.status(500).json([]);
        }
        
        // Al final, verificar explícitamente que estamos devolviendo un array
        const resultados = Array.isArray(clientes) ? clientes : [];
        console.log(`Enviando ${resultados.length} clientes como respuesta`);
        
        // Devolver explícitamente como array
        res.json(resultados);
    } catch (error) {
        console.error('Error global en /api/clientes:', error);
        // Siempre devolver array vacío en caso de error
        res.status(500).json([]);
    }
});

// Verificar si existe un cliente con ese número de documento
router.get('/verificar', async (req, res) => {
    try {
        const { numeroDocumento } = req.query;
        
        if (!numeroDocumento) {
            return res.status(400).json({ 
                message: 'El número de documento es requerido',
                existe: false 
            });
        }
        
        const clienteExistente = await Cliente.findByDocument(numeroDocumento);
        
        res.json({ 
            existe: !!clienteExistente,
            cliente: clienteExistente ? {
                clienteId: clienteExistente.clienteId,
                nombreCompleto: clienteExistente.nombreCompleto
            } : null
        });
    } catch (error) {
        console.error('Error al verificar cliente:', error);
        res.status(500).json({ 
            message: error.message,
            existe: false 
        });
    }
});

// Obtener clientes con préstamos activos
router.get('/con-prestamos-activos', async (req, res) => {
    try {
        // Obtener todos los préstamos activos
        const prestamosActivos = await Prestamo.find({ estado: 'Activo' });
        
        // Obtener IDs únicos de clientes con préstamos activos
        const clienteIds = [...new Set(prestamosActivos.map(p => p.clienteId))];
        
        // Obtener los datos de esos clientes
        const clientes = await Cliente.find({ 
            clienteId: { $in: clienteIds },
            estado: 'Activo'
        });
        
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes con préstamos activos:', error);
        res.status(500).json([]);
    }
});

// Obtener un cliente por ID
router.get('/:clienteId', async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente por ID:', error);
        res.status(500).json({ message: error.message });
    }
});

// Obtener préstamos de un cliente
router.get('/:clienteId/prestamos', async (req, res) => {
    try {
        const prestamos = await Prestamo.findByClienteId(req.params.clienteId);
        res.json(prestamos || []);
    } catch (error) {
        console.error('Error al obtener préstamos del cliente:', error);
        res.status(500).json([]);
    }
});

// Crear un nuevo cliente
router.post('/', async (req, res) => {
    try {
        const { 
            nombreCompleto, 
            tipoDocumento, 
            numeroDocumento, 
            telefono,
            correoElectronico 
        } = req.body;
        
        // Validaciones más robustas
        if (!nombreCompleto?.trim()) {
            return res.status(400).json({ 
                mensaje: 'El nombre completo es obligatorio' 
            });
        }

        if (!tipoDocumento) {
            return res.status(400).json({ 
                mensaje: 'El tipo de documento es obligatorio' 
            });
        }

        if (!numeroDocumento?.trim()) {
            return res.status(400).json({ 
                mensaje: 'El número de documento es obligatorio' 
            });
        }

        if (!telefono?.trim()) {
            return res.status(400).json({ 
                mensaje: 'El teléfono es obligatorio' 
            });
        }

        // Normalizar datos
        const clienteData = {
            nombreCompleto: nombreCompleto.trim(),
            tipoDocumento,
            numeroDocumento: numeroDocumento.trim(),
            telefono: telefono.trim(),
            correoElectronico: correoElectronico?.trim() || null,
            estado: 'Activo'
        };

        // Verificar cliente existente
        const clienteExistente = await Cliente.findOne({ 
            $or: [
                { numeroDocumento: clienteData.numeroDocumento },
                { correoElectronico: clienteData.correoElectronico }
            ]
        });

        if (clienteExistente) {
            return res.status(409).json({ 
                mensaje: 'Ya existe un cliente con este número de documento o correo electrónico' 
            });
        }

        // Crear nuevo cliente
        const nuevoCliente = await Cliente.create(clienteData);

        res.status(201).json(nuevoCliente);
    } catch (error) {
        console.error('Error al crear cliente:', error);
        
        // Manejar diferentes tipos de errores
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                mensaje: 'Error de validación',
                detalles: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({ 
            mensaje: 'Error interno del servidor', 
            error: error.message 
        });
    }
});

// Actualizar un cliente
router.put('/:clienteId', async (req, res) => {
    try {
        // Preprocesar los datos del cliente
        const clienteData = { ...req.body };
        
        // Si el correo electrónico está vacío, establecerlo como null
        if (!clienteData.correoElectronico || clienteData.correoElectronico.trim() === '') {
            clienteData.correoElectronico = null;
        }
        
        const cliente = await Cliente.updateCliente(req.params.clienteId, clienteData);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(400).json({ message: error.message });
    }
});

// Eliminar un cliente (cambiar a inactivo)
router.delete('/:clienteId', async (req, res) => {
    try {
        // Verificar si el cliente tiene préstamos activos
        const prestamosActivos = await Prestamo.find({
            clienteId: req.params.clienteId,
            estado: 'Activo'
        });
        
        if (prestamosActivos.length > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar un cliente con préstamos activos',
                prestamos: prestamosActivos
            });
        }
        
        const cliente = await Cliente.deleteCliente(req.params.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;