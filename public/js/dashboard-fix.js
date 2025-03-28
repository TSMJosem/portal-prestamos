/**
 * dashboard-fix.js - Solución para el problema de contadores en el dashboard
 * 
 * Este script corrige el problema de que los contadores del dashboard no se
 * actualizan correctamente al iniciar la aplicación, especialmente el contador
 * de clientes activos.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando corrección para contadores del dashboard...');
    
    // 1. Mejorar la función loadCounters original
    const originalLoadCounters = window.loadCounters;
    
    window.loadCounters = function() {
        console.log('📊 Cargando contadores del dashboard (mejorado)...');
        
        // Clientes activos - con reintento automático
        cargarClientesActivosConReintento()
            .then(cantidad => {
                const contador = document.getElementById('totalClientesActivos');
                if (contador) {
                    contador.textContent = cantidad;
                    console.log(`✅ Contador de clientes activos actualizado: ${cantidad}`);
                }
            })
            .catch(error => {
                console.error('❌ Error al cargar clientes activos:', error);
            });
        
        // Ejecutar la función original para los otros contadores
        if (typeof originalLoadCounters === 'function') {
            originalLoadCounters();
        } else {
            // Si por alguna razón no existe la función original, cargar otros contadores
            cargarOtrosContadores();
        }
    };
    
    // 2. Función mejorada para cargar clientes activos con reintento
    function cargarClientesActivosConReintento(intentos = 3) {
        return new Promise((resolve, reject) => {
            // Intentar usar la caché de clientes primero
            if (window.clientesCache && window.clientesCache.datos && window.clientesCache.datos.length > 0) {
                console.log('Usando datos en caché para contador de clientes activos');
                const clientesActivos = window.clientesCache.datos.filter(c => c.estado === 'Activo').length;
                return resolve(clientesActivos);
            }
            
            // Si no hay caché o está vacía, hacer la petición
            console.log('Obteniendo clientes activos desde API...');
            
            fetch('/api/clientes?estado=Activo')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Guardar en caché para uso futuro
                    if (!window.clientesCache) {
                        window.clientesCache = { datos: [], timestamp: 0 };
                    }
                    
                    // Procesar la respuesta para extraer los clientes
                    let clientesArray = [];
                    if (Array.isArray(data)) {
                        clientesArray = data;
                    } else if (data && typeof data === 'object') {
                        // Buscar en diferentes propiedades si es un objeto
                        if (Array.isArray(data.clientes)) {
                            clientesArray = data.clientes;
                        } else {
                            // Buscar cualquier propiedad que sea un array
                            for (const key in data) {
                                if (Array.isArray(data[key])) {
                                    clientesArray = data[key];
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Actualizar la caché si encontramos datos
                    if (clientesArray.length > 0) {
                        window.clientesCache.datos = clientesArray;
                        window.clientesCache.timestamp = Date.now();
                    }
                    
                    // Contar clientes activos
                    const clientesActivos = clientesArray.filter(c => c.estado === 'Activo').length;
                    
                    // Guardar también en variable global para compatibilidad
                    window.clientes = clientesArray;
                    
                    console.log(`Encontrados ${clientesActivos} clientes activos`);
                    resolve(clientesActivos);
                })
                .catch(error => {
                    console.error('Error en petición de clientes activos:', error);
                    
                    // Reintentar si quedan intentos
                    if (intentos > 1) {
                        console.log(`Reintentando carga de clientes (${intentos-1} intentos restantes)...`);
                        setTimeout(() => {
                            cargarClientesActivosConReintento(intentos - 1)
                                .then(resolve)
                                .catch(reject);
                        }, 1000); // Esperar 1 segundo antes de reintentar
                    } else {
                        reject(error);
                    }
                });
        });
    }
    
    // 3. Función de respaldo para cargar otros contadores si falla la original
    function cargarOtrosContadores() {
        // Préstamos activos
        fetch('/api/prestamos?estado=Activo')
            .then(response => response.json())
            .then(data => {
                const contador = document.getElementById('totalPrestamosActivos');
                if (contador) contador.textContent = data.length;
            })
            .catch(error => {
                console.error('Error al cargar préstamos activos:', error);
            });
        
        // Pagos del mes
        const fechaActual = new Date();
        const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        
        fetch(`/api/pagos?desde=${primerDiaMes.toISOString()}&hasta=${ultimoDiaMes.toISOString()}`)
            .then(response => response.json())
            .then(data => {
                const contador = document.getElementById('totalPagosMes');
                if (contador) contador.textContent = data.length;
            })
            .catch(error => {
                console.error('Error al cargar pagos del mes:', error);
            });
        
        // Por cobrar hoy
        fetch('/api/prestamos/por-cobrar-hoy')
            .then(response => response.json())
            .then(data => {
                const contador = document.getElementById('totalPorCobrarHoy');
                if (contador) contador.textContent = formatCurrency(data.total || 0);
            })
            .catch(error => {
                console.error('Error al cargar monto por cobrar hoy:', error);
            });
    }
    
    // 4. Función de utilidad para formatear moneda
    function formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(amount);
        } catch (error) {
            return `$${amount.toFixed(2)}`;
        }
    }
    
    // 5. Cargar contadores inmediatamente si estamos en el dashboard
    // y programar una segunda carga diferida para asegurar los datos
    if (window.currentPage === 'dashboard' || !window.currentPage) {
        console.log('📊 Inicializando dashboard con carga mejorada...');
        
        // Primera carga inmediata
        window.loadCounters();
        
        // Segunda carga diferida (500ms después)
        setTimeout(() => {
            console.log('🔄 Realizando carga secundaria de contadores...');
            window.loadCounters();
        }, 500);
        
        // Tercera carga aún más diferida (2s después)
        setTimeout(() => {
            console.log('🔄 Realizando carga final de contadores...');
            window.loadCounters();
            
            // Verificar si hay datos en caché, sino intentar cargarlos
            if ((!window.clientesCache || !window.clientesCache.datos || window.clientesCache.datos.length === 0) && 
                typeof garantizarCargaClientes === 'function') {
                console.log('⚠️ No hay datos en caché, intentando cargar clientes...');
                garantizarCargaClientes();
                
                // Actualizar contadores una vez cargados los clientes
                setTimeout(window.loadCounters, 1000);
            }
        }, 2000);
    }
    
    // 6. Conectar con el sistema de eventos para actualizar al cambiar de página
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        // Actualizar contadores al volver al dashboard
        window.appEvents.on('pageChanged', function(data) {
            if (data.to === 'dashboard') {
                console.log('📊 Actualizando contadores al volver al dashboard');
                window.loadCounters();
            }
        });
        
        // Actualizar contadores cuando cambien los datos de clientes
        window.appEvents.on('clientesActualizados', function() {
            if (window.currentPage === 'dashboard') {
                console.log('📊 Actualizando contadores por cambio en datos de clientes');
                window.loadCounters();
            }
        });
    }
    
    console.log('✅ Corrección para contadores del dashboard inicializada');
});