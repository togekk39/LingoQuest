# Integrated course offline acceptance test plan

[Español (Latinoamérica)](OFFLINE_TEST_PLAN.es-419.md)

See the [verification record](VERIFICATION.md) for automated results and limitations. Run these checks without starting Fastify, signing in, or using a cloud account. Browser tests intercept `/v1/`, `/api/`, and external requests without explicit permission.

## Starting from scratch

1. Start with empty storage. Verify that **Empiezo desde cero** opens **Me presento** immediately and **Ya sé algo de inglés** opens a skippable placement assessment.
2. On Android, enable airplane mode. On the web, load static assets and the service worker, then disconnect. Complete Meta, bilingual vocabulary cards, meaning recognition, matching, grammar that explicitly teaches am and are, dialogue with line-by-line support, fill-in-the-blank and reordering exercises, and a short self-introduction.
3. Answer incorrectly on purpose. Verify that the app provides a Spanish explanation, the answer, and a retry. Learning has no timer, hearts, or XP deductions. Using a hint does not count as independent production.
4. Verify that speaking can be skipped before the app requests microphone access. Optional recordings can be replayed or recorded again locally and are deleted on exit. Verify that the app explains when no verified local voice is available and provides no invented pronunciation score.
5. After completion, check the vocabulary, patterns, and review date. Restart and verify that completion and XP persist. Check the next day and again after two days for vocabulary recognition, vocabulary recall, grammar understanding, and grammar production, and verify that practice works offline.

## Challenges and content packs

- On a fresh device, verify that challenges with unstudied prerequisites are locked and that direct engine calls are rejected. After units 1 and 2, check 13 levels and three exercise types. Timeouts, incorrect answers that cause failure, and exits leave learning XP, completion, and mastery evidence intact.
- Import a new LQP pack offline. Updates within the same schema must retain stable lesson IDs. Verify rejection for a bad checksum, downgrade, invalid reference, untaught vocabulary, missing answer, and ambiguous choice. Failed imports preserve the active pack and progress.
- Check that the download field starts empty. Network requests occur only after the user enters a GitHub URL and selects download. The automated test intercepts release file requests to verify the download flow. The new version remains pending publication.

## Data and other features

- Start with format 1 prototype data. Verify that the app explains the incompatibility and leaves the data intact. Export the original bytes, verify that canceling a reset preserves the data, then confirm a reset and verify that the starting screen opens. The old file cannot be restored into format 2.
- Verify preferences, export, deletion, and confirmed restore of current data. An active challenge is excluded from restore.
- Verify navigation on a 390 px mobile viewport, optional placement, text-based pronunciation practice, and the airport and job application text missions.
- On a physical Android device, open a fill-in-the-blank or short response exercise in **Un día en familia**. Focus the input. It should scroll fully above the keyboard and bottom button, retain focus while typing, and allow direct taps on **Comprobar respuesta**. Try a placement text question that fits without scrolling before the keyboard opens. When the keyboard covers the app, the bottom spacer should match the actual overlap and move the content and button above it. If the system has already resized the window, avoid adding the same space twice. Change keyboard height, close it, and reopen it. Content should stay visible, the spacer should disappear when the keyboard closes, and entered text should persist. Enter more than 30 lines. The input should fit in the visible area and scroll internally. When adding lines at the end, the cursor should stay visible and the page should not jump to the top of the input. Repeat keyboard avoidance checks on iOS. Browser automation covers both window resizing and simulated visual viewport shrinkage with a fixed layout. Run native keyboard acceptance checks on devices.
- Verify that speech synthesis is skipped when only remote voices are present. Optional recording and replay send no audio.

```bash
npm run check
npm test
npm run packs:build
npm run packs:verify
npm run build:web
npm run build:android
npm run preview
# In another terminal:
npm run test:e2e
```

Check airplane mode, TalkBack, microphone permissions, low-end performance, low storage, file picker, and signed APK installation on physical Android hardware. The curriculum still requires human language and teaching review.
