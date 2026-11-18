# Registro de verificación de LingoQuest

[English](VERIFICATION.md)

## Verificación del viaje de LingoQuest 2.0

La implementación del viaje se verificó en local el 18 de noviembre de 2026, antes de integrar desde `main` los últimos cambios de reconocimiento de voz del sistema. Pasaron TypeScript, ESLint, la suma del paquete LQP 2.1.0 y 60 pruebas unitarias y de integración. De 40 escenarios de navegador, 37 pasaron en una ejecución y tres pasaron por separado tras actualizar las verificaciones del inicio, el guardado de la lección y los conteos de práctica. En esa revisión pasaron la exportación Hermes, la compilación y verificación de firma de un APK de vista previa para ARM y cinco pruebas nativas de voz sin conexión. El APK incluyó el curso actualizado, las fuentes, las dos imágenes del viaje y los 11 audios. El primer intento de Gradle alcanzó el límite de memoria del entorno. La compilación se completó con un límite de 2560 MB y un proceso de trabajo.

Chromium verificó que se podía recorrer el capítulo sin conexión con un origen del Caribe, recuperar una respuesta parcial y su devolución al recargar, reproducir el audio incluido de Sam, recibir un solo sello y guardar una entrada de diario. Otra comprobación sin conexión abrió el material de consulta sin cambiar los registros de práctica ni los XP. El inicio se comprobó a 320, 360 y 390 px con texto ampliado al 150 %.

Después de incorporar el `main` actual, pasaron TypeScript, ESLint, la verificación de LQP, 65 pruebas unitarias y de integración, las exportaciones web y Hermes y la generación del proyecto nativo de Android. De 22 escenarios específicos de navegador, 21 pasaron en una ejecución. La prueba de viaje restante pasó al repetirla tras esperar el cierre del selector de origen. Las pruebas verificaron que el viaje usa grabación local y el curso regular conserva el reconocimiento opcional.

### Capturas

- [Inicio en pantalla de escritorio](screenshots/01-inicio-web.jpg)
- [Mapa del mundo](screenshots/02-mapa-web.jpg)
- [Inicio móvil en tema oscuro](screenshots/03-inicio-movil-oscuro.jpg)
- [Pasaporte y diario](screenshots/04-pasaporte.jpg)
- [Devolución de una misión](screenshots/05-mision-movil.jpg)
- [Biblioteca del curso](screenshots/06-cursos-web.jpg)
- [Acceso a desafíos](screenshots/07-desafios-web.jpg)

La aceptación queda pendiente con principiantes y con Android físico en modo avión, micrófono, tamaño de texto del sistema, TalkBack y rendimiento en equipos de gama baja. [Plan de pruebas manuales](OFFLINE_TEST_PLAN.es-419.md)

## Historial de verificación del curso integrado 1.3

Las verificaciones del 2026-11-08 en la zona horaria America/Belize se ejecutaron localmente con Node.js 24.22.1, Linux y Chromium. El servidor de la app permaneció apagado y la edición nueva no se envió ni se publicó.

