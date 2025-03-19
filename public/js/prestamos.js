// Script para la gestión de préstamos
let prestamosData = []; // Almacena los datos de préstamos

// Inicializar la página de préstamos
function initPrestamosPage() {
    console.log('Inicializando página de préstamos...');
    
    // Cargar datos de préstamos
    cargarPrestamos();
    
    // Configurar campo de búsqueda
    const inputBusqueda = document.getElementById('buscarPrestamo');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', filtrarPrestamos);
    }
    
    // Si hay un préstamo pendiente de mostrar (desde otra vista)
    if (window.pendingLoanDetails) {
        setTimeout(() => {
            mostrarDetallesPrestamo(window.pendingLoanDetails);
            window.pendingLoanDetails = null;
        }, 500);
    }
}

// Inicializar la página de nuevo préstamo
function initNuevoPrestamoPage() {
    console.log('Inicializando página de nuevo préstamo...');
    
    // Cargar lista de clientes para el selector
    cargarClientesParaSelector();
    
    // Inicializar calculadora de préstamos
    initCalculadoraPrestamo();
    
    // Configurar formulario de nuevo préstamo
    const formNuevoPrestamo = document.getElementById('formNuevoPrestamo');
    if (formNuevoPrestamo) {
        formNuevoPrestamo.addEventListener('submit', crearNuevoPrestamo);
    }
    
    // Inicializar selección de cliente existente o nuevo
    const radioClienteExistente = document.getElementById('clienteExistente');
    const radioClienteNuevo = document.getElementById('clienteNuevo');
    
    if (radioClienteExistente && radioClienteNuevo) {
        radioClienteExistente.addEventListener('change', toggleSeccionCliente);
        radioClienteNuevo.addEventListener('change', toggleSeccionCliente);
        
        // Inicializar vista
        toggleSeccionCliente();
    }
}

// Alternar entre selección de cliente existente o nuevo
function toggleSeccionCliente() {
    const radioClienteExistente = document.getElementById('clienteExistente');
    const seccionClienteExistente = document.getElementById('seccionClienteExistente');
    const seccionClienteNuevo = document.getElementById('seccionClienteNuevo');
    
    if (radioClienteExistente.checked) {
        seccionClienteExistente.style.display = 'block';
        seccionClienteNuevo.style.display = 'none';
    } else {
        seccionClienteExistente.style.display = 'none';
        seccionClienteNuevo.style.display = 'block';
    }
}

// Cargar clientes para el selector
function cargarClientesParaSelector() {
    const selectCliente = document.getElementById('selectCliente');
    
    if (!selectCliente) return;
    
    // Limpiar opciones actuales
    selectCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';
    
    // Cargar clientes desde la API
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            // Ordenar clientes por nombre
            clientes.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
            
            // Agregar opciones al select
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.clienteId;
                option.textContent = `${cliente.nombreCompleto} - ${cliente.tipoDocumento}: ${cliente.numeroDocumento}`;
                selectCliente.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar clientes:', error);
            showNotification('Error al cargar la lista de clientes', 'error');
        });
}

// Inicializar calculadora de préstamos
function initCalculadoraPrestamo() {
    // Escuchar cambios en los campos de entrada
    const inputCantidad = document.getElementById('cantidadPrestamo');
    const inputInteres = document.getElementById('interesMensual');
    const inputPlazo = document.getElementById('plazoMeses');
    const selectFrecuencia = document.getElementById('frecuenciaPago');
    
    if (inputCantidad && inputInteres && inputPlazo && selectFrecuencia) {
        const calcularButton = document.getElementById('btnCalcularPrestamo');
        
        if (calcularButton) {
            calcularButton.addEventListener('click', function() {
                calcularPrestamo();
            });
        }
        
        // También calcular al cambiar los valores (opcional)
        [inputCantidad, inputInteres, inputPlazo, selectFrecuencia].forEach(input => {
            input.addEventListener('change', function() {
                if (inputCantidad.value && inputInteres.value && inputPlazo.value) {
                    calcularPrestamo();
                }
            });
        });
    }
}

