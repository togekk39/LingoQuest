# Phase 3 travel curriculum

[Español (Latinoamérica)](PHASE_3_CURRICULUM.es-419.md)

The route introduces American English through twenty progressively harder travel situations. The bands indicate the intended level of the tasks. A stamp records story progress. An assessment of English proficiency requires independent evidence across skills, over time, with a separate assessment.

## Route from first contact to B2 targets

The first chapter is playable as a Phase 3 lesson. Stops 2–20 specify teaching goals and planned transfer tasks. Their complete travel lessons, voices, and assessments still need authoring and validation. The existing A1–A2 course remains available through **Aprender → Cursos A1–A2** with its own lesson and challenge progression.

|                                     Stop | Band      | Mission and transfer target                                                                                                                       | Prior material to reuse                                         |
| ---------------------------------------: | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1. Home, Latin America and the Caribbean | From zero | Welcome Sam, find the bus stop, and identify a lost backpack. Introduce a different person, reverse the map reference, and identify a second bag. | No English prerequisite                                         |
|                           2. Mexico City | A1        | Read a neighborhood schedule, explain routines and times, and adapt the market itinerary for a newcomer.                                          | Introductions and locations                                     |
|                             3. Cartagena | A1        | Use a menu to order and confirm food, quantities, and substitutions when an ingredient runs out.                                                  | Greetings, ownership, and routines                              |
|                                 4. Cusco | A1        | Ask about a past outing and reconstruct a market visit from two accounts.                                                                         | Times, location questions, and colors                           |
|                              5. Salvador | A1        | Coordinate a meal and report what people are doing. Apply the sequence to a board game setup.                                                     | Routine verbs, quantities, and ownership                        |
|                            6. Valparaíso | A2        | Make a plan, offer help, and suggest a different meeting time after a cancellation.                                                               | Times, requests, and locations                                  |
|                                 7. Miami | A2        | Share experiences and check preparations. Move from a luggage checklist to preparing a picnic.                                                    | Past events and questions, ownership                            |
|                              8. New York | A2        | Compare accessible routes and explain a choice. Apply the same reasoning to different job or service requirements.                                | Locations, times, and experiences                               |
|                               9. Toronto | A2        | Confirm requirements, complete a form, and register someone for another activity with different terms.                                            | Introductions, requests, and times                              |
|                               10. London | B1        | Interpret disruption announcements and arrange a second route when another service changes.                                                       | Location questions, decisions, and comparisons                  |
|                                11. Paris | B1        | Recommend an exhibit with reasons, then adapt the recommendation to a different audience or activity.                                             | Preferences, reasons, and comparisons                           |
|                                 12. Rome | B1        | Explain an accommodation problem and negotiate a solution. Resolve a similar transport booking error.                                             | Past events, ownership, and fallback plans                      |
|                                13. Cairo | B1        | Interpret a condition and relay instructions after a change to a group visit.                                                                     | Requirements, sequencing, and fallback plans                    |
|                            14. Singapore | B1        | Describe symptom duration and confirm instructions in two simulated appointments.                                                                 | Form confirmation, experiences, and relaying instructions       |
|                                15. Tokyo | B1        | Ask about photography rules, handle a conditional answer, then request audio recording permission elsewhere.                                      | Requests, negotiation, and conditions                           |
|                               16. Hobart | B2        | Compare forecast risks and justify a route with limits. Update it when a fresh warning arrives.                                                   | Announcements, conditions, and comparisons                      |
|                           17. Wellington | B2        | Summarize field observations and support a conservation proposal. Transfer it to a site with different limits.                                    | Relative descriptions, tradeoffs, and instruction relay         |
|                              18. Nairobi | B2        | Negotiate responsibilities and document decisions. Reassign roles when a teammate is unavailable.                                                 | Requirements, confirmation, and qualified proposals             |
|                            19. Cape Town | B2        | Separate fact from opinion and synthesize testimony. Revisit the synthesis when a new report conflicts.                                           | Observation, reasons, and decisions                             |
|               20. Antarctica via Ushuaia | B2        | Interpret protocols, present a report, answer questions, and revise the plan for an unfamiliar expedition scenario.                               | Source synthesis, tradeoffs, role negotiation, and confirmation |

## Skill dependencies

[`travel-curriculum.ts`](../packages/offline-engine/src/travel-curriculum.ts) is the curriculum source. Each stop has separate objectives in vocabulary, grammar, listening, reading, writing, and speaking with pronunciation practice. Each concept has a stable ID, a Spanish learner-facing label, and prerequisite concept IDs. A stage records concepts it introduces in prerequisite order, concepts it revisits from earlier stops, and a new transfer task.

The first stop teaches **greeting → introduction → item ownership** and **place question → location → object description**. The next stage reuses introduction for routines and location for schedules. Cartagena reuses ownership alongside articles and quantities. A longer dependency runs from location and time through announcements, conditions and risk comparison, then into the final protocol. Each concept can contribute to more than one skill. An authored activity names the specific skill it exercises.

Prerequisites guide authors when planning placement and progression. The first chapter continues to use the existing optional starting-point assessment and unlock sequence. Earlier missions and direct study remain accessible through the app. To draw on existing A1–A2 material, start with the `unitId` links in [the route](../packages/offline-engine/src/travel-route.ts) and keep legacy IDs so existing lesson history remains available. Adapt selected examples into tasks with a travel purpose, different contexts, and explicit evidence. Unit tests validate concept coverage, prerequisite order, and the consistency of the stage, task, and example data.

## First chapter learning sequence

