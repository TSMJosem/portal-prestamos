/**
 * table-paginator.js - Sistema de paginación para tablas en ALFIN CASH
 * 
 * Este script añade funcionalidad de paginación a las tablas del sistema,
 * permitiendo mostrar un número configurable de filas por página y navegar
 * entre páginas de forma intuitiva.
 */

// Configuración global del paginador
const PAGINADOR_CONFIG = {
    // Opciones de registros por página
    opcionesPorPagina: [10, 20, 50, 100, 'Todos'],
    
    // Valor por defecto
    valorPorDefecto: 10,
    
    // Texto para la información de paginación
    textoInfo: 'Mostrando {inicio}-{fin} de {total} registros',
    
    // Textos para los botones de navegación
    textoBotones: {
        primero: '<i class="fas fa-angle-double-left"></i>',
        anterior: '<i class="fas fa-angle-left"></i>',
        siguiente: '<i class="fas fa-angle-right"></i>',
        ultimo: '<i class="fas fa-angle-double-right"></i>'
    },
    
    // Almacenamiento en localStorage
    nombreAlmacenamiento: 'alfinCashPaginacionConfig',
    
    // Tablas a las que aplicar paginación automáticamente (selectores CSS)
    tablasAutomaticas: [
        '#tablaClientes', 
        '#tablaPrestamos', 
        '#tablaHistorialPagos', 
        '#tablaPagosPendientes'
    ]
};

// Estado de las tablas paginadas
const tablasPaginadas = {};

// Inicializar paginación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔢 Inicializando sistema de paginación para tablas...');
    iniciarObservadorDOM();
    setTimeout(buscarTablasParaPaginar, 1000);
});

