# Chapter packs

[Español (Latinoamérica)](CHAPTER_PACKS.es-419.md)

Select a destination in **Mapa** and choose **Descargar capítulo**. The pack contains scenario lessons, illustrations, and English MP3s. It also includes the corresponding A1–A2 course unit at stops 1–8 and the original adventure resources at the first stop. **Abrir capítulo descargado** reads the saved pack, including after restarting offline. **Importar archivo del capítulo** installs a compatible JSON file from the device.

**Buscar actualización** reads the latest catalog for the selected chapter. Downloads and imports validate the pack before replacing it. The previous revision stays available if a download or installation fails. Chapter packs use IndexedDB on Web and SQLite on Android. The app shell, first adventure, and original course are available from the initial install. Learner progress and backups use their existing local storage and IDs.

## Author and publish a content update

1. Edit the destination in `content/source/chapter-lessons-west.ts` or `content/source/chapter-lessons-east.ts`. A destination can define one lesson or an array of lessons. The app uses the array order for navigation and plays the audio packaged for each English dialogue turn, word, and model answer. Destination cover sources live in `content/media/chapters/`. The first chapter uses the existing bundled artwork.
2. Install FFmpeg with Flite and libmp3lame enabled. Build the changed pack with a higher integer revision. For example, this builds Toronto revision 2 and updates the catalog entry.

   ```sh
   CHAPTER_PACK_REVISION=2 npm run packs:chapters -- --chapter=toronto
   npm run packs:chapters -- --verify
   ```

3. Publish the new revision file and then the catalog from `apps/mobile/public/chapter-packs/`. Keep paths such as `2/toronto.json` immutable. Serve `catalog.json` with cache revalidation. The Web app requests `/chapter-packs/` from its current origin. Android reads the same directory on the LingoQuest repository’s `main` branch through GitHub Raw. Publishing this directory updates the downloadable lessons without a new Web build or Android APK. The numbered JSON files can also be distributed for offline import.

The catalog keeps a revision, byte size, and file SHA-256 for every destination. Each file has its own schema version and content checksum for offline import. Keep `schemaVersion` at `1` for compatible changes, including new lessons, replacement art, and additional audio. App changes are needed when using a new package schema or adding destinations to the map.
