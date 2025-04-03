/**
 * reportes-integration.js - Integración de módulos de reportes y exportación
 * 
 * Este script conecta las funcionalidades de generación de reportes
 * con las capacidades de exportación a Excel y PDF
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando integración de exportación para reportes...');
    
    // Verificar si estamos en la página de reportes
    const esReportesPage = window.location.href.includes('reportes') || 
                          document.getElementById('reportes')?.classList.contains('active');
    
    if (!esReportesPage) {
        console.log('No estamos en la página de reportes, omitiendo inicialización');
        return;
    }
    
    // Verificar y configurar botones de exportación
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    
    // Si ya existe el evento onClick, no volver a configurarlo
    if (btnExportarExcel && !btnExportarExcel._eventoConfigurado) {
        btnExportarExcel.addEventListener('click', function() {
            console.log('Iniciando exportación a Excel desde la integración...');
            exportarReporteActual('excel');
        });
        btnExportarExcel._eventoConfigurado = true;
    }
    
    if (btnExportarPDF && !btnExportarPDF._eventoConfigurado) {
        btnExportarPDF.addEventListener('click', function() {
            console.log('Iniciando exportación a PDF desde la integración...');
            exportarReporteActual('pdf');
        });
        btnExportarPDF._eventoConfigurado = true;
    }
    
    console.log('✅ Integración de exportación para reportes inicializada correctamente');
});

/**
 * Exporta el reporte actual en el formato especificado
 * @param {string} formato - Formato de exportación ('excel' o 'pdf')
 */
function exportarReporteActual(formato) {
    // Obtener tipo de reporte actual
    const tipoReporte = document.getElementById('tipoReporte')?.value || 'general';
    
    // Verificar si hay contenido para exportar
    const contenidoReporte = document.getElementById('reporteContenido');
    if (!contenidoReporte || contenidoReporte.children.length === 0) {
        console.warn('No hay contenido de reporte para exportar');
        showNotification('No hay datos para exportar', 'warning');
        return;
    }
    
    // Verificar si hay tablas para exportar (Excel necesita tablas)
    const hasTables = contenidoReporte.querySelectorAll('table').length > 0;
    if (formato === 'excel' && !hasTables) {
        showNotification('El reporte actual no contiene tablas para exportar a Excel', 'warning');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        showLoadingIndicator(`Exportando a ${formato === 'excel' ? 'Excel' : 'PDF'}...`);
        
        // Título del reporte para el archivo
        const tituloReporte = getTituloReporte(tipoReporte);
        
        // Obtener la fecha actual para el nombre del archivo
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `ALFIN_CASH_${tipoReporte}_${fechaActual}`;
        
        // Realizar la exportación según el formato
        if (formato === 'excel') {
            exportarAExcelConEstilo(contenidoReporte, tituloReporte, nombreArchivo);
        } else if (formato === 'pdf') {
            exportarAPDFConEstilo(contenidoReporte, tituloReporte, nombreArchivo);
        } else {
            throw new Error(`Formato de exportación no válido: ${formato}`);
        }
    } catch (error) {
        console.error(`Error al exportar a ${formato}:`, error);
        hideLoadingIndicator();
        showNotification(`Error al exportar: ${error.message}`, 'error');
    }
}

/**
 * Obtiene el título del reporte según su tipo
 * @param {string} tipoReporte - Tipo de reporte
 * @returns {string} - Título descriptivo
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
 * Exporta a Excel con formato mejorado
 */
