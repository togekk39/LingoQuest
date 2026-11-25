# Paquetes de capítulos

[English](CHAPTER_PACKS.md)

En el primer inicio, la app descarga **La primera postal** y muestra el avance. Después del primer capítulo, **Continuar a Ciudad de México** descarga y verifica el capítulo 2. Los dos paquetes quedan disponibles sin conexión. Desde **Inicio** puedes volver a la primera aventura y abrir **Repaso rápido**. En **Aprender** siguen disponibles las lecciones del primer capítulo. Si falla la descarga del capítulo 2, **Reintentar** vuelve a intentarlo con el primer paquete todavía disponible.

Elige un destino en **Mapa** y selecciona **Abrir capítulo** para usar el paquete guardado o descargarlo automáticamente. Los paquetes contienen lecciones, ilustraciones y audio en inglés. Los primeros ocho incluyen sus respectivas unidades A1–A2. Los paquetes se guardan en IndexedDB en la web y en SQLite en Android. La interfaz inicial de la versión web también incluye la primera aventura y el curso original. El progreso y los respaldos conservan su almacenamiento local y sus identificadores.

En la revisión 8 de México, elige **Explorar aventura de este capítulo** para abrir las cinco misiones de la historia. El mismo paquete instalado contiene la guía, las lecciones del curso U02 y las actividades de práctica posterior.

## Redactar y publicar una actualización de contenido

1. Edita el destino en `content/source/chapter-lessons-west.ts` o `content/source/chapter-lessons-east.ts`. Un destino puede definir una lección o un arreglo de lecciones. La app usa el orden del arreglo para la navegación y reproduce el audio del paquete para cada intervención del diálogo, palabra y respuesta modelo en inglés. Las portadas de los destinos están en `content/media/chapters/`. El primer capítulo usa los archivos originales de ilustración como fuente del paquete.
2. Instala FFmpeg con Flite y libmp3lame habilitados. Genera el paquete modificado con un número de revisión entero más alto. Por ejemplo, este comando genera la revisión 7 de Toronto y actualiza su entrada en el catálogo.

   ```sh
   CHAPTER_PACK_REVISION=7 npm run packs:chapters -- --chapter=toronto
   npm run packs:chapters -- --verify
   ```

3. Publica juntos el archivo de la revisión nueva y `catalog-v3.json` desde `apps/mobile/public/chapter-packs/`. Conserva sin cambios las rutas de revisión como `7/toronto.json`. Sirve los catálogos con revalidación de caché. La versión web lee esa carpeta desde su propio origen. Android usa GitHub Raw y consulta `main` para las compilaciones de lanzamiento iniciadas en `main`. Los APK de desarrollo en CI consultan el repositorio y el commit exactos que usa el flujo, incluidas las compilaciones de una bifurcación o de una rama elegida manualmente. Mantén disponibles `catalog.json` y sus revisiones para Android 2.1.0, y `catalog-v2.json` y sus revisiones para las compilaciones de las fases 5B y 5C. El catálogo v2 sirve la revisión 7 de México a esas compilaciones. El catálogo v3 sirve la revisión 8 de México a las compilaciones que abren la aventura del capítulo 2. Al iniciar, la app compara su catálogo con todos los paquetes instalados y descarga en segundo plano las revisiones más recientes. Las actualizaciones verificadas se usan en un inicio posterior. El contenido instalado y el progreso siguen disponibles sin conexión o si falla la descarga.

El catálogo guarda la revisión, el tamaño en bytes y el SHA-256 de cada destino. Cada archivo también tiene su propia versión de esquema y suma de comprobación del contenido. Conserva `schemaVersion` en `1` para cambios compatibles, como nuevas lecciones, ilustraciones de reemplazo y audio adicional. Se necesitan cambios en la app para usar un nuevo esquema de paquete o agregar destinos al mapa.
