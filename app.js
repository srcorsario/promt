// Variable que controla la versión del script lógico
const VER_APP = "2.2.2"; // Actualizado a v2.2.2 para control de caché

// Variables globales para la cola de copiado
let promptsFinalesListos = [];

// Diccionario de órdenes e instrucciones prefijadas
const PLANTILLAS_ORDENES = {
    analizar: "Analiza detalladamente la arquitectura de este proyecto. Explica cómo se comunican los componentes, los flujos de datos principales y enumera las dependencias críticas detectadas.",
    bugs: "Revisa exhaustivamente todo el código provisto en busca de errores de lógica, fallas de seguridad potenciales, fugas de memoria o malas prácticas. Muestra los puntos críticos y propón sus correcciones exactas.",
    refactor: "Actúa como un ingeniero de software expert en refactorización. Revisa los archivos e identifica bloques redundantes o ineficientes. Proporciona una versión optimizada del código que mejore el rendimiento y la legibilidad.",
    documentar: "Generar la documentación técnica correspondiente para las funciones y módulos clave de este repositorio. Añade comentarios claros y estructuras de tipo JSDoc/comentarios descriptivos donde falten.",
    test: "Examina los flujos lógicos y genera una estrategia integral de pruebas unitarias. Detalla qué casos de prueba y escenarios límite (edge cases) se deben validar de forma prioritaria en base a los archivos adjuntos."
};

/**
 * REGLAS INTRÍNSECAS DE RESPUESTA (INYECTADAS AUTOMÁTICAMENTE)
 * Estas reglas obligan a la IA a retornar siempre el código completo sin intervenciones del usuario.
 */

const REGLAS_EMPAQUETADO_SISTEMA = 
`\n\n=========================================\n` +
`NORMAS DE SALIDA OBLIGATORIAS PARA LA IA:\n` +
`=========================================\n` +
`1. Cuando respondas implementando el OBJETIVO o procesando los archivos, debes devolver los ARCHIVOS MODIFICADOS EN SU TOTALIDAD (Código completo, sin recortes, sin omitir funciones funcionales y sin usar comentarios del tipo '// ... resto del código').\n` +
`2. Si un archivo provisto en el contexto NO necesita sufrir modificaciones para cumplir el objetivo, NO muestres su código. Simplemente indica de forma clara y breve: "El archivo [nombre_archivo] no requiere modificaciones".\n` +
`3. No reescribas ni alteres la lógica de los componentes que ya funcionan a menos que sea estrictamente necesario para cumplir el objetivo solicitado.\n` +
`4. Cada vez que proveas un código modificado, lista de manera clara los elementos agregados o eliminados en comparación con la versión que te fue entregada.\n` +
`5. PRESERVACIÓN DE IDENTIFICADORES: Está estrictamente prohibido renombrar funciones, variables, identificadores HTML (id), clases CSS o claves de almacenamiento (localStorage) existentes. Mantén intacta la nomenclatura original.\n` +
`6. ENTORNO TECNOLÓGICO: Resuelve el objetivo utilizando exclusivamente las tecnologías nativas provistas (Vanilla JS, CSS nativo, etc.). No inventes dependencias ni asumas la existencia de librerías externas que no veas explícitamente en el contexto.\n` +
`7. MODULARIDAD SEGURA: Cualquier lógica nueva debe aislarse correctamente y no debe interferir con los listeners de ciclo de vida (como DOMContentLoaded) ni con las variables globales del sistema.\n` +
`8. SALIDA DIRECTA Y COMPACTA: Entrega los resultados estructurados en bloques de código Markdown limpios. Evita textos introductorios densos, rodeos teóricos o saludos; prioriza la legibilidad y la velocidad de copiado.\n` +
`9. MANEJO DEFENSIVO DEL DOM: Antes de interactuar con elementos de la interfaz, valida su existencia (if (elemento)) para evitar excepciones en JS si la estructura cambia.\n` +
`10. CONTROL DE LISTENERS: Diseña los manejadores de eventos de forma que no puedan registrarse duplicados ni generar fugas de memoria al reejecutar funciones.\n` +
`11. INTEGRIDAD DEL ESTADO: Los cambios lógicos no deben resetear involuntariamente inputs, variables de estado activas o datos alojados en LocalStorage.\n` +
`12. SEÑALIZACIÓN EN CÓDIGO: Inserta comentarios breves como '// NUEVO:' o '// MODIFICADO:' directamente sobre las líneas cambiadas dentro del bloque de código devuelto para facilitar su revisión.`;

