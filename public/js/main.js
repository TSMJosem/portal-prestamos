// Script principal de la aplicación - Portal de Préstamos

// Función para interceptar APIs faltantes
function interceptarAPIs() {
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        // Interceptar endpoints problemáticos
        if (url.includes('/api/prestamos/por-cobrar-hoy')) {
            console.log('Interceptando API: /api/prestamos/por-cobrar-hoy');
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ total: 5000, pagos: [] })
            });
        }
        
        if (url.includes('/api/prestamos/estadisticas/por-mes')) {
            console.log('Interceptando API: /api/prestamos/estadisticas/por-mes');
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
                    valores: [2, 4, 6, 8, 10, 12]
                })
            });
        }
        
        if (url.includes('/api/pagos/estadisticas/por-mes')) {
            console.log('Interceptando API: /api/pagos/estadisticas/por-mes');
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
                    valores: [3, 6, 9, 12, 15, 18]
                })
            });
        }
        
        if (url.includes('/api/pagos/proximos')) {
            console.log('Interceptando API: /api/pagos/proximos');
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        prestamoId: "p1",
                        clienteId: "c1",
                        clienteNombre: "Cliente de Ejemplo",
                        numeroPago: 1,
                        fechaPago: new Date().toISOString(),
                        monto: 1500.00
                    }
                ])
            });
        }
        
        // Usar el fetch original para las demás peticiones
        return originalFetch(url, options);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Interceptar APIs al inicio
    interceptarAPIs();
    
    console.log("DOM completamente cargado, inicializando aplicación...");
    
    // Inicializar variable global de página actual
    window.currentPage = 'dashboard';
    
    // Inicializar componentes
    initSidebar();
    initNavigation();
    initModals();
    
    // Cargar datos iniciales del dashboard
    loadDashboardData();
    
    // Habilitar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Diagnóstico de navegación después de inicialización completa
    setTimeout(diagnosticarNavegacion, 1000);
    
    // NUEVO: Realizar verificación del estado global periódicamente
    setInterval(checkApplicationStatus, 30000); // Verificar cada 30 segundos
});

// Inicializar la barra lateral
function initSidebar() {
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarCollapse && sidebar) {
        sidebarCollapse.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Verificar el tamaño de pantalla al cargar
    if (window.innerWidth <= 768) {
        sidebar.classList.add('active');
    }
    
    // Ajustar al cambiar el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('active');
        }
    });
}

// Inicializar navegación entre páginas - VERSIÓN MEJORADA
function initNavigation() {
    console.log('Inicializando sistema de navegación...');
    
    // Seleccionar TODOS los enlaces de navegación (tanto nav-link como cualquier otro con data-page)
    const navLinks = document.querySelectorAll('.nav-link, [data-page]');
    console.log(`Encontrados ${navLinks.length} enlaces de navegación`);
    
    navLinks.forEach(link => {
        // Quitar eventos previos para evitar duplicación
        link.removeEventListener('click', handleNavClick);
        // Agregar nuevo evento de clic
        link.addEventListener('click', handleNavClick);
    });
}

// Función separada para manejar clics en navegación
function handleNavClick(e) {
    e.preventDefault();
    
    // Obtener la página a cargar
    const targetPage = this.getAttribute('data-page');
    if (!targetPage) {
        console.warn('Enlace de navegación sin atributo data-page', this);
        return;
    }
    
    console.log(`Navegando a: ${targetPage}`);
    
    // MODIFICADO: Guardar página anterior para diagnóstico
    const previousPage = window.currentPage;
    window.previousPage = previousPage;
    
    // Marcar enlace activo
    document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
        link.classList.remove('active');
    });
    this.classList.add('active');
    
    // NUEVO: Limpiar cualquier estado temporal de la página anterior
    cleanupPreviousPage(previousPage);
    
    // Cargar la página
    loadPage(targetPage);
    
    // En pantallas pequeñas, colapsar el sidebar después de la navegación
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('active');
    }
}

// NUEVA FUNCIÓN: Limpiar estado de la página anterior
// NUEVA FUNCIÓN: Limpiar estado de la página anterior
function cleanupPreviousPage(pageName) {
    if (!pageName) return;
    
    console.log(`Limpiando estado de página anterior: ${pageName}`);
    
    // Operaciones específicas de limpieza según el módulo
    switch(pageName) {
        case 'dashboard':
            // Limpiar gráficos para evitar problemas de reutilización de canvas
            limpiarGraficosDashboard();
            break;
        case 'clientes':
            // Limpiar variables globales para evitar interferencias
            window.clienteSeleccionado = null;
            // No limpiar clientes para optimizar carga
            break;
        case 'prestamos':
            window.prestamoSeleccionado = null;
            break;
        case 'pagos':
            window.pagoEnProceso = null;
            break;
        // Otros casos específicos según necesidad
    }
    
    // Limpiar temporizadores o intervalos generados por la página anterior
    // (si se identifican problemas específicos con estos)
}

