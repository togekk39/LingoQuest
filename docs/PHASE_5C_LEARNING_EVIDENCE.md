# Phase 5C Learning Evidence

[Español (Latinoamérica)](PHASE_5C_LEARNING_EVIDENCE.es-419.md)

An evidence event records a stable submission ID, canonical target and dimension, source, material and item IDs, material version, context, format, activity, outcome when applicable, support used, retry status, independence, and time. One event can describe multiple authored targets. A resubmission with the same ID leaves the original event and its effect intact. An exercise seen again within 24 hours carries an answer exposure marker. [Schema and projection](../packages/offline-engine/src/learning-evidence.ts)

## Progression

| State                   | Minimum basis                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Not introduced          | No qualifying evidence has reached this target and dimension. This is also the starting state after migration of an aggregate with only a review date. |
| Introduced              | An authored teaching activity was presented.                                                                                                           |
| Guided practice         | The learner responded with support, tried an activity that yielded usable evidence, or practiced with a visible speech reference.                      |
| Independent performance | A target-form success with no recorded support on a task that can measure that dimension.                                                              |
| Demonstrated            | Target-form successes on at least two distinct prompts in that dimension.                                                                              |
| Retained                | After demonstration, an independent success at least 24 hours after the last independent success, using a different prompt.                            |
| Transfer                | After demonstration, an independently successful task authored for transfer, in a new context and on a new prompt.                                     |

Listening, reading, writing, speaking, vocabulary recognition and recall, and grammar understanding and production use separate records. Transfer describes performance in a changed context within the dimension being measured. For example, writing `My name is Ana.` can support `home.introduce` writing evidence. The oral record stays unverified until it gets its own evidence. A graded multiple-choice question can contribute to the dimension it tests, at most one step on a first correct response. Viewing a model, reading a scene, choosing prewritten dialogue, completing a mission and earning a reward are exposure or progression activities. [Canonical mapping](PHASE_5C_LEARNING_ARCHITECTURE.md)

## Grading and support

| Result               | Evidence effect                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `target`             | The response meets the target form. Aids or repetitions can make it guided.                                    |
| `communication_only` | The idea is clear. The result records a communication success and leaves the target form available for review. |
| `incorrect`          | The attempt can bring review forward and record a specific error. Prior verified history is retained.          |
| `ungradable`         | The evidence records the attempted activity. A fair competency decision remains unavailable.                   |

Hints, translation, transcript, answer models, scaffolds, reorder tokens, and retries influence independence. The reducer also tracks whether the answer to the same prompt was recently revealed through previous practice. Placement records sample the learner's starting point and inform a recommendation. Their contribution to target mastery stays at the pre-diagnostic state. Optional challenge replays retain their history. Each challenge item contributes to mastery at most once per target and dimension. [Shared grading](../packages/contracts/src/answer-grading.ts) · [Review rules](PHASE_5C_ADAPTIVE_REVIEW.md)

## Spoken practice

Android can record a phrase locally for playback and comparison. The optional Android or browser speech service returns recognized words. The app compares those words with the visible reference or the authored introduction check. The activity ledger distinguishes recognized-content dispositions and the occurrence of a recording. It stores neither spoken words nor audio. The UI presents the transcript and content feedback separately from recording playback. Pronunciation quality and spontaneous communication remain unverified and need an appropriate assessment. [Practice UI](../apps/mobile/src/features/SpeakingPractice.tsx) · [Local speech evidence](../packages/offline-engine/src/speech-learning.ts)
