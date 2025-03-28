/**
 * simulador-cobros-fix.js - Corrección para que los pagos caigan exactamente hoy
 * 
 * Este script modifica la función de cálculo de fechas en el simulador
 * para garantizar que los pagos caigan exactamente en la fecha actual.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando corrección de fechas para simulador de cobros...');
    
    // Esperar a que el simulador original se cargue
    setTimeout(() => {
        // Verificar si el simulador está cargado
        if (!window.simuladorCobros) {
            console.error('Error: El simulador de cobros no está inicializado');
            return;
        }
        
        console.log('Sobrescribiendo funciones del simulador para corregir fechas...');
        
        // Reemplazar la función problemática en el objeto global
        const originalGenerarPrestamosPagosHoy = window.simuladorCobros.generarPrestamosPagosHoy;
        
        // Nueva implementación de generarPrestamosPagosHoy
        window.simuladorCobros.generar = async function() {
            try {
                mostrarMensaje('Iniciando generación de datos de prueba (versión corregida)...', 'info');
                
                // 1. Generar clientes
                const clientes = await generarClientes(10); // Usar número fijo para simplificar
                mostrarMensaje(`Se han generado ${clientes.length} clientes`, 'info');
                
                // 2. Generar préstamos con pagos EXACTAMENTE para hoy
                const prestamos = await generarPrestamosPagosHoyCorregido(clientes);
                mostrarMensaje(`Se han generado ${prestamos.length} préstamos con pagos programados para HOY`, 'success');
                
                // 3. Actualizar contadores para mostrar los nuevos datos
                actualizarDashboard();
                
                return { clientes, prestamos };
            } catch (error) {
                console.error('Error al generar datos de prueba:', error);
                mostrarMensaje('Error al generar datos: ' + error.message, 'danger');
                return { clientes: [], prestamos: [] };
            }
        };
        
        // Función corregida para generar préstamos con pagos exactamente para hoy
        async function generarPrestamosPagosHoyCorregido(clientes) {
            const prestamosGenerados = [];
            const cantidadTotal = clientes.length;
            let procesados = 0;
            
            for (const cliente of clientes) {
                // Determinar cuántos préstamos tendrá este cliente (1-3)
                const numeroPrestamos = Math.floor(Math.random() * 3) + 1;
                
                for (let j = 0; j < numeroPrestamos; j++) {
                    // Generar datos aleatorios para el préstamo
                    const cantidadPrestamo = 5000 + Math.floor(Math.random() * 45000);
                    const interesMensual = 2 + Math.random() * 8;
                    const plazoMeses = 3 + Math.floor(Math.random() * 21); // Entre 3 y 24 meses
                    
                    // Usar siempre pago mensual para simplicidad
                    const frecuenciaPago = 'Mensual';
                    
                    // CORRECCIÓN: Calcular la fecha de solicitud para que un pago caiga EXACTAMENTE hoy
                    const fechaSolicitud = calcularFechaSolicitudCorregida(plazoMeses);
                    
                    // Imprimir para depuración
                    console.log(`Cliente ${cliente.nombreCompleto}: Préstamo con fecha solicitud ${fechaSolicitud.toISOString()}`);
                    
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
                        
                        // Para el primer préstamo de cada cliente, verificar que la fecha de pago caiga hoy
                        if (j === 0 && prestamoCreado.tablaAmortizacion && prestamoCreado.tablaAmortizacion.length > 0) {
                            // Buscar si alguna cuota cae hoy
                            const hoy = new Date().toISOString().split('T')[0];
                            const cuotasHoy = prestamoCreado.tablaAmortizacion.filter(cuota => {
                                return new Date(cuota.fechaPago).toISOString().split('T')[0] === hoy;
                            });
                            
                            console.log(`Préstamo de ${cliente.nombreCompleto} tiene ${cuotasHoy.length} cuotas para hoy`);
                            
                            if (cuotasHoy.length === 0) {
                                console.warn(`⚠️ Advertencia: No se encontró ninguna cuota para HOY en el préstamo de ${cliente.nombreCompleto}`);
                                
                                // Opcional: Mostrar todas las fechas de la tabla de amortización para depuración
                                const fechasCuotas = prestamoCreado.tablaAmortizacion.map(cuota => 
                                    new Date(cuota.fechaPago).toISOString().split('T')[0]);
                                console.log('Fechas de cuotas:', fechasCuotas);
                            }
                        }
                        
                    } catch (error) {
                        console.error(`Error al crear préstamo para cliente ${cliente.clienteId}:`, error);
                        // Continuar con el siguiente préstamo
                    }
                }
                
                procesados++;
                
                // Actualizar barra de progreso si existe
                const progressBar = document.getElementById('progresoGeneracion');
                const estadoDiv = document.getElementById('estadoGeneracion');
                
                if (progressBar && estadoDiv) {
                    const porcentaje = Math.round((procesados / cantidadTotal) * 100);
                    progressBar.style.width = `${porcentaje}%`;
                    progressBar.setAttribute('aria-valuenow', porcentaje);
                    estadoDiv.textContent = `Generando préstamos: ${procesados} de ${cantidadTotal} (${porcentaje}%)`;
                }
            }
            
            return prestamosGenerados;
        }
        
        // CORRECCIÓN: Nueva función para calcular fecha de solicitud garantizando pago hoy
        function calcularFechaSolicitudCorregida(plazoMeses) {
            // Obtener la fecha actual
            const hoy = new Date();
            
            // MÉTODO 1: Retroceder meses exactos
            // Calcular un número de meses para retroceder (entre 1 y plazoMeses-1)
            const mesesRetroceder = Math.min(Math.floor(Math.random() * (plazoMeses - 1)) + 1, plazoMeses - 1);
            
            // Crear una nueva fecha retrocediendo ese número de meses exactos
            const fechaSolicitud = new Date(hoy);
            fechaSolicitud.setMonth(hoy.getMonth() - mesesRetroceder);
            
            console.log(`Fecha de hoy: ${hoy.toISOString()}`);
            console.log(`Retrocediendo ${mesesRetroceder} meses para fecha solicitud: ${fechaSolicitud.toISOString()}`);
            
            return fechaSolicitud;
        }
        
        // Función para generar clientes (copia simplificada)
        async function generarClientes(cantidad) {
            const clientesGenerados = [];
            
            for (let i = 0; i < cantidad; i++) {
                // Nombre aleatorio
                const nombres = ["Juan", "María", "Carlos", "Ana", "Pedro", "Laura", "Javier", "Sofía", "Miguel"];
                const apellidos = ["Gómez", "Rodríguez", "López", "Pérez", "González", "Martínez", "Sánchez"];
                
                const nombre = nombres[Math.floor(Math.random() * nombres.length)];
                const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
                const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];
                
                const timestamp = Date.now() + i;
                const nombreCompleto = `${nombre} ${apellido1} ${apellido2}`;
                const numeroDocumento = `TEST-${timestamp.toString().slice(-8)}`;
                const telefono = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
                
                // Crear cliente
                const clienteData = {
                    nombreCompleto,
                    tipoDocumento: "INE",
                    numeroDocumento,
                    telefono,
                    correoElectronico: `${nombre.toLowerCase()}.${timestamp}@example.com`,
                    estado: 'Activo'
                };
                
                try {
                    const response = await fetch('/api/clientes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(clienteData)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}`);
                    }
                    
                    const clienteCreado = await response.json();
                    clientesGenerados.push(clienteCreado);
                    
                    // Actualizar barra de progreso si existe
                    const progressBar = document.getElementById('progresoGeneracion');
                    const estadoDiv = document.getElementById('estadoGeneracion');
                    
                    if (progressBar && estadoDiv) {
                        const porcentaje = Math.round(((i + 1) / cantidad) * 50); // Usar solo 50% para clientes
                        progressBar.style.width = `${porcentaje}%`;
                        progressBar.setAttribute('aria-valuenow', porcentaje);
                        estadoDiv.textContent = `Generando clientes: ${i + 1} de ${cantidad} (${porcentaje}%)`;
                    }
                    
                } catch (error) {
                    console.error(`Error al crear cliente ${i+1}:`, error);
                }
            }
            
            return clientesGenerados;
        }
        
        // Función para actualizar el dashboard
        function actualizarDashboard() {
            console.log('🔄 Actualizando dashboard con nuevos datos...');
            
            // Asegurarse de que las funciones necesarias estén disponibles
            if (typeof window.loadCounters === 'function') {
                window.loadCounters();
            }
            
            if (typeof window.calcularCobrosDiaActual === 'function') {
                window.calcularCobrosDiaActual();
            }
            
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
            }
        }
        
        // Función para mostrar mensajes
        function mostrarMensaje(mensaje, tipo = 'info') {
            console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
            
            // Usar función global si está disponible
            if (typeof window.showNotification === 'function') {
                window.showNotification(mensaje, tipo);
            } else {
                alert(mensaje);
            }
        }
        
        // Mostrar mensaje de confirmación
        console.log('✅ Corrección de fechas para simulador de cobros cargada correctamente');
        mostrarMensaje('Corrección para simulador de cobros instalada. Ahora los pagos caerán específicamente HOY.', 'info');
    }, 1500);
});