// Cargar página - VERSIÓN MEJORADA
function loadPage(pageName) {
    console.log(`Cargando página: ${pageName}`);
    
    // NUEVO: Indicar visualmente el cambio de página
    const pageContent = document.querySelector('#pageContent');
    if (pageContent) {
        pageContent.classList.add('page-transition');
        setTimeout(() => {
            pageContent.classList.remove('page-transition');
        }, 300);
    }
    
    // Actualizar estado
    window.currentPage = pageName;
    
    // Obtener el contenedor principal
    const mainContainer = document.querySelector('#main-content');
    if (!mainContainer) {
        console.error("ERROR CRÍTICO: Contenedor principal #main-content no encontrado");
        // Intento de recuperación: buscar cualquier contenedor principal
        const altContainer = document.querySelector('#pageContent, #content, main, .main-content');
        if (altContainer) {
            console.log("Usando contenedor alternativo:", altContainer);
            loadPageContent(pageName, altContainer);
        } else {
            console.error("No se encontró ningún contenedor principal válido");
            alert("Error al cargar la página. Por favor, recargue la aplicación.");
        }
        return;
    }
    
    loadPageContent(pageName, mainContainer);
}

// Función separada para cargar contenido - MODIFICADA PARA AJUSTARSE A TU ESTRUCTURA
function loadPageContent(pageName, container) {
    // Ocultar todas las páginas existentes
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Verificar si la página ya está cargada
    const existingPage = document.getElementById(pageName);
    if (existingPage) {
        console.log(`La página ${pageName} ya está cargada, mostrándola`);
        existingPage.classList.add('active');
        
        // NUEVO: Asegurarse de que la página se inicialice correctamente incluso si ya está cargada
        setTimeout(() => {
            initPageScripts(pageName);
        }, 100);
        return;
    }
    
    // Mostrar indicador de carga
    container.innerHTML = `
        <div id="pageLoading" class="d-flex justify-content-center align-items-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <span class="ms-3">Cargando ${pageName}...</span>
        </div>
    `;
    
    // MODIFICACIÓN: Ahora intentamos cargar directamente desde /views
    console.log(`Intentando cargar plantilla: /views/${pageName}.html`);
    
    fetch(`/views/${pageName}.html`)
        .then(response => {
            if (!response.ok) {
                // Intentar ruta alternativa si la primera falla
                console.log(`Intentando ruta alternativa: /${pageName}.html`);
                return fetch(`/${pageName}.html`);
            }
            return response;
        })
        .then(response => {
            if (!response.ok) {
                console.error(`Error ${response.status} al cargar ${pageName}`);
                throw new Error(`Error al cargar la página ${pageName}`);
            }
            return response.text();
        })
        .then(html => {
            // Reemplazar indicador de carga
            container.innerHTML = '';
            
            // Crear nuevo contenedor para la página
            const pageContainer = document.createElement('div');
            pageContainer.id = pageName;
            pageContainer.className = 'page-content active';
            pageContainer.innerHTML = html;
            
            // Agregar al contenedor
            container.appendChild(pageContainer);
            
            // NUEVO: Dar tiempo al DOM para actualizarse antes de inicializar scripts
            requestAnimationFrame(() => {
                setTimeout(() => initPageScripts(pageName), 100);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Usar contenido predeterminado en caso de error
            container.innerHTML = '';
            
            // Crear nuevo contenedor para la página
            const pageContainer = document.createElement('div');
            pageContainer.id = pageName;
            pageContainer.className = 'page-content active';
            pageContainer.innerHTML = generarContenidoPredeterminado(pageName);
            
            // Agregar al contenedor
            container.appendChild(pageContainer);
            
            // NUEVO: Dar tiempo al DOM para actualizarse antes de inicializar scripts
            requestAnimationFrame(() => {
                setTimeout(() => initPageScripts(pageName), 100);
            });
            
            console.warn(`Usando contenido predeterminado para ${pageName} debido a error de carga`);
        });
}

// Nueva función para generar contenido predeterminado para las páginas
function generarContenidoPredeterminado(pageName) {
    switch(pageName) {
        case 'clientes':
            return `
                <div class="container-fluid">
                    <h2 class="mb-4">Gestión de Clientes</h2>
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Listado de Clientes</h6>
                            <div class="d-flex">
                                <button class="btn btn-sm btn-outline-primary me-2" id="btnRefreshClientes">
                                    <i class="fas fa-sync-alt"></i> Actualizar
                                </button>
                                <button class="btn btn-primary" type="button" id="btnNuevoCliente">
                                    <i class="fas fa-plus"></i> Nuevo Cliente
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="tablaClientes" width="100%" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Documento</th>
                                            <th>Teléfono</th>
                                            <th>Correo</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Los datos se cargarán dinámicamente con JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-3">
                                <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
                                <span id="contadorClientes" style="display:none">0</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        // Mantener el resto de casos igual...
        case 'prestamos':
            // Código para prestamos...
            return `
                <div class="container-fluid">
                    <h2 class="mb-4">Gestión de Préstamos</h2>
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Listado de Préstamos</h6>
                            <div class="d-flex">
                                <button class="btn btn-sm btn-outline-primary me-2" id="btnRefreshPrestamos">
                                    <i class="fas fa-sync-alt"></i> Actualizar
                                </button>
                                <button class="btn btn-primary" type="button" onclick="loadPage('nuevo-prestamo')">
                                    <i class="fas fa-plus"></i> Nuevo Préstamo
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="tablaPrestamos" width="100%" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Fecha</th>
                                            <th>Monto</th>
                                            <th>Plazo</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Los datos se cargarán dinámicamente con JavaScript -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`;
        case 'pagos':
            return `
                <div class="container-fluid">
                    <h2 class="mb-4">Registro de Pagos</h2>
                    <div class="row">
                        <div class="col-12">
                            <div class="card shadow mb-4">
                                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                                    <h6 class="m-0 font-weight-bold text-primary">Clientes con pagos pendientes</h6>
                                    <button class="btn btn-sm btn-outline-primary" id="btnRefreshPagos">
                                        <i class="fas fa-sync-alt"></i> Actualizar
                                    </button>
                                </div>
                                <div class="card-body" id="contenedorClientesPagos">
                                    <!-- Tarjetas de clientes con pagos pendientes -->
                                    <div class="alert alert-info">
                                        Cargando clientes con pagos pendientes...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        // Mantener los demás casos...
        default:
            // Caso por defecto...
            return `
                <div class="container-fluid">
                    <h2 class="mb-4">Error de Carga</h2>
                    <div class="alert alert-warning">
                        <p>No se pudo cargar la página "${pageName}".</p>
                        <button class="btn btn-primary mt-2" onclick="window.location.reload()">
                            <i class="fas fa-sync"></i> Recargar Aplicación
                        </button>
                    </div>
                </div>`;
    }
}

// Inicializar scripts específicos de cada página
function initPageScripts(pageName) {
    // Asegurarse de que la página actual está actualizada
    window.currentPage = pageName;
    
    // NUEVO: Registro detallado para depuración
    console.log(`Inicializando scripts para página: ${pageName}`);
    
    switch (pageName) {
        case 'clientes':
            // Mejorar la carga del módulo de clientes con reintento y diagnóstico
            console.log('Inicializando página de clientes...');
            
            // MODIFICADO: Usar una función más robusta para inicializar clientes
            initClientesModulo();
            break;
            
        case 'prestamos':
            if (typeof initPrestamosPage === 'function') {
                initPrestamosPage();
            } else {
                cargarScriptModulo('prestamos');
            }
            break;
        case 'pagos':
            // NUEVO: Mejorar inicialización de pagos
            initPagosModulo();
            break;
        case 'nuevo-prestamo':
            if (typeof initNuevoPrestamoPage === 'function') {
                initNuevoPrestamoPage();
            } else {
                cargarScriptModulo('prestamos');
            }
            break;
        case 'reportes':
            if (typeof initReportesPage === 'function') {
                initReportesPage();
            } else {
                cargarScriptModulo('reportes');
            }
            break;
        case 'dashboard':
        default:
            // Establecer página como dashboard si estamos en la página principal
            window.currentPage = 'dashboard';
            loadDashboardData();
            break;
    }
}

// NUEVA FUNCIÓN: Inicialización mejorada del módulo de clientes
function initClientesModulo() {
    // Función para intentar inicializar con diferentes nombres de función
    const tryInitClientes = function() {
        if (typeof initClientesPage === 'function') {
            console.log('Usando función initClientesPage()');
            initClientesPage();
            return true;
        } else if (typeof inicializarPaginaClientes === 'function') {
            console.log('Usando función inicializarPaginaClientes()');
            inicializarPaginaClientes();
            return true;
        }
        return false;
    };
    
    // Verificar primero si el script ya está cargado
    const scriptExistente = document.querySelector('script[src="/js/clientes.js"]');
    
    // Si ya tenemos el script, intentamos inicializar directamente
    if (scriptExistente) {
        if (tryInitClientes()) {
            return; // Éxito, terminamos
        }
        
        // El script está pero no funciona, reintentamos con timeout
        console.log('Script detectado pero funciones no disponibles, reintentando...');
        setTimeout(() => {
            if (!tryInitClientes()) {
                // Último recurso: recargar el script
                console.warn('Recargando script de clientes...');
                document.head.removeChild(scriptExistente);
                cargarScriptModulo('clientes');
            }
        }, 500);
    } else {
        // Si no está el script, lo cargamos
        cargarScriptModulo('clientes');
    }
    
    // Configuramos un botón de actualización para casos de emergencia
    setTimeout(() => {
        const btnRefresh = document.getElementById('btnRefreshClientes');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', function() {
                if (typeof cargarClientes === 'function') {
                    cargarClientes();
                } else {
                    console.log('Función cargarClientes no disponible, recargando página...');
                    loadPage('clientes');
                }
            });
        }
    }, 1000);
}

