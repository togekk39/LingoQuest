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

The restore test uses the Phase 5B format 2 contract. Format 1 prototype backups remain incompatible with the integrated course. Restoring format 2 keeps historical challenge feedback and personal bests, with a fresh timer and lives when the learner starts a new run. The file picker accepts up to 8 MiB and the import engine limits the serialized input to ten million characters. Long-history backup sizes still need measurement.

## Phase 5C correction regressions

| Scenario                              | Expected result                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Same-day transfer                  | An independently answered prompt in a new context can verify transfer on the same day. Retention remains unverified until another qualifying success after a delay.                 |
| 2. Incorrect guided answer            | The same repair remains open with feedback and a retry action. The independent confirmation is unavailable.                                                                         |
| 3. Successful guidance                | Correct guided practice leads to a new, independently answerable context. Only the successful independent confirmation resolves the pending error.                                  |
| 4. Interrupted repair                 | Relaunching restores the guidance, its answer and feedback, or the in-progress independent confirmation. An eligible review entry point can resume the saved draft.                 |
| 5. Review prerequisites               | An item with an unmet teaching prerequisite stays unavailable for independent review. Guidance remains available where its own prerequisites can be satisfied.                      |
| 6. Legacy data                        | Archived attempts, aggregates and schedules survive migration. The new record carries no formal verification without qualifying evidence.                                           |
| 7. Partial challenge readiness        | Evidence for only some required target and ability pairs leaves the relevant challenge unavailable.                                                                                 |
| 8. Challenge readiness after learning | A normal teaching and independent practice route can meet the challenge requirements while preserving its practice controls.                                                        |
| 9. Partial writing                    | The person-and-object lesson displays one of two writing objectives demonstrated. Its remaining target and oral ability stay independently tracked.                                 |
| 10. Shared learning evidence          | The introduction uses the same writing target in Story, Study and Review. Assistances, feedback, drafts and event identities stay attached to their activities.                     |
| 11. Backup and pack continuity        | Restore preserves existing progress, archived history and in-progress drafts. Failed pack updates preserve the installed chapter. Earlier chapter review remains available offline. |
| 12. Phase 5A and 5B regression        | The full browser and automated suites exercise the established story and teaching paths, published curriculum, prerequisites and grading outcomes.                                  |

Browser scenarios use the normal entry points and inspect saved evidence for the distinction between guidance, independent work and migration history. Engine tests exercise prerequisite combinations and state transitions that cannot be reached through the UI. [Browser scenarios](../tests/e2e/phase-5c-learning.spec.ts) · [Engine tests](../packages/offline-engine/test)

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

The local Phase 5B baseline also passed all 61 Playwright tests. Phase 5C passed all 1,567 grading probes, course and chapter pack verification, TypeScript, ESLint, 146 automated tests, the Web export and the Android Hermes export. The four new Phase 5C Playwright scenarios passed locally. The pull request checks report full browser regression and signed APK results for each revision. [Phase 5C pull request](https://github.com/togekk39/LingoQuest/pull/30) · [Android APK runs](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml?query=branch%3Acodex%2Fphase-5c-unified-learning)

The ARM preview APK for product source `fc80817` passed the native English voice checks and signature verification. The downloaded APK matched the published SHA-256 checksum. The follow-up Storybook test checks that a chosen practice name remains separate from the saved profile. [Signed Android build](https://github.com/togekk39/LingoQuest/actions/runs/45550917650)

The correction passed the 1,567 grading probes, course and chapter pack verification, TypeScript, ESLint and the Web and Android Hermes exports. Focused browser checks passed for same-day transfer and delayed retention, interrupted remediation, evidence sharing, partial writing, challenge denial and legacy restore. The challenge regression covers the three Home grammar ranks and the 39 course rank-and-mode combinations. Full-suite and signed APK results for the correction are recorded on the pull request. [Phase 5C checks](https://github.com/togekk39/LingoQuest/pull/30/checks)

Automated checks establish product behavior under the tested inputs. Learner outcomes, long-term retention and regional language register require human evaluation.
