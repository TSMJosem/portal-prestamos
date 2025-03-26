/**
 * pagination-fix.js - Solución unificada para problemas de paginación
 * 
 * Este script soluciona los problemas de paginación entre las secciones de 
 * préstamos, pagos y clientes, estableciendo un único sistema coordinado 
 * de paginación que funciona correctamente con la navegación.
 */

// Configuración global de paginación
const PAGINATION_CONFIG = {
    // Opciones de registros por página
    rowsPerPageOptions: [10, 25, 50, 100, 'Todos'],
    
    // Valor predeterminado
    defaultRowsPerPage: 10,
    
    // Textos
    infoText: 'Mostrando {start}-{end} de {total} registros',
    
    // Nombres de almacenamiento local
    storageKey: 'alfinCashPaginationSettings',
    
    // Tablas a las que aplicar paginación automáticamente
    autoInitTables: {
        'clientes': ['#tablaClientes'],
        'prestamos': ['#tablaPrestamos'],
        'pagos': ['#tablaPagosPendientes', '#tablaHistorialPagos'],
        'reportes': ['.table'],
        'dashboard': ['#pagosPendientesTable', '#clientesRecientesTable']
    }
};

// Estado global de paginación
const PaginationState = {
    // Mapeo de tablas con paginación
    paginatedTables: {},
    
    // Estado de inicialización
    initialized: false,
    
    // Intentos de inicialización por tabla
    initAttempts: {}
};

/**
 * Inicializa el sistema de paginación mejorado
 */
function initPaginationSystem() {
    console.log('📑 Inicializando sistema unificado de paginación...');
    
    // Si ya está inicializado, no hacer nada
    if (PaginationState.initialized) {
        console.log('Sistema de paginación ya inicializado');
        return;
    }
    
    // Añadir estilos CSS para los controles de paginación
    addPaginationStyles();
    
    // Configurar observador de cambios en el DOM
    setupDOMObserver();
    
    // Inicializar paginación para la página actual
    initializeCurrentPageTables();
    
    // Configurar integración con sistema de navegación
    setupNavigationIntegration();
    
    // Configurar manejo de errores
    setupErrorHandling();
    
    // Marcar como inicializado
    PaginationState.initialized = true;
    
    // Notificar que el sistema está listo
    const event = new CustomEvent('paginationSystemReady');
    document.dispatchEvent(event);
    
    console.log('✅ Sistema de paginación inicializado correctamente');
}

/**
 * Añade estilos CSS para los controles de paginación
 */
function addPaginationStyles() {
    // Verificar si ya existen los estilos
    if (document.getElementById('pagination-system-styles')) {
        return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'pagination-system-styles';
    styles.textContent = `
        .pagination-container {
            background-color: #f8f9fa;
            border-radius: 0 0 0.25rem 0.25rem;
            padding: 0.75rem;
            border: 1px solid #dee2e6;
            border-top: none;
            margin-top: -1px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
            .pagination-container {
                flex-direction: column;
            }
            
            .pagination-container > div {
                margin-bottom: 0.5rem;
                width: 100%;
                text-align: center;
            }
        }
        
        .pagination-per-page {
            display: flex;
            align-items: center;
            margin-right: 1rem;
        }
        
        .pagination-per-page label {
            margin-right: 0.5rem;
            margin-bottom: 0;
        }
        
        .pagination-per-page select {
            width: auto;
        }
        
        .pagination-info {
            color: #6c757d;
            margin-right: 1rem;
        }
        
        .pagination-nav {
            display: flex;
            justify-content: flex-end;
        }
        
        .pagination {
            margin-bottom: 0;
        }
        
        .pagination .page-link {
            color: #4682B4;
            cursor: pointer;
        }
        
        .pagination .page-item.active .page-link {
            background-color: #4682B4;
            border-color: #4682B4;
        }
        
        .pagination .page-item.disabled .page-link {
            color: #6c757d;
            cursor: not-allowed;
        }
    `;
    
    document.head.appendChild(styles);
}

/**
 * Configura un observador para detectar cambios en el DOM
 * y actualizar la paginación de manera automática
 */
function setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
        let tableChanged = false;
        let pageChanged = false;
        
        mutations.forEach(mutation => {
            // Detectar cambios relevantes
            if (mutation.type === 'childList') {
                // Verificar si se añadió una tabla nueva
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'TABLE' || 
                        (node.nodeType === 1 && node.querySelector('table'))) {
                        tableChanged = true;
                    }
                });
            } else if (mutation.type === 'attributes' && 
                      mutation.attributeName === 'class' && 
                      mutation.target.classList.contains('page-content') &&
                      mutation.target.classList.contains('active')) {
                // Detectar cambio de página
                pageChanged = true;
            }
        });
        
        // Si se detectó un cambio relevante, actualizar paginación
        if (tableChanged) {
            // Retrasar para dar tiempo a que la tabla se inicialice completamente
            setTimeout(initializeCurrentPageTables, 300);
        } else if (pageChanged) {
            // Retrasar para dar tiempo a que la página se inicialice completamente
            setTimeout(initializeCurrentPageTables, 500);
        }
    });
    
    // Observar todo el documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * Inicializa las tablas de la página actual
 */