// Cargar las últimas URLs y el historial al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    // Renderizar versión visualmente
    const versionBadgeApp = document.getElementById('versionApp');
    if (versionBadgeApp) {
        versionBadgeApp.innerText = `App: v${VER_APP}`;
    }

    // Inicializar historial de repositorios
    actualizarDesplegableHistorial();

    const urlGuardada = localStorage.getItem('last_github_repo');
    if (urlGuardada) {
        document.getElementById('repoUrl').value = urlGuardada;
    }
    const urlSecundariaGuardada = localStorage.getItem('last_github_repo_secondary');
    if (urlSecundariaGuardada) {
        document.getElementById('repoUrlSecundario').value = urlSecundariaGuardada;
    }
    const limitGuardado = localStorage.getItem('last_limit_select');
    if (limitGuardado) {
        document.getElementById('limitSelect').value = limitGuardado;
    }
});

// Inyecta el texto predefinido directo en el Textarea de prompts
function aplicarOrdenPrefijada(clavePlantilla) {
    const textoInyectar = PLANTILLAS_ORDENES[clavePlantilla];
    if (textoInyectar) {
        document.getElementById('instrucciones').value = textoInyectar;
    }
}

// Lógica de gestión del historial en LocalStorage
function guardarEnHistorial(url) {
    if (!url) return;
    let historial = JSON.parse(localStorage.getItem('github_repo_history') || '[]');
    
    // Filtrar si ya existe para enviarla al inicio de la lista
    historial = historial.filter(item => item !== url);
    historial.unshift(url);
    
    // Guardar únicamente los últimos 8 repositorios
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
    
    // Resetear opciones manteniendo la inicial estática
    select.innerHTML = '<option value="" disabled selected>📂 Historial de repositorios usados...</option>';
    
    historial.forEach(url => {
        const option = document.createElement('option');
        option.value = url;
        option.innerText = url.replace('https://github.com/', '');
        select.appendChild(option);
    });
    
    select.style.display = 'block';
    
    // Listener para rellenar el input al seleccionar una opción
    select.onchange = (e) => {
        if (e.target.value) {
            document.getElementById('repoUrl').value = e.target.value;
        }
    };
}

