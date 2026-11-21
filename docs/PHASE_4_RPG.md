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

`TravelFlow` renders each authored step in the standalone lesson or within a `StoryAdventure` dialogue panel. `travel.ts` resumes active or paused lessons by stable step ID and retains drafts and assistance. The story save records whether the active encounter panel is paused, and the translation toggle uses a local preference. The offline engine writes attempts, `travelLearning` evidence, XP, completion timestamps, and passport stamps through its serialized local store. `travel-review.ts` uses the same learning evidence to select due, remedial, or transfer practice. Web uses local storage and a production service worker for cached code and media. Android stores one state row in SQLite, with the course and media bundled. Format-2 backups carry this progress between installations. [Travel architecture](TRAVEL_ARCHITECTURE.md) · [Adaptive evidence](PHASE_3_ADAPTIVE_LEARNING.md)

## Implementation plan

1. **4A · RPG core.** Build a data-driven reducer with stable scene, hotspot, character, dialogue, quest, and inventory IDs. Store story choices, item acquisition and use, quest goals, reward state, and the active scene and encounter in an optional versioned `StoryState` section of format-2 saves. Check prerequisites in the offline engine and use saved turn numbers to handle duplicate or stale actions. Test branching, reward idempotency, and state restoration.
2. **4B · Chapter 1.** Author the plaza, bus stop, and lost-and-found scenes. Use the ticket to establish where the eight o'clock bus stops. Let players follow distinct leads after the backpack goes missing and return the correct item. Connect each learning encounter to the existing lesson checkpoints and let the canonical mission completion award the passport stamp. Show the player's origin in the scene, dialogue, and existing passport. Both story routes use the same English activities and assessment rules.
3. **4C · Validation.** Exercise both story branches, interruptions at scene and lesson checkpoints, format-2 restoration, repeat rewards, and the existing assessment and review paths. Play through the compiled Web app without network access after its first successful cache load. Build Web and Android and record native build and physical-device results independently. Use the existing learner study protocol to measure whether learners can apply the English after the adventure. [Chapter 1 assessment](CHAPTER_1_ASSESSMENT.md)

Story progression records narrative outcomes. Attempts submitted through the in-scene activities, standalone lessons, and reviews provide learning evidence at their actual levels of support. The original mission reader remains available for direct practice.

## 4B · Playable chapter

The scene, dialogue, quest, and inventory definitions live in `chapter-story.ts` and run on the offline RPG core from [PR #16](https://github.com/togekk39/LingoQuest/pull/16). `StoryAdventure` displays three illustrated scenes. Players tap characters and objects directly in the artwork, and the dialogue opens on the same page. The chosen departure country appears on the plaza postcard display, in the related dialogue, and in the existing passport. An independent introduction or a placement result can unlock a follow-up from Luz. Both search routes have the same learning targets.

The app embeds the existing `TravelFlow` activities in the dialogue panel, including feedback, assistance, draft restoration, audio, and the option to continue without speaking. Closing the panel or tapping another character pauses the encounter. Tapping the original character reopens it at the saved step. During the backpack mission the story resumes before the final lesson step. The player must identify, acquire, and present the correct item before that step can award the original stamp and postcard. The optional sketch quest adds a clue to the scene. A correct answer in the existing backpack review can complete the review quest. Story events and quest rewards leave learning evidence and XP unchanged. Existing lesson progress can fulfill the learning part of an encounter while leaving the scene objectives available to play.

### Dialogue, essentials, and optional help

Sam’s questions and replies belong to the story. The short reference and activities between them prepare the player to respond. Tap Luz at the welcome desk and select **Practicar con el ejemplo de Luz** for optional guidance and feedback on her own example. Switching characters pauses the current activity and preserves its draft. To verify recovery, leave some text in the reply to Sam, visit Luz, reload, and tap Sam to resume.

The adventure prompts for a name before the scene opens if it does not have one. Enter a name in the prompt or choose **Continuar sin nombre**. The word tiles display the saved name. Use **Escribir mi nombre** or **Cambiar mi nombre** inside the exercise to edit it without losing your draft. With the default profile, the first successful written introduction supplies the name for this chapter. A response with a different name can provide grammar evidence while the story waits for the player’s own introduction. Only an appropriate reply earns communication credit for that encounter. The photo booth checks transfer, and the speaking step keeps its microphone-free option. The stable exercise IDs keep existing evidence and review schedules connected.

### Play through the chapter

1. Choose a place of departure and select **Explorar aventura** from the welcome screen, Home, or the first destination on the map. In **La plaza**, tap Luz in the illustration. Try **Escuchar** and **Mostrar traducción** in her dialogue. For the optional quest, open **Postales de [origin]**, save the sketch, and show it to Luz.
2. Tap Sam and select **Presentarme a Sam**. The panel gives you a short reference for replying to his question. Listen to his greeting, identify it, order a first-person sentence with a name slot, and recall the greeting without choices. Write your own introduction for Sam, use it in a new situation at the photo booth, and try saying it aloud when you return to Sam. Sam responds in English and asks for help finding the bus stop. You can complete this route without consulting Luz.
3. Open **Boleto y cartel del parque**, compare the ticket with the sign, and follow **Camino al parque**. Check **Señal de la parada**, then give Sam directions in English. Check both the audio and transcript options in the lesson.
4. After Sam notices his backpack is missing, choose **Revisar el banco** and read the folded note, or choose **Preguntarle a Luz** and return to the plaza for her clue. Go to **Objetos perdidos** once you have the clue. Try the other route on a fresh profile to see the other clue and ending.
5. Ask Luz to review Sam's message and complete the backpack activities. Inspect the blue and red backpacks, take the blue one, and show it to Sam. After the final step, talk to Sam again, check the used backpack and one postcard in **Mochila**, and open **Pasaporte** to see the chapter stamp and your departure.
6. Open the mission progress summary and expand **Otro día en objetos perdidos**. Select **Practicar ahora** to start the adaptive review. Confirm that a correct answer marks the quest complete. Reopen the story and check that the completed quests and postcard persist. Completed missions show their name and status until you expand them.

For a learner study of the RPG, use **Explorar aventura** as the entry point in the existing pretest, immediate posttest, and delayed study procedure. Physical Android and learner assessments require separate sessions. [Chapter 1 assessment](CHAPTER_1_ASSESSMENT.md)
