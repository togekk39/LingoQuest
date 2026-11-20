# Currículo de viaje de la fase 3

[English](PHASE_3_CURRICULUM.md)

La ruta introduce el inglés estadounidense con veinte situaciones de viaje que aumentan de dificultad. Los niveles indican la meta de las actividades. El sello registra el progreso de la historia. Para evaluar el dominio del inglés se necesita una evaluación aparte con evidencia independiente en las distintas habilidades a lo largo del tiempo.

## Ruta de los primeros contactos a las metas de B2

El primer capítulo ya se puede jugar como lección de la fase 3. Las paradas 2 a 20 especifican objetivos y tareas previstas para aplicar lo aprendido. Aún faltan redactar y validar las lecciones completas, las voces y las evaluaciones de esas paradas. El curso A1–A2 sigue disponible en **Aprender → Cursos A1–A2** con su propio avance de lecciones y desafíos.

|                                        Parada | Nivel      | Misión y objetivo de aplicación                                                                                                                            | Material previo para retomar                                                  |
| --------------------------------------------: | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1. Lugar de origen, Latinoamérica y el Caribe | Desde cero | Recibe a Sam, ubica la parada de bus e identifica una mochila perdida. Presenta a otra persona, invierte el punto de referencia e identifica otra mochila. | Sin requisitos de inglés                                                      |
|                           2. Ciudad de México | A1         | Lee un horario del barrio, explica rutinas y horas, y adapta la visita al mercado para alguien que acaba de llegar.                                        | Presentaciones y ubicaciones                                                  |
|                                  3. Cartagena | A1         | Usa un menú para pedir y confirmar alimentos, cantidades y sustituciones cuando se acabe un ingrediente.                                                   | Saludos, pertenencia y rutinas                                                |
|                                      4. Cusco | A1         | Pregunta por una salida pasada y reconstruye una visita al mercado a partir de dos relatos.                                                                | Horas, preguntas de ubicación y colores                                       |
|                                   5. Salvador | A1         | Coordina un almuerzo y cuenta qué está haciendo cada persona. Aplica la secuencia al preparar un juego de mesa.                                            | Rutinas, cantidades y pertenencia                                             |
|                                 6. Valparaíso | A2         | Haz un plan, ofrece ayuda y sugiere otra hora para reunirse tras una cancelación.                                                                          | Horas, pedidos y ubicaciones                                                  |
|                                      7. Miami | A2         | Comparte experiencias y confirma los preparativos. Pasa de un inventario de equipaje a la preparación de un picnic.                                        | Hechos y preguntas en pasado, pertenencia                                     |
|                                 8. Nueva York | A2         | Compara rutas accesibles y explica tu elección. Aplica el mismo razonamiento a otros requisitos de un trabajo o servicio.                                  | Ubicaciones, horas y experiencias                                             |
|                                    9. Toronto | A2         | Confirma requisitos, llena un formulario e inscribe a alguien en otra actividad con condiciones distintas.                                                 | Presentaciones, pedidos y horas                                               |
|                                   10. Londres | B1         | Interpreta avisos de interrupción y prepara otra ruta cuando cambie un segundo servicio.                                                                   | Preguntas de ubicación, decisiones y comparaciones                            |
|                                     11. París | B1         | Recomienda una exposición con razones y luego adáptala a otro público u otra actividad.                                                                    | Preferencias, razones y comparaciones                                         |
|                                      12. Roma | B1         | Explica un problema de alojamiento y negocia una solución. Resuelve un error parecido en una reserva de transporte.                                        | Hechos en pasado, pertenencia y planes alternativos                           |
|                                  13. El Cairo | B1         | Interpreta una condición y transmite instrucciones tras un cambio en la visita del grupo.                                                                  | Requisitos, secuencias y planes alternativos                                  |
|                                  14. Singapur | B1         | Describe la duración de los síntomas y confirma indicaciones en dos consultas simuladas.                                                                   | Confirmación de datos, experiencias y transmisión de instrucciones            |
|                                     15. Tokio | B1         | Pregunta si puedes tomar fotos, maneja una respuesta condicional y pide permiso para grabar audio en otro lugar.                                           | Pedidos, negociación y condiciones                                            |
|                                    16. Hobart | B2         | Compara riesgos del pronóstico y justifica una ruta con límites. Ajusta la ruta al recibir un aviso nuevo.                                                 | Avisos, condiciones y comparaciones                                           |
|                                17. Wellington | B2         | Resume observaciones y respalda una propuesta de conservación. Adáptala a un lugar con otros límites.                                                      | Descripciones relativas, costos y beneficios, transmisión de instrucciones    |
|                                   18. Nairobi | B2         | Negocia responsabilidades y documenta decisiones. Reasigna funciones si alguien del equipo no puede asistir.                                               | Requisitos, confirmación y propuestas matizadas                               |
|                           19. Ciudad del Cabo | B2         | Separa hechos y opiniones y sintetiza testimonios. Revisa tu síntesis cuando llegue un relato contradictorio.                                              | Observación, razones y decisiones                                             |
|                   20. Antártida desde Ushuaia | B2         | Interpreta protocolos, presenta un informe, responde preguntas y modifica el plan ante una situación nueva en la expedición.                               | Síntesis de fuentes, costos y beneficios, negociación de roles y confirmación |

