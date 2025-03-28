/**
 * dashboard-pagos-proximos.js - Funcionalidad para mostrar pagos próximos en el dashboard
 * 
 * Este script se encarga de cargar y mostrar los pagos que vencerán en los próximos días,
 * permitiendo al usuario anticiparse y notificar a sus clientes.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando módulo de pagos próximos en el dashboard...');
    
    // Configuración
    const DIAS_ANTICIPACION = 3; // Mostrar pagos que vencen en los próximos 3 días
    
    // Referencia a la tabla de pagos próximos en el dashboard
    const tablaPagosProximos = document.getElementById('pagosPendientesTable');
    
    // Interceptar fetch para mejorar funcionalidad de pagos próximos
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        // Interceptar solicitudes de pagos próximos
        if (typeof url === 'string' && url.includes('/api/pagos/proximos')) {
            console.log('📊 Interceptando solicitud de pagos próximos');
            return obtenerPagosProximos()
                .then(response => {
                    console.log('✅ Datos de pagos próximos generados con éxito');
                    return response;
                });
        }
        
        // Para cualquier otra URL, usar el fetch original
        return originalFetch(url, options);
    };
    
    // Mejorar la función loadPagosPendientes para incluirla en el ciclo de actualización
    const originalLoadPagosPendientes = window.loadPagosPendientes;
    
    window.loadPagosPendientes = function() {
        // Verificar si estamos en el dashboard (donde está la tabla de pagos próximos)
        const esDashboard = window.currentPage === 'dashboard' || 
                          (!window.currentPage && document.getElementById('dashboard') && 
                           document.getElementById('dashboard').classList.contains('active'));
        
        if (esDashboard) {
            console.log('Cargando pagos próximos para el dashboard...');
            cargarPagosProximosDashboard();
            return;
        }
        
        // Si no estamos en el dashboard, usar la función original
        if (typeof originalLoadPagosPendientes === 'function') {
            originalLoadPagosPendientes();
        }
    };
    
    // Añadir esta funcionalidad a la carga del dashboard
    const originalLoadDashboardData = window.loadDashboardData;
    
    window.loadDashboardData = function() {
        // Llamar a la función original primero
        if (typeof originalLoadDashboardData === 'function') {
            originalLoadDashboardData();
        }
        
        // Cargar específicamente los pagos próximos
        cargarPagosProximosDashboard();
    };
    
    /**
     * Función principal para cargar pagos próximos en el dashboard
     */
    function cargarPagosProximosDashboard() {
        // Verificar si la tabla existe en la página actual
        if (!tablaPagosProximos) {
            console.warn('Tabla de pagos próximos no encontrada en el DOM');
            return;
        }
        
        const tbody = tablaPagosProximos.querySelector('tbody');
        if (!tbody) {
            console.warn('Cuerpo de tabla (tbody) de pagos próximos no encontrado');
            return;
        }
        
        // Mostrar estado de carga
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="d-flex justify-content-center align-items-center py-3">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span>Buscando pagos próximos...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Obtener los datos de pagos próximos
        obtenerPagosProximos()
            .then(response => response.json())
            .then(pagosProximos => {
                console.log(`Se encontraron ${pagosProximos.length} pagos próximos`);
                actualizarTablaPagosProximos(tbody, pagosProximos);
            })
            .catch(error => {
                console.error('Error al cargar pagos próximos:', error);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Error al cargar pagos próximos
                        </td>
                    </tr>
                `;
            });
    }
    
    /**
     * Obtiene los pagos próximos a vencer
     */
    async function obtenerPagosProximos() {
        try {
            // 1. Obtener todos los préstamos activos
            const prestamosResponse = await originalFetch('/api/prestamos?estado=Activo');
            if (!prestamosResponse.ok) {
                throw new Error(`Error al obtener préstamos: ${prestamosResponse.status}`);
            }
            
            const prestamos = await prestamosResponse.json();
            console.log(`Analizando ${prestamos.length} préstamos activos para encontrar pagos próximos`);
            
            // 2. Obtener clientes para enriquecer los datos
            const clientesResponse = await originalFetch('/api/clientes');
            if (!clientesResponse.ok) {
                throw new Error(`Error al obtener clientes: ${clientesResponse.status}`);
            }
            
            const clientes = await clientesResponse.json();
            
            // Crear un mapa para acceso rápido
            const clientesMap = {};
            clientes.forEach(cliente => {
                clientesMap[cliente.clienteId] = cliente;
            });
            
            // 3. Calcular fechas para el filtro de próximos días
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
            
            const limiteFuturo = new Date(hoy);
            limiteFuturo.setDate(limiteFuturo.getDate() + DIAS_ANTICIPACION);
            limiteFuturo.setHours(23, 59, 59, 999); // Final del día límite
            
            console.log(`Buscando pagos entre ${hoy.toDateString()} y ${limiteFuturo.toDateString()}`);
            
            // 4. Filtrar préstamos con pagos próximos
            const pagosProximos = [];
            
            prestamos.forEach(prestamo => {
                // Verificar si tiene tabla de amortización
                if (prestamo.tablaAmortizacion && Array.isArray(prestamo.tablaAmortizacion)) {
                    // Buscar cuotas pendientes que vencen en los próximos días
                    const cuotasProximas = prestamo.tablaAmortizacion.filter(cuota => {
                        // Verificar si la cuota no está pagada
                        if (cuota.pagado) return false;
                        
                        // Obtener fecha de pago
                        const fechaCuota = new Date(cuota.fechaPago);
                        
                        // Verificar si la fecha es válida
                        if (isNaN(fechaCuota.getTime())) return false;
                        
                        // Normalizar a inicio del día para comparación
                        fechaCuota.setHours(0, 0, 0, 0);
                        
                        // Filtrar solo las que vencen en el rango deseado
                        return fechaCuota >= hoy && fechaCuota <= limiteFuturo;
                    });
                    
                    // Si hay cuotas próximas, agregar al resultado
                    if (cuotasProximas.length > 0) {
                        // Obtener información del cliente
                        const cliente = clientesMap[prestamo.clienteId] || { nombreCompleto: 'Cliente desconocido' };
                        
                        // Agregar cada cuota como un pago próximo independiente
                        cuotasProximas.forEach(cuota => {
                            pagosProximos.push({
                                prestamoId: prestamo.prestamoId,
                                clienteId: prestamo.clienteId,
                                clienteNombre: cliente.nombreCompleto,
                                clienteTelefono: cliente.telefono || 'N/A',
                                numeroPago: cuota.numeroPago,
                                fechaPago: new Date(cuota.fechaPago),
                                monto: cuota.cuotaMensual,
                                diasRestantes: calcularDiasRestantes(new Date(cuota.fechaPago))
                            });
                        });
                    }
                }
            });
            
            // 5. Ordenar por fecha de vencimiento (más próximos primero)
            pagosProximos.sort((a, b) => a.fechaPago - b.fechaPago);
            
            // 6. Crear respuesta simulada para mantener compatibilidad con la API
            return {
                ok: true,
                json: () => Promise.resolve(pagosProximos)
            };
            
        } catch (error) {
            console.error('Error al obtener pagos próximos:', error);
            
            // En caso de error, devolver lista vacía
            return {
                ok: true,
                json: () => Promise.resolve([])
            };
        }
    }
    
    /**
     * Actualiza la tabla de pagos próximos con los datos obtenidos
     */
    function actualizarTablaPagosProximos(tbody, pagosProximos) {
        // Limpiar tabla
        tbody.innerHTML = '';
        
        // Si no hay pagos próximos, mostrar mensaje
        if (!pagosProximos || pagosProximos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        No hay pagos próximos a vencer en los siguientes ${DIAS_ANTICIPACION} días
                    </td>
                </tr>
            `;
            return;
        }
        
        // Mostrar cada pago próximo
        pagosProximos.forEach(pago => {
            const tr = document.createElement('tr');
            
            // Aplicar clase de alerta según días restantes
            if (pago.diasRestantes === 0) {
                tr.classList.add('table-danger'); // Vence hoy
            } else if (pago.diasRestantes === 1) {
                tr.classList.add('table-warning'); // Vence mañana
            }
            
            // Formato de días restantes
            let etiquetaDias = '';
            if (pago.diasRestantes === 0) {
                etiquetaDias = '<span class="badge bg-danger">Hoy</span>';
            } else if (pago.diasRestantes === 1) {
                etiquetaDias = '<span class="badge bg-warning text-dark">Mañana</span>';
            } else {
                etiquetaDias = `<span class="badge bg-info">En ${pago.diasRestantes} días</span>`;
            }
            
            tr.innerHTML = `
                <td>${pago.clienteNombre} 
                    <br><small class="text-muted">${pago.clienteTelefono}</small></td>
                <td>${formatDate(pago.fechaPago)} ${etiquetaDias}</td>
                <td>${formatCurrency(pago.monto)}</td>
                <td>
                    <button class="btn btn-sm btn-success" 
                            onclick="registrarPago('${pago.prestamoId}', ${pago.numeroPago})">
                        <i class="fas fa-money-bill-wave"></i> Pagar
                    </button>
                    <button class="btn btn-sm btn-info" 
                            onclick="notificarCliente('${pago.clienteId}', '${pago.prestamoId}', ${pago.numeroPago})">
                        <i class="fas fa-bell"></i> Notificar
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    /**
     * Calcula los días restantes hasta una fecha
     */
    function calcularDiasRestantes(fecha) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        
        const fechaObjetivo = new Date(fecha);
        fechaObjetivo.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        
        // Calcular diferencia en días
        const diferenciaMilisegundos = fechaObjetivo - hoy;
        const diasRestantes = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diasRestantes); // No permitir valores negativos
    }
    
    /**
     * Función para notificar a un cliente sobre un pago próximo
     */
    window.notificarCliente = function(clienteId, prestamoId, numeroPago) {
        console.log(`Notificando al cliente ${clienteId} sobre el pago #${numeroPago} del préstamo ${prestamoId}`);
        
        // Mostrar modal de notificación
        mostrarModalNotificacion(clienteId, prestamoId, numeroPago);
    };
    
    /**
     * Muestra un modal para gestionar la notificación al cliente
     */
    function mostrarModalNotificacion(clienteId, prestamoId, numeroPago) {
        // 1. Buscar información del cliente y préstamo
        Promise.all([
            originalFetch(`/api/clientes/${clienteId}`).then(res => res.json()),
            originalFetch(`/api/prestamos/${prestamoId}`).then(res => res.json())
        ])
        .then(([cliente, prestamo]) => {
            // 2. Crear modal si no existe
            let modalNotificacion = document.getElementById('modalNotificarPago');
            
            if (!modalNotificacion) {
                const modalHTML = `
                <div class="modal fade" id="modalNotificarPago" tabindex="-1" aria-labelledby="modalNotificarPagoLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="modalNotificarPagoLabel">
                                    <i class="fas fa-bell me-2"></i>
                                    Notificar Pago Próximo
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="notificacion-cliente-info" class="mb-3">
                                    <!-- Información del cliente -->
                                </div>
                                <div id="notificacion-pago-info" class="mb-3">
                                    <!-- Información del pago -->
                                </div>
                                <div class="mb-3">
                                    <label for="notificacion-metodo" class="form-label">Método de notificación</label>
                                    <select class="form-select" id="notificacion-metodo">
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="sms">SMS</option>
                                        <option value="llamada">Llamada telefónica</option>
                                        <option value="email">Correo electrónico</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="notificacion-mensaje" class="form-label">Mensaje personalizado</label>
                                    <textarea class="form-control" id="notificacion-mensaje" rows="3" placeholder="Mensaje adicional (opcional)"></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="btn-enviar-notificacion">Enviar Notificación</button>
                            </div>
                        </div>
                    </div>
                </div>`;
                
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                modalNotificacion = document.getElementById('modalNotificarPago');
            }
            
            // 3. Encontrar la cuota específica
            const cuota = prestamo.tablaAmortizacion.find(c => c.numeroPago === numeroPago);
            if (!cuota) {
                throw new Error(`No se encontró la cuota #${numeroPago} en el préstamo`);
            }
            
            // 4. Actualizar información en el modal
            const clienteInfo = document.getElementById('notificacion-cliente-info');
            clienteInfo.innerHTML = `
                <h6>Información del Cliente</h6>
                <p><strong>Nombre:</strong> ${cliente.nombreCompleto}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono || 'No disponible'}</p>
                <p><strong>Correo:</strong> ${cliente.correoElectronico || 'No disponible'}</p>
            `;
            
            const pagoInfo = document.getElementById('notificacion-pago-info');
            const diasRestantes = calcularDiasRestantes(new Date(cuota.fechaPago));
            
            pagoInfo.innerHTML = `
                <h6>Información del Pago</h6>
                <p><strong>Préstamo:</strong> #${prestamo.prestamoId.substring(0, 8)}</p>
                <p><strong>Cuota #${cuota.numeroPago}</strong> - <strong>Vencimiento:</strong> ${formatDate(cuota.fechaPago)}</p>
                <p><strong>Monto:</strong> ${formatCurrency(cuota.cuotaMensual)}</p>
                <p class="mb-0">
                    <strong>Estado:</strong> 
                    ${diasRestantes === 0 ? 
                      '<span class="badge bg-danger">Vence hoy</span>' : 
                      diasRestantes === 1 ? 
                      '<span class="badge bg-warning text-dark">Vence mañana</span>' :
                      `<span class="badge bg-info">Vence en ${diasRestantes} días</span>`
                    }
                </p>
            `;
            
            // 5. Preparar mensaje predeterminado según el método seleccionado
            const metodoSelect = document.getElementById('notificacion-metodo');
            metodoSelect.addEventListener('change', function() {
                actualizarMensajeNotificacion(this.value, cliente, cuota);
            });
            
            // 6. Configurar mensaje inicial
            actualizarMensajeNotificacion(metodoSelect.value, cliente, cuota);
            
            // 7. Configurar botón de envío
            const btnEnviar = document.getElementById('btn-enviar-notificacion');
            btnEnviar.onclick = function() {
                const metodo = document.getElementById('notificacion-metodo').value;
                const mensaje = document.getElementById('notificacion-mensaje').value;
                
                enviarNotificacion(metodo, cliente, cuota, mensaje)
                    .then(() => {
                        // Cerrar modal
                        const modal = bootstrap.Modal.getInstance(modalNotificacion);
                        if (modal) modal.hide();
                        
                        // Mostrar confirmación
                        showNotification(`Notificación enviada a ${cliente.nombreCompleto}`, 'success');
                    })
                    .catch(error => {
                        console.error('Error al enviar notificación:', error);
                        showNotification('Error al enviar la notificación: ' + error.message, 'error');
                    });
            };
            
            // 8. Mostrar modal
            const modal = new bootstrap.Modal(modalNotificacion);
            modal.show();
        })
        .catch(error => {
            console.error('Error al preparar notificación:', error);
            showNotification('Error al preparar la notificación: ' + error.message, 'error');
        });
    }
    
    /**
     * Actualiza el mensaje predeterminado según el método de notificación
     */
    function actualizarMensajeNotificacion(metodo, cliente, cuota) {
        const mensajeTextarea = document.getElementById('notificacion-mensaje');
        if (!mensajeTextarea) return;
        
        const fechaFormateada = formatDate(cuota.fechaPago);
        const montoFormateado = formatCurrency(cuota.cuotaMensual);
        
        let mensajePredeterminado = '';
        
        switch (metodo) {
            case 'whatsapp':
            case 'sms':
                mensajePredeterminado = `Hola ${cliente.nombreCompleto.split(' ')[0]}, le recordamos que tiene un pago de ${montoFormateado} programado para el ${fechaFormateada}. Gracias por su puntualidad. ALFIN CASH.`;
                break;
            case 'email':
                mensajePredeterminado = `Estimado/a ${cliente.nombreCompleto},\n\nLe recordamos que tiene un pago programado para el ${fechaFormateada} por un monto de ${montoFormateado}.\n\nGracias por su puntualidad.\n\nAtentamente,\nEquipo ALFIN CASH`;
                break;
            case 'llamada':
                mensajePredeterminado = `Recordatorio de pago para ${cliente.nombreCompleto}:\n- Fecha: ${fechaFormateada}\n- Monto: ${montoFormateado}\n- Cuota #${cuota.numeroPago}`;
                break;
        }
        
        mensajeTextarea.value = mensajePredeterminado;
    }
    
    /**
     * Simula el envío de una notificación al cliente
     * En un entorno real, esto conectaría con servicios externos
     */
    async function enviarNotificacion(metodo, cliente, cuota, mensaje) {
        // Simular tiempo de espera
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Registrar actividad (en un sistema real, esto se enviaría al servidor)
        console.log('Notificación enviada:', {
            metodo,
            clienteId: cliente.clienteId,
            clienteNombre: cliente.nombreCompleto,
            contacto: metodo === 'email' ? cliente.correoElectronico : cliente.telefono,
            cuotaNumero: cuota.numeroPago,
            fechaVencimiento: cuota.fechaPago,
            monto: cuota.cuotaMensual,
            mensaje,
            fechaNotificacion: new Date()
        });
        
        // En una implementación real, aquí se conectaría con servicios externos
        // como Twilio para SMS/WhatsApp, SendGrid para email, etc.
        
        return { success: true };
    }
    
    // Utilidades
    
    /**
     * Formatea una fecha en formato localizado
     */
    function formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        try {
            return d.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return d.toLocaleDateString();
        }
    }
    
    /**
     * Formatea un valor como moneda
     */
    function formatCurrency(amount) {
        if (isNaN(amount)) return '$0.00';
        
        try {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(amount);
        } catch (e) {
            return '$' + parseFloat(amount).toFixed(2);
        }
    }
    
    /**
     * Muestra una notificación al usuario (compatible con sistema existente)
     */
    function showNotification(message, type = 'info') {
        // Verificar si existe la función global
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Implementación básica si no existe la función global
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }
    
    // Cargar pagos próximos al inicializar el módulo si estamos en el dashboard
    if (window.currentPage === 'dashboard' || 
        (!window.currentPage && document.getElementById('dashboard') && 
         document.getElementById('dashboard').classList.contains('active'))) {
        
        // Esperar a que el DOM esté completamente cargado
        setTimeout(cargarPagosProximosDashboard, 500);
    }
    
    // Registrar evento para actualizar al volver al dashboard
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', function(data) {
            if (data.to === 'dashboard') {
                cargarPagosProximosDashboard();
            }
        });
    }
    
    console.log('✅ Módulo de pagos próximos inicializado correctamente');
});