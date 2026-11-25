# Arquitectura de aprendizaje de la fase 5C

[English](PHASE_5C_LEARNING_ARCHITECTURE.md)

La historia, las lecciones, el repaso adaptativo, el refuerzo, el diagnóstico, los desafíos y la práctica oral registran evidencia mediante `OfflineEngine` en el dispositivo. El desempeño, la retención y la transferencia se calculan por separado para cada objetivo canónico y dimensión. En los ejercicios evaluados, el motor actualiza la evidencia y el punto guardado o el avance asociado en la misma operación serializada. Conserva los estados de historia, lección y desafío para las pantallas que los usan. [Motor](../packages/offline-engine/src/index.ts) · [Reglas de evidencia](PHASE_5C_LEARNING_EVIDENCE.es-419.md)

## Registro canónico

El registro reutiliza los identificadores de las anotaciones de prerrequisitos de la fase 5B, del curso publicado y de los metadatos de ejercicios de Casa. También registra las acepciones de vocabulario, las formas enseñadas, los identificadores de gramática y las categorías de las 40 prácticas orales. Un conjunto pequeño de alias explícitos une objetivos equivalentes. Los identificadores de lecciones, ejercicios, desafíos e historia siguen identificando sus materiales y puntos guardados originales. [Registro](../packages/offline-engine/src/learning-registry.ts) · [Anotaciones de prerrequisitos](curriculum/prerequisite-annotations.es-419.md)

| Objetivo de Casa               | Identificador canónico                | Dónde se usa la relación                                                                                                       |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Saludar                        | `home.greeting-word`                  | Enseñanza en Casa, reconocimiento de saludos y acepciones equivalentes en el curso.                                            |
| Presentarte                    | `home.introduce`                      | Escritura y expresión oral en Casa, la estructura y presentación escrita de `u01_l01`, el repaso y las actividades opcionales. |
| Preguntar dónde queda un lugar | `home.ask-location`                   | Cómo pedir direcciones en Casa y las tareas relacionadas de comprensión auditiva y escritura.                                  |
| Describir dónde está algo      | `home.adjacency`                      | Tareas de ubicación en Casa y la acepción de `next to` del curso.                                                              |
| Describir un bolso             | `home.ownership`, `home.statement-be` | Pertenencia y descripción en Casa, la estructura relacionada del curso y la práctica oral de colores en Casa.                  |

Para ampliar el registro, identifica primero la acepción, la forma, la construcción o la habilidad existente. Usa alias solo para expresiones que evalúan el mismo conocimiento. Indica la dimensión de cada tarea y conserva el identificador y la revisión del material. Al crear un acceso nuevo, usa las secuencias reales de enseñanza y los prerrequisitos de la fase 5B. El registro en la app puede indexar las 32 lecciones publicadas y las actividades instaladas. Los demás objetivos de Pre-A1–B2 requieren enseñanza, tareas evaluables y verificación. [Auditoría de la fase 5B](PHASE_5B_CONTENT_AUDIT.es-419.md)

Las tarjetas de viaje publicadas usan sus identificadores de tarjeta y etapa para guardar evidencia de enseñanza y comprensión guiada. Sus modelos de autocorrección cuentan como exposición. Al registrar el evento, el motor local resuelve la tarjeta y la respuesta correcta con la revisión instalada. [Evidencia de tarjetas de viaje](../packages/offline-engine/src/chapter-card-learning.ts)

## Prerrequisitos de enseñanza

Un evento de enseñanza formal registra en `teaches` los prerrequisitos exactos de la fase 5B que se cubrieron. Cada referencia incluye un identificador estable del conocimiento y, para un término o una estructura, la forma enseñada. El motor resuelve las equivalencias previstas en el material y puede distinguir entre enseñar la acepción visual de `see` y enseñar la forma `saw` para esa acepción. Los registros corresponden a la secuencia que presenta esas formas en las lecciones, en Casa y en el repaso. Una vista previa, un recurso de consulta, una pista, una traducción, una respuesta de diagnóstico o un total importado pueden aportar exposición u orientación. La etapa formal prevista en el material acredita el prerrequisito. Los eventos anteriores de Casa que identifican una etapa formal reconocida conservan ese crédito. [Anotaciones de prerrequisitos](curriculum/prerequisite-annotations.es-419.md) · [Registros de enseñanza](../packages/offline-engine/src/learning-prerequisites.ts)