// Calcular préstamo
function calcularPrestamo() {
    // Obtener valores de los campos
    const cantidadPrestamo = parseFloat(document.getElementById('cantidadPrestamo').value);
    const interesMensual = parseFloat(document.getElementById('interesMensual').value);
    const plazoMeses = parseInt(document.getElementById('plazoMeses').value);
    const frecuenciaPago = document.getElementById('frecuenciaPago').value;
    
    // Validar datos
    if (isNaN(cantidadPrestamo) || isNaN(interesMensual) || isNaN(plazoMeses)) {
        showNotification('Por favor, ingrese valores numéricos válidos', 'warning');
        return;
    }
    
    if (cantidadPrestamo <= 0) {
        showNotification('La cantidad del préstamo debe ser mayor a cero', 'warning');
        return;
    }
    
    if (interesMensual <= 0) {
        showNotification('La tasa de interés debe ser mayor a cero', 'warning');
        return;
    }
    
    if (plazoMeses <= 0) {
        showNotification('El plazo debe ser mayor a cero', 'warning');
        return;
    }
    
    // Convertir tasa de interés de porcentaje a decimal
    const tasaDecimal = interesMensual / 100;
    
    // Calcular cuota mensual (fórmula de amortización francesa)
    const cuotaMensual = (cantidadPrestamo * tasaDecimal * Math.pow(1 + tasaDecimal, plazoMeses)) / 
                        (Math.pow(1 + tasaDecimal, plazoMeses) - 1);
    
    // Calcular totales
    const totalPagar = cuotaMensual * plazoMeses;
    const totalInteres = totalPagar - cantidadPrestamo;
    
    // Generar tabla de amortización
    const tablaAmortizacion = generarTablaAmortizacion(cantidadPrestamo, tasaDecimal, plazoMeses, cuotaMensual);
    
    // Mostrar resultados
    document.getElementById('cuotaMensual').textContent = formatCurrency(cuotaMensual);
    document.getElementById('totalPagar').textContent = formatCurrency(totalPagar);
    document.getElementById('totalInteres').textContent = formatCurrency(totalInteres);
    
    // Mostrar la tabla de amortización
    mostrarTablaAmortizacion(tablaAmortizacion);
    
    // Mostrar resumen
    document.getElementById('resumenPrestamo').style.display = 'block';
}

// Generar tabla de amortización
function generarTablaAmortizacion(cantidadPrestamo, tasaDecimal, plazoMeses, cuotaMensual) {
    const tabla = [];
    let saldoPendiente = cantidadPrestamo;
    
    // Fecha actual como base para las fechas de pago
    const fechaInicio = new Date();
    
    for (let i = 1; i <= plazoMeses; i++) {
        // Calcular interés del mes
        const interesMes = saldoPendiente * tasaDecimal;
        
        // Calcular abono a capital
        const capitalMes = cuotaMensual - interesMes;
        
        // Actualizar saldo pendiente
        saldoPendiente -= capitalMes;
        
        // Calcular fecha de pago
        const fechaPago = new Date(fechaInicio);
        fechaPago.setMonth(fechaPago.getMonth() + i);
        
        // Agregar cuota a la tabla
        tabla.push({
            numeroPago: i,
            fechaPago,
            cuotaMensual,
            capital: capitalMes,
            interes: interesMes,
            saldoPendiente: Math.max(0, saldoPendiente) // Evitar saldo negativo por redondeo
        });
    }
    
    return tabla;
}

