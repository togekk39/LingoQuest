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

La prueba de restauración usa el formato 2 de la fase 5B. Los respaldos de formato 1 del prototipo siguen siendo incompatibles con el curso integrado. La restauración del formato 2 conserva los comentarios anteriores de desafíos y los récords personales. El tiempo y las vidas se inicializan al iniciar un desafío nuevo. El selector admite hasta 8 MiB y el motor de importación limita la entrada serializada a diez millones de caracteres. Queda medir el tamaño de los respaldos con historiales extensos.

## Regresiones de la corrección de la fase 5C

| Escenario                                          | Resultado esperado                                                                                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Transferencia el mismo día                      | Una respuesta independiente en un contexto nuevo puede verificar la transferencia el mismo día. La retención queda sin verificar hasta otro acierto válido después de un intervalo.             |
| 2. Respuesta guiada incorrecta                     | El mismo refuerzo sigue abierto con comentarios y la opción de reintentar. La comprobación independiente sigue pendiente.                                                                       |
| 3. Práctica guiada exitosa                         | Un acierto guiado da paso a un contexto nuevo que se puede resolver sin ayuda. El acierto en esa comprobación independiente resuelve el error pendiente.                                        |
| 4. Refuerzo interrumpido                           | El reinicio recupera la guía con su respuesta y comentarios, o la comprobación independiente en curso. Una entrada de repaso compatible permite retomar el borrador guardado.                   |
| 5. Requisitos del repaso                           | Un ejercicio con un requisito de enseñanza pendiente queda fuera del repaso independiente. Hay práctica guiada cuando se cumplen sus propios requisitos.                                        |
| 6. Datos anteriores                                | La migración conserva respuestas archivadas, datos agregados y fechas de repaso. El registro nuevo queda sin verificar hasta que haya evidencia válida.                                         |
| 7. Preparación parcial para un desafío             | La evidencia de algunos de los objetivos y capacidades requeridos deja el desafío correspondiente sin acceso.                                                                                   |
| 8. Preparación para un desafío después de aprender | Un recorrido normal de enseñanza y práctica independiente puede cumplir los requisitos del desafío y conserva sus controles de práctica.                                                        |
| 9. Escritura parcial                               | La lección de personas y cosas muestra un objetivo de escritura demostrado de un total de dos. El objetivo restante y la expresión oral se registran por separado.                              |
| 10. Evidencia de aprendizaje compartida            | La presentación usa el mismo objetivo de escritura en la historia, el curso y el repaso. Las ayudas, comentarios, borradores e identificadores se conservan en sus actividades.                 |
| 11. Continuidad de respaldos y paquetes            | La restauración conserva el progreso, el historial y los borradores. Una actualización fallida conserva el capítulo instalado. El repaso de un capítulo anterior sigue disponible sin conexión. |
| 12. Regresión de las fases 5A y 5B                 | Las pruebas del navegador y del motor recorren la historia, los recorridos de enseñanza, el material publicado, los requisitos y los resultados de la evaluación.                               |

Las pruebas del navegador usan las entradas normales y revisan la evidencia guardada para distinguir la guía, el trabajo independiente y el historial migrado. Las pruebas del motor cubren combinaciones de requisitos y transiciones que no se pueden reproducir desde la interfaz. [Escenarios del navegador](../tests/e2e/phase-5c-learning.spec.ts) · [Pruebas del motor](../packages/offline-engine/test)

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

La base local de la fase 5B también pasó las 61 pruebas de Playwright. En la fase 5C pasaron las 1,567 comprobaciones de respuesta, la verificación de los paquetes del curso y de los capítulos, TypeScript, ESLint, 146 pruebas automatizadas y las exportaciones para Web y Hermes en Android. Los cuatro escenarios nuevos de la fase 5C pasaron en Playwright local. Las comprobaciones del pull request registran la regresión completa en el navegador y los resultados del APK firmado para cada revisión. [Pull request de la fase 5C](https://github.com/togekk39/LingoQuest/pull/30) · [Compilaciones del APK de Android](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml?query=branch%3Acodex%2Fphase-5c-unified-learning)

El APK de vista previa para ARM del código `fc80817` pasó las pruebas nativas de la voz en inglés y la verificación de firma. El archivo descargado coincidió con la suma SHA-256 publicada. La prueba de seguimiento de la aventura comprueba que el nombre de práctica quede separado del perfil guardado. [Compilación firmada de Android](https://github.com/togekk39/LingoQuest/actions/runs/45550917650)

La corrección pasó las 1,567 comprobaciones de respuesta, la verificación de los paquetes del curso y de los capítulos, TypeScript, ESLint y las exportaciones para Web y Hermes en Android. Pasaron las pruebas específicas del navegador para la transferencia el mismo día y la retención posterior, el refuerzo interrumpido, la evidencia compartida, la escritura parcial, el bloqueo de desafíos y la restauración anterior. La regresión de desafíos cubre los tres niveles de gramática del capítulo inicial y las 39 combinaciones de nivel y modalidad del curso. Las comprobaciones del pull request registran los resultados de la regresión completa y del APK firmado de la corrección. [Comprobaciones de la fase 5C](https://github.com/togekk39/LingoQuest/pull/30/checks)

Las pruebas automatizadas comprueban el comportamiento de la app con los datos evaluados. El aprendizaje, la retención a largo plazo y el registro regional requieren evaluación humana.
