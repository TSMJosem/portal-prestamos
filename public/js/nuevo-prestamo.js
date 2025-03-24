/**
 * Módulo de gestión de nuevos préstamos
 * Este archivo maneja todas las operaciones relacionadas con la creación de préstamos
 */

// Función principal de inicialización
function initNuevoPrestamoPage() {
    console.log("Inicializando página de nuevo préstamo...");
    
    // Marcar la página actual
    window.currentPage = 'nuevo-prestamo';
    
    // Configurar cambio entre cliente existente y nuevo
    configurarSelectorTipoCliente();
    
    // Cargar clientes para el select
    cargarClientes();
    
    // Inicializar fecha por defecto
    inicializarFechas();
    
    // Configurar eventos para cálculos automáticos
    configurarCalculosAutomaticos();
    
    // Inicializar validaciones del formulario
    inicializarValidaciones();
    
    // Inicializar evento para cambio de frecuencia de pago
    inicializarEventoFrecuenciaPago();
}

// Configurar selector de tipo de cliente (existente o nuevo)
function configurarSelectorTipoCliente() {
    const radioClienteExistente = document.getElementById('clienteExistente');
    const radioClienteNuevo = document.getElementById('clienteNuevo');
    const seccionClienteExistente = document.getElementById('seccionClienteExistente');
    const seccionClienteNuevo = document.getElementById('seccionClienteNuevo');
    
    if (!radioClienteExistente || !radioClienteNuevo || !seccionClienteExistente || !seccionClienteNuevo) {
        console.error("No se encontraron elementos para el selector de tipo de cliente");
        return;
    }
    
    // Función para cambiar visibilidad
    function cambiarSeccionCliente() {
        if (radioClienteExistente.checked) {
            seccionClienteExistente.style.display = 'block';
            seccionClienteNuevo.style.display = 'none';
            
            // Habilitar/deshabilitar validaciones de campos
            const selectCliente = document.querySelector('select[name="clienteId"]');
            if (selectCliente) {
                selectCliente.required = true;
            }
            
            // Desactivar required en campos de cliente nuevo
            const camposClienteNuevo = seccionClienteNuevo.querySelectorAll('input, select');
            camposClienteNuevo.forEach(campo => {
                campo.required = false;
            });
        } else {
            seccionClienteExistente.style.display = 'none';
            seccionClienteNuevo.style.display = 'block';
            
            // Habilitar/deshabilitar validaciones de campos
            const selectCliente = document.querySelector('select[name="clienteId"]');
            if (selectCliente) {
                selectCliente.required = false;
            }
            
            // Activar required en campos importantes de cliente nuevo
            const nombreCompleto = document.getElementById('nombreCompleto');
            const tipoDocumento = document.getElementById('tipoDocumento');
            const numeroDocumento = document.getElementById('numeroDocumento');
            const telefono = document.getElementById('telefono');
            
            if (nombreCompleto) nombreCompleto.required = true;
            if (tipoDocumento) tipoDocumento.required = true;
            if (numeroDocumento) numeroDocumento.required = true;
            if (telefono) telefono.required = true;
        }
    }
    
    // Asignar evento change a ambos radio buttons
    radioClienteExistente.addEventListener('change', cambiarSeccionCliente);
    radioClienteNuevo.addEventListener('change', cambiarSeccionCliente);
    
    // Inicializar con la selección actual
    cambiarSeccionCliente();
}

// Cargar lista de clientes para el selector
function cargarClientes() {
    // Verificar si estamos en la página correcta antes de intentar cargar los clientes
    if (window.currentPage !== 'nuevo-prestamo') {
        return; // No ejecutar si no estamos en la página de nuevo préstamo
    }
    
    const selectCliente = document.querySelector('select[name="clienteId"]');
    if (!selectCliente) {
        console.error("No se encontró el selector de clientes");
        return;
    }
    
    // Limpiar opciones actuales
    selectCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';
    
    // Asegurar que el campo sea visible y seleccionable
    selectCliente.style.display = 'block';
    selectCliente.disabled = false;
    
    // Cargar clientes desde la API
    fetch('/api/clientes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener la lista de clientes');
            }
            return response.json();
        })
        .then(clientes => {
            // Filtrar sólo clientes activos
            const clientesActivos = clientes.filter(cliente => cliente.estado === 'Activo');
            
            if (clientesActivos.length === 0) {
                selectCliente.innerHTML = '<option value="">No hay clientes activos disponibles</option>';
                showNotification('No hay clientes activos disponibles. Por favor, registre un cliente primero.', 'warning');
                return;
            }
            
            // Añadir opción predeterminada
            selectCliente.innerHTML = '<option value="">Seleccione un cliente...</option>';
            
            // Añadir cada cliente como opción
            clientesActivos.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.clienteId;
                option.textContent = `${cliente.nombreCompleto} - ${cliente.tipoDocumento}: ${cliente.numeroDocumento}`;
                selectCliente.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar clientes:', error);
            showNotification('Error al cargar la lista de clientes. Por favor, recargue la página.', 'error');
        });
}

