/**
 * clientes-fixed.js - Solución completa para el módulo de clientes
 * Este archivo unifica todas las funcionalidades y resuelve conflictos
 */

// Asegurar que la caché existe
window.clientesCache = window.clientesCache || {
    datos: [],
    timestamp: 0,
    cargando: false
};

// SECCIÓN 1: CARGA DE CLIENTES
// ============================

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
            
            // SOLUCIÓN A DUPLICADOS: Eliminar posibles duplicados por clienteId
            const uniqueClientes = [];
            const clienteIds = new Set();
            
            clientesArray.forEach(cliente => {
                if (cliente.clienteId && !clienteIds.has(cliente.clienteId)) {
                    clienteIds.add(cliente.clienteId);
                    uniqueClientes.push(cliente);
                }
            });
            
            // Usar el array sin duplicados
            clientesArray = uniqueClientes;
            
            // Actualizar caché
            window.clientesCache.datos = clientesArray;
            window.clientesCache.timestamp = Date.now();
            window.clientesCache.cargando = false;
            
            // Guardar en variable global para compatibilidad con clientes.js
            window.clientes = clientesArray;
            
            // Actualizar la tabla
            mostrarClientesEnTabla(clientesArray);

            implementarBusquedaEnTiempoReal();
            
            // NUEVO: Notificar a otros módulos sobre la actualización de los datos
            notificarCambiosClientes('cargar', null);
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

// NUEVO: Función para notificar cambios en clientes a otros módulos
function notificarCambiosClientes(accion, datos) {
    // Verificar si existe el sistema de eventos
    if (window.appEvents && typeof window.appEvents.emit === 'function') {
        console.log(`📣 Notificando cambio en clientes: ${accion}`, datos);
        window.appEvents.emit('clientesActualizados', {
            accion: accion,
            datos: datos,
            timestamp: Date.now()
        });
    } else {
        console.log('Sistema de eventos no disponible para notificar cambios');
        
        // Intento alternativo de actualización del dashboard si estamos en otra página
        if (window.currentPage === 'dashboard' && typeof loadCounters === 'function') {
            console.log('Actualizando dashboard directamente...');
            setTimeout(loadCounters, 500);
        }
    }
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
            
            // SOLUCIÓN A PROBLEMA DE IDs: Usar data-* para almacenar el ID en lugar de onclick
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
        } catch (error) {
            console.error('Error al renderizar cliente:', cliente, error);
        }
    });
    
    // Actualizar contador de clientes
    actualizarContador(clientes.length);
    
    // Configurar eventos de botones después de renderizar la tabla
    configurarBotonesAccion();
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

// SECCIÓN 2: ACCIONES DE CLIENTES
// ==============================

// Configurar botones de acción para cada cliente
function configurarBotonesAccion() {
    console.log('🔧 Configurando botones de acción para clientes...');
    
    // Botones de editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        // IMPORTANTE: Eliminar evento previo antes de agregar uno nuevo
        btn.removeEventListener('click', handleEditarClick);
        btn.addEventListener('click', handleEditarClick);
    });
    
    // Botones de préstamos
    document.querySelectorAll('.btn-prestamos').forEach(btn => {
        btn.removeEventListener('click', handlePrestamosClick);
        btn.addEventListener('click', handlePrestamosClick);
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.removeEventListener('click', handleEliminarClick);
        btn.addEventListener('click', handleEliminarClick);
    });
    
    // Botón nuevo cliente
    const btnNuevoCliente = document.getElementById('btnNuevoCliente');
    if (btnNuevoCliente) {
        btnNuevoCliente.removeEventListener('click', abrirModalNuevoCliente);
        btnNuevoCliente.addEventListener('click', abrirModalNuevoCliente);
    }

    implementarBusquedaEnTiempoReal();
}

// Funciones manejadoras para evitar el problema de "this"
function handleEditarClick() {
    const clienteId = this.getAttribute('data-id');
    editarCliente(clienteId);
}

function handlePrestamosClick() {
    const clienteId = this.getAttribute('data-id');
    verPrestamosCliente(clienteId);
}

function handleEliminarClick() {
    const clienteId = this.getAttribute('data-id');
    eliminarCliente(clienteId);
}