// Función principal para inicializar una tabla con paginación
function inicializarPaginacion(tablaId, opciones = {}) {
    // Obtener la tabla por ID
    const tabla = document.getElementById(tablaId);
    if (!tabla) {
        console.error(`Tabla con ID '${tablaId}' no encontrada`);
        return false;
    }
    
    console.log(`Inicializando paginación para tabla: ${tablaId}`);
    
    // Fusionar opciones con valores por defecto
    const config = { ...PAGINADOR_CONFIG, ...opciones };
    
    // Verificar si ya existe paginación para esta tabla
    if (tablasPaginadas[tablaId]) {
        console.log(`La tabla ${tablaId} ya tiene paginación, actualizando...`);
        return actualizarPaginacion(tablaId);
    }
    
    // Verificar que la tabla tenga un tbody
    const tbody = tabla.querySelector('tbody');
    if (!tbody) {
        console.error(`La tabla ${tablaId} no tiene un elemento tbody`);
        return false;
    }
    
    // Crear un contenedor para los controles de paginación
    const contenedorPaginacion = document.createElement('div');
    contenedorPaginacion.className = 'paginador-container d-flex justify-content-between align-items-center mt-3 flex-wrap';
    contenedorPaginacion.id = `paginador-${tablaId}`;
    
    // Crear selector de registros por página
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'paginador-selector mb-2 d-flex align-items-center';
    
    const selectorLabel = document.createElement('label');
    selectorLabel.htmlFor = `registros-por-pagina-${tablaId}`;
    selectorLabel.className = 'me-2';
    selectorLabel.textContent = 'Mostrar:';
    
    const selector = document.createElement('select');
    selector.id = `registros-por-pagina-${tablaId}`;
    selector.className = 'form-select form-select-sm';
    selector.style.width = 'auto';
    
    // Crear opciones para el selector
    config.opcionesPorPagina.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion === 'Todos' ? 'all' : opcion;
        option.textContent = opcion;
        selector.appendChild(option);
    });
    
    selectorContainer.appendChild(selectorLabel);
    selectorContainer.appendChild(selector);
    
    // Crear contenedor de información
    const infoContainer = document.createElement('div');
    infoContainer.className = 'paginador-info mb-2 text-muted small';
    infoContainer.id = `info-${tablaId}`;
    
    // Crear navegación de páginas
    const navContainer = document.createElement('div');
    navContainer.className = 'paginador-nav mb-2';
    
    const paginacionNav = document.createElement('ul');
    paginacionNav.className = 'pagination pagination-sm';
    paginacionNav.id = `paginas-${tablaId}`;
    
    // Crear botones de navegación
    const botonesNav = ['primero', 'anterior', 'siguiente', 'ultimo'];
    
    botonesNav.forEach(tipo => {
        const li = document.createElement('li');
        li.className = 'page-item';
        li.id = `${tipo}-${tablaId}`;
        
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.innerHTML = config.textoBotones[tipo];
        a.setAttribute('aria-label', tipo);
        
        li.appendChild(a);
        paginacionNav.appendChild(li);
    });
    
    navContainer.appendChild(paginacionNav);
    
    // Añadir todos los elementos al contenedor principal
    contenedorPaginacion.appendChild(selectorContainer);
    contenedorPaginacion.appendChild(infoContainer);
    contenedorPaginacion.appendChild(navContainer);
    
    // Insertar después de la tabla
    tabla.parentNode.insertBefore(contenedorPaginacion, tabla.nextSibling);
    
    // Inicializar estado de la paginación
    const registrosPorPagina = cargarPreferenciasUsuario(tablaId) || config.valorPorDefecto;
    selector.value = registrosPorPagina === 'all' ? 'all' : registrosPorPagina;
    
    tablasPaginadas[tablaId] = {
        elemento: tabla,
        tbody: tbody,
        filas: [],
        totalFilas: 0,
        paginaActual: 1,
        registrosPorPagina: registrosPorPagina === 'all' ? 'all' : parseInt(registrosPorPagina),
        totalPaginas: 1,
        config: config
    };
    
    // Configurar eventos
    selector.addEventListener('change', function() {
        const valor = this.value;
        cambiarRegistrosPorPagina(tablaId, valor === 'all' ? 'all' : parseInt(valor));
    });
    
    document.getElementById(`primero-${tablaId}`).addEventListener('click', function(e) {
        e.preventDefault();
        irAPagina(tablaId, 1);
    });
    
    document.getElementById(`anterior-${tablaId}`).addEventListener('click', function(e) {
        e.preventDefault();
        const paginaAnterior = tablasPaginadas[tablaId].paginaActual - 1;
        if (paginaAnterior > 0) {
            irAPagina(tablaId, paginaAnterior);
        }
    });
    
    document.getElementById(`siguiente-${tablaId}`).addEventListener('click', function(e) {
        e.preventDefault();
        const paginaSiguiente = tablasPaginadas[tablaId].paginaActual + 1;
        if (paginaSiguiente <= tablasPaginadas[tablaId].totalPaginas) {
            irAPagina(tablaId, paginaSiguiente);
        }
    });
    
    document.getElementById(`ultimo-${tablaId}`).addEventListener('click', function(e) {
        e.preventDefault();
        irAPagina(tablaId, tablasPaginadas[tablaId].totalPaginas);
    });
    
    // Inicializar la paginación
    actualizarPaginacion(tablaId);
    return true;
}

