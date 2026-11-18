# LingoQuest 2.0 travel architecture

[Español (Latinoamérica)](TRAVEL_ARCHITECTURE.es-419.md)

| Location                                           | Responsibility                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `packages/offline-engine/src/travel-route.ts`      | Origins, destinations, locations, and curriculum goals                                              |
| `packages/offline-engine/src/travel-content.ts`    | Mission steps, vocabulary with glosses and examples, dialogue, grammar, exercises, and collectibles |
| `packages/offline-engine/src/travel-placement.ts`  | Six optional diagnostic prompts and rules for choosing a starting mission                           |
| `packages/offline-engine/src/travel.ts`            | Mission availability, active and paused checkpoints, journal, and rewards                           |
| `packages/offline-engine/src/travel-challenges.ts` | Active chapter configuration and chapter-based optional challenges                                  |
| `packages/offline-engine/src/index.ts`             | Local API, shared grading, spaced review, checkpoints, and backups                                  |
| `apps/mobile/src/travel`                           | Welcome, assessment, home, map, mission reader, guide, passport, quick review, and bundled audio    |
| `content/source` and `packages/course-pack`        | Archived textbook sources and LQP validation                                                        |

Travel uses the same offline grading and review rules. Practice records use stable exercise and skill IDs. Quick review and full review in the app only select travel exercises. Optional challenges draw from the authored chapter and store separate results. The deprecated textbook, its course pack, and its existing history remain restorable as part of format 2 data. The current app does not bundle the deprecated course.

Placement groups its prompts by the objectives in the three missions. It recommends the first group where the learner has not demonstrated both objectives. At the last mission it recommends that mission even if all answers are correct. An answer assisted by the on-screen transcript does not demonstrate independent listening. Placement stores the starting recommendation and the prerequisites it verifies. It grants neither XP, mission completion nor collectibles. A learner can revisit any earlier mission for practice.

Each travel checkpoint stores the story revision, step token, drafts, feedback, hints, transcript, and vocabulary card index. Switching missions keeps the previous checkpoint paused. Attempts and their evidence are written together. Completion and rewards are committed in one write and keyed by mission or chapter ID. Android uses a single SQLite state row. Web uses local storage and serializes writes across tabs where Web Locks are available. New format 2 backup fields are optional.

The Web service worker caches the app and media and serves bundled audio byte ranges. Chapter clips play offline at the preferred speed. The app offers local recording and optional system speech recognition with provider disclosure.

Extend a destination with a versioned chapter and stable mission and exercise IDs. A future first-person video can use a new step type and a locally packaged asset ID. Provide captions, a checkpoint, and a text path for the same learning objective.
