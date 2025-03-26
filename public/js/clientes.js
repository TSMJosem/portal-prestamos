// clientes.js - Módulo de gestión de clientes
console.log('Script de clientes cargado correctamente');

// Variables globales
let clientes = [];
let clienteSeleccionado = null;

// NUEVO: Bandera para controlar el estado de inicialización
window.clientesModuloInicializado = false;

// NUEVO: Variable global para la última carga
window.ultimaCargaClientes = 0;

// Función principal de inicialización - DEBE SER GLOBAL
function initClientesPage() {
    console.log('Inicializando página de clientes...');

    // NUEVO: Evitar doble inicialización en la misma sesión
    if (window.clientesModuloInicializado) {
        console.log('El módulo de clientes ya fue inicializado, verificando estado...');
        // Verificar si hay datos cargados, si no, recargar
        const tbody = document.querySelector('#tablaClientes tbody');
        if (tbody && tbody.textContent.includes('Cargando clientes')) {
            console.log('Detectados datos en carga, reiniciando...');
            cargarClientes();
        } else if (Array.isArray(clientes) && clientes.length > 0) {
            console.log('Datos ya cargados, actualizando tabla...');
            actualizarTablaClientes();
        } else {
            console.log('No hay datos cargados, iniciando carga...');
            cargarClientes();
        }
        return;
    }
    
    // Marcar como inicializado
    window.clientesModuloInicializado = true;
    
    const paginaClientes = document.getElementById('clientes');
    if (!paginaClientes) {
        console.error('Contenedor #clientes no encontrado');
        
        // NUEVO: Intento de recuperación
        const contenidoAlternativo = document.querySelector('.page-content.active, #main-content, #pageContent');
        if (contenidoAlternativo) {
            console.warn('Usando contenedor alternativo:', contenidoAlternativo.id || 'contenedor sin ID');
            // Crear un contenedor clientes dentro del contenedor alternativo
            const nuevoContenedor = document.createElement('div');
            nuevoContenedor.id = 'clientes';
            nuevoContenedor.className = 'page-content active';
            contenidoAlternativo.appendChild(nuevoContenedor);
            
            // Continuar con el contenedor creado
            verificarYCrearElementosNecesarios(nuevoContenedor);
            configurarEventos();
            cargarClientes();
        } else {
            showNotification('Error al inicializar el módulo de clientes', 'error');
        }
        return;
    }

    // Verificar y crear elementos necesarios
    verificarYCrearElementosNecesarios(paginaClientes);
    
    // Configurar eventos
    configurarEventos();
    
    // Cargar datos de clientes
    cargarClientes();
}

// Verificar y crear elementos necesarios
function verificarYCrearElementosNecesarios(paginaClientes) {
   // Verificar si existe la estructura básica
   let contenedor = paginaClientes.querySelector('.container-fluid');
   if (!contenedor) {
       console.log('Creando estructura básica para clientes...');
       contenedor = document.createElement('div');
       contenedor.className = 'container-fluid';
       contenedor.innerHTML = '<h2 class="mb-4">Gestión de Clientes</h2>';
       paginaClientes.appendChild(contenedor);
   }
   
   // Verificar si existe la tarjeta principal
   let card = contenedor.querySelector('.card');
   if (!card) {
       console.log('Creando tarjeta principal para clientes...');
       card = document.createElement('div');
       card.className = 'card shadow mb-4';
       card.innerHTML = `
           <div class="card-header d-flex justify-content-between align-items-center">
               <div class="d-flex align-items-center">
                   <h6 class="m-0 font-weight-bold text-primary">Listado de Clientes</h6>
                   <button id="btnRefreshClientes" class="btn btn-sm btn-outline-primary ms-3" title="Actualizar lista">
                       <i class="fas fa-sync-alt"></i> Actualizar
                   </button>
               </div>
               <div class="input-group w-50">
                   <input type="text" class="form-control" placeholder="Buscar cliente..." id="buscarCliente">
                   <button class="btn btn-primary" type="button" id="btnNuevoCliente">
                       <i class="fas fa-plus"></i> Nuevo Cliente
                   </button>
               </div>
           </div>
           <div class="card-body">
               <div class="table-responsive">
                   <table class="table table-bordered" id="tablaClientes" width="100%" cellspacing="0">
                       <thead>
                           <tr>
                               <th>Nombre</th>
                               <th>Documento</th>
                               <th>Teléfono</th>
                               <th>Correo</th>
                               <th>Estado</th>
                               <th>Acciones</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td colspan="6" class="text-center">Cargando clientes...</td>
                           </tr>
                       </tbody>
                   </table>
               </div>
               <div class="mt-3">
                   <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
                   <span id="contadorClientes" style="display:none">0</span>
               </div>
           </div>
       `;
       contenedor.appendChild(card);
   }
   
   // Verificar existencia de tabla clientes
   const tabla = paginaClientes.querySelector('#tablaClientes');
   if (!tabla) {
       console.error('Tabla de clientes no encontrada después de intentar crearla');
   } else {
       console.log('Tabla de clientes encontrada');
   }
   
   // Asegurar que exista el contador de clientes
   const totalClientes = paginaClientes.querySelector('#totalClientes');
   if (!totalClientes) {
       const cardBody = paginaClientes.querySelector('.card-body');
       if (cardBody) {
           const contadorDiv = document.createElement('div');
           contadorDiv.className = 'mt-3';
           contadorDiv.innerHTML = `
               <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
           `;
           cardBody.appendChild(contadorDiv);
       }
   }
   
   // Crear elemento para contadorClientes si no existe (para compatibilidad)
   const contadorClientes = paginaClientes.querySelector('#contadorClientes');
   if (!contadorClientes && totalClientes) {
       // Crea un elemento oculto para mantener compatibilidad
       const contadorOculto = document.createElement('span');
       contadorOculto.id = 'contadorClientes';
       contadorOculto.style.display = 'none';
       contadorOculto.textContent = totalClientes.textContent || '0';
       totalClientes.parentNode.appendChild(contadorOculto);
       console.log('Elemento #contadorClientes creado para compatibilidad');
   }
   
   // Modal para nuevo cliente
   let modalNuevoCliente = document.getElementById('modalNuevoCliente');
   if (!modalNuevoCliente) {
       console.log('Creando modal para nuevo cliente...');
       const modalHTML = `
       <div class="modal fade" id="modalNuevoCliente" tabindex="-1" aria-hidden="true">
           <div class="modal-dialog">
               <div class="modal-content">
                   <div class="modal-header">
                       <h5 class="modal-title">Nuevo Cliente</h5>
                       <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                   </div>
                   <div class="modal-body">
                       <form id="formNuevoCliente">
                           <div class="mb-3">
                               <label for="nombreCompleto" class="form-label">Nombre Completo</label>
                               <input type="text" class="form-control" id="nombreCompleto" name="nombreCompleto" required>
                           </div>
                           <div class="mb-3">
                               <label for="tipoDocumento" class="form-label">Tipo de Documento</label>
                               <select class="form-select" id="tipoDocumento" name="tipoDocumento" required>
                                   <option value="">Seleccione...</option>
                                   <option value="INE">INE</option>
                                   <option value="CURP">CURP</option>
                                   <option value="Pasaporte">Pasaporte</option>
                                   <option value="Otro">Otro</option>
                               </select>
                           </div>
                           <div class="mb-3">
                               <label for="numeroDocumento" class="form-label">Número de Documento</label>
                               <input type="text" class="form-control" id="numeroDocumento" name="numeroDocumento" required>
                           </div>
                           <div class="mb-3">
                               <label for="telefono" class="form-label">Teléfono</label>
                               <input type="tel" class="form-control" id="telefono" name="telefono" required>
                           </div>
                           <div class="mb-3">
                               <label for="correoElectronico" class="form-label">Correo Electrónico</label>
                               <input type="email" class="form-control" id="correoElectronico" name="correoElectronico">
                           </div>
                       </form>
                   </div>
                   <div class="modal-footer">
                       <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                       <button type="button" class="btn btn-primary" id="btnGuardarNuevoCliente">Guardar</button>
                   </div>
               </div>
           </div>
       </div>`;
       
       const modalContainer = document.createElement('div');
       modalContainer.innerHTML = modalHTML;
       document.body.appendChild(modalContainer);
   }
}

