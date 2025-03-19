// Rutas para el manejo de préstamos
const express = require('express');
const router = express.Router();
const Prestamo = require('../models/prestamo');
const Cliente = require('../models/cliente');
const Pago = require('../models/pago');
const { generarPdfPrestamo } = require('../utils/pdf');
const { enviarCorreo } = require('../utils/email');

// Obtener todos los préstamos
router.get('/', async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll();
        res.json(prestamos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un préstamo por ID
router.get('/:prestamoId', async (req, res) => {
    try {
        const prestamo = await Prestamo.findById(req.params.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        res.json(prestamo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear un nuevo préstamo
router.post('/', async (req, res) => {
    try {
        // Verificar si el cliente existe
        const cliente = await Cliente.findById(req.body.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Crear el préstamo
        const prestamo = await Prestamo.createPrestamo(req.body);
        
        // Actualizar el estado del cliente a activo
        await Cliente.updateCliente(cliente.clienteId, { estado: 'Activo' });
        
        res.status(201).json(prestamo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Actualizar un préstamo
router.put('/:prestamoId', async (req, res) => {
    try {
        const prestamo = await Prestamo.updatePrestamo(req.params.prestamoId, req.body);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        res.json(prestamo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancelar un préstamo
router.put('/:prestamoId/cancelar', async (req, res) => {
    try {
        const prestamo = await Prestamo.cancelarPrestamo(req.params.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        // Verificar si el cliente tiene otros préstamos activos
        const prestamosActivos = await Prestamo.find({
            clienteId: prestamo.clienteId,
            estado: 'Activo',
            prestamoId: { $ne: prestamo.prestamoId }
        });
        
        // Si no tiene más préstamos activos, cambiar su estado a inactivo
        if (prestamosActivos.length === 0) {
            await Cliente.updateCliente(prestamo.clienteId, { estado: 'Inactivo' });
        }
        
        res.json({ message: 'Préstamo cancelado correctamente', prestamo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener recibo de préstamo en PDF
router.get('/:prestamoId/recibo', async (req, res) => {
    try {
        const prestamo = await Prestamo.findById(req.params.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        const cliente = await Cliente.findById(prestamo.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Generar el PDF
        const pdfBuffer = await generarPdfPrestamo(prestamo, cliente);
        
        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=recibo-prestamo-${prestamo.prestamoId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enviar recibo por email
router.post('/:prestamoId/enviar-recibo', async (req, res) => {
    try {
        const prestamo = await Prestamo.findById(req.params.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        const cliente = await Cliente.findById(prestamo.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Generar el PDF
        const pdfBuffer = await generarPdfPrestamo(prestamo, cliente);
        
        // Enviar por correo
        await enviarCorreo({
            to: cliente.correoElectronico,
            subject: `Recibo de Préstamo #${prestamo.prestamoId}`,
            text: `Estimado/a ${cliente.nombreCompleto}, adjuntamos el recibo de su préstamo por $${prestamo.cantidadPrestamo}.`,
            attachments: [
                {
                    filename: `recibo-prestamo-${prestamo.prestamoId}.pdf`,
                    content: pdfBuffer
                }
            ]
        });
        
        res.json({ message: 'Recibo enviado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener estadísticas del préstamo
router.get('/:prestamoId/estadisticas', async (req, res) => {
    try {
        const prestamo = await Prestamo.findById(req.params.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        // Obtener pagos realizados
        const pagos = await Pago.findByPrestamoId(req.params.prestamoId);
        
        // Calcular estadísticas
        const cuotasPagadas = prestamo.tablaAmortizacion.filter(cuota => cuota.pagado).length;
        const cuotasPendientes = prestamo.tablaAmortizacion.length - cuotasPagadas;
        const capitalPagado = pagos.reduce((total, pago) => total + pago.abonoCapital, 0);
        const interesPagado = pagos.reduce((total, pago) => total + pago.interesPagado, 0);
        const pagadoTotal = capitalPagado + interesPagado;
        const pendienteTotal = prestamo.totalAPagar - pagadoTotal;
        
        res.json({
            prestamoId: prestamo.prestamoId,
            cantidadPrestamo: prestamo.cantidadPrestamo,
            cuotasPagadas,
            cuotasPendientes,
            capitalPagado,
            interesPagado,
            pagadoTotal,
            pendienteTotal,
            porcentajePagado: (pagadoTotal / prestamo.totalAPagar) * 100,
            estado: prestamo.estado
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;