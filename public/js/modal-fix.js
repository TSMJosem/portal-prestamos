/**
 * modal-fix.js - Solución para problemas de cierre de modales en ALFIN CASH
 * 
 * Este script arregla los problemas con los botones de cierre de modales,
 * específicamente para el modal de nuevo cliente y otros modales del sistema.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Inicializando solución para cierre de modales...');
    
    // Función específica para eliminar cualquier backdrop de modal que persista
    function eliminarBackdrop() {
        // Eliminar todos los backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            backdrop.remove();
        });
        
        // Asegurarse de que no queden estilos de modal en el body
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        
        console.log(`Eliminados ${backdrops.length} backdrops de modal`);
    }
    
    // Función genérica para cerrar un modal
    function cerrarModal(modal) {
        console.log(`Cerrando modal: #${modal.id}`);
        
        try {
            // 1. Intentar usar Bootstrap 5 primero
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                    console.log('Modal cerrado vía bootstrap.Modal.getInstance()');
                    
                    // Asegurarse de que el backdrop se elimine después de una pequeña pausa
                    setTimeout(eliminarBackdrop, 300);
                    return;
                }
            }
            
            // 2. Alternativa: cerrar usando jQuery si está disponible
            if (typeof $ !== 'undefined') {
                try {
                    $(modal).modal('hide');
                    console.log('Modal cerrado vía jQuery');
                    
                    // Asegurarse de que el backdrop se elimine después de una pequeña pausa
                    setTimeout(eliminarBackdrop, 300);
                    return;
                } catch (e) {
                    console.log('Error al cerrar con jQuery:', e);
                }
            }
            
            // 3. Alternativa manual: eliminar clases y fondo
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('style', 'display: none');
            
            // Eliminar backdrop inmediatamente
            eliminarBackdrop();
            
            // Restaurar overflow en el body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            console.log('Modal cerrado manualmente');
            
        } catch (error) {
            console.error('Error al cerrar modal:', error);
            
            // Último recurso: ocultar directamente
            modal.style.display = 'none';
            
            // Eliminar backdrop
            eliminarBackdrop();
            
            // Restaurar body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }
    
    // Configurar botones de cierre para un modal específico
    function configurarBotonesCierre(modal) {
        if (!modal) return;
        
        // 1. Botón de cerrar (X) en la esquina superior derecha
        const btnCerrar = modal.querySelector('.btn-close');
        if (btnCerrar) {
            // Quitar eventos previos para evitar duplicados
            const clonBtnCerrar = btnCerrar.cloneNode(true);
            if (btnCerrar.parentNode) {
                btnCerrar.parentNode.replaceChild(clonBtnCerrar, btnCerrar);
            }
            
            // Agregar nuevo manejador de eventos
            clonBtnCerrar.addEventListener('click', function(e) {
                e.preventDefault();
                cerrarModal(modal);
            });
        }
        
        // 2. Botón "Cancelar" - Usar EXACTAMENTE el mismo comportamiento que el botón de cerrar
        const btnCancelar = modal.querySelector('.btn-secondary:not(.btn-close), button[data-bs-dismiss="modal"]');
        if (btnCancelar) {
            // Quitar eventos previos para evitar duplicados
            const clonBtnCancelar = btnCancelar.cloneNode(true);
            if (btnCancelar.parentNode) {
                btnCancelar.parentNode.replaceChild(clonBtnCancelar, btnCancelar);
            }
            
            // Agregar nuevo manejador de eventos - idéntico al botón de cerrar
            clonBtnCancelar.addEventListener('click', function(e) {
                e.preventDefault();
                // Usar exactamente el mismo método de cierre que el botón X
                cerrarModal(modal);
            });
        }
        
        // 3. Si es el modal de nuevo cliente, asegurar que el botón de guardar también cierre
        if (modal.id === 'modalNuevoCliente') {
            const btnGuardar = modal.querySelector('#btnGuardarNuevoCliente');
            if (btnGuardar) {
                // Crear una copia del botón para eliminar los eventos anteriores
                const btnGuardarClone = btnGuardar.cloneNode(true);
                if (btnGuardar.parentNode) {
                    btnGuardar.parentNode.replaceChild(btnGuardarClone, btnGuardar);
                }
                
                // Agregar nuevo controlador que garantice la limpieza completa
                btnGuardarClone.addEventListener('click', function(e) {
                    console.log('Botón Guardar cliente clickeado, preparando manejo especial');
                    
                    // Si hay una función de guardar cliente, preservarla
                    if (typeof window.guardarNuevoCliente === 'function') {
                        // Ejecutar la función original
                        window.guardarNuevoCliente();
                    } else if (typeof window.guardarNuevoClienteConCache === 'function') {
                        // O la versión con caché si existe
                        window.guardarNuevoClienteConCache();
                    } else {
                        // Si no hay función específica, intentar enviar el formulario directamente
                        const form = document.getElementById('formNuevoCliente');
                        if (form) {
                            // Verificar si el formulario es válido antes de intentar enviarlo
                            if (form.checkValidity()) {
                                try {
                                    // Intentar enviar el formulario normalmente
                                    const submitEvent = new Event('submit', {
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    form.dispatchEvent(submitEvent);
                                } catch (error) {
                                    console.error('Error al enviar formulario:', error);
                                }
                            }
                        }
                    }
                    
                    // Garantizar que el modal se cierre y se limpie el backdrop
                    setTimeout(() => {
                        cerrarModal(modal);
                        // Doble verificación para eliminar cualquier backdrop persistente
                        setTimeout(eliminarBackdrop, 500);
                    }, 300);
                });
            }
        }
    }
    
    // Verificar si hay modales abiertos que necesiten configuración
    function checkForOpenModals() {
        const modalesVisibles = Array.from(document.querySelectorAll('.modal'))
            .filter(modal => modal.classList.contains('show') || modal.style.display === 'block');
        
        modalesVisibles.forEach(modal => {
            console.log('Modal abierto detectado:', modal.id);
            configurarBotonesCierre(modal);
        });
    }
    
    // Configurar un observador para detectar nuevos modales
    function setupModalObserver() {
        const observer = new MutationObserver(function(mutations) {
            let newModalsDetected = false;
            
            mutations.forEach(function(mutation) {
                // Verificar si se añadieron nodos
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Buscar modales entre los nodos añadidos
                    mutation.addedNodes.forEach(function(node) {
                        // Verificar si es un elemento DOM
                        if (node.nodeType === 1) {
                            // Verificar si es un modal
                            if (node.classList && node.classList.contains('modal')) {
                                console.log('Nuevo modal detectado:', node.id);
                                configurarBotonesCierre(node);
                                newModalsDetected = true;
                            } else {
                                // Buscar modales dentro del nodo
                                const modalesNuevos = node.querySelectorAll('.modal');
                                if (modalesNuevos.length > 0) {
                                    console.log(`Detectados ${modalesNuevos.length} modales nuevos dentro de un nodo`);
                                    modalesNuevos.forEach(modal => configurarBotonesCierre(modal));
                                    newModalsDetected = true;
                                }
                            }
                        }
                    });
                }
            });
            
            // Si se detectaron nuevos modales, verificar si están abiertos
            if (newModalsDetected) {
                setTimeout(checkForOpenModals, 500);
            }
        });
        
        // Observar todo el documento para detectar nuevos modales
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Observador de modales configurado');
    }
    
    // Función principal para configurar el cierre de modales
    function setupModalClosers() {
        console.log('🔄 Configurando funcionalidad de cierre para todos los modales...');
        
        // 1. Obtener todos los modales de la aplicación
        const modales = document.querySelectorAll('.modal');
        
        modales.forEach(modal => {
            const modalId = modal.id;
            console.log(`Configurando modal: #${modalId}`);
            
            // 2. Configurar los botones de cierre en cada modal
            configurarBotonesCierre(modal);
        });
        
        // 3. Configurar un observador para detectar nuevos modales
        setupModalObserver();
    }
    
    // Configurar manejo específico para el modal de Nuevo Cliente
    function configurarModalNuevoCliente() {
        // Esperar a que el modal exista en el DOM
        const checkInterval = setInterval(() => {
            const modal = document.getElementById('modalNuevoCliente');
            if (modal) {
                clearInterval(checkInterval);
                console.log('Modal de nuevo cliente encontrado, configurando...');
                
                // Configurar cierre adecuado
                configurarBotonesCierre(modal);
                
                // Hacer que el botón Cancelar tenga un comportamiento idéntico al botón de cerrar (X)
                const btnCancelar = modal.querySelector('.btn-secondary, button[data-bs-dismiss="modal"]');
                if (btnCancelar) {
                    const btnCerrar = modal.querySelector('.btn-close');
                    if (btnCerrar) {
                        // Clonar el comportamiento exacto del botón cerrar
                        btnCancelar.onclick = function(e) {
                            e.preventDefault();
                            console.log('Botón Cancelar usando el mismo comportamiento que botón X');
                            // Simular el clic en el botón de cerrar para usar exactamente el mismo comportamiento
                            btnCerrar.click();
                        };
                    }
                }
                
                // Reforzar configuración para btnNuevoCliente
                const btnNuevoCliente = document.getElementById('btnNuevoCliente');
                if (btnNuevoCliente) {
                    btnNuevoCliente.addEventListener('click', function() {
                        // Permitir que se abra el modal normalmente
                        setTimeout(() => {
                            // Luego configurar sus botones de cierre
                            configurarBotonesCierre(document.getElementById('modalNuevoCliente'));
                            // Verificar y eliminar cualquier backdrop duplicado
                            const backdrops = document.querySelectorAll('.modal-backdrop');
                            if (backdrops.length > 1) {
                                console.log('Detectados múltiples backdrops, corrigiendo...');
                                for (let i = 1; i < backdrops.length; i++) {
                                    backdrops[i].remove();
                                }
                            }
                        }, 300);
                    });
                }
            }
        }, 500);
        
        // Detener la búsqueda después de un tiempo razonable
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
    
    // Función para manejar clicks en cualquier botón que abra el modal de nuevo cliente
    function manejarClicksBotonNuevoCliente() {
        // Escuchar clics en todos los botones que puedan abrir el modal
        document.addEventListener('click', function(event) {
            // Identificar botones por su ID, clase o contenido
            const esBotonNuevoCliente = 
                event.target.id === 'btnNuevoCliente' || 
                (event.target.closest && event.target.closest('#btnNuevoCliente')) ||
                event.target.textContent.includes('Nuevo Cliente') ||
                (event.target.closest && event.target.closest('button') && 
                 event.target.closest('button').textContent.includes('Nuevo Cliente'));
            
            if (esBotonNuevoCliente) {
                console.log('Click en botón de nuevo cliente detectado');
                // Configurar modal después de un breve retraso
                setTimeout(() => {
                    const modal = document.getElementById('modalNuevoCliente');
                    if (modal) {
                        configurarBotonesCierre(modal);
                    }
                }, 300);
            }
        });
    }
    
    // Iniciar la configuración de modales
    setupModalClosers();
    
    // Configuración específica para el modal de Nuevo Cliente
    configurarModalNuevoCliente();
    
    // Manejar clicks en botones de nuevo cliente
    manejarClicksBotonNuevoCliente();
    
    // Establecer limpieza periódica de backdrops huérfanos
    setInterval(function() {
        // Verificar si hay backdrops sin modales visibles
        const modalesVisibles = Array.from(document.querySelectorAll('.modal'))
            .filter(modal => modal.classList.contains('show') || getComputedStyle(modal).display !== 'none');
            
        if (modalesVisibles.length === 0) {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            if (backdrops.length > 0) {
                console.log(`Detectados ${backdrops.length} backdrops huérfanos, limpiando...`);
                eliminarBackdrop();
            }
        }
    }, 2000);
    
    // Agregamos un limpiador para cuando se cierra con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log('Tecla ESC detectada, verificando backdrops...');
            setTimeout(eliminarBackdrop, 300);
        }
    });
    
    console.log('✅ Solución para cierre de modales inicializada correctamente');
    
    // Exponer funciones útiles al ámbito global
    window.modalFix = {
        closeModal: cerrarModal,
        setupModal: configurarBotonesCierre,
        reinitialize: setupModalClosers,
        cleanupBackdrops: eliminarBackdrop
    };
});