// Función para editar cliente
function editarCliente(clienteId) {
    console.log('✏️ Editando cliente:', clienteId);
    
    if (!clienteId) {
        console.error('ID de cliente no proporcionado');
        showNotification('Error: ID de cliente no válido', 'error');
        return;
    }
    
    // Buscar cliente en caché
    const cliente = buscarClientePorId(clienteId);
    
    if (!cliente) {
        console.error('Cliente no encontrado con ID:', clienteId);
        showNotification('Cliente no encontrado', 'error');
        return;
    }
    
    console.log('Cliente encontrado:', cliente);
    
    // Asegurar que existe el modal
    let modalEditar = document.getElementById('modalEditarCliente');
    if (!modalEditar) {
        crearModalEditarCliente();
        modalEditar = document.getElementById('modalEditarCliente');
    }
    
    // Rellenar los campos del formulario con los datos del cliente
    document.getElementById('editClienteId').value = cliente.clienteId;
    document.getElementById('editNombreCompleto').value = cliente.nombreCompleto || '';
    document.getElementById('editTipoDocumento').value = cliente.tipoDocumento || 'INE';
    document.getElementById('editNumeroDocumento').value = cliente.numeroDocumento || '';
    document.getElementById('editTelefono').value = cliente.telefono || '';
    document.getElementById('editCorreoElectronico').value = cliente.correoElectronico || '';
    document.getElementById('editEstado').value = cliente.estado || 'Activo';
    
    // Configurar botón de guardar
    const btnGuardar = document.getElementById('btnGuardarEdicionCliente');
    if (btnGuardar) {
        btnGuardar.removeEventListener('click', guardarEdicionCliente);
        btnGuardar.addEventListener('click', guardarEdicionCliente);
    }
    
    // Mostrar modal
    try {
        const modal = new bootstrap.Modal(modalEditar);
        modal.show();
    } catch (error) {
        console.error('Error al mostrar modal:', error);
        showNotification('Error al abrir el formulario de edición', 'error');
    }
}

// Función para crear el modal de edición si no existe
function crearModalEditarCliente() {
    console.log('Creando modal de edición de cliente...');
    
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
                        <input type="hidden" id="editClienteId" name="clienteId">
                        <div class="mb-3">
                            <label for="editNombreCompleto" class="form-label">Nombre Completo</label>
                            <input type="text" class="form-control" id="editNombreCompleto" name="nombreCompleto" required>
                        </div>
                        <div class="mb-3">
                            <label for="editTipoDocumento" class="form-label">Tipo de Documento</label>
                            <select class="form-select" id="editTipoDocumento" name="tipoDocumento" required>
                                <option value="INE">INE</option>
                                <option value="CURP">CURP</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="editNumeroDocumento" class="form-label">Número de Documento</label>
                            <input type="text" class="form-control" id="editNumeroDocumento" name="numeroDocumento" required>
                        </div>
                        <div class="mb-3">
                            <label for="editTelefono" class="form-label">Teléfono</label>
                            <input type="tel" class="form-control" id="editTelefono" name="telefono" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCorreoElectronico" class="form-label">Correo Electrónico</label>
                            <input type="email" class="form-control" id="editCorreoElectronico" name="correoElectronico">
                        </div>
                        <div class="mb-3">
                            <label for="editEstado" class="form-label">Estado</label>
                            <select class="form-select" id="editEstado" name="estado" required>
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
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
}

// Función para guardar la edición de un cliente
function guardarEdicionCliente() {
    console.log('💾 Guardando edición de cliente...');
    
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
        
        // Actualizar en caché
        actualizarClienteEnCache(clienteActualizado);
        
        // Actualizar tabla
        mostrarClientesEnTabla(window.clientesCache.datos || window.clientes);
        
        // Cerrar modal
        try {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarCliente'));
            if (modal) {
                modal.hide();
            }
        } catch (error) {
            console.error('Error al cerrar modal:', error);
        }
        
        // Mostrar notificación
        showNotification('Cliente actualizado correctamente', 'success');
        
        // NUEVO: Notificar a otros módulos sobre la actualización
        notificarCambiosClientes('editar', clienteActualizado);
    })
    .catch(error => {
        console.error('Error al actualizar cliente:', error);
        showNotification(`Error: ${error.message}`, 'danger');
    })
    .finally(() => {
        // Restaurar botón
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = textoOriginal;
    });
}

