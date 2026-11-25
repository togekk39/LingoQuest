# Phase 5D-2C · Cusco validation

[Español (Latinoamérica)](PHASE_5D_CUSCO_VALIDATION.es-419.md)

The chapter begins with Alba’s postcard from Cartagena. In Cusco, the player helps Sam, Luz, Nora and Diego reconstruct yesterday’s trip. The museum journal introduces a second visit with Ana and concludes with the Cusco passport stamp and a postcard for Salvador. The Andean city setting draws on UNESCO’s description of Cusco. The plaza, courtyard, market, museum and three new character portraits are original generated illustrations. The journal facts come from the lesson data. [Story source](../content/source/cusco-story.ts) · [UNESCO City of Cuzco](https://whc.unesco.org/en/list/273/)

## Teaching and assessment

| Approved objective         | Mission               | Existing Study material and chapter extension                                                                                                                                                                                                                                                                             |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lq-cusco-past.past-be`    | ¿Dónde estabas ayer?  | U04 `u04_l01` and its canonical forms. Contrast present and past, location and condition, and affirmative and negative past forms. Match two places in audio, read two people’s notes, write positive and negative entries, and compare a recording about two people.                                                     |
| `lq-cusco-past.past-ed`    | Lo que hicimos ayer   | U04 `u04_l02` and canonical forms. Teach visit, clean, finish and call, with suffix spelling for arrive and study. Compare all three endings, recover three actions from audio, read photo notes, write two ordered actions, and record a retelling.                                                                      |
| `lq-cusco-past.past-irreg` | Recuerdos del mercado | U04 `u04_l03` and the existing Peru guide `¿Qué pasó en el mercado?`. Teach go/went, buy/bought, see/saw, take/took and eat/ate in context. Distinguish the photo and bus senses of take. Read and listen to three market actions, write three facts, compare before and after, and retell a short visit.                 |
| `lq-cusco-past.past-ask`   | El detalle que falta  | U04 `u04_l04` and its question and negative patterns. Teach did and didn’t with the base form, information questions and short replies. Cover arrive, happen, leave/left and last weekend. Ask witnesses for missing information, correct the journal in English, and distinguish a valid negative from a positive claim. |
| Transfer                   | Un nuevo recuerdo     | At the museum, ask about the time and place of a sighting, correct the entry and identify the order of the visit, sighting and departure. Write three to five sentences and compare them with the rubric and optional example after submitting. Record an oral version for comparison.                                    |

The seven formal stages are `cusco-be-teach`, `cusco-regular-teach`, `cusco-endings-teach`, `cusco-irregular-teach`, `cusco-order-teach`, `cusco-ask-teach` and `cusco-museum-teach`. They provide es-419 explanations and English models before the corresponding assessments. The chapter reuses the published U04 and Peru card with their original IDs. Story and Study share the mission checkpoints and evidence ledger. The item audit identifies the exact reviewed references and examples. [Lessons](../content/source/cusco-lessons.ts) · [Assessments](../content/source/cusco-assessments.ts) · [Item audit](PHASE_5D_CUSCO_VALIDATION.items.tsv)

## Information gaps and feedback

- At the market, Sam can confirm that he did not take the photo. Luz can confirm that she did and say when. A player can check the time first and then ask who took it. The draft note says 10 a.m. The correct time appears only after the corresponding reply.
- At the museum, Diego can report when Ana saw Nora, and Nora can report where. Ana can answer the same questions in either order. The draft names the shop and leaves the hour blank.
- The engine uses the existing scenario checkpoint, digest, attempt and evidence mechanisms with typed event actions. Authored facts, witness knowledge, confirmed fields and submitted notes have separate fields. A question outside the witness’s knowledge receives an uncertainty reply. An unclear event reference can receive a clarification. A repeated equivalent question returns the reply without adding a second confirmation or evidence for that language.
- `At 11:00 a.m., Luz took the photo.` and `Luz took a photo at eleven.` can both complete the correction. Wrong time, actor or polarity yields `context_mismatch`. A base form in the affirmative correction yields `incorrect`. Unsupported wording calls for clarification or a self-check.
- An accepted did question maps to the assessed question construction and writing. The corrected note maps to the individual past form and the past statement writing pattern. Oral comparison and open writing are guided self-checks. A same-day museum result can establish Transfer while Retention requires a later independent item.

[Event definitions](../content/source/cusco-scenarios.ts) · [Event evaluator](../packages/offline-engine/src/event-scenario.ts) · [Reviewed paths](../content/source/cusco-scenario-review.ts)

## Review and challenges

The bank contains separate follow-ups for was, were, negative variants, regular spelling, the four central irregular forms, did and didn’t with the base form, the three -ed sounds, and before/after relationships. A guided repair leaves the error pending until an independent answer in a different context. Archived text review includes the facts on the short photo card, the assessed form and the accepted correction. Listening activities continue to require their audio for independent evidence. Grammar Rush, Cloze Battle and Reading Quest each add one item per objective behind the existing prerequisite and independent-practice gates. [Review and assessment source](../content/source/cusco-assessments.ts) · [Challenge source](../content/source/cusco-challenges.ts)

## Offline material and quality checks

The pack carries distinct clips for `walked`, `watched`, `finished` (/t/), `played`, `cleaned`, `called` (/d/), and `visited`, `wanted`, `needed` (/ɪd/). The chapter supplies playback, reduced speed, supported meaning or transcript, and record-and-compare practice through the existing voice controls. Finite NPC replies use installed clips. The dialogue turn contributes written evidence when eligible. The separate listening items require playback and treat transcript use as support. Manually compare the endings and syllable counts in walked/played/visited, watched/called/wanted, and finished/cleaned/needed. Review the intelligibility of the NPC replies and place names with educators and A1 learners. Generated or decoded audio and system recognition establish technical coverage only.

| Artifact    | Version |          Bytes | SHA-256                                                            |
| ----------- | ------- | -------------: | ------------------------------------------------------------------ |
| `peru.json` | 14      |      3,647,030 | `2ef1664042d06f99babe4a3e22501d99c1029fd62f7ecbea6ddb139fb9e6bcbf` |
| Catalog     | v9      | See repository | Prior catalogs and their downloads are retained.                   |

[Pack](../apps/mobile/public/chapter-packs/14/peru.json) · [Catalog](../apps/mobile/public/chapter-packs/catalog-v9.json) · [Voice architecture](TRAVEL_ARCHITECTURE.md)

The curriculum verifier checks seven teaching stages, 71 assessment and review items, 12 challenge items and 245 grading cases for Cusco. The pack verifier checks the current catalog and all eight earlier catalogs. FFmpeg decoded all 178 installed English clips in the Cusco pack.

Run `npm run curriculum:verify`, `npm run packs:verify`, `npm run packs:chapters -- --verify`, `npm run check`, `npm test`, `npm run build:web`, `npm run test:e2e`, `npm run build:android` and `npm run build:apk` on the candidate commit. The browser tests exercise real Study and Story entry points, play installed clips, restore an unfinished inquiry, and update the older Peru guide. The APK signature, the checksum and the latest commit’s workflows are tracked with the pull request. Physical Android airplane mode, device microphone and playback quality, and human A1 trials require separate acceptance. [Browser tests](../tests/e2e/cusco.spec.ts) · [CI](../.github/workflows/ci.yml) · [APK workflow](../.github/workflows/android-apk.yml)
