// Script para la gestión de reportes
let reportesData = {
    clientes: [],
    prestamos: [],
    pagos: []
};

// Inicializar la página de reportes
function initReportesPage() {
    console.log('Inicializando página de reportes...');
    
    // Cargar datos para los reportes
    cargarDatos();
    
    // Configurar selector de tipo de reporte
    const selectTipoReporte = document.getElementById('tipoReporte');
    if (selectTipoReporte) {
        selectTipoReporte.addEventListener('change', function() {
            mostrarReporte(this.value);
        });
    }
    
    // Configurar botones para exportar
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', exportarExcel);
    }
    
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarPDF);
    }
}

// Cargar todos los datos necesarios para los reportes
function cargarDatos() {
    // Mostrar indicador de carga
    document.getElementById('reporteContenido').innerHTML = '<div class="loading"></div>';
    
    // Realizar peticiones a la API
    Promise.all([
        fetch('/api/clientes').then(res => res.json()),
        fetch('/api/prestamos').then(res => res.json()),
        fetch('/api/pagos').then(res => res.json())
    ])
        .then(([clientes, prestamos, pagos]) => {
            // Almacenar datos
            reportesData.clientes = clientes;
            reportesData.prestamos = prestamos;
            reportesData.pagos = pagos;
            
            // Mostrar reporte inicial
            const tipoReporte = document.getElementById('tipoReporte').value;
            mostrarReporte(tipoReporte);
        })
        .catch(error => {
            console.error('Error al cargar datos:', error);
            document.getElementById('reporteContenido').innerHTML = 
                '<div class="alert alert-danger">Error al cargar datos: ' + error.message + '</div>';
        });
}

// Mostrar un reporte específico
function mostrarReporte(tipo) {
    // Verificar que los datos estén cargados
    if (!reportesData.clientes.length || !reportesData.prestamos.length) {
        document.getElementById('reporteContenido').innerHTML = 
            '<div class="alert alert-warning">Cargando datos. Por favor, espere...</div>';
        setTimeout(() => mostrarReporte(tipo), 1000);
        return;
    }
    
    // Mostrar el reporte correspondiente
    switch (tipo) {
        case 'general':
            mostrarReporteGeneral();
            break;
        case 'prestamos_mes':
            mostrarReportePrestamosporMes();
            break;
        case 'pagos_mes':
            mostrarReportePagosPorMes();
            break;
        case 'clientes_activos':
            mostrarReporteClientesActivos();
            break;
        case 'prestamos_monto':
            mostrarReportePorMonto();
            break;
        case 'prestamos_vencidos':
            mostrarReporteVencidos();
            break;
        default:
            mostrarReporteGeneral();
    }
}

