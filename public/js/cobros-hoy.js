/**
 * cobros-hoy.js - Implementación de funcionalidad real para la sección "Por Cobrar Hoy"
 * 
 * Este script reemplaza la intercepción simulada para mostrar datos reales de cobros
 * pendientes para el día actual en el dashboard de ALFIN CASH.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Inicializando módulo de cobros del día...');
    
    // Modificar la función de carga de contadores para mejorar "Por Cobrar Hoy"
    const originalLoadCounters = window.loadCounters;
    
    window.loadCounters = function() {
        // Mantener la funcionalidad original para los otros contadores
        if (typeof originalLoadCounters === 'function') {
            // Llamar a la función original pero interceptar después para manejar "Por Cobrar Hoy"
            originalLoadCounters();
        }
        
        // Específicamente actualizar "Por Cobrar Hoy" con datos reales
        actualizarCobrosDiaActual();
    };
    
    // Reemplazar la intercepción API simulada con la funcionalidad real
    const originalInterceptarAPIs = window.interceptarAPIs;
    
    window.interceptarAPIs = function() {
        // Llamar a la función original primero
        if (typeof originalInterceptarAPIs === 'function') {
            originalInterceptarAPIs();
        }
        
        // Modificar el fetch para evitar la intercepción de cobros del día
        const originalFetch = window.fetch;
        
        window.fetch = function(url, options) {
            // Permitir que la llamada real se ejecute para cobros del día
            if (url.includes('/api/prestamos/por-cobrar-hoy')) {
                console.log('💰 Permitiendo llamada real a: /api/prestamos/por-cobrar-hoy');
                // En lugar de interceptar, calculamos y devolvemos datos reales
                return calcularCobrosDiaActual()
                    .then(resultado => {
                        // Devolver un objeto response simulado con los datos reales
                        return {
                            ok: true,
                            json: () => Promise.resolve(resultado)
                        };
                    })
                    .catch(error => {
                        console.error('Error al calcular cobros del día:', error);
                        // En caso de error, devolver un valor por defecto para evitar que la UI se rompa
                        return {
                            ok: true,
                            json: () => Promise.resolve({ total: 0, pagos: [] })
                        };
                    });
            }
            
            // Para todas las demás URLs, usar el fetch interceptado original
            return originalFetch(url, options);
        };
    };
    
    // Función para calcular y obtener los cobros del día actual
    async function calcularCobrosDiaActual() {
        console.log('💵 Calculando montos a cobrar hoy...');
        
        try {
            // 1. Obtener todos los préstamos activos
            const prestamosResponse = await fetch('/api/prestamos?estado=Activo');
            if (!prestamosResponse.ok) {
                throw new Error(`Error al obtener préstamos: ${prestamosResponse.status}`);
            }
            
            const prestamos = await prestamosResponse.json();
            console.log(`Analizando ${prestamos.length} préstamos activos`);
            
            // 2. Obtener la fecha actual (solo día, mes, año)
            const hoy = new Date();
            const fechaHoy = new Date(
                hoy.getFullYear(), 
                hoy.getMonth(), 
                hoy.getDate()
            ).toISOString().split('T')[0];
            
            console.log(`Fecha de hoy para comparación: ${fechaHoy}`);
            
            // 3. Filtrar préstamos con pagos que vencen hoy
            const prestamosPorCobrarHoy = [];
            let totalPorCobrar = 0;
            
            prestamos.forEach(prestamo => {
                // Verificar si tiene tabla de amortización
                if (prestamo.tablaAmortizacion && Array.isArray(prestamo.tablaAmortizacion)) {
                    // Buscar cuotas pendientes que vencen hoy
                    const cuotasHoy = prestamo.tablaAmortizacion.filter(cuota => {
                        // Verificar si la cuota no está pagada
                        if (cuota.pagado) return false;
                        
                        // Obtener solo fecha (YYYY-MM-DD) para comparar
                        const fechaCuota = new Date(cuota.fechaPago)
                            .toISOString().split('T')[0];
                        
                        return fechaCuota === fechaHoy;
                    });
                    
                    // Si hay cuotas que vencen hoy, agregar al total
                    if (cuotasHoy.length > 0) {
                        // Calcular monto total de las cuotas de hoy para este préstamo
                        const montoPrestamo = cuotasHoy.reduce(
                            (sum, cuota) => sum + parseFloat(cuota.cuotaMensual || 0), 
                            0
                        );
                        
                        // Agregar al total general
                        totalPorCobrar += montoPrestamo;
                        
                        // Guardar información del préstamo y cliente para mostrar detalles
                        prestamosPorCobrarHoy.push({
                            prestamoId: prestamo.prestamoId,
                            clienteId: prestamo.clienteId,
                            montoPorCobrar: montoPrestamo,
                            cuotas: cuotasHoy.map(c => ({
                                numeroPago: c.numeroPago,
                                monto: c.cuotaMensual,
                                fechaPago: c.fechaPago
                            }))
                        });
                    }
                }
            });
            
            console.log(`Se encontraron ${prestamosPorCobrarHoy.length} préstamos con pagos venciendo hoy`);
            console.log(`Total a cobrar hoy: ${totalPorCobrar}`);
            
            // 4. Si hay préstamos por cobrar, obtener información de clientes
            let pagosConDetalles = [];
            
            if (prestamosPorCobrarHoy.length > 0) {
                // Obtener todos los clientes para enriquecer la información
                const clientesResponse = await fetch('/api/clientes');
                if (!clientesResponse.ok) {
                    throw new Error(`Error al obtener clientes: ${clientesResponse.status}`);
                }
                
                const clientes = await clientesResponse.json();
                const clientesMap = {};
                
                // Crear un mapa para acceso rápido a clientes por ID
                clientes.forEach(cliente => {
                    clientesMap[cliente.clienteId] = cliente;
                });
                
                // Enriquecer la información de pagos con datos de clientes
                pagosConDetalles = prestamosPorCobrarHoy.map(item => {
                    const cliente = clientesMap[item.clienteId] || { nombreCompleto: 'Cliente desconocido' };
                    
                    return {
                        prestamoId: item.prestamoId,
                        clienteId: item.clienteId,
                        clienteNombre: cliente.nombreCompleto,
                        clienteTelefono: cliente.telefono || 'N/A',
                        montoPorCobrar: item.montoPorCobrar,
                        cuotas: item.cuotas
                    };
                });
            }
            
            // 5. Devolver resultado con total y detalles
            return {
                total: totalPorCobrar,
                pagos: pagosConDetalles
            };
            
        } catch (error) {
            console.error('Error al calcular cobros del día:', error);
            
            // En caso de error, devolver objeto vacío
            return {
                total: 0,
                pagos: []
            };
        }
    }
    
    // Función para actualizar el UI con la información de cobros del día
    function actualizarCobrosDiaActual() {
        console.log('🔄 Actualizando datos de cobros del día en el dashboard...');
        
        // Actualizar el contador
        calcularCobrosDiaActual()
            .then(resultado => {
                // Actualizar el contador en el dashboard
                const contador = document.getElementById('totalPorCobrarHoy');
                if (contador) {
                    contador.textContent = formatCurrency(resultado.total || 0);
                    console.log(`✅ Contador actualizado: ${resultado.total}`);
                    
                    // Si hay pagos por cobrar, habilitar elemento para mostrar detalles
                    if (resultado.total > 0 && resultado.pagos.length > 0) {
                        habilitarDetallesCobrosHoy(resultado);
                    }
                }
            })
            .catch(error => {
                console.error('Error al actualizar contador:', error);
            });
    }
    
    // Función para habilitar detalles al hacer clic en el contador
    function habilitarDetallesCobrosHoy(datos) {
        // Encontrar el elemento contenedor del contador
        const contadorContainer = document.getElementById('totalPorCobrarHoy').closest('.card');
        
        if (contadorContainer) {
            // Añadir clase para indicar que hay datos y cambiar el cursor
            contadorContainer.classList.add('tiene-cobros-pendientes');
            contadorContainer.style.cursor = 'pointer';
            
            // Agregar evento de clic para mostrar detalles
            contadorContainer.onclick = function() {
                mostrarDetallesCobrosHoy(datos);
            };
            
            // Añadir tooltip o indicador visual
            const infoIcon = document.createElement('i');
            infoIcon.className = 'fas fa-info-circle ms-2 text-info';
            infoIcon.title = `${datos.pagos.length} cobro(s) pendiente(s) para hoy`;
            
            const contadorElement = document.getElementById('totalPorCobrarHoy');
            if (contadorElement && !contadorElement.nextElementSibling) {
                contadorElement.parentNode.appendChild(infoIcon);
            }
        }
    }
    
    // Función para mostrar una ventana modal con los detalles de cobros del día
    function mostrarDetallesCobrosHoy(datos) {
        console.log('📋 Mostrando detalles de cobros del día:', datos);
        
        // 1. Verificar si ya existe el modal, si no, crearlo
        let modalCobrosHoy = document.getElementById('modalCobrosPendientesHoy');
        
        if (!modalCobrosHoy) {
            const modalHTML = `
            <div class="modal fade" id="modalCobrosPendientesHoy" tabindex="-1" aria-labelledby="modalCobrosPendientesHoyLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title" id="modalCobrosPendientesHoyLabel">
                                <i class="fas fa-money-bill-wave me-2"></i>
                                Cobros Pendientes para Hoy
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex justify-content-between mb-3">
                                <div>
                                    <h6>Total a cobrar hoy: <span class="badge bg-success fs-6" id="modalTotalCobrar"></span></h6>
                                </div>
                                <div>
                                    <span class="badge bg-info">${new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Préstamo</th>
                                            <th>Cuota</th>
                                            <th>Monto</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaCobrosPendientesHoy">
                                        <!-- Aquí se cargarán los datos -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>`;
            
            // Agregar modal al DOM
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            modalCobrosHoy = document.getElementById('modalCobrosPendientesHoy');
        }
        
        // 2. Actualizar contenido del modal
        const totalElement = document.getElementById('modalTotalCobrar');
        if (totalElement) {
            totalElement.textContent = formatCurrency(datos.total || 0);
        }
        
        const tbody = document.getElementById('tablaCobrosPendientesHoy');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (datos.pagos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-3">
                            No hay cobros pendientes para hoy
                        </td>
                    </tr>`;
            } else {
                datos.pagos.forEach(pago => {
                    // Para cada préstamo con cobros hoy
                    const row = document.createElement('tr');
                    
                    // Si hay múltiples cuotas, mostrar cada una
                    if (pago.cuotas && pago.cuotas.length > 0) {
                        // Primera fila con información del cliente
                        row.innerHTML = `
                            <td rowspan="${pago.cuotas.length}">${pago.clienteNombre}</td>
                            <td rowspan="${pago.cuotas.length}">${pago.prestamoId.substring(0, 8)}...</td>
                            <td>Cuota ${pago.cuotas[0].numeroPago}</td>
                            <td>${formatCurrency(pago.cuotas[0].monto)}</td>
                            <td rowspan="${pago.cuotas.length}">
                                <button class="btn btn-sm btn-success" 
                                        onclick="registrarPago('${pago.prestamoId}', ${pago.cuotas[0].numeroPago})">
                                    <i class="fas fa-money-bill-wave"></i> Pagar
                                </button>
                                <button class="btn btn-sm btn-info" 
                                        onclick="verDetallesPrestamo('${pago.prestamoId}')">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                        
                        // Filas adicionales para el resto de cuotas del mismo préstamo
                        for (let i = 1; i < pago.cuotas.length; i++) {
                            const cuotaRow = document.createElement('tr');
                            cuotaRow.innerHTML = `
                                <td>Cuota ${pago.cuotas[i].numeroPago}</td>
                                <td>${formatCurrency(pago.cuotas[i].monto)}</td>
                            `;
                            tbody.appendChild(cuotaRow);
                        }
                    } else {
                        // Si no hay detalles de cuotas, mostrar monto total
                        row.innerHTML = `
                            <td>${pago.clienteNombre}</td>
                            <td>${pago.prestamoId.substring(0, 8)}...</td>
                            <td>-</td>
                            <td>${formatCurrency(pago.montoPorCobrar)}</td>
                            <td>
                                <button class="btn btn-sm btn-success" 
                                        onclick="registrarPago('${pago.prestamoId}')">
                                    <i class="fas fa-money-bill-wave"></i> Pagar
                                </button>
                                <button class="btn btn-sm btn-info" 
                                        onclick="verDetallesPrestamo('${pago.prestamoId}')">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    }
                });
            }
        }
        
        // 3. Mostrar el modal
        try {
            const modalInstance = new bootstrap.Modal(modalCobrosHoy);
            modalInstance.show();
        } catch (error) {
            console.error('Error al mostrar el modal:', error);
            alert('No se pudo mostrar la ventana de cobros pendientes');
        }
    }
    
    // Función para ver detalles de un préstamo
    function verDetallesPrestamo(prestamoId) {
        // Cerrar el modal actual
        const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalCobrosPendientesHoy'));
        if (modalActual) modalActual.hide();
        
        // Navegar a la sección de préstamos
        if (typeof loadPage === 'function') {
            loadPage('prestamos');
            
            // Configurar callback para mostrar los detalles una vez cargada la página
            setTimeout(() => {
                if (typeof mostrarDetallesPrestamo === 'function') {
                    mostrarDetallesPrestamo(prestamoId);
                } else {
                    console.warn('Función mostrarDetallesPrestamo no disponible');
                    // Intentar método alternativo
                    window.pendingLoanDetails = prestamoId;
                }
            }, 500);
        } else {
            // Navegar directamente si no está disponible loadPage
            window.location.href = `/prestamos?id=${prestamoId}`;
        }
    }
    
    // Función para registrar un pago
    function registrarPago(prestamoId, numeroPago) {
        // Cerrar el modal actual
        const modalActual = bootstrap.Modal.getInstance(document.getElementById('modalCobrosPendientesHoy'));
        if (modalActual) modalActual.hide();
        
        // Navegar a la sección de pagos
        if (typeof loadPage === 'function') {
            loadPage('pagos');
            
            // Configurar datos para iniciar el pago una vez cargada la página
            setTimeout(() => {
                if (typeof iniciarPago === 'function') {
                    iniciarPago(prestamoId, numeroPago);
                } else {
                    console.warn('Función iniciarPago no disponible');
                    // Método alternativo: guardar datos para cuando la página se cargue
                    window.pendingPayment = {
                        prestamoId: prestamoId,
                        numeroPago: numeroPago
                    };
                }
            }, 500);
        } else {
            // Navegar directamente si no está disponible loadPage
            let url = `/pagos?prestamo=${prestamoId}`;
            if (numeroPago) {
                url += `&cuota=${numeroPago}`;
            }
            window.location.href = url;
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
    
    // Exportar funciones al ámbito global para que puedan ser usadas desde el HTML
    window.verDetallesPrestamo = verDetallesPrestamo;
    window.registrarPago = registrarPago;
    window.calcularCobrosDiaActual = calcularCobrosDiaActual;
    
    // Inicializar inmediatamente si estamos en el dashboard
    if (window.currentPage === 'dashboard' || !window.currentPage) {
        // Actualizar al inicio y luego cada minuto para mantener datos frescos
        actualizarCobrosDiaActual();
        setInterval(actualizarCobrosDiaActual, 60000);
    }
    
    // Registrar evento para actualizar al volver al dashboard
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', function(data) {
            if (data.to === 'dashboard') {
                actualizarCobrosDiaActual();
            }
        });
    }
    
    console.log('✅ Módulo de cobros del día inicializado correctamente');
});