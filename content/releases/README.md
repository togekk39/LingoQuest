# Course pack release artifacts

[Español (Latinoamérica)](README.es-419.md)

The default integrated course is version `2.0.0` using LQP schema 2. It requires app version `1.3.0` or newer. Building a pack locally works offline and performs no upload, Git push, or release creation.

```bash
npm run packs:build
npm run packs:verify
```

- `lingoquest-es419-enus-a1a2-2.0.0.lqp.json` contains the complete original draft curriculum, offline answers, and 13 challenge levels.
- The matching `.sha256` file contains the SHA-256 checksum of the entire file.
- `catalog.json` records the version, size, minimum app version, and intended download URL.

`apps/mobile/src/content/bundled-course.json` is the identical bundled copy. The integrated curriculum replaces the grammar-first schema 1 files.

The pack is pending remote publication. The catalog URL for `course-v2.0.0` identifies the intended release, and the app's download field starts empty. Users can import a local file now. After approving the course content, create the `course-v2.0.0` GitHub release in `togekk39/LingoQuest` and attach the pack, checksum file, and catalog to that release. Download the immutable artifacts and verify the size and checksum before setting `url` and `published: true` in `apps/mobile/src/content/course-source.json`. Mark the URL published only after verifying that it works. Running the builder again resets the source metadata to unpublished.

Set `COURSE_PACK_VERSION` to change the version and `COURSE_PACK_REPOSITORY=owner/repository` to change the target repository. Generate the release artifacts, catalog, and bundled copy in one build, verify them, and commit them together. Updates within schema 2 must preserve current lesson IDs. The app rejects downgrades and different content under the same version. Format 1 progress requires the app's explicit reset flow. Importing a new pack still checks the local data format.