function exportarAExcelConEstilo(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a Excel con estilo:', titulo);
    
    // Verificar si la biblioteca XLSX está disponible
    if (typeof XLSX === 'undefined') {
        throw new Error('La biblioteca XLSX no está disponible');
    }
    
    // Encontrar todas las tablas en el contenedor
    const tablas = contenedor.querySelectorAll('table');
    
    if (tablas.length === 0) {
        throw new Error('No hay tablas para exportar');
    }
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Agregar metadatos
    wb.Props = {
        Title: titulo,
        Subject: "Reportes ALFIN CASH",
        Author: "Sistema de Préstamos",
        CreatedDate: new Date()
    };
    
    // Para cada tabla, crear una hoja
    tablas.forEach((tabla, index) => {
        // Encontrar un título para la hoja
        let tituloHoja = 'Datos';
        
        // Buscar un encabezado cercano para usarlo como título de la hoja
        const encabezadoCercano = findClosestHeading(tabla);
        if (encabezadoCercano) {
            tituloHoja = encabezadoCercano.textContent.trim();
        } else if (index === 0) {
            // Si es la primera tabla, usar el título del reporte
            tituloHoja = titulo;
        } else {
            // Caso contrario, usar un nombre genérico
            tituloHoja = `Datos ${index + 1}`;
        }
        
        // Limitar longitud y eliminar caracteres no válidos para nombre de hoja
        tituloHoja = tituloHoja.replace(/[*?:/\\[\]]/g, '').substring(0, 31);
        
        // Convertir tabla a arreglo de datos
        const datos = tableToArray(tabla);
        
        // Crear hoja de trabajo desde los datos
        const ws = XLSX.utils.aoa_to_sheet(datos);
        
        // Aplicar estilos a la hoja (si es posible)
        applyExcelStyles(ws, datos);
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, tituloHoja);
    });
    
    // Guardar el archivo
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    
    // Ocultar indicador de carga
    hideLoadingIndicator();
    
    // Mostrar notificación de éxito
    showNotification('Reporte exportado a Excel correctamente', 'success');
}

/**
 * Exporta a PDF con formato mejorado
 */
function exportarAPDFConEstilo(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a PDF con estilo:', titulo);
    
    // Verificar si las bibliotecas necesarias están disponibles
    if (typeof html2canvas === 'undefined') {
        throw new Error('La biblioteca html2canvas no está disponible');
    }
    
    if (typeof jspdf === 'undefined') {
        throw new Error('La biblioteca jsPDF no está disponible');
    }
    
    // Crear una copia del contenido para manipularlo sin afectar la vista
    const contenidoClonado = contenedor.cloneNode(true);
    
    // Aplicar optimizaciones de estilo para PDF
    optimizarParaPDF(contenidoClonado);
    
    // Crear elemento para encabezado personalizado
    const encabezadoPersonalizado = document.createElement('div');
    encabezadoPersonalizado.innerHTML = `
        <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; margin-bottom: 20px;">
            <h2 style="color: #4682B4; margin: 0; padding: 0;">${titulo}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">ALFIN CASH - Portal de Préstamos</p>
        </div>
    `;
    
    // Insertar encabezado al principio del contenido clonado
    contenidoClonado.insertBefore(encabezadoPersonalizado, contenidoClonado.firstChild);
    
    // Crear elemento para pie de página personalizado
    const piePersonalizado = document.createElement('div');
    piePersonalizado.innerHTML = `
        <div style="text-align: center; padding: 15px; border-top: 1px solid #dee2e6; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
                Reporte generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
            </p>
        </div>
    `;
    
    // Insertar pie de página al final del contenido clonado
    contenidoClonado.appendChild(piePersonalizado);
    
    // Aplicar un ancho fijo para mejor apariencia en PDF
    contenidoClonado.style.width = '800px';
    contenidoClonado.style.maxWidth = '800px';
    contenidoClonado.style.margin = '0 auto';
    contenidoClonado.style.padding = '20px';
    contenidoClonado.style.backgroundColor = '#ffffff';
    
    // Agregar el clon temporalmente al DOM para la captura
    contenidoClonado.style.position = 'absolute';
    contenidoClonado.style.left = '-9999px';
    document.body.appendChild(contenidoClonado);
    
    // Capturar el contenido con html2canvas
    html2canvas(contenidoClonado, {
        scale: 1.5, // Mayor calidad
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        // Limpiar el elemento clonado del DOM
        document.body.removeChild(contenidoClonado);
        
        // Crear documento PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Obtener dimensiones
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular la relación de aspecto
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Ajustar imagen al ancho de la página con márgenes
        const margin = 10;
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
        
        // Agregar imagen al PDF
        let yPos = margin;
        
        // Si la imagen es más alta que la página, dividirla en múltiples páginas
        if (imgHeight > (pdfHeight - (margin * 2))) {
            // Calcular la altura de imagen que cabe en una página
            const pageImgHeight = pdfHeight - (margin * 2);
            
            // Calcular cuánto representa esto de la imagen original
            const pageCanvasHeight = (pageImgHeight * canvasWidth) / imgWidth;
            
            // Calcular el número de páginas necesarias
            const numPages = Math.ceil(canvasHeight / pageCanvasHeight);
            
            // Para cada página, agregar una porción de la imagen
            for (let i = 0; i < numPages; i++) {
                // Si no es la primera página, agregar una página nueva
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Calcular qué porción de la imagen mostrar
                const srcY = i * pageCanvasHeight;
                let height = pageCanvasHeight;
                
                // Si es la última página, ajustar la altura
                if (i === numPages - 1) {
                    height = canvasHeight - srcY;
                }
                
                // Agregar la porción de imagen
                pdf.addImage(
                    imgData, 
                    'JPEG', 
                    margin, 
                    margin, 
                    imgWidth, 
                    (height * imgWidth) / canvasWidth,
                    null,
                    'MEDIUM',
                    0,
                    srcY,
                    canvasWidth,
                    height
                );
                
                // Agregar numeración de página
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Página ${i + 1} de ${numPages}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
            }
        } else {
            // Si la imagen cabe en una página, agregarla directamente
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        }
        
        // Guardar el PDF
        pdf.save(`${nombreArchivo}.pdf`);
        
        // Ocultar indicador de carga
        hideLoadingIndicator();
        
        // Mostrar notificación de éxito
        showNotification('Reporte exportado a PDF correctamente', 'success');
    }).catch(error => {
        console.error('Error al generar el PDF:', error);
        hideLoadingIndicator();
        showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
    });
}

