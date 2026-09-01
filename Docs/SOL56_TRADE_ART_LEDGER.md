# SOL 5.6 Trade Art Ledger

Date: 2026-08-31

## Scope and publication state

This run created the nine trade plates and the twenty-seven named regional seat-keeper portraits specified by the Nine Trades brief. The nine seats whose keeper remains “— seat drawn, keeper unnamed” deliberately received no image.

The nine plates are live convention-path assets under apps/web/private/codex-art/trades/ and appear on the professions page on the next request. Mara Quill already has a CANON CHARACTER record and her replacement portrait resolves through the authenticated character-art route. The other twenty-six portraits are dormant convention-path assets only: their dossiers do not yet exist, and their faces, clothing, props, and staged environments remain visual proposals rather than canon.

Generation used the built-in ImageGen mode. Each distinct subject received an independent generation prompt; selected finals that needed crop or no-text corrections received a narrowly scoped edit prompt. No external image was supplied as an identity or style reference.

No StoryEntry, database, profession taxonomy, route, credential, infrastructure, or production-state change was made by this art run.

## Shared final prompt: Batch A

The repeated clauses below were combined with each plate-specific block.

~~~text
Use case: stylized-concept.
Asset type: final shipping-quality Martino / The Habitat trade emblem plate, wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Show the trade itself as a grounded environmental still life. No worker or other person may appear, including reflections, silhouettes, photographs, statues, or body parts. Give the plate one immediately readable central idea. Keep every defining instrument, material, and action consequence inside the central approximately 564-pixel-wide source window while retaining useful side atmosphere for the responsive crop.

Style: mature AAA grounded cinematic photorealism; hard-lived near-future production design; physically plausible materials and wear; cool overcast charcoal, dirty green, wet grey, muted rust, storm blue, and bone with one restrained motivated warm practical. Cyan only as contained technology. White-gold only as contained willing light.

No text, letters, numbers, labels, readable papers, fake script, logos, insignia, UI, captions, watermarks, borders, split panels, fantasy ornament, or decorative glow.
~~~

## Batch A subject-specific final prompt set

### Medicine — The Healer's Table

~~~text
A field surgery mid-pause: instrument roll open, one basin, sutures, a phase-reading instrument with its dial turned away and unreadable, and the edge of a cot. The patient has just left alive. One warm practical hangs over the table.
~~~

### Refining — The Grade

~~~text
A refinery bench: containment glass racked by size, one crate open with graded doses seated in straw, a brass scale, and one sealed crate held apart—the crate whose provenance somebody read and did not say aloud. No glow beyond a contained cool shimmer in the glass.

Final crop correction: group the brass scale, open graded-dose crate, sealed provenance crate, and containment-glass rack more compactly around the exact center without changing their materials, meaning, camera, or light.
~~~

### Chemistry — The Bench

~~~text
A working near-future chemistry bench, never fantasy: burners, condensers, a rack of field vials, one stormglass shard clamped for stabilising, and faint physically plausible fume. Any tags are completely blank.

Final crop correction: compact the condenser, burner, clamped shard, and vial rack into the protected center while preserving the same bench, equipment, atmosphere, palette, and lighting.
~~~

### Engineering — The Hall Piece

~~~text
A machinist's bench holding one beautiful finished sealed infusion rig, surrounded by the honest mess that made it: swarf, calipers, a prosthetic hand clamped mid-fit, and a tool wall behind.

Final no-text correction: remove the accidental pseudo-label and restore matching unmarked workshop material without changing any other object, camera, crop, or light.
~~~

### Logistics — The Ledger and the Horn

~~~text
A quartermaster's table: a thick closed ledger, dose tins counted into ranks, ammunition boxed with blank chalk marks, and a battered signal horn hanging above. Everything is squared to the grain of the wood.

Final crop correction: bring the ammunition box into the protected center while preserving the ledger, ranked tins, horn, strict alignment, camera, and lighting.
~~~

### Architecture — The Wall

~~~text
A fortification section under construction at dusk: the ninth course going in, exposed load-path bracing, and a collapse-plan sand table in the foreground with completely blank markers. No scale figures; only their empty scaffolds remain.
~~~

### Extraction — The Partial Take

~~~text
A claim face where the vein is half-worked and deliberately stopped: clean tool marks end at a blank chalk line, the living seam remains intact, and a rack of samples and one lantern sit nearby. The restraint is the image.