// Actualizar la paginación de una tabla
function actualizarPaginacion(tablaId) {
    if (!tablasPaginadas[tablaId]) {
        console.error(`No hay paginación inicializada para la tabla ${tablaId}`);
        return false;
    }
    
    const paginacion = tablasPaginadas[tablaId];
    const tabla = paginacion.elemento;
    const tbody = paginacion.tbody;
    
    // Guardar la referencia a todas las filas
    paginacion.filas = Array.from(tbody.querySelectorAll('tr'));
    paginacion.totalFilas = paginacion.filas.length;
    
    // Si no hay filas o solo hay una fila con mensaje, ocultar la paginación
    if (paginacion.totalFilas === 0 || 
        (paginacion.totalFilas === 1 && paginacion.filas[0].cells.length === 1 && 
         paginacion.filas[0].cells[0].hasAttribute('colspan'))) {
        document.getElementById(`paginador-${tablaId}`).style.display = 'none';
        return false;
    } else {
        document.getElementById(`paginador-${tablaId}`).style.display = 'flex';
    }
    
    // Calcular el número total de páginas
    if (paginacion.registrosPorPagina === 'all') {
        paginacion.totalPaginas = 1;
    } else {
        paginacion.totalPaginas = Math.ceil(paginacion.totalFilas / paginacion.registrosPorPagina);
    }
    
    // Asegurarse de que la página actual sea válida
    if (paginacion.paginaActual > paginacion.totalPaginas) {
        paginacion.paginaActual = paginacion.totalPaginas > 0 ? paginacion.totalPaginas : 1;
    }
    
    // Mostrar las filas correspondientes a la página actual
    mostrarFilasPagina(tablaId);
    
    // Actualizar la información de paginación
    actualizarInfoPaginacion(tablaId);
    
    // Actualizar el estado de los botones de navegación
    actualizarBotonesPaginacion(tablaId);
    
    return true;
}

// Mostrar solo las filas de la página actual
function mostrarFilasPagina(tablaId) {
    const paginacion = tablasPaginadas[tablaId];
    if (!paginacion) return;
    
    const filas = paginacion.filas;
    
    // Ocultar todas las filas primero
    filas.forEach(fila => {
        fila.style.display = 'none';
    });
    
    // Si se muestran todos los registros, mostrar todas las filas
    if (paginacion.registrosPorPagina === 'all') {
        filas.forEach(fila => {
            fila.style.display = '';
        });
        return;
    }
    
    // Calcular rango de filas a mostrar
    const inicio = (paginacion.paginaActual - 1) * paginacion.registrosPorPagina;
    const fin = Math.min(inicio + paginacion.registrosPorPagina, filas.length);
    
    // Mostrar solo las filas correspondientes
    for (let i = inicio; i < fin; i++) {
        if (filas[i]) {
            filas[i].style.display = '';
        }
    }
}

// Actualizar información de paginación
function actualizarInfoPaginacion(tablaId) {
    const paginacion = tablasPaginadas[tablaId];
    if (!paginacion) return;
    
    const infoElement = document.getElementById(`info-${tablaId}`);
    if (!infoElement) return;
    
    // Si se muestran todos los registros
    if (paginacion.registrosPorPagina === 'all') {
        infoElement.textContent = `Mostrando todos los ${paginacion.totalFilas} registros`;
        return;
    }
    
    // Calcular rango actual
    const inicio = paginacion.totalFilas === 0 ? 0 : ((paginacion.paginaActual - 1) * paginacion.registrosPorPagina) + 1;
    const fin = Math.min(inicio + paginacion.registrosPorPagina - 1, paginacion.totalFilas);
    
    // Actualizar texto
    infoElement.textContent = paginacion.config.textoInfo
        .replace('{inicio}', inicio)
        .replace('{fin}', fin)
        .replace('{total}', paginacion.totalFilas);
}