// Mostrar la tabla de amortización
function mostrarTablaAmortizacion(tablaAmortizacion) {
    const tbody = document.querySelector('#tablaAmortizacion tbody');
    
    if (!tbody) return;
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Llenar tabla
    tablaAmortizacion.forEach(cuota => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${cuota.numeroPago}</td>
            <td>${formatDate(cuota.fechaPago)}</td>
            <td>${formatCurrency(cuota.cuotaMensual)}</td>
            <td>${formatCurrency(cuota.capital)}</td>
            <td>${formatCurrency(cuota.interes)}</td>
            <td>${formatCurrency(cuota.saldoPendiente)}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Crear un nuevo préstamo
function crearNuevoPrestamo(event) {
    event.preventDefault();
    
    // Verificar si se seleccionó un cliente existente o se creará uno nuevo
    const radioClienteExistente = document.getElementById('clienteExistente');
    let clienteId = null;
    
    if (radioClienteExistente.checked) {
        // Usar cliente existente
        clienteId = document.getElementById('selectCliente').value;
        
        if (!clienteId) {
            showNotification('Por favor, seleccione un cliente', 'warning');
            return;
        }
        
        // Continuar con la creación del préstamo
        crearPrestamoConCliente(clienteId);
    } else {
        // Crear cliente nuevo primero
        const formDataCliente = {
            nombreCompleto: document.getElementById('nombreCompleto').value,
            tipoDocumento: document.getElementById('tipoDocumento').value,
            numeroDocumento: document.getElementById('numeroDocumento').value,
            telefono: document.getElementById('telefono').value,
            correoElectronico: document.getElementById('correoElectronico').value,
            estado: 'Activo'
        };
        
        // Validar datos del cliente
        if (!formDataCliente.nombreCompleto || !formDataCliente.numeroDocumento || 
            !formDataCliente.telefono || !formDataCliente.correoElectronico) {
            showNotification('Por favor, complete todos los campos del cliente', 'warning');
            return;
        }
        
        // Crear el cliente y luego el préstamo
        fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formDataCliente)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message || 'Error al crear cliente'); });
                }
                return response.json();
            })
            .then(cliente => {
                // Usar el ID del cliente recién creado
                crearPrestamoConCliente(cliente.clienteId);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al crear cliente: ' + error.message, 'error');
            });
    }
}

// Crear préstamo con el cliente ya definido
function crearPrestamoConCliente(clienteId) {
    // Obtener datos del préstamo
    const formDataPrestamo = {
        clienteId: clienteId,
        cantidadPrestamo: parseFloat(document.getElementById('cantidadPrestamo').value),
        interesMensual: parseFloat(document.getElementById('interesMensual').value),
        plazoMeses: parseInt(document.getElementById('plazoMeses').value),
        frecuenciaPago: document.getElementById('frecuenciaPago').value,
        fechaSolicitud: new Date().toISOString(),
        estado: 'Activo'
    };
    
    // Validar datos del préstamo
    if (isNaN(formDataPrestamo.cantidadPrestamo) || isNaN(formDataPrestamo.interesMensual) || 
        isNaN(formDataPrestamo.plazoMeses)) {
        showNotification('Por favor, ingrese valores numéricos válidos para el préstamo', 'warning');
        return;
    }
    
    // Crear el préstamo
    fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataPrestamo)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Error al crear préstamo'); });
            }
            return response.json();
        })
        .then(prestamo => {
            showNotification('Préstamo creado correctamente', 'success');
            
            // Preguntar si desea generar y enviar recibo
            if (confirm('¿Desea generar y descargar el recibo del préstamo?')) {
                window.open(`/api/prestamos/${prestamo.prestamoId}/recibo`, '_blank');
            }
            
            // Reiniciar formulario
            document.getElementById('formNuevoPrestamo').reset();
            document.getElementById('resumenPrestamo').style.display = 'none';
            
            // Volver a la lista de préstamos
            document.querySelector('.nav-link[data-page="prestamos"]').click();
            
            // Almacenar el ID para mostrar los detalles cuando se cargue la página
            window.pendingLoanDetails = prestamo.prestamoId;
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al crear préstamo: ' + error.message, 'error');
        });
}