// Inicializar campos de fecha
function inicializarFechas() {
    // Verificar si estamos en la página correcta
    if (window.currentPage !== 'nuevo-prestamo') {
        return; // No ejecutar si no estamos en la página de nuevo préstamo
    }
    
    const fechaSolicitudInput = document.querySelector('input[name="fechaSolicitud"]');
    if (fechaSolicitudInput) {
        // Configurar fecha actual en formato YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        fechaSolicitudInput.value = `${year}-${month}-${day}`;
    }
}

// Configurar eventos para cálculos automáticos
function configurarCalculosAutomaticos() {
    const montoInput = document.querySelector('input[name="cantidadPrestamo"]');
    const tasaInput = document.querySelector('input[name="interesMensual"]');
    const plazoInput = document.querySelector('input[name="plazoMeses"]');
    const frecuenciaPagoSelect = document.querySelector('select[name="frecuenciaPago"]');
    
    // Si alguno de los campos no existe, no continuar
    if (!montoInput || !tasaInput || !plazoInput || !frecuenciaPagoSelect) {
        console.error("No se encontraron todos los campos necesarios para los cálculos");
        return;
    }
    
    // Añadir eventos para recalcular los valores al cambiar
    [montoInput, tasaInput, plazoInput, frecuenciaPagoSelect].forEach(element => {
        element.addEventListener('change', calcularAmortizacion);
        if (element !== frecuenciaPagoSelect) {
            element.addEventListener('input', calcularAmortizacion);
        }
    });
    
    // Iniciar con un cálculo inicial si hay valores predeterminados
    calcularAmortizacion();
}

