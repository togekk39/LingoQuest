# LingoQuest 2.0 travel architecture

[Español (Latinoamérica)](TRAVEL_ARCHITECTURE.es-419.md)

| Location                                        | Responsibility                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/offline-engine/src/travel-route.ts`   | Origins, destinations, locations, goals, and curriculum references                          |
| `packages/offline-engine/src/travel-content.ts` | Mission steps, dialogue, teaching, graded exercises, and collectibles                       |
| `packages/offline-engine/src/travel.ts`         | Mission checkpoints, retries, journal, and reward deduplication                             |
| `packages/offline-engine/src/index.ts`          | Shared grading, spaced review, lesson and quick-review checkpoints, backups, and challenges |
| `apps/mobile/src/travel`                        | Home, interactive map, mission flow, passport, quick review, and local audio                |
| `content/source` and `packages/course-pack`     | Curriculum sources, challenge items, and LQP validation                                     |

Travel exercises reuse the offline engine's grading and review rules. Stable skill and vocabulary IDs connect their practice evidence with the existing curriculum. QuestBuddy offers a retry, hint, or example so learners can continue a story after a mistake. Lessons track completion and XP. The travel chapter grants a stamp and postcard, and challenges keep their own records.

Travel saves the mission, story revision, step token, answer draft, hint, transcript, and feedback. An answer and its learning evidence are committed together. Completion and rewards are committed in one write and keyed by mission or chapter ID. Lesson checkpoints save the stage, exercise, and activity ID. Quick review saves its selected exercise and prefers due evidence. SQLite writes one state row on Android. The web serializes writes across tabs where Web Locks is available. Format 2 backups accept the new fields as optional. The recognized original 2.0.0 course pack can use the updated bundled content while preserving its original bytes.

The web service worker caches the static shell and media, including byte-range reads for the bundled audio. Chapter speaking uses the local recording option and bundled clips. The ordinary course retains the optional system speech-recognition path with its provider disclosure. The separate airport and interview practice and full review can be reopened from their entries. Saved learning evidence remains available.

Extend a destination by authoring a versioned chapter with stable mission and exercise IDs. A future first-person video can use a new step type and locally packaged asset ID. Provide captions, a checkpoint, and a text path for the same learning objective.