// Cargar la lista de préstamos
function cargarPrestamos() {
    const tablaPrestamos = document.getElementById('tablaPrestamos');
    const tbody = tablaPrestamos ? tablaPrestamos.querySelector('tbody') : null;
    
    if (!tbody) return;
    
    // Mostrar mensaje de carga
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando préstamos...</td></tr>';
    
    // Realizar petición a la API
    fetch('/api/prestamos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar préstamos');
            }
            return response.json();
        })
        .then(async data => {
            prestamosData = data;
            
            // Cargar información de clientes
            const clientes = await fetch('/api/clientes').then(res => res.json());
            
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            // Mostrar préstamos con información de clientes
            mostrarPrestamos(data, clientesMap);
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${error.message}</td></tr>`;
            showNotification('Error al cargar préstamos: ' + error.message, 'error');
        });
}

// Mostrar la lista de préstamos en la tabla
function mostrarPrestamos(prestamos, clientesMap) {
    const tablaPrestamos = document.getElementById('tablaPrestamos');
    const tbody = tablaPrestamos ? tablaPrestamos.querySelector('tbody') : null;
    const contadorPrestamos = document.getElementById('contadorPrestamos');
    
    if (!tbody) return;
    
    // Actualizar contador
    if (contadorPrestamos) {
        contadorPrestamos.textContent = prestamos.length;
    }
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (prestamos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay préstamos registrados</td></tr>';
        return;
    }
    
    // Agregar filas de préstamos
    prestamos.forEach(prestamo => {
        const tr = document.createElement('tr');
        
        // Obtener información del cliente
        const cliente = clientesMap[prestamo.clienteId] || { nombreCompleto: 'Cliente desconocido' };
        
        // Definir clase según estado
        if (prestamo.estado === 'Cancelado') {
            tr.classList.add('table-danger');
        } else if (prestamo.estado === 'Pagado') {
            tr.classList.add('table-success');
        }
        
        // Calcular cuotas pagadas
        const cuotasPagadas = prestamo.tablaAmortizacion.filter(cuota => cuota.pagado).length;
        const totalCuotas = prestamo.tablaAmortizacion.length;
        const porcentajePagado = (cuotasPagadas / totalCuotas) * 100;
        
        // Crear columnas
        tr.innerHTML = `
            <td>${prestamo.prestamoId.substring(0, 8)}...</td>
            <td>${cliente.nombreCompleto}</td>
            <td>${formatDate(prestamo.fechaSolicitud)}</td>
            <td>${formatCurrency(prestamo.cantidadPrestamo)}</td>
            <td>${prestamo.interesMensual}%</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-primary" role="progressbar" 
                         style="width: ${porcentajePagado}%;" 
                         aria-valuenow="${porcentajePagado}" aria-valuemin="0" aria-valuemax="100">
                        ${cuotasPagadas}/${totalCuotas}
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${getBadgeClass(prestamo.estado)}">
                    ${prestamo.estado}
                </span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-info btn-circle" title="Ver detalles"
                    onclick="mostrarDetallesPrestamo('${prestamo.prestamoId}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success btn-circle" title="Registrar pago"
                    onclick="iniciarPago('${prestamo.prestamoId}')" 
                    ${prestamo.estado !== 'Activo' ? 'disabled' : ''}>
                    <i class="fas fa-dollar-sign"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-circle" title="Cancelar préstamo"
                    onclick="confirmarCancelarPrestamo('${prestamo.prestamoId}')"
                    ${prestamo.estado !== 'Activo' ? 'disabled' : ''}>
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Filtrar préstamos según texto de búsqueda
function filtrarPrestamos() {
    const textoBusqueda = document.getElementById('buscarPrestamo').value.toLowerCase();
    
    if (!prestamosData) return;
    
    // Obtener los clientes primero para poder filtrar por nombre del cliente
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            // Crear mapa de clientes para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            const prestamosFiltrados = prestamosData.filter(prestamo => {
                const cliente = clientesMap[prestamo.clienteId] || { nombreCompleto: '', numeroDocumento: '' };
                
                return (
                    prestamo.prestamoId.toLowerCase().includes(textoBusqueda) ||
                    cliente.nombreCompleto.toLowerCase().includes(textoBusqueda) ||
                    cliente.numeroDocumento.toLowerCase().includes(textoBusqueda) ||
                    formatCurrency(prestamo.cantidadPrestamo).toLowerCase().includes(textoBusqueda) ||
                    prestamo.estado.toLowerCase().includes(textoBusqueda)
                );
            });
            
            mostrarPrestamos(prestamosFiltrados, clientesMap);
        })
        .catch(error => {
            console.error('Error al cargar clientes para filtrado:', error);
        });
}

