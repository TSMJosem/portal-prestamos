/**
 * iniciar-sistemas.js - Carga e inicializa los sistemas de navegación y paginación
 * 
 * Este script debe incluirse en el archivo index.html justo antes del cierre del body
 * para garantizar que se carguen correctamente los sistemas mejorados.
 */

// Función para cargar un script dinámicamente
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    // Configurar callback para cuando el script se cargue
    if (callback) {
        script.onload = callback;
    }
    
    // Manejar errores
    script.onerror = function(error) {
        console.error(`Error al cargar script: ${url}`, error);
        
        // Intentar carga de respaldo desde otra ubicación
        const fallbackUrl = url.replace('/js/', '/public/js/');
        if (fallbackUrl !== url) {
            console.log(`Intentando carga de respaldo desde: ${fallbackUrl}`);
            const fallbackScript = document.createElement('script');
            fallbackScript.src = fallbackUrl;
            fallbackScript.async = true;
            if (callback) fallbackScript.onload = callback;
            document.head.appendChild(fallbackScript);
        }
    };
    
    // Agregar al documento
    document.head.appendChild(script);
}

// Función para comprobar si un módulo ya está cargado
function isModuleLoaded(globalName) {
    return window[globalName] !== undefined;
}

// Función para inicializar los sistemas en el orden correcto
function initSystems() {
    console.log('🚀 Iniciando sistemas mejorados...');
    
    // Evitar redefiniciones o inicializaciones múltiples
    if (window.systemsInitialized) {
        console.log('Los sistemas ya están inicializados');
        return;
    }
    
    // 1. Inicializar sistema de navegación si está disponible
    if (window.navigationSystem) {
        console.log('Sistema de navegación ya inicializado');
    } else if (typeof window.NavigationSystem === 'function') {
        console.log('Creando instancia de NavigationSystem');
        try {
            window.navigationSystem = new window.NavigationSystem();
            window.navigationSystem.init();
        } catch (error) {
            console.error('Error al inicializar NavigationSystem:', error);
            createFallbackNavigationSystem();
        }
    } else {
        console.log('NavigationSystem no disponible, cargando script...');
        
        // Cargar script de navegación
        loadScript('/js/navigation-system.js', () => {
            if (typeof window.NavigationSystem === 'function') {
                try {
                    window.navigationSystem = new window.NavigationSystem();
                    window.navigationSystem.init();
                } catch (error) {
                    console.error('Error al inicializar NavigationSystem:', error);
                    createFallbackNavigationSystem();
                }
            } else {
                createFallbackNavigationSystem();
            }
        });
    }
    
    // 2. Inicializar sistema de paginación si está disponible
    if (window.paginationSystem && typeof window.paginationSystem.init === 'function') {
        window.paginationSystem.init();
    } else if (!isModuleLoaded('paginationSystem')) {
        console.log('Sistema de paginación no disponible, cargando script...');
        
        // Cargar script de paginación
        loadScript('/js/pagination-fix.js', () => {
            if (window.paginationSystem && typeof window.paginationSystem.init === 'function') {
                window.paginationSystem.init();
            } else {
                console.log('No se pudo cargar el sistema de paginación');
            }
        });
    }
    
    // 3. Asegurar que loadPage está disponible y configurado correctamente
    setupLoadPageFunction();
    
    // 4. Configurar los enlaces de navegación
    fixNavigationLinks();
    
    // 5. Asegurar la inicialización de la página actual
    const currentPage = window.currentPage || detectActivePage();
    if (currentPage) {
        console.log(`Inicializando la página actual: ${currentPage}`);
        
        // Usar el sistema de navegación si está disponible
        if (window.navigationSystem && window.navigationSystem.initializePage) {
            setTimeout(() => window.navigationSystem.initializePage(currentPage), 500);
        }
        
        // Inicializar tablas de la página actual
        if (window.paginationSystem && window.paginationSystem.initPageTables) {
            setTimeout(() => window.paginationSystem.initPageTables(currentPage), 800);
        }
    }
    
    // Marcar como inicializado
    window.systemsInitialized = true;
}

// Crear sistema de navegación alternativo si el principal falla
function createFallbackNavigationSystem() {
    console.log('Creando sistema de navegación alternativo');
    
    window.navigationSystem = {
        navigateTo: function(pageName) {
            console.log(`Navegación de respaldo a: ${pageName}`);
            
            // Actualizar estado
            window.currentPage = pageName;
            
            // Ocultar todas las páginas
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            // Mostrar la página destino
            const pageElement = document.getElementById(pageName);
            if (pageElement) {
                pageElement.classList.add('active');
            } else {
                console.error(`Página no encontrada: ${pageName}`);
            }
            
            // Actualizar enlaces
            document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageName) {
                    link.classList.add('active');
                }
            });
            
            // Inicializar la página según sea necesario
            const initFunction = getPageInitFunction(pageName);
            if (initFunction && typeof window[initFunction] === 'function') {
                setTimeout(() => window[initFunction](), 300);
            }
            
            // Inicializar tablas en la página destino
            setTimeout(() => {
                if (window.paginationSystem && typeof window.paginationSystem.initPageTables === 'function') {
                    window.paginationSystem.initPageTables(pageName);
                }
            }, 500);
        }
    };
}