// Configuración de eventos
function configurarEventos() {
   console.log('Configurando eventos para clientes...');
   
   // Botón nuevo cliente
   const btnNuevoCliente = document.getElementById('btnNuevoCliente');
   if (btnNuevoCliente) {
       // MODIFICADO: Eliminar eventos anteriores para evitar duplicación
       btnNuevoCliente.removeEventListener('click', abrirModalNuevoCliente);
       btnNuevoCliente.addEventListener('click', abrirModalNuevoCliente);
   }
   
   // NUEVO: Botón de actualizar
   const btnRefreshClientes = document.getElementById('btnRefreshClientes');
   if (btnRefreshClientes) {
       btnRefreshClientes.removeEventListener('click', refrescarListaClientes);
       btnRefreshClientes.addEventListener('click', refrescarListaClientes);
   }
   
   // Botón guardar nuevo cliente
   const btnGuardarNuevoCliente = document.getElementById('btnGuardarNuevoCliente');
   if (btnGuardarNuevoCliente) {
       btnGuardarNuevoCliente.removeEventListener('click', guardarNuevoCliente);
       btnGuardarNuevoCliente.addEventListener('click', guardarNuevoCliente);
   }
   
   // Formulario nuevo cliente (para envío con Enter)
   const formNuevoCliente = document.getElementById('formNuevoCliente');
   if (formNuevoCliente) {
       formNuevoCliente.removeEventListener('submit', manejarSubmitFormulario);
       formNuevoCliente.addEventListener('submit', manejarSubmitFormulario);
   }
   
   // Campo de búsqueda
   const buscarCliente = document.getElementById('buscarCliente');
   if (buscarCliente) {
       buscarCliente.removeEventListener('keyup', filtrarClientes);
       buscarCliente.addEventListener('keyup', filtrarClientes);
   }
   
   // NUEVO: Verificar si hay un cliente pendiente por mostrar
   setTimeout(() => {
       if (window.pendingClientDetails) {
           const clienteId = window.pendingClientDetails;
           window.pendingClientDetails = null; // Limpiar para evitar reutilización
           verPrestamosCliente(clienteId);
       }
   }, 1000);
}

// NUEVO: Función para abrir modal de nuevo cliente
function abrirModalNuevoCliente() {
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
    modal.show();
}

// NUEVO: Función para manejar submit del formulario
function manejarSubmitFormulario(event) {
    event.preventDefault();
    guardarNuevoCliente();
}

// NUEVO: Función para filtrar clientes
function filtrarClientes() {
    const terminoBusqueda = this.value.toLowerCase();
    const filas = document.querySelectorAll('#tablaClientes tbody tr');
    
    filas.forEach(fila => {
        // Ignorar la fila de "cargando" o "no hay clientes"
        if (fila.cells.length === 1) return;
        
        let encontrado = false;
        // Buscar en cada celda excepto la última (acciones)
        for (let i = 0; i < fila.cells.length - 1; i++) {
            if (fila.cells[i].textContent.toLowerCase().includes(terminoBusqueda)) {
                encontrado = true;
                break;
            }
        }
        
        fila.style.display = encontrado ? '' : 'none';
    });
}