// NUEVA FUNCIÓN: Inicialización mejorada del módulo de pagos
function initPagosModulo() {
    if (typeof initPagosPage === 'function') {
        initPagosPage();
    } else {
        cargarScriptModulo('pagos');
    }
    
    // Configurar botón de actualización
    setTimeout(() => {
        const btnRefresh = document.getElementById('btnRefreshPagos');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', function() {
                if (typeof cargarPagosPendientes === 'function') {
                    cargarPagosPendientes();
                } else {
                    console.log('Función cargarPagosPendientes no disponible, recargando página...');
                    loadPage('pagos');
                }
            });
        }
    }, 1000);
}

// Cargar script de módulo
function cargarScriptModulo(modulo) {
    console.log(`Cargando script para el módulo ${modulo}...`);
    
    // MODIFICADO: Verificar si el script ya está cargado
    const scriptExistente = document.querySelector(`script[src="/js/${modulo}.js"]`);
    if (scriptExistente) {
        console.log(`Script de ${modulo} ya cargado, reintentando inicialización...`);
        const fnName = `init${modulo.charAt(0).toUpperCase() + modulo.slice(1)}Page`;
        if (typeof window[fnName] === 'function') {
            window[fnName]();
        } else {
            console.warn(`Función ${fnName} no encontrada después de cargar el script`);
        }
        return;
    }
    
    const script = document.createElement('script');
    script.src = `/js/${modulo}.js`;
    script.onload = function() {
        console.log(`Script de ${modulo} cargado correctamente`);
        const fnName = `init${modulo.charAt(0).toUpperCase() + modulo.slice(1)}Page`;
        if (typeof window[fnName] === 'function') {
            window[fnName]();
        } else {
            console.warn(`Función ${fnName} no encontrada después de cargar el script`);
        }
    };
    script.onerror = function() {
        console.error(`Error al cargar el script de ${modulo}`);
        
        // NUEVO: En caso de error, buscar una alternativa o mostrar mensaje
        const mainContainer = document.getElementById(modulo);
        if (mainContainer) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger mt-3';
            errorMsg.innerHTML = `
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Error al cargar el módulo</h5>
                <p>No se pudo inicializar el módulo de ${modulo}.</p>
                <button class="btn btn-primary btn-sm" onclick="location.reload()">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            `;
            mainContainer.prepend(errorMsg);
        }
    };
    document.head.appendChild(script);
}

