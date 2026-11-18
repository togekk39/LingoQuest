# LingoQuest 2.0

[Español (Latinoamérica)](README.es-419.md) · [Development rules](AGENTS.md)

**Aprende inglés, descubre el mundo.**

LingoQuest is an Android-first app for learning American English (`en-US`) with a Latin American Spanish (`es-419`) interface. Travel, lessons, reviews, and challenges work offline without an account or backend.

## Explore and learn

- **Empezar mi viaje** opens **La primera postal**, the first travel chapter. Welcome Sam, find her bus stop, and return her backpack through dialogue, listening, word order, and writing. Each mission teaches vocabulary with American English audio, usage notes, and bilingual examples. Finish the chapter to earn a passport stamp, postcard, and journal entry.
- **Ya sé algo de inglés** offers six optional, un-timed questions. Your answers suggest one of the three published missions. Earlier missions stay playable. You can retake the assessment from **Aprender** or **Perfil**.
- **Mapa** covers 20 stops across seven continents and ends in Antarctica via Ushuaia. Choose an origin in Latin America or the Caribbean. Planned chapters say **En preparación**.
- **Aprender** opens the published missions and their vocabulary and pronunciation reference. **Repaso rápido** offers one question, and **Repasar** opens the chapter review list.
- **Desafíos** lists 13 optional ranks. The first three use grammar, cloze, and reading from the published chapter and unlock after earning its stamp. Later ranks will open with later chapters. Challenges have separate records and timer-free practice. XP, story progress, and learning evidence are tracked separately. The A1–B2 route describes curriculum goals.

## Development and builds

Use Node.js 24 or later and npm. Start Web development with `npm ci` and `npm run dev`, then open `http://localhost:8081`. For an offline browser preview, run `npm run build:web` and `npm run preview`, then open `http://localhost:3000`. Wait for the service worker cache before disconnecting. Android installs include the lessons, fonts, map, art, and first-chapter audio.

```sh
npm run check
npm test
npm run packs:verify
npm run build:web
npm run preview          # Run in a separate terminal before the browser tests.
npm run test:e2e
npm run build:android    # Android Hermes export
npm run build:apk        # Standalone Android preview APK
```

The APK build uses Java 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, and CMake 3.22.1. Local APKs and checksums go to `work/apk/`. [APK build instructions](docs/APK_BUILDS.md) · [Verification and screenshots](docs/VERIFICATION.md) · [Manual acceptance plan](docs/OFFLINE_TEST_PLAN.md)

## Local data, course packs, and speech

Android uses SQLite and Web uses browser storage. Missions and quick reviews save drafts and feedback locally. Export or restore a format 2 backup from **Perfil**. Previous textbook progress stays in backups. The LQP 2.1.0 release and its sources remain available for reference and development. The current app ships and teaches the travel chapter. [Archived course packs](content/releases/README.md) · [Travel architecture](docs/TRAVEL_ARCHITECTURE.md)

Travel pronunciation uses the installed English TTS voice and rate. Open **Configuración de voz** from a mission, the travel guide, or pronunciation practice. With the default voice selected, 18 bundled American English clips provide offline audio when system speech is unavailable. Learners can record and replay their voice locally. The separate system recognition option explains that the selected provider may process audio online. The app offers no automated pronunciation grade. [Speech and privacy](docs/OFFLINE_EDITION.md) · [Asset credits](docs/TRAVEL_ASSETS.md)
