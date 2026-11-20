# Phase 4 RPG foundations

[Español (Latinoamérica)](PHASE_4_RPG.es-419.md)

## Architecture audit

Phase 4 starts from `origin/main` at `1932bda`.

| Change on main     | Integration point                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR #12 (`198c884`) | The Illustrated Travel Journal supplies the paper frames, artwork for the plaza and bus stop, character portraits, shared typography, atlas, and passport.                                                                    |
| PR #13 (`5633029`) | Chapter 1 carries explicit learning targets, alternate expressions, support levels, transfer practice, and adaptive review. The 32 textbook lessons and 13 legacy challenge ranks have independent entry points and progress. |
| PR #14 (`9477e07`) | Android uses the selected recognizer with on-device preference and a provider disclosure. Learners can skip the microphone. A transcript match supports completion of the speaking activity.                                  |
| PR #15 (`1932bda`) | The chapter audio hook sequences spoken dialogue, grammar examples, and vocabulary. The existing local-player fallback can use the chapter's bundled reference clips.                                                         |

[Journal components](UI_JOURNAL.md) · [Offline speech and storage](OFFLINE_EDITION.md)

The atlas in `travel-route.ts` describes 20 stages. `travel-curriculum.ts` defines their objectives and prerequisites, and `travel-content.ts` contains the three playable lessons in _La primera postal_. The progression is greeting and introductions in the plaza, locating the bus stop by the park, and using ownership and color to identify Sam's backpack. The atlas and prerequisites are shared with the travel guide.

`TravelFlow` renders each authored step. `travel.ts` resumes active or paused lessons by stable step ID and retains drafts and assistance. The offline engine writes attempts, `travelLearning` evidence, XP, completion timestamps, and passport stamps through its serialized local store. `travel-review.ts` uses the same learning evidence to select due, remedial, or transfer practice. Web uses local storage and a production service worker for cached code and media. Android stores one state row in SQLite, with the course and media bundled. Format-2 backups carry this progress between installations. [Travel architecture](TRAVEL_ARCHITECTURE.md) · [Adaptive evidence](PHASE_3_ADAPTIVE_LEARNING.md)

## Implementation plan

1. **4A · RPG core.** Build a data-driven reducer with stable scene, hotspot, character, dialogue, quest, and inventory IDs. Store story choices, item acquisition and use, quest goals, reward state, and the active scene and encounter in an optional versioned `StoryState` section of format-2 saves. Check prerequisites in the offline engine and use saved turn numbers to handle duplicate or stale actions. Test branching, reward idempotency, and state restoration.
2. **4B · Chapter 1.** Author the plaza, bus stop, and lost-and-found scenes. Use the ticket to establish where the eight o'clock bus stops. Let players follow distinct leads after the backpack goes missing and return the correct item. Connect each learning encounter to the existing lesson checkpoints and let the canonical mission completion award the passport stamp. Show the player's origin in the scene, dialogue, and existing passport. Both story routes use the same English activities and assessment rules.
3. **4C · Validation.** Exercise both story branches, interruptions at scene and lesson checkpoints, format-2 restoration, repeat rewards, and the existing assessment and review paths. Play through the compiled Web app without network access after its first successful cache load. Build Web and Android and record native build and physical-device results independently. Use the existing learner study protocol to measure whether learners can apply the English after the adventure. [Chapter 1 assessment](CHAPTER_1_ASSESSMENT.md)

Story progression records narrative outcomes. Attempts submitted through the existing lesson and review screens provide learning evidence at their actual levels of support. Open **Aprender → Lecciones** to practice any unlocked lesson directly.

## 4B · Playable chapter

