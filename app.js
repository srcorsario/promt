// =========================================
// REPOSITORIO: promt (PRINCIPAL)
// ARCHIVO: app.js
// =========================================
// [🔒 ARCHIVO DIVIDIDO - TOTALIDAD COMPLETA SIN CORTES]
const VER_APP = "3.0.0"; // Actualizado a v3 por cambio de arquitectura (Trees API + Filtros)

let promptsFinalesListos = [];
let ultimoIndiceCopiado = -1;
const MARCA_FIN_PARTE = "\n\n[✅ FIN DE LA PARTE PROMPT ENVIADA - Este fragmento está completo y no ha sido truncado]";

// NUEVO: Lista de extensiones que por defecto no se marcarán
const EXTENSIONES_EXCLUIDAS_DEFECTO = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tif', '.tiff',
    '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.mp3', '.wav',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.iso', '.dmg'
];

// NUEVO: Variables globales para guardar el árbol mientras el usuario elige filtros
let arbolArchivosPrincipal = [];
let arbolArchivosSecundario = [];
let configReposGlobal = {};

const PLANTILLAS_ORDENES = { /* ... Sin cambios ... */
    analizar: "Analiza detalladamente la arquitectura de este proyecto. Explica cómo se comunican los componentes, los flujos de datos principales y enumera las dependencias críticas detectadas.",
    bugs: "Revisa exhaustivamente todo el código provisto en busca de errores de lógica, fallas de seguridad potenciales, fugas de memoria o malas prácticas. Muestra los puntos críticos y propón sus correcciones exactas.",
    refactor: "Actúa como un ingeniero de software experto en refactorización. Revisa los archivos e identifica bloques redundantes o ineficientes. Proporciona una version optimizada del código que mejore el rendimiento y la legibilidad.",
    documentar: "Generar la documentación técnica correspondiente para las funciones y módulos clave de este repositorio. Añade comentarios claros y estructuras de tipo JSDoc/comentarios descriptivos donde falten.",
    test: "Examina los flujos lógicos y genera una estrategia integral de pruebas unitarias. Detalla qué casos de prueba y escenarios límite (edge cases) se deben validar de forma prioritaria en base a los archivos adjuntos.",
    fusionar: "Actúa como un arquitecto de software experto en integración de sistemas. Tu objetivo es auditar el Repositorio Principal y el Repositorio de Referencia Secundaria. 1) Identifica funciones, utilidades, componentes o patrones de diseño presentes en el repositorio SECUNDARIO que puedan mejorar, optimizar o añadir funcionalidades faltantes al repositorio PRINCIPAL. 2) Para cada mejora identificada, proporciona el código exacto listo para implementar en el PRINCIPAL, adaptando la lógica para que sea 100% compatible con su arquitectura actual, sin romper flujos existentes y manejando el DOM de forma defensiva. 3) Si no encuentras nada útil que adoptar, indícalo expresamente."
};

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
`8. SALIDA DIRECTA Y COMPACTA: Entrega los resultados structured en bloques de código Markdown limpios. Evita textos introductorios densos, rodeos teóricos o saludos; prioriza la legibilidad y la velocidad de copiado.\n` +
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

const PROTOCOLO_INICIO = 
`=========================================\n` +
`PROTOCOLO DE TRANSMISIÓN DE CONTEXTO\n` +
`=========================================\n` +
`Estás a punto de recibir el código fuente de un proyecto de software dividido en múltiples partes.\n` +
`- Tu ÚNICA función en las partes intermedias es almacenar el contexto en tu memoria temporal de forma estrictamente silenciosa.\n` +
`- Está ABSOLUTAMENTE PROHIBIDO responder con análisis parciales, comentarios sobre código ausente o suposiciones preventivas del tipo "esta parte del archivo no la tengo, supondremos que...". No generes respuestas descriptivas técnicas hasta la orden final.\n` +
`- En la parte FINAL recibirás la orden de ejecución junto con las NORMAS DE SALIDA OBLIGATORIAS.\n` +
`- VALIDACIÓN DE INTEGRIDAD: Cada parte que recibas terminará EXACTAMENTE con la marca "[✅ FIN DE LA PARTE PROMPT ENVIADA - Este fragmento está completo y no ha sido truncado]". Si al recibir una nueva parte, la parte anterior NO terminó con esta marca, significa que hubo un truncamiento por límite de caracteres. En ese caso, DEBES avisar al usuario inmediatamente indicando qué parte se truncó y DETENER el procesamiento del prompt hasta que el usuario envíe la parte faltante o corregida.\n\n`;

