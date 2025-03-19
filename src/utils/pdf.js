// Utilidades para generar documentos PDF
const PDFDocument = require('pdfkit');

// Función para formatear fechas
const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Función para formatear montos
const formatMonto = (monto) => {
    return monto.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
};

// Generar recibo de préstamo
const generarPdfPrestamo = (prestamo, cliente) => {
    return new Promise((resolve, reject) => {
        try {
            // Crear documento PDF
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            
            // Recopilar chunks para generar buffer
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // Encabezado
            doc.fontSize(20).text('ALFIN CASH', { align: 'center' });
            doc.fontSize(16).text('Recibo de Préstamo', { align: 'center' });
            doc.moveDown();
            
            // Logo SVG (versión sencilla)
            doc.save()
               .translate(doc.page.width / 2 - 40, 50)
               .scale(0.5)
               .path('M 50 20 L 90 20 L 100 40 L 40 40 Z')  // Forma simple de billete
               .fill('#4682B4')
               .restore();
            
            // Información del préstamo
            doc.fontSize(12).text(`Fecha: ${formatDate(prestamo.fechaSolicitud)}`);
            doc.text(`No. de Préstamo: ${prestamo.prestamoId}`);
            doc.moveDown();
            
            // Información del cliente
            doc.fontSize(14).text('Información del Cliente');
            doc.fontSize(12).text(`Nombre: ${cliente.nombreCompleto}`);
            doc.text(`Documento: ${cliente.tipoDocumento} - ${cliente.numeroDocumento}`);
            doc.text(`Teléfono: ${cliente.telefono}`);
            doc.text(`Correo: ${cliente.correoElectronico}`);
            doc.moveDown();
            
            // Detalles del préstamo
            doc.fontSize(14).text('Detalles del Préstamo');
            doc.fontSize(12).text(`Monto del Préstamo: ${formatMonto(prestamo.cantidadPrestamo)}`);
            doc.text(`Tasa de Interés Mensual: ${prestamo.interesMensual}%`);
            doc.text(`Plazo: ${prestamo.plazoMeses} meses`);
            doc.text(`Frecuencia de Pago: ${prestamo.frecuenciaPago}`);
            doc.text(`Cuota Mensual: ${formatMonto(prestamo.cuotaMensual)}`);
            doc.text(`Total a Pagar: ${formatMonto(prestamo.totalAPagar)}`);
            doc.text(`Total de Interés: ${formatMonto(prestamo.totalInteres)}`);
            doc.moveDown();
            
            // Tabla de amortización
            doc.fontSize(14).text('Tabla de Amortización');
            
            // Encabezados de tabla
            const tableTop = doc.y + 10;
            const tableHeaders = [
                { title: 'No.', x: 50, width: 30 },
                { title: 'Fecha', x: 80, width: 80 },
                { title: 'Cuota', x: 160, width: 80 },
                { title: 'Capital', x: 240, width: 80 },
                { title: 'Interés', x: 320, width: 80 },
                { title: 'Saldo', x: 400, width: 100 }
            ];
            
            doc.fontSize(10);
            tableHeaders.forEach(header => {
                doc.text(header.title, header.x, tableTop, { width: header.width, align: 'left' });
            });
            
            // Línea separadora
            doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
            
            // Contenido de la tabla
            let tableY = tableTop + 20;
            
            // Mostrar solo las primeras 20 cuotas para evitar problemas de espacio
            const cuotasAMostrar = prestamo.tablaAmortizacion.slice(0, 20);
            
            cuotasAMostrar.forEach((cuota, index) => {
                // Si estamos cerca del final de la página, añadir una nueva
                if (tableY > 700) {
                    doc.addPage();
                    tableY = 50;
                    
                    // Repetir encabezados en la nueva página
                    tableHeaders.forEach(header => {
                        doc.text(header.title, header.x, tableY, { width: header.width, align: 'left' });
                    });
                    
                    // Línea separadora
                    doc.moveTo(50, tableY + 15).lineTo(500, tableY + 15).stroke();
                    tableY += 20;
                }
                
                doc.text(cuota.numeroPago.toString(), 50, tableY, { width: 30, align: 'left' });
                doc.text(formatDate(cuota.fechaPago), 80, tableY, { width: 80, align: 'left' });
                doc.text(formatMonto(cuota.cuotaMensual), 160, tableY, { width: 80, align: 'left' });
                doc.text(formatMonto(cuota.capital), 240, tableY, { width: 80, align: 'left' });
                doc.text(formatMonto(cuota.interes), 320, tableY, { width: 80, align: 'left' });
                doc.text(formatMonto(cuota.saldoPendiente), 400, tableY, { width: 100, align: 'left' });
                
                tableY += 15;
            });
            
            // Si hay más cuotas de las que mostramos
            if (prestamo.tablaAmortizacion.length > 20) {
                doc.text('...', 50, tableY);
                doc.text(`Nota: Se muestran las primeras 20 cuotas de un total de ${prestamo.tablaAmortizacion.length}.`, 
                         50, tableY + 15);
            }
            
            // Firmas
            doc.moveDown(4);
            doc.fontSize(12);
            doc.text('________________________', 100, doc.y, { width: 150, align: 'center' });
            doc.text('Firma del Cliente', 100, doc.y + 10, { width: 150, align: 'center' });
            
            doc.text('________________________', 350, doc.y - 12, { width: 150, align: 'center' });
            doc.text('Firma Autorizada', 350, doc.y + 10, { width: 150, align: 'center' });
            
            // Pie de página
            doc.fontSize(8);
            doc.text('ALFIN CASH - Préstamos personales', 50, 760, { align: 'center', width: 500 });
            doc.text('Este documento es un comprobante oficial.', 50, 770, { align: 'center', width: 500 });
            
            // Finalizar documento
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Generar recibo de pago
const generarPdfPago = (pago, prestamo, cliente) => {
    return new Promise((resolve, reject) => {
        try {
            // Crear documento PDF
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            
            // Recopilar chunks para generar buffer
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            // Encabezado
            doc.fontSize(20).text('ALFIN CASH', { align: 'center' });
            doc.fontSize(16).text('Recibo de Pago', { align: 'center' });
            doc.moveDown();
            
            // Logo SVG (versión sencilla)
            doc.save()
               .translate(doc.page.width / 2 - 40, 50)
               .scale(0.5)
               .path('M 50 20 L 90 20 L 100 40 L 40 40 Z')  // Forma simple de billete
               .fill('#4682B4')
               .restore();
            
            // Información del pago
            doc.fontSize(12).text(`Fecha de Pago: ${formatDate(pago.fechaPago)}`);
            doc.text(`No. de Pago: ${pago.pagoId}`);
            doc.text(`No. de Préstamo: ${pago.prestamoId}`);
            doc.moveDown();
            
            // Información del cliente
            doc.fontSize(14).text('Información del Cliente');
            doc.fontSize(12).text(`Nombre: ${cliente.nombreCompleto}`);
            doc.text(`Documento: ${cliente.tipoDocumento} - ${cliente.numeroDocumento}`);
            doc.moveDown();
            
            // Detalles del pago
            doc.fontSize(14).text('Detalles del Pago');
            doc.fontSize(12).text(`Número de Cuota: ${pago.numeroPago}`);
            doc.text(`Monto Pagado: ${formatMonto(pago.cantidadPagada)}`);
            doc.text(`Tipo de Pago: ${pago.tipoPago}`);
            doc.moveDown();
            
            // Desglose del pago
            doc.fontSize(14).text('Desglose del Pago');
            doc.fontSize(12);
            doc.text(`Abono a Capital: ${formatMonto(pago.abonoCapital)}`);
            doc.text(`Interés Pagado: ${formatMonto(pago.interesPagado)}`);
            doc.text(`Deuda Anterior: ${formatMonto(pago.deuda)}`);
            doc.text(`Deuda Restante: ${formatMonto(pago.deudaRestante)}`);
            doc.moveDown();
            
            // Resumen del préstamo
            doc.fontSize(14).text('Resumen del Préstamo');
            doc.fontSize(12);
            doc.text(`Monto Original: ${formatMonto(prestamo.cantidadPrestamo)}`);
            doc.text(`Tasa de Interés: ${prestamo.interesMensual}% mensual`);
            doc.text(`Plazo: ${prestamo.plazoMeses} meses`);
            
            // Cuotas pagadas
            const cuotasPagadas = prestamo.tablaAmortizacion.filter(c => c.pagado).length;
            const cuotasTotales = prestamo.tablaAmortizacion.length;
            doc.text(`Progreso: ${cuotasPagadas} de ${cuotasTotales} cuotas pagadas`);
            
            // Barra de progreso simple
            const barWidth = 400;
            const fillWidth = (cuotasPagadas / cuotasTotales) * barWidth;
            
            doc.rect(50, doc.y + 10, barWidth, 15).stroke();
            doc.rect(50, doc.y, fillWidth, 15).fill('#4682B4');
            doc.moveDown(2);
            
            // Firmas
            doc.moveDown(2);
            doc.fontSize(12);
            doc.text('________________________', 100, doc.y, { width: 150, align: 'center' });
            doc.text('Firma del Cliente', 100, doc.y + 10, { width: 150, align: 'center' });
            
            doc.text('________________________', 350, doc.y - 12, { width: 150, align: 'center' });
            doc.text('Firma Autorizada', 350, doc.y + 10, { width: 150, align: 'center' });
            
            // Pie de página
            doc.fontSize(8);
            doc.text('ALFIN CASH - Préstamos personales', 50, 760, { align: 'center', width: 500 });
            doc.text('Este documento es un comprobante oficial de pago.', 50, 770, { align: 'center', width: 500 });
            
            // Finalizar documento
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generarPdfPrestamo,
    generarPdfPago
};