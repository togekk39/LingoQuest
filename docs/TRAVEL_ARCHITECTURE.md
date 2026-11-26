# LingoQuest travel architecture

[Español (Latinoamérica)](TRAVEL_ARCHITECTURE.es-419.md)

| Location                                           | Responsibility                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/offline-engine/src/travel-route.ts`      | Origins, destinations, locations, and route goals                                                   |
| `packages/offline-engine/src/travel-curriculum.ts` | 20-stage syllabus, six skill areas, and concept prerequisites                                       |
| `packages/offline-engine/src/travel-content.ts`    | Mission steps, vocabulary with glosses and examples, dialogue, grammar, exercises, and collectibles |
| `packages/offline-engine/src/travel-placement.ts`  | Six optional diagnostic prompts and rules for choosing a starting mission                           |
| `packages/offline-engine/src/travel.ts`            | Mission availability, active and paused checkpoints, journal, and rewards                           |
| `packages/offline-engine/src/travel-challenges.ts` | Active chapter configuration and chapter-based optional challenges                                  |
| `packages/offline-engine/src/travel-learning.ts`   | Learning evidence, assistance, error classification, and review intervals                           |
| `packages/offline-engine/src/travel-review.ts`     | Candidate selection for spaced practice and remedial practice                                       |
| `packages/offline-engine/src/index.ts`             | Local API, shared grading, spaced review, checkpoints, and backups                                  |
| `apps/mobile/src/travel`                           | Welcome, assessment, home, map, mission reader, guide, passport, quick review, and bundled audio    |
| `content/source` and `packages/course-pack`        | A1–A2 textbook sources and LQP validation                                                           |

## Phase 3 audit

| Area                    | Starting point at `198c884`                                                                                                                                                  | Phase 3 change                                                                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Curriculum and story    | One published chapter, three missions, and goals on a 20-stop illustrated route.                                                                                             | The chapter models a learning sequence through NPC exchanges and contextual tasks. The route has skill objectives, prerequisites, recurring concepts, and transfer goals for all 20 stages. Chapters 2–20 still need authored lessons. |
| A1–A2 course            | The bundled LQP 2.1.0 file contained 32 lessons. The app provided an empty textbook catalog to the engine and exposed no textbook route. Format 2 retained textbook history. | **Aprender → Cursos A1–A2** uses the validated local pack, original lesson screens, draft restoration, and independent reference.                                                                                                      |
| Assessment and feedback | Deterministic local grading, authored answers, and a six-item placement route. Review primarily followed vocabulary and grammar dimensions.                                  | Chapter activities add explicit evidence types, partial support, new-context variants, accepted alternatives, and feedback for detectable error patterns. The placement route still recommends a starting mission.                     |
| Adaptive review         | Quick review reused completed exercises. The presentation could turn listening into a vocabulary prompt.                                                                     | Chapter review keeps the original modality and selects from graded, context-specific candidates using evidence, review date, and recurring errors.                                                                                     |
| Speech                  | Local English TTS, reference clips, local recording, and opt-in system transcription.                                                                                        | Listening, dictation, and speaking use the same chapter flow with independent playback, transcript assistance, local recording, and a microphone-free route.                                                                           |
| Progress and challenges | Drafts, feedback, backups, XP, and three available travel challenge ranks. The textbook track was absent from the challenge screen.                                          | New evidence stays in format 2 and older drafts migrate by step ID. The original 13 textbook ranks and three chapter challenges have separate records and unlock rules.                                                                |

Travel review selects chapter exercises. Textbook practice still uses original exercises and lesson IDs. [Curriculum and authoring](PHASE_3_CURRICULUM.md) · [Adaptive evidence](PHASE_3_ADAPTIVE_LEARNING.md)

Placement groups its prompts by the objectives in the three missions. It recommends the first group where the learner has not demonstrated both objectives. At the last mission it recommends that mission even if all answers are correct. An answer assisted by the on-screen transcript does not demonstrate independent listening. Placement stores the starting recommendation and the prerequisites it verifies. It grants neither XP, mission completion nor collectibles. A learner can revisit any earlier mission for practice.

Each travel checkpoint stores the story revision, step ID and token, drafts, feedback, hints, transcript, and vocabulary card index. Switching missions keeps the previous checkpoint paused. Attempts and their evidence are written together. Completion and rewards are committed in one write and keyed by mission or chapter ID. Android uses a single SQLite state row. Web uses local storage and serializes writes across tabs where Web Locks are available. New format 2 backup fields are optional.

The Web service worker caches the app and media and serves bundled audio byte ranges. Mission words, examples, dialogues, and placement listening use the saved local English TTS voice and rate. Listening activities and story speaking models use the bundled clip if the saved voice is unavailable. Optional vocabulary and grammar previews prompt the learner to change an unavailable named voice. Mission speaking uses the user’s selected Android recognizer after showing its connectivity disclosure. A matching final transcript completes the check. Supported recognizers capture a temporary clip for sequential playback with the model. Skipping advances without recording practice. Phrase drills offer system recognition only after the learner chooses it and sees the provider disclosure. [Recognition requirements](OFFLINE_EDITION.md#speech-recognition-stt)

Extend a destination with a versioned chapter and stable mission, step, and exercise IDs. Define evidence targets and review variants alongside the mission. [Chapter and exercise fields](PHASE_3_CURRICULUM.md)

## Event journals and witness audio

The event journals use a versioned definition and checkpoint. The build prepares the finite witness replies for Cusco and the installed chapter plays them through its regular voice controls. The journal inquiry assesses the written question. Listening evidence depends on an audio exercise and its playback and support conditions. After pack removal, archived text practice retains the facts it needs. [Cusco validation](PHASE_5D_CUSCO_VALIDATION.md)

## Team work and dynamic replies

The team scenario uses the existing mission checkpoint and definition digest. Its records track an assignee, task phase, observations, confirmations and assignment history. Asking about a person observes the scenario. A request can create an agreement after checking the addressed person and the task’s conditions. An authored event starts or completes the work, and later replies read the resulting state. The same backup schema carries the speaker selection, draft and work history. [Team scenario](../packages/offline-engine/src/team-scenario.ts)

The pack builder includes a bounded list of team replies and the independent audio assessment prompts. A generated reply is playable when its exact phrase exists in the installed pack. Other replies appear as text. Text turns use written evidence. The separate can/can’t checks use installed audio and the regular listening and assistance rules. [Voice and skill validation](PHASE_5D_SALVADOR_VALIDATION.md)

A team turn declares required fact kinds and identities. Work, ability, availability, ownership, completion and agreement persist separately. The live checkpoint carries an explicit referent and the first completed work record can seed a later mission. A historical snapshot uses its own definition and leaves current work intact. The next batch uses a new task ID. Completion verifies required work after authored events. Revision 16 migrations retain stable assignments and the saved learner response. [Salvador validation](PHASE_5D_SALVADOR_VALIDATION.md)
