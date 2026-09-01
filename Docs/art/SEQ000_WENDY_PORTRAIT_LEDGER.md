# SEQ-000 Wendy portrait ledger

Date: 2026-08-31

## Selected final

- Character slug: `wendy`
- Project asset: `apps/web/private/codex-art/characters/wendy.png`
- Authenticated Codex URL: `/codex-art/characters/wendy.png`
- Generation path: built-in ImageGen
- Dimensions: 1672 × 941
- Pixel format: RGB24
- File size: 2,065,037 bytes
- SHA-256: `3f9d8e11099339ba4e16475e7e2b46865bcf90af36efc476c33d93bd54d77f7d`

The portrait is bound by the private convention-path resolver. It is not under
`public/`, and the dossier route remains authenticated.

## Final prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex character dossier key art, wide cinematic 16:9 landscape.

Primary request: Create Wendy, the Stormglass Cartel enlistment clerk from SEQ-000.

Scene/backdrop: a rugged temporary recruitment tent beneath the dense crimson canopy of the Red Forest, damp canvas, muddy ground, red pollen, stacked unmarked cargo, restrained near-future military worksite. Wendy stands behind a battered intake table with a rugged blank-screen tablet and physical ledger. The queue is only suggested as soft out-of-focus human silhouettes behind the camera line. In the distant soft background, an automated cylindrical wardrobe pod is on the right side of the desk and a separate pair of compact rocket-like deployment capsules sits in revetments on the left; both remain subordinate and must not compete with Wendy.

Subject: one attractive adult woman, she/her. CASTING / GENERATION REFERENCE ONLY: Native American facial heritage and features; this is a production casting reference, not an in-world ethnicity. Curvy, athletic adult build with a flattering capable silhouette even in practical Stormglass fatigues. Fully human anatomy, ordinary natural eyes, weathered but healthy real skin, dark hair secured practically for work. Her expression is intelligent, impatient, dry, and assessing—the contempt of someone processing hundreds of recruits, not cruelty. No smile, no glamour pose. She is a clerk with authority, not a pinup and not a front-line action hero. One hand rests naturally on the tablet; the other controls the ledger or queue.

Style/medium: mature AAA cinematic environmental character art with grounded photorealistic realism, physically based materials, natural lens language, real skin pores and hair, worn cloth, scarred steel, wet canvas, believable production wear. The world is near-future magic-tech but nothing in this portrait should look like Earth military cosplay, fantasy armor, cyberpunk neon, or steampunk.

Composition/framing: eye-level environmental three-quarter portrait, wide 16:9. Keep Wendy’s complete face, torso, hands, tablet, and defining silhouette within the central 35–40 percent horizontally and middle two-thirds vertically so she survives a narrow directory-card center crop and responsive dossier crop. Side fields are expendable atmosphere. No essential information in the bottom 10 percent.

Lighting/mood: cool overcast forest daylight filtered through red leaves, one restrained warm work lamp, readable shadow detail, subtle rain haze and film grain. Palette of charcoal, dirty green, wet grey, muted rust, deep crimson foliage, and worn storm-blue accents. No neon soup.

Constraints: one adult subject only; practical unmarked Stormglass fatigues; shared human body plan; no magic use, no corruption, no soul-forge imagery, no facial scars, no weapons, no cleavage-focused framing, no fetishized uniform, no exaggerated anatomy, no rank badge, no invented faction sigil, no readable tablet or paper content, no text, letters, numbers, labels, logos, brands, UI, captions, borders, split panels, or watermark.
```

## QA

- Inspected the selected image at original resolution.
- Simulated the narrow 104:174 directory-card center crop with a 563 × 941
  source window. Wendy's face, torso, both hands, tablet, and ledger remain
  readable.
- Simulated the responsive dossier center crop with a 1122 × 941 source
  window. Wendy remains dominant while the separate machine families survive
  as subordinate Red Forest camp context.
- Verified natural hands, ordinary human eyes and anatomy, blank tablet and
  papers, unmarked clothing, and the absence of text, logos, weapons, magic,
  corruption, unsupported insignia, or glamour framing.
- Verified convention-path resolution through `getCharacterArt("wendy")`.
