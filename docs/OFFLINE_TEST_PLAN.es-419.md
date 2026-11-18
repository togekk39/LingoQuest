# Plan de aceptación sin conexión del currículo del viaje

[English](OFFLINE_TEST_PLAN.md)

Consulta el [registro de verificación](VERIFICATION.es-419.md) para ver los resultados y límites de la automatización. Realiza estas comprobaciones sin iniciar Fastify, iniciar sesión ni conectar una cuenta en la nube.

## Bienvenida y misión inicial

1. Con datos nuevos, abre la app a 320, 360 y 390 px. Repite con texto ampliado y tema oscuro. Comprueba que las dos acciones se distingan y que el botón para cerrar sea accesible. **Empezar mi viaje** abre la escena de la plaza.
2. En la bienvenida, elige **Ya sé algo de inglés** y omite las seis preguntas. Verifica que **Ir a mi misión** abra **Un saludo en la plaza**.
3. Repite la prueba en **Aprender**. Responde bien solo las primeras dos para empezar en la parada de bus. Responde bien las primeras cuatro sin transcripción para empezar en objetos perdidos. Comprueba que sigan disponibles las misiones anteriores y que la prueba no otorgue XP, sellos ni misiones completadas.

## Vocabulario, misiones y repaso

1. Guarda la app web en caché o instala el APK de vista previa y desconéctate. Llega a **Palabras del viaje** en una misión. Comprueba que cada ficha indique el significado en español, cuándo se usa la palabra y un ejemplo en ambos idiomas. Escucha la palabra y el ejemplo y cambia la velocidad. Abre **Aprender** para consultar el mismo material directamente.
2. Sal a mitad del vocabulario, vuelve y comprueba que aparezca la misma ficha. Repite después de escribir una respuesta parcial, al ver la devolución y después de recibir el sello. Cambia entre misiones disponibles y comprueba que el borrador anterior reaparezca al volver.
3. Da una respuesta incorrecta y comprueba la explicación en español y el reintento. Prueba la transcripción y la grabación local opcional. Completa el capítulo y revisa que el pasaporte, la postal y el diario se conserven, con un solo sello.
4. Abre **Repaso rápido**, responde una pregunta y vuelve al punto exacto de tu viaje. Comprueba que **Repasar** muestre prácticas del capítulo.
5. Elige tu lugar de origen en el mapa. Revisa las 20 paradas y el destino final en Ushuaia y la Antártida. Las paradas futuras deben indicar **En preparación**.

## Desafíos, respaldos y pruebas nativas

- Antes del sello, los tres niveles publicados deben estar bloqueados. Después del sello, prueba una ronda con reloj y una práctica sin reloj. Los niveles futuros deben indicar **En preparación**. Perder un desafío conserva los XP y el avance del viaje.
- Desde **Perfil**, exporta un respaldo de formato 2 y restáuralo en otra instalación. Verifica preferencias, puntos de guardado del viaje, recuerdos y el historial del curso archivado, si existe. Los datos de formato 1 se pueden exportar antes de confirmar un restablecimiento.
- En un equipo Android físico, verifica la instalación del APK firmado, el primer inicio en modo avión, los permisos de micrófono y la reproducción, TalkBack, el tamaño del texto del sistema, la reducción de movimiento, el selector de archivos y el rendimiento en un equipo de gama baja.
- Con el teclado de Android e iOS abierto, comprueba el acceso a los campos de texto de las misiones y la prueba y a sus botones. Cambia la altura del teclado. Ciérralo y vuelve a abrirlo. Verifica que se conserven los borradores y que el espacio de la pantalla se ajuste una sola vez.
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

Se necesita una revisión con principiantes y docentes del flujo de bienvenida, las explicaciones del capítulo y las recomendaciones de la prueba.
