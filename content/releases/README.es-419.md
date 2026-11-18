# Archivos de publicación de paquetes de curso

[English](README.md)

El curso integrado predeterminado es la versión `2.1.0` y usa el esquema LQP 2. Requiere la versión `2.0.0` de la app o una posterior. La compilación local funciona sin conexión y no carga archivos, envía cambios con Git ni crea publicaciones.

```bash
npm run packs:build
npm run packs:verify
```

- `lingoquest-es419-enus-a1a2-2.1.0.lqp.json` contiene el borrador original completo del curso, las respuestas sin conexión y 13 niveles de desafío.
- El archivo `.sha256` del mismo nombre contiene la suma SHA-256 del archivo completo.
- `catalog.json` registra la versión, el tamaño, la versión mínima de la app y la URL de descarga prevista.

`apps/mobile/src/content/bundled-course.json` es la copia integrada idéntica. El curso integrado sustituye los archivos del esquema 1 centrados en gramática.

El paquete sigue pendiente de publicación remota. La URL de `course-v2.1.0` en el catálogo indica el destino previsto y el campo de descarga aparece vacío. Ya se puede importar un archivo local. Después de aprobar el contenido, crea la publicación `course-v2.1.0` en GitHub en `togekk39/LingoQuest` y adjunta el paquete, la suma de verificación y el catálogo a esa misma publicación. Descarga los archivos inmutables y verifica el tamaño y la suma antes de configurar `url` y `published: true` en `apps/mobile/src/content/course-source.json`. Marca la URL como publicada solo después de verificar que funciona. Si vuelves a ejecutar el generador, los metadatos volverán al estado sin publicar.

Usa `COURSE_PACK_VERSION` para cambiar la versión y `COURSE_PACK_REPOSITORY=owner/repository` para cambiar el repositorio de destino. Genera los archivos de publicación, el catálogo y la copia integrada en una sola compilación, verifícalos y confirma los cambios juntos en Git. Las actualizaciones dentro del esquema 2 deben conservar los identificadores actuales de las lecciones. La app rechaza versiones anteriores y contenido distinto con el mismo número de versión. El progreso en formato 1 requiere el flujo explícito de restablecimiento. La importación de un paquete nuevo también verifica el formato de los datos locales.

El archivo de publicación y la suma de 2.0.0 quedan disponibles para versiones anteriores de la app.
