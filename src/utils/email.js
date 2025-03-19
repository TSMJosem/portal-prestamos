// Utilidades para envío de correos electrónicos
const nodemailer = require('nodemailer');
const config = require('../config');

// Crear transporter una sola vez
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        // Crear transporter con la configuración del .env
        transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.port === 465, // true para 465, false para otros puertos
            auth: {
                user: config.email.user,
                pass: config.email.pass
            }
        });
    }
    
    return transporter;
};

/**
 * Envía un correo electrónico
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.text - Texto plano
 * @param {string} [options.html] - HTML opcional
 * @param {Array} [options.attachments] - Archivos adjuntos
 * @returns {Promise} - Promesa con el resultado del envío
 */
const enviarCorreo = async (options) => {
    try {
        // Verificar configuración de correo
        if (!config.email.host || !config.email.user || !config.email.pass) {
            throw new Error('La configuración de correo no está completa');
        }
        
        // Configurar mensaje
        const message = {
            from: `"ALFIN CASH" <${config.email.from}>`,
            to: options.to,
            subject: options.subject,
            text: options.text
        };
        
        // Añadir HTML si está disponible
        if (options.html) {
            message.html = options.html;
        }
        
        // Añadir adjuntos si están disponibles
        if (options.attachments && Array.isArray(options.attachments)) {
            message.attachments = options.attachments;
        }
        
        // Enviar correo
        const info = await getTransporter().sendMail(message);
        
        console.log(`Correo enviado: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};

/**
 * Envía notificación de nuevo préstamo
 * @param {Object} prestamo - Datos del préstamo
 * @param {Object} cliente - Datos del cliente
 * @param {Buffer} pdfBuffer - Buffer del PDF de recibo
 * @returns {Promise} - Promesa con el resultado del envío
 */
const enviarNotificacionPrestamo = async (prestamo, cliente, pdfBuffer) => {
    // Formatear montos para mejor legibilidad
    const formatMonto = (monto) => {
        return monto.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    };
    
    // Formatear fecha
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };
    
    // Crear el HTML para el correo
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4682B4; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0;">ALFIN CASH</h1>
                <p style="margin: 5px 0;">Préstamos Personales</p>
            </div>
            
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <h2>¡Préstamo Aprobado!</h2>
                
                <p>Estimado/a <strong>${cliente.nombreCompleto}</strong>,</p>
                
                <p>Le informamos que su solicitud de préstamo ha sido aprobada con los siguientes detalles:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Número de Préstamo:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${prestamo.prestamoId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de Solicitud:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(prestamo.fechaSolicitud)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Monto del Préstamo:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatMonto(prestamo.cantidadPrestamo)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tasa de Interés:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${prestamo.interesMensual}% mensual</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Plazo:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${prestamo.plazoMeses} meses</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Cuota Mensual:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatMonto(prestamo.cuotaMensual)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total a Pagar:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatMonto(prestamo.totalAPagar)}</td>
                    </tr>
                </table>
                
                <p>Adjuntamos a este correo el recibo oficial de su préstamo con los detalles completos, incluyendo el calendario de pagos.</p>
                
                <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
                
                <p>Atentamente,</p>
                <p><strong>El equipo de ALFIN CASH</strong></p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                <p>&copy; ${new Date().getFullYear()} ALFIN CASH. Todos los derechos reservados.</p>
            </div>
        </div>
    `;
    
    // Configurar el correo
    const options = {
        to: cliente.correoElectronico,
        subject: `ALFIN CASH - Préstamo Aprobado #${prestamo.prestamoId}`,
        text: `Estimado/a ${cliente.nombreCompleto}, le informamos que su solicitud de préstamo por ${formatMonto(prestamo.cantidadPrestamo)} ha sido aprobada. Adjuntamos el recibo con los detalles completos.`,
        html: html,
        attachments: [
            {
                filename: `recibo-prestamo-${prestamo.prestamoId}.pdf`,
                content: pdfBuffer
            }
        ]
    };
    
    // Enviar el correo
    return await enviarCorreo(options);
};

/**
 * Envía notificación de pago recibido
 * @param {Object} pago - Datos del pago
 * @param {Object} prestamo - Datos del préstamo
 * @param {Object} cliente - Datos del cliente
 * @param {Buffer} pdfBuffer - Buffer del PDF de recibo
 * @returns {Promise} - Promesa con el resultado del envío
 */
const enviarNotificacionPago = async (pago, prestamo, cliente, pdfBuffer) => {
    // Formatear montos para mejor legibilidad
    const formatMonto = (monto) => {
        return monto.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    };
    
    // Formatear fecha
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };
    
    // Crear el HTML para el correo
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4682B4; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0;">ALFIN CASH</h1>
                <p style="margin: 5px 0;">Préstamos Personales</p>
            </div>
            
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <h2>¡Pago Recibido!</h2>
                
                <p>Estimado/a <strong>${cliente.nombreCompleto}</strong>,</p>
                
                <p>Le confirmamos que hemos recibido su pago con los siguientes detalles:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Número de Pago:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pago.pagoId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha de Pago:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(pago.fechaPago)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Número de Préstamo:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pago.prestamoId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Número de Cuota:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pago.numeroPago}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Monto Pagado:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatMonto(pago.cantidadPagada)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tipo de Pago:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pago.tipoPago}</td>
                    </tr>
                </table>
                
                <p>Desglose del pago:</p>
                <ul>
                    <li>Abono a Capital: ${formatMonto(pago.abonoCapital)}</li>
                    <li>Interés Pagado: ${formatMonto(pago.interesPagado)}</li>
                    <li>Deuda Restante: ${formatMonto(pago.deudaRestante)}</li>
                </ul>
                
                <p>Adjuntamos a este correo el recibo oficial de su pago.</p>
                
                <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
                
                <p>Atentamente,</p>
                <p><strong>El equipo de ALFIN CASH</strong></p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>Este es un correo automático, por favor no responda a este mensaje.</p>
                <p>&copy; ${new Date().getFullYear()} ALFIN CASH. Todos los derechos reservados.</p>
            </div>
        </div>
    `;
    
    // Configurar el correo
    const options = {
        to: cliente.correoElectronico,
        subject: `ALFIN CASH - Pago Recibido #${pago.pagoId}`,
        text: `Estimado/a ${cliente.nombreCompleto}, le confirmamos que hemos recibido su pago por ${formatMonto(pago.cantidadPagada)}. Adjuntamos el recibo con los detalles completos.`,
        html: html,
        attachments: [
            {
                filename: `recibo-pago-${pago.pagoId}.pdf`,
                content: pdfBuffer
            }
        ]
    };
    
    // Enviar el correo
    return await enviarCorreo(options);
};

module.exports = {
    enviarCorreo,
    enviarNotificacionPrestamo,
    enviarNotificacionPago
};