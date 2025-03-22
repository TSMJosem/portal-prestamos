/**
 * auto-clientes.js - Generador automático de clientes para pruebas
 * 
 * Este script genera automáticamente clientes de ejemplo para facilitar
 * las pruebas del sistema ALFIN CASH. Se activa al hacer clic en el botón
 * "Nuevo Cliente" mientras se mantiene presionada la tecla Alt.
 */

// Configuración del generador
const CONFIG = {
    // Número de clientes a generar por defecto
    clientesPorLote: 5,
    
    // Probabilidad de que un cliente sea inactivo (0-1)
    probabilidadInactivo: 0.2,
    
    // Control de errores y reintentos
    maxReintentosPorCliente: 2,     // Número máximo de reintentos por cliente
    delayEntreClientesBase: 200,    // Retraso base entre clientes (ms)
    incrementoDelayPorLote: 20,     // Incremento de retraso por cada cliente en el lote (ms)
    
    // Datos para generación aleatoria
    datos: {
        nombres: [
            "Juan", "María", "Carlos", "Ana", "Pedro", "Laura", "Javier", "Sofía", 
            "Miguel", "Lucía", "Roberto", "Fernanda", "Eduardo", "Paola", "Ricardo", 
            "Gabriela", "Diego", "Alejandra", "Daniel", "Claudia", "Raúl", "Valeria",
            "Pablo", "Verónica", "Fernando", "Adriana", "Francisco", "Silvia", "Luis",
            "Patricia", "Héctor", "Mariana", "Arturo", "Natalia", "Jorge", "Andrea"
        ],
        apellidos: [
            "Gómez", "Rodríguez", "López", "Pérez", "González", "Martínez", "Sánchez", 
            "Fernández", "Torres", "Díaz", "Hernández", "Flores", "García", "Ramírez", 
            "Vargas", "Romero", "Mendoza", "Ruiz", "Reyes", "Morales", "Castro", "Ortega",
            "Gutiérrez", "Álvarez", "Jiménez", "Vázquez", "Acosta", "Molina", "Delgado", 
            "Castillo", "Fuentes", "Muñoz", "Rojas", "Contreras", "Aguirre", "Navarro"
        ],
        segundoApellido: [
            "Silva", "Castro", "Ortega", "Ramos", "Rivera", "Cruz", "Aguilar", "Núñez", 
            "Vega", "Molina", "Rojas", "Campos", "Medina", "Cortés", "Castillo", "León", 
            "Jiménez", "Vera", "Bravo", "Navarro", "Soto", "Arias", "Cervantes", "Cabrera",
            "Miranda", "Carrillo", "Méndez", "Rangel", "Pacheco", "Espinoza", "Escobar",
            "Velázquez", "Guerrero", "Benítez", "Sandoval", "Beltrán"
        ],
        dominios: ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "live.com",
                  "protonmail.com", "icloud.com", "mail.com", "zoho.com", "aol.com"]
    }
};

// Indicador de si la tecla Alt está presionada
let altKeyPressed = false;

// Escuchar eventos de teclado
document.addEventListener('keydown', function(event) {
    if (event.key === 'Alt') {
        altKeyPressed = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'Alt') {
        altKeyPressed = false;
    }
});

// Función principal de inicialización
function initAutoClientes() {
    console.log('🤖 Inicializando generador automático de clientes...');
    
    // Buscar el botón "Nuevo Cliente" original y configurar interceptor
    configurarInterceptor();
    
    // Añadir estilos CSS para la interfaz del generador
    agregarEstilos();
}

// Configurar interceptor del botón "Nuevo Cliente"
function configurarInterceptor() {
    // Añadir un botón de generador alternativo en la interfaz (más fiable)
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(agregarBotonGenerador, 1000);
    });
    
    // También monitorear todos los botones "Nuevo Cliente" para la tecla Alt
    document.addEventListener('click', function(event) {
        // Verificar si el elemento clickeado es el botón de nuevo cliente
        const isNewClientButton = 
            (event.target.id === 'btnNuevoCliente') || 
            (event.target.closest('#btnNuevoCliente')) ||
            (event.target.innerText?.includes('Nuevo Cliente')) ||
            (event.target.closest('button')?.innerText?.includes('Nuevo Cliente'));
            
        // Si es el botón y Alt está presionado, mostrar el generador en lugar del formulario normal
        if (isNewClientButton && altKeyPressed) {
            event.preventDefault();
            event.stopPropagation();
            mostrarGeneradorClientes();
        }
    }, true); // Usar fase de captura para interceptar antes de que llegue al handler original
}