Final crop correction: bring the sample rack and lantern inward so the intact seam, stopped tool marks, blank boundary, samples, and lantern all survive the protected center crop.
~~~

### Culinary — The Real Meal

~~~text
A long camp table just before the company sits: steam rises from real food, mismatched tin plates are set with care, one good knife rests near bread that was broken rather than cut, and rain beads on the canvas above. This is the only warm plate in the nine, and the warmth is earned.
~~~

### Xenobiology — The Handler's Yard

~~~text
A husbandry yard at first light: an open travel crate, harness and plate-cutting tools on a rail, feed buckets, and one large animal presence implied only by a dented rail, wet prints, off-frame shadow, and displaced weight. The animal itself never enters frame.
~~~

## Shared final prompt: Batch B

The repeated clauses below were combined with each keeper-specific block.

~~~text
Use case: stylized-concept.
Asset type: final shipping-quality Martino / The Habitat Codex dossier key art, wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Create a wholly original identity and environment. Mature AAA grounded cinematic photorealism; hard-lived near-future production design; real skin, hair, cloth, timber, leather, glass, steel, brass, stone, and weather. Cool overcast charcoal, dirty green, wet grey, muted rust, storm blue, and bone with one restrained motivated warm practical. Cyan only as contained technology; white-gold only as contained willing light.

Composition: an eye-level three-quarter or environmental portrait. Keep the complete face or defining nonhuman object, species/state tells, torso, hands, and critical action inside the central 35–40 percent horizontally, approximately the 564-pixel-wide protected source window. Side fields are expendable atmosphere.

No text, letters, numbers, labels, readable papers, fake script, logos, brands, insignia, UI, captions, borders, watermarks, split panels, copied identity, unsupported biography, fantasy armour, steampunk ornament, glowing eyes, or unlisted mutation. Species, state, ethnicity, and anatomy locks are load-bearing. Human women may be appealing, but never glamor posed and never at the expense of identity, occupation, age, or world truth.
~~~

## Batch B subject-specific final prompt set

### Medicine

#### Registrar Oduya

~~~text
One tall adult Igbo man, he/him, dark skin, grey locks, and practical harbour-registrar clothing. He stands at the medicine book's lectern; the book is closed and unreadable. He reads sponsors like invoices, and his expression is the audit. Fully human.
~~~

#### The Ansel Sisters

~~~text
One Bloommarked organism that learned to be in two places: two identical clinician manifestations in one frame, their symmetry slightly too exact, stance mirrored and breath shared, with a subtle vine-grain sheen along matching forearms. They are not ordinary twins and not a copy-paste artifact. Clinical, composed, wrong only on the second look. No gore or body horror.
~~~

The selected final used this precise crop edit:

~~~text
ANSEL SISTERS — change only the spatial composition so the two identical clinician manifestations stand much closer together as a compact synchronized pair, with slight shoulder overlap and hands working close across a narrow shared central bench. Both complete faces, both matching vine-grain forearms, and both pairs of hands must fit entirely inside the central 35–40% of the wide frame and remain complete in a 564-pixel-wide center crop of a 1672-pixel-wide image. Preserve the same two manifestations of ONE Bloommarked organism, shared identity, mirrored breath/action, clinic clothing, forearm tell, environment, palette and lighting. No ordinary twins, unrelated people, copy-paste artifact, gore, body horror, extra limbs, text or split panels.
~~~

#### Matron Ayida

~~~text
One broad adult marshwoman, she/her, with very dark skin and strong handsome features. She wears clan wraps in marsh-dyed cloth and stands in a stilt-clinic doorway. Her thumb is inked from signing. Fully human.
~~~

### Refining

#### The Tally

~~~text
A machine-object portrait, never humanoid: an Aegis assay engine older than the harbour, with brass drums, one great industrial lens, a separately mounted dispute bell, and wooden housing polished by a century of hands. It fills its counting room like furniture that outranks people. No face, limbs, eye-like facial layout, robot, android, or anthropomorphic cues.
~~~

The selected final used this precise crop edit:

~~~text
THE TALLY — change only the front-component layout and framing: move the one great industrial optical lens, functional brass assay drums, and separately mounted dispute bell closer together around the exact center of the cabinet so all three defining systems survive the narrow center crop. Preserve the same massive inanimate Aegis assay engine, polished wooden housing, counting room, materials, palette and light. Absolutely no person, face, eye-like facial layout, limbs, head, torso, humanoid silhouette, robot or android; the lens remains an off-axis industrial component.
~~~

