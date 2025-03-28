/**
 * dashboard-charts.js - Módulo de gráficas interactivas para el dashboard
 * 
 * Este script implementa gráficas dinámicas para:
 * 1. Préstamos por mes
 * 2. Pagos por mes
 * 
 * Con funcionalidad para navegar entre períodos de tiempo.
 */

// Estado global para las gráficas
const chartState = {
    prestamosPorMes: {
        periodo: {
            inicio: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), // 6 meses atrás
            fin: new Date()
        },
        chart: null
    },
    pagosPorMes: {
        periodo: {
            inicio: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), // 6 meses atrás
            fin: new Date()
        },
        chart: null
    }
};

// Inicialización principal de las gráficas del dashboard
function initDashboardCharts() {
    console.log('📊 Inicializando gráficas interactivas del dashboard...');
    
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está disponible. Las gráficas no se inicializarán.');
        showNotification('No se pudieron cargar las gráficas debido a un error técnico.', 'error');
        return;
    }
    
    // Configurar Chart.js para mejor visualización
    configureChartDefaults();
    
    // Inicializar gráficas
    initPrestamosChart();
    initPagosChart();
    
    // Agregar controles de navegación
    addChartNavigationControls();
    
    console.log('✅ Gráficas del dashboard inicializadas correctamente');
}

// Configurar valores predeterminados para las gráficas
function configureChartDefaults() {
    Chart.defaults.font.family = "'Arial', sans-serif";
    Chart.defaults.color = '#666';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Animaciones más suaves
    Chart.defaults.animation.duration = 800;
    Chart.defaults.animation.easing = 'easeOutQuart';
    
    // Plugin para mejorar tooltips
    Chart.register({
        id: 'customTooltipStyles',
        beforeTooltipDraw(chart) {
            const tooltipEl = chart.tooltip;
            if (tooltipEl && tooltipEl.opacity > 0) {
                tooltipEl.options.padding = 10;
                tooltipEl.options.titleFont.size = 14;
                tooltipEl.options.bodyFont.size = 13;
            }
        }
    });
}

