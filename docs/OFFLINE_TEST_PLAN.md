# Travel curriculum offline acceptance test plan

[Español (Latinoamérica)](OFFLINE_TEST_PLAN.es-419.md)

Follow the [verification record](VERIFICATION.md) for automated results and limitations. Run these checks without starting Fastify, signing in, or connecting a cloud account.

## Welcome and starting mission

1. With fresh data, open the app at 320, 360, and 390 px, then repeat with larger text and dark mode. Check that the two actions are easy to tell apart and that the close button is accessible. **Empezar mi viaje** opens the plaza scene.
2. From the welcome, choose **Ya sé algo de inglés** and skip all six questions. Check that **Ir a mi misión** opens **Un saludo en la plaza**.
3. Retake the assessment in **Aprender**. Answer only the first two correctly to start at the bus stop. Answer the first four correctly without a transcript to start at lost and found. Confirm earlier missions can still be opened and the assessment awarded no XP, stamps, or completed missions.

## Vocabulary, missions, and review

1. Cache the Web app or install the preview APK, then disconnect. Reach **Palabras del viaje** in a mission. Verify that each card gives the Spanish meaning, when to use the word, and an example in both languages. Play the word and example and change the audio speed. Open **Aprender** to access the same material directly.
2. Leave midway through the vocabulary, reopen, and verify the same card. Repeat with a partial text answer, with the feedback showing, and after collecting the stamp. Switch available missions and verify the previous draft is still there when reopened.
3. Give a wrong answer and verify the Spanish explanation and retry. Try the listening transcript and optional local recording. Finish the chapter and check that the passport, postcard, and journal persist with one stamp.
4. Open **Repaso rápido**, answer a prompt, and return to the exact step of your journey. Check that **Repasar** shows practice from the travel chapter.
5. Choose your place of origin from the map. Check the 20 stops and the destination at Ushuaia and Antarctica. Future stops should show **En preparación**.

## Challenges, backups, and native checks

- Before earning the chapter stamp, the three authored challenge ranks should be locked. After the stamp, test a timed run and practice without the clock. Later ranks should show **En preparación**. A lost challenge leaves learning XP and travel progress intact.
- From **Perfil**, export and restore a format 2 backup on a second installation. Verify preferences, travel checkpoints, collectibles, and any archived textbook progress. Format 1 data can be exported before an explicitly confirmed reset.
- On a physical Android device, check signed APK installation, first launch in airplane mode, microphone permissions and replay, TalkBack, system font scaling, reduced motion, the file picker, and performance on a low-end device.
- With the Android and iOS keyboards open, verify the mission and placement text fields and their action buttons remain reachable. Change keyboard height and dismiss and reopen it. Verify drafts persist and the screen adjusts without double spacing.
- Try local recording with networking off. If you choose optional system recognition, check that you see its provider disclosure before permissions. Check that system TTS settings offer an installed offline English voice or explain why none is available.

```bash
npm run check
npm test
npm run packs:verify
npm run build:web
npm run build:android
npm run preview
# In another terminal:
npm run test:e2e
```

Real beginners and language teachers should review the welcome flow, the chapter's explanations, and the diagnostic's recommendations.
