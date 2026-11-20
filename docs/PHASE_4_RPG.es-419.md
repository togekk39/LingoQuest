# Fase 4 de los fundamentos del RPG

[English](PHASE_4_RPG.md)

## Revisión de la arquitectura

La fase 4 parte de `origin/main` en `1932bda`.

| Cambio en main     | Punto de integración                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR #12 (`198c884`) | El cuaderno ilustrado de viaje aporta los marcos de papel, las ilustraciones de la plaza y la parada, los retratos, la tipografía compartida, el atlas y el pasaporte.                                                                                              |
| PR #13 (`5633029`) | El capítulo 1 tiene objetivos explícitos de aprendizaje, expresiones alternativas, niveles de ayuda, práctica de transferencia y repaso adaptativo. Las 32 lecciones del curso original y los 13 rangos de desafíos conservan sus accesos y avances independientes. |
| PR #14 (`9477e07`) | Android usa el servicio de reconocimiento elegido, con preferencia por el procesamiento en el dispositivo y un aviso sobre el proveedor. Se puede continuar sin micrófono. La coincidencia de la transcripción permite completar la actividad oral.                 |
| PR #15 (`1932bda`) | El módulo de audio del capítulo reproduce en secuencia las frases de diálogo, los ejemplos gramaticales y el vocabulario. El reproductor local puede recurrir a los audios de referencia incluidos con el capítulo.                                                 |

[Componentes del cuaderno](UI_JOURNAL.es-419.md) · [Voz y almacenamiento sin conexión](OFFLINE_EDITION.es-419.md)

El atlas en `travel-route.ts` describe 20 etapas. `travel-curriculum.ts` define sus objetivos y requisitos previos, y `travel-content.ts` contiene las tres lecciones jugables de _La primera postal_. La secuencia cubre los saludos y las presentaciones en la plaza, la ubicación de la parada junto al parque y la identificación de la mochila de Sam mediante su dueño y su color. La guía de viaje comparte los datos del atlas y sus requisitos previos.

`TravelFlow` muestra los pasos de cada lección. `travel.ts` restaura las lecciones activas o en pausa por ID de paso y conserva los borradores y las ayudas. El motor local guarda los intentos, la evidencia en `travelLearning`, los XP, las fechas de finalización y los sellos en el mismo registro con escrituras en serie. `travel-review.ts` usa esa evidencia para elegir repasos pendientes, prácticas para corregir errores o ejercicios de transferencia. La versión web usa almacenamiento local y un service worker de producción para guardar el código y los archivos multimedia en caché. Android guarda una fila de estado en SQLite e incluye el curso y los archivos multimedia en la app. Los respaldos del formato 2 conservan el avance entre instalaciones. [Arquitectura de viajes](TRAVEL_ARCHITECTURE.es-419.md) · [Evidencia adaptativa](PHASE_3_ADAPTIVE_LEARNING.es-419.md)

## Plan de implementación

1. **4A · Motor del RPG.** Crear un motor que aplique las transiciones a partir de datos, con ID estables para escenas, elementos interactivos, personajes, diálogos, misiones y objetos. Guardar las decisiones, la adquisición y el uso de objetos, los objetivos de las misiones, las recompensas, la escena y el encuentro activo en una sección opcional `StoryState` con su propia versión dentro del formato 2. Comprobar requisitos previos en el motor local y usar el número de turno guardado para manejar acciones duplicadas o antiguas. Probar las ramas, la entrega única de recompensas y la restauración del estado.
2. **4B · Capítulo 1.** Crear escenas para la plaza, la parada y objetos perdidos. Usar el boleto para ubicar dónde para el bus de las ocho. Permitir que se sigan distintas pistas al perderse la mochila y que se devuelva el objeto correcto. Conectar cada encuentro de aprendizaje a los puntos de guardado de las lecciones existentes y otorgar el sello del pasaporte al completar la misión mediante el flujo habitual. Mostrar el origen de la persona en la escena, el diálogo y el pasaporte existente. Ambas rutas de la historia usan las mismas actividades de inglés y reglas de evaluación.
3. **4C · Validación.** Probar las dos ramas de la historia, las interrupciones en escenas y lecciones, la restauración del formato 2, los intentos de repetir recompensas y los flujos existentes de evaluación y repaso. Jugar la versión web compilada sin conexión después de su primera carga completa en caché. Compilar las versiones web y Android y registrar por separado los resultados de la compilación nativa y de las pruebas en dispositivos físicos. Usar el protocolo de estudio existente para medir si las personas pueden aplicar el inglés después de la aventura. [Evaluación del capítulo 1](CHAPTER_1_ASSESSMENT.es-419.md)

El avance de la historia registra resultados narrativos. Los intentos enviados desde las pantallas de lecciones y repaso aportan evidencia de aprendizaje con el nivel de ayuda que se utilizó. El lector original de misiones sigue disponible para practicar directamente.