document.addEventListener('DOMContentLoaded', () => {
    const versionBadgeApp = document.getElementById('versionApp');
    if (versionBadgeApp) versionBadgeApp.innerText = `App: v${VER_APP}`;
    
    actualizarDesplegableHistorial();
    const urlGuardada = localStorage.getItem('last_github_repo');
    if (urlGuardada) document.getElementById('repoUrl').value = urlGuardada;
    
    const urlSecundariaGuardada = localStorage.getItem('last_github_repo_secondary');
    if (urlSecundariaGuardada) document.getElementById('repoUrlSecundario').value = urlSecundariaGuardada;
    
    const limitGuardado = localStorage.getItem('last_limit_select');
    if (limitGuardado) document.getElementById('limitSelect').value = limitGuardado;
});

function aplicarOrdenPrefijada(clavePlantilla) {
    const textoInyectar = PLANTILLAS_ORDENES[clavePlantilla];
    if (textoInyectar) document.getElementById('instrucciones').value = textoInyectar;
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
    if (historial.length === 0) { select.style.display = 'none'; return; }
    
    select.innerHTML = '<option value="" disabled selected>📂 Historial de repositorios usados...</option>';
    historial.forEach(url => {
        const option = document.createElement('option');
        option.value = url;
        option.innerText = url.replace('https://github.com/', '');
        select.appendChild(option);
    });
    select.style.display = 'block';
    select.onchange = (e) => { if (e.target.value) document.getElementById('repoUrl').value = e.target.value; };
}

function limpiarInterfaz() {
    document.getElementById('repoUrl').value = '';
    document.getElementById('repoUrlSecundario').value = '';
    document.getElementById('instrucciones').value = '';
    document.getElementById('ordenesPredeterminadas').value = '';
    document.getElementById('previewBox').style.display = "none";
    document.getElementById('filterSection').style.display = "none";
    document.getElementById('queueContainer').style.display = "none";
    
    const status = document.getElementById('statusCarga');
    status.style.display = "none"; status.innerText = "";
    
    const btnGenerar = document.getElementById('btnGenerar');
    btnGenerar.disabled = false; btnGenerar.innerText = "⚡ GENERAR PROMPTS"; btnGenerar.style.display = "block";
    document.getElementById('btnReset').style.display = "none";
    
    // NUEVO: Restaurar estado del botón de filtros al limpiar
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.disabled = false;
        btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts";
    }

    ultimoIndiceCopiado = -1;
    arbolArchivosPrincipal = []; arbolArchivosSecundario = [];
    actualizarDesplegableHistorial();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parsearGitHubUrl(url) {
    const regex = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?$/;
    const match = url.match(regex);
    if (!match) return null;
    return { user: match[1], repo: match[2], branch: match[3] || 'main' };
}

// NUEVO: Usa la API de Trees para obtener TODOS los archivos recursivamente
async function obtenerArbolCompleto(datosRepo) {
    const apiUrl = `https://api.github.com/repos/${datosRepo.user}/${datosRepo.repo}/git/trees/${datosRepo.branch}?recursive=1`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`No se pudo acceder al árbol del repositorio: ${datosRepo.repo} (¿Rama correcta?)`);
    const data = await response.json();
    if (!data.tree) throw new Error("La API no devolvió un árbol válido.");
    
    // NUEVO: Validar si GitHub truncó el árbol por exceder el límite de la API (100k archivos)
    if (data.truncated) {
        throw new Error("El repositorio es demasiado grande. La API de GitHub ha truncado el árbol de archivos y no se pueden obtener todos los archivos de forma confiable.");
    }
    
    // Filtrar solo archivos (type 'blob'), ignorar carpetas
    return data.tree.filter(item => item.type === 'blob');
}

// NUEVO: Genera los checkboxes dinámicamente
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

