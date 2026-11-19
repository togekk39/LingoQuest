# Aprendizaje adaptativo en la fase 3

[English](PHASE_3_ADAPTIVE_LEARNING.md)

LingoQuest programa la práctica en el dispositivo para cada concepto y habilidad del material. Las seis habilidades son vocabulario, gramática, comprensión oral, comprensión lectora, escritura y expresión oral. En el capítulo 1, la persona reconoce un saludo, lo recuerda sin opciones, escribe una presentación en otra escena y vuelve a usarla días después. Las misiones, los XP, las rachas y los desafíos tienen sus propios registros. El registro de aprendizaje describe la práctica realizada y no certifica un nivel de inglés.

## Evidencia de una actividad

- Cada ejercicio indica el concepto, la habilidad, el tipo de evidencia y el contexto. El reconocimiento y la comprensión tienen sus propios contadores. Recuperar una palabra por escrito, producir una frase completa y aplicar una forma en una situación nueva tienen contadores separados.
- Cada respuesta correcta registra el tipo de evidencia y si hubo ayuda. Los bloques de palabras, el apoyo incluido en la consigna, las pistas, las transcripciones, los reintentos, ver la misma pregunta durante las 24 horas previas y el saludo inicial con ejemplo cuentan como ayuda. Una respuesta puede incluir varios tipos de ayuda.
- La transferencia requiere resolver bien y sin ayuda un ejercicio de aplicación, haber practicado el concepto en un ejercicio anterior y encontrarse en un contexto que aún no se había practicado para ese concepto. Repetir una consigna de transferencia o responderla como primer contacto mide la actividad de base, como comprensión, recuperación o producción. La evidencia de memoria a largo plazo requiere acertar otra vez sin ayuda en esa habilidad, al menos 24 horas después del último ejercicio del concepto en cualquier habilidad. Ambos tipos de evidencia pueden registrarse juntos.
- En expresión oral se registran actividades opcionales como imitar el modelo y hacer una grabación local. Salir, practicar sin micrófono o ver una transcripción no produce evidencia oral evaluada. Identificar el contenido hablado y evaluar la pronunciación requieren métodos distintos. El capítulo 1 no asigna puntajes automáticos de pronunciación ni de dominio oral.
- Las respuestas escritas se comparan con variantes adecuadas para el contexto. La comparación ajusta mayúsculas, espacios, puntuación y apóstrofos tipográficos. Los autores incluyen contracciones comunes y diferentes maneras de responder. El sistema no puede evaluar textos libres de cualquier tipo ni comprobar si expresan una idea equivalente.

## Programación del repaso

Una habilidad evaluada para un concepto empieza con un intervalo de un día. Responder bien sin ayuda, con demora y cuando toca el repaso, aumenta el intervalo entre 1, 3, 7, 14 y 30 días. Una respuesta incorrecta o con ayuda lo regresa a un día. Acertar antes de la fecha mantiene el intervalo. La siguiente fecha se calcula a partir del último intento.

El planificador da prioridad a los errores recurrentes que tienen práctica de refuerzo y luego a los repasos pendientes. A igual prioridad, toma en cuenta el último error y el tiempo transcurrido desde la última práctica. Los ejercicios corresponden al concepto y normalmente a la misma habilidad. Después de acertar sin ayuda, se favorecen ejercicios más exigentes. Si la respuesta fue incorrecta o necesitó ayuda, se busca más apoyo. Se favorecen preguntas y situaciones que no se han usado recientemente. El banco de repasos permite cambiar de escena sin desbloquear otro capítulo. Desde la historia, el repaso puede enfocarse en los conceptos de una misión. En la lista de repasos se puede elegir un concepto y una habilidad.

**Para hoy** muestra los repasos pendientes y el refuerzo disponible. **Todas mis habilidades** incluye la práctica registrada para las seis habilidades. Al comenzar el viaje, se puede abrir un saludo de un solo ejercicio con un ejemplo. La respuesta de esa introducción cuenta como asistida. Cada repaso rápido guarda el borrador, la ayuda y el resultado, para que se pueda salir y volver después.

## Errores y práctica de refuerzo

Los autores pueden asignar una categoría a una opción o respuesta escrita incorrecta. En ejercicios seleccionados el motor también reconoce omisiones, formas de _be_, artículos, preposiciones y problemas de orden cuando la respuesta se parece a una forma esperada. Las categorías contemplan omisión del sujeto, omisión o forma incorrecta de _be_, tercera persona, tiempos verbales, preposiciones, artículos, orden de palabras y falsos amigos. Los ejemplos de tiempos verbales, tercera persona y falsos amigos pueden usar respuestas incorrectas definidas por el autor. Para las demás respuestas se muestra la explicación general del ejercicio.

Dos casos sin ayuda del mismo error en un concepto permiten recomendar el refuerzo preparado. Las repeticiones inmediatas y los reintentos con ayuda reciben una explicación sin contar como un segundo error independiente. Acertar en una práctica guiada puede dar paso a otra consigna. El error deja de estar pendiente cuando se usa la forma correctamente y sin ayuda en ese nuevo ejercicio. Por ejemplo, después de escribir _I is_ en dos borradores, se completa _I ___ Ada_ y luego se redacta una presentación completa para otro grupo. El historial conserva el total de errores.

## Datos y pruebas

`travelLearning.targets` es una sección opcional del respaldo de formato 2. Guarda contadores separados, historial de ejercicios y contextos, categorías de error y fechas de repaso. Los respaldos anteriores conservan el progreso del viaje y del curso. Los ejercicios de viaje visitados pueden orientar los primeros repasos, con los nuevos contadores de evidencia vacíos. Los identificadores de los pasos permiten migrar los puntos guardados de la primera revisión del capítulo, incluido el token activo y el borrador o resultado. Los cambios y la evidencia se guardan en la misma escritura local. El repaso por misión y el repaso por habilidad tienen puntos de guardado independientes.

Ejecuta `npm run test -w @lingoquest/offline-engine` para comprobar la programación, los apoyos, el refuerzo, la migración y la persistencia. Usa las pruebas del navegador para recorrer los pasos del estudiante. Esas pruebas verifican el comportamiento del programa. Para evaluar el aprendizaje real del capítulo 1 se necesitan [formas de evaluación paralelas](CHAPTER_1_ASSESSMENT.es-419.md).