/**
 * Convierte una tabla HTML en un array de arrays
 */
function tableToArray(table) {
    const result = [];
    
    // Obtener todas las filas
    const rows = table.querySelectorAll('tr');
    
    // Procesar cada fila
    rows.forEach(row => {
        const rowData = [];
        
        // Obtener celdas (pueden ser th o td)
        const cells = row.querySelectorAll('th, td');
        
        // Procesar cada celda
        cells.forEach(cell => {
            // Obtener el texto limpio de la celda
            let valor = cell.innerText.trim();
            
            // Si hay un colspan, repetir el valor
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            
            // Intentar convertir a número si parece un valor numérico
            if (/^[+-]?\d+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor);
            }
            
            // Si parece ser un valor monetario, extraer el número
            if (/^\$[\d,]+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor.replace(/[$,]/g, ''));
            }
            
            // Agregar el valor (repetido si hay colspan)
            for (let i = 0; i < colspan; i++) {
                rowData.push(valor);
            }
        });
        
        if (rowData.length > 0) {
            result.push(rowData);
        }
    });
    
    return result;
}

/**
 * Aplica estilos a una hoja de Excel (si es posible)
 */
function applyExcelStyles(worksheet, data) {
    // Esta función es un placeholder ya que las opciones de estilo
    // dependen de la versión específica de la biblioteca XLSX
    
    // En una implementación completa, aquí se definirían:
    // - Anchos de columna
    // - Estilos de celda (negrita, color, etc.)
    // - Formatos de número (moneda, fecha, etc.)
    
    // Por ahora, solo ajustamos el ancho de columna
    const colWidths = [];
    
    // Calcular ancho basado en el contenido
    if (data.length > 0) {
        // Inicializar con la longitud de la primera fila
        for (let i = 0; i < data[0].length; i++) {
            colWidths[i] = 10; // Ancho mínimo
        }
        
        // Ajustar según contenido
        data.forEach(row => {
            row.forEach((cell, i) => {
                if (cell !== null && cell !== undefined) {
                    const length = String(cell).length;
                    colWidths[i] = Math.max(colWidths[i], Math.min(50, length + 2)); // Máximo 50 caracteres
                }
            });
        });
        
        // Intentar aplicar los anchos (depende de la versión de XLSX)
        if (worksheet['!cols'] === undefined) {
            worksheet['!cols'] = [];
        }
        
        colWidths.forEach((width, i) => {
            worksheet['!cols'][i] = { wch: width };
        });
    }
}

/**
 * Aplica optimizaciones al contenido para mejorar su apariencia en PDF
 */