// Función para ver préstamos de cliente
function verPrestamosCliente(clienteId) {
    console.log('👁️ Viendo préstamos del cliente:', clienteId);
    
    if (!clienteId) {
        console.error('ID de cliente no proporcionado');
        showNotification('Error: ID de cliente no válido', 'error');
        return;
    }
    
    // Buscar cliente en caché
    const cliente = buscarClientePorId(clienteId);
    
    if (!cliente) {
        console.error('Cliente no encontrado con ID:', clienteId);
        showNotification('Cliente no encontrado', 'error');
        return;
    }
    
    console.log('Cliente encontrado:', cliente);
    
    // Asegurar que existe el modal
    let modalPrestamos = document.getElementById('modalPrestamosCliente');
    if (!modalPrestamos) {
        crearModalPrestamosCliente(cliente);
        modalPrestamos = document.getElementById('modalPrestamosCliente');
    } else {
        // Actualizar título e información del cliente
        const titulo = modalPrestamos.querySelector('.modal-title');
        if (titulo) titulo.textContent = `Préstamos de ${cliente.nombreCompleto}`;
        
        const infoCliente = modalPrestamos.querySelector('.modal-body .row.mb-4 .col-md-6:first-child');
        if (infoCliente) {
            infoCliente.innerHTML = `
                <h6>Información del cliente</h6>
                <p><strong>Documento:</strong> ${cliente.tipoDocumento}: ${cliente.numeroDocumento}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                <p><strong>Correo:</strong> ${cliente.correoElectronico || '-'}</p>
            `;
        }
    }
    
    // Mostrar modal
    try {
        const modal = new bootstrap.Modal(modalPrestamos);
        modal.show();
    } catch (error) {
        console.error('Error al mostrar modal:', error);
        showNotification('Error al abrir la ventana de préstamos', 'error');
        return;
    }
    
    // Configurar botón de nuevo préstamo
    const btnNuevoPrestamo = document.getElementById('btnNuevoPrestamoCliente');
    if (btnNuevoPrestamo) {
        btnNuevoPrestamo.removeEventListener('click', handleNuevoPrestamo);
        btnNuevoPrestamo.addEventListener('click', function() {
            handleNuevoPrestamo(cliente);
        });
    }
    
    // Cargar préstamos del cliente
    cargarPrestamosCliente(clienteId);
}

