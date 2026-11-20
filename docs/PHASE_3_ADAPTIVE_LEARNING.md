# Adaptive learning in Phase 3

[Español (Latinoamérica)](PHASE_3_ADAPTIVE_LEARNING.es-419.md)

LingoQuest schedules practice locally for each authored concept and skill. The six skills are vocabulary, grammar, listening, reading, writing, and speaking. In Chapter 1, a learner recognizes a greeting, recalls one without options, writes an introduction in a new scene, and revisits it later. Quest completion, XP, streaks, and challenge results have their own records. The learning record describes specific practice and provides no proficiency certification.

## Evidence from an activity

- Each exercise names a concept, skill, stage, and context. Recognition and understanding have their own counters. Written recall, full-sentence production, and applying a form in a fresh situation have separate counters.
- Each correct attempt records the stage and whether the response used assistance. Word tiles and authored scaffolding, hints, transcripts, retries, an earlier exposure to the same prompt within 24 hours, and the worked starter count as assistance. Multiple flags can apply to one attempt.
- Transfer requires a correct unassisted application in an authored transfer exercise, an earlier assessed encounter with the concept, and a context the learner has yet to attempt for that concept. A repeated or first-ever transfer prompt measures the underlying activity, such as comprehension, recall, or production. Delayed evidence requires another correct unassisted response in that skill at least 24 hours after the last assessed practice of the concept across skills. The two measures can occur together.
- Speaking records optional activities such as imitation and making a local recording. Leaving, practicing without a microphone, or receiving a transcript gives no scored oral evidence. Spoken content recognition and pronunciation quality would require separate methods. Chapter 1 offers neither an automated pronunciation grade nor a speaking mastery score.
- Exact written checks compare against context-appropriate authored answers after normalizing case, whitespace, punctuation, and typographic apostrophes. Authors include common contractions and meaningful variants. The matcher cannot evaluate arbitrary prose or infer semantic equivalence.
- An authored situational prompt states the message to convey and the form to practice. If either a target answer or a listed paraphrase conveys the message, the app counts one communication success for that submission. A communication-only answer receives positive feedback and a model. The attempt records exposure to the prompt and context. Skill evidence, error counts, remediation status, XP, and the review interval stay tied to assessed answers. [Speaking and cross-course evidence design](LEARNING_EVIDENCE_INTEGRATION.md)

## Scheduling a review

An assessed target starts with a one-day interval. A correct unassisted delayed answer submitted when the target is due advances it through 1, 3, 7, 14, and 30 days. An incorrect or assisted answer returns it to one day. Correct early practice keeps the interval. The next date is calculated from the latest attempt.

The planner prioritizes actionable recurring errors and then due targets. At equal priority it considers the last incorrect result and how long the learner has gone without practicing. Candidate exercises match the concept and usually the skill. After an independent success the planner favors more demanding exercises. An incorrect or assisted result favors more support. The planner favors exercises and contexts the learner has not used recently. The dedicated review pool lets a scene vary without unlocking another chapter. A story review can focus on the current mission's concepts, and the full review list can open a specific concept and skill.

**Para hoy** lists due practice and actionable remediation. **Todas mis habilidades** includes the recorded practice for all six skills. A new traveler can open a one-item worked greeting. The answer to that starter is assisted. Each quick review saves drafts, help, and feedback so a learner can leave and return.

## Error feedback and support

Authors can map a particular wrong option or written answer to a label. For selected exercises the engine can also detect closely matching omissions, forms of _be_, articles, prepositions, and word order. The taxonomy includes subject omission, omitted or incorrect _be_, third person, tense, prepositions, articles, word order, and false friends. Tense, third-person, and false-friend examples can use explicit author mappings. Unknown answers receive the exercise's general feedback.

Two unassisted occurrences of the same pattern within a concept qualify for authored targeted support. Immediate repeats and assisted retries still receive feedback, but they do not create a second independent error. A correct guided response can move the learner from support to a distinct prompt. The recurring error clears after correct unassisted use in that follow-up context. For example, after two drafts that use _I is_, the learner completes _I ___ Ada_ and later writes a full introduction for a different group. The historical error count stays available.

## Storage and checks

`travelLearning.targets` is an optional section of the existing format 2 backup. It stores separate counters, exercise and context history, error labels, and review dates. Earlier backups retain their travel and course progress. Their prior travel reviews can seed candidate selection from visited exercises, with new evidence counters starting empty. Stable step IDs migrate revision-one travel checkpoints, including the active token and saved drafts or feedback. State changes and their attempt evidence use the same local write. Mission-scoped and skill-scoped quick reviews have independent checkpoints.

Run `npm run test -w @lingoquest/offline-engine` for the scheduling, assistance, remediation, migration, and transaction checks. Run the browser tests for the learner journey. Those checks cover software behavior. Chapter 1's learning outcomes require learner testing with [parallel assessment forms](CHAPTER_1_ASSESSMENT.md).
