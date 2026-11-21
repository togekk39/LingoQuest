# Paquetes de capítulos

[English](CHAPTER_PACKS.md)

Elige un destino en **Mapa** y selecciona **Descargar capítulo**. El paquete contiene lecciones situacionales, ilustraciones y audios MP3 en inglés. Las paradas 1 a 8 también incluyen la unidad correspondiente del curso A1–A2. La primera parada incluye los recursos de la aventura original. **Abrir capítulo descargado** usa el paquete guardado, incluso después de reiniciar sin conexión. **Importar archivo del capítulo** instala un archivo JSON compatible desde el dispositivo.

**Buscar actualización** consulta el catálogo más reciente para el capítulo seleccionado. La app valida cada descarga e importación antes de reemplazar el paquete. La revisión anterior sigue disponible si falla la descarga o la instalación. Los paquetes se guardan en IndexedDB en la web y en SQLite en Android. La interfaz, la primera aventura y el curso original están disponibles desde la instalación inicial. El progreso y los respaldos conservan su almacenamiento local y sus identificadores.

## Redactar y publicar una actualización de contenido

1. Edita el destino en `content/source/chapter-lessons-west.ts` o `content/source/chapter-lessons-east.ts`. Un destino puede definir una lección o un arreglo de lecciones. La app usa el orden del arreglo para la navegación y reproduce el audio del paquete para cada intervención del diálogo, palabra y respuesta modelo en inglés. Las portadas de los destinos están en `content/media/chapters/`. El primer capítulo usa las ilustraciones que ya vienen con la app.
2. Instala FFmpeg con Flite y libmp3lame habilitados. Genera el paquete modificado con un número de revisión entero más alto. Por ejemplo, este comando genera la revisión 2 de Toronto y actualiza su entrada en el catálogo.

   ```sh
   CHAPTER_PACK_REVISION=2 npm run packs:chapters -- --chapter=toronto
   npm run packs:chapters -- --verify
   ```

3. Publica el archivo de la revisión nueva y luego el catálogo desde `apps/mobile/public/chapter-packs/`. Conserva sin cambios las rutas como `2/toronto.json`. Sirve `catalog.json` con revalidación de caché. La app web solicita `/chapter-packs/` desde su propio origen. Android lee la misma carpeta de la rama `main` del repositorio de LingoQuest mediante GitHub Raw. Publicar esta carpeta actualiza las lecciones descargables sin una nueva compilación web ni un nuevo APK. También puedes distribuir los archivos JSON numerados para su importación sin conexión.

El catálogo guarda la revisión, el tamaño en bytes y el SHA-256 de cada destino. Cada archivo tiene su propia versión de esquema y suma de comprobación del contenido para importarlo sin conexión. Conserva `schemaVersion` en `1` para cambios compatibles, como nuevas lecciones, ilustraciones de reemplazo y audio adicional. Se necesitan cambios en la app para usar un nuevo esquema de paquete o agregar destinos al mapa.
