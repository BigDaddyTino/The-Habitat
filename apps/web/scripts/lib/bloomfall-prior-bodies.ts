/**
 * Superseded creature-dossier bodies the Bloomfall tooling still recognises.
 *
 * Every Bloomfall write checks that a record holds an approved prior state
 * before it overwrites it. Until 2026-08-26 the creature dossiers held the
 * Prompt B rendering of the enhancement manifest (with, once Prompt E landed,
 * the cross-link block appended). The field-guide rewrite replaced that
 * rendering, and a renderer cannot reproduce output it no longer emits — so
 * the superseded bodies are recognised here by digest instead. Each slug lists
 * the SHA-256 of its bare Prompt B body and of the Prompt E composition, which
 * are the two states a Codex could have been left in. Production and the
 * development Codex were both verified to hold the composed form before the
 * rewrite was applied.
 */
export const bloomfallSupersededCreatureBodySha256: Readonly<Record<string, readonly string[]>> = {
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
