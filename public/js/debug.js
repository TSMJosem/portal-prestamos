// debug.js - Añadir a su proyecto
(function() {
    // Manejador global de errores
    window.onerror = function(message, source, lineno, colno, error) {
        console.error(`ERROR GLOBAL: ${message} en ${source}:${lineno}:${colno}`, error);
        showDebugMessage(`Error: ${message}. Revise la consola del navegador para más detalles.`);
        return false;
    };
    
    // Mostrar mensaje de depuración
    window.showDebugMessage = function(message, type = 'error') {
        const container = document.createElement('div');
        container.className = `debug-message debug-${type}`;
        container.innerHTML = `
            <div style="position: fixed; bottom: 10px; right: 10px; max-width: 80%; 
                        background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; 
                        padding: 10px; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15); z-index: 9999;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>Mensaje de Depuración</strong>
                    <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; cursor: pointer;">&times;</button>
                </div>
                <div>${message}</div>
                <div style="margin-top: 5px; font-size: 0.8rem; text-align: right;">
                    <button onclick="window.debugClientLoad()" style="padding: 2px 5px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">Depurar Carga de Clientes</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        
        // Auto-eliminar después de 20 segundos
        setTimeout(() => {
            if (container.parentNode) {
                container.remove();
            }
        }, 20000);
    };
    
    // Depuración específica de carga de clientes
    window.debugClientLoad = function() {
        console.log('=== DEPURACIÓN DE CARGA DE CLIENTES ===');
        console.log('1. Comprobando elementos DOM...');
        
        const tablaClientes = document.getElementById('tablaClientes');
        console.log(`Elemento tabla existe: ${!!tablaClientes}`);
        
        if (tablaClientes) {
            const tbody = tablaClientes.querySelector('tbody');
            console.log(`Cuerpo de tabla existe: ${!!tbody}`);
            
            if (tbody) {
                console.log(`Contenido actual de tbody: "${tbody.innerHTML}"`);
            }
        }
        
        console.log('2. Probando endpoint de API directamente...');
        fetch('/api/clientes')
            .then(response => {
                console.log(`Estado de respuesta API: ${response.status} ${response.statusText}`);
                return response.text();
            })
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    console.log(`API devolvió ${data.length} clientes`);
                    console.log('Primeros clientes:', data.slice(0, 2));
                    
                    showDebugMessage(`¡La API funciona! Recibidos ${data.length} clientes. Intentando forzar actualización de la tabla...`, 'info');
                    
                    // Intentar forzar actualización de la tabla
                    if (typeof window.clientes !== 'undefined') {
                        window.clientes = data;
                        if (typeof window.actualizarTablaClientes === 'function') {
                            window.actualizarTablaClientes();
                        }
                    }
                } catch (e) {
                    console.error('Error al analizar respuesta de API:', e);
                    console.log('Respuesta API en bruto:', text);
                    showDebugMessage(`Error al analizar respuesta API: ${e.message}. Respuesta en bruto disponible en consola.`);
                }
            })
            .catch(error => {
                console.error('Error en solicitud API:', error);
                showDebugMessage(`Error en solicitud API: ${error.message}`);
            });
            
        console.log('3. Comprobando variables y funciones globales...');
        console.log(`Array global de clientes existe: ${typeof window.clientes !== 'undefined'}`);
        console.log(`Función cargarClientes existe: ${typeof window.cargarClientes === 'function'}`);
        console.log(`Función actualizarTablaClientes existe: ${typeof window.actualizarTablaClientes === 'function'}`);
        
        console.log('=== FIN DEPURACIÓN DE CARGA DE CLIENTES ===');
    };
    
    // Auto-ejecutar depuración en carga de página si estamos en página de clientes
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (window.location.pathname.includes('clientes') || 
                document.getElementById('tablaClientes')) {
                console.log('Página de clientes detectada, ejecutando depuración automática...');
                window.debugClientLoad();
            }
        }, 3000); // Esperar 3 segundos después de cargar el DOM
    });
})();