// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Funciones puras de utilidad y manejo de historial (localStorage).

function parsearGitHubUrl(url) {
    const regex = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?$/;
    const match = url.match(regex);
    if (!match) return null;
    return { user: match[1], repo: match[2], branch: match[3] || 'main' };
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
