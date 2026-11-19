# Plan de aceptación sin conexión del currículo del viaje

[English](OFFLINE_TEST_PLAN.md)

Consulta el [registro de verificación](VERIFICATION.es-419.md) para ver los resultados y límites de la automatización. Realiza estas comprobaciones sin iniciar Fastify, iniciar sesión ni conectar una cuenta en la nube.

## Bienvenida y misión inicial

1. Con datos nuevos, abre la app a 320, 360 y 390 px. Repite con texto ampliado y tema oscuro. Comprueba que las dos acciones se distingan y que el botón para cerrar sea accesible. Elige un origen después de **Empezar mi viaje** para abrir la escena de la plaza.
2. En la bienvenida, elige **Ya sé algo de inglés** y omite las seis preguntas. Verifica que **Ir a mi misión** abra **Un saludo en la plaza**.
3. Repite la prueba en **Aprender**. Responde bien solo las primeras dos para empezar en la parada de bus. Responde bien las primeras cuatro sin transcripción para empezar en objetos perdidos. Comprueba que sigan disponibles las misiones anteriores y que la prueba no otorgue XP, sellos ni misiones completadas.

## Vocabulario, misiones y repaso

1. Guarda la app web en caché o instala el APK de vista previa y desconéctate. Llega a **Palabras del viaje** en una misión. Comprueba que cada ficha indique el significado en español, cuándo se usa la palabra y un ejemplo en ambos idiomas. Escucha la palabra y el ejemplo y cambia la velocidad. Abre **Aprender** para consultar el mismo material directamente.
2. Sal a mitad del vocabulario, vuelve y comprueba que aparezca la misma ficha. Repite después de escribir una respuesta parcial, al ver la devolución y después de recibir el sello. Cambia entre misiones disponibles y comprueba que el borrador anterior reaparezca al volver.
3. Comete dos errores de concordancia con `be` en las escenas de presentación. Comprueba la explicación en español, el refuerzo en otra escena y el nuevo intento sin la respuesta visible. Revisa en **Mis habilidades** que las respuestas con ayuda y las independientes queden registradas por separado.
4. Escucha a Sam con el audio incluido, prueba abrir la transcripción y escribe la siguiente indicación que escuches. Prueba la grabación local opcional y la alternativa sin micrófono. Comprueba que esa alternativa deje la expresión oral sin evaluar. Completa el capítulo y revisa que el pasaporte, la postal y el diario se conserven, con un solo sello.
5. Abre **Repaso rápido**, guarda parte de una respuesta y vuelve al punto exacto de tu viaje. Vuelve a abrir el repaso y completa la respuesta. Después de un día, vuelve a **Repasar**, completa un ejercicio pendiente sin ayuda y revisa la evidencia de recuerdo diferido en **Mis habilidades**.
6. Abre el manual de gramática desde **Aprender** y compara dos patrones. En modo avión, abre **Cursos A1–A2**, consulta el material de referencia y retoma una lección anterior desde un borrador.
7. Elige tu lugar de origen en el mapa. Revisa las 20 paradas y el destino final en Ushuaia y la Antártida. Las paradas futuras deben indicar **En preparación**.

## Desafíos, respaldos y pruebas nativas

- Antes del sello, los tres niveles publicados del viaje deben estar bloqueados. Después del sello, prueba una ronda con reloj y una práctica sin reloj. Los niveles futuros del viaje deben indicar **En preparación**. Abre el desafío aparte del curso, revisa que figuren sus 13 niveles y juega después de completar las lecciones requeridas. Perder un desafío conserva la evidencia de aprendizaje y el avance del viaje.
- Desde **Perfil**, exporta un respaldo de formato 2 y restáuralo en otra instalación. Verifica preferencias, puntos de guardado del viaje y del curso, evidencia de aprendizaje y recuerdos. Los datos de formato 1 se pueden exportar antes de confirmar un restablecimiento.
- En un equipo Android físico, verifica la instalación del APK firmado, el primer inicio en modo avión, los permisos de micrófono y la reproducción, TalkBack, el tamaño del texto del sistema, la reducción de movimiento, el selector de archivos y el rendimiento en un equipo de gama baja.
- Con el teclado de Android e iOS abierto, comprueba el acceso a los campos de texto de las misiones y la prueba y a sus botones. Cambia la altura del teclado. Ciérralo y vuelve a abrirlo. Verifica que se conserven los borradores y que el espacio de la pantalla se ajuste una sola vez.
- Con Android sin conexión, elige un motor o una voz de inglés en los ajustes TTS del sistema. En una misión, escucha una palabra con **Predeterminada del sistema**. Abre **Configuración de voz** en la cabecera de la misión, elige otra voz de inglés instalada y otra velocidad, guarda y vuelve a escuchar la palabra y el ejemplo. Comprueba los diálogos y la escucha de la prueba, y confirma que la opción siga guardada al volver a abrir la app. Repite con la voz predeterminada no disponible y comprueba el aviso del audio incluido.
- Prueba la grabación local sin conexión. Si eliges el reconocimiento del sistema, comprueba que aparezca el aviso sobre el proveedor antes de solicitar permisos. Revisa que la configuración de voz ofrezca una voz en inglés instalada sin conexión o explique por qué no está disponible.

```bash
npm run check
npm test
npm run packs:verify
npm run build:web
npm run build:android
npm run preview
# En otra terminal:
npm run test:e2e
```

Usa el protocolo de evaluación del capítulo con principiantes reales para medir su comprensión, su producción independiente y su recuerdo posterior. [Diseño de evaluación del capítulo 1](CHAPTER_1_ASSESSMENT.es-419.md)
