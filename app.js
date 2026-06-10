// [🔒 ARCHIVO DIVIDIDO - PARTE 1 DE 6 - POR FAVOR UNIR MENTALMENTE]
// Variable que controla la versión del script lógico
// MODIFICADO: Versión actualizada a v2.7.5 - Corrección de corte de archivos grandes, cálculo de límites y advertencias de truncado
const VER_APP = "2.7.5"; 

// Variables globales para la cola de copiado
let promptsFinalesListos = [];

// Diccionario de órdenes e instrucciones prefijadas
const PLANTILLAS_ORDENES = {
    analizar: "Analiza detalladamente la arquitectura de este proyecto. Explica cómo se comunican los componentes, los flujos de datos principales y enumera las dependencias críticas detectadas.",
    bugs: "Revisa exhaustivamente todo el código provisto en busca de errores de lógica, fallas de seguridad potenciales, fugas de memoria o malas prácticas. Muestra los puntos críticos y propón sus correcciones exactas.",
    refactor: "Actúa como un ingeniero de software experto en refactorización. Revisa los archivos e identifica bloques redundantes o ineficientes. Proporciona una versión optimizada del código que mejore el rendimiento y la legibilidad.",
    documentar: "Generar la documentación técnica correspondiente para las funciones y módulos clave de este repositorio. Añade comentarios claros y estructuras de tipo JSDoc/comentarios descriptivos donde falten.",
    test: "Examina los flujos lógicos y genera una estrategia integral de pruebas unitarias. Detalla qué casos de prueba y escenarios límite (edge cases) se deben validar de forma prioritaria en base a los archivos adjuntos.",
    fusionar: "Actúa como un arquitecto de software experto en integración de sistemas. Tu objetivo es auditar el Repositorio Principal y el Repositorio de Referencia Secundaria. 1) Identifica funciones, utilidades, componentes o patrones de diseño presentes en el repositorio SECUNDARIO que puedan mejorar, optimizar o añadir funcionalidades faltantes al repositorio PRINCIPAL. 2) Para cada mejora identificada, proporciona el código exacto listo para implementar en el PRINCIPAL, adaptando la lógica para que sea 100% compatible con su arquitectura actual, sin romper flujos existentes y manejando el DOM de forma defensiva. 3) Si no encuentras nada útil que adoptar, indícalo expresamente."
};

/**
 * REGLAS INTRÍNSECAS DE RESPUESTA (INYECTADAS AUTOMÁTICAMENTE)
 */