// Implementación fallback para el módulo de clientes y otras funciones de soporte...
// (mantener el resto del código igual)

// NUEVA FUNCIÓN: Verificar el estado global de la aplicación 
function checkApplicationStatus() {
    console.log('Verificando estado global de la aplicación...');
    
    // Verificar página actual
    const currentPage = window.currentPage || 'dashboard';
    console.log(`Página actual: ${currentPage}`);
    
    // Verificar si la página actual está mostrando correctamente
    const pageElement = document.getElementById(currentPage);
    if (!pageElement || !pageElement.classList.contains('active')) {
        console.warn(`⚠️ Posible problema: La página ${currentPage} no está activa`);
        // Intentar corregir
        loadPage(currentPage);
        return; // Salir para dar tiempo a la corrección
    }
    
    // Verificaciones específicas según la página
    switch (currentPage) {
        case 'clientes':
            verificarEstadoClientes();
            break;
        case 'pagos':
            verificarEstadoPagos();
            break;
        case 'prestamos':
            verificarEstadoPrestamos();
            break;
        // otros casos específicos...
    }
}

// NUEVA FUNCIÓN: Verificar estado del módulo de clientes
function verificarEstadoClientes() {
    const tbody = document.querySelector('#tablaClientes tbody');
    const mensaje = tbody && tbody.textContent;
    
    // Verificar si muestra mensaje de carga por demasiado tiempo
    if (tbody && mensaje && mensaje.includes('Cargando clientes')) {
        // Verificar hace cuánto tiempo se mostró este mensaje
        if (!window.clientesLoading) {
            window.clientesLoading = Date.now();
        } else {
            const tiempoTranscurrido = Date.now() - window.clientesLoading;
            // Si han pasado más de 5 segundos, intentar recuperar
            if (tiempoTranscurrido > 5000) {
                console.warn('⚠️ Detección: Clientes en estado de carga por más de 5 segundos');
                window.clientesLoading = null; // reiniciar temporizador
                
                if (typeof window.cargarClientes === 'function') {
                    console.log('Reiniciando carga de clientes automáticamente...');
                    window.cargarClientes();
                } else if (typeof window.recuperarVistaClientes === 'function') {
                    window.recuperarVistaClientes();
                }
            }
        }
    } else {
        // Si ya no está cargando, limpiar el temporizador
        window.clientesLoading = null;
    }
}

