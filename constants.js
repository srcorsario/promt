// NUEVO: ARCHIVO EXTRAÍDO DE app.js
// Contiene todas las constantes globales, textos de plantillas y reglas del sistema.

const VER_APP = "3.0.0"; // Actualizado a v3 por cambio de arquitectura (Trees API + Filtros)
const MARCA_FIN_PARTE = "\n\n[✅ FIN DE LA PARTE PROMPT ENVIADA - Este fragmento está completo y no ha sido truncado]";

const EXTENSIONES_EXCLUIDAS_DEFECTO = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tif', '.tiff',
    '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.mp3', '.wav',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.iso', '.dmg'
];

const PLANTILLAS_ORDENES = { 
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