// Calcular tabla de amortización
function calcularAmortizacion() {
    const cantidadPrestamo = parseFloat(document.querySelector('input[name="cantidadPrestamo"]')?.value) || 0;
    const interesMensual = parseFloat(document.querySelector('input[name="interesMensual"]')?.value) || 0;
    const plazoMeses = parseInt(document.querySelector('input[name="plazoMeses"]')?.value) || 0;
    const frecuenciaPago = document.querySelector('select[name="frecuenciaPago"]')?.value || 'Mensual';
    
    // Obtener elementos para mostrar resultados
    const cuotaMensualElement = document.querySelector('input[name="cuotaMensual"]');
    const totalAPagarElement = document.querySelector('input[name="totalAPagar"]');
    const totalInteresElement = document.querySelector('input[name="totalInteres"]');
    const tablaAmortizacionBody = document.querySelector('#tablaAmortizacion tbody');
    
    // Verificar que todos los valores necesarios estén presentes
    if (!cantidadPrestamo || !interesMensual || !plazoMeses || !frecuenciaPago) {
        // Limpiar resultados
        if (cuotaMensualElement) cuotaMensualElement.value = '';
        if (totalAPagarElement) totalAPagarElement.value = '';
        if (totalInteresElement) totalInteresElement.value = '';
        if (tablaAmortizacionBody) tablaAmortizacionBody.innerHTML = '';
        return;
    }
    
    try {
        // Convertir tasa de interés de porcentaje a decimal
        const tasaDecimal = interesMensual / 100;
        
        // Ajuste según frecuencia de pago
        let factorFrecuencia = 1;
        let nombreCuota = 'Mensual';
        
        switch (frecuenciaPago) {
            case 'Semanal':
                factorFrecuencia = 12 / 52; // Convertir mensual a semanal
                nombreCuota = 'Semanal';
                break;
            case 'Quincenal':
                factorFrecuencia = 12 / 24; // Convertir mensual a quincenal
                nombreCuota = 'Quincenal';
                break;
            case 'Mensual':
            default:
                factorFrecuencia = 1;
                nombreCuota = 'Mensual';
                break;
        }
        
        // Calcular número total de pagos según frecuencia
        const numeroPagos = calcularNumeroPagos(plazoMeses, frecuenciaPago);
        
        // Calcular tasa de interés ajustada por frecuencia
        const tasaAjustada = tasaDecimal * factorFrecuencia;
        
        // Calcular cuota usando la fórmula de amortización francesa
        // Fórmula: C = P * r * (1 + r)^n / ((1 + r)^n - 1)
        const numerador = cantidadPrestamo * tasaAjustada * Math.pow(1 + tasaAjustada, numeroPagos);
        const denominador = Math.pow(1 + tasaAjustada, numeroPagos) - 1;
        
        let cuotaCalculada = 0;
        if (denominador !== 0) {
            cuotaCalculada = numerador / denominador;
        } else {
            cuotaCalculada = cantidadPrestamo / numeroPagos;
        }
        
        // Redondear a 2 decimales
        cuotaCalculada = Math.round(cuotaCalculada * 100) / 100;
        
        // Calcular totales
        const totalPagar = cuotaCalculada * numeroPagos;
        const totalInteres = totalPagar - cantidadPrestamo;
        
        // Mostrar resultados en los campos
        if (cuotaMensualElement) cuotaMensualElement.value = cuotaCalculada.toFixed(2);
        if (totalAPagarElement) totalAPagarElement.value = totalPagar.toFixed(2);
        if (totalInteresElement) totalInteresElement.value = totalInteres.toFixed(2);
        
        // Actualizar elementos de visualización en tarjetas
        const cuotaMensualDisplay = document.getElementById('cuotaMensual');
        const totalPagarDisplay = document.getElementById('totalPagar');
        const totalInteresDisplay = document.getElementById('totalInteres');
        
        if (cuotaMensualDisplay) cuotaMensualDisplay.textContent = formatCurrency(cuotaCalculada);
        if (totalPagarDisplay) totalPagarDisplay.textContent = formatCurrency(totalPagar);
        if (totalInteresDisplay) totalInteresDisplay.textContent = formatCurrency(totalInteres);
        
        // Mostrar sección de resumen si está oculta
        const resumenPrestamo = document.getElementById('resumenPrestamo');
        if (resumenPrestamo && resumenPrestamo.style.display === 'none') {
            resumenPrestamo.style.display = 'block';
        }
        
        // Generar tabla de amortización si existe el elemento
        if (tablaAmortizacionBody) {
            // Obtener la fecha de solicitud
            const fechaSolicitudInput = document.querySelector('input[name="fechaSolicitud"]');
            const fechaSolicitud = fechaSolicitudInput ? new Date(fechaSolicitudInput.value) : new Date();
            
            generarTablaAmortizacion(
                tablaAmortizacionBody,
                cantidadPrestamo,
                cuotaCalculada,
                tasaAjustada,
                numeroPagos,
                frecuenciaPago,
                fechaSolicitud
            );
        }
    } catch (error) {
        console.error('Error al calcular la amortización:', error);
        showNotification('Error en el cálculo. Por favor, revise los valores ingresados.', 'error');
    }
}

// Calcular número de pagos según plazo y frecuencia
function calcularNumeroPagos(plazoMeses, frecuenciaPago) {
    switch (frecuenciaPago) {
        case 'Semanal':
            return Math.round(plazoMeses * 4.33); // Aproximadamente 4.33 semanas por mes
        case 'Quincenal':
            return plazoMeses * 2; // 2 quincenas por mes
        case 'Mensual':
        default:
            return plazoMeses; // Pagos mensuales
    }
}