function initializeCurrentPageTables() {
    const currentPage = getCurrentPage();
    console.log(`🔄 Inicializando tablas para la página actual: ${currentPage}`);
    
    // Obtener selectores para la página actual
    const selectors = PAGINATION_CONFIG.autoInitTables[currentPage] || [];
    
    if (selectors.length === 0) {
        console.log(`No hay selectores definidos para la página ${currentPage}`);
        return;
    }
    
    // Inicializar tablas con los selectores
    selectors.forEach(selector => {
        const tables = document.querySelectorAll(selector);
        if (tables.length > 0) {
            console.log(`Encontradas ${tables.length} tablas con selector: ${selector}`);
            
            tables.forEach(table => {
                // Asegurarse de que la tabla tenga un ID
                if (!table.id) {
                    table.id = `table-${currentPage}-${Date.now()}`;
                    console.log(`Asignando ID a tabla: ${table.id}`);
                }
                
                // Inicializar paginación
                initTablePagination(table.id);
            });
        } else {
            console.log(`No se encontraron tablas con selector: ${selector}`);
        }
    });
}

/**
 * Obtiene la página actual basándose en diferentes fuentes
 */
function getCurrentPage() {
    // 1. Verificar la variable global currentPage
    if (window.currentPage) {
        return window.currentPage;
    }
    
    // 2. Verificar elemento page-content activo
    const activePage = document.querySelector('.page-content.active');
    if (activePage && activePage.id) {
        return activePage.id;
    }
    
    // 3. Verificar enlace de navegación activo
    const activeNavLink = document.querySelector('.nav-link.active');
    if (activeNavLink && activeNavLink.getAttribute('data-page')) {
        return activeNavLink.getAttribute('data-page');
    }
    
    // Valor predeterminado
    return 'dashboard';
}

/**
 * Inicializa la paginación para una tabla específica
 */
