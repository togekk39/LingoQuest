# Arquitectura del viaje de LingoQuest 2.0

[English](TRAVEL_ARCHITECTURE.md)

| Ubicación                                       | Responsabilidad                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/offline-engine/src/travel-route.ts`   | Orígenes, destinos, ubicaciones, objetivos y referencias al currículo                          |
| `packages/offline-engine/src/travel-content.ts` | Pasos de misión, diálogos, enseñanza, ejercicios evaluados y coleccionables                    |
| `packages/offline-engine/src/travel.ts`         | Guardado de misiones, reintentos, diario y control de premios duplicados                       |
| `packages/offline-engine/src/index.ts`          | Evaluación compartida, repaso espaciado, guardado de lecciones y repasos, respaldos y desafíos |
| `apps/mobile/src/travel`                        | Inicio, mapa interactivo, misiones, pasaporte, repaso rápido y audio local                     |
| `content/source` y `packages/course-pack`       | Fuentes del currículo, preguntas de desafíos y validación de LQP                               |

Los ejercicios del viaje reutilizan la evaluación y el repaso del motor sin conexión. Los identificadores estables de habilidades y vocabulario conectan la evidencia con el currículo. QuestBuddy ofrece un reintento, una pista o un ejemplo para que la historia pueda continuar después de un error. Las lecciones registran finalización y XP, el capítulo otorga un sello y una postal, y los desafíos llevan sus propios registros.

El viaje guarda la misión, la versión de la historia, el identificador del paso, el borrador, la pista, la transcripción y la devolución. Una respuesta y su evidencia se guardan juntas. El cierre y los premios se guardan en una misma escritura y se identifican por misión o capítulo. Las lecciones guardan la etapa, el ejercicio y el identificador de actividad. El repaso rápido guarda su ejercicio y prioriza la evidencia pendiente de repasar. SQLite escribe una fila de estado en Android. La web serializa las escrituras entre pestañas cuando Web Locks está disponible. Los respaldos de formato 2 aceptan los campos nuevos como opcionales. El paquete original reconocido 2.0.0 puede usar el contenido actualizado que viene con la app y conservar sus bytes originales.

El service worker web guarda en caché la interfaz y los medios estáticos, incluidas las lecturas por rango de bytes del audio incluido. La práctica oral del capítulo usa grabación local y audios incluidos. El curso regular conserva el reconocimiento opcional del sistema y el aviso sobre su proveedor. La práctica del aeropuerto, la entrevista y el repaso completo pueden abrirse nuevamente desde sus accesos. La evidencia guardada sigue disponible.

Amplía un destino con un capítulo versionado e identificadores estables de misiones y ejercicios. Un video futuro en primera persona puede usar un nuevo tipo de paso y un identificador de recurso incluido localmente. Incluye subtítulos, un punto de guardado y una alternativa de texto con el mismo objetivo.
