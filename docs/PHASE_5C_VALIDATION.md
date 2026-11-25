# Phase 5C validation

[Español (Latinoamérica)](PHASE_5C_VALIDATION.es-419.md)

Phase 5C starts from the merged Phase 5B curriculum and offline grading changes in `ad8d470fd6e886edfa627a560561cc8d1e3f8005`. The acceptance checks start with Home, then exercise the shipped 32-lesson course and the active travel packs. [Phase 5B PR](https://github.com/togekk39/LingoQuest/pull/29) · [Curriculum audit](PHASE_5B_CONTENT_AUDIT.md)

## Acceptance scenarios

| Scenario                                       | Observable result                                                                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh Story player opens Study                 | The two independent Home introduction writing tasks carry through to the Study equivalent. The Study exercise can be skipped and speaking remains available.                                       |
| Fresh Study player opens Story                 | Story still opens with Sam and Luz. Study and Story answers point to the same introduction writing target, and Story choices and rewards stay separate.                                            |
| Writing without listening or speaking          | Independent writing leaves listening and speaking without independent evidence for that target.                                                                                                    |
| Correct answer with help                       | The evidence keeps the assistance and the successful grading outcome. The answer gives no independent credit.                                                                                      |
| Retrieval error after earlier learning         | Repeated grammar errors lead to an explanation, a guided exercise and a different independent task. Earlier evidence remains available.                                                            |
| Transfer to another context                    | The Home writing activity and photo sign-up use different authored items and contexts.                                                                                                             |
| Duplicate submission                           | A single submitted answer keeps one evidence identity through rapid resubmission, reload and entry changes.                                                                                        |
| Restart while learning                         | The unfinished answer returns with its checkpoint. Feedback and prior answers replay from saved data.                                                                                              |
| Chapter 2 followed by offline Chapter 1 review | The browser loses its network connection after both chapters install. Chapter 1 review remains accessible, and opening it makes no chapter download request.                                       |
| Failed pack transfer                           | An incomplete Chapter 2 download leaves the installed chapter and saved state available. Retrying uses the same progress.                                                                          |
| Older backup restore                           | An imported format 2 file retains completion, passport stamps, challenge records, answer history, legacy schedules and an unfinished draft. Historical aggregates carry no new independent credit. |
| Placement and challenge prerequisites          | A recommendation can select a study starting point. Challenge access still depends on the required teaching.                                                                                       |
| Phase 5A story and teaching                    | The Story regression suite opens both NPCs, restores prior choices and drafts, and checks mission, inventory, passport and teaching transitions.                                                   |
| Phase 5B curriculum and grading                | The curriculum verifier and answer-grade tests cover shipped content, prerequisites and all four outcomes.                                                                                         |

The browser checks use the exported app and the local preview server. Their network guard rejects service APIs and external requests. Browser offline mode covers the web app and its stored chapters. Physical Android airplane mode, installed voices and Android microphone behavior require a device run. [Browser tests](../tests/e2e) · [Android test plan](OFFLINE_TEST_PLAN.md)

The restore test uses the Phase 5B format 2 contract. Format 1 prototype backups remain incompatible with the integrated course. Restoring format 2 keeps historical challenge feedback and personal bests, with a fresh timer and lives when the learner starts a new run.

## Reproduce the checks

```sh
npm ci
npm run curriculum:verify
npm run packs:verify
npm run packs:chapters -- --verify
npm run check
npm test
npm run build:web
npm run build:android
```

Start `npm run preview` in one terminal and `npm run test:e2e` in another. Playwright uses Chromium. The `Android APK` workflow provisions the pinned Android toolchain, builds a standalone ARM preview APK, runs the native English voice configuration tests, verifies the preview signature and publishes the APK with its SHA-256 checksum. [CI workflow](../.github/workflows/ci.yml) · [Android APK workflow](../.github/workflows/android-apk.yml) · [APK build instructions](APK_BUILDS.md)

## Results

The merged Phase 5B baseline passed curriculum verification with 1,567 answer checks, verification of all 20 active chapter packs, type checking and lint, 130 automated tests and Web and Android Hermes exports. Its CI and signed APK workflows passed. [Phase 5B CI](https://github.com/togekk39/LingoQuest/actions/runs/45547727601) · [Phase 5B APK](https://github.com/togekk39/LingoQuest/actions/runs/45547727538)

The local Phase 5B baseline also passed all 61 Playwright tests. Phase 5C results are recorded after running the checks against the integrated branch. Automated checks establish product behavior under the tested inputs. Learner outcomes, long-term retention and regional language register require human evaluation.