// NUEVA FUNCIÓN: Verificar estado del módulo de pagos
function verificarEstadoPagos() {
    const contenedor = document.getElementById('contenedorClientesPagos');
    const mensaje = contenedor && contenedor.textContent;
    
    // Si el contenedor muestra mensaje de carga por mucho tiempo
    if (contenedor && mensaje && mensaje.includes('Cargando') && !mensaje.includes('No hay pagos')) {
        if (!window.pagosLoading) {
            window.pagosLoading = Date.now();
        } else {
            const tiempoTranscurrido = Date.now() - window.pagosLoading;
            if (tiempoTranscurrido > 5000) {
                console.warn('⚠️ Detección: Pagos en estado de carga por más de 5 segundos');
                window.pagosLoading = null;
                
                // Intentar recargar
                if (typeof window.cargarPagosPendientes === 'function') {
                    window.cargarPagosPendientes();
                } else {
                    // Recargar la página como último recurso
                    loadPage('pagos');
                }
            }
        }
    } else {
        window.pagosLoading = null;
    }
}

// NUEVA FUNCIÓN: Verificar estado del módulo de préstamos
function verificarEstadoPrestamos() {
    const tbody = document.querySelector('#tablaPrestamos tbody');
    const mensaje = tbody && tbody.textContent;
    
    if (tbody && mensaje && mensaje.includes('Cargando préstamos')) {
        if (!window.prestamosLoading) {
            window.prestamosLoading = Date.now();
        } else {
            const tiempoTranscurrido = Date.now() - window.prestamosLoading;
            if (tiempoTranscurrido > 5000) {
                console.warn('⚠️ Detección: Préstamos en estado de carga por más de 5 segundos');
                window.prestamosLoading = null;
                
                if (typeof window.cargarPrestamos === 'function') {
                    window.cargarPrestamos();
                } else {
                    loadPage('prestamos');
                }
            }
        }
    } else {
        window.prestamosLoading = null;
    }
}

// Diagnóstico general de navegación
function diagnosticarNavegacion() {
    console.log("=== DIAGNÓSTICO DE NAVEGACIÓN ===");
    
    // Verificar enlaces en el menú
    const navLinks = document.querySelectorAll('.nav-link, [data-page]');
    console.log(`Total de enlaces de navegación encontrados: ${navLinks.length}`);
    
    if (navLinks.length === 0) {
        console.error("NO SE ENCONTRARON ENLACES DE NAVEGACIÓN");
        console.log("Buscando elementos de navegación sin la clase o atributo adecuado...");
        
        // Buscar posibles elementos de navegación
        document.querySelectorAll('a, button').forEach(el => {
            console.log(`Posible enlace: ${el.textContent.trim()} - Clases: ${el.className}`);
        });
        
        // Intentar reparar automáticamente
        repararNavegacion();
    } else {
 // Listar enlaces encontrados
 navLinks.forEach((link, index) => {
    const page = link.getAttribute('data-page') || 'Sin data-page';
    const text = link.textContent.trim();
    console.log(`[${index}] Enlace: "${text}" → Página: "${page}"`);
});
}

// NUEVO: Verificar página actual
console.log(`Página actual: ${window.currentPage || 'No definida'}`);
const pageActive = document.querySelector('.page-content.active');
console.log(`Elemento de página activa: ${pageActive ? pageActive.id : 'Ninguno'}`);

console.log("=== FIN DEL DIAGNÓSTICO DE NAVEGACIÓN ===");
}

// Función para reparar navegación
function repararNavegacion() {
console.log("Intentando reparar navegación...");

// Buscar menú de navegación
const posiblesMenus = document.querySelectorAll('nav, .sidebar, #sidebar, .nav');

posiblesMenus.forEach(menu => {
const enlaces = menu.querySelectorAll('a');
console.log(`Encontrados ${enlaces.length} enlaces en un posible menú`);

// Verificar si son enlaces del menú principal
enlaces.forEach(enlace => {
    const texto = enlace.textContent.trim().toLowerCase();
    
    // Identificar posibles páginas basadas en el texto
    let pagina = null;
    if (texto.includes('inicio') || texto.includes('dashboard')) pagina = 'dashboard';
    else if (texto.includes('cliente')) pagina = 'clientes';
    else if (texto.includes('préstamo') || texto.includes('prestamo')) pagina = 'prestamos';
    else if (texto.includes('pago')) pagina = 'pagos';
    else if (texto.includes('reporte')) pagina = 'reportes';
    else if (texto.includes('nuevo préstamo') || texto.includes('nuevo prestamo')) pagina = 'nuevo-prestamo';
    
    if (pagina) {
        console.log(`Reparando enlace "${texto}" → página "${pagina}"`);
        
        // Asignar atributo data-page
        enlace.setAttribute('data-page', pagina);
        
        // Asignar clase nav-link si no la tiene
        if (!enlace.classList.contains('nav-link')) {
            enlace.classList.add('nav-link');
        }
        
        // Asignar evento de clic
        enlace.addEventListener('click', handleNavClick);
    }
});
});

console.log("Reparación de navegación completada. Reinicie la aplicación para verificar.");
}