// Actualizar estado de los botones de navegación
function actualizarBotonesPaginacion(tablaId) {
    const paginacion = tablasPaginadas[tablaId];
    if (!paginacion) return;
    
    // Botones de navegación
    const primeroPagina = document.getElementById(`primero-${tablaId}`);
    const anteriorPagina = document.getElementById(`anterior-${tablaId}`);
    const siguientePagina = document.getElementById(`siguiente-${tablaId}`);
    const ultimoPagina = document.getElementById(`ultimo-${tablaId}`);
    
    // Desactivar/activar botones según la página actual
    primeroPagina.classList.toggle('disabled', paginacion.paginaActual === 1);
    anteriorPagina.classList.toggle('disabled', paginacion.paginaActual === 1);
    siguientePagina.classList.toggle('disabled', paginacion.paginaActual === paginacion.totalPaginas || paginacion.totalPaginas === 0);
    ultimoPagina.classList.toggle('disabled', paginacion.paginaActual === paginacion.totalPaginas || paginacion.totalPaginas === 0);
    
    // Regenerar la barra de paginación numérica
    const navPaginas = document.getElementById(`paginas-${tablaId}`);
    
    // Eliminar botones de página anteriores (excepto los de navegación)
    Array.from(navPaginas.querySelectorAll('li:not([id])')).forEach(li => {
        li.remove();
    });
    
    // Si hay pocas páginas, mostrar todas
    if (paginacion.totalPaginas <= 7) {
        for (let i = 1; i <= paginacion.totalPaginas; i++) {
            insertarBotonPagina(tablaId, i, navPaginas, anteriorPagina);
        }
    } else {
        // Estrategia para muchas páginas
        const paginaActual = paginacion.paginaActual;
        
        // Primera página
        insertarBotonPagina(tablaId, 1, navPaginas, anteriorPagina);
        
        // Si no estamos cerca del inicio, insertar elipsis
        if (paginaActual > 3) {
            insertarElipsis(navPaginas, anteriorPagina);
        }
        
        // Páginas alrededor de la actual
        const inicio = Math.max(2, paginaActual - 1);
        const fin = Math.min(paginacion.totalPaginas - 1, paginaActual + 1);
        
        for (let i = inicio; i <= fin; i++) {
            insertarBotonPagina(tablaId, i, navPaginas, anteriorPagina);
        }
        
        // Si no estamos cerca del final, insertar elipsis
        if (paginaActual < paginacion.totalPaginas - 2) {
            insertarElipsis(navPaginas, anteriorPagina);
        }
        
        // Última página
        insertarBotonPagina(tablaId, paginacion.totalPaginas, navPaginas, anteriorPagina);
    }
}

// Insertar botón para una página específica
function insertarBotonPagina(tablaId, numeroPagina, navPaginas, anteriorElemento) {
    const paginacion = tablasPaginadas[tablaId];
    
    // Crear elemento para la página
    const li = document.createElement('li');
    li.className = `page-item ${paginacion.paginaActual === numeroPagina ? 'active' : ''}`;
    
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = numeroPagina;
    
    // Evento de clic
    a.addEventListener('click', function(e) {
        e.preventDefault();
        irAPagina(tablaId, numeroPagina);
    });
    
    li.appendChild(a);
    
    // Insertar después del elemento anterior
    navPaginas.insertBefore(li, anteriorElemento.nextSibling);
    
    return li;
}

// Insertar elipsis para indicar páginas omitidas
function insertarElipsis(navPaginas, anteriorElemento) {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    
    const span = document.createElement('span');
    span.className = 'page-link';
    span.innerHTML = '&hellip;';
    
    li.appendChild(span);
    navPaginas.insertBefore(li, anteriorElemento.nextSibling);
    
    return li;
}

// Cambiar a una página específica
function irAPagina(tablaId, numeroPagina) {
    const paginacion = tablasPaginadas[tablaId];
    if (!paginacion) return;
    
    // Validar número de página
    if (numeroPagina < 1 || numeroPagina > paginacion.totalPaginas) {
        return;
    }
    
    // Actualizar página actual
    paginacion.paginaActual = numeroPagina;
    
    // Mostrar las filas correspondientes
    mostrarFilasPagina(tablaId);
    
    // Actualizar información y botones
    actualizarInfoPaginacion(tablaId);
    actualizarBotonesPaginacion(tablaId);
}

// Cambiar el número de registros por página
function cambiarRegistrosPorPagina(tablaId, cantidad) {
    const paginacion = tablasPaginadas[tablaId];
    if (!paginacion) return;
    
    // Actualizar valor
    paginacion.registrosPorPagina = cantidad;
    
    // Guardar preferencia del usuario
    guardarPreferenciasUsuario(tablaId, cantidad);
    
    // Recalcular paginación
    if (cantidad === 'all') {
        paginacion.totalPaginas = 1;
        paginacion.paginaActual = 1;
    } else {
        paginacion.totalPaginas = Math.ceil(paginacion.totalFilas / cantidad);
        
        // Ajustar página actual si es necesario
        if (paginacion.paginaActual > paginacion.totalPaginas) {
            paginacion.paginaActual = paginacion.totalPaginas;
        }
    }
    
    // Actualizar vista
    mostrarFilasPagina(tablaId);
    actualizarInfoPaginacion(tablaId);
    actualizarBotonesPaginacion(tablaId);
}