// Mostrar detalles de un préstamo
function mostrarDetallesPrestamo(prestamoId) {
    // Buscar préstamo en los datos cargados o cargar nuevamente
    if (prestamosData && prestamosData.length > 0) {
        const prestamo = prestamosData.find(p => p.prestamoId === prestamoId);
        
        if (prestamo) {
            mostrarDetallePrestamoCargado(prestamo);
            return;
        }
    }
    
    // Si no está en caché, cargar desde la API
    fetch(`/api/prestamos/${prestamoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Préstamo no encontrado');
            }
            return response.json();
        })
        .then(prestamo => {
            mostrarDetallePrestamoCargado(prestamo);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error: ' + error.message, 'error');
        });
}

// Mostrar detalle de préstamo ya cargado
function mostrarDetallePrestamoCargado(prestamo) {
    // Buscar cliente
    fetch(`/api/clientes/${prestamo.clienteId}`)
        .then(response => response.json())
        .then(cliente => {
            // Actualizar contenido del modal
            const modalDetalles = document.getElementById('modalDetallesPrestamo');
            if (!modalDetalles) return;
            
            // Actualizar título
            modalDetalles.querySelector('.modal-title').textContent = `Préstamo #${prestamo.prestamoId.substring(0, 8)}...`;
            
            // Actualizar cuerpo - Información general
            const detallesDiv = modalDetalles.querySelector('.detalles-prestamo');
            
            // Calcular cuotas pagadas
            const cuotasPagadas = prestamo.tablaAmortizacion.filter(cuota => cuota.pagado).length;
            const totalCuotas = prestamo.tablaAmortizacion.length;
            const porcentajePagado = (cuotasPagadas / totalCuotas) * 100;
            
            detallesDiv.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5>Información del Préstamo</h5>
                        <p><strong>ID:</strong> ${prestamo.prestamoId}</p>
                        <p><strong>Fecha de solicitud:</strong> ${formatDate(prestamo.fechaSolicitud)}</p>
                        <p><strong>Monto:</strong> ${formatCurrency(prestamo.cantidadPrestamo)}</p>
                        <p><strong>Interés mensual:</strong> ${prestamo.interesMensual}%</p>
                        <p><strong>Plazo:</strong> ${prestamo.plazoMeses} meses</p>
                        <p><strong>Frecuencia de pago:</strong> ${prestamo.frecuenciaPago}</p>
                        <p><strong>Estado:</strong> 
                            <span class="badge ${getBadgeClass(prestamo.estado)}">
                                ${prestamo.estado}
                            </span>
                        </p>
                        <p><strong>Progreso:</strong></p>
                        <div class="progress mb-3" style="height: 20px;">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                style="width: ${porcentajePagado}%;" 
                                aria-valuenow="${porcentajePagado}" aria-valuemin="0" aria-valuemax="100">
                                ${cuotasPagadas}/${totalCuotas} cuotas pagadas
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h5>Información del Cliente</h5>
                        <p><strong>Nombre:</strong> ${cliente.nombreCompleto}</p>
                        <p><strong>Documento:</strong> ${cliente.tipoDocumento} - ${cliente.numeroDocumento}</p>
                        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                        <p><strong>Correo:</strong> ${cliente.correoElectronico}</p>
                        <p><strong>Estado:</strong> 
                            <span class="badge ${cliente.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">
                                ${cliente.estado}
                            </span>
                        </p>
                        <h5 class="mt-3">Resumen Financiero</h5>
                        <p><strong>Cuota mensual:</strong> ${formatCurrency(prestamo.cuotaMensual)}</p>
                        <p><strong>Total a pagar:</strong> ${formatCurrency(prestamo.totalAPagar)}</p>
                        <p><strong>Total interés:</strong> ${formatCurrency(prestamo.totalInteres)}</p>
                    </div>
                </div>
            `;
            
            // Cargar pagos realizados
            fetch(`/api/pagos/prestamo/${prestamo.prestamoId}`)
                .then(response => response.json())
                .then(pagos => {
                    const pagosDiv = modalDetalles.querySelector('.pagos-prestamo');
                    
                    if (pagos.length === 0) {
                        pagosDiv.innerHTML = '<p class="text-center">No hay pagos registrados para este préstamo</p>';
                    } else {
                        let html = `
                            <div class="table-responsive">
                                <table class="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Cuota #</th>
                                            <th>Monto</th>
                                            <th>Tipo</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        
                        pagos.forEach(pago => {
                            html += `
                                <tr>
                                    <td>${formatDate(pago.fechaPago)}</td>
                                    <td>${pago.numeroPago}</td>
                                    <td>${formatCurrency(pago.cantidadPagada)}</td>
                                    <td>${pago.tipoPago}</td>
                                    <td>
                                        <a href="/api/pagos/${pago.pagoId}/recibo" target="_blank" class="btn btn-sm btn-primary">
                                            <i class="fas fa-file-pdf"></i> Recibo
                                        </a>
                                    </td>
                                </tr>
                            `;
                        });
                        
                        html += `
                                    </tbody>
                                </table>
                            </div>
                        `;
                        
                        pagosDiv.innerHTML = html;
                    }
                })
                .catch(error => {
                    console.error('Error al cargar pagos:', error);
                    modalDetalles.querySelector('.pagos-prestamo').innerHTML = 
                        '<p class="text-center text-danger">Error al cargar pagos</p>';
                });
            
            // Mostrar tabla de amortización
            const tablaAmortizacionDiv = modalDetalles.querySelector('.tabla-amortizacion');
            
            let htmlTabla = `
                <div class="table-responsive">
                    <table class="table table-sm table-hover amortizacion-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Fecha</th>
                                <th>Cuota</th>
                                <th>Capital</th>
                                <th>Interés</th>
                                <th>Saldo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            prestamo.tablaAmortizacion.forEach(cuota => {
                htmlTabla += `
                    <tr class="${cuota.pagado ? 'table-success' : ''}">
                        <td>${cuota.numeroPago}</td>
                        <td>${formatDate(cuota.fechaPago)}</td>
                        <td>${formatCurrency(cuota.cuotaMensual)}</td>
                        <td>${formatCurrency(cuota.capital)}</td>
                        <td>${formatCurrency(cuota.interes)}</td>
                        <td>${formatCurrency(cuota.saldoPendiente)}</td>
                        <td>
                            <span class="badge ${cuota.pagado ? 'bg-success' : 'bg-warning'}">
                                ${cuota.pagado ? 'Pagado' : 'Pendiente'}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            htmlTabla += `
                        </tbody>
                    </table>
                </div>
            `;
            
            tablaAmortizacionDiv.innerHTML = htmlTabla;
            
            // Mostrar modal
            const modal = new bootstrap.Modal(modalDetalles);
            modal.show();
        })
        .catch(error => {
            console.error('Error al cargar cliente:', error);
            showNotification('Error al cargar información del cliente', 'error');
        });
}

