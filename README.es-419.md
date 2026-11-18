# LingoQuest 2.0

[English](README.md) · [Reglas de desarrollo](AGENTS.md#español-latinoamérica)

**Aprende inglés, descubre el mundo.**

LingoQuest es una app diseñada primero para Android para aprender inglés estadounidense (`en-US`) con una interfaz en español latinoamericano (`es-419`). El viaje, las lecciones, los repasos y los desafíos funcionan sin conexión, sin cuenta y sin servidor.

## Explora y aprende

- **Empezar mi viaje** abre **La primera postal**, el primer capítulo del viaje. Saluda a Sam, encuentra la parada y devuelve su mochila con diálogos, escucha, orden de palabras y escritura. Cada misión enseña vocabulario con audio en inglés estadounidense, notas de uso y ejemplos bilingües. Al completar el capítulo recibes un sello, una postal y una entrada de diario.
- **Ya sé algo de inglés** ofrece seis preguntas opcionales sin reloj. Tus respuestas determinan cuál de las tres misiones publicadas se recomienda. Las misiones anteriores siguen disponibles. Puedes repetir la prueba desde **Aprender** o **Perfil**.
- **Mapa** recorre 20 paradas en siete continentes y termina en la Antártida, vía Ushuaia. Elige un lugar de origen en Latinoamérica o el Caribe. Los capítulos previstos aparecen como **En preparación**.
- **Aprender** abre las misiones publicadas y sus materiales de vocabulario y pronunciación. **Repaso rápido** ofrece una pregunta y **Repasar** abre la lista de repasos del capítulo.
- **Desafíos** muestra 13 niveles opcionales. Los primeros tres usan gramática, texto incompleto y lectura del capítulo publicado y se desbloquean con su sello. Los niveles restantes llegarán con nuevos capítulos. Los desafíos guardan sus propios registros y se pueden practicar sin reloj. Los XP, el avance del viaje y la evidencia de aprendizaje se registran por separado. La ruta de A1 a B2 describe objetivos de aprendizaje.

## Desarrollo y compilación

Usa Node.js 24 o posterior y npm. Inicia el desarrollo web con `npm ci` y `npm run dev`, y abre `http://localhost:8081`. Para una vista previa sin conexión, ejecuta `npm run build:web` y `npm run preview`, y abre `http://localhost:3000`. Espera a que el service worker llene la caché antes de desconectarte. El instalador de Android incluye lecciones, fuentes, mapa, ilustraciones y audio del primer capítulo.

```sh
npm run check
npm test
npm run packs:verify
npm run build:web
npm run preview          # Usa otra terminal antes de las pruebas de navegador.
npm run test:e2e
npm run build:android    # Exportación Hermes para Android
npm run build:apk        # APK independiente de vista previa
```

La compilación del APK usa Java 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006 y CMake 3.22.1. Los APK locales y sus sumas quedan en `work/apk/`. [Compilación de APK](docs/APK_BUILDS.es-419.md) · [Verificación y capturas](docs/VERIFICATION.es-419.md) · [Plan de aceptación manual](docs/OFFLINE_TEST_PLAN.es-419.md)

## Datos locales, paquetes del curso y voz

Android usa SQLite y la web usa el almacenamiento del navegador. Las misiones y los repasos rápidos guardan borradores y devoluciones en el dispositivo. Exporta o restaura un respaldo de formato 2 en **Perfil**. Los respaldos conservan el avance del curso anterior. La versión LQP 2.1.0 y sus fuentes siguen disponibles para consulta y desarrollo. La app actual incluye y enseña el capítulo del viaje. [Paquetes archivados](content/releases/README.es-419.md) · [Arquitectura del viaje](docs/TRAVEL_ARCHITECTURE.es-419.md)

El capítulo incluye 18 audios en inglés estadounidense. Puedes grabar tu voz y escucharla en el dispositivo. La opción separada de reconocimiento avisa que el proveedor del sistema puede procesar el audio en línea. La app no asigna una nota automática de pronunciación. [Voz y privacidad](docs/OFFLINE_EDITION.es-419.md) · [Créditos de recursos](docs/TRAVEL_ASSETS.es-419.md)
