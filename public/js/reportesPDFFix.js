/**
 * reportesPDFFix.js - Arregla problemas específicos de exportación a PDF
 */

// Función para cargar dom-to-image (alternativa a html2canvas)
function loadDomToImage() {
    return new Promise((resolve, reject) => {
        if (typeof domtoimage !== 'undefined') {
            resolve(); // Ya está cargada
            return;
        }
        
        console.log('Cargando biblioteca dom-to-image dinámicamente...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Biblioteca dom-to-image cargada correctamente');
            resolve();
        };
        
        script.onerror = () => {
            reject(new Error('No se pudo cargar la biblioteca dom-to-image'));
        };
        
        document.head.appendChild(script);
    });
}

// Función que preparará el contenido para la exportación a PDF
function prepararParaPDF(contenedor) {
    console.log('Preparando contenido para PDF...');
    
    // Establecer fondo blanco y texto negro en todo el contenedor
    contenedor.style.backgroundColor = '#ffffff';
    contenedor.style.color = '#000000';
    contenedor.style.padding = '20px';
    
    // Aplicar a todos los elementos dentro
    const elementos = contenedor.querySelectorAll('*');
    elementos.forEach(elemento => {
        // Asegurar que los fondos transparentes se muestren como blancos
        const estiloComputado = window.getComputedStyle(elemento);
        if (estiloComputado.backgroundColor === 'transparent' || 
            estiloComputado.backgroundColor === 'rgba(0, 0, 0, 0)') {
            elemento.style.backgroundColor = 'white';
        }
        
        // Si el color del texto es muy claro o no está definido, establecer a negro
        if (!estiloComputado.color || estiloComputado.color === 'inherit') {
            elemento.style.color = '#000000';
        }
    });
    
    // Mejorar la apariencia de las tablas
    const tablas = contenedor.querySelectorAll('table');
    tablas.forEach(tabla => {
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        tabla.style.marginBottom = '20px';
        tabla.style.fontSize = '12px';
        
        // Estilizar celdas
        const celdas = tabla.querySelectorAll('th, td');
        celdas.forEach(celda => {
            celda.style.border = '1px solid #000';  // Borde negro para mejor visibilidad
            celda.style.padding = '8px';
            celda.style.textAlign = celda.style.textAlign || 'left';
            celda.style.backgroundColor = '#ffffff'; // Fondo blanco explícito
            celda.style.color = '#000000'; // Texto negro explícito
        });
        
        // Estilizar encabezados
        const encabezados = tabla.querySelectorAll('th');
        encabezados.forEach(encabezado => {
            encabezado.style.backgroundColor = '#f8f9fa';
            encabezado.style.borderBottom = '2px solid #000';
            encabezado.style.fontWeight = 'bold';
            encabezado.style.color = '#000000';
        });
    });
    
    // Mejorar apariencia de badges y elementos coloreados
    const badges = contenedor.querySelectorAll('.badge, .btn, .alert');
    badges.forEach(badge => {
        // Añadir contorno negro para mejorar visibilidad
        badge.style.border = '1px solid #000';
        
        // Asegurar que el color de texto contraste bien
        const bgColor = window.getComputedStyle(badge).backgroundColor;
        if (bgColor) {
            const rgb = bgColor.match(/\d+/g);
            if (rgb) {
                // Calcular luminosidad (fórmula simple)
                const luminance = (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114) / 255;
                
                // Si el fondo es oscuro, texto blanco; si es claro, texto negro
                badge.style.color = luminance > 0.5 ? '#000000' : '#ffffff';
            }
        }
    });
    
    // Asegurar que los alerts tengan colores apropiados
    const alertas = contenedor.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        if (alerta.classList.contains('alert-success')) {
            alerta.style.backgroundColor = '#d4edda';
            alerta.style.borderColor = '#c3e6cb';
            alerta.style.color = '#155724';
        } else if (alerta.classList.contains('alert-danger')) {
            alerta.style.backgroundColor = '#f8d7da';
            alerta.style.borderColor = '#f5c6cb';
            alerta.style.color = '#721c24';
        } else if (alerta.classList.contains('alert-warning')) {
            alerta.style.backgroundColor = '#fff3cd';
            alerta.style.borderColor = '#ffeeba';
            alerta.style.color = '#856404';
        } else if (alerta.classList.contains('alert-info')) {
            alerta.style.backgroundColor = '#d1ecf1';
            alerta.style.borderColor = '#bee5eb';
            alerta.style.color = '#0c5460';
        } else {
            alerta.style.backgroundColor = '#f8f9fa';
            alerta.style.borderColor = '#d6d8db';
            alerta.style.color = '#383d41';
        }
    });
    
    return contenedor;
}