// Inicializar gráfica de préstamos por mes
function initPrestamosChart() {
    const ctxPrestamos = document.getElementById('prestamosPorMesChart');
    if (!ctxPrestamos) {
        console.error('No se encontró el canvas para la gráfica de préstamos');
        return;
    }
    
    // Limpiar instancia existente si la hay
    if (chartState.prestamosPorMes.chart) {
        chartState.prestamosPorMes.chart.destroy();
    }
    
    // Mostrar cargando inicialmente
    showChartLoading(ctxPrestamos, 'Cargando datos de préstamos...');
    
    // Cargar datos
    fetchPrestamosData(chartState.prestamosPorMes.periodo.inicio, chartState.prestamosPorMes.periodo.fin)
        .then(data => {
            // Crear la gráfica con los datos obtenidos
            chartState.prestamosPorMes.chart = new Chart(ctxPrestamos, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Préstamos',
                        data: data.cantidades,
                        backgroundColor: 'rgba(78, 115, 223, 0.7)',
                        borderColor: 'rgba(78, 115, 223, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.7,
                        hoverBackgroundColor: 'rgba(78, 115, 223, 0.9)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Préstamos por Mes',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Préstamos: ${context.parsed.y}`;
                                },
                                title: function(tooltipItems) {
                                    return tooltipItems[0].label;
                                }
                            }
                        },
                        // Mostrar mensaje si no hay datos
                        custom: function(chart) {
                            if (chart.data.datasets[0].data.length === 0 || 
                                chart.data.datasets[0].data.every(val => val === 0)) {
                                addNoDataMessage(chart, 'No hay préstamos en este período');
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0,
                                callback: function(value) {
                                    if (value % 1 === 0) {
                                        return value;
                                    }
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
            
            // Actualizar título del período
            updateChartPeriodTitle('prestamosPorMes');
        })
        .catch(error => {
            console.error('Error al cargar datos de préstamos:', error);
            showErrorInChart(ctxPrestamos, 'No se pudieron cargar los datos de préstamos');
        });
}

// Inicializar gráfica de pagos por mes
function initPagosChart() {
    const ctxPagos = document.getElementById('pagosPorMesChart');
    if (!ctxPagos) {
        console.error('No se encontró el canvas para la gráfica de pagos');
        return;
    }
    
    // Limpiar instancia existente si la hay
    if (chartState.pagosPorMes.chart) {
        chartState.pagosPorMes.chart.destroy();
    }
    
    // Mostrar cargando inicialmente
    showChartLoading(ctxPagos, 'Cargando datos de pagos...');
    
    // Cargar datos
    fetchPagosData(chartState.pagosPorMes.periodo.inicio, chartState.pagosPorMes.periodo.fin)
        .then(data => {
            // Crear la gráfica con los datos obtenidos
            chartState.pagosPorMes.chart = new Chart(ctxPagos, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Pagos',
                        data: data.montos,
                        borderColor: 'rgba(46, 139, 87, 1)',
                        backgroundColor: 'rgba(46, 139, 87, 0.2)',
                        pointBackgroundColor: 'rgba(46, 139, 87, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2 // Suavizado de línea
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Pagos por Mes',
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    return `Monto: ${formatCurrency(value)}`;
                                }
                            }
                        },
                        // Mostrar mensaje si no hay datos
                        custom: function(chart) {
                            if (chart.data.datasets[0].data.length === 0 || 
                                chart.data.datasets[0].data.every(val => val === 0)) {
                                addNoDataMessage(chart, 'No hay pagos en este período');
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
            
            // Actualizar título del período
            updateChartPeriodTitle('pagosPorMes');
        })
        .catch(error => {
            console.error('Error al cargar datos de pagos:', error);
            showErrorInChart(ctxPagos, 'No se pudieron cargar los datos de pagos');
        });
}

// Agregar controles de navegación para las gráficas
function addChartNavigationControls() {
    // 1. Agregar controles para la gráfica de préstamos
    const prestamoContainer = document.getElementById('prestamosPorMesChart')?.closest('.card-body');
    if (prestamoContainer) {
        const cardHeader = prestamoContainer.closest('.card')?.querySelector('.card-header');
        if (cardHeader) {
            // Verificar si ya existen los controles
            let controlsExist = cardHeader.querySelector('.chart-controls');
            if (!controlsExist) {
                const controls = document.createElement('div');
                controls.className = 'chart-controls d-flex align-items-center';
                controls.innerHTML = `
                    <button class="btn btn-sm btn-outline-primary me-1" id="prestamos-prev">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="period-display mx-2" id="prestamos-period">Últimos 6 meses</span>
                    <button class="btn btn-sm btn-outline-primary ms-1" id="prestamos-next">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
                
                // Insertar en el DOM
                cardHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                cardHeader.appendChild(controls);
                
                // Configurar eventos
                document.getElementById('prestamos-prev').addEventListener('click', () => {
                    navigateChartPeriod('prestamosPorMes', 'prev');
                });
                
                document.getElementById('prestamos-next').addEventListener('click', () => {
                    navigateChartPeriod('prestamosPorMes', 'next');
                });
            }
        }
    }
    
    // 2. Agregar controles para la gráfica de pagos
    const pagosContainer = document.getElementById('pagosPorMesChart')?.closest('.card-body');
    if (pagosContainer) {
        const cardHeader = pagosContainer.closest('.card')?.querySelector('.card-header');
        if (cardHeader) {
            // Verificar si ya existen los controles
            let controlsExist = cardHeader.querySelector('.chart-controls');
            if (!controlsExist) {
                const controls = document.createElement('div');
                controls.className = 'chart-controls d-flex align-items-center';
                controls.innerHTML = `
                    <button class="btn btn-sm btn-outline-primary me-1" id="pagos-prev">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="period-display mx-2" id="pagos-period">Últimos 6 meses</span>
                    <button class="btn btn-sm btn-outline-primary ms-1" id="pagos-next">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
                
                // Insertar en el DOM
                cardHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                cardHeader.appendChild(controls);
                
                // Configurar eventos
                document.getElementById('pagos-prev').addEventListener('click', () => {
                    navigateChartPeriod('pagosPorMes', 'prev');
                });
                
                document.getElementById('pagos-next').addEventListener('click', () => {
                    navigateChartPeriod('pagosPorMes', 'next');
                });
            }
        }
    }
    
    // Aplicar estilos CSS para controles de navegación
    addNavigationStyles();
}

// Función para navegar entre períodos
function navigateChartPeriod(chartType, direction) {
    const chartData = chartState[chartType];
    if (!chartData) return;
    
    const currentPeriod = { ...chartData.periodo };
    
    // Calcular el ancho del período actual (en meses)
    const currentStartDate = new Date(currentPeriod.inicio);
    const currentEndDate = new Date(currentPeriod.fin);
    
    // Calcular diferencia en meses
    const monthsDiff = 
        (currentEndDate.getFullYear() - currentStartDate.getFullYear()) * 12 + 
        (currentEndDate.getMonth() - currentStartDate.getMonth());
    
    // Mover el período según la dirección
    if (direction === 'prev') {
        // Retroceder un período completo
        chartData.periodo.inicio = new Date(
            currentStartDate.getFullYear(),
            currentStartDate.getMonth() - monthsDiff,
            1
        );
        
        chartData.periodo.fin = new Date(
            currentStartDate.getFullYear(),
            currentStartDate.getMonth(),
            0
        );
    } else if (direction === 'next') {
        // Avanzar un período completo
        chartData.periodo.inicio = new Date(
            currentEndDate.getFullYear(),
            currentEndDate.getMonth() + 1,
            1
        );
        
        chartData.periodo.fin = new Date(
            currentEndDate.getFullYear(),
            currentEndDate.getMonth() + 1 + monthsDiff,
            0
        );
        
        // No permitir avanzar más allá del mes actual
        const today = new Date();
        if (chartData.periodo.fin > today) {
            chartData.periodo.fin = new Date(
                today.getFullYear(),
                today.getMonth(),
                getLastDayOfMonth(today.getFullYear(), today.getMonth())
            );
            
            chartData.periodo.inicio = new Date(
                today.getFullYear(),
                today.getMonth() - monthsDiff,
                1
            );
        }
    }
    
    // Recargar la gráfica con el nuevo período
    if (chartType === 'prestamosPorMes') {
        initPrestamosChart();
    } else if (chartType === 'pagosPorMes') {
        initPagosChart();
    }
}

// Actualizar el título del período en la gráfica
function updateChartPeriodTitle(chartType) {
    const period = chartState[chartType].periodo;
    const periodElement = document.getElementById(`${chartType === 'prestamosPorMes' ? 'prestamos' : 'pagos'}-period`);
    
    if (!periodElement) return;
    
    const formatMonth = (date) => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    
    periodElement.textContent = `${formatMonth(period.inicio)} - ${formatMonth(period.fin)}`;
    
    // Habilitar/deshabilitar botones según el período
    toggleNavigationButtons(chartType);
}

// Habilitar/deshabilitar botones de navegación según el período
function toggleNavigationButtons(chartType) {
    const nextBtn = document.getElementById(`${chartType === 'prestamosPorMes' ? 'prestamos' : 'pagos'}-next`);
    if (!nextBtn) return;
    
    // Deshabilitar el botón "siguiente" si estamos en el período actual
    const today = new Date();
    const currentPeriodEnd = new Date(chartState[chartType].periodo.fin);
    
    // Si estamos en el mes actual o futuro, deshabilitar botón siguiente
    const isCurrentOrFutureMonth = 
        currentPeriodEnd.getFullYear() >= today.getFullYear() && 
        currentPeriodEnd.getMonth() >= today.getMonth();
    
    nextBtn.disabled = isCurrentOrFutureMonth;
}

// Obtener datos reales de préstamos por mes desde la API
async function fetchPrestamosData(fechaInicio, fechaFin) {
    console.log(`Obteniendo datos de préstamos desde ${fechaInicio.toDateString()} hasta ${fechaFin.toDateString()}`);
    
    try {
        // Obtener datos de la API
        const response = await fetch(`/api/prestamos/estadisticas/por-mes?desde=${fechaInicio.toISOString()}&hasta=${fechaFin.toISOString()}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener datos de préstamos`);
        }
        
        const data = await response.json();
        return processPrestamosData(data, fechaInicio, fechaFin);
    } catch (error) {
        console.error('Error al obtener datos de préstamos:', error);
        
        // En caso de error, devolver datos vacíos
        return {
            labels: [],
            cantidades: []
        };
    }
}

// Procesar datos de préstamos obtenidos de la API
function processPrestamosData(data, fechaInicio, fechaFin) {
    console.log('Procesando datos de préstamos:', data);
    
    // Si la API ya envía los datos con el formato esperado
    if (data.labels && data.valores) {
        console.log('Usando datos preformateados de la API');
        return {
            labels: data.labels,
            cantidades: data.valores
        };
    }
    
    // Si necesitamos procesar los datos desde otro formato
    const monthLabels = generarEtiquetasMesesEnRango(fechaInicio, fechaFin);
    const prestamosCount = Array(monthLabels.length).fill(0);
    
    // Si tenemos datos de préstamos, agregarlos al array correspondiente
    if (Array.isArray(data)) {
        console.log(`Procesando ${data.length} préstamos para estadísticas`);
        
        data.forEach(item => {
            // Intentar obtener la fecha de solicitud
            if (!item.fechaSolicitud) {
                console.warn('Préstamo sin fecha de solicitud:', item);
                return;
            }
            
            const fecha = new Date(item.fechaSolicitud);
            if (isNaN(fecha.getTime())) {
                console.warn(`Fecha inválida: ${item.fechaSolicitud}`);
                return;
            }
            
            const monthYear = formatMonthYear(fecha);
            
            const index = monthLabels.indexOf(monthYear);
            if (index !== -1) {
                prestamosCount[index] += item.cantidad || 1;
            }
        });
    }
    
    console.log('Etiquetas procesadas:', monthLabels);
    console.log('Cantidades procesadas:', prestamosCount);
    
    return {
        labels: monthLabels,
        cantidades: prestamosCount
    };
}

// Obtener datos reales de pagos por mes desde la API
async function fetchPagosData(fechaInicio, fechaFin) {
    console.log(`Obteniendo datos de pagos desde ${fechaInicio.toDateString()} hasta ${fechaFin.toDateString()}`);
    
    try {
        // Obtener datos de la API
        const response = await fetch(`/api/pagos/estadisticas/por-mes?desde=${fechaInicio.toISOString()}&hasta=${fechaFin.toISOString()}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener datos de pagos`);
        }
        
        const data = await response.json();
        return processPagosData(data, fechaInicio, fechaFin);
    } catch (error) {
        console.error('Error al obtener datos de pagos:', error);
        
        // En caso de error, devolver datos vacíos
        return {
            labels: [],
            montos: []
        };
    }
}

// Procesar datos de pagos obtenidos de la API
function processPagosData(data, fechaInicio, fechaFin) {
    console.log('Procesando datos de pagos:', data);
    
    // Si la API ya envía los datos con el formato esperado
    if (data.labels && data.valores) {
        console.log('Usando datos preformateados de la API');
        return {
            labels: data.labels,
            montos: data.valores
        };
    }
    
    // Si necesitamos procesar los datos desde otro formato
    const monthLabels = generarEtiquetasMesesEnRango(fechaInicio, fechaFin);
    const pagosMontos = Array(monthLabels.length).fill(0);
    
    // Si tenemos datos de pagos, agregarlos al array correspondiente
    if (Array.isArray(data)) {
        console.log(`Procesando ${data.length} pagos para estadísticas`);
        
        data.forEach(item => {
            // Intentar obtener la fecha de pago
            if (!item.fechaPago) {
                console.warn('Pago sin fecha:', item);
                return;
            }
            
            const fecha = new Date(item.fechaPago);
            if (isNaN(fecha.getTime())) {
                console.warn(`Fecha inválida: ${item.fechaPago}`);
                return;
            }
            
            const monthYear = formatMonthYear(fecha);
            
            const index = monthLabels.indexOf(monthYear);
            if (index !== -1) {
                const monto = parseFloat(item.cantidadPagada || 0);
                if (!isNaN(monto)) {
                    pagosMontos[index] += monto;
                }
            }
        });
    }
    
    console.log('Etiquetas procesadas:', monthLabels);
    console.log('Montos procesados:', pagosMontos);
    
    return {
        labels: monthLabels,
        montos: pagosMontos
    };
}

// Función auxiliar para generar etiquetas de meses en un rango
function generarEtiquetasMesesEnRango(fechaInicio, fechaFin) {
    const labels = [];
    
    // Clonar fechas para no modificar las originales
    const currentDate = new Date(fechaInicio);
    currentDate.setDate(1); // Asegurar que empezamos el primer día del mes
    const endDate = new Date(fechaFin);
    
    // Generar etiquetas para cada mes en el rango
    while (currentDate <= endDate) {
        const monthYear = formatMonthYear(currentDate);
        labels.push(monthYear);
        
        // Avanzar al siguiente mes
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return labels;
}

// Mostrar mensaje de carga en la gráfica
function showChartLoading(canvas, message = 'Cargando datos...') {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuración de texto
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial';
    
    // Mostrar mensaje de carga
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    // Dibujar indicador de carga (círculo giratorio)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 30;
    const radius = 15;
    
    const angle = (performance.now() / 1000) % (Math.PI * 2);
    
    ctx.strokeStyle = '#4e73df';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle, angle + Math.PI * 1.5);
    ctx.stroke();
    
    // Animación continua
    const animationId = requestAnimationFrame(() => {
        showChartLoading(canvas, message);
    });
    
    // Almacenar ID de animación para cancelarlo cuando sea necesario
    canvas.loadingAnimationId = animationId;
}

// Mostrar mensaje de error en la gráfica
function showErrorInChart(canvas, message = 'Error al cargar datos') {
    // Cancelar animación de carga si existe
    if (canvas.loadingAnimationId) {
        cancelAnimationFrame(canvas.loadingAnimationId);
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuración de texto
    ctx.fillStyle = '#e74a3b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Arial';
    
    // Mostrar mensaje de error
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    // Icono de error
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#e74a3b';
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillText('!', canvas.width / 2, canvas.height / 2 - 30);
}

// Agregar mensaje de "No hay datos" a la gráfica
function addNoDataMessage(chart, message = 'No hay datos para mostrar') {
    const chartArea = chart.chartArea;
    const ctx = chart.ctx;
    
    if (!chartArea || !ctx) return;
    
    ctx.save();
    
    // Configuración de texto
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial';
    
    // Posicionar en el centro del área de la gráfica
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    
    // Dibujar fondo semi-transparente
    ctx.fillStyle = 'rgba(240, 240, 240, 0.8)';
    ctx.fillRect(
        chartArea.left, 
        chartArea.top, 
        chartArea.right - chartArea.left, 
        chartArea.bottom - chartArea.top
    );
    
    // Dibujar mensaje
    ctx.fillStyle = '#666';
    ctx.fillText(message, centerX, centerY);
    
    ctx.restore();
}

// Agregar estilos CSS para controles de navegación
function addNavigationStyles() {
    // Verificar si ya existen los estilos
    if (document.getElementById('dashboard-chart-styles')) return;
    
    // Crear elemento de estilos
    const styleElement = document.createElement('style');
    styleElement.id = 'dashboard-chart-styles';
    styleElement.textContent = `
        .chart-controls {
            display: flex;
            align-items: center;
        }
        
        .chart-controls button {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
        }
        
        .chart-controls button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .period-display {
            font-size: 0.9rem;
            color: #666;
            min-width: 120px;
            text-align: center;
        }
        
        .chart-area {
            min-height: 250px;
            position: relative;
        }
        
        @media (max-width: 768px) {
            .chart-controls {
                margin-top: 0.5rem;
            }
            
            .card-header {
                flex-direction: column !important;
                align-items: flex-start !important;
            }
        }
    `;
    
    // Añadir al DOM
    document.head.appendChild(styleElement);
}