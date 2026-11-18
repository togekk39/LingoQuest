# LingoQuest offline course pack v2

[Español (Latinoamérica)](README.es-419.md)

A `.lqp.json` file is UTF-8 JSON with lessons based on real situations, offline grading rules, pronunciation text, branching scenarios, and 13 challenge levels. The app bundles the complete base pack for the first launch without a network connection or login. Users can download updates from GitHub or import them with the system file picker.

This edition focuses on small text-based courses. It makes no external media requests and supports JSON only, without OBB files, ZIP extraction, code execution, or arbitrary paths. The size limit is 4 MiB. `assets` is empty by default. Media added later must include Base64 data, MIME type, source, and license. Audio and illustration references must resolve to packaged assets of the matching type. When reference audio is unavailable, the interface must say so. Local recording and replay work independently of course audio.

## Data format

```text
manifest
  format: "lingoquest-course-pack"
  schemaVersion: 2
  packageId: stable course ID
  version: course content version (for example, 2.0.0)
  minAppVersion: minimum app version (currently 1.3.0)
  titleEs / locale: es-419 / targetLanguage: en-US / createdAt
  sha256: checksum of the canonical manifest (excluding sha256) and payload
payload
  units / lessons / challengePools / challengeLevels
  placementQuestions / missions / speechDrills / contentStatus / assets
lesson
  id / unitId / order / cefr / title / objectiveEs / contextEs / estimatedMinutes
  vocabulary: id / en / es / partOfSpeech / example / status (new or review)
  grammar: skillId / prerequisiteSkillIds / explanationEs / examples / taughtForms
  dialogue: speaker / en / es / glosses
  stages: goal → vocabulary → grammar → dialogue → practice → speaking → recap
  exercises: explicit type, answers, feedback, difficulty, vocabularyIds, dimension
  review: vocabularyIds / skillIds
```

The `vocabulary` and `practice` stages use `exerciseIds` to reference lesson exercises. Assign each exercise once. The vocabulary stage starts with `meaning`, `matching`, or multiple-choice recognition. Later exercises can use fill-in-the-blank, reordering, error correction, and short responses. In `matchingPairs`, English is on the left and Spanish on the right. The answer's `matches` maps left-side IDs to right-side IDs.

Every exercise must set `dimension` to `vocabulary_recognition`, `vocabulary_recall`, `grammar_understanding`, or `grammar_production`. Choice and matching exercises cannot supply evidence of independent production. Vocabulary exercises reference the practiced words through `vocabularyIds`. Grammar exercises use `skillId`. These tags let the local engine accumulate evidence separately from lesson completion, XP, and challenge level.

## Authoring validation

- The strict Zod schema rejects unknown fields, missing translations or answers, blank text, incompatible schema or app versions, and content above the size limit.
- Reference validation rejects duplicate IDs, unknown lessons, skills or vocabulary, grammar prerequisites that have yet to be taught, incorrect lesson order, missing exercises, and incorrectly ordered stages.
- Option IDs must agree with the correct answers. Validation rejects duplicate or equivalent options that differ only by punctuation or capitalization, duplicate matching content, and answers that cannot be assembled from the available word chunks.
- English in prompts, readings, word chunks, English options, and written answers must be taught in the current or an earlier lesson through `vocabulary` or `grammar.taughtForms`, or have a Spanish meaning supplied by the exercise's `contextualGlosses`. Declare names of people and places in `properNames`. Mark Spanish options with `optionsLanguage: es`.
- Review vocabulary uses the original ID, identical English and Spanish text, and `status: review`. The validator rejects unknown IDs marked for review.
- Challenge exercises must declare `requiredLessonIds` and limit skills and vocabulary to what those lessons teach collectively. The engine checks that the learner completed those lessons.
- Media references must point to an entry in `assets` of the correct type with source and license information.

Validation catches mechanically detectable errors. Translation quality, teaching difficulty, and natural context require human language and teaching review. Passing tests leaves `draft_needs_human_review` in place.

## Checksums and provenance

`canonicalStringify()` sorts object keys and preserves array order. SHA-256 covers the UTF-8 bytes of the resulting `{manifest, payload}` object with `sha256` omitted from the manifest. The catalog records the full release file size and checksum, and the `.sha256` file records the checksum of the raw release bytes. Direct import verifies the internal checksum and content without fetching the catalog in the background.

SHA-256 verifies integrity. Trust in the author depends on the HTTPS GitHub source chosen by the user. Packs contain data only, with no JavaScript, SQL, plugins, or arbitrary execution hooks. Validation rejects prototype keys and overly deep objects.

## Versions and development data

Version 2 introduces breaking changes to the curriculum and data format. The app supports v2 packs and one curriculum. It keeps old development progress until the user confirms a reset, with no automatic migration. Format 1 backups cannot be restored into v2. See [the development data reset instructions](../../README.md#development-data-reset).

Progress, XP, vocabulary and grammar evidence, and challenge results are stored separately on the device, outside the pack. Keep IDs stable across updates to the new curriculum. The app validates a pack before activating it and keeps current content and data if import fails. Offline answers are stored on the device and support personal practice only. Online rankings, official grades, and tamper-proof badges are outside that scope.

## Public API

- `parseCoursePack(text, appVersion?)` checks size, parses the pack, and validates schema, references, vocabulary, minimum app version, and checksum.
- `createCoursePack(payload, metadata)` creates a validated pack.
- `serializeCoursePack(pack)` produces reproducible canonical JSON with a trailing newline.
- `validateReferences(payload)` checks content relationships for authoring tools.
- `compareVersions(a, b)` compares three-part numeric versions.
- `parseCourseCatalog(text)` checks catalog size, duplicate versions, and HTTPS GitHub URLs.
- `sha256Hex()` and `utf8Bytes()` are portable implementations with no Node, paid native service, or network dependency.
