# Travel asset credits

[Español (Latinoamérica)](TRAVEL_ASSETS.es-419.md)

- `hometown.jpg` and `plaza.jpg` are original OpenAI ImageGen illustrations of a fictional Latin American hillside town and its plaza.
- `world.png` renders a public-domain Natural Earth map without national boundaries. The DataHub GeoJSON conversion uses ODC-PDDL 1.0. [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) · [GeoJSON source](https://github.com/datasets/geo-countries)
- First-chapter dialogue and vocabulary clips use FFmpeg's Flite `slt` US English voice. The Web shell includes the opening conversation clips, which are also in the downloadable first chapter. [Flite license](https://github.com/festvox/flite/blob/master/COPYING) · [Voice source](https://github.com/festvox/flite/tree/master/lang/cmu_us_slt)
- The destination covers are original OpenAI ImageGen illustrations created for LingoQuest and compressed for offline use. The home chapter uses the existing journal and travel illustrations. [Destination covers](../content/media/chapters)
- Downloadable chapter packs reuse the existing recordings where available and embed additional models generated locally with the same Flite `slt` voice. Regenerating packs with `npm run packs:chapters` requires an FFmpeg build with `flite` and `libmp3lame`. [Media build script](../scripts/chapter-media.ts)
- QuestBuddy, Lucide, Outfit, and Manrope are existing local assets. [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE) · [Outfit](https://github.com/google/fonts/blob/main/ofl/outfit/OFL.txt) · [Manrope](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt)
- `Journal-SemiBold.ttf` is a renamed static derivative of the Lora variable font under the SIL Open Font License. [Upstream Lora](https://github.com/google/fonts/tree/main/ofl/lora) · [Included license](../apps/mobile/assets/travel/Lora-OFL.txt)
