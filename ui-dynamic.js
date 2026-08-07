// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Manejo de componentes de UI dinámicos (Filtros, Apps Script, Cola de copiado).

function renderizarFiltrosExtensiones() {
    const todasLasRutas = [...arbolArchivosPrincipal, ...arbolArchivosSecundario];
    const extensionesSet = new Set();

    todasLasRutas.forEach(file => {
        const partes = file.path.split('.');
        if (partes.length > 1) {
            extensionesSet.add('.' + partes.pop().toLowerCase());
        } else {
            extensionesSet.add('(sin extensión)');
        }
    });

    const contenedor = document.getElementById('extensionFilters');
    contenedor.innerHTML = '';
    
    Array.from(extensionesSet).sort().forEach(ext => {
        const estaExcluida = EXTENSIONES_EXCLUIDAS_DEFECTO.includes(ext);
        const id = `chk-${ext === '(sin extensión)' ? 'none' : ext.substring(1)}`;
        
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        div.innerHTML = `
            <input type="checkbox" id="${id}" value="${ext}" ${!estaExcluida ? 'checked' : ''} style="cursor:pointer; width:18px; height:18px;">
            <label for="${id}" style="margin:0; font-weight:400; font-size:0.9rem; cursor:pointer; color: ${estaExcluida ? '#94a3b8' : 'var(--text)'}">${ext}</label>
        `;
        contenedor.appendChild(div);
    });

    document.getElementById('filterSection').style.display = 'block';
}

function toggleGoogleSheetSection() {
    const inputUrl = document.getElementById('googleSheetUrl');
    const section = document.getElementById('googleSheetSection');
    if (inputUrl && section) {
        section.style.display = inputUrl.value.trim() !== '' ? 'block' : 'none';
    }
}

function añadirArchivoAppScript() {
    appScriptArchivosExtraCount++;
    const container = document.getElementById('appScriptExtraFiles');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'app-script-file-group';
    div.id = `appScriptExtra-${appScriptArchivosExtraCount}`;
    div.innerHTML = `
        <label style="font-size: 0.85rem;">Nombre del archivo (ej: Index.html, Utils.gs)</label>
        <input type="text" class="app-script-extra-name" placeholder="Nombre del archivo" style="margin-bottom: 5px;">
        <textarea class="app-script-textarea app-script-extra-code" placeholder="Pega aquí el código..."></textarea>
        <button type="button" class="remove-app-script-btn" onclick="eliminarArchivoAppScript('appScriptExtra-${appScriptArchivosExtraCount}')">✖ Quitar</button>
    `;
    container.appendChild(div);
}

function eliminarArchivoAppScript(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function renderizarColaCopiado(totalPartes, MAX_CARACTERES_POR_PROMPT) {
    const queueContainer = document.getElementById('queueContainer');
    const partQueue = document.getElementById('partQueue');
    const btnCopiarTodo = document.getElementById('btnCopiarTodo');
    
    queueContainer.style.display = "block";
    partQueue.innerHTML = "";
    
    if (totalPartes === 1) { 
        copiarParte(0); 
    } else {
        btnCopiarTodo.style.display = "block";
        promptsFinalesListos.forEach((textoParte, index) => {
            const charCount = textoParte.length;
            const minTokens = Math.round(charCount / 4);
            const maxTokens = Math.round(charCount / 3);
            let advertencia = "";
            if (charCount > MAX_CARACTERES_POR_PROMPT) advertencia = `<span style="color:var(--danger); font-weight:700; margin-left:10px;">⚠️ EXCEDE LÍMITE</span>`;

            const div = document.createElement('div');
            div.className = 'queue-item';
            div.id = `queue-item-${index}`;
            div.innerHTML = `<span class="queue-item-info">Parte ${index + 1} de ${totalPartes} <span style="color:#94a3b8; font-size:0.85rem; font-weight:400;">(~${minTokens}/${maxTokens} tokens)</span>${advertencia}</span><button class="copy-part-btn" id="copyBtn-${index}" onclick="copiarParte(${index})">📋 Copiar Parte ${index + 1}</button>`;
            partQueue.appendChild(div);
        });
    }
}

function copiarParte(index) {
    if (index > ultimoIndiceCopiado + 1) {
        const confirmarSalto = confirm(`⚠️ ¡Atención! Estás intentando copiar la Parte ${index + 1} pero la última fue la ${ultimoIndiceCopiado + 1}.\n\n¿Quieres saltar de todas formas?`);
        if (!confirmarSalto) return;
    }
    const texto = promptsFinalesListos[index];
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
        ultimoIndiceCopiado = index;
        const btn = document.getElementById(`copyBtn-${index}`);
        if (btn) { btn.innerText = "✅ ¡Copiado!"; setTimeout(() => btn.innerText = `📋 Copiar Parte ${index + 1}`, 2500); }
    }).catch(err => { console.error('Error al copiar:', err); alert("Error al copiar la parte."); });
}

function copiarTodoElPrompt() {
    const textoCompleto = promptsFinalesListos.join("\n\n");
    navigator.clipboard.writeText(textoCompleto).then(() => {
        const btnAll = document.getElementById('btnCopiarTodo');
        if (btnAll) { btnAll.innerText = "✅ ¡TODO COPIADO!"; setTimeout(() => btnAll.innerText = "📄 COPIAR TODO EN UNO", 3000); }
    }).catch(err => { console.error('Error al copiar:', err); alert("Error al copiar todo."); });
}