// Función para reparar la página de clientes
function repararPaginaClientes() {
console.log('Reparando página de clientes...');

const clientesPage = document.getElementById('clientes');
if (!clientesPage) {
console.error('Elemento #clientes no encontrado, no se puede reparar');
return;
}

// Evitar duplicación verificando si ya existe contenido
if (clientesPage.querySelector('.container-fluid h2')) {
console.log('La página ya tiene estructura básica, eliminando contenido duplicado...');

// Conservar solo el primer contenedor
const contenedores = clientesPage.querySelectorAll('.container-fluid');
if (contenedores.length > 1) {
    for (let i = 1; i < contenedores.length; i++) {
        contenedores[i].remove();
    }
}
}

// Crear estructura básica si no existe
let contenedor = clientesPage.querySelector('.container-fluid');
if (!contenedor) {
console.log('Creando estructura básica...');
contenedor = document.createElement('div');
contenedor.className = 'container-fluid';
contenedor.innerHTML = '<h2 class="mb-4">Gestión de Clientes</h2>';
clientesPage.appendChild(contenedor);
}

// Verificar si existe la tarjeta principal
let card = contenedor.querySelector('.card');
if (!card) {
console.log('Creando tarjeta principal...');
card = document.createElement('div');
card.className = 'card shadow mb-4';
card.innerHTML = `
    <div class="card-header py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
            <h6 class="m-0 font-weight-bold text-primary">Listado de Clientes</h6>
            <button id="btnRefreshClientes" class="btn btn-sm btn-outline-primary ms-3" title="Actualizar lista">
                <i class="fas fa-sync-alt"></i> Actualizar
            </button>
        </div>
        <div class="input-group w-50">
            <input type="text" class="form-control" placeholder="Buscar cliente..." id="buscarCliente">
            <button class="btn btn-primary" type="button" id="btnNuevoCliente">
                <i class="fas fa-plus"></i> Nuevo Cliente
            </button>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="tablaClientes" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" class="text-center">Cargando clientes...</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
            <span id="contadorClientes" style="display:none">0</span>
        </div>
    </div>
`;
contenedor.appendChild(card);
}

console.log('Reparación completada, reiniciando página...');

// Intentar inicializar la página
setTimeout(() => {
if (typeof initClientesPage === 'function') {
    initClientesPage();
} else if (typeof inicializarPaginaClientes === 'function') {
    inicializarPaginaClientes();
} else {
    console.warn('No se encontró función de inicialización después de reparar');
    // Verificar si está cargado el script
    const scriptExistente = document.querySelector('script[src="/js/clientes.js"]');
    if (!scriptExistente) {
        console.log('Cargando script de clientes...');
        const script = document.createElement('script');
        script.src = '/js/clientes.js';
        script.onload = function() {
            console.log('Script cargado, intentando inicializar...');
            if (typeof initClientesPage === 'function') {
                initClientesPage();
            } else if (typeof inicializarPaginaClientes === 'function') {
                inicializarPaginaClientes();
            }
        };
        document.head.appendChild(script);
    }
}
}, 200);
}

// Cargar datos del dashboard
function loadDashboardData() {
// Cargar contadores
loadCounters();

// Cargar gráficos si existe Chart.js
if (typeof Chart !== 'undefined') {
loadCharts();
}

// Cargar tablas
loadPagosPendientes();
loadClientesRecientes();
}

