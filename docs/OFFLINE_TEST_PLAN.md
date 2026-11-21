# Travel curriculum offline acceptance test plan

[Español (Latinoamérica)](OFFLINE_TEST_PLAN.es-419.md)

Follow the [verification record](VERIFICATION.md) for automated results and limitations. Run these checks without starting Fastify, signing in, or connecting a cloud account.

## Welcome and starting mission

1. With fresh data, open the app at 320, 360, and 390 px, then repeat with larger text and dark mode. Check that the two actions are easy to tell apart and that the close button is accessible. Choose an origin after **Empezar mi viaje** to open the plaza scene.
2. From the welcome, choose **Ya sé algo de inglés** and skip all six questions. Check that **Ir a mi misión** opens **Un saludo en la plaza**.
3. Retake the assessment in **Aprender**. Answer only the first two correctly to start at the bus stop. Answer the first four correctly without a transcript to start at lost and found. Confirm earlier missions can still be opened and the assessment awarded no XP, stamps, or completed missions.

## Vocabulary, missions, and review

1. Cache the Web app or install the preview APK, then disconnect. Reach **Palabras del viaje** in a mission. Verify that each card gives the Spanish meaning, when to use the word, and an example in both languages. Play the word and example and change the audio speed. Open **Aprender** to access the same material directly.
2. Leave midway through the vocabulary, reopen, and verify the same card. Repeat with a partial text answer, with the feedback showing, and after collecting the stamp. Switch available missions and verify the previous draft is still there when reopened.
3. Give two `be` agreement errors in the introduction scenes. Verify the Spanish explanation, repair in another scene, and a new attempt without the answer displayed. Verify in **Mis habilidades** that assisted responses and later independent responses remain separate.
4. Listen to Sam with the bundled audio, try opening the transcript, and type the next indication from its audio. Try the audio comparison after recognition and the microphone-free skip. Check that the alternative leaves speaking ability unassessed. Finish the chapter and check that the passport, postcard, and journal persist with one stamp.
5. Open **Repaso rápido**, save part of a response, and return to the same step of your journey. Reopen the review and finish the response. After a full day, revisit **Repasar**, finish a due exercise without help, and check the delayed-recall evidence in **Mis habilidades**.
6. From **Aprender**, open the grammar handbook and compare two patterns. Open **Cursos A1–A2** in airplane mode, consult a reference, and resume an old lesson from a draft.
7. Choose your place of origin from the map. Check the 20 stops and the destination at Ushuaia and Antarctica. Future stops should show **En preparación**.

## Challenges, backups, and native checks

- Before earning the chapter stamp, the three authored travel challenge ranks should be locked. After the stamp, test a timed run and practice without the clock. Later travel ranks should show **En preparación**. Open the separate textbook track, verify all 13 ranks are listed, and play after completing its prerequisite lessons. A lost challenge leaves learning evidence and travel progress intact.
- From **Perfil**, export and restore a format 2 backup on a second installation. Verify preferences, travel and textbook checkpoints, learning evidence, and collectibles. Format 1 data can be exported before an explicitly confirmed reset.
- On a physical Android device, check signed APK installation, first launch in airplane mode, microphone permissions and replay, TalkBack, system font scaling, reduced motion, the file picker, and performance on a low-end device.
- With the Android and iOS keyboards open, verify the mission and placement text fields and their action buttons remain reachable. Change keyboard height and dismiss and reopen it. Verify drafts persist and the screen adjusts without double spacing.
- With Android offline, set an English TTS engine or voice in system settings. In a mission, play a word with **Predeterminada del sistema**. Open **Configuración de voz** from the mission header, select another installed English voice and speed, save, and replay the word and example. Check dialogue and assessment listening, and confirm that the selection persists after reopening. Repeat with an unavailable default voice and check the notice for bundled audio.
- Try recognition and audio comparison with networking off. If you choose optional system recognition, check that you see its provider disclosure before permissions. Check that system TTS settings offer an installed offline English voice or explain why none is available.

## Android speech recognition in airplane mode

1. Install the rebuilt standalone APK on a physical phone running Android 13 or newer. While connected, select an offline-capable speech recognizer in Android settings and confirm that its English model is installed. Record the phone model, Android version, recognizer version, and APK SHA-256.
2. Enable airplane mode, turn Wi-Fi and mobile data off, and relaunch the app. Open **Un saludo en la plaza** and reach the speaking step. Check the provider disclosure. Tap **Practicar hablando**, grant microphone access, and say “Hi! I’m [your name].” into the phone. Check that the live panel appears when recognition begins and displays any interim text as it arrives. Record the final transcript and the content and grammar feedback shown.
3. Repeat with silence, an introduction without a greeting, and “Hi, my name is [your name].” Verify that missing greetings and incorrect verb forms require a retry, and that both practiced forms work with your own name. After a captured attempt, tap **Escuchar ejemplo y mi grabación** and confirm that the model finishes before the recording starts.
4. Repeat in airplane mode with microphone permission denied. With a disabled service or unavailable English model, verify that the app shows guidance and leaves the skip available. Choose **Ahora no puedo hablar** without granting permission. Verify that the mission advances immediately and leaves speaking practice unrecorded.

Record the results and any provider limits in the [verification record](VERIFICATION.md). Keep browser fixtures and Android bundle checks separate from physical device results.

With the mission still open, change the system recognizer in Android settings and return. Confirm that the next attempt uses the new provider without an app restart. Test Marmalade with its English model and a second compatible provider selected in turn.

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

Use the chapter assessment protocol with real beginners to measure understanding, independent production, and later recall. [Chapter 1 assessment design](CHAPTER_1_ASSESSMENT.md)
