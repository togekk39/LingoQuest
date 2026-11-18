# Integrated course offline architecture

[Español (Latinoamérica)](OFFLINE_EDITION.es-419.md)

The app is version 2.0 and the course pack is version 2.1.0 using schema 2. The eight units and 32 lessons are authored in `content/source`. The builder generates the bundled JSON, release JSON, catalog, and SHA-256 checksum from that source. See the [curriculum model and development data reset](INTEGRATED_CURRICULUM.md).

`apps/mobile/src/lib/api.ts` exposes local calls to existing screens without making HTTP requests. `packages/offline-engine` handles scoring, the four mastery evidence dimensions, reviews, XP, 13 challenge levels, backups, and deletion on the device. Android uses SQLite and the web uses localStorage. There are no automatic uploads.

The first-run path from scratch skips placement. Learning has no timer or hearts. Wrong answers receive explanations and can be retried. Challenges are optional and run separately. The local API checks that the relevant lessons are complete and excludes skills the learner has yet to study. Failure leaves learning XP and completion intact.

Course packs are checked for schema, answers, translations, ID and prerequisite references, stages, assets, and support for English vocabulary. The app fully validates updates before activation and keeps the current pack if validation fails. Course packs can be downloaded after the user supplies its GitHub URL and selects download. The new pack is pending publication and the app does not prefill a schema 1 URL. Local file import is always available.

The APK workflow generates the standalone Android installer. `npm run build:android` verifies the Hermes bundle. On the web, an offline restart works after the static assets and service worker have been downloaded. The first visit to an uncached URL still needs to load those assets.

The travel chapter includes 11 local reference clips, a map, and an illustration. Travel speaking uses optional local recording and replay. [Travel architecture](TRAVEL_ARCHITECTURE.md)

Pronunciation uses system TTS. The Android native bridge accepts installed offline English voices and prefers the system's default English voice when available. Playback requests an English locale and voice regardless of the app or device language. Android sets the selected dialect's locale first, then applies and verifies the offline voice. If the engine rejects it or keeps another voice, playback stops and the app shows a notice. iOS explicitly selects an installed English voice. Browsers use English voices with `localService === true`. Speech settings on mobile and desktop offer voice selection, a preview, and a system rate or 0.75×, 1×, or 1.25× playback. Saved preferences apply throughout. On Android, users can open system TTS settings, and the app refreshes engines and voices on return. If an offline English voice is unavailable or has been removed, the app prompts the learner to install or reselect one. Speech synthesis runs offline. The native bridge requires a rebuilt APK or development build because Expo Go lacks the module. Recording and playback are optional. Recordings stay local and are deleted on exit. The app offers no automated pronunciation scores and does not treat a text match as evidence of accurate pronunciation.

## System speech recognition (STT)

**Practicar con mi voz** uses `expo-speech-recognition` on Android and iOS and the Web Speech API in browsers. Recognition uses `en-US` and displays interim and final transcripts for comparison. The app explains before starting that the system or browser service may process audio online. The app stores neither audio nor transcripts from recognition and requires no separate STT backend, API key, or paid scoring service.

The app shows retry guidance for denied permissions, missing English models, unavailable services, network errors, and attempts that capture no speech. **Solo grabar y escuchar (sin reconocimiento)** records and plays audio entirely offline, then deletes the recording on exit. Recognition, recording, and example playback use audio one at a time.

Install a rebuilt APK or native development build for STT. Expo Go and older APKs lack the module. The config plugin sets iOS microphone and speech recognition permissions and Android recognition service visibility. Enable a system recognition service with English support. For each attempt, Android checks and explicitly selects the current system provider. Android can select standard `RecognitionService` providers such as Marmalade STT (`app.marmalade.stt`) without requiring Google. If the selected provider is missing or disabled, the app shows guidance. Use Marmalade's setup flow to select it as the system recognizer. Enabling its keyboard alone is insufficient. The Android APK workflow builds the installer.

On native platforms, speaking practice pauses the audio player. Web also clears its source. The Android implementation of `expo-audio` 1.1.1 requires a non-null source for `replace`. Audio preparation runs inside the STT error handler so users can retry if it fails. `npm run test:stt` checks that native playback avoids `replace(null)`, verifies selection of a non-Google provider, and inspects the generated Android manifest.

Browser tests use a Web Speech fixture to cover transcripts, errors, retries, and cancellation on exit. They use MediaRecorder to cover recording, replay, and cleanup. A device running the rebuilt APK is needed to verify Marmalade, actual audio capture, permission denial and recovery, offline behavior, and exiting during a permission prompt.

## Data and backups

Local state and backups use format 2. The app blocks reads and writes for format 1 prototype data and lets users decide whether to reset. It preserves the old bytes automatically and lets users export them from the error screen before confirming a reset. The exported format 1 data cannot be restored into format 2. Users can export and select current backups in **Perfil** and confirm before overwriting progress. Restore excludes active challenges.

The offline edition has no login, Supabase, VPS, cloud AI, telemetry, or external speech assessment. The historical prototype remains in `apps/api` and the SQL files.