// Función para crear el modal de préstamos si no existe
function crearModalPrestamosCliente(cliente) {
    console.log('Creando modal de préstamos de cliente...');
    
    const modalHTML = `
    <div class="modal fade" id="modalPrestamosCliente" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalPrestamosClienteLabel">Préstamos de ${cliente.nombreCompleto}</h5>
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
}

// Función para manejar el botón de nuevo préstamo
function handleNuevoPrestamo(cliente) {
    // Almacenar el ID del cliente para pasar a la página de nuevo préstamo
    sessionStorage.setItem('clienteSeleccionadoId', cliente.clienteId);
    sessionStorage.setItem('clienteSeleccionadoNombre', cliente.nombreCompleto);
    
    // Cerrar modal
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
        if (modal) modal.hide();
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
    
    // Navegar a la página de nuevo préstamo
    if (typeof loadPage === 'function') {
        loadPage('nuevo-prestamo');
    } else {
        window.location.href = '/nuevo-prestamo';
    }
}

// Función para cargar préstamos del cliente
function cargarPrestamosCliente(clienteId) {
    const contenedor = document.getElementById('prestamosClienteContenedor');
    if (!contenedor) return;
    
    contenedor.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p>Cargando préstamos...</p>
        </div>
    `;
    
    fetch(`/api/clientes/${clienteId}/prestamos`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(prestamos => {
            console.log(`Se cargaron ${prestamos.length} préstamos del cliente`);
            
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
                    verPrestamo(prestamoId);
                });
            });
            
            document.querySelectorAll('.registrar-pago').forEach(btn => {
                btn.addEventListener('click', function() {
                    const prestamoId = this.getAttribute('data-id');
                    registrarPagoPrestamo(prestamoId);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar préstamos del cliente:', error);
            
            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los préstamos: ${error.message}
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="cargarPrestamosCliente('${clienteId}')">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        });
}

// Función para ver detalles de préstamo
function verPrestamo(prestamoId) {
    // Cerrar modal de préstamos
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
        if (modal) modal.hide();
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
    
    // Navegar a la página de préstamos y mostrar detalles
    if (typeof loadPage === 'function') {
        loadPage('prestamos');
        setTimeout(() => {
            if (typeof window.verPrestamo === 'function') {
                window.verPrestamo(prestamoId);
            } else {
                // Almacenar ID para cuando se cargue la página
                window.pendingPrestamoDetails = prestamoId;
            }
        }, 500);
    } else {
        window.location.href = `/prestamos?id=${prestamoId}`;
    }
}

// Función para registrar pago de préstamo
function registrarPagoPrestamo(prestamoId) {
    // Cerrar modal de préstamos
    try {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrestamosCliente'));
        if (modal) modal.hide();
    } catch (error) {
        console.error('Error al cerrar modal:', error);
    }
    
    // Navegar a la página de pagos e iniciar registro
    if (typeof loadPage === 'function') {
        loadPage('pagos');
        setTimeout(() => {
            if (typeof window.iniciarPago === 'function') {
                window.iniciarPago(prestamoId);
            } else {
                // Almacenar ID para cuando se cargue la página
                window.pendingPayment = { prestamoId };
                showNotification('Navegando a la página de pagos...', 'info');
            }
        }, 500);
    } else {
        window.location.href = `/pagos?prestamo=${prestamoId}`;
    }
}

// Función para eliminar cliente
function eliminarCliente(clienteId) {
    console.log('🗑️ Eliminando cliente:', clienteId);
    
    if (!clienteId) {
        console.error('ID de cliente no proporcionado');
        showNotification('Error: ID de cliente no válido', 'error');
        return;
    }
    
    // Buscar cliente en caché
    const cliente = buscarClientePorId(clienteId);
    
    if (!cliente) {
        console.error('Cliente no encontrado con ID:', clienteId);
        showNotification('Cliente no encontrado', 'error');
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
        
        // Eliminar de la caché
        if (window.clientesCache && window.clientesCache.datos) {
            window.clientesCache.datos = window.clientesCache.datos.filter(c => c.clienteId !== clienteId);
        }
        
        // Eliminar de la variable global
        if (window.clientes) {
            window.clientes = window.clientes.filter(c => c.clienteId !== clienteId);
        }
        
        // Actualizar tabla
        mostrarClientesEnTabla(window.clientesCache.datos || window.clientes);
        
        // Mostrar notificación
        showNotification('Cliente eliminado correctamente', 'success');
        
        // NUEVO: Notificar a otros módulos sobre la eliminación
        notificarCambiosClientes('eliminar', { clienteId });
    })
    .catch(error => {
        console.error('Error al eliminar cliente:', error);
        
        // Si tiene préstamos activos, mostrar mensaje específico
        if (error.message.includes('préstamos activos')) {
            showNotification('No se puede eliminar un cliente con préstamos activos', 'warning');
        } else {
            showNotification(`Error: ${error.message}`, 'danger');
        }
    });
}

// SECCIÓN 3: NUEVO CLIENTE
// =======================

// Función para abrir modal de nuevo cliente
function abrirModalNuevoCliente() {
    console.log('📝 Abriendo modal de nuevo cliente...');
    
    // Verificar si existe el modal
    let modalNuevo = document.getElementById('modalNuevoCliente');
    
    if (!modalNuevo) {
        console.log('Modal no encontrado, creando uno nuevo...');
        crearModalNuevoCliente();
        modalNuevo = document.getElementById('modalNuevoCliente');
    }
    
    // Limpiar formulario si existe
    const form = document.getElementById('formNuevoCliente');
    if (form) {
        form.reset();
    }
    
    // Configurar botón de guardar
    const btnGuardar = document.getElementById('btnGuardarNuevoCliente');
    if (btnGuardar) {
        btnGuardar.removeEventListener('click', guardarNuevoCliente);
        btnGuardar.addEventListener('click', guardarNuevoCliente);
    }
    
    // Mostrar modal
    try {
        const modal = new bootstrap.Modal(modalNuevo);
        modal.show();
    } catch (error) {
        console.error('Error al mostrar modal:', error);
        showNotification('Error al abrir el formulario de nuevo cliente', 'error');
    }
}