// Iniciar proceso de pago
function iniciarPago(prestamoId, numeroPago = null) {
    // Buscar préstamo
    fetch(`/api/prestamos/${prestamoId}`)
        .then(response => response.json())
        .then(prestamo => {
            // Verificar si el préstamo está activo
            if (prestamo.estado !== 'Activo') {
                showNotification('Solo se pueden registrar pagos de préstamos activos', 'warning');
                return;
            }
            
            // Actualizar el modal de pago
            const modalPago = document.getElementById('modalRegistrarPago');
            if (!modalPago) return;
            
            // Actualizar título
            modalPago.querySelector('.modal-title').textContent = `Registrar Pago - Préstamo #${prestamo.prestamoId.substring(0, 8)}...`;
            
            // Obtener formulario
            const formPago = document.getElementById('formRegistrarPago');
            
            // Limpiar formulario
            formPago.reset();
            
            // Establecer ID del préstamo
            formPago.querySelector('input[name="prestamoId"]').value = prestamo.prestamoId;
            
            // Crear selector de cuotas
            const selectCuota = formPago.querySelector('select[name="numeroPago"]');
            selectCuota.innerHTML = '<option value="">Seleccione la cuota a pagar...</option>';
            
            // Filtrar solo cuotas pendientes
            const cuotasPendientes = prestamo.tablaAmortizacion.filter(cuota => !cuota.pagado);
            
            if (cuotasPendientes.length === 0) {
                showNotification('Todas las cuotas de este préstamo ya están pagadas', 'warning');
                return;
            }
            
            // Llenar selector de cuotas
            cuotasPendientes.forEach(cuota => {
                const option = document.createElement('option');
                option.value = cuota.numeroPago;
                option.textContent = `Cuota ${cuota.numeroPago} - Vencimiento: ${formatDate(cuota.fechaPago)} - ${formatCurrency(cuota.cuotaMensual)}`;
                
                // Si la fecha está vencida, marcarla
                const fechaVencimiento = new Date(cuota.fechaPago);
                if (fechaVencimiento < new Date()) {
                    option.textContent += ' (Vencida)';
                    option.classList.add('text-danger');
                }
                
                selectCuota.appendChild(option);
            });
            
            // Si se especificó un número de pago, seleccionarlo
            if (numeroPago !== null) {
                // Buscar si el número de pago está entre las cuotas pendientes
                const cuotaSeleccionada = cuotasPendientes.find(c => c.numeroPago === numeroPago);
                
                if (cuotaSeleccionada) {
                    selectCuota.value = numeroPago;
                    
                    // Actualizar el monto a pagar
                    formPago.querySelector('input[name="cantidadPagada"]').value = cuotaSeleccionada.cuotaMensual.toFixed(2);
                }
            }
            
            // Actualizar el monto a pagar cuando se selecciona una cuota
            selectCuota.addEventListener('change', function() {
                const cuotaSeleccionada = prestamo.tablaAmortizacion.find(c => c.numeroPago == this.value);
                
                if (cuotaSeleccionada) {
                    formPago.querySelector('input[name="cantidadPagada"]').value = cuotaSeleccionada.cuotaMensual.toFixed(2);
                }
            });
            
            // Configurar evento de envío del formulario
            formPago.onsubmit = function(event) {
                event.preventDefault();
                registrarPago();
            };
            
            // Mostrar modal
            const modal = new bootstrap.Modal(modalPago);
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cargar información del préstamo', 'error');
        });
}

