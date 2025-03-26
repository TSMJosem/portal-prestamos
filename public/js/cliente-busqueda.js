/**
 * Función para implementar búsqueda en tiempo real en la tabla de clientes
 * Esta función filtra los clientes conforme el usuario escribe en la barra de búsqueda
 */
function implementarBusquedaEnTiempoReal() {
    console.log('🔍 Configurando búsqueda en tiempo real para clientes...');
    
    // Obtener referencia al campo de búsqueda
    const campoBusqueda = document.getElementById('buscarCliente');
    if (!campoBusqueda) {
        console.error('No se encontró el campo de búsqueda #buscarCliente');
        return;
    }
    
    // Remover event listeners previos para evitar duplicación
    const nuevoInput = campoBusqueda.cloneNode(true);
    campoBusqueda.parentNode.replaceChild(nuevoInput, campoBusqueda);
    
    // Referencia al nuevo elemento
    const inputBusqueda = document.getElementById('buscarCliente');
    
    // Guardar referencia a los datos originales para restaurar al borrar búsqueda
    let datosOriginales = null;
    
    // Añadir event listener para eventos de escritura
    inputBusqueda.addEventListener('input', function(e) {
        // Obtener término de búsqueda y eliminar espacios en blanco extras
        const terminoBusqueda = e.target.value.trim().toLowerCase();
        
        // Si es la primera búsqueda, guardar datos originales
        if (!datosOriginales) {
            datosOriginales = window.clientesCache?.datos || window.clientes || [];
            console.log(`Guardando ${datosOriginales.length} registros originales para búsqueda`);
        }
        
        // Si el campo está vacío, restaurar datos originales
        if (!terminoBusqueda) {
            console.log('Campo de búsqueda vacío, mostrando todos los clientes');
            // Restaurar la tabla original
            const datos = datosOriginales || [];
            actualizarTablaConResultados(datos);
            return;
        }
        
        console.log(`Buscando clientes que coincidan con: "${terminoBusqueda}"`);
        
        // Obtener datos de clientes (usar caché si está disponible)
        const clientes = datosOriginales || [];
        
        // Filtrar clientes según el término de búsqueda
        const clientesFiltrados = clientes.filter(cliente => {
            // Buscar en múltiples campos para mayor usabilidad
            return (
                (cliente.nombreCompleto && cliente.nombreCompleto.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.numeroDocumento && cliente.numeroDocumento.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.telefono && cliente.telefono.toLowerCase().includes(terminoBusqueda)) ||
                (cliente.correoElectronico && cliente.correoElectronico.toLowerCase().includes(terminoBusqueda))
            );
        });
        
        console.log(`Se encontraron ${clientesFiltrados.length} coincidencias`);
        
        // Actualizar la tabla con los resultados filtrados
        actualizarTablaConResultados(clientesFiltrados);
    });
    
    // Añadir botón para limpiar búsqueda
    agregarBotonLimpiarBusqueda(inputBusqueda);
    
    console.log('✅ Búsqueda en tiempo real configurada exitosamente');
}

/**
 * Actualiza la tabla de clientes con los resultados de la búsqueda
 * @param {Array} clientes - Array de clientes filtrados para mostrar
 */
function actualizarTablaConResultados(clientes) {
    // Primero intentar usar las funciones existentes
    if (typeof mostrarClientesEnTabla === 'function') {
        mostrarClientesEnTabla(clientes);
    } else if (typeof window.mostrarClientesEnTabla === 'function') {
        window.mostrarClientesEnTabla(clientes);
    } else {
        // Si no hay función existente, usar actualización directa
        actualizarTablaPorDOM(clientes);
    }
    
    // Actualizar contador con número de resultados
    actualizarContadorResultados(clientes.length);
}

/**
 * Actualiza el contador de resultados de búsqueda
 * @param {number} cantidad - Número de clientes encontrados
 */
function actualizarContadorResultados(cantidad) {
    // Intentar actualizar contador con función existente
    if (typeof actualizarContador === 'function') {
        actualizarContador(cantidad);
    } else {
        // Actualización directa de contadores
        const contador = document.getElementById('totalClientes');
        if (contador) contador.textContent = cantidad;
        
        const contadorOculto = document.getElementById('contadorClientes');
        if (contadorOculto) contadorOculto.textContent = cantidad;
    }
    
    // Mostrar mensaje de búsqueda si está disponible
    const mensajeBusqueda = document.getElementById('mensajeBusqueda');
    if (mensajeBusqueda) {
        if (cantidad === 0) {
            mensajeBusqueda.textContent = 'No se encontraron clientes con ese criterio';
            mensajeBusqueda.style.display = 'block';
        } else {
            mensajeBusqueda.style.display = 'none';
        }
    }
}

/**
 * Agrega un botón para limpiar la búsqueda
 * @param {HTMLElement} inputBusqueda - Elemento de entrada de búsqueda
 */
function agregarBotonLimpiarBusqueda(inputBusqueda) {
    // Verificar si el campo de búsqueda tiene un padre que podamos usar
    const contenedor = inputBusqueda.parentElement;
    if (!contenedor) return;
    
    // Crear botón de limpiar
    const botonLimpiar = document.createElement('button');
    botonLimpiar.type = 'button';
    botonLimpiar.className = 'btn btn-outline-secondary btn-sm position-absolute end-0 me-5 mt-1 d-none';
    botonLimpiar.style.top = '0';
    botonLimpiar.style.padding = '0.25rem 0.5rem';
    botonLimpiar.innerHTML = '<i class="fas fa-times"></i>';
    botonLimpiar.title = 'Limpiar búsqueda';
    botonLimpiar.id = 'limpiarBusqueda';
    
    // Asegurarse de que el contenedor tenga posición relativa
    contenedor.style.position = 'relative';
    
    // Añadir al DOM, justo después del input
    inputBusqueda.insertAdjacentElement('afterend', botonLimpiar);
    
    // Mostrar/ocultar botón según contenido del input
    inputBusqueda.addEventListener('input', function() {
        if (this.value.trim()) {
            botonLimpiar.classList.remove('d-none');
        } else {
            botonLimpiar.classList.add('d-none');
        }
    });
    
    // Función para limpiar búsqueda
    botonLimpiar.addEventListener('click', function() {
        inputBusqueda.value = '';
        inputBusqueda.dispatchEvent(new Event('input'));
        botonLimpiar.classList.add('d-none');
        inputBusqueda.focus();
    });
}

/**
 * Inicializa la funcionalidad de búsqueda cuando el DOM está listo
 */
function inicializarBusquedaClientes() {
    // Primero verificar si ya estamos en la página de clientes
    if (window.currentPage === 'clientes' || 
        document.getElementById('clientes')?.classList.contains('active')) {
        // Configurar búsqueda inmediatamente
        setTimeout(implementarBusquedaEnTiempoReal, 500);
    }
    
    // También configurar para cuando se navegue a la página de clientes
    document.addEventListener('pageChanged', function(event) {
        if (event.detail && event.detail.to === 'clientes') {
            setTimeout(implementarBusquedaEnTiempoReal, 500);
        }
    });
    
    // Para el sistema de navegación antiguo
    if (window.appEvents && typeof window.appEvents.on === 'function') {
        window.appEvents.on('pageChanged', function(data) {
            if (data.to === 'clientes') {
                setTimeout(implementarBusquedaEnTiempoReal, 500);
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarBusquedaClientes);

// En caso de que el DOM ya esté cargado cuando se ejecute este script
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inicializarBusquedaClientes();
}