## Progreso compartido e identidad del estudiante

Las lecciones pueden ofrecer un atajo en un ejercicio si los objetivos que evalúa están demostrados en sus dimensiones correspondientes, la evidencia está vigente y se cumplen los prerrequisitos aplicables. La lección sigue disponible y la etapa oral se puede practicar de forma independiente. La historia conserva sus encuentros, recompensas del pasaporte y puntos guardados. El jugador usa su propio nombre o un nombre de práctica al presentarse. Un nombre de práctica confirmado es local al flujo de aprendizaje. Sam y Luz mantienen sus papeles como personajes distintos. [Reglas de estudio](../packages/offline-engine/src/study-learning.ts) · [Evaluación de presentaciones](../packages/contracts/src/introduction.ts)

Las lecciones resumen cada habilidad con el conjunto completo de objetivos evaluables requeridos para esa lección. El resumen usa cinco estados. [Cálculo del estado](../packages/offline-engine/src/study-learning.ts)

| Estado                | Evidencia de la habilidad                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Por comprobar         | La habilidad aún no tiene una respuesta evaluada que aporte evidencia.                                                                      |
| En práctica           | Hay respuestas evaluadas que aportan evidencia y aún falta demostrar un objetivo.                                                           |
| Dominio parcial       | Se demostraron algunos objetivos requeridos. **Dominio parcial (N de M objetivos)** indica cuántos del total.                               |
| Objetivos demostrados | Se demostraron todos los objetivos evaluables requeridos. La interfaz muestra **1 objetivo demostrado** o **N de N objetivos demostrados**. |
| Por repasar           | La evidencia de un objetivo relevante señala una dificultad o llegó su fecha de repaso.                                                     |

Cada habilidad tiene su propio conteo de objetivos. El recuerdo de vocabulario y la práctica oral tienen registros propios. Si una lección carece de una tarea oral evaluable, la expresión oral queda por comprobar aunque se demuestre la escritura.

## Persistencia en el dispositivo

El modelo de estado acepta la estructura anterior, conserva su avance, recompensas, intentos y borradores, y migra las fechas de repaso a objetivos y dimensiones canónicas cuando encuentra una correspondencia. Los contadores históricos quedan en el registro original y la habilidad que solo tenga totales anteriores queda sin verificar. La copia de respaldo local incluye la evidencia nueva, la programación del repaso y el archivo compacto de práctica. El archivo conserva el texto elegible y su versión para el repaso de lecciones visitadas. Los ejercicios de audio e imagen instalados pueden seguir usando sus paquetes de capítulo. [Migración y archivo](../packages/offline-engine/src/learning-persistence.ts)

Al restaurar se reúnen los comentarios de los desafíos y las huellas de los envíos en `challengeHistory`. La partida activa con temporizador y su registro de solicitudes se reinician en la restauración. Los mejores puntajes y niveles aprobados siguen disponibles como logros históricos. Al iniciar una partida nueva, se comprueban los requisitos vigentes de avance, enseñanza formal y práctica autónoma de la modalidad y el nivel elegidos. [Historial de desafíos](../packages/offline-engine/src/learning-persistence.ts) · [Acceso a desafíos](PHASE_5C_ADAPTIVE_REVIEW.es-419.md)

La actualización de paquetes y el guardado del aprendizaje usan registros distintos. El repaso puede leer el material de texto conservado si cambia el catálogo instalado. Las actividades que dependen del audio requieren sus recursos o una voz compatible del dispositivo. La evaluación y la programación principales funcionan sin conexión. El reconocimiento de voz opcional depende del proveedor del dispositivo y puede requerir conexión a internet. Android también ofrece grabación para escucharla en el dispositivo. [Repaso adaptativo](PHASE_5C_ADAPTIVE_REVIEW.es-419.md) · [Validación](PHASE_5C_VALIDATION.es-419.md)
