# Chapter packs

[Español (Latinoamérica)](CHAPTER_PACKS.es-419.md)

On first launch, the app downloads **La primera postal** and shows its progress. After the first chapter, **Continuar a Ciudad de México** downloads and verifies chapter 2. Both packs stay available offline. From **Inicio** you can return to the first adventure and open **Repaso rápido**. **Aprender** keeps the first chapter's lessons. If the chapter 2 transfer fails, **Reintentar** tries again with the first pack still available.

Select a destination in **Mapa** and choose **Abrir capítulo** to use its saved pack or download it automatically. Packs contain lessons, illustrations, and English audio. The first eight packs also supply their corresponding A1–A2 units. Packs use IndexedDB on Web and SQLite on Android. The Web app shell also provides the starter adventure and original course. Learner progress and backups use their existing local storage and IDs.

In Mexico revision 10, choose **Explorar aventura de este capítulo** to open the five story missions. The same installed pack contains the guide, the U02 Study lessons and the activities for later practice.

Home revision 11 includes short foundation activities in Story and **Aprender**. Both platforms load the same reviewed instruction, exercises and recordings from the installed pack.

Cartagena revision 12 adds five RPG missions, shared learning activities, optional challenges and the chapter's market and restaurant media. An installed pack supplies the English audio and scenes for both platforms. Eligible archived text review can continue after chapter media is removed. [Cartagena validation](PHASE_5D_CARTAGENA_VALIDATION.md)

## Author and publish a content update

1. Edit the destination in `content/source/chapter-lessons-west.ts` or `content/source/chapter-lessons-east.ts`. A destination can define one lesson or an array of lessons. The app uses the array order for navigation and plays the audio packaged for each English dialogue turn, word, and model answer. Destination cover sources live in `content/media/chapters/`. The first chapter uses the original artwork files as pack sources.
2. Install FFmpeg with Flite and libmp3lame enabled. Build the changed pack with a higher integer revision. For example, this builds Cartagena revision 12 and updates the catalog entry.

   ```sh
   CHAPTER_PACK_REVISION=12 npm run packs:chapters -- --chapter=colombia
   npm run packs:chapters -- --verify
   ```

3. Publish the new revision file and `catalog-v9.json` together from `apps/mobile/public/chapter-packs/`. Keep revision paths such as `7/toronto.json` immutable. Serve the catalogs with cache revalidation. Web reads that directory from its own origin. Android uses GitHub Raw and reads `main` for release builds started on `main`. CI development APKs read the exact repository and commit checked out by the workflow, including builds from a fork or a manually selected branch. Keep `catalog.json` and its revisions available for Android 2.1.0, and keep `catalog-v2.json` and its revisions available for Phase 5B and 5C builds. The v2 catalog serves Mexico revision 7 to those builds. Keep `catalog-v3.json` available for builds using Mexico revision 8. Keep `catalog-v4.json` available for builds using Home revision 7 and Mexico revision 9. Keep v5 for both revision 10 packs. The v6 catalog serves Home 11 and Mexico 10 to builds that support the added Home teaching and assessment records. Keep v6 and its revision 7 Cartagena file for compatible builds. The v7 catalog serves Colombia 12 with Home 11 and Mexico 10. Catalog v8 serves Cartagena 13 to builds that support conversation state. Keep catalog v7 and revision 12 available to earlier builds. When the app starts, it compares its catalog with every installed pack and downloads newer revisions in the background. Verified updates are picked up on a subsequent launch. Installed content and progress stay available if the app is offline or a transfer fails.

The catalog keeps a revision, byte size, and file SHA-256 for every destination. Each file also has its own schema version and content checksum. Keep `schemaVersion` at `1` for compatible changes, including new lessons, replacement art, and additional audio. App changes are needed when using a new package schema or adding destinations to the map.

Catalog v9 serves Peru 14 to clients that understand event timelines. Catalog v8 continues to serve the previous Peru guide and Cartagena 13. [Cusco validation](PHASE_5D_CUSCO_VALIDATION.md)
