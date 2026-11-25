# Paquetes de capítulos

[English](CHAPTER_PACKS.md)

En el primer inicio, la app descarga **La primera postal** y muestra el avance. Después del primer capítulo, **Continuar a Ciudad de México** descarga y verifica el capítulo 2. Los dos paquetes quedan disponibles sin conexión. Desde **Inicio** puedes volver a la primera aventura y abrir **Repaso rápido**. En **Aprender** siguen disponibles las lecciones del primer capítulo. Si falla la descarga del capítulo 2, **Reintentar** vuelve a intentarlo con el primer paquete todavía disponible.

Elige un destino en **Mapa** y selecciona **Abrir capítulo** para usar el paquete guardado o descargarlo automáticamente. Los paquetes contienen lecciones, ilustraciones y audio en inglés. Los primeros ocho incluyen sus respectivas unidades A1–A2. Los paquetes se guardan en IndexedDB en la web y en SQLite en Android. La interfaz inicial de la versión web también incluye la primera aventura y el curso original. El progreso y los respaldos conservan su almacenamiento local y sus identificadores.

En la revisión 10 de México, elige **Explorar aventura de este capítulo** para abrir las cinco misiones de la historia. El mismo paquete instalado contiene la guía, las lecciones del curso U02 y las actividades de práctica posterior.

La revisión 11 de Mi lugar de origen incluye actividades breves de bases a la aventura y **Aprender**. Las dos plataformas cargan del paquete instalado la misma enseñanza revisada, las mismas actividades y las mismas grabaciones.

La revisión 12 de Cartagena agrega cinco misiones RPG, actividades de aprendizaje compartidas, desafíos opcionales y los recursos del mercado y restaurante. El paquete instalado aporta audio en inglés y escenas en las dos plataformas. El repaso de texto archivado que cumpla los requisitos sigue disponible después de quitar los recursos del capítulo. [Validación de Cartagena](PHASE_5D_CARTAGENA_VALIDATION.es-419.md)

## Redactar y publicar una actualización de contenido

1. Edita el destino en `content/source/chapter-lessons-west.ts` o `content/source/chapter-lessons-east.ts`. Un destino puede definir una lección o un arreglo de lecciones. La app usa el orden del arreglo para la navegación y reproduce el audio del paquete para cada intervención del diálogo, palabra y respuesta modelo en inglés. Las portadas de los destinos están en `content/media/chapters/`. El primer capítulo usa los archivos originales de ilustración como fuente del paquete.
2. Instala FFmpeg con Flite y libmp3lame habilitados. Genera el paquete modificado con un número de revisión entero más alto. Por ejemplo, este comando genera la revisión 12 de Cartagena y actualiza su entrada en el catálogo.

   ```sh
   CHAPTER_PACK_REVISION=12 npm run packs:chapters -- --chapter=colombia
   npm run packs:chapters -- --verify
   ```

3. Publica juntos el archivo de la revisión nueva y `catalog-v9.json` desde `apps/mobile/public/chapter-packs/`. Conserva sin cambios las rutas de revisión como `7/toronto.json`. Sirve los catálogos con revalidación de caché. La versión web lee esa carpeta desde su propio origen. Android usa GitHub Raw y consulta `main` para las compilaciones de lanzamiento iniciadas en `main`. Los APK de desarrollo en CI consultan el repositorio y el commit exactos que usa el flujo, incluidas las compilaciones de una bifurcación o de una rama elegida manualmente. Mantén disponibles `catalog.json` y sus revisiones para Android 2.1.0, y `catalog-v2.json` y sus revisiones para las compilaciones de las fases 5B y 5C. El catálogo v2 sirve la revisión 7 de México a esas compilaciones. Mantén disponible `catalog-v3.json` para las compilaciones que usan la revisión 8 de México. Mantén disponible `catalog-v4.json` para las compilaciones con la revisión 7 de Mi lugar de origen y la revisión 9 de México. Conserva v5 para la revisión 10 de ambos paquetes. El catálogo v6 sirve Casa 11 y México 10 a las compilaciones que admiten los registros nuevos de enseñanza y evaluación de Mi lugar de origen. Conserva v6 y su archivo de Cartagena en la revisión 7 para las compilaciones compatibles. El catálogo v7 sirve Colombia 12, Mi lugar de origen 11 y México 10. El catálogo v8 sirve Cartagena 13 a las compilaciones que admiten el estado de las conversaciones. Conserva el catálogo v7 y el paquete 12 para las compilaciones anteriores. Al iniciar, la app compara su catálogo con todos los paquetes instalados y descarga en segundo plano las revisiones más recientes. Las actualizaciones verificadas se usan en un inicio posterior. El contenido instalado y el progreso siguen disponibles sin conexión o si falla la descarga.

El catálogo guarda la revisión, el tamaño en bytes y el SHA-256 de cada destino. Cada archivo también tiene su propia versión de esquema y suma de comprobación del contenido. Conserva `schemaVersion` en `1` para cambios compatibles, como nuevas lecciones, ilustraciones de reemplazo y audio adicional. Se necesitan cambios en la app para usar un nuevo esquema de paquete o agregar destinos al mapa.

El catálogo v9 sirve Perú 14 a los clientes que entienden la cronología de eventos. El catálogo v8 mantiene disponible la ficha anterior de Perú y Cartagena 13. [Validación de Cusco](PHASE_5D_CUSCO_VALIDATION.es-419.md)