// Implementación alternativa de exportación a PDF usando dom-to-image
async function exportarAPDFMejorado(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a PDF (método mejorado):', titulo);
    
    try {
        // Cargar dom-to-image como alternativa más confiable
        await loadDomToImage();
        
        // Cargar jsPDF si no está disponible
        if (typeof jspdf === 'undefined') {
            if (typeof loadJsPDF === 'function') {
                await loadJsPDF();
            } else {
                throw new Error('La biblioteca jsPDF no está disponible');
            }
        }
        
        // Verificar que las bibliotecas estén disponibles
        if (typeof domtoimage === 'undefined') {
            throw new Error('La biblioteca dom-to-image no está disponible');
        }
        
        if (typeof jspdf === 'undefined') {
            throw new Error('La biblioteca jsPDF no está disponible');
        }
        
        // Mostrar indicador de carga
        if (typeof showLoadingIndicator === 'function') {
            showLoadingIndicator('Generando PDF, puede tardar unos segundos...');
        } else if (typeof showNotificationFixed === 'function') {
            showNotificationFixed('Generando PDF, puede tardar unos segundos...', 'info');
        } else {
            alert('Generando PDF, por favor espere...');
        }
        
        // Clonar contenido y aplicar estilos
        const contenidoClonado = contenedor.cloneNode(true);
        
        // Aplicar estilos para optimizar visualización en PDF
        if (typeof optimizarParaPDF === 'function') {
            optimizarParaPDF(contenidoClonado);
        }
        
        // Preparar contenido específicamente para solucionar problema de negro
        prepararParaPDF(contenidoClonado);
        
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
        contenidoClonado.style.backgroundColor = '#ffffff';
        contenidoClonado.style.color = '#000000';
        
        // Asegurar que los fondos sean explícitamente blancos
        contenidoClonado.querySelectorAll('*').forEach(el => {
            const computed = window.getComputedStyle(el);
            if (computed.backgroundColor === 'rgba(0, 0, 0, 0)' || computed.backgroundColor === 'transparent') {
                el.style.backgroundColor = '#ffffff';
            }
        });
        
        // Agregar el clon temporalmente al DOM para la captura
        contenidoClonado.style.position = 'absolute';
        contenidoClonado.style.left = '-9999px';
        document.body.appendChild(contenidoClonado);
        
        // Usar dom-to-image para capturar (más confiable que html2canvas para fondos)
        domtoimage.toPng(contenidoClonado, {
            bgcolor: '#ffffff', // Color de fondo explícito
            style: {
                'transform': 'scale(1)',
                'transform-origin': 'top left',
            }
        })
        .then(function(dataUrl) {
            // Limpiar el elemento clonado del DOM
            document.body.removeChild(contenidoClonado);
            
            // Crear documento PDF
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Obtener dimensiones
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Crear imagen a partir del dataUrl
            const img = new Image();
            img.src = dataUrl;
            
            img.onload = function() {
                // Calcular dimensiones para ajustar a la página
                const margin = 10; // 10mm de margen
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (img.height * imgWidth) / img.width;
                
                // Para imágenes más altas que la página, dividir en varias
                if (imgHeight > (pdfHeight - (margin * 2))) {
                    // Calcular número de páginas
                    const pageHeight = pdfHeight - (margin * 2);
                    const pageCount = Math.ceil(imgHeight / pageHeight);
                    let heightLeft = imgHeight;
                    let position = 0;
                    
                    // Generar cada página
                    for (let i = 0; i < pageCount; i++) {
                        if (i > 0) {
                            pdf.addPage();
                        }
                        
                        // Calcular altura de esta porción
                        const heightToDraw = Math.min(pageHeight, heightLeft);
                        const scaleFactor = img.width / imgWidth;
                        
                        // Calcular posición de origen en la imagen
                        const sourceY = position * scaleFactor;
                        const sourceHeight = heightToDraw * scaleFactor;
                        
                        // Dibujar porción correspondiente
                        pdf.addImage(
                            img, 
                            'PNG', 
                            margin, 
                            margin, 
                            imgWidth, 
                            heightToDraw,
                            null,
                            'FAST',
                            0,
                            sourceY,
                            img.width,
                            sourceHeight
                        );
                        
                        // Agregar número de página
                        pdf.setFontSize(8);
                        pdf.setTextColor(100, 100, 100);
                        pdf.text(`Página ${i + 1} de ${pageCount}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
                        
                        // Actualizar para la siguiente página
                        heightLeft -= heightToDraw;
                        position += heightToDraw;
                    }
                } else {
                    // Si la imagen cabe en una página, agregarla directamente
                    pdf.addImage(img, 'PNG', margin, margin, imgWidth, imgHeight);
                }
                
                // Guardar el PDF
                pdf.save(`${nombreArchivo}.pdf`);
                
                // Ocultar indicador de carga
                if (typeof hideLoadingIndicator === 'function') {
                    hideLoadingIndicator();
                }
                
                // Mostrar notificación de éxito
                if (typeof showNotificationFixed === 'function') {
                    showNotificationFixed('Reporte exportado a PDF correctamente', 'success');
                } else if (typeof showNotification === 'function') {
                    showNotification('Reporte exportado a PDF correctamente', 'success');
                } else {
                    alert('Reporte exportado a PDF correctamente');
                }
            };
        })
        .catch(function(error) {
            console.error('Error al generar imagen para PDF:', error);
            
            // Limpiar elemento clonado si todavía existe
            if (document.body.contains(contenidoClonado)) {
                document.body.removeChild(contenidoClonado);
            }
            
            // Ocultar indicador de carga
            if (typeof hideLoadingIndicator === 'function') {
                hideLoadingIndicator();
            }
            
            // Mostrar error
            if (typeof showNotificationFixed === 'function') {
                showNotificationFixed(`Error al exportar a PDF: ${error.message}`, 'error');
            } else if (typeof showNotification === 'function') {
                showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
            } else {
                alert(`Error al exportar a PDF: ${error.message}`);
            }
        });
        
    } catch (error) {
        console.error('Error en exportación a PDF:', error);
        if (typeof hideLoadingIndicator === 'function') {
            hideLoadingIndicator();
        }
        if (typeof showNotificationFixed === 'function') {
            showNotificationFixed(`Error al exportar a PDF: ${error.message}`, 'error');
        } else if (typeof showNotification === 'function') {
            showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
        } else {
            alert(`Error al exportar a PDF: ${error.message}`);
        }
    }
}

// Reemplazar la función exportarReporteActual cuando se utiliza PDF
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicando mejoras para exportación a PDF...');
    
    // Solo aplicar si estamos en la página de reportes
    if (window.currentPage === 'reportes' || 
        document.getElementById('reportes')?.classList.contains('active') ||
        window.location.href.includes('reportes')) {
        
        // Guardar referencia a la función original
        if (window.exportarReporteActual) {
            const originalExportar = window.exportarReporteActual;
            
            window.exportarReporteActual = async function(formato) {
                // Si es PDF, usar nuestra versión mejorada
                if (formato === 'pdf') {
                    // Obtener contenedor y datos necesarios
                    const contenidoReporte = document.getElementById('reporteContenido');
                    if (!contenidoReporte || contenidoReporte.children.length === 0) {
                        if (typeof showNotificationFixed === 'function') {
                            showNotificationFixed('No hay datos para exportar', 'warning');
                        } else {
                            alert('No hay datos para exportar');
                        }
                        return;
                    }
                    
                    // Obtener tipo de reporte y título
                    const tipoReporte = document.getElementById('tipoReporte')?.value || 'general';
                    const tituloReporte = typeof getTituloReporte === 'function' ? 
                        getTituloReporte(tipoReporte) : 
                        tipoReporte.replace('_', ' ').toUpperCase();
                    
                    // Nombre del archivo
                    const fechaActual = new Date().toISOString().split('T')[0];
                    const nombreArchivo = `ALFIN_CASH_${tipoReporte}_${fechaActual}`;
                    
                    // Usar versión mejorada
                    await exportarAPDFMejorado(contenidoReporte, tituloReporte, nombreArchivo);
                } else {
                    // Para otros formatos, usar la función original
                    originalExportar(formato);
                }
            };
            
            console.log('Función exportarReporteActual mejorada para PDF');
        }
    }
});