function optimizarParaPDF(contenido) {
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
        
        // Estilizar filas alternas para mejor legibilidad
        const filas = tabla.querySelectorAll('tbody tr');
        filas.forEach((fila, index) => {
            if (index % 2 === 1) {
                fila.style.backgroundColor = '#f9f9f9';
            }
        });
    });
    
    // Mejorar apariencia de títulos
    const titulos = contenido.querySelectorAll('h1, h2, h3, h4, h5, h6');
    titulos.forEach(titulo => {
        titulo.style.color = '#495057';
        titulo.style.marginBottom = '15px';
        titulo.style.pageBreakAfter = 'avoid';
    });
    
    // Mejorar apariencia de alertas
    const alertas = contenido.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        alerta.style.padding = '15px';
        alerta.style.marginBottom = '20px';
        alerta.style.border = '1px solid transparent';
        alerta.style.borderRadius = '5px';
        
        // Ajustar colores según el tipo de alerta
        if (alerta.classList.contains('alert-info')) {
            alerta.style.backgroundColor = '#d1ecf1';
            alerta.style.borderColor = '#bee5eb';
            alerta.style.color = '#0c5460';
        } else if (alerta.classList.contains('alert-warning')) {
            alerta.style.backgroundColor = '#fff3cd';
            alerta.style.borderColor = '#ffeeba';
            alerta.style.color = '#856404';
        } else if (alerta.classList.contains('alert-danger')) {
            alerta.style.backgroundColor = '#f8d7da';
            alerta.style.borderColor = '#f5c6cb';
            alerta.style.color = '#721c24';
        } else if (alerta.classList.contains('alert-success')) {
            alerta.style.backgroundColor = '#d4edda';
            alerta.style.borderColor = '#c3e6cb';
            alerta.style.color = '#155724';
        }
    });
    
    // Ocultar botones u otros elementos interactivos
    const elementos = contenido.querySelectorAll('button, .btn, input[type="button"]');
    elementos.forEach(elemento => {
        elemento.style.display = 'none';
    });
    
    // Mejorar apariencia de badges
    const badges = contenido.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.style.display = 'inline-block';
        badge.style.padding = '5px 8px';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.textAlign = 'center';
        badge.style.whiteSpace = 'nowrap';
        badge.style.borderRadius = '10px';
        
        // Ajustar colores según el tipo de badge
        if (badge.classList.contains('bg-success')) {
            badge.style.backgroundColor = '#28a745';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-danger')) {
            badge.style.backgroundColor = '#dc3545';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-warning')) {
            badge.style.backgroundColor = '#ffc107';
            badge.style.color = 'black';
        } else if (badge.classList.contains('bg-info')) {
            badge.style.backgroundColor = '#17a2b8';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-primary')) {
            badge.style.backgroundColor = '#007bff';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-secondary')) {
            badge.style.backgroundColor = '#6c757d';
            badge.style.color = 'white';
        }
    });
}

/**
 * Encuentra el encabezado más cercano a un elemento
 */
function findClosestHeading(element) {
    // Buscar encabezados por encima del elemento
    let current = element;
    
    // Buscar entre hermanos anteriores
    while (current.previousElementSibling) {
        current = current.previousElementSibling;
        
        if (isHeading(current)) {
            return current;
        }
        
        // Buscar también dentro de contenedores
        const headingInside = current.querySelector('h1, h2, h3, h4, h5, h6');
        if (headingInside) {
            return headingInside;
        }
    }
    
    // Buscar en el padre
    if (element.parentElement) {
        // Primero buscar encabezados dentro del mismo padre
        const parentHeading = element.parentElement.querySelector('h1, h2, h3, h4, h5, h6');
        if (parentHeading && element.parentElement.contains(parentHeading) && 
            !element.contains(parentHeading)) {
            return parentHeading;
        }
        
        // Luego buscar arriba en la jerarquía
        return findClosestHeading(element.parentElement);
    }
    
    // Si no se encuentra nada, buscar cualquier encabezado en el contenedor del reporte
    const reporteContenido = document.getElementById('reporteContenido');
    if (reporteContenido) {
        return reporteContenido.querySelector('h1, h2, h3, h4, h5, h6');
    }
    
    return null;
}

/**
 * Verifica si un elemento es un encabezado
 */
function isHeading(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
}

/**
 * Muestra un indicador de carga durante la exportación
 */
function showLoadingIndicator(message) {
    // Verificar si existe la función global
    if (typeof window.showLoadingIndicator === 'function') {
        window.showLoadingIndicator(message);
        return;
    }
    
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
    // Verificar si existe la función global
    if (typeof window.hideLoadingIndicator === 'function') {
        window.hideLoadingIndicator();
        return;
    }
    
    const loadingIndicator = document.getElementById('exportLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
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

// Exportar función global para iniciar la exportación manualmente
window.exportarReporteActual = exportarReporteActual;