// NUEVO: Función para refrescar la lista de clientes
function refrescarListaClientes() {
    console.log('Refrescando lista de clientes...');
    
    // Mostrar indicador visual
    const btnRefresh = document.getElementById('btnRefreshClientes');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        const originalText = btnRefresh.innerHTML;
        btnRefresh.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...`;
        
        // Restaurar después
        setTimeout(() => {
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = originalText;
        }, 2000);
    }
    
    // Forzar recarga de datos
    cargarClientes(true);
}

// MODIFICADO: Función mejorada para cargar clientes
function cargarClientes(forzarRecarga = false) {
    console.log('⏳ Iniciando carga avanzada de clientes - VERSIÓN MEJORADA');
    
    // Registrar timestamp de carga
    window.ultimaCargaClientes = Date.now();
    
    // Verificar DOM actual
    console.log('Estructura DOM actual:');
    console.log('- Container #clientes existe:', !!document.getElementById('clientes'));
    console.log('- Tabla #tablaClientes existe:', !!document.querySelector('#tablaClientes'));
    console.log('- tbody en tabla existe:', !!document.querySelector('#tablaClientes tbody'));
    
    let tbody = document.querySelector('#tablaClientes tbody');
    if (!tbody) {
        console.error('🚫 Error crítico: No se encontró el tbody de la tabla de clientes');
        
        // SOLUCIÓN CRÍTICA: Verificar si existe la tabla y crear tbody si es necesario
        const tabla = document.querySelector('#tablaClientes');
        if (tabla) {
            console.warn('⚠️ Se encontró tabla pero no tbody, creando elemento');
            tbody = document.createElement('tbody');
            tabla.appendChild(tbody);
        } else {
            // SOLUCIÓN EMERGENCIA: Intentar buscar una estructura alternativa
            const tablaAlternativa = document.querySelector('table tbody');
            if (tablaAlternativa) {
                console.warn('⚠️ Se encontró un tbody alternativo, intentando usarlo');
                window.tbodyEncontrado = tablaAlternativa;
                tbody = tablaAlternativa;
            } else {
                // Error final si no se pudo recuperar
                console.error('No se pudo encontrar o crear una estructura válida para mostrar clientes');
                
                // Mostrar notificación de error
                if (typeof showNotification === 'function') {
                    showNotification('Error al cargar la tabla de clientes. Intente recargar la página.', 'error');
                }
                
                return;
            }
        }
    }
    
    // Si tenemos clientes cargados y no se está forzando recarga, mostrar datos inmediatamente
    if (!forzarRecarga && Array.isArray(clientes) && clientes.length > 0) {
        console.log('Usando datos en caché, hay', clientes.length, 'clientes');
        actualizarTablaClientes();
        return;
    }
    
    iniciarCargaClientes(tbody);
}

function iniciarCargaClientes(tbody) {
    // Mostrar mensaje de carga con estilo mejorado
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="d-flex flex-column align-items-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mb-0">Cargando clientes...</p>
                    <small class="text-muted" id="loadingTimer">0s</small>
                </div>
            </td>
        </tr>
    `;
    
    // Temporizador para el mensaje de carga
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const timerElement = document.getElementById('loadingTimer');
        if (timerElement) {
            timerElement.textContent = `${seconds}s`;
            
            // Si tarda más de 10 segundos, mostrar mensaje adicional
            if (seconds === 10) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="d-flex flex-column align-items-center p-4">
                                <div class="spinner-border text-primary mb-3" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                                <p class="mb-0">Cargando clientes... (${seconds}s)</p>
                                <small class="text-muted">La carga está tardando más de lo esperado.</small>
                                <button class="btn btn-sm btn-outline-secondary mt-3" onclick="cargarClientes(true)">
                                    <i class="fas fa-sync"></i> Reintentar
                                </button>
                                <button class="btn btn-sm btn-outline-primary mt-2" onclick="crearClientesPrueba()">
                                    <i class="fas fa-plus"></i> Crear clientes de prueba
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }, 1000);
    
    // Función para detener el temporizador
    const stopTimer = () => {
        clearInterval(timerInterval);
    };
    
    // Implementar múltiples intentos con retraso incremental
    let retryCount = 0;
    const maxRetries = 3;
    
    function attemptLoad() {
        console.log(`📡 Intento ${retryCount + 1}/${maxRetries} de cargar clientes...`);
        
        // MODIFICADO: Añadir parámetro timestamp para evitar caché
        fetch(`/api/clientes?t=${Date.now()}`)
            .then(response => {
                console.log(`✅ Respuesta del servidor: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Tipo de contenido inesperado: ${contentType}`);
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Datos recibidos del servidor:', data);
                
                // Asegurarse de que data sea un array
                const clientesArray = Array.isArray(data) ? data : 
                                     (data && typeof data === 'object' && data.clientes && Array.isArray(data.clientes)) ? data.clientes : [];
                
                console.log('Array de clientes procesado:', clientesArray);
                
                stopTimer();
                
                // Almacenar como array
                clientes = clientesArray;
                window.clientes = clientesArray;
                
                // Si no hay clientes, ofrecer crear datos de prueba
                if (clientesArray.length === 0) {
                    console.log('⚠️ No hay clientes en la base de datos');
                    
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center p-4">
                                <div class="text-center">
                                    <i class="fas fa-users fa-2x text-muted mb-3"></i>
                                    <h5>No hay clientes registrados</h5>
                                    <p class="text-muted">No se encontraron clientes en la base de datos.</p>
                                    <button class="btn btn-primary mt-2" id="btnNuevoClienteEmpty">
                                        <i class="fas fa-plus"></i> Registrar nuevo cliente
                                    </button>
                                    <button class="btn btn-outline-secondary mt-2" onclick="crearClientesPrueba()">
                                        <i class="fas fa-cog"></i> Crear datos de ejemplo
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                    
                    // Configurar botón nuevo cliente
                    const btnNuevo = document.getElementById('btnNuevoClienteEmpty');
                    if (btnNuevo) {
                        btnNuevo.addEventListener('click', function() {
                            const modal = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
                            modal.show();
                        });
                    }
                    
                    actualizarContadorClientes(0);
                    return;
                }
                
                // Actualizar la tabla con los datos
                actualizarTablaClientes();
                
                // Mostrar notificación de éxito si fue una recarga manual
                if (retryCount > 0) {
                    mostrarNotificacion('Datos de clientes actualizados correctamente', 'success');
                }
            })
            .catch(error => {
                console.error(`🚫 Error al cargar clientes (intento ${retryCount + 1}/${maxRetries}):`, error);
                
                // Si hay más intentos disponibles, reintentar con retraso incremental
                if (retryCount < maxRetries - 1) {
                    retryCount++;
                    const delay = retryCount * 2000; // 2s, 4s, 6s...
                    
                    console.log(`⏱️ Reintentando en ${delay/1000} segundos...`);
                    setTimeout(attemptLoad, delay);
                    
                    // Actualizar mensaje de carga
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                <div class="d-flex flex-column align-items-center p-4">
                                    <div class="spinner-border text-warning mb-3" role="status">
                                        <span class="visually-hidden">Reintentando...</span>
                                    </div>
                                    <p class="mb-2">Error al cargar clientes</p>
                                    <p class="small text-muted">Reintentando en ${delay/1000}s (intento ${retryCount + 1}/${maxRetries})...</p>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    // No más intentos, mostrar error final
                    stopTimer();
                    
                    console.error('🚫 Todos los intentos de carga fallaron:', error);
                    
                    // Verificar si tenemos datos en caché que podemos mostrar
                    if (Array.isArray(window.clientes) && window.clientes.length > 0) {
                        console.log('Usando datos en caché como respaldo');
                        clientes = window.clientes;
                        actualizarTablaClientes();
                        mostrarNotificacion('Se están mostrando datos en caché. La conexión al servidor falló.', 'warning');
                    } else {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="6" class="text-center">
                                    <div class="alert alert-danger mx-auto my-4" style="max-width: 500px;">
                                        <h5><i class="fas fa-exclamation-triangle me-2"></i>Error al cargar los clientes</h5>
                                        <p class="mb-0">${error.message}</p>
                                        <hr>
                                        <div class="d-flex justify-content-center gap-2 mt-3">
                                            <button class="btn btn-sm btn-primary" onclick="cargarClientes(true)">
                                                <i class="fas fa-sync"></i> Reintentar
                                            </button>
                                            <button class="btn btn-sm btn-outline-primary" onclick="window.debugClientLoad()">
                                                <i class="fas fa-bug"></i> Diagnosticar
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary" onclick="crearClientesPrueba()">
                                                <i class="fas fa-database"></i> Crear datos de prueba
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                }
            });
    }
    
    // Iniciar el primer intento
    attemptLoad();
}