// Obtener función de inicialización para una página específica
function getPageInitFunction(pageName) {
    const initFunctions = {
        'dashboard': 'loadDashboardData',
        'clientes': 'initClientesPage',
        'prestamos': 'initPrestamosPage',
        'pagos': 'initPagosPage',
        'nuevo-prestamo': 'initNuevoPrestamoPage',
        'reportes': 'initReportesPage'
    };
    
    return initFunctions[pageName];
}

// Configurar la función loadPage para navegación
function setupLoadPageFunction() {
    // Si loadPage ya existe, sobrescribirla para integrarla con el sistema de navegación
    if (typeof window.loadPage === 'function') {
        const originalLoadPage = window.loadPage;
        
        window.loadPage = function(pageName) {
            // Si el sistema de navegación está disponible, usarlo
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            } else {
                // De lo contrario, usar la función original
                originalLoadPage(pageName);
            }
        };
    } else {
        // Si loadPage no existe, crearla
        window.loadPage = function(pageName) {
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            } else {
                // Navegación simple
                window.currentPage = pageName;
                
                // Ocultar todas las páginas
                document.querySelectorAll('.page-content').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Mostrar la página destino
                const pageElement = document.getElementById(pageName);
                if (pageElement) {
                    pageElement.classList.add('active');
                }
                
                // Actualizar enlaces
                document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-page') === pageName) {
                        link.classList.add('active');
                    }
                });
            }
        };
    }
}

// Detectar la página activa basada en el DOM
function detectActivePage() {
    // Verificar elemento page-content con clase active
    const activePage = document.querySelector('.page-content.active');
    if (activePage && activePage.id) {
        return activePage.id;
    }
    
    // Verificar enlace de navegación activo
    const activeNavLink = document.querySelector('.nav-link.active, [data-page].active');
    if (activeNavLink && activeNavLink.getAttribute('data-page')) {
        return activeNavLink.getAttribute('data-page');
    }
    
    // Asumir dashboard como valor predeterminado
    return 'dashboard';
}

// Arreglar los enlaces de navegación
function fixNavigationLinks() {
    document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
        // Eliminar todos los event listeners actuales para evitar duplicaciones
        const newLink = link.cloneNode(true);
        if (link.parentNode) {
            link.parentNode.replaceChild(newLink, link);
        }
        
        // Agregar nuevo event listener
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pageName = this.getAttribute('data-page');
            if (!pageName) return;
            
            // Usar sistema de navegación si está disponible
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            } else if (typeof window.loadPage === 'function') {
                window.loadPage(pageName);
            } else {
                // Navegación básica de respaldo
                window.currentPage = pageName;
                
                // Ocultar todas las páginas
                document.querySelectorAll('.page-content').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Mostrar la página destino
                const pageElement = document.getElementById(pageName);
                if (pageElement) {
                    pageElement.classList.add('active');
                }
                
                // Actualizar enlaces
                document.querySelectorAll('.nav-link, [data-page]').forEach(navLink => {
                    navLink.classList.remove('active');
                    if (navLink.getAttribute('data-page') === pageName) {
                        navLink.classList.add('active');
                    }
                });
            }
        });
    });
    
    console.log('✅ Enlaces de navegación configurados correctamente');
}

// Manejo global de errores para prevenir bloqueos
window.addEventListener('error', function(event) {
    console.error('Error capturado:', event.error);
    
    // Errores específicos que podemos manejar
    if (event.error && (
        event.error.toString().includes('NavigationSystem') ||
        event.error.toString().includes('redeclaration')
    )) {
        console.warn('Error de redeclaración detectado, controlado para evitar bloqueo');
        event.preventDefault();
    }
});

// Iniciar sistemas cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystems);
} else {
    // Si el DOM ya está cargado, iniciar sistemas de inmediato
    initSystems();
}

// Exponer funciones públicas
window.reinitialsizeSystems = initSystems;
window.reloadPage = function(pageName) {
    if (pageName && window.navigationSystem) {
        window.navigationSystem.navigateTo(pageName);
    } else if (window.currentPage && window.navigationSystem) {
        window.navigationSystem.navigateTo(window.currentPage);
    }
};