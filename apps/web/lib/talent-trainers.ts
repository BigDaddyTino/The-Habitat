/**
 * Ceiling text → codex slug, shared by the talent audit and the Classes shelf
 * so the two can never disagree about who teaches what. Null means a declared
 * future write (PROPOSED at the next integration pass) or a deliberate
 * non-person — never a typo. Keys are the exact ceiling strings in
 * lib/talent-trees.ts.
 */
export const trainerSlugs: Record<string, string | null> = {
  "Commander Rook": "the-kestrel-commander",
  "the Drill Master": "the-drill-master",
  "the Blast Foreman": "the-blast-foreman",
  "the Range Instructor": "the-range-instructor",
  "the Bureau Analyst": "the-bureau-analyst",
  "the Ashline Fixer": "the-ashline-fixer",
  "Mara Quill": "mara-quill",
  "the Paper-Hand": "the-paper-hand",
  "the hidden Concordance elder": null,
  "the Instructor of the Ninth": null,
  "the Kestrel Medic": "the-kestrel-medic",
  "ACA — slot reserved": null,
  "the Bureau Examiner": null,
  "the Resident — an Echo, in a Core": "brother-aster",
  "the Infuser-Tech": "the-infuser-tech",
  "the Phase-Five": null,
  "the Skinner of the Red Forest": null,
  "Nalia Reed": "nalia-reed",
  "the Clinic Surgeon": "the-clinic-surgeon",
  "the Choir does not teach — it collects. Sign the page.": null,
  "Keira Ansel": "keira-ansel",
  "the Captured Rider": "the-captured-rider",
  "the Unridden — a beast that consents": null,
  "Tomas Vey": "tomas-vey",
  "the Gate Clerk": null,
  "the Advocate of the Dead": null,
  "the Cordon Captain": null,
  "the Tempest Battery Officer": "the-tempest-battery-officer",
  "the Kestrel Quartermaster": "the-kestrel-quartermaster",
  "Jaro Fen": "jaro-fen",
  "the Pearl Factor": null,
  "reserved for the nation pass": null,
  "the Kestrel Mechanic": "the-kestrel-mechanic",
  "the Foundry-Master": "the-foundry-master",
  "NAG — yes, the watch": "nag",
  "the Fully Converted": null,
  "the Gun": null,
  "Serrat the Once": null,
  "a crossroads bargain, they say": null,
};