// Función para crear el modal de nuevo cliente si no existe
function crearModalNuevoCliente() {
    console.log('Creando modal de nuevo cliente...');
    
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

// Función mejorada para guardar un nuevo cliente
function guardarNuevoCliente() {
    console.log('💾 Guardando nuevo cliente (mejorado)...');
    
    const form = document.getElementById('formNuevoCliente');
    if (!form) {
        console.error('No se encontró el formulario de nuevo cliente');
        showNotification('Error al procesar el formulario', 'error');
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
    const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';
    
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Guardando...
        `;
    }
    
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
        console.log('Cliente creado exitosamente:', nuevoCliente);
        
        // MEJORA 1: Asegurar que clientesCache exista
        if (!window.clientesCache) {
            window.clientesCache = { datos: [], timestamp: Date.now() };
        }
        
        // MEJORA 2: Actualizar caché explícitamente
        if (window.clientesCache && window.clientesCache.datos) {
            // Verificar si ya existe el cliente para evitar duplicados
            const existe = window.clientesCache.datos.some(c => 
                c.clienteId === nuevoCliente.clienteId || 
                (c.numeroDocumento === nuevoCliente.numeroDocumento && c.tipoDocumento === nuevoCliente.tipoDocumento)
            );
            
            if (!existe) {
                // Agregar cliente al principio del array para que aparezca primero en la tabla
                window.clientesCache.datos.unshift(nuevoCliente);
                console.log(`Cliente agregado a caché, total: ${window.clientesCache.datos.length}`);
                
                // Actualizar timestamp para marcar caché como reciente
                window.clientesCache.timestamp = Date.now();
            } else {
                console.warn('Cliente ya existente en caché, actualizando datos...');
                // Actualizar el cliente existente
                const index = window.clientesCache.datos.findIndex(c => 
                    c.clienteId === nuevoCliente.clienteId || 
                    (c.numeroDocumento === nuevoCliente.numeroDocumento && c.tipoDocumento === nuevoCliente.tipoDocumento)
                );
                if (index !== -1) {
                    window.clientesCache.datos[index] = nuevoCliente;
                }
            }
        }
        
        // MEJORA 3: Actualizar variable global para compatibilidad
        if (Array.isArray(window.clientes)) {
            const existe = window.clientes.some(c => 
                c.clienteId === nuevoCliente.clienteId || 
                (c.numeroDocumento === nuevoCliente.numeroDocumento && c.tipoDocumento === nuevoCliente.tipoDocumento)
            );
            
            if (!existe) {
                window.clientes.unshift(nuevoCliente); // Agregar al principio
            } else {
                // Actualizar el cliente existente
                const index = window.clientes.findIndex(c => 
                    c.clienteId === nuevoCliente.clienteId || 
                    (c.numeroDocumento === nuevoCliente.numeroDocumento && c.tipoDocumento === nuevoCliente.tipoDocumento)
                );
                if (index !== -1) {
                    window.clientes[index] = nuevoCliente;
                }
            }
        } else {
            window.clientes = [nuevoCliente];
        }
        
        // MEJORA 4: Cerrar modal primero para mejor UX
        try {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente'));
            if (modal) {
                modal.hide();
            }
        } catch (error) {
            console.error('Error al cerrar modal:', error);
        }
        
        // Resetear formulario
        if (form) {
            form.reset();
        }
        
        // MEJORA 5: Mostrar notificación de éxito
        showNotification('Cliente guardado correctamente', 'success');
        
        // MEJORA 6: Notificar a otros módulos sobre la creación con más información
        notificarCambiosClientes('crear', nuevoCliente);
        
        // MEJORA 7: Actualizar tabla con retraso para asegurar carga completa
        setTimeout(() => {
            console.log('Actualizando la visualización de la tabla después de crear cliente...');
            // Intentar diferentes métodos para asegurar la actualización de la tabla
            if (typeof mostrarClientesEnTabla === 'function') {
                const datos = window.clientesCache?.datos || window.clientes || [];
                mostrarClientesEnTabla(datos);
                console.log('Tabla actualizada con mostrarClientesEnTabla()');
            } else if (typeof window.mostrarClientesEnTabla === 'function') {
                const datos = window.clientesCache?.datos || window.clientes || [];
                window.mostrarClientesEnTabla(datos);
                console.log('Tabla actualizada con window.mostrarClientesEnTabla()');
            } else if (typeof window.actualizarTablaClientes === 'function') {
                window.actualizarTablaClientes();
                console.log('Tabla actualizada con window.actualizarTablaClientes()');
            } else if (typeof garantizarCargaClientes === 'function') {
                garantizarCargaClientes();
                console.log('Tabla actualizada con garantizarCargaClientes()');
            } else {
                console.warn('⚠️ No se encontró función para actualizar la tabla');
                // Intentar realizar una última actualización forzada
                const tbody = document.querySelector('#tablaClientes tbody');
                if (tbody) {
                    actualizarTablaPorDOM(window.clientesCache?.datos || window.clientes || []);
                }
            }
        }, 500); // Esperar 500ms para asegurar que las operaciones asíncronas se completen
    })
    .catch(error => {
        console.error('Error al guardar cliente:', error);
        showNotification(`Error: ${error.message}`, 'danger');
    })
    .finally(() => {
        // Restaurar botón
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
        }
    });
}

// NUEVA FUNCIÓN: Actualización forzada por DOM como último recurso
function actualizarTablaPorDOM(clientes) {
    console.log('🔄 Realizando actualización forzada de tabla por DOM...');
    
    const tbody = document.querySelector('#tablaClientes tbody');
    if (!tbody) {
        console.error('No se encontró tbody para actualización forzada');
        return;
    }
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Si no hay clientes, mostrar mensaje
    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-users text-muted me-2"></i>
                    No hay clientes registrados
                </td>
            </tr>
        `;
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
        } catch (error) {
            console.error('Error al renderizar cliente:', error);
        }
    });
    
    // Actualizar contadores si están disponibles
    if (typeof actualizarContador === 'function') {
        actualizarContador(clientes.length);
    } else {
        const contador = document.getElementById('totalClientes');
        if (contador) contador.textContent = clientes.length;
        
        const contadorOculto = document.getElementById('contadorClientes');
        if (contadorOculto) contadorOculto.textContent = clientes.length;
    }
    
    // Configurar eventos de botones si están disponibles
    if (typeof configurarBotonesAccion === 'function') {
        setTimeout(configurarBotonesAccion, 100);
    }
    
    console.log('✅ Actualización forzada completada');
}

