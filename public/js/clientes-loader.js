/**
 * clientes-loader.js - Módulo auxiliar para asegurar la carga de clientes
 * 
 * Este script complementa la funcionalidad de clientes.js para garantizar 
 * que los clientes se carguen correctamente en la tabla.
 */

// Almacenamiento en caché persistente
window.clientesCache = window.clientesCache || {
    datos: [],
    timestamp: 0,
    cargando: false
};

// Función principal para garantizar la carga de clientes
function garantizarCargaClientes() {
    console.log('🔍 Verificando estado de carga de clientes...');
    
    // 1. Verificar si ya tenemos datos en caché recientes (menos de 5 minutos)
    const ahora = Date.now();
    const datosRecientes = window.clientesCache.datos.length > 0 && 
                          (ahora - window.clientesCache.timestamp < 300000);
    
    if (datosRecientes) {
        console.log('✅ Usando datos en caché recientes, hay', window.clientesCache.datos.length, 'clientes');
        mostrarClientesEnTabla(window.clientesCache.datos);
        return;
    }
    
    // 2. Verificar si ya se está cargando
    if (window.clientesCache.cargando) {
        console.log('⏳ Carga de clientes en progreso, esperando...');
        return;
    }
    
    // 3. Iniciar carga desde API
    window.clientesCache.cargando = true;
    
    // Mostrar indicador de carga
    const tbody = document.querySelector('#tablaClientes tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="d-flex justify-content-center align-items-center my-4">
                        <div class="spinner-border text-primary me-3"></div>
                        <span>Cargando clientes...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Realizar petición a la API con parámetro anticaché
    console.log('🔄 Obteniendo clientes desde la API...');
    fetch(`/api/clientes?nocache=${Date.now()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Datos recibidos de la API:', data);
            
            // Procesar los datos según su estructura
            let clientesArray = [];
            
            if (Array.isArray(data)) {
                clientesArray = data;
            } else if (data && typeof data === 'object') {
                // Buscar cualquier propiedad que sea un array
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        clientesArray = data[key];
                        console.log(`Encontrado array en data.${key}`);
                        break;
                    }
                }
            }
            
            // Actualizar caché
            window.clientesCache.datos = clientesArray;
            window.clientesCache.timestamp = Date.now();
            window.clientesCache.cargando = false;
            
            // Guardar en variable global para compatibilidad con clientes.js
            window.clientes = clientesArray;
            
            // Actualizar la tabla
            mostrarClientesEnTabla(clientesArray);
        })
        .catch(error => {
            console.error('❌ Error al cargar clientes:', error);
            window.clientesCache.cargando = false;
            
            // Intentar usar datos en caché aunque no sean recientes
            if (window.clientesCache.datos.length > 0) {
                console.log('⚠️ Usando datos en caché antiguos como respaldo');
                mostrarClientesEnTabla(window.clientesCache.datos);
            } else {
                // Mostrar mensaje de error
                const tbody = document.querySelector('#tablaClientes tbody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                <div class="alert alert-danger mx-auto my-4" style="max-width: 500px;">
                                    <h5><i class="fas fa-exclamation-triangle me-2"></i>Error al cargar los clientes</h5>
                                    <p>${error.message}</p>
                                    <button class="btn btn-sm btn-primary mt-2" onclick="garantizarCargaClientes()">
                                        <i class="fas fa-sync"></i> Reintentar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
        });
}

// Función para mostrar los clientes en la tabla
function mostrarClientesEnTabla(clientes) {
    console.log('📊 Actualizando tabla con', clientes.length, 'clientes');
    
    // Obtener referencia a tbody
    const tbody = document.querySelector('#tablaClientes tbody');
    if (!tbody) {
        console.error('❌ No se encontró el elemento tbody de la tabla');
        return;
    }
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Si no hay clientes, mostrar mensaje
    if (!clientes.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-users text-muted me-2"></i>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        actualizarContador(0);
        return;
    }
    
    // Agregar clientes a la tabla
    clientes.forEach(cliente => {
        try {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${cliente.nombreCompleto || 'N/A'}</td>
                <td>${cliente.tipoDocumento || 'N/A'}: ${cliente.numeroDocumento || 'N/A'}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.correoElectronico || '-'}</td>
                <td>
                    <span class="badge ${cliente.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">
                        ${cliente.estado || 'N/A'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary" 
                                onclick="editarCliente('${cliente.clienteId}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" 
                                onclick="verPrestamosCliente('${cliente.clienteId}')" title="Ver préstamos">
                            <i class="fas fa-money-bill-wave"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" 
                                onclick="eliminarCliente('${cliente.clienteId}')" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(fila);
        } catch (error) {
            console.error('Error al renderizar cliente:', cliente, error);
        }
    });
    
    // Actualizar contador de clientes
    actualizarContador(clientes.length);
    
    // Configurar botones de acción
    if (typeof window.configurarBotonesAccion === 'function') {
        setTimeout(window.configurarBotonesAccion, 200);
    }
}

// Función para actualizar el contador de clientes
function actualizarContador(cantidad) {
    const contador = document.getElementById('totalClientes');
    if (contador) {
        contador.textContent = cantidad;
    }
    
    const contadorOculto = document.getElementById('contadorClientes');
    if (contadorOculto) {
        contadorOculto.textContent = cantidad;
    }
}

// Observador de navegación para detectar cuando se muestra la página de clientes
function iniciarObservadorNavegacion() {
    console.log('🔄 Iniciando observador de navegación');
    
    // Verificar cada segundo si estamos en la página de clientes
    setInterval(() => {
        const paginaClientesVisible = 
            document.getElementById('clientes') && 
            document.getElementById('clientes').classList.contains('active');
        
        // Si estamos en la página de clientes y no se muestra ningún cliente, cargar
        if (paginaClientesVisible) {
            const tbody = document.querySelector('#tablaClientes tbody');
            if (tbody) {
                const contenidoTabla = tbody.textContent.trim();
                
                // Verificar si la tabla está vacía o muestra mensaje de carga
                if (contenidoTabla.includes('Cargando clientes') || 
                    tbody.children.length === 0 || 
                    (tbody.children.length === 1 && tbody.querySelector('td[colspan="6"]'))) {
                    garantizarCargaClientes();
                }
            } else {
                // Si no hay tbody, posiblemente la tabla no está inicializada
                console.log('⚠️ Tabla de clientes no inicializada completamente');
                
                // Esperar a que se inicialice la tabla
                setTimeout(() => {
                    if (document.querySelector('#tablaClientes tbody')) {
                        garantizarCargaClientes();
                    }
                }, 500);
            }
        }
    }, 1000);
    
    // También observar cambios en el DOM para detectar navegación
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                mutation.target.id === 'clientes') {
                
                if (mutation.target.classList.contains('active')) {
                    console.log('📣 Página de clientes activada, verificando datos...');
                    garantizarCargaClientes();
                }
            }
        });
    });
    
    // Iniciar observación
    const clientesPage = document.getElementById('clientes');
    if (clientesPage) {
        observer.observe(clientesPage, { attributes: true });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando clientes-loader...');
    iniciarObservadorNavegacion();
    
    // Configurar botón de actualización si existe
    const btnRefreshClientes = document.getElementById('btnRefreshClientes');
    if (btnRefreshClientes) {
        btnRefreshClientes.addEventListener('click', () => {
            // Forzar recarga limpiando caché
            window.clientesCache.timestamp = 0;
            garantizarCargaClientes();
        });
    }
    
    // Si ya estamos en la página de clientes, cargar inmediatamente
    const paginaClientesVisible = 
        document.getElementById('clientes') && 
        document.getElementById('clientes').classList.contains('active');
    
    if (paginaClientesVisible) {
        setTimeout(garantizarCargaClientes, 500);
    }
});

// Sobreescribir funciones existentes para mayor compatibilidad
window.actualizarTablaClientes = function() {
    if (window.clientesCache && window.clientesCache.datos.length > 0) {
        mostrarClientesEnTabla(window.clientesCache.datos);
    } else {
        garantizarCargaClientes();
    }
};

// Compatibilidad con botón de nuevos clientes
setTimeout(() => {
    const btnNuevoCliente = document.getElementById('btnNuevoCliente');
    if (btnNuevoCliente) {
        btnNuevoCliente.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
            modal.show();
        });
    }
}, 1000);

// Exponer funciones globalmente
window.garantizarCargaClientes = garantizarCargaClientes;
window.mostrarClientesEnTabla = mostrarClientesEnTabla;