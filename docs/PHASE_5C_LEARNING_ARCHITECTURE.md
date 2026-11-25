# Phase 5C Learning Architecture

[Español (Latinoamérica)](PHASE_5C_LEARNING_ARCHITECTURE.es-419.md)

Story, Study, adaptive review, remediation, placement, challenges, and speech write evidence through the device-local `OfflineEngine`. A status is calculated for each canonical target and skill dimension. The engine updates evidence and the associated checkpoint or progression state in the same serialized operation for graded exercises. It retains Story, lesson, and challenge state for the screens that use it. [Engine](../packages/offline-engine/src/index.ts) · [Evidence rules](PHASE_5C_LEARNING_EVIDENCE.md)

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

## Shared progress and learner identity

Study can offer a shortcut for individual verified exercises when their evidence is current and the existing prerequisites are satisfied. The lesson remains available and the speaking stage stays available independently. Story keeps its existing encounters, passport rewards, and mission checkpoints. The player supplies their own name or a practice name during introductions. A confirmed practice name is local to the learning flow. Sam and Luz keep their roles as separate NPCs. [Study policy](../packages/offline-engine/src/study-learning.ts) · [Introduction grading](../packages/contracts/src/introduction.ts)

## On-device persistence

The state codec accepts the earlier save structure, preserves its progress, awards, attempts and drafts, and migrates review dates into canonical target-and-dimension records when it can map them. Historical counters remain in the original record and any capability with only legacy totals is marked unverified. New evidence, review schedules and the compact review archive travel with the local backup. The archive stores eligible plain-text review material and its version for previously reached lessons. Installed audio and visual exercises can still use their chapter packages. [Migration and archive](../packages/offline-engine/src/learning-persistence.ts)

Restore combines the recorded challenge feedback and submission fingerprints under `challengeHistory`. The active timed-run snapshot and its request map reset on restore. Best scores and passed ranks remain available. The challenge gate combines the completed teaching prerequisites with independent productive evidence for each required lesson or mission. A previously passed track, mode and rank remains eligible for replay after the teaching prerequisite check. [Challenge history](../packages/offline-engine/src/learning-persistence.ts) · [Challenge eligibility](PHASE_5C_ADAPTIVE_REVIEW.md)

Pack replacement and learning saves use separate storage. Review may read the retained text material when the installed catalog changes. Audio-dependent practice requires its assets or a supported device voice. Core grading and scheduling run offline. Optional system speech recognition follows the device provider and can require a network connection. Android also offers a recording path for local playback. [Adaptive review](PHASE_5C_ADAPTIVE_REVIEW.md) · [Validation](PHASE_5C_VALIDATION.md)
