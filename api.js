// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Funciones aisladas de comunicación con la API de GitHub.

async function obtenerArbolCompleto(datosRepo) {
    const apiUrl = `https://api.github.com/repos/${datosRepo.user}/${datosRepo.repo}/git/trees/${datosRepo.branch}?recursive=1`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`No se pudo acceder al árbol del repositorio: ${datosRepo.repo} (¿Rama correcta?)`);
    const data = await response.json();
    if (!data.tree) throw new Error("La API no devolvió un árbol válido.");
    
    if (data.truncated) {
        throw new Error("El repositorio es demasiado grande. La API de GitHub ha truncado el árbol de archivos y no se pueden obtener todos los archivos de forma confiable.");
    }
    
    return data.tree.filter(item => item.type === 'blob');
}

async function descargarContenidos(listaArchivosFiltrada, datosRepo, esPrincipal) {
    let bloques = [];
    let nombres = [];
    const baseUrl = `https://raw.githubusercontent.com/${datosRepo.user}/${datosRepo.repo}/${datosRepo.branch}/`;
    let erroresDescarga = 0;

    for (const archivo of listaArchivosFiltrada) {
        try {
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
            
            nombres.push(archivo.path);
            
            let bloque = `\n=========================================\n`;
            bloque += `REPOSITORIO: ${datosRepo.repo} (${esPrincipal ? 'PRINCIPAL' : 'REFERENCIA SECUNDARIA'})\n`;
            bloque += `ARCHIVO: ${archivo.path}\n`;
            bloque += `=========================================\n`;
            bloque += `${texto}\n`;
            bloques.push(bloque);
        } catch (errArchivo) {
            console.warn(`Error descargando ${archivo.path}:`, errArchivo);
            erroresDescarga++;
        }
    }

    if (erroresDescarga > 0 && erroresDescarga === listaArchivosFiltrada.length) {
        console.error("CRÍTICO: Ningún archivo pudo ser descargado. ¿El repositorio es privado o la rama no existe?");
    } else if (erroresDescarga > listaArchivosFiltrada.length * 0.5) {
        console.warn(`AVISO: Más del 50% de los archivos (${erroresDescarga}/${listaArchivosFiltrada.length}) fallaron al descargar.`);
    }

    return { bloques, nombres };
}
