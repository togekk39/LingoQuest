# Validación de la fase 5C

[English](PHASE_5C_VALIDATION.md)

La fase 5C parte de los cambios del currículo y de la evaluación sin conexión de la fase 5B, integrados en `ad8d470fd6e886edfa627a560561cc8d1e3f8005`. Las pruebas de aceptación empiezan en el capítulo inicial y abarcan el curso publicado de 32 lecciones y los paquetes de viaje vigentes. [PR de la fase 5B](https://github.com/togekk39/LingoQuest/pull/29) · [Auditoría del currículo](PHASE_5B_CONTENT_AUDIT.es-419.md)

## Escenarios de aceptación

| Escenario                                                 | Resultado observable                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Una persona que empieza en la historia abre el curso      | Las dos actividades independientes de escritura de la presentación se comparten con el ejercicio equivalente del curso. Se puede omitir ese ejercicio y la práctica oral sigue disponible.                                                            |
| Una persona que empieza en el curso abre la historia      | La historia sigue comenzando con Sam y Luz. Las respuestas del curso y la historia apuntan al mismo objetivo de escritura, y las decisiones y recompensas de la historia se guardan por separado.                                                     |
| Escritura sin comprensión auditiva ni expresión oral      | La escritura independiente deja las otras dos capacidades sin evidencia independiente para ese objetivo.                                                                                                                                              |
| Respuesta correcta con ayuda                              | La evidencia conserva el resultado de la evaluación y la ayuda utilizada. La respuesta no aporta evidencia independiente.                                                                                                                             |
| Error al recordar algo aprendido                          | Los errores gramaticales repetidos llevan a una explicación, un ejercicio guiado y una actividad independiente distinta. La evidencia anterior sigue disponible.                                                                                      |
| Transferencia a otro contexto                             | La actividad inicial de escritura y la inscripción en el puesto de fotos tienen ejercicios y contextos distintos.                                                                                                                                     |
| Envío duplicado                                           | Una respuesta conserva un solo identificador de evidencia al reenviarla rápidamente, recargar la app o cambiar de entrada.                                                                                                                            |
| Reinicio durante una actividad                            | La respuesta incompleta se recupera con su punto guardado. Los comentarios y las respuestas previas se recuperan de los datos locales.                                                                                                                |
| Capítulo 2 seguido por repaso sin conexión del capítulo 1 | El navegador pierde la conexión después de instalar los dos capítulos. El repaso del capítulo 1 sigue disponible y al abrirlo no se solicita una descarga.                                                                                            |
| Falla en la descarga del paquete                          | Una descarga incompleta del capítulo 2 conserva el capítulo instalado y el estado guardado. El reintento usa el mismo progreso.                                                                                                                       |
| Restauración de un respaldo anterior                      | Un archivo importado de formato 2 conserva las lecciones completadas, los sellos, los resultados de desafíos, las respuestas anteriores, las fechas de repaso y un borrador. Los datos agregados anteriores no aportan evidencia independiente nueva. |
| Diagnóstico y requisitos de desafíos                      | La recomendación puede elegir un punto de partida para estudiar. El acceso a desafíos sigue dependiendo de la enseñanza requerida.                                                                                                                    |
| Historia y enseñanza de la fase 5A                        | Las pruebas de regresión abren las conversaciones con ambos personajes, recuperan decisiones y borradores, y comprueban las transiciones de misiones, objetos, pasaporte y enseñanza.                                                                 |
| Currículo y evaluación de la fase 5B                      | El verificador del currículo y las pruebas de evaluación cubren el material publicado, los requisitos y los cuatro resultados.                                                                                                                        |

Las pruebas del navegador usan la app exportada y el servidor local de vista previa. El control de red rechaza llamadas a servicios externos y a las API. El modo sin conexión del navegador comprueba la versión web y los capítulos instalados. Para comprobar el modo avión, las voces instaladas y el micrófono de Android hace falta una prueba en el dispositivo. [Pruebas del navegador](../tests/e2e) · [Plan de pruebas de Android](OFFLINE_TEST_PLAN.es-419.md)

La prueba de restauración usa el formato 2 de la fase 5B. Los respaldos de formato 1 del prototipo siguen siendo incompatibles con el curso integrado. La restauración del formato 2 conserva los comentarios anteriores de desafíos y los récords personales. El tiempo y las vidas se inicializan al iniciar un desafío nuevo.

## Cómo reproducir las pruebas

```sh
npm ci
npm run curriculum:verify
npm run packs:verify
npm run packs:chapters -- --verify
npm run check
npm test
npm run build:web
npm run build:android
```

Ejecuta `npm run preview` en una terminal y `npm run test:e2e` en otra. Playwright usa Chromium. El flujo `Android APK` instala las versiones fijadas de las herramientas, compila un APK de vista previa autónomo para ARM, prueba la configuración nativa de la voz en inglés, verifica la firma y publica el APK con su suma SHA-256. [Flujo de CI](../.github/workflows/ci.yml) · [Flujo de APK para Android](../.github/workflows/android-apk.yml) · [Instrucciones de compilación](APK_BUILDS.es-419.md)

## Resultados

La base integrada de la fase 5B pasó la verificación del currículo con 1,567 comprobaciones de respuesta, la verificación de los 20 paquetes vigentes, las comprobaciones de tipos y estilo, 130 pruebas automatizadas y las exportaciones para Web y Hermes en Android. Los flujos de CI y del APK firmado también pasaron. [CI de la fase 5B](https://github.com/togekk39/LingoQuest/actions/runs/45547727601) · [APK de la fase 5B](https://github.com/togekk39/LingoQuest/actions/runs/45547727538)

La base local de la fase 5B también pasó las 61 pruebas de Playwright. Los resultados de la fase 5C se registran al ejecutar las pruebas en la rama integrada. Las pruebas automatizadas comprueban el comportamiento de la app con los datos evaluados. El aprendizaje, la retención a largo plazo y el registro regional requieren evaluación humana.
