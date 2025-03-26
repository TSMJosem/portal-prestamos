/**
 * navigation-system.js - Sistema unificado de navegación para ALFIN CASH
 * 
 * Este script unifica la navegación entre páginas y resuelve los problemas
 * de carga entre las secciones de préstamos, pagos y clientes.
 */

// Sistema de eventos global mejorado
window.appEvents = window.appEvents || {
    listeners: {},
    
    // Registrar un evento
    on: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    // Disparar un evento
    emit: function(event, data) {
        console.log(`[Event] ${event}`, data);
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${event}:`, error);
                }
            });
        }
    }
};

// Registro global del estado de la aplicación
window.appState = {
    currentPage: 'dashboard',
    previousPage: null,
    pageInitialized: {},
    pendingNavigations: [],
    navigationInProgress: false
};

// Sistema unificado de navegación
class NavigationSystem {
    constructor() {
        this.moduleInitializers = {
            'dashboard': this.initDashboard,
            'clientes': this.initClientes,
            'prestamos': this.initPrestamos,
            'pagos': this.initPagos,
            'nuevo-prestamo': this.initNuevoPrestamo,
            'reportes': this.initReportes
        };
        
        // Módulos que requieren scripts externos
        this.externalModules = {
            'clientes': ['/js/clientes-fixed.js'],
            'prestamos': ['/js/prestamos.js'],
            'pagos': ['/js/pagos.js'],
            'nuevo-prestamo': ['/js/nuevo-prestamo.js'],
            'reportes': ['/js/reportes.js']
        };
        
        // Mapa de inicializadores de páginas
        this.pageInitializers = {
            'clientes': 'initClientesPage',
            'prestamos': 'initPrestamosPage',
            'pagos': 'initPagosPage',
            'nuevo-prestamo': 'initNuevoPrestamoPage',
            'reportes': 'initReportesPage'
        };
        
        // Tablas por página para paginación
        this.pageTableSelectors = {
            'clientes': ['#tablaClientes'],
            'prestamos': ['#tablaPrestamos'],
            'pagos': ['#tablaHistorialPagos', '#tablaPagosPendientes'],
            'reportes': ['.table'],
            'dashboard': ['#pagosPendientesTable', '#clientesRecientesTable']
        };
    }
    
    /**
     * Inicializa el sistema de navegación
     */
    init() {
        console.log('🧭 Inicializando sistema unificado de navegación...');
        
        // Configurar navegación de enlaces
        this.setupNavigation();
        
        // Configurar interacción con el sistema de paginación
        this.setupPaginationIntegration();
        
        // Inicializar la página actual
        const currentPage = window.currentPage || 'dashboard';
        window.appState.currentPage = currentPage;
        this.initializePage(currentPage);
        
        // Suscribirse a eventos globales
        this.setupGlobalEvents();
        
        // Detectar si hay problemas de carga
        this.setupErrorDetection();
        
        console.log('✅ Sistema de navegación inicializado correctamente');
    }
    
    /**
     * Configura los eventos de navegación
     */
    setupNavigation() {
        // Interceptar todos los enlaces de navegación
        document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
            // Remover eventos previos para evitar duplicaciones
            const clonedLink = link.cloneNode(true);
            link.parentNode.replaceChild(clonedLink, link);
            
            // Añadir el evento de clic
            clonedLink.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = clonedLink.getAttribute('data-page');
                if (targetPage) {
                    this.navigateTo(targetPage);
                }
            });
        });
        
        // Sobrescribir función loadPage global
        window.loadPage = (pageName) => this.navigateTo(pageName);
        
        console.log('✅ Eventos de navegación configurados');
    }
    
    /**
     * Navega a una página específica
     */
    navigateTo(pageName) {
        // Evitar navegación a la misma página
        if (pageName === window.appState.currentPage && window.appState.pageInitialized[pageName]) {
            console.log(`Ya estás en la página ${pageName}`);
            return;
        }
        
        console.log(`🧭 Navegando a: ${pageName}`);
        
        // Guardar navegación previa
        const previousPage = window.appState.currentPage;
        window.appState.previousPage = previousPage;
        
        // Actualizar estado
        window.appState.currentPage = pageName;
        window.currentPage = pageName; // Para compatibilidad con código existente
        
        // Marcar enlace activo en la navegación
        this.updateActiveNavLink(pageName);
        
        // Ocultar todas las páginas
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar la página destino
        const pageElement = document.getElementById(pageName);
        if (pageElement) {
            pageElement.classList.add('active');
            
            // Inicializar la página si existe
            this.initializePage(pageName);
        } else {
            console.log(`Página ${pageName} no encontrada, cargando contenido...`);
            this.loadPageContent(pageName);
        }
        
        // Notificar a otros sistemas del cambio de página
        window.appEvents.emit('pageChanged', {
            from: previousPage,
            to: pageName
        });
        
        // En pantallas pequeñas, colapsar el sidebar
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('active');
        }
    }
    
    /**
     * Actualiza el enlace activo en la navegación
     */
    updateActiveNavLink(pageName) {
        // Remover clase activa de todos los enlaces
        document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
            link.classList.remove('active');
        });
        
        // Añadir clase activa al enlace correspondiente
        const activeLinks = document.querySelectorAll(`.nav-link[data-page="${pageName}"], [data-page="${pageName}"]`);
        activeLinks.forEach(link => {
            link.classList.add('active');
        });
    }
    
    /**
     * Carga el contenido HTML de una página desde el servidor
     */
    loadPageContent(pageName) {
        // Mostrar indicador de carga
        const mainContainer = document.querySelector('#main-content');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div id="pageLoading" class="d-flex justify-content-center align-items-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <span class="ms-3">Cargando ${pageName}...</span>
                </div>
            `;
        }
        
        // Intentar cargar la página desde diferentes rutas
        this.fetchPageContent(pageName)
            .then(html => {
                // Crear contenedor para la página
                if (mainContainer) {
                    mainContainer.innerHTML = '';
                    
                    const pageContainer = document.createElement('div');
                    pageContainer.id = pageName;
                    pageContainer.className = 'page-content active';
                    pageContainer.innerHTML = html;
                    
                    mainContainer.appendChild(pageContainer);
                    
                    // Inicializar la página
                    setTimeout(() => this.initializePage(pageName), 200);
                }
            })
            .catch(error => {
                console.error(`Error al cargar página ${pageName}:`, error);
                
                // Mostrar mensaje de error
                if (mainContainer) {
                    mainContainer.innerHTML = `
                        <div class="alert alert-danger mx-auto my-5" style="max-width: 600px;">
                            <h4><i class="fas fa-exclamation-triangle me-2"></i>Error al cargar la página</h4>
                            <p>No se pudo cargar la página "${pageName}". ${error.message}</p>
                            <button class="btn btn-primary" onclick="window.navigationSystem.navigateTo('dashboard')">
                                <i class="fas fa-home me-1"></i> Volver al inicio
                            </button>
                        </div>
                    `;
                }
            });
    }
    
    /**
     * Intenta obtener el contenido HTML de una página desde varias ubicaciones posibles
     */
    async fetchPageContent(pageName) {
        // Rutas posibles donde puede estar el HTML de la página
        const possiblePaths = [
            `/views/${pageName}.html`,
            `/${pageName}.html`,
            `/pages/${pageName}.html`
        ];
        
        // Intentar cada ruta hasta encontrar una válida
        let lastError = null;
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                lastError = error;
            }
        }
        
        // Si ninguna ruta funcionó, intentar cargar un contenido predeterminado
        return this.getDefaultPageContent(pageName);
    }
    
    /**
     * Obtiene un contenido HTML predeterminado para una página
     */
    getDefaultPageContent(pageName) {
        // Plantillas predeterminadas para páginas comunes
        const templates = {
            'clientes': `
                <div class="container-fluid">
                    <h2 class="mb-4">Gestión de Clientes</h2>
                    <div class="card shadow mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="m-0 font-weight-bold text-primary">Listado de Clientes</h6>
                            <button class="btn btn-primary" id="btnNuevoCliente">
                                <i class="fas fa-plus"></i> Nuevo Cliente
                            </button>
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
                                        <tr><td colspan="6" class="text-center">Cargando clientes...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-3">
                                <p class="text-muted">Total de clientes: <span id="totalClientes">0</span></p>
                            </div>
                        </div>
                    </div>
                </div>`,
            'prestamos': `
                <div class="container-fluid">
                    <h2 class="mb-4">Gestión de Préstamos</h2>
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Préstamos Registrados</h6>
                            <a href="#" class="nav-link" data-page="nuevo-prestamo">
                                <button class="btn btn-primary">
                                    <i class="fas fa-plus fa-sm"></i> Nuevo Préstamo
                                </button>
                            </a>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="tablaPrestamos" width="100%" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Fecha</th>
                                            <th>Monto</th>
                                            <th>Interés</th>
                                            <th>Progreso</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td colspan="8" class="text-center">Cargando préstamos...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`,
            'pagos': `
                <div class="container-fluid">
                    <h2 class="mb-4">Gestión de Pagos</h2>
                    
                    <!-- Pagos Pendientes -->
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Pagos Pendientes</h6>
                            <div class="dropdown no-arrow">
                                <span class="badge bg-warning">Pendientes: <span id="contadorPendientes">0</span></span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="tablaPagosPendientes" width="100%" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Préstamo</th>
                                            <th>Cuota</th>
                                            <th>Fecha</th>
                                            <th>Monto</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td colspan="7" class="text-center">Cargando pagos pendientes...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Historial de Pagos -->
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Historial de Pagos</h6>
                            <div class="dropdown no-arrow">
                                <span class="badge bg-info">Total: <span id="contadorHistorial">0</span></span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered" id="tablaHistorialPagos" width="100%" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Préstamo</th>
                                            <th>Cuota</th>
                                            <th>Monto</th>
                                            <th>Tipo</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td colspan="7" class="text-center">Cargando historial de pagos...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`
        };
        
        // Devolver plantilla predeterminada o mensaje de error
        if (templates[pageName]) {
            return Promise.resolve(templates[pageName]);
        } else {
            return Promise.resolve(`
                <div class="container-fluid">
                    <h2 class="mb-4">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h2>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No se pudo cargar el contenido de esta página. Se ha generado una vista predeterminada.
                    </div>
                </div>
            `);
        }
    }
    
    /**
     * Inicializa una página específica
     */
    initializePage(pageName) {
        console.log(`🛠️ Inicializando página: ${pageName}`);
        
        // Marcar navegación en progreso
        window.appState.navigationInProgress = true;
        
        // Cargar scripts necesarios y luego inicializar
        this.loadModuleScripts(pageName)
            .then(() => {
                // Verificar si la función de inicialización existe
                const initFunctionName = this.pageInitializers[pageName];
                if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
                    console.log(`Llamando a función de inicialización: ${initFunctionName}()`);
                    window[initFunctionName]();
                } else {
                    // Usar inicializador incorporado
                    if (this.moduleInitializers[pageName]) {
                        console.log(`Usando inicializador incorporado para: ${pageName}`);
                        this.moduleInitializers[pageName]();
                    } else {
                        console.log(`No se encontró inicializador para la página: ${pageName}`);
                    }
                }
                
                // Inicializar paginación después de inicializar la página
                setTimeout(() => this.initializePageTables(pageName), 500);
                
                // Marcar página como inicializada
                window.appState.pageInitialized[pageName] = true;
                
                // Finalizar navegación
                window.appState.navigationInProgress = false;
            })
            .catch(error => {
                console.error(`Error al inicializar página ${pageName}:`, error);
                window.appState.navigationInProgress = false;
                
                // Intentar recuperación
                this.recoverPageInitialization(pageName);
            });
    }
    
    /**
     * Carga los scripts necesarios para un módulo específico
     */
    loadModuleScripts(pageName) {
        return new Promise((resolve, reject) => {
            // Verificar si se necesitan cargar scripts externos
            const scripts = this.externalModules[pageName];
            if (!scripts || scripts.length === 0) {
                // No hay scripts que cargar
                resolve();
                return;
            }
            
            // Verificar si los scripts ya están cargados
            const loadedScripts = Array.from(document.querySelectorAll('script'))
                .map(script => script.src)
                .filter(src => src); // Filtrar scripts sin src
                
            const scriptsToLoad = scripts.filter(script => {
                const scriptUrl = new URL(script, window.location.origin).href;
                return !loadedScripts.some(loadedSrc => loadedSrc.includes(script));
            });
            
            if (scriptsToLoad.length === 0) {
                // Todos los scripts ya están cargados
                resolve();
                return;
            }
            
            // Cargar scripts en serie
            const loadScript = (index) => {
                if (index >= scriptsToLoad.length) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = scriptsToLoad[index];
                script.async = true;
                
                script.onload = () => {
                    console.log(`Script cargado: ${scriptsToLoad[index]}`);
                    loadScript(index + 1);
                };
                
                script.onerror = (error) => {
                    console.error(`Error al cargar script ${scriptsToLoad[index]}:`, error);
                    
                    // Continuar con el siguiente script a pesar del error
                    loadScript(index + 1);
                };
                
                document.head.appendChild(script);
            };
            
            // Iniciar carga de scripts
            loadScript(0);
        });
    }
    
    /**
     * Intenta recuperar la inicialización de una página que falló
     */
    recoverPageInitialization(pageName) {
        console.log(`🔄 Intentando recuperar inicialización de página: ${pageName}`);
        
        // Implementar estrategias de recuperación según la página
        switch (pageName) {
            case 'clientes':
                // Intentar recuperar usando funciones de respaldo
                if (typeof window.garantizarCargaClientes === 'function') {
                    window.garantizarCargaClientes();
                } else if (typeof window.cargarClientes === 'function') {
                    window.cargarClientes(true);
                } else if (typeof window.recuperarVistaClientes === 'function') {
                    window.recuperarVistaClientes();
                }
                break;
                
            case 'prestamos':
                if (typeof window.cargarPrestamos === 'function') {
                    window.cargarPrestamos();
                }
                break;
                
            case 'pagos':
                if (typeof window.cargarPagosPendientes === 'function') {
                    window.cargarPagosPendientes();
                }
                if (typeof window.cargarHistorialPagos === 'function') {
                    window.cargarHistorialPagos();
                }
                break;
                
            case 'dashboard':
                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
                break;
        }
        
        // Intentar inicializar tablas de todas formas
        setTimeout(() => this.initializePageTables(pageName), 1000);
    }
    
    /**
     * Inicializa las tablas en una página específica
     */
    initializePageTables(pageName) {
        console.log(`📋 Inicializando tablas para la página: ${pageName}`);
        
        // Obtener selectores de tablas para esta página
        const tableSelectors = this.pageTableSelectors[pageName] || [];
        
        if (tableSelectors.length === 0) {
            console.log(`No hay tablas definidas para la página: ${pageName}`);
            return;
        }
        
        // Inicializar paginación para cada tabla
        tableSelectors.forEach(selector => {
            const tables = document.querySelectorAll(selector);
            if (tables.length > 0) {
                console.log(`Encontradas ${tables.length} tablas con selector: ${selector}`);
                
                tables.forEach(table => {
                    // Asegurarse de que la tabla tenga un ID
                    if (!table.id) {
                        table.id = `tabla-${pageName}-${Date.now()}`;
                    }
                    
                    // Inicializar paginación
                    this.initializeTablePagination(table.id);
                });
            } else {
                console.log(`No se encontraron tablas con selector: ${selector}`);
            }
        });
    }
    
    /**
     * Inicializa la paginación para una tabla específica
     */
    initializeTablePagination(tableId) {
        // Verificar si la función de paginación está disponible
        if (typeof window.tablePaginator === 'object' && typeof window.tablePaginator.init === 'function') {
            console.log(`Inicializando paginación con tablePaginator para: #${tableId}`);
            window.tablePaginator.init(tableId);
        } else if (typeof window.inicializarPaginacion === 'function') {
            console.log(`Inicializando paginación con inicializarPaginacion para: #${tableId}`);
            window.inicializarPaginacion(tableId);
        } else {
            console.log(`No se encontró función de paginación para la tabla: #${tableId}`);
        }
    }
    
    /**
     * Configura la integración con el sistema de paginación
     */
    setupPaginationIntegration() {
        // Si el módulo de paginación está disponible, registramos eventos
        document.addEventListener('tablePaginatorReady', () => {
            console.log('✅ Sistema de paginación detectado, configurando integración');
            
            // Actualizar tablas de la página actual
            const currentPage = window.appState.currentPage || 'dashboard';
            this.initializePageTables(currentPage);
        });
        
        // Sobrescribir las funciones de paginación si ya existen
        if (window.tablePaginator) {
            console.log('Integrando con sistema de paginación existente');
            
            const originalInit = window.tablePaginator.init;
            window.tablePaginator.init = (tableId, options) => {
                console.log(`[Navigation] Inicializando paginación para tabla: #${tableId}`);
                return originalInit(tableId, options);
            };
        }
    }
    
    /**
     * Configura suscripciones a eventos globales
     */
    setupGlobalEvents() {
        // Escuchar eventos de cambio de página
        window.appEvents.on('pageChanged', (data) => {
            console.log(`Cambio de página detectado: ${data.from} → ${data.to}`);
            
            // Actualizar tablas después de un cambio de página
            setTimeout(() => this.initializePageTables(data.to), 800);
        });
        
        // Escuchar eventos de actualización de datos
        window.appEvents.on('dataUpdated', (data) => {
            console.log(`Actualización de datos detectada:`, data);
            
            // Actualizar tablas si es necesario
            if (data.type === 'table' && data.tableId) {
                this.refreshTable(data.tableId);
            } else if (data.module) {
                // Actualizar todas las tablas del módulo
                const currentPage = window.appState.currentPage;
                if (currentPage === data.module) {
                    this.initializePageTables(currentPage);
                }
            }
        });
    }
    
    /**
     * Actualiza una tabla específica
     */
    refreshTable(tableId) {
        console.log(`Actualizando tabla: #${tableId}`);
        
        // Si existe la función de actualización de paginación, usarla
        if (window.tablePaginator && typeof window.tablePaginator.update === 'function') {
            window.tablePaginator.update(tableId);
        }
    }
    
    /**
     * Configura detección de errores y recuperación automática
     */
    setupErrorDetection() {
        // Crear un observador para detectar cambios en las tablas
        const observer = new MutationObserver((mutations) => {
            // Verificar si alguna tabla tiene mensaje de error
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.target.nodeName === 'TBODY') {
                    const errorText = mutation.target.textContent;
                    if (errorText && errorText.includes('Error')) {
                        console.log('Detectado error en tabla:', errorText);
                        
                        // Intentar recuperar según la página actual
                        const currentPage = window.appState.currentPage;
                        this.recoverPageInitialization(currentPage);
                    }
                }
            });
        });
        
        // Observar cambios en todas las tablas
        document.querySelectorAll('table').forEach(table => {
            const tbody = table.querySelector('tbody');
            if (tbody) {
                observer.observe(tbody, { childList: true, subtree: true });
            }
        });
        
        // También observar cambios en el DOM para detectar nuevas tablas
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // ============ INICIALIZADORES DE MÓDULOS ============
    
    /**
     * Inicializa el dashboard
     */
    initDashboard() {
        console.log('📊 Inicializando dashboard...');
        
        // Cargar datos del dashboard si la función existe
        if (typeof window.loadDashboardData === 'function') {
            window.loadDashboardData();
        } else {
            // Cargar funciones individuales
            if (typeof window.loadCounters === 'function') {
                window.loadCounters();
            }
            
            if (typeof window.loadCharts === 'function') {
                window.loadCharts();
            }
            
            if (typeof window.loadPagosPendientes === 'function') {
                window.loadPagosPendientes();
            }
            
            if (typeof window.loadClientesRecientes === 'function') {
                window.loadClientesRecientes();
            }
        }
    }
    
    /**
     * Inicializa el módulo de clientes
     */
    initClientes() {
        console.log('👥 Inicializando módulo de clientes...');
        
        // Intentar utilizando diferentes funciones conocidas
        if (typeof window.garantizarCargaClientes === 'function') {
            window.garantizarCargaClientes();
        } else if (typeof window.initClientesPage === 'function') {
            window.initClientesPage();
        } else if (typeof window.cargarClientes === 'function') {
            window.cargarClientes(true); // Forzar recarga
        }
        
        // Configurar botón de nuevo cliente
        const btnNuevoCliente = document.getElementById('btnNuevoCliente');
        if (btnNuevoCliente) {
            btnNuevoCliente.removeEventListener('click', window.abrirModalNuevoCliente);
            btnNuevoCliente.addEventListener('click', () => {
                if (typeof window.abrirModalNuevoCliente === 'function') {
                    window.abrirModalNuevoCliente();
                } else {
                    const modal = document.getElementById('modalNuevoCliente');
                    if (modal && typeof bootstrap !== 'undefined') {
                        new bootstrap.Modal(modal).show();
                    }
                }
            });
        }
    }
    
    /**
     * Inicializa el módulo de préstamos
     */
    initPrestamos() {
        console.log('💰 Inicializando módulo de préstamos...');
        
        if (typeof window.initPrestamosPage === 'function') {
            window.initPrestamosPage();
        } else if (typeof window.cargarPrestamos === 'function') {
            window.cargarPrestamos();
        }
        
        // Verificar si hay un préstamo pendiente por mostrar
        if (window.pendingLoanDetails) {
            setTimeout(() => {
                if (typeof window.mostrarDetallesPrestamo === 'function') {
                    window.mostrarDetallesPrestamo(window.pendingLoanDetails);
                    window.pendingLoanDetails = null;
                }
            }, 800);
        }
    }
    
    /**
     * Inicializa el módulo de pagos
     */
    initPagos() {
        console.log('💵 Inicializando módulo de pagos...');
        
        if (typeof window.initPagosPage === 'function') {
            window.initPagosPage();
        } else {
            // Inicializar componentes individuales
            if (typeof window.cargarPagosPendientes === 'function') {
                window.cargarPagosPendientes();
            }
            
            if (typeof window.cargarHistorialPagos === 'function') {
                window.cargarHistorialPagos();
            }
        }
        
        // Verificar si hay un pago pendiente
        if (window.pendingPayment) {
            setTimeout(() => {
                if (typeof window.iniciarPago === 'function') {
                    console.log('Procesando pago pendiente:', window.pendingPayment);
                    window.iniciarPago(
                        window.pendingPayment.prestamoId, 
                        window.pendingPayment.numeroPago
                    );
                    window.pendingPayment = null;
                }
            }, 1000);
        }
    }
    
    /**
     * Inicializa el módulo de nuevo préstamo
     */
    initNuevoPrestamo() {
        console.log('➕ Inicializando módulo de nuevo préstamo...');
        
        if (typeof window.initNuevoPrestamoPage === 'function') {
            window.initNuevoPrestamoPage();
        }
        
        // Verificar si hay un cliente preseleccionado desde otra pantalla
        const clienteId = sessionStorage.getItem('clienteSeleccionadoId');
        const clienteNombre = sessionStorage.getItem('clienteSeleccionadoNombre');
        
        if (clienteId && clienteNombre) {
            console.log(`Cliente preseleccionado: ${clienteNombre} (${clienteId})`);
            
            // Seleccionar automáticamente el cliente en el selector
            setTimeout(() => {
                const selectCliente = document.getElementById('selectCliente');
                if (selectCliente) {
                    selectCliente.value = clienteId;
                    
                    // Disparar evento change para actualizar datos relacionados
                    selectCliente.dispatchEvent(new Event('change'));
                    
                    // Mostrar notificación
                    if (typeof window.showNotification === 'function') {
                        window.showNotification(`Cliente seleccionado: ${clienteNombre}`, 'info');
                    }
                }
                
                // Limpiar datos de sesión
                sessionStorage.removeItem('clienteSeleccionadoId');
                sessionStorage.removeItem('clienteSeleccionadoNombre');
            }, 800);
        }
    }
    
    /**
     * Inicializa el módulo de reportes
     */
    initReportes() {
        console.log('📊 Inicializando módulo de reportes...');
        
        if (typeof window.initReportesPage === 'function') {
            window.initReportesPage();
        }
    }
}