# Phase 5C Adaptive Review

[Español (Latinoamérica)](PHASE_5C_ADAPTIVE_REVIEW.es-419.md)

The common queue projects the event history by canonical target and dimension. Story and Study can open the same review queue. Placement remains a diagnostic source. Eligible challenge responses contribute to the matching dimensions. The app can still resume an in-progress review saved by its earlier routes. [Evidence model](PHASE_5C_LEARNING_EVIDENCE.md) · [Queue and candidates](../packages/offline-engine/src/unified-review.ts)

## Scheduling and exercise selection

The queue prioritizes unresolved errors and material that is due, then uses the next review date. Ties favor targets with a larger share of incorrect, assisted or communication-only responses. Independent success schedules another check using the 1, 3, 7, 14 and 30 day intervals. Progress to a longer interval requires delayed success on a different prompt after demonstration. Same-day transfer is tracked independently of this scheduling decision. An incorrect answer brings review forward. A supported or communication-only response can also shorten the wait. The existing performance stage and verified retention and transfer remain in the record. [Scheduler](../packages/offline-engine/src/learning-evidence.ts)

Candidate exercises must target the selected knowledge and dimension, be available locally, and meet the applicable teaching and lesson gates. Prerequisite checks use the Phase 5B dependencies for the actual question, including the required senses and forms. When the necessary formal instruction is available, review can present it before practice and save a teaching receipt. Candidates with missing instruction stay unavailable until their prerequisites can be taught. The ranking prefers unseen prompts, prompts with a new context, and prompts that have had time to elapse since prior attempts. The skills view can also list separate eligible dimensions with little evidence. [Review integration](../packages/offline-engine/src/index.ts) · [Teaching prerequisites](PHASE_5C_LEARNING_ARCHITECTURE.md)

## Remediation

When deterministic grading identifies an error, the queue brings forward an explanation and guided practice that addresses it. The error categories cover omissions, agreement, tense, prepositions, articles, word order, and vocabulary sense where the relevant rule is available. Less specific errors can still make the target due. [Error rules](../packages/offline-engine/src/travel-learning.ts) · [Home practice bank](../packages/offline-engine/src/travel-review.ts)

1. A correct guided answer to the target form records support for that error. An incorrect, communication-only or ungradable answer leaves the guided step pending. **Intentar otra vez** opens another guided attempt.
2. The follow-up checks the same target, dimension and error in a different context on a fresh prompt. A prompt that caused the error or supplied the guidance is ineligible. The queue also excludes recently answered prompts that carry answer exposure.
3. An independent target-form success on the follow-up clears that pending error. If the installed bank has no eligible follow-up, **Comprobación pendiente** shows that the error is still due and the completed guidance is saved.

The current prompt, draft and completed guidance share one checkpoint for that target and dimension wherever review is opened. **Probar otra escena** advances eligible follow-up practice. In a mission, **Volver al viaje** can save the next exercise and resume the story. [Remediation planner](../packages/offline-engine/src/unified-review.ts) · [Checkpoint handling](../packages/offline-engine/src/index.ts)

## Placement and challenge

The diagnostic provides a starting recommendation. Learners can open the introductory material again. The 13 textbook challenge ranks keep their timer, hearts and tiered item pools. The Home menu has three playable ranks. The app checks the existing course or Home mission completion gates, then checks the Phase 5B prerequisites of every selected question for the mode and rank. Each question must match its reviewed content and have formal teaching receipts for its required senses, forms and constructions. [Challenge design](PHASE_5B_CONTENT_AUDIT.md) · [Question requirements](../packages/offline-engine/src/challenge-learning.ts)

The challenge also requires independent success in relevant normal practice. A reading question uses evidence from an independently assessed passage. When the primary textbook skill has no ordinary reading exercise, the gate can use an authored reading alternative for the passage. In particular, the mixed family and routines passage requires both family identification from `u01_l02` and routine comprehension from `u02_l01`. Home reading also requires passage-reading evidence. For example, the ordinary directions reading in `u03_l04` can support the Home directions questions. [Reading eligibility](../packages/offline-engine/src/challenge-learning.ts)

A production question uses qualifying practice that required a learner to type the response independently. An independently correct typed cloze or correction can establish eligibility for the exact same pattern even when an older item records `grammar_understanding`. The evidence ledger keeps the exercise's original dimension. Home lexical production checks the exact taught form in the saved answer. [Production eligibility](../packages/offline-engine/src/challenge-learning.ts)

These checks apply to new runs, including replays. Stamps, scores, ranks and challenge answer history remain available. Normal Story, Study and review remain untimed practice. [Challenge gate](../packages/offline-engine/src/challenge-learning.ts)

## Offline coverage

An installed pack provides media-dependent practice. The local review archive preserves eligible text questions and their original version, so reviewing earlier material can continue across chapters and pack changes. A replacement pack is validated before use. If a listening clip is unavailable, its question needs a supported audio source before independent listening can be measured. Pronunciation and spontaneous communication remain unverified by speech transcripts and local recordings. [Archiving and migration](PHASE_5C_LEARNING_ARCHITECTURE.md) · [Validation](PHASE_5C_VALIDATION.md)