const REGLAS_EMPAQUETADO_SISTEMA = 
`\n\n=========================================\n` +
`NORMAS DE SALIDA OBLIGATORIAS PARA LA IA:\n` +
`=========================================\n` +
`1. Cuando respondas implementando el OBJETIVO o procesando los archivos, debes devolver los ARCHIVOS MODIFICADOS EN SU TOTALIDAD (Código completo, sin recortes, sin omitir funciones funcionales y sin usar comentarios del tipo '// ... resto del código').\n` +
`2. Si un archivo provisto en el contexto NO necesita sufrir modificaciones para cumplir el objetivo, NO muestres su código. Simplemente indica de forma clara y breve: "El archivo [nombre_archivo] no requiere modificaciones".\n` +
`3. No reescribas ni alteres la lógica de los componentes que ya funcionan a menos que sea estrictamente necesario para cumplir el objetivo solicitado.\n` +
`4. Cada vez que proveas un código modificado, lista de manera clara los elements agregados o eliminados en comparación con la versión que te fue entregada.\n` +
`5. PRESERVACIÓN DE IDENTIFICADORES: Está estrictamente prohibido renombrar funciones, variables, identificadores HTML (id), clases CSS o claves de almacenamiento (localStorage) existentes. Mantén intacta la nomenclatura original.\n` +
`6. ENTORNO TECNOLÓGICO: Resuelve el objetivo utilizando exclusivamente las tecnologías nativas provistas (Vanilla JS, CSS nativo, etc.). No inventes dependencias ni asumas la existencia de librerías externas que no veas explícitamente en el contexto.\n` +
`7. MODULARIDAD SEGURA: Cualquier lógica nueva debe aislarse correctamente y no debe interferir con los listeners de ciclo de vida (como DOMContentLoaded) ni con las variables globales del sistema.\n` +
`8. SALIDA DIRECTA Y COMPACTA: Entrega los resultados estructurados en bloques de código Markdown limpios. Evita textos introductorios densos, rodeos teóricos o saludos; prioriza la legibilidad y la velocidad de copiado.\n` +
`9. MANEJO DEFENSIVO DEL DOM: Antes de interactuar con cualquier elemento de la interfaz (capturar valor, asignar texto o colgar listeners), valida obligatoriamente su existencia mediante condicionales (if (elemento)) para evitar excepciones que detengan la ejecución del script.\n` +
`10. CONTROL DE LISTENERS: Diseña los manejadores de eventos de forma que no puedan registrarse duplicados ni generar fugas de memoria al reejecutar funciones. Evita registrar listeners estáticos de forma masiva dentro de funciones asíncronas o bucles de renderizado.\n` +
`11. INTEGRIDAD DEL ESTADO: Los cambios lógicos no deben resetear, limpiar o alterar involuntariamente los inputs, textareas, variables de estado activas o datos antiguos alojados en LocalStorage, manteniendo la compatibilidad hacia atrás.\n` +
`12. SEÑALIZACIÓN EN CÓDIGO: Inserta comentarios breves como '// NUEVO:' o '// MODIFICADO:' directamente sobre las líneas cambiadas dentro del bloque de código devuelto para facilitar su revisión visual rápida.\n` +
`13. ATRIBUTOS INLINE EN HTML: Si una modificación en JavaScript altera la firma, parámetros o nombre de una función, es obligatorio actualizar en consecuencia todas sus llamadas interactivas inline correspondientes en el archivo HTML (como onclick u onchange).\n` +
`14. RESTRICCIÓN DE ALCANCE QUIRÚRGICO: Respeta la arquitectura interna por bloques de funciones. Si el cambio solicitado afecta únicamente a un proceso aislado, limita las modificaciones estrictamente al interior de ese bloque; el resto de los bloques no afectados deben reescribirse de manera idéntica e intacta línea por línea.\n` +
`15. INTEGRIDAD REPOSITORIO DE DATOS: Queda estrictamente prohibido recortar, resumir o usar comentarios elípticos en objetos de configuración, estructuras JSON, arrays extensos de datos o diccionarios globales de constantes preexistentes dentro de los archivos devueltos. Deben reescribirse completos elemento por elemento.\n` +
`16. AUTOSUFICIENCIA LOGICA: No asumas ni invoques funciones, utilidades globales, ni variables de estado que no estén explícitamente declaradas en los archivos provistos. Si el objetivo requiere lógica adicional, debes programar su solución por completo de forma explícita y visible dentro del código modificado.\n` +
`17. EXISTENCIA VERIFICABLE DE ARCHIVOS: No puedes mencionar, modificar, importar, extender ni referenciar archivos que no hayan sido incluidos explícitamente dentro del contexto recibido. Si una funcionalidad depende de un archivo inexistente en el contexto, debes indicarlo expresamente en lugar de asumir su existencia.\n` +
`18. TRAZABILIDAD FUNCIONAL: No afirme que existe una funcionalidad, flujo, endpoint, proceso, evento, API o comportamiento si no puede inferirse directamente del código proporcionado. Diferencia claramente entre hechos observados y propuestas de mejora.\n` +
`19. DEPENDENCIAS EXPLÍCITAS: Antes de utilizar cualquier librería, API, framework o paquete, verifica que aparezca explícitamente en los archivos proporcionados. Si no aparece, no puede utilizarse ni asumirse su disponibilidad.\n` +
`20. CONSISTENCIA INTERARCHIVOS: Toda modificación realizada en un archivo debe ser compatible con los demás archivos proporcionados. Está prohibido generar referencias rotas, firmas incompatibles o llamadas a funciones que ya no coincidan con su definición original.\n` +
`21. INFORME DE IMPACTO: Antes de mostrar el código modificado, indica brevemente qué archivos fueron afectados y por qué fue necesario modificarlos.\n` +
`22. INCERTIDUMBRE OBLIGATORIA: Cuando una decisión técnica no pueda deducirse con certeza a partir del contexto proporcionado, debes indicarlo explícitamente mediante una sección "SUPOSICIONES NECESARIAS" antes del código generado.\n` +
`23. CONSERVACIÓN FUNCIONAL: No elimines funciones, bloques, estilos, estructuras HTML o configuraciones existentes salvo que el objetivo solicitado requiera explícitamente su eliminación. Toda eliminación debe justificarse de forma explícita.\n` +
`24. VALIDACIÓN PREVIA DE RESPUESTA: Antes de entregar el resultado final, verifica que el código generado no contenga referencias a variables inexistentes, funciones inexistentes, imports faltantes o elements eliminados accidentalmente.\n` +
`25. ORDEN DE PRIORIDAD: En caso de conflicto entre optimización, refactorización, limpieza de código y preservación del comportamiento existente, debe prevalecer siempre la preservación del comportamiento actual del sistema.\n` +
`26. UNIÓN DE ARCHIVOS DIVIDIDOS: Si un archivo de código ha sido dividido en múltiples partes debido a limitaciones de tamaño, lo verás marcado explícitamente con "[🔒 ARCHIVO DIVIDIDO]". Debes interpretar y unir mentalmente todas las partes del archivo afectado como un todo continuo antes de analizarlo o modificarlo. No trates las partes divididas como archivos independientes.\n`;

