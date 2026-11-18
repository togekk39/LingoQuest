# Paquete de curso sin conexión de LingoQuest v2

[English](README.md)

Un archivo `.lqp.json` contiene JSON en UTF-8 con lecciones basadas en situaciones reales, reglas de calificación sin conexión, textos de pronunciación, situaciones con ramificaciones y 13 niveles de desafío. La app incluye el paquete base completo para el primer inicio sin conexión ni cuenta. Se pueden descargar actualizaciones desde GitHub o importarlas con el selector de archivos del sistema.

Esta edición se centra en cursos de texto pequeños. No solicita contenido multimedia externo y solo admite JSON, sin archivos OBB, extracción de ZIP, ejecución de código ni rutas arbitrarias. El tamaño máximo es de 4 MiB. `assets` está vacío de forma predeterminada. Si se agregan recursos, deben incluir datos en Base64, tipo MIME, fuente y licencia. Las referencias de audio e ilustraciones deben apuntar a recursos del tipo correspondiente dentro del paquete. Si no hay audio de referencia, la interfaz debe indicarlo. La grabación y reproducción locales funcionan independientemente del audio del curso.

## Formato de datos

```text
manifest
  format: "lingoquest-course-pack"
  schemaVersion: 2
  packageId: identificador estable del curso
  version: versión del curso (por ejemplo, 2.0.0)
  minAppVersion: versión mínima de la app (actualmente 1.3.0)
  titleEs / locale: es-419 / targetLanguage: en-US / createdAt
  sha256: suma del manifiesto canónico (sin sha256) y payload
payload
  units / lessons / challengePools / challengeLevels
  placementQuestions / missions / speechDrills / contentStatus / assets
lesson
  id / unitId / order / cefr / title / objectiveEs / contextEs / estimatedMinutes
  vocabulary: id / en / es / partOfSpeech / example / status (new o review)
  grammar: skillId / prerequisiteSkillIds / explanationEs / examples / taughtForms
  dialogue: speaker / en / es / glosses
  stages: goal → vocabulary → grammar → dialogue → practice → speaking → recap
  exercises: tipo explícito, respuestas, retroalimentación, difficulty, vocabularyIds, dimension
  review: vocabularyIds / skillIds
```

Las etapas `vocabulary` y `practice` usan `exerciseIds` para referirse a ejercicios de la lección. Asigna cada ejercicio una sola vez. La etapa de vocabulario empieza con reconocimiento mediante `meaning`, `matching` u opción múltiple. Después se pueden usar ejercicios para completar espacios, reordenar, corregir errores y escribir respuestas breves. En `matchingPairs`, el inglés va a la izquierda y el español a la derecha. Las respuestas `matches` relacionan identificadores de izquierda a derecha.

Cada ejercicio debe definir `dimension` como `vocabulary_recognition`, `vocabulary_recall`, `grammar_understanding` o `grammar_production`. La opción múltiple y la asociación no aportan evidencia de producción independiente. Los ejercicios de vocabulario identifican las palabras practicadas con `vocabularyIds`. Los de gramática usan `skillId`. Estas etiquetas permiten que el motor local reúna evidencia por separado del avance de las lecciones, los XP y el nivel de desafío.

## Validación del contenido

- El esquema estricto de Zod rechaza campos desconocidos, traducciones o respuestas faltantes, texto vacío, versiones incompatibles del esquema o de la app y contenido que supera el límite.
- La validación de referencias rechaza identificadores duplicados, lecciones, habilidades o vocabulario desconocidos, prerrequisitos gramaticales que aún no se enseñan, lecciones fuera de orden, ejercicios faltantes y etapas fuera de orden.
- Los identificadores de las opciones deben coincidir con las respuestas correctas. Se rechazan opciones duplicadas o equivalentes que solo difieren en puntuación o mayúsculas, contenido de asociación repetido y respuestas que no se pueden formar con los bloques disponibles.
- El inglés de enunciados, lecturas, bloques, opciones y respuestas escritas debe enseñarse en esa lección o en una anterior mediante `vocabulary` o `grammar.taughtForms`, o tener una traducción en `contextualGlosses` del ejercicio. Declara los nombres de personas y lugares en `properNames`. Marca las opciones en español con `optionsLanguage: es`.
- El vocabulario de repaso usa el identificador original, el mismo texto en inglés y español y `status: review`. La validación rechaza identificadores desconocidos marcados para repaso.
- Los ejercicios de desafío deben declarar `requiredLessonIds` y limitarse a las habilidades y palabras que enseñan esas lecciones en conjunto. El motor comprueba que el estudiante las haya completado.
- Las referencias multimedia deben apuntar a un elemento de `assets` del tipo correcto con información de fuente y licencia.

La validación detecta errores comprobables de forma automática. La calidad de las traducciones, la dificultad y la naturalidad del contexto requieren revisión lingüística y pedagógica. Aprobar las pruebas mantiene el estado `draft_needs_human_review`.

## Sumas de verificación y procedencia

`canonicalStringify()` ordena las claves de los objetos y conserva el orden de los arreglos. SHA-256 se calcula sobre los bytes UTF-8 del objeto `{manifest, payload}` resultante, con `sha256` omitido del manifiesto. El catálogo registra el tamaño y la suma del archivo completo, y el archivo `.sha256` registra la suma de los bytes originales. La importación directa comprueba la suma interna y el contenido sin consultar el catálogo en segundo plano.

SHA-256 comprueba la integridad. La confianza en el autor depende de la fuente HTTPS de GitHub elegida por la persona. Los paquetes contienen datos, sin JavaScript, SQL, complementos ni mecanismos de ejecución arbitraria. La validación rechaza claves de prototipo y objetos con demasiados niveles de anidamiento.

## Versiones y datos de desarrollo

La versión 2 introduce cambios incompatibles en el currículo y el formato de datos. La app admite paquetes v2 y un solo currículo. Conserva el progreso anterior de desarrollo hasta que se confirme el restablecimiento y no realiza migraciones automáticas. Los respaldos en formato 1 no se pueden restaurar en la versión 2. Consulta las [instrucciones de restablecimiento](../../README.es-419.md#restablecimiento-de-datos-de-desarrollo).

El progreso, los XP, la evidencia de vocabulario y gramática y los resultados de desafíos se guardan por separado en el dispositivo, fuera del paquete. Conserva los identificadores al actualizar el currículo nuevo. La app valida el paquete antes de activarlo y conserva el contenido y los datos en caso de error. Las respuestas sin conexión se guardan en el dispositivo para la práctica personal. Las clasificaciones en línea, las calificaciones oficiales y las insignias a prueba de modificaciones quedan fuera de ese alcance.

## API pública

- `parseCoursePack(text, appVersion?)` comprueba el tamaño, analiza el paquete y valida el esquema, las referencias, el vocabulario, la versión mínima de la app y la suma.
- `createCoursePack(payload, metadata)` crea un paquete validado.
- `serializeCoursePack(pack)` genera JSON canónico reproducible con un salto de línea final.
- `validateReferences(payload)` verifica las relaciones del contenido para las herramientas de autoría.
- `compareVersions(a, b)` compara versiones numéricas de tres partes.
- `parseCourseCatalog(text)` comprueba el tamaño del catálogo, las versiones repetidas y las URL HTTPS de GitHub.
- `sha256Hex()` y `utf8Bytes()` son implementaciones portátiles sin dependencia de Node, servicios nativos de pago ni red.