#### Ferren of the Third Compact

~~~text
One adult desert woman, she/her, with sun-blackened skin and a striking sharp-featured face. She wears compact road clothing and grades doses by lamplight on a moving wagon bench. Fully human.
~~~

#### The Wet Assayer

~~~text
A Risen man who kept his trade: a drowned man returned, with waterlogged pallor, dark venous shadow, and a calm, terribly still bearing. At a salvage bench on League water, he grades stock with careful dead hands. He is not a monster or rotting spectacle; he is a tradesman who happens to have died. The understated horror is that the work is good.
~~~

### Chemistry

#### Doctor Anaya Chandrasekar

~~~text
One adult South Asian woman, she/her, with silver-braided dark hair and an elegant, intelligent presence. She wears an Institute chair's tailored civilian formal clothing in a bench-lined office. Fully human.
~~~

#### Grandmother Sedge

~~~text
A supernatural wearing a grandmother's shape: a small shawled figure at a marsh bench whose details refuse to resolve, with shadow where a face should settle, hands correct in count but subtly wrong in joint, and reeds bending toward her. Older than the Institute, kindly, and absolutely not human. No monster reveal; the wrongness stays quiet.
~~~

#### Powder Warden Tsering

~~~text
One adult woman of Himalayan features, she/her, with wind-burned cheeks and braided black hair. She wears a mountain munitions warden's heavy coat and stands at a powder-magazine door whose stencils are completely blank. Fully human.
~~~

### Engineering

#### Hallmaster Adaeze Quill

~~~text
One stately adult West African woman, she/her, with dark skin, strong appealing features, and silvering close-cropped hair. A hall judge's leather apron sits over good clothes. She stands over a submitted piece with judgment not yet spoken. Fully human.
~~~

#### The Gun's Armourer

~~~text
One adult Chartered person at a Southside bench, with androgynous presentation and a purpose-built but fully human silhouette, skin, face, and hands. Economy lives in every motion; the workbench is immaculate where the room is not. Serial-before-a-name bearing does the talking. A person, never an android: no seams, chrome, shell plates, robot joints, circuitry, or glowing components.
~~~

The selected final used this precise no-text edit:

~~~text
Remove only the pinned white papers, cards and markings from the upper-left drawer wall; replace with matching bare worn dark metal drawer fronts. Preserve identity, pose, bench, camera and lighting exactly.
~~~

#### Forgemistress Ada Krail

~~~text
One adult mountain woman, she/her, with pale soot-scarred skin, a strong forge-built frame, and a handsome severe face. She stands at an anvil in a hall cut into living rock. Fully human.
~~~

### Logistics

#### Harbourmaster Teuila Wren

~~~text
One big adult Pacific Islander woman, she/her, with brown skin, appealing commanding features, and tattooed forearms in abstract island linework with no readable symbols. Her warm commanding laugh is caught mid-order on a quay, with a completely blank manifest board under one arm. Fully human.
~~~

The selected final used this precise crop edit:

~~~text
Reposition only her raised pointing arm into a compact bent-elbow gesture close to her torso, keeping the complete tattooed forearm and primary directing hand inside the protected center. Preserve identity, laugh, blank board, setting and lighting.
~~~

#### Caravan-Mother Ilyas

~~~text
One adult desert matriarch, she/her, hawk-faced and handsome, with deep-brown skin, indigo veils, and road leathers. She stands at a wagon line at dawn. Fully human.
~~~

#### The Ledger of Brine

~~~text
No person: an Echo in a hull-mounted Forge Core, the count-house ship's heart. Show the Core's rings set into a ship's timber hull-space, contained white-gold light at center, and the League counting room around it with strung shell tokens, knotted cords, and closed books. The light is the accountant. No figure, face, silhouette, spirit shape, body, head, hands, statue, ghost, or humanoid light.
~~~

### Architecture

#### Surveyor Inés Alarcón

~~~text
One adult Returnee woman, she/her, olive-skinned and dark-eyed, with Iberian features, an unhurried long-lived bearing, and old observant eyes. Beautiful in the way of somebody with all the time in the world. She carries vault-survey gear and a closed map case in a lamplit undercity gallery. Explicitly not an elf: rounded human ears and ordinary non-glowing eyes.
~~~

#### Stonemother Ravn

