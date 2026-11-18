# LingoQuest 2.0

[English](README.md) · [Reglas de desarrollo](AGENTS.md#español-latinoamérica)

**Aprende inglés, descubre el mundo.**

LingoQuest es una app diseñada primero para Android para aprender inglés estadounidense (`en-US`) con una interfaz en español latinoamericano (`es-419`). El viaje, las lecciones, los repasos y los desafíos funcionan sin conexión, sin cuenta y sin servidor.

## Explora y aprende

- **Continuar viaje** retoma la historia guardada. El primer capítulo, **La primera postal**, tiene tres misiones cortas. Saluda a Sam, encuentra la parada y devuelve su mochila mediante diálogos, escucha, orden de palabras y escritura en inglés. El capítulo incluye audio de referencia sin conexión y grabación local opcional. Al completarlo obtienes un sello, una postal y una entrada de diario.
- **Mapa** recorre 20 paradas en siete continentes y termina en la Antártida, vía Ushuaia. Elige un país o territorio de origen en Latinoamérica o el Caribe. Los capítulos previstos llevan la indicación **En preparación** y enlazan las lecciones relacionadas cuando están disponibles.
- **Repaso rápido** ofrece una pregunta y prioriza los repasos pendientes. **Aprender** da acceso a las 32 lecciones de A1 a A2 y **Ver material** abre directamente el vocabulario, la gramática y los diálogos. **Repasar** abre la lista completa.
- **Desafíos** reúne 13 niveles opcionales de gramática, texto incompleto y lectura. Los niveles 1–8 requieren completar las unidades 1–2, los niveles 9–10 las unidades 1–4, los niveles 11–12 las unidades 1–6 y el nivel 13 las unidades 1–8. El desafío lleva sus propios registros y permite practicar sin reloj. Los sellos, los XP, las lecciones completadas y la evidencia de aprendizaje se registran por separado. La ruta A1–B2 es un plan de estudios.

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

Android usa SQLite y la web usa el almacenamiento del navegador. El viaje, las lecciones directas y el repaso rápido guardan borradores y devoluciones en el dispositivo. Exporta o restaura un respaldo de formato 2 en **Perfil**. Puedes exportar los datos del prototipo en formato 1 antes de confirmar un restablecimiento. El curso incluido usa LQP de esquema 2, versión 2.1.0. Instala actualizaciones en **Perfil → Contenido sin conexión**. Las descargas en línea se inician solo cuando la persona usa una URL de archivo en GitHub. [Paquetes del curso](content/releases/README.es-419.md) · [Arquitectura del viaje](docs/TRAVEL_ARCHITECTURE.es-419.md)

El primer capítulo incluye 11 audios de referencia en inglés estadounidense. Las demás lecciones usan síntesis de voz del sistema verificada sin conexión. La práctica oral existente ofrece reconocimiento opcional y avisa que el proveedor seleccionado puede procesar audio en línea. El capítulo de viaje usa grabación y reproducción en el dispositivo. La app no asigna una nota automática de pronunciación. [Voz y privacidad](docs/OFFLINE_EDITION.es-419.md) · [Créditos de recursos](docs/TRAVEL_ASSETS.es-419.md)