// FUNCIÓN MEJORADA: Notificar cambios en clientes a otros módulos
function notificarCambiosClientes(accion, datos) {
    // Verificar si existe el sistema de eventos
    if (window.appEvents && typeof window.appEvents.emit === 'function') {
        console.log(`📣 Notificando cambio en clientes: ${accion}`, datos);
        window.appEvents.emit('clientesActualizados', {
            accion: accion,
            datos: datos,
            timestamp: Date.now()
        });
        
        // MEJORA: Emitir evento específico para actualizaciones de tabla
        window.appEvents.emit('dataUpdated', {
            type: 'table',
            tableId: 'tablaClientes',
            module: 'clientes',
            action: accion,
            timestamp: Date.now()
        });
    } else {
        console.log('Sistema de eventos no disponible para notificar cambios');
        
        // Intento alternativo de actualización del dashboard si estamos en otra página
        if (window.currentPage === 'dashboard' && typeof loadCounters === 'function') {
            console.log('Actualizando dashboard directamente...');
            setTimeout(loadCounters, 500);
        }
    }
    
    // NUEVO: Emitir evento DOM personalizado como respaldo
    try {
        const event = new CustomEvent('clienteCreado', { 
            detail: { accion, datos, timestamp: Date.now() } 
        });
        document.dispatchEvent(event);
        console.log('Evento DOM personalizado emitido: clienteCreado');
    } catch (error) {
        console.error('Error al emitir evento DOM:', error);
    }
}

// Añada esta función a su archivo clientes-fixed.js

// Función para filtrar clientes según el texto de búsqueda
function filtrarClientes() {
    const textoBusqueda = document.getElementById('buscarCliente').value.toLowerCase().trim();
    console.log(`🔍 Filtrando clientes con texto: "${textoBusqueda}"`);
    
    // Obtener clientes desde caché o variable global
    const clientes = window.clientesCache && window.clientesCache.datos ? 
                     window.clientesCache.datos : window.clientes || [];
    
    if (!clientes.length) {
        console.log('No hay datos de clientes para filtrar');
        return;
    }
    
    // Si la búsqueda está vacía, mostrar todos los clientes
    if (!textoBusqueda) {
        mostrarClientesEnTabla(clientes);
        return;
    }
    
    // Filtrar clientes basados en el texto de búsqueda
    const clientesFiltrados = clientes.filter(cliente => {
        // Buscar en múltiples campos para mejorar la experiencia
        return (
            (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(textoBusqueda)) ||
            (cliente.numeroDocumento && cliente.numeroDocumento.toLowerCase().includes(textoBusqueda)) ||
            (cliente.telefono && cliente.telefono.toLowerCase().includes(textoBusqueda)) ||
            (cliente.correoElectronico && cliente.correoElectronico.toLowerCase().includes(textoBusqueda))
        );
    });
    
    console.log(`Encontrados ${clientesFiltrados.length} clientes que coinciden con la búsqueda`);
    
    // Actualizar tabla con resultados filtrados
    mostrarClientesEnTabla(clientesFiltrados);
    
    // Actualizar contador indicando que son resultados filtrados
    const contador = document.getElementById('totalClientes');
    if (contador) {
        const textoContador = clientesFiltrados.length === clientes.length ? 
                             clientesFiltrados.length : 
                             `${clientesFiltrados.length} (filtrados de ${clientes.length})`;
        contador.textContent = textoContador;
    }
}

