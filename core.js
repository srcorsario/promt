// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Flujo principal orquestador de la aplicación (Fases 1 y 2 de construcción).

async function construirSuperPrompt() {
    const urlInput = document.getElementById('repoUrl')?.value.trim();
    const urlSecundariaInput = document.getElementById('repoUrlSecundario')?.value.trim();
    const btn = document.getElementById('btnGenerar');
    const status = document.getElementById('statusCarga');
    const previewBox = document.getElementById('previewBox');
    const queueContainer = document.getElementById('queueContainer');

    if (!urlInput) { alert("Por favor, introduce una URL de GitHub principal."); return; }
    
    const datosRepoPrincipal = parsearGitHubUrl(urlInput);
    if (!datosRepoPrincipal) { alert("Formato de URL principal no reconocido."); return; }
    
    let datosRepoSecundario = null;
    if (urlSecundariaInput) {
        datosRepoSecundario = parsearGitHubUrl(urlSecundariaInput);
        if (!datosRepoSecundario) { alert("Formato de URL secundaria no reconocido."); return; }
    }

    localStorage.setItem('last_github_repo', urlInput);
    localStorage.setItem('last_limit_select', document.getElementById('limitSelect').value);
    guardarEnHistorial(urlInput);
    if (urlSecundariaInput) { localStorage.setItem('last_github_repo_secondary', urlSecundariaInput); guardarEnHistorial(urlSecundariaInput); }
    else { localStorage.removeItem('last_github_repo_secondary'); }

    configReposGlobal = { datosRepoPrincipal, datosRepoSecundario };

    btn.disabled = true;
    status.style.display = "block"; status.style.color = "#38bdf8";
    queueContainer.style.display = "none";
    
    try {
        status.innerText = "⏳ Escaneando estructura completa del repositorio principal...";
        arbolArchivosPrincipal = await obtenerArbolCompleto(datosRepoPrincipal);
        
        if (arbolArchivosPrincipal.length === 0) throw new Error("El repositorio principal está vacío o no se encontraron archivos.");

        if (datosRepoSecundario) {
            status.innerText = "⏳ Escaneando repositorio secundario...";
            arbolArchivosSecundario = await obtenerArbolCompleto(datosRepoSecundario);
        } else {
            arbolArchivosSecundario = [];
        }

        const listaArchivos = document.getElementById('listaArchivos');
        listaArchivos.innerHTML = `<div class="repo-section-title">📂 Principal (${datosRepoPrincipal.repo}): <span style="color:#94a3b8; font-weight:400;">${arbolArchivosPrincipal.length} archivos encontrados</span></div>`;
        
        if (arbolArchivosSecundario.length > 0) {
            listaArchivos.innerHTML += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario (${datosRepoSecundario.repo}): <span style="color:#94a3b8; font-weight:400;">${arbolArchivosSecundario.length} archivos encontrados</span></div>`;
        }

        const fullTreeList = document.getElementById('fullFileTreeList');
        const fullTreeContainer = document.getElementById('fullFileTreeContainer');
        if (fullTreeList && fullTreeContainer) {
            let treeText = "";
            const marcarExcluido = (path) => {
                const ext = path.includes('.') ? '.' + path.split('.').pop().toLowerCase() : '(sin extensión)';
                return EXTENSIONES_EXCLUIDAS_DEFECTO.includes(ext) ? ' [EXCLUIDO POR DEFECTO]' : '';
            };
            
            treeText += `--- Principal (${datosRepoPrincipal.repo}) ---\n`;
            arbolArchivosPrincipal.forEach(f => treeText += `${f.path}${marcarExcluido(f.path)}\n`);
            
            if (arbolArchivosSecundario.length > 0) {
                treeText += `\n--- Secundario (${datosRepoSecundario.repo}) ---\n`;
                arbolArchivosSecundario.forEach(f => treeText += `${f.path}${marcarExcluido(f.path)}\n`);
            }
            
            fullTreeList.innerText = treeText;
            fullTreeContainer.style.display = 'block';
        }

        status.innerText = "✅ Estructura leída. Selecciona los tipos de archivo y haz clic en 'Aplicar Filtros'.";
        status.style.color = "#10b981";
        
        previewBox.style.display = "block";
        renderizarFiltrosExtensiones();
        
        btn.innerText = "⏳ ESPERANDO FILTROS...";
        btn.disabled = true;

    } catch (error) {
        console.error(error);
        status.style.color = "#ef4444"; status.innerText = `❌ Error: ${error.message}`;
        btn.disabled = false; btn.innerText = "⚡ REINTENTAR";
    }
}

async function aplicarFiltrosYGenerar() {
    const status = document.getElementById('statusCarga');
    const btnGenerar = document.getElementById('btnGenerar');
    const btnReset = document.getElementById('btnReset');
    const limitSelectEl = document.getElementById('limitSelect');
    const MAX_CARACTERES_POR_PROMPT = limitSelectEl ? parseInt(limitSelectEl.value) : 50000;
    const instrucciones = document.getElementById('instrucciones')?.value.trim();

    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.disabled = true;
        btnAplicarFiltros.innerText = "⏳ PROCESANDO Y DESCARGANDO...";
    }

    const checkboxes = document.querySelectorAll('#extensionFilters input[type="checkbox"]:checked');
    const extensionesPermitidas = Array.from(checkboxes).map(cb => cb.value);
    
    if (extensionesPermitidas.length === 0) {
        alert("Debes seleccionar al menos un tipo de archivo para continuar.");
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
        return;
    }

    const archivosPrincipalesFiltrados = arbolArchivosPrincipal.filter(f => {
        const ext = f.path.includes('.') ? '.' + f.path.split('.').pop().toLowerCase() : '(sin extensión)';
        return extensionesPermitidas.includes(ext) && !f.path.endsWith('package-lock.json');
    });

    const archivosSecundariosFiltrados = arbolArchivosSecundario.filter(f => {
        const ext = f.path.includes('.') ? '.' + f.path.split('.').pop().toLowerCase() : '(sin extensión)';
        return extensionesPermitidas.includes(ext) && !f.path.endsWith('package-lock.json');
    });

    if (archivosPrincipalesFiltrados.length === 0 && archivosSecundariosFiltrados.length === 0) {
        alert("Con los filtros seleccionados, no hay archivos válidos para procesar.");
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
        return;
    }

    // NUEVO: Generar bloque de Mapa Global de Archivos para inyectar al prompt
    let mapaArchivosBloque = `\n=========================================\n`;
    mapaArchivosBloque += `MAPA GLOBAL DE ARCHIVOS DEL REPOSITORIO (Solo lectura/referencia)\n`;
    mapaArchivosBloque += `=========================================\n`;
    mapaArchivosBloque += `NOTA: Los archivos marcados como [EXCLUIDO DEL CÓDIGO] no se incluyen en el prompt para ahorrar tokens, pero existen físicamente en el repositorio. Úsalos para verificar dependencias, rutas o nombres de archivos.\n\n`;

    if (arbolArchivosPrincipal.length > 0) {
        mapaArchivosBloque += `--- Principal (${configReposGlobal.datosRepoPrincipal.repo}) ---\n`;
        arbolArchivosPrincipal.forEach(f => {
            const ext = f.path.includes('.') ? '.' + f.path.split('.').pop().toLowerCase() : '(sin extensión)';
            const estaExcluido = EXTENSIONES_EXCLUIDAS_DEFECTO.includes(ext) || f.path.endsWith('package-lock.json');
            mapaArchivosBloque += `${estaExcluido ? '[EXCLUIDO DEL CÓDIGO] ' : ''}${f.path}\n`;
        });
    }

    if (arbolArchivosSecundario.length > 0) {
        mapaArchivosBloque += `\n--- Secundario (${configReposGlobal.datosRepoSecundario.repo}) ---\n`;
        arbolArchivosSecundario.forEach(f => {
            const ext = f.path.includes('.') ? '.' + f.path.split('.').pop().toLowerCase() : '(sin extensión)';
            const estaExcluido = EXTENSIONES_EXCLUIDAS_DEFECTO.includes(ext) || f.path.endsWith('package-lock.json');
            mapaArchivosBloque += `${estaExcluido ? '[EXCLUIDO DEL CÓDIGO] ' : ''}${f.path}\n`;
        });
    }
    // FIN NUEVO: Mapa Global

    let bloquesAppScript = [];
    const gsUrl = document.getElementById('googleSheetUrl')?.value.trim();
    const gsCodePrincipal = document.getElementById('appScriptCode')?.value.trim();
    
    if (gsUrl && gsCodePrincipal) {
        let bloqueGS = `\n=========================================\n`;
        bloqueGS += `GOOGLE APPS SCRIPT (URL Referencia: ${gsUrl})\n`;
        bloqueGS += `ARCHIVO: Código.gs\n`;
        bloqueGS += `=========================================\n`;
        bloqueGS += `${gsCodePrincipal}\n`;
        bloquesAppScript.push(bloqueGS);

        const extras = document.querySelectorAll('.app-script-extra-name');
        extras.forEach((inputName, index) => {
            const name = inputName.value.trim() || `Extra_${index + 1}.gs`;
            const codeArea = inputName.parentElement.querySelector('.app-script-extra-code');
            const code = codeArea ? codeArea.value.trim() : '';
            
            if (code) {
                let bloqueExtra = `\n=========================================\n`;
                bloqueExtra += `GOOGLE APPS SCRIPT (URL Referencia: ${gsUrl})\n`;
                bloqueExtra += `ARCHIVO: ${name}\n`;
                bloqueExtra += `=========================================\n`;
                bloqueExtra += `${code}\n`;
                bloquesAppScript.push(bloqueExtra);
            }
        });
    }

    const totalArchivos = archivosPrincipalesFiltrados.length + archivosSecundariosFiltrados.length + bloquesAppScript.length;
    status.style.color = "#38bdf8";
    status.innerText = `⏳ Descargando contenido de ${totalArchivos} elementos (${bloquesAppScript.length} Apps Script, ${archivosPrincipalesFiltrados.length + archivosSecundariosFiltrados.length} GitHub)...`;

    try {
        // MODIFICADO: Inyectar primero el Mapa Global, luego Apps Script, luego GitHub
        let todosLosBloquesArchivos = [mapaArchivosBloque, ...bloquesAppScript];
        let htmlPreviewArchivos = "";

        if (bloquesAppScript.length > 0) {
            htmlPreviewArchivos += `<div class="repo-section-title">📜 Google Apps Script (Incluidos al inicio):</div>`;
            htmlPreviewArchivos += `<span class="file-tag" style="border-left: 3px solid var(--green);">📄 Código.gs</span>`;
            document.querySelectorAll('.app-script-extra-name').forEach(inp => {
                if (inp.value.trim()) htmlPreviewArchivos += `<span class="file-tag" style="border-left: 3px solid var(--green);">📄 ${inp.value.trim()}</span>`;
            });
        }

        const resPrincipal = await descargarContenidos(archivosPrincipalesFiltrados, configReposGlobal.datosRepoPrincipal, true);
        todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resPrincipal.bloques);
        htmlPreviewArchivos += `<div class="repo-section-title" style="margin-top:15px;">📂 Principal (Incluidos):</div>`;
        htmlPreviewArchivos += resPrincipal.nombres.map(name => `<span class="file-tag">📄 ${name}</span>`).join('');

        if (archivosSecundariosFiltrados.length > 0) {
            const resSecundario = await descargarContenidos(archivosSecundariosFiltrados, configReposGlobal.datosRepoSecundario, false);
            todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resSecundario.bloques);
            htmlPreviewArchivos += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario (Incluidos):</div>`;
            htmlPreviewArchivos += resSecundario.nombres.map(name => `<span class="file-tag" style="border-left: 3px solid var(--accent);">📄 ${name}</span>`).join('');
        }

        document.getElementById('listaArchivos').innerHTML = htmlPreviewArchivos;

        status.innerText = "⏳ Armando secuencia de prompts y verificando integridad de archivos...";
        await armarPromptsFinales(todosLosBloquesArchivos, configReposGlobal.datosRepoPrincipal, instrucciones, MAX_CARACTERES_POR_PROMPT);

        status.style.color = "#10b981";
        status.innerText = `✅ ¡Prompts generados! (Total: ${promptsFinalesListos.length} partes)`;
        
        btnGenerar.style.display = "none";
        btnReset.style.display = "block";
        
        if (btnAplicarFiltros) {
            btnAplicarFiltros.innerText = "✅ FILTROS APLICADOS";
            btnAplicarFiltros.disabled = true;
        }

    } catch (error) {
        console.error(error);
        status.style.color = "#ef4444"; status.innerText = `❌ Error al descargar: ${error.message}`;
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
    }
}