| Mission                      | Scene and instruction                                                                              | Guided practice and recall                                                                                | Independent use and transfer                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Un saludo en la plaza**    | Sam introduces herself. Word cards and sentence blocks compare `I am` and `My name is`.            | Identify a greeting, order a sentence, and retrieve the greeting from memory.                             | Write a welcome card and introduce Nico at a photo booth. Imitate a greeting with your own name and optionally record and replay it.        |
| **El bus de las ocho**       | Sam needs a specific stop. Read and listen to the question and answer as a dialogue.               | Identify the place from audio, order a response, transcribe a short direction, and retrieve the question. | Use the stop as the landmark and give directions to the park.                                                                               |
| **Una mochila y una postal** | Sam and Luz leave messages about two bags. Examples contrast a color after `is` and before a noun. | Read for a color and identify the owner from `My bag`.                                                    | Confirm the color of Sam's bag, then answer at a different stall about Luz's bag. Optionally listen, imitate, record, and replay the reply. |

Short follow-up tasks reuse the same concepts in a lodging counter, photo or drawing signup, a neighborhood meeting, a market, or another lost-property setting. Specific remediation cues address recurrent omitted subjects or verbs, forms of `be`, articles, prepositions, and word order. The taxonomy also supports third person, tense, and false friends for future chapters. Use authored contrasts such as `she works` / `she work` or `actually` / `currently` once those meanings are taught. Error labels are hypotheses about a response and should use a precisely authored contrast.

Each speaking exercise offers a microphone-free way to rehearse and compare with a model. Recording and replay are local practice. The learner study uses the separate [Chapter 1 assessment plan](CHAPTER_1_ASSESSMENT.md).

### Estimated pace

| Mission        | Story and teaching steps, plus word cards | Scored steps     | Optional voice step | Estimated first pass |
| -------------- | ----------------------------------------- | ---------------- | ------------------- | -------------------- |
| Plaza          | 3 steps and 3 cards, 3–4 min              | 5 steps, 3–5 min | 1 step, 1–2 min     | 7–11 min             |
| Bus stop       | 3 steps and 3 cards, 3–4 min              | 5 steps, 4–6 min | —                   | 7–10 min             |
| Lost and found | 3 steps and 3 cards, 3–4 min              | 4 steps, 3–5 min | 1 step, 1–2 min     | 7–11 min             |

The chapter contains 25 steps and nine word cards nested inside the teaching steps. The 21–32 minute estimate budgets time for reading, audio replay, guided and typed answers, feedback, and brief voice practice. The estimate comes from task analysis and still needs timing with beginners. Extra retries and reviews can extend a session. Each scene, card, and response has an existing checkpoint. Learners can pause between activities or while writing and continue at their own pace. The mission ranges describe the entire mission.

## Authoring format

[`travel-content.ts`](../packages/offline-engine/src/travel-content.ts) contains the chapter and related practice. A `TravelChapter` identifies the stop, a content revision, rewards, and missions. Each mission has a stable ID, scene, concrete objective and success consequence, an estimated duration range in minutes, vocabulary, and ordered steps. A word includes a Spanish meaning and usage note, part of speech, and a bilingual contextual example.

| Step       | Authored data                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dialogue` | A known NPC, Spanish scene context, and optionally a bilingual utterance.                                                                                                                          |
| `teach`    | A short explanation, English examples with Spanish translations, and optional labeled `patterns` aligned with examples by index. Pattern segments join to form the English example used for audio. |
| `exercise` | A situation, shared `CourseExercise` with accepted answers and feedback, and optional hint, scene clue, or audio with transcript. Dictation uses `short_text` plus audio.                          |
| `speak`    | A model phrase, a scenario, a microphone-free fallback, and a speaking target.                                                                                                                     |

For a scored exercise, keep the answer key and error patterns on the offline engine's private exercise object. The learner-facing screen sees the public prompt and shows feedback after submission. Accept contracted and uncontracted forms and reasonable contextual alternatives when they deliver the same outcome. An open prompt uses curated answers, so avoid asking a question whose range of correct replies is too broad for the answer list.

List answers that meet both the communicative purpose and the stated language target in `acceptedAnswers`. If a natural response serves the situation using a different form, add it to `communicationOnly.answers` with feedback that acknowledges the message and explains the target form. For example, a learner can identify a bag by color in a reply that omits the requested complete sentence. For dictation, variants should represent the words the learner actually heard, with ordinary spelling and punctuation conventions. [Chapter 1 item audit](CHAPTER_1_CONTENT_AUDIT.md)

```ts
learning: {
  conceptId: 'introduction',
  skill: 'writing',
  evidence: 'transfer',
  contextId: 'photo-signup',
  errors: ['subject_omission', 'be_omission', 'be_agreement', 'word_order'],
}
```

Use `evidence` for the cognitive work required by the prompt. Set `guided: true` when building blocks, supplied text, or another cue already provides enough of the target to constrain the reply. Reuse the concept ID for a new example. Change the `contextId` when the task has a different situation, and place extra review or remediation exercises in `travelPracticeSteps`. Use `remediates` to associate an authored follow-up with an error type. The engine tracks delayed evidence when reviewing later, separately from the immediate activity. [Adaptive learning design](PHASE_3_ADAPTIVE_LEARNING.md)

Keep stable mission, exercise, and step IDs and add a revision migration when changing the step order with saved checkpoints. Give new prompts new IDs. Verify that English teaching and listening lines have a bundled fallback in `apps/mobile/src/travel/audioClips.ts`. Always include a transcript for accessibility. The service worker caches the bundled Web media, and Android installs include the media for offline use.