// Añada esto a sus funciones de inicialización o dentro de una existente
function inicializarBusquedaClientes() {
    const inputBusqueda = document.getElementById('buscarCliente');
    if (inputBusqueda) {
        // Eliminar listeners existentes para evitar duplicados
        const nuevoInput = inputBusqueda.cloneNode(true);
        inputBusqueda.parentNode.replaceChild(nuevoInput, inputBusqueda);
        
        // Añadir evento keyup para filtrado en tiempo real
        nuevoInput.addEventListener('keyup', function(e) {
            // Retrasar el filtrado para mejorar rendimiento - solo filtrar después de una breve pausa en la escritura
            if (window.timeoutBusqueda) {
                clearTimeout(window.timeoutBusqueda);
            }
            
            window.timeoutBusqueda = setTimeout(filtrarClientes, 300);
        });
        
        console.log('✅ Búsqueda en tiempo real inicializada correctamente');
    } else {
        console.log('⚠️ Campo de búsqueda no encontrado');
    }
}

// SECCIÓN 4: FUNCIONES AUXILIARES
// ==============================

// Función para buscar cliente por ID
function buscarClientePorId(clienteId) {
    if (!clienteId) return null;
    
    // Buscar primero en la caché
    if (window.clientesCache && window.clientesCache.datos) {
        const cliente = window.clientesCache.datos.find(c => c.clienteId === clienteId);
        if (cliente) return cliente;
    }
    
    // Si no está en caché, buscar en la variable global
    if (window.clientes) {
        return window.clientes.find(c => c.clienteId === clienteId);
    }
    
    return null;
}

