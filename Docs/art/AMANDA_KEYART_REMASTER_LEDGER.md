# Amanda key-art photoreal remaster ledger

**Status:** APPROVED, INSTALLED, AND LIVE-VERIFIED  
**Completed:** 2026-09-01  
**Target:** `apps/web/private/codex-art/characters/amanda.jpg`

## Outcome

Amanda's approved composition, identity, public Lizzarnix presentation, pose, armor, tail, Peninsula sunset, teal infrastructure, and phoenix-fire silhouette were preserved. The rendering was remade for sharper photographic detail, more natural skin/scales/hair, physically credible leather and metal, richer controlled color, improved dynamic range, and materially lower compression.

The phrase "8K quality" is an art-quality direction, not a pixel-dimension claim. The shipped Codex contract remains 1672x941 because the private derivative route never enlarges an original and the current UI tops out below native 8K.

## Provenance and publication

| Stage | Path | Dimensions / format | Bytes | SHA-256 |
|---|---|---:|---:|---|
| Previous published plate | `tmp/amanda-keyart/original/amanda-original.jpg` | 1672x941 sRGB RGB24 JPEG, 4:2:0 | 493,234 | `96ec3ba51d0a3b18bb44c99cf08c9a149f27668b9a5bdc908d843b8d9a522abf` |
| Accepted ImageGen remaster | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-e9210477-d954-4b7c-bc72-606c162393a4.png` | 1671x941 sRGB RGB24 PNG | 2,685,298 | `883156caabdfb03ef6515ac165d9ee1eb87d6179d97f59ea1a5636ff97bc6e64` |
| Workspace source copy | `tmp/amanda-keyart/sources/amanda-remaster-v1.png` | 1671x941 sRGB RGB24 PNG | 2,685,298 | `883156caabdfb03ef6515ac165d9ee1eb87d6179d97f59ea1a5636ff97bc6e64` |
| Final published plate | `apps/web/private/codex-art/characters/amanda.jpg` | 1672x941 sRGB RGB24 progressive JPEG, quality 97, 4:4:4 | 965,950 | `06112dbdc3c8c67ec657e904307056c3fe7a05916e13d5151861af59cc842ca0` |

Publication normalization was mechanical only: resize the one-pixel width deviation to 1672x941, retain sRGB RGB24, and encode as a quality-97 progressive JPEG with full 4:4:4 chroma. The existing explicit resolver binding to `/codex-art/characters/amanda.jpg` remains unchanged, so no application-code change, build, deploy, or service restart was needed.

The machine-readable install record is `tmp/amanda-keyart/install-manifest.json`.

## Final accepted prompt

Built-in OpenAI ImageGen edit mode was used with the previous published Amanda plate as the identity-preserving edit target.

```text
Use case: identity-preserve
Asset type: mature AAA game character key art, cinematic 16:9
Input images: Image 1 is the edit target and binding composition/identity reference.
Primary request: Remake this exact Amanda key-art image as substantially sharper, more realistic, higher-quality photorealistic cinematic artwork with richer, more natural color and an “8K master” level of visible detail. This is a faithful high-end remaster, not a redesign.
Scene/backdrop: Preserve the exact sunset coastal fortress/industrial harbor setting, architecture, wet stone, distant structures, fire bowls, sky, camera angle, and depth arrangement from Image 1.
Subject: Preserve Amanda’s recognizable face and identity, adult proportions, expression, direct gaze, red hair, exact pose, body placement, hand placement, elegant scaled tail, outfit silhouette, weapons/gear, jewelry, and phoenix-shaped fire/magic behind her. She is a beautiful adult Lizzarnix passing as a red-haired lizardwoman sorceress. Keep fine jewel-toned scales naturally integrated across her humanoid face and body. Her golden eyes catch light so intensely they seem almost luminous but do not emit light or glow.
Style/medium: grounded cinematic photorealism as if photographed on a premium full-frame cinema camera with an exceptionally sharp prime lens; realistic optical depth, fine microcontrast, restrained filmic grain, physically based materials, clean high-frequency detail without crunchy digital oversharpening.
Lighting/mood: Preserve the sunset direction and dramatic warm/cool contrast, but improve dynamic range, shadow detail, natural skin tones, dimensional facial lighting, believable firelight, atmospheric perspective, and rich controlled color separation. Deep burgundy-red hair, warm gold and ember fire, charcoal/black worn gear, cool wet stone and restrained teal industrial light. Avoid orange color wash.
Materials/textures: real skin pores and subtle imperfections; individually resolved damp hair strands; tiny matte jewel-toned scales with believable subsurface variation; worn cracked leather, stitched seams, dulled scratched metal, soot, ash, moisture, grime, and physically plausible translucent smoke and flame. Remove the plastic, waxy, airbrushed, video-game-render look.
Anatomy: natural human facial anatomy; coherent shoulders and torso; two anatomically correct arms; five natural fingers per visible hand; tail integrated from the base of the spine; no extra limbs, duplicated hands, or malformed fingers. The phoenix-shaped fire remains a magical flame silhouette/aura, not a second creature and not literal anatomical wings attached to Amanda.
Composition/framing: preserve Image 1’s exact 1672x941 landscape composition and Amanda’s location/scale. Keep her face, torso, both hands, held gear, and tail readable in the existing center crops used by the website.
Constraints: change only rendering realism, sharpness, material fidelity, lighting fidelity, and color quality. Preserve all story content, composition, identity, pose, wardrobe design, modesty level, gear, background layout, flame silhouette, and crop safety. Zero text, letters, numbers, logos, insignia, UI, border, caption, or watermark.
Avoid: painterly brush texture, soft concept-art haze on the face, beauty-filter skin, plastic armor, glossy fantasy CGI, excessive bloom, neon eyes, glowing scales, oversaturation, crushed blacks, blown highlights, chromatic aberration, artificial HDR halos, redesigned clothing, different face, different pose, extra objects, extra characters.
```

## QA gates

- **Identity/canon:** PASS — same face, expression, adult body, pose, black/oxblood armor, golden non-emissive eyes, jewel-toned public-form scales, one lower-spine tail, red hair, gear, and suggestive fire silhouette; no horns, attached wings, second tail, extra limbs, egg, facility, children, captors, or full true-form reveal.
- **Static crops:** PASS — full comparison, 128x176 desktop directory crop, dossier-center crop, and face-detail comparison are retained in `tmp/amanda-keyart/qa/`. Face, gold eyes, weapon hand, tail, armor, and fire remain readable.
- **Automated:** PASS — `pnpm --filter @habitat/web exec tsx --test lib/character-keyart.test.ts lib/codex-art-privacy.test.ts lib/codex-art-derivative.test.ts lib/dossier-art.test.ts` passed 23/23. `git diff --check` passed.
- **Authenticated dossier:** PASS — `https://habitat.martinobear.com/codex/bible/amanda` served the new derivative and passed at 1500x900, 720x900, and 390x844 with no horizontal overflow.
- **Authenticated directory:** PASS — `https://habitat.martinobear.com/codex/library/characters` served the refreshed `?w=320` derivative; Amanda's face and silhouette read in the 128x197 live card.
- **Authenticated companion chain:** PASS — `/codex/library/companion-missions` served the same refreshed `?w=320` derivative in the 64x64 Amanda header.
- **Runtime health:** PASS — browser warning/error log was empty.
- **Private access:** PASS — an unauthenticated direct request to `/codex-art/characters/amanda.jpg` returned HTTP 404.