| Comando                       | Resultado observado                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --no-audit --no-fund` | Instaló las dependencias existentes sin agregar paquetes.                                                                                                                                           |
| `npm run check`               | TypeScript y ESLint aprobaron en todos los espacios de trabajo.                                                                                                                                     |
| `npm test`                    | Aprobaron 54 de 54 pruebas: 17 del prototipo de API, 16 de paquetes y 21 del motor sin conexión.                                                                                                    |
| `npm run packs:build`         | Generó 8 unidades, 32 lecciones, 360 ejercicios y 67 preguntas de desafío con el esquema LQP 2 y la versión 2.0.0.                                                                                  |
| `npm run packs:verify`        | El archivo de 385,955 bytes coincidió con el catálogo y el archivo SHA-256.                                                                                                                         |
| `npm run build:web`           | Exportó el sitio estático con 36 recursos para funcionar sin conexión.                                                                                                                              |
| `npm run build:android`       | Exportó el paquete de Hermes para Android. El APK firmado se genera en un flujo aparte.                                                                                                             |
| `npm run test:e2e`            | Aprobaron 14 de 15 al principio. Después de corregir la suposición sobre las opciones múltiples en la prueba de nivel, el escenario restante aprobó por separado. Se verificaron los 15 escenarios. |
| `git diff --check`            | Aprobó.                                                                                                                                                                                             |

La suma SHA-256 del paquete completo fue `c6b4b3464dad8c21bbb25f01999a91085f6213fa9bda06f4f132cf0393984e64`. Las exportaciones de JavaScript web y Hermes para Android incluían la suma del manifiesto del último paquete integrado. Esto confirmó que las pruebas usaron la versión nueva.

## Cobertura

Las pruebas del motor sin conexión cubren las 32 lecciones y los 360 ejercicios, 13 niveles de desafío, temporizador y corazones, idempotencia local, conservación del estado de aprendizaje en los desafíos, rechazo de llamadas directas para desbloquear material sin estudiar, filtrado del banco de preguntas, cuatro dimensiones de evidencia, asociaciones correctas e incorrectas y sus reintentos, evidencia en días distintos, evidencia insuficiente de dominio con una sola pregunta de reconocimiento, restauración de respaldos y conservación de los datos en formato 1.

Las pruebas de contenido cubren SHA-256, alteraciones, tamaño y versión, identificadores únicos, traducciones y respuestas faltantes, referencias a prerrequisitos y repasos, orden de las siete etapas, opciones y pares ambiguos, inglés aún no enseñado y glosas válidas en español, referencias y fuentes de recursos, y lecciones obligatorias de los desafíos. También se actualizaron las pruebas de la API histórica para la calificación de pares y los supuestos del currículo. La app usa el motor local.

La revisión manual a 390×844 confirmó que la ruta inicial y las tarjetas de vocabulario eran legibles sin desbordamiento horizontal ni errores de JavaScript. Los 15 escenarios de navegador cubren el inicio desde cero, las siete etapas sin conexión, reintentos, cuatro dimensiones de evidencia, repaso dos días después, arranque en frío sin conexión, navegación móvil, 40 ejercicios de pronunciación con texto, evaluación de nivel opcional y misión de aeropuerto, rechazo de voces que solo funcionan de forma remota, asociación, grabación local con audio sintético y reproducción, 13 niveles de desafío, actualización y descarga de paquetes, restauración de respaldos y exportación antes de confirmar el restablecimiento de los datos anteriores. El interceptor no encontró solicitudes externas ni de API sin autorización.

Al principio aprobaron 14 pruebas de extremo a extremo y una falló porque la evaluación de nivel se probaba suponiendo que todas las preguntas tenían botones de opción. El material nuevo incluye preguntas para completar espacios. Después de adaptar las respuestas al tipo de ejercicio, `npm run test:e2e -- --grep 'placement and a complete airport mission'` aprobó en 3.4 segundos. La app no requirió cambios.

## Límites de las pruebas

La compilación e instalación de APK firmados y las pruebas de modo avión, TalkBack, rendimiento en equipos de gama baja, selector de archivos, micrófono físico y permisos quedaron fuera de estas ejecuciones. La prueba de grabación del navegador usó audio sintético. La calidad de grabación aún requiere un dispositivo real. Docentes hablantes nativos deben revisar la naturalidad del borrador original, el ritmo según el MCER, la carga cognitiva y las respuestas aceptadas. El curso no incluye audio de referencia pregrabado. El TTS nativo permanece desactivado salvo que se verifique su funcionamiento sin conexión. No se ofrecen calificaciones de pronunciación.

## Verificación de animaciones de la interfaz · 2026-11-10

Se agregó una brújula original en SVG local, parpadeo y balanceo, salto al acertar, confeti de una sola ejecución, rebote de botones, entradas de contenido y una barra de progreso fluida sin paquetes nuevos. La preferencia del sistema o de la app para reducir el movimiento desactiva las animaciones decorativas y actualiza el progreso de inmediato.

- `npm run check` aprobó la verificación de tipos y ESLint en todos los espacios de trabajo.
- `npm test` aprobó 56 de 56 pruebas (17 de API, 16 de paquetes y 23 del motor sin conexión).
- Aprobaron las 17 pruebas existentes de aprendizaje, temas y animaciones en navegador. Las tres nuevas aprobaron al volver a ejecutarlas después de agregar atributos ARIA compatibles, ya que React Native Web no convertía `accessibilityValue` en un valor de progreso.
- Las pruebas nuevas tomaron muestras de los fotogramas y comprobaron el cambio inmediato de la preferencia del sistema, la escala al presionar, el uso del teclado, la conservación de la barra entre pasos, el fin automático de la celebración y la preferencia móvil guardada y aplicada al recargar. El interceptor no encontró solicitudes adicionales de API ni externas.
- Se revisó el inicio a 1440×1000 y 390×844, además de la pantalla de lecciones en móvil. No hubo desbordamiento horizontal en móvil.
- Aprobaron las exportaciones para web y Android, el formato de archivos modificados y `git diff --check`.

La verificación de Android cubrió la exportación del paquete de Hermes. Quedaron pendientes la instalación del APK, el rendimiento de las animaciones en un dispositivo físico y TalkBack. La edición no se envió ni se publicó de forma remota.

## Sincronización del PR #7 con main · 2026-11-10

Se integró main en `ee094cd`, incluidos el PR #5 para evitar que el teclado cubra los campos y el PR #6 para mostrar retroalimentación al enviar respuestas. Se resolvieron manualmente los conflictos en `FeatureUI.tsx` y `LessonStages.tsx`. Se conservaron la visibilidad de los campos, el espacio del teclado, el desplazamiento automático a la retroalimentación, el envío de respuestas, las explicaciones, las animaciones y la barra de progreso sin volver a montarla. El desplazamiento del contenido se reinicia al cambiar de paso.

Después de la integración, aprobaron `npm run check`, las exportaciones para web y Hermes en Android, las verificaciones de formato y `git diff --check`. Aprobaron en 2.1 minutos las 18 pruebas de regresión en navegador de `feedback.spec.ts`, `keyboard.spec.ts`, `learning.spec.ts` y `motion.spec.ts`. Quedó pendiente la aceptación en un dispositivo Android físico.