function initTablePagination(tableId, options = {}) {
    // Verificar que la tabla existe
    const table = document.getElementById(tableId);
    if (!table) {
        console.warn(`Tabla #${tableId} no encontrada`);
        return false;
    }
    
    console.log(`📊 Inicializando paginación para tabla: #${tableId}`);
    
    // Verificar si ya tiene paginación inicializada
    if (PaginationState.paginatedTables[tableId]) {
        console.log(`La tabla #${tableId} ya tiene paginación, actualizando...`);
        return updateTablePagination(tableId);
    }
    
    // Verificar si tiene tbody
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.warn(`La tabla #${tableId} no tiene tbody`);
        return false;
    }
    
    // Configuración para esta tabla
    const config = {
        ...PAGINATION_CONFIG,
        ...options
    };
    
    // Guardar intentos de inicialización
    if (!PaginationState.initAttempts[tableId]) {
        PaginationState.initAttempts[tableId] = 0;
    }
    PaginationState.initAttempts[tableId]++;
    
    // Crear contenedor para controles de paginación
    const container = document.createElement('div');
    container.className = 'pagination-container';
    container.id = `pagination-${tableId}`;
    
    // Crear selector de registros por página
    const perPageContainer = document.createElement('div');
    perPageContainer.className = 'pagination-per-page';
    
    const perPageLabel = document.createElement('label');
    perPageLabel.htmlFor = `rows-per-page-${tableId}`;
    perPageLabel.textContent = 'Mostrar:';
    
    const perPageSelect = document.createElement('select');
    perPageSelect.id = `rows-per-page-${tableId}`;
    perPageSelect.className = 'form-select form-select-sm ms-1';
    
    // Añadir opciones
    config.rowsPerPageOptions.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option === 'Todos' ? 'all' : option;
        optionEl.textContent = option;
        perPageSelect.appendChild(optionEl);
    });
    
    perPageContainer.appendChild(perPageLabel);
    perPageContainer.appendChild(perPageSelect);
    
    // Crear contenedor de información
    const infoContainer = document.createElement('div');
    infoContainer.className = 'pagination-info';
    infoContainer.id = `info-${tableId}`;
    
    // Crear navegación
    const navContainer = document.createElement('div');
    navContainer.className = 'pagination-nav';
    
    const pagination = document.createElement('ul');
    pagination.className = 'pagination pagination-sm';
    pagination.id = `pages-${tableId}`;
    
    // Añadir botones de navegación básicos
    ['first', 'prev', 'next', 'last'].forEach(type => {
        const li = document.createElement('li');
        li.className = 'page-item';
        li.id = `${type}-${tableId}`;
        
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        
        // Iconos para los botones
        let icon;
        switch (type) {
            case 'first': icon = '<i class="fas fa-angle-double-left"></i>'; break;
            case 'prev': icon = '<i class="fas fa-angle-left"></i>'; break;
            case 'next': icon = '<i class="fas fa-angle-right"></i>'; break;
            case 'last': icon = '<i class="fas fa-angle-double-right"></i>'; break;
        }
        
        a.innerHTML = icon;
        li.appendChild(a);
        pagination.appendChild(li);
    });
    
    navContainer.appendChild(pagination);
    
    // Añadir todo al contenedor
    container.appendChild(perPageContainer);
    container.appendChild(infoContainer);
    container.appendChild(navContainer);
    
    // Insertar después de la tabla
    table.parentNode.insertBefore(container, table.nextSibling);
    
    // Cargar preferencias del usuario
    let rowsPerPage = loadUserPreference(tableId) || config.defaultRowsPerPage;
    
    // Actualizar select con el valor guardado
    perPageSelect.value = rowsPerPage === 'all' ? 'all' : rowsPerPage;
    
    // Inicializar estado de la tabla
    PaginationState.paginatedTables[tableId] = {
        element: table,
        tbody: tbody,
        rows: [],
        totalRows: 0,
        currentPage: 1,
        rowsPerPage: rowsPerPage === 'all' ? 'all' : parseInt(rowsPerPage),
        totalPages: 1,
        config: config
    };
    
    // Configurar eventos
    setupPaginationEvents(tableId);
    
    // Inicializar paginación
    updateTablePagination(tableId);
    
    return true;
}

/**
 * Configura los eventos para los controles de paginación
 */
function setupPaginationEvents(tableId) {
    // Seleccionar elementos
    const perPageSelect = document.getElementById(`rows-per-page-${tableId}`);
    const firstPageBtn = document.getElementById(`first-${tableId}`);
    const prevPageBtn = document.getElementById(`prev-${tableId}`);
    const nextPageBtn = document.getElementById(`next-${tableId}`);
    const lastPageBtn = document.getElementById(`last-${tableId}`);
    
    // Evento para cambiar registros por página
    if (perPageSelect) {
        perPageSelect.addEventListener('change', () => {
            const value = perPageSelect.value;
            changeRowsPerPage(tableId, value === 'all' ? 'all' : parseInt(value));
        });
    }
    
    // Eventos para navegación
    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(tableId, 1);
        });
    }
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const state = PaginationState.paginatedTables[tableId];
            if (state && state.currentPage > 1) {
                goToPage(tableId, state.currentPage - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const state = PaginationState.paginatedTables[tableId];
            if (state && state.currentPage < state.totalPages) {
                goToPage(tableId, state.currentPage + 1);
            }
        });
    }
    
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const state = PaginationState.paginatedTables[tableId];
            if (state) {
                goToPage(tableId, state.totalPages);
            }
        });
    }
}

/**
 * Actualiza la paginación de una tabla
 */