// Guardar preferencias de registros por página
function guardarPreferenciasUsuario(tablaId, cantidad) {
    try {
        const preferencias = JSON.parse(localStorage.getItem(PAGINADOR_CONFIG.nombreAlmacenamiento) || '{}');
        preferencias[tablaId] = cantidad;
        localStorage.setItem(PAGINADOR_CONFIG.nombreAlmacenamiento, JSON.stringify(preferencias));
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
    }
}

// Cargar preferencias de registros por página
function cargarPreferenciasUsuario(tablaId) {
    try {
        const preferencias = JSON.parse(localStorage.getItem(PAGINADOR_CONFIG.nombreAlmacenamiento) || '{}');
        return preferencias[tablaId];
    } catch (error) {
        console.error('Error al cargar preferencias:', error);
        return null;
    }
}

// Buscar tablas que necesitan paginación
function buscarTablasParaPaginar() {
    console.log('🔍 Buscando tablas para paginar...');
    
    // Verificar en qué página estamos actualmente
    let paginaActual = window.currentPage || 'dashboard';
    
    // También intentar detectar la página activa por DOM
    const paginaActivaElement = document.querySelector('.page-content.active');
    if (paginaActivaElement && paginaActivaElement.id) {
        paginaActual = paginaActivaElement.id;
    }
    
    console.log(`Página actual detectada: ${paginaActual}`);
    
    // Paginación automática para tablas conocidas
    PAGINADOR_CONFIG.tablasAutomaticas.forEach(selector => {
        // Buscar tanto de forma global como dentro de la página actual
        let tablas = [];
        
        // Intentar primero en el contenedor de la página actual
        const paginaActivaElement = document.getElementById(paginaActual);
        if (paginaActivaElement) {
            const tablasEnPagina = paginaActivaElement.querySelectorAll(selector);
            if (tablasEnPagina.length > 0) {
                tablas = [...tablasEnPagina];
            }
        }
        
        // Si no se encontraron en la página actual, buscar globalmente
        if (tablas.length === 0) {
            const tablasGlobales = document.querySelectorAll(selector);
            if (tablasGlobales.length > 0) {
                tablas = [...tablasGlobales];
            }
        }
        
        // Procesar tablas encontradas
        if (tablas.length > 0) {
            console.log(`Encontradas ${tablas.length} tablas con selector: ${selector}`);
            
            tablas.forEach(tabla => {
                // Verificar si la tabla tiene ID
                if (!tabla.id) {
                    const idGenerado = `tabla-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    console.log(`Tabla sin ID detectada, asignando ID: ${idGenerado}`);
                    tabla.id = idGenerado;
                }
                
                // Solo inicializar si no existe paginación para esta tabla
                if (!tablasPaginadas[tabla.id]) {
                    console.log(`✅ Inicializando paginación para tabla: ${tabla.id}`);
                    inicializarPaginacion(tabla.id);
                } else {
                    console.log(`Actualizando paginación existente para tabla: ${tabla.id}`);
                    actualizarPaginacion(tabla.id);
                }
            });
        } else {
            console.log(`No se encontraron tablas con selector: ${selector}`);
        }
    });
    
    // Buscar también cualquier tabla con clase table-paginate
    const tablasConClase = document.querySelectorAll('.table-paginate');
    if (tablasConClase.length > 0) {
        console.log(`Encontradas ${tablasConClase.length} tablas con clase table-paginate`);
        
        tablasConClase.forEach(tabla => {
            if (!tabla.id) {
                const idGenerado = `tabla-paginate-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                tabla.id = idGenerado;
            }
            
            if (!tablasPaginadas[tabla.id]) {
                inicializarPaginacion(tabla.id);
            } else {
                actualizarPaginacion(tabla.id);
            }
        });
    }
    
    // Verificar que las tablas paginadas siguen en el DOM
    // y eliminar paginación para las que ya no están
    for (const tablaId in tablasPaginadas) {
        if (!document.getElementById(tablaId)) {
            console.log(`Eliminando paginación para tabla inexistente: ${tablaId}`);
            
            // Eliminar elementos de la paginación
            const paginador = document.getElementById(`paginador-${tablaId}`);
            if (paginador) paginador.remove();
            
            // Eliminar de la lista de tablas paginadas
            delete tablasPaginadas[tablaId];
        }
    }
}

// Observer para detectar cambios en el DOM
function iniciarObservadorDOM() {
    console.log('🔄 Iniciando observador mejorado para tablas paginadas');
    
    // Listener para eventos de navegación
    document.addEventListener('click', function(event) {
        // Detectar clics en enlaces de navegación
        if (event.target.hasAttribute('data-page') || 
            event.target.closest('[data-page]')) {
            
            // Obtener la página destino
            const pageTarget = event.target.getAttribute('data-page') || 
                               event.target.closest('[data-page]').getAttribute('data-page');
            
            console.log(`Detectada navegación hacia: ${pageTarget}`);
            
            // Programar búsqueda de tablas en la nueva página
            setTimeout(() => {
                console.log(`Buscando tablas después de navegación a: ${pageTarget}`);
                buscarTablasParaPaginar();
                
                // Segundo intento por si acaso
                setTimeout(buscarTablasParaPaginar, 800);
            }, 500);
        }
    });
    
    // Crear un observer para vigilar cambios en el contenido
    const observer = new MutationObserver(function(mutations) {
        let actualizarTablas = false;
        let nuevaTablaDetectada = false;
        
        mutations.forEach(function(mutation) {
            // Si se añaden nodos
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Revisar si alguno de los nodos añadidos es una tabla o contiene tablas
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    
                    // Solo procesar elementos DOM
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    
                    // Verificar si es una tabla o contiene tablas
                    if (node.tagName === 'TABLE' || node.querySelector('table')) {
                        nuevaTablaDetectada = true;
                        break;
                    }
                    
                    // También buscar filas nuevas que puedan afectar tablas existentes
                    if (node.tagName === 'TR' || node.tagName === 'TBODY') {
                        actualizarTablas = true;
                    }
                }
            }
            
            // Si cambia la clase de algún elemento, podría indicar cambio de página
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                
                // Verificar si es una página que está siendo activada
                if (target.classList.contains('page-content') || 
                    target.classList.contains('active')) {
                    
                    console.log('Detectado cambio de página, reiniciando búsqueda de tablas...');
                    
                    // Programar búsqueda de tablas en la nueva página
                    setTimeout(buscarTablasParaPaginar, 400);
                }
                
                // Verificar si es una tabla que cambió
                if (target.tagName === 'TABLE' || target.querySelector('table')) {
                    actualizarTablas = true;
                }
                
                // Verificar si alguna tabla ya paginada ha cambiado
                for (const tablaId in tablasPaginadas) {
                    if (mutation.target === tablasPaginadas[tablaId].elemento || 
                        mutation.target === tablasPaginadas[tablaId].tbody) {
                        
                        console.log(`Tabla paginada modificada: ${tablaId}, actualizando...`);
                        actualizarPaginacion(tablaId);
                    }
                }
            }
        });
        
        // Si se detectó una nueva tabla, buscar tablas para paginar
        if (nuevaTablaDetectada) {
            console.log('Nueva tabla detectada, inicializando paginación...');
            setTimeout(buscarTablasParaPaginar, 200);
        } 
        // Si solo hubo cambios en tablas existentes, actualizar la paginación
        else if (actualizarTablas) {
            console.log('Cambios detectados en tablas, actualizando paginación...');
            
            // Actualizar todas las tablas paginadas
            for (const tablaId in tablasPaginadas) {
                setTimeout(() => actualizarPaginacion(tablaId), 200);
            }
        }
    });
    
    // Observar todo el cuerpo del documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'display']
    });
}

