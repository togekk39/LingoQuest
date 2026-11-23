# Chapter packs

[Español (Latinoamérica)](CHAPTER_PACKS.es-419.md)

On first launch, the app downloads **La primera postal** and shows its progress. After the first chapter, **Continuar a Ciudad de México** opens chapter 2. The app downloads and verifies the new pack before removing the first chapter's saved resources. It keeps your missions, stamp, and journal. If the transfer fails, **Reintentar** tries again with the first pack still available.

Select a destination in **Mapa** and choose **Abrir capítulo** to use its saved pack or download it automatically. Packs contain lessons, illustrations, and English audio. The first eight packs also supply their corresponding A1–A2 units. Packs use IndexedDB on Web and SQLite on Android. The Web app shell also provides the starter adventure and original course. Learner progress and backups use their existing local storage and IDs.

## Author and publish a content update

1. Edit the destination in `content/source/chapter-lessons-west.ts` or `content/source/chapter-lessons-east.ts`. A destination can define one lesson or an array of lessons. The app uses the array order for navigation and plays the audio packaged for each English dialogue turn, word, and model answer. Destination cover sources live in `content/media/chapters/`. The first chapter uses the original artwork files as pack sources.
2. Install FFmpeg with Flite and libmp3lame enabled. Build the changed pack with a higher integer revision. For example, this builds Toronto revision 2 and updates the catalog entry.

   ```sh
   CHAPTER_PACK_REVISION=2 npm run packs:chapters -- --chapter=toronto
   npm run packs:chapters -- --verify
   ```

3. Publish the new revision file and then the catalog from `apps/mobile/public/chapter-packs/`. Keep paths such as `2/toronto.json` immutable. Serve `catalog.json` with cache revalidation. The Web app requests `/chapter-packs/` from its current origin. Android reads the same directory on the LingoQuest repository’s `main` branch through GitHub Raw. Publishing this directory makes the latest revision available to new downloads. Installed packs are reused offline.

The catalog keeps a revision, byte size, and file SHA-256 for every destination. Each file also has its own schema version and content checksum. Keep `schemaVersion` at `1` for compatible changes, including new lessons, replacement art, and additional audio. App changes are needed when using a new package schema or adding destinations to the map.
