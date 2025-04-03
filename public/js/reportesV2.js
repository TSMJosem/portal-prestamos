// Generar reporte de préstamos por mes
function generarReportePrestamosPorMes(contenedor) {
    // Extraer datos
    const { prestamos } = reportesData;
    
    // Agrupar préstamos por mes
    const prestamosPorMes = {};
    
    prestamos.forEach(prestamo => {
        if (!prestamo.fechaSolicitud) return;
        
        const fecha = new Date(prestamo.fechaSolicitud);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
        
        if (!prestamosPorMes[clave]) {
            prestamosPorMes[clave] = {
                anio,
                mes,
                nombre: obtenerNombreMes(mes),
                cantidad: 0,
                montoTotal: 0
            };
        }
        
        prestamosPorMes[clave].cantidad++;
        prestamosPorMes[clave].montoTotal += parseFloat(prestamo.cantidadPrestamo) || 0;
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    const mesesArray = Object.values(prestamosPorMes).sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mes - a.mes;
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Préstamos por Mes</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Tabla de préstamos por mes -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Distribución Mensual de Préstamos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Año</th>
                                <th>Cantidad de Préstamos</th>
                                <th>Monto Total</th>
                                <th>Promedio por Préstamo</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada mes
    mesesArray.forEach(mes => {
        const promedio = mes.cantidad > 0 ? mes.montoTotal / mes.cantidad : 0;
        
        html += `
            <tr>
                <td>${mes.nombre}</td>
                <td>${mes.anio}</td>
                <td>${mes.cantidad}</td>
                <td>${formatCurrency(mes.montoTotal)}</td>
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
        
        <!-- Resumen estadístico -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen Estadístico</h5>
            </div>
            <div class="card-body">
    `;
    
    // Calcular estadísticas
    if (mesesArray.length > 0) {
        const totalPrestamos = mesesArray.reduce((sum, mes) => sum + mes.cantidad, 0);
        const totalMonto = mesesArray.reduce((sum, mes) => sum + mes.montoTotal, 0);
        const promedioMensual = totalPrestamos / mesesArray.length;
        const montoPromedioMensual = totalMonto / mesesArray.length;
        
        // Encontrar el mes con más préstamos
        const mesMasPrestamos = mesesArray.reduce((max, mes) => 
            mes.cantidad > max.cantidad ? mes : max, mesesArray[0]);
        
        // Encontrar el mes con más monto
        const mesMasMonto = mesesArray.reduce((max, mes) => 
            mes.montoTotal > max.montoTotal ? mes : max, mesesArray[0]);
        
        html += `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Total de Préstamos:</th>
                            <td>${totalPrestamos}</td>
                        </tr>
                        <tr>
                            <th>Promedio Mensual:</th>
                            <td>${promedioMensual.toFixed(2)} préstamos</td>
                        </tr>
                        <tr>
                            <th>Mes con más Préstamos:</th>
                            <td>${mesMasPrestamos.nombre} ${mesMasPrestamos.anio} (${mesMasPrestamos.cantidad})</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Monto Total:</th>
                            <td>${formatCurrency(totalMonto)}</td>
                        </tr>
                        <tr>
                            <th>Monto Promedio Mensual:</th>
                            <td>${formatCurrency(montoPromedioMensual)}</td>
                        </tr>
                        <tr>
                            <th>Mes con mayor Monto:</th>
                            <td>${mesMasMonto.nombre} ${mesMasMonto.anio} (${formatCurrency(mesMasMonto.montoTotal)})</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                No hay datos suficientes para generar estadísticas.
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de pagos por mes
function generarReportePagosPorMes(contenedor) {
    // Extraer datos
    const { pagos } = reportesData;
    
    // Agrupar pagos por mes
    const pagosPorMes = {};
    
    pagos.forEach(pago => {
        if (!pago.fechaPago) return;
        
        const fecha = new Date(pago.fechaPago);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
        
        if (!pagosPorMes[clave]) {
            pagosPorMes[clave] = {
                anio,
                mes,
                nombre: obtenerNombreMes(mes),
                cantidad: 0,
                montoTotal: 0
            };
        }
        
        pagosPorMes[clave].cantidad++;
        pagosPorMes[clave].montoTotal += parseFloat(pago.cantidadPagada) || 0;
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    const mesesArray = Object.values(pagosPorMes).sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mes - a.mes;
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Pagos por Mes</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Tabla de pagos por mes -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Distribución Mensual de Pagos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Año</th>
                                <th>Cantidad de Pagos</th>
                                <th>Monto Total</th>
                                <th>Promedio por Pago</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada mes
    mesesArray.forEach(mes => {
        const promedio = mes.cantidad > 0 ? mes.montoTotal / mes.cantidad : 0;
        
        html += `
            <tr>
                <td>${mes.nombre}</td>
                <td>${mes.anio}</td>
                <td>${mes.cantidad}</td>
                <td>${formatCurrency(mes.montoTotal)}</td>
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
        
        <!-- Resumen estadístico -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen Estadístico</h5>
            </div>
            <div class="card-body">
    `;
    
    // Calcular estadísticas
    if (mesesArray.length > 0) {
        const totalPagos = mesesArray.reduce((sum, mes) => sum + mes.cantidad, 0);
        const totalMonto = mesesArray.reduce((sum, mes) => sum + mes.montoTotal, 0);
        const promedioMensual = totalPagos / mesesArray.length;
        const montoPromedioMensual = totalMonto / mesesArray.length;
        
        // Encontrar el mes con más pagos
        const mesMasPagos = mesesArray.reduce((max, mes) => 
            mes.cantidad > max.cantidad ? mes : max, mesesArray[0]);
        
        // Encontrar el mes con más monto
        const mesMasMonto = mesesArray.reduce((max, mes) => 
            mes.montoTotal > max.montoTotal ? mes : max, mesesArray[0]);
        
        html += `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Total de Pagos:</th>
                            <td>${totalPagos}</td>
                        </tr>
                        <tr>
                            <th>Promedio Mensual:</th>
                            <td>${promedioMensual.toFixed(2)} pagos</td>
                        </tr>
                        <tr>
                            <th>Mes con más Pagos:</th>
                            <td>${mesMasPagos.nombre} ${mesMasPagos.anio} (${mesMasPagos.cantidad})</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Monto Total:</th>
                            <td>${formatCurrency(totalMonto)}</td>
                        </tr>
                        <tr>
                            <th>Monto Promedio Mensual:</th>
                            <td>${formatCurrency(montoPromedioMensual)}</td>
                        </tr>
                        <tr>
                            <th>Mes con mayor Monto:</th>
                            <td>${mesMasMonto.nombre} ${mesMasMonto.anio} (${formatCurrency(mesMasMonto.montoTotal)})</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                No hay datos suficientes para generar estadísticas.
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte general (resumen de la situación actual)
function generarReporteGeneral(contenedor) {
    // Extraer datos
    const { prestamos, clientes, pagos } = reportesData;
    
    // Calcular métricas generales
    const prestamosActivos = prestamos.filter(p => p.estado === 'Activo').length;
    const prestamosPagados = prestamos.filter(p => p.estado === 'Pagado').length;
    const prestamosCancelados = prestamos.filter(p => p.estado === 'Cancelado').length;
    
    const clientesActivos = clientes.filter(c => c.estado === 'Activo').length;
    const clientesInactivos = clientes.filter(c => c.estado === 'Inactivo').length;
    
    // Calcular monto total de préstamos
    const montoTotalPrestamos = prestamos.reduce((total, prestamo) => 
        total + (parseFloat(prestamo.cantidadPrestamo) || 0), 0);
    
    // Calcular monto total de pagos
    const montoTotalPagos = pagos.reduce((total, pago) => 
        total + (parseFloat(pago.cantidadPagada) || 0), 0);
    
    // Calcular pagos pendientes (estimación)
    const pagosRealizados = pagos.length;
    
    // Calcular préstamos por estado para gráfico
    const estadosPrestamos = {
        'Activo': prestamosActivos,
        'Pagado': prestamosPagados,
        'Cancelado': prestamosCancelados
    };
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Reporte General</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="row">
            <!-- Resumen general -->
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Resumen General</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <th>Total Préstamos:</th>
                                    <td>${prestamos.length}</td>
                                </tr>
                                <tr>
                                    <th>Préstamos Activos:</th>
                                    <td>${prestamosActivos}</td>
                                </tr>
                                <tr>
                                    <th>Préstamos Pagados:</th>
                                    <td>${prestamosPagados}</td>
                                </tr>
                                <tr>
                                    <th>Préstamos Cancelados:</th>
                                    <td>${prestamosCancelados}</td>
                                </tr>
                                <tr>
                                    <th>Total Clientes:</th>
                                    <td>${clientes.length}</td>
                                </tr>
                                <tr>
                                    <th>Clientes Activos:</th>
                                    <td>${clientesActivos}</td>
                                </tr>
                                <tr>
                                    <th>Total Pagos Registrados:</th>
                                    <td>${pagosRealizados}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Resumen financiero -->
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Resumen Financiero</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tbody>
                                <tr>
                                    <th>Monto Total Préstamos:</th>
                                    <td>${formatCurrency(montoTotalPrestamos)}</td>
                                </tr>
                                <tr>
                                    <th>Monto Total Pagos:</th>
                                    <td>${formatCurrency(montoTotalPagos)}</td>
                                </tr>
                                <tr>
                                    <th>Promedio de Préstamo:</th>
                                    <td>${formatCurrency(prestamos.length > 0 ? montoTotalPrestamos / prestamos.length : 0)}</td>
                                </tr>
                                <tr>
                                    <th>Préstamos por Cliente:</th>
                                    <td>${clientes.length > 0 ? (prestamos.length / clientes.length).toFixed(2) : 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Préstamos por estado -->
        <div class="row">
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Préstamos por Estado</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th>Cantidad</th>
                                        <th>Porcentaje</th>
                                        <th>Representación</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Agregar filas para cada estado
    Object.entries(estadosPrestamos).forEach(([estado, cantidad]) => {
        const porcentaje = prestamos.length > 0 ? (cantidad / prestamos.length) * 100 : 0;
        
        html += `
            <tr>
                <td>${estado}</td>
                <td>${cantidad}</td>
                <td>${porcentaje.toFixed(2)}%</td>
                <td>
                    <div class="progress">
                        <div class="progress-bar ${getColorByEstado(estado)}" 
                             role="progressbar" 
                             style="width: ${porcentaje}%" 
                             aria-valuenow="${porcentaje}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
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
        
        <!-- Últimos préstamos -->
        <div class="row">
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Últimos Préstamos Registrados</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;
    
    // Ordenar préstamos por fecha (más recientes primero)
    const prestamosOrdenados = [...prestamos].sort((a, b) => 
        new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
    
    // Limitar a los 10 más recientes
    const ultimosPrestamos = prestamosOrdenados.slice(0, 10);
    
    // Crear mapa de clientes para acceso rápido
    const clientesMap = {};
    clientes.forEach(cliente => {
        clientesMap[cliente.clienteId] = cliente;
    });
    
    // Agregar filas para los últimos préstamos
    ultimosPrestamos.forEach(prestamo => {
        const cliente = clientesMap[prestamo.clienteId] || { nombreCompleto: 'Cliente desconocido' };
        
        html += `
            <tr>
                <td>${prestamo.prestamoId.substring(0, 8)}...</td>
                <td>${cliente.nombreCompleto}</td>
                <td>${formatDate(prestamo.fechaSolicitud)}</td>
                <td>${formatCurrency(prestamo.cantidadPrestamo)}</td>
                <td><span class="badge ${getColorByEstado(prestamo.estado)}">${prestamo.estado}</span></td>
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
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de préstamos por mes
function generarReportePrestamosPorMes(contenedor) {
    // Extraer datos
    const { prestamos } = reportesData;
    
    // Agrupar préstamos por mes
    const prestamosPorMes = {};
    
    prestamos.forEach(prestamo => {
        if (!prestamo.fechaSolicitud) return;
        
        const fecha = new Date(prestamo.fechaSolicitud);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
        
        if (!prestamosPorMes[clave]) {
            prestamosPorMes[clave] = {
                anio,
                mes,
                nombre: obtenerNombreMes(mes),
                cantidad: 0,
                montoTotal: 0
            };
        }
        
        prestamosPorMes[clave].cantidad++;
        prestamosPorMes[clave].montoTotal += parseFloat(prestamo.cantidadPrestamo) || 0;
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    const mesesArray = Object.values(prestamosPorMes).sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mes - a.mes;
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Préstamos por Mes</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Tabla de préstamos por mes -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Distribución Mensual de Préstamos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Año</th>
                                <th>Cantidad de Préstamos</th>
                                <th>Monto Total</th>
                                <th>Promedio por Préstamo</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada mes
    mesesArray.forEach(mes => {
        const promedio = mes.cantidad > 0 ? mes.montoTotal / mes.cantidad : 0;
        
        html += `
            <tr>
                <td>${mes.nombre}</td>
                <td>${mes.anio}</td>
                <td>${mes.cantidad}</td>
                <td>${formatCurrency(mes.montoTotal)}</td>
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
        
        <!-- Resumen estadístico -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen Estadístico</h5>
            </div>
            <div class="card-body">
    `;
    
    // Calcular estadísticas
    if (mesesArray.length > 0) {
        const totalPrestamos = mesesArray.reduce((sum, mes) => sum + mes.cantidad, 0);
        const totalMonto = mesesArray.reduce((sum, mes) => sum + mes.montoTotal, 0);
        const promedioMensual = totalPrestamos / mesesArray.length;
        const montoPromedioMensual = totalMonto / mesesArray.length;
        
        // Encontrar el mes con más préstamos
        const mesMasPrestamos = mesesArray.reduce((max, mes) => 
            mes.cantidad > max.cantidad ? mes : max, mesesArray[0]);
        
        // Encontrar el mes con más monto
        const mesMasMonto = mesesArray.reduce((max, mes) => 
            mes.montoTotal > max.montoTotal ? mes : max, mesesArray[0]);
        
        html += `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Total de Préstamos:</th>
                            <td>${totalPrestamos}</td>
                        </tr>
                        <tr>
                            <th>Promedio Mensual:</th>
                            <td>${promedioMensual.toFixed(2)} préstamos</td>
                        </tr>
                        <tr>
                            <th>Mes con más Préstamos:</th>
                            <td>${mesMasPrestamos.nombre} ${mesMasPrestamos.anio} (${mesMasPrestamos.cantidad})</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Monto Total:</th>
                            <td>${formatCurrency(totalMonto)}</td>
                        </tr>
                        <tr>
                            <th>Monto Promedio Mensual:</th>
                            <td>${formatCurrency(montoPromedioMensual)}</td>
                        </tr>
                        <tr>
                            <th>Mes con mayor Monto:</th>
                            <td>${mesMasMonto.nombre} ${mesMasMonto.anio} (${formatCurrency(mesMasMonto.montoTotal)})</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                No hay datos suficientes para generar estadísticas.
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de pagos por mes
function generarReportePagosPorMes(contenedor) {
    // Extraer datos
    const { pagos } = reportesData;
    
    // Agrupar pagos por mes
    const pagosPorMes = {};
    
    pagos.forEach(pago => {
        if (!pago.fechaPago) return;
        
        const fecha = new Date(pago.fechaPago);
        const mes = fecha.getMonth();
        const anio = fecha.getFullYear();
        const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
        
        if (!pagosPorMes[clave]) {
            pagosPorMes[clave] = {
                anio,
                mes,
                nombre: obtenerNombreMes(mes),
                cantidad: 0,
                montoTotal: 0
            };
        }
        
        pagosPorMes[clave].cantidad++;
        pagosPorMes[clave].montoTotal += parseFloat(pago.cantidadPagada) || 0;
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    const mesesArray = Object.values(pagosPorMes).sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mes - a.mes;
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Pagos por Mes</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Tabla de pagos por mes -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Distribución Mensual de Pagos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>Año</th>
                                <th>Cantidad de Pagos</th>
                                <th>Monto Total</th>
                                <th>Promedio por Pago</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada mes
    mesesArray.forEach(mes => {
        const promedio = mes.cantidad > 0 ? mes.montoTotal / mes.cantidad : 0;
        
        html += `
            <tr>
                <td>${mes.nombre}</td>
                <td>${mes.anio}</td>
                <td>${mes.cantidad}</td>
                <td>${formatCurrency(mes.montoTotal)}</td>
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
        
        <!-- Resumen estadístico -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen Estadístico</h5>
            </div>
            <div class="card-body">
    `;
    
    // Calcular estadísticas
    if (mesesArray.length > 0) {
        const totalPagos = mesesArray.reduce((sum, mes) => sum + mes.cantidad, 0);
        const totalMonto = mesesArray.reduce((sum, mes) => sum + mes.montoTotal, 0);
        const promedioMensual = totalPagos / mesesArray.length;
        const montoPromedioMensual = totalMonto / mesesArray.length;
        
        // Encontrar el mes con más pagos
        const mesMasPagos = mesesArray.reduce((max, mes) => 
            mes.cantidad > max.cantidad ? mes : max, mesesArray[0]);
        
        // Encontrar el mes con más monto
        const mesMasMonto = mesesArray.reduce((max, mes) => 
            mes.montoTotal > max.montoTotal ? mes : max, mesesArray[0]);
        
        html += `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Total de Pagos:</th>
                            <td>${totalPagos}</td>
                        </tr>
                        <tr>
                            <th>Promedio Mensual:</th>
                            <td>${promedioMensual.toFixed(2)} pagos</td>
                        </tr>
                        <tr>
                            <th>Mes con más Pagos:</th>
                            <td>${mesMasPagos.nombre} ${mesMasPagos.anio} (${mesMasPagos.cantidad})</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Monto Total:</th>
                            <td>${formatCurrency(totalMonto)}</td>
                        </tr>
                        <tr>
                            <th>Monto Promedio Mensual:</th>
                            <td>${formatCurrency(montoPromedioMensual)}</td>
                        </tr>
                        <tr>
                            <th>Mes con mayor Monto:</th>
                            <td>${mesMasMonto.nombre} ${mesMasMonto.anio} (${formatCurrency(mesMasMonto.montoTotal)})</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                No hay datos suficientes para generar estadísticas.
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de clientes activos
function generarReporteClientesActivos(contenedor) {
    // Extraer datos
    const { clientes, prestamos } = reportesData;
    
    // Filtrar clientes activos
    const clientesActivos = clientes.filter(c => c.estado === 'Activo');
    
    // Crear mapa para contar préstamos por cliente
    const prestamosPorCliente = {};
    prestamos.forEach(prestamo => {
        if (!prestamosPorCliente[prestamo.clienteId]) {
            prestamosPorCliente[prestamo.clienteId] = {
                total: 0,
                activos: 0,
                montoTotal: 0
            };
        }
        
        prestamosPorCliente[prestamo.clienteId].total++;
        if (prestamo.estado === 'Activo') {
            prestamosPorCliente[prestamo.clienteId].activos++;
            prestamosPorCliente[prestamo.clienteId].montoTotal += parseFloat(prestamo.cantidadPrestamo) || 0;
        }
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Clientes Activos</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Resumen -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen de Clientes</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr>
                                <th>Total de Clientes:</th>
                                <td>${clientes.length}</td>
                            </tr>
                            <tr>
                                <th>Clientes Activos:</th>
                                <td>${clientesActivos.length}</td>
                            </tr>
                            <tr>
                                <th>Clientes Inactivos:</th>
                                <td>${clientes.length - clientesActivos.length}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-info">
                            <strong>${Math.round((clientesActivos.length / clientes.length) * 100)}%</strong> de los clientes están activos.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tabla de clientes activos -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Listado de Clientes Activos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Documento</th>
                                <th>Contacto</th>
                                <th>Préstamos</th>
                                <th>Préstamos Activos</th>
                                <th>Monto Actual</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada cliente activo
    clientesActivos.forEach(cliente => {
        const prestamosCliente = prestamosPorCliente[cliente.clienteId] || { total: 0, activos: 0, montoTotal: 0 };
        
        html += `
            <tr>
                <td>${cliente.nombreCompleto}</td>
                <td>${cliente.tipoDocumento}: ${cliente.numeroDocumento}</td>
                <td>
                    <i class="fas fa-phone-alt me-1"></i> ${cliente.telefono}<br>
                    <i class="fas fa-envelope me-1"></i> ${cliente.correoElectronico || 'N/A'}
                </td>
                <td>${prestamosCliente.total}</td>
                <td>${prestamosCliente.activos}</td>
                <td>${formatCurrency(prestamosCliente.montoTotal)}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Análisis de actividad -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Análisis de Actividad</h5>
            </div>
            <div class="card-body">
    `;
    
    // Calcular estadísticas de actividad
    if (clientesActivos.length > 0) {
        // Contar clientes con préstamos activos
        const clientesConPrestamosActivos = clientesActivos.filter(
            cliente => (prestamosPorCliente[cliente.clienteId]?.activos || 0) > 0
        ).length;
        
        // Calcular promedio de préstamos por cliente activo
        const promedioPrestamos = clientesActivos.reduce(
            (sum, cliente) => sum + (prestamosPorCliente[cliente.clienteId]?.total || 0), 
            0
        ) / clientesActivos.length;
        
        // Calcular monto promedio
        const montoPromedio = clientesActivos.reduce(
            (sum, cliente) => sum + (prestamosPorCliente[cliente.clienteId]?.montoTotal || 0), 
            0
        ) / clientesActivos.length;
        
        html += `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr>
                            <th>Clientes con Préstamos Activos:</th>
                            <td>${clientesConPrestamosActivos} (${Math.round((clientesConPrestamosActivos / clientesActivos.length) * 100)}%)</td>
                        </tr>
                        <tr>
                            <th>Promedio de Préstamos por Cliente:</th>
                            <td>${promedioPrestamos.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <th>Monto Promedio por Cliente:</th>
                            <td>${formatCurrency(montoPromedio)}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <div class="alert alert-success">
                        <strong>${clientesConPrestamosActivos}</strong> de ${clientesActivos.length} clientes activos tienen préstamos vigentes.
                    </div>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                No hay clientes activos para analizar.
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de préstamos por monto
function generarReportePrestamosXMonto(contenedor) {
    // Extraer datos
    const { prestamos, clientes } = reportesData;
    
    // Crear mapa de clientes para acceso rápido
    const clientesMap = {};
    clientes.forEach(cliente => {
        clientesMap[cliente.clienteId] = cliente;
    });
    
    // Definir rangos de montos
    const rangos = [
        { min: 0, max: 5000, nombre: "Hasta $5,000", count: 0, total: 0, lista: [] },
        { min: 5000, max: 10000, nombre: "$5,000 - $10,000", count: 0, total: 0, lista: [] },
        { min: 10000, max: 20000, nombre: "$10,000 - $20,000", count: 0, total: 0, lista: [] },
        { min: 20000, max: 50000, nombre: "$20,000 - $50,000", count: 0, total: 0, lista: [] },
        { min: 50000, max: Infinity, nombre: "Más de $50,000", count: 0, total: 0, lista: [] }
    ];
    
    // Clasificar préstamos por rango
    prestamos.forEach(prestamo => {
        const monto = parseFloat(prestamo.cantidadPrestamo) || 0;
        
        for (const rango of rangos) {
            if (monto > rango.min && monto <= rango.max) {
                rango.count++;
                rango.total += monto;
                rango.lista.push({
                    ...prestamo,
                    cliente: clientesMap[prestamo.clienteId]?.nombreCompleto || 'Cliente desconocido'
                });
                break;
            }
        }
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Préstamos por Monto</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Distribución por rangos -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Distribución por Rango de Montos</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Rango</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                                <th>Monto Total</th>
                                <th>Promedio</th>
                                <th>Distribución</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada rango
    rangos.forEach(rango => {
        const porcentaje = prestamos.length > 0 ? (rango.count / prestamos.length) * 100 : 0;
        const promedio = rango.count > 0 ? rango.total / rango.count : 0;
        
        html += `
            <tr>
                <td>${rango.nombre}</td>
                <td>${rango.count}</td>
                <td>${porcentaje.toFixed(2)}%</td>
                <td>${formatCurrency(rango.total)}</td>
                <td>${formatCurrency(promedio)}</td>
                <td>
                    <div class="progress">
                        <div class="progress-bar bg-info" 
                             role="progressbar" 
                             style="width: ${porcentaje}%" 
                             aria-valuenow="${porcentaje}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
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
    `;
    
    // Crear sección para cada rango con sus préstamos
    rangos.forEach(rango => {
        if (rango.count === 0) return; // Omitir rangos vacíos
        
        html += `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Préstamos: ${rango.nombre}</h5>
                    <span class="badge bg-info">${rango.count} préstamos</span>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        // Limitar a 10 préstamos por rango para no saturar el reporte
        const prestamosToShow = rango.lista.slice(0, 10);
        
        prestamosToShow.forEach(prestamo => {
            html += `
                <tr>
                    <td>${prestamo.prestamoId.substring(0, 8)}...</td>
                    <td>${prestamo.cliente}</td>
                    <td>${formatDate(prestamo.fechaSolicitud)}</td>
                    <td>${formatCurrency(prestamo.cantidadPrestamo)}</td>
                    <td><span class="badge ${getColorByEstado(prestamo.estado)}">${prestamo.estado}</span></td>
                </tr>
            `;
        });
        
        // Mostrar mensaje si hay más préstamos
        if (rango.lista.length > 10) {
            html += `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        ... y ${rango.lista.length - 10} préstamos más en este rango
                    </td>
                </tr>
            `;
        }
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Generar reporte de préstamos vencidos
function generarReportePrestamosVencidos(contenedor) {
    // Extraer datos
    const { prestamos, clientes, pagos } = reportesData;
    
    // Crear mapa de clientes para acceso rápido
    const clientesMap = {};
    clientes.forEach(cliente => {
        clientesMap[cliente.clienteId] = cliente;
    });
    
    // Crear mapa de pagos por préstamo para acceso rápido
    const pagosPorPrestamo = {};
    pagos.forEach(pago => {
        if (!pagosPorPrestamo[pago.prestamoId]) {
            pagosPorPrestamo[pago.prestamoId] = [];
        }
        pagosPorPrestamo[pago.prestamoId].push(pago);
    });
    
    // Fecha actual para comparar vencimientos
    const hoy = new Date();
    
    // Función para determinar si un préstamo tiene cuotas vencidas
    function tieneVencimientos(prestamo) {
        if (prestamo.estado !== 'Activo' || !prestamo.tablaAmortizacion) return false;
        
        // Verificar si hay cuotas vencidas
        return prestamo.tablaAmortizacion.some(cuota => {
            if (cuota.pagado) return false;
            
            const fechaCuota = new Date(cuota.fechaPago);
            return fechaCuota < hoy;
        });
    }
    
    // Identificar préstamos vencidos
    const prestamosVencidos = prestamos.filter(tieneVencimientos);
    
    // Organizar por días de vencimiento
    const categorias = [
        { nombre: "Vencidos (1-30 días)", lista: [], color: "warning" },
        { nombre: "Vencidos (31-60 días)", lista: [], color: "danger" },
        { nombre: "Vencidos (61-90 días)", lista: [], color: "danger" },
        { nombre: "Vencidos (más de 90 días)", lista: [], color: "dark" }
    ];
    
    prestamosVencidos.forEach(prestamo => {
        // Encontrar la cuota vencida más antigua
        let cuotaMasAntigua = null;
        let diasVencidos = 0;
        
        prestamo.tablaAmortizacion.forEach(cuota => {
            if (cuota.pagado) return;
            
            const fechaCuota = new Date(cuota.fechaPago);
            if (fechaCuota < hoy) {
                const diasDif = Math.floor((hoy - fechaCuota) / (1000 * 60 * 60 * 24));
                
                if (cuotaMasAntigua === null || diasDif > diasVencidos) {
                    cuotaMasAntigua = cuota;
                    diasVencidos = diasDif;
                }
            }
        });
        
        // Agregar a la categoría correspondiente
        const prestamoConDatos = {
            ...prestamo,
            cliente: clientesMap[prestamo.clienteId],
            diasVencidos,
            cuotaVencida: cuotaMasAntigua
        };
        
        if (diasVencidos <= 30) {
            categorias[0].lista.push(prestamoConDatos);
        } else if (diasVencidos <= 60) {
            categorias[1].lista.push(prestamoConDatos);
        } else if (diasVencidos <= 90) {
            categorias[2].lista.push(prestamoConDatos);
        } else {
            categorias[3].lista.push(prestamoConDatos);
        }
    });
    
    // Generar HTML del reporte
    let html = `
        <div class="report-header mb-4">
            <h3>Préstamos Vencidos</h3>
            <p class="text-muted">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Resumen de vencidos -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Resumen de Vencimientos</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-sm">
                            <tr>
                                <th>Total de Préstamos:</th>
                                <td>${prestamos.length}</td>
                            </tr>
                            <tr>
                                <th>Préstamos Activos:</th>
                                <td>${prestamos.filter(p => p.estado === 'Activo').length}</td>
                            </tr>
                            <tr>
                                <th>Préstamos Vencidos:</th>
                                <td>${prestamosVencidos.length}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <div class="alert ${prestamosVencidos.length > 0 ? 'alert-danger' : 'alert-success'}">
                            <strong>${Math.round((prestamosVencidos.length / prestamos.filter(p => p.estado === 'Activo').length) * 100) || 0}%</strong> 
                            de los préstamos activos tienen cuotas vencidas.
                        </div>
                    </div>
                </div>
                
                <!-- Distribución por categoría -->
                <div class="table-responsive mt-3">
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Agregar filas para cada categoría
    categorias.forEach(categoria => {
        const porcentaje = prestamosVencidos.length > 0 ? 
            (categoria.lista.length / prestamosVencidos.length) * 100 : 0;
        
        html += `
            <tr>
                <td>
                    <span class="badge bg-${categoria.color}">${categoria.nombre}</span>
                </td>
                <td>${categoria.lista.length}</td>
                <td>${porcentaje.toFixed(2)}%</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar secciones por categoría de vencimiento
    categorias.forEach(categoria => {
        if (categoria.lista.length === 0) return; // Omitir categorías vacías
        
        html += `
            <div class="card mb-4">
                <div class="card-header bg-${categoria.color} text-white">
                    <h5 class="card-title mb-0">${categoria.nombre}</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Préstamo</th>
                                    <th>Monto</th>
                                    <th>Cuota Vencida</th>
                                    <th>Días Vencidos</th>
                                    <th>Contacto</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        // Ordenar por días de vencimiento (más vencidos primero)
        const prestamosOrdenados = [...categoria.lista].sort((a, b) => b.diasVencidos - a.diasVencidos);
        
        prestamosOrdenados.forEach(prestamo => {
            html += `
                <tr>
                    <td>${prestamo.cliente?.nombreCompleto || 'Cliente desconocido'}</td>
                    <td>${prestamo.prestamoId.substring(0, 8)}...</td>
                    <td>${formatCurrency(prestamo.cantidadPrestamo)}</td>
                    <td>${formatCurrency(prestamo.cuotaVencida?.cuotaMensual || 0)}</td>
                    <td><span class="badge bg-${categoria.color}">${prestamo.diasVencidos} días</span></td>
                    <td>
                        <i class="fas fa-phone-alt me-1"></i> ${prestamo.cliente?.telefono || 'N/A'}<br>
                        <i class="fas fa-envelope me-1"></i> ${prestamo.cliente?.correoElectronico || 'N/A'}
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
        `;
    });
    
    // Si no hay préstamos vencidos, mostrar mensaje
    if (prestamosVencidos.length === 0) {
        html += `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        No hay préstamos con cuotas vencidas.
                    </div>
                </div>
            </div>
        `;
    }
    
    // Insertar HTML en el contenedor
    contenedor.innerHTML = html;
}

// Obtener nombre del mes a partir del número
function obtenerNombreMes(numeroMes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return meses[numeroMes] || '';
}

// Obtener color según el estado del préstamo
function getColorByEstado(estado) {
    switch (estado) {
        case 'Activo':
            return 'bg-success';
        case 'Pagado':
            return 'bg-primary';
        case 'Cancelado':
            return 'bg-danger';
        case 'Vencido':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// Formatear fecha
function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) return 'Fecha inválida';
    
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formatear moneda
function formatCurrency(amount) {
    if (isNaN(amount)) return '$0.00';
    
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Almacenamiento central de datos para reportes
const reportesData = {
    prestamos: [],
    clientes: [],
    pagos: [],
    dataLoaded: false
};

// Cargar datos para los reportes
async function cargarDatosReportes() {
    if (reportesData.dataLoaded) {
        console.log('Datos ya cargados, usando caché');
        return reportesData;
    }
    
    console.log('Cargando datos para reportes...');
    
    try {
        // Mostrar indicador de carga
        const reporteContenido = document.getElementById('reporteContenido');
        if (reporteContenido) {
            reporteContenido.innerHTML = `
                <div class="d-flex justify-content-center align-items-center my-5">
                    <div class="spinner-border text-primary me-3"></div>
                    <span>Cargando datos para reportes...</span>
                </div>
            `;
        }
        
        // Cargar datos en paralelo
        const [prestamosResponse, clientesResponse, pagosResponse] = await Promise.all([
            fetch('/api/prestamos'),
            fetch('/api/clientes'),
            fetch('/api/pagos')
        ]);
        
        // Verificar respuestas
        if (!prestamosResponse.ok || !clientesResponse.ok || !pagosResponse.ok) {
            throw new Error('Error al cargar datos de la API');
        }
        
        // Procesar datos
        const prestamos = await prestamosResponse.json();
        const clientes = await clientesResponse.json();
        const pagos = await pagosResponse.json();
        
        // Actualizar almacenamiento central
        reportesData.prestamos = prestamos;
        reportesData.clientes = clientes;
        reportesData.pagos = pagos;
        reportesData.dataLoaded = true;
        
        console.log('Datos cargados correctamente:', {
            prestamos: prestamos.length,
            clientes: clientes.length,
            pagos: pagos.length
        });
        
        return reportesData;
    } catch (error) {
        console.error('Error al cargar datos para reportes:', error);
        
        // Mostrar error
        const reporteContenido = document.getElementById('reporteContenido');
        if (reporteContenido) {
            reporteContenido.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error al cargar datos: ${error.message}
                    <div class="mt-3">
                        <button class="btn btn-sm btn-primary" onclick="generarReporte(document.getElementById('tipoReporte').value)">
                            Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
        
        throw error;
    }
}

// Generar reporte según el tipo seleccionado
async function generarReporte(tipo) {
    const contenedor = document.getElementById('reporteContenido');
    if (!contenedor) {
        console.error('Contenedor de reportes no encontrado');
        return;
    }
    
    // Mostrar indicador de carga
    contenedor.innerHTML = `
        <div class="d-flex justify-content-center align-items-center my-5">
            <div class="spinner-border text-primary me-3"></div>
            <span>Generando reporte ${tipo}...</span>
        </div>
    `;
    
    try {
        // Cargar datos si es necesario
        await cargarDatosReportes();
        
        // Generar reporte según el tipo
        switch (tipo) {
            case 'general':
                generarReporteGeneral(contenedor);
                break;
            case 'prestamos_mes':
                generarReportePrestamosPorMes(contenedor);
                break;
            case 'pagos_mes':
                generarReportePagosPorMes(contenedor);
                break;
            case 'clientes_activos':
                generarReporteClientesActivos(contenedor);
                break;
            case 'prestamos_monto':
                generarReportePrestamosXMonto(contenedor);
                break;
            case 'prestamos_vencidos':
                generarReportePrestamosVencidos(contenedor);
                break;
            default:
                contenedor.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Tipo de reporte no soportado: ${tipo}
                    </div>
                `;
                break;
        }
    } catch (error) {
        console.error('Error al generar reporte:', error);
        
        // Mostrar error
        contenedor.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al generar reporte: ${error.message}
                <div class="mt-3">
                    <button class="btn btn-sm btn-primary" onclick="generarReporte('${tipo}')">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

// Función de inicialización principal para el módulo de reportes
function initReportesPage() {
    console.log('Inicializando módulo de reportes...');
    
    // Configurar selector de tipo de reporte
    const tipoReporteSelect = document.getElementById('tipoReporte');
    if (tipoReporteSelect) {
        // Limpiar eventos previos
        const newSelect = tipoReporteSelect.cloneNode(true);
        if (tipoReporteSelect.parentNode) {
            tipoReporteSelect.parentNode.replaceChild(newSelect, tipoReporteSelect);
        }
        
        // Asignar evento de cambio
        newSelect.addEventListener('change', function() {
            const tipoSeleccionado = this.value;
            console.log(`Tipo de reporte seleccionado: ${tipoSeleccionado}`);
            generarReporte(tipoSeleccionado);
        });
        
        // Generar el reporte inicial
        const tipoInicial = newSelect.value;
        generarReporte(tipoInicial);
    } else {
        console.error('Selector de tipo de reporte no encontrado');
    }
    
    // Configurar botones de exportación
    setupExportButtons();
}

// Configurar botones de exportación
function setupExportButtons() {
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    
    // Configurar botón de Excel
    if (btnExportarExcel) {
        // Limpiar eventos previos
        const newBtnExcel = btnExportarExcel.cloneNode(true);
        if (btnExportarExcel.parentNode) {
            btnExportarExcel.parentNode.replaceChild(newBtnExcel, btnExportarExcel);
        }
        
        // Asignar evento de clic
        newBtnExcel.addEventListener('click', function() {
            exportarReporteActual('excel');
        });
    }
    
    // Configurar botón de PDF
    if (btnExportarPDF) {
        // Limpiar eventos previos
        const newBtnPDF = btnExportarPDF.cloneNode(true);
        if (btnExportarPDF.parentNode) {
            btnExportarPDF.parentNode.replaceChild(newBtnPDF, btnExportarPDF);
        }
        
        // Asignar evento de clic
        newBtnPDF.addEventListener('click', function() {
            exportarReporteActual('pdf');
        });
    }
}

// Exportar el reporte actual en el formato especificado
function exportarReporteActual(formato) {
    // Obtener tipo de reporte actual
    const tipoReporte = document.getElementById('tipoReporte')?.value || 'general';
    
    // Verificar si hay contenido para exportar
    const contenidoReporte = document.getElementById('reporteContenido');
    if (!contenidoReporte || contenidoReporte.children.length === 0) {
        console.warn('No hay contenido de reporte para exportar');
        showNotification('No hay datos para exportar', 'warning');
        return;
    }
    
    // Verificar si hay tablas para exportar (Excel necesita tablas)
    const hasTables = contenidoReporte.querySelectorAll('table').length > 0;
    if (formato === 'excel' && !hasTables) {
        showNotification('El reporte actual no contiene tablas para exportar a Excel', 'warning');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        showLoadingIndicator(`Exportando a ${formato === 'excel' ? 'Excel' : 'PDF'}...`);
        
        // Título del reporte para el archivo
        const tituloReporte = getTituloReporte(tipoReporte);
        
        // Obtener la fecha actual para el nombre del archivo
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `ALFIN_CASH_${tipoReporte}_${fechaActual}`;
        
        // Realizar la exportación según el formato
        if (formato === 'excel') {
            exportarAExcel(contenidoReporte, tituloReporte, nombreArchivo);
        } else if (formato === 'pdf') {
            exportarAPDF(contenidoReporte, tituloReporte, nombreArchivo);
        } else {
            throw new Error(`Formato de exportación no válido: ${formato}`);
        }
    } catch (error) {
        console.error(`Error al exportar a ${formato}:`, error);
        hideLoadingIndicator();
        showNotification(`Error al exportar: ${error.message}`, 'error');
    }
}

// Exportar a Excel
function exportarAExcel(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a Excel:', titulo);
    
    // Verificar si la biblioteca XLSX está disponible
    if (typeof XLSX === 'undefined') {
        throw new Error('La biblioteca XLSX no está disponible');
    }
    
    // Encontrar todas las tablas en el contenedor
    const tablas = contenedor.querySelectorAll('table');
    
    if (tablas.length === 0) {
        throw new Error('No hay tablas para exportar');
    }
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Agregar metadatos
    wb.Props = {
        Title: titulo,
        Subject: "Reportes ALFIN CASH",
        Author: "Sistema de Préstamos",
        CreatedDate: new Date()
    };
    
    // Para cada tabla, crear una hoja
    tablas.forEach((tabla, index) => {
        // Encontrar un título para la hoja
        let tituloHoja = 'Datos';
        
        // Buscar un encabezado cercano para usarlo como título de la hoja
        const encabezadoCercano = findClosestHeading(tabla);
        if (encabezadoCercano) {
            tituloHoja = encabezadoCercano.textContent.trim();
        } else if (index === 0) {
            // Si es la primera tabla, usar el título del reporte
            tituloHoja = titulo;
        } else {
            // Caso contrario, usar un nombre genérico
            tituloHoja = `Datos ${index + 1}`;
        }
        
        // Limitar longitud y eliminar caracteres no válidos para nombre de hoja
        tituloHoja = tituloHoja.replace(/[*?:/\\[\]]/g, '').substring(0, 31);
        
        // Convertir tabla a arreglo de datos
        const datos = tableToArray(tabla);
        
        // Crear hoja de trabajo desde los datos
        const ws = XLSX.utils.aoa_to_sheet(datos);
        
        // Aplicar estilos a la hoja (si es posible)
        applyExcelStyles(ws, datos);
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, tituloHoja);
    });
    
    // Guardar el archivo
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    
    // Ocultar indicador de carga
    hideLoadingIndicator();
    
    // Mostrar notificación de éxito
    showNotification('Reporte exportado a Excel correctamente', 'success');
}

// Exportar a PDF
function exportarAPDF(contenedor, titulo, nombreArchivo) {
    console.log('Exportando a PDF:', titulo);
    
    // Verificar si las bibliotecas necesarias están disponibles
    if (typeof html2canvas === 'undefined') {
        throw new Error('La biblioteca html2canvas no está disponible');
    }
    
    if (typeof jspdf === 'undefined') {
        throw new Error('La biblioteca jsPDF no está disponible');
    }
    
    // Crear una copia del contenido para manipularlo sin afectar la vista
    const contenidoClonado = contenedor.cloneNode(true);
    
    // Aplicar optimizaciones de estilo para PDF
    optimizarParaPDF(contenidoClonado);
    
    // Crear elemento para encabezado personalizado
    const encabezadoPersonalizado = document.createElement('div');
    encabezadoPersonalizado.innerHTML = `
        <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; margin-bottom: 20px;">
            <h2 style="color: #4682B4; margin: 0; padding: 0;">${titulo}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">ALFIN CASH - Portal de Préstamos</p>
        </div>
    `;
    
    // Insertar encabezado al principio del contenido clonado
    contenidoClonado.insertBefore(encabezadoPersonalizado, contenidoClonado.firstChild);
    
    // Crear elemento para pie de página personalizado
    const piePersonalizado = document.createElement('div');
    piePersonalizado.innerHTML = `
        <div style="text-align: center; padding: 15px; border-top: 1px solid #dee2e6; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
                Reporte generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
            </p>
        </div>
    `;
    
    // Insertar pie de página al final del contenido clonado
    contenidoClonado.appendChild(piePersonalizado);
    
    // Aplicar un ancho fijo para mejor apariencia en PDF
    contenidoClonado.style.width = '800px';
    contenidoClonado.style.maxWidth = '800px';
    contenidoClonado.style.margin = '0 auto';
    contenidoClonado.style.padding = '20px';
    contenidoClonado.style.backgroundColor = '#ffffff';
    
    // Agregar el clon temporalmente al DOM para la captura
    contenidoClonado.style.position = 'absolute';
    contenidoClonado.style.left = '-9999px';
    document.body.appendChild(contenidoClonado);
    
    // Capturar el contenido con html2canvas
    html2canvas(contenidoClonado, {
        scale: 1.5, // Mayor calidad
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true, // Importante para evitar problemas con algunos elementos
        allowTaint: true, // Permitir elementos que pueden "manchar" el canvas
        foreignObjectRendering: false // Desactivar renderizado de objetos extraños que pueden causar problemas
    }).then(canvas => {
        // Limpiar el elemento clonado del DOM
        document.body.removeChild(contenidoClonado);
        
        // Crear documento PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Obtener dimensiones
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular la relación de aspecto
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Ajustar imagen al ancho de la página con márgenes
        const margin = 10;
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
        
        // Agregar imagen al PDF
        let yPos = margin;
        
        // Si la imagen es más alta que la página, dividirla en múltiples páginas
        if (imgHeight > (pdfHeight - (margin * 2))) {
            // Calcular la altura de imagen que cabe en una página
            const pageImgHeight = pdfHeight - (margin * 2);
            
            // Calcular cuánto representa esto de la imagen original
            const pageCanvasHeight = (pageImgHeight * canvasWidth) / imgWidth;
            
            // Calcular el número de páginas necesarias
            const numPages = Math.ceil(canvasHeight / pageCanvasHeight);
            
            // Para cada página, agregar una porción de la imagen
            for (let i = 0; i < numPages; i++) {
                // Si no es la primera página, agregar una página nueva
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Calcular qué porción de la imagen mostrar
                const srcY = i * pageCanvasHeight;
                let height = pageCanvasHeight;
                
                // Si es la última página, ajustar la altura
                if (i === numPages - 1) {
                    height = canvasHeight - srcY;
                }
                
                // Agregar la porción de imagen
                pdf.addImage(
                    imgData, 
                    'JPEG', 
                    margin, 
                    margin, 
                    imgWidth, 
                    (height * imgWidth) / canvasWidth,
                    null,
                    'MEDIUM',
                    0,
                    srcY,
                    canvasWidth,
                    height
                );
                
                // Agregar numeración de página
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Página ${i + 1} de ${numPages}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
            }
        } else {
            // Si la imagen cabe en una página, agregarla directamente
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        }
        
        // Guardar el PDF
        pdf.save(`${nombreArchivo}.pdf`);
        
        // Ocultar indicador de carga
        hideLoadingIndicator();
        
        // Mostrar notificación de éxito
        showNotification('Reporte exportado a PDF correctamente', 'success');
    }).catch(error => {
        console.error('Error al generar el PDF:', error);
        hideLoadingIndicator();
        showNotification(`Error al exportar a PDF: ${error.message}`, 'error');
    });
}

// Obtener un título descriptivo para el reporte según su tipo
function getTituloReporte(tipoReporte) {
    const titulos = {
        'general': 'Reporte General',
        'prestamos_mes': 'Préstamos por Mes',
        'pagos_mes': 'Pagos por Mes',
        'clientes_activos': 'Clientes Activos',
        'prestamos_monto': 'Préstamos por Monto',
        'prestamos_vencidos': 'Préstamos Vencidos'
    };
    
    return titulos[tipoReporte] || `Reporte - ${tipoReporte}`;
}

// Funciones utilitarias para la exportación

// Encuentra el encabezado más cercano a un elemento
function findClosestHeading(element) {
    // Buscar encabezados por encima del elemento
    let current = element;
    
    // Buscar entre hermanos anteriores
    while (current.previousElementSibling) {
        current = current.previousElementSibling;
        
        if (isHeading(current)) {
            return current;
        }
        
        // Buscar también dentro de contenedores
        const headingInside = current.querySelector('h1, h2, h3, h4, h5, h6');
        if (headingInside) {
            return headingInside;
        }
    }
    
    // Buscar en el padre
    if (element.parentElement) {
        // Primero buscar encabezados dentro del mismo padre
        const parentHeading = element.parentElement.querySelector('h1, h2, h3, h4, h5, h6');
        if (parentHeading && element.parentElement.contains(parentHeading) && 
            !element.contains(parentHeading)) {
            return parentHeading;
        }
        
        // Luego buscar arriba en la jerarquía
        return findClosestHeading(element.parentElement);
    }
    
    // Si no se encuentra nada, buscar cualquier encabezado en el contenedor del reporte
    const reporteContenido = document.getElementById('reporteContenido');
    if (reporteContenido) {
        return reporteContenido.querySelector('h1, h2, h3, h4, h5, h6');
    }
    
    return null;
}

// Verifica si un elemento es un encabezado
function isHeading(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
}

// Convierte una tabla HTML en un array de arrays para Excel
function tableToArray(table) {
    const result = [];
    
    // Obtener todas las filas
    const rows = table.querySelectorAll('tr');
    
    // Procesar cada fila
    rows.forEach(row => {
        const rowData = [];
        
        // Obtener celdas (pueden ser th o td)
        const cells = row.querySelectorAll('th, td');
        
        // Procesar cada celda
        cells.forEach(cell => {
            // Obtener el texto limpio de la celda
            let valor = cell.innerText.trim();
            
            // Si hay un colspan, repetir el valor
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            
            // Intentar convertir a número si parece un valor numérico
            if (/^[+-]?\d+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor);
            }
            
            // Si parece ser un valor monetario, extraer el número
            if (/^\$[\d,]+(\.\d+)?$/.test(valor)) {
                valor = parseFloat(valor.replace(/[$,]/g, ''));
            }
            
            // Agregar el valor (repetido si hay colspan)
            for (let i = 0; i < colspan; i++) {
                rowData.push(valor);
            }
        });
        
        if (rowData.length > 0) {
            result.push(rowData);
        }
    });
    
    return result;
}

// Aplica estilos a una hoja de Excel
function applyExcelStyles(worksheet, data) {
    // Calcular ancho basado en el contenido
    if (data.length > 0) {
        // Inicializar con la longitud de la primera fila
        const colWidths = [];
        for (let i = 0; i < data[0].length; i++) {
            colWidths[i] = 10; // Ancho mínimo
        }
        
        // Ajustar según contenido
        data.forEach(row => {
            row.forEach((cell, i) => {
                if (cell !== null && cell !== undefined) {
                    const length = String(cell).length;
                    colWidths[i] = Math.max(colWidths[i], Math.min(50, length + 2)); // Máximo 50 caracteres
                }
            });
        });
        
        // Intentar aplicar los anchos (depende de la versión de XLSX)
        if (worksheet['!cols'] === undefined) {
            worksheet['!cols'] = [];
        }
        
        colWidths.forEach((width, i) => {
            worksheet['!cols'][i] = { wch: width };
        });
    }
}

// Aplica optimizaciones al contenido para mejorar su apariencia en PDF
function optimizarParaPDF(contenido) {
    // Mejorar la apariencia de las tablas
    const tablas = contenido.querySelectorAll('table');
    tablas.forEach(tabla => {
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        tabla.style.marginBottom = '20px';
        tabla.style.fontSize = '12px';
        
        // Estilizar celdas
        const celdas = tabla.querySelectorAll('th, td');
        celdas.forEach(celda => {
            celda.style.border = '1px solid #dee2e6';
            celda.style.padding = '8px';
            celda.style.textAlign = celda.style.textAlign || 'left';
        });
        
        // Estilizar encabezados
        const encabezados = tabla.querySelectorAll('th');
        encabezados.forEach(encabezado => {
            encabezado.style.backgroundColor = '#f8f9fa';
            encabezado.style.borderBottom = '2px solid #dee2e6';
            encabezado.style.fontWeight = 'bold';
        });
        
        // Estilizar filas alternas para mejor legibilidad
        const filas = tabla.querySelectorAll('tbody tr');
        filas.forEach((fila, index) => {
            if (index % 2 === 1) {
                fila.style.backgroundColor = '#f9f9f9';
            }
        });
    });
    
    // Mejorar apariencia de títulos
    const titulos = contenido.querySelectorAll('h1, h2, h3, h4, h5, h6');
    titulos.forEach(titulo => {
        titulo.style.color = '#495057';
        titulo.style.marginBottom = '15px';
        titulo.style.pageBreakAfter = 'avoid';
    });
    
    // Mejorar apariencia de alertas
    const alertas = contenido.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        alerta.style.padding = '15px';
        alerta.style.marginBottom = '20px';
        alerta.style.border = '1px solid transparent';
        alerta.style.borderRadius = '5px';
        
        // Ajustar colores según el tipo de alerta
        if (alerta.classList.contains('alert-info')) {
            alerta.style.backgroundColor = '#d1ecf1';
            alerta.style.borderColor = '#bee5eb';
            alerta.style.color = '#0c5460';
        } else if (alerta.classList.contains('alert-warning')) {
            alerta.style.backgroundColor = '#fff3cd';
            alerta.style.borderColor = '#ffeeba';
            alerta.style.color = '#856404';
        } else if (alerta.classList.contains('alert-danger')) {
            alerta.style.backgroundColor = '#f8d7da';
            alerta.style.borderColor = '#f5c6cb';
            alerta.style.color = '#721c24';
        } else if (alerta.classList.contains('alert-success')) {
            alerta.style.backgroundColor = '#d4edda';
            alerta.style.borderColor = '#c3e6cb';
            alerta.style.color = '#155724';
        }
    });
    
    // Ocultar botones u otros elementos interactivos
    const elementos = contenido.querySelectorAll('button, .btn, input[type="button"]');
    elementos.forEach(elemento => {
        elemento.style.display = 'none';
    });
    
    // Mejorar apariencia de badges
    const badges = contenido.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.style.display = 'inline-block';
        badge.style.padding = '5px 8px';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.textAlign = 'center';
        badge.style.whiteSpace = 'nowrap';
        badge.style.borderRadius = '10px';
        
        // Ajustar colores según el tipo de badge
        if (badge.classList.contains('bg-success')) {
            badge.style.backgroundColor = '#28a745';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-danger')) {
            badge.style.backgroundColor = '#dc3545';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-warning')) {
            badge.style.backgroundColor = '#ffc107';
            badge.style.color = 'black';
        } else if (badge.classList.contains('bg-info')) {
            badge.style.backgroundColor = '#17a2b8';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-primary')) {
            badge.style.backgroundColor = '#007bff';
            badge.style.color = 'white';
        } else if (badge.classList.contains('bg-secondary')) {
            badge.style.backgroundColor = '#6c757d';
            badge.style.color = 'white';
        }
    });
}

// Muestra un indicador de carga durante la exportación
function showLoadingIndicator(message) {
    // Verificar si ya existe un indicador
    let loadingIndicator = document.getElementById('exportLoadingIndicator');
    
    if (!loadingIndicator) {
        // Crear elemento de indicador
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'exportLoadingIndicator';
        loadingIndicator.className = 'loading-overlay';
        loadingIndicator.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="loading-message mt-2">${message || 'Procesando...'}</p>
            </div>
        `;
        
        // Agregar estilos
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.zIndex = '9999';
        
        // Estilos para el contenido
        const loadingContent = loadingIndicator.querySelector('.loading-content');
        loadingContent.style.backgroundColor = '#ffffff';
        loadingContent.style.padding = '20px 30px';
        loadingContent.style.borderRadius = '5px';
        loadingContent.style.textAlign = 'center';
        loadingContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        
        // Agregar al DOM
        document.body.appendChild(loadingIndicator);
    } else {
        // Actualizar mensaje si ya existe
        const messageElement = loadingIndicator.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message || 'Procesando...';
        }
        
        // Mostrar indicador
        loadingIndicator.style.display = 'flex';
    }
}

// Oculta el indicador de carga
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('exportLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Muestra una notificación en la interfaz
function showNotification(message, type = 'info') {
    // Crear un ID único para esta notificación para evitar confusiones
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Verificar si existe la función global que no sea esta misma
    if (typeof window.globalShowNotification === 'function') {
        window.globalShowNotification(message, type);
        return;
    }
    
    // Implementación local
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
        <div class="toast-header">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' || type === 'danger' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <strong class="me-auto">ALFIN CASH</strong>
            <button type="button" class="btn-close" aria-label="Cerrar"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Agregar estilos
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.width = '350px';
    notification.style.backgroundColor = '#fff';
    notification.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
    notification.style.borderRadius = '0.25rem';
    notification.style.zIndex = '1050';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease';
    
    // Estilo por tipo
    if (type === 'success') {
        notification.style.borderLeft = '4px solid #28a745';
    } else if (type === 'error' || type === 'danger') {
        notification.style.borderLeft = '4px solid #dc3545';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid #ffc107';
    } else {
        notification.style.borderLeft = '4px solid #17a2b8';
    }
    
    // Agregar al cuerpo del documento
    document.body.appendChild(notification);
    
    // Configurar botón de cierre
    const closeBtn = notification.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.getElementById(notificationId)) {
                    document.getElementById(notificationId).remove();
                }
            }, 300);
        });
    }
    
    // Mostrar con animación
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        // Verificar que la notificación todavía existe
        const notificationElement = document.getElementById(notificationId);
        if (notificationElement) {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateY(-20px)';
            
            // Eliminar del DOM después de la animación
            setTimeout(() => {
                if (document.getElementById(notificationId)) {
                    document.getElementById(notificationId).remove();
                }
            }, 300);
        }
    }, 5000);
}

// Integración con el sistema de reportes existente

// Comprobar si estamos en la página de reportes
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de reportes
    const esReportesPage = window.location.href.includes('reportes') || 
                          document.getElementById('reportes')?.classList.contains('active') ||
                          window.currentPage === 'reportes';
    
    if (esReportesPage) {
        console.log('Página de reportes detectada, inicializando sistema de reportes V2...');
        
        // Comprobar si las bibliotecas necesarias están disponibles
        checkRequiredLibraries()
            .then(() => {
                console.log('Bibliotecas necesarias disponibles, inicializando reportes...');
                
                // Si todo está bien, iniciar la aplicación
                setTimeout(initReportesPage, 500);
            })
            .catch(error => {
                console.error('Error al inicializar sistema de reportes:', error);
                
                // Mostrar error
                const reporteContenido = document.getElementById('reporteContenido');
                if (reporteContenido) {
                    reporteContenido.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>Atención:</strong> ${error.message}
                            <p class="mt-2">Algunas funcionalidades de reportes pueden estar limitadas.</p>
                        </div>
                    `;
                }
                
                // Intentar inicializar con funcionalidad limitada
                attemptLimitedInitialization();
            });
    }
});

// Verificar que las bibliotecas necesarias estén disponibles
function checkRequiredLibraries() {
    return new Promise((resolve, reject) => {
        const missingLibraries = [];
        
        // Verificar bibliotecas para Excel
        if (typeof XLSX === 'undefined') {
            missingLibraries.push('XLSX (para exportación a Excel)');
        }
        
        // Verificar bibliotecas para PDF
        if (typeof html2canvas === 'undefined') {
            missingLibraries.push('html2canvas (para exportación a PDF)');
        }
        
        if (typeof jspdf === 'undefined') {
            missingLibraries.push('jsPDF (para exportación a PDF)');
        }
        
        // Si faltan bibliotecas, intentar cargarlas
        if (missingLibraries.length > 0) {
            console.warn(`Faltan bibliotecas: ${missingLibraries.join(', ')}`);
            
            // Intentar cargar bibliotecas faltantes
            loadMissingLibraries(missingLibraries)
                .then(() => resolve())
                .catch(error => {
                    reject(new Error(`No se pudieron cargar todas las bibliotecas necesarias. Las exportaciones pueden no funcionar correctamente.`));
                });
        } else {
            resolve();
        }
    });
}

// Cargar bibliotecas faltantes
function loadMissingLibraries(libraries) {
    return new Promise((resolve, reject) => {
        const libraryUrls = {
            'XLSX (para exportación a Excel)': 'https://cdn.jsdelivr.net/npm/xlsx@0.18.0/dist/xlsx.full.min.js',
            'html2canvas (para exportación a PDF)': 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.5.0-beta4/html2canvas.min.js',
            'jsPDF (para exportación a PDF)': 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        };
        
        const loadPromises = libraries.map(lib => {
            return new Promise((resolveLib, rejectLib) => {
                const script = document.createElement('script');
                script.src = libraryUrls[lib];
                script.async = true;
                
                script.onload = () => {
                    console.log(`Biblioteca ${lib} cargada correctamente`);
                    resolveLib();
                };
                
                script.onerror = () => {
                    console.error(`Error al cargar la biblioteca ${lib}`);
                    rejectLib(new Error(`No se pudo cargar ${lib}`));
                };
                
                document.head.appendChild(script);
            });
        });
        
        // Intentar cargar todas las bibliotecas
        Promise.all(loadPromises)
            .then(() => resolve())
            .catch(error => reject(error));
    });
}

// Inicialización con funcionalidad limitada
function attemptLimitedInitialization() {
    console.log('Iniciando sistema de reportes con funcionalidad limitada...');
    
    // Configurar selector de tipo de reporte
    const tipoReporteSelect = document.getElementById('tipoReporte');
    if (tipoReporteSelect) {
        // Limpiar eventos previos
        const newSelect = tipoReporteSelect.cloneNode(true);
        if (tipoReporteSelect.parentNode) {
            tipoReporteSelect.parentNode.replaceChild(newSelect, tipoReporteSelect);
        }
        
        // Asignar evento de cambio
        newSelect.addEventListener('change', function() {
            const tipoSeleccionado = this.value;
            console.log(`Tipo de reporte seleccionado: ${tipoSeleccionado}`);
            generarReporte(tipoSeleccionado);
        });
        
        // Generar el reporte inicial
        const tipoInicial = newSelect.value;
        generarReporte(tipoInicial);
    }
    
    // Configurar botones de exportación con mensaje de advertencia
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function() {
            showNotification('La exportación a Excel no está disponible porque faltan algunas bibliotecas necesarias', 'warning');
        });
    }
    
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function() {
            showNotification('La exportación a PDF no está disponible porque faltan algunas bibliotecas necesarias', 'warning');
        });
    }
}

// Exponer funciones a nivel global para ser usadas desde otros módulos
window.generarReporte = generarReporte;
window.exportarReporteActual = exportarReporteActual;
window.initReportesPage = initReportesPage;
window.reportesV2 = {
    init: initReportesPage,
    generar: generarReporte,
    exportar: exportarReporteActual,
    data: reportesData
};