function updateTablePagination(tableId) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) {
        console.warn(`No hay estado de paginación para la tabla #${tableId}`);
        return false;
    }
    
    // Obtener referencia a los elementos
    const table = state.element;
    const tbody = state.tbody;
    
    // Guardar todas las filas
    state.rows = Array.from(tbody.querySelectorAll('tr'));
    state.totalRows = state.rows.length;
    
    // Verificar si hay filas para paginar
    const hasActualRows = state.totalRows > 0 &&
        !(state.totalRows === 1 && state.rows[0].cells.length === 1 && 
          state.rows[0].cells[0].hasAttribute('colspan'));
    
    // Mostrar u ocultar controles de paginación
    const paginationContainer = document.getElementById(`pagination-${tableId}`);
    if (paginationContainer) {
        paginationContainer.style.display = hasActualRows ? 'flex' : 'none';
        
        if (!hasActualRows) {
            // No hay datos para paginar, no hacer más
            return false;
        }
    }
    
    // Calcular número total de páginas
    if (state.rowsPerPage === 'all') {
        state.totalPages = 1;
    } else {
        state.totalPages = Math.ceil(state.totalRows / state.rowsPerPage);
    }
    
    // Asegurarse de que la página actual es válida
    if (state.currentPage > state.totalPages) {
        state.currentPage = state.totalPages > 0 ? state.totalPages : 1;
    }
    
    // Mostrar filas correspondientes
    showTablePage(tableId);
    
    // Actualizar información
    updatePaginationInfo(tableId);
    
    // Actualizar controles de navegación
    updatePaginationControls(tableId);
    
    return true;
}

/**
 * Muestra las filas correspondientes a la página actual
 */
function showTablePage(tableId) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    // Ocultar todas las filas
    state.rows.forEach(row => {
        row.style.display = 'none';
    });
    
    // Mostrar todas las filas si se seleccionó "Todos"
    if (state.rowsPerPage === 'all') {
        state.rows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    // Calcular rango de filas a mostrar
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = Math.min(start + state.rowsPerPage, state.totalRows);
    
    // Mostrar filas correspondientes
    for (let i = start; i < end; i++) {
        if (state.rows[i]) {
            state.rows[i].style.display = '';
        }
    }
}

/**
 * Actualiza la información de paginación
 */
function updatePaginationInfo(tableId) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    const infoElement = document.getElementById(`info-${tableId}`);
    if (!infoElement) return;
    
    // Si se muestra todo
    if (state.rowsPerPage === 'all') {
        infoElement.textContent = `Mostrando todos los ${state.totalRows} registros`;
        return;
    }
    
    // Calcular rango actual
    const start = state.totalRows === 0 ? 0 : ((state.currentPage - 1) * state.rowsPerPage) + 1;
    const end = Math.min(start + state.rowsPerPage - 1, state.totalRows);
    
    // Actualizar texto
    infoElement.textContent = state.config.infoText
        .replace('{start}', start)
        .replace('{end}', end)
        .replace('{total}', state.totalRows);
}

/**
 * Actualiza los controles de navegación
 */
