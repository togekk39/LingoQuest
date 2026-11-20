# Offline architecture and speech

[Español (Latinoamérica)](OFFLINE_EDITION.es-419.md)

The app ships the first travel chapter and the eight-unit, 32-lesson LQP 2.1.0 textbook. Open the latter through **Aprender → Cursos A1–A2**. Earlier format 2 history and lesson drafts use the original identifiers. [Textbook curriculum model](INTEGRATED_CURRICULUM.md)

`apps/mobile/src/lib/api.ts` calls `packages/offline-engine` locally for grading, spaced review, XP, challenges, and backups. Android uses SQLite and Web uses localStorage. Travel uses no timer or hearts. Its optional challenge ranks unlock only when the relevant chapter is complete.

The APK workflow generates the standalone Android installer. `npm run build:android` verifies the Hermes bundle. The web app can restart offline after its static assets and service worker have been downloaded.

The travel chapter packages American English clips alongside the map and illustrated journal. Vocabulary, examples, dialogues, and listening prefer the installed English voice chosen in **Configuración de voz**. Chapter activities can use a bundled reference clip when system speech is unavailable. Textbook audio depends on an installed offline English voice. Speaking tasks offer comparison with the audio captured during recognition on supported devices. Learners can listen to the model or skip the task without microphone access. [Travel architecture](TRAVEL_ARCHITECTURE.md)

Voice settings include a preview using system TTS. The Android native bridge accepts installed offline English voices and prefers the system's default English voice when available. Playback requests an English locale and voice regardless of the app or device language. Android sets the selected dialect's locale first, then applies and verifies the offline voice. If the engine rejects it or keeps another voice, playback stops and the app shows a notice. iOS explicitly selects an installed English voice. Browsers use English voices with `localService === true`. Speech settings on mobile and desktop offer voice selection, a preview, and a system rate or 0.75×, 1×, or 1.25× playback. Saved preferences apply throughout. On Android, users can open system TTS settings, and the app refreshes engines and voices on return. If an offline English voice is unavailable or has been removed, the app prompts the learner to install or reselect one. Speech synthesis runs offline. The native bridge requires a rebuilt APK or development build because Expo Go lacks the module. Recording and playback are optional. Recordings stay local and are deleted on exit. The app offers no automated pronunciation scores and does not treat a text match as evidence of accurate pronunciation.

## Speech recognition (STT)

Travel missions and phrase drills on Android show that the system-selected speech service may process audio online. Recognition begins when the learner taps **Reconocer con el servicio de Android**. Android resolves the current default speech recognizer for each attempt, including Marmalade STT when selected in Android settings. The app requests `en-US` and prefers offline recognition. The selected provider determines how it processes speech. [Android speech recognizer](<https://developer.android.com/reference/android/speech/SpeechRecognizer#createSpeechRecognizer(android.content.Context)>)

On iOS and Web, **Ver opción de reconocimiento que puede usar internet** reveals the system or browser recognizer in supported phrase drills. Learners can play the example or skip without microphone access.

The live transcript appears as the selected recognizer returns interim results. Some providers return only the final text. The app gives sentence and grammar feedback after recognition ends. The completed final transcript must match the reference or an accepted course variant to pass. In the introduction, the learner speaks as Luz and can use forms such as `I am`, `I’m`, and `My name is`. **Ahora no puedo hablar** advances without recording speaking practice.

Supported native recognizers capture a temporary local copy during the same attempt. **Escuchar ejemplo y mi grabación** plays the model first and the recording second. The app deletes the recording on retry or exit and leaves transcripts out of learning history. This feature uses the `expo-speech-recognition` module. Browsers can use the explicit system option in phrase drills where supported. The Android APK workflow builds the installer. Unit and browser checks cover recognition routing and the fallback flow. Use the [physical Android procedure](OFFLINE_TEST_PLAN.md#android-speech-recognition-in-airplane-mode) to verify real speech recognition.

### Android assessment for future speech work

The Android path uses `createSpeechRecognizer(Context)` to follow the user’s system selection. The selected provider may disregard `EXTRA_PREFER_OFFLINE`. Real airplane-mode behavior still needs verification on supported phones. A packaged recognizer such as sherpa-onnx would remove the system provider dependency while adding model size, native compatibility, and performance work. Either path produces a transcript. Validating whether a learner conveyed the intended meaning needs separate evidence, and pronunciation and intelligibility need calibrated human assessment or an independently validated method. The chapter records listening, imitation, or recording as practice activity. The study uses a human listener for its oral rubric. [Chapter 1 assessment](CHAPTER_1_ASSESSMENT.md)

## Data and backups

Local state and backups use format 2. The app blocks reads and writes for format 1 prototype data and lets users decide whether to reset. It preserves the old bytes automatically and lets users export them from the error screen before confirming a reset. The exported format 1 data cannot be restored into format 2. Users can export and select current backups in **Perfil** and confirm before overwriting progress. Restore excludes active challenges.

The offline edition has no login, Supabase, VPS, cloud AI, telemetry, or external speech assessment. The historical prototype remains in `apps/api` and the SQL files.