// Generar tabla de amortización
function generarTablaAmortizacion(tablaBody, monto, cuota, tasaInteres, numeroPagos, frecuenciaPago, fechaInicio) {
    // Limpiar tabla
    tablaBody.innerHTML = '';
    
    // Verificar que la fecha de inicio sea válida
    if (!fechaInicio || isNaN(fechaInicio.getTime())) {
        fechaInicio = new Date(); // Usar fecha actual como fallback
    }
    
    let saldoPendiente = monto;
    
    // Generar filas de la tabla
    for (let i = 1; i <= numeroPagos; i++) {
        // Calcular fecha de pago según frecuencia
        const fechaPago = calcularFechaPago(fechaInicio, i, frecuenciaPago);
        
        // Calcular interés del período
        const interesPeriodo = saldoPendiente * tasaInteres;
        
        // Calcular abono a capital
        const abonoCapital = cuota - interesPeriodo;
        
        // Calcular nuevo saldo
        const nuevoSaldo = saldoPendiente - abonoCapital;
        
        // Crear fila para la tabla
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i}</td>
            <td>${formatDate(fechaPago)}</td>
            <td>${formatCurrency(cuota)}</td>
            <td>${formatCurrency(abonoCapital)}</td>
            <td>${formatCurrency(interesPeriodo)}</td>
            <td>${formatCurrency(Math.max(0, nuevoSaldo))}</td>
        `;
        
        tablaBody.appendChild(tr);
        
        // Actualizar saldo pendiente para el siguiente período
        saldoPendiente = nuevoSaldo;
    }
}

// Calcular fecha de pago según frecuencia
function calcularFechaPago(fechaInicio, numeroPago, frecuenciaPago) {
    // Crear una copia para no modificar la fecha original
    const fecha = new Date(fechaInicio);
    
    switch (frecuenciaPago) {
        case 'Semanal':
            fecha.setDate(fecha.getDate() + (numeroPago * 7));
            break;
        case 'Quincenal':
            fecha.setDate(fecha.getDate() + (numeroPago * 15));
            break;
        case 'Mensual':
        default:
            fecha.setMonth(fecha.getMonth() + numeroPago);
            break;
    }
    
    return fecha;
}

// Inicializar validaciones del formulario
function inicializarValidaciones() {
    const form = document.getElementById('formNuevoPrestamo');
    if (!form) {
        console.error("No se encontró el formulario de nuevo préstamo");
        return;
    }
    
    // Configurar botón calcular
    const btnCalcular = document.getElementById('btnCalcularPrestamo');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', function() {
            // Mostrar sección de resumen si está oculta
            const resumenPrestamo = document.getElementById('resumenPrestamo');
            if (resumenPrestamo) {
                resumenPrestamo.style.display = 'block';
            }
            
            // Calcular y actualizar los valores de resumen
            calcularAmortizacion();
            
            // Actualizar valores en tarjetas de resumen
            const cuotaMensualElement = document.querySelector('input[name="cuotaMensual"]');
            const totalAPagarElement = document.querySelector('input[name="totalAPagar"]');
            const totalInteresElement = document.querySelector('input[name="totalInteres"]');
            
            const cuotaMensualDisplay = document.getElementById('cuotaMensual');
            const totalPagarDisplay = document.getElementById('totalPagar');
            const totalInteresDisplay = document.getElementById('totalInteres');
            
            if (cuotaMensualDisplay && cuotaMensualElement) 
                cuotaMensualDisplay.textContent = formatCurrency(parseFloat(cuotaMensualElement.value));
            if (totalPagarDisplay && totalAPagarElement) 
                totalPagarDisplay.textContent = formatCurrency(parseFloat(totalAPagarElement.value));
            if (totalInteresDisplay && totalInteresElement) 
                totalInteresDisplay.textContent = formatCurrency(parseFloat(totalInteresElement.value));
        });
    }
    
    form.addEventListener('submit', function(e) {
        // Prevenir envío por defecto
        e.preventDefault();
        
        // Verificar si es cliente nuevo o existente
        const esClienteNuevo = document.getElementById('clienteNuevo')?.checked || false;
        
        if (esClienteNuevo) {
            // Validar campos obligatorios para cliente nuevo
            if (!validarCamposClienteNuevo()) {
                return false;
            }
        } else {
            // Validar campos obligatorios para cliente existente
            if (!validarCamposObligatorios()) {
                return false;
            }
        }
        
        // Validar montos
        if (!validarMontos()) {
            return false;
        }
        
        // Si todo está bien, enviar el formulario
        submitFormWithAmortizacion(form);
    });
}

// Validar campos obligatorios para cliente existente
function validarCamposObligatorios() {
    const camposObligatorios = [
        { selector: 'select[name="clienteId"]', mensaje: 'Por favor, seleccione un cliente' },
        { selector: 'input[name="cantidadPrestamo"]', mensaje: 'Por favor, ingrese el monto del préstamo' },
        { selector: 'input[name="interesMensual"]', mensaje: 'Por favor, ingrese la tasa de interés mensual' },
        { selector: 'input[name="plazoMeses"]', mensaje: 'Por favor, ingrese el plazo en meses' },
        { selector: 'select[name="frecuenciaPago"]', mensaje: 'Por favor, seleccione la frecuencia de pago' }
    ];
    
    for (const campo of camposObligatorios) {
        const elemento = document.querySelector(campo.selector);
        if (!elemento || !elemento.value) {
            showNotification(campo.mensaje, 'error');
            if (elemento) {
                elemento.focus();
                elemento.classList.add('is-invalid');
            }
            return false;
        } else {
            elemento.classList.remove('is-invalid');
        }
    }
    
    return true;
}

// Validar campos obligatorios para cliente nuevo
function validarCamposClienteNuevo() {
    const camposObligatorios = [
        { selector: '#nombreCompleto', mensaje: 'Por favor, ingrese el nombre completo del cliente' },
        { selector: '#tipoDocumento', mensaje: 'Por favor, seleccione el tipo de documento' },
        { selector: '#numeroDocumento', mensaje: 'Por favor, ingrese el número de documento' },
        { selector: '#telefono', mensaje: 'Por favor, ingrese el teléfono del cliente' },
        { selector: 'input[name="cantidadPrestamo"]', mensaje: 'Por favor, ingrese el monto del préstamo' },
        { selector: 'input[name="interesMensual"]', mensaje: 'Por favor, ingrese la tasa de interés mensual' },
        { selector: 'input[name="plazoMeses"]', mensaje: 'Por favor, ingrese el plazo en meses' },
        { selector: 'select[name="frecuenciaPago"]', mensaje: 'Por favor, seleccione la frecuencia de pago' }
    ];
    
    for (const campo of camposObligatorios) {
        const elemento = document.querySelector(campo.selector);
        if (!elemento || !elemento.value) {
            showNotification(campo.mensaje, 'error');
            if (elemento) {
                elemento.focus();
                elemento.classList.add('is-invalid');
            }
            return false;
        } else {
            elemento.classList.remove('is-invalid');
        }
    }
    
    return true;
}

// Validar montos y valores numéricos
function validarMontos() {
    // Validar monto del préstamo
    const cantidadPrestamoInput = document.querySelector('input[name="cantidadPrestamo"]');
    if (!cantidadPrestamoInput) {
        showNotification('No se encontró el campo de monto del préstamo', 'error');
        return false;
    }
    
    const cantidadPrestamo = parseFloat(cantidadPrestamoInput.value);
    if (isNaN(cantidadPrestamo) || cantidadPrestamo <= 0) {
        showNotification('El monto del préstamo debe ser un número positivo', 'error');
        cantidadPrestamoInput.focus();
        return false;
    }
    
    // Validar tasa de interés
    const interesMensualInput = document.querySelector('input[name="interesMensual"]');
    if (!interesMensualInput) {
        showNotification('No se encontró el campo de tasa de interés', 'error');
        return false;
    }
    
    const interesMensual = parseFloat(interesMensualInput.value);
    if (isNaN(interesMensual) || interesMensual < 0) {
        showNotification('La tasa de interés debe ser un número positivo o cero', 'error');
        interesMensualInput.focus();
        return false;
    }
    
    // Validar plazo
    const plazoMesesInput = document.querySelector('input[name="plazoMeses"]');
    if (!plazoMesesInput) {
        showNotification('No se encontró el campo de plazo en meses', 'error');
        return false;
    }
    
    const plazoMeses = parseInt(plazoMesesInput.value);
    if (isNaN(plazoMeses) || plazoMeses <= 0) {
        showNotification('El plazo debe ser un número entero positivo', 'error');
        plazoMesesInput.focus();
        return false;
    }
    
    return true;
}

// Inicializar evento para cambio de frecuencia de pago
function inicializarEventoFrecuenciaPago() {
    const frecuenciaPagoSelect = document.querySelector('select[name="frecuenciaPago"]');
    if (frecuenciaPagoSelect) {
        frecuenciaPagoSelect.addEventListener('change', function() {
            // Recalcular la tabla de amortización cuando cambia la frecuencia
            calcularAmortizacion();
        });
    }
}

// Función para verificar si ya existe un cliente con un número de documento
function verificarClienteExistente(numeroDocumento) {
    return fetch(`/api/clientes?numeroDocumento=${encodeURIComponent(numeroDocumento)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al verificar el cliente');
            }
            return response.json();
        })
        .then(clientes => {
            // Verificar si existe algún cliente con ese número de documento
            return clientes.some(cliente => cliente.numeroDocumento === numeroDocumento);
        })
        .catch(error => {
            console.error('Error al verificar cliente:', error);
            return false; // Asumir que no existe en caso de error
        });
}

