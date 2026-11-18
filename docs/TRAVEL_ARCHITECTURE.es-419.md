# Arquitectura del viaje de LingoQuest 2.0

[English](TRAVEL_ARCHITECTURE.md)

| Ubicación                                          | Responsabilidad                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/offline-engine/src/travel-route.ts`      | Orígenes, destinos, lugares y objetivos del currículo                                       |
| `packages/offline-engine/src/travel-content.ts`    | Pasos, vocabulario con definiciones y ejemplos, diálogos, gramática, ejercicios y recuerdos |
| `packages/offline-engine/src/travel-placement.ts`  | Seis preguntas diagnósticas opcionales y reglas para elegir la primera misión               |
| `packages/offline-engine/src/travel.ts`            | Disponibilidad de misiones, puntos guardados activos y en pausa, diario y recompensas       |
| `packages/offline-engine/src/travel-challenges.ts` | Configuración activa del capítulo y desafíos opcionales basados en él                       |
| `packages/offline-engine/src/index.ts`             | API local, calificación compartida, repaso espaciado, guardado y respaldos                  |
| `apps/mobile/src/travel`                           | Bienvenida, prueba, inicio, mapa, misiones, guía, pasaporte, repaso rápido y audio incluido |
| `content/source` y `packages/course-pack`          | Fuentes archivadas del curso anterior y validación de LQP                                   |

El viaje comparte las reglas de calificación y repaso sin conexión. La práctica usa identificadores estables de ejercicios y habilidades. El repaso rápido y completo de la app solo selecciona ejercicios del viaje. Los desafíos opcionales se basan en el capítulo y guardan sus resultados por separado. El paquete y el curso anterior siguen archivados, y su historial puede restaurarse como parte de un respaldo de formato 2. La app actual no incluye el curso anterior.

La prueba agrupa preguntas por los objetivos de las tres misiones y recomienda el primer grupo en que aún falta demostrar uno de los dos objetivos. Recomienda la última misión incluso con todas las respuestas correctas. Una pregunta de escucha contestada con ayuda de la transcripción no demuestra comprensión auditiva independiente. Se guardan la recomendación inicial y los prerrequisitos comprobados. La prueba no da XP, avances de misión ni recuerdos. Puedes volver a cualquier misión anterior para practicar.

Cada punto de guardado conserva la versión de la historia, el identificador del paso, el borrador, la devolución, las pistas, la transcripción y el índice de la ficha de vocabulario. Si cambias de misión, se guarda la anterior como pausada. Las respuestas y su evidencia se guardan juntas. La finalización y las recompensas se guardan en una sola escritura, identificadas por misión o capítulo. Android usa una sola fila de SQLite. La web usa almacenamiento local y coordina escrituras entre pestañas cuando dispone de Web Locks. Los campos nuevos del formato 2 son opcionales.

El service worker guarda la app y sus recursos, y admite solicitudes por rangos para los audios incluidos. El vocabulario, los ejemplos, los diálogos y la escucha de la prueba usan la voz local de inglés y la velocidad guardadas. Si elegiste la opción predeterminada y no hay síntesis de voz disponible, se usan los audios incluidos. Si no se puede usar una voz elegida por nombre, se muestra cómo cambiarla. La app ofrece grabación local y reconocimiento de voz opcional con aviso sobre el proveedor.

Agrega un destino con un capítulo versionado e identificadores estables de misiones y ejercicios. Para añadir un video en primera persona, se puede definir un tipo de paso nuevo y un recurso incluido localmente. Incluye subtítulos, un punto de guardado y una alternativa de texto con el mismo objetivo.
