// Script para la gestión de pagos
let pagosData = []; // Almacena los datos de pagos

// Inicializar la página de pagos
function initPagosPage() {
    console.log('Inicializando página de pagos...');
    
    // Cargar datos de pagos pendientes
    cargarPagosPendientes();
    
    // Cargar historial de pagos
    cargarHistorialPagos();
    
    // Configurar campo de búsqueda
    const inputBusqueda = document.getElementById('buscarPago');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', filtrarPagos);
    }
    
    // Configurar selector de rango de fechas
    const selectRangoFechas = document.getElementById('rangoFechas');
    if (selectRangoFechas) {
        selectRangoFechas.addEventListener('change', filtrarPorFecha);
    }
    
    // Si hay un pago pendiente (desde el dashboard)
    if (window.pendingPayment) {
        setTimeout(() => {
            iniciarPago(window.pendingPayment.prestamoId, window.pendingPayment.numeroPago);
            window.pendingPayment = null;
        }, 500);
    }
}

// Cargar pagos pendientes
function cargarPagosPendientes() {
    const tablaPagosPendientes = document.getElementById('tablaPagosPendientes');
    const tbody = tablaPagosPendientes ? tablaPagosPendientes.querySelector('tbody') : null;
    
    if (!tbody) return;
    
    // Mostrar mensaje de carga
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando pagos pendientes...</td></tr>';
    
    // Realizar petición para obtener todos los préstamos activos
    fetch('/api/prestamos?estado=Activo')
        .then(response => response.json())
        .then(async prestamos => {
            // Cargar información de clientes
            const clientes = await fetch('/api/clientes').then(res => res.json());
            
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            // Crear lista de pagos pendientes
            const pagosPendientes = [];
            
            prestamos.forEach(prestamo => {
                prestamo.tablaAmortizacion.forEach(cuota => {
                    if (!cuota.pagado) {
                        pagosPendientes.push({
                            prestamoId: prestamo.prestamoId,
                            clienteId: prestamo.clienteId,
                            numeroPago: cuota.numeroPago,
                            fechaPago: new Date(cuota.fechaPago),
                            monto: cuota.cuotaMensual,
                            tipo: 'Cuota regular',
                            estado: new Date(cuota.fechaPago) < new Date() ? 'Vencido' : 'Pendiente'
                        });
                    }
                });
            });
            
            // Ordenar por fecha de pago (más próximos primero)
            pagosPendientes.sort((a, b) => a.fechaPago - b.fechaPago);
            
            // Limpiar tabla
            tbody.innerHTML = '';
            
            if (pagosPendientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pagos pendientes</td></tr>';
                
                // Actualizar contador
                const contadorPendientes = document.getElementById('contadorPendientes');
                if (contadorPendientes) {
                    contadorPendientes.textContent = '0';
                }
                
                return;
            }
            
            // Actualizar contador
            const contadorPendientes = document.getElementById('contadorPendientes');
            if (contadorPendientes) {
                contadorPendientes.textContent = pagosPendientes.length;
            }
            
            // Mostrar pagos pendientes
            pagosPendientes.forEach(pago => {
                const cliente = clientesMap[pago.clienteId];
                
                if (!cliente) return; // Saltar si no se encuentra el cliente
                
                const tr = document.createElement('tr');
                
                // Destacar pagos vencidos
                if (pago.estado === 'Vencido') {
                    tr.classList.add('table-danger');
                }
                
                tr.innerHTML = `
                    <td>${cliente.nombreCompleto}</td>
                    <td>${pago.prestamoId.substring(0, 8)}...</td>
                    <td>Cuota ${pago.numeroPago}</td>
                    <td>${formatDate(pago.fechaPago)}</td>
                    <td>${formatCurrency(pago.monto)}</td>
                    <td>
                        <span class="badge ${pago.estado === 'Vencido' ? 'bg-danger' : 'bg-warning'}">
                            ${pago.estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-success" 
                                onclick="iniciarPago('${pago.prestamoId}', ${pago.numeroPago})">
                            <i class="fas fa-money-bill-wave"></i> Pagar
                        </button>
                        <button class="btn btn-sm btn-info" 
                                onclick="mostrarDetallesPrestamo('${pago.prestamoId}')">
                            <i class="fas fa-eye"></i> Ver Préstamo
                        </button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
            showNotification('Error al cargar pagos pendientes: ' + error.message, 'error');
        });
}

// Cargar historial de pagos
function cargarHistorialPagos() {
    const tablaHistorialPagos = document.getElementById('tablaHistorialPagos');
    const tbody = tablaHistorialPagos ? tablaHistorialPagos.querySelector('tbody') : null;
    
    if (!tbody) return;
    
    // Mostrar mensaje de carga
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando historial de pagos...</td></tr>';
    
    // Realizar petición a la API
    fetch('/api/pagos')
        .then(response => response.json())
        .then(async pagos => {
            pagosData = pagos;
            
            // Cargar información de clientes
            const clientes = await fetch('/api/clientes').then(res => res.json());
            
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            // Aplicar filtros iniciales (últimos 30 días por defecto)
            filtrarPorFecha();
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
            showNotification('Error al cargar historial de pagos: ' + error.message, 'error');
        });
}

// Mostrar pagos en la tabla de historial
function mostrarHistorialPagos(pagos) {
    const tablaHistorialPagos = document.getElementById('tablaHistorialPagos');
    const tbody = tablaHistorialPagos ? tablaHistorialPagos.querySelector('tbody') : null;
    const contadorHistorial = document.getElementById('contadorHistorial');
    
    if (!tbody) return;
    
    // Actualizar contador
    if (contadorHistorial) {
        contadorHistorial.textContent = pagos.length;
    }
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pagos registrados en este período</td></tr>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    pagos.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
    
    // Cargar clientes una sola vez
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            // Mostrar pagos
            pagos.forEach(pago => {
                const cliente = clientesMap[pago.clienteId];
                
                if (!cliente) return; // Saltar si no se encuentra el cliente
                
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${formatDate(pago.fechaPago)}</td>
                    <td>${cliente.nombreCompleto}</td>
                    <td>${pago.prestamoId.substring(0, 8)}...</td>
                    <td>Cuota ${pago.numeroPago}</td>
                    <td>${formatCurrency(pago.cantidadPagada)}</td>
                    <td>${pago.tipoPago}</td>
                    <td>
                        <a href="/api/pagos/${pago.pagoId}/recibo" target="_blank" class="btn btn-sm btn-primary">
                            <i class="fas fa-file-pdf"></i> Recibo
                        </a>
                        <button class="btn btn-sm btn-info" 
                                onclick="verDetallesPago('${pago.pagoId}')">
                            <i class="fas fa-eye"></i> Detalles
                        </button>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error al cargar clientes:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar datos</td></tr>`;
        });
}

// Filtrar pagos por texto de búsqueda
function filtrarPagos() {
    const textoBusqueda = document.getElementById('buscarPago').value.toLowerCase();
    
    if (!pagosData) return;
    
    // Aplicar filtro de fecha primero
    const pagosFiltradosPorFecha = filtrarPagosPorFecha();
    
    // Luego aplicar filtro de texto
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            const pagosFiltrados = pagosFiltradosPorFecha.filter(pago => {
                const cliente = clientesMap[pago.clienteId] || { nombreCompleto: '' };
                
                return (
                    pago.pagoId.toLowerCase().includes(textoBusqueda) ||
                    pago.prestamoId.toLowerCase().includes(textoBusqueda) ||
                    cliente.nombreCompleto.toLowerCase().includes(textoBusqueda) ||
                    pago.tipoPago.toLowerCase().includes(textoBusqueda) ||
                    formatCurrency(pago.cantidadPagada).toLowerCase().includes(textoBusqueda)
                );
            });
            
            mostrarHistorialPagos(pagosFiltrados);
        })
        .catch(error => {
            console.error('Error al cargar clientes para filtrado:', error);
        });
}

