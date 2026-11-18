# Plan de aceptación sin conexión del curso integrado

[English](OFFLINE_TEST_PLAN.md)

Consulta el [registro de verificación](VERIFICATION.es-419.md) para conocer los resultados automatizados y sus límites. Ejecuta estas pruebas sin iniciar Fastify, iniciar sesión ni usar una cuenta en la nube. Las pruebas del navegador interceptan `/v1/`, `/api/` y las solicitudes externas sin autorización explícita.

## Viaje y repaso rápido

1. Elige **Empezar mi viaje**, selecciona un origen y verifica que aparezca tanto en el mapa como en el inicio.
2. Guarda la app web en caché o instala el APK independiente. Desconéctate, abre **Repaso rápido**, responde una pregunta y vuelve al viaje.
3. Escribe media frase en **La primera postal**. Recarga o fuerza el cierre y vuelve a abrir la app. Verifica el borrador y repite después de responder y después de recibir el sello.
4. Completa las tres misiones. Reproduce el audio incluido de Sam, prueba la transcripción y escucha una grabación local si lo deseas. Verifica que siga habiendo un sello después de reiniciar y que la entrada de diario se conserve.
5. Abre **Ver material** y lee la gramática y el vocabulario. Comprueba los controles del inicio y de las misiones a 320–390 px, con texto grande, tema oscuro, movimiento reducido y lector de pantalla.
6. En un Android de gama baja, prueba el primer inicio en modo avión, los permisos del micrófono y la reproducción local, el teclado, TalkBack y el rendimiento.

## Empezar desde cero

1. Inicia con el almacenamiento vacío. Verifica que **Empiezo desde cero** abra **Me presento** de inmediato y que **Ya sé algo de inglés** abra una evaluación de nivel que se pueda omitir.
2. En Android, activa el modo avión. En la web, carga los archivos estáticos y el service worker antes de desconectarte. Completa Meta, las tarjetas bilingües de vocabulario, el reconocimiento de significados, la asociación, la gramática que enseña explícitamente am y are, el diálogo con apoyo línea por línea, los ejercicios de completar espacios y reordenar, y una presentación personal breve.
3. Responde mal a propósito. Verifica que la app muestre una explicación en español, la respuesta y la opción de volver a intentar. El aprendizaje funciona sin temporizador, corazones ni descuentos de XP. Usar una pista no cuenta como producción independiente.
4. Verifica que se pueda omitir la práctica oral antes de que la app solicite acceso al micrófono. Las grabaciones opcionales se pueden reproducir o repetir localmente y se borran al salir. Verifica que la app indique cuando no hay una voz local verificada y no invente una calificación de pronunciación.
5. Al terminar, revisa el vocabulario, las estructuras y la fecha de repaso. Reinicia y verifica que se conserven el avance y los XP. Revisa al día siguiente y dos días después el reconocimiento y la recuperación de vocabulario, la comprensión y la producción gramatical. Comprueba que se puedan practicar sin conexión.

## Desafíos y paquetes de contenido

- En un dispositivo sin progreso, verifica que los desafíos con prerrequisitos sin estudiar estén bloqueados y que se rechacen las llamadas directas al motor. Después de completar las unidades 1 y 2, revisa los 13 niveles y los tres tipos de ejercicio. Agotar el tiempo, fallar por respuestas incorrectas o salir conserva los XP, el avance y la evidencia de dominio.
- Importa un paquete LQP nuevo sin conexión. Las actualizaciones del mismo esquema deben conservar los identificadores de las lecciones. Comprueba que se rechacen una suma incorrecta, una versión anterior, referencias inválidas, vocabulario aún no enseñado, respuestas faltantes y opciones ambiguas. Si falla la importación, se conservan el paquete activo y el progreso.
- Comprueba que el campo de descarga aparezca vacío. Solo se hacen solicitudes de red después de que la persona escribe una URL de GitHub y elige descargar. La prueba automatizada intercepta solicitudes de los archivos de publicación para verificar la descarga. La versión nueva sigue pendiente de publicación.

## Datos y otras funciones

- Inicia con datos del prototipo en formato 1. Verifica que la app explique la incompatibilidad y conserve los datos. Exporta los bytes originales, comprueba que cancelar el restablecimiento conserve los datos y luego confirma el restablecimiento para verificar que aparezca la pantalla inicial. El archivo anterior no se puede restaurar al formato 2.
- Verifica las preferencias, la exportación, el borrado y la restauración confirmada de los datos actuales. La restauración excluye los desafíos que estén en curso.
- Verifica la navegación móvil a 390 px, la evaluación de nivel opcional, la práctica de pronunciación con texto y las misiones escritas del aeropuerto y la búsqueda de empleo.
- En un Android físico, abre un ejercicio de completar espacios o de respuesta breve en **Un día en familia** y toca el campo. Debe desplazarse por completo encima del teclado y el botón inferior, mantener el foco al escribir y permitir tocar **Comprobar respuesta** directamente. Prueba una pregunta de texto de la evaluación de nivel que quepa sin desplazarse antes de abrir el teclado. Si el teclado cubre la app, el espacio inferior debe corresponder a la parte cubierta y mover el contenido y el botón encima del teclado. Si el sistema ya redujo la ventana, evita sumar dos veces ese espacio. Cambia la altura del teclado, ciérralo y vuelve a abrirlo. El contenido debe seguir visible, el espacio inferior debe desaparecer al cerrarlo y el texto debe conservarse. Escribe más de 30 líneas. El campo debe caber en el área visible y permitir desplazamiento interno. Al agregar líneas al final, el cursor debe quedar visible sin que la página salte al inicio del campo. Repite estas pruebas en iOS. Las pruebas del navegador cubren el cambio de tamaño de ventana y la reducción simulada del área visible con el diseño fijo. Ejecuta también las pruebas del teclado nativo en dispositivos.
- Comprueba que se omita la síntesis si solo hay voces remotas. La grabación y reproducción opcionales no envían audio.

```bash
npm run check
npm test
npm run packs:build
npm run packs:verify
npm run build:web
npm run build:android
npm run preview
# En otra terminal:
npm run test:e2e
```

Comprueba el modo avión, TalkBack, permisos del micrófono, rendimiento en equipos de gama baja, falta de espacio, selector de archivos e instalación del APK firmado en Android físico. El currículo todavía requiere revisión lingüística y pedagógica.
