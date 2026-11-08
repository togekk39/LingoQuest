# Android APK builds

`.github/workflows/android-apk.yml` creates a **standalone installable APK** when code is pushed to any branch, when a fork pull request is opened/updated, or when manually started from Actions. A merge into `main` is a push to `main`, so it builds automatically. Internal pull requests reuse their branch push build instead of starting a duplicate native build. A newer commit on the same branch cancels the older in-progress APK run.

The pipeline uses Node.js 24, Java 17, Android SDK/build tools 36, NDK 27.1.12297006 and CMake 3.22.1. It runs the existing checks/tests, generates native Android files with the installed Expo SDK 54 template, and runs Gradle `:app:assembleRelease` for `arm64-v8a` and `armeabi-v7a`. The resulting universal ARM APK works on Android 7 or newer. The release variant embeds the Hermes bundle, full offline course and local fonts; it does not need Metro, Expo Go, an Expo account or online learning APIs.

## Download and install

1. Open the repository's **Actions → Android APK** workflow.
2. Open the successful run for your commit.
3. Download its `lingoquest-apk-<run number>-<commit>` artifact; GitHub requires sign-in for Actions artifact downloads.
4. Extract the ZIP and install the `.apk` on your Android device. The ZIP also contains SHA-256 and `build-info.json`.

Artifacts are kept for 30 days. The artifact is a normal sideloadable APK, not an Android App Bundle or Play Store upload. Android may ask the user to allow installing from the file manager/browser they selected.

## Signing and updates

The preview APK is signed using the **public fixed debug certificate shipped in the React Native/Expo template**. The script verifies its SHA-256 before building, so a runner never generates a different per-run debug key. This permits normal updates between these preview builds. `versionCode` is `100000 + GITHUB_RUN_NUMBER` in Actions; local builds can set `ANDROID_VERSION_CODE` explicitly.

This public key is only for testing. Do not use these preview APKs as a private-key Play Store production release. A future store release needs its own controlled signing identity. A change of signing identity can require uninstalling the preview first, so export local learning progress before that transition. This workflow does not request or expose any signing secret and never uses `pull_request_target`.

## Local native build

After installing the listed Android SDK/NDK/JDK toolchain:

```bash
npm ci
node scripts/build-apk.mjs
```

Outputs are under `work/apk/`, and generated native files are under `apps/mobile/android/`. The build script restores the authored mobile package metadata after Expo prebuild. It checks that the APK includes a bundled JS/Hermes asset and fonts. GitHub additionally verifies APK signatures with `apksigner`.

Android automatic OS backup is disabled (`android.allowBackup: false`) for the offline edition. The user-controlled JSON backup/import inside the app remains available.
