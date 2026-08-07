// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Inicialización de la interfaz y funciones de control general (limpiar, aplicar órdenes).

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
    
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.disabled = false;
        btnAplicarFiltros.innerText = "🔄 Aplicar Filtros y Generar Prompts";
    }

    const gsUrl = document.getElementById('googleSheetUrl');
    if (gsUrl) gsUrl.value = '';
    const gsSection = document.getElementById('googleSheetSection');
    if (gsSection) gsSection.style.display = 'none';
    const gsCode = document.getElementById('appScriptCode');
    if (gsCode) gsCode.value = '';
    const gsExtras = document.getElementById('appScriptExtraFiles');
    if (gsExtras) gsExtras.innerHTML = '';
    appScriptArchivosExtraCount = 0;
    
    const fullTreeContainer = document.getElementById('fullFileTreeContainer');
    if (fullTreeContainer) fullTreeContainer.style.display = 'none';

    ultimoIndiceCopiado = -1;
    arbolArchivosPrincipal = []; arbolArchivosSecundario = [];
    actualizarDesplegableHistorial();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
