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

La app actual abre el paquete incluido desde **Aprender → Cursos A1–A2** y puede usar un paquete compatible que se haya instalado en una versión anterior. El gestor de paquetes queda disponible en el código para desarrollo. La URL de `course-v2.1.0` en el catálogo indica el destino previsto. Después de aprobar el contenido, crea la publicación `course-v2.1.0` en GitHub en `togekk39/LingoQuest` y adjunta el paquete, la suma de verificación y el catálogo. Verifica el tamaño y la suma del archivo remoto antes de configurar `url` y `published: true` en `apps/mobile/src/content/course-source.json`. Si vuelves a ejecutar el generador, los metadatos volverán al estado sin publicar.

Usa `COURSE_PACK_VERSION` para cambiar la versión y `COURSE_PACK_REPOSITORY=owner/repository` para cambiar el repositorio de destino. Genera los archivos de publicación, el catálogo y la copia integrada en una sola compilación, verifícalos y confirma los cambios juntos en Git. Las actualizaciones dentro del esquema 2 deben conservar los identificadores actuales de las lecciones. La app rechaza versiones anteriores y contenido distinto con el mismo número de versión. El progreso en formato 1 requiere el flujo explícito de restablecimiento. La importación de un paquete nuevo también verifica el formato de los datos locales.

El archivo de publicación y la suma de 2.0.0 quedan disponibles para versiones anteriores de la app.