// Función limpia para resetear toda la interfaz (Trabajo anterior)
function limpiarInterfaz() {
    // Limpiar inputs de texto y selectores de órdenes
    document.getElementById('repoUrl').value = '';
    document.getElementById('repoUrlSecundario').value = '';
    document.getElementById('instrucciones').value = '';
    document.getElementById('ordenesPredeterminadas').value = '';
    
    // Ocultar contenedores de prompts y vistas previas
    document.getElementById('previewBox').style.display = "none";
    document.getElementById('queueContainer').style.display = "none";
    
    // Resetear estados del estado/loader
    const status = document.getElementById('statusCarga');
    status.style.display = "none";
    status.innerText = "";
    
    // Alternar visibilidad de botones (Ocultar reset, mostrar Generar limpio)
    const btnGenerar = document.getElementById('btnGenerar');
    btnGenerar.disabled = false;
    btnGenerar.innerText = "⚡ GENERAR PROMPTS";
    btnGenerar.style.display = "block";
    
    document.getElementById('btnReset').style.display = "none";
    
    // Forzar actualización del selector de historial
    actualizarDesplegableHistorial();
    
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Función auxiliar para extraer datos de la URL de GitHub
function parsearGitHubUrl(url) {
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;
    const match = url.match(regex);
    if (!match) return null;
    return {
        user: match[1],
        repo: match[2],
        branch: match[3] || 'main'
    };
}

// Función para descargar y procesar los bloques de código de un repositorio dado
async function obtenerBloquesCodigo(datosRepo, esPrincipal = true) {
    const extensionesPermitidas = ['.js', '.html', '.css', '.json', '.txt', '.md'];
    let bloques = [];
    let nombresArchivos = [];

    const apiUrl = `https://api.github.com/repos/${datosRepo.user}/${datosRepo.repo}/contents?ref=${datosRepo.branch}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error(`No se pudo acceder al repositorio: ${datosRepo.repo}`);
    
    const archivos = await response.json();

    for (const archivo of archivos) {
        if (archivo.type === 'file') {
            const tieneExtensionValida = extensionesPermitidas.some(ext => archivo.name.endsWith(ext));
            
            if (tieneExtensionValida && archivo.name !== 'package-lock.json') {
                nombresArchivos.push(archivo.name);
                
                const resContenido = await fetch(archivo.download_url);
                const texto = await resContenido.text();
                
                let bloque = `\n=========================================\n`;
                bloque += `REPOSITORIO: ${datosRepo.repo} (${esPrincipal ? 'PRINCIPAL' : 'REFERENCIA SECUNDARIA'})\n`;
                bloque += `ARCHIVO: ${archivo.name}\n`;
                bloque += `=========================================\n`;
                bloque += `${texto}\n`;
                
                bloques.push(bloque);
            }
        }
    }
    return { bloques, nombresArchivos };
}

async function construirSuperPrompt() {
    const urlInput = document.getElementById('repoUrl').value.trim();
    const urlSecundariaInput = document.getElementById('repoUrlSecundario').value.trim();
    const instrucciones = document.getElementById('instrucciones').value.trim();
    const MAX_CARACTERES_POR_PROMPT = parseInt(document.getElementById('limitSelect').value);
    const btn = document.getElementById('btnGenerar');
    const btnReset = document.getElementById('btnReset');
    const status = document.getElementById('statusCarga');
    const previewBox = document.getElementById('previewBox');
    const listaArchivos = document.getElementById('listaArchivos');
    const queueContainer = document.getElementById('queueContainer');
    const partQueue = document.getElementById('partQueue');
    const btnCopiarTodo = document.getElementById('btnCopiarTodo');

    if (!urlInput) {
        alert("Por favor, introduce una URL de GitHub principal.");
        return;
    }

    // Guardar preferencias en almacenamiento local e historial
    localStorage.setItem('last_github_repo', urlInput);
    localStorage.setItem('last_limit_select', MAX_CARACTERES_POR_PROMPT);
    guardarEnHistorial(urlInput);
    
    if (urlSecundariaInput) {
        localStorage.setItem('last_github_repo_secondary', urlSecundariaInput);
        guardarEnHistorial(urlSecundariaInput);
    } else {
        localStorage.removeItem('last_github_repo_secondary');
    }

    // Procesar repositorio principal
    const datosRepoPrincipal = parsearGitHubUrl(urlInput);
    if (!datosRepoPrincipal) {
        alert("Formato de URL principal no reconocido.");
        return;
    }

    // Procesar repositorio secundario si existe
    let datosRepoSecundario = null;
    if (urlSecundariaInput) {
        datosRepoSecundario = parsearGitHubUrl(urlSecundariaInput);
        if (!datosRepoSecundario) {
            alert("Formato de URL secundaria no reconocido.");
            return;
        }
    }

    btn.disabled = true;
    status.style.display = "block";
    status.style.color = "#38bdf8";
    status.innerText = "⏳ Leyendo estructura del repositorio principal...";

    try {
        let todosLosBloquesArchivos = [];
        let htmlPreviewArchivos = "";

        // 1. Cargar repositorio principal
        const resultadoPrincipal = await obtenerBloquesCodigo(datosRepoPrincipal, true);
        if (resultadoPrincipal.nombresArchivos.length === 0) {
            throw new Error("No se encontraron archivos válidos en la raíz del repositorio principal.");
        }
        todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resultadoPrincipal.bloques);
        
        htmlPreviewArchivos += `<div class="repo-section-title">📂 Principal (${datosRepoPrincipal.repo}):</div>`;
        htmlPreviewArchivos += resultadoPrincipal.nombresArchivos.map(name => `<span class="file-tag">📄 ${name}</span>`).join('');

        // 2. Cargar repositorio secundario si ha sido provisto
        if (datosRepoSecundario) {
            status.innerText = "⏳ Leyendo estructura del repositorio secundario...";
            const resultadoSecundario = await obtenerBloquesCodigo(datosRepoSecundario, false);
            if (resultadoSecundario.nombresArchivos.length > 0) {
                todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resultadoSecundario.bloques);
                htmlPreviewArchivos += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario de Referencia (${datosRepoSecundario.repo}):</div>`;
                htmlPreviewArchivos += resultadoSecundario.nombresArchivos.map(name => `<span class="file-tag" style="border-left: 3px solid var(--accent);">📄 ${name}</span>`).join('');
            }
        }

        status.innerText = "⏳ Armando secuencia de prompts...";

        // --- LÓGICA DE SEGMENTACIÓN EN VARIOS PROMPTS ---
        let listaPromptsAGenerar = [];
        let acumuladorBloquesTexto = "";

        for (let i = 0; i < todosLosBloquesArchivos.length; i++) {
            if ((acumuladorBloquesTexto + todosLosBloquesArchivos[i]).length > MAX_CARACTERES_POR_PROMPT && acumuladorBloquesTexto !== "") {
                listaPromptsAGenerar.push(acumuladorBloquesTexto);
                acumuladorBloquesTexto = todosLosBloquesArchivos[i];
            } else {
                acumuladorBloquesTexto += todosLosBloquesArchivos[i];
            }
        }
        if (acumuladorBloquesTexto !== "") {
            listaPromptsAGenerar.push(acumuladorBloquesTexto);
        }

        // --- CONSTRUCCIÓN DE LA SECUENCIA FINAL ---
        promptsFinalesListos = [];
        const totalPartes = listaPromptsAGenerar.length;

        listaPromptsAGenerar.forEach((contenidoCodigo, index) => {
            const numeroParte = index + 1;
            let textoPrompt = "";

            if (numeroParte === 1) {
                textoPrompt += `Hola. Estoy trabajando en un proyecto alojado en GitHub llamado "${datosRepoPrincipal.repo}".\n`;
                if (datosRepoSecundario) {
                    textoPrompt += `También te adjunto el código de un segundo proyecto de referencia llamado "${datosRepoSecundario.repo}" para usar sus funciones como base o ejemplo.\n`;
                }
                textoPrompt += `A continuación te proporciono el contexto de mis archivos clave dividido en ${totalPartes} partes debido a limitaciones de espacio.\n`;
                textoPrompt += `CRÍTICO: Esta es la PARTE ${numeroParte} de ${totalPartes}. NO respondas ni analices todavía. Solo di "Recibido parte ${numeroParte}" y espera a las siguientes partes.\n\n`;
                
                if (instrucciones) {
                    textoPrompt += `OBJETIVO / CONSULTA PRINCIPAL (Para tu conocimiento previo):\n${instrucciones}\n\n`;
                }
            } else if (numeroParte < totalPartes) {
                textoPrompt += `Esta es la PARTE ${numeroParte} de ${totalPartes} del contexto del proyecto "${datosRepoPrincipal.repo}".\n`;
                textoPrompt += `CRÍTICO: NO respondas ni ejecutes ninguna acción todavía. Solo di "Recibido parte ${numeroParte}" y sigue esperando el resto del código.\n\n`;
            } else {
                textoPrompt += `Esta es la PARTE FINAL (${numeroParte} de ${totalPartes}) del contexto de mis proyectos.\n`;
                textoPrompt += `A partir de aquí ya tienes todo el contexto cargado.\n\n`;
                
                if (instrucciones) {
                    textoPrompt += `OBJETIVO / CONSULTA PRINCIPAL:\n${instrucciones}\n`;
                } else {
                    textoPrompt += `OBJETIVO: Analiza la estructura del código actual de los repositorios cargados para responder a mis próximas preguntas.\n`;
                }
                
                // INYECCIÓN INTRÍNSECA AUTOMÁTICA DE COMPORTAMIENTO
                textoPrompt += REGLAS_EMPAQUETADO_SISTEMA;
                textoPrompt += `\n\n`;
            }

            textoPrompt += `ESTRUCTURA DEL CÓDIGO (PARTE ${numeroParte}):\n`;
            textoPrompt += contenidoCodigo;
            textoPrompt += `\n=========================================\n`;
            
            if (numeroParte === totalPartes) {
                textoPrompt += `FIN DEL CONTEXTO. Por favor, procesa toda la información recibida desde la Parte 1 y responde a mi objetivo.\n`;
                textoPrompt += `Eso es todo`;
            } else {
                textoPrompt += `FIN DE LA PARTE ${numeroParte}. Espera el siguiente prompt.`;
            }

            promptsFinalesListos.push(textoPrompt);
        });

        // --- RENDERIZADO DE LA NUEVA COLA DE COPIADO ---
        status.style.color = "#10b981";
        status.innerText = `✅ ¡Prompts generados! (Total: ${totalPartes} partes)`;
        
        btn.innerText = "✅ COLA LISTA";
        btn.disabled = true;
        btn.style.display = "none";
        btnReset.style.display = "block";
        
        previewBox.style.display = "block";
        listaArchivos.innerHTML = htmlPreviewArchivos + 
            `<br><small style="color: #94a3b8; display:block; margin-top:15px;">El código se dividió en **${totalPartes} parte(s)** basado en el límite de ${(MAX_CARACTERES_POR_PROMPT/1000)}k caracteres.</small>`;

        queueContainer.style.display = "block";
        partQueue.innerHTML = "";

        if (totalPartes === 1) {
            copiarParte(0);
        } else {
            btnCopiarTodo.style.display = "block";
            promptsFinalesListos.forEach((_, index) => {
                const div = document.createElement('div');
                div.className = 'queue-item';
                div.id = `queue-item-${index}`;
                div.innerHTML = `
                    <span class="queue-item-info">Parte ${index + 1} de ${totalPartes} (${(promptsFinalesListos[index].length / 1024).toFixed(1)} KB)</span>
                    <button class="copy-part-btn" id="copyBtn-${index}" onclick="copiarParte(${index})">📋 Copiar</button>
                `;
                partQueue.appendChild(div);
            });
            copiarParte(0);
        }

    } catch (e) {
        status.style.color = "#ef4444";
        status.innerText = `❌ Error: ${e.message}`;
        console.error(e);
        btn.disabled = false;
        btn.innerText = "⚡ GENERAR PROMPTS";
    }
}

