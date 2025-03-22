/**
 * clientes-actions.js - Módulo de manejo de acciones para clientes
 * Este archivo trabaja con clientes-loader.js para garantizar que las
 * acciones funcionen correctamente con los datos en caché.
 */

// Configurar botones de acción para cada cliente
function configurarBotonesAccion() {
    console.log('Configurando botones de acción para clientes...');
    
    // Botones de editar
    document.querySelectorAll('.btn-editar, .btn-outline-primary[title="Editar"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const clienteId = this.getAttribute('data-id');
            editarClienteConCache(clienteId);
        });
    });
    
    // Botones de préstamos
    document.querySelectorAll('.btn-prestamos, .btn-outline-info[title="Ver préstamos"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const clienteId = this.getAttribute('data-id');
            verPrestamosClienteConCache(clienteId);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-eliminar, .btn-outline-danger[title="Eliminar"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const clienteId = this.getAttribute('data-id');
            eliminarClienteConCache(clienteId);
        });
    });
    
    // Configurar botón de nuevo cliente
    const btnNuevoCliente = document.getElementById('btnNuevoCliente');
    if (btnNuevoCliente) {
        btnNuevoCliente.addEventListener('click', abrirModalNuevoCliente);
    }
}

// Función para editar cliente usando datos en caché
function editarClienteConCache(clienteId) {
    console.log('Editando cliente (mejorado):', clienteId);
    
    // Buscar primero en la caché
    let cliente = null;
    if (window.clientesCache && window.clientesCache.datos) {
        cliente = window.clientesCache.datos.find(c => c.clienteId === clienteId);
    }
    
    // Si no está en caché, buscar en la variable global clientes
    if (!cliente && window.clientes) {
        cliente = window.clientes.find(c => c.clienteId === clienteId);
    }
    
    if (!cliente) {
        console.error('Cliente no encontrado en caché ni en datos globales');
        showNotification('Cliente no encontrado', 'error');
        return;
    }
    
    console.log('Cliente encontrado:', cliente);
    
    // Verificar si ya existe el modal
    let modalEditar = document.getElementById('modalEditarCliente');
    
    if (!modalEditar) {
        console.error('Modal de edición no encontrado, creando uno nuevo...');
        // Crear modal si no existe
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
        btnGuardar.removeEventListener('click', guardarEdicionClienteConCache);
        btnGuardar.addEventListener('click', guardarEdicionClienteConCache);
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

// Función para guardar la edición de un cliente
function guardarEdicionClienteConCache() {
    console.log('Guardando edición de cliente (mejorado)...');
    
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
    if (btnGuardar) {
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
            if (window.clientesCache && window.clientesCache.datos) {
                const index = window.clientesCache.datos.findIndex(c => c.clienteId === clienteId);
                if (index !== -1) {
                    window.clientesCache.datos[index] = clienteActualizado;
                }
            }
            
            // Actualizar en variable global
            if (window.clientes) {
                const index = window.clientes.findIndex(c => c.clienteId === clienteId);
                if (index !== -1) {
                    window.clientes[index] = clienteActualizado;
                }
            }
            
            // Actualizar tabla
            if (typeof window.mostrarClientesEnTabla === 'function') {
                window.mostrarClientesEnTabla(window.clientesCache.datos || window.clientes);
            } else if (typeof window.actualizarTablaClientes === 'function') {
                window.actualizarTablaClientes();
            }
            
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
        })
        .catch(error => {
            console.error('Error al actualizar cliente:', error);
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
}

// Función para ver préstamos de cliente usando caché
function verPrestamosClienteConCache(clienteId) {
    console.log('Viendo préstamos del cliente (mejorado):', clienteId);
    
    // Buscar primero en la caché
    let cliente = null;
    if (window.clientesCache && window.clientesCache.datos) {
        cliente = window.clientesCache.datos.find(c => c.clienteId === clienteId);
    }
    
    // Si no está en caché, buscar en la variable global clientes
    if (!cliente && window.clientes) {
        cliente = window.clientes.find(c => c.clienteId === clienteId);
    }
    
    if (!cliente) {
        console.error('Cliente no encontrado en caché ni en datos globales');
        showNotification('Cliente no encontrado', 'error');
        return;
    }
    
    console.log('Cliente encontrado:', cliente);
    
    // Verificar si ya existe el modal
    let modalPrestamos = document.getElementById('modalPrestamosCliente');
    
    if (!modalPrestamos) {
        console.log('Modal de préstamos no encontrado, creando uno nuevo...');
        
        // Crear modal dinámicamente
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
        
        modalPrestamos = document.getElementById('modalPrestamosCliente');
    } else {
        // Actualizar título e información del cliente
        document.getElementById('modalPrestamosClienteLabel').textContent = `Préstamos de ${cliente.nombreCompleto}`;
        
        // Actualizar información del cliente en el modal existente
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
        btnNuevoPrestamo.addEventListener('click', function() {
            // Almacenar el ID del cliente para pasar a la página de nuevo préstamo
            sessionStorage.setItem('clienteSeleccionadoId', cliente.clienteId);
            sessionStorage.setItem('clienteSeleccionadoNombre', cliente.nombreCompleto);
            
            // Cerrar modal
            try {
                const modal = bootstrap.Modal.getInstance(modalPrestamos);
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
            
            // Crear tabla de préstamos (igual que en clientes.js)
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
                        const modal = bootstrap.Modal.getInstance(modalPrestamos);
                        if (modal) modal.hide();
                    } catch (error) {
                        console.error('Error al cerrar modal:', error);
                    }
                    
                    // Navegar a la página de préstamos y mostrar detalles
                    if (typeof loadPage === 'function') {
                        loadPage('prestamos');
                        setTimeout(() => {
                            if (typeof verPrestamo === 'function') {
                                verPrestamo(prestamoId);
                            }
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
                        const modal = bootstrap.Modal.getInstance(modalPrestamos);
                        if (modal) modal.hide();
                    } catch (error) {
                        console.error('Error al cerrar modal:', error);
                    }
                    
                    // Navegar a la página de pagos e iniciar registro
                    if (typeof loadPage === 'function') {
                        loadPage('pagos');
                        setTimeout(() => {
                            if (typeof iniciarPago === 'function') {
                                iniciarPago(prestamoId);
                            } else {
                                window.pendingPayment = { prestamoId };
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

// Función para eliminar cliente usando caché
function eliminarClienteConCache(clienteId) {
    console.log('Eliminando cliente (mejorado):', clienteId);
    
    // Buscar primero en la caché
    let cliente = null;
    if (window.clientesCache && window.clientesCache.datos) {
        cliente = window.clientesCache.datos.find(c => c.clienteId === clienteId);
    }
    
    // Si no está en caché, buscar en la variable global clientes
    if (!cliente && window.clientes) {
        cliente = window.clientes.find(c => c.clienteId === clienteId);
    }
    
    if (!cliente) {
        console.error('Cliente no encontrado en caché ni en datos globales');
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
        if (typeof window.mostrarClientesEnTabla === 'function') {
            window.mostrarClientesEnTabla(window.clientesCache.datos || window.clientes);
        } else if (typeof window.actualizarTablaClientes === 'function') {
            window.actualizarTablaClientes();
        }
        
        // Mostrar notificación
        showNotification('Cliente eliminado correctamente', 'success');
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

// Función para abrir modal de nuevo cliente
function abrirModalNuevoCliente() {
    console.log('Abriendo modal de nuevo cliente...');
    
    // Verificar si existe el modal
    let modalNuevo = document.getElementById('modalNuevoCliente');
    
    if (!modalNuevo) {
        console.log('Modal no encontrado, creando uno nuevo...');
        
        // Crear modal dinámicamente
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
        btnGuardar.removeEventListener('click', guardarNuevoClienteConCache);
        btnGuardar.addEventListener('click', guardarNuevoClienteConCache);
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

// Función para guardar nuevo cliente
function guardarNuevoClienteConCache() {
    console.log('Guardando nuevo cliente (mejorado)...');
    
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
        console.log('Cliente creado:', nuevoCliente);
        
        // Actualizar caché
        if (window.clientesCache && window.clientesCache.datos) {
            window.clientesCache.datos.push(nuevoCliente);
        }
        
        // Actualizar variable global
        if (Array.isArray(window.clientes)) {
            window.clientes.push(nuevoCliente);
        } else {
            window.clientes = [nuevoCliente];
        }
        
        // Actualizar tabla
        if (typeof window.mostrarClientesEnTabla === 'function') {
            window.mostrarClientesEnTabla(window.clientesCache.datos || window.clientes);
        } else if (typeof window.actualizarTablaClientes === 'function') {
            window.actualizarTablaClientes();
        }
        
        // Cerrar modal
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
        
        // Mostrar notificación de éxito
        showNotification('Cliente guardado correctamente', 'success');
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

// Aplicar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando módulo de acciones para clientes...');
    
    // Verificar si estamos en la página de clientes
    if (document.getElementById('clientes') && document.getElementById('clientes').classList.contains('active')) {
        setTimeout(configurarBotonesAccion, 500);
    }
});

// Función para actualizar configuración cuando se carga nueva página
function actualizarConfiguracionBotones() {
    console.log('Actualizando configuración de botones después de mostrar clientes...');
    setTimeout(configurarBotonesAccion, 300);
}

// Exponer funciones al ámbito global
window.editarClienteConCache = editarClienteConCache;
window.verPrestamosClienteConCache = verPrestamosClienteConCache;
window.eliminarClienteConCache = eliminarClienteConCache;
window.abrirModalNuevoCliente = abrirModalNuevoCliente;
window.configurarBotonesAccion = configurarBotonesAccion;
window.actualizarConfiguracionBotones = actualizarConfiguracionBotones;

// Sobrescribir funciones originales para compatibilidad
if (typeof window.mostrarClientesEnTabla === 'function') {
    const originalMostrarClientes = window.mostrarClientesEnTabla;
    window.mostrarClientesEnTabla = function(clientes) {
        // Llamar a la función original
        originalMostrarClientes(clientes);
        // Configurar botones después de mostrar
        actualizarConfiguracionBotones();
    };
}