// MODIFICADO: Ahora esta función solo lee las URLs y prepara la primera fase
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

    // Guardar en localStorage
    localStorage.setItem('last_github_repo', urlInput);
    localStorage.setItem('last_limit_select', document.getElementById('limitSelect').value);
    guardarEnHistorial(urlInput);
    if (urlSecundariaInput) { localStorage.setItem('last_github_repo_secondary', urlSecundariaInput); guardarEnHistorial(urlSecundariaInput); }
    else { localStorage.removeItem('last_github_repo_secondary'); }

    // Guardar configs globales para la siguiente fase
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

        // Mostrar vista previa y filtros
        const listaArchivos = document.getElementById('listaArchivos');
        listaArchivos.innerHTML = `<div class="repo-section-title">📂 Principal (${datosRepoPrincipal.repo}): <span style="color:#94a3b8; font-weight:400;">${arbolArchivosPrincipal.length} archivos encontrados</span></div>`;
        
        if (arbolArchivosSecundario.length > 0) {
            listaArchivos.innerHTML += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario (${datosRepoSecundario.repo}): <span style="color:#94a3b8; font-weight:400;">${arbolArchivosSecundario.length} archivos encontrados</span></div>`;
        }

        status.innerText = "✅ Estructura leída. Selecciona los tipos de archivo y haz clic en 'Aplicar Filtros'.";
        status.style.color = "#10b981";
        
        previewBox.style.display = "block";
        renderizarFiltrosExtensiones();
        
        btn.innerText = "⏳ ESPERANDO FILTROS...";
        btn.disabled = true; // Se habilitará al aplicar filtros o limpiar

    } catch (error) {
        console.error(error);
        status.style.color = "#ef4444"; status.innerText = `❌ Error: ${error.message}`;
        btn.disabled = false; btn.innerText = "⚡ REINTENTAR";
    }
}

// NUEVO: Se ejecuta al hacer clic en "Aplicar Filtros y Generar Prompts"
async function aplicarFiltrosYGenerar() {
    const status = document.getElementById('statusCarga');
    const btnGenerar = document.getElementById('btnGenerar');
    const btnReset = document.getElementById('btnReset');
    const limitSelectEl = document.getElementById('limitSelect');
    const MAX_CARACTERES_POR_PROMPT = limitSelectEl ? parseInt(limitSelectEl.value) : 50000;
    const instrucciones = document.getElementById('instrucciones')?.value.trim();

    // NUEVO: Prevenir doble clic deshabilitando el botón de filtros
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.disabled = true;
        btnAplicarFiltros.innerText = "⏳ PROCESANDO Y DESCARGANDO...";
    }

    // 1. Leer qué extensiones están marcadas
    const checkboxes = document.querySelectorAll('#extensionFilters input[type="checkbox"]:checked');
    const extensionesPermitidas = Array.from(checkboxes).map(cb => cb.value);
    
    if (extensionesPermitidas.length === 0) {
        alert("Debes seleccionar al menos un tipo de archivo para continuar.");
        // NUEVO: Restaurar botón si se cancela
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
        return;
    }

    // 2. Filtrar los árboles
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
        // NUEVO: Restaurar botón si no hay archivos
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
        return;
    }

    status.style.color = "#38bdf8";
    status.innerText = `⏳ Descargando contenido de ${archivosPrincipalesFiltrados.length + archivosSecundariosFiltrados.length} archivos...`;

    try {
        // 3. Descargar contenidos
        let todosLosBloquesArchivos = [];
        let htmlPreviewArchivos = "";

        const resPrincipal = await descargarContenidos(archivosPrincipalesFiltrados, configReposGlobal.datosRepoPrincipal, true);
        todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resPrincipal.bloques);
        htmlPreviewArchivos += `<div class="repo-section-title">📂 Principal (Incluidos):</div>`;
        htmlPreviewArchivos += resPrincipal.nombres.map(name => `<span class="file-tag">📄 ${name}</span>`).join('');

        if (archivosSecundariosFiltrados.length > 0) {
            const resSecundario = await descargarContenidos(archivosSecundariosFiltrados, configReposGlobal.datosRepoSecundario, false);
            todosLosBloquesArchivos = todosLosBloquesArchivos.concat(resSecundario.bloques);
            htmlPreviewArchivos += `<div class="repo-section-title" style="margin-top:15px;">📂 Secundario (Incluidos):</div>`;
            htmlPreviewArchivos += resSecundario.nombres.map(name => `<span class="file-tag" style="border-left: 3px solid var(--accent);">📄 ${name}</span>`).join('');
        }

        document.getElementById('listaArchivos').innerHTML = htmlPreviewArchivos;

        // 4. Ejecutar la lógica original de troceado (con pequeñas mejoras de ruta)
        status.innerText = "⏳ Armando secuencia de prompts y verificando integridad de archivos...";
        await armarPromptsFinales(todosLosBloquesArchivos, configReposGlobal.datosRepoPrincipal, instrucciones, MAX_CARACTERES_POR_PROMPT);

        // 5. Actualizar UI Final
        status.style.color = "#10b981";
        status.innerText = `✅ ¡Prompts generados! (Total: ${promptsFinalesListos.length} partes)`;
        
        btnGenerar.style.display = "none";
        btnReset.style.display = "block";
        
        // NUEVO: Confirmar estado en el botón de filtros
        if (btnAplicarFiltros) {
            btnAplicarFiltros.innerText = "✅ FILTROS APLICADOS";
            btnAplicarFiltros.disabled = true;
        }

    } catch (error) {
        console.error(error);
        status.style.color = "#ef4444"; status.innerText = `❌ Error al descargar: ${error.message}`;
        // NUEVO: Restaurar botón si hay error
        if (btnAplicarFiltros) { btnAplicarFiltros.disabled = false; btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts"; }
    }
}

// NUEVO: Función aislada para descargar archivos basándose en su ruta completa
async function descargarContenidos(listaArchivosFiltrada, datosRepo, esPrincipal) {
    let bloques = [];
    let nombres = [];
    const baseUrl = `https://raw.githubusercontent.com/${datosRepo.user}/${datosRepo.repo}/${datosRepo.branch}/`;
    // NUEVO: Contador para feedback de errores de descarga
    let erroresDescarga = 0;

    for (const archivo of listaArchivosFiltrada) {
        try {
            // Ignorar archivos muy pesados (>500kb) para no romper el navegador
            if (archivo.size > 500000) {
                console.warn(`Ignorado por tamaño (>500kb): ${archivo.path}`);
                erroresDescarga++;
                continue;
            }
            const resContenido = await fetch(baseUrl + archivo.path);
            if (!resContenido.ok) { 
                erroresDescarga++;
                continue; 
            }
            const texto = await resContenido.text();
            
            nombres.push(archivo.path); // CAMBIADO: Ahora muestra la ruta completa (ej: src/app.js)
            
            let bloque = `\n=========================================\n`;
            bloque += `REPOSITORIO: ${datosRepo.repo} (${esPrincipal ? 'PRINCIPAL' : 'REFERENCIA SECUNDARIA'})\n`;
            bloque += `ARCHIVO: ${archivo.path}\n`; // CAMBIADO: Ruta completa
            bloque += `=========================================\n`;
            bloque += `${texto}\n`;
            bloques.push(bloque);
        } catch (errArchivo) {
            console.warn(`Error descargando ${archivo.path}:`, errArchivo);
            erroresDescarga++;
        }
    }

    // NUEVO: Alertar si la tasa de fallo es muy alta
    if (erroresDescarga > 0 && erroresDescarga === listaArchivosFiltrada.length) {
        console.error("CRÍTICO: Ningún archivo pudo ser descargado. ¿El repositorio es privado o la rama no existe?");
    } else if (erroresDescarga > listaArchivosFiltrada.length * 0.5) {
        console.warn(`AVISO: Más del 50% de los archivos (${erroresDescarga}/${listaArchivosFiltrada.length}) fallaron al descargar.`);
    }

    return { bloques, nombres };
}

// NUEVO: Lógica de particionado extraída para limpiar el flujo principal
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
            // Lógica original para archivos enormes que hay que cortar
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

    // Agrupar en paquetes finales
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

// NUEVO: Función para pintar la cola final (para no repetir código)
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
// [🔒 FIN DE ARCHIVO DIVIDIDO - TOTALIDAD COMPLETA EN UN SÓLO BLOQUE DE SALIDA]
