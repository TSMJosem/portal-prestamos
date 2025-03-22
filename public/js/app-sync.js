/**
 * app-sync.js - Sistema de sincronización entre módulos
 */

// Sistema de eventos global
window.appEvents = {
    listeners: {},
    
    // Registrar un evento
    on: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    // Disparar un evento
    emit: function(event, data) {
        console.log(`Evento disparado: ${event}`, data);
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${event}:`, error);
                }
            });
        }
    }
};

// Configurar listeners para sincronización
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar dashboard cuando se modifiquen datos importantes
    window.appEvents.on('clientesActualizados', function() {
        if (window.currentPage === 'dashboard') {
            console.log('Actualizando dashboard debido a cambio en clientes');
            loadCounters();
            loadClientesRecientes();
        }
    });

    window.appEvents.on('prestamosActualizados', function() {
        if (window.currentPage === 'dashboard') {
            console.log('Actualizando dashboard debido a cambio en préstamos');
            loadCounters();
            loadCharts();
        }
    });

    window.appEvents.on('pagosActualizados', function() {
        if (window.currentPage === 'dashboard') {
            console.log('Actualizando dashboard debido a cambio en pagos');
            loadCounters();
            loadPagosPendientes();
        }
    });
    
    // Sobrescribir el loadPage original para actualizar automáticamente
    const originalLoadPage = window.loadPage;
    window.loadPage = function(pageName) {
        // Llamar a la función original
        originalLoadPage(pageName);
        
        // Si navegamos al dashboard, actualizar datos
        if (pageName === 'dashboard') {
            setTimeout(() => {
                console.log('Actualizando datos del dashboard después de navegación');
                loadDashboardData();
            }, 300);
        }
    };
    
    // Modificar interceptarAPIs para usar datos dinámicos
    interceptarAPIs();
});