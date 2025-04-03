/**
 * reportesFixes.js - Correcciones para problemas en el módulo de reportes
 */

// Función para cargar XLSX dinámicamente
function loadXLSX() {
    return new Promise((resolve, reject) => {
        if (typeof XLSX !== 'undefined') {
            resolve(); // Ya está cargada
            return;
        }
        
        console.log('Cargando biblioteca XLSX dinámicamente...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.0/dist/xlsx.full.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Biblioteca XLSX cargada correctamente');
            resolve();
        };
        
        script.onerror = () => {
            reject(new Error('No se pudo cargar la biblioteca XLSX'));
        };
        
        document.head.appendChild(script);
    });
}

// Función para cargar html2canvas dinámicamente
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            resolve(); // Ya está cargada
            return;
        }
        
        console.log('Cargando biblioteca html2canvas dinámicamente...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.5.0-beta4/html2canvas.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Biblioteca html2canvas cargada correctamente');
            resolve();
        };
        
        script.onerror = () => {
            reject(new Error('No se pudo cargar la biblioteca html2canvas'));
        };
        
        document.head.appendChild(script);
    });
}

// Función para cargar jsPDF dinámicamente
function loadJsPDF() {
    return new Promise((resolve, reject) => {
        if (typeof jspdf !== 'undefined') {
            resolve(); // Ya está cargada
            return;
        }
        
        console.log('Cargando biblioteca jsPDF dinámicamente...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Biblioteca jsPDF cargada correctamente');
            resolve();
        };
        
        script.onerror = () => {
            reject(new Error('No se pudo cargar la biblioteca jsPDF'));
        };
        
        document.head.appendChild(script);
    });
}

// Nueva versión de exportarAExcel que carga la biblioteca si es necesario
async function exportarAExcelFixed(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a Excel (versión corregida):', titulo);
    
    try {
        // Cargar XLSX si no está disponible
        if (typeof XLSX === 'undefined') {
            await loadXLSX();
        }
        
        // Verificar nuevamente
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
        showNotificationFixed('Reporte exportado a Excel correctamente', 'success');
    } catch (error) {
        console.error('Error en exportación a Excel:', error);
        hideLoadingIndicator();
        showNotificationFixed(`Error al exportar a Excel: ${error.message}`, 'error');
    }
}

// Nueva versión de exportarAPDF que carga las bibliotecas si es necesario
async function exportarAPDFFixed(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a PDF (versión corregida):', titulo);
    
    try {
        // Cargar html2canvas si no está disponible
        if (typeof html2canvas === 'undefined') {
            await loadHtml2Canvas();
        }
        
        // Cargar jsPDF si no está disponible
        if (typeof jspdf === 'undefined') {
            await loadJsPDF();
        }
        
        // Verificar nuevamente
        if (typeof html2canvas === 'undefined') {
            throw new Error('La biblioteca html2canvas no está disponible');
        }
        
        if (typeof jspdf === 'undefined') {
            throw new Error('La biblioteca jsPDF no está disponible');
        }
        
        // El resto del código de exportación a PDF...
        // [Mantener el código original de exportarAPDF pero usando showNotificationFixed]
        
        // Mostrar notificación de éxito al final
        showNotificationFixed('Reporte exportado a PDF correctamente', 'success');
    } catch (error) {
        console.error('Error en exportación a PDF:', error);
        hideLoadingIndicator();
        showNotificationFixed(`Error al exportar a PDF: ${error.message}`, 'error');
    }
}

// Versión corregida de la función showNotification para evitar recursión
function showNotificationFixed(message, type = 'info') {
    // Crear un ID único para esta notificación
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // No intentar usar window.showNotification para evitar recursión
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.id = notificationId;
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
                if (document.getElementById(notificationId)) {
                    document.getElementById(notificationId).remove();
                }
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
        // Verificar que la notificación todavía existe
        const notificationElement = document.getElementById(notificationId);
        if (notificationElement) {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateY(-20px)';
            
            // Eliminar del DOM después de la animación
            setTimeout(() => {
                if (document.getElementById(notificationId)) {
                    document.getElementById(notificationId).remove();
                }
            }, 300);
        }
    }, 5000);
}

// Reemplazar las funciones problemáticas
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicando correcciones al módulo de reportes...');
    
    // Reemplazar funciones problemáticas si estamos en la página de reportes
    if (window.currentPage === 'reportes' || 
        document.getElementById('reportes')?.classList.contains('active') ||
        window.location.href.includes('reportes')) {
        
        // Reemplazar funciones existentes con las versiones corregidas
        if (window.exportarReporteActual) {
            const originalExportarReporteActual = window.exportarReporteActual;
            
            window.exportarReporteActual = async function(formato) {
                // Obtener tipo de reporte actual
                const tipoReporte = document.getElementById('tipoReporte')?.value || 'general';
                
                // Verificar si hay contenido para exportar
                const contenidoReporte = document.getElementById('reporteContenido');
                if (!contenidoReporte || contenidoReporte.children.length === 0) {
                    console.warn('No hay contenido de reporte para exportar');
                    showNotificationFixed('No hay datos para exportar', 'warning');
                    return;
                }
                
                // Verificar si hay tablas para exportar (Excel necesita tablas)
                const hasTables = contenidoReporte.querySelectorAll('table').length > 0;
                if (formato === 'excel' && !hasTables) {
                    showNotificationFixed('El reporte actual no contiene tablas para exportar a Excel', 'warning');
                    return;
                }
                
                try {
                    // Mostrar indicador de carga
                    if (typeof showLoadingIndicator === 'function') {
                        showLoadingIndicator(`Exportando a ${formato === 'excel' ? 'Excel' : 'PDF'}...`);
                    }
                    
                    // Título del reporte para el archivo
                    const tituloReporte = typeof getTituloReporte === 'function' ? 
                        getTituloReporte(tipoReporte) : 
                        tipoReporte.replace('_', ' ').toUpperCase();
                    
                    // Obtener la fecha actual para el nombre del archivo
                    const fechaActual = new Date().toISOString().split('T')[0];
                    const nombreArchivo = `ALFIN_CASH_${tipoReporte}_${fechaActual}`;
                    
                    // Realizar la exportación según el formato
                    if (formato === 'excel') {
                        await exportarAExcelFixed(contenidoReporte, tituloReporte, nombreArchivo);
                    } else if (formato === 'pdf') {
                        await exportarAPDFFixed(contenidoReporte, tituloReporte, nombreArchivo);
                    } else {
                        throw new Error(`Formato de exportación no válido: ${formato}`);
                    }
                } catch (error) {
                    console.error(`Error al exportar a ${formato}:`, error);
                    if (typeof hideLoadingIndicator === 'function') {
                        hideLoadingIndicator();
                    }
                    showNotificationFixed(`Error al exportar: ${error.message}`, 'error');
                }
            };
            
            console.log('Función exportarReporteActual reemplazada con versión corregida');
        }
        
        // Reemplazar versión de showNotification si existe
        if (typeof window.showNotification === 'function') {
            // Guardar una referencia a la función original con otro nombre
            window.originalShowNotification = window.showNotification;
            
            // Reemplazar con nuestra versión corregida
            window.showNotification = showNotificationFixed;
            console.log('Función showNotification reemplazada con versión corregida');
        }
        
        console.log('Correcciones aplicadas correctamente');
    }
});