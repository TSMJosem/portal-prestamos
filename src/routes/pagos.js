// Rutas para el manejo de pagos
const express = require('express');
const router = express.Router();
const Pago = require('../models/pago');
const Prestamo = require('../models/prestamo');
const Cliente = require('../models/cliente');
const { generarPdfPago } = require('../utils/pdf');
const { enviarCorreo } = require('../utils/email');
const path = require('path');
const fs = require('fs');

// Obtener todos los pagos
router.get('/', async (req, res) => {
    try {
        const pagos = await Pago.findAll();
        res.json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener pagos por préstamo
router.get('/prestamo/:prestamoId', async (req, res) => {
    try {
        const pagos = await Pago.findByPrestamoId(req.params.prestamoId);
        res.json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener pagos por cliente
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const pagos = await Pago.findByClienteId(req.params.clienteId);
        res.json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un pago por ID
router.get('/:pagoId', async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.pagoId);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }
        res.json(pago);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Registrar un nuevo pago
router.post('/', async (req, res) => {
    try {
        // Crear el pago (el modelo se encarga de la lógica)
        const pago = await Pago.createPago(req.body);
        
        // Generar recibo automáticamente
        const prestamo = await Prestamo.findById(pago.prestamoId);
        const cliente = await Cliente.findById(pago.clienteId);
        
        const pdfBuffer = await generarPdfPago(pago, prestamo, cliente);
        
        // Guardar el PDF en el sistema de archivos
        const dirRecibos = path.join(__dirname, '../../public/recibos');
        
        // Crear directorio si no existe
        if (!fs.existsSync(dirRecibos)) {
            fs.mkdirSync(dirRecibos, { recursive: true });
        }
        
        const reciboPath = path.join(dirRecibos, `recibo-pago-${pago.pagoId}.pdf`);
        fs.writeFileSync(reciboPath, pdfBuffer);
        
        // Actualizar el pago con la URL del recibo
        const reciboURL = `/recibos/recibo-pago-${pago.pagoId}.pdf`;
        await Pago.actualizarRecibo(pago.pagoId, reciboURL);
        
        res.status(201).json({
            ...pago.toObject(),
            reciboGenerado: true,
            reciboURL
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtener recibo del pago en PDF
router.get('/:pagoId/recibo', async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.pagoId);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }
        
        // Si ya existe un recibo, enviar el archivo
        if (pago.reciboGenerado && pago.reciboURL) {
            const reciboPath = path.join(__dirname, '../../public', pago.reciboURL);
            if (fs.existsSync(reciboPath)) {
                return res.sendFile(reciboPath);
            }
        }
        
        // Si no existe, generar uno nuevo
        const prestamo = await Prestamo.findById(pago.prestamoId);
        const cliente = await Cliente.findById(pago.clienteId);
        
        const pdfBuffer = await generarPdfPago(pago, prestamo, cliente);
        
        // Configurar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=recibo-pago-${pago.pagoId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enviar recibo por email
router.post('/:pagoId/enviar-recibo', async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.pagoId);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }
        
        const prestamo = await Prestamo.findById(pago.prestamoId);
        if (!prestamo) {
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        
        const cliente = await Cliente.findById(pago.clienteId);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Obtener el archivo PDF
        let pdfBuffer;
        
        if (pago.reciboGenerado && pago.reciboURL) {
            const reciboPath = path.join(__dirname, '../../public', pago.reciboURL);
            if (fs.existsSync(reciboPath)) {
                pdfBuffer = fs.readFileSync(reciboPath);
            } else {
                pdfBuffer = await generarPdfPago(pago, prestamo, cliente);
            }
        } else {
            pdfBuffer = await generarPdfPago(pago, prestamo, cliente);
        }
        
        // Enviar por correo
        await enviarCorreo({
            to: cliente.correoElectronico,
            subject: `Recibo de Pago #${pago.pagoId}`,
            text: `Estimado/a ${cliente.nombreCompleto}, adjuntamos el recibo de su pago por $${pago.cantidadPagada}.`,
            attachments: [
                {
                    filename: `recibo-pago-${pago.pagoId}.pdf`,
                    content: pdfBuffer
                }
            ]
        });
        
        res.json({ message: 'Recibo enviado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;