// Filtrar pagos por rango de fecha
function filtrarPorFecha() {
    // Aplicar filtro y mostrar resultados
    const pagosFiltrados = filtrarPagosPorFecha();
    mostrarHistorialPagos(pagosFiltrados);
}

// Función auxiliar para filtrar pagos por fecha
function filtrarPagosPorFecha() {
    if (!pagosData) return [];
    
    const selectRangoFechas = document.getElementById('rangoFechas');
    const rangoSeleccionado = selectRangoFechas ? selectRangoFechas.value : 'mes';
    
    const fechaActual = new Date();
    let fechaInicio;
    
    switch (rangoSeleccionado) {
        case 'semana':
            // Últimos 7 días
            fechaInicio = new Date(fechaActual);
            fechaInicio.setDate(fechaInicio.getDate() - 7);
            break;
        case 'mes':
            // Últimos 30 días
            fechaInicio = new Date(fechaActual);
            fechaInicio.setDate(fechaInicio.getDate() - 30);
            break;
        case 'trimestre':
            // Últimos 90 días
            fechaInicio = new Date(fechaActual);
            fechaInicio.setDate(fechaInicio.getDate() - 90);
            break;
        case 'semestre':
            // Últimos 180 días
            fechaInicio = new Date(fechaActual);
            fechaInicio.setDate(fechaInicio.getDate() - 180);
            break;
        case 'anio':
            // Último año
            fechaInicio = new Date(fechaActual);
            fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
            break;
        case 'todo':
            // Todos los pagos
            return pagosData;
        default:
            // Por defecto, últimos 30 días
            fechaInicio = new Date(fechaActual);
            fechaInicio.setDate(fechaInicio.getDate() - 30);
    }
    
    // Filtrar pagos por fecha
    return pagosData.filter(pago => {
        const fechaPago = new Date(pago.fechaPago);
        return fechaPago >= fechaInicio && fechaPago <= fechaActual;
    });
}