// Función mejorada para el manejo de errores en fetch
function fetchWithErrorHandling(url, options) {
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
                }).catch(e => {
                    // Si no se puede obtener JSON del error, lanzar error genérico
                    if (e instanceof SyntaxError) {
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }
                    throw e;
                });
            }
            return response.json();
        });
}

// Enviar formulario con tabla de amortización
function submitFormWithAmortizacion(form) {
    // Verificar si es cliente nuevo o existente
    const esClienteNuevo = document.getElementById('clienteNuevo')?.checked || false;
   
    // Si es cliente nuevo, primero crear el cliente
    if (esClienteNuevo) {
        // Obtener datos del cliente nuevo
        const correoElectronicoInput = document.getElementById('correoElectronico');
        
        // MODIFICACIÓN: Generar un correo electrónico único si está vacío
        let correoElectronicoValue;
        if (correoElectronicoInput && correoElectronicoInput.value && correoElectronicoInput.value.trim() !== '') {
            correoElectronicoValue = correoElectronicoInput.value.trim();
        } else {
            // Generar un correo único con timestamp y valor aleatorio para garantizar unicidad
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            correoElectronicoValue = `sin-correo-${timestamp}-${random}@sistema.local`;
        }
        
        const numeroDocumento = document.getElementById('numeroDocumento')?.value;
       
        const clienteData = {
            nombreCompleto: document.getElementById('nombreCompleto')?.value,
            tipoDocumento: document.getElementById('tipoDocumento')?.value,
            numeroDocumento: numeroDocumento,
            telefono: document.getElementById('telefono')?.value,
            correoElectronico: correoElectronicoValue, // Ahora siempre tendrá un valor, nunca null
            estado: 'Activo'
        };
       
        // Verificar datos mínimos
        if (!clienteData.nombreCompleto || !clienteData.tipoDocumento ||
            !clienteData.numeroDocumento || !clienteData.telefono) {
            showNotification('Por favor, complete los datos del cliente nuevo', 'error');
            return;
        }
       
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
       
        const btnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verificando cliente...';
       
        // Verificar primero si el cliente ya existe
        verificarClienteExistente(numeroDocumento)
            .then(existeCliente => {
                if (existeCliente) {
                    throw new Error('Ya existe un cliente con ese número de documento. Por favor, utilice la opción de cliente existente.');
                }
               
                // Si no existe, proceder con la creación
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando cliente...';
                
                // Agregar log para verificar los datos que se envían
                console.log('Datos del cliente a crear:', clienteData);
                
                return fetchWithErrorHandling('/api/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });
            })
            .then(data => {
                // Ahora crear el préstamo con el cliente recién creado
                crearPrestamo(form, data.clienteId, submitBtn, btnText);
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al crear el cliente: ' + error.message, 'error');
               
                // Restaurar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = btnText;
            });
    } else {
        // Cliente existente, crear préstamo directamente
        const clienteId = document.querySelector('select[name="clienteId"]')?.value;
        if (!clienteId) {
            showNotification('Por favor, seleccione un cliente', 'error');
            return;
        }
       
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
       
        const btnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
       
        crearPrestamo(form, clienteId, submitBtn, btnText);
    }
}

// Función auxiliar para crear el préstamo
function crearPrestamo(form, clienteId, submitBtn, btnText) {
    // Obtener datos del formulario
    const cantidadPrestamo = parseFloat(document.querySelector('input[name="cantidadPrestamo"]')?.value) || 0;
    const interesMensual = parseFloat(document.querySelector('input[name="interesMensual"]')?.value) || 0;
    const plazoMeses = parseInt(document.querySelector('input[name="plazoMeses"]')?.value) || 0;
    const frecuenciaPago = document.querySelector('select[name="frecuenciaPago"]')?.value || 'Mensual';
    
    // Calcular valores si no están presentes
    let cuotaMensual = 0;
    let totalAPagar = 0;
    let totalInteres = 0;

    // Intentar obtener valores calculados
    const cuotaMensualElement = document.querySelector('input[name="cuotaMensual"]');
    const totalAPagarElement = document.querySelector('input[name="totalAPagar"]');
    const totalInteresElement = document.querySelector('input[name="totalInteres"]');

    if (cuotaMensualElement && cuotaMensualElement.value) {
        cuotaMensual = parseFloat(cuotaMensualElement.value);
    } else {
        // Calcular manualmente
        const tasaDecimal = interesMensual / 100;
        const factorFrecuencia = (frecuenciaPago === 'Semanal') ? 12/52 : (frecuenciaPago === 'Quincenal') ? 12/24 : 1;
        const tasaAjustada = tasaDecimal * factorFrecuencia;
        const numeroPagos = calcularNumeroPagos(plazoMeses, frecuenciaPago);
        
        const numerador = cantidadPrestamo * tasaAjustada * Math.pow(1 + tasaAjustada, numeroPagos);
        const denominador = Math.pow(1 + tasaAjustada, numeroPagos) - 1;
        
        if (denominador !== 0) {
            cuotaMensual = numerador / denominador;
        } else {
            cuotaMensual = cantidadPrestamo / numeroPagos;
        }
        
        cuotaMensual = Math.round(cuotaMensual * 100) / 100;
        totalAPagar = cuotaMensual * numeroPagos;
        totalInteres = totalAPagar - cantidadPrestamo;
    }

    if (totalAPagarElement && totalAPagarElement.value) {
        totalAPagar = parseFloat(totalAPagarElement.value);
    }

    if (totalInteresElement && totalInteresElement.value) {
        totalInteres = parseFloat(totalInteresElement.value);
    }

    // Generar objeto de préstamo
    const prestamoData = {
        clienteId: clienteId,
        cantidadPrestamo: cantidadPrestamo,
        interesMensual: interesMensual,
        plazoMeses: plazoMeses,
        frecuenciaPago: frecuenciaPago,
        cuotaMensual: cuotaMensual,
        totalAPagar: totalAPagar,
        totalInteres: totalInteres,
        fechaSolicitud: document.querySelector('input[name="fechaSolicitud"]')?.value || new Date().toISOString().split('T')[0]
    };

    // Generar tabla de amortización
    const fechaSolicitud = prestamoData.fechaSolicitud ? new Date(prestamoData.fechaSolicitud) : new Date();

    prestamoData.tablaAmortizacion = generarTablaAmortizacionData(
        prestamoData.cantidadPrestamo,
        prestamoData.cuotaMensual,
        prestamoData.interesMensual / 100,
        calcularNumeroPagos(prestamoData.plazoMeses, prestamoData.frecuenciaPago),
        prestamoData.frecuenciaPago,
        fechaSolicitud
    );

    // Enviar datos a la API
    fetchWithErrorHandling('/api/prestamos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(prestamoData)
    })
    .then(data => {
        // Mostrar notificación de éxito
        showNotification('Préstamo creado correctamente', 'success');
        
        // Verificar la estructura de la respuesta para acceder correctamente al prestamoId
        let prestamoId = '';
        
        // Intentar obtener el ID del préstamo de diferentes posibles estructuras
        if (data) {
            if (data.prestamo && data.prestamo.prestamoId) {
                prestamoId = data.prestamo.prestamoId;
            } else if (data.prestamoId) {
                prestamoId = data.prestamoId;
            } else if (typeof data === 'string' && data.includes('prestamoId')) {
                // Intentar extraer ID de una respuesta en formato string
                try {
                    const match = data.match(/prestamoId[\"\']\s*:\s*[\"\'](.*?)[\"\']/);
                    if (match && match[1]) prestamoId = match[1];
                } catch (e) {
                    console.log('No se pudo extraer ID de la respuesta string');
                }
            }
        }
        
        // Preguntar si desea generar recibo solo si tenemos un prestamoId
        if (prestamoId) {
            console.log('Préstamo creado con ID:', prestamoId);
            if (confirm('¿Desea generar el contrato del préstamo en PDF?')) {
                window.open(`/api/prestamos/${prestamoId}/recibo`, '_blank');
            }
        } else {
            console.log('Préstamo creado pero no se pudo determinar el ID específico');
        }
        
        // Limpiar formulario
        form.reset();
        inicializarFechas();
        
        // Redireccionar a la lista de préstamos después de un tiempo
        setTimeout(() => {
            const prestamoLink = document.querySelector('.nav-link[data-page="prestamos"]');
            if (prestamoLink) {
                prestamoLink.click();
            } else {
                window.location.href = '/prestamos';
            }
        }, 1500);
    })
    .catch(error => {
        console.error('Error detallado:', error);
        
        // Verificar si el préstamo se creó a pesar del error
        fetch('/api/prestamos?ultimo=true')
        .then(response => response.json())
        .then(ultimosPrestamos => {
            const timestampReciente = Date.now() - 10000; // 10 segundos atrás
            const prestamoReciente = ultimosPrestamos.find(p => 
                new Date(p.fechaSolicitud).getTime() > timestampReciente);
                
            if (prestamoReciente) {
                showNotification('El préstamo parece haberse creado correctamente a pesar del error de visualización. Redirigiendo...', 'warning');
                
                // Redirigir a la lista de préstamos
                setTimeout(() => {
                    const prestamoLink = document.querySelector('.nav-link[data-page="prestamos"]');
                    if (prestamoLink) {
                        prestamoLink.click();
                    } else {
                        window.location.href = '/prestamos';
                    }
                }, 2000);
            } else {
                showNotification('Error al crear el préstamo: ' + error.message, 'error');
            }
        })
        .catch(() => {
            showNotification('Error al crear el préstamo: ' + error.message, 'error');
        });
    })
    .finally(() => {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = btnText;
    });
}

// Generar datos de tabla de amortización para enviar
function generarTablaAmortizacionData(monto, cuota, tasaInteres, numeroPagos, frecuenciaPago, fechaInicio) {
const tabla = [];
let saldoPendiente = monto;

// Verificar que la fecha de inicio sea válida
if (!fechaInicio || isNaN(fechaInicio.getTime())) {
    fechaInicio = new Date(); // Usar fecha actual como fallback
}

// Calcular factor de frecuencia
let factorFrecuencia = 1;
switch (frecuenciaPago) {
    case 'Semanal':
        factorFrecuencia = 12 / 52;
        break;
    case 'Quincenal':
        factorFrecuencia = 12 / 24;
        break;
    case 'Mensual':
    default:
        factorFrecuencia = 1;
        break;
}

// Ajustar tasa de interés según frecuencia
const tasaAjustada = tasaInteres * factorFrecuencia;

for (let i = 1; i <= numeroPagos; i++) {
    // Calcular fecha de pago
    const fechaPago = calcularFechaPago(fechaInicio, i, frecuenciaPago);
    
    // Calcular interés del período
    const interesPeriodo = saldoPendiente * tasaAjustada;
    
    // Calcular abono a capital
    const abonoCapital = cuota - interesPeriodo;
    
    // Calcular nuevo saldo
    const nuevoSaldo = saldoPendiente - abonoCapital;
    
    // Añadir a la tabla
    tabla.push({
        numeroPago: i,
        fechaPago: fechaPago.toISOString(),
        cuotaMensual: parseFloat(cuota.toFixed(2)),
        capital: parseFloat(abonoCapital.toFixed(2)),
        interes: parseFloat(interesPeriodo.toFixed(2)),
        saldoPendiente: parseFloat(Math.max(0, nuevoSaldo).toFixed(2)),
        pagado: false
    });
    
    // Actualizar saldo pendiente
    saldoPendiente = nuevoSaldo;
}

return tabla;
}

// Función auxiliar para formatear fechas
function formatDate(date) {
if (!date) return '';

try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Fecha inválida
    
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
} catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
}
}

// Función auxiliar para formatear moneda
function formatCurrency(amount) {
if (isNaN(amount)) return '$0.00';

try {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
} catch (error) {
    console.error('Error al formatear moneda:', error);
    return '$' + amount.toFixed(2);
}
}