## Dependencias entre habilidades

[`travel-curriculum.ts`](../packages/offline-engine/src/travel-curriculum.ts) es la fuente del currículo. Cada parada tiene objetivos propios de vocabulario, gramática, comprensión oral, comprensión lectora, escritura y conversación con práctica de pronunciación. Cada concepto tiene un ID estable, un nombre para estudiantes en español e IDs de conceptos previos. La etapa registra los conceptos que introduce en orden de dependencia, los conceptos de etapas anteriores que retoma y una tarea de aplicación en un contexto nuevo.

La primera parada enseña **saludo → presentación → pertenencia de un objeto** y **pregunta de ubicación → ubicación → descripción de un objeto**. La siguiente etapa retoma la presentación para hablar de rutinas y la ubicación para los horarios. Cartagena retoma la pertenencia junto a los artículos y las cantidades. Una dependencia más larga va de la ubicación y la hora a los avisos, las condiciones y la comparación de riesgos, y llega al protocolo final. Cada concepto puede contribuir a más de una habilidad. Cada actividad especifica la habilidad que practica.

Los requisitos previos orientan la planificación de niveles y progresión. El primer capítulo conserva la evaluación opcional del punto de partida y la secuencia de desbloqueo. Las misiones anteriores y el estudio directo siguen disponibles en la app. Para retomar material A1–A2, consulta los enlaces `unitId` en [la ruta](../packages/offline-engine/src/travel-route.ts) y conserva los IDs anteriores para mantener el historial de las lecciones. Adapta los ejemplos elegidos como tareas con un propósito de viaje, varios contextos y evidencia explícita. Las pruebas unitarias validan la cobertura de conceptos, el orden de los requisitos y la consistencia entre etapas, actividades y ejemplos.

## Secuencia de aprendizaje del primer capítulo

| Misión                       | Situación e instrucción                                                                                                 | Práctica guiada y evocación                                                                                                         | Uso independiente y aplicación                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Un saludo en la plaza**    | Sam se presenta. Las tarjetas y los bloques comparan `I am` y `My name is`.                                             | Identifica un saludo, ordena una frase y recupera el saludo de memoria.                                                             | Escribe una tarjeta de bienvenida y presenta a Nico en un puesto de fotos. Saluda a Sam como Luz y comprueba la frase reconocida.         |
| **El bus de las ocho**       | Sam busca una parada. Lee y escucha la pregunta y la respuesta como diálogo.                                            | Identifica el lugar a partir del audio, ordena una respuesta, transcribe una indicación corta y recuerda cómo formular la pregunta. | Usa la parada como referencia y explica cómo llegar al parque.                                                                            |
| **Una mochila y una postal** | Sam y Luz dejan mensajes sobre dos mochilas. Los ejemplos contrastan el color después de `is` y antes de un sustantivo. | Lee para identificar un color y reconoce a la dueña con `My bag`.                                                                   | Confirma el color de la mochila de Sam y contesta en otro puesto sobre la de Luz. Puedes escuchar, imitar, grabar y repetir la respuesta. |

Las tareas cortas de seguimiento retoman los mismos conceptos en la recepción de un alojamiento, en un registro para fotos o dibujo, en una reunión del barrio, en un mercado o en otras oficinas de objetos perdidos. Las indicaciones de refuerzo abordan omisiones recurrentes de sujeto o verbo, formas de `be`, artículos, preposiciones y orden de palabras. La clasificación también contempla tercera persona, tiempo verbal y falsos amigos para los capítulos futuros. Usa contrastes redactados como `she works` / `she work` o `actually` / `currently` cuando la lección ya haya explicado esas diferencias. Los tipos de error son hipótesis sobre la respuesta y conviene basarlos en un contraste preciso.

Cada actividad oral ofrece un modelo y la opción de omitirla sin usar el micrófono. Los intentos de reconocimiento compatibles guardan audio temporal para la comparación. El estudio con estudiantes sigue el [plan de evaluación del primer capítulo](CHAPTER_1_ASSESSMENT.es-419.md).

### Ritmo estimado