// Ver detalles de un pago
function verDetallesPago(pagoId) {
    // Buscar pago en los datos cargados o cargar nuevamente
    if (pagosData && pagosData.length > 0) {
        const pago = pagosData.find(p => p.pagoId === pagoId);
        
        if (pago) {
            mostrarDetallePagoCargado(pago);
            return;
        }
    }
    
    // Si no está en caché, cargar desde la API
    fetch(`/api/pagos/${pagoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pago no encontrado');
            }
            return response.json();
        })
        .then(pago => {
            mostrarDetallePagoCargado(pago);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error: ' + error.message, 'error');
        });
}

// Mostrar detalle de pago ya cargado
function mostrarDetallePagoCargado(pago) {
    // Cargar información del préstamo y cliente
    Promise.all([
        fetch(`/api/prestamos/${pago.prestamoId}`).then(res => res.json()),
        fetch(`/api/clientes/${pago.clienteId}`).then(res => res.json())
    ])
        .then(([prestamo, cliente]) => {
            // Actualizar contenido del modal
            const modalDetalles = document.getElementById('modalDetallesPago');
            if (!modalDetalles) return;
            
            // Actualizar título
            modalDetalles.querySelector('.modal-title').textContent = `Pago #${pago.pagoId.substring(0, 8)}...`;
            
            // Actualizar cuerpo
            const detallesDiv = modalDetalles.querySelector('.detalles-pago');
            
            detallesDiv.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5>Información del Pago</h5>
                        <p><strong>ID:</strong> ${pago.pagoId}</p>
                        <p><strong>Fecha:</strong> ${formatDate(pago.fechaPago)}</p>
                        <p><strong>Monto pagado:</strong> ${formatCurrency(pago.cantidadPagada)}</p>
                        <p><strong>Tipo de pago:</strong> ${pago.tipoPago}</p>
                        <p><strong>Número de cuota:</strong> ${pago.numeroPago}</p>
                    </div>
                    <div class="col-md-6">
                        <h5>Desglose del Pago</h5>
                        <p><strong>Abono a capital:</strong> ${formatCurrency(pago.abonoCapital)}</p>
                        <p><strong>Interés pagado:</strong> ${formatCurrency(pago.interesPagado)}</p>
                        <p><strong>Deuda anterior:</strong> ${formatCurrency(pago.deuda)}</p>
                        <p><strong>Deuda restante:</strong> ${formatCurrency(pago.deudaRestante)}</p>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <h5>Información del Cliente</h5>
                        <p><strong>Nombre:</strong> ${cliente.nombreCompleto}</p>
                        <p><strong>Documento:</strong> ${cliente.tipoDocumento} - ${cliente.numeroDocumento}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                    </div>
                    <div class="col-md-6">
                        <h5>Información del Préstamo</h5>
                        <p><strong>ID:</strong> ${prestamo.prestamoId}</p>
                        <p><strong>Monto original:</strong> ${formatCurrency(prestamo.cantidadPrestamo)}</p>
                        <p><strong>Estado:</strong> 
                            <span class="badge ${getBadgeClass(prestamo.estado)}">
                                ${prestamo.estado}
                            </span>
                        </p>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12 text-center">
                        <a href="/api/pagos/${pago.pagoId}/recibo" target="_blank" class="btn btn-primary">
                            <i class="fas fa-file-pdf"></i> Ver Recibo
                        </a>
                        <button class="btn btn-success" onclick="enviarReciboPorEmail('${pago.pagoId}')">
                            <i class="fas fa-envelope"></i> Enviar por Email
                        </button>
                    </div>
                </div>
            `;
            
            // Mostrar modal
            const modal = new bootstrap.Modal(modalDetalles);
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar detalles del pago', 'error');
        });
}

// Enviar recibo por email
function enviarReciboPorEmail(pagoId) {
    // Mostrar indicador de carga
    showNotification('Enviando recibo por email...', 'info');
    
    // Enviar petición a la API
    fetch(`/api/pagos/${pagoId}/enviar-recibo`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Error al enviar recibo'); });
            }
            return response.json();
        })
        .then(data => {
            showNotification('Recibo enviado correctamente', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al enviar recibo: ' + error.message, 'error');
        });
}

// Función para ver detalles de un préstamo
function mostrarDetallesPrestamo(prestamoId) {
    // Navegar a la página de préstamos
    document.querySelector('.nav-link[data-page="prestamos"]').click();
    
    // Almacenar el ID para cuando se cargue la página
    window.pendingLoanDetails = prestamoId;
}

// Obtener clase para las badges según el estado
function getBadgeClass(estado) {
    switch (estado) {
        case 'Activo':
            return 'bg-success';
        case 'Pagado':
            return 'bg-primary';
        case 'Cancelado':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}
// Iniciar proceso de pago
function iniciarPago(prestamoId, numeroPago) {
    console.log("Iniciando pago para préstamo:", prestamoId, "cuota:", numeroPago);
    
    // Verificar si estamos en la página de pagos
    if (window.currentPage !== 'pagos') {
        // Si no estamos en la página de pagos, navegar a ella
        document.querySelector('.nav-link[data-page="pagos"]').click();
        
        // Almacenar los datos para cuando se cargue la página
        window.pendingPayment = {
            prestamoId,
            numeroPago
        };
        
        return;
    }
    
    // Obtener información del préstamo
    fetch(`/api/prestamos/${prestamoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener información del préstamo');
            }
            return response.json();
        })
        .then(prestamo => {
            // Verificar que el préstamo está activo
            if (prestamo.estado !== 'Activo') {
                showNotification('Solo se pueden registrar pagos de préstamos activos', 'warning');
                return;
            }
            
            // Buscar la cuota correspondiente
            const cuota = prestamo.tablaAmortizacion.find(c => c.numeroPago === numeroPago);
            if (!cuota) {
                showNotification('No se encontró la cuota especificada', 'error');
                return;
            }
            
            // Verificar si la cuota ya está pagada
            if (cuota.pagado) {
                showNotification('Esta cuota ya ha sido pagada', 'warning');
                return;
            }
            
            // Mostrar modal de pago con la información
            mostrarModalPago(prestamo, cuota);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar información del préstamo: ' + error.message, 'error');
        });
}

