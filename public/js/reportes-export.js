/**
 * reportes-export.js - Funcionalidad de exportación para el módulo de reportes
 * 
 * Este script implementa las funciones para exportar reportes a Excel y PDF
 * utilizando las bibliotecas xlsx.js y jsPDF con html2canvas
 */

// Funciones principales de exportación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando funcionalidad de exportación para reportes...');
    
    // Configurar botones de exportación
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', exportarAExcel);
    }
    
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarAPDF);
    }
});

/**
 * Exporta el reporte actual a formato Excel
 */
function exportarAExcel() {
    console.log('Iniciando exportación a Excel...');
    
    try {
        // Verificar si la biblioteca XLSX está disponible
        if (typeof XLSX === 'undefined') {
            showNotification('Error: La biblioteca XLSX no está disponible', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        showLoadingIndicator('Exportando a Excel...');
        
        // Obtener el tipo de reporte actual
        const tipoReporte = document.getElementById('tipoReporte').value;
        
        // Obtener el contenido del reporte
        const reporteContenido = document.getElementById('reporteContenido');
        
        // Obtener todas las tablas en el reporte
        const tablas = reporteContenido.querySelectorAll('table');
        
        if (tablas.length === 0) {
            showNotification('No hay datos para exportar', 'warning');
            hideLoadingIndicator();
            return;
        }
        
        // Crear un libro de trabajo
        const workbook = XLSX.utils.book_new();
        
        // Procesar cada tabla en el reporte
        tablas.forEach((tabla, index) => {
            // Convertir tabla HTML a un objeto de hoja de trabajo
            const worksheet = htmlTableToWorksheet(tabla);
            
            // Definir nombre de la hoja
            let sheetName = `Reporte ${index + 1}`;
            
            // Si es la primera tabla, intentar obtener un nombre más descriptivo
            if (index === 0) {
                const tituloReporte = getTituloReporte(tipoReporte);
                if (tituloReporte) {
                    sheetName = tituloReporte.replace(/[*?:/\\]/g, '_'); // Eliminar caracteres no válidos
                }
            }
            
            // Limitar longitud del nombre de la hoja a 31 caracteres (límite de Excel)
            sheetName = sheetName.substring(0, 31);
            
            // Agregar la hoja al libro de trabajo
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });
        
        // Generar nombre de archivo
        const fechaActual = new Date().toISOString().split('T')[0];
        const fileName = `ALFIN_CASH_${tipoReporte}_${fechaActual}.xlsx`;
        
        // Descargar el archivo
        XLSX.writeFile(workbook, fileName);
        
        // Ocultar indicador de carga
        hideLoadingIndicator();
        
        // Mostrar notificación de éxito
        showNotification('Reporte exportado a Excel correctamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        hideLoadingIndicator();
        showNotification(`Error al exportar a Excel: ${error.message}`, 'error');
    }
}

/**
 * Exporta el reporte actual a formato PDF
 */
function exportarAPDF() {
    console.log('Iniciando exportación a PDF...');
    
    try {
        // Verificar si las bibliotecas necesarias están disponibles
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            showNotification('Error: Las bibliotecas necesarias no están disponibles', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        showLoadingIndicator('Exportando a PDF...');
        
        // Obtener el tipo de reporte actual
        const tipoReporte = document.getElementById('tipoReporte').value;
        
        // Obtener el contenido del reporte
        const reporteContenido = document.getElementById('reporteContenido');
        
        if (!reporteContenido || reporteContenido.children.length === 0) {
            showNotification('No hay datos para exportar', 'warning');
            hideLoadingIndicator();
            return;
        }
        
        // Crear una copia del contenido para manipularlo sin afectar la vista
        const contenidoClonado = reporteContenido.cloneNode(true);
        
        // Aplicar estilos para optimizar la exportación a PDF
        optimizarParaPDF(contenidoClonado);
        
        // Agregar temporalmente el clon al documento para la captura
        contenidoClonado.style.position = 'absolute';
        contenidoClonado.style.left = '-9999px';
        document.body.appendChild(contenidoClonado);
        
        // Obtener el título del reporte
        const tituloReporte = getTituloReporte(tipoReporte);
        
        // Usar html2canvas para convertir el contenido a una imagen
        html2canvas(contenidoClonado, {
            scale: 1.5, // Mayor calidad
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Limpiar el elemento clonado
            document.body.removeChild(contenidoClonado);
            
            // Determinar la orientación según el ancho/alto
            const esPaisaje = canvas.width > canvas.height;
            
            // Crear nuevo documento PDF con orientación adecuada
            const pdf = new jspdf.jsPDF({
                orientation: esPaisaje ? 'landscape' : 'portrait',
                unit: 'mm'
            });
            
            // Obtener dimensiones de la página
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calcular la escala para ajustar el contenido a la página
            let imgWidth = pdfWidth - 20; // Margen de 10mm a cada lado
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Verificar si la altura excede la página y ajustar
            if (imgHeight > pdfHeight - 40) { // 40mm para márgenes y encabezado/pie
                imgHeight = pdfHeight - 40;
                imgWidth = (canvas.width * imgHeight) / canvas.height;
            }
            
            // Convertir canvas a imagen
            const imgData = canvas.toDataURL('image/png');
            
            // Agregar encabezado
            pdf.setFontSize(16);
            pdf.setTextColor(0, 51, 102); // Azul corporativo
            pdf.text('ALFIN CASH - Sistema de Préstamos', pdfWidth / 2, 15, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.text(tituloReporte, pdfWidth / 2, 25, { align: 'center' });
            
            // Agregar la imagen al PDF (centrada)
            const xPos = (pdfWidth - imgWidth) / 2;
            pdf.addImage(imgData, 'PNG', xPos, 35, imgWidth, imgHeight);
            
            // Agregar pie de página
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100); // Gris
            
            const fechaActual = new Date().toLocaleDateString();
            pdf.text(`Generado el ${fechaActual}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
            pdf.text('ALFIN CASH', 15, pdfHeight - 10, { align: 'left' });
            
            // Generar nombre de archivo
            const fileName = `ALFIN_CASH_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Guardar el PDF
            pdf.save(fileName);
            
            // Ocultar indicador de carga
            hideLoadingIndicator();
            
            // Mostrar notificación de éxito
            showNotification('Reporte exportado a PDF correctamente', 'success');
        }).catch(error => {
            console.error('Error al generar PDF:', error);
            document.body.removeChild(contenidoClonado);
            hideLoadingIndicator();
            showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
        });
        
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        hideLoadingIndicator();
        showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
    }
}

/**
 * Convierte una tabla HTML a un objeto de hoja de trabajo de Excel
 */
function htmlTableToWorksheet(table) {
    // Obtener todas las filas de la tabla
    const rows = table.querySelectorAll('tr');
    const data = [];
    
    // Procesar cada fila
    rows.forEach(row => {
        const rowData = [];
        
        // Obtener celdas (pueden ser th o td)
        const cells = row.querySelectorAll('th, td');
        
        // Procesar cada celda
        cells.forEach(cell => {
            // Obtener el texto limpio de la celda
            let valor = cell.innerText.trim();
            
            // Intentar convertir a número si parece un valor numérico
            if (/^[+-]?\d+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor);
            }
            
            // Si parece ser un valor monetario, extraer el número
            if (/^\$[\d,]+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor.replace(/[$,]/g, ''));
            }
            
            rowData.push(valor);
        });
        
        if (rowData.length > 0) {
            data.push(rowData);
        }
    });
    
    // Verificar si hay datos para procesar
    if (data.length === 0) {
        throw new Error('La tabla no contiene datos para exportar');
    }
    
    // Crear hoja de trabajo
    return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Aplica optimizaciones al contenido del reporte para mejorar la exportación a PDF
 */
function optimizarParaPDF(contenido) {
    // Establecer un ancho máximo para mejorar la legibilidad
    contenido.style.width = '800px';
    contenido.style.maxWidth = '800px';
    contenido.style.margin = '0 auto';
    contenido.style.padding = '15px';
    contenido.style.backgroundColor = '#ffffff';
    contenido.style.color = '#333333';
    
    // Mejorar la apariencia de las tablas
    const tablas = contenido.querySelectorAll('table');
    tablas.forEach(tabla => {
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        tabla.style.marginBottom = '20px';
        tabla.style.fontSize = '12px';
        
        // Estilizar celdas
        const celdas = tabla.querySelectorAll('th, td');
        celdas.forEach(celda => {
            celda.style.border = '1px solid #dee2e6';
            celda.style.padding = '8px';
            celda.style.textAlign = celda.style.textAlign || 'left';
        });
        
        // Estilizar encabezados
        const encabezados = tabla.querySelectorAll('th');
        encabezados.forEach(encabezado => {
            encabezado.style.backgroundColor = '#f8f9fa';
            encabezado.style.borderBottom = '2px solid #dee2e6';
            encabezado.style.fontWeight = 'bold';
        });
    });
    
    // Mejorar apariencia de gráficos si existen
    const canvas = contenido.querySelectorAll('canvas');
    canvas.forEach(canv => {
        canv.style.maxWidth = '100%';
        canv.style.height = 'auto';
        canv.style.marginBottom = '20px';
        canv.style.border = '1px solid #dee2e6';
    });
    
    // Ocultar botones u otros elementos interactivos que no son necesarios en el PDF
    const botones = contenido.querySelectorAll('button');
    botones.forEach(boton => {
        boton.style.display = 'none';
    });
    
    // Mejorar apariencia de títulos
    const titulos = contenido.querySelectorAll('h1, h2, h3, h4, h5, h6');
    titulos.forEach(titulo => {
        titulo.style.color = '#495057';
        titulo.style.marginBottom = '15px';
        titulo.style.pageBreakAfter = 'avoid'; // Evitar saltos de página después de títulos
    });
}

/**
 * Muestra un indicador de carga durante la exportación
 */
function showLoadingIndicator(message) {
    // Verificar si ya existe un indicador
    let loadingIndicator = document.getElementById('exportLoadingIndicator');
    
    if (!loadingIndicator) {
        // Crear elemento de indicador
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'exportLoadingIndicator';
        loadingIndicator.className = 'loading-overlay';
        loadingIndicator.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="loading-message mt-2">${message || 'Procesando...'}</p>
            </div>
        `;
        
        // Agregar estilos
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.zIndex = '9999';
        
        // Estilos para el contenido
        const loadingContent = loadingIndicator.querySelector('.loading-content');
        loadingContent.style.backgroundColor = '#ffffff';
        loadingContent.style.padding = '20px 30px';
        loadingContent.style.borderRadius = '5px';
        loadingContent.style.textAlign = 'center';
        loadingContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        
        // Agregar al DOM
        document.body.appendChild(loadingIndicator);
    } else {
        // Actualizar mensaje si ya existe
        const messageElement = loadingIndicator.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message || 'Procesando...';
        }
        
        // Mostrar indicador
        loadingIndicator.style.display = 'flex';
    }
}

/**
 * Oculta el indicador de carga
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('exportLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Obtiene un título descriptivo para el reporte según su tipo
 */
function getTituloReporte(tipoReporte) {
    const titulos = {
        'general': 'Reporte General',
        'prestamos_mes': 'Préstamos por Mes',
        'pagos_mes': 'Pagos por Mes',
        'clientes_activos': 'Clientes Activos',
        'prestamos_monto': 'Préstamos por Monto',
        'prestamos_vencidos': 'Préstamos Vencidos'
    };
    
    return titulos[tipoReporte] || `Reporte - ${tipoReporte}`;
}

/**
 * Muestra una notificación en la interfaz
 */
function showNotification(message, type = 'info') {
    // Verificar si existe la función global
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Implementación alternativa si no existe la función global
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
        <div class="toast-header">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' || type === 'danger' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <strong class="me-auto">ALFIN CASH</strong>
            <button type="button" class="btn-close" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Agregar estilos
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.width = '350px';
    notification.style.backgroundColor = '#fff';
    notification.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
    notification.style.borderRadius = '0.25rem';
    notification.style.zIndex = '1050';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease';
    
    // Estilo por tipo
    if (type === 'success') {
        notification.style.borderLeft = '4px solid #28a745';
    } else if (type === 'error' || type === 'danger') {
        notification.style.borderLeft = '4px solid #dc3545';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid #ffc107';
    } else {
        notification.style.borderLeft = '4px solid #17a2b8';
    }
    
    // Agregar al cuerpo del documento
    document.body.appendChild(notification);
    
    // Configurar botón de cierre
    const closeBtn = notification.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Mostrar con animación
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        // Eliminar del DOM después de la animación
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}