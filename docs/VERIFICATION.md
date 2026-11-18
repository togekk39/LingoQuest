# Integrated course verification record

[Español (Latinoamérica)](VERIFICATION.es-419.md)

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
