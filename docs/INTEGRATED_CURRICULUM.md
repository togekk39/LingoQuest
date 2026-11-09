# Integrated curriculum authoring and development notes

## Design

The course contains 200 distinct introduced vocabulary items, 68 explicit review appearances and 360 exercises; 67 challenge questions are limited to taught material.

The curriculum is original authored material for an es-419 speaker learning en-US from zero through A2. Eight units contain four lessons each. A lesson has a measurable communication goal, a small introduced vocabulary set, deliberately recycled items, one primary grammar target, bilingual dialogue, supported practice and short output. Vocabulary is taught inside its communicative lesson, rather than as a mandatory separate Unit 0.

The ordered stages are goal, vocabulary, grammar, dialogue, practice, speaking and recap. Recognition and matching appear during vocabulary before spelling/production. New English forms must be introduced in vocabulary, taught grammar forms or explicit bilingual contextual glosses before they are required. Proper names used in short output are supported in context. Translations support authentic language without treating unexplained functional words as prerequisites.

## Data and validation

`content/source` is the only authored curriculum. The builder serializes schema 2 into the bundled pack and versioned release file. `packages/contracts` defines public exercise/lesson types; `packages/course-pack` validates strict complete authoring data and references. The offline engine grades stored answers; the UI never depends on a server.

Lessons contain order, CEFR, objective/context, duration, vocabulary items (ID, en/es, part of speech, usage, new/review), grammar skill/prerequisites/explanation/examples/taught forms, bilingual dialogue with glosses, ordered stages with exercise IDs, exercises with explicit dimension/content links/feedback/difficulty/answers, and review target IDs. Asset references must resolve to declared local assets; currently the new lessons use no audio/image files.

Four evidence dimensions are vocabulary_recognition, vocabulary_recall, grammar_understanding and grammar_production. Evidence is keyed by dimension and target, separated from completed lessons and challenge results. Delayed practice and varied exercise formats are necessary for strong mastery evidence. XP encourages completion and does not define mastery.

Validation tests intentionally inject unknown critical words and invalid links to demonstrate authoring failure. This is a consistency guard, not an automatic pedagogical or grammatical certification. Declaring a gloss must have a real teaching purpose; do not add broad catch-all dictionaries merely to silence validation.

## Unit 1 path

Choose `Empiezo desde cero` → `Me presento` → goal in Spanish → learn hello/hi/goodbye and introduction words → recognize meanings and match → understand I am / You are with explicitly taught am/are → read the supported exchange → complete guided exercises → write a supported self-introduction → optionally record/replay → recap. Return later through `Repasar` for separately labeled vocabulary and grammar evidence.

The next three lessons introduce family/people, descriptions and be questions without assuming the learner already knew the original prototype's teacher/student/from/happy vocabulary.

## Intentional development reset

The original unreleased development progress and backups used format 1. Integrated evidence and curriculum use format 2, under the existing storage key so the app can detect old state. Old state causes an explicit reset-required error and remains untouched. The recovery screen offers a raw local archive export, then a separate destructive-reset confirmation. Archived v1 data is reference-only and cannot be restored into v2. New v2 backups retain their existing export/import/confirm behavior. No migration layer or competing curriculum is retained.

Pack schema 1 installed content falls back to the bundled schema 2 course with a visible recovery notice; learning-state reset is still explicit. New pack releases must preserve current v2 lesson IDs when updating existing v2 progress. A future deliberately breaking development revision should use another explicit version/reset decision, not silently rewrite user progress.

## Media provenance and limitations

All added lessons, exercises and dialogue are original text. No bundled recordings, images or copied textbook materials were added. Existing app fonts and visual assets retain their provenance/licensing. Verified local en-US browser voices are device-provided; locality must be explicitly reported. Native reference TTS stays disabled until offline locality is verifiable. Optional recording/replay stays on device; leaving speaking deletes the recording. No speech correctness score is generated.

Short output is transparent, constrained role-play with curated accepted responses, rather than arbitrary semantic/AI grading. The first introduction names Ana explicitly for scoring; learners can use their own name during optional speaking.

## Human review still required

A qualified teacher/editor should check all 32 lessons for American English naturalness, Spanish regional appropriateness, vocabulary load, level progression, ambiguity, distractor quality and accepted short responses. Later units compress substantial A2 topics into four lessons; review whether additional optional practice is needed. Automated checks establish consistency and offline behavior, not educational efficacy. Test recording/playback, permissions, TalkBack and layout on a low-end Android device before release.