// Añadir botón de generador directamente en la interfaz
function agregarBotonGenerador() {
    // Verificar si estamos en la página de clientes
    const esClientes = 
        (window.currentPage === 'clientes') || 
        (document.getElementById('clientes')?.classList.contains('active'));
    
    if (!esClientes) return;
    
    // Buscar el botón original
    const btnOriginal = document.querySelector('#btnNuevoCliente');
    if (!btnOriginal) {
        console.log('No se encontró el botón original de "Nuevo Cliente"');
        return;
    }
    
    // Verificar si ya existe nuestro botón
    if (document.getElementById('btnGeneradorClientes')) return;
    
    // Crear el nuevo botón
    const btnGenerador = document.createElement('button');
    btnGenerador.id = 'btnGeneradorClientes';
    btnGenerador.className = 'btn btn-success ms-2';
    btnGenerador.title = 'Generar clientes de prueba automáticamente';
    btnGenerador.innerHTML = '<i class="fas fa-robot"></i> Generar Clientes';
    btnGenerador.onclick = function(event) {
        event.preventDefault();
        mostrarGeneradorClientes();
    };
    
    // Insertar el botón después del original
    btnOriginal.parentNode.insertBefore(btnGenerador, btnOriginal.nextSibling);
    
    console.log('Botón de generador añadido a la interfaz');
}

// Mostrar el modal del generador de clientes
function mostrarGeneradorClientes() {
    // Verificar si ya existe el modal
    let modalGenerador = document.getElementById('modalGeneradorClientes');
    
    if (!modalGenerador) {
        // Crear el modal si no existe
        modalGenerador = document.createElement('div');
        modalGenerador.id = 'modalGeneradorClientes';
        modalGenerador.className = 'modal fade';
        modalGenerador.tabIndex = '-1';
        modalGenerador.setAttribute('aria-labelledby', 'tituloGeneradorClientes');
        modalGenerador.setAttribute('aria-hidden', 'true');
        
        modalGenerador.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="tituloGeneradorClientes">
                            <i class="fas fa-robot me-2"></i> Generador de Clientes
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i> 
                            Este generador crea clientes con datos aleatorios para pruebas del sistema.
                        </div>
                        
                        <form id="formGeneradorClientes">
                            <div class="mb-3">
                                <label for="cantidadClientes" class="form-label">Cantidad de clientes a generar</label>
                                <input type="number" class="form-control" id="cantidadClientes" 
                                       min="1" max="50" value="${CONFIG.clientesPorLote}" required>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="incluirInactivos" checked>
                                    <label class="form-check-label" for="incluirInactivos">
                                        Incluir algunos clientes inactivos
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="prefijoDocumento" class="form-label">Prefijo para documentos (opcional)</label>
                                <input type="text" class="form-control" id="prefijoDocumento" 
                                       placeholder="TEST-" maxlength="10">
                                <div class="form-text">Útil para identificar clientes de prueba</div>
                            </div>
                        </form>
                        
                        <div id="resultadoGeneracion" class="mt-3" style="display: none;">
                            <div class="progress mb-3">
                                <div id="progresoGeneracion" class="progress-bar progress-bar-striped progress-bar-animated" 
                                     role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div id="estadoGeneracion" class="small text-muted text-center"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success" id="btnGenerarClientes">
                            <i class="fas fa-magic me-1"></i> Generar Clientes
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGenerador);
        
        // Configurar evento para el botón de generar
        document.getElementById('btnGenerarClientes').addEventListener('click', generarClientes);
    }
    
    // Mostrar el modal
    try {
        const modal = new bootstrap.Modal(modalGenerador);
        modal.show();
    } catch (error) {
        console.error('Error al mostrar modal:', error);
        
        // Intento de recuperación sin Bootstrap
        modalGenerador.style.display = 'block';
        modalGenerador.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Crear backdrop
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    }
}

