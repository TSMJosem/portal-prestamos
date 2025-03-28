/**
 * dashboard-data-provider.js - Proveedor de datos reales para gráficas del dashboard
 * 
 * Este script garantiza que las gráficas del dashboard muestren exclusivamente 
 * datos reales de los préstamos y pagos registrados en la aplicación.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando proveedor de datos reales para gráficas del dashboard...');
    
    // Cache de datos para evitar múltiples peticiones
    const dataCache = {
        prestamos: null,
        pagos: null,
        timestamp: 0
    };
    
    // Interceptar fetch para asegurar datos consistentes
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        // Solo interceptar las URLs específicas para las gráficas
        if (typeof url === 'string') {
            // Para estadísticas de préstamos por mes
            if (url.includes('/api/prestamos/estadisticas/por-mes')) {
                console.log('📊 Interceptando solicitud de estadísticas de préstamos');
                return obtenerEstadisticasPrestamos(url, options);
            }
            
            // Para estadísticas de pagos por mes
            if (url.includes('/api/pagos/estadisticas/por-mes')) {
                console.log('📊 Interceptando solicitud de estadísticas de pagos');
                return obtenerEstadisticasPagos(url, options);
            }
        }
        
        // Para cualquier otra URL, usar el fetch original
        return originalFetch(url, options);
    };
    
    // Función para obtener todos los préstamos una sola vez
    async function obtenerTodosLosPrestamos() {
        // Verificar si tenemos datos en caché y son recientes (menos de 1 minuto)
        const ahora = Date.now();
        if (dataCache.prestamos && (ahora - dataCache.timestamp < 60000)) {
            console.log('Usando préstamos en caché');
            return dataCache.prestamos;
        }
        
        console.log('Obteniendo todos los préstamos de la API...');
        try {
            const response = await originalFetch('/api/prestamos');
            if (!response.ok) {
                throw new Error(`Error al obtener préstamos: ${response.status}`);
            }
            
            const prestamos = await response.json();
            
            // Guardar en caché
            dataCache.prestamos = prestamos;
            dataCache.timestamp = ahora;
            
            return prestamos;
        } catch (error) {
            console.error('Error al obtener préstamos:', error);
            
            // Si hay un error, intentar usar los datos en caché aunque sean antiguos
            if (dataCache.prestamos) {
                console.warn('Usando datos en caché antiguos debido a error en la API');
                return dataCache.prestamos;
            }
            
            // Si no hay datos en caché, devolver un array vacío
            return [];
        }
    }
    
    // Función para obtener todos los pagos una sola vez
    async function obtenerTodosLosPagos() {
        // Verificar si tenemos datos en caché y son recientes (menos de 1 minuto)
        const ahora = Date.now();
        if (dataCache.pagos && (ahora - dataCache.timestamp < 60000)) {
            console.log('Usando pagos en caché');
            return dataCache.pagos;
        }
        
        console.log('Obteniendo todos los pagos de la API...');
        try {
            const response = await originalFetch('/api/pagos');
            if (!response.ok) {
                throw new Error(`Error al obtener pagos: ${response.status}`);
            }
            
            const pagos = await response.json();
            
            // Guardar en caché
            dataCache.pagos = pagos;
            dataCache.timestamp = ahora;
            
            return pagos;
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            
            // Si hay un error, intentar usar los datos en caché aunque sean antiguos
            if (dataCache.pagos) {
                console.warn('Usando datos en caché antiguos debido a error en la API');
                return dataCache.pagos;
            }
            
            // Si no hay datos en caché, devolver un array vacío
            return [];
        }
    }
    
    /**
     * Procesa solicitudes de estadísticas de préstamos por mes a partir de datos reales
     */
    async function obtenerEstadisticasPrestamos(url, options) {
        try {
            // Extraer fechas de la URL
            const params = new URLSearchParams(url.split('?')[1]);
            const desde = params.get('desde') ? new Date(params.get('desde')) : new Date(new Date().setMonth(new Date().getMonth() - 5));
            const hasta = params.get('hasta') ? new Date(params.get('hasta')) : new Date();
            
            // Obtener todos los préstamos
            const prestamos = await obtenerTodosLosPrestamos();
            
            // Generar estadísticas reales
            const stats = generarEstadisticasPrestamos(prestamos, desde, hasta);
            
            // Crear respuesta simulada
            return {
                ok: true,
                json: () => Promise.resolve(stats)
            };
        } catch (error) {
            console.error('Error al procesar estadísticas de préstamos:', error);
            
            // En caso de error, devolver objeto vacío
            return {
                ok: true,
                json: () => Promise.resolve({ labels: [], valores: [] })
            };
        }
    }
    
    /**
     * Procesa solicitudes de estadísticas de pagos por mes a partir de datos reales
     */
    async function obtenerEstadisticasPagos(url, options) {
        try {
            // Extraer fechas de la URL
            const params = new URLSearchParams(url.split('?')[1]);
            const desde = params.get('desde') ? new Date(params.get('desde')) : new Date(new Date().setMonth(new Date().getMonth() - 5));
            const hasta = params.get('hasta') ? new Date(params.get('hasta')) : new Date();
            
            // Obtener todos los pagos
            const pagos = await obtenerTodosLosPagos();
            
            // Generar estadísticas reales
            const stats = generarEstadisticasPagos(pagos, desde, hasta);
            
            // Crear respuesta simulada
            return {
                ok: true,
                json: () => Promise.resolve(stats)
            };
        } catch (error) {
            console.error('Error al procesar estadísticas de pagos:', error);
            
            // En caso de error, devolver objeto vacío
            return {
                ok: true,
                json: () => Promise.resolve({ labels: [], valores: [] })
            };
        }
    }
    
    /**
     * Genera estadísticas reales de préstamos a partir de datos existentes
     */
    function generarEstadisticasPrestamos(prestamos, desde, hasta) {
        console.log(`Generando estadísticas de préstamos desde ${desde.toDateString()} hasta ${hasta.toDateString()}`);
        console.log(`Total de préstamos disponibles: ${prestamos.length}`);
        
        // Crear arrays para etiquetas y valores
        const labels = [];
        const valores = [];
        
        // Generar array de meses en el rango
        const currentDate = new Date(desde);
        currentDate.setDate(1); // Asegurar que empezamos en el primer día del mes
        
        const endDate = new Date(hasta);
        
        // Para cada mes en el rango, generar etiqueta y contar préstamos
        while (currentDate <= endDate) {
            // Formato del mes (ej: "Ene 2025")
            const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][currentDate.getMonth()];
            const yearStr = currentDate.getFullYear();
            const monthLabel = `${monthName} ${yearStr}`;
            
            // Agregar etiqueta al array
            labels.push(monthLabel);
            
            // Contar préstamos en este mes
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            
            // Filtrar préstamos creados en este mes
            const prestamosMes = prestamos.filter(prestamo => {
                if (!prestamo.fechaSolicitud) return false;
                
                const fechaCreacion = new Date(prestamo.fechaSolicitud);
                return fechaCreacion >= startOfMonth && fechaCreacion <= endOfMonth;
            });
            
            console.log(`${monthLabel}: ${prestamosMes.length} préstamos`);
            
            // Agregar conteo al array
            valores.push(prestamosMes.length);
            
            // Avanzar al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return { labels, valores };
    }
    
    /**
     * Genera estadísticas reales de pagos a partir de datos existentes
     */
    function generarEstadisticasPagos(pagos, desde, hasta) {
        console.log(`Generando estadísticas de pagos desde ${desde.toDateString()} hasta ${hasta.toDateString()}`);
        console.log(`Total de pagos disponibles: ${pagos.length}`);
        
        // Crear arrays para etiquetas y valores
        const labels = [];
        const valores = [];
        
        // Generar array de meses en el rango
        const currentDate = new Date(desde);
        currentDate.setDate(1); // Asegurar que empezamos en el primer día del mes
        
        const endDate = new Date(hasta);
        
        // Para cada mes en el rango, generar etiqueta y sumar pagos
        while (currentDate <= endDate) {
            // Formato del mes (ej: "Ene 2025")
            const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][currentDate.getMonth()];
            const yearStr = currentDate.getFullYear();
            const monthLabel = `${monthName} ${yearStr}`;
            
            // Agregar etiqueta al array
            labels.push(monthLabel);
            
            // Sumar pagos en este mes
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            
            // Filtrar pagos en este mes
            const pagosMes = pagos.filter(pago => {
                if (!pago.fechaPago) return false;
                
                const fechaPago = new Date(pago.fechaPago);
                return fechaPago >= startOfMonth && fechaPago <= endOfMonth;
            });
            
            // Sumar los montos de los pagos
            const totalMes = pagosMes.reduce((total, pago) => {
                const monto = parseFloat(pago.cantidadPagada || 0);
                return total + (isNaN(monto) ? 0 : monto);
            }, 0);
            
            console.log(`${monthLabel}: ${pagosMes.length} pagos, total ${totalMes}`);
            
            // Agregar monto total al array
            valores.push(totalMes);
            
            // Avanzar al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return { labels, valores };
    }
    
    console.log('✅ Proveedor de datos reales para dashboard inicializado');
});