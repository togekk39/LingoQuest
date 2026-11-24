# Chapter packs

[Español (Latinoamérica)](CHAPTER_PACKS.es-419.md)

On first launch, the app downloads **La primera postal** and shows its progress. After the first chapter, **Continuar a Ciudad de México** downloads and verifies chapter 2. Both packs stay available offline. From **Inicio** you can return to the first adventure and open **Repaso rápido**. **Aprender** keeps the first chapter's lessons. If the chapter 2 transfer fails, **Reintentar** tries again with the first pack still available.

Select a destination in **Mapa** and choose **Abrir capítulo** to use its saved pack or download it automatically. Packs contain lessons, illustrations, and English audio. The first eight packs also supply their corresponding A1–A2 units. Packs use IndexedDB on Web and SQLite on Android. The Web app shell also provides the starter adventure and original course. Learner progress and backups use their existing local storage and IDs.

## Author and publish a content update

1. Edit the destination in `content/source/chapter-lessons-west.ts` or `content/source/chapter-lessons-east.ts`. A destination can define one lesson or an array of lessons. The app uses the array order for navigation and plays the audio packaged for each English dialogue turn, word, and model answer. Destination cover sources live in `content/media/chapters/`. The first chapter uses the original artwork files as pack sources.
2. Install FFmpeg with Flite and libmp3lame enabled. Build the changed pack with a higher integer revision. For example, this builds Toronto revision 7 and updates the catalog entry.

   ```sh
   CHAPTER_PACK_REVISION=7 npm run packs:chapters -- --chapter=toronto
   npm run packs:chapters -- --verify
   ```

3. Publish the new revision file and `catalog-v2.json` together from `apps/mobile/public/chapter-packs/`. Keep revision paths such as `7/toronto.json` immutable. Serve the catalogs with cache revalidation. Web reads that directory from its own origin. Android uses GitHub Raw and reads `main` for regular builds. An APK built by the push workflow reads the exact commit used to build it. Keep `catalog.json` and its revisions available for Android 2.1.0. Phase 5B builds check installed packs below revision 6 for updates on startup. Verified updates are picked up on a subsequent launch, and installed content remains available offline during an unsuccessful transfer.

The catalog keeps a revision, byte size, and file SHA-256 for every destination. Each file also has its own schema version and content checksum. Keep `schemaVersion` at `1` for compatible changes, including new lessons, replacement art, and additional audio. App changes are needed when using a new package schema or adding destinations to the map.