function updatePaginationControls(tableId) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    // Botones de navegación
    const firstPage = document.getElementById(`first-${tableId}`);
    const prevPage = document.getElementById(`prev-${tableId}`);
    const nextPage = document.getElementById(`next-${tableId}`);
    const lastPage = document.getElementById(`last-${tableId}`);
    
    // Establecer estado de los botones
    if (firstPage) firstPage.classList.toggle('disabled', state.currentPage === 1);
    if (prevPage) prevPage.classList.toggle('disabled', state.currentPage === 1);
    if (nextPage) nextPage.classList.toggle('disabled', state.currentPage === state.totalPages || state.totalPages === 0);
    if (lastPage) lastPage.classList.toggle('disabled', state.currentPage === state.totalPages || state.totalPages === 0);
    
    // Regenerar botones de página numéricos
    const pagesNav = document.getElementById(`pages-${tableId}`);
    if (!pagesNav) return;
    
    // Eliminar botones de página anteriores (excepto controles de navegación)
    Array.from(pagesNav.querySelectorAll('li:not([id])')).forEach(li => {
        li.remove();
    });
    
    // Insertar botones de página numéricos
    if (state.totalPages <= 7) {
        // Pocas páginas, mostrar todas
        for (let i = 1; i <= state.totalPages; i++) {
            insertPageButton(tableId, i, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
        }
    } else {
        // Muchas páginas, mostrar estratégicamente
        const currentPage = state.currentPage;
        
        // Primera página
        insertPageButton(tableId, 1, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
        
        // Elipsis inicial si estamos lejos del inicio
        if (currentPage > 3) {
            insertEllipsis(tableId, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
        }
        
        // Páginas alrededor de la actual
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(state.totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
            insertPageButton(tableId, i, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
        }
        
        // Elipsis final si estamos lejos del final
        if (currentPage < state.totalPages - 2) {
            insertEllipsis(tableId, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
        }
        
        // Última página
        insertPageButton(tableId, state.totalPages, pagesNav, pagesNav.querySelector(`#next-${tableId}`));
    }
}

/**
 * Inserta un botón de página en la navegación
 */
function insertPageButton(tableId, pageNumber, container, beforeElement) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    const li = document.createElement('li');
    li.className = `page-item ${state.currentPage === pageNumber ? 'active' : ''}`;
    
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = pageNumber;
    
    a.addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(tableId, pageNumber);
    });
    
    li.appendChild(a);
    container.insertBefore(li, beforeElement);
}

/**
 * Inserta un indicador de elipsis en la navegación
 */
function insertEllipsis(tableId, container, beforeElement) {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    
    const span = document.createElement('span');
    span.className = 'page-link';
    span.innerHTML = '&hellip;';
    
    li.appendChild(span);
    container.insertBefore(li, beforeElement);
}

/**
 * Cambia a una página específica
 */
function goToPage(tableId, pageNumber) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    // Validar número de página
    if (pageNumber < 1 || pageNumber > state.totalPages) {
        return;
    }
    
    // Actualizar página actual
    state.currentPage = pageNumber;
    
    // Mostrar filas correspondientes
    showTablePage(tableId);
    
    // Actualizar información y controles
    updatePaginationInfo(tableId);
    updatePaginationControls(tableId);
}

/**
 * Cambia el número de registros por página
 */
function changeRowsPerPage(tableId, rowsPerPage) {
    const state = PaginationState.paginatedTables[tableId];
    if (!state) return;
    
    // Actualizar estado
    state.rowsPerPage = rowsPerPage;
    
    // Guardar preferencia
    saveUserPreference(tableId, rowsPerPage);
    
    // Recalcular paginación
    if (rowsPerPage === 'all') {
        state.totalPages = 1;
        state.currentPage = 1;
    } else {
        state.totalPages = Math.ceil(state.totalRows / rowsPerPage);
        
        // Ajustar página actual si es necesario
        if (state.currentPage > state.totalPages) {
            state.currentPage = state.totalPages;
        }
    }
    
    // Actualizar vista
    showTablePage(tableId);
    updatePaginationInfo(tableId);
    updatePaginationControls(tableId);
}

/**
 * Guarda preferencias de usuario
 */
function saveUserPreference(tableId, rowsPerPage) {
    try {
        const preferences = JSON.parse(localStorage.getItem(PAGINATION_CONFIG.storageKey) || '{}');
        preferences[tableId] = rowsPerPage;
        localStorage.setItem(PAGINATION_CONFIG.storageKey, JSON.stringify(preferences));
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
    }
}

/**
 * Carga preferencias de usuario
 */
function loadUserPreference(tableId) {
    try {
        const preferences = JSON.parse(localStorage.getItem(PAGINATION_CONFIG.storageKey) || '{}');
        return preferences[tableId];
    } catch (error) {
        console.error('Error al cargar preferencias:', error);
        return null;
    }
}

/**
 * Configurar integración con el sistema de navegación
 */