// Generar clientes aleatorios
function generarClientes() {
    // Obtener configuración del formulario
    const cantidad = parseInt(document.getElementById('cantidadClientes').value) || CONFIG.clientesPorLote;
    const incluirInactivos = document.getElementById('incluirInactivos').checked;
    const prefijoDocumento = document.getElementById('prefijoDocumento').value || '';
    
    // Validar cantidad
    if (cantidad < 1 || cantidad > 50) {
        mostrarMensaje('Por favor, ingrese una cantidad entre 1 y 50', 'warning');
        return;
    }
    
    // Contadores para estadísticas
    let clientesExitosos = 0;
    let clientesFallidos = 0;
    
    // Mostrar y reiniciar barra de progreso
    const resultadoDiv = document.getElementById('resultadoGeneracion');
    const progresoBar = document.getElementById('progresoGeneracion');
    const estadoDiv = document.getElementById('estadoGeneracion');
    
    resultadoDiv.style.display = 'block';
    progresoBar.style.width = '0%';
    progresoBar.setAttribute('aria-valuenow', '0');
    estadoDiv.textContent = 'Preparando generación...';
    
    // Deshabilitar botón de generar
    const btnGenerar = document.getElementById('btnGenerarClientes');
    const textoOriginal = btnGenerar.innerHTML;
    btnGenerar.disabled = true;
    btnGenerar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generando...';
    
    // Mostrar mensaje informativo para cantidades grandes
    if (cantidad > 10) {
        mostrarMensaje(`Generando ${cantidad} clientes. Esto puede tardar un poco, por favor espera...`, 'info');
    }
    
    // Generar y enviar clientes de forma secuencial
    generarClientesSecuencial(0, cantidad, incluirInactivos, prefijoDocumento, async (index, total, cliente) => {
        // Actualizar progreso
        const progreso = Math.round((index / total) * 100);
        progresoBar.style.width = `${progreso}%`;
        progresoBar.setAttribute('aria-valuenow', progreso);
        
        // Actualizar texto de estado
        if (index < total) {
            if (cliente.nombreCompleto) {
                estadoDiv.textContent = `Generando cliente ${index+1}/${total}: ${cliente.nombreCompleto}`;
                clientesExitosos++;
            } else {
                clientesFallidos++;
            }
        }
        
        // Si es el último cliente, mostrar mensaje final y actualizar tabla
        if (index >= total) {
            // Mensaje final con estadísticas
            const mensajeFinal = clientesFallidos > 0
                ? `¡Generación completada! Se crearon ${clientesExitosos} clientes (${clientesFallidos} fallidos).`
                : `¡Generación completada! Se crearon ${total} clientes exitosamente.`;
                
            estadoDiv.textContent = mensajeFinal;
            
            // Mensaje emergente con resultado
            mostrarMensaje(mensajeFinal, clientesFallidos > 0 ? 'warning' : 'success');
            
            // Restaurar botón
            btnGenerar.disabled = false;
            btnGenerar.innerHTML = textoOriginal;
            
            // Actualizar tabla de clientes
            setTimeout(() => {
                if (typeof garantizarCargaClientes === 'function') {
                    garantizarCargaClientes();
                } else if (typeof cargarClientes === 'function') {
                    cargarClientes(true); // Forzar recarga
                } else if (typeof window.clientesCache !== 'undefined') {
                    // Forzar recarga invalidando caché
                    window.clientesCache.timestamp = 0;
                    if (typeof window.actualizarTablaClientes === 'function') {
                        window.actualizarTablaClientes();
                    }
                }
                
                // Cerrar modal después de un tiempo (sólo si todos fueron exitosos)
                if (clientesFallidos === 0) {
                    setTimeout(() => {
                        try {
                            const modal = bootstrap.Modal.getInstance(document.getElementById('modalGeneradorClientes'));
                            if (modal) modal.hide();
                        } catch (error) {
                            console.error('Error al cerrar modal:', error);
                        }
                    }, 2000);
                }
            }, 500);
        }
    });
}