// Protocolo de inicialización para la Parte 1
const PROTOCOLO_INICIO = 
`=========================================\n` +
`PROTOCOLO DE TRANSMISIÓN DE CONTEXTO\n` +
`=========================================\n` +
`Estás a punto de recibir el código fuente de un proyecto de software dividido en múltiples partes.\n` +
`- Tu ÚNICA función en las partes intermedias es almacenar el contexto en tu memoria temporal.\n` +
`- Está PROHIBIDO procesar, analizar o ejecutar el OBJETIVO hasta que recibas la parte FINAL.\n` +
`- En la parte FINAL recibirás la orden de ejecución junto con las NORMAS DE SALIDA OBLIGATORIAS.\n\n`;

document.addEventListener('DOMContentLoaded', () => {
    const versionBadgeApp = document.getElementById('versionApp');
    if (versionBadgeApp) {
        versionBadgeApp.innerText = `App: v${VER_APP}`;
    }
    actualizarDesplegableHistorial();
    const urlGuardada = localStorage.getItem('last_github_repo');
    if (urlGuardada) {
        const repoUrlInput = document.getElementById('repoUrl');
        if (repoUrlInput) repoUrlInput.value = urlGuardada;
    }
    const urlSecundariaGuardada = localStorage.getItem('last_github_repo_secondary');
    if (urlSecundariaGuardada) {
        const repoUrlSecundarioInput = document.getElementById('repoUrlSecundario');
        if (repoUrlSecundarioInput) repoUrlSecundarioInput.value = urlSecundariaGuardada;
    }
    const limitGuardado = localStorage.getItem('last_limit_select');
    if (limitGuardado) {
        const limitSelectInput = document.getElementById('limitSelect');
        if (limitSelectInput) limitSelectInput.value = limitGuardado;
    }
});

function aplicarOrdenPrefijada(clavePlantilla) {
    const textoInyectar = PLANTILLAS_ORDENES[clavePlantilla];
    if (textoInyectar) {
        const instruccionesInput = document.getElementById('instrucciones');
        if (instruccionesInput) instruccionesInput.value = textoInyectar;
    }
}

function guardarEnHistorial(url) {
    if (!url) return;
    let historial = JSON.parse(localStorage.getItem('github_repo_history') || '[]');
    historial = historial.filter(item => item !== url);
    historial.unshift(url);
    historial = historial.slice(0, 8);
    localStorage.setItem('github_repo_history', JSON.stringify(historial));
    actualizarDesplegableHistorial();
}

function actualizarDesplegableHistorial() {
    const historial = JSON.parse(localStorage.getItem('github_repo_history') || '[]');
    const select = document.getElementById('repoHistorySelect');
    if (!select) return;
    if (historial.length === 0) {
        select.style.display = 'none';
        return;
    }
    select.innerHTML = '<option value="" disabled selected>📂 Historial de repositorios usados...</option>';
    historial.forEach(url => {
        const option = document.createElement('option');
        option.value = url;
        option.innerText = url.replace('https://github.com/', '');
        select.appendChild(option);
    });
    select.style.display = 'block';
    select.onchange = null; 
    select.onchange = (e) => {
        if (e.target.value) {
            const repoUrlInput = document.getElementById('repoUrl');
            if (repoUrlInput) repoUrlInput.value = e.target.value;
        }
    };
}

