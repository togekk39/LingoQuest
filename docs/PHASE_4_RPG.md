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

Story progression records narrative outcomes. Attempts submitted through the existing lesson and review screens provide learning evidence at their actual levels of support. The original mission reader remains available for direct practice.