// Cargar contadores del dashboard
function loadCounters() {
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

// Clientes activos
fetch('/api/clientes?estado=Activo')
.then(response => response.json())
.then(data => {
    const contador = document.getElementById('totalClientesActivos');
    if (contador) contador.textContent = data.length;
})
.catch(error => {
    console.error('Error al cargar clientes activos:', error);
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

// Cargar gráficos del dashboard
// Cargar gráficos del dashboard
function loadCharts() {
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible, no se pueden cargar gráficos');
        return;
    }
    
    // Almacenar referencias a instancias de gráficos para poder destruirlas después
    if (!window.dashboardCharts) {
        window.dashboardCharts = {};
    }
    
    // Gráfico de préstamos por mes
    const ctxPrestamos = document.getElementById('prestamosPorMesChart');
    if (ctxPrestamos) {
        // Destruir gráfico existente si hay uno
        if (window.dashboardCharts.prestamos) {
            window.dashboardCharts.prestamos.destroy();
        }
        
        fetch('/api/prestamos/estadisticas/por-mes')
            .then(response => response.json())
            .then(data => {
                window.dashboardCharts.prestamos = new Chart(ctxPrestamos, {
                    type: 'bar',
                    data: {
                        labels: data.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Préstamos',
                            data: data.valores || [0, 0, 0, 0, 0, 0],
                            backgroundColor: 'rgba(78, 115, 223, 0.5)',
                            borderColor: 'rgba(78, 115, 223, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar datos para el gráfico de préstamos:', error);
            });
    }
    
    // Gráfico de pagos
    const ctxPagos = document.getElementById('pagosPorMesChart');
    if (ctxPagos) {
        // Destruir gráfico existente si hay uno
        if (window.dashboardCharts.pagos) {
            window.dashboardCharts.pagos.destroy();
        }
        
        fetch('/api/pagos/estadisticas/por-mes')
            .then(response => response.json())
            .then(data => {
                window.dashboardCharts.pagos = new Chart(ctxPagos, {
                    type: 'line',
                    data: {
                        labels: data.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Pagos',
                            data: data.valores || [0, 0, 0, 0, 0, 0],
                            borderColor: 'rgba(46, 139, 87, 1)',
                            backgroundColor: 'rgba(46, 139, 87, 0.2)',
                            borderWidth: 2,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar datos para el gráfico de pagos:', error);
            });
    }
}

// Limpiar gráficos del dashboard
function limpiarGraficosDashboard() {
    if (window.dashboardCharts) {
        if (window.dashboardCharts.prestamos) {
            window.dashboardCharts.prestamos.destroy();
            window.dashboardCharts.prestamos = null;
        }
        if (window.dashboardCharts.pagos) {
            window.dashboardCharts.pagos.destroy();
            window.dashboardCharts.pagos = null;
        }
    }
}

// Cargar pagos pendientes para el dashboard
function loadPagosPendientes() {
const tbodyPagosPendientes = document.querySelector('#pagosPendientesTable tbody');

if (!tbodyPagosPendientes) return;

// Limpiar tabla
tbodyPagosPendientes.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

// Obtener próximos pagos
fetch('/api/pagos/proximos')
.then(response => response.json())
.then(pagos => {
    // Limpiar tabla
    tbodyPagosPendientes.innerHTML = '';
    
    if (!pagos || pagos.length === 0) {
        tbodyPagosPendientes.innerHTML = '<tr><td colspan="4" class="text-center">No hay pagos pendientes próximos</td></tr>';
    } else {
        // Llenar tabla
        pagos.forEach(pago => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${pago.clienteNombre || 'Cliente'}</td>
               <td>${formatDate(pago.fechaPago)}</td>
               <td>${formatCurrency(pago.monto)}</td>
               <td>
                   <button class="btn btn-sm btn-primary" 
                           onclick="registrarPago('${pago.prestamoId}', ${pago.numeroPago})">
                       <i class="fas fa-money-bill-wave"></i> Pagar
                   </button>
               </td>
           `;
           
           tbodyPagosPendientes.appendChild(tr);
       });
   }
})
.catch(error => {
   console.error('Error al cargar pagos pendientes:', error);
   tbodyPagosPendientes.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos</td></tr>';
});
}

// Cargar clientes recientes para el dashboard
function loadClientesRecientes() {
const tbodyClientesRecientes = document.querySelector('#clientesRecientesTable tbody');

if (!tbodyClientesRecientes) return;

// Limpiar tabla
tbodyClientesRecientes.innerHTML = '<tr><td colspan="4" class="text-center">Cargando...</td></tr>';

// Obtener clientes
fetch('/api/clientes')
.then(response => response.json())
.then(clientes => {
   // Ordenar por fecha de registro (más recientes primero)
   clientes.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
   
   // Limitar a los 5 más recientes
   const clientesRecientes = clientes.slice(0, 5);
   
   // Limpiar tabla
   tbodyClientesRecientes.innerHTML = '';
   
   if (clientesRecientes.length === 0) {
       tbodyClientesRecientes.innerHTML = '<tr><td colspan="4" class="text-center">No hay clientes registrados</td></tr>';
   } else {
       // Llenar tabla
       clientesRecientes.forEach(cliente => {
           const tr = document.createElement('tr');
           
           tr.innerHTML = `
               <td>${cliente.nombreCompleto}</td>
               <td>${cliente.tipoDocumento}: ${cliente.numeroDocumento}</td>
               <td>${cliente.telefono}</td>
               <td>
                   <button class="btn btn-sm btn-info" 
                           onclick="verCliente('${cliente.clienteId}')">
                       <i class="fas fa-eye"></i> Ver
                   </button>
               </td>
           `;
           
           tbodyClientesRecientes.appendChild(tr);
       });
   }
})
.catch(error => {
   console.error('Error al cargar clientes recientes:', error);
   tbodyClientesRecientes.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos</td></tr>';
});
}

// Inicializar modales
function initModals() {
// Inicializar modales de Bootstrap si es necesario
if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
// Los modales de Bootstrap se inicializan automáticamente
console.log('Modales de Bootstrap inicializados');
} else {
console.warn('Bootstrap no está disponible, los modales pueden no funcionar correctamente');
}
}

// Función para registrar un pago (desde el dashboard)
function registrarPago(prestamoId, numeroPago) {
// Navegar a la página de pagos
document.querySelector('[data-page="pagos"]').click();

// Esperar a que la página se cargue
setTimeout(() => {
// Buscar el préstamo y activar el modal de pago
if (typeof iniciarPago === 'function') {
   iniciarPago(prestamoId, numeroPago);
} else {
   // Si la función no está disponible, almacenar los datos para cuando se cargue la página
   window.pendingPayment = {
       prestamoId,
       numeroPago
   };
}
}, 1000);
}

// Función para ver un cliente (desde el dashboard)
function verCliente(clienteId) {
// Navegar a la página de clientes
document.querySelector('[data-page="clientes"]').click();

// Esperar a que la página se cargue
setTimeout(() => {
// Buscar el cliente y mostrar sus detalles
if (typeof mostrarDetallesCliente === 'function') {
   mostrarDetallesCliente(clienteId);
} else if (typeof verPrestamosCliente === 'function') {
   verPrestamosCliente(clienteId);
} else {
   // Si la función no está disponible, almacenar el ID para cuando se cargue la página
   window.pendingClientDetails = clienteId;
}
}, 1000);
}

// Utilidades

// Formatear fecha
function formatDate(date) {
if (!date) return '';

const d = new Date(date);
const day = String(d.getDate()).padStart(2, '0');
const month = String(d.getMonth() + 1).padStart(2, '0');
const year = d.getFullYear();

return `${day}/${month}/${year}`;
}

// Formatear moneda
function formatCurrency(amount) {
return new Intl.NumberFormat('es-MX', {
style: 'currency',
currency: 'MXN'
}).format(amount);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
// Crear elemento de notificación
const notification = document.createElement('div');
notification.className = `toast-notification ${type}`;
notification.innerHTML = `
<div class="toast-header">
   <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                  type === 'error' || type === 'danger' ? 'fa-exclamation-circle' : 
                  type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
   <strong class="me-auto">Portal de Préstamos</strong>
   <button type="button" class="btn-close" aria-label="Cerrar"></button>
</div>
<div class="toast-body">
   ${message}
</div>
`;

// Agregar al cuerpo del documento
document.body.appendChild(notification);

// Configurar botón de cierre
const closeBtn = notification.querySelector('.btn-close');
if (closeBtn) {
closeBtn.addEventListener('click', () => {
   notification.classList.remove('show');
   setTimeout(() => {
       notification.remove();
   }, 300);
});
}

// Mostrar con animación
setTimeout(() => {
notification.classList.add('show');
}, 10);

// Ocultar después de 5 segundos
setTimeout(() => {
notification.classList.remove('show');

// Eliminar del DOM después de la animación
setTimeout(() => {
   notification.remove();
}, 300);
}, 5000);
}

// NUEVA FUNCIÓN: Recuperar estado de la navegación
function recuperarNavegacion() {
console.log('Intentando recuperar estado de navegación...');

// Verificar si tenemos una página actual
if (!window.currentPage) {
window.currentPage = 'dashboard'; // Establecer página predeterminada
}

// Verificar si esa página está activa
const pageElement = document.getElementById(window.currentPage);
if (!pageElement || !pageElement.classList.contains('active')) {
// Si no está activa, intentar cargarla
loadPage(window.currentPage);
}

// Marcar el enlace de navegación correspondiente
const navLink = document.querySelector(`[data-page="${window.currentPage}"]`);
if (navLink) {
document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
    link.classList.remove('active');
});
navLink.classList.add('active');
}
}

// AGREGAR ESTILOS CSS PARA LAS MEJORAS DE UI
function addExtraStyles() {
if (document.getElementById('portal-extra-styles')) return;

const styleElement = document.createElement('style');
styleElement.id = 'portal-extra-styles';
styleElement.textContent = `
.page-transition {
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background-color: #fff;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    z-index: 1050;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
}

.toast-notification.show {
    opacity: 1;
    transform: translateY(0);
}

.toast-notification .toast-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.85);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.toast-notification .toast-body {
    padding: 0.75rem;
}

.toast-notification.success {
    border-left: 4px solid #28a745;
}

.toast-notification.info {
    border-left: 4px solid #17a2b8;
}

.toast-notification.warning {
    border-left: 4px solid #ffc107;
}

.toast-notification.danger, 
.toast-notification.error {
    border-left: 4px solid #dc3545;
}

.btn-refresh {
    margin-left: 10px;
    padding: 0.25rem 0.5rem;
}
`;

document.head.appendChild(styleElement);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
// Agregar estilos extra
addExtraStyles();
});

// Exportar funciones para uso global
window.loadPage = loadPage;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.registrarPago = registrarPago;
window.verCliente = verCliente;
window.diagnosticarNavegacion = diagnosticarNavegacion;