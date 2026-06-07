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
    // Soporta: https://github.com/usuario/repo/tree/rama o solo https://github.com/usuario/repo
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
        
        let bloqueCodigoCompleto = "";
        let archivosContados = [];

        // Filtro: Solo nos interesan archivos comunes de código en la raíz (evitamos imágenes pesadas o carpetas ocultas)
        const extensionesPermitidas = ['.js', '.html', '.css', '.json', '.txt', '.md'];

        for (const archivo of archivos) {
            if (archivo.type === 'file') {
                const tieneExtensionValida = extensionesPermitidas.some(ext => archivo.name.endsWith(ext));
                
                // Excluimos configuraciones pesadas de node o similares si las hubiera
                if (tieneExtensionValida && archivo.name !== 'package-lock.json') {
                    archivosContados.push(archivo.name);
                    
                    // Descargar el contenido plano del archivo
                    const resContenido = await fetch(archivo.download_url);
                    const texto = await resContenido.text();
                    
                    // Formatear cada bloque con etiquetas claras para la IA
                    bloqueCodigoCompleto += `\n=========================================\n`;
                    bloqueCodigoCompleto += `ARCHIVO: ${archivo.name}\n`;
                    bloqueCodigoCompleto += `=========================================\n`;
                    bloqueCodigoCompleto += `${texto}\n`;
                }
            }
        }

        if (archivosContados.length === 0) {
            throw new Error("No se encontraron archivos de texto legibles (.js, .html, .css...) en la raíz.");
        }

        // --- CONSTRUCCIÓN DEL PROMPT FINAL ---
        let promptFinal = `Hola. Estoy trabajando en un proyecto alojado en GitHub llamado "${repo}".\n`;
        promptFinal += `A continuación te proporciono el contenido completo de los archivos clave para que tengas el contexto total.\n\n`;
        
        if (instrucciones) {
            promptFinal += `OBJETIVO / CONSULTA PRINCIPAL:\n${instrucciones}\n\n`;
        } else {
            promptFinal += `OBJETIVO: Analiza la estructura del código actual para responder a mis próximas preguntas.\n\n`;
        }

        promptFinal += `ESTRUCTURA DEL CÓDIGO:\n`;
        promptFinal += bloqueCodigoCompleto;
        promptFinal += `\n=========================================\n`;
        promptFinal += `FIN DEL CONTEXTO. Por favor, confirma que has entendido el proyecto completo y estás listo para ayudarme.`;

        // Copiar el resultado al portapapeles automáticamente
        await navigator.clipboard.writeText(promptFinal);

        // Actualizar interfaz visual con lo que se envió
        status.style.color = "#10b981";
        status.innerText = "✨ ¡Súper-Prompt copiado al portapapeles! Ya puedes pegarlo en la IA.";
        
        previewBox.style.display = "block";
        listaArchivos.innerHTML = archivosContados.map(name => `<span class="file-tag">📄 ${name}</span>`).join('');

    } catch (e) {
        status.style.color = "#ef4444";
        status.innerText = `❌ Error: ${e.message}`;
        console.error(e);
    } finally {
        btn.disabled = false;
    }
}