// Función para mostrar el modal de pago
function mostrarModalPago(prestamo, cuota) {
    // Buscar el modal
    let modalPago = document.getElementById('modalRegistrarPago');
    
    // Si no existe el modal, crearlo dinámicamente
    if (!modalPago) {
        console.log("Modal de pago no encontrado. Creando dinámicamente...");
        
        const modalHTML = `
        <div class="modal fade" id="modalRegistrarPago" tabindex="-1" aria-labelledby="modalRegistrarPagoLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalRegistrarPagoLabel">Registrar Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formRegistrarPago">
                            <!-- Campos ocultos para IDs -->
                            <input type="hidden" name="prestamoId">
                            <input type="hidden" name="clienteId">
                            <input type="hidden" name="numeroPago">
                            
                            <div class="mb-3">
                                <label for="cantidadPagada" class="form-label">Monto a pagar</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" min="0" class="form-control" id="cantidadPagada" name="cantidadPagada" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="fechaPago" class="form-label">Fecha de pago</label>
                                <input type="date" class="form-control" id="fechaPago" name="fechaPago" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="tipoPago" class="form-label">Tipo de pago</label>
                                <select class="form-select" id="tipoPago" name="tipoPago" required>
                                    <option value="">Seleccione...</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary" form="formRegistrarPago">Registrar Pago</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Agregar el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Obtener referencia al modal recién creado
        modalPago = document.getElementById('modalRegistrarPago');
    }
    
    // Actualizar información en el modal
    document.querySelector('#modalRegistrarPago .modal-title').textContent = 
        `Registrar Pago - Préstamo #${prestamo.prestamoId.substring(0, 8)}...`;
    
    // Llenar formulario
    const formPago = document.getElementById('formRegistrarPago');
    if (formPago) {
        // Limpiar formulario
        formPago.reset();
        
        // Establecer valores
        formPago.querySelector('input[name="prestamoId"]').value = prestamo.prestamoId;
        formPago.querySelector('input[name="clienteId"]').value = prestamo.clienteId;
        formPago.querySelector('input[name="numeroPago"]').value = cuota.numeroPago;
        formPago.querySelector('input[name="cantidadPagada"]').value = cuota.cuotaMensual.toFixed(2);
        
        // Actualizar fecha de pago con la fecha actual
        const fechaPagoInput = formPago.querySelector('input[name="fechaPago"]');
        if (fechaPagoInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            fechaPagoInput.value = `${year}-${month}-${day}`;
        }
        
        // Configurar evento submit
        formPago.onsubmit = function(event) {
            event.preventDefault();
            registrarPago();
        };
    }
    
    // Mostrar modal
    try {
        const modal = new bootstrap.Modal(modalPago);
        modal.show();
    } catch (error) {
        console.error('Error al mostrar modal:', error);
        showNotification("Error al mostrar el modal de pago", 'error');
    }
}

// Función para registrar el pago
function registrarPago() {
    const formPago = document.getElementById('formRegistrarPago');
    if (!formPago) return;
    
    // Obtener datos del formulario
    const formData = new FormData(formPago);
    const pagoData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!pagoData.numeroPago) {
        showNotification('Número de pago no válido', 'warning');
        return;
    }
    
    if (!pagoData.cantidadPagada || parseFloat(pagoData.cantidadPagada) <= 0) {
        showNotification('Por favor, ingrese un monto válido', 'warning');
        return;
    }
    
    if (!pagoData.tipoPago) {
        showNotification('Por favor, seleccione el tipo de pago', 'warning');
        return;
    }
    
    // Convertir valores numéricos
    pagoData.numeroPago = parseInt(pagoData.numeroPago);
    pagoData.cantidadPagada = parseFloat(pagoData.cantidadPagada);
    
    console.log("Enviando datos de pago:", pagoData);
    
    // Enviar petición a la API
    fetch('/api/pagos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pagoData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { 
                    throw new Error(err.message || 'Error al registrar pago'); 
                });
            }
            return response.json();
        })
        .then(pago => {
            // Cerrar modal
            const modalPago = document.getElementById('modalRegistrarPago');
            const modal = bootstrap.Modal.getInstance(modalPago);
            if (modal) {
                modal.hide();
            }
            
            // Actualizar lista de pagos pendientes
            cargarPagosPendientes();
            
            // Actualizar historial de pagos
            cargarHistorialPagos();
            
            // Mostrar notificación
            showNotification('Pago registrado correctamente', 'success');
            
            // Preguntar si desea imprimir el recibo
            if (confirm('¿Desea generar y descargar el recibo del pago?')) {
                window.open(`/api/pagos/${pago.pagoId}/recibo`, '_blank');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al registrar pago: ' + error.message, 'error');
        });
}