# LingoQuest · Integrated offline edition 1.3

[Español (Latinoamérica)](README.es-419.md) · [Development rules](AGENTS.md)

LingoQuest is an Android-first offline English-learning app built with Expo, React Native, and TypeScript. The learning interface uses Latin American Spanish (`es-419`), and the target language is American English (`en-US`). The complete A1–A2 course is available after installation without an account, backend, cloud AI, speech API, or credentials.

## Development and builds

Use Node.js 24 or later and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:8081`. The app runs without an `.env` file or API server. Use `npm run android` for Android development. For a static browser preview, run `npm run build:web` and `npm run preview`, then open `http://localhost:3000`. The browser must first load the static files and install the offline cache. The Android installation package includes the course and fonts.

`npm run build:android` verifies the Android Hermes export. The [Android APK workflow](https://github.com/togekk39/LingoQuest/actions/workflows/android-apk.yml) builds the installable APK. See [APK build instructions](docs/APK_BUILDS.md). This edition has yet to be pushed or published remotely.

## Starting from scratch

On first launch, **Empiezo desde cero** opens the first lesson. **Ya sé algo de inglés** opens an optional placement assessment. Learners can set their name, goal, and motivation later.

The course has eight units based on everyday situations, 32 lessons, 200 new vocabulary items, 68 explicit vocabulary reviews, and 360 exercises. Each lesson integrates vocabulary, grammar, and a communication goal across seven stages.

1. **Meta** presents the situation and a practical goal in Spanish.
2. **Vocabulario** introduces English words and phrases with Spanish meanings, parts of speech, and bilingual examples, followed by meaning recognition and matching.
3. **Gramática** teaches one main pattern and explains the function words and forms it requires.
4. **Conversación** presents an original short dialogue with Spanish support for each line.
5. **Práctica** progresses from guided fill-in-the-blank, reordering, and error correction to short responses.
6. **Hablar** lets learners hear a verified local voice, use speech recognition, record and replay audio offline, or skip the activity.
7. **Recordar** reviews vocabulary and patterns and schedules later practice.

The first unit, **¡Hola! Mucho gusto**, begins with `I am` and `You are` in **Me presento**, then covers introducing family, describing people and things, and asking about identity and origin. Later units cover daily routines, questions, the past, ongoing actions, future plans, experiences, travel, and work. The sources are in `content/source/curriculum.ts` and the unit authoring files. This course replaces the grammar-first curriculum built around a fixed set of eight seed sentences.

**Aprender** offers explanations and retries without timers or heart penalties. Lesson completion, XP, long-term mastery, and challenge results are tracked independently. The app records separate evidence for vocabulary recognition, vocabulary recall, grammar understanding, and grammar production. A single correct choice cannot establish mastery. Reviews gather evidence at intervals of 1, 3, 7, and 14 days.

**Desafíos** is an optional local mode with 13 levels, a timer, and hearts. The engine checks lesson completion and draws questions from material the learner has studied. The current topic is everyday routines in the present tense. Failing, running out of time, or quitting leaves learning XP and lesson completion intact.

## Offline course packs and validation

A single curriculum source generates a strictly validated LQP JSON schema 2 package.

```bash
npm run packs:build
npm run packs:verify
```

The default course version is `2.0.0`, with minimum app version `1.3.0`. `content/releases/` contains the package, SHA-256 checksum, and catalog. `apps/mobile/src/content/bundled-course.json` is the identical bundled copy. This edition ships schema 2 release files.

Validation checks unique IDs, translations, answers, ambiguous options, vocabulary, skill and prerequisite references, stage order, asset references, and English used before it is taught. A contextual gloss can supply a Spanish meaning for a function word. See the [curriculum authoring guidelines](docs/INTEGRATED_CURRICULUM.md).

Use **Perfil → Contenido sin conexión** to import a file fully offline. A network request occurs only when the learner pastes a GitHub file URL and selects download. The new pack is pending remote publication, so the download field starts empty and the catalog URL identifies the intended release. The app validates the entire pack before activating it and keeps the active pack if import fails. See the [course pack release process](content/releases/README.md).

## Development data reset

This edition uses local progress and backup format **2**. On startup, the app explains that format 1 prototype data is incompatible, blocks reads and writes, and preserves the stored data.

Select **Guardar copia de los datos anteriores** to save the old data to a location of your choice. Then select **Restablecer datos locales**, read the deletion details, and confirm. Reset removes the old local profile, answers, XP, lesson completions, and challenge history. It keeps the course and opens the starting screen again. The old file is for reference only and cannot be restored into format 2. You can leave without confirming to keep your data.

**Exportar mis datos** and **Restaurar respaldo** support format 2 local backups. Restoring requires confirmation before overwriting progress and excludes in-progress challenges. Back up your data before uninstalling the app or clearing app storage.

## Speech, assets, and privacy

The home screen and lessons use an original compass character that blinks, sways, and jumps after correct answers. Other effects include brief confetti, button bounce, content entrance animations, and a smoothly updating progress bar. They use React Native Animated and local SVGs without adding dependencies or network requests. The system reduced-motion setting or **Perfil → Reducir movimiento → Guardar preferencias** disables these effects while preserving text feedback, progress, and controls. Native transforms and opacity use the native driver. Animations are cleaned up when their screen is left.

The course includes neither prerecorded audio nor external images. It makes no background downloads for fonts, AI responses, or media. Existing local fonts and illustrations retain their design. New course text is original.

Pronunciation uses system TTS. The Android native bridge accepts installed offline English voices and prefers the system's default English voice when available. Playback requests an English locale and voice regardless of the app or device language. Android sets the selected dialect's locale first, then applies and verifies the offline voice. If the engine rejects it or keeps another voice, playback stops and the app shows a notice. iOS explicitly selects an installed English voice. Browsers use English voices with `localService === true`. Speech settings on mobile and desktop offer voice selection, a preview, and a system rate or 0.75×, 1×, or 1.25× playback. Saved preferences apply throughout. On Android, users can open system TTS settings, and the app refreshes engines and voices on return. If an offline English voice is unavailable or has been removed, the app prompts the learner to install or reselect one. Speech synthesis runs offline. The native bridge requires a rebuilt APK or development build because Expo Go lacks the module. Recording and playback are optional. Recordings stay local and are deleted on exit. The app offers no automated pronunciation scores and does not treat a text match as evidence of accurate pronunciation.

Speaking practice uses system or browser speech recognition (STT) to display an English transcript. The app explains before starting that the service may process audio online. The app does not store recognition audio or transcripts. A separate recording and replay option works entirely offline. See [System speech recognition](docs/OFFLINE_EDITION.md#system-speech-recognition-stt) for setup and native build requirements.

## Checks

```bash
npm run check
npm test
npm run packs:build
npm run packs:verify
npm run build:web
npm run build:android
# Start npm run preview in a separate terminal first.
npm run test:e2e
```

See [verification results](docs/VERIFICATION.md) and the [manual offline test plan](docs/OFFLINE_TEST_PLAN.md). Short responses are graded against authored sets of accepted answers for each situation. Learners can practice saying their own names in optional speaking exercises. English teachers and native-speaking editors still need to review naturalness, A1–A2 pacing, regional vocabulary, and accepted answers. Release acceptance also requires physical microphone, low-end Android, screen-reader, and production-signing checks.

`apps/api` and `supabase` preserve the historical online prototype. The offline app runs independently. See the [historical prototype verification record](docs/VERIFICATION_ONLINE_PROTOTYPE.md).
