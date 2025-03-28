/**
 * simulador-cobros.js - Genera datos de prueba para el apartado "Por Cobrar Hoy"
 * 
 * Este script crea clientes y préstamos con pagos programados para el día actual,
 * permitiendo probar la funcionalidad de cobros diarios en el dashboard.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧪 Inicializando simulador de cobros para hoy...');
    
    // Ejecutar una vez que el DOM esté completamente cargado
    setTimeout(() => {
        // Agregar botón al dashboard para generar datos de prueba
        agregarBotonSimulador();
    }, 1000);
    
    // =========== CONFIGURACIÓN DEL SIMULADOR ===========
    
    // Configuración de clientes y préstamos a generar
    const CONFIG = {
        // Número de clientes a generar
        numClientes: 10,
        
        // Rangos para montos de préstamos
        montoMinimo: 5000,
        montoMaximo: 50000,
        
        // Rangos para plazos (en meses)
        plazoMinimo: 3,
        plazoMaximo: 24,
        
        // Rangos para tasas de interés mensual (%)
        interesMinimo: 2,
        interesMaximo: 10,
        
        // Probabilidad de que un cliente tenga múltiples préstamos (0-1)
        probabilidadMultiplesPrestamos: 0.3,
        
        // Datos para generación aleatoria
        nombres: [
            "Juan", "María", "Carlos", "Ana", "Pedro", "Laura", "Javier", "Sofía", 
            "Miguel", "Lucía", "Roberto", "Fernanda", "Eduardo", "Paola", "Ricardo"
        ],
        apellidos: [
            "Gómez", "Rodríguez", "López", "Pérez", "González", "Martínez", "Sánchez", 
            "Fernández", "Torres", "Díaz", "Hernández", "Flores", "García", "Ramírez", "Vargas"
        ],
        segundoApellido: [
            "Silva", "Castro", "Ortega", "Ramos", "Rivera", "Cruz", "Aguilar", "Núñez", 
            "Vega", "Molina", "Rojas", "Campos", "Medina", "Cortés", "Castillo"
        ]
    };
    
    // =========== FUNCIONES DEL SIMULADOR ===========
    
    // Función principal para generar datos de prueba
    async function generarDatosPrueba() {
        try {
            mostrarMensaje('Iniciando generación de datos de prueba...', 'info');
            
            // 1. Generar clientes
            const clientes = await generarClientes(CONFIG.numClientes);
            mostrarMensaje(`Se han generado ${clientes.length} clientes`, 'info');
            
            // 2. Generar préstamos con pagos para hoy
            const prestamos = await generarPrestamosPagosHoy(clientes);
            mostrarMensaje(`Se han generado ${prestamos.length} préstamos con pagos programados para hoy`, 'success');
            
            // 3. Actualizar contadores para mostrar los nuevos datos
            actualizarDashboard();
            
            return { clientes, prestamos };
        } catch (error) {
            console.error('Error al generar datos de prueba:', error);
            mostrarMensaje('Error al generar datos: ' + error.message, 'danger');
            return { clientes: [], prestamos: [] };
        }
    }
    
    // Generar clientes de prueba
    async function generarClientes(cantidad) {
        const clientesGenerados = [];
        
        for (let i = 0; i < cantidad; i++) {
            // Generar datos aleatorios para el cliente
            const timestamp = Date.now() + i; // Para garantizar unicidad
            
            const nombreCompleto = generarNombreCompleto();
            const tipoDocumento = obtenerAleatorio(['INE', 'CURP', 'Pasaporte', 'Otro']);
            const numeroDocumento = `TEST-${timestamp.toString().slice(-8)}`;
            const telefono = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
            const correoElectronico = `${nombreCompleto.split(' ')[0].toLowerCase()}.${timestamp}@ejemplo.com`;
            
            // Crear objeto de cliente
            const clienteData = {
                nombreCompleto,
                tipoDocumento,
                numeroDocumento,
                telefono,
                correoElectronico,
                estado: 'Activo'
            };
            
            try {
                // Enviar a la API para crear el cliente
                const response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clienteData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error ${response.status}`);
                }
                
                const clienteCreado = await response.json();
                clientesGenerados.push(clienteCreado);
                
                actualizarProgreso(i + 1, cantidad, 'Generando clientes');
            } catch (error) {
                console.error(`Error al crear cliente ${i+1}:`, error);
                // Continuar con el siguiente cliente
            }
        }
        
        return clientesGenerados;
    }
    
    // Generar préstamos con pagos programados para hoy
    async function generarPrestamosPagosHoy(clientes) {
        const prestamosGenerados = [];
        const cantidadTotal = clientes.length;
        let procesados = 0;
        
        for (const cliente of clientes) {
            // Determinar cuántos préstamos tendrá este cliente
            const numeroPrestamos = Math.random() < CONFIG.probabilidadMultiplesPrestamos ? 
                                    obtenerAleatorioEntero(1, 3) : 1;
            
            for (let j = 0; j < numeroPrestamos; j++) {
                // Generar datos aleatorios para el préstamo
                const cantidadPrestamo = obtenerAleatorioEntero(CONFIG.montoMinimo, CONFIG.montoMaximo);
                const interesMensual = obtenerAleatorioDecimal(CONFIG.interesMinimo, CONFIG.interesMaximo);
                const plazoMeses = obtenerAleatorioEntero(CONFIG.plazoMinimo, CONFIG.plazoMaximo);
                const frecuenciaPago = obtenerAleatorio(['Mensual', 'Quincenal']);
                
                // Calcular fecha de inicio retroactiva para que un pago caiga hoy
                const fechaSolicitud = calcularFechaSolicitudParaPagoHoy(plazoMeses, frecuenciaPago);
                
                // Crear objeto de préstamo
                const prestamoData = {
                    clienteId: cliente.clienteId,
                    cantidadPrestamo,
                    interesMensual,
                    plazoMeses,
                    frecuenciaPago,
                    fechaSolicitud: fechaSolicitud.toISOString(),
                    estado: 'Activo'
                };
                
                try {
                    // Enviar a la API para crear el préstamo
                    const response = await fetch('/api/prestamos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(prestamoData)
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Error ${response.status}`);
                    }
                    
                    const prestamoCreado = await response.json();
                    prestamosGenerados.push(prestamoCreado);
                    
                    // Simular que la primera cuota ya fue pagada en algunos casos
                    if (Math.random() > 0.5 && prestamoCreado.prestamoId) {
                        try {
                            await simularPagoPrimeraCuota(prestamoCreado.prestamoId);
                        } catch (error) {
                            console.error('Error al simular pago de primera cuota:', error);
                        }
                    }
                } catch (error) {
                    console.error(`Error al crear préstamo para cliente ${cliente.clienteId}:`, error);
                    // Continuar con el siguiente préstamo
                }
            }
            
            procesados++;
            actualizarProgreso(procesados, cantidadTotal, 'Generando préstamos');
        }
        
        return prestamosGenerados;
    }
    
    // Simular pago de primera cuota para algunos préstamos
    async function simularPagoPrimeraCuota(prestamoId) {
        // Obtener detalles del préstamo para encontrar la primera cuota
        const response = await fetch(`/api/prestamos/${prestamoId}`);
        if (!response.ok) {
            throw new Error(`Error al obtener préstamo ${prestamoId}`);
        }
        
        const prestamo = await response.json();
        
        // Si tiene tabla de amortización, pagar la primera cuota
        if (prestamo.tablaAmortizacion && prestamo.tablaAmortizacion.length > 0) {
            const primeraCuota = prestamo.tablaAmortizacion[0];
            
            // Datos para el pago
            const pagoData = {
                prestamoId: prestamoId,
                clienteId: prestamo.clienteId,
                numeroPago: primeraCuota.numeroPago,
                cantidadPagada: primeraCuota.cuotaMensual,
                // Fecha de pago anterior a hoy
                fechaPago: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                tipoPago: obtenerAleatorio(['Efectivo', 'Transferencia', 'Tarjeta'])
            };
            
            // Registrar el pago
            const pagoResponse = await fetch('/api/pagos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagoData)
            });
            
            if (!pagoResponse.ok) {
                throw new Error(`Error al registrar pago para préstamo ${prestamoId}`);
            }
            
            console.log(`✅ Simulado pago de primera cuota para préstamo ${prestamoId}`);
        }
    }
    
    // Calcular fecha de solicitud para que un pago caiga hoy
    function calcularFechaSolicitudParaPagoHoy(plazoMeses, frecuenciaPago) {
        const hoy = new Date();
        const fechaSolicitud = new Date(hoy);
        
        // Determinar número de pago que queremos que caiga hoy (entre 2 y último pago)
        const numeroPagos = frecuenciaPago === 'Mensual' ? plazoMeses : plazoMeses * 2;
        const numeroPagoHoy = obtenerAleatorioEntero(2, numeroPagos);
        
        // Calcular cuánto tiempo retroceder según la frecuencia de pago
        let diasPorPeriodo;
        if (frecuenciaPago === 'Mensual') {
            diasPorPeriodo = 30;
        } else if (frecuenciaPago === 'Quincenal') {
            diasPorPeriodo = 15;
        } else {
            diasPorPeriodo = 7;
        }
        
        // Retroceder el tiempo necesario
        const diasRetroceder = diasPorPeriodo * (numeroPagoHoy - 1);
        fechaSolicitud.setDate(fechaSolicitud.getDate() - diasRetroceder);
        
        // Ajustar para que la fecha de pago caiga exactamente hoy
        // (ajustar por posibles diferencias en días del mes)
        if (frecuenciaPago === 'Mensual') {
            // Si es mensual, asegurarse de que la fecha de pago sea hoy
            while (new Date(fechaSolicitud.getTime() + numeroPagoHoy * diasPorPeriodo * 24 * 60 * 60 * 1000).getDate() !== hoy.getDate()) {
                fechaSolicitud.setDate(fechaSolicitud.getDate() - 1);
            }
        }
        
        return fechaSolicitud;
    }
    
    // =========== FUNCIONES AUXILIARES ===========
    
    // Generar nombre completo aleatorio
    function generarNombreCompleto() {
        const nombre = obtenerAleatorio(CONFIG.nombres);
        const apellido1 = obtenerAleatorio(CONFIG.apellidos);
        const apellido2 = obtenerAleatorio(CONFIG.segundoApellido);
        return `${nombre} ${apellido1} ${apellido2}`;
    }
    
    // Obtener elemento aleatorio de un array
    function obtenerAleatorio(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // Obtener número entero aleatorio en un rango (inclusivo)
    function obtenerAleatorioEntero(min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
    
    // Obtener número decimal aleatorio en un rango
    function obtenerAleatorioDecimal(min, max, decimales = 2) {
        const valor = min + Math.random() * (max - min);
        return parseFloat(valor.toFixed(decimales));
    }
    
    // Actualizar el dashboard después de crear datos
    function actualizarDashboard() {
        console.log('🔄 Actualizando dashboard con nuevos datos...');
        
        // Recargar contadores
        if (typeof window.loadCounters === 'function') {
            window.loadCounters();
        }
        
        // Actualizar específicamente los cobros del día
        if (typeof window.calcularCobrosDiaActual === 'function') {
            window.calcularCobrosDiaActual()
                .then(data => {
                    console.log('Cobros actualizados:', data);
                    // Actualizar el contador en el dashboard
                    const contador = document.getElementById('totalPorCobrarHoy');
                    if (contador && typeof formatCurrency === 'function') {
                        contador.textContent = formatCurrency(data.total || 0);
                    }
                })
                .catch(error => {
                    console.error('Error al actualizar cobros:', error);
                });
        }
        
        // Actualizar otros elementos del dashboard
        if (typeof window.loadDashboardData === 'function') {
            window.loadDashboardData();
        }
    }
    
    // Función auxiliar para formatear moneda
    function formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(amount);
        } catch (error) {
            return `$${parseFloat(amount).toFixed(2)}`;
        }
    }
    
    // Actualizar barra de progreso durante la generación
    function actualizarProgreso(actual, total, accion) {
        const porcentaje = Math.round((actual / total) * 100);
        
        // Actualizar en consola
        console.log(`${accion}: ${porcentaje}% (${actual}/${total})`);
        
        // Si hay un modal abierto con barra de progreso, actualizarla
        const progressBar = document.getElementById('progresoGeneracion');
        if (progressBar) {
            progressBar.style.width = `${porcentaje}%`;
            progressBar.setAttribute('aria-valuenow', porcentaje);
        }
        
        const estadoDiv = document.getElementById('estadoGeneracion');
        if (estadoDiv) {
            estadoDiv.textContent = `${accion}: ${actual} de ${total} (${porcentaje}%)`;
        }
    }
    
    // Mostrar mensaje de notificación
    function mostrarMensaje(mensaje, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        
        // Usar función global si está disponible
        if (typeof window.showNotification === 'function') {
            window.showNotification(mensaje, tipo);
            return;
        }
        
        // Implementación alternativa de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
        notificacion.style.zIndex = '9999';
        notificacion.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(notificacion);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            notificacion.classList.remove('show');
            setTimeout(() => notificacion.remove(), 300);
        }, 5000);
    }
    
    // =========== INTERFAZ DE USUARIO ===========
    
    // Agregar botón al dashboard para iniciar la simulación
    function agregarBotonSimulador() {
        // Solo agregar botón si estamos en el dashboard
        if (window.currentPage !== 'dashboard' && document.getElementById('dashboard')?.classList.contains('active') !== true) {
            return;
        }
        
        // Buscar la tarjeta "Por Cobrar Hoy" para añadir el botón
        const tarjetaPorCobrar = document.getElementById('totalPorCobrarHoy')?.closest('.card');
        
        if (tarjetaPorCobrar) {
            // Revisar si ya existe el botón para evitar duplicados
            if (document.getElementById('btnSimularCobros')) return;
            
            // Crear botón
            const boton = document.createElement('button');
            boton.id = 'btnSimularCobros';
            boton.className = 'btn btn-sm btn-warning position-absolute top-0 end-0 m-2';
            boton.innerHTML = '<i class="fas fa-magic"></i> Simular cobros';
            boton.title = 'Generar datos de prueba para cobros del día';
            boton.style.zIndex = '10';
            
            // Agregar evento para mostrar el modal de simulación
            boton.addEventListener('click', mostrarModalSimulacion);
            
            // Hacer que la tarjeta tenga posición relativa para posicionar el botón
            tarjetaPorCobrar.style.position = 'relative';
            
            // Agregar a la tarjeta
            tarjetaPorCobrar.appendChild(boton);
            console.log('✅ Botón de simulación agregado al dashboard');
        } else {
            console.log('⚠️ No se encontró la tarjeta Por Cobrar Hoy para agregar el botón');
            
            // Plan B: Agregar en otra posición visible del dashboard
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                const contenedor = dashboard.querySelector('h2') || dashboard.querySelector('.row');
                
                if (contenedor) {
                    // Crear botón flotante
                    const boton = document.createElement('button');
                    boton.id = 'btnSimularCobros';
                    boton.className = 'btn btn-warning ms-3';
                    boton.innerHTML = '<i class="fas fa-magic"></i> Simular cobros de hoy';
                    boton.addEventListener('click', mostrarModalSimulacion);
                    
                    // Insertar después del título o al inicio de la primera fila
                    contenedor.insertAdjacentElement('afterend', boton);
                    console.log('✅ Botón de simulación agregado al dashboard (posición alternativa)');
                }
            }
        }
    }
    
    // Mostrar modal para configurar la simulación
    function mostrarModalSimulacion() {
        console.log('🧪 Mostrando modal de simulación de cobros...');
        
        // Verificar si ya existe el modal
        let modalSimulacion = document.getElementById('modalSimuladorCobros');
        
        if (!modalSimulacion) {
            // Crear el modal
            modalSimulacion = document.createElement('div');
            modalSimulacion.id = 'modalSimuladorCobros';
            modalSimulacion.className = 'modal fade';
            modalSimulacion.tabIndex = '-1';
            modalSimulacion.setAttribute('aria-hidden', 'true');
            
            // Contenido del modal
            modalSimulacion.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-magic me-2"></i> Simulador de cobros para ${new Date().toLocaleDateString()}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Esta herramienta creará clientes y préstamos con pagos programados para HOY,
                                permitiendo probar la funcionalidad de cobros diarios.
                            </div>
                            
                            <form id="formSimulador">
                                <div class="mb-3">
                                    <label for="cantidadClientes" class="form-label">Número de clientes</label>
                                    <input type="number" class="form-control" id="cantidadClientes" min="1" max="20" value="${CONFIG.numClientes}">
                                    <div class="form-text">Cantidad de clientes a generar (1-20)</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="probabilidadMultiplesPrestamos" class="form-label">
                                        Probabilidad de múltiples préstamos: <span id="valorProbabilidad">${CONFIG.probabilidadMultiplesPrestamos * 100}%</span>
                                    </label>
                                    <input type="range" class="form-range" id="probabilidadMultiplesPrestamos" 
                                           min="0" max="100" value="${CONFIG.probabilidadMultiplesPrestamos * 100}">
                                    <div class="form-text">Porcentaje de clientes que tendrán más de un préstamo</div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="montoMinimo" class="form-label">Monto mínimo ($)</label>
                                            <input type="number" class="form-control" id="montoMinimo" value="${CONFIG.montoMinimo}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="montoMaximo" class="form-label">Monto máximo ($)</label>
                                            <input type="number" class="form-control" id="montoMaximo" value="${CONFIG.montoMaximo}">
                                        </div>
                                    </div>
                                </div>
                            </form>
                            
                            <div id="seccionProgreso" style="display: none;">
                                <hr>
                                <h6 class="mb-3">Progreso de generación</h6>
                                <div class="progress mb-3">
                                    <div id="progresoGeneracion" class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                                         role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <div id="estadoGeneracion" class="text-center small text-muted"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-warning" id="btnIniciarSimulacion">
                                <i class="fas fa-play me-1"></i> Iniciar simulación
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar al DOM
            document.body.appendChild(modalSimulacion);
            
            // Configurar eventos del formulario
            const rangeInput = document.getElementById('probabilidadMultiplesPrestamos');
            if (rangeInput) {
                rangeInput.addEventListener('input', function() {
                    document.getElementById('valorProbabilidad').textContent = `${this.value}%`;
                });
            }
            
            // Configurar botón para iniciar simulación
            const btnIniciar = document.getElementById('btnIniciarSimulacion');
            if (btnIniciar) {
                btnIniciar.addEventListener('click', function() {
                    // Actualizar configuración con los valores ingresados
                    const cantidadClientes = parseInt(document.getElementById('cantidadClientes').value) || CONFIG.numClientes;
                    const probabilidad = parseInt(document.getElementById('probabilidadMultiplesPrestamos').value) / 100;
                    const montoMinimo = parseInt(document.getElementById('montoMinimo').value) || CONFIG.montoMinimo;
                    const montoMaximo = parseInt(document.getElementById('montoMaximo').value) || CONFIG.montoMaximo;
                    
                    // Validar valores
                    if (cantidadClientes < 1 || cantidadClientes > 20) {
                        mostrarMensaje('La cantidad de clientes debe estar entre 1 y 20', 'warning');
                        return;
                    }
                    
                    if (montoMinimo <= 0 || montoMaximo <= 0 || montoMinimo >= montoMaximo) {
                        mostrarMensaje('Los montos no son válidos. El mínimo debe ser menor que el máximo', 'warning');
                        return;
                    }
                    
                    // Actualizar configuración
                    CONFIG.numClientes = cantidadClientes;
                    CONFIG.probabilidadMultiplesPrestamos = probabilidad;
                    CONFIG.montoMinimo = montoMinimo;
                    CONFIG.montoMaximo = montoMaximo;
                    
                    // Mostrar sección de progreso
                    document.getElementById('seccionProgreso').style.display = 'block';
                    
                    // Deshabilitar botón y formulario
                    this.disabled = true;
                    document.getElementById('formSimulador').querySelectorAll('input, select').forEach(input => {
                        input.disabled = true;
                    });
                    
                    // Iniciar simulación
                    generarDatosPrueba()
                        .then(resultado => {
                            console.log('Simulación completada:', resultado);
                            
                            // Actualizar estado
                            document.getElementById('estadoGeneracion').textContent = 
                                `✅ Generación completada: ${resultado.clientes.length} clientes y ${resultado.prestamos.length} préstamos`;
                            
                            document.getElementById('progresoGeneracion').style.width = '100%';
                            document.getElementById('progresoGeneracion').classList.remove('progress-bar-animated');
                            
                            // Restaurar botón con función de cierre
                            this.disabled = false;
                            this.innerHTML = '<i class="fas fa-check me-1"></i> Completado - Cerrar';
                            this.classList.remove('btn-warning');
                            this.classList.add('btn-success');
                            
                            // Cambiar función del botón para cerrar modal
                            this.removeEventListener('click', arguments.callee);
                            this.addEventListener('click', function() {
                                bootstrap.Modal.getInstance(modalSimulacion).hide();
                            });
                        })
                        .catch(error => {
                            console.error('Error en simulación:', error);
                            document.getElementById('estadoGeneracion').textContent = `❌ Error: ${error.message}`;
                            
                            // Restaurar botón para reintentar
                            this.disabled = false;
                            this.innerHTML = '<i class="fas fa-sync me-1"></i> Reintentar';
                        });
                });
            }
        }
        
        // Mostrar el modal
        try {
            const modal = new bootstrap.Modal(modalSimulacion);
            modal.show();
        } catch (error) {
            console.error('Error al mostrar modal:', error);
            alert('No se pudo mostrar la ventana de simulación');
        }
    }
    
    // Exponer funciones al ámbito global
    window.simuladorCobros = {
        generar: generarDatosPrueba,
        actualizar: actualizarDashboard,
        mostrarModal: mostrarModalSimulacion
    };
    
    console.log('✅ Simulador de cobros inicializado correctamente');
});