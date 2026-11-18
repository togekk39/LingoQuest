# LingoQuest · Edición integrada sin conexión 1.3

[English](README.md) · [Reglas de desarrollo](AGENTS.md#español-latinoamérica)

LingoQuest es una app para aprender inglés sin conexión, diseñada principalmente para Android con Expo, React Native y TypeScript. La interfaz de aprendizaje usa español latinoamericano (`es-419`) y el idioma meta es el inglés estadounidense (`en-US`). Después de instalarla, se puede usar el curso completo A1–A2 sin cuenta, servidor, IA en la nube, API de voz ni credenciales.

## Desarrollo y compilación

Usa Node.js 24 o posterior y npm.

```bash
npm ci
npm run dev
```

Abre `http://localhost:8081`. La app funciona sin un archivo `.env` ni un servidor de API. Para desarrollar en Android, usa `npm run android`. Para una vista previa estática en el navegador, ejecuta `npm run build:web` y `npm run preview`, y abre `http://localhost:3000`. El navegador primero debe cargar los archivos estáticos y preparar la caché sin conexión. El paquete de instalación de Android incluye el curso y las fuentes.

`npm run build:android` verifica la exportación para Hermes en Android. El [flujo de APK para Android](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml) genera el APK instalable. Consulta las [instrucciones para compilar APK](docs/APK_BUILDS.md). Esta edición sigue pendiente de envío y publicación remota.

## Empezar desde cero

En el primer inicio, **Empiezo desde cero** abre la primera lección. **Ya sé algo de inglés** abre una evaluación de nivel opcional. El nombre, la meta y la motivación se pueden configurar después.

El curso incluye ocho unidades con situaciones cotidianas, 32 lecciones, 200 elementos de vocabulario nuevo, 68 repasos explícitos de vocabulario y 360 ejercicios. Cada lección combina vocabulario, gramática y una meta comunicativa en siete etapas.

1. **Meta** presenta la situación y un objetivo práctico en español.
2. **Vocabulario** presenta palabras y frases en inglés con su significado en español, categoría gramatical y ejemplos bilingües. Luego se practica el reconocimiento de significados y la asociación de pares.
3. **Gramática** enseña una estructura principal y explica las palabras funcionales y formas necesarias.
4. **Conversación** presenta un diálogo breve original con apoyo en español en cada línea.
5. **Práctica** avanza desde completar espacios, reordenar y corregir errores con apoyo hasta escribir respuestas breves.
6. **Hablar** permite escuchar una voz local verificada, grabar, reproducir la grabación u omitir la actividad.
7. **Recordar** repasa el vocabulario y las estructuras y programa prácticas posteriores.

La primera unidad, **¡Hola! Mucho gusto**, comienza con `I am` y `You are` en **Me presento**. Luego enseña a presentar a familiares, describir a personas y objetos y preguntar por identidad y procedencia. Las demás unidades cubren rutinas, preguntas, el pasado, acciones en curso, planes futuros, experiencias, viajes y trabajo. Las fuentes están en `content/source/curriculum.ts` y en los archivos de cada unidad. Este curso sustituye al plan centrado en gramática que partía de ocho oraciones fijas.

**Aprender** ofrece explicaciones y nuevos intentos sin temporizador ni penalizaciones de corazones. El avance de las lecciones, los XP, el dominio a largo plazo y los resultados de los desafíos se registran por separado. La app registra evidencia de reconocimiento de vocabulario, recuperación de vocabulario, comprensión gramatical y producción gramatical. Una sola respuesta correcta de opción múltiple no demuestra dominio. Los repasos reúnen evidencia a intervalos de 1, 3, 7 y 14 días.

**Desafíos** es un modo local opcional con 13 niveles, temporizador y corazones. El motor comprueba que el estudiante haya completado las lecciones necesarias y elige preguntas del material estudiado. El tema actual son las rutinas cotidianas en presente. Fallar, quedarse sin tiempo o salir conserva los XP de aprendizaje y las lecciones completadas.

## Paquetes de curso sin conexión y validación

Una sola fuente curricular genera un paquete LQP en JSON que se valida con el esquema 2.

```bash
npm run packs:build
npm run packs:verify
```

La versión predeterminada del curso es `2.0.0` y requiere la versión `1.3.0` de la app como mínimo. `content/releases/` contiene el paquete, la suma SHA-256 y el catálogo. `apps/mobile/src/content/bundled-course.json` es la copia integrada idéntica. Esta edición distribuye archivos con el esquema 2.

La validación comprueba los identificadores únicos, traducciones, respuestas, opciones ambiguas, referencias a vocabulario, habilidades y prerrequisitos, orden de las etapas, referencias a recursos y uso prematuro de inglés. Una glosa contextual puede aportar el significado en español de una palabra funcional. Consulta la [guía de creación del currículo](docs/INTEGRATED_CURRICULUM.md).

En **Perfil → Contenido sin conexión** se puede importar un archivo sin conexión. La app solo se conecta cuando la persona pega la URL de un archivo en GitHub y elige descargarlo. El paquete nuevo está pendiente de publicación remota, así que el campo de descarga aparece vacío y la URL del catálogo identifica el destino previsto. La app valida todo el paquete antes de activarlo y conserva el paquete activo si falla la importación. Consulta el [proceso de publicación de paquetes](content/releases/README.es-419.md).

## Restablecimiento de datos de desarrollo

Esta edición usa el formato **2** para el progreso local y los respaldos. Al iniciar con datos del prototipo en formato 1, la app explica la incompatibilidad, bloquea las lecturas y escrituras y conserva los datos guardados.

Selecciona **Guardar copia de los datos anteriores** para guardar los datos antiguos en la ubicación que elijas. Luego selecciona **Restablecer datos locales**, lee qué se borrará y confirma. El restablecimiento borra el perfil local anterior, las respuestas, los XP, las lecciones completadas y el historial de desafíos. Conserva el curso y vuelve a mostrar la pantalla inicial. El archivo anterior sirve como referencia y no se puede restaurar al formato 2. Puedes salir sin confirmar para conservar los datos.

**Exportar mis datos** y **Restaurar respaldo** admiten respaldos locales en formato 2. Antes de sobrescribir el progreso se pide confirmación. Los desafíos en curso quedan fuera de la restauración. Haz un respaldo antes de desinstalar la app o borrar sus datos.

## Voz, recursos y privacidad

El inicio y las lecciones incluyen un personaje original con forma de brújula que parpadea, se balancea y salta después de una respuesta correcta. También hay confeti breve, rebote al presionar botones, transiciones de entrada y una barra de progreso fluida. Los efectos usan React Native Animated y SVG locales sin agregar dependencias ni solicitudes de red. La opción del sistema para reducir el movimiento o **Perfil → Reducir movimiento → Guardar preferencias** desactiva los efectos y mantiene los mensajes, el progreso y los controles. En la versión nativa, los desplazamientos y la opacidad usan el controlador nativo. Las animaciones se limpian al salir de la pantalla.

El curso prescinde de audio pregrabado e imágenes externas. No descarga en segundo plano fuentes, respuestas de IA ni contenido multimedia. Las fuentes e ilustraciones locales mantienen su diseño. Los textos nuevos del curso son originales.

La pronunciación usa la síntesis de voz del sistema (TTS). El puente nativo de Android acepta voces en inglés instaladas que funcionan sin conexión y prioriza la voz predeterminada en inglés, si está disponible. Cada reproducción solicita una configuración regional y una voz en inglés independientemente del idioma de la app o del dispositivo. Android configura primero la variante elegida, aplica la voz sin conexión y verifica que el motor la use. Si el motor la rechaza o conserva otra voz, la app detiene la reproducción y muestra un aviso. iOS selecciona explícitamente una voz en inglés instalada. Los navegadores usan voces en inglés con `localService === true`. En móviles y escritorio se puede seleccionar una voz, escuchar una muestra y elegir la velocidad del sistema o 0.75×, 1× o 1.25×. Las preferencias guardadas se aplican a todo el curso. En Android se puede abrir la configuración de TTS del sistema. Al volver, se actualiza la lista de motores y voces. Si falta una voz en inglés sin conexión o se eliminó la elegida, la app pide instalar o seleccionar otra. La síntesis de voz en la nube no está disponible. El puente nativo requiere un APK recompilado o una compilación de desarrollo, ya que Expo Go carece de este módulo. Grabar y reproducir es opcional. Las grabaciones permanecen en el dispositivo y se borran al salir. La app no asigna calificaciones automáticas de pronunciación ni considera que una coincidencia de texto demuestre una buena pronunciación.

## Verificaciones

```bash
npm run check
npm test
npm run packs:build
npm run packs:verify
npm run build:web
npm run build:android
# Primero inicia npm run preview en otra terminal.
npm run test:e2e
```

Consulta los [resultados de verificación](docs/VERIFICATION.es-419.md) y el [plan de pruebas manuales sin conexión](docs/OFFLINE_TEST_PLAN.es-419.md). Las respuestas breves se califican con un conjunto de respuestas aceptadas para cada situación. Los estudiantes pueden practicar su nombre en ejercicios orales opcionales. Docentes de inglés y editores hablantes nativos todavía deben revisar la naturalidad, el ritmo de A1–A2, el vocabulario regional y las respuestas aceptadas. Antes de publicar también se requieren pruebas del micrófono en dispositivos físicos, Android de gama baja, lectores de pantalla y firma de producción.

`apps/api` y `supabase` conservan el prototipo histórico en línea. La app sin conexión funciona de manera independiente. Consulta el [registro histórico de verificación](docs/VERIFICATION_ONLINE_PROTOTYPE.es-419.md).
