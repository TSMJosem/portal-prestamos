/**
 * portal-fix.js - Solución unificada para problemas de navegación y paginación
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Iniciando solución para navegación y paginación...');
    
    // Evitar redefiniciones
    if (window.portalInitialized) return;
    
    // 1. Resolver problema de NavigationSystem
    if (window.navigationSystem) {
        console.log('Sistema de navegación ya inicializado');
    } else if (typeof window.NavigationSystem === 'function') {
        console.log('Creando instancia de NavigationSystem');
        window.navigationSystem = new window.NavigationSystem();
        window.navigationSystem.init();
    } else {
        console.warn('NavigationSystem no disponible, creando versión simplificada');
        
        // Crear un sistema simplificado
        window.navigationSystem = {
            navigateTo: function(pageName) {
                console.log(`Navegando a: ${pageName}`);
                
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
                }
                
                // Actualizar enlaces de navegación
                document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-page') === pageName) {
                        link.classList.add('active');
                    }
                });
                
                // Inicializar página según sea necesario
                if (typeof window.initPageScripts === 'function') {
                    setTimeout(() => window.initPageScripts(pageName), 300);
                }
            }
        };
    }
    
    // 2. Configurar todos los enlaces de navegación
    document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
        // Eliminar eventos existentes para evitar duplicados
        const clone = link.cloneNode(true);
        link.parentNode.replaceChild(clone, link);
        
        // Agregar nuevo evento
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.getAttribute('data-page');
            if (!pageName) return;
            
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            } else if (typeof window.loadPage === 'function') {
                window.loadPage(pageName);
            }
        });
    });
    
    // 3. Sobrescribir loadPage para compatibilidad
    if (typeof window.loadPage === 'function') {
        const originalLoadPage = window.loadPage;
        window.loadPage = function(pageName) {
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            } else {
                originalLoadPage(pageName);
            }
        };
    } else {
        window.loadPage = function(pageName) {
            if (window.navigationSystem && typeof window.navigationSystem.navigateTo === 'function') {
                window.navigationSystem.navigateTo(pageName);
            }
        };
    }
    
    // Marcar como inicializado
    window.portalInitialized = true;
    console.log('✅ Solución de navegación y paginación aplicada correctamente');
});