function setupNavigationIntegration() {
    // Intentar integrar con el sistema de navegación existente
    if (typeof window.loadPage === 'function') {
        console.log('Integrando con sistema de navegación existente...');
        
        const originalLoadPage = window.loadPage;
        window.loadPage = function(pageName) {
            // Llamar a la función original
            originalLoadPage(pageName);
            
            // Inicializar tablas de la nueva página
            setTimeout(() => {
                console.log(`Inicializando tablas después de navegar a: ${pageName}`);
                initPageTables(pageName);
            }, 800);
        };
    }
    
    // También escuchar eventos de cambio de página
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', (data) => {
            setTimeout(() => {
                initPageTables(data.to);
            }, 600);
        });
    }
    
    // Sobrescribir las funciones de paginación existentes si las hay
    if (window.tablePaginator) {
        window.tablePaginator.init = initTablePagination;
        window.tablePaginator.update = updateTablePagination;
        window.tablePaginator.goToPage = goToPage;
        window.tablePaginator.changeRowsPerPage = changeRowsPerPage;
    } else {
        // Crear el objeto tablePaginator si no existe
        window.tablePaginator = {
            init: initTablePagination,
            update: updateTablePagination,
            goToPage: goToPage,
            changeRowsPerPage: changeRowsPerPage,
            findAndInitialize: initializeCurrentPageTables
        };
    }
    
    // Reemplazar la función inicializarPaginacion si existe
    if (typeof window.inicializarPaginacion === 'function') {
        window.inicializarPaginacion = initTablePagination;
    }
}

/**
 * Inicializa las tablas de una página específica
 */
function initPageTables(pageName) {
    console.log(`🔄 Inicializando tablas para página: ${pageName}`);
    
    // Obtener selectores para esta página
    const selectors = PAGINATION_CONFIG.autoInitTables[pageName] || [];
    
    if (selectors.length === 0) {
        console.log(`No hay selectores definidos para la página ${pageName}`);
        return;
    }
    
    // Inicializar tablas con los selectores
    selectors.forEach(selector => {
        const tables = document.querySelectorAll(selector);
        if (tables.length > 0) {
            console.log(`Encontradas ${tables.length} tablas con selector: ${selector}`);
            
            tables.forEach(table => {
                // Asegurarse de que la tabla tenga un ID
                if (!table.id) {
                    table.id = `table-${pageName}-${Date.now()}`;
                    console.log(`Asignando ID a tabla: ${table.id}`);
                }
                
                // Inicializar paginación
                initTablePagination(table.id);
            });
        } else {
            console.log(`No se encontraron tablas con selector: ${selector}`);
        }
    });
}

/**
 * Configura el manejo de errores y recuperación
 */
function setupErrorHandling() {
    // Detectar problemas y reintentar si es necesario
    setInterval(() => {
        // Verificar cada tabla paginada
        for (const tableId in PaginationState.paginatedTables) {
            const state = PaginationState.paginatedTables[tableId];
            
            // Verificar si la tabla sigue en el DOM
            if (!document.getElementById(tableId)) {
                console.log(`Tabla #${tableId} ya no existe, eliminando estado`);
                delete PaginationState.paginatedTables[tableId];
                continue;
            }
            
            // Verificar si hay filas pero no están visibles
            if (state.rows.length > 0 && state.rows.every(row => row.style.display === 'none')) {
                console.log(`Detectado problema: Todas las filas de #${tableId} están ocultas`);
                updateTablePagination(tableId);
            }
        }
        
        // Buscar tablas sin paginación que deberían tenerla
        const currentPage = getCurrentPage();
        const selectors = PAGINATION_CONFIG.autoInitTables[currentPage] || [];
        
        selectors.forEach(selector => {
            const tables = document.querySelectorAll(selector);
            tables.forEach(table => {
                if (table.id && !PaginationState.paginatedTables[table.id] && 
                    (!PaginationState.initAttempts[table.id] || PaginationState.initAttempts[table.id] < 3)) {
                    
                    console.log(`Detectada tabla sin paginación: #${table.id}, inicializando...`);
                    initTablePagination(table.id);
                }
            });
        });
    }, 5000);
}

/**
 * Función pública para actualizar todas las tablas
 */
function updateAllTables() {
    console.log('🔄 Actualizando todas las tablas paginadas...');
    
    for (const tableId in PaginationState.paginatedTables) {
        updateTablePagination(tableId);
    }
}

// Inicializar el sistema cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initPaginationSystem);

// Exportar funciones públicas
window.paginationSystem = {
    init: initPaginationSystem,
    updateAll: updateAllTables,
    initPageTables: initPageTables,
    update: updateTablePagination
};