// Función para crear clientes de prueba
function crearClientesPrueba() {
   console.log('Creando clientes de prueba...');
   
   // Mostrar indicador de proceso
   const tbody = document.querySelector('#tablaClientes tbody');
   if (tbody) {
       tbody.innerHTML = `
           <tr>
               <td colspan="6" class="text-center">
                   <div class="d-flex flex-column align-items-center p-4">
                       <div class="spinner-border text-info mb-3" role="status">
                           <span class="visually-hidden">Creando...</span>
                       </div>
                       <p class="mb-0">Creando clientes de prueba...</p>
                   </div>
               </td>
           </tr>
       `;
   }
   
   const clientesPrueba = [
       {
           nombreCompleto: "Juan Pérez González",
           tipoDocumento: "INE",
           numeroDocumento: "PEGJ800101",
           telefono: "5551234567",
           correoElectronico: "juan.perez@ejemplo.com",
           estado: "Activo"
       },
       {
           nombreCompleto: "María López Rodríguez",
           tipoDocumento: "CURP",
           numeroDocumento: "LORM750203MDFXXX01",
           telefono: "5599887766",
           correoElectronico: "maria.lopez@ejemplo.com",
           estado: "Activo"
       },
       {
           nombreCompleto: "Carlos Ramírez Sánchez",
           tipoDocumento: "Pasaporte",
           numeroDocumento: "X12345678",
           telefono: "5533221100",
           correoElectronico: "",
           estado: "Activo"
       }
   ];
   
   // Crear clientes uno por uno para evitar errores de duplicados
   createClientSequentially(clientesPrueba, 0);
}

// Función auxiliar para crear clientes secuencialmente
function createClientSequentially(clientesList, index) {
   if (index >= clientesList.length) {
       console.log('✅ Todos los clientes de prueba procesados');
       mostrarNotificacion('Proceso de creación de clientes finalizado', 'success');
       setTimeout(() => cargarClientes(true), 1000);
       return;
   }
   
   const cliente = clientesList[index];
   
   // Agregar timestamp al email y documento para evitar duplicados
   const timestamp = Date.now();
   if (cliente.correoElectronico) {
       const [username, domain] = cliente.correoElectronico.split('@');
       cliente.correoElectronico = `${username}+${timestamp}@${domain}`;
   }
   cliente.numeroDocumento = `${cliente.numeroDocumento}-${timestamp}`;
   
   fetch('/api/clientes', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json'
       },
       body: JSON.stringify(cliente)
   })
   .then(response => {
       if (!response.ok) {
           return response.json().then(data => {
               throw new Error(data.message || `Error ${response.status}`);
           });
       }
       return response.json();
   })
   .then(result => {
       console.log(`✅ Cliente creado: ${result.nombreCompleto}`);
       // Procesar el siguiente cliente
       createClientSequentially(clientesList, index + 1);
   })
   .catch(error => {
       console.error(`❌ Error al crear cliente ${cliente.nombreCompleto}:`, error);
       // Continuar con el siguiente cliente a pesar del error
       createClientSequentially(clientesList, index + 1);
   });
}

