# Phase 5C Learning Evidence

[Español (Latinoamérica)](PHASE_5C_LEARNING_EVIDENCE.es-419.md)

An evidence event records a stable submission ID, canonical target and dimension, source, material and item IDs, material version, context, format, activity, outcome when applicable, support used, retry status, independence, and time. One event can describe multiple authored targets. A resubmission with the same ID leaves the original event and its effect intact. An exercise seen again within 24 hours carries an answer exposure marker. [Schema and projection](../packages/offline-engine/src/learning-evidence.ts)

## Performance, retention and transfer

Each target and dimension has three evidence measures. The performance stage summarizes practice and successful responses. Retention and transfer each keep a separate verification status, success count and latest verification time. The review schedule reflects when to ask again. A mistake can make review due while preserving the earlier performance stage and verified results.

| State                   | Minimum basis                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Not introduced          | No qualifying evidence has reached this target and dimension. This is also the starting state after migration of an aggregate with only a review date. |
| Introduced              | An authored teaching activity was presented.                                                                                                           |
| Guided practice         | The learner responded with support, tried an activity that yielded usable evidence, or practiced with a visible speech reference.                      |
| Independent performance | A target-form success with no recorded support on a task that can measure that dimension.                                                              |
| Demonstrated            | Target-form successes on at least two distinct prompts in that dimension.                                                                              |

| Measure   | Verification rule                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retention | An independent target-form success on a different prompt, at least 24 hours after the previous independent success and after performance was demonstrated. |
| Transfer  | An independent target-form success on an authored transfer task with a new prompt and context, with at least one earlier qualifying independent success.   |

A learner can write an introduction independently, then successfully introduce themself on an authored photo-signup task later the same day. That later answer can demonstrate performance and verify transfer. Retention stays unverified until a separate delayed success meets its rule.

Listening, reading, writing, speaking, vocabulary recognition and recall, and grammar understanding and production use separate records. For example, writing `My name is Ana.` can support `home.introduce` writing evidence. The oral record stays unverified until it gets its own evidence. A graded multiple-choice question can contribute to the dimension it tests, at most one step on a first correct response. Viewing a model, reading a scene, choosing prewritten dialogue, completing a mission and earning a reward are exposure or progression activities. [Canonical mapping](PHASE_5C_LEARNING_ARCHITECTURE.md)

## Grading and support

| Result               | Evidence effect                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `target`             | The response meets the target form. Aids or repetitions can make it guided.                                    |
| `communication_only` | The idea is clear. The result records a communication success and leaves the target form available for review. |
| `incorrect`          | The attempt can bring review forward and record a specific error. Prior verified history is retained.          |
| `ungradable`         | The evidence records the attempted activity. A fair competency decision remains unavailable.                   |

Hints, translation, transcript, answer models, scaffolds, reorder tokens, and retries influence independence. The reducer also tracks whether the answer to the same prompt was recently revealed through previous practice. An introduction can record the language outcome separately from a mismatch with the learner's confirmed name. Placement records sample the learner's starting point and inform a recommendation. The mastery projection leaves diagnostic records outside all three measures. Optional challenge replays retain their history. Each challenge item earns independent credit at most once per target and dimension. [Shared grading](../packages/contracts/src/answer-grading.ts) · [Review rules](PHASE_5C_ADAPTIVE_REVIEW.md)

## Spoken practice

Android can record a phrase locally for playback and comparison. The optional Android or browser speech service returns recognized words. The app compares those words with the visible reference or the authored introduction check. The activity ledger distinguishes recognized-content dispositions and the occurrence of a recording. It stores neither spoken words nor audio. The UI presents the transcript and content feedback separately from recording playback. Pronunciation quality and spontaneous communication remain unverified and need an appropriate assessment. [Practice UI](../apps/mobile/src/features/SpeakingPractice.tsx) · [Local speech evidence](../packages/offline-engine/src/speech-learning.ts)