async function copiarParte(index) {
    if (!promptsFinalesListos[index]) return;
    try {
        await navigator.clipboard.writeText(promptsFinalesListos[index]);
        const btn = document.getElementById(`copyBtn-${index}`);
        const item = document.getElementById(`queue-item-${index}`);
        if (btn && item) {
            btn.innerText = "✅ ¡Copiado!";
            btn.classList.add('copied');
            btn.disabled = true;
            item.classList.add('copied');
        }
        const nextIndex = index + 1;
        const nextBtn = document.getElementById(`copyBtn-${nextIndex}`);
        if (nextBtn) nextBtn.focus();
    } catch (err) {
        alert("Error al copiar al portapapeles.");
    }
}

async function copiarTodoElPrompt() {
    if (promptsFinalesListos.length === 0) return;
    const todoUnido = promptsFinalesListos.map((p, i) => {
        let cleanP = p.replace("FIN DE LA PARTE. Espera el siguiente prompt.", "FIN DEL BLOQUE DE ARCHIVOS.");
        cleanP = cleanP.replace("CRÍTICO: NO respondas ni ejecutes ninguna acción todavía. Solo di \"Recibido parte\" y sigue esperando el resto del código.", "CONTINÚA LEYENDO EL SIGUIENTE BLOQUE.");
        return cleanP;
    }).join("\n\n---SEPARADOR DE BLOQUE---\n\n");

    try {
        await navigator.clipboard.writeText(todoUnido);
        const btn = document.getElementById('btnCopiarTodo');
        btn.innerText = "✅ ¡Todo Copiado de Golpe!";
        btn.disabled = true;
        btn.style.background = "#475569";
    } catch (err) {
        alert("Error al copiar.");
    }
}
