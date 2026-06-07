// Cargar la última URL usada al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    const urlGuardada = localStorage.getItem('last_github_repo');
    if (urlGuardada) {
        document.getElementById('repoUrl').value = urlGuardada;
    }
});

async function construirSúperPrompt() {
    const urlInput = document.getElementById('repoUrl').value.trim();
    const instrucciones = document.getElementById('instrucciones').value.trim();
    const btn = document.getElementById('btnGenerar');
    const status = document.getElementById('statusCarga');
    const previewBox = document.getElementById('previewBox');
    const listaArchivos = document.getElementById('listaArchivos');

    if (!urlInput) {
        alert("Por favor, introduce una URL de GitHub.");
        return;
    }

    // Guardar URL en almacenamiento local
    localStorage.setItem('last_github_repo', urlInput);

    // Procesar la URL de navegación normal para convertirla en API de GitHub
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;
    const match = urlInput.match(regex);

    if (!match) {
        alert("Formato de URL no reconocido. Asegúrate de que sea una URL válida de GitHub.");
        return;
    }

    const [_, user, repo, branchInput] = match;
    const branch = branchInput || 'main'; // Por defecto busca 'main' si no se especifica

    btn.disabled = true;
    status.style.display = "block";
    status.style.color = "#38bdf8";
    status.innerText = "⏳ Leyendo estructura del repositorio...";

    try {
        // Consultar la API de contenido raíz del repositorio
        const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents?ref=${branch}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("No se pudo acceder al repositorio.");
        
        const archivos = await response.json();
        
        status.innerText = "⏳ Extrayendo el contenido de los archivos...";
        
        let bloquesArchivos = [];
        let archivosContados = [];

        // Filtro: Solo nos interesan archivos comunes de código en la raíz
        const extensionesPermitidas = ['.js', '.html', '.css', '.json', '.txt', '.md'];

        for (const archivo of archivos) {
            if (archivo.type === 'file') {
                const tieneExtensionValida = extensionesPermitidas.some(ext => archivo.name.endsWith(ext));
                
                if (tieneExtensionValida && archivo.name !== 'package-lock.json') {
                    archivosContados.push(archivo.name);
                    
                    // Descargar el contenido plano del archivo
                    const resContenido = await fetch(archivo.download_url);
                    const texto = await resContenido.text();
                    
                    let bloque = `\n=========================================\n`;
                    bloque += `ARCHIVO: ${archivo.name}\n`;
                    bloque += `=========================================\n`;
                    bloque += `${texto}\n`;
                    
                    bloquesArchivos.push(bloque);
                }
            }
        }

        if (archivosContados.length === 0) {
            throw new Error("No se encontraron archivos de texto legibles (.js, .html, .css...) en la raíz.");
        }

        // --- LÓGICA DE SEGMENTACIÓN EN VARIOS PROMPTS ---
        const MAX_CARACTERES_POR_PROMPT = 15000;
        let listaPromptsAGenerar = [];
        let acumuladorBloquesTexto = "";

        for (let i = 0; i < bloquesArchivos.length; i++) {
            // Si un solo archivo es extremadamente largo o el acumulador supera el límite, fragmentamos
            if ((acumuladorBloquesTexto + bloquesArchivos[i]).length > MAX_CARACTERES_POR_PROMPT && acumuladorBloquesTexto !== "") {
                listaPromptsAGenerar.push(acumuladorBloquesTexto);
                acumuladorBloquesTexto = bloquesArchivos[i];
            } else {
                acumuladorBloquesTexto += bloquesArchivos[i];
            }
        }
        if (acumuladorBloquesTexto !== "") {
            listaPromptsAGenerar.push(acumuladorBloquesTexto);
        }

        // --- CONSTRUCCIÓN DE LA SECUENCIA DE COPIADO ---
        let promptsFinalesListos = [];
        const totalPartes = listaPromptsAGenerar.length;

        listaPromptsAGenerar.forEach((contenidoCodigo, index) => {
            const numeroParte = index + 1;
            let textoPrompt = "";

            if (numeroParte === 1) {
                textoPrompt += `Hola. Estoy trabajando en un proyecto alojado en GitHub llamado "${repo}".\n`;
                textoPrompt += `A continuación te proporciono el contexto de mis archivos clave dividido en ${totalPartes} partes debido a limitaciones de espacio.\n`;
                textoPrompt += `CRÍTICO: Esta es la PARTE ${numeroParte} de ${totalPartes}. NO respondas ni analices todavía. Solo di "Recibido parte ${numeroParte}" y espera a las siguientes partes.\n\n`;
                
                if (instrucciones) {
                    textoPrompt += `OBJETIVO / CONSULTA PRINCIPAL (Para tu conocimiento previo):\n${instrucciones}\n\n`;
                }
            } else if (numeroParte < totalPartes) {
                textoPrompt += `Esta es la PARTE ${numeroParte} de ${totalPartes} del contexto del proyecto "${repo}".\n`;
                textoPrompt += `CRÍTICO: NO respondas ni ejecutes ninguna acción todavía. Solo di "Recibido parte ${numeroParte}" y sigue esperando el resto del código.\n\n`;
            } else {
                textoPrompt += `Esta es la PARTE FINAL (${numeroParte} de ${totalPartes}) del contexto del proyecto "${repo}".\n`;
                textoPrompt += `A partir de aquí ya tienes todo el contexto cargado.\n\n`;
                
                if (instrucciones) {
                    textoPrompt += `OBJETIVO / CONSULTA PRINCIPAL:\n${instrucciones}\n\n`;
                } else {
                    textoPrompt += `OBJETIVO: Analiza la estructura del código actual para responder a mis próximas preguntas.\n\n`;
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

        // Configurar el asistente de copiado en el botón
        let parteActualParaCopiar = 0;

        const gestionarCopiadoSecuencial = async () => {
            if (parteActualParaCopiar < totalPartes) {
                await navigator.clipboard.writeText(promptsFinalesListos[parteActualParaCopiar]);
                parteActualParaCopiar++;
                
                if (parteActualParaCopiar < totalPartes) {
                    status.style.color = "#38bdf8";
                    status.innerText = `📋 Parte ${parteActualParaCopiar} copiada. Haz clic de nuevo para copiar la Parte ${parteActualParaCopiar + 1}/${totalPartes}`;
                    btn.innerText = `📋 COPIAR PARTE ${parteActualParaCopiar + 1} DE ${totalPartes}`;
                } else {
                    status.style.color = "#10b981";
                    status.innerText = `✨ ¡Todas las partes (${totalPartes}/${totalPartes}) han sido copiadas e introducidas!`;
                    btn.innerText = `⚡ REGENERAR PROMPTS`;
                    btn.onclick = () => location.reload(); // Restablecer el estado
                }
            }
        };

        // Copiar la primera parte de forma automática inmediatamente
        await navigator.clipboard.writeText(promptsFinalesListos[0]);
        parteActualParaCopiar = 1;

        if (totalPartes > 1) {
            status.style.color = "#38bdf8";
            status.innerText = `📋 Parte 1 de ${totalPartes} copiada automáticamente. Ve a la IA, pégala y luego vuelve aquí para presionar el botón de la Parte 2.`;
            btn.innerText = `📋 COPIAR PARTE 2 DE ${totalPartes}`;
            btn.disabled = false;
            btn.onclick = gestionarCopiadoSecuencial;
        } else {
            status.style.color = "#10b981";
            status.innerText = "✨ ¡Súper-Prompt único copiado al portapapeles! Ya puedes pegarlo en la IA.";
            btn.disabled = false;
        }
        
        previewBox.style.display = "block";
        listaArchivos.innerHTML = archivosContados.map(name => `<span class="file-tag">📄 ${name}</span>`).join('') + 
            `<br><small style="color: #94a3b8; display:block; margin-top:10px;">El código se dividió en **${totalPartes} parte(s)** para prevenir recortes de la IA.</small>`;

    } catch (e) {
        status.style.color = "#ef4444";
        status.innerText = `❌ Error: ${e.message}`;
        console.error(e);
        btn.disabled = false;
    }
}
