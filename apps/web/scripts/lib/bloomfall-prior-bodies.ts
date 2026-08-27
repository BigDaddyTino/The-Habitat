/**
 * Superseded creature-dossier bodies the Bloomfall tooling still recognises.
 *
 * Every Bloomfall write checks that a record holds an approved prior state
 * before it overwrites it. A renderer cannot reproduce output it no longer
 * emits, so each superseded generation is recognised by digest instead. Two
 * hashes per slug per generation: the bare rendering, and the Prompt E
 * composition with the cross-link block appended.
 *
 * Generations, oldest first:
 *
 *   promptB   the design-specification rendering (eleven bolded micro-fields
 *             per state). Production still holds this — the promotion of the
 *             field guide was authorised but blocked before it ran.
 *   guideV1   the first field-guide rewrite (specimen / field notes /
 *             mutations / why hunt it). The development Codex holds this.
 *
 * Both promote forward to the current rendering, so a release accepts either
 * and refuses anything else.
 */

const promptB: Readonly<Record<string, readonly string[]>> = {
  "blackbloom-hart": ["623cebe3a4ed0b1bbf7acd4f06e9d88641e4a1bb2f74f81e930d0bbd01273ea5", "609efad399620847dba5c4917bccf366a1588edbbbc2a8b06d5fe209ebc728c3"],
  "rootback-grazer": ["36d14947b67c3270cb53668240f6899f0f439d4fbd02100dfc4c206082ac0717", "7f9f6876c1325dba1a154fb73d5a0a48ad9d1c424caec16bd5ba6fd1a584db6e"],
  "glasswing-kite": ["fc86cf2821264cc3efcff6d348bd9df89cb3ce9fb912793eef8fdc09fb484fbf", "5bb95dcd0613ac0494841b22f01bd372e9b63f1de84840969182ad9bd1f6bd78"],
  mirejaw: ["b0659d7607e6164563630514c10ded64bcf427e75561bd8dad597576e90cb015", "bc15fc3f6a531c8584939462d2522fc6267e7d1c5c714fc52cc28b56ad3d32ed"],
  "sump-eel": ["4089a14c3eca17756bef298b9084c7fcf3319464f3e67131a2ceb59a4cd082a6", "7caf3b2f5e19b65c49284cf0f13e880e01add150a64f44e05886b1718e7f5ef7"],
  "spore-lantern-colony": ["58d137593e3903d51cfe7196f4a015f95d4131695d634bb5ecec8dafcf900a8b", "d33c5e166d6ba6646be6ca94db828433da51f3daba91d8dbf8b9d88d1b7ee5cd"],
  latchhound: ["7817736ba87c2dfcc95de2665e15dbf678ce8afdaa0e320d6b1a0cc9970f8721", "e66d5e31fe3024d28431d14746f981568579e8a7d926ba5a516f874c662bd84b"],
  "bloommarked-remnant": ["5a713b77e574fb515551a50f05a1862471a301858c3ee896fbde219c77563ae2", "f7b3db7c0e6484bd03f173cb706f8e177498ad7079e632742c86014ee2b89678"],
  "the-bellwether": ["1b4c639e4e267e5f4653467ba7274d6f5a641c5f8c580110db77119c3596852d", "ff84e9db6ea31489f6bb4334c7279c050bf977844563557f741daa55d2512e95"],
  switchmother: ["141c5d95c20f0611d3a8e148e91d0c70eede77614032ddc0519d312dd867b915", "fbbe2d047d39e2bce138d43cfce2f9c1539b31225e9b07bd878a57d847483cfb"],
  "old-drowner": ["e34d4fc75dba96d2c9e6b631768d07f296cdcb814a7cd8d91b800ac6b21543e6", "49ec967777772f318271a302498fd6dec475a25bb02f4c597b6ecc219d83c155"],
  "the-last-shift": ["33d90fa68fc0ca693ad7c1749d397830b12c388b090cb47f59332c2f2dfe0e62", "8a675f5188ef3cbf6b4820c4fc1729f10d9b1861df80ef19f2c5ceb5ab80713e"],
  "maintenance-unit-m-17": ["b4399e40e75c49ece9592916d7bd0a79219ba45006f94740de0e4d18d566a423", "e22724949f163407cc6a2d265da8bcc9f90d9418d7297159e1cf9faffa5d2ab3"],
};