| Misión           | Historia, enseñanza y tarjetas | Pasos con calificación | Paso oral opcional | Primera visita estimada |
| ---------------- | ------------------------------ | ---------------------- | ------------------ | ----------------------- |
| Plaza            | 3 pasos y 3 tarjetas, 3–4 min  | 5 pasos, 3–5 min       | 1 paso, 1–2 min    | 7–11 min                |
| Parada           | 3 pasos y 3 tarjetas, 3–4 min  | 5 pasos, 4–6 min       | —                  | 7–10 min                |
| Objetos perdidos | 3 pasos y 3 tarjetas, 3–4 min  | 4 pasos, 3–5 min       | 1 paso, 1–2 min    | 7–11 min                |

El capítulo tiene 25 pasos y nueve tarjetas de vocabulario dentro de los pasos de enseñanza. El cálculo de 21–32 minutos incluye lectura, repetición del audio, respuestas guiadas y escritas, retroalimentación y un ensayo oral breve. El tiempo se estimó a partir de las tareas y queda por medir con principiantes. Los reintentos y repasos adicionales pueden alargar la sesión. Cada escena, tarjeta y respuesta cuenta con un punto de guardado. Es posible pausar entre actividades o mientras escribes y continuar a tu ritmo. Los intervalos que se muestran corresponden a la misión completa.

## Formato de autoría

[`travel-content.ts`](../packages/offline-engine/src/travel-content.ts) contiene el capítulo y los ejercicios relacionados. Un `TravelChapter` identifica la parada, la revisión del contenido, las recompensas y las misiones. Cada misión tiene ID estable, situación, objetivo concreto y consecuencia de cumplirlo, un intervalo estimado en minutos, vocabulario y pasos ordenados. Cada palabra incluye significado y nota de uso en español, categoría gramatical y ejemplo bilingüe en contexto.

| Paso       | Datos de autoría                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dialogue` | Un personaje conocido, el contexto en español y, si aplica, una frase bilingüe.                                                                                                                                           |
| `teach`    | Una explicación breve, ejemplos en inglés con traducciones y, si aplica, `patterns` con cada bloque identificado y alineado por posición con el ejemplo. Los bloques juntos forman el ejemplo en inglés que se reproduce. |
| `exercise` | Una situación, el `CourseExercise` compartido con respuestas aceptadas y retroalimentación y, si aplica, pista, apoyo visual o audio con transcripción. El dictado usa `short_text` con audio.                            |
| `speak`    | Una frase modelo, una situación, variantes aceptadas cuando corresponda y un objetivo oral.                                                                                                                               |

En ejercicios con calificación, guarda las respuestas y los patrones de error en el objeto privado del motor local. En la pantalla se ve la consigna pública. La retroalimentación aparece al enviar la respuesta. Acepta contracciones, formas completas y alternativas naturales que cumplan el propósito. Una consigna abierta usa una lista de respuestas redactadas. Evita una pregunta con demasiadas respuestas válidas para la lista.

Incluye en `acceptedAnswers` las respuestas que cumplen tanto el propósito comunicativo como el objetivo lingüístico de la consigna. Si una respuesta natural resuelve la situación con otra forma, agrégala a `communicationOnly.answers` con una explicación que reconozca el mensaje y aclare la forma que se practica. Por ejemplo, alguien puede identificar una mochila por el color en una respuesta que omite la oración completa solicitada. En el dictado, las variantes deben representar las palabras que se oyeron y respetar las convenciones habituales de ortografía y puntuación. [Revisión de actividades del capítulo 1](CHAPTER_1_CONTENT_AUDIT.es-419.md)

```ts
learning: {
  conceptId: 'introduction',
  skill: 'writing',
  evidence: 'transfer',
  contextId: 'photo-signup',
  errors: ['subject_omission', 'be_omission', 'be_agreement', 'word_order'],
}
```

Usa `evidence` para representar el trabajo cognitivo que exige la consigna. Marca `guided: true` si los bloques, el texto visible u otro apoyo ya dan parte de la solución y limitan la respuesta. Reutiliza el ID del concepto para un ejemplo nuevo. Cambia `contextId` cuando la actividad plantee otra situación e incluye los ejercicios extra de repaso y refuerzo en `travelPracticeSteps`. Usa `remediates` para asociar una actividad de seguimiento con un tipo de error. Cuando hay un repaso más adelante, el motor registra esa evidencia aparte de la actividad inmediata. [Diseño de aprendizaje adaptativo](PHASE_3_ADAPTIVE_LEARNING.es-419.md)

Conserva los IDs de misiones, ejercicios y pasos. Agrega una migración de la revisión si cambias el orden de pasos con avances guardados. Asigna un ID nuevo a una consigna nueva. Verifica que las frases de enseñanza y escucha en inglés tengan una copia incluida en `apps/mobile/src/travel/audioClips.ts`. Incluye siempre una transcripción para accesibilidad. El service worker guarda los medios en la caché de Web y las instalaciones de Android los incluyen para usarlos sin conexión.