// Reporte general (dashboard)
function mostrarReporteGeneral() {
    // Obtener métricas generales
    const totalClientes = reportesData.clientes.length;
    const clientesActivos = reportesData.clientes.filter(c => c.estado === 'Activo').length;
    
    const totalPrestamos = reportesData.prestamos.length;
    const prestamosActivos = reportesData.prestamos.filter(p => p.estado === 'Activo').length;
    const prestamosPagados = reportesData.prestamos.filter(p => p.estado === 'Pagado').length;
    const prestamosCancelados = reportesData.prestamos.filter(p => p.estado === 'Cancelado').length;
    
    const totalPagos = reportesData.pagos.length;
    
    // Calcular montos
    const montoPrestado = reportesData.prestamos.reduce((total, p) => total + p.cantidadPrestamo, 0);
    const montoIntereses = reportesData.prestamos.reduce((total, p) => total + p.totalInteres, 0);
    const montoPagado = reportesData.pagos.reduce((total, p) => total + p.cantidadPagada, 0);
    
    // Calcular montos pendientes
    const montoPendiente = reportesData.prestamos
        .filter(p => p.estado === 'Activo')
        .reduce((total, p) => {
            // Sumar solo el saldo pendiente de las cuotas no pagadas
            return total + p.tablaAmortizacion
                .filter(cuota => !cuota.pagado)
                .reduce((sum, cuota) => sum + cuota.cuotaMensual, 0);
        }, 0);
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Reporte General</h3>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Métricas de Clientes</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <p><strong>Total de clientes:</strong> ${totalClientes}</p>
                            <p><strong>Clientes activos:</strong> ${clientesActivos} (${Math.round(clientesActivos / totalClientes * 100)}%)</p>
                            <p><strong>Clientes inactivos:</strong> ${totalClientes - clientesActivos} (${Math.round((totalClientes - clientesActivos) / totalClientes * 100)}%)</p>
                        </div>
                        <div>
                            <canvas id="chartClientes"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Métricas de Préstamos</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <p><strong>Total de préstamos:</strong> ${totalPrestamos}</p>
                            <p><strong>Préstamos activos:</strong> ${prestamosActivos} (${Math.round(prestamosActivos / totalPrestamos * 100)}%)</p>
                            <p><strong>Préstamos pagados:</strong> ${prestamosPagados} (${Math.round(prestamosPagados / totalPrestamos * 100)}%)</p>
                            <p><strong>Préstamos cancelados:</strong> ${prestamosCancelados} (${Math.round(prestamosCancelados / totalPrestamos * 100)}%)</p>
                        </div>
                        <div>
                            <canvas id="chartPrestamos"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Métricas Financieras</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <p><strong>Total prestado:</strong> ${formatCurrency(montoPrestado)}</p>
                                    <p><strong>Total intereses:</strong> ${formatCurrency(montoIntereses)}</p>
                                    <p><strong>Total a cobrar:</strong> ${formatCurrency(montoPrestado + montoIntereses)}</p>
                                    <p><strong>Total cobrado:</strong> ${formatCurrency(montoPagado)}</p>
                                    <p><strong>Total pendiente:</strong> ${formatCurrency(montoPendiente)}</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div>
                                    <canvas id="chartFinanzas"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Tendencias Mensuales</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartTendenciasMensuales"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
    
    // Generar gráficos
    generarGraficoClientes();
    generarGraficoPrestamos();
    generarGraficoFinanzas();
    generarGraficoTendencias();
}

