# Phase 5D-1 Mexico City Validation

[Español (Latinoamérica)](PHASE_5D_MEXICO_VALIDATION.es-419.md)

The scope is the second stop, `mexico`. The learner practices A1 routines, reads schedules, and agrees on a market visit. The four `lq-mexico-routines` objectives and earlier Study materials are tracked in the Phase 5D roadmap. [Roadmap](PHASE_5D_ROADMAP.md) · [Approved objectives](curriculum/curriculum-master-plan.md#lq-mexico-routines--routines-and-schedules-mexico-a1)

## Chapter card review

The pack retains the original market card and adds four cards. Each new card includes English dialogue and vocabulary audio, Latin American Spanish instruction, a keyed comprehension prompt, and an open self-check. The open responses invite the learner to try the task before revealing the example. The ledger treats those examples as reference practice. [Mexico card source](../content/source/mexico-chapter-lessons.ts) · [Evidence rules](PHASE_5C_LEARNING_EVIDENCE.md)

| Objective     | Keyed card item and accepted choice                                                                                                                                 | Open practice and self-check                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `routine`     | Order three actions from Leo's message. He gets up, has breakfast, then studies. The distractors reverse the beginning or place studying before breakfast.          | Describe three real or invented routines in writing and aloud. Check for a subject, a base verb, and a clear activity order.              |
| `others`      | Read Nora's and Eli's profiles. Eli never cooks in the morning. The distractors attribute the habit to both people or reverse their profiles.                       | Compare two people's routines. Check the subject, the place of `usually` or `never`, and the verb ending.                                 |
| `time`        | Distinguish `seven fifty` and `ten thirteen` from `seven fifteen` and `ten thirty`. The correct pair is 7:50 and 10:13.                                             | Use a different market schedule to propose two times. Check the hours, the weekday and the time of day.                                   |
| `routine-ask` | Compare a community center schedule with Leo's availability. Friday at four satisfies both. Saturday at ten and an answer claiming no overlap fail the cross-check. | Ask two scheduling questions in a study context, then write a confirmation that includes a day, a time and the reason another time fails. |

The introductions and explanations distinguish the base form from third-person `-s` and `-es`, time expressions with `at`, `on` and `in`, and `do`/`does` questions from `don't`/`doesn't` replies. A card listening answer requires audio playback or the supported transcript to count as gradeable evidence. The time and location details in the exercises describe a fictional market, reading room, library and bus service. [Card evidence](../packages/offline-engine/src/chapter-card-learning.ts)

## Story and evidence audit

The adventure has a reading room and a neighborhood market. Sam introduces Inés, the host. The learner opens her agenda, reads the timetable, and agrees to meet at eight. Leo's invitation asks the learner to use a different schedule and context. The closing postcard connects the chapter to Cartagena. The reading-room image has separate labels for Inés, the agenda, the board and the doorway. The market art places the clock above the stalls and the conversation point by the produce stand. Both scenes depict fictional locations. [Story and hotspots](../content/source/mexico-story.ts) · [Reading room art](../content/media/chapters/mexico-reading-room.jpg) · [Market art](../content/media/chapters/mexico.jpg)

| Mission            | Required preparation                                                                                | Assessed items and key checks                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mexico-routine`   | Six routine words and the base form with an explicit subject.                                       | Inés gets up, has breakfast and works. Sam works and studies in the afternoon. Accept `I study English every day` or fronted `Every day`, and flag a missing subject or incorrect order.                                                                              |
| `mexico-others`    | Family and habit words, third-person verb endings, and the positions of `usually` and `never`.      | Inés says her brother never reads in the morning. Leo never cooks in the reading passage. `She cooks at home` uses the third-person ending and the place phrase.                                                                                                      |
| `mexico-time`      | `at` plus time, `on` plus a day, `in` plus part of the day, and audio contrasts for teens and tens. | Listen for 8:15 and 9:30, locate the Saturday 8:00 opening, and write a meeting note. Accept the taught time formats and either order of the day and time phrases.                                                                                                    |
| `mexico-agreement` | Question and negative forms with the base verb, and availability language.                          | Rebuild the guided `Does the market open at eight?` question. The conversation rules out ten and confirms eight. Sam's written question asks about the brother's work time. Write a question using `Does`, then a meeting confirmation using `doesn't` or `does not`. |
| `mexico-transfer`  | Previously taught schedules, questions and time forms, with new library context vocabulary.         | Read the Friday 3:00–4:00 window, ask about Leo's sister, and confirm Friday at 3:30 at the library. The new context and authored prompt IDs support transfer when prior qualifying evidence exists.                                                                  |

The five missions include 17 keyed exercises and four open speaking activities. The speaking tasks use models and self-check criteria, with recording and system speech support where available. Independent speaking, pronunciation and delayed retention require separate evidence. The ledger resolves graded Story items to the existing U02 and U03 learning targets. It records transcript use, guidance and retries as support. [Mission items and variants](../content/source/mexico-missions.ts) · [Unified evidence](PHASE_5C_LEARNING_EVIDENCE.md)

The chapter includes eight review items. Third-person agreement, time prepositions and question formation have guided repair and a differently framed independent practice item. The optional challenge pool adds six Grammar Rush, five Cloze Battle and three Reading Quest variants. The existing rank gate remains in place. A Mexico item can appear when its formal teaching and relevant independent practice are available. [Review and remediation](PHASE_5C_ADAPTIVE_REVIEW.md) · [Mexico challenge items](../content/source/mexico-challenges.ts)

## Offline pack

Mexico revision 8 includes five guide cards, the four U02 Study lessons, the adventure, review and challenge data, four image assets and 231 downloadable audio entries. The clip builder uses US English speech synthesis for the new lines. The 3,502,414-byte pack has SHA-256 `90c95df098e4288ebe96460868fd8b6543a92fc659a0d3cc99345499fb8a0f4c`. The package verifier checked all 20 active chapter packs. [Catalog](../apps/mobile/public/chapter-packs/catalog-v3.json) · [Pack verification](../scripts/build-chapter-packs.ts) · [Clip builder](../scripts/chapter-media.ts)

The v2 catalog and its Mexico revision 7 pack matched their Phase 5C files byte for byte. The v3 catalog selects Mexico revision 8 and uses the existing revisions for the other destinations. [Legacy catalog](../apps/mobile/public/chapter-packs/catalog-v2.json) · [Catalog publishing](CHAPTER_PACKS.md)

## Verification results

The curriculum verifier checked the 24 planned units, 83 objectives, 20 stops and 24 active travel cards. It audited 39 new keyed Mexico mission, review and challenge items with 133 grading probes. The 1,567 baseline grading probes and the verified course release `2.2.1` also passed. [Curriculum verifier](../scripts/verify-curriculum.ts) · [Course release verifier](../scripts/verify-course-release.ts)

TypeScript, ESLint and all 156 automated tests passed. The tests include six speech-recognition, 17 API, 47 course-pack and 86 offline-engine checks. [Installed-story checks](../packages/offline-engine/test/installed-story.test.ts)

The final v3 Web export passed and prepared an offline shell with 93 precached assets. The corresponding Android Hermes export passed with 3,310 modules and a 6,869,189-byte bundle. [Offline shell build](../scripts/postbuild.mjs) · [Android build instructions](APK_BUILDS.md)

The standalone development build produced `work/apk/lingoquest-dev-694c39be.apk` at 48,360,610 bytes with SHA-256 `9b37e352408744be26a353d6dc6295fec2422ec4950d4aeb7a9d82bb5485b99b`. The APK Signature Scheme v2 check passed with the preview certificate. The APK contains Hermes for `arm64-v8a` and `armeabi-v7a`, and its embedded bundle refers to `catalog-v3.json`. All five native English voice tests passed. [APK build script](../scripts/build-apk.mjs) · [Native voice tests](../apps/mobile/modules/offline-tts/android/src/test/java/com/lingoquest/offlinetts/EnglishVoiceTest.kt)

All 67 general Playwright regression cases passed on the build before the catalog compatibility split. The final v3 Web build passed all 13 focused Playwright cases, including eight chapter-pack cases, four keyboard cases and the complete Mexico adventure. The Mexico scenario completed all five missions in browser offline mode after a single pack transfer. It exercised the scene artwork and downloaded listening audio, resumed the opening dialogue and a written draft after reloads, used Enter to submit written answers, and checked the evidence for formal teaching, guided practice and independent transfer. The final quest awarded the passport stamp and opened a route to Cartagena. The previous Home story and travel record retained their saved progress. [Chapter pack tests](../tests/e2e/chapter-packs.spec.ts) · [Keyboard tests](../tests/e2e/keyboard.spec.ts) · [Mexico story regression](../tests/e2e/mexico-story.spec.ts)

The published `main` currently serves Mexico revision 7 through `catalog-v2.json` to Phase 5B and 5C app builds. The Phase 5D Android build uses `catalog-v3.json` for its first Home download. A fresh installation needs the published v3 catalog at the configured reference to download chapters. The new Mexico adventure requires revision 8 at that reference. Chapter acceptance still needs a device session with airplane mode, audio playback and a microphone. Representative beginner sessions can assess language clarity, spontaneous speaking, and recall after a delay. [Catalog configuration](../apps/mobile/src/lib/chapterPacks.ts) · [Device test plan](OFFLINE_TEST_PLAN.md)

## Verification commands

```sh
npm run curriculum:verify
npm run packs:verify
npm run packs:chapters -- --verify
npm run check
npm test
npm run build:web
npm run build:android
npm run build:apk
```

With the exported app running through `npm run preview`, run `npm run test:e2e`. The Mexico browser scenario uses the normal Map entry and switches the browser offline after the download. [Mexico story regression](../tests/e2e/mexico-story.spec.ts) · [APK build instructions](APK_BUILDS.md)