// Registrar un pago
function registrarPago() {
    const formPago = document.getElementById('formRegistrarPago');
    
    // Obtener datos del formulario
    const formData = new FormData(formPago);
    const pagoData = Object.fromEntries(formData.entries());
    
    // Validar datos
    if (!pagoData.numeroPago) {
        showNotification('Por favor, seleccione la cuota a pagar', 'warning');
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
                return response.json().then(err => { throw new Error(err.message || 'Error al registrar pago'); });
            }
            return response.json();
        })
        .then(pago => {
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalRegistrarPago')).hide();
            
            // Actualizar lista de préstamos
            cargarPrestamos();
            
            // Mostrar notificación
            showNotification('Pago registrado correctamente', 'success');
            
            // Preguntar si desea imprimir el recibo
            if (confirm('¿Desea generar y descargar el recibo del pago?')) {
                window.open(`/api/pagos/${pago.pagoId}/recibo`, '_blank');
            }
            
            // Si el préstamo actual está abierto, actualizar sus detalles
            const modalDetalles = document.getElementById('modalDetallesPrestamo');
            if (modalDetalles && modalDetalles.classList.contains('show')) {
                mostrarDetallesPrestamo(pago.prestamoId);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al registrar pago: ' + error.message, 'error');
        });
}

// Confirmar cancelación de préstamo
function confirmarCancelarPrestamo(prestamoId) {
    if (confirm('¿Está seguro de que desea cancelar este préstamo? Esta acción cambiará el estado del préstamo a "Cancelado".')) {
        cancelarPrestamo(prestamoId);
    }
}

// Cancelar un préstamo
function cancelarPrestamo(prestamoId) {
    // Enviar petición a la API
    fetch(`/api/prestamos/${prestamoId}/cancelar`, {
        method: 'PUT'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Error al cancelar préstamo'); });
            }
            return response.json();
        })
        .then(data => {
            // Actualizar lista de préstamos
            cargarPrestamos();
            
            // Mostrar notificación
            showNotification('Préstamo cancelado correctamente', 'success');
            
            // Si el préstamo actual está abierto, actualizar sus detalles
            const modalDetalles = document.getElementById('modalDetallesPrestamo');
            if (modalDetalles && modalDetalles.classList.contains('show')) {
                mostrarDetallesPrestamo(prestamoId);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error al cancelar préstamo: ' + error.message, 'error');
        });
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