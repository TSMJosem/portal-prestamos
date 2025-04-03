/**
 * reportes-loader.js - Cargador para los módulos de reportes y exportación
 * 
 * Este script carga todos los módulos necesarios para el funcionamiento
 * del sistema de reportes y la exportación.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando sistema de reportes y exportación...');
    
    // Verificar si estamos en la página de reportes
    const esReportesPage = window.location.href.includes('reportes') || 
                           document.getElementById('reportes')?.classList.contains('active');
    
    if (!esReportesPage) {
        console.log('No estamos en la página de reportes, omitiendo inicialización');
        return;
    }
    
    // Cargar funcionalidades específicas
    cargarModulosReportes();
});

// Cargar todos los módulos necesarios para reportes
function cargarModulosReportes() {
    // Lista de módulos a cargar
    const modulos = [
        { 
            nombre: 'Funcionalidad principal de reportes', 
            url: '/js/reportes.js', 
            callback: function() {
                // Inicializar página de reportes si existe la función
                if (typeof window.initReportesPage === 'function') {
                    window.initReportesPage();
                }
            }
        },
        { 
            nombre: 'Funcionalidad de exportación', 
            url: '/js/reportes-export.js', 
            callback: null
        },
        { 
            nombre: 'Integración de reportes', 
            url: '/js/reportes-integration.js', 
            callback: null
        }
    ];
    
    // Cargar cada módulo
    let modulosCargados = 0;
    
    modulos.forEach(modulo => {
        // Verificar si el script ya está cargado
        const scriptExistente = document.querySelector(`script[src="${modulo.url}"]`);
        
        if (scriptExistente) {
            console.log(`✅ Módulo "${modulo.nombre}" ya está cargado`);
            modulosCargados++;
            
            // Si todos los módulos están cargados, ejecutar callbacks
            if (modulosCargados === modulos.length) {
                ejecutarCallbacks(modulos);
            }
            return;
        }
        
        // Cargar script
        const script = document.createElement('script');
        script.src = modulo.url;
        script.async = true;
        
        script.onload = () => {
            console.log(`✅ Módulo "${modulo.nombre}" cargado correctamente`);
            modulosCargados++;
            
            // Si todos los módulos están cargados, ejecutar callbacks
            if (modulosCargados === modulos.length) {
                ejecutarCallbacks(modulos);
            }
        };
        
        script.onerror = (error) => {
            console.error(`❌ Error al cargar módulo "${modulo.nombre}":`, error);
            modulosCargados++;
            
            // Si todos los módulos están cargados, ejecutar callbacks
            if (modulosCargados === modulos.length) {
                ejecutarCallbacks(modulos);
            }
        };
        
        document.head.appendChild(script);
    });
}

// Ejecutar callbacks cuando todos los módulos estén cargados
function ejecutarCallbacks(modulos) {
    console.log('🚀 Todos los módulos de reportes cargados, ejecutando callbacks...');
    
    // Ejecutar callbacks en orden
    modulos.forEach(modulo => {
        if (modulo.callback && typeof modulo.callback === 'function') {
            try {
                modulo.callback();
            } catch (error) {
                console.error(`Error al ejecutar callback para "${modulo.nombre}":`, error);
            }
        }
    });
    
    // Código adicional cuando todos los módulos estén listos
    console.log('✅ Sistema de reportes inicializado correctamente');
    
    // Mostrar notificación de que el sistema está listo
    if (typeof showNotification === 'function') {
        showNotification('Sistema de reportes listo', 'info');
    }
}