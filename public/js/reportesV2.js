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