// Reporte de préstamos por mes
function mostrarReportePrestamosporMes() {
    // Agrupar préstamos por mes
    const prestamosPorMes = agruparPorMes(reportesData.prestamos, 'fechaSolicitud');
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Préstamos por Mes</h3>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Cantidad de Préstamos por Mes</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartPrestamosPorMes" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Detalle de Préstamos por Mes</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Cantidad</th>
                                        <th>Monto Total</th>
                                        <th>Monto Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Agregar filas a la tabla
    prestamosPorMes.labels.forEach((mes, index) => {
        const cantidad = prestamosPorMes.data[index];
        const montoTotal = prestamosPorMes.montos[index];
        const montoPromedio = cantidad > 0 ? montoTotal / cantidad : 0;
        
        html += `
            <tr>
                <td>${mes}</td>
                <td>${cantidad}</td>
                <td>${formatCurrency(montoTotal)}</td>
                <td>${formatCurrency(montoPromedio)}</td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
    
    // Generar gráfico
    generarGraficoPrestamosPorMes(prestamosPorMes);
}

// Reporte de pagos por mes
function mostrarReportePagosPorMes() {
    // Agrupar pagos por mes
    const pagosPorMes = agruparPorMes(reportesData.pagos, 'fechaPago');
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Pagos por Mes</h3>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Cantidad de Pagos por Mes</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartPagosPorMes" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Detalle de Pagos por Mes</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Cantidad</th>
                                        <th>Monto Total</th>
                                        <th>Monto Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Agregar filas a la tabla
    pagosPorMes.labels.forEach((mes, index) => {
        const cantidad = pagosPorMes.data[index];
        const montoTotal = pagosPorMes.montos[index];
        const montoPromedio = cantidad > 0 ? montoTotal / cantidad : 0;
        
        html += `
            <tr>
                <td>${mes}</td>
                <td>${cantidad}</td>
                <td>${formatCurrency(montoTotal)}</td>
                <td>${formatCurrency(montoPromedio)}</td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
    
    // Generar gráfico
    generarGraficoPagosPorMes(pagosPorMes);
}

// Reporte de clientes activos
function mostrarReporteClientesActivos() {
    // Filtrar clientes activos
    const clientesActivos = reportesData.clientes.filter(c => c.estado === 'Activo');
    
    // Crear mapa de préstamos por cliente
    const prestamosPorCliente = {};
    reportesData.prestamos.forEach(prestamo => {
        if (prestamo.estado === 'Activo') {
            if (!prestamosPorCliente[prestamo.clienteId]) {
                prestamosPorCliente[prestamo.clienteId] = [];
            }
            prestamosPorCliente[prestamo.clienteId].push(prestamo);
        }
    });
    
    // Crear datos para la tabla
    const clientesData = clientesActivos.map(cliente => {
        const prestamos = prestamosPorCliente[cliente.clienteId] || [];
        const cantidadPrestamos = prestamos.length;
        const montoPrestado = prestamos.reduce((total, p) => total + p.cantidadPrestamo, 0);
        
        return {
            cliente,
            cantidadPrestamos,
            montoPrestado
        };
    });
    
    // Ordenar por monto prestado (descendente)
    clientesData.sort((a, b) => b.montoPrestado - a.montoPrestado);
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Clientes Activos</h3>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Estadísticas de Clientes Activos</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${clientesActivos.length}</h4>
                                    <p>Clientes Activos</p>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${clientesData.reduce((total, c) => total + c.cantidadPrestamos, 0)}</h4>
                                    <p>Préstamos Activos</p>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${formatCurrency(clientesData.reduce((total, c) => total + c.montoPrestado, 0))}</h4>
                                    <p>Monto Total Prestado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Clientes Activos por Monto Prestado</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Documento</th>
                                        <th>Teléfono</th>
                                        <th>Préstamos Activos</th>
                                        <th>Monto Total</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Agregar filas a la tabla
    clientesData.forEach(data => {
        html += `
            <tr>
                <td>${data.cliente.nombreCompleto}</td>
                <td>${data.cliente.tipoDocumento}: ${data.cliente.numeroDocumento}</td>
                <td>${data.cliente.telefono}</td>
                <td>${data.cantidadPrestamos}</td>
                <td>${formatCurrency(data.montoPrestado)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verCliente('${data.cliente.clienteId}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
}

// Reporte de préstamos por monto
function mostrarReportePorMonto() {
    // Definir rangos de montos
    const rangos = [
        { min: 0, max: 10000, label: 'Menos de $10,000' },
        { min: 10000, max: 25000, label: '$10,000 - $25,000' },
        { min: 25000, max: 50000, label: '$25,000 - $50,000' },
        { min: 50000, max: 100000, label: '$50,000 - $100,000' },
        { min: 100000, max: Infinity, label: 'Más de $100,000' }
    ];
    
    // Contar préstamos por rango
    const prestamosRangos = rangos.map(rango => {
        const prestamos = reportesData.prestamos.filter(p => 
            p.cantidadPrestamo >= rango.min && p.cantidadPrestamo < rango.max
        );
        
        const total = prestamos.length;
        const montoTotal = prestamos.reduce((sum, p) => sum + p.cantidadPrestamo, 0);
        
        return {
            ...rango,
            total,
            montoTotal
        };
    });
    
    // Generar datos para gráficos
    const labels = prestamosRangos.map(r => r.label);
    const cantidades = prestamosRangos.map(r => r.total);
    const montos = prestamosRangos.map(r => r.montoTotal);
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Préstamos por Monto</h3>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Cantidad de Préstamos por Rango</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartCantidadPorRango" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Monto Total por Rango</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartMontoPorRango" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Detalle por Rango de Montos</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Rango</th>
                                        <th>Cantidad de Préstamos</th>
                                        <th>Porcentaje</th>
                                        <th>Monto Total</th>
                                        <th>Monto Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Calcular totales
    const totalPrestamos = cantidades.reduce((sum, c) => sum + c, 0);
    
    // Agregar filas a la tabla
    prestamosRangos.forEach(rango => {
        const porcentaje = totalPrestamos > 0 ? (rango.total / totalPrestamos * 100).toFixed(2) : '0.00';
        const promedio = rango.total > 0 ? rango.montoTotal / rango.total : 0;
        
        html += `
            <tr>
                <td>${rango.label}</td>
                <td>${rango.total}</td>
                <td>${porcentaje}%</td>
                <td>${formatCurrency(rango.montoTotal)}</td>
                <td>${formatCurrency(promedio)}</td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
    
    // Generar gráficos
    generarGraficoCantidadPorRango(labels, cantidades);
    generarGraficoMontoPorRango(labels, montos);
}

// Reporte de préstamos vencidos
function mostrarReporteVencidos() {
    // Obtener fecha actual
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    
    // Crear lista de cuotas vencidas
    const cuotasVencidas = [];
    
    reportesData.prestamos.forEach(prestamo => {
        if (prestamo.estado === 'Activo') {
            prestamo.tablaAmortizacion.forEach(cuota => {
                const fechaCuota = new Date(cuota.fechaPago);
                fechaCuota.setHours(0, 0, 0, 0);
                
                if (!cuota.pagado && fechaCuota < fechaActual) {
                    cuotasVencidas.push({
                        prestamoId: prestamo.prestamoId,
                        clienteId: prestamo.clienteId,
                        numeroPago: cuota.numeroPago,
                        fechaPago: fechaCuota,
                        monto: cuota.cuotaMensual,
                        diasVencimiento: Math.floor((fechaActual - fechaCuota) / (1000 * 60 * 60 * 24))
                    });
                }
            });
        }
    });
    
    // Ordenar por días de vencimiento (descendente)
    cuotasVencidas.sort((a, b) => b.diasVencimiento - a.diasVencimiento);
    
    // Calcular métricas
    const totalVencidas = cuotasVencidas.length;
    const montoVencido = cuotasVencidas.reduce((sum, c) => sum + c.monto, 0);
    
    // Agrupar por rango de días
    const rangos = [
        { min: 0, max: 15, label: '1 a 15 días' },
        { min: 15, max: 30, label: '16 a 30 días' },
        { min: 30, max: 60, label: '31 a 60 días' },
        { min: 60, max: 90, label: '61 a 90 días' },
        { min: 90, max: Infinity, label: 'Más de 90 días' }
    ];
    
    const vencimientosPorRango = rangos.map(rango => {
        const cuotas = cuotasVencidas.filter(c => 
            c.diasVencimiento > rango.min && c.diasVencimiento <= rango.max
        );
        
        return {
            ...rango,
            total: cuotas.length,
            monto: cuotas.reduce((sum, c) => sum + c.monto, 0)
        };
    });
    
    // Generar HTML para el reporte
    let html = `
        <h3 class="mb-4">Préstamos Vencidos</h3>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Estadísticas de Vencimientos</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${totalVencidas}</h4>
                                    <p>Cuotas Vencidas</p>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${formatCurrency(montoVencido)}</h4>
                                    <p>Monto Total Vencido</p>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="mb-3">
                                    <h4>${totalVencidas > 0 ? Math.round(cuotasVencidas.reduce((sum, c) => sum + c.diasVencimiento, 0) / totalVencidas) : 0}</h4>
                                    <p>Promedio Días de Vencimiento</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Cuotas Vencidas por Antigüedad</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartVencimientosPorRango" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Monto Vencido por Antigüedad</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="chartMontoVencidoPorRango" style="height: 300px;"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Detalle de Cuotas Vencidas</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Préstamo</th>
                                        <th>Cuota</th>
                                        <th>Fecha Vencimiento</th>
                                        <th>Días Vencidos</th>
                                        <th>Monto</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Obtener datos de clientes
    const clientesMap = {};
    reportesData.clientes.forEach(cliente => {
        clientesMap[cliente.clienteId] = cliente;
    });
    
    // Agregar filas a la tabla
    cuotasVencidas.forEach(cuota => {
        const cliente = clientesMap[cuota.clienteId];
        
        if (!cliente) return; // Saltar si no se encuentra el cliente
        
        html += `
            <tr>
                <td>${cliente.nombreCompleto}</td>
                <td>${cuota.prestamoId.substring(0, 8)}...</td>
                <td>${cuota.numeroPago}</td>
                <td>${formatDate(cuota.fechaPago)}</td>
                <td>${cuota.diasVencimiento}</td>
                <td>${formatCurrency(cuota.monto)}</td>
                <td>
                    <button class="btn btn-sm btn-success" 
                            onclick="iniciarPago('${cuota.prestamoId}', ${cuota.numeroPago})">
                        <i class="fas fa-money-bill-wave"></i> Pagar
                    </button>
                    <button class="btn btn-sm btn-info" 
                            onclick="mostrarDetallesPrestamo('${cuota.prestamoId}')">
                        <i class="fas fa-eye"></i> Ver Préstamo
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Actualizar contenido
    document.getElementById('reporteContenido').innerHTML = html;
    
    // Generar gráficos
    generarGraficoVencimientosPorRango(vencimientosPorRango);
    generarGraficoMontoVencidoPorRango(vencimientosPorRango);
}

// Agrupar datos por mes
function agruparPorMes(datos, campoFecha) {
    // Obtener últimos 6 meses
    const fechaActual = new Date();
    const meses = [];
    const cantidades = [];
    const montos = [];
    
    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        const nombreMes = fecha.toLocaleString('es-MX', { month: 'long' });
        const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
        
        meses.push(mesCapitalizado);
        cantidades.push(0);
        montos.push(0);
    }
    
    // Contar elementos por mes
    datos.forEach(item => {
        const fecha = new Date(item[campoFecha]);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        
        for (let i = 5; i >= 0; i--) {
            const fechaComparar = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
            
            if (mes === fechaComparar.getMonth() && anio === fechaComparar.getFullYear()) {
                cantidades[5 - i]++;
                
                // Si es un pago, sumar el monto
                if (item.cantidadPagada) {
                    montos[5 - i] += item.cantidadPagada;
                }
                // Si es un préstamo, sumar el monto
                else if (item.cantidadPrestamo) {
                    montos[5 - i] += item.cantidadPrestamo;
                }
                
                break;
            }
        }
    });
    
    return {
        labels: meses,
        data: cantidades,
        montos: montos
    };
}

// Exportar a Excel
function exportarExcel() {
    const tipoReporte = document.getElementById('tipoReporte').value;
    const tablas = document.querySelectorAll('#reporteContenido table');
    
    if (tablas.length === 0) {
        showNotification('No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        // Preparar datos para excel
        const workbook = XLSX.utils.book_new();
        
        // Por cada tabla, crear una hoja
        tablas.forEach((tabla, index) => {
            // Obtener el título de la tabla
            const tituloElemento = tabla.closest('.card').querySelector('.card-header h5');
            const titulo = tituloElemento ? tituloElemento.textContent : `Hoja${index+1}`;
            
            // Convertir tabla a datos
            const worksheet = XLSX.utils.table_to_sheet(tabla);
            
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, worksheet, titulo.substring(0, 31));
        });
        
        // Guardar archivo
        XLSX.writeFile(workbook, `Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showNotification('Reporte exportado correctamente a Excel', 'success');
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        showNotification('Error al exportar a Excel: ' + error.message, 'error');
    }
}

// Exportar a PDF
function exportarPDF() {
    const tipoReporte = document.getElementById('tipoReporte').value;
    const reporteContenido = document.getElementById('reporteContenido');
    
    // Mostrar notificación
    showNotification('Preparando PDF...', 'info');
    
    try {
        // Asegurarnos de que las variables necesarias estén disponibles
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            throw new Error('Las bibliotecas de exportación no están cargadas correctamente');
        }
        
        // Usar html2canvas y jsPDF
        html2canvas(reporteContenido).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            
            pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            showNotification('PDF generado correctamente', 'success');
        }).catch(error => {
            console.error('Error al generar PDF:', error);
            showNotification('Error al generar PDF: ' + error.message, 'error');
        });
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        showNotification('Error al exportar a PDF: ' + error.message, 'error');
    }
}

// Funciones para generar gráficos

// Gráfico de clientes (activos vs inactivos)
function generarGraficoClientes() {
    const ctx = document.getElementById('chartClientes');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    const clientesActivos = reportesData.clientes.filter(c => c.estado === 'Activo').length;
    const clientesInactivos = reportesData.clientes.length - clientesActivos;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activos', 'Inactivos'],
            datasets: [{
                data: [clientesActivos, clientesInactivos],
                backgroundColor: ['#2E8B57', '#808080'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico de préstamos (activos, pagados, cancelados)
function generarGraficoPrestamos() {
    const ctx = document.getElementById('chartPrestamos');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    const prestamosActivos = reportesData.prestamos.filter(p => p.estado === 'Activo').length;
    const prestamosPagados = reportesData.prestamos.filter(p => p.estado === 'Pagado').length;
    const prestamosCancelados = reportesData.prestamos.filter(p => p.estado === 'Cancelado').length;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activos', 'Pagados', 'Cancelados'],
            datasets: [{
                data: [prestamosActivos, prestamosPagados, prestamosCancelados],
                backgroundColor: ['#4682B4', '#2E8B57', '#CD5C5C'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico financiero
function generarGraficoFinanzas() {
    const ctx = document.getElementById('chartFinanzas');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    const montoPrestado = reportesData.prestamos.reduce((total, p) => total + p.cantidadPrestamo, 0);
    const montoIntereses = reportesData.prestamos.reduce((total, p) => total + p.totalInteres, 0);
    const montoPagado = reportesData.pagos.reduce((total, p) => total + p.cantidadPagada, 0);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Capital Prestado', 'Intereses', 'Total Cobrado'],
            datasets: [{
                data: [montoPrestado, montoIntereses, montoPagado],
                backgroundColor: ['#4682B4', '#DAA520', '#2E8B57'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de tendencias
function generarGraficoTendencias() {
    const ctx = document.getElementById('chartTendenciasMensuales');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    // Agrupar préstamos y pagos por mes
    const prestamosPorMes = agruparPorMes(reportesData.prestamos, 'fechaSolicitud');
    const pagosPorMes = agruparPorMes(reportesData.pagos, 'fechaPago');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: prestamosPorMes.labels,
            datasets: [
                {
                    label: 'Monto Prestado',
                    data: prestamosPorMes.montos,
                    borderColor: '#4682B4',
                    backgroundColor: 'rgba(70, 130, 180, 0.2)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Monto Cobrado',
                    data: pagosPorMes.montos,
                    borderColor: '#2E8B57',
                    backgroundColor: 'rgba(46, 139, 87, 0.2)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de préstamos por mes
function generarGraficoPrestamosPorMes(prestamosPorMes) {
    const ctx = document.getElementById('chartPrestamosPorMes');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: prestamosPorMes.labels,
            datasets: [
                {
                    label: 'Cantidad de Préstamos',
                    data: prestamosPorMes.data,
                    backgroundColor: 'rgba(70, 130, 180, 0.5)',
                    borderColor: 'rgba(70, 130, 180, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Monto Total',
                    data: prestamosPorMes.montos,
                    backgroundColor: 'rgba(218, 165, 32, 0.2)',
                    borderColor: 'rgba(218, 165, 32, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Cantidad'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Monto'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.yAxisID === 'y1') {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                            return context.dataset.label + ': ' + context.formattedValue;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de pagos por mes
function generarGraficoPagosPorMes(pagosPorMes) {
    const ctx = document.getElementById('chartPagosPorMes');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: pagosPorMes.labels,
            datasets: [
                {
                    label: 'Cantidad de Pagos',
                    data: pagosPorMes.data,
                    backgroundColor: 'rgba(46, 139, 87, 0.5)',
                    borderColor: 'rgba(46, 139, 87, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Monto Total',
                    data: pagosPorMes.montos,
                    backgroundColor: 'rgba(70, 130, 180, 0.2)',
                    borderColor: 'rgba(70, 130, 180, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Cantidad'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Monto'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.yAxisID === 'y1') {
                                return context.dataset.label + ': ' + formatCurrency(context.raw);
                            }
                            return context.dataset.label + ': ' + context.formattedValue;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de cantidad por rango
function generarGraficoCantidadPorRango(labels, cantidades) {
    const ctx = document.getElementById('chartCantidadPorRango');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: cantidades,
                backgroundColor: [
                    'rgba(70, 130, 180, 0.7)',
                    'rgba(70, 130, 180, 0.6)',
                    'rgba(70, 130, 180, 0.5)',
                    'rgba(70, 130, 180, 0.4)',
                    'rgba(70, 130, 180, 0.3)'
                ],
                borderColor: 'rgba(70, 130, 180, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico de monto por rango
function generarGraficoMontoPorRango(labels, montos) {
    const ctx = document.getElementById('chartMontoPorRango');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: montos,
                backgroundColor: [
                    'rgba(46, 139, 87, 0.7)',
                    'rgba(46, 139, 87, 0.6)',
                    'rgba(46, 139, 87, 0.5)',
                    'rgba(46, 139, 87, 0.4)',
                    'rgba(46, 139, 87, 0.3)'
                ],
                borderColor: 'rgba(46, 139, 87, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de vencimientos por rango
function generarGraficoVencimientosPorRango(vencimientosPorRango) {
    const ctx = document.getElementById('chartVencimientosPorRango');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    const labels = vencimientosPorRango.map(r => r.label);
    const cantidades = vencimientosPorRango.map(r => r.total);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: cantidades,
                backgroundColor: [
                    'rgba(218, 165, 32, 0.7)',
                    'rgba(218, 165, 32, 0.6)',
                    'rgba(218, 165, 32, 0.5)',
                    'rgba(218, 165, 32, 0.4)',
                    'rgba(218, 165, 32, 0.3)'
                ],
                borderColor: 'rgba(218, 165, 32, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico de monto vencido por rango
function generarGraficoMontoVencidoPorRango(vencimientosPorRango) {
    const ctx = document.getElementById('chartMontoVencidoPorRango');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }
    
    const labels = vencimientosPorRango.map(r => r.label);
    const montos = vencimientosPorRango.map(r => r.monto);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: montos,
                backgroundColor: [
                    'rgba(205, 92, 92, 0.7)',
                    'rgba(205, 92, 92, 0.6)',
                    'rgba(205, 92, 92, 0.5)',
                    'rgba(205, 92, 92, 0.4)',
                    'rgba(205, 92, 92, 0.3)'
                ],
                borderColor: 'rgba(205, 92, 92, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Función para ver un cliente (navegación)
function verCliente(clienteId) {
    // Navegar a la página de clientes
    document.querySelector('.nav-link[data-page="clientes"]').click();
    
    // Almacenar el ID para cuando se cargue la página
    window.pendingClientDetails = clienteId;
}