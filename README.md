# LingoQuest 2.1 · Learning First

[Español (Latinoamérica)](README.es-419.md) · [Development rules](AGENTS.md)

**Aprende inglés, descubre el mundo.**

LingoQuest is an Android-first app for learning American English (`en-US`) with a Latin American Spanish (`es-419`) interface. Travel, lessons, reviews, and challenges work offline without an account or backend.

## Explore and learn

- **Comenzar mi aventura** opens **La primera postal**. Meet Sam and Luz in the plaza, use a ticket to find the bus stop, and choose a lead to recover Sam's backpack. Each mission includes its full English lesson. The adventure earns a stamp, postcard, and journal entry. [Chapter walkthrough](docs/PHASE_4_RPG.md)
- **Ya sé algo de inglés** offers six optional, un-timed questions. Your answers suggest one of the three published missions. Earlier missions stay playable. You can retake the assessment from **Aprender** or **Perfil**.
- **Mapa** covers 20 stops across seven continents and ends in Antarctica via Ushuaia. Choose an origin in Latin America or the Caribbean. Choose **Abrir capítulo** at a destination to open its lessons, illustrations, and English audio. The app downloads the pack when needed.
- In **Aprender**, choose **Lecciones** to start or resume a chapter lesson directly. **Aprender** also offers the vocabulary guide, grammar handbook, pronunciation practice, and **Cursos A1–A2**, with eight units and 32 lessons from the LQP 2.1.0 course. Android loads each unit from its destination pack. Start any course lesson or pick up the most recent draft.
- **Repaso rápido** offers one practice item. **Repasar** shows queued reviews and **Mis habilidades** shows chapter evidence and skills to revisit. Review timing accounts for assistance, errors, independent retrieval, delay, and use in a fresh context.
- **Desafíos** offers the original 13-level A1–A2 course track and the optional journey track. Travel ranks 1–3 open with the chapter stamp. The course levels open with the relevant lessons. Timers can be turned off in practice. Travel stages, challenge results, and XP describe activity. Curriculum bands are teaching targets.

[20-stage curriculum and prerequisites](docs/PHASE_3_CURRICULUM.md) · [Adaptive learning design](docs/PHASE_3_ADAPTIVE_LEARNING.md) · [Chapter 1 pre-, post-, and delayed assessment](docs/CHAPTER_1_ASSESSMENT.md)

[Chapter 1 item audit](docs/CHAPTER_1_CONTENT_AUDIT.md) · [Speaking and cross-course evidence design](docs/LEARNING_EVIDENCE_INTEGRATION.md)

## Development and builds

Use Node.js 24 or later and npm. Start Web development with `npm ci` and `npm run dev`, then open `http://localhost:8081`. For an offline browser preview, run `npm run build:web` and `npm run preview`, then open `http://localhost:3000`. Wait for the service worker cache before disconnecting. On first launch, the app downloads **La primera postal** and shows the progress. When you continue to Ciudad de México, the app downloads chapter 2 and then removes the first chapter’s saved resources.

```sh
npm run check
npm test
npm run packs:verify
npm run packs:chapters -- --verify
npm run build:web
npm run preview          # Run in a separate terminal before the browser tests.
npm run test:e2e
npm run build:android    # Android Hermes export
npm run build:apk        # Standalone Android preview APK
```

The APK build uses Java 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, and CMake 3.22.1. Local APKs and checksums go to `work/apk/`. [APK build instructions](docs/APK_BUILDS.md) · [Verification and screenshots](docs/VERIFICATION.md) · [Manual acceptance plan](docs/OFFLINE_TEST_PLAN.md)

## Local data, course packs, and speech

Android uses SQLite and Web uses browser storage. The adventure saves its current scene, choices, and items. Missions, textbook lessons, and quick reviews save drafts and feedback locally. Export or restore a format-2 backup from **Perfil**. Earlier textbook progress uses the same lesson IDs. [Chapter pack releases](docs/CHAPTER_PACKS.md) · [Legacy course packs](content/releases/README.md) · [Travel architecture and Phase 3 audit](docs/TRAVEL_ARCHITECTURE.md)

Open **Configuración de voz** to choose an installed English voice and rate. Chapter listening and speaking models can play American English clips from the chapter pack when the saved voice is unavailable. Downloaded chapter lessons play their own English audio. Textbook reference audio can also use the downloaded audio for its chapter. Chapter speaking on Android uses the recognizer selected in system settings after a disclosure about possible online audio processing. A matching final transcript completes the speaking check and provides content and grammar feedback. Supported devices capture a temporary recording during recognition and can play the example followed by the recording. Learners can skip without microphone access. The separate system recognition option may process audio online through the operating system provider. Pronunciation assessment remains a human observation in the study rubric. [Speech and privacy](docs/OFFLINE_EDITION.md) · [Asset credits](docs/TRAVEL_ASSETS.md)