// Generar y guardar clientes de forma secuencial
async function generarClientesSecuencial(index, total, incluirInactivos, prefijo, callback) {
    if (index >= total) {
        // Terminar la recursión cuando se alcance el total
        callback(index, total, { nombreCompleto: 'Completado' });
        return;
    }
    
    try {
        // Generar datos de cliente aleatorio con timestamp para garantizar unicidad
        const timestamp = Date.now() + index; // Añadir el índice para diferenciación adicional
        const cliente = generarClienteAleatorio(incluirInactivos, prefijo, timestamp);
        
        // Actualizar progreso
        callback(index, total, cliente);
        
        // Enviar a la API
        await guardarCliente(cliente);
        
        // Pausa incremental para evitar sobrecargar el servidor
        // A más clientes generados, mayor la pausa
        const pausaMs = 300 + Math.floor(index / 5) * 100; // Incrementa 100ms cada 5 clientes
        
        setTimeout(() => {
            // Continuar con el siguiente cliente
            generarClientesSecuencial(index + 1, total, incluirInactivos, prefijo, callback);
        }, pausaMs);
    } catch (error) {
        console.error('Error al generar cliente:', error);
        
        // Capturar y mostrar información de depuración
        const errorMsg = error.message || 'Error desconocido';
        const errorDetail = error.response ? `Respuesta: ${JSON.stringify(error.response)}` : '';
        
        // Mostrar mensaje más informativo
        mostrarMensaje(`Error en cliente #${index+1}: ${errorMsg}`, 'danger');
        console.error(`Detalles del error en cliente #${index+1}:`, errorDetail);
        
        // Intentar continuar con el siguiente después de una pausa mayor
        setTimeout(() => {
            generarClientesSecuencial(index + 1, total, incluirInactivos, prefijo, callback);
        }, 800);
    }
}

// Generar datos aleatorios para un cliente
function generarClienteAleatorio(incluirInactivos, prefijo, timestamp = Date.now()) {
    const { nombres, apellidos, segundoApellido, dominios } = CONFIG.datos;
    
    // Generar nombre completo
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
    const apellido2 = segundoApellido[Math.floor(Math.random() * segundoApellido.length)];
    const nombreCompleto = `${nombre} ${apellido1} ${apellido2}`;
    
    // Generar tipo de documento y número
    const tiposDocumento = ['INE', 'CURP', 'Pasaporte', 'Otro'];
    const tipoDocumento = tiposDocumento[Math.floor(Math.random() * tiposDocumento.length)];
    
    // Generar número de documento según el tipo (ahora con timestamp para garantizar unicidad)
    let numeroDocumento;
    const timestampCorto = String(timestamp).slice(-8); // Usar los últimos 8 dígitos del timestamp
    
    switch (tipoDocumento) {
        case 'INE':
            // Formato: 4 letras + 8 números (con timestamp)
            numeroDocumento = generarIniciales(apellido1, apellido2, nombre) + timestampCorto;
            break;
        case 'CURP':
            // Formato simplificado de CURP con timestamp
            numeroDocumento = generarIniciales(apellido1, apellido2, nombre) + 
                              Math.floor(Math.random() * 9 + 1) + 
                              (Math.random() > 0.5 ? 'H' : 'M') + 
                              'MX' + 
                              timestampCorto.substring(0, 3);
            break;
        case 'Pasaporte':
            // Formato: Letra + timestamp
            numeroDocumento = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + timestampCorto;
            break;
        default:
            // Formato genérico: 2 letras + timestamp
            numeroDocumento = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                              String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                              timestampCorto;
    }
    
    // Añadir prefijo si se especificó
    if (prefijo) {
        numeroDocumento = `${prefijo}${numeroDocumento}`;
    }
    
    // Generar teléfono (10 dígitos) con parte del timestamp para garantizar unicidad
    const telefono = '9' + Math.floor(Math.random() * 9 + 1) + timestampCorto.substring(0, 8);
    
    // Generar correo electrónico sin acentos con timestamp para garantizar unicidad
    const dominio = dominios[Math.floor(Math.random() * dominios.length)];
    
    // Quitar acentos y caracteres especiales del nombre y apellido
    const nombreSinAcentos = quitarAcentos(nombre.toLowerCase());
    const apellidoSinAcentos = quitarAcentos(apellido1.toLowerCase());
    
    // Crear email con nombre y apellido sin acentos
    const correoElectronico = `${nombreSinAcentos}.${apellidoSinAcentos}.${timestampCorto}@${dominio}`;
    
    // Determinar estado del cliente
    const estado = (incluirInactivos && Math.random() < CONFIG.probabilidadInactivo) ? 'Inactivo' : 'Activo';
    
    return {
        nombreCompleto,
        tipoDocumento,
        numeroDocumento,
        telefono,
        correoElectronico,
        estado
    };
}