The scene, dialogue, quest, and inventory definitions live in `chapter-story.ts` and run on the offline RPG core from [PR #16](https://github.com/togekk39/LingoQuest/pull/16). `StoryAdventure` displays three illustrated scenes and their available interactions. The chosen departure country appears on the plaza postcard display, in Luz's greeting, and in the existing passport. An independent introduction or a placement result can unlock an English line from Luz. Both search routes have the same learning targets.

The app uses the existing `TravelFlow` for each learning encounter, including its full sequence of teaching and exercises, feedback, assistance, draft restoration, audio, and option to continue without speaking. During the backpack mission the story resumes before the final lesson step. The player must identify, acquire, and present the correct item before that step can award the original stamp and postcard. The optional sketch quest adds a clue to the scene. A correct answer in the existing backpack review can complete the review quest. Story events and quest rewards leave learning evidence and XP unchanged. Existing lesson progress can fulfill the learning part of an encounter while leaving the scene objectives available to play.

### Play through the chapter

1. Choose a place of departure and select **Comenzar mi aventura** from the welcome screen, Home, or the first destination on the map. In **La plaza**, look for **Postales de [origin]** and talk to Luz to see the customized greeting. For the optional quest, save the sketch and show it to Luz.
2. Talk to Sam and select **Presentarme a Sam**. Complete the introduction activities. For a recovery check, leave a partial written answer, select **Cerrar y volver**, and close or reload the app. Reopen **Comenzar mi aventura** and select **Continuar con el inglés** to recover the draft.
3. Open **Boleto y cartel del parque**, compare the ticket with the sign, and follow **Camino al parque**. Check **Señal de la parada**, then give Sam directions in English. Check both the audio and transcript options in the lesson.
4. After Sam notices his backpack is missing, choose **Revisar el banco** and read the folded note, or choose **Preguntarle a Luz** and return to the plaza for her clue. Go to **Objetos perdidos** once you have the clue. Try the other route on a fresh profile to see the other clue and ending.
5. Ask Luz to review Sam's message and complete the backpack activities. Inspect the blue and red backpacks, take the blue one, and show it to Sam. After the final step, talk to Sam again, check the used backpack and one postcard in **Mochila**, and open **Pasaporte** to see the chapter stamp and your departure.
6. In **Misiones**, open **Otro día en objetos perdidos** and start the adaptive review. Confirm that a correct answer marks the quest complete. Reopen the story and check that the completed quests and postcard persist.

For a learner study of the RPG, use **Comenzar mi aventura** as the entry point in the existing pretest, immediate posttest, and delayed study procedure. Physical Android and learner assessments require separate sessions. [Chapter 1 assessment](CHAPTER_1_ASSESSMENT.md)

## 4C · Validation

| Check                                             | How to run it                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Type checking, lint, engine and native unit tests | `npm run check` and `npm test`                                                   |
| Production Web and offline shell                  | `npm run build:web`, then `npm run preview`                                      |
| Chapter playthroughs and recovery in Chromium     | `npm run test:e2e -- tests/e2e/rpg-story.spec.ts` against the production preview |
| Android bundle and installable APK                | `npm run build:android` and the [Android APK workflow](APK_BUILDS.md)            |

The browser suite completes both searches and compares the two outcomes. It turns off networking after the first cache load, reloads from story and lesson checkpoints, checks a wrong answer and assisted retry, and uses bundled audio and the microphone-free path. It also checks country personalization, the item gate, the stamp and postcard, the delayed review quest, keyboard navigation at a narrow viewport, and exit during a pending save. The engine suite checks older backups, failed writes, repeat requests, authored evidence, and practice outcomes independently of the interface. [Browser scenarios](../tests/e2e/rpg-story.spec.ts)

The production Web build and Android Hermes export passed.

[Plaza](screenshots/phase-4/phase4-01-plaza.jpg) · [Bus stop](screenshots/phase-4/phase4-02-stop.jpg) · [Backpack](screenshots/phase-4/phase4-03-backpack.jpg) · [Passport](screenshots/phase-4/phase4-04-passport.jpg)

Physical Android acceptance remains open. On a device, install the APK and play the chapter in airplane mode from first launch through the passport. Force-stop during a dialogue and a typed draft, then resume. Verify an installed English voice and bundled fallback. Check microphone denial, optional system recognition with an installed on-device model, no-permission completion, and temporary recording playback. Check TalkBack, font enlargement, and interaction latency on a low-end device. The learner-study outcomes are also pending. [Study protocol](CHAPTER_1_ASSESSMENT.md)
