# Development rules

- Write developer-facing documentation, README files, and any necessary source comments in English and Latin American Spanish (`es-419`). Keep both versions in sync when changing instructions, examples, or requirements.
- Use the existing English Markdown filename and a sibling file with the `.es-419.md` suffix for the Spanish translation. Link the two versions. Short rules and source comments may put English first and Latin American Spanish immediately after it.
- Keep Chinese text out of repository files, including comments, examples, and fixtures. Use English identifiers. Preserve existing API contracts, command names, locale tags, and user interface labels where developers need to match them exactly.
- Before submitting changes, check touched files for untranslated text and update both language versions in the same change. To scan the repository, run `rg -n --hidden -g '!.git' '\p{Han}'`. Keep learner-facing content in the language required by the course, with Latin American Spanish for the interface and American English as the target language.

## Español (Latinoamérica)

- Escribe la documentación para desarrolladores, los archivos README y los comentarios necesarios del código en inglés y español latinoamericano (`es-419`). Mantén ambas versiones sincronizadas cuando cambien las instrucciones, los ejemplos o los requisitos.
- Conserva el nombre del archivo Markdown en inglés y usa un archivo en la misma carpeta con el sufijo `.es-419.md` para la traducción al español. Enlaza las dos versiones. En las reglas breves y los comentarios se puede escribir primero el inglés y enseguida el español latinoamericano.
- Evita el texto en chino en los archivos del repositorio, incluidos los comentarios, ejemplos y datos de prueba. Usa identificadores en inglés. Conserva los contratos de API, nombres de comandos, etiquetas de idioma y textos de la interfaz cuando el equipo necesite identificarlos tal como aparecen.
- Antes de entregar cambios, revisa los archivos modificados para detectar texto pendiente de traducir y actualiza ambas versiones en el mismo cambio. Para revisar el repositorio, ejecuta `rg -n --hidden -g '!.git' '\p{Han}'`. Mantén los materiales para estudiantes en el idioma que requiere el curso. La interfaz usa español latinoamericano y el idioma meta es el inglés estadounidense.

## App releases / Versiones de la app

- Use development builds identified by their commit. Set `LINGOQUEST_RELEASE_VERSION` only when the release version has been explicitly approved. Course-pack versions and Android build codes have their own versioning.
- Usa compilaciones de desarrollo identificadas por su commit. Define `LINGOQUEST_RELEASE_VERSION` solo cuando se haya aprobado explícitamente la versión de lanzamiento. Los paquetes del curso y los códigos de compilación de Android tienen su propia numeración.
- Base the next regular release preview on the latest published stable app version. Increment the minor number, reset the patch number to zero, and append `-preview`. After `2.1.0`, use `2.2.0-preview`. Once `2.2.0` is published, use `2.3.0-preview`. Keep the same version across builds of the same preview. Drop the suffix for the stable release.
- Increment the major number only on explicit instruction and reset minor and patch to zero (for example, `3.0.0-preview`). For an urgent fix, increment the patch number of the affected stable release (for example, `2.2.1-preview` after `2.2.0`).
- Basa la siguiente vista previa regular en la última versión estable publicada de la app. Aumenta el número menor, reinicia a cero el número de parche y agrega `-preview`. Después de `2.1.0`, usa `2.2.0-preview`. Una vez publicada `2.2.0`, usa `2.3.0-preview`. Mantén la misma versión entre compilaciones de una misma vista previa. Quita el sufijo para el lanzamiento estable.
- Aumenta el número mayor solo por indicación explícita y reinicia a cero los números menor y de parche (por ejemplo, `3.0.0-preview`). Para una corrección urgente, aumenta el número de parche de la versión estable afectada (por ejemplo, `2.2.1-preview` después de `2.2.0`).
