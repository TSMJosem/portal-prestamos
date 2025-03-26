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
    
    // 1. Cargar sistema de navegación si no está cargado
    if (!isModuleLoaded('navigationSystem')) {
        loadScript('/js/navigation-system.js', () => {
            // 2. Cargar sistema de paginación si no está cargado
            if (!isModuleLoaded('paginationSystem')) {
                loadScript('/js/pagination-fix.js', () => {
                    // 3. Inicializar sistemas
                    initNavigationAndPagination();
                });
            } else {
                // Solo inicializar navegación
                initNavigationAndPagination();
            }
        });
    } else if (!isModuleLoaded('paginationSystem')) {
        // Cargar sistema de paginación si no está cargado
        loadScript('/js/pagination-fix.js', () => {
            // Inicializar sistemas
            initNavigationAndPagination();
        });
    } else {
        // Ambos sistemas ya están cargados, solo inicializar
        initNavigationAndPagination();
    }
}

// Función para inicializar ambos sistemas
function initNavigationAndPagination() {
    // Crear el sistema de navegación si no existe
    if (!window.navigationSystem && typeof window.NavigationSystem === 'function') {
        window.navigationSystem = new window.NavigationSystem();
    }
    
    // Inicializar sistema de navegación
    if (window.navigationSystem && typeof window.navigationSystem.init === 'function') {
        window.navigationSystem.init();
    } else {
        console.error('⚠️ No se pudo inicializar el sistema de navegación');
        
        // Intentar recuperación: crear objeto mínimo si no existe
        if (!window.navigationSystem) {
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
                    
                    // Inicializar tablas en la página destino
                    setTimeout(() => {
                        if (window.paginationSystem && typeof window.paginationSystem.initPageTables === 'function') {
                            window.paginationSystem.initPageTables(pageName);
                        }
                    }, 500);
                }
            };
        }
    }
    
    // Inicializar sistema de paginación
    if (window.paginationSystem && typeof window.paginationSystem.init === 'function') {
        window.paginationSystem.init();
    } else {
        console.error('⚠️ No se pudo inicializar el sistema de paginación');
        
        // Cargar sistema de paginación como último recurso
        if (typeof initPaginationSystem === 'function') {
            initPaginationSystem();
        }
    }
    
    // Arreglar las referencias cruzadas entre los sistemas
    if (window.navigationSystem && window.paginationSystem) {
        console.log('✅ Ambos sistemas iniciados correctamente');
    }
    
    // Configurar los enlaces de navegación
    fixNavigationLinks();
    
    // Forzar la inicialización de la página actual
    const currentPage = window.currentPage || detectActivePage();
    if (currentPage) {
        console.log(`Inicializando la página actual: ${currentPage}`);
        
        if (window.paginationSystem && window.paginationSystem.initPageTables) {
            window.paginationSystem.initPageTables(currentPage);
        }
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

// Iniciar sistemas cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystems);
} else {
    // Si el DOM ya está cargado, iniciar sistemas de inmediato
    initSystems();
}