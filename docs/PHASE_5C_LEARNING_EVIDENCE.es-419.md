# Evidencia de aprendizaje de la fase 5C

[English](PHASE_5C_LEARNING_EVIDENCE.md)

Un evento de evidencia registra un identificador estable de envío, el objetivo canónico y su dimensión, el origen, los identificadores del material y el ejercicio, la versión, el contexto, el formato, la actividad, el resultado cuando corresponde, los apoyos usados, si fue un reintento, si fue autónomo y el momento. Un evento puede describir varios objetivos previstos en el material. Reenviar el mismo identificador conserva el evento original y su efecto. Si se vuelve a usar un ejercicio en menos de 24 horas, queda marcado que la respuesta estuvo disponible. [Modelo y cálculo](../packages/offline-engine/src/learning-evidence.ts)

## Progresión

| Estado             | Evidencia mínima                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin presentar      | Aún falta evidencia que cuente para ese objetivo y dimensión. También es el punto de partida si el dato migrado solo incluye fecha de repaso. |
| Presentado         | Se mostró una actividad de enseñanza prevista en el material.                                                                                 |
| Práctica guiada    | El estudiante respondió con apoyo, intentó una actividad que dio evidencia utilizable o practicó la expresión oral con un modelo visible.     |
| Respuesta autónoma | Una respuesta correcta en la forma objetivo, sin apoyos registrados, en una tarea que puede medir esa dimensión.                              |
| Dominio inicial    | Respuestas correctas en la forma objetivo en dos actividades distintas como mínimo, en esa dimensión.                                         |
| Retención          | Después del dominio inicial, una respuesta autónoma correcta al menos 24 horas después de la anterior, con una actividad distinta.            |
| Transferencia      | Después del dominio inicial, una respuesta autónoma correcta en una tarea nueva diseñada para medir transferencia en un contexto nuevo.       |

La comprensión auditiva, la lectura, la escritura, la expresión oral, el reconocimiento y recuerdo de vocabulario, y la comprensión y producción de gramática tienen registros separados. La transferencia describe el desempeño en otro contexto dentro de la dimensión evaluada. Por ejemplo, escribir `My name is Ana.` puede aportar evidencia de escritura para `home.introduce`. La expresión oral queda sin verificar hasta que tenga su propia evidencia. Una pregunta evaluada de opción múltiple puede aportar evidencia en la dimensión que mide, como máximo un paso en una primera respuesta correcta. Ver un modelo, leer una escena, elegir diálogos preparados, completar una misión y ganar una recompensa son actividades de exposición o de avance. [Relación de objetivos](PHASE_5C_LEARNING_ARCHITECTURE.es-419.md)

## Evaluación y apoyos

| Resultado            | Efecto sobre la evidencia                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `target`             | La respuesta cumple con la forma objetivo. Los apoyos o las repeticiones pueden hacer que cuente como práctica guiada. |
| `communication_only` | La idea se entiende. Se registra un éxito de comunicación y se conserva la forma objetivo para el repaso.              |
| `incorrect`          | El intento puede adelantar el repaso y registrar un error específico. Se conserva el historial previo verificado.      |
| `ungradable`         | La evidencia registra la actividad que se intentó. Aún falta una evaluación justa de la habilidad.                     |

Las pistas, traducciones, transcripciones, modelos, apoyos, palabras para ordenar y reintentos influyen en la autonomía. El cálculo también comprueba si una práctica reciente ya mostró la respuesta a la misma consigna. El diagnóstico toma una muestra del punto de partida del estudiante para recomendarle una ruta. El dominio de los objetivos conserva el estado anterior al diagnóstico. Las partidas repetidas de desafíos conservan su historial. Cada ejercicio de desafío aporta al dominio como máximo una vez por objetivo y dimensión. [Evaluación compartida](../packages/contracts/src/answer-grading.ts) · [Reglas de repaso](PHASE_5C_ADAPTIVE_REVIEW.es-419.md)

## Práctica oral

Android permite grabar una frase en el dispositivo para escucharla y compararla. El servicio opcional de voz de Android o del navegador devuelve las palabras reconocidas. La app compara esas palabras con el ejemplo visible o con el criterio previsto para la presentación. El registro distingue el resultado sobre el contenido reconocido de la existencia de una grabación. El texto y el audio quedan fuera del registro. La interfaz muestra la transcripción y los comentarios sobre el contenido por separado de la reproducción. La calidad de la pronunciación y la comunicación espontánea quedan sin verificar y requieren una evaluación adecuada. [Interfaz oral](../apps/mobile/src/features/SpeakingPractice.tsx) · [Evidencia oral local](../packages/offline-engine/src/speech-learning.ts)
