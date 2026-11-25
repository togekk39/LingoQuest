# Phase 5C Learning Architecture

[Español (Latinoamérica)](PHASE_5C_LEARNING_ARCHITECTURE.es-419.md)

Story, Study, adaptive review, remediation, placement, challenges, and speech write evidence through the device-local `OfflineEngine`. Performance, retention and transfer are projected independently for every canonical target and skill dimension. The engine updates evidence and the associated checkpoint or progression state in the same serialized operation for graded exercises. It retains Story, lesson, and challenge state for the screens that use it. [Engine](../packages/offline-engine/src/index.ts) · [Evidence rules](PHASE_5C_LEARNING_EVIDENCE.md)

## Canonical registry

The registry reuses IDs from the Phase 5B prerequisite annotations, the published textbook, and Home exercise metadata. It also registers distinct vocabulary senses, taught forms, lesson grammar IDs, and the categories used by the 40 speech drills. A small set of explicit aliases joins equivalent learning targets. Lesson, exercise, challenge, and Story IDs continue to identify their original materials and saved checkpoints. [Registry](../packages/offline-engine/src/learning-registry.ts) · [Prerequisite annotations](curriculum/prerequisite-annotations.md)

| Home learning target        | Canonical ID                          | Where the mapping is used                                                                                        |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Greet someone               | `home.greeting-word`                  | Home instruction, greeting recognition, and the equivalent vocabulary senses in the textbook.                    |
| Introduce yourself          | `home.introduce`                      | Home writing and speaking, the `u01_l01` name pattern and written introduction, review, and optional activities. |
| Ask where a place is        | `home.ask-location`                   | Home directions and related offline listening and writing.                                                       |
| Describe where something is | `home.adjacency`                      | Home location tasks and the textbook sense of `next to`.                                                         |
| Describe a bag              | `home.ownership`, `home.statement-be` | Home possession and descriptions, the related textbook pattern, and the Home oral color practice.                |

Extend the registry by first locating the existing sense, form, construction, or skill ID. Treat a phrase as an alias only when it assesses the same knowledge. Attach the dimension to each task and retain the material ID and revision. Use the actual ordered teaching paths and gates from Phase 5B when authoring an entry. The runtime registry can index the 32 published lessons and installed activities. Additional Pre-A1–B2 objectives still need authored instruction, assessable tasks, and verification. [Phase 5B audit](PHASE_5B_CONTENT_AUDIT.md)

Published travel cards use their card and stage IDs to persist instruction and guided comprehension evidence. Their self-check models count as exposure. The offline engine resolves the card and answer key against the installed revision when it records the event. [Travel card evidence](../packages/offline-engine/src/chapter-card-learning.ts)

## Teaching prerequisites

A formal teaching event records the exact Phase 5B prerequisite references it covers in `teaches`. Each reference gives a stable knowledge ID and, for a lexical item or pattern, the taught form. The engine resolves authored equivalences and can distinguish teaching the visual sense of `see` from teaching the form `saw` for that sense. The receipts follow the ordered Study, Home and review instruction that present those forms. A preview, reference-only view, hint, translation, diagnostic response, or imported aggregate can still provide exposure or orientation. The authored formal teaching step supplies prerequisite credit. Existing Home events that identify a recognized formal teaching step keep that credit. [Prerequisite annotations](curriculum/prerequisite-annotations.md) · [Teaching receipts](../packages/offline-engine/src/learning-prerequisites.ts)

## Shared progress and learner identity

Study can offer a shortcut for an individual exercise when its mapped targets are demonstrated in the dimensions that exercise measures, the evidence is current, and the applicable prerequisites are satisfied. The lesson remains available and the speaking stage stays available independently. Story keeps its existing encounters, passport rewards, and mission checkpoints. The player supplies their own name or a practice name during introductions. A confirmed practice name is local to the learning flow. Sam and Luz keep their roles as separate NPCs. [Study policy](../packages/offline-engine/src/study-learning.ts) · [Introduction grading](../packages/contracts/src/introduction.ts)

Study summarizes each ability over the full set of assessable targets required for that lesson. It uses five statuses. [Study status projection](../packages/offline-engine/src/study-learning.ts)

| Status             | Evidence for the ability                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Unverified         | The ability has yet to receive a usable graded response. The UI shows **Por comprobar**.                                      |
| Learning           | The learner has usable graded responses and has yet to demonstrate a target. The UI shows **En práctica**.                    |
| Partially mastered | Some required targets are demonstrated. **Dominio parcial (N de M objetivos)** reports the full scope.                        |
| Mastered           | Every required assessable target is demonstrated. The UI shows **1 objetivo demostrado** or **N de N objetivos demostrados**. |
| Needs review       | Evidence for a relevant target indicates weakness or a review is due. The UI shows **Por repasar**.                           |

Target counts are specific to the ability. Vocabulary recall and speaking practice have their own records. A lesson without a gradeable speaking task stays unverified for speaking even when writing is mastered.

## On-device persistence

The state codec accepts the earlier save structure, preserves its progress, awards, attempts and drafts, and migrates review dates into canonical target-and-dimension records when it can map them. Historical counters remain in the original record and any capability with only legacy totals is marked unverified. New evidence, review schedules and the compact review archive travel with the local backup. The archive stores eligible plain-text review material and its version for previously reached lessons. Installed audio and visual exercises can still use their chapter packages. [Migration and archive](../packages/offline-engine/src/learning-persistence.ts)

Restore combines the recorded challenge feedback and submission fingerprints under `challengeHistory`. The active timed-run snapshot and its request map reset on restore. Best scores and passed ranks remain available as historical achievements. Starting any new run requires the current completion, formal teaching and independent practice checks for the chosen mode and rank. [Challenge history](../packages/offline-engine/src/learning-persistence.ts) · [Challenge eligibility](PHASE_5C_ADAPTIVE_REVIEW.md)

Pack replacement and learning saves use separate storage. Review may read the retained text material when the installed catalog changes. Audio-dependent practice requires its assets or a supported device voice. Core grading and scheduling run offline. Optional system speech recognition follows the device provider and can require a network connection. Android also offers a recording path for local playback. [Adaptive review](PHASE_5C_ADAPTIVE_REVIEW.md) · [Validation](PHASE_5C_VALIDATION.md)
