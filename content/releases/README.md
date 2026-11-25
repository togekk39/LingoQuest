# Course pack release artifacts

[Español (Latinoamérica)](README.es-419.md)

The default integrated course is version `2.2.1` using LQP schema 2. Its answer fields require a Phase 5B build with course compatibility level `2.2.0` or newer. Building a pack locally works offline and performs no upload, Git push, or release creation.

```bash
npm run packs:build
npm run packs:verify
```

- `lingoquest-es419-enus-a1a2-2.2.1.lqp.json` contains the revised A1–A2 curriculum, offline answers, and 13 challenge levels.
- The matching `.sha256` file contains the SHA-256 checksum of the entire file.
- `catalog.json` records the version, size, minimum app version, and intended download URL.

`apps/mobile/src/content/bundled-course.json` is the identical bundled copy. The integrated curriculum replaces the grammar-first schema 1 files.

On Web, **Aprender → Cursos A1–A2** opens the bundled pack or a compatible custom pack already installed. Android receives the same material in the destination packs. The catalog URL for `course-v2.2.1` identifies the intended remote release. After release approval, create the GitHub release in `togekk39/LingoQuest` and attach the pack, checksum, and catalog. Verify the remote artifact’s size and checksum before setting `url` and `published: true` in `apps/mobile/src/content/course-source.json`. Running the builder again resets the source metadata to unpublished.

Set `COURSE_PACK_VERSION` to change the version and `COURSE_PACK_REPOSITORY=owner/repository` to change the target repository. Generate the release artifacts, catalog, and bundled copy in one build, verify them, and commit them together. Updates within schema 2 must preserve current lesson IDs. The app rejects downgrades and different content under the same version. Format 1 progress requires the app's explicit reset flow. Importing a new pack still checks the local data format.

The 2.0.0, 2.1.0 and 2.2.0 release files and checksums remain available for older app builds.
