# Phase 5C Adaptive Review

[Español (Latinoamérica)](PHASE_5C_ADAPTIVE_REVIEW.es-419.md)

The common queue projects the event history by canonical target and dimension. Story and Study can open the same review queue. Placement remains a diagnostic source. Eligible challenge responses contribute to the matching dimensions. The app can still resume an in-progress review saved by its earlier routes. [Evidence model](PHASE_5C_LEARNING_EVIDENCE.md) · [Queue and candidates](../packages/offline-engine/src/unified-review.ts)

## Scheduling and exercise selection

The queue prioritizes unresolved errors and material that is due, then uses the next review date. Independent success schedules another check using the 1, 3, 7, 14 and 30 day intervals. Progress to a longer interval requires delayed success on a different prompt after demonstration. An incorrect answer brings review forward. A supported or communication-only response can also shorten the wait. Earlier independent successes and attained evidence stages are preserved. The schedule and needs-review flag express current readiness. [Scheduler](../packages/offline-engine/src/learning-evidence.ts)

Candidate exercises must target the selected skill and dimension, be available locally, and meet applicable teaching or lesson gates. The ranking prefers unseen prompts, prompts with a new context, and prompts that have had time to elapse since prior attempts. A review can surface an eligible related skill dimension for practice when that dimension has little evidence. Repetition remains useful as supported practice when the content bank has few alternatives. [Review integration](../packages/offline-engine/src/index.ts)

## Remediation

When deterministic grading can identify an error, the queue brings forward a brief explanation and a guided item for that error when one is authored. The app uses the shared error categories for omissions, agreement, tense, prepositions, articles, word order, and false friends where there is an authored answer rule or reliable evidence. After the guided response, **Probar otra escena** opens an eligible independent item in a different context that assesses the same target. In a mission, **Volver al viaje** saves the next item and resumes the story. Independent success in the new context can clear the pending reinforcement. Where the installed bank has no eligible alternate, the target stays due. Less specific errors can still make a target due. [Error rules](../packages/offline-engine/src/travel-learning.ts) · [Home practice bank](../packages/offline-engine/src/travel-review.ts)

## Placement and challenge

The diagnostic provides a starting recommendation. Learners can open the introductory material again. The 13 textbook challenge ranks keep their timer, hearts and tiered item pools. Unlocking a rank requires the existing teaching prerequisites plus independent productive evidence in a relevant dimension for each required lesson or mission. The previous pass of the same track, mode and rank allows replay after completion of the teaching prerequisites. The Home menu has three playable ranks. Existing stamps and runs stay in the learner's history. Timed and penalty-based rules apply to optional challenges. Normal Story, Study and review remain untimed practice. [Phase 5B challenge design](PHASE_5B_CONTENT_AUDIT.md)

## Offline coverage

An installed pack provides media-dependent practice. The local review archive preserves eligible text questions and their original version, so reviewing earlier material can continue across chapters and pack changes. A replacement pack is validated before use. If a listening clip is unavailable, its question needs a supported audio source before independent listening can be measured. Pronunciation and spontaneous communication remain unverified by speech transcripts and local recordings. [Archiving and migration](PHASE_5C_LEARNING_ARCHITECTURE.md) · [Validation](PHASE_5C_VALIDATION.md)