const guideV1: Readonly<Record<string, readonly string[]>> = {
  "blackbloom-hart": ["38105256bae464d22696cd1db2110ae2a65dc3e40ca21877a984c0818d1aa86a", "1cc926aafd9d44961eab0bd3ec7b61d3e3e9925c75ccf071f43f938e38166719"],
  "rootback-grazer": ["daec4e2c0edd94be82c937a81becc8c03a9e421c37a2b7015af8bbf6c7c8b445", "b341541de2c6d3fec1f9241375a8a3dc538ccc98f3db07746af192b71365d53f"],
  "glasswing-kite": ["827c8b79fa82264d96569abe6b46a619326b5387823a3faf78428945e1162873", "ef0ef06bceb80a331d11a7942a054054f4bbf964af76128cbb995e73c862dfc9"],
  mirejaw: ["f9fb3c135a76ba5b5e08888e8cba941733f5e8a349f60beee2f26a46b2f3cde3", "e91e49ee66f1e497d0edd0bd281f00088f5f6359fa941faf80b4dbe4e98fd22a"],
  "sump-eel": ["72d561d944c8282e348926bc8906d9b1b62edccfead24615be6d67b2d424151c", "8e294262d98e9431992eb65d85a7aa97feeb97aff425986c092d2146bb47d33c"],
  "spore-lantern-colony": ["eacc0b051bcedc7222b9b280a3e6bc34824a816ef74d3a89ba00269d5157952d", "cab25a4381f57a35e5a35b67de7902ba6509a18c413fafdfe20130fd435f83f9"],
  latchhound: ["95a6b1030f1e64567b43481dcf7d1815c1347ef5f3a6cf1aa2976cb6918f0d2d", "09f3e1cb1a5e61f84309e4f5e81e42541b343bf9e22d51704faa5123a5465aae"],
  "bloommarked-remnant": ["f0bf6a7f4b740d7dd882cf13ee1e1686f94e24564d3ae83fdf0cee0f78986d6a", "5afa836f4fb8affcead2479ab4195e6fdbe01e104b3bdd164b829354acf7662f"],
  "the-bellwether": ["e6638cd576ea48776a62ec7ea1e70c265b8201738852a5c17699dec7997af22f", "ef1c3838a26635f265bc2a4a1315af4aa2a85661d309b6d8b4deade1ef6adc45"],
  switchmother: ["b122387575b1b0799bde687c71c4d986bc5471e20d7c4495219f1838263a8be3", "97f8a45f33d66ee6ba1e47361d66b06df4c650a754fcb04e494bba60a2b7588f"],
  "old-drowner": ["78080dde24d17e0fd9bb597c42c44980e9fb6efba3e5e306f1331887c9ed8fb6", "836d751eff3959dd094ff436ba67feeeca4d335ab860ee265816446acab8c336"],
  "the-last-shift": ["4beaee9c947dc8e26bdc67be95d583cb1e5d4ea512f83c8b7fb202cbfeaa17bf", "f3127008d85b572d52f081bb96cd08561554887c065b53a65aefa156b08f5de0"],
  "maintenance-unit-m-17": ["b6797ff754a198b84147bb1e8263bd0830ed5084c29236f28eee368792383857", "758b0fb60e386f90ab16185b627d6c057f2084cf9f18c6e0d1aaaf5769c0d9f4"],
};

/**
 * System dossier bodies as they were promoted with the systems package.
 *
 * Only the records this release actually rewrites need to appear here. The
 * Adaptive Mutation dossier defined the four tiers as a species cap ("how far
 * that species can go"); the ladder rewrite made them rungs every eligible
 * species climbs, so the page that defines the vocabulary had to move with it.
 */
const systemsV1: Readonly<Record<string, readonly string[]>> = {
  "adaptive-mutation": ["0636ff798c5a861c9b62b45d5936c706e808da5a939501b8907c66a079e93e75"],
};

const generations = [promptB, guideV1, systemsV1];

export const bloomfallSupersededCreatureBodySha256: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  [...new Set(generations.flatMap((generation) => Object.keys(generation)))]
    .map((slug) => [slug, generations.flatMap((generation) => generation[slug] ?? [])] as const),
);
