# LingoQuest 2.0

[Español (Latinoamérica)](README.es-419.md) · [Development rules](AGENTS.md)

**Aprende inglés, descubre el mundo.**

LingoQuest is an Android-first app for learning American English (`en-US`) with a Latin American Spanish (`es-419`) interface. Travel, lessons, reviews, and challenges work offline without an account or backend.

## Explore and learn

- **Continuar viaje** resumes your saved story. The first chapter, **La primera postal**, has three short missions. Welcome Sam, find her bus stop, and return her backpack using English dialogue, listening, word order, and writing. The chapter includes offline reference audio and optional local recording. Finishing it unlocks a passport stamp, postcard, and journal entry.
- **Mapa** covers 20 stops across seven continents and ends in Antarctica via Ushuaia. Choose a home country or territory in Latin America or the Caribbean. Planned chapters are labeled **En preparación**, with direct links where related lessons are available.
- **Repaso rápido** offers one question and prioritizes due practice. **Aprender** offers all 32 A1–A2 lessons and **Ver material** opens vocabulary, grammar, and dialogues directly. **Repasar** opens the full review list.
- **Desafíos** offers 13 optional ranks with grammar, cloze, and reading. Ranks 1–8 require completing units 1–2, ranks 9–10 require units 1–4, ranks 11–12 require units 1–6, and rank 13 requires units 1–8. The challenge keeps its own records and has a timer-free practice mode. Passport stamps, XP, completed lessons, and learning evidence are tracked independently. The A1–B2 route is a curriculum plan.

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

Android uses SQLite and Web uses browser storage. Travel, direct lessons, and quick review save drafts and feedback locally. Export or restore a format 2 backup from **Perfil**. Format 1 prototype data can be exported before an explicitly confirmed reset. The bundled LQP schema 2 course is version 2.1.0. Install updates through **Perfil → Contenido sin conexión**. Online downloads are initiated by the user from a GitHub file URL. [Course packs](content/releases/README.md) · [Travel architecture](docs/TRAVEL_ARCHITECTURE.md)

The first chapter ships with 11 American English reference clips. Other lessons use verified offline system TTS. Existing speaking practice offers optional system recognition with a disclosure that the selected provider may process audio online. The travel chapter uses local recording and replay. The app offers no automated pronunciation grade. [Speech and privacy](docs/OFFLINE_EDITION.md) · [Asset credits](docs/TRAVEL_ASSETS.md)