// Función para actualizar un cliente en la caché
function actualizarClienteEnCache(cliente) {
    if (!cliente || !cliente.clienteId) return;
    
    // Actualizar en cache
    if (window.clientesCache && window.clientesCache.datos) {
        const index = window.clientesCache.datos.findIndex(c => c.clienteId === cliente.clienteId);
        if (index !== -1) {
            window.clientesCache.datos[index] = cliente;
        } else {
            window.clientesCache.datos.push(cliente);
        }
    }
    
    // Actualizar en variable global
    if (window.clientes) {
        const index = window.clientes.findIndex(c => c.clienteId === cliente.clienteId);
        if (index !== -1) {
            window.clientes[index] = cliente;
        } else {
            window.clientes.push(cliente);
        }
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

// SECCIÓN 5: INICIALIZACIÓN Y SOBREESCRITURA DE FUNCIONES
// ======================================================

// NUEVO: Verificar dashboard y actualizar contadores
function verificarYActualizarDashboard() {
    // Si estamos en el dashboard, actualizar los contadores
    if (window.currentPage === 'dashboard') {
        console.log('📊 Actualizando datos del dashboard desde módulo de clientes');
        
        // Si existe la función loadCounters, ejecutarla
        if (typeof loadCounters === 'function') {
            setTimeout(loadCounters, 300);
        }
        
        // Si existe la función loadClientesRecientes, ejecutarla
        if (typeof loadClientesRecientes === 'function') {
            setTimeout(loadClientesRecientes, 500);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando módulo de clientes unificado...');
    
    // Iniciar observador de navegación
    iniciarObservadorNavegacion();
    
    // Configurar botón de actualización
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
    
    // NUEVO: Escuchar eventos de cambio de página para actualizar dashboard si es necesario
    if (typeof window.appEvents === 'object' && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', function(data) {
            if (data.to === 'dashboard') {
                verificarYActualizarDashboard();
            }
        });
    }
});

let busquedaInicializada = false;

// Función para implementar la búsqueda en tiempo real de clientes
function implementarBusquedaEnTiempoReal() {
    console.log('🔍 Configurando búsqueda en tiempo real para clientes...');
    
    // Obtener referencia al campo de búsqueda
    const campoBusqueda = document.getElementById('buscarCliente');
    if (!campoBusqueda) {
        console.error('No se encontró el campo de búsqueda #buscarCliente');
        return;
    }
    
    // Si ya fue inicializado, no hacer nada para evitar pérdida de foco
    if (busquedaInicializada) {
        console.log('La búsqueda ya está inicializada, omitiendo configuración');
        return;
    }
    
    // Marcar como inicializado
    busquedaInicializada = true;
    
    // Añadir event listener para eventos de escritura
    campoBusqueda.addEventListener('input', function(e) {
        // Obtener término de búsqueda y eliminar espacios en blanco extras
        const terminoBusqueda = e.target.value.trim().toLowerCase();
        
        // Obtener datos de clientes de la caché
        const clientes = window.clientesCache?.datos || window.clientes || [];
        
        // Si el campo está vacío, mostrar todos los clientes
        if (!terminoBusqueda) {
            console.log('Campo de búsqueda vacío, mostrando todos los clientes');
            mostrarClientesEnTabla(clientes);
            return;
        }
        
        console.log(`Buscando clientes que coincidan con: "${terminoBusqueda}"`);
        
        // Filtrar clientes según el término de búsqueda
        const clientesFiltrados = clientes.filter(cliente => {
            // Buscar en múltiples campos para mayor usabilidad
            return (
                (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.numeroDocumento && cliente.numeroDocumento.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.telefono && cliente.telefono.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.correoElectronico && cliente.correoElectronico.toLowerCase().includes(terminoBusqueda))
            );
        });
        
        console.log(`Se encontraron ${clientesFiltrados.length} coincidencias`);
        
        // Actualizar la tabla con los resultados filtrados
        mostrarClientesEnTabla(clientesFiltrados);
    });
    
    // Agregar botón para limpiar búsqueda
    agregarBotonLimpiarBusqueda(campoBusqueda);
    
    console.log('✅ Búsqueda en tiempo real configurada exitosamente');
}

// Función para agregar botón de limpiar búsqueda
function agregarBotonLimpiarBusqueda(inputBusqueda) {
    // Verificar si el campo de búsqueda tiene un padre que podamos usar
    const contenedor = inputBusqueda.parentElement;
    if (!contenedor) return;
    
    // Verificar si ya existe el botón para evitar duplicados
    if (document.getElementById('limpiarBusqueda')) return;
    
    // Crear botón de limpiar
    const botonLimpiar = document.createElement('button');
    botonLimpiar.type = 'button';
    botonLimpiar.className = 'btn btn-outline-secondary btn-sm position-absolute end-0 me-5 mt-1 d-none';
    botonLimpiar.style.top = '0';
    botonLimpiar.style.right = '50px'; // Ajustar posición
    botonLimpiar.style.padding = '0.25rem 0.5rem';
    botonLimpiar.innerHTML = '<i class="fas fa-times"></i>';
    botonLimpiar.title = 'Limpiar búsqueda';
    botonLimpiar.id = 'limpiarBusqueda';
    
    // Asegurarse de que el contenedor tenga posición relativa
    contenedor.style.position = 'relative';
    
    // Añadir al DOM, justo después del input
    inputBusqueda.insertAdjacentElement('afterend', botonLimpiar);
    
    // Mostrar/ocultar botón según contenido del input
    inputBusqueda.addEventListener('input', function() {
        if (this.value.trim()) {
            botonLimpiar.classList.remove('d-none');
        } else {
            botonLimpiar.classList.add('d-none');
        }
    });
    
    // Función para limpiar búsqueda
    botonLimpiar.addEventListener('click', function() {
        inputBusqueda.value = '';
        inputBusqueda.dispatchEvent(new Event('input'));
        botonLimpiar.classList.add('d-none');
        inputBusqueda.focus();
    });
}

// Sobreescribir funciones originales para mayor compatibilidad
window.actualizarTablaClientes = function() {
    if (window.clientesCache && window.clientesCache.datos.length > 0) {
        mostrarClientesEnTabla(window.clientesCache.datos);
    } else {
        garantizarCargaClientes();
    }
};

// Sobrescribir las funciones originales para redirigir a las nuevas
window.editarCliente = editarCliente;
window.verPrestamosCliente = verPrestamosCliente;
window.eliminarCliente = eliminarCliente;
window.garantizarCargaClientes = garantizarCargaClientes;
window.mostrarClientesEnTabla = mostrarClientesEnTabla;
window.configurarBotonesAccion = configurarBotonesAccion;