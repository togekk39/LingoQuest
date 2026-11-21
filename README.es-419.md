# LingoQuest 2.1 · Primero el aprendizaje

[English](README.md) · [Reglas de desarrollo](AGENTS.md#español-latinoamérica)

**Aprende inglés, descubre el mundo.**

LingoQuest es una app diseñada primero para Android para aprender inglés estadounidense (`en-US`) con una interfaz en español latinoamericano (`es-419`). El viaje, las lecciones, los repasos y los desafíos funcionan sin conexión, sin cuenta y sin servidor.

## Explora y aprende

- **Comenzar mi aventura** abre **La primera postal**. Conoce a Sam y a Luz en la plaza, usa un boleto para encontrar la parada y elige una pista para recuperar la mochila de Sam. Cada misión incluye su lección de inglés completa. La aventura otorga un sello, una postal y una entrada de diario. [Recorrido del capítulo](docs/PHASE_4_RPG.es-419.md)
- **Ya sé algo de inglés** ofrece seis preguntas opcionales sin reloj. Tus respuestas determinan cuál de las tres misiones publicadas se recomienda. Las misiones anteriores siguen disponibles. Puedes repetir la prueba desde **Aprender** o **Perfil**.
- **Mapa** recorre 20 paradas en siete continentes y termina en la Antártida, vía Ushuaia. Elige un lugar de origen en Latinoamérica o el Caribe. Elige cualquier destino y selecciona **Descargar capítulo** para guardar lecciones, ilustraciones y audio en inglés sin conexión.
- En **Aprender**, elige **Lecciones** para iniciar o retomar directamente una lección del capítulo. **Aprender** también incluye la guía de vocabulario, el manual de gramática, la práctica de pronunciación y **Cursos A1–A2**, con ocho unidades y 32 lecciones del curso LQP 2.1.0 incluido. Abre cualquier lección del curso o retoma el borrador más reciente.
- **Repaso rápido** ofrece un ejercicio. **Repasar** muestra prácticas pendientes y **Mis habilidades** muestra la evidencia del capítulo y lo que puedes reforzar. Los intervalos de repaso toman en cuenta la ayuda, los errores, la recuperación autónoma, el tiempo transcurrido y la aplicación en una situación nueva.
- **Desafíos** ofrece los 13 niveles del curso A1–A2 y las pruebas opcionales del viaje. Los niveles 1 a 3 del viaje se abren con el sello del capítulo. Los niveles del curso se abren al completar sus lecciones. Puedes practicar sin reloj. Las etapas, los resultados de los desafíos y los XP registran actividad. Las bandas del currículo describen objetivos de enseñanza.

[Currículo de 20 etapas y prerrequisitos](docs/PHASE_3_CURRICULUM.es-419.md) · [Diseño de aprendizaje adaptativo](docs/PHASE_3_ADAPTIVE_LEARNING.es-419.md) · [Evaluación inicial, final y diferida del capítulo 1](docs/CHAPTER_1_ASSESSMENT.es-419.md)

[Revisión de actividades del capítulo 1](docs/CHAPTER_1_CONTENT_AUDIT.es-419.md) · [Diseño de evidencia oral y entre cursos](docs/LEARNING_EVIDENCE_INTEGRATION.es-419.md)

## Desarrollo y compilación

Usa Node.js 24 o posterior y npm. Inicia el desarrollo web con `npm ci` y `npm run dev`, y abre `http://localhost:8081`. Para una vista previa sin conexión, ejecuta `npm run build:web` y `npm run preview`, y abre `http://localhost:3000`. Espera a que el service worker llene la caché antes de desconectarte. El instalador de Android incluye lecciones, fuentes, mapa, ilustraciones y audio del primer capítulo.

```sh
npm run check
npm test
npm run packs:verify
npm run packs:chapters -- --verify
npm run build:web
npm run preview          # Usa otra terminal antes de las pruebas de navegador.
npm run test:e2e
npm run build:android    # Exportación Hermes para Android
npm run build:apk        # APK independiente de vista previa
```

La compilación del APK usa Java 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006 y CMake 3.22.1. Los APK locales y sus sumas quedan en `work/apk/`. [Compilación de APK](docs/APK_BUILDS.es-419.md) · [Verificación y capturas](docs/VERIFICATION.es-419.md) · [Plan de aceptación manual](docs/OFFLINE_TEST_PLAN.es-419.md)

## Datos locales, paquetes del curso y voz

Android usa SQLite y la web usa el almacenamiento del navegador. La aventura guarda la escena actual, las decisiones y los objetos. Las misiones, las lecciones y los repasos rápidos guardan borradores y devoluciones en el dispositivo. Exporta o restaura un respaldo de formato 2 en **Perfil**. El progreso anterior del curso conserva los mismos identificadores de lección. [Publicación de paquetes de capítulos](docs/CHAPTER_PACKS.es-419.md) · [Paquetes del curso original](content/releases/README.es-419.md) · [Arquitectura del viaje y diagnóstico de la fase 3](docs/TRAVEL_ARCHITECTURE.es-419.md)

Abre **Configuración de voz** para elegir una voz de inglés instalada y una velocidad. Las actividades de escucha y los modelos de voz del capítulo pueden usar audios incluidos en inglés estadounidense si la voz guardada no está disponible. Las lecciones descargadas reproducen su propio audio en inglés. El material de consulta del curso también puede usar el audio descargado del capítulo correspondiente. En Android, la práctica oral usa el reconocedor elegido en los ajustes del sistema después de avisar sobre el posible procesamiento de audio en línea. Una transcripción final que coincide completa la comprobación y orienta sobre el contenido y la gramática. Los dispositivos compatibles crean una grabación temporal durante el reconocimiento y pueden reproducir el ejemplo seguido de la grabación. Puedes omitir el paso sin permiso de micrófono. La opción separada de reconocimiento puede procesar el audio en línea a través del proveedor del sistema. La evaluación de pronunciación del estudio la hace una persona según la rúbrica. [Voz y privacidad](docs/OFFLINE_EDITION.es-419.md) · [Créditos de recursos](docs/TRAVEL_ASSETS.es-419.md)
