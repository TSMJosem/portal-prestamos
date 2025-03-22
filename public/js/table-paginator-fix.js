/**
 * table-paginator-fix.js - Solución para el problema de paginación entre páginas
 * 
 * Este script integra el sistema de paginación de tablas con el sistema de navegación
 * de la aplicación para garantizar que la paginación funcione correctamente al cambiar
 * entre diferentes secciones.
 */

// Mejorar la integración con el sistema de navegación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando integración de paginación con navegación...');
    
    // 1. Reemplazar la función loadPage para integrar la paginación
    if (typeof window.loadPage === 'function') {
        const originalLoadPage = window.loadPage;
        
        window.loadPage = function(pageName) {
            console.log(`Navegando a página: ${pageName} (con soporte para paginación)`);
            
            // Llamar a la función original de carga de página
            originalLoadPage(pageName);
            
            // Programar la inicialización de paginación para cuando la página esté lista
            setTimeout(() => {
                console.log(`Inicializando paginación para tablas en: ${pageName}`);
                inicializarPaginacionParaPagina(pageName);
            }, 800); // Esperar a que la página se cargue completamente
        };
        
        console.log('✅ Función loadPage mejorada con soporte para paginación');
    } else {
        console.warn('⚠️ No se encontró la función loadPage para mejorar');
    }
    
    // 2. Mejorar la función initPageScripts para integrar la paginación
    if (typeof window.initPageScripts === 'function') {
        const originalInitPageScripts = window.initPageScripts;
        
        window.initPageScripts = function(pageName) {
            console.log(`Inicializando scripts para: ${pageName} (con soporte para paginación)`);
            
            // Llamar a la función original
            originalInitPageScripts(pageName);
            
            // Programar la inicialización de paginación
            setTimeout(() => {
                inicializarPaginacionParaPagina(pageName);
            }, 600);
        };
        
        console.log('✅ Función initPageScripts mejorada con soporte para paginación');
    }
    
    // 3. Suscribirse a eventos de app-sync.js si están disponibles
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', function(data) {
            console.log(`Evento pageChanged detectado: ${data.from} → ${data.to}`);
            setTimeout(() => inicializarPaginacionParaPagina(data.to), 500);
        });
        
        console.log('✅ Integración con appEvents configurada');
    }
    
    // 4. Configurar listeners de MutationObserver más efectivos
    configureObserverForPagination();
    
    // 5. Inicializar paginación para la página actual (si ya estamos en una página)
    const currentPage = window.currentPage || 'dashboard';
    setTimeout(() => {
        inicializarPaginacionParaPagina(currentPage);
    }, 1000);
});

// Función específica para inicializar paginación según la página
function inicializarPaginacionParaPagina(pageName) {
    // Determinar qué tablas debemos buscar según la página
    let selectorTablas = [];
    
    switch (pageName) {
        case 'clientes':
            selectorTablas = ['#tablaClientes'];
            break;
        case 'prestamos':
            selectorTablas = ['#tablaPrestamos'];
            break;
        case 'pagos':
            selectorTablas = ['#tablaHistorialPagos', '#tablaPagosPendientes'];
            break;
        case 'reportes':
            selectorTablas = ['.table']; // Selector genérico para reportes
            break;
        case 'dashboard':
            selectorTablas = ['#pagosPendientesTable', '#clientesRecientesTable'];
            break;
        default:
            // Para cualquier otra página, intentar encontrar tablas genéricas
            selectorTablas = ['.table', 'table.table-bordered'];
    }
    
    console.log(`🔍 Buscando tablas para paginar en ${pageName}:`, selectorTablas);
    
    // Intentar varias veces con retraso incremental para asegurar que las tablas estén cargadas
    buscarTablasConReintento(selectorTablas, 1);
}