~~~text
One adult northern woman, she/her, with a pale weathered flint-eyed face and grey-blonde braids. A nine-generation wall rises behind her in mountain light. Fully human.
~~~

The selected final used this precise crop edit:

~~~text
Reposition only the wall-touching arm into a closer bent-elbow reach, placing the complete hand against a nearer central stone. Preserve identity, other hand, wall, camera and lighting.
~~~

#### Warden-Builder Naledi Osk

~~~text
One wiry adult southern African woman, she/her, with very dark skin and close-cropped hair. She wears ranger-builder kit beside a living-lumber wall visibly growing only along her lashing lines. Fully human; no growth or mutation appears on her body.
~~~

### Extraction

#### Quotamaster Jexa Hale

~~~text
One adult Chartered woman, she/her, with a purpose-built but completely human silhouette, face, skin, and hands. Attractive in an exact, calibrated way, she wears Aegis field-office clothing and holds a blank mechanical tally counter at a Reach extraction head. The counting never stops behind her ordinary human eyes. A person, never an android: no seams, chrome, shell plates, robot joints, circuitry, or glowing components.
~~~

#### The Seam Witch

~~~text
A beast, never humanoid: a blind burrowing animal the size of a wagon, surfaced to the shoulders at a spoil heap in desert starlight. It has a plated blunt head, no eyes, sensory whisker fans, and ore dust ground into its hide. Caravan offerings of carrion and water lie at a respectful distance. Ancient, calm, utterly indifferent.
~~~

#### Delver Ossian Krail

~~~text
One adult mountain man, he/him, pale and quiet-faced, with half his hair gone to rock dust. At a shaft mouth, his bare hand rests on the rock as if listening. Fully human.
~~~

The selected final used this precise crop edit:

~~~text
Change only the spatial grouping so Delver Ossian Krail's listening action survives the narrow center crop. Bring the same rock contact point and the same bare listening hand inward, immediately beside the center-right of his torso, while keeping a natural arm bend and anatomically correct hand. Composition lock: his complete face, torso, bare listening hand, and contacted wet rock must all fit inside the central approximately 564-pixel-wide source window of the 1672x941 image. Invariants: preserve exact identity, face, expression, hair, beard, age, skin, anatomy, clothing, straps, pouches, pose intent, mine, timber, tools, lamp, mountain, rock, camera, lighting, palette, depth of field. No text, extra hands, extra fingers, duplicate limbs, or altered biography.
~~~

### Culinary

#### Auntie Meridian

~~~text
One round adult Black matriarch, she/her, iron-eyed and magnificent, with an apron over good cloth. Her harbour kitchen works at full service behind her, the one warm interior of the keeper batch. Fully human.
~~~

#### First-Cook Nzinga

~~~text
One adult clanswoman, she/her, with deep-brown skin, scar-knuckled strong hands, and a handsome fierce face caught mid-instruction. Her marsh kitchen holds live tanks and hanging herbs. Fully human.
~~~

#### The Galley Saint

~~~text
One whip-lean adult islander man, he/him, with brown skin and salt-white hair. He works one swinging stove in a ship's galley while weather heels everything but him. Fully human.
~~~

### Xenobiology

#### Lodge-Keeper Mara Quill

~~~text
Existing CANON CHARACTER, checked against live Mara Quill v7 before staging: one human woman in her mid-thirties, she/her, a weathered Warden tracker who reads changing trails, Aberrant behaviour, and survivor routes. Create a wholly original Black identity with natural dark skin and practical tied-back hair. Dress her in low-glare repaired tracker layers with scent flags, mechanical range tools, and a field ledger. Stage her in the Bloomfall Reach lodge interior with the real census book closed on its chain. She is an ecological field professional, not a trophy hunter or boss-hunt heroine; no unsupported mutation, magic, cybernetics, insignia, rank, weapon spectacle, or companion framing.
~~~

#### The Heron Speaker

~~~text
A beast, specifically one ordinary grey heron, standing in dawn shallows where the clans' beast-work happens. Pens and handling rails sit behind it while distant human handlers defer. Exact natural heron anatomy and scale, with extraordinary composure: it watches the work as a master watches an apprentice. No glow, aura, size change, mutation, clothing, jewellery, human expression, or anthropomorphic pose. The joke and truth are that it is just a heron, and it is in charge.
~~~

#### Drover Ashkani

~~~text
One adult desert man, he/him, with copper skin and kohl-rimmed eyes protected against glare. He wears road-worn drover layers while moving a herd through a waterless pan at dusk. Fully human.
~~~