async function armarPromptsFinales(todosLosBloquesArchivos, datosRepoPrincipal, instrucciones, MAX_CARACTERES_POR_PROMPT) {
    const overheadMinimo = 1500; 
    if (instrucciones && (instrucciones.length + overheadMinimo) > MAX_CARACTERES_POR_PROMPT) {
        throw new Error(`Tu instrucción (${instrucciones.length} chars) excede el límite seleccionado.`);
    }

    const longitudInstrucciones = instrucciones ? instrucciones.length : 0;
    const longitudReglas = REGLAS_EMPAQUETADO_SISTEMA.length;
    const longitudProtocolo = PROTOCOLO_INICIO.length;
    const MARGEN_SEGURIDAD = 1500; 
    
    const limiteEfectivoCodigo = Math.max(1000, MAX_CARACTERES_POR_PROMPT - (longitudInstrucciones + longitudReglas + longitudProtocolo + MARGEN_SEGURIDAD + MARCA_FIN_PARTE.length));

    let bloquesProcesados = [];
    for (const bloque of todosLosBloquesArchivos) {
        if (bloque.length <= limiteEfectivoCodigo) {
            bloquesProcesados.push(bloque);
        } else {
            const lineas = bloque.split('\n');
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
            
            let fragmentosCodigo = [];
            let subBloque = "";
            
            for (const linea of codeLines) {
                if ((headerStr.length + linea.length + 300) > limiteEfectivoCodigo) {
                    if (subBloque.trim() !== "") { fragmentosCodigo.push(subBloque); subBloque = ""; }
                    fragmentosCodigo.push(linea + '\n');
                } else if ((headerStr.length + subBloque.length + linea.length + 300) > limiteEfectivoCodigo) {
                    if (subBloque.trim() !== "") fragmentosCodigo.push(subBloque);
                    subBloque = linea + '\n';
                } else {
                    subBloque += linea + '\n';
                }
            }
            if (subBloque.trim() !== "") fragmentosCodigo.push(subBloque);

            const totalPartes = fragmentosCodigo.length;
            for (let i = 0; i < totalPartes; i++) {
                const parteNum = i + 1;
                const modifiedHeader = headerStr.replace(/ARCHIVO: (.*)/, `ARCHIVO: $1 (Parte ${parteNum}/${totalPartes})`);
                const markerStart = parteNum === 1 ? `// [🔒 ARCHIVO DIVIDIDO - PARTE ${parteNum} DE ${totalPartes}]\n` : `// [🔒 CONTINUACIÓN - PARTE ${parteNum} DE ${totalPartes}]\n`;
                const markerEnd = parteNum < totalPartes ? `\n// [🔒 FIN DE PARTE ${parteNum}. CONTINÚA...]` : `\n// [🔒 FIN DE ARCHIVO DIVIDIDO]`;
                bloquesProcesados.push(modifiedHeader + markerStart + fragmentosCodigo[i] + markerEnd);
            }
        }
    }

    let listaPromptsAGenerar = [];
    let acumulador = "";
    const estimacionOverheadMaximo = longitudInstrucciones + longitudReglas + longitudProtocolo + 500 + MARCA_FIN_PARTE.length; 
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
    if (acumulador !== "") listaPromptsAGenerar.push(acumulador);
    
    promptsFinalesListos = [];
    const totalPartes = listaPromptsAGenerar.length;
    
    listaPromptsAGenerar.forEach((contenido, index) => {
        const num = index + 1;
        const esPrimera = num === 1;
        const esUltima = num === totalPartes;
        let texto = "";

        if (esPrimera && esUltima) texto += `[AVISO DE NUEVO PROYECTO: RESETEA COMPLETA MENTE TU MEMORIA ANTERIOR] Hola. Proyecto "${datosRepoPrincipal.repo}". Parte ÚNICA.\n`;
        else if (esPrimera) {
            texto += `[AVISO DE NUEVO PROYECTO: RESETEA COMPLETA MENTE TU MEMORIA ANTERIOR] Hola. Proyecto "${datosRepoPrincipal.repo}". Parte ${num} de ${totalPartes}.\n\n`;
            texto += PROTOCOLO_INICIO; 
        } else if (esUltima) texto += `Parte FINAL (${num} de ${totalPartes}).\n`;
        else texto += `Contexto Parte ${num} de ${totalPartes}.\n\n`;

        if (instrucciones) {
            if (esPrimera && !esUltima) texto += `OBJETIVO (NO EMPEZAR A PROCESAR NI RESPONDER TODAVÍA): ${instrucciones}\n\n`;
            else if (esUltima) texto += `OBJETIVO: ${instrucciones}\n\n`;
        }

        if (esUltima) texto += REGLAS_EMPAQUETADO_SISTEMA + `\n`;
        texto += `ESTRUCTURA DEL CÓDIGO (PARTE ${num}):\n${contenido}\n`;
        
        if (esUltima) texto += `\nFIN DEL CONTEXTO. Procesa todo el material provisto y ejecuta el OBJETIVO cumpliendo estrictamente con las NORMAS DE SALIDA OBLIGATORIAS.`;
        else {
            texto += `\n=========================================\n🛑 ¡INSTRUCCIÓN CRÍTICA DE CONTROL PARA LA IA! 🛑\nEste mensaje es SOLO la Parte ${num} de un total de ${totalPartes} partes de contexto.\nEstá ABSOLUTAMENTE PROHIBIDO empezar a ejecutar el objetivo, analizar el código o generar respuestas técnicas todavía.\nPara confirmar que has entendido que debes esperar a las partes restantes, responde EXCLUSIVAMENTE con la siguiente línea de texto, sin añadir saludos, disculpas ni comentarios adicionales:\n\n"Entendido. Parte ${num} recibida y almacenada en contexto. Quedo a la espera de la Parte ${num + 1}."`;
        }
        texto += MARCA_FIN_PARTE;
        promptsFinalesListos.push(texto);
    });
        
    ultimoIndiceCopiado = -1;
    renderizarColaCopiado(totalPartes, MAX_CARACTERES_POR_PROMPT);
}