function limpiarInterfaz() {
    const repoUrl = document.getElementById('repoUrl');
    const repoUrlSecundario = document.getElementById('repoUrlSecundario');
    const instrucciones = document.getElementById('instrucciones');
    const ordenesPredeterminadas = document.getElementById('ordenesPredeterminadas');
    if (repoUrl) repoUrl.value = '';
    if (repoUrlSecundario) repoUrlSecundario.value = '';
    if (instrucciones) instrucciones.value = '';
    if (ordenesPredeterminadas) ordenesPredeterminadas.value = '';
    const previewBox = document.getElementById('previewBox');
    const queueContainer = document.getElementById('queueContainer');
    if (previewBox) previewBox.style.display = "none";
    if (queueContainer) queueContainer.style.display = "none";
    const status = document.getElementById('statusCarga');
    if (status) {
        status.style.display = "none";
        status.innerText = "";
    }
    const btnGenerar = document.getElementById('btnGenerar');
    if (btnGenerar) {
        btnGenerar.disabled = false;
        btnGenerar.innerText = "⚡ GENERAR PROMPTS";
        btnGenerar.style.display = "block";
    }
    const btnReset = document.getElementById('btnReset');
    if (btnReset) btnReset.style.display = "none";
    actualizarDesplegableHistorial();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parsearGitHubUrl(url) {
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;
    const match = url.match(regex);
    if (!match) return null;
    return { user: match[1], repo: match[2], branch: match[3] || 'main' };
}

async function obtenerBloquesCodigo(datosRepo, esPrincipal = true) {
    const extensionesPermitidas = ['.js', '.html', '.css', '.json', '.txt', '.md'];
    let bloques = [];
    let nombresArchivos = [];
    const apiUrl = `https://api.github.com/repos/${datosRepo.user}/${datosRepo.repo}/contents?ref=${datosRepo.branch}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`No se pudo acceder al repositorio: ${datosRepo.repo}`);
    const archivos = await response.json();
    if (!Array.isArray(archivos)) throw new Error(`La API de GitHub no retornó un árbol válido.`);
    for (const archivo of archivos) {
        if (archivo.type === 'file') {
            const tieneExtensionValida = extensionesPermitidas.some(ext => archivo.name.endsWith(ext));
            if (tieneExtensionValida && archivo.name !== 'package-lock.json') {
                try {
                    const resContenido = await fetch(archivo.download_url);
                    if (!resContenido.ok) continue; 
                    const texto = await resContenido.text();
                    nombresArchivos.push(archivo.name);
                    let bloque = `\n=========================================\n`;
                    bloque += `REPOSITORIO: ${datosRepo.repo} (${esPrincipal ? 'PRINCIPAL' : 'REFERENCIA SECUNDARIA'})\n`;
                    bloque += `ARCHIVO: ${archivo.name}\n`;
                    bloque += `=========================================\n`;
                    bloque += `${texto}\n`;
                    bloques.push(bloque);
                } catch (errArchivo) {
                    console.warn(`No se pudo descargar el contenido de ${archivo.name}:`, errArchivo);
                }
            }
        }
    }
    return { bloques, nombresArchivos };
}

async function construirSuperPrompt() {
    const urlInput = document.getElementById('repoUrl')?.value.trim();
    const urlSecundariaInput = document.getElementById('repoUrlSecundario')?.value.trim();
    const instrucciones = document.getElementById('instrucciones')?.value.trim();
    const limitSelectEl = document.getElementById('limitSelect');
    const MAX_CARACTERES_POR_PROMPT = limitSelectEl ? parseInt(limitSelectEl.value) : 15000;
    const btn = document.getElementById('btnGenerar');
    const btnReset = document.getElementById('btnReset');
    const status = document.getElementById('statusCarga');
    const previewBox = document.getElementById('previewBox');
    const listaArchivos = document.getElementById('listaArchivos');
    const queueContainer = document.getElementById('queueContainer');
    const partQueue = document.getElementById('partQueue');
    const btnCopiarTodo = document.getElementById('btnCopiarTodo');
    if (!urlInput) { alert("Por favor, introduce una URL de GitHub principal."); return; }
    
    const overheadMinimo = 1500; 
    if (instrucciones && (instrucciones.length + overheadMinimo) > MAX_CARACTERES_POR_PROMPT) {
        alert(`❌ Tu instrucción tiene ${instrucciones.length} caracteres, lo cual excede el límite de contexto de ${MAX_CARACTERES_POR_PROMPT} caracteres seleccionado. La IA la cortará de forma segura. Por favor, reduce tu instrucción o aumenta el límite superior (Contexto).`);
        if (btn) { btn.disabled = false; btn.innerText = "⚡ REINTENTAR"; }
        return;
    }

    localStorage.setItem('last_github_repo', urlInput);
    localStorage.setItem('last_limit_select', MAX_CARACTERES_POR_PROMPT);
    guardarEnHistorial(urlInput);
    if (urlSecundariaInput) {
        localStorage.setItem('last_github_repo_secondary', urlSecundariaInput);
        guardarEnHistorial(urlSecundariaInput);
    } else {
        localStorage.removeItem('last_github_repo_secondary');
    }
    const datosRepoPrincipal = parsearGitHubUrl(urlInput);
    if (!datosRepoPrincipal) { alert("Formato de URL principal no reconocido."); return; }
    let datosRepoSecundario = null;
    if (urlSecundariaInput) {
        datosRepoSecundario = parsearGitHubUrl(urlSecundariaInput);
        if (!datosRepoSecundario) { alert("Formato de URL secundaria no reconocido."); return; }
    }
    if (btn) btn.disabled = true;
    if (status) {
        status.style.display = "block";
        status.style.color = "#38bdf8";
        status.innerText = "⏳ Leyendo estructura del repositorio principal...";
    }
    try {
        let todosLosBloquesArchivos = [];
        let htmlPreviewArchivos = "";
        const resultadoPrincipal = await obtenerBloquesCodigo(datosRepoPrincipal, true);
        if (resultadoPrincipal.nombresArchivos.length === 0) throw new Error("No se encontraron archivos válidos.");
        todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resultadoPrincipal.bloques);
        htmlPreviewArchivos += `<div class="repo-section-title">📂 Principal (${datosRepoPrincipal.repo}):</div>`;
        htmlPreviewArchivos += resultadoPrincipal.nombresArchivos.map(name => `<span class="file-tag">📄 ${name}</span>`).join('');
        if (datosRepoSecundario) {
            status.innerText = "⏳ Leyendo estructura del repositorio secundario...";
            const resultadoSecundario = await obtenerBloquesCodigo(datosRepoSecundario, false);
            if (resultadoSecundario.nombresArchivos.length > 0) {
                todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resultadoSecundario.bloques);
                htmlPreviewArchivos += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario de Referencia (${datosRepoSecundario.repo}):</div>`;
                htmlPreviewArchivos += resultadoSecundario.nombresArchivos.map(name => `<span class="file-tag" style="border-left: 3px solid var(--accent);">📄 ${name}</span>`).join('');
            }
        }
        status.innerText = "⏳ Armando secuencia de prompts y verificando integridad de archivos...";
        
        const longitudInstrucciones = instrucciones ? instrucciones.length : 0;
        const longitudReglas = REGLAS_EMPAQUETADO_SISTEMA.length;
        const longitudProtocolo = PROTOCOLO_INICIO.length;
        const MARGEN_SEGURIDAD = 1500; 
        
        const limiteEfectivoCodigo = Math.max(1000, MAX_CARACTERES_POR_PROMPT - (longitudInstrucciones + longitudReglas + longitudProtocolo + MARGEN_SEGURIDAD));

        // MODIFICADO: Lógica de corte de archivos con marcas explícitas, manejo de líneas largas y cálculo exacto de partes
        let bloquesProcesados = [];
        for (const bloque of todosLosBloquesArchivos) {
            if (bloque.length <= limiteEfectivoCodigo) {
                bloquesProcesados.push(bloque);
            } else {
                const lineas = bloque.split('\n');
                
                // Extraer cabecera para replicarla en cada fragmento
                let headerLines = [];
                let separatorCount = 0;
                for (let i = 0; i < lineas.length; i++) {
                    headerLines.push(lineas[i]);
                    if (lineas[i].includes('=========================================')) {
                        separatorCount++;
                        if (separatorCount === 2) break;
                    }
                }
                const headerStr = headerLines.join('\n') + '\n';
                const codeLines = lineas.slice(headerLines.length);
                
                // NUEVO: Generar fragmentos de código puro para calcular el total exacto de partes
                let fragmentosCodigo = [];
                let subBloque = "";
                
                for (const linea of codeLines) {
                    // NUEVO: Si una línea individual excede el límite, la aislamos en su propio fragmento para no arrastrar líneas siguientes
                    if ((headerStr.length + linea.length + 300) > limiteEfectivoCodigo) {
                        if (subBloque.trim() !== "") {
                            fragmentosCodigo.push(subBloque);
                            subBloque = "";
                        }
                        fragmentosCodigo.push(linea + '\n');
                    } 
                    else if ((headerStr.length + subBloque.length + linea.length + 300) > limiteEfectivoCodigo) {
                        if (subBloque.trim() !== "") {
                            fragmentosCodigo.push(subBloque);
                        }
                        subBloque = linea + '\n';
                    } 
                    else {
                        subBloque += linea + '\n';
                    }
                }
                if (subBloque.trim() !== "") {
                    fragmentosCodigo.push(subBloque);
                }

                // NUEVO: Ahora que sabemos el total exacto, inyectar cabeceras y marcadores
                const totalPartes = fragmentosCodigo.length;
                for (let i = 0; i < totalPartes; i++) {
                    const parteNum = i + 1;
                    const codigo = fragmentosCodigo[i];
                    
                    const modifiedHeader = headerStr.replace(/ARCHIVO: (.*)/, `ARCHIVO: $1 (Parte ${parteNum}/${totalPartes})`);
                    
                    const markerStart = parteNum === 1 
                        ? `// [🔒 ARCHIVO DIVIDIDO - PARTE ${parteNum} DE ${totalPartes} - POR FAVOR UNIR MENTALMENTE]\n` 
                        : `// [🔒 CONTINUACIÓN DE ARCHIVO DIVIDIDO - PARTE ${parteNum} DE ${totalPartes} - UNIR CON PARTE ANTERIOR]\n`;
                        
                    const markerEnd = parteNum < totalPartes 
                        ? `\n// [🔒 FIN DE PARTE ${parteNum}. CONTINÚA EN LA SIGUIENTE PARTE]` 
                        : `\n// [🔒 FIN DE ARCHIVO DIVIDIDO - PARTE ${parteNum} DE ${totalPartes}]`;
                        
                    bloquesProcesados.push(modifiedHeader + markerStart + codigo + markerEnd);
                }
            }
        }

        let listaPromptsAGenerar = [];
        let acumulador = "";
        
        // MODIFICADO: Algoritmo de empaquetado mejorado calculando el overhead real máximo de forma conservadora
        const estimacionOverheadMaximo = longitudInstrucciones + longitudReglas + longitudProtocolo + 500; 
        const limiteContenido = MAX_CARACTERES_POR_PROMPT - estimacionOverheadMaximo;

        for (const bloque of bloquesProcesados) {
            if (bloque.trim() === "") continue; 
            if (acumulador !== "" && (acumulador.length + bloque.length) > limiteContenido) {
                listaPromptsAGenerar.push(acumulador);
                acumulador = bloque;
            } else if (acumulador === "") {
                acumulador = bloque;
            } else {
                acumulador += bloque;
            }
        }
        if (acumulador !== "") {
            listaPromptsAGenerar.push(acumulador);
        }
        
        promptsFinalesListos = [];
        const totalPartes = listaPromptsAGenerar.length;
        
        listaPromptsAGenerar.forEach((contenido, index) => {
            const num = index + 1;
            const esPrimera = num === 1;
            const esUltima = num === totalPartes;
            let texto = "";

            if (esPrimera && esUltima) {
                texto += `Hola. Proyecto "${datosRepoPrincipal.repo}". Parte ÚNICA.\n`;
            } else if (esPrimera) {
                texto += `Hola. Proyecto "${datosRepoPrincipal.repo}". Parte ${num} de ${totalPartes}.\n\n`;
                texto += PROTOCOLO_INICIO; 
            } else if (esUltima) {
                texto += `Parte FINAL (${num} de ${totalPartes}).\n`;
            } else {
                texto += `Contexto Parte ${num} de ${totalPartes}.\n\n`;
            }

            if (instrucciones) {
                if (esPrimera && !esUltima) {
                    texto += `OBJETIVO (NO EMPEZAR A PROCESAR NI RESPONDER TODAVÍA): ${instrucciones}\n\n`;
                } else if (esUltima) {
                    texto += `OBJETIVO: ${instrucciones}\n\n`;
                }
            }

            if (esUltima) {
                texto += REGLAS_EMPAQUETADO_SISTEMA + `\n`;
            }

            texto += `ESTRUCTURA DEL CÓDIGO (PARTE ${num}):\n${contenido}\n`;
            
            if (esUltima) {
                texto += `\nFIN DEL CONTEXTO. Procesa todo el material provisto y ejecuta el OBJETIVO cumpliendo estrictamente con las NORMAS DE SALIDA OBLIGATORIAS.`;
            } else {
                texto += `\n=========================================\n`;
                texto += `🛑 ¡INSTRUCCIÓN CRÍTICA DE CONTROL PARA LA IA! 🛑\n`;
                texto += `Este mensaje es SOLO la Parte ${num} de un total de ${totalPartes} partes de contexto.\n`;
                texto += `Está ABSOLUTAMENTE PROHIBIDO empezar a ejecutar el objetivo, analizar el código o generar respuestas técnicas todavía.\n`;
                texto += `Para confirmar que has entendido que debes esperar a las partes restantes, responde EXCLUSIVAMENTE con la siguiente línea de texto, sin añadir saludos, disculpas ni comentarios adicionales:\n\n`;
                texto += `"Entendido. Parte ${num} recibida y almacenada en contexto. Quedo a la espera de la Parte ${num + 1}."`;
            }
            promptsFinalesListos.push(texto);
        });
        
        status.style.color = "#10b981";
        status.innerText = `✅ ¡Prompts generados! (Total: ${totalPartes} partes)`;
        if (btn) { btn.innerText = "✅ COLA LISTA"; btn.disabled = true; btn.style.display = "none"; }
        if (btnReset) btnReset.style.display = "block";
        if (previewBox) previewBox.style.display = "block";
        if (listaArchivos) listaArchivos.innerHTML = htmlPreviewArchivos;
        if (queueContainer) queueContainer.style.display = "block";
        if (partQueue) partQueue.innerHTML = "";
        if (totalPartes === 1) { copiarParte(0); } else {
            if (btnCopiarTodo) btnCopiarTodo.style.display = "block";
            promptsFinalesListos.forEach((textoParte, index) => {
                const charCount = textoParte.length;
                const minTokens = Math.round(charCount / 4);
                const maxTokens = Math.round(charCount / 3);

                // NUEVO: Advertencia si el prompt final supera el límite seleccionado por el usuario
                let advertencia = "";
                if (charCount > MAX_CARACTERES_POR_PROMPT) {
                    advertencia = `<span style="color:var(--danger); font-weight:700; margin-left:10px;">⚠️ EXCEDE LÍMITE (${charCount.toLocaleString()} / ${MAX_CARACTERES_POR_PROMPT.toLocaleString()} chars) - LA IA LO TRUNCARÁ</span>`;
                }

                const div = document.createElement('div');
                div.className = 'queue-item';
                div.id = `queue-item-${index}`;
                div.innerHTML = `<span class="queue-item-info">Parte ${index + 1} de ${totalPartes} <span style="color:#94a3b8; font-size:0.85rem; font-weight:400;">(Entre ${minTokens.toLocaleString()}/${maxTokens.toLocaleString()} tokens aprox)</span>${advertencia}</span><button class="copy-part-btn" id="copyBtn-${index}" onclick="copiarParte(${index})">📋 Copiar Parte ${index + 1}</button>`;
                partQueue.appendChild(div);
            });
        }
    } catch (error) {
        console.error(error);
        if (status) { status.style.color = "#ef4444"; status.innerText = `❌ Error: ${error.message}`; }
        if (btn) { btn.disabled = false; btn.innerText = "⚡ REINTENTAR"; }
    }
}

function copiarParte(index) {
    const texto = promptsFinalesListos[index];
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById(`copyBtn-${index}`);
        if (btn) {
            btn.innerText = "✅ ¡Copiado!";
            setTimeout(() => btn.innerText = `📋 Copiar Parte ${index + 1}`, 2500);
        }
    }).catch(err => { 
        console.error('Error al copiar al portapapeles:', err);
        alert("Error al copiar la parte. Por favor, copia manualmente.");
    });
}

function copiarTodoElPrompt() {
    const textoCompleto = promptsFinalesListos.join("\n\n");
    navigator.clipboard.writeText(textoCompleto).then(() => {
        const btnAll = document.getElementById('btnCopiarTodo');
        if (btnAll) {
            btnAll.innerText = "✅ ¡TODO COPIADO!";
            setTimeout(() => btnAll.innerText = "📄 COPIAR TODO EN UNO", 3000);
        }
    }).catch(err => { 
        console.error('Error al copiar al portapapeles:', err);
        alert("Error al copiar todo el prompt. Por favor, copia manualmente.");
    });
}