// MODIFICADA: Actualizar la tabla de clientes con manejo robusto de errores
function actualizarTablaClientes() {
   console.log('Actualizando tabla de clientes...');
   
   // Asegurarse de que clientes sea un array
   if (!Array.isArray(clientes)) {
       console.error('Error: clientes no es un array, intentando convertir...');
       if (clientes && typeof clientes === 'object') {
           // Si es un objeto, intentar encontrar un array dentro
           for (const key in clientes) {
               if (Array.isArray(clientes[key])) {
                   console.log(`Encontrado array en clientes.${key}, usando esto...`);
                   clientes = clientes[key];
                   window.clientes = clientes;
                   break;
               }
           }
       }
       
       // Si todavía no es un array, crear uno vacío
       if (!Array.isArray(clientes)) {
           console.error('No se pudo obtener un array válido, usando array vacío');
           clientes = [];
           window.clientes = [];
       }
   }
   
   // Obtener referencia a tbody
   let tbody = document.querySelector('#tablaClientes tbody');
   
   // Verificar si tbody existe
   if (!tbody) {
       console.error('Error: No se encontró el elemento tbody de la tabla de clientes');
       
       // Intentar recuperar o crear el tbody
       const tabla = document.querySelector('#tablaClientes');
       if (tabla) {
           console.warn('Tabla encontrada, creando nuevo tbody');
           tbody = document.createElement('tbody');
           tabla.appendChild(tbody);
       } else {
           console.error('No se encontró la tabla #tablaClientes');
           
           // Último intento: buscar cualquier tabla en la página
           const tablaAlternativa = document.querySelector('table');
           if (tablaAlternativa) {
               console.warn('Usando tabla alternativa');
               tbody = tablaAlternativa.querySelector('tbody');
               if (!tbody) {
                   tbody = document.createElement('tbody');
                   tablaAlternativa.appendChild(tbody);
               }
           } else {
               console.error('No se pudo encontrar ninguna tabla para mostrar los clientes');
               // Mostrar notificación de error
               mostrarNotificacion('Error al mostrar la tabla de clientes', 'error');
               return;
           }
       }
   }
   
   // Limpiar tabla
   tbody.innerHTML = '';
   
   // Si no hay clientes, mostrar mensaje
   if (clientes.length === 0) {
       tbody.innerHTML = `
           <tr>
               <td colspan="6" class="text-center">
                   <i class="fas fa-users me-2"></i>
                   No hay clientes registrados
               </td>
           </tr>
       `;
       actualizarContadorClientes(0);
       return;
   }
   
   try {
       // Agregar cada cliente a la tabla
       clientes.forEach(cliente => {
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
                       <button type="button" class="btn btn-outline-primary btn-editar" 
                               data-id="${cliente.clienteId}" title="Editar">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button type="button" class="btn btn-outline-info btn-prestamos" 
                               data-id="${cliente.clienteId}" title="Ver préstamos">
                           <i class="fas fa-money-bill-wave"></i>
                       </button>
                       <button type="button" class="btn btn-outline-danger btn-eliminar" 
                               data-id="${cliente.clienteId}" title="Eliminar">
                           <i class="fas fa-trash-alt"></i>
                       </button>
                   </div>
               </td>
           `;
           tbody.appendChild(fila);
       });
       
       // Actualizar contador
       actualizarContadorClientes(clientes.length);
       
       // Después de actualizar la tabla, configurar handlers de botones
       configurarBotonesTabla();
   } catch (error) {
       console.error('Error al renderizar los clientes en la tabla:', error);
       tbody.innerHTML = `
           <tr>
               <td colspan="6" class="text-center text-danger">
                   <i class="fas fa-exclamation-circle me-2"></i>
                   Error al mostrar los clientes: ${error.message}
               </td>
           </tr>
       `;
   }
}

// NUEVA FUNCIÓN: Configurar botones en la tabla
function configurarBotonesTabla() {
    // Botones de editar cliente
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const clienteId = this.getAttribute('data-id');
            editarCliente(clienteId);
        });
    });
    
    // Botones de ver préstamos
    document.querySelectorAll('.btn-prestamos').forEach(btn => {
        btn.addEventListener('click', function() {
            const clienteId = this.getAttribute('data-id');
            verPrestamosCliente(clienteId);
        });
    });
    
// Botones de eliminar cliente
document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', function() {
        const clienteId = this.getAttribute('data-id');
        eliminarCliente(clienteId);
    });
});
}

// Actualizar contador de clientes
function actualizarContadorClientes(cantidad) {
// Actualizar ambos contadores para compatibilidad
const totalClientes = document.getElementById('totalClientes');
if (totalClientes) {
   totalClientes.textContent = cantidad;
}

const contadorClientes = document.getElementById('contadorClientes');
if (contadorClientes) {
   contadorClientes.textContent = cantidad;
}
}

// Guardar nuevo cliente
function guardarNuevoCliente() {
console.log('Guardando nuevo cliente...');

const form = document.getElementById('formNuevoCliente');
if (!form) {
    console.error('No se encontró el formulario de nuevo cliente');
    mostrarNotificacion('Error al procesar el formulario', 'error');
    return;
}

// Validar formulario usando la API de validación de HTML5
if (!form.checkValidity()) {
    form.reportValidity();
    return;
}

// Obtener datos del formulario
const formData = new FormData(form);
const cliente = Object.fromEntries(formData.entries());

// Agregar campo de estado
cliente.estado = 'Activo';

// Mostrar indicador de carga
const btnGuardar = document.getElementById('btnGuardarNuevoCliente');
const textoOriginal = btnGuardar.innerHTML;
btnGuardar.disabled = true;
btnGuardar.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Guardando...
`;

// Enviar a la API
fetch('/api/clientes', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(cliente)
})
.then(response => {
    if (!response.ok) {
        return response.json().then(data => {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        });
    }
    return response.json();
})
.then(nuevoCliente => {
    console.log('Cliente creado:', nuevoCliente);
    
    // Actualizar lista de clientes
    if (Array.isArray(clientes)) {
        clientes.push(nuevoCliente);
    } else {
        clientes = [nuevoCliente];
    }
    actualizarTablaClientes();
    
    // Cerrar modal
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente'));
        if (modal) {
            modal.hide();
        } else {
            // Alternativa si bootstrap no está disponible
            document.getElementById('modalNuevoCliente').style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
    
    // Resetear formulario
    form.reset();
    
    // Mostrar notificación de éxito
    mostrarNotificacion('Cliente guardado correctamente', 'success');
})
.catch(error => {
    console.error('Error al guardar cliente:', error);
    mostrarNotificacion(`Error: ${error.message}`, 'danger');
})
.finally(() => {
    // Restaurar botón
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = textoOriginal;
});
}

// Editar cliente
function editarCliente(clienteId) {
console.log('Editando cliente:', clienteId);

// Encontrar el cliente
const cliente = clientes.find(c => c.clienteId === clienteId);
if (!cliente) {
    console.error('Cliente no encontrado');
    mostrarNotificacion('Cliente no encontrado', 'error');
    return;
}

// Verificar si ya existe el modal
let modalEditar = document.getElementById('modalEditarCliente');
if (modalEditar) {
    document.body.removeChild(modalEditar.parentNode);
}

// Crear modal dinámicamente
const modalHTML = `
<div class="modal fade" id="modalEditarCliente" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar Cliente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="formEditarCliente">
                    <input type="hidden" name="clienteId" id="editClienteId" value="${cliente.clienteId}">
                    <div class="mb-3">
                        <label for="editNombreCompleto" class="form-label">Nombre Completo</label>
                        <input type="text" class="form-control" id="editNombreCompleto" name="nombreCompleto" value="${cliente.nombreCompleto}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editTipoDocumento" class="form-label">Tipo de Documento</label>
                        <select class="form-select" id="editTipoDocumento" name="tipoDocumento" required>
                            <option value="INE" ${cliente.tipoDocumento === 'INE' ? 'selected' : ''}>INE</option>
                            <option value="CURP" ${cliente.tipoDocumento === 'CURP' ? 'selected' : ''}>CURP</option>
                            <option value="Pasaporte" ${cliente.tipoDocumento === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                            <option value="Otro" ${cliente.tipoDocumento === 'Otro' ? 'selected' : ''}>Otro</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="editNumeroDocumento" class="form-label">Número de Documento</label>
                        <input type="text" class="form-control" id="editNumeroDocumento" name="numeroDocumento" value="${cliente.numeroDocumento}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editTelefono" class="form-label">Teléfono</label>
                        <input type="tel" class="form-control" id="editTelefono" name="telefono" value="${cliente.telefono}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editCorreoElectronico" class="form-label">Correo Electrónico</label>
                        <input type="email" class="form-control" id="editCorreoElectronico" name="correoElectronico" value="${cliente.correoElectronico || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="editEstado" class="form-label">Estado</label>
                        <select class="form-select" id="editEstado" name="estado" required>
                            <option value="Activo" ${cliente.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                            <option value="Inactivo" ${cliente.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnGuardarEdicionCliente">Guardar Cambios</button>
            </div>
        </div>
    </div>
</div>`;

const modalContainer = document.createElement('div');
modalContainer.innerHTML = modalHTML;
document.body.appendChild(modalContainer);

// Mostrar modal
try {
    const modal = new bootstrap.Modal(document.getElementById('modalEditarCliente'));
    modal.show();
} catch (error) {
    console.error('Error al mostrar modal:', error);
    const modalElement = document.getElementById('modalEditarCliente');
    if (modalElement) {
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Crear backdrop manualmente si es necesario
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
}

// Configurar botón de guardar
const btnGuardar = document.getElementById('btnGuardarEdicionCliente');
if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarEdicionCliente);
}
}

// Guardar edición de cliente
function guardarEdicionCliente() {
console.log('Guardando edición de cliente...');

const form = document.getElementById('formEditarCliente');
if (!form) {
    console.error('No se encontró el formulario de edición');
    return;
}

// Validar formulario
if (!form.checkValidity()) {
    form.reportValidity();
    return;
}

// Obtener datos del formulario
const formData = new FormData(form);
const cliente = Object.fromEntries(formData.entries());
const clienteId = cliente.clienteId;

// Mostrar indicador de carga
const btnGuardar = document.getElementById('btnGuardarEdicionCliente');
const textoOriginal = btnGuardar.innerHTML;
btnGuardar.disabled = true;
btnGuardar.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Guardando...
`;

// Enviar a la API
fetch(`/api/clientes/${clienteId}`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(cliente)
})
.then(response => {
    if (!response.ok) {
        return response.json().then(data => {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        });
    }
    return response.json();
})
.then(clienteActualizado => {
    console.log('Cliente actualizado:', clienteActualizado);
    
    // Actualizar en la lista local
    const index = clientes.findIndex(c => c.clienteId === clienteId);
    if (index !== -1) {
        clientes[index] = clienteActualizado;
    }
    
    // Actualizar tabla
    actualizarTablaClientes();
    
    // Cerrar modal
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarCliente'));
        if (modal) {
            modal.hide();
        } else {
            // Alternativa si bootstrap no está disponible
            document.getElementById('modalEditarCliente').style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
    
    // Mostrar notificación
    mostrarNotificacion('Cliente actualizado correctamente', 'success');
})
.catch(error => {
    console.error('Error al actualizar cliente:', error);
    mostrarNotificacion(`Error: ${error.message}`, 'danger');
})
.finally(() => {
    // Restaurar botón
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = textoOriginal;
});
}

// Ver préstamos del cliente
function verPrestamosCliente(clienteId) {
console.log('Viendo préstamos del cliente:', clienteId);

// Encontrar el cliente
const cliente = clientes.find(c => c.clienteId === clienteId);
if (!cliente) {
    console.error('Cliente no encontrado');
    mostrarNotificacion('Cliente no encontrado', 'error');
    return;
}

// Verificar si ya existe el modal
let modalPrestamos = document.getElementById('modalPrestamosCliente');
if (modalPrestamos) {
    document.body.removeChild(modalPrestamos.parentNode);
}

// Crear modal dinámicamente
const modalHTML = `
<div class="modal fade" id="modalPrestamosCliente" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Préstamos de ${cliente.nombreCompleto}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6>Información del cliente</h6>
                        <p><strong>Documento:</strong> ${cliente.tipoDocumento}: ${cliente.numeroDocumento}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                        <p><strong>Correo:</strong> ${cliente.correoElectronico || '-'}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-primary" id="btnNuevoPrestamoCliente">
                            <i class="fas fa-plus"></i> Nuevo Préstamo
                        </button>
                    </div>
                </div>
                <div id="prestamosClienteContenedor">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p>Cargando préstamos...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>`;

const modalContainer = document.createElement('div');
modalContainer.innerHTML = modalHTML;
document.body.appendChild(modalContainer);

// Mostrar modal
try {
    const modal = new bootstrap.Modal(document.getElementById('modalPrestamosCliente'));
    modal.show();
} catch (error) {
    console.error('Error al mostrar modal:', error);
    const modalElement = document.getElementById('modalPrestamosCliente');
    if (modalElement) {
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Crear backdrop manualmente si es necesario
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
}

// Configurar botón de nuevo préstamo
const btnNuevoPrestamo = document.getElementById('btnNuevoPrestamoCliente');
if (btnNuevoPrestamo) {
    btnNuevoPrestamo.addEventListener('click', function() {
        // Almacenar el ID del cliente para pasar a la página de nuevo préstamo
        sessionStorage.setItem('clienteSeleccionadoId', cliente.clienteId);
        sessionStorage.setItem('clienteSeleccionadoNombre', cliente.nombreCompleto);
        
        // Cerrar modal
        try {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
            if (modal) modal.hide();
        } catch (error) {
            // Alternativa manual
            const modalElement = document.getElementById('modalPrestamosCliente');
            if (modalElement) {
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
        
        // Navegar a la página de nuevo préstamo
        if (typeof loadPage === 'function') {
            loadPage('nuevo-prestamo');
        } else {
            // Alternativa si loadPage no está disponible
            window.location.href = '/nuevo-prestamo';
        }
    });
}

// Cargar préstamos del cliente
fetch(`/api/clientes/${clienteId}/prestamos`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(prestamos => {
        console.log(`Se cargaron ${prestamos.length} préstamos del cliente`);
        
        const contenedor = document.getElementById('prestamosClienteContenedor');
        if (!contenedor) return;
        
        if (prestamos.length === 0) {
            contenedor.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    El cliente no tiene préstamos registrados.
                </div>
            `;
            return;
        }
        
        // Crear tabla de préstamos
        let html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Plazo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        prestamos.forEach(prestamo => {
            // Formatear fecha
            const fecha = new Date(prestamo.fechaSolicitud);
            const fechaFormateada = fecha.toLocaleDateString();
            
            // Formatear monto
            const monto = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(prestamo.cantidadPrestamo);
            
            html += `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td>${monto}</td>
                    <td>${prestamo.plazoMeses} meses</td>
                    <td>
                        <span class="badge bg-${
                            prestamo.estado === 'Activo' ? 'success' : 
                            prestamo.estado === 'Pagado' ? 'info' : 
                            'secondary'
                        }">
                            ${prestamo.estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary ver-prestamo" 
                                data-id="${prestamo.prestamoId}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${prestamo.estado === 'Activo' ? `
                            <button class="btn btn-sm btn-outline-success registrar-pago" 
                                    data-id="${prestamo.prestamoId}" title="Registrar pago">
                                <i class="fas fa-money-bill-wave"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        contenedor.innerHTML = html;
        
        // Configurar botones de acción
        document.querySelectorAll('.ver-prestamo').forEach(btn => {
            btn.addEventListener('click', function() {
                const prestamoId = this.getAttribute('data-id');
                // Cerrar modal actual
                try {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
                    if (modal) modal.hide();
                } catch (error) {
                    // Alternativa manual
                    const modalElement = document.getElementById('modalPrestamosCliente');
                    if (modalElement) {
                        modalElement.classList.remove('show');
                        modalElement.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
                
                // Navegar a la página de préstamos y mostrar detalles
                if (typeof loadPage === 'function' && typeof verPrestamo === 'function') {
                    loadPage('prestamos');
                    setTimeout(() => {
                        verPrestamo(prestamoId);
                    }, 500);
                } else {
                    window.location.href = `/prestamos?id=${prestamoId}`;
                }
            });
        });
        
        document.querySelectorAll('.registrar-pago').forEach(btn => {
            btn.addEventListener('click', function() {
                const prestamoId = this.getAttribute('data-id');
                // Cerrar modal actual
                try {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
                    if (modal) modal.hide();
                } catch (error) {
                    // Alternativa manual
                    const modalElement = document.getElementById('modalPrestamosCliente');
                    if (modalElement) {
                        modalElement.classList.remove('show');
                        modalElement.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
                
                // Navegar a la página de pagos e iniciar registro
                if (typeof loadPage === 'function') {
                    loadPage('pagos');
                    setTimeout(() => {
                        if (typeof iniciarPago === 'function') {
                            iniciarPago(prestamoId);
                        } else {
                            // Guardar para cuando se cargue la página
                            window.pendingPayment = { prestamoId };
                            console.log('Pago pendiente guardado:', window.pendingPayment);
                            showNotification('Navegando a la página de pagos...', 'info');
                        }
                    }, 500);
                } else {
                    window.location.href = `/pagos?prestamo=${prestamoId}`;
                }
            });
        });
    })
    .catch(error => {
        console.error('Error al cargar préstamos del cliente:', error);
        
        const contenedor = document.getElementById('prestamosClienteContenedor');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los préstamos: ${error.message}
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="cargarPrestamosPorCliente('${clienteId}')">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        }
    });
}

// NUEVA FUNCIÓN: Cargar préstamos por cliente (para reintentos)
function cargarPrestamosPorCliente(clienteId) {
const contenedor = document.getElementById('prestamosClienteContenedor');
if (contenedor) {
    contenedor.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p>Cargando préstamos...</p>
        </div>
    `;
}

fetch(`/api/clientes/${clienteId}/prestamos?t=${Date.now()}`)
    .then(response => response.json())
    .then(prestamos => {
        // Procesar igual que en verPrestamosCliente
        // (Código reutilizado del método principal)
        console.log(`Se cargaron ${prestamos.length} préstamos del cliente`);
        
        if (!contenedor) return;
        
        if (prestamos.length === 0) {
            contenedor.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    El cliente no tiene préstamos registrados.
                </div>
            `;
            return;
        }
        
        // Resto del código igual que en verPrestamosCliente
        // Crear tabla con los datos...
    })
    .catch(error => {
        console.error('Error al recargar préstamos:', error);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los préstamos: ${error.message}
                </div>
            `;
        }
    });
}

// Eliminar cliente
function eliminarCliente(clienteId) {
console.log('Eliminando cliente:', clienteId);

// Encontrar el cliente
const cliente = clientes.find(c => c.clienteId === clienteId);
if (!cliente) {
    console.error('Cliente no encontrado');
    mostrarNotificacion('Cliente no encontrado', 'error');
    return;
}

// Mostrar confirmación
if (!confirm(`¿Está seguro de que desea eliminar al cliente "${cliente.nombreCompleto}"? Esta acción no se puede deshacer.`)) {
    return;
}

// Enviar a la API
fetch(`/api/clientes/${clienteId}`, {
    method: 'DELETE'
})
.then(response => {
    if (!response.ok) {
        return response.json().then(data => {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        });
    }
    return response.json();
})
.then(data => {
    console.log('Cliente eliminado:', data);
    
    // Eliminar de la lista local
    const index = clientes.findIndex(c => c.clienteId === clienteId);
    if (index !== -1) {
        clientes.splice(index, 1);
    }
    
    // Actualizar tabla
    actualizarTablaClientes();
    
    // Mostrar notificación
    mostrarNotificacion('Cliente eliminado correctamente', 'success');
})
.catch(error => {
    console.error('Error al eliminar cliente:', error);
    
    // Si tiene préstamos activos, mostrar mensaje específico
    if (error.message.includes('préstamos activos')) {
        mostrarNotificacion('No se puede eliminar un cliente con préstamos activos', 'warning');
    } else {
        mostrarNotificacion(`Error: ${error.message}`, 'danger');
    }
});
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
// Si existe la función global showNotification, usarla
if (typeof showNotification === 'function') {
    showNotification(mensaje, tipo);
    return;
}

// Implementación local de notificaciones
const toast = document.createElement('div');
toast.className = `toast toast-${tipo} position-fixed top-0 end-0 m-3`;
toast.setAttribute('role', 'alert');
toast.setAttribute('aria-live', 'assertive');
toast.setAttribute('aria-atomic', 'true');

toast.innerHTML = `
    <div class="toast-header">
        <strong class="me-auto">Portal de Préstamos</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
        ${mensaje}
    </div>
`;

document.body.appendChild(toast);

// Usar Bootstrap Toast si está disponible
try {
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    
    bsToast.show();
} catch (error) {
    // Fallback si Bootstrap no está disponible
    console.warn('Bootstrap Toast no disponible, usando implementación fallback');
    toast.classList.add('show');
    
    // Configurar botón de cerrar manualmente
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        });
    }
    
    // Auto ocultar después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 5000);
}
}

// NUEVA FUNCIÓN: Recuperar vista de clientes
function recuperarVistaClientes() {
console.log('🔄 Ejecutando recuperación automática de vista de clientes');

// 1. Verificar si ya tenemos datos cargados
if (Array.isArray(clientes) && clientes.length > 0) {
    console.log('Datos ya cargados, actualizando vista...');
    actualizarTablaClientes();
    return true;
}

// 2. Verificar DOM
const container = document.getElementById('clientes');
if (!container) {
    console.error('Contenedor #clientes no encontrado, no se puede recuperar');
    return false;
}

// 3. Reconstruir estructura si es necesario
let tablaClientes = document.getElementById('tablaClientes');
if (!tablaClientes) {
    console.log('Tabla de clientes no encontrada, reconstruyendo...');
    
    // Buscar la card-body o crear una
    let cardBody = container.querySelector('.card-body');
    if (!cardBody) {
        const card = container.querySelector('.card') || document.createElement('div');
        if (!card.parentNode) {
            container.appendChild(card);
            card.className = 'card shadow mb-4';
        }
        
        // Crear card-body
        cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        card.appendChild(cardBody);
    }
    
    // Crear estructura de tabla
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive';
    cardBody.appendChild(tableWrapper);
    
    tablaClientes = document.createElement('table');
    tablaClientes.id = 'tablaClientes';
    tablaClientes.className = 'table table-bordered';
    tablaClientes.setAttribute('width', '100%');
    tablaClientes.setAttribute('cellspacing', '0');
    tableWrapper.appendChild(tablaClientes);
    
    // Crear cabecera de tabla
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Estado</th>
            <th>Acciones</th>
        </tr>
    `;
    tablaClientes.appendChild(thead);
    
    // Crear cuerpo de tabla
    const tbody = document.createElement('tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">Cargando clientes...</td>
        </tr>
    `;
    tablaClientes.appendChild(tbody);
    
    // Crear contador de clientes
    const contadorDiv = document.createElement('div');
    contadorDiv.className = 'mt-3';
    contadorDiv.innerHTML = `
        <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
        <span id="contadorClientes" style="display:none">0</span>
    `;
    cardBody.appendChild(contadorDiv);
}

// 4. Recargar datos
cargarClientes(true);

return true;
}

// Función para diagnosticar problemas de carga de clientes
window.debugClientLoad = function() {
console.log('INICIANDO DIAGNÓSTICO COMPLETO DE CARGA DE CLIENTES');

// 1. Verificar DOM
console.log('1. ESTRUCTURA DOM:');
console.log('- Container #clientes existe:', !!document.getElementById('clientes'));
console.log('- Tabla #tablaClientes existe:', !!document.querySelector('#tablaClientes'));
console.log('- tbody en tabla existe:', !!document.querySelector('#tablaClientes tbody'));

// 2. Verificar datos
console.log('2. ESTRUCTURA DE DATOS:');
console.log('- Tipo de clientes:', typeof clientes);
console.log('- ¿Es array?', Array.isArray(clientes));
console.log('- Longitud:', clientes ? clientes.length : 'N/A');

// 3. Intentar corregir datos si es necesario
if (!Array.isArray(clientes) && typeof clientes === 'object') {
    console.log('3. INTENTO DE RECUPERACIÓN:');
    for (const key in clientes) {
        console.log(`- Verificando clientes.${key}:`, typeof clientes[key], Array.isArray(clientes[key]));
    }
}

// 4. Intentar cargar datos manualmente
console.log('4. CARGA MANUAL:');
fetch(`/api/clientes?t=${Date.now()}`)
    .then(response => {
        console.log('- Respuesta recibida:', response.status, response.statusText);
        console.log('- Tipo de contenido:', response.headers.get('content-type'));
        return response.text();
    })
    .then(text => {
        console.log('- Respuesta como texto (primeros 100 caracteres):', text.substring(0, 100));
        try {
            const data = JSON.parse(text);
            console.log('- JSON parseado correctamente:', typeof data);
            console.log('- Contenido resumido:', data);
            
            // Intentar actualizar manualmente
            if (Array.isArray(data) && data.length > 0) {
                console.log('- Encontrado array válido, actualizando datos...');
                clientes = data;
                window.clientes = data;
                actualizarTablaClientes();
                mostrarNotificacion('Datos recuperados exitosamente', 'success');
                return '✅ Corrección aplicada con éxito.';
            } else if (data && typeof data === 'object') {
                // Buscar un array dentro del objeto
                for (const key in data) {
                    if (Array.isArray(data[key]) && data[key].length > 0) {
                        console.log(`- Encontrado array en data.${key}, utilizando esto...`);
                        clientes = data[key];
                        window.clientes = data[key];
                        actualizarTablaClientes();
                        mostrarNotificacion('Datos recuperados exitosamente', 'success');
                        return '✅ Corrección aplicada con éxito.';
                    }
                }
            }
            
            console.log('❌ No se pudo encontrar un array válido en la respuesta.');
            mostrarNotificacion('No se pudieron recuperar los datos', 'error');
        } catch (error) {
            console.error('❌ Error al procesar la respuesta:', error);
            mostrarNotificacion('Error al procesar los datos: ' + error.message, 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error en la petición:', error);
        mostrarNotificacion('Error en la conexión: ' + error.message, 'error');
    });
};

// Agregar función automática de diagnóstico al DOM cargado
document.addEventListener('DOMContentLoaded', function() {
console.log('DOM completamente cargado, inicializando con retraso...');

// Agregar un detector de problemas de carga
if (window.currentPage === 'clientes') {
    setTimeout(() => {
        // Comprobar si hay problemas de carga
        const tbody = document.querySelector('#tablaClientes tbody');
        if (tbody && tbody.textContent.includes('Cargando clientes')) {
            console.warn('Se detectó un posible problema: clientes no mostrados después de 5 segundos');
            window.debugClientLoad();
        }
    }, 5000);
}
});

// NUEVA FUNCIÓN: Comprobar conectividad al servidor
function comprobarConectividad() {
fetch('/api/health-check')
    .then(response => {
        if (response.ok) {
            console.log('Conectividad al servidor: OK');
            return true;
        } else {
            console.warn('Servidor disponible pero responde con error:', response.status);
            return false;
        }
    })
    .catch(error => {
        console.error('Error de conectividad al servidor:', error);
        return false;
    });
}

// NUEVO: Limpieza y optimización de navegación
window.addEventListener('beforeunload', function() {
// Limpiar recursos al navegar fuera de la página
// Esto ayuda con la administración de memoria
clientes = null;
clienteSeleccionado = null;
});

// Exponer funciones al ámbito global
window.initClientesPage = initClientesPage;
window.inicializarPaginaClientes = initClientesPage; // Alias para compatibilidad
window.cargarClientes = cargarClientes;
window.actualizarTablaClientes = actualizarTablaClientes;
window.mostrarDetallesCliente = verPrestamosCliente;
window.editarCliente = editarCliente;
window.verPrestamosCliente = verPrestamosCliente;
window.eliminarCliente = eliminarCliente;
window.crearClientesPrueba = crearClientesPrueba;
window.refrescarListaClientes = refrescarListaClientes;
window.recuperarVistaClientes = recuperarVistaClientes;