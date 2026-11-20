# LingoQuest verification record

[Español (Latinoamérica)](VERIFICATION.es-419.md)

## Travel speech recognition · 2026-11-20

The physical Android airplane-mode test is pending. A connected phone is required to confirm that the dedicated recognizer returns a final transcript from the microphone with Wi-Fi and mobile data off. [Physical Android test procedure](OFFLINE_TEST_PLAN.md#android-speech-recognition-in-airplane-mode)

## Chapter 1 acceptance revision

- Moved the question-and-answer handbook assertions into the offline handbook test. The first-launch test covers the welcome choices, origin picker, and opening scene.
- Reviewed all story and review answer keys. Automated coverage distinguishes target-form success, communication with another form, and a change of meaning. It checks backup restore, same-prompt retries, and an unchanged review interval for communication-only feedback.
- Replaced the chapter's fixed nine-minute estimate with mission ranges based on its 25 steps and nine vocabulary cards. The speaking record explicitly shows practice activity.
- The course-pack checksum, workspace checks, and 77 unit and integration tests passed locally. The Chromium suite also exercises a meaningful paraphrase followed by a correct but assisted retry.

Device acceptance and the learner study remain separate from the software checks. [Item-by-item audit](CHAPTER_1_CONTENT_AUDIT.md) · [Timing estimates](PHASE_3_CURRICULUM.md#estimated-pace) · [Evidence design and validation](LEARNING_EVIDENCE_INTEGRATION.md#device-and-learner-acceptance)

## Phase 3 Learning First

| Command                | Observed result                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run check`        | Workspace TypeScript checks and ESLint passed.                                                       |
| `npm test`             | 75 passed across native speech integration, the API prototype, course packs, and the offline engine. |
| `npm run packs:verify` | The 433,869-byte LQP 2.1.0 pack matched its catalog and SHA-256 sidecar.                             |
| `npm run build:web`    | Exported the static app and generated the offline shell for 76 assets.                               |
| `npm run test:e2e`     | All 41 Chromium scenarios passed in one run on the final Web export.                                 |
| `npm run build:apk`    | Built and verified the standalone 2.1.0 preview APK (version code 100084) for ARM64 and ARMv7.       |

The Android module task `:offline-tts:testReleaseUnitTest` passed all five JVM tests for English voice selection.

Run `npm run build:web`, start `npm run preview`, then run `npm run test:e2e`. Set `SCREENSHOTS_DIR` to a writable directory to capture the same screens. The browser suite blocks API and external requests. Offline scenarios wait for the service worker to take control before disconnecting Chromium.

The first full suite passed 39 of 41 scenarios. The grammar handbook and A1–A2 lesson tests exposed missing accessibility states for Web tabs and radio buttons. The final run includes both fixes and verifies that the selected answer is restored after reload.

New browser scenarios exercise the full first chapter, independent responses in new settings, retry evidence, targeted `be` practice, and a review after two simulated days. They open the grammar handbook from **Aprender**, compare sentence patterns by keyboard at a narrow viewport, and complete the original **Me presento** lesson offline through **Cursos A1–A2**. Challenge checks visit both the travel trial and the separate 13-level textbook track. The course lesson, travel chapter and challenge views use their own saved progress.

The delayed interval and enlarged text checks use a controlled browser clock and CSS font scaling. Recording and system recognition browser scenarios use controlled fixtures. Physical-device checks include installation, first launch in airplane mode, microphone recovery and replay, TalkBack, system font scaling, and low-end performance. [Offline acceptance plan](OFFLINE_TEST_PLAN.md)

The Android archive contains the Hermes runtime for both architectures, the embedded travel and textbook content, 19 fonts, 18 bundled MP3 clips, and the journal artwork. All 18 MP3s and 11 journal JPEGs match the source files byte for byte. The APK signature, ZIP integrity, SHA-256 sidecar, and manifest were checked. The manifest declares `com.lingoquest.app`, API 24 minimum, target API 36, and disabled automatic backup. The 49,138,078-byte APK uses the existing preview signing certificate. Its SHA-256 is `ef8b58e65fc04d5aa5b97147cbfbc51d6f32c3a15166feb565bec62c49d17f48`. Device installation stays pending because this environment has no attached Android device or emulator acceleration. [APK build and signing](APK_BUILDS.md)

The browser checks verify application behavior. The pretest, posttest, and delayed-test protocol is for collecting learning outcomes with real beginners. [Chapter 1 assessment design](CHAPTER_1_ASSESSMENT.md)

### Phase 3 screenshots

Captured in Chromium at a 390 × 844 CSS-pixel viewport from the local Web app.

- [Greeting Sam in the plaza](screenshots/phase-3/01-plaza-dialogue.jpg)
- [Speaking rehearsal with local recording](screenshots/phase-3/02-speaking.jpg)
- [Offline dictation in the directions mission](screenshots/phase-3/03-offline-dictation.jpg)
- [Writing for a different lost-property situation](screenshots/phase-3/04-transfer.jpg)
- [Feedback on agreement with be](screenshots/phase-3/05-be-agreement-feedback.jpg)
- [Vocabulary reference in the original A1–A2 course](screenshots/phase-3/06-legacy-reference.jpg)
- [Passport and saved journal entry](screenshots/phase-3/07-passport.jpg)
- [Adaptive review after repeated errors](screenshots/phase-3/08-adaptive-review.jpg)
- [Sentence patterns in the grammar handbook](screenshots/phase-3/09-grammar-handbook.jpg)

## Travel curriculum and redesigned welcome history

That version opened the chapter directly or offered a short assessment to choose among its three missions. Browser checks covered welcome action spacing at 320 px, the recommended starting mission, offline vocabulary and audio, saved progress, and preserved archived history. Screenshots came from the locally built Web export.

TypeScript, ESLint, 67 unit and integration tests, the archived LQP checksum, the Web export, Android Hermes export, and Android native prebuild passed. The Web service worker includes 58 offline files. Both bundles include the travel exercises and omit the old textbook pack. Physical Android acceptance remains pending.

### Screenshots from that revision

- [Welcome on a 390 px viewport](screenshots/08-bienvenida.jpg)
- [Starting-mission recommendation](screenshots/09-prueba-ruta.jpg)
- [Mission vocabulary and reference audio](screenshots/10-vocabulario-viaje.jpg)
- [Desktop travel journal](screenshots/11-cuaderno-escritorio.jpg)
- [Mobile travel journal](screenshots/12-cuaderno-movil.jpg)
- [Travel learning guide](screenshots/13-guia-de-viaje.jpg)
- [Mobile travel journal in dark mode](screenshots/14-cuaderno-movil-oscuro.jpg)
- [Travel map](screenshots/15-mapa-de-viaje.jpg)
- [Listening in the placement assessment](screenshots/16-escucha-prueba.jpg)

## LingoQuest 2.0 travel verification history

The travel implementation was verified locally on 2026-11-18 before integrating the latest system speech-recognition changes from `main`. TypeScript, ESLint, the LQP 2.1.0 checksum, and 60 unit and integration tests passed. Of 40 browser scenarios, 37 passed in one run and three passed on separate reruns after updating their assertions for the redesigned home, saved lesson checkpoints, and the practice evidence count. The Android Hermes export, signed ARM preview APK build and signature check, and five native offline voice tests passed on that revision. The APK contained the current course, fonts, both travel images, and all 11 audio clips. The original Gradle attempt met the environment’s memory limit. A 2560 MB heap and one worker completed the build.

Chromium verified that the travel chapter could run offline from a Caribbean origin, restore a partial answer and feedback after reload, play Sam’s bundled audio, award one stamp, and save a travel journal entry. A separate offline check opened course reference material without changing practice records or XP. The home layout was checked at 320, 360, and 390 px with text scaled to 150%.

After rebasing onto the current `main`, TypeScript, ESLint, LQP verification, 65 unit and integration tests, Web and Hermes exports, and Android native prebuild passed. Of 22 targeted browser scenarios, 21 passed in one run. The remaining travel test passed on rerun after waiting for the origin picker to close. The browser tests verified that travel speaking uses local recording and the ordinary course keeps opt-in recognition.

### Screenshots

- [Desktop home](screenshots/01-inicio-web.jpg)
- [World map](screenshots/02-mapa-web.jpg)
- [Mobile home in dark mode](screenshots/03-inicio-movil-oscuro.jpg)
- [Passport and journal](screenshots/04-pasaporte.jpg)
- [Mission feedback](screenshots/05-mision-movil.jpg)
- [Course library](screenshots/06-cursos-web.jpg)
- [Challenge entry](screenshots/07-desafios-web.jpg)

Real beginners and physical Android checks for airplane mode, microphone, system font scaling, TalkBack, and low-end device performance remain for acceptance. [Manual test plan](OFFLINE_TEST_PLAN.md)

## Integrated course 1.3 verification history

The checks on 2026-11-08 in the America/Belize time zone ran locally with Node.js 24.22.1, Linux, and Chromium. The app backend stayed offline, and the new edition was neither pushed nor published.

| Command                       | Observed result                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --no-audit --no-fund` | Installed existing dependencies without adding packages.                                                                                                               |
| `npm run check`               | TypeScript and ESLint passed across the workspaces.                                                                                                                    |
| `npm test`                    | 54 of 54 passed: 17 API prototype, 16 course pack, and 21 offline engine tests.                                                                                        |
| `npm run packs:build`         | Built 8 units, 32 lessons, 360 exercises, and 67 challenge questions with LQP schema 2 and version 2.0.0.                                                              |
| `npm run packs:verify`        | The 385,955-byte release file matched the catalog and SHA-256 sidecar.                                                                                                 |
| `npm run build:web`           | Exported the static site with a 36-asset offline shell.                                                                                                                |
| `npm run build:android`       | Exported the Android Hermes bundle. Signed APK generation is a separate workflow.                                                                                      |
| `npm run test:e2e`            | 14 of 15 passed initially. After correcting the placement test's multiple-choice assumption, the remaining scenario passed on its own. All 15 scenarios were verified. |
| `git diff --check`            | Passed.                                                                                                                                                                |

The full pack SHA-256 was `c6b4b3464dad8c21bbb25f01999a91085f6213fa9bda06f4f132cf0393984e64`. The web JavaScript and Android Hermes outputs contained the latest bundled pack's manifest checksum, confirming that the checks used the new bundle.

## Coverage

Offline engine tests cover completion of all 32 lessons and 360 exercises, 13 challenge levels, timers and hearts, local idempotency, unchanged learning snapshots after challenges, rejection of direct unlock calls for unstudied material, question-pool filtering, four evidence dimensions, matching and retries, evidence across days, insufficient mastery evidence from one recognition question, backup restore, and preservation of format 1 data.

Content validation tests cover SHA-256, tampering, size and version, unique IDs, missing translations and answers, prerequisite and review references, seven-stage order, ambiguous options and pairs, untaught English and valid Spanish glosses, media references and sources, and required lesson references for challenges. The historical API tests were also updated for matching scores and curriculum assumptions. The app uses the local engine.

Manual review at 390×844 confirmed that the initial path and vocabulary cards were readable without horizontal overflow or JavaScript errors. The 15 browser scenarios cover starting from scratch, seven offline lesson stages, retries, four evidence dimensions, review after two days, offline cold start, mobile navigation, 40 text-based pronunciation drills, optional placement and an airport mission, rejection of remote-only voices, matching, synthetic local recording and replay, 13 challenge levels, pack updates and downloads, backup restore, and export before confirming a reset of old data. The network interceptor found no unauthorized external or API requests.

Initially, 14 end-to-end tests passed and one failed because the placement test assumed all questions had radio options. The new content includes fill-in-the-blank questions. After updating the test to answer according to the exercise type, `npm run test:e2e -- --grep 'placement and a complete airport mission'` passed in 3.4 seconds. The app required no fix.

## Test limitations

Signed APK build and installation, airplane mode, TalkBack, low-end performance, the file picker, and physical microphone and permission checks were outside these runs. The browser recording test used synthetic input. Recording quality still requires real hardware. The original draft curriculum requires native-speaking teachers to review its naturalness, CEFR pacing, cognitive load, and accepted answers. The course has no prerecorded reference audio. Native TTS is disabled unless it can be verified offline. Pronunciation scores are unavailable.

## Interface animation verification · 2026-11-10

The update added an original local SVG compass character, blinking and swaying, a jump on correct answers, one-shot confetti, button bounce, content entrances, and a smooth progress bar without new packages. Either the system or app reduced-motion preference disables decorative animations and updates progress immediately.

- `npm run check` passed workspace type checks and ESLint.
- `npm test` passed 56 of 56 tests (17 API, 16 course pack, 23 offline engine).
- All 17 existing learning, theme, and motion browser checks passed. All three new animation cases passed on rerun after adding compatible ARIA progress attributes because React Native Web did not translate `accessibilityValue` into a progress value.
- The new tests sampled animation frames and checked live system preference changes, button scaling, keyboard operation, progress bar persistence between steps, automatic end of celebration, saving the mobile preference, and disabled animation after reload. The interceptor found no additional API or external requests.
- The home screen was reviewed at 1440×1000 and 390×844, along with the mobile lesson screen. Mobile had no horizontal overflow.
- Web and Android exports, formatting of changed files, and `git diff --check` passed.

Android verification covered the Hermes bundle export. APK installation, real-device animation performance, and TalkBack remain pending. The edition was neither pushed nor published remotely.

## PR #7 sync with main · 2026-11-10

The sync integrated main at `ee094cd`, including PR #5 for keyboard avoidance and PR #6 for answer submission feedback. Conflicts in `FeatureUI.tsx` and `LessonStages.tsx` were resolved manually. The result kept input visibility, keyboard spacing, automatic scrolling to feedback, answer submission and explanations, animation, and the progress bar without remounting it. Content scroll position resets between lesson steps.

After integration, `npm run check`, web and Android Hermes exports, formatting checks, and `git diff --check` passed. All 18 browser regressions in `feedback.spec.ts`, `keyboard.spec.ts`, `learning.spec.ts`, and `motion.spec.ts` passed in 2.1 minutes. Android device acceptance remained pending.