## Final asset manifest — trade plates

All files are 1672x941 RGB24 PNGs under apps/web/private/codex-art/trades/.

| Trade | Filename | SHA-256 |
| --- | --- | --- |
| Medicine | medicine.png | a831f726d46980f2b9b2e7296f02b32f48bd0631209a98bdb8692245c2270b4a |
| Refining | refining.png | 7bca4cf784c5e96d3ec75fd477e46162f9dd93e6fa1b6be9d0a70c4be1a86230 |
| Chemistry | chemistry.png | ccc3fe7efbc4fbc4eaed90a1f7313ef793584d3bcb7e6d76ec55caef74f21e0f |
| Engineering | engineering.png | e0e68834ba822bd800a8c726b55cd73ed3fd47b18ab3a05e92735f7cf3d2b99e |
| Logistics | logistics.png | d2b1f3861b5c91349567bd986508faa0afc88983dae2ec41eafd7593cc8eae45 |
| Architecture | architecture.png | 5854c6247a1610ced5f8c88f5cf1c237d11df988b7aa43393cf6227c9e879207 |
| Extraction | extraction.png | 908e58492e60ae9563e4292ceaee6341a6eb87919aa49e0570c10b24f1d51015 |
| Culinary | culinary.png | 764ee6c64b6f5ff6d7883e6140704cac7d4dc42b02b14a15f70d601714e523c0 |
| Xenobiology | xenobiology.png | 9417a4d5c45c50e704c72c4e3b1848ffe7a56aa12243a562f00f2deb7782b6ec |

## Final asset manifest — seat keepers

All files are 1672x941 RGB24 PNGs under apps/web/private/codex-art/characters/.

| Trade | Subject | Filename | SHA-256 |
| --- | --- | --- | --- |
| Medicine | Registrar Oduya | registrar-oduya.png | 639e0ee45c59779477950b1df18103b6f9cc1a529e624c015e2521bc6f755028 |
| Medicine | The Ansel Sisters | the-ansel-sisters.png | b4a54b8c4bf7b964e5a87327ba1e38301250b4331f2b0e8f55da3ead7f273c86 |
| Medicine | Matron Ayida | matron-ayida.png | 5f7afacee604c72fbfca86565d17f1a7268e46bea08eda877e995acd1b6ff0b9 |
| Refining | The Tally | the-tally.png | 3d7ab0646dbca2596bf7b26fc33cef63c9f369fb2160feb13d39466d5f8eeeef |
| Refining | Ferren of the Third Compact | ferren-of-the-third-compact.png | 3eea86b28bb77ef900775404df3aeb5ca5247afc6ad1b3b1005f2902a2bed6c2 |
| Refining | The Wet Assayer | the-wet-assayer.png | 0f552ba0691622a5f297c30515b4fc6b0d46ee1e1cd7efe14a42cda54ffe0596 |
| Chemistry | Doctor Anaya Chandrasekar | doctor-anaya-chandrasekar.png | ea81346730818ce6a015198b9d992926335f608b5ac6bcb394cf73fee5a84231 |
| Chemistry | Grandmother Sedge | grandmother-sedge.png | 9861a6feac9c3a2a7230895b78a4e390f77a98729c599d6de015c1f4f488e0ed |
| Chemistry | Powder Warden Tsering | powder-warden-tsering.png | 21f697033713212cf353175f38a3040b36d2de952c10d1374fba75779492f658 |
| Engineering | Hallmaster Adaeze Quill | hallmaster-adaeze-quill.png | 0e1c15f3979aeec494ed858f14af75595cc12dda4b2a47dbaf30a78df69dabff |
| Engineering | The Gun's Armourer | the-guns-armourer.png | 773eb6f72c5c805bbadc5c8c2a59178cc9ff174207bcf0b3a0fd67dfc76d969d |
| Engineering | Forgemistress Ada Krail | forgemistress-ada-krail.png | 0f41e90960916bd0109a90ce0cfb5a2c23bd5a31a167c0ec78389575a26dae78 |
| Logistics | Harbourmaster Teuila Wren | harbourmaster-teuila-wren.png | ea5d2d4b0356bc1b345e7af828dbd7884e6518b803f3773e11d74163595a04dc |
| Logistics | Caravan-Mother Ilyas | caravan-mother-ilyas.png | d684a188672f2425454955f082dd780092a34e7c135608252e4a26514c11dd94 |
| Logistics | The Ledger of Brine | the-ledger-of-brine.png | 6d5926bf512c55cb1155b5f730ecd4466690607bbd435963408df3078d8d9936 |
| Architecture | Surveyor Inés Alarcón | surveyor-ines-alarcon.png | 6961dc9faae38768a7948aa468c6cc641f4fda23b97e768fe8119defbfec0a89 |
| Architecture | Stonemother Ravn | stonemother-ravn.png | 6f7e8887eae813a80c803f95b4ec0955fb32ad555fbe38438a14be41686f1a7d |
| Architecture | Warden-Builder Naledi Osk | warden-builder-naledi-osk.png | 39d6cad1c52f2c7ef1f10e2070ff34dae3506a29a0cb38753ac75b7f824aaa49 |
| Extraction | Quotamaster Jexa Hale | quotamaster-jexa-hale.png | 357cfce467e99b67d7ef1ae261526d158e13204e5f70f68da3b87a6d5aef60f1 |
| Extraction | The Seam Witch | the-seam-witch.png | cd3406cafc43441e897ef815e5250425790d3a678a7012c98b8196448cbf8137 |
| Extraction | Delver Ossian Krail | delver-ossian-krail.png | 5c838b79151189a8a58d20809369cc4f4a287d6b02ca9e6c0a98228fa01827c8 |
| Culinary | Auntie Meridian | auntie-meridian.png | d1409b1c657f1d4dd1d7effdba4307b887917297ee13e372ec4317e901de7b09 |
| Culinary | First-Cook Nzinga | first-cook-nzinga.png | cea4ed6a20ff62e44dd4cac491d5481d5a8d0c02fd1299b9d0194b0597931768 |
| Culinary | The Galley Saint | the-galley-saint.png | a7602959f71eac47af361216f68ff2dca056de2dd02d7ea2dde6aacda30db44d |
| Xenobiology | Lodge-Keeper Mara Quill | mara-quill.png | 390463979f93ca32b1f7cb67d4b09449f2a8b6bf945974fd1a73042805bbca25 |
| Xenobiology | The Heron Speaker | the-heron-speaker.png | f35ad09aca0eaa2781dc32b812e6cb0f82bcfadd3609415cf1c5ac9fee494b5a |
| Xenobiology | Drover Ashkani | drover-ashkani.png | 4611eaecd23e94a589e95875757f68700fcdc5e7d5082be4ebb6985b9a3b1859 |

