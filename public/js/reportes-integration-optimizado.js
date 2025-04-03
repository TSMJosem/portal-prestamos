/**
 * reportes-integration-optimizado.js - Integrador principal para los módulos de reportes
 * 
 * Este script se encarga de coordinar los tres componentes principales del sistema de reportes:
 * 1. reportes.js - Funcionalidad principal de generación de reportes
 * 2. reportes-export.js - Exportación a Excel y PDF
 * 3. reportes-integration.js - Integración de componentes
 * 
 * Carga los módulos en orden y garantiza su correcto funcionamiento.
 */

(function() {
    // Configuración global
    const config = {
        debug: true, // Habilitar mensajes de depuración en consola
        modules: [
            {
                name: 'reportes',
                path: '/js/reportes.js',
                required: true,
                loaded: false
            },
            {
                name: 'reportes-export',
                path: '/js/reportes-export.js',
                required: false, // No es esencial para la funcionalidad básica
                loaded: false
            },
            {
                name: 'reportes-integration',
                path: '/js/reportes-integration.js',
                required: false, // No es esencial para la funcionalidad básica
                loaded: false
            }
        ],
        initFunction: 'initReportesPage', // Función principal de inicialización
        // Selectores de elementos clave en la página
        selectors: {
            container: '#reporteContenido',
            reportType: '#tipoReporte',
            exportExcel: '#btnExportarExcel',
            exportPDF: '#btnExportarPDF'
        }
    };
    
    // Estado de la aplicación
    const appState = {
        initialized: false,
        modulesLoaded: 0,
        currentReport: null
    };
    
    /**
     * Inicializa el integrador
     */
    function init() {
        log('Inicializando integrador de reportes...');
        
        // Verificar si estamos en la página de reportes
        if (!isReportesPage()) {
            log('No estamos en la página de reportes, omitiendo inicialización', 'warn');
            return;
        }
        
        // Cargar los módulos en secuencia
        loadModules();
        
        // Configurar evento para manejar la navegación entre páginas
        configureNavigationEvents();
    }
    
    /**
     * Verifica si estamos en la página de reportes
     */
    function isReportesPage() {
        return window.location.href.includes('reportes') || 
               document.getElementById('reportes')?.classList.contains('active') ||
               window.currentPage === 'reportes';
    }
    
    /**
     * Carga los módulos necesarios en secuencia
     */
    function loadModules() {
        log('Iniciando carga de módulos...');
        
        // Verificar si los módulos ya están cargados
        config.modules.forEach((module, index) => {
            const scriptExists = document.querySelector(`script[src="${module.path}"]`);
            if (scriptExists) {
                log(`Módulo ${module.name} ya está cargado`);
                module.loaded = true;
                appState.modulesLoaded++;
                
                // Si es el último módulo, inicializar la aplicación
                if (index === config.modules.length - 1) {
                    initializeApplication();
                }
            }
        });
        
        // Si todos los módulos ya están cargados, inicializar la aplicación
        if (appState.modulesLoaded === config.modules.length) {
            initializeApplication();
            return;
        }
        
        // Cargar los módulos en secuencia
        loadModuleSequentially(0);
    }
    
    /**
     * Carga los módulos en secuencia para garantizar el orden correcto
     */
    function loadModuleSequentially(index) {
        if (index >= config.modules.length) {
            log('Todos los módulos cargados correctamente');
            initializeApplication();
            return;
        }
        
        const module = config.modules[index];
        
        // Si el módulo ya está cargado, pasar al siguiente
        if (module.loaded) {
            loadModuleSequentially(index + 1);
            return;
        }
        
        log(`Cargando módulo: ${module.name}`);
        
        // Crear elemento de script
        const script = document.createElement('script');
        script.src = module.path;
        script.async = false; // Cargar en orden
        
        // Configurar eventos
        script.onload = () => {
            log(`Módulo ${module.name} cargado correctamente`);
            module.loaded = true;
            appState.modulesLoaded++;
            
            // Pasar al siguiente módulo
            loadModuleSequentially(index + 1);
        };
        
        script.onerror = (error) => {
            const errorMsg = `Error al cargar módulo ${module.name}: ${error}`;
            log(errorMsg, 'error');
            
            // Si el módulo es requerido, mostrar un error
            if (module.required) {
                showError(`No se pudo cargar un componente esencial: ${module.name}`);
                return;
            }
            
            // Si no es requerido, continuar con el siguiente
            loadModuleSequentially(index + 1);
        };
        
        // Agregar script al documento
        document.head.appendChild(script);
    }
    
    /**
     * Inicializa la aplicación una vez que todos los módulos están cargados
     */
    function initializeApplication() {
        // Evitar inicialización múltiple
        if (appState.initialized) {
            log('La aplicación ya ha sido inicializada', 'warn');
            return;
        }
        
        log('Inicializando aplicación de reportes...');
        
        // Verificar si la función de inicialización está disponible
        if (typeof window[config.initFunction] === 'function') {
            // Llamar a la función de inicialización
            window[config.initFunction]();
            appState.initialized = true;
            
            // Configurar exportación avanzada si están disponibles los módulos
            setupAdvancedFeatures();
            
            log('Aplicación inicializada correctamente');
        } else {
            // Si no está disponible la función de inicialización, intentar recuperación
            log(`Función de inicialización ${config.initFunction} no disponible`, 'error');
            
            // Intentar en 500ms por si el script se está cargando aún
            setTimeout(() => {
                if (typeof window[config.initFunction] === 'function') {
                    window[config.initFunction]();
                    appState.initialized = true;
                    setupAdvancedFeatures();
                    log('Aplicación inicializada con retraso');
                } else {
                    // Último intento de recuperación
                    attemptRecovery();
                }
            }, 500);
        }
    }
    
    /**
     * Configura las características avanzadas si los módulos opcionales están disponibles
     */
    function setupAdvancedFeatures() {
        // Verificar si todos los módulos están cargados
        const exportModuleLoaded = config.modules.find(m => m.name === 'reportes-export')?.loaded;
        const integrationModuleLoaded = config.modules.find(m => m.name === 'reportes-integration')?.loaded;
        
        if (!exportModuleLoaded || !integrationModuleLoaded) {
            log('Algunos módulos opcionales no están disponibles, configurando funcionalidad básica', 'warn');
        }
        
        // Configurar botones de exportación
        setupExportButtons();
    }
    
    /**
     * Configura los botones de exportación para usar la funcionalidad avanzada
     */
    function setupExportButtons() {
        const btnExcel = document.querySelector(config.selectors.exportExcel);
        const btnPDF = document.querySelector(config.selectors.exportPDF);
        
        // Verificar si la función de exportación avanzada está disponible
        const exportFunction = window.exportarReporteActual || 
                             (typeof window.reportesExport !== 'undefined' && window.reportesExport.exportarReporte);
        
        if (exportFunction) {
            log('Configurando botones de exportación con funcionalidad avanzada');
            
            // Configurar botón de Excel
            if (btnExcel) {
                // Quitar eventos previos
                const newBtnExcel = btnExcel.cloneNode(true);
                btnExcel.parentNode.replaceChild(newBtnExcel, btnExcel);
                
                // Agregar nuevo evento
                newBtnExcel.addEventListener('click', () => {
                    if (typeof exportFunction === 'function') {
                        exportFunction('excel');
                    } else {
                        window.exportarReporteActual('excel');
                    }
                });
            }
            
            // Configurar botón de PDF
            if (btnPDF) {
                // Quitar eventos previos
                const newBtnPDF = btnPDF.cloneNode(true);
                btnPDF.parentNode.replaceChild(newBtnPDF, btnPDF);
                
                // Agregar nuevo evento
                newBtnPDF.addEventListener('click', () => {
                    if (typeof exportFunction === 'function') {
                        exportFunction('pdf');
                    } else {
                        window.exportarReporteActual('pdf');
                    }
                });
            }
        } else {
            log('Funcionalidad de exportación avanzada no disponible, manteniendo comportamiento básico', 'warn');
        }
    }
    
    /**
     * Intenta recuperar la aplicación si la inicialización normal falló
     */
    function attemptRecovery() {
        log('Intentando recuperación de la aplicación...', 'warn');
        
        // Verificar si podemos inicializar manualmente
        const reportTypeSelect = document.querySelector(config.selectors.reportType);
        const reportContainer = document.querySelector(config.selectors.container);
        
        if (reportTypeSelect && reportContainer) {
            log('Configurando comportamiento básico');
            
            // Mostrar mensaje de advertencia
            reportContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Algunas funcionalidades de reportes pueden estar limitadas. 
                    Estamos operando en modo básico.
                </div>
            `;
            
            // Intentar configurar selector de reportes
            reportTypeSelect.addEventListener('change', function() {
                const tipoSeleccionado = this.value;
                if (typeof window.generarReporte === 'function') {
                    window.generarReporte(tipoSeleccionado);
                } else {
                    reportContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            No se puede generar el reporte. Funcionalidad no disponible.
                        </div>
                    `;
                }
            });
            
            // Configurar botones de exportación básicos
            const btnExcel = document.querySelector(config.selectors.exportExcel);
            const btnPDF = document.querySelector(config.selectors.exportPDF);
            
            if (btnExcel) {
                btnExcel.addEventListener('click', () => {
                    showNotification('Funcionalidad de exportación a Excel no disponible en modo básico', 'warning');
                });
            }
            
            if (btnPDF) {
                btnPDF.addEventListener('click', () => {
                    showNotification('Funcionalidad de exportación a PDF no disponible en modo básico', 'warning');
                });
            }
        } else {
            log('No se pueden encontrar elementos críticos para la recuperación', 'error');
            showError('No se pueden cargar los componentes necesarios para la aplicación de reportes');
        }
    }
    
    /**
     * Configura eventos para manejar navegación entre páginas
     */
    function configureNavigationEvents() {
        // Si existe appEvents (sistema de eventos global), usarlo
        if (window.appEvents && typeof window.appEvents.on === 'function') {
            window.appEvents.on('pageChanged', function(data) {
                if (data.to === 'reportes') {
                    log('Navegación detectada hacia reportes, recargar integrador');
                    // Reiniciar estado
                    appState.initialized = false;
                    // Inicializar nuevamente
                    setTimeout(init, 100);
                }
            });
        }
        
        // Detectar cambios de clases en las páginas para navegación
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'reportes' && 
                    mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' &&
                    mutation.target.classList.contains('active')) {
                    
                    log('Activación de página de reportes detectada por cambio de clase');
                    // Reiniciar estado
                    appState.initialized = false;
                    // Inicializar nuevamente
                    setTimeout(init, 100);
                }
            });
        });
        
        // Observar el elemento de reportes si existe
        const reportesElement = document.getElementById('reportes');
        if (reportesElement) {
            observer.observe(reportesElement, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        }
    }
    
    /**
     * Muestra un mensaje en la consola si el debug está habilitado
     */
    function log(message, level = 'info') {
        if (!config.debug) return;
        
        const prefix = '📊 [Reportes Integrador]';
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }
    
    /**
     * Muestra un error en la interfaz de usuario
     */
    function showError(message) {
        const container = document.querySelector(config.selectors.container);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ${message}
                </div>
            `;
        }
        
        showNotification(message, 'error');
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
        log(`Notificación (${type}): ${message}`);
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.style.maxWidth = '500px';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.style.transition = 'all 0.3s ease';
        
        // Determinar icono según tipo
        let icon;
        switch (type) {
            case 'success':
                icon = 'check-circle';
                break;
            case 'warning':
                icon = 'exclamation-triangle';
                break;
            case 'error':
            case 'danger':
                icon = 'exclamation-circle';
                break;
            default:
                icon = 'info-circle';
        }
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${icon} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" aria-label="Cerrar"></button>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Configurar botón de cierre
        const closeBtn = notification.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                
                // Eliminar después de la animación
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Ocultar automáticamente después de 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            
            // Eliminar después de la animación
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Exponer función de inicialización globalmente
    window.reportesIntegrador = {
        init,
        reinitialize: () => {
            appState.initialized = false;
            init();
        }
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // El DOM ya está cargado
        init();
    }
})();