# Compilación del APK de Android

[English](APK_BUILDS.md)

El flujo **Android APK** en GitHub Actions compila un APK independiente con Java 17, Android SDK y Build Tools 36, NDK 27.1.12297006 y CMake 3.22.1. Usa Node.js 24 y el proyecto nativo generado por Expo. Incluye Hermes y los recursos locales de la interfaz. En el primer inicio, la app descarga el primer capítulo para cargar sus lecciones, ilustraciones, mapa y audio. Es compatible con Android 7 o posterior en `arm64-v8a` y `armeabi-v7a`.

Desde el flujo ejecutado para el commit correspondiente, descarga el artefacto `lingoquest-apk-<número>-<commit>`. Extrae el ZIP e instala el APK. El ZIP incluye la suma SHA-256 y `build-info.json`. GitHub requiere inicio de sesión para descargar artefactos. La retención es de 30 días.

Los APK de desarrollo usan `lingoquest-dev-<commit>.apk`. Expo usa `0.0.0` como valor provisional de la versión nativa. Para una compilación de lanzamiento, indica la versión al iniciar manualmente el flujo Android APK o define `LINGOQUEST_RELEASE_VERSION` en el entorno local. Para una vista previa regular, usa la siguiente versión menor con parche cero, por ejemplo, `2.2.0-preview`. Para una corrección urgente de una versión estable, aumenta el parche, por ejemplo, `2.2.1-preview`. Aumenta la versión mayor solo por indicación explícita. Para un lanzamiento estable, compila con la misma versión sin el sufijo `-preview`.

La vista previa usa el certificado público de prueba de la plantilla Expo. Las actualizaciones de vista previa usan el mismo certificado y un `versionCode` mayor. En Actions el código es `100000 + GITHUB_RUN_NUMBER`. Para una versión de tienda se requiere una firma privada. Exporta un respaldo antes de cambiar de firma.

```sh
npm ci
npm run build:apk
```

En un equipo de compilación con poca memoria se puede reducir el límite de Gradle y usar un proceso de trabajo.

```sh
ANDROID_GRADLE_MAX_HEAP=2560m ANDROID_GRADLE_MAX_WORKERS=1 npm run build:apk
```

Los resultados quedan en `work/apk/` y el proyecto nativo generado, en `apps/mobile/android/`. El script restaura los metadatos originales del paquete y comprueba que el APK contenga el código y las fuentes. GitHub también comprueba la firma. El respaldo automático de Android está deshabilitado y se puede exportar o importar un respaldo dentro de la app.
