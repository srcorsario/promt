// Cargar las últimas URLs usadas al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
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

// Variables globales para la nueva cola de copiado
let promptsFinalesListos = [];

async function construirSúperPrompt() {
    const urlInput = document.getElementById('repoUrl').value.trim();
    const urlSecundariaInput = document.getElementById('repoUrlSecundario').value.trim();
    const instrucciones = document.getElementById('instrucciones').value.trim();
    const MAX_CARACTERES_POR_PROMPT = parseInt(document.getElementById('limitSelect').value);
    const btn = document.getElementById('btnGenerar');
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

    // Guardar preferencias en almacenamiento local
    localStorage.setItem('last_github_repo', urlInput);
    localStorage.setItem('last_limit_select', MAX_CARACTERES_POR_PROMPT);
    if (urlSecundariaInput) {
        localStorage.setItem('last_github_repo_secondary', urlSecundariaInput);
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
                    textoPrompt += `OBJETIVO / CONSULTA PRINCIPAL:\n${instrucciones}\n\n`;
                } else {
                    textoPrompt += `OBJETIVO: Analiza la estructura del código actual de los repositorios cargados para responder a mis próximas preguntas.\n\n`;
                }
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
        btn.innerText = `🔄 REGENERAR PROMPTS`;
        btn.disabled = false;
        btn.onclick = () => location.reload();
        
        previewBox.style.display = "block";
        listaArchivos.innerHTML = htmlPreviewArchivos + 
            `<br><small style="color: #94a3b8; display:block; margin-top:15px;">El código se dividió en **${totalPartes} parte(s)** basado en el límite de ${(MAX_CARACTERES_POR_PROMPT/1000)}k caracteres.</small>`;

        queueContainer.style.display = "block";
        partQueue.innerHTML = "";

        if (totalPartes === 1) {
            // Si solo es 1 parte, copiar directamente
            copiarParte(0);
        } else {
            // Renderizar la cola visual
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
            // Auto-copiar la primera parte y hacer foco en el segundo botón
            copiarParte(0);
        }

    } catch (e) {
        status.style.color = "#ef4444";
        status.innerText = `❌ Error: ${e.message}`;
        console.error(e);
        btn.disabled = false;
    }
}

// --- NUEVAS FUNCIONES DE COPIADO RÁPIDO ---

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

        // Auto-enfocar el siguiente botón si existe
        const nextIndex = index + 1;
        const nextBtn = document.getElementById(`copyBtn-${nextIndex}`);
        if (nextBtn) {
            nextBtn.focus();
            nextBtn.classList.add('pulse'); // Pequeño efecto visual
            setTimeout(() => nextBtn.classList.remove('pulse'), 1000);
        }
    } catch (err) {
        alert("Error al copiar al portapapeles. Asegúrate de darle permisos al navegador.");
    }
}

async function copiarTodoElPrompt() {
    if (promptsFinalesListos.length === 0) return;
    
    // Unir todo con separadores dobles para que la IA entienda que son bloques distintos
    const todoUnido = promptsFinalesListos.map((p, i) => {
        // Limpiar las instrucciones de "espera la siguiente parte" si lo unimos todo
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
        alert("Error al copiar al portapapeles.");
    }
}