// Función para quitar acentos y caracteres especiales
function quitarAcentos(texto) {
    // Tabla de normalización para caracteres acentuados
    const reemplazos = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ü': 'u', 'ñ': 'n', 'Á': 'A', 'É': 'E', 'Í': 'I',
        'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N'
    };
    
    // Reemplazar directamente caracteres conocidos
    return texto.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, match => reemplazos[match] || match)
                // Eliminar otros caracteres especiales
                .replace(/[^\w.@-]/g, '');
}

// Función auxiliar para generar iniciales a partir de nombre y apellidos
function generarIniciales(apellido1, apellido2, nombre) {
    // Eliminar acentos y caracteres especiales
    const limpiar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Primera letra de apellido 1 + primera vocal de apellido 1
    const a1Inicial = limpiar(apellido1).charAt(0);
    let a1Vocal = '';
    for (let i = 1; i < apellido1.length; i++) {
        const c = limpiar(apellido1).charAt(i);
        if ('AEIOU'.includes(c)) {
            a1Vocal = c;
            break;
        }
    }
    if (!a1Vocal) a1Vocal = 'X';
    
    // Primera letra de apellido 2
    const a2Inicial = apellido2 ? limpiar(apellido2).charAt(0) : 'X';
    
    // Primera letra del nombre
    const nInicial = limpiar(nombre).charAt(0);
    
    return a1Inicial + a1Vocal + a2Inicial + nInicial;
}

// Guardar cliente en la API
async function guardarCliente(cliente) {
    try {
        // Espera aleatoria para evitar sobrecarga en casos de muchas peticiones
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });
        
        if (!response.ok) {
            // Intentar obtener más información del error
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: `Error ${response.status}: ${response.statusText}` };
            }
            
            // Proporcionar información detallada sobre el error
            const error = new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            error.response = errorData;
            error.cliente = cliente; // Adjuntar cliente que causó el error
            error.status = response.status;
            throw error;
        }
        
        // Intentar parsear la respuesta como JSON
        try {
            return await response.json();
        } catch (e) {
            // Si falla el parseo, devolver un objeto de éxito básico
            return { success: true, cliente: cliente.nombreCompleto };
        }
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        throw error;
    }
}

// Mostrar mensaje de notificación
function mostrarMensaje(mensaje, tipo = 'info') {
    // Usar showNotification si está disponible (función global)
    if (typeof showNotification === 'function') {
        showNotification(mensaje, tipo);
        return;
    }
    
    // Implementación alternativa
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notificacion.style.zIndex = '9999';
    notificacion.role = 'alert';
    
    notificacion.innerHTML = `
        <div>${mensaje}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
    }, 5000);
}

// Añadir estilos CSS para la interfaz del generador
function agregarEstilos() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para el generador de clientes */
        #modalGeneradorClientes .modal-header {
            background-color: #4682B4;
            color: white;
        }
        
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .blink {
            animation: blink 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// Función auxiliar para convertir texto a slug (formato URL amigable)
function toSlug(text) {
    return text
        .toLowerCase()
        .replace(/[áéíóúüñ]/g, match => {
            const reemplazos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n' };
            return reemplazos[match];
        })
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// Inicializar el módulo cuando se carga el documento
document.addEventListener('DOMContentLoaded', initAutoClientes);

// Exponer funciones globalmente
window.autoClientes = {
    iniciar: initAutoClientes,
    generar: generarClientes,
    mostrarGenerador: mostrarGeneradorClientes
};

console.log('🤖 Generador automático de clientes cargado. Presiona Alt + click en "Nuevo Cliente" para usar.');