## QA record

- Inspected every selected final at full resolution.
- Mechanically verified all 36 selected files as 1672x941, three-channel RGB24 PNGs.
- Rendered and reviewed the destructive 564x941 center window and the approximately 1122x941 responsive center crop for every selected file.
- Batch A contains no people, readable text, logos, UI, or readable symbols. The Architecture plate clearly reads as an unfinished upper course and exposed structural bracing; the exact numerical course count is intentionally not claimed as independently machine-verifiable. The Xenobiology plate clearly reads as an empty worked yard with crate, harness, buckets, tools, prints, and displaced animal-scale weight; its damaged rail and off-frame shadow are deliberately subordinate.
- Batch B holds every species and state lock: the Tally has no face; the Ledger of Brine has no figure; the Heron Speaker remains an ordinary heron; the Ansel Sisters read as one organism at two stations; both Chartered keepers are fully human people rather than androids; Inés Alarcón has rounded human ears and ordinary eyes; and the Wet Assayer remains an understated tradesman rather than a rotting spectacle.
- Reviewed the human roster as a set: skin, features, age, body, region, dress, and occupation remain varied as specified, with no drift toward a default face.
- Confirmed that no image was created for any of the nine reserved seats.
- Checked Mara Quill against the live CANON v7 CHARACTER dossier before staging; her human identity, age range, Warden-tracker role, low-glare layers, scent flags, mechanical range tools, field ledger, lodge context, and ecological—not trophy-hunt—framing remain consistent.
- Confirmed that this run changed no StoryEntry, database row, profession definition, taxonomy, application code, public asset path, credential, infrastructure setting, or production-state field.

## Publication note

The trade page discovers Batch A by its existing authenticated private route, so the nine plates require no code change, rebuild, or service restart and are visible on the next reload. Mara Quill likewise resolves immediately through the character convention path. The other twenty-six keeper portraits remain deliberately dormant until their CHARACTER dossiers are authored and approved.