// Función para buscar tablas con reintentos
function buscarTablasConReintento(selectores, intento, maxIntentos = 3) {
    if (intento > maxIntentos) {
        console.log(`⚠️ Se alcanzó el máximo de intentos (${maxIntentos}) buscando tablas`);
        return;
    }
    
    console.log(`Intento ${intento}/${maxIntentos} buscando tablas para paginar...`);
    
    // Buscar tablas que coincidan con los selectores
    let tablasEncontradas = false;
    
    selectores.forEach(selector => {
        const tablas = document.querySelectorAll(selector);
        
        if (tablas && tablas.length > 0) {
            console.log(`✅ Encontradas ${tablas.length} tablas con selector: ${selector}`);
            tablasEncontradas = true;
            
            // Inicializar paginación para cada tabla encontrada
            tablas.forEach(tabla => {
                if (tabla.id) {
                    console.log(`Inicializando paginación para tabla: #${tabla.id}`);
                    
                    // Verificar primero si la tabla ya tiene paginación
                    const paginadorExistente = document.getElementById(`paginador-${tabla.id}`);
                    if (paginadorExistente) {
                        console.log(`La tabla #${tabla.id} ya tiene paginación, actualizando...`);
                        if (window.tablePaginator && window.tablePaginator.update) {
                            window.tablePaginator.update(tabla.id);
                        }
                    } else {
                        // Inicializar nueva paginación
                        if (window.tablePaginator && window.tablePaginator.init) {
                            window.tablePaginator.init(tabla.id);
                        } else if (typeof inicializarPaginacion === 'function') {
                            inicializarPaginacion(tabla.id);
                        }
                    }
                } else {
                    console.warn(`⚠️ Tabla encontrada sin ID, asignando ID temporal:`, tabla);
                    // Asignar ID temporal para poder paginar
                    tabla.id = `tabla-temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    
                    // Inicializar paginación con el nuevo ID
                    if (window.tablePaginator && window.tablePaginator.init) {
                        window.tablePaginator.init(tabla.id);
                    } else if (typeof inicializarPaginacion === 'function') {
                        inicializarPaginacion(tabla.id);
                    }
                }
            });
        } else {
            console.log(`⚠️ No se encontraron tablas con selector: ${selector}`);
        }
    });
    
    // Si no se encontraron tablas, reintentar después de un retraso
    if (!tablasEncontradas) {
        const retraso = intento * 500; // Incrementar el tiempo entre intentos
        console.log(`Reintentando en ${retraso}ms...`);
        
        setTimeout(() => {
            buscarTablasConReintento(selectores, intento + 1, maxIntentos);
        }, retraso);
    }
}

// Configurar un observer más efectivo para detectar cambios en la paginación
function configureObserverForPagination() {
    // Observer para detectar cuando las tablas se actualizan o se añaden al DOM
    const observer = new MutationObserver(function(mutations) {
        let tablasModificadas = false;
        let contenidoActualizado = false;
        
        mutations.forEach(mutation => {
            // Verificar si hay nodos añadidos
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // Verificar si es un elemento del DOM
                    if (node.nodeType === 1) {
                        // Revisar si es una tabla o contiene tablas
                        if (node.tagName === 'TABLE' || node.querySelector('table')) {
                            tablasModificadas = true;
                        }
                        
                        // Buscar también tbody o filas que podrían haberse añadido
                        if (node.tagName === 'TBODY' || node.tagName === 'TR') {
                            contenidoActualizado = true;
                        }
                    }
                });
            }
            
            // Verificar cambios de clase que puedan indicar páginas cambiadas
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                
                // Verificar si es una página que se activa
                if (target.classList.contains('page-content') && target.classList.contains('active')) {
                    console.log(`Detectada página activada: #${target.id}`);
                    
                    // Programar la inicialización de paginación para esta página
                    setTimeout(() => {
                        inicializarPaginacionParaPagina(target.id);
                    }, 400);
                }
                
                // Verificar si es una tabla que cambió
                if (target.tagName === 'TABLE' || target.tagName === 'TBODY') {
                    tablasModificadas = true;
                }
            }
        });
        
        // Si se detectaron cambios relevantes, actualizar paginación
        if (tablasModificadas) {
            console.log('Detectada modificación en tablas, actualizando paginación...');
            setTimeout(() => {
                if (window.tablePaginator && window.tablePaginator.findAndInitialize) {
                    window.tablePaginator.findAndInitialize();
                } else {
                    buscarTablasParaPaginar();
                }
            }, 300);
        } else if (contenidoActualizado) {
            console.log('Contenido de tablas actualizado, verificando paginación...');
            
            // Actualizar tablas paginadas existentes
            setTimeout(() => {
                actualizarTablasPaginadasExistentes();
            }, 200);
        }
    });
    
    // Observar todo el cuerpo del documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
    
    console.log('🔄 Observer mejorado para paginación configurado');
}

// Actualizar todas las tablas paginadas existentes
function actualizarTablasPaginadasExistentes() {
    // Buscar todos los contenedores de paginación existentes
    const paginadores = document.querySelectorAll('[id^="paginador-"]');
    
    if (paginadores.length > 0) {
        console.log(`Actualizando ${paginadores.length} paginadores existentes...`);
        
        paginadores.forEach(paginador => {
            // El ID del paginador tiene el formato "paginador-{tablaId}"
            const tablaId = paginador.id.replace('paginador-', '');
            
            // Verificar que la tabla existe
            if (document.getElementById(tablaId)) {
                console.log(`Actualizando paginación para: #${tablaId}`);
                
                // Usar la función de actualización del paginador
                if (window.tablePaginator && window.tablePaginator.update) {
                    window.tablePaginator.update(tablaId);
                } else if (typeof actualizarPaginacion === 'function') {
                    actualizarPaginacion(tablaId);
                }
            }
        });
    }
}

// Exponer funciones globalmente
window.paginatorFix = {
    init: inicializarPaginacionParaPagina,
    updateAll: actualizarTablasPaginadasExistentes,
    searchWithRetry: buscarTablasConReintento
};

// Iniciar
console.log('🔧 Solución de paginación entre páginas inicializada');