// Estilo CSS para los controles de paginación
function agregarEstilos() {
    if (document.getElementById('table-paginator-styles')) {
        return;
    }
    
    const estilos = document.createElement('style');
    estilos.id = 'table-paginator-styles';
    estilos.textContent = `
        .paginador-container {
            background-color: #f8f9fa;
            border-radius: 0 0 0.25rem 0.25rem;
            padding: 10px;
            border: 1px solid #dee2e6;
            border-top: none;
        }
        
        .paginador-selector select.form-select-sm {
            min-width: 80px;
        }
        
        .paginador-info {
            color: #6c757d;
        }
        
        .page-link {
            color: #4682B4;
        }
        
        .page-item.active .page-link {
            background-color: #4682B4;
            border-color: #4682B4;
        }
        
        .page-link:focus {
            box-shadow: 0 0 0 0.25rem rgba(70, 130, 180, 0.25);
        }
        
        @media (max-width: 768px) {
            .paginador-container {
                flex-direction: column;
                align-items: center;
            }
            
            .paginador-selector, .paginador-info, .paginador-nav {
                margin-bottom: 10px;
                width: 100%;
                text-align: center;
            }
            
            .pagination {
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(estilos);
}

// Función para realizar inicialización con reintento
function inicializarConReintento(maxIntentos = 3) {
    let intento = 1;
    
    function intentarInicializacion() {
        console.log(`Intento ${intento}/${maxIntentos} de inicialización de paginación...`);
        
        // Buscar tablas para paginar
        buscarTablasParaPaginar();
        
        // Si hay tablas paginadas, considerar exitoso
        const hayTablasPaginadas = Object.keys(tablasPaginadas).length > 0;
        
        if (!hayTablasPaginadas && intento < maxIntentos) {
            // Incrementar intento y programar siguiente intento
            intento++;
            setTimeout(intentarInicializacion, intento * 500); // Retraso incremental
        } else if (hayTablasPaginadas) {
            console.log(`✅ Paginación inicializada exitosamente en el intento ${intento}`);
        } else {
            console.log(`⚠️ No se pudieron encontrar tablas para paginar después de ${maxIntentos} intentos`);
        }
    }
    
    // Iniciar el primer intento
    intentarInicializacion();
}

// Inicializar paginación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔢 Inicializando sistema de paginación para tablas...');
    
    // Añadir estilos
    agregarEstilos();
    
    // Iniciar observador DOM
    iniciarObservadorDOM();
    
    // Inicializar con sistema de reintento
    setTimeout(() => {
        inicializarConReintento(4);
    }, 800);
    
    // También programar una verificación para cuando la página esté completamente cargada
    window.addEventListener('load', function() {
        setTimeout(buscarTablasParaPaginar, 1000);
    });
    
    // Escuchar cambios en currentPage (variable global)
    const descriptor = Object.getOwnPropertyDescriptor(window, 'currentPage');
    if (descriptor && descriptor.configurable) {
        let valorActual = window.currentPage;
        
        Object.defineProperty(window, 'currentPage', {
            get: function() { return valorActual; },
            set: function(nuevoValor) {
                const valorAnterior = valorActual;
                valorActual = nuevoValor;
                
                console.log(`🔄 Variable currentPage cambiada: ${valorAnterior} → ${nuevoValor}`);
                setTimeout(buscarTablasParaPaginar, 600);
            },
            configurable: true
        });
    }
});

// Exponer funciones al ámbito global
window.tablePaginator = {
    init: inicializarPaginacion,
    update: actualizarPaginacion,
    goToPage: irAPagina,
    changeRowsPerPage: cambiarRegistrosPorPagina,
    findAndInitialize: buscarTablasParaPaginar
};

// Inicializar automáticamente para tablas conocidas
console.log('🔢 Sistema de paginación de tablas listo');