# SOL 5.6 — Riverlands art ledger

**Status:** COMPLETE — accepted and installed

**Commission issued:** 2026-09-01  
**Execution completed:** 2026-09-01  
**Authority:** issued Riverlands run prompt → live art audit and dossiers → director brief

## Acceptance summary

- Baseline audit: **80 empty slots** — 49 REGION, 7 SYSTEM, 15 CREATURE, 8 CHARACTER, 1 THREAD.
- Final audit: **0 empty slots**. Arithmetic: **80 → 0**.
- Delivered: **80/80** exact allow-listed private assets; no previously delivered plate was replaced.
- Format gate: **PASS — 80/80** are 1672x941 PNG, sRGB, 8-bit `uchar`, 3 channels, no alpha (RGB24).
- Crop gate: **PASS** — full frames and exact centered 564x941 crops reviewed; all eight characters also reviewed at centered 1122x941.
- Visual gate: **PASS** — dossier/director locks, per-leg palette separation, zero-text law, machine non-anthropomorphism, story locks, and bright-plate full-radiance law reviewed.
- Privacy/resolver gate: **PASS** — convention-path private resolver coverage and focused tests pass; no database, API, credential, infrastructure, or public-path change was made.

## Reconciliation and execution notes

- The brief's header was stale at 66 and its body contained 79 asset blocks. The live audit correctly required 80.
- `regions/velvet-reach.png` was the one audited slot omitted by the brief. Its CANON live dossier supplied the recovered prompt; this discrepancy is recorded on that asset.
- Heartland is interpreted from the live dossier as five river legs entering the wall gates and braiding at the city; the art does not claim the city creates the rivers.
- Seven commissioned character dossiers remain `PROPOSED`; producing art did not promote their canon status. Alder Wade remains CANON and alive.
- The VS Code restart occurred after Sandgate generation. The seven accepted files and their generated-source hashes survived, but the agent's in-memory exact expanded tool prompts did not. Their canonical normalized prompt blocks below reconstruct the accepted dossier/director specs honestly.

## Generation-service exceptions and QA iterations

- Service refusals: **none**.
- Clearinghouse: first draft superseded after native inspection found pseudo-writing on assay papers; accepted reshoot removes document-like surfaces.
- Crimson Communion: first draft superseded by a targeted edit replacing embossed coin faces with perfectly blank brass discs/ingots.
- Alder Wade, Verity Lam, Cassia Verne, and Ottar Kolm: identity-overlap drafts were superseded; final portraits use original identities. Alder's final pass also replaced a shaped lapel emblem with a plain round brass chair pin.
- Towback: superseded after independent QA found pseudo-glyphs and loss of the barge/bargeman in the protected crop.
- Waterworks, Faith Lane, Ossuary Rites, Forgefaith, Old Roads, Falls Swift, and Reedjack: reshot after strict independent review found named story locks outside the 564x941 crop; current plates retain every required lock.
- The Fuse at Heartland: two compositions were superseded because their five clusters spread outside the protected crop; the accepted 2+3 arrangement preserves exactly five inside it.
- Any additional batch-local superseded attempts are preserved in the exact execution-prompt appendices below.

## Final SHA-256 manifest

### regions

| Relative path | Dimensions / pixel format | SHA-256 |
|---|---|---|
| `apps/web/private/codex-art/regions/arcadia-gate.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `48d2478e37787a6026ad5315c519e9c768cd2153ed9e4ac2ff9c9a6f7a9d889a` |
| `apps/web/private/codex-art/regions/cliffgate.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `49e3c4b6326d7fc083c79b0326f1e056ba65dd381f52d66a5619194beb0afeea` |
| `apps/web/private/codex-art/regions/riftgate.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `dc22bf9a81ed6a174d94f6327822fb468c29ebbb39c573c2dee65df8ce741833` |
| `apps/web/private/codex-art/regions/sandgate.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `16dac7431baf133b790362a25d81fd863c0d470ebe56bc2e7dad8d751ae7746c` |
| `apps/web/private/codex-art/regions/stormgate.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `704c9895124872ec5b64956115ed2c429d3ca6ca23c7df1f6c49b687a0fac054` |
| `apps/web/private/codex-art/regions/heartland.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `c99a9cb54cab53ffcdfe2656e1054f6fbf638df847e20178ff604aec4837ad03` |
| `apps/web/private/codex-art/regions/clearinghouse.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `7c5cfd92d2cf76ec3786476adbea6baa7eca901a7f51640501f6945ec8391b6f` |
| `apps/web/private/codex-art/regions/halfload.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `6e8f3ed62543fad794f61a821b8e6c083a200da2107f6eab00758984339c2edf` |
| `apps/web/private/codex-art/regions/widows-toll.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `2ea012d5dad22c5531a04519d12af17246f24cf7191412305df0392cfb76daa4` |
| `apps/web/private/codex-art/regions/brasslight.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `669307c02f7c95b7c4b06ddf5c5f61ffb80af031734b00cb59ca1f22229e42c1` |
| `apps/web/private/codex-art/regions/sunken-row.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `a17912522ce5280f7a3af0585c9e424316e6b4f3bf1eef7de1bf268e18b779e5` |
| `apps/web/private/codex-art/regions/velvet-reach.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `f98170fc53612655aef082c1475a4bad8711141bdf0f0db2bc8c6d3c24e9f323` |
| `apps/web/private/codex-art/regions/tally-light.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `330cb1a108965b37c483094461484898b3b4c56831c1d655e7b54d82d5686bea` |
| `apps/web/private/codex-art/regions/gullwatch.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `995ff3a43220a6c08995e4df7d94c6b632697bc36b22af044ff1921fb4f883bc` |
| `apps/web/private/codex-art/regions/winchworks.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `0f29f8e34dc4bc34726e6f0cf0b2dd55ac5a2f86d46b3ba6fd98e4163a8769e8` |
| `apps/web/private/codex-art/regions/stairfoot.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `f710c3d0ba13230f02dfd487e96cb0664a6e23899fe2a7bdcf2aea0dfb15e33c` |
| `apps/web/private/codex-art/regions/chainsong.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `54820761b79e033c0341813642db7f293f6dc7cd7e232738d1e2a24079731bba` |
| `apps/web/private/codex-art/regions/hanging-market.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `34e35e6876ef526ab0e93bf10296ee66a07fa096f77cf0d011d9f2e84447ea7a` |
| `apps/web/private/codex-art/regions/thundershade.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `188d3284db549e10ec927b3feff60c0bbdd985b7a1595cfb4870760618b650a8` |
| `apps/web/private/codex-art/regions/deadhaul.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `b163c1e0d4873522dbcd4a5ae84cb2d24c3b05d187ab1b1db9b0dfc47daa21e2` |
| `apps/web/private/codex-art/regions/high-sill.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `1f9fc0e6cd4d392fd023c6d7a03872777674ff0da7d518a07034727b3f46842c` |
| `apps/web/private/codex-art/regions/anvil-watch.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `5ed4a9b1c26ff7b0d0c09cc7452128b62c5ea4ec03b7e6a0e3d960c7420a817e` |
| `apps/web/private/codex-art/regions/charnel-lock.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `f7a79276b8d408fd89a339fc7cd04073a5a03fc01a63470868d747ed177b5d6e` |
| `apps/web/private/codex-art/regions/wakewater.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `1ae6e3f724b7899efbab7b8b7ef7842ff54c1b9c39733655b4306ac823d0a175` |
| `apps/web/private/codex-art/regions/mourners-ferry.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `417cde58605ee8efd3e455aab6f8e5917e062a18f1f9ae6adbe08d8faa470603` |
| `apps/web/private/codex-art/regions/redletter.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `4eb8724465845b2b0509f404eb2d44da02e7a06a081b1b9dbac71ccc30c57e07` |
| `apps/web/private/codex-art/regions/candlereach.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `9ca2e80c4698285a300fab9badf5debcefd5555d78d0c2d0ddc1176a283d63db` |
| `apps/web/private/codex-art/regions/quiet-boom.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `18d5332eeb273c6ea63c50fc0ffb51816b52dac193ac0602021c215d144a97b4` |
| `apps/web/private/codex-art/regions/bonefire-picket.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `598753a05200df05fae315ca87c5672a18f15b0e8ce81b762a1dc8285b04d0ab` |
| `apps/web/private/codex-art/regions/standing-camp.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `2834f48519f9ed86c5a44f0e39d17a6db872735e35e0143983415dd27d9abec0` |
| `apps/web/private/codex-art/regions/lastwater.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `64ba8a2c6da4653e4634ceb4ab9a71c8484e89f8823e57ef94419c8ed4155a1f` |
| `apps/web/private/codex-art/regions/honest-well.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `77dfc654fca14370625d4ac0d955541082d7e1c42ce9b6e2f4cef848808b3b73` |
| `apps/web/private/codex-art/regions/mirrorwater.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `706ca5bdb91b02eadb3ffe54508fd98afa5dbaed41db906dc66105b50634d092` |
| `apps/web/private/codex-art/regions/saltsong.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `743922c8a392c179a524e289691c1d7cd1dc0dabe2d27cd959fdf94a903d8809` |
| `apps/web/private/codex-art/regions/dry-bell.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `1d7aecf728f0ddecac8c8b6801e8f8daaa55a1e0bf513b6ef8abd285c26fb743` |
| `apps/web/private/codex-art/regions/vultures-patience.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `69fa155d3c2bc67f83684fc8f30f2e4525ca582913f87ddba90ab90643db58a8` |
| `apps/web/private/codex-art/regions/regulator-station.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `20a17031ab36c9b4eb42f5decee756bfc3b7d0a4974e4da373c751451784da46` |
| `apps/web/private/codex-art/regions/gaugetown.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `55d69c979c1d97df0f138491d92c3f68c7e415d71896c7b537e9b6629a9670f7` |
| `apps/web/private/codex-art/regions/glasscalm.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `fb1ff4de5efc6825c73f2d5db5cb657fe8f9fe02cc7643dafce334ad111099d1` |
| `apps/web/private/codex-art/regions/needles-eye.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `a1e367cc3d2457334261e8da849ed87f5c64e1de318af31d006998cf9a398762` |
| `apps/web/private/codex-art/regions/farflicker.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `54d99739db2839c1f6e521033fe3399426b004a7e1239649645771c8f130ed68` |
| `apps/web/private/codex-art/regions/breakline.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `12c59b9e611ef18dd238f41762ff216e28fd3a0e95fbc20a9df835f66f3eaba6` |
| `apps/web/private/codex-art/regions/echo-fence.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `8884f5a6325b35dcd4d502b4814dbd1a8a2a31bb156214ece9ad8d98a7b457bf` |
| `apps/web/private/codex-art/regions/last-mooring.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `81cb2b458913454b34a8fa458ee6b941791dc15ea20ccb4cbc277d0fff249057` |
| `apps/web/private/codex-art/regions/first-charter.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `94c368fb43fba34a5ffd5f1a5cd53266bc92ba93ae6165fda65f32f6a113657c` |
| `apps/web/private/codex-art/regions/second-charter.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `7a5db9e55b20c32fb8b6e755d4726d370b73d5297d88a79f45c697d66156814c` |
| `apps/web/private/codex-art/regions/third-charter.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `0127ea59f6e3efdc10ab5dfe9cdcc0f76e4449e5048853748d5aa6aedb8aba37` |
| `apps/web/private/codex-art/regions/first-weir.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `0eaf8e146c9ce4b129425fec19632115e8c87c0052cbd4b809915677709430f4` |
| `apps/web/private/codex-art/regions/the-outfall.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `e6e78ed380ba48c8f0ed22d34d83ecbd583d0511a22341dfb78a75dbf3241b8a` |

### systems

| Relative path | Dimensions / pixel format | SHA-256 |
|---|---|---|
| `apps/web/private/codex-art/systems/the-waterworks.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `6a6742ef0d889ac991c0ec61d4e01e07118dd0580df45ddb1735d8bdf1644517` |
| `apps/web/private/codex-art/systems/the-faith-lane.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `dbd68962168a8525db17cfb45ef17afae4c1cc84ea38defe225419a71d5562d1` |
| `apps/web/private/codex-art/systems/the-first-gift.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `d97df7e56c2de129e9175c2af2502cfefa56bd47631bef2a2b21cc2f807ca36f` |
| `apps/web/private/codex-art/systems/the-ossuary-rites.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `e66a2c94e55716cb75a7e62906741d18365e52834b6594855db16341bcae6c56` |
| `apps/web/private/codex-art/systems/the-forgefaith.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `b2a69a40939fbc7570232b32fc04297a18c2a60a89de527b74fe12ec326f941c` |
| `apps/web/private/codex-art/systems/the-old-roads.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `a25f62a2f9af2a2d06cd4e8e8f599670ea710b0ecc2e1f83886f658426f96315` |
| `apps/web/private/codex-art/systems/the-crimson-communion.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `6566083d4172e99a082468dab0834e4a1ef42a22bbd7ce1a2d52740bfde3544c` |

### creatures

| Relative path | Dimensions / pixel format | SHA-256 |
|---|---|---|
| `apps/web/private/codex-art/creatures/machines.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `3dfb6934d2f6b2257f1e083629dd87b8f2fb1a3b48abab20de36d24fbc9c88c8` |
| `apps/web/private/codex-art/creatures/palisade-frame.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `a24601d631c681c483fd1de4db79d263a767f213167de68e8a47cdde6fb8eed8` |
| `apps/web/private/codex-art/creatures/chaff-wasp.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `900ed49e1d0b089b0ca0b7bf179bcfa1c43006503066230dd3a2bfcdb8e88399` |
| `apps/web/private/codex-art/creatures/jackknife.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `481b296c48b3d275d324c5f0646019e4b3b9e100023b3e2a801b06965dd5a826` |
| `apps/web/private/codex-art/creatures/millstone.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `6dc763415f64677eb1bf7200ae9c431a15cf17f63699d60e032beb77d9635d96` |
| `apps/web/private/codex-art/creatures/collector-pattern.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `52dfd902fd0873ee1f709a9c62328e2f375ff9c6e3060c56f2e1daaa7181f2dc` |
| `apps/web/private/codex-art/creatures/bureau-stork.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `060b8c58b3f0fd9c3b9e3ce1bc26b80a193f31d573ee87003ba9ab6e7dc8f30e` |
| `apps/web/private/codex-art/creatures/armistice-frame.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `b49bc89483aa091e82aca850915e6a2025f170c0206c091f5bbdfe3fcb12ca61` |
| `apps/web/private/codex-art/creatures/towback.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `f0cc8daf34c241f0cae7e6cd161911adbbce0c74d0bbacfee15469497caea04c` |
| `apps/web/private/codex-art/creatures/tollgull.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `e8bdaee82db0affa8525ee464ae492eed4d4c6e1210589babfff7bbb3c963535` |
| `apps/web/private/codex-art/creatures/falls-swift.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `e2c481dc099baf24e0d646f0bfabd3d46c49015f13cd22bb39dfea297f544a0e` |
| `apps/web/private/codex-art/creatures/boneback-sturgeon.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `17f98acd65da47a87ddcab84ee4ee135afe8c32fabc040150a6eeed2bccf9420` |
| `apps/web/private/codex-art/creatures/salt-ibis.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `c7e5659e46af1692abf4039c16d67039ada9492572cce0035b3eac9eb20ce661` |
| `apps/web/private/codex-art/creatures/glasspike.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `b96436cfb150e6d2a45f318761b559f8e16134b79d0beb2f6dd747f3ac064d29` |
| `apps/web/private/codex-art/creatures/reedjack.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `dfdca763739c3dbf729a73002b87221e94deefe098c87e37efc42fe0ffe5e24a` |

### characters

| Relative path | Dimensions / pixel format | SHA-256 |
|---|---|---|
| `apps/web/private/codex-art/characters/alder-wade.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `3b7401414913ec6053730d042a1bafbef07afd1640e46e833909d757fce7b0f3` |
| `apps/web/private/codex-art/characters/the-judge-of-heartland.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `4fcc190a35894a962973dc32375faf36c3ac55c6ec19ae4c79120debe47b5f1b` |
| `apps/web/private/codex-art/characters/the-heartland-watch-captain.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `bf33e19e760ce1740a81768e662e08443df31b20476f54e10db38be81f46eabf` |
| `apps/web/private/codex-art/characters/cassia-verne.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `8d27332ddcfb788af6f2f57100e7005148a68f0f0bf9839a99a68daf128a4456` |
| `apps/web/private/codex-art/characters/ottar-kolm.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `9dc99f499842f06760e4ec5a5a3020edab72c3c520835e61273c865c813e7e9b` |
| `apps/web/private/codex-art/characters/cerise-mora.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `92a2531d0b83a47282d97238a9a3efd214b0ac41ee191560ef5e8bf8d1613dba` |
| `apps/web/private/codex-art/characters/yusra-of-the-wells.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `cce960025df3a90beeb8f7c8719e52c4cb554684c1d3a8ab50b7746faf72a7cd` |
| `apps/web/private/codex-art/characters/casmir-rew.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `5b91ee46b9f31063492b3fe0c6b3d7af4ab20aeaf2830273753e2eb65a2177be` |

### threads

| Relative path | Dimensions / pixel format | SHA-256 |
|---|---|---|
| `apps/web/private/codex-art/threads/the-fuse-at-heartland.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | `bbd379ad862d8a40c65631a0a650e0df3e70bc177cbe6141df9289d64c1ebe0d` |

## Per-asset prompt and QA records

### regions/arcadia-gate.png — THE LEG PLATE · RADIANT

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/arcadia-gate.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-1e3bd7b3-a019-43e5-b058-24c8164b4d69.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `48d2478e37787a6026ad5315c519e9c768cd2153ed9e4ac2ff9c9a6f7a9d889a`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The deep freight artery at golden morning: laden barges in convoy, towpaths with towback teams, the water crowded and rich, the leg's gate-lock in Heartland's wall behind. Must hold: the busiest water in the world; wealth as light; the war nowhere in sight — that's downriver.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/cliffgate.png — THE LEG PLATE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/cliffgate.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-f2cb9c1d-caae-4800-8424-697c1a570fc5.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `49e3c4b6326d7fc083c79b0326f1e056ba65dd381f52d66a5619194beb0afeea`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The river as a climbing machine: the gorge ascending in stacked locks and lift stages toward the great falls, barges in timber cradles mid-air on chains, spray and shafted light. Must hold: the only door between watershed and high country; vertical scale that makes hulls look like toys.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/riftgate.png — THE LEG PLATE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/riftgate.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-26c8863a-0ba2-48bc-9a26-522c5e521ced.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `dc22bf9a81ed6a174d94f6327822fb468c29ebbb39c573c2dee65df8ce741833`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Tannin-dark water running northwest into older country: funeral barges and relic freight under red-brown trees, the light going ancient upstream. Must hold: the past coming downstream as cargo; polite, unhurried menace; candle-warm points in the dark water.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/sandgate.png — THE LEG PLATE · RADIANT

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/sandgate.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-f03502d8-852f-43da-9bc0-5104b9b9f187.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `16dac7431baf133b790362a25d81fd863c0d470ebe56bc2e7dad8d751ae7746c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The last green thing before the desert: a ribbon of river, palms, and watered ground reaching into ochre dry country, a caravan meeting the water. Must hold: the seam between two worlds; green as wealth; the desert visibly charging at the edges.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/stormgate.png — THE LEG PLATE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/stormgate.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-fc33ad0b-7835-41e3-8ef1-c40b24b80f4c.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `704c9895124872ec5b64956115ed2c429d3ca6ca23c7df1f6c49b687a0fac054`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A river running unnaturally steady through country going wrong: the pylon corridor marching northeast, water flat as glass under storm-blue skies, the Wasteland's violence held at the horizon. Must hold: engineered calm as the subject; cyan only as tiny contained lights on the hardware; the quietest river in the world, not meant as a compliment.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/heartland.png — THE CITY PLATE · RADIANT

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/heartland.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-13b5aa21-72b1-4d0c-a8a1-5d316f80c1c6.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `c99a9cb54cab53ffcdfe2656e1054f6fbf638df847e20178ff604aec4837ad03`
- QA: PASS — full frame, exact 564x941 center crop, radiant flagship city, dry center, five-gate/five-leg geography, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Five rivers braid into one water around a dry walled city that has no right to be dry. High oblique dawn view: the braided nexus, the city rising from open floodplain, and the five great lock-gates in the wall each releasing a river arm toward a different horizon. Wharf districts inside, each with its own character, none flying any banner (the Standstill: every faction a wharf, no faction a garrison). Must hold: the city stands dry in the middle of a floodplain; the five gates are ancient lock machinery wearing the wall; morning light owns the frame — this is what the war is for.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/clearinghouse.png — THE CUSTOMS FORT

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/clearinghouse.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-ad409c38-5b15-425c-a5fc-bd0100e8aecb.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `7c5cfd92d2cf76ec3786476adbea6baa7eca901a7f51640501f6945ec8391b6f`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A fortress that files like a customs house: cranes, bonded warehouses, assay benches, a garrison that salutes the manifest. Every southbound hull queued to be weighed, sealed, taxed. Must hold: ledgers as fortification; Aegis grey without any logo; power expressed as paperwork with guns.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/halfload.png — THE TRANSFER TOWN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/halfload.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-f80929c3-3bc6-4412-90b9-af5c5a34b40e.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `6e8f3ed62543fad794f61a821b8e6c083a200da2107f6eab00758984339c2edf`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The shallows: deep barges lightening into swarms of small lighters mid-river, a town of cranes and tally-sheds grown around the transfer. Everything in motion, everything in everyone's hands. Must hold: the friendliest and leakiest town on the leg; cargo mid-air between hulls as the signature image.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/widows-toll.png — THE BRIDGE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/widows-toll.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b38330a0-5a75-413a-9147-06d92e15b66e.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `2ea012d5dad22c5531a04519d12af17246f24cf7191412305df0392cfb76daa4`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The great stone road bridge, and traffic stopped upon it: the Accounting — the widows reading the river's dead aloud while barges wait below out of respect. Morning light through the arches. Must hold: the one thing the money river stops for; dignity, not gloom; no readable text on the rolls.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/brasslight.png — THE NIGHT CHANNEL

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/brasslight.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-9b708309-0e44-488b-b505-994afc0fce53.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `669307c02f7c95b7c4b06ddf5c5f61ffb80af031734b00cb59ca1f22229e42c1`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Full night, the leg's one dark-hours plate: pilot skiffs running the sandbar channel by heirloom brass stern-lamps, a string of warm lights reading the water's sound. Must hold: the lamps are the licenses; the channel navigable only by the families who own the dark.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/sunken-row.png — THE TOWN ON ITS WRECKS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/sunken-row.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-712f31de-5225-4383-bfb9-1aeb22a2a610.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `a17912522ce5280f7a3af0585c9e424316e6b4f3bf1eef7de1bf268e18b779e5`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A town whose streets stand on scuttled hulls driven as pilings — decks became boardwalks, holds became cellars, masts became posts. Salvage racks, wet cellars, gulls. Must hold: every street IS a barge; the town keeps what the river takes; lived-in, not ruined.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/velvet-reach.png — THE MONEY RIVER'S PARLOR · AUDIT/DOSSIER RECOVERY

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/velvet-reach.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-d6a0871d-d09f-42af-9786-3b7df0d20809.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `f98170fc53612655aef082c1475a4bad8711141bdf0f0db2bc8c6d3c24e9f323`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Discrepancy: absent from director brief; reconstructed from CANON live dossier because the audit wins.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A sheltered Arcadia Gate mooring basin after dark: galleried inns, supper barges, card rooms, discreet private landings, and unmarked cargo changing hands under excellent manners. Wealth rests here after sunset. Neutrality operates like a card table and discretion is the governing architecture. This block is reconstructed from the live CANON dossier because the director brief omitted the audited slot; the audit and dossier are authoritative.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/tally-light.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/tally-light.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-90a0d458-d66d-4f62-bbc1-25ca6fd48e46.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `330cb1a108965b37c483094461484898b3b4c56831c1d655e7b54d82d5686bea`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A stone signal tower on a mid-river islet at dusk, lamp-code flashing upriver, keeper silhouetted at the light. Must hold: the count that has never been wrong; solitary, exact, incorruptible.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/gullwatch.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/gullwatch.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-e2a445e9-70f5-4e53-987a-9948c8b91e6f.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `995ff3a43220a6c08995e4df7d94c6b632697bc36b22af044ff1921fb4f883bc`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Bluff-top picket over the downriver reaches where river country hardens toward the war: spotting scopes, weathered emplacement — and the sky busy with gulls the keepers are *reading*. Must hold: birds as early warning; the war as distant weather on the horizon, never detailed.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/winchworks.png — THE LIFT FORTRESS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/winchworks.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `0f29f8e34dc4bc34726e6f0cf0b2dd55ac5a2f86d46b3ba6fd98e4163a8769e8`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The fortress grown around the great falls' lift machinery: windlass halls, chain galleries, counterweights the size of houses, a laden barge rising the cliff face in a cradle. Must hold: ancient machinery maintained around and never inside; Holdfast stonework wrapping older iron; total competence, zero inquiry.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/stairfoot.png — THE QUEUE TOWN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/stairfoot.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `f710c3d0ba13230f02dfd487e96cb0664a6e23899fe2a7bdcf2aea0dfb15e33c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The falls' base in permanent spray and thunder: barge queues, boarding houses, rope-lofts, taprooms — mountain folk and river folk in one wet loud street. Must hold: the whole leg funnels through this cheerful chokepoint; rainbowed mist over everything.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/chainsong.png — THE LISTENING TOWN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/chainsong.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `54820761b79e033c0341813642db7f293f6dc7cd7e232738d1e2a24079731bba`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A gorge town beneath the great lift chains, the spans crossing the sky overhead like staves of music; forge rows below, a keeper logging pitch. Wind visible in the chains. Must hold: the chains are weather, calendar, and alarm; the horn tower with no bell.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/hanging-market.png — THE VERTICAL MARKET

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/hanging-market.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `34e35e6876ef526ab0e93bf10296ee66a07fa096f77cf0d011d9f2e84447ea7a`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Market galleries bolted to the cliff face between lift stages — a dozen storeys of ladders, catwalks, basket-winches, and stacked lamplit shops. Goods rising in baskets. Must hold: a town a customer climbs through; prestige measured in altitude; engineering that started as scaffolding and never came down.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/thundershade.png — THE VILLAGE IN THE SPRAY-SHADOW

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/thundershade.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `188d3284db549e10ec927b3feff60c0bbdd985b7a1595cfb4870760618b650a8`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Deep green mist world under the falls: moss terraces on wet stone, figures signing to each other, and the noon rainbow — a full reliable arc off the spray. Must hold: total thunder implied by total quiet; everyone talks with hands; beauty first.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/deadhaul.png — OUTPOST · the leg's silence

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/deadhaul.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `b163c1e0d4873522dbcd4a5ae84cb2d24c3b05d187ab1b1db9b0dfc47daa21e2`
- QA: PASS — full frame, exact 564x941 center crop, closed loaded cars, road-facing watch, no falls-swifts, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The abandoned haul-incline: cars stopped mid-slope, loaded, weathered by years; the garrison's watch post in the old winch house at the foot, deliberately facing the road, not the incline. Must hold: the cars are NEVER shown open or unloaded; no visible cause; the garrison's careful incuriosity is the subject. Note: no falls-swifts in this sky.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/high-sill.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/high-sill.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `1f9fc0e6cd4d392fd023c6d7a03872777674ff0da7d518a07034727b3f46842c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The lip of the great falls: the last lock at the very edge, wind-bent keepers, the long calm water to Grand Lake beyond, the world falling away behind. Must hold: the top of the climb; the least glamorous absolute authority on the leg.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/anvil-watch.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/anvil-watch.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `5ed4a9b1c26ff7b0d0c09cc7452128b62c5ea4ec03b7e6a0e3d960c7420a817e`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A dry-stone watch post on an anvil-shaped crag over the gorge road, signal mirrors catching light, a drover column passing far below being counted. Must hold: it counts what walks, not what floats; patience as architecture.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/charnel-lock.png — THE LOCK-CASTLE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/charnel-lock.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-977fd43d-e051-4503-8a43-e3474c36d0a1.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `f7a79276b8d408fd89a339fc7cd04073a5a03fc01a63470868d747ed177b5d6e`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The fortified river-lock: gate machinery of unexplained vintage wrapped in generations of Family stonework, attendants in mourning dress working the toll wharf, a coffin-barge paying its respects. Must hold: courtesy as power; the record crypts implied, never shown; run like a funeral that never ends.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/wakewater.png — THE WAKE TOWN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/wakewater.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-5d08e66f-d0aa-4f1a-80c3-2469eb95d6f2.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `1ae6e3f724b7899efbab7b8b7ef7842ff54c1b9c39733655b4306ac823d0a175`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Interiors-and-riverfront town where wake-houses and auction rooms share premises: a viewing in the front room, an appraisal in the back, the same low light for both. Must hold: grief and commerce fused without cynicism; strict manners visible in posture.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/mourners-ferry.png — THE QUEUE OF THE DEAD

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/mourners-ferry.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-6401c746-9a35-41a2-baa4-103776a86631.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `417cde58605ee8efd3e455aab6f8e5917e062a18f1f9ae6adbe08d8faa470603`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Funeral barges moored in patient rows waiting passage of the Lock, professional mourners embarking, the ferry bell mid-swing. Must hold: the bell tolls once per passenger; the queue is sacred; black crepe against tannin water.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/redletter.png — THE SCRIVENER TOWN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/redletter.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-a399b547-cb83-4c02-884f-901ed9627f58.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `4eb8724465845b2b0509f404eb2d44da02e7a06a081b1b9dbac71ccc30c57e07`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Ink-works and contract houses; a signing under witness, the ink red-brown as the river it was drawn from; the deep archive's stacks behind iron grilles. Must hold: paper that outlives its signatories; red-leaf ink as the town's blood; all documents unreadable per the zero-text law.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/candlereach.png — THE LIT ROAD · the region's most beautiful dark

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/candlereach.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-67a20f40-6d8e-4263-8255-f1d1af95b95f.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `9ca2e80c4698285a300fab9badf5debcefd5555d78d0c2d0ddc1176a283d63db`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Night on the treed-in reach: a channel of floating shrine-buoys burning grave-candles, a passage barge gliding lit with its own candles, ward skiffs in the dark margins. Must hold: one candle per soul aboard; the count as security; a dark barge would be the wrong thing to paint.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/quiet-boom.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/quiet-boom.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-5eec7b74-6e4d-4ec9-b98f-6c475ce2eeff.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `18d5332eeb273c6ea63c50fc0ffb51816b52dac193ac0602021c215d144a97b4`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The great chain boom raised over the river between counterweight houses, its span implied massive; a small formal garrison; traffic passing beneath in freedom. Must hold: the weapon is the fact of the thing; raised for everyone — that is the message.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/bonefire-picket.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/bonefire-picket.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-558bcfab-c243-4ac7-87e0-05ccf976acfa.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `598753a05200df05fae315ca87c5672a18f15b0e8ce81b762a1dc8285b04d0ab`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The high bend where the leg meets wild Rift country: the beacon burning WHITE (bone-oil flame) over dark water, keepers feeding it from the trade's scrap. Must hold: the white flame reads for miles; the last fixed light before the graveyard country.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/standing-camp.png — THE CAMP THAT NEVER MOVES

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/standing-camp.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-33eea11f-41db-4d1e-8e87-0ebf7efe55c0.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `2834f48519f9ed86c5a44f0e39d17a6db872735e35e0143983415dd27d9abec0`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Rings of tents and awnings around a stone heart — permanent in everything but appearance: camel lines as walls, wells inside, the Forge-heart's glow at the center of the rings. Must hold: a fort disguised as impermanence; the wandering people's one fixed point; laid out as fields of fire for eyes that know.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/lastwater.png — THE DESERT'S FRONT DESK

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/lastwater.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-9c4f4ef9-f7b8-4d86-991d-ff0dcf1f9fc3.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `64ba8a2c6da4653e4634ceb4ab9a71c8484e89f8823e57ef94419c8ed4155a1f`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Watering wharves, caravan yards, shade markets; a crossing fitting out — water loaded by weight, the posted price list present but unreadable. Must hold: the organized, priced, survivable crossing; half river folk, half Compact; wholly practical.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/honest-well.png — THE VILLAGE OF THE TRUCE

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/honest-well.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-659f2e59-1a8c-4855-9a74-4e58cb071431.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `77dfc654fca14370625d4ac0d955541082d7e1c42ce9b6e2f4cef848808b3b73`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The wellhead and its watering rings at first light: two visibly rival parties watering their animals in turn, in silence, weapons slung. Must hold: feuds pause at the wellhead; the one absolute in the dry country; tension held, not spent.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/mirrorwater.png — THE DAWN FLASH

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/mirrorwater.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-edb17e79-4464-459d-8dc4-cc3937de0aba.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `706ca5bdb91b02eadb3ffe54508fd98afa5dbaed41db906dc66105b50634d092`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The still oxbow at the exact minute: a sheet of sun-flash on unbroken water, the village hushed at its margins, salt ibis standing motionless in the shallows, a caravan on the far ridge steering for the light. Must hold: stillness as law and as navigation; nothing touches the water.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/saltsong.png — THE SINGING PANS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/saltsong.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0fc949b-2228-4be8-8bf7-595ecec9ced0.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `743922c8a392c179a524e289691c1d7cd1dc0dabe2d27cd959fdf94a903d8809`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Terraced evaporation pans stepping to the river at dusk, salt crusts cracking, a keeper walking the terraces head-tilted, listening; stamped salt blocks loading below. Must hold: the pans are tuned; grading by ear; salt as the corridor's coin.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/dry-bell.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/dry-bell.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-2e86bf64-f771-479b-a436-18b451b09fa3.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `1d7aecf728f0ddecac8c8b6801e8f8daaa55a1e0bf513b6ef8abd285c26fb743`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The bell tower on the dune line at dusk, keeper at the rope, the strike rolling out over empty dunes; below, the log open on its stand. Must hold: one strike per missing day per caravan; the worst sound in the corridor is a rhythm; vast emptiness listening.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/vultures-patience.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/vultures-patience.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0748a4d-ffd2-421b-bba5-b2cc404ae2d6.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `69fa155d3c2bc67f83684fc8f30f2e4525ca582913f87ddba90ab90643db58a8`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.
- Recovery note: exact expanded execution wording was lost in the VS Code restart; this canonical normalized prompt is the honest final reconstruction from the dossier/director locks used for acceptance.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Dry-stone watch on the last ridge: old keepers glassing the deep desert, and far out over the interior a wheeling column of vultures — the desert's one honest report. Must hold: watch, wait, count what the sky does; disasters as weather, too far to help.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/regulator-station.png — THE PYLON FORTRESS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/regulator-station.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-bb1d3c82-1f51-4eaa-abe7-83d118cfd970.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `20a17031ab36c9b4eb42f5decee756bfc3b7d0a4974e4da373c751451784da46`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The fortress around the master pylon: instrument halls and calibration floors over visibly OLDER stone courses; Iron Saints guns on the walls; the river obedient below. Must hold: two buildings arguing — modern research wrapping prior works; the older stone shown, never explained.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/gaugetown.png — THE TOWN THAT READS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/gaugetown.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-6ccf613b-0a5f-4d26-ab79-b9baceeeaae3.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `55d69c979c1d97df0f138491d92c3f68c7e415d71896c7b537e9b6629a9670f7`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The corridor service town: pilot houses, instrument shops, and the taproom's dial wall — a bank of needles older than the room, locals reading it like weather. Must hold: every household keeps a gauge; belief in needles as civic religion; warmth against the corridor's strangeness.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/glasscalm.png — THE WHISPER CROSSING

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/glasscalm.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-2fa09f13-11cb-4f1d-83a0-6025dc47cf29.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `fb1ff4de5efc6825c73f2d5db5cb657fe8f9fe02cc7643dafce334ad111099d1`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The flattest water in the world taking the sky like a plate: a ferry mid-cross, every figure visibly quiet, oars feathered — and the reflection *exactly* faithful, which is somehow the unsettling part. Must hold: crews cross at a whisper; the calm is attention, not absence; wind moving trees on both banks and not the water.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/needles-eye.png — THE PINCH

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/needles-eye.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-2814a783-31e1-48e7-a940-e19927269d18.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `a1e367cc3d2457334261e8da849ed87f5c64e1de318af31d006998cf9a398762`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The narrowest pylon pair, a hull threading the gap with hand-spans to spare, the guild hall astride the water above, queued traffic waiting its turn. Must hold: every hull on the leg passes here; tattooed forearms on the pilots (unreadable ink); the town's own dial wall answering Gaugetown's.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/farflicker.png — THE LAST LIGHTS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/farflicker.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-565ac942-809b-4196-bb0c-4f98d4d8b26a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `54d99739db2839c1f6e521033fe3399426b004a7e1239649645771c8f130ed68`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The edge village at blue dusk, every lamp stuttering — street lamps, windows, lanterns — in patterns a viewer can *almost* read; children skipping rope to a kitchen lamp's rhythm; the iron-shuttered recording house apart. Must hold: cheerful, domestic, and wrong; the horror working correctly; patterns never decoded.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/breakline.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/breakline.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-73d171dd-2ee5-49d2-9e99-bde41087fa3a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `12c59b9e611ef18dd238f41762ff216e28fd3a0e95fbc20a9df835f66f3eaba6`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Where stabilization ends: the last hardware, sandbagged instrument huts, a short-rotation garrison — and past the line, abandoned pylon footings standing in country that has resumed the Wasteland's opinion. Must hold: the line has moved twice, both inward; the footings say what footings say; nobody says retreat.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/echo-fence.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/echo-fence.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `8884f5a6325b35dcd4d502b4814dbd1a8a2a31bb156214ece9ad8d98a7b457bf`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The listening fence: a line of resonant posts facing open Wasteland country, humming; a keeper walking the wire in earplugs; the shielded recording bunker half-buried behind. Must hold: it receives, never transmits; transcripts sealed; the custom about dreams is not paintable and should still somehow be present.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/last-mooring.png — OUTPOST

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/last-mooring.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-0804a5c3-f565-4793-a807-ed235e0b933b.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `81cb2b458913454b34a8fa458ee6b941791dc15ea20ccb4cbc277d0fff249057`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The hardened refuge basin during a weather hold: hulls chained to ancient bollards behind the storm wall while anomaly weather goes wrong outside — rain bending, light misbehaving beyond the wall's shelter. Must hold: the bollards have never let go; crews below decks; if an unfamiliar hull rides among them, nothing in the image confirms it.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/first-charter.png — THE FIRST GROUND · RADIANT

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/first-charter.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-17ca7398-8e55-4254-9e22-6667061399a0.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `94c368fb43fba34a5ffd5f1a5cd53266bc92ba93ae6165fda65f32f6a113657c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A stretch of good bank on the safe floodplain at hopeful morning: river frontage, wet meadow, one dry rise — utterly empty, visibly buildable, reeds holding it. Must hold: the first ground a player will ever own; promise as a landscape; a reedjack's eyes in the far margin for those who look.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/second-charter.png — THE ISLAND

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/second-charter.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-1eb39707-5d2f-4b34-98fd-4d0fe27aabb3.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `7a5db9e55b20c32fb8b6e755d4726d370b73d5297d88a79f45c697d66156814c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A confluence eyot within sight of Heartland's walls at soft dawn: flood meadow, herons, rotted old pilings hinting at wharf rights nobody has exercised in generations. The city watches from across the water. Must hold: escrowed, empty, priced by every merchant in the city; beautiful enough to explain why.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/third-charter.png — THE RUIN

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/third-charter.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-055f2e03-f17a-4c00-97e8-33ed0400aebb.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `0127ea59f6e3efdc10ab5dfe9cdcc0f76e4449e5048853748d5aa6aedb8aba37`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The old watch-fort on Riftgate's dark water: one wall worth keeping, a collapsed gatehouse, the flooded defensive ditch — and its ancient sluice-gear still standing. Rooks on the wall. Must hold: claimable, defensible, watched; the fort's name is nowhere because nobody remembers it.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/first-weir.png — THE DROWNED WORKS

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/first-weir.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-b72e9df0-7682-42b9-81b9-ceb7434ae98d.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `0eaf8e146c9ce4b129425fec19632115e8c87c0052cbd4b809915677709430f4`
- QA: PASS — full frame, exact 564x941 center crop, unseen true bottom, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Beneath the city: a torchlit undercroft landing where an ancient stair meets black standing water. Sluice-gate architecture vanishing down into flooded galleries; one ancient pump answering, water moving where nothing should move. Scale: cathedral engineering, builder unknown. Must hold: flooded past the first landing; the machinery works and is not understood; the true bottom is never shown — darkness continues past every light source.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### regions/the-outfall.png — THE FAR END · the region's one cold plate

- Live dossier: REGION · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/regions/the-outfall.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-7019e38b-d27c-407f-b9d4-a26ea146c1ae.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `e6e78ed380ba48c8f0ed22d34d83ecbd583d0511a22341dfb78a75dbf3241b8a`
- QA: PASS — full frame, exact 564x941 center crop, dormant, unlit Anchor, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality REGION wide cinematic game environment plate; 1672x941 RGB24 sRGB PNG.
Reference role: the applicable approved Riverlands leg anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Wild fen past the last levee, grey-green and vast, standing water and reeds — and among the dead overflow channels, an ancient structure that reads as *wrong architecture, right materials*: the Anchor, dormant. In a middle distance, a small survey camp — instruments, one trailer, no fence, no flag. Must hold: no settlement, no road; the Watch's levee line far behind; the Anchor unlit, no Breach, no activation; the camp quiet and deniable.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-waterworks.png — THE RULE PLATE

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-waterworks.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-9b41ee59-38e5-439f-8990-ef26f31238a9.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `6a6742ef0d889ac991c0ec61d4e01e07118dd0580df45ddb1735d8bdf1644517`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: One image that teaches the rule: ancient lock machinery — brass, stone, and counterweight — mid-operation under a human hand on a lever, water obeying at civic scale. Could be a gate-lock's interior: old beyond record, polished by use, understood by no one. Must hold: whoever holds the water holds the country; maintained around, never inside; no builder's mark anywhere (that's canon, not just the text law).
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-faith-lane.png — One street, five practices visible at once: a Forge-hall queue, a funeral

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-faith-lane.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-6424cf32-2f32-4d21-afe0-aefafd58f486.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `dbd68962168a8525db17cfb45ef17afae4c1cc84ea38defe225419a71d5562d1`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: barge, a crossroads token, a gifted-creature shrine, and a door quietly marked in old red — nobody in frame finding any of it remarkable.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-first-gift.png — A congregation gathered around a magical creature that chose to stay — the

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-first-gift.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-1691fcdf-ac79-4ced-85cb-aae0064ec521.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `d97df7e56c2de129e9175c2af2502cfefa56bd47631bef2a2b21cc2f807ca36f`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: gift moment as communion, hands open, nothing caged anywhere in frame.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-ossuary-rites.png — A working funeral: the dead dressed for labor, family signing the covenant

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-ossuary-rites.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-d0b4736f-29f2-4368-b187-c9023d74b318.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `e66a2c94e55716cb75a7e62906741d18365e52834b6594855db16341bcae6c56`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: ledger, dignity total. The horror is only how reasonable it looks.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-forgefaith.png — The parish at reclamation: a congregation in a Forge hall watching the

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-forgefaith.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-399485a3-e669-427a-8d02-bbb014066c7e.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `b2a69a40939fbc7570232b32fc04297a18c2a60a89de527b74fe12ec326f941c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: platform's light resolve into a person, some kneeling, a child unafraid.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-old-roads.png — A crossroads at dusk: a truce-token cairn, two rival parties watering apart in

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-old-roads.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-0aed4451-ec9f-428d-9efe-0a9f4309e69a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `a25f62a2f9af2a2d06cd4e8e8f599670ea710b0ecc2e1f83886f658426f96315`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: silence, a grave-candle lit on a passing barge — custom enforced by nobody and observed by everyone.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### systems/the-crimson-communion.png — A clean, well-lit office that is also an altar: the ledger open, the advance

- Live dossier: SYSTEM · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/systems/the-crimson-communion.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-1fa604c3-5b30-49ef-adcb-9652814f6992.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `6566083d4172e99a082468dab0834e4a1ef42a22bbd7ce1a2d52740bfde3544c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality SYSTEM wide diegetic rule/faith plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing system-plate convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: generous, the schedule of collection in small print nobody reads. No gore — banking is the horror.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/machines.png — THE SHELF PLATE

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/machines.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-3f2b1a7e-95d2-4b6c-98f7-effde7154e18.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `3dfb6934d2f6b2257f1e083629dd87b8f2fb1a3b48abab20de36d24fbc9c88c8`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: A foundry floor or depot line holding the family in one frame: a Palisade planted at the door, chaff crates stacked, a Jackknife folded at rest, a Millstone's tread filling the background wall. Working light, no battle.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/palisade-frame.png — The wall walking to work at dawn: a heavy quadruped mid-stride through a town

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/palisade-frame.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-8dd5a4a5-bc07-4a10-a436-14afe08192ce.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `a24601d631c681c483fd1de4db79d263a767f213167de68e8a47cdde6fb8eed8`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: street, anchor spikes stowed, children following it unafraid. Architecture on legs.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/chaff-wasp.png — The cloud, not the unit: a chaff screen filling half the sky over a convoy,

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/chaff-wasp.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-7122d7a7-8f55-4e37-821a-4e63d0b05afa.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `900ed49e1d0b089b0ca0b7bf179bcfa1c43006503066230dd3a2bfcdb8e88399`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: individual wasps only legible near the camera. The sky's small change, spent.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/jackknife.png — Mid-lunge at sprint, folded-and-snapping gait caught at full extension, low to

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/jackknife.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-1ccabade-094a-4987-888b-06cabc63f14a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `481b296c48b3d275d324c5f0646019e4b3b9e100023b3e2a801b06965dd5a826`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: broken ground. Speed with a job; no face at all.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/millstone.png — Arriving, not fighting: the siege platform on a graded road at dusk, escort

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/millstone.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-8cb7483e-bca5-4651-a053-fd4ac7f4597f.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `6dc763415f64677eb1bf7200ae9c431a15cf17f63699d60e032beb77d9635d96`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: walking at tread-height for scale, a distant fort's silhouette doing the math.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/collector-pattern.png — The walk: man-height bipedal frame in a decent coat, mid-stride on a long

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/collector-pattern.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `52dfd902fd0873ee1f709a9c62328e2f375ff9c6e3060c56f2e1daaa7181f2dc`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: empty levee road in rain, unhurried. Nothing else in frame threatens anything. It does not run. It has never needed to.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/bureau-stork.png — A speck in high blue that might be a bird — the frame composed from the ground,

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/bureau-stork.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-04c35086-ad02-45cd-b6cb-d257c7b75fe8.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `060b8c58b3f0fd9c3b9e3ce1bc26b80a193f31d573ee87003ba9ab6e7dc8f30e`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: two figures below rescheduling a conversation indoors without looking up.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/armistice-frame.png — Every army's grandfather: one frame, five paint layers, mismatched shoulder,

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/armistice-frame.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-0d752c7d-f5ec-407f-addf-a75e92bb33c8.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `b49bc89483aa091e82aca850915e6a2025f170c0206c091f5bbdfe3fcb12ca61`
- QA: PASS — full frame, exact 564x941 center crop, zero facial anthropomorphism, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE machine creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing non-anthropomorphic machine material/crop reference; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: leaning at a freight depot with human guards sharing shade against its leg. History as salvage.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/towback.png — The barge-hauler at work: a broad, deep-chested river ox leaning into the tow

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/towback.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-fc1f0377-4c9a-41b5-88a1-324199fbe0ba.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `f0cc8daf34c241f0cae7e6cd161911adbbce0c74d0bbacfee15469497caea04c`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: on a golden towpath, laden barge behind, bargeman walking at its ear mid- conversation. Patience as physique. Working animal dignity — never cute, never monstrous.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/tollgull.png — Heavy, clever grey gull on a toll-house rail, eye like an auditor; behind and

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/tollgull.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-bf188f65-fe63-4757-9328-61de9edc9674.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `e8bdaee82db0affa8525ee464ae492eed4d4c6e1210589babfff7bbb3c963535`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: below, the money river's traffic. Optionally a distant circling column of gulls where no boat should be. Menace of information, not of claw.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/falls-swift.png — Small dark blade of a bird shooting THROUGH the falls' standing water into the

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/falls-swift.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-0aa9da0a-b5cb-4eef-81d4-e4509a841ecf.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `e2c481dc099baf24e0d646f0bfabd3d46c49015f13cd22bb39dfea297f544a0e`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: spray-hollowed gallery behind — wings folded at the instant of penetration, backlit spray. Flickering flock riding the gorge thermals above.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/boneback-sturgeon.png — Huge armored sturgeon working the tannin-dark bottom gravel, decades of

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/boneback-sturgeon.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-2aa7e1b2-2131-4d92-92f1-debcb120022e.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `17f98acd65da47a87ddcab84ee4ee135afe8c32fabc040150a6eeed2bccf9420`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: swallowed history implied in its bulk; a fisher's skiff small on the surface above. Ancient indifference; the river's memory wearing armor.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/salt-ibis.png — Tall white wading birds pacing the salt terraces in a slow flock at dusk —

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/salt-ibis.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-0bf4e8e6-f60c-46e9-99b3-ad4d8155f582.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `c7e5659e46af1692abf4039c16d67039ada9492572cce0035b3eac9eb20ce661`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: and one section of pan conspicuously empty of birds. The white of truce ceremonies and the white of the pans, the same white.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/glasspike.png — The strike: a long pale near-transparent predator exploding vertically through

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/glasspike.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-702a9afc-d090-4c6c-9fbc-f9e0db4d3ddf.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `b96436cfb150e6d2a45f318761b559f8e16134b79d0beb2f6dd747f3ac064d29`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: mirror-flat water, caught at the apex, the flat water already healing around the breach. The held river's honest violence — over before the sound arrives.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### creatures/reedjack.png — Reed-striped pack ambusher at a fence line at dusk: one animal testing the

- Live dossier: CREATURE · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/creatures/reedjack.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-4ac0d73a-3002-490b-a529-a5cb11df0e09.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `dfdca763739c3dbf729a73002b87221e94deefe098c87e37efc42fe0ffe5e24a`
- QA: PASS — full frame, exact 564x941 center crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality CREATURE natural creature-dossier plate; 1672x941 RGB24 sRGB PNG.
Reference role: the standing shrieker-bat habitat/action/crop convention plus the applicable Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: wire with a paw, two more as eyes in the reeds behind. Exactly clever enough — that is the unsettling part. Farm lamplight distant.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/alder-wade.png — COMMANDER ALDER WADE

- Live dossier: CHARACTER · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/alder-wade.png`
- Retained generated sources: no byte-identical retained generator file; mechanical normalization/re-encoding or restart recovery is documented in the execution archive, and final production bytes remain manifest-verified
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `3b7401414913ec6053730d042a1bafbef07afd1640e46e833909d757fce7b0f3`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.
- Normalization note: the accepted pin-correction render exported at 1672x940; it was mechanically normalized by a one-pixel Lanczos vertical resize to 1672x941, preserving RGB24/no-alpha output. The superseded source and final hash are both documented in QA history.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Late sixties, big frame gone spare, river-weathered hands; plain coat, the chair's small brass pin its only ornament, boots resoled not replaced. Looks like a retired barge master on purpose. Setting: the wharves at his daily walk, morning light. Expression: tired precision with the joke kept just behind it. ALIVE — no statue imagery in frame.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/the-judge-of-heartland.png — VERITY LAM

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/the-judge-of-heartland.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-bc29d104-6431-4612-81c2-f80e50438a14.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `4fcc190a35894a962973dc32375faf36c3ac55c6ec19ae4c79120debe47b5f1b`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Fifties, she/her — small, immaculate, unhurried; plain-cut robes, one pen; the stillness of someone for whom being unreadable is a public service. Striking, composed face (standing direction applies). Setting: the courthouse bench or the escrow vault's door. The least dramatic person in the room, painted so that IS the drama.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/the-heartland-watch-captain.png — MAREN ODU

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/the-heartland-watch-captain.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-07463799-aeda-4fab-8ca7-3c05e6505915.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `bf33e19e760ce1740a81768e662e08443df31b20476f54e10db38be81f46eabf`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Early forties, she/her — tall, parade-straight, West-African looks (lock); armor at working shine, never ceremony; carries the muster ledger herself. Striking (standing direction applies). Setting: the muster hall or the wall at drill. Expression: clipped competence; the fuse read and carried.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/cassia-verne.png — FACTOR CASSIA VERNE

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/cassia-verne.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-227a756e-eaaf-428d-9110-723569a84b3a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `8d27332ddcfb788af6f2f57100e7005148a68f0f0bf9839a99a68daf128a4456`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Late thirties, she/her — polished and deliberate, tailored river-coat in Aegis grey (no logo), striking; composure that reorganizes rooms. Setting: Clearinghouse's assay floor or a Velvet Reach supper table. Warm, exact, and reading you back.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Arcadia coin-warm: deep freight water, brass, lamplight and wealth; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/ottar-kolm.png — BRAKEMASTER OTTAR KOLM

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/ottar-kolm.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-64a8090d-85b2-460d-bac7-befc52de9616.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `9dc99f499842f06760e4ec5a5a3020edab72c3c520835e61273c865c813e7e9b`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Fifties, he/him — built like the machinery: broad, still, chain-scarred hands; Holdfast wool, brakeman's harness worn smooth; northern-pale under permanent gorge shadow. Setting: beside the great brake lever, hand resting on it. He is not posing; the lever is simply where his hand lives.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Cliffgate vertical iron: wet stone, chain-grey, spray-white and gorge shadow; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/cerise-mora.png — WIDOW CERISE MORA

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/cerise-mora.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-32df2005-b911-48fd-b556-e63866920072.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `92a2531d0b83a47282d97238a9a3efd214b0ac41ee191560ef5e8bf8d1613dba`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Sixties worn like fifty, she/her — black crepe as uniform, silver-white hair dressed high, rings on both hands; beauty run to authority (standing direction applies). Setting: a Charnel Lock viewing room among appraised estates, candle-warm. Courtesy that has buried harder people than her enemies.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riftgate tannin dark: red-brown water, black crepe and candle-warm points; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/yusra-of-the-wells.png — YUSRA OF THE WELLS

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/yusra-of-the-wells.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-fbb02959-cbf2-4c28-8a2c-dc8b044d1dab.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `cce960025df3a90beeb8f7c8719e52c4cb554684c1d3a8ab50b7746faf72a7cd`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Seventies, she/her — small, sun-cured, desert-dark (lock); indigo keeper-cloth, well-keys worn as jewelry; formidable stillness. Setting: the Standing Camp's wellhead at evening, the Forge-heart's glow behind the rings. Ages like the desert — on her own terms.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Sandgate oasis seam: hard living green against bone and ochre; no violet or cyan.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### characters/casmir-rew.png — DIRECTOR CASMIR REW

- Live dossier: CHARACTER · PROPOSED; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/characters/casmir-rew.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-e54b0e86-a34c-40fb-920b-27d299d7625a.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `5b91ee46b9f31063492b3fe0c6b3d7af4ab20aeaf2830273753e2eb65a2177be`
- QA: PASS — full frame, exact 564x941 center crop, 1122x941 trainer/dossier crop, subject/canon locks, palette and zero-text inspection.

```text
Use case: photorealistic-natural
Asset type: final shipping-quality CHARACTER trainer-convention environmental portrait; 1672x941 RGB24 sRGB PNG.
Reference role: the delivered trainer framing/crop convention and an environment-only Riverlands anchor; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: Late forties, he/him — Institute-immaculate against corridor weather: storm coat over academic grey, silver temples, the listener's head-tilt that photographs as sincerity. Setting: Regulator Station's instrument hall, the held river flat in the window. He is answering a different question than the one you asked.
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Stormgate held calm: mirror water, storm-blue horizon and worn pylon hardware; cyan only as tiny contained hardware light; no violet.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

### threads/the-fuse-at-heartland.png — THE FUSE

- Live dossier: THREAD · CANON; art delivery does not alter status.
- Final path: `apps/web/private/codex-art/threads/the-fuse-at-heartland.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-8a52d5af-f7f0-4b0f-b150-50d98bbc6430.png`
- Output: 1672x941 PNG · sRGB · RGB24 · 8-bit `uchar` · no alpha
- SHA-256: `bbd379ad862d8a40c65631a0a650e0df3e70bc177cbe6141df9289d64c1ebe0d`
- QA: PASS — full frame, exact 564x941 center crop, standing shrouded statue, Wade absent/alive, no crowd or ceremony, subject/canon locks, palette and zero-text inspection.

```text
Use case: stylized-concept
Asset type: final shipping-quality THREAD wide cinematic narrative still; 1672x941 RGB24 sRGB PNG.
Reference role: the Heartland flagship and standing thread composition convention; style, material, palette, and crop only—never copy an existing character identity or exact scene.
Primary request: The design's whole tension in one image WITHOUT spending it: the shrouded statue on the courthouse square, crane sling in place, five work crews' tools around its base — and the city's five wharf districts visible beyond, each pretending not to watch the others. Dawn. Nothing has happened yet. Everything is about to. HARD LOCK: the statue stays shrouded and standing; Wade does not appear; no crowd, no ceremony — the quiet before. ---
Style/medium: mature AAA grounded cinematic photorealism; real lens logic, real weather, real wear, physically credible anatomy/engineering, subtle film grain; private rugged premium clubhouse production.
Composition/framing: wide 16:9 master with the defining subject/action complete inside the exact central 564x941 directory crop; for characters also preserve face, hands, defining object and torso in the centered 1122x941 dossier crop; no essential information in the bottom 10 percent.
Color palette: Riverlands white-gold dawn and living river green, with wet grey, charcoal, bone and rust in support; no violet; no cyan except tiny contained Stormgate hardware.
Zero-text law: every page, sign, dial, tattoo, hull, crate, garment, wall and device surface is blank or wholly nonlinguistic; no readable text, letters, numbers, pseudo-writing, labels, banners, insignia, logos, UI, borders, captions or watermarks.
Canon constraints: the live dossier overrides this block. Wade remains alive; First Weir bottom remains unseen; Outfall Anchor remains dormant; Deadhaul cars remain closed and loaded with no falls-swifts; machines never emote or wear faces; the Collector never hurries; the Old Roads bargain is never shown; no explicit sexual act, no harm-to-children imagery, and no real-world hate iconography.
```

## Run-wide QA evidence

- Exact allowlist and mechanical QA script: `tmp/riverlands-ledger/qa-riverlands.mjs`
- Machine-readable manifest: `tmp/riverlands-ledger/qa/manifest.json`
- Generated-source hash map: `tmp/riverlands-ledger/qa/source-map.json`
- Full-frame sheets: `tmp/riverlands-ledger/qa/full-*.png`
- Exact directory center-crop sheets: `tmp/riverlands-ledger/qa/center-564-*.png`
- Character dossier crop sheet: `tmp/riverlands-ledger/qa/center-1122-01.png`
- Final audit transcript: `tmp/riverlands-ledger/qa/final-audit.txt`

Final acceptance: **PASS — 80/80 delivered; 0 missing.**

## Appendix — exact expanded execution prompt archives

These batch-local records preserve the exact built-in image-generation prompts and accepted/superseded source paths available after the restart. The normalized blocks above remain the canonical per-asset ledger.

### anchors.md

# Riverlands palette anchors — generation record

All six assets were generated in built-in image-generation mode from the delivered local reference `apps/web/private/codex-art/regions/riverlands.png`, then copied without pixel transformation to the named production path. No refusal or superseded attempt occurred.

## regions/arcadia-gate.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-1e3bd7b3-a019-43e5-b058-24c8164b4d69.png`
- Final path: `apps/web/private/codex-art/regions/arcadia-gate.png`

```text
Use case: stylized-concept
Asset type: Riverlands codex REGION plate, cinematic game environment key art
Primary request: Arcadia Gate, the money leg: the deep freight artery at golden morning, with laden cargo barges moving in convoy, towpaths alive with broad towback teams, the water crowded and prosperous, and the massive ancient gate-lock built into Heartland's wall behind. The busiest water in the world; wealth expressed as light; the war nowhere in sight.
Input images: Image 1 is the delivered Riverlands flagship and the production reference for grounded realism, lens logic, material wear, river geography, luminous dawn, and subtle film grain; match its production.
Style/medium: mature AAA grounded cinematic photorealism, real large-format cinema lens, realistic atmospheric perspective, lived-in near-future river civilization, no fantasy gloss.
Composition/framing: wide 16:9 establishing shot; convoy and ancient gate-lock remain unmistakable inside the central 34% vertical crop; useful detail extends across the full frame.
Lighting/mood: glorious white-gold dawn at full radiant weight, unashamed hope and abundance.
Color palette: Arcadia coin-warm identity—deep freight water, brass, warm lamplight, sunlit living river green, wet grey and muted rust in support. Absolutely no violet. No cyan.
Materials/textures: weathered timber hulls, worn towpaths, old stone, brass lock machinery, damp rope, practical work clothing.
Constraints: zero readable text of any kind; every sign, hull, crate, garment and surface blank; no letters, numbers, labels, banners, insignia, logos, UI, borders, captions, or watermark. No overt magic. Keep key subject center-safe. No sexual content. No harm. Preserve the Riverlands flagship's visual continuity.
```

## regions/cliffgate.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-f2cb9c1d-caae-4800-8424-697c1a570fc5.png`
- Final path: `apps/web/private/codex-art/regions/cliffgate.png`

```text
Use case: stylized-concept
Asset type: Riverlands codex REGION plate, cinematic game environment key art
Primary request: Cliffgate, the vertical river leg: a monumental gorge ascending through stacked locks and lift stages toward a great waterfall; full cargo barges hang mid-air in timber cradles on colossal iron chains; spray, rock, and shafts of hard daylight. It is the only door between watershed and high country. Vertical scale makes entire hulls look like toys.
Input images: Image 1 is the delivered Riverlands flagship and production reference for grounded cinematic realism, lens logic, geographic scale, wear, and subtle film grain.
Style/medium: mature AAA grounded cinematic photorealism; real cinema lens; plausible ancient civic engineering maintained for centuries; no fantasy gloss.
Composition/framing: wide 16:9 establishing shot from a gorge overlook; one suspended barge, the chain machinery, and climbing water remain unmistakable inside the central 34% vertical crop.
Lighting/mood: wet iron grandeur; dramatic natural daylight shafting through spray, radiant where earned but with deep gorge shadow.
Color palette: Cliffgate vertical iron—wet dark stone, chain-grey, spray-white, moss green, rust, cool gorge shadow. Absolutely no violet. No cyan.
Materials/textures: rain-dark rock, oxidized iron, sodden timber, taut chain, real waterfall mist.
Constraints: zero readable text; all surfaces blank; no letters, numbers, labels, signs, banners, insignia, logos, UI, border, caption, watermark. No overt magic. Center-safe subject. No harm. Match the standing Riverlands production.
```

## regions/riftgate.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-26c8863a-0ba2-48bc-9a26-522c5e521ced.png`
- Final path: `apps/web/private/codex-art/regions/riftgate.png`

```text
Use case: stylized-concept
Asset type: Riverlands codex REGION plate, cinematic game environment key art
Primary request: Riftgate, the relic river leg: tannin-dark red-brown water running northwest into older forest country; funeral barges and sealed relic freight moving beneath red-brown trees; candle-warm points reflected in the dark water. The past comes downstream as cargo. Polite, unhurried menace, dignified and fully committed.
Input images: Image 1 is the delivered Riverlands flagship and production reference for grounded cinematic realism, real landscape logic, material wear, and subtle film grain.
Style/medium: mature R-rated AAA grounded cinematic photorealism, like a prestige war-haunting film still; realistic river transport and weather; no fantasy gloss.
Composition/framing: wide 16:9 low-oblique river establishing shot; the central funeral barge, tannin water, and ancient tree corridor remain strong inside the central 34% vertical crop.
Lighting/mood: late-day light going ancient upstream; dark full-weight atmosphere with small candle warmth, respectful rather than gothic theatricality.
Color palette: Riftgate tannin dark—red-brown water, black crepe, wet charcoal, old bark, muted rust, sparse candle-warm points. Absolutely no violet. No cyan.
Materials/textures: wet timber, sealed cargo, black mourning cloth, rain-dark stone, tannin-stained water.
Constraints: zero readable text; all documents, hulls, cargo and surfaces blank; no letters, numbers, labels, signs, banners, insignia, logos, UI, border, caption, watermark. No exposed corpse, no open coffins, no explicit gore. No overt magic. Center-safe subject. Match the Riverlands production.
```

## regions/sandgate.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-f03502d8-852f-43da-9bc0-5104b9b9f187.png`
- Final path: `apps/web/private/codex-art/regions/sandgate.png`

```text
Use case: stylized-concept
Asset type: Riverlands codex REGION plate, cinematic game environment key art
Primary request: Sandgate, the oasis corridor and last green thing before the desert: a vivid ribbon of river, palms, irrigated fields and watered ground reaching into bone-and-ochre dry country, with a practical caravan arriving to meet the water. Show the seam between two worlds, green as wealth, the desert visibly charging at the edges.
Input images: Image 1 is the delivered Riverlands flagship and production reference for grounded cinematic realism, real watershed geography, luminous dawn, material wear, and subtle film grain.
Style/medium: mature AAA grounded cinematic photorealism; real cinema lens; plausible working near-future river corridor; no fantasy gloss.
Composition/framing: wide 16:9 elevated establishing shot; oasis river seam and arriving caravan remain unmistakable inside the central 34% vertical crop.
Lighting/mood: glorious white-gold dawn at full radiant weight, hard hopeful beauty, heat beginning to rise.
Color palette: Sandgate oasis seam—saturated living green against bone gravel, ochre sand, muted earth and rust, white-gold light. Absolutely no violet. No cyan.
Materials/textures: dusty canvas, worn leather tack, dry stone, palm bark, wet irrigated soil, real water.
Constraints: zero readable text; all surfaces blank; no letters, numbers, labels, price lists, signs, banners, insignia, logos, UI, border, caption, watermark. No overt magic. Center-safe subject. No harm. Match the Riverlands production.
```

## regions/stormgate.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-fc33ad0b-7835-41e3-8ef1-c40b24b80f4c.png`
- Final path: `apps/web/private/codex-art/regions/stormgate.png`

```text
Use case: stylized-concept
Asset type: Riverlands codex REGION plate, cinematic game environment key art
Primary request: Stormgate, the held river: a broad river running unnaturally steady through country going wrong, water perfectly flat as glass beneath storm-blue skies; a corridor of worn industrial pylons marches northeast along the banks while the Wasteland's violent weather remains held at the distant horizon. Engineered calm is the subject—the quietest river in the world, not meant as a compliment.
Input images: Image 1 is the delivered Riverlands flagship and production reference for grounded cinematic realism, geographic scale, lens logic, wear, and subtle film grain.
Style/medium: mature AAA grounded cinematic photorealism, restrained near-future military-industrial infrastructure, real weather and optics, no fantasy gloss.
Composition/framing: wide 16:9 low elevated establishing shot; mirror-still water, central pylon pair, and contained horizon anomaly remain readable inside the central 34% vertical crop.
Lighting/mood: held calm under storm-blue daylight, beautiful and subtly alarming, no gloom grading.
Color palette: Stormgate held calm—mirror water, storm blue horizon, wet grey, charcoal, pale concrete, muted rust. Only tiny contained cyan indicator lights on pylon hardware. Absolutely no violet.
Materials/textures: weathered steel pylons, patched concrete, wet reeds, glasslike water, distant rain curtains.
Constraints: zero readable text; all hardware and surfaces blank; no letters, numbers, labels, signs, banners, insignia, logos, UI, border, caption, watermark. No glowing magic, no activation event, no open portal. Center-safe subject. No harm. Match the Riverlands production.
```

## regions/heartland.png

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-13b5aa21-72b1-4d0c-a8a1-5d316f80c1c6.png`
- Final path: `apps/web/private/codex-art/regions/heartland.png`

```text
Use case: stylized-concept
Asset type: flagship Riverlands codex REGION city plate, premium cinematic game environment key art
Primary request: Heartland at triumphant dawn: five great rivers braid into one water around a dry, inhabited, walled city rising from open floodplain. High oblique view must clearly show exactly five monumental ancient lock-gates built into the city wall, each gate releasing a separate river arm toward a different horizon. Inside the wall are five distinct working wharf districts with different material character, but no banners and no garrison—every faction has a wharf and no faction owns the city. The city has no right to be dry, yet it is. This is what the war is for.
Input images: Image 1 is the delivered Riverlands flagship and absolute production reference for the same geography, magnificent white-gold dawn, real lens logic, living river green, weathered materials, premium photorealism, and subtle film grain.
Style/medium: mature AAA grounded cinematic photorealism at flagship quality, a prestige feature-film establishing frame, plausible ancient civic lock engineering in a near-future lived city, no fantasy gloss.
Composition/framing: wide 16:9 high-oblique master shot. The dry central city, braided nexus, and all five wall lock-gates must be countable and unmistakable; concentrate the city and at least three gates inside the central 34% vertical crop while maintaining the five-arm geography across the wide frame.
Lighting/mood: white-gold dawn breaks the overcast fully open, radiant at maximum luminous weight, gorgeous, hopeful, sensual as landscape, the visual thesis of a country worth fighting for.
Color palette: luminous white-gold, living river green, sunlit wet stone, brass, weathered timber, wet grey and restrained rust. Absolutely no violet. No cyan.
Materials/textures: old flood-stained wall stone, giant worn lock gates, brass and iron machinery, busy timber wharves, real moving water, morning haze.
Constraints: exactly five great lock-gates and five outward river arms; zero readable text; all signs, hulls, walls and surfaces blank; no letters, numbers, labels, banners, faction marks, insignia, logos, UI, border, caption, watermark. No statue, funeral, assassination, battle, overt magic, or public game infrastructure. Commander Alder Wade is alive but not visible. Center-crop must be exceptional. Match the Riverlands flagship production.
```

### arcadia.md

# Riverlands ledger fragment — Arcadia Gate children

Generated and installed 2026-09-01 using the built-in ImageGen path, one initial generation call per asset plus one QA-driven fresh replacement call for Clearinghouse. The installed finals are byte-for-byte copies of the accepted generated sources. Image 1 for every call was the existing live `apps/web/private/codex-art/regions/arcadia-gate.png` plate, used only as a palette, material, and production-quality reference.

## Manifest and QA summary

| Relative path | Live dossier | Dimensions / pixel format | SHA-256 |
|---|---|---|---|
| `regions/clearinghouse.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `7c5cfd92d2cf76ec3786476adbea6baa7eca901a7f51640501f6945ec8391b6f` |
| `regions/halfload.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `6e8f3ed62543fad794f61a821b8e6c083a200da2107f6eab00758984339c2edf` |
| `regions/widows-toll.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `2ea012d5dad22c5531a04519d12af17246f24cf7191412305df0392cfb76daa4` |
| `regions/brasslight.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `669307c02f7c95b7c4b06ddf5c5f61ffb80af031734b00cb59ca1f22229e42c1` |
| `regions/sunken-row.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `a17912522ce5280f7a3af0585c9e424316e6b4f3bf1eef7de1bf268e18b779e5` |
| `regions/velvet-reach.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `f98170fc53612655aef082c1475a4bad8711141bdf0f0db2bc8c6d3c24e9f323` |
| `regions/tally-light.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `330cb1a108965b37c483094461484898b3b4c56831c1d655e7b54d82d5686bea` |
| `regions/gullwatch.png` | REGION CANON v1 | PASS — 1672x941 PNG, sRGB RGB24, 8-bit, no alpha | `995ff3a43220a6c08995e4df7d94c6b632697bc36b22af044ff1921fb4f883bc` |

All eight selected finals were inspected at full 1672x941 resolution and as the exact center crop x=554, y=0, width=564, height=941. All eight pass the strict zero-text and blank-surface law: no decipherable word, letter, number, pseudo-writing, grid, logo, insignia, UI, border, caption, or watermark was observed in the accepted finals. Arcadia's coin-warm brass/deep-water identity is continuous across the set; no Blackbloom violet or cyan appears. Clearinghouse's first attempt was superseded after native-resolution QA found pseudo-writing/grid-like marks on assay papers; the accepted fresh replacement contains no paper or document-like surface anywhere.

## `regions/clearinghouse.png`

- Dossier read immediately before generation: live `clearinghouse`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: fresh replacement image with one palette/material/style reference after the first generation failed strict zero-text surface QA.
- Superseded first source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-38797e2d-5e84-4ffe-89d7-264af9d15aa7.png` (1672x941 RGB24; SHA-256 `fdf49d1d004c88af908c027ce4c91c767ee884c62329a3c2845225d62d6b6382`; rejected because foreground assay papers carried dense pseudo-writing/grid-like marks).
- Final accepted generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-ad409c38-5b15-425c-a5fc-bd0100e8aecb.png`.
- Final path: `apps/web/private/codex-art/regions/clearinghouse.png`.
- QA: **PASS.** Full frame clearly reads as a customs fortress through a central weighing gantry, suspended sealed cargo, loaded and queued barges, bonded defensive architecture, physical inspection flow, hand signals, and an unmarked disciplined garrison. No paper, form, ledger, clipboard, writing surface, readable or pseudo-readable glyph, logo, sign, UI, or watermark appears anywhere. The exact center crop retains the complete central barge, suspended cargo, gantry, queue, hand-signaling controller, and river approach. Coin-warm daylight, Aegis-grey material restraint, deep freight water, and procedure-backed force pass.

### Superseded first generation prompt (strict zero-text surface QA failure)

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 site "Clearinghouse"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Clearinghouse is Aegis's headquarters on Arcadia Gate and the point every southbound cargo must clear: a customs house built like a fortress, or a fortress that files like a customs house. Shoot from low over the deep freight river toward the fortified customs complex as a laden barge passes beneath one central weighing gantry. Heavy cranes suspend sealed, completely blank cargo above the wharf; bonded warehouses, physical assay benches, queue rails, and thick defensive stonework make paperwork feel like fortification. Clerks and assayers work beside an unmarked garrison whose disciplined posture visibly gives priority to the manifest and cargo process rather than ceremony. A secure side bay may carry one small contained white-gold industrial Soul Forge light, subordinate to customs work. Every southbound hull is queued to be weighed, sealed, and taxed; the records are more valuable than the cargo, but no record is readable.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, physically plausible customs machinery and fortification, real 32mm lens, real water, worn stone, scarred steel, oxidized brass, hard-used timber, damp rope, subtle film grain. Near-future military-industrial Riverlands, never steampunk and never fantasy castle ornament.

Composition/framing: low river-level wide establishing shot. Put the weighing gantry, one complete central barge, suspended blank cargo, active assay station, clerks, and visible garrison posture inside the central approximately 564-pixel source window (x about 554-1117) so the narrow directory crop tells the whole customs-fort story. Side fields may hold queued barges and warehouse depth. One continuous scene, no split panel.

Lighting/mood and palette: open coin-warm morning, deep freight water, brass glints, lamplight, Aegis grey cloth and stone with absolutely no logo, living river green and restrained wet charcoal in support. Wealth expressed as ordered work. Bright, readable, imposing, not gloomy. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, labels, manifests, book lines, stamps, seals, signs, plaques, placards, stencils, banners, flags, insignia, logos, gauges, screens, UI, captions, borders, or watermarks. All paper, boards, cargo faces, uniforms, badges, dials, and markings are completely blank and non-glyphic.

Avoid: copied Arcadia Gate composition, named characters, hero pose, battle, firing weapons, fantasy magic, glowing runes, neon, cyberpunk, steampunk filigree, modern Earth branding, readable documents, crowds blocking the central process, dusk, night, ruin, abandonment, or a decorative palace.
```

### Final accepted replacement generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 site "Clearinghouse"; fresh replacement generation for a zero-text QA failure; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Critical replacement instruction: SHOW NO PAPER, FORMS, BOOKS, LEDGERS, MANIFESTS, CLIPBOARDS, SCROLLS, MAPS, CHARTS, CARDS, LOOSE SHEETS, WRITING DESKS, NOTICE BOARDS, OR DOCUMENT-LIKE RECTANGLES ANYWHERE IN THE IMAGE. Do not create blank paperwork either. Bureaucracy must be conveyed entirely through physical queuing, weighing, sealing hardware, assay machinery, and disciplined staff movement.

Dossier scripture and primary request: Clearinghouse is Aegis's headquarters on Arcadia Gate and the point every southbound cargo must clear: a customs house built like a fortress, or a fortress that files like a customs house. Shoot from low over the deep freight river toward a hard-used fortified customs complex. One laden barge passes directly beneath a massive central weighing gantry while a heavy crane holds one sealed, completely unmarked cargo bundle over the wharf. Physical assay work happens through rugged unlabeled balance scales, sample crucibles, calipers, sealed sample trays, and mechanical inspection tools only—NO paper or writing surfaces. Thick queue rails hold several southbound hulls in exact order. Clerks and assayers use hand signals and physical seals beside an unmarked garrison whose disciplined posture gives priority to the cargo process. Bonded warehouses and defensive stonework make procedure feel like fortification. A secure side bay may carry one small contained white-gold industrial Soul Forge light, subordinate to customs work. The records are valuable in canon but are kept entirely off camera.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, physically plausible customs machinery and fortification, real 32mm lens, real water, worn stone, scarred steel, oxidized brass, hard-used timber, damp rope, subtle film grain. Near-future military-industrial Riverlands, never steampunk and never fantasy castle ornament.

Composition/framing: low river-level wide establishing shot. Put the complete central barge, weighing gantry, suspended unmarked cargo, physical assay tools, hand-signaling workers, queue rails, and visible garrison posture inside the central approximately 564-pixel source window (x about 554-1117) so the narrow directory crop tells the whole customs-fort story. Side fields may hold queued barges and warehouse depth. No tables covered in small rectangles. One continuous scene, no split panel.

Lighting/mood and palette: open coin-warm morning, deep freight water, brass glints, restrained lamplight, Aegis grey cloth and stone with absolutely no logo, living river green and wet charcoal in support. Wealth expressed as ordered physical work. Bright, readable, imposing, not gloomy. No Blackbloom violet anywhere and no cyan anywhere.

Absolute zero-text law: no readable or pseudo-readable text, letters, numbers, glyphs, lines of writing, grids, table cells, labels, stamps, seals with designs, signs, plaques, placards, stencils, banners, flags, insignia, logos, gauge markings, screens, UI, captions, borders, or watermarks. No paper or document-like surfaces at all. Crates, cargo, uniforms, badges, tools, dials, buildings, boats, and equipment must be completely plain, blank, unmarked, and non-glyphic.

Avoid: any paper, document, form, ledger, manifest, clipboard, open book, chart, map, card, writing desk, notice board, rectangular sheets, pseudo-writing, copied Arcadia Gate composition, named characters, hero pose, battle, firing weapons, fantasy magic, glowing runes, neon, cyberpunk, steampunk filigree, modern Earth branding, crowds blocking the process, dusk, night, ruin, abandonment, or a decorative palace.
```

## `regions/halfload.png`

- Dossier read immediately before generation: live `halfload`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-f80929c3-3bc6-4412-90b9-af5c5a34b40e.png`.
- Final path: `apps/web/private/codex-art/regions/halfload.png`.
- QA: Full frame shows a deep barge, multiple small lighters, transfer wharves, cranes, crews, and Halfload's busy settlement. The exact crop emphatically preserves the suspended blank bundle mid-air between the deep hull and receiving lighter, complete hook/cables and working crew. No readable text or marks. Coin-warm daylight and physically legible transfer pass.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 town "Halfload"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Halfload exists at a long shallow reach where deep-draft barges must lighten to pass. Shoot the whole town living on the transfer: one deep laden barge beside swarms of shallow lighters while cranes and stevedore teams move cargo from the deep hull into small boats, with the SIGNATURE MOMENT of a large sealed unmarked cargo bundle suspended in mid-air exactly between hulls. Tally sheds and working wharves have grown around the transfer; clerks, lighter families, cranemen, and stevedores coordinate a busy operation where everything passes through everyone's hands. The mood is prosperous, friendly, porous, and faintly opportunistic, never criminal caricature. Aegis audits constantly, but no company mark appears.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, physically plausible cargo handling and vessel displacement, real 30mm lens, real shallow river water, worn timber, scarred steel, oxidized brass, wet rope, sun-warmed canvas, believable labor and wear, subtle film grain. Near-future Riverlands worksite, never steampunk.

Composition/framing: medium-high wharf-side wide shot looking diagonally across the transfer. Keep the suspended blank cargo, both its originating deep barge and receiving shallow lighter, complete crane hook and cables, and the primary working crew inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must still read unmistakably as cargo in mid-air between two different hull sizes. Side fields carry lighter swarms, town wharves, and tally sheds. One continuous scene, no split panel.

Lighting/mood and palette: bright coin-warm late morning, open white-gold sun on moving water, deep freight green, brass, warm timber, muted earth, wet grey and restrained charcoal. Wealth as motion and many capable hands. Radiant and readable, not gloomy. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, labels, manifests, tally marks, book lines, stamps, seals, signs, placards, stencils, banners, flags, insignia, logos, gauges, screens, UI, captions, borders, or watermarks. All paper, boards, crates, cargo faces, uniforms, badges, and markings are completely blank and non-glyphic.

Avoid: copied Arcadia Gate composition, named characters, hero pose, theft spectacle, fighting, accident, dropped cargo, crowded visual chaos that hides the transfer, fantasy magic, neon, cyberpunk, steampunk ornament, modern Earth branding, readable documents, ruin, abandonment, dusk, or night.
```

## `regions/widows-toll.png`

- Dossier read immediately before generation: live `widows-toll`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b38330a0-5a75-413a-9147-06d92e15b66e.png`.
- Final path: `apps/web/private/codex-art/regions/widows-toll.png`.
- QA: Full frame depicts the great stone bridge, a long dignified line of widows holding blank rolls, and freight traffic stopped above and below. The exact crop holds the central widows, completely blank rolls, full center arch, and visibly waiting barge crews. No readable text or names. White-gold morning through the arch keeps the Accounting humane and luminous rather than gloomy.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 town "Widow's Toll"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Widow's Toll holds the great stone road bridge over Arcadia Gate. Depict the annual Accounting, the one thing the money river stops for: a dignified group of adult river war widows gathered on the central span, reading the river's dead aloud from long completely blank rolls while all bridge traffic waits respectfully. Below, working barges have deliberately paused beneath and before the arches; crews stand quietly on deck and time their passage to witness the ceremony. Toll houses and the widows' hall frame the bridge. The ancient deed splits each crossing coin between bridge upkeep and the widows' fund, but depict this through the cared-for bridge and gathered widows, never text or currency close-ups. Dignity and civic memory, not funeral gloom.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 40mm lens, physically credible old stone engineering, worn timber, brass lamps, river water, practical near-future clothing and vehicles kept subordinate, natural adult faces and postures, subtle film grain. Ancient institution in a lived near-future river country; no fantasy ornament and no period-costume pageant.

Composition/framing: a slightly elevated oblique view at bridge-deck height. Keep the complete central arch, the primary group of widows with blank rolls, and at least two clearly stopped barges below inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must preserve both the ceremony and the traffic waiting for it. Side fields hold the rest of the span, toll houses, and orderly stopped road traffic. One continuous scene, no split panel.

Lighting/mood and palette: beautiful open coin-warm morning, white-gold sun pouring through the arches and striking the waiting water, deep river green, brass, warm limestone, muted earth and dignified dark clothing. Luminous, humane, proud, and solemn without gloom. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, names, labels, ledger lines, marks on rolls, epitaphs, signs, plaques, placards, stencils, banners, flags, insignia, logos, currency faces, screens, UI, captions, borders, or watermarks. Every roll and document is completely blank; all architecture, clothing, vehicles, and boats are unmarked.

Avoid: copied Arcadia Gate composition, named characters, funeral procession, coffins, bodies, battle, grief spectacle, melodramatic collapse, fantasy magic, glowing deity, neon, cyberpunk, steampunk ornament, modern Earth branding, readable names, moving traffic, ruin, rainstorm, dusk, or night.
```

## `regions/brasslight.png`

- Dossier read immediately before generation: live `brasslight`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-9b708309-0e44-488b-b505-994afc0fce53.png`.
- Final path: `apps/web/private/codex-art/regions/brasslight.png`.
- QA: Full frame and exact crop preserve the lead family pilot, polished brass stern-lamp, guided barge, exposed sandbar, moving channel seam, and receding warm town lamps. Night is deep but readable and every visible light remains naturally warm. No readable marks, chart, text, cyan, violet, or magical light.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 town "Brasslight"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: deep freight water, oxidized brass, working wealth, grounded lived-in river infrastructure, real lens logic, and premium cinematic photorealism. Translate its coin-warm identity into motivated night lamplight. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Brasslight is the night-pilot town where shifting sandbars make the channel safest to read by sound. Depict full night on the leg's one dark-hours plate: a lead family pilot skiff runs the narrow channel beside a deep barge, its single polished heirloom brass stern-lamp the dominant practical, while a long string of other warm brass lamps traces the safe winding water into the town's lamp-lofts and pilot wharves. The lead pilot listens to the river rather than consulting a chart; current seams and exposed sandbars make the hidden route physically legible. The lamp is license, heirloom, and family institution, polished nightly and never sold, but no wedding or document is shown. The families own the dark because knowledge moves with them.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 35mm night cinematography, physically accurate low-light water, practical flame and incandescent brass-lamp behavior, wet hulls, worn timber, polished heirloom brass, damp rope, subtle film grain and readable shadow detail. Near-future working river craft, never steampunk and never fantasy.

Composition/framing: water-level three-quarter view following the pilot skiff. Keep the complete lead skiff, its polished stern-lamp, listening adult pilot, bow of the guided barge, the immediate sandbar/current seam, and several receding lamps inside the central approximately 564-pixel source window (x about 554-1117). The crop must preserve lamp, pilotage, danger, and safe route. Side fields hold dark pilot wharves and the longer lamp chain. One continuous scene, no split panel.

Lighting/mood and palette: true night owned by warm brass and amber lamplight reflected in deep green-black freight water, with faint bone moonlit sandbars and wet charcoal structures. Intimate, exact, prosperous, and dangerous only to those without a family pilot. Preserve deep readable blacks without turning the plate gloomy or murky. No Blackbloom violet anywhere and no cyan anywhere; every visible light is warm, natural, and physically motivated.

Zero-text law: absolutely no readable text, letters, numbers, charts, labels, lamp markings, family marks, signs, plaques, stencils, banners, flags, insignia, logos, gauges, screens, UI, captions, borders, or watermarks. Boats, lamps, clothing, buildings, equipment, and any paper are completely unmarked.

Avoid: copied Arcadia Gate composition, daylight, generic festival lanterns, magical floating lights, fantasy magic, glowing runes, neon, cyan, violet, cyberpunk, steampunk filigree, lighthouse beam, modern Earth branding, readable charts, wreck, collision, battle, storm spectacle, fog that hides the channel, cute postcard treatment, or ruin.
```

## `regions/sunken-row.png`

- Dossier read immediately before generation: live `sunken-row`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-712f31de-5225-4383-bfb9-1aeb22a2a610.png`.
- Final path: `apps/web/private/codex-art/regions/sunken-row.png`.
- QA: Full frame establishes an inhabited town layered over joined old hulls, with mast-posts, salvage work, gulls, homes, and water visible between structures. The exact crop clearly proves the central street is a barge deck and retains its open inhabited hold-cellar, mast, residents, ropes, and working salvage. Lived-in rather than ruined; no readable vessel or street name.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 town "Sunken Row"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Sunken Row is a living town built on generations of scuttled and foundered freight hulls driven into river mud as pilings. Show a central street that unmistakably IS the broad weathered deck of an old barge, continuing into joined wreck decks and timber boardwalks. The drowned hull's hold has become a damp inhabited cellar visible through an open hatch; old masts now serve as structural posts; salvage racks, recovered fittings, wet workshops, gulls, and modest homes layer upward over older vessels. Residents cross the deck street and work salvage with ordinary competence. The town keeps what the river takes and remembers every wreck, but the scene is lived-in, prosperous in its own hard way, never a ruin or ship graveyard.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 28mm lens, physically credible load-bearing conversions, layered hull construction, worn timber, riveted steel, oxidized brass, wet rope, river mud, patched canvas, domestic smoke and subtle film grain. Near-future river salvage community with generations of practical adaptation, never steampunk spectacle.

Composition/framing: slightly elevated street-level wide view looking along the barge-deck street. Keep the complete central wreck deck, recognizable hull sides descending into water, open hold-cellar, mast-post construction, active salvage rack, and several residents inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must prove that the street itself is a barge and the town lives on it. Side fields show deeper layers of joined wrecks and boardwalks. One continuous scene, no split panel.

Lighting/mood and palette: coin-warm white-gold early morning breaking over the water, deep river green below, brass and warm salvaged timber, muted rust, wet grey, bone canvas and living green in support. Lived-in memory, resourcefulness, and warmth rather than decay. Bright and readable. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, street names, vessel names, price lists, labels, ledger marks, signs, plaques, placards, stencils, banners, flags, insignia, logos, gauges, screens, UI, captions, borders, or watermarks. Every hull, board, crate, tool, garment, and paper is completely unmarked and non-glyphic.

Avoid: copied Arcadia Gate composition, generic floating slum, abandoned wreck field, ruin porn, sinking active boat, disaster, corpse, funeral imagery, fantasy magic, neon, cyan, violet, cyberpunk, steampunk filigree, modern Earth branding, readable ship names, cute storybook village, extreme poverty caricature, storm, dusk, or night.
```

## `regions/velvet-reach.png`

- Dossier read immediately before generation: live `velvet-reach`, REGION, CANON v1.
- Director discrepancy: `velvet-reach` is present in the live 80-slot audit but has no individual block in `SOL56_RIVERLANDS_ART_PROMPT.md`; the live dossier and Arcadia-wide laws were therefore the complete authority, as the commission requires.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-d6a0871d-d09f-42af-9786-3b7df0d20809.png`.
- Final path: `apps/web/private/codex-art/regions/velvet-reach.png`.
- QA: Full frame shows a sheltered after-dark basin, galleried inn, supper barges, graduated public/private landings, sealed cargo, discreet staff, and composed adult factors/captains/buyers. The exact crop keeps the central supper barge, conversation table, complete adult group, inn galleries, staff, and lamplit water. Coin-warm wealth and discretion read without a handshake, paper, card face, symbol, or readable clue.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 town "Velvet Reach"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: deep freight water, brass, lamplight, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Translate its coin-warm identity into an elegant after-dark river scene. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Authority note: this audited live slot has no individual director block, so the CANON v1 live dossier is the complete scene authority.

Dossier scripture and primary request: Velvet Reach is the money river's parlor, a sheltered mooring basin grown into a town of galleried inns, supper barges, card rooms, and private landings. Shoot the Reach after dark when freight wealth rests and its real business begins. Center one beautifully worn supper barge moored beneath an open multi-level galleried inn; on its covered deck, small groups of well-dressed adult factors, captains, and buyers eat well, drink carefully, and talk with perfect manners. One quiet central table carries the tension of a deal, courtship, betrayal, or recruitment without resolving which. Nearby cargo remains sealed and unmarked; more ownership changes here than at the customs fort, but no paper, handshake cliché, currency, or readable clue states it. Open galleries graduate into increasingly private unnamed landings around the basin. Staff move discreetly. Neutrality holds only while everyone remains seated.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 40mm night cinematography, physically accurate practical light on water, natural adult faces and restrained body language, worn dark timber, scarred brass, linen, glassware, wet stone and subtle film grain. Wealth through material quality, service, privacy, and composure rather than gaudy luxury. Near-future Riverlands, never period costume, fantasy palace, casino, or steampunk.

Composition/framing: intimate wide view from across the sheltered basin. Keep the complete central supper-barge deck, its quiet adult conversation table, working staff, open inn galleries above, and at least one shadowed private landing inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must read as discreet river wealth conducting business over supper. Side fields carry additional moorings and gallery depth. One continuous scene, no split panel.

Lighting/mood and palette: coin-warm night owned by brass lamps, candle-warm dining practicals, and their reflections in sheltered deep-green water; charcoal and Aegis grey clothing, warm dark timber, bone linen, restrained rust. Attractive, composed adult presence and perfect manners; sensual richness without explicit sexuality or glamour posing. Bright enough to read, never murky. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, menus, ledgers, contracts, playing-card faces, currency faces, labels, room names, signs, plaques, placards, stencils, banners, flags, insignia, logos, screens, UI, captions, borders, or watermarks. Any paper is absent or completely blank and face-down; all boats, buildings, clothing, cargo, dishes, and objects are unmarked.

Avoid: copied Arcadia Gate composition, named characters, protagonist close-up, casino spectacle, gambling symbols, drunken revelry, brawl, overt crime, clandestine hooded conspiracy, handshake cliché, visible transaction paper, explicit sex, pinup posing, fantasy magic, neon, cyan, violet, cyberpunk, steampunk ornament, modern Earth branding, readable menus, daylight, ruin, poverty caricature, or empty architecture.
```

## `regions/tally-light.png`

- Dossier read immediately before generation: live `tally-light`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-90a0d458-d66d-4f62-bbc1-25ca6fd48e46.png`.
- Final path: `apps/web/private/codex-art/regions/tally-light.png`.
- QA: Full frame shows one stone tower and keeper house on a mid-river islet between dense moving convoys, with one keeper at the open shuttered lamp and another observing traffic. The exact crop centers the complete outpost, both keepers, and brilliant warm signal mechanism; convoy traffic remains visible at the crop margins. No written count, abstract code glyph, readable marks, cyan, or violet.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 outpost "Tally Light"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold light, deep freight water, brass, working wealth, grounded lived-in river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Tally Light is a solitary stone signal tower on a mid-river islet whose keepers count every hull and convoy, transmitting the truth upriver and downriver by lamp. Shoot the outpost at dusk at the instant its large mechanical shutter opens for one brilliant warm lamp flash. One adult keeper is silhouetted at the lamp controls while another watches a convoy through an unmarked brass optic. The tower's old stone and modest keeper house occupy the tiny islet; freight barges pass on both sides in an orderly stream. The count has run unbroken longer than Aegis has held the leg and has never been wrong, but it is written nowhere: the image shows vigilance, memory, and an incorruptible lamp, not data or code.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 38mm lens, physically credible stone signal tower and shuttered lamp mechanism, deep river water, worn steps, oxidized brass, dark timber, practical keeper clothing and subtle film grain. Near-future river signaling through durable physical machinery, never lighthouse romance, steampunk, or fantasy.

Composition/framing: medium-wide view from low over the river toward the islet. Keep the complete tower, open lamp shutter and warm flash, both keepers, and at least one full passing convoy hull inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must read as solitary human vigilance counting a moving freight river. Side fields carry additional barges and the long river reach. One continuous scene, no split panel.

Lighting/mood and palette: blue-hour dusk held by a powerful coin-warm brass lamp, last white-gold sky at the horizon, deep freight green water, wet charcoal stone, muted earth and rust. Solitary, exact, trusted, and luminous; the lamp remains the warm heart of the frame. No Blackbloom violet anywhere and no cyan anywhere. Do not render abstract light glyphs, letters, or numerical pulse patterns.

Zero-text law: absolutely no readable text, letters, numbers, tally marks, lamp-code glyphs, labels, logs, charts, signs, plaques, placards, stencils, banners, flags, insignia, logos, gauges, screens, UI, captions, borders, or watermarks. All optics, controls, boats, clothing, architecture, and any paper are completely unmarked and non-glyphic.

Avoid: copied Arcadia Gate composition, multiple towers, lighthouse on an ocean coast, magical beacon, projected symbols, Morse-like written notation, fantasy magic, glowing runes, neon, cyan, violet, cyberpunk, steampunk filigree, modern Earth branding, readable records, battle, sabotage, storm spectacle, ruin, abandonment, broad city skyline, or a dark lamp.
```

## `regions/gullwatch.png`

- Dossier read immediately before generation: live `gullwatch`, REGION, CANON v1.
- Dossier/director conflict: none.
- Generation mode: new image with one palette/material/style reference.
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-e2a445e9-70f5-4e53-987a-9948c8b91e6f.png`.
- Final path: `apps/web/private/codex-art/regions/gullwatch.png`.
- QA: Full frame clearly shows a two-keeper military-naturalist watch, unmarked brass spotting scope, bluff, branching freight river, multiple behaviorally distinct gull groups, convoy traffic, hardened emplacement, and distant war-smoke as weather only. The exact crop retains the observing keeper with blank/non-readable log, the edge of the spotting optic, principal flock behavior, river convoys, and distant consequence; the full frame carries the complete primary scope keeper. No detailed battle, casualty, readable field note, logo, cyan, or violet.

### Exact generation prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION plate for CANON v1 outpost "Gullwatch"; wide cinematic 16:9 landscape, target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a PALETTE, MATERIAL, AND PRODUCTION-QUALITY REFERENCE ONLY for Arcadia Gate: coin-warm white-gold daylight, deep freight water, brass, working wealth, grounded lived-in near-future river infrastructure, real lens logic, and premium cinematic photorealism. Do not copy its camera, gate, skyline, mountain arrangement, boats, or composition.

Dossier scripture and primary request: Gullwatch is the last bluff-top picket before Arcadia Gate gives way to the Peninsula's war, and its doctrine is to read the birds. Depict a weathered but active observation post high above the downriver reaches: one experienced adult keeper studies a large natural shifting formation of grey gulls through a practical unmarked spotting scope while a second keeper compares the sky, distant water, and a completely blank closed bird log. The birds dominate the middle sky in several behaviorally distinct groups: some following a far convoy, others veering away from a marsh, making them credible early warning rather than decoration. A hardened emplacement and modest garrison sit ready but no weapon fires. Far on the horizon, the war exists only as ambiguous weather, distant smoke haze, and a barely legible convoy scale — never a detailed battle. This is where the Riverlands ends and consequences begin.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 35mm lens, authentic gull flight and flock behavior, believable military-naturalist observation equipment, weathered stone, scarred brass optics, wet timber, practical unmarked clothing, river wind and subtle film grain. Near-future frontier picket, never fantasy watchtower or modern Earth military cosplay.

Composition/framing: shoulder-height wide shot from just behind and beside the keepers, looking out over the bluff and river. Keep both keepers, the complete spotting scope, the most informative gull formation, the nearest convoy, and the war-weather horizon inside the central approximately 564-pixel source window (x about 554-1117). The narrow crop must read as people using birds as early warning. Side fields carry emplacement, wider flock behavior, and river geography. One continuous scene, no split panel.

Lighting/mood and palette: coin-warm late-afternoon light still owns the Riverlands foreground, with deep freight-green water, brass optics, warm dry grass, wet grey and charcoal only gathering toward the distant war horizon. Vigilant, intelligent, wind-scoured, and readable; tension arrives as weather, not gloom. No Blackbloom violet anywhere and no cyan anywhere.

Zero-text law: absolutely no readable text, letters, numbers, bird-log writing, field notes, labels, range marks, scope markings, signs, plaques, placards, stencils, banners, flags, insignia, logos, uniforms marks, screens, UI, captions, borders, or watermarks. The closed log, optics, emplacement, clothing, vessels, and all equipment are completely unmarked and non-glyphic.

Avoid: copied Arcadia Gate composition, magical or giant birds, one decorative seagull close-up, birds attacking people, explicit battlefield, visible casualties, shell impacts, firing guns, named characters, fantasy magic, glowing eyes, neon, cyan, violet, cyberpunk, steampunk filigree, modern Earth branding, readable notes, storm swallowing the whole frame, ruin, abandonment, dusk, or night.
```

### cliffgate.md

# SOL 5.6 Riverlands — Cliffgate child plate generation record

- Generation mode: built-in image generation, one call per asset.
- Shared local reference: `C:\The Habitat\apps\web\private\codex-art\regions\cliffgate.png` (palette, material, lighting, lens, and production-style reference only).
- Final contract: 1672x941 PNG, 8-bit sRGB, three channels, RGB24, no alpha.
- Normalization: generated files were 1671x941 or 1672x941 RGB PNGs; final project files were mechanically normalized through Sharp to exact contract dimensions without repainting.

## winchworks

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\winchworks.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-7d96af8e-7036-4e8b-a9bd-3f87b3f0a8ba.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Winchworks
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct new location and composition.
Primary request: The lift-yard fortress grown around Cliffgate's great falls machinery. Show windlass halls, chain galleries, counterweights the size of houses, and one laden freight barge rising vertically against the cliff face in a massive timber-and-iron cradle.
Scene/backdrop: a sheer wet basalt gorge beside the great falls, fortress masonry wrapping machinery visibly older than the fort; Holdfast crews maintain platforms, chains, and brasswork around the ancient mechanism but never open or enter its sealed inner works.
Subject: the complete rising barge cradle and its load-bearing chains, with the house-scale counterweights and fortress structure readable together. Total working competence; no battle, collapse, abandonment, or mystical spectacle.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 28mm lens logic, physically credible engineering and load paths, wet rock grain, worn iron, practical timber, volumetric spray, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9. Place the entire signature action—the laden barge, cradle, principal chains, and at least one enormous counterweight—inside the central approximately 564-pixel-wide source window of a 1672x941 frame so the narrow directory crop tells the whole story. Deep vertical scale may extend into the side fields.
Lighting/mood: shafted white-gold morning light through falls mist, awe through competence, rugged and premium.
Color palette: Cliffgate vertical iron—wet stone, chain-grey, spray-white, gorge shadow, moss-muted green, restrained rust and brass; absolutely no Blackbloom violet; no cyan or magical glow.
Constraints: ancient machinery maintained around and never inside; Holdfast stonework is younger than the iron; all architecture and mechanisms physically plausible; output intended as 1672x941 RGB24 PNG.
Avoid: any readable text, letters, numbers, labels, signs, stencils, ledgers, banners, insignia, logos, UI, border, split panel, or watermark; no fantasy runes, no decorative steampunk clutter, no floating parts, no war scene.
~~~

## stairfoot

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\stairfoot.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-d5040595-9765-4aa0-a55a-fe50e56c4325.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Stairfoot
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct town scene at the falls' base.
Primary request: Stairfoot, the cheerful chokepoint town living in the permanent spray and thunder at the foot of Cliffgate's great falls. Show laden barges queued for lift cradles, wet boarding houses, rope-lofts and practical taprooms pressed along one loud street, with mountain folk and river folk waiting together.
Scene/backdrop: the gorge funnels every vessel into the lift queue; rain-slick stone and timber buildings, working wharves, rope coils, rigging, porters and crews, with rainbowed falls mist over everything.
Subject: the compact center of the image must show a complete queued freight barge beside the crowded wet main street and the first lift-cradle infrastructure, making the town's whole economy instantly readable.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 32mm lens logic, physically credible river and lift infrastructure, lived wet timber and stone, natural human scale, volumetric spray, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9 at street-to-wharf level. Keep the complete signature relationship—barge queue, waiting crews, wet street, boarding houses and lift approach—inside the central approximately 564-pixel-wide source window of a 1672x941 frame. Side fields may extend the queue and gorge.
Lighting/mood: bright broken morning light through mist, a real restrained rainbow in the spray, convivial working energy under overwhelming thunder; beauty and life, never gloom.
Color palette: Cliffgate vertical iron—wet chain-grey stone, spray-white, gorge shadow, weathered timber, moss green, restrained rust, warm windows and white-gold light; no Blackbloom violet; no cyan or magical glow.
Constraints: a functioning inhabited town, everything moving or waiting for a clear working reason; output intended as 1672x941 RGB24 PNG.
Avoid: any readable text, letters, numbers, signs, placards, stencils, ledgers, banners, insignia, logos, UI, border, split panel, or watermark; no combat, no disaster, no ruined or abandoned town, no fantasy runes, no decorative steampunk clutter.
~~~

## chainsong

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\chainsong.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-5598c387-8c05-408d-a813-611e1503b4eb.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Chainsong
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct listening town beneath the lift chains.
Primary request: Chainsong, a wet gorge town built beneath the great overhead lift-chain spans. The enormous chains cross the sky like dark musical staves, visibly moving and bowing in the wind; below them stand practical forge rows and listening platforms, with one keeper attentively logging chain pitch on a completely blank, unreadable page.
Scene/backdrop: inhabited stone-and-timber workshops in a narrow spray-dark gorge, working chainwrights and riggers, mist carrying through the street. Include the town's alarm tower fitted with a large practical signal horn and explicitly no bell.
Subject: the central crop must contain the complete visual sentence: colossal chain spans overhead, the listening keeper below, and the horn tower without a bell. The wind's force should be visible in chain deflection, mist and clothing while remaining physically credible.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 32mm lens logic, physically plausible iron scale and suspension, worn forge masonry, wet timber, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9, slightly low street-level viewpoint to make the chains dominate. Keep the chain spans, keeper/listening station and horn tower wholly legible inside the central approximately 564-pixel-wide source window of a 1672x941 frame; side fields extend forge rows and gorge depth.
Lighting/mood: cool wet daylight split by restrained white-gold shafts through moving mist; attentive, industrious, faintly ominous because silence would be the danger.
Color palette: Cliffgate vertical iron—chain-grey, wet basalt, spray-white, forge-charcoal, moss-muted green, restrained ember warmth and rust; absolutely no Blackbloom violet; no cyan or magical glow.
Constraints: chains are functional infrastructure, not ornament; horn tower has no bell; no disaster, no snapped chains, no evacuation; output intended as 1672x941 RGB24 PNG.
Avoid: readable text, letters, numbers, musical notation, signs, labels, stencils, banners, insignia, logos, UI, borders, split panels, watermarks, fantasy runes, decorative steampunk clutter, battle, collapsed machinery.
~~~

## hanging-market

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\hanging-market.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-c246aa15-8055-4450-87b8-0409c25e9a9d.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Hanging Market
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct vertical market settlement.
Primary request: The Hanging Market, a functioning market town bolted directly to Cliffgate's wet rock face between lift stages. Show roughly a dozen stacked storeys of timber galleries, ladders, catwalks, basket-winches, and warm practical shops, with bundled goods visibly rising in several baskets.
Scene/backdrop: steep gorge wall and spray haze, mountain goods descending and river goods climbing; engineering that began as scaffolding and became permanent, dense but physically credible, inhabited and maintained.
Subject: the central crop must show the complete vertical customer journey in one readable column: lower landing, people climbing ladders and stairs through stacked shop galleries, a laden basket ascending on a real rope-and-pulley winch, and prestigious higher galleries above.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 28mm lens logic, physically plausible anchors, braces, catwalks, loads and railings, wet timber grain, worn iron, natural people, volumetric gorge mist, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9 with a dramatic upward-oblique view. Keep the key vertical column—complete ascending basket, climbing customers, and at least six clearly stacked gallery levels—inside the central approximately 564-pixel-wide source window of a 1672x941 frame. Side fields establish cliff and lift-stage scale.
Lighting/mood: late-day white-gold light through spray with warm shop lamps beginning to glow; crowded, prosperous, rugged, exhilarating rather than precarious horror.
Color palette: Cliffgate vertical iron—wet basalt, chain-grey, spray-white, weathered timber, restrained rust, moss green and candle-warm practicals; absolutely no Blackbloom violet; no cyan or magical glow.
Constraints: a town customers literally climb through; prestige expressed by altitude; scaffolding-derived engineering with credible support; no collapse or active violence; output intended as 1672x941 RGB24 PNG.
Avoid: any readable text, letters, numbers, shop signs, labels, price boards, banners, insignia, logos, UI, borders, split panels, watermarks, fantasy runes, ornate fantasy architecture, decorative steampunk clutter, impossible unsupported buildings.
~~~

## thundershade

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\thundershade.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-ac194111-ac9f-4f17-8a75-e8855de57f61.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Thundershade
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct village within the falls' spray-shadow.
Primary request: Thundershade, the beautiful village under total waterfall thunder: a deep green mist world of moss terraces cut into wet stone, modest inhabited structures, and villagers communicating naturally with their hands because speech cannot carry. At true noon, a full reliable rainbow arcs through the spray.
Scene/backdrop: permanent spray-shadow beneath the great falls, intensely wet but lived-in, productive moss and herb terraces, channels and stone paths, mist catching light. The waterfall's roar is implied by airborne spray, moving cloth and the figures' complete reliance on signing.
Subject: center the full rainbow arc over two or three complete villagers in a clear hand-signing exchange among lush moss terraces. The rainbow, signing hands, faces and terraces must all remain readable together in the narrow crop.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 35mm lens logic, physically natural rainbow and spray, detailed wet stone, moss, skin, practical clothing and subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9, human-height view opening into the terraces. Keep the complete signature tableau—full rainbow arc, complete signing figures with visible hands, and cultivated moss terraces—inside the central approximately 564-pixel-wide source window of a 1672x941 frame. Side fields extend falls and village.
Lighting/mood: true noon shaft through dense mist, radiant natural color, profound beauty and intimate quiet under implied overwhelming thunder; beauty first, not menace.
Color palette: Cliffgate vertical iron transformed by life—deep moss green, wet chain-grey stone, spray-white, soft skin and earth tones, a natural restrained-spectrum rainbow, white-gold noon light; absolutely no Blackbloom violet cast; no cyan magic or artificial glow.
Constraints: figures communicate with hands and do not shout; rainbow must be a physically credible full arc in spray; inhabited working village, not ruin; output intended as 1672x941 RGB24 PNG.
Avoid: readable text, letters, numbers, signs, labels, banners, insignia, logos, UI, borders, split panels, watermarks, fantasy runes, glowing plants, magical rainbow effects, combat, disaster, grotesque anatomy, extra fingers, obscured hands.
~~~

## deadhaul

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\deadhaul.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-63fb4a61-d9f2-4bc8-a03e-87f05dcc3338.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Deadhaul
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct abandoned incline outpost.
Primary request: Deadhaul, the abandoned counterweighted haul-incline that simply stopped. Several heavy freight cars remain frozen mid-slope exactly where they halted years ago, visibly still loaded beneath intact closed weatherproof covers and sealed car bodies, untouched and weathered. At the incline's foot, a small Holdfast garrison occupies the old winch house as a road-watch outpost.
Scene/backdrop: a steep wet gorge slope with twin incline rails climbing into mist, stopped cars high behind; at the foot a stone-and-timber winch house beside the gorge road. The building's active watch slit, porch, posted soldiers and spotting scope all face the road in the foreground, deliberately away from the incline. The soldiers' backs and closed shutters face the stopped cars. Nobody climbs toward them.
Subject: the central crop must contain the complete locked relationship: closed loaded cars visibly stopped mid-slope, the old winch house below, and the small garrison actively watching the road rather than looking at the incline. Careful incuriosity is the subject; no visible cause is offered.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 35mm lens logic, physically plausible rails, counterweight cable, car brakes and weathering, wet stone and old timber, volumetric low cloud, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9, oblique view from beside the gorge road so road foreground, outward-facing garrison, winch house and ascending incline align in one central vertical story. Keep the closed cars, winch house and road-facing guards wholly legible inside the central approximately 564-pixel-wide source window of a 1672x941 frame.
Lighting/mood: cold overcast morning with one restrained white-grey opening in the mist; the leg's held breath, ominous through absence and deliberate routine, not supernatural spectacle.
Color palette: Cliffgate vertical iron—wet charcoal stone, chain-grey, weathered timber, fog-white, muted moss and rust; absolutely no Blackbloom violet; no cyan or magical glow.
HARD LOCKS: every stopped freight car is CLOSED, sealed, visibly still loaded, never open, never unloaded, never being inspected; nobody approaches or climbs to the cars; no visible accident cause; absolutely no falls-swifts and no birds anywhere in the image; garrison watches the ROAD, not the incline.
Constraints: quiet functioning outpost at the foot of an abandoned mechanism; output intended as 1672x941 RGB24 PNG.
Avoid: open cars, open cargo doors, exposed cargo, spilled or unloaded freight, workers unloading, soldiers looking uphill, people on the incline, birds of any kind, falls-swifts, readable text, letters, numbers, signs, labels, stencils, banners, insignia, logos, UI, border, split panel, watermark, ghosts, monsters, magic, gore, battle, explosion, collapse, visible cause.
~~~

## high-sill

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\high-sill.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-f390e2c3-5bcd-4d8f-a56c-f937ad07221d.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for High Sill
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct outpost at the falls' lip.
Primary request: High Sill, the small windburned lock post at the exact lip of Cliffgate's great falls: the last lock of the climb, where a laden river barge waits under the keepers' absolute authority before the long calm water toward Grand Lake. Beyond the lock the upper water stretches level to the horizon; immediately behind and below, the whole world drops away through spray.
Scene/backdrop: exposed high-country stone, a compact practical lock and keeper house, ancient gate machinery, mooring posts, wind-bent grass and clothing, immense gorge and falling water. This is the least glamorous and most absolute authority on the leg.
Subject: one complete veteran keeper at a plain lever and one complete freight barge held in the final lock, with the sharp falls lip and long calm upper water readable together. No ceremony: a routine decision controls everything.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 28mm lens logic, physically credible lock hydraulics and cliff geography, weathered skin and wool, wet stone grain, wind and spray, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9 from a high three-quarter viewpoint. Keep the veteran keeper, lever, complete lock gate, held barge, and visual transition from calm upper water to the drop wholly legible inside the central approximately 564-pixel-wide source window of a 1672x941 frame. Side fields carry the distant lakeward reach and gorge abyss.
Lighting/mood: hard pale morning light breaking through fast cloud, cold wind, huge clarity; quiet competence and final authority, not heroic spectacle.
Color palette: Cliffgate vertical iron at altitude—wet chain-grey stone, pale sky, spray-white, charcoal water, wind-muted grass, worn wool, restrained brass and rust; absolutely no Blackbloom violet; no cyan or magical glow.
Constraints: last lock at the falls' lip; long calm water beyond toward Grand Lake; small functional outpost, no grand fortress; output intended as 1672x941 RGB24 PNG.
Avoid: readable text, letters, numbers, ledgers, signs, labels, stencils, banners, insignia, logos, UI, borders, split panels, watermarks, fantasy runes, ornate palace architecture, combat, disaster, falling people, capsized boat, broken machinery.
~~~

## anvil-watch

- Target: `C:\The Habitat\apps\web\private\codex-art\regions\anvil-watch.png`
- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-0da4-73b2-bff5-84d942e4f88f\exec-8aa588c3-edc4-4753-bf2a-ce692d32607f.png`
- Exact prompt:

~~~text
Use case: stylized-concept
Asset type: final shipping-quality The Habitat Codex REGION environment plate for Anvil Watch
Input images: Image 1 is the approved Cliffgate leg plate and is a palette, material, lighting, lens, and production-style reference only; create a distinct land-road watch outpost.
Primary request: Anvil Watch, a spare dry-stone Holdfast watch post built on a naturally anvil-shaped crag high above Cliffgate's gorge road. Its keepers count what walks rather than what floats: a drover column of pack animals, carts and travelers passes far below on the winding land road while a keeper tracks them with an optical glass and another flashes the count onward using a polished signal mirror.
Scene/backdrop: exposed rocky crag, compact roofed post, practical mirror frame, wind-bent scrub, steep gorge road switchbacks. The river may be only a remote sliver and must not be the route being observed.
Subject: the central crop must contain the recognizable anvil-shaped crag and complete watch post, one keeper at the glass, the mirror catching a clean shaft of sunlight, and the drover column visibly following the road below.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real 35mm lens logic, physically credible mountain topography, dry-stone construction, worn optics and mirror hardware, natural pack train scale, atmospheric depth, subtle film grain; match Image 1's production.
Composition/framing: wide cinematic 16:9, high oblique view along the land road. Keep the full visual relationship—watch post on anvil crag, keepers, signal mirror and road column—inside the central approximately 564-pixel-wide source window of a 1672x941 frame. Side fields carry gorge depth and mountain horizon.
Lighting/mood: clear cold morning with a precise white-gold mirror flash, long patient visibility; solitude and exact observation, no alarm or battle.
Color palette: Cliffgate vertical iron on its dry edge—chain-grey and bone-grey stone, weathered timber, pale sky, muted scrub green, restrained rust and white-gold reflection; absolutely no Blackbloom violet; no cyan or magical glow.
Constraints: the outpost observes the ROAD and walking traffic, not boats; architecture is patient and modest; signal mirror is optical, not magical; output intended as 1672x941 RGB24 PNG.
Avoid: readable text, letters, numbers, tally marks, signs, labels, stencils, banners, insignia, logos, UI, borders, split panels, watermarks, fantasy runes, beacon magic, combat, marching army, river convoy as focal subject, ornate fortress.
~~~

## Installed final manifest

| Slug | SHA-256 |
|---|---|
| `winchworks` | `0F29F8E34DC4BC34726E6F0CF0B2DD55AC5A2F86D46B3BA6FD98E4163A8769E8` |
| `stairfoot` | `F710C3D0BA13230F02DFD487E96CB0664A6E23899FE2A7BDCF2AEA0DFB15E33C` |
| `chainsong` | `54820761B79E033C0341813642DB7F293F6DC7CD7E232738D1E2A24079731BBA` |
| `hanging-market` | `34E35E6876EF526AB0E93BF10296EE66A07FA096F77CF0D011D9F2E84447EA7A` |
| `thundershade` | `188D3284DB549E10EC927B3FEFF60C0BBDD985B7A1595CFB4870760618B650A8` |
| `deadhaul` | `B163C1E0D4873522DBCD4A5AE84CB2D24C3B05D187AB1B1DB9B0DFC47DAA21E2` |
| `high-sill` | `1F9FC0E6CD4D392FD023C6D7A03872777674FF0DA7D518A07034727B3F46842C` |
| `anvil-watch` | `5ED4A9B1C26FF7B0D0C09CC7452128B62C5EA4EC03B7E6A0E3D960C7420A817E` |

## QA record

- Mechanical file gate: PASS. All eight installed files are exact 1672x941, 8-bit sRGB, three-channel PNGs with no alpha.
- Full-frame visual gate: PASS. All eight were inspected at original resolution; no readable text, letters, numbers, labels, logos, UI, borders, split panels, or watermarks observed.
- Palette/style gate: PASS. All eight preserve the Cliffgate reference's wet basalt, vertical iron, spray-white, restrained rust, moss, and white-gold practical-light language; no Blackbloom violet or cyan magic observed.
- Exact center-crop gate: PASS for primary story legibility at x=554, y=0, width=564, height=941. Secondary context remains in the wide shoulders where appropriate: Winchworks' house-scale counterweight, Chainsong's horn tower, High Sill's keeper, and Anvil Watch's lower drover column remain clearest in the full frame, while their primary mechanisms and locations survive the crop.
- Deadhaul hard-lock gate: PASS. All visible freight cars are closed, covered, loaded, stopped, and untouched; no unloading or exposed cargo; no person climbs the incline; no visible cause; no birds or falls-swifts; the staffed outpost and scope face the gorge road rather than the cars.
- Live resolver gate: PASS. The post-install coverage audit no longer lists any of these eight slugs as missing.

### riftgate.md

# Riftgate child region art generation record

Generated 2026-09-01 with the built-in ImageGen path. One generation call was made per asset. Every call used `apps/web/private/codex-art/regions/riftgate.png` as a style, palette, material, weather, and crop reference only.

## charnel-lock

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-977fd43d-e051-4503-8a43-e3474c36d0a1.png`
- Installed destination: `apps/web/private/codex-art/regions/charnel-lock.png`
- SHA-256: `f7a79276b8d408fd89a339fc7cd04073a5a03fc01a63470868d747ed177b5d6e`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Charnel Lock; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original child location. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Charnel Lock — THE LOCK-CASTLE. Show the fortified river-lock on Riftgate: enormous ancient gate machinery of unexplained vintage wrapped in generations of severe Family stonework, with a working toll wharf beside tannin-dark water. Mourning-dressed attendants receive one closed coffin-barge with impeccable formal courtesy. The record crypts are only implied by the fortress mass and barred upper architecture; never show their interior. The place runs like a funeral that never ends. Courtesy is power, not sentiment.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real lens logic, richly detailed physically based materials, believable near-future working infrastructure built around much older mechanisms, subtle film grain. Scarred wet stone, blackened brass, worn iron, damp timber, black crepe, rain sheen. No medieval fantasy castle language, no gothic ornament spectacle, no clean sci-fi chrome.

Composition/framing: wide establishing shot at human eye-to-slightly-elevated level. Place the lock gate, toll interaction, attendants, and closed coffin-barge together within the central approximately 564-pixel-wide source crop (master x about 555-1117). They must remain fully readable after a narrow portrait-like center crop. Use side fields only for expendable walls, riverbank, mist, and secondary architecture. No essential information in the bottom 10 percent. Strong layered foreground, midground, and fortress depth; one clear visual thesis, not a collage.

Lighting/mood: overcast late-day darkness with candle-warm work lamps and restrained sepia sky reflections; dignified, patient, unhurried menace. Respectful full-weight death-trade imagery without explicit gore, exposed remains, or sensational horror.

Color palette: match Image 1's Riftgate identity — tannin black and red-brown water, rust-red foliage, wet charcoal, bone stone, black crepe, aged brass, sparse candle amber. Absolutely no violet, purple, magenta, cyan, teal glow, or neon.

Constraints: one closed coffin-barge; attendants are adults; practical contemporary-to-near-future mourning dress without insignia; no visible body; no record-crypt interior; no explicit gore; no children; no magical apparition; no floating deity; no unsupported heraldry.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, papers, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Any document-like surface must be blank and unreadable.
```

## wakewater

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-5d08e66f-d0aa-4f1a-80c3-2469eb95d6f2.png`
- Installed destination: `apps/web/private/codex-art/regions/wakewater.png`
- SHA-256: `1ae6e3f724b7899efbab7b8b7ef7842ff54c1b9c39733655b4306ac823d0a175`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Wakewater; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original child town and interior. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Wakewater — THE WAKE TOWN. Show a single deep riverfront wake-house interior where grief and commerce share premises without cynicism: in the front room, a respectful viewing around one closed, dark-draped coffin; through a broad open internal doorway in the same building, appraisers quietly examine old relic instruments on a plain table in the back room. The tannin-dark river and wet wharf are visible beyond tall windows or an open riverside door. The same low practical light serves both rooms. Strict manners are visible in every adult's posture: restraint, lowered voices, careful distance, professional dignity. Grief is real; commerce is sober and load-bearing.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, richly detailed physically based materials, believable near-future working river town, subtle film grain. Wet dark timber, old plaster, black crepe, worn iron, aged brass, rain glass, practical clothing. No medieval fantasy, no gothic theater, no clean sci-fi chrome.

Composition/framing: one continuous architectural space with real depth, never a split panel or collage. Compose the closed coffin/viewing, open doorway, and back-room appraisal along the central approximately 564-pixel-wide source crop (master x about 555-1117), layered front-to-back so both human truths survive the narrow directory crop. Side fields are expendable river windows, wall texture, and secondary mourners. No essential information in the bottom 10 percent. Eye-level 35mm cinematic framing, intimate but still environmental.

Lighting/mood: low overcast river daylight through wet windows, candle-warm lamps within, tannin reflections outside. Quiet, humane, formal, and unsettling only because grief and valuation coexist so naturally. Respectful full-weight death-trade imagery without explicit gore, exposed remains, melodrama, or cynical caricature.

Color palette: match Image 1's Riftgate identity — tannin black and red-brown water, rust-red hints, wet charcoal, bone plaster, black crepe, aged brass, sparse candle amber. Absolutely no violet, purple, magenta, cyan, teal glow, or neon.

Constraints: adults only; exactly one fully closed coffin; no visible body, corpse, bones, blood, wound, or explicit gore; appraisal objects are inert old metal or glass relic instruments, not weapons or magical spectacle; no auctioneer theatrics, raised hands, price boards, cash display, fantasy costumes, or overt criminal cliche.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, papers, price lists, lot cards, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Keep all papers absent, closed, face-down, blank, or too soft to read.
```

## mourners-ferry

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-6401c746-9a35-41a2-baa4-103776a86631.png`
- Installed destination: `apps/web/private/codex-art/regions/mourners-ferry.png`
- SHA-256: `417cde58605ee8efd3e455aab6f8e5917e062a18f1f9ae6adbe08d8faa470603`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Mourner's Ferry; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original queue town and ferry scene. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Mourner's Ferry — THE QUEUE OF THE DEAD. Show funeral barges moored in long, perfectly patient rows awaiting passage toward Charnel Lock. On the nearest bier wharf, a restrained group of adult professional mourners in practical black crepe boards a covered funeral barge while bereaved adults wait with strict dignity. A large practical iron ferry bell is caught visibly mid-swing above the embarkation point. The queue is sacred and its order is inviolable; black crepe stands against tannin-dark water. Hostels, chandler lamps, and wet mooring infrastructure imply a whole town built around waiting without requiring signage.

Style/medium: mature AAA grounded cinematic photorealism, premium environment narrative key art, real lens logic, richly detailed physically based materials, believable contemporary-to-near-future river infrastructure, subtle film grain. Wet timber, worn iron, black cloth, aged brass, rope, rain-dark stone, practical adult mourning dress. No medieval fantasy, no gothic spectacle, no steampunk ornament, no clean sci-fi chrome.

Composition/framing: eye-level to slightly elevated wharf view with strong depth down the mooring rows. Keep the swinging bell, the nearest boarding mourners, the covered barge, and enough of the patient queue together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The main scene must read completely after that narrow crop. Side fields are expendable additional barges, hostels, and mist. No essential information in the bottom 10 percent. One coherent cinematic moment, never a montage.

Lighting/mood: damp late afternoon sliding toward evening, overcast sepia sky, candle-warm chandler and barge lamps reflected in red-brown water. Solemn, professional, humane, and unhurried; full emotional weight without melodrama or sensational horror.

Color palette: match Image 1's Riftgate identity — tannin black and red-brown water, rust-red foliage, wet charcoal, bone-grey sky, black crepe, aged iron and brass, sparse candle amber. Absolutely no violet, purple, magenta, cyan, teal glow, or neon.

Constraints: adults only; covered barges and closed coffins or biers only; no visible corpse, bones, blood, wounds, explicit gore, child, supernatural apparition, smiling revelers, panic, line-jumping, auction behavior, or military spectacle. The bell is a real mechanical ferry bell and visually mid-swing; it tolls once per passenger but no written count appears.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, tickets, price lists, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark.
```

## redletter

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-a399b547-cb83-4c02-884f-901ed9627f58.png`
- Installed destination: `apps/web/private/codex-art/regions/redletter.png`
- SHA-256: `4eb8724465845b2b0509f404eb2d44da02e7a06a081b1b9dbac71ccc30c57e07`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Redletter; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original scrivener town interior. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Redletter — THE SCRIVENER TOWN. Show a severe contract-house and ink-works interior beside Riftgate. At one central scarred table, an adult signatory holds a plain pen to a completely blank, featureless contract sheet while an adult independent witness watches with punctilious calm; a small unmarked glass vessel contains river-derived red-brown ink. Behind them, the deep archive recedes through heavy iron grilles: tall ranks of closed, unmarked folios and sealed document boxes whose age and depth imply paper that outlives its signatories. The town's power is permanence, not occult spectacle.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, richly detailed physically based materials, believable contemporary-to-near-future civic work built into older river architecture, subtle film grain. Scarred dark timber, wet iron, oxidized brass, worn paper edges, rain glass, practical charcoal clothing. No medieval fantasy scriptorium, no quills, no monk robes, no gothic magic, no steampunk ornament, no clean sci-fi chrome.

Composition/framing: one continuous deep interior, eye-level 35mm cinematic view. Keep the two adults, signing hand, blank contract, red-brown ink vessel, and iron-grilled archive axis together inside the central approximately 564-pixel-wide source crop (master x about 555-1117), layered front-to-back so the legal act and the archive survive the narrow crop. Side fields are expendable ink-work benches, shelves, wet windows, and architecture. No essential information in the bottom 10 percent. One coherent shot, never a split panel, infographic, or collage.

Lighting/mood: low tannin-filtered daylight through wet windows and restrained amber desk lamps. Formal, exact, patient, and quietly dangerous; the room feels older than any living claimant without becoming supernatural.

Color palette: match Image 1's Riftgate identity — tannin brown, rust-red leaf tones, wet charcoal, black iron, bone paper, aged brass, red-brown ink, sparse candle amber. Absolutely no violet, purple, magenta, cyan, teal glow, or neon.

Constraints: adults only; modern plain pen, not quill; the contract sheet must remain completely blank and featureless with no marks before, beneath, or behind the pen tip; all folios and boxes closed and unmarked; no visible bones, body, coffin, blood, wounds, explicit gore, magical seal, glowing rune, occult symbol, judge's wig, fantasy robes, or weapon. The iron grilles are practical archive security, not a prison.

Zero-text law, load-bearing: no readable or pseudo-readable text, letters, numbers, words, signatures, handwriting, lines of writing, fake script, glyphs, symbols, seals, stamps, labels, ledgers, file tabs, spines, signs, price lists, plaques, inscriptions, logos, brands, insignia, UI, captions, borders, or watermark. Every paper surface is blank, face-down, closed, edge-on, or too soft to read.
```

## candlereach

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-67a20f40-6d8e-4263-8255-f1d1af95b95f.png`
- Installed destination: `apps/web/private/codex-art/regions/candlereach.png`
- SHA-256: `9ca2e80c4698285a300fab9badf5debcefd5555d78d0c2d0ddc1176a283d63db`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Candlereach; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original night reach and village navigation scene. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Candlereach — THE LIT ROAD, Riftgate's most beautiful dark. Night on a long treed-in river reach that daylight barely enters. A clear navigable channel of floating shrine-buoys burns with steady grave-candles. One passage barge glides through the center, visibly and beautifully lit with its own candles — exactly four adult souls aboard and exactly four clearly associated barge candles, one beside each soul. In the dark side margins, two low flat-black ward skiffs quietly count the lights. The count is security. The passage barge must unmistakably be lit; a dark barge would be the wrong image.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, richly detailed physically based materials, believable contemporary-to-near-future working river craft, subtle film grain. Wet black timber, blackened iron, matte ward skiffs, damp bark, tannin water, real candle glass and reflections. No fantasy shrine ornament, no glowing deity, no gothic spectacle, no steampunk, no clean sci-fi chrome.

Composition/framing: low eye-level riverbank or waterline view looking down the lit channel. Keep the central passage barge, all four adult silhouettes, all four associated barge candles, and enough shrine-buoys to explain the lit road inside the central approximately 564-pixel-wide source crop (master x about 555-1117). Ward skiffs may occupy expendable dark side fields but should remain discernible in the full master. No essential information in the bottom 10 percent. Use deep atmospheric perspective and reflections; one continuous cinematic scene, never a montage.

Lighting/mood: true night with rich readable shadow detail. Candle flames are warm white-gold and physically illuminate faces, wet wood, and water; sparse moonless cloud spill only. Gorgeous, radiant, sensual darkness with restrained human dignity — beautiful enough to be the leg's defining night image, never dimmed into murk.

Color palette: Riftgate tannin black and red-brown water, black crepe, wet charcoal, deep rust-red leaves, bone highlights, and abundant but individually legible candle amber/white-gold. Absolutely no violet, purple, magenta, cyan, teal glow, electric blue, or neon.

Constraints: exactly four visible adult passengers on the passage barge and exactly four associated candles on that barge; shrine-buoy candles remain visually separate in the water; two dark ward skiffs in margins; no child; no coffin required; no visible corpse, bones, blood, wounds, explicit gore, apparition, deity, angel, magic aura, unlit central barge, fire spreading beyond lamps, or carnival/festival mood.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, boat names, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark.
```

## quiet-boom

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-5eec7b74-6e4d-4ec9-b98f-6c475ce2eeff.png`
- Installed destination: `apps/web/private/codex-art/regions/quiet-boom.png`
- SHA-256: `18d5332eeb273c6ea63c50fc0ffb51816b52dac193ac0602021c215d144a97b4`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Quiet Boom; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original river-defense outpost. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Quiet Boom — OUTPOST. Show a colossal practical chain boom spanning Riftgate between two severe counterweight houses on opposite banks. The Waterworks machinery has the boom unmistakably RAISED high above the navigable channel, leaving free passage beneath it. A normal candle-lit freight or funeral barge passes calmly under the elevated chain. A very small formal adult garrison stands at measured attention near one counterweight house. The weapon is the fact of the thing, not action: infrastructure as etiquette, raised for everyone, quietly capable of closing the river without warning.

Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real lens logic, richly detailed physically based materials, believable contemporary-to-near-future military-industrial river infrastructure built around ancient unexplained mechanisms, subtle film grain. Monumental worn chain links, blackened iron, counterweight drums, scarred stone, wet timber, rain-dark practical uniforms. No medieval portcullis, no fantasy fortress, no steampunk ornament, no clean sci-fi chrome.

Composition/framing: a strong near-symmetrical river-axis view from slightly above water level. Place the massive raised center span, passing barge, open water beneath, and essential counterweight machinery within the central approximately 564-pixel-wide source crop (master x about 555-1117). The two bank houses can extend into expendable side fields. The narrow crop must still clearly read chain raised plus traffic freely passing underneath. No essential information in the bottom 10 percent. One coherent establishing shot, never a diagram or collage.

Lighting/mood: wet overcast twilight, tannin reflections, sparse candle-warm lamps. Quiet, formal, controlled, and politely threatening. No battle, alarm, panic, or active closure.

Color palette: match Image 1's Riftgate identity — tannin black and red-brown water, rust-red foliage, wet charcoal, bone stone, aged iron and brass, black cloth, sparse candle amber. Absolutely no violet, purple, magenta, cyan, teal glow, or neon.

Constraints: the chain boom is visibly raised and stowed high enough for traffic; it must not touch, block, snag, or threaten the passing barge; a small formal adult garrison only; no weapons firing; no battle damage; no corpse, bones, blood, wounds, explicit gore, child, magical effect, apparition, heraldry, or triumphal ceremony. Ancient machinery remains unexplained and unlabelled.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark.
```

## bonefire-picket

- Generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-558bcfab-c243-4ac7-87e0-05ccf976acfa.png`
- Installed destination: `apps/web/private/codex-art/regions/bonefire-picket.png`
- SHA-256: `598753a05200df05fae315ca87c5672a18f15b0e8ce81b762a1dc8285b04d0ab`

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Bonefire Picket; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Riftgate leg plate. Create a wholly original upstream beacon outpost. Do not copy its specific boats, people, shoreline, or composition.

Primary request: Bonefire Picket — OUTPOST. Show the high wild bend where Riftgate becomes graveyard country. A compact working military picket stands on a dark bluff above the tannin river. Its tall practical beacon burns a powerful, unmistakably WHITE bone-oil flame visible for miles — the last fixed light upstream. Adult keepers feed rendered bone oil into the beacon from plain unmarked black metal canisters and a closed practical fuel reservoir; the trade's scrap is implied by the rendered fuel, never displayed as remains. Below, the dark river bends away toward misty Rift country while a small watch crew studies one distant unidentifiable arrival. The white flame sees it first.

Style/medium: mature AAA grounded cinematic photorealism, premium environment narrative key art, real lens logic, richly detailed physically based materials, believable contemporary-to-near-future frontier watch infrastructure, subtle film grain. Wet stone, blackened steel, practical fuel lines, weathered canvas, dark timber, rain-dark uniforms. No medieval beacon tower, no fantasy brazier, no gothic bone ornament, no steampunk, no clean sci-fi chrome.

Composition/framing: slightly low, three-quarter view that gives the beacon heroic vertical clarity while preserving the river bend and outpost context. Keep the white flame, beacon mechanism, feeding keeper, and watch posture together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). Side fields are expendable wild forest, river bend, perimeter, and distant mist. The narrow crop must clearly read one white fixed flame maintained by people. No essential information in the bottom 10 percent. One coherent establishing shot, never a collage.

Lighting/mood: storm-dark late evening. The bone-oil flame is neutral white to warm white-gold, intense but physically plausible, illuminating wet faces, steel, smoke, and stone without turning blue. Candle-amber practical lights remain subordinate. Vigilant, lonely, dignified, and ominous at the border, without battle or horror spectacle.

Color palette: match Image 1's Riftgate identity — tannin black and red-brown water, rust-red foliage, wet charcoal, bone-grey mist, black steel, aged brass, candle amber, dominated at the focal point by a true white bone-oil flame. Absolutely no violet, purple, magenta, cyan, teal, electric-blue flame, or neon.

Constraints: adults only; one beacon and one white flame; keepers handle sealed rendered fuel, not exposed biological material; no recognizable human or animal remains, skulls, bones, bodies, blood, wounds, explicit gore, child, apparition, deity, magic aura, fire spreading into the outpost, active battle, firing weapon, or identifiable creature/vehicle in the distance. No written log appears.

Zero-text law: no readable text, letters, numbers, words, signs, labels, ledgers, logs, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. All canisters and equipment are blank and unmarked.
```

## QA

- Seven of seven requested assets generated through seven distinct built-in ImageGen calls.
- Every installed file is a 1672x941, sRGB, 8-bit, three-channel PNG with no alpha or embedded ICC profile.
- Every full-resolution render was visually inspected for the director shot, dossier locks, Riftgate palette continuity, center-safe focal action, respectful death-trade treatment, and zero visible readable text or fake script.
- No violet, cyan, explicit gore, exposed remains, children, logos, UI, borders, or watermarks were observed.
- The original generated sources remain in the built-in generated-images directory; the selected files were copied, not moved or rewritten.

### sandgate.md

# SOL 5.6 Riverlands — Sandgate Recovery Ledger

Recovery and QA completed 2026-09-01 after the VS Code restart.

> Prompt provenance note: the exact expanded in-memory execution wording used
> for these seven already-generated plates was lost in the VS Code restart.
> The prompt blocks below are full canonical reconstructions from
> `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md`, the matching live dossier entries,
> the Sandgate/global art laws, and the visible delivered result. They are not
> represented as byte-for-byte copies of the lost runtime strings.

No production asset was regenerated, resampled, edited, or overwritten during
this recovery task. All seven installed finals passed QA.

## Recovery method

- Read the seven director blocks in
  `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md`.
- Reconciled them against the authored entries in
  `apps/web/scripts/author-riverlands-foundation.ts`.
- Verified those authored entries against the live database with:
  `pnpm --filter @habitat/web exec tsx scripts/author-riverlands-foundation.ts`.
  The read-only preview returned database `habitat`, 51 entries, and
  `plan: ["nothing to do"]`; the authored dossier and live dossier therefore
  match.
- Inspected every final at full 1672×941 resolution.
- Extracted and inspected the exact center rectangle `x=554, y=0, w=564,
  h=941`, the directory crop, without writing crop files.
- Re-opened every final with `System.Drawing`; all report 1672×941,
  `Format24bppRgb`, PNG, 96×96 dpi.
- SHA-256 hashed every final and recursively hashed PNGs under
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images`.
  Every final matched one retained generated source byte-for-byte.
- Palette sampling downscaled each plate to 418×235 and counted saturated
  pixels in violet hue 250–320° and cyan hue 165–195°. Every plate returned
  zero high-chroma violet and zero high-chroma cyan samples. Full-frame visual
  inspection separately confirmed no violet grading and no cyan technology,
  glow, or magic.
- Full-frame visual inspection found no readable text, letters, numbers,
  logos, insignia, watermarks, UI, pseudo-writing, or glyph-like marks.
- Safety inspection found no explicit sexual content, child harm, real-world
  hate iconography, graphic gore, or depicted violence.

## Final/source manifest

| Slug | Installed final | Retained generated source | Bytes | SHA-256 |
|---|---|---|---:|---|
| `standing-camp` | `apps/web/private/codex-art/regions/standing-camp.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-33eea11f-41db-4d1e-8e87-0ebf7efe55c0.png` | 3,275,835 | `2834f48519f9ed86c5a44f0e39d17a6db872735e35e0143983415dd27d9abec0` |
| `lastwater` | `apps/web/private/codex-art/regions/lastwater.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-9c4f4ef9-f7b8-4d86-991d-ff0dcf1f9fc3.png` | 2,903,797 | `64ba8a2c6da4653e4634ceb4ab9a71c8484e89f8823e57ef94419c8ed4155a1f` |
| `honest-well` | `apps/web/private/codex-art/regions/honest-well.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-659f2e59-1a8c-4855-9a74-4e58cb071431.png` | 2,872,023 | `77dfc654fca14370625d4ac0d955541082d7e1c42ce9b6e2f4cef848808b3b73` |
| `mirrorwater` | `apps/web/private/codex-art/regions/mirrorwater.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-edb17e79-4464-459d-8dc4-cc3937de0aba.png` | 2,252,355 | `706ca5bdb91b02eadb3ffe54508fd98afa5dbaed41db906dc66105b50634d092` |
| `saltsong` | `apps/web/private/codex-art/regions/saltsong.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0fc949b-2228-4be8-8bf7-595ecec9ced0.png` | 2,567,641 | `743922c8a392c179a524e289691c1d7cd1dc0dabe2d27cd959fdf94a903d8809` |
| `dry-bell` | `apps/web/private/codex-art/regions/dry-bell.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-2e86bf64-f771-479b-a436-18b451b09fa3.png` | 2,147,640 | `1d7aecf728f0ddecac8c8b6801e8f8daaa55a1e0bf513b6ef8abd285c26fb743` |
| `vultures-patience` | `apps/web/private/codex-art/regions/vultures-patience.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0748a4d-ffd2-421b-bba5-b2cc404ae2d6.png` | 2,156,087 | `69fa155d3c2bc67f83684fc8f30f2e4525ca582913f87ddba90ab90643db58a8` |

All source/final pairs above are byte-identical by SHA-256.

## standing-camp

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Standing Camp, the one camp the Desert Nomad Compact never strikes: a fort disguised as impermanence, built in concentric rings of tents and awnings around the active stone Forge-heart that cannot walk.
Scene/backdrop: high oblique view over Sandgate's oasis seam, with living river green and palms meeting bone-and-ochre desert. The camp occupies fixed ground beside the watered corridor while the deep dry country visibly charges at its edges.
Subject and dossier locks: multiple clear rings of tents and awnings; a permanent stone heart at the exact center with restrained warm diegetic Forge light; wells inside the rings; camel lines forming living perimeter walls; keeper and caravan life throughout. The geometry must quietly read as fields of fire to an informed eye. This is the wandering peoples' one fixed point, their assembly ground, headquarters, and hostage to fortune.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real lens logic, lived geography, believable cloth, stone, animals, dust, wear, and subtle film grain.
Composition/framing: wide 16:9, 1672x941. Center the stone Forge-heart and the strongest ring geometry inside the exact central 564px directory crop while the full frame reveals the camel perimeter, river-green seam, and desert scale.
Lighting/mood: warm late-afternoon or early-evening Sandgate light; permanent, capable, communal, and strategically formidable. No battle.
Color palette: hard oasis green against bone sand, ochre dry country, camel brown, sun-warmed canvas, stone, restrained white-gold. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none.
Constraints: no readable letters, numbers, signs, flags, banners, logos, insignia, UI, borders, watermarks, or pseudo-writing; no floating deity or fantasy iconography; Forge glow stays contained and warm; no explicit sexual content, child harm, hate iconography, gore, or active violence.
Avoid: generic temporary bazaar, military parade ground, fantasy nomad camp, neon magic, violet grading, visible written clan marks.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/standing-camp.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-33eea11f-41db-4d1e-8e87-0ebf7efe55c0.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 3,275,835 bytes.
- SHA-256: `2834f48519f9ed86c5a44f0e39d17a6db872735e35e0143983415dd27d9abec0`
- Full frame PASS: concentric tent/awning rings, camel-line walls, inner wells,
  central warm stone heart, river-green oasis on one side and deep desert on
  the other. The apparently temporary camp reads as deliberate fort geometry.
- Exact center crop PASS: retains the glowing stone heart, concentric ring
  structure, inner movement lanes, tents, wells, and camel perimeter depth.
- Text/palette/safety PASS: no text or pseudo-writing; no violet/cyan; warm
  Forge light only; no unsafe content.

## lastwater

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Lastwater, the desert's front desk: the final watering town where every permitted crossing fits out and water is sold openly by weight.
Scene/backdrop: Sandgate's last edge-of-green river town. Watering wharves and boats occupy the river side; caravan yards, shade markets, palms, loaded camels, fodder, cloth, and crossing supplies occupy the desert side; dry mountains and dunes begin immediately beyond.
Subject and dossier locks: adult workers weigh and load sealed water vessels on a practical balance scale; caravans prepare to depart; warehouses and stalls handle salt, relic glass, leather, fodder, and shade cloth. A posted price board must be present but completely blank/unreadable under the zero-text law. The town must feel half river folk, half Compact, wholly practical: an organized, priced, survivable crossing rather than romance or chaos.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real daylight and lens behavior, weathered timber, rope, metal water vessels, dusty cloth, animal tack, lived working wear, subtle film grain.
Composition/framing: wide 16:9, 1672x941, human working-eye viewpoint. Keep the weighing operation, water vessel, Compact worker, and blank price board meaningful inside the exact central 564px crop; full frame must connect wharf, market, camel yard, oasis, and desert.
Lighting/mood: clear practical Sandgate morning or midday; bright, competent, hospitable with arithmetic underneath.
Color palette: oasis green, natural pale sky, bone salt and stone, ochre desert, weathered wood, muted earth, restrained white-gold daylight. No violet, purple, magenta, cyan accent, cyan technology, cyan glow, or cyan magic.
Text: none; the canonical posted price list is represented only by a blank board.
Constraints: no readable letters, numbers, prices, stamps, route papers, signs, logos, insignia, UI, borders, watermarks, or pseudo-writing; all cargo and water containers blank; adult workers only in focal roles; no explicit sexual content, child harm, hate iconography, gore, or violence.
Avoid: fantasy bazaar, modern plastic containers, neon color, written price board, chaotic raid, violet or teal grading.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/lastwater.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-9c4f4ef9-f7b8-4d86-991d-ff0dcf1f9fc3.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,903,797 bytes.
- SHA-256: `64ba8a2c6da4653e4634ceb4ab9a71c8484e89f8823e57ef94419c8ed4155a1f`
- Full frame PASS: watering wharf, working boats, weighed metal water vessel,
  balance scale, shade market, camel yard, packed crossing supplies, oasis
  palms, and desert threshold all read immediately.
- Exact center crop PASS: retains the weight scale, suspended water vessel,
  central outfitter, working yard, and blank price board.
- Text/palette/safety PASS: the price board and all cargo are visibly blank;
  no pseudo-writing, violet, cyan accent, or unsafe content.

## honest-well

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Honest Well at first light: the corridor's one absolute, where two blood-rival parties obey the truce and water in turn, in silence.
Scene/backdrop: a deep sweet-water stone well and its watering rings in open Sandgate dry country, with palms and the narrow oasis seam in the distance and hard mountains surrounding the valley.
Subject and dossier locks: the round stone wellhead is central. Two clearly separate adult parties occupy opposite sides, holding a tense respectful distance. One party's camels drink at the trough while the other waits its turn. Weapons are slung, lowered, or kept sheathed—none drawn or aimed. Posture carries rivalry and vigilance, but the feud pauses absolutely at the wellhead. Tension is held, never spent. The water is clean and unclaimed; no faction owns the center.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real first-light lens behavior, believable stone, animals, cloth, tack, dust, skin, age, and subtle film grain.
Composition/framing: wide 16:9, 1672x941, slightly elevated eye-level establishing view. Keep the complete wellhead and at least one waiting adult from each opposing side inside the exact central 564px crop; full frame shows both rival groups, the watering animals, and the dry-country scale.
Lighting/mood: white-gold first light; solemn, tense, civil, and unbroken. No combat and no melodrama.
Color palette: bone stone, ochre earth, muted brown cloth, camel tan, sparse hard green, white-gold dawn. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none.
Constraints: no readable text, clan marks, letters, numbers, signs, logos, insignia, UI, borders, watermarks, tattoos, or pseudo-writing; no drawn weapons, attack pose, blood, body, execution, child harm, sexual content, or hate iconography.
Avoid: active standoff with weapons raised, battle aftermath, poisoned water, faction banners, fantasy oasis glow, violet grading.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/honest-well.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-659f2e59-1a8c-4855-9a74-4e58cb071431.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,872,023 bytes.
- SHA-256: `77dfc654fca14370625d4ac0d955541082d7e1c42ce9b6e2f4cef848808b3b73`
- Full frame PASS: central sweet-water well; rival groups occupy opposite sides;
  one waters camels while the other waits; no weapon is drawn; first-light
  distance and posture carry the unspent tension.
- Exact center crop PASS: retains the complete well and one waiting figure from
  each rival side, preserving truce, separation, and neutral center.
- Text/palette/safety PASS: no writing or faction mark; no violet/cyan; no
  violence, blood, child harm, hate imagery, or unsafe content.

## mirrorwater

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Mirrorwater at the exact dawn minute: the dead-still oxbow becomes one sheet of white-gold sun-flash, the corridor's truthful navigation mark.
Scene/backdrop: high oblique view over a still Sandgate oxbow. A quiet low village and reed margins sit at the near edge; palms line the far bank; bone-and-ochre desert and a far ridge surround the oasis seam.
Subject and dossier locks: unbroken water dominates the frame and carries a precise bright dawn flash visible from the ridge. The village is hushed at the margins. Salt ibis stand motionless in the shallows without visible disturbance. A caravan on the far ridge steers toward the light. From first grey to full sun there are no boats, washing, nets, thrown stones, swimmers, wakes, or ripples; nothing breaks the surface. Stillness is law because stillness is navigation.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real dawn exposure, faithful reflection, subtle atmospheric depth, believable water, reeds, adobe, palms, desert, and film grain.
Composition/framing: wide 16:9, 1672x941. Place the vertical sun-flash and clean unbroken water inside the exact central 564px crop, with a quiet village margin also retained there. Full frame reveals the motionless ibis and far-ridge caravan.
Lighting/mood: radiant white-gold dawn at full Riverlands weight; gorgeous, truthful, hushed, and practical rather than mystical.
Color palette: white-gold flash, warm sky, still bronze water, hard oasis green, bone adobe, ochre desert. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none.
Constraints: no readable text, signs, banners, logos, insignia, UI, borders, watermarks, or pseudo-writing; absolutely no object or action breaking the water; no false second light, magic beam, violence, sexual content, child harm, or hate iconography.
Avoid: boats, swimmers, obvious ripples, storm weather, fantasy portal, overexposed abstraction, violet or cyan grade.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/mirrorwater.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-edb17e79-4464-459d-8dc4-cc3937de0aba.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,252,355 bytes.
- SHA-256: `706ca5bdb91b02eadb3ffe54508fd98afa5dbaed41db906dc66105b50634d092`
- Full frame PASS: unbroken oxbow, exact vertical dawn flash, hushed village
  margin, motionless salt ibis, oasis seam, and far-ridge caravan all present.
  No boat, wake, washing, net, swimmer, thrown object, or broken surface.
- Exact center crop PASS: the directory view is built around the uninterrupted
  dawn flash and retains quiet village roofs and green margin.
- Text/palette/safety PASS: no text or pseudo-writing; no violet/cyan; no unsafe
  content.

## saltsong

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Saltsong at dusk: tuned terraced evaporation pans crack and ring as an experienced keeper grades the harvest by ear.
Scene/backdrop: broad salt terraces step down toward Sandgate's river, bordered by hard oasis green, a practical mud-stone town, palms, and bone-and-ochre mountains.
Subject and dossier locks: cracked salt crusts form clear tuned pan geometry. An adult pan-keeper walks the terrace with head tilted and hand cupped to listen, not posing. Other adult workers lift and load clean salt blocks onto a small cart below. Salt is the corridor's coin and the place must read as a working mint whose honesty matters. The blocks are canonically stamped, but all stamp faces are turned away, blank at this distance, or completely unreadable; no pseudo-writing is permitted.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real low-sun lens behavior, believable salt crystals, brine, stone, cloth, hand tools, animal tack, dust, wear, and subtle film grain.
Composition/framing: wide 16:9, 1672x941. Keep the listening keeper, cracked pan seams, and active loading equipment inside the exact central 564px crop; full frame establishes the scale of the terraces, workers, blocks, river corridor, and town.
Lighting/mood: warm dusk when the day's heat lets go; attentive, skilled, economically vital, and quietly musical.
Color palette: salt white, bone, ochre, warm clay, muted brown cloth, sparse oasis green, copper-white-gold dusk. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none.
Constraints: no readable stamp, glyph, letters, numbers, price, sign, logo, insignia, UI, border, watermark, or pseudo-writing; blocks remain blank to camera; no floating sound effects, fantasy notes, violence, sexual content, child harm, or hate iconography.
Avoid: fantasy crystal mine, glowing salt, musical notation, printed blocks, violet grading, neon cyan brine.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/saltsong.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0fc949b-2228-4be8-8bf7-595ecec9ced0.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,567,641 bytes.
- SHA-256: `743922c8a392c179a524e289691c1d7cd1dc0dabe2d27cd959fdf94a903d8809`
- Full frame PASS: tuned terrace geometry and cracked salt crusts dominate;
  the keeper is mid-path with head tilted and hand to ear; adult workers load
  clean blocks onto a cart; town, palms, and corridor complete the mint.
- Exact center crop PASS: retains the listening keeper at full figure, tuned
  pan seams, working pump edge, and dusk context.
- Text/palette/safety PASS: blocks and equipment show no stamp, glyph, or
  pseudo-writing; no violet/cyan; no unsafe content.

## dry-bell

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Dry Bell at dusk: the corridor's stone bell tower turns an overdue caravan into a count—one strike per missing day, per caravan.
Scene/backdrop: a spare dry-stone bell arch on the dune line above vast empty Sandgate desert, with the last small green oasis far below and mountain silhouettes under a weathered dusk sky.
Subject and dossier locks: one large service-worn bell hangs in the stone arch. An adult keeper stands at the rope during a measured strike. Below, the duty log lies open on a stone stand, but both pages are completely blank and contain no ruled lines, marks, or pseudo-writing. Riding tack may wait nearby because the count is a summons, not mourning. The landscape must feel as if the vast emptiness is listening. No overdue caravan or disaster is shown.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real dusk lens logic, believable dry stone, aged bronze, rope, leather, blank paper, wind, sand, wear, and subtle film grain.
Composition/framing: wide 16:9, 1672x941. Place bell, rope keeper, and blank open log inside the exact central 564px crop. Full frame reveals the oasis, dune line, empty reaches, riding gear, and scale of the sound.
Lighting/mood: warm grave dusk, patient rhythm and civic duty; ominous without funeral imagery or visible harm.
Color palette: aged bronze, charcoal weather, bone stone, ochre dunes, dark leather, restrained oasis green, amber-white-gold sunset. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none; the open log is entirely blank.
Constraints: no readable writing, tally, ruled line, number, letter, bell inscription, decorative glyph, sign, logo, insignia, UI, border, watermark, or pseudo-writing; no funeral, corpse, visible missing caravan, gore, sexual content, child harm, or hate iconography.
Avoid: church service, funeral toll, fantasy bell magic, visible sound waves, written ledger, violet or teal grade.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/dry-bell.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-2e86bf64-f771-479b-a436-18b451b09fa3.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,147,640 bytes.
- SHA-256: `1d7aecf728f0ddecac8c8b6801e8f8daaa55a1e0bf513b6ef8abd285c26fb743`
- Full frame PASS: stone bell arch, aged bell, keeper holding the rope, fully
  blank open log, waiting tack, last oasis, and immense empty desert at dusk.
  No caravan, casualty, funeral, or disaster is depicted.
- Exact center crop PASS: retains the bell, rope, keeper, blank two-page log,
  tower stone, and listening desert.
- Text/palette/safety PASS: pages are blank; bell ornament is non-glyph
  material detail; no pseudo-writing, violet/cyan, or unsafe content.

## vultures-patience

### Canonical reconstructed prompt

~~~text
Use case: stylized-concept
Asset type: Riverlands REGION codex plate
Primary request: Vulture's Patience, the corridor's last eye: old keepers on a dry-stone watch at the final ridge, waiting and counting what the deep-desert sky honestly reports.
Scene/backdrop: a dry-stone observation post on Sandgate's last ridge overlooking immense bone-and-ochre interior dunes; the narrow green river corridor falls away behind and to one side; remote dust or smoke reads only as weather far beyond help.
Subject and dossier locks: two old adult keepers, never young scouts—one uses a long practical spotting scope on a tripod while the other shades their eyes and glasses the horizon. High and far out, a wheeling column of vultures marks an event too distant to reach. The post does not patrol, pursue, or hurry. Patience, age, and judgment are the architecture. No victim, body, battle, wreck, or detailed disaster is visible.
Style/medium: mature AAA grounded cinematic photorealism, premium environment key art, real long-distance atmospheric perspective, believable aged faces, wool and leather, brass optics, dry stone, dust, heat, wear, and subtle film grain.
Composition/framing: wide 16:9, 1672x941, from just behind the watchers. Keep one old keeper, the spotting scope, stone parapet, and open deep desert inside the exact central 564px crop. Full frame must retain the second watcher, oasis seam, remote plume, and wheeling vultures.
Lighting/mood: late white-gold Sandgate light; watch, wait, count. Remote disasters are legible as weather and too far to help.
Color palette: bone stone, ochre dunes, weathered brown and charcoal cloth, aged brass, restrained green seam, pale white-gold sky. No violet, purple, magenta, cyan technology, cyan glow, or cyan magic.
Text: none.
Constraints: no readable log, letters, numbers, marks, signs, logos, insignia, UI, border, watermark, or pseudo-writing; no close disaster, corpse, blood, combat, pursuit, sexual content, child harm, or hate iconography.
Avoid: heroic rescue launch, armed patrol, young glamorous scouts, close carrion, visible bodies, fantasy omen, violet or cyan grading.
~~~

### Metadata and QA

- Final: `apps/web/private/codex-art/regions/vultures-patience.png`
- Source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-2a7c-7282-bb9d-779f96e6e1a7\exec-b0748a4d-ffd2-421b-bba5-b2cc404ae2d6.png`
- Metadata: 1672×941, RGB24 PNG, 96×96 dpi, 2,156,087 bytes.
- SHA-256: `69fa155d3c2bc67f83684fc8f30f2e4525ca582913f87ddba90ab90643db58a8`
- Full frame PASS: two visibly old keepers occupy the dry-stone last watch;
  one uses a long scope, one shades their eyes; the green corridor falls away,
  a remote plume reads as weather, and a wheeling vulture column is high over
  the interior. No disaster detail or victim is visible.
- Exact center crop PASS: retains the old scope keeper, complete tripod,
  parapet, far horizon, deep desert, and the posture of patient observation.
  The second keeper and vulture column remain deliberate full-frame context;
  the crop's key subject is the watcher and instrument.
- Text/palette/safety PASS: no text or pseudo-writing; no violet/cyan; no close
  harm, gore, or unsafe content.

## Final disposition

- QA result: seven of seven PASS.
- Production changes: none.
- Regeneration: none.
- Definite QA failures: none.
- Retained-source recovery: seven of seven exact SHA-256 matches.
- Ledger-only change:
  `tmp/riverlands-ledger/sandgate.md`.

### stormgate.md

# Stormgate child region art generation record

Generated 2026-09-01 with the built-in ImageGen path. Each accepted plate uses apps/web/private/codex-art/regions/stormgate.png as a style, palette, material, weather, and crop reference only. Superseded attempts, if any, are recorded with their accepted asset.

## regulator-station

- Status: accepted on first attempt
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-bb1d3c82-1f51-4eaa-abe7-83d118cfd970.png
- Installed destination: apps/web/private/codex-art/regions/regulator-station.png
- SHA-256: 20a17031ab36c9b4eb42f5decee756bfc3b7d0a4974e4da373c751451784da46
- Superseded attempts: none

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Regulator Station; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original pylon fortress. Do not copy its exact pylon arrangement, river course, mountains, shoreline, or composition.

Primary request: Regulator Station — THE PYLON FORTRESS. Show the severe working fortress wrapped around Stormgate's enormous master stabilization pylon beside an unnaturally obedient mirror-flat river. The architecture must visibly read as two eras arguing: polished contemporary-to-near-future Meridian instrument halls and calibration floors have been built over, through, and around massive courses of much OLDER weathered stone, builder unexplained. Practical Iron Saints wall guns and guarded firing positions sit on the outer ramparts, unmarked and disciplined, protecting researchers and permanent technical staff. The modern research structure should feel precise and expensive; the ancient foundation should feel load-bearing, undeniable, and never decoded.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental key art, real lens logic, physically based architecture and machinery, volumetric storm weather, lived working infrastructure, subtle film grain. Wet old stone, dark poured concrete, brushed steel, rain glass, cables, maintenance gantries, aged iron. No fantasy fortress, no gothic spectacle, no steampunk ornament, no clean sci-fi chrome.

Composition/framing: wide establishing view from slightly across and above the held river. Keep the master pylon, the seam between modern research halls and older stone courses, at least one clearly practical wall-gun position, and the mirror-flat obedient river together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The complete thesis must survive a narrow portrait-like center crop. Side fields are expendable ramparts, bank, storm, and secondary infrastructure. No essential information in the bottom 10 percent. One coherent fortress, never a collage or cutaway.

Lighting/mood: cold storm-blue late afternoon with restrained warm interior work light; the horizon is violent but the water at the Station is uncannily still. Polished institutional seriousness over deep unanswered age. Calm against nature, not peaceful.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue and wet grey, charcoal cloud, bone stone, muted earth and rust, restrained warm windows. Cyan is permitted only as a few tiny contained indicator lights physically mounted on the master-pylon hardware. No cyan atmosphere or magical glow. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: one dominant master pylon; modern research architecture visibly wraps older stone rather than replacing it; older courses remain unexplained; adults only; guns are static practical defensive emplacements, not firing; no battle, explosion, corpse, gore, heraldry, magical aura, floating structure, exposed archive, readable instrument display, Soul Forge depiction, or faction logo.

Zero-text law: no readable text, letters, numbers, words, signs, labels, forms, diagrams, screens, calibration marks, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. All visible displays are dark, abstract, or too soft to read; every surface is unmarked.
~~~

## needles-eye

- Status: accepted on first attempt
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-2814a783-31e1-48e7-a940-e19927269d18.png
- Installed destination: apps/web/private/codex-art/regions/needles-eye.png
- SHA-256: a1e367cc3d2457334261e8da849ed87f5c64e1de318af31d006998cf9a398762
- Superseded attempts: none

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Needle's Eye; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original twin-bank chokepoint town. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Needle's Eye — THE PINCH. Show the narrowest pair of Stormgate stabilization pylons closing around one practical freight hull that is threading the mirror-flat gap with only hand-spans to spare on both sides. A weathered pilots' guild hall bridges the water directly above the pinch, built into the two bank towns. Several waiting hulls queue in disciplined single file beyond. On the threading hull, an experienced adult pilot braces at the tiller with rolled sleeves: both forearms carry dense repeated needle-shaped tattoo strokes, layered into nearly solid unreadable black ink past the elbows, a record of hundreds of successful threadings. Through the guild hall's open lower gallery, a compact wall of blank mechanical dials is visibly being watched by adult guild tenders, the town's own answer to Gaugetown.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based water, architecture, vessel, and machinery, volumetric storm weather, subtle film grain. Wet concrete pylons, old timber guild structure, worn iron, dark hull paint, rain clothing, aged brass dial bezels. No fantasy bridge, no steampunk ornament, no clean sci-fi chrome, no daredevil-action exaggeration.

Composition/framing: slightly elevated three-quarter view aligned down the pinch. Keep the complete narrow pylon pair, the threading hull and tiny clearances, the pilot's tattooed forearms, the overhead guild hall, and a readable glimpse of its dial wall together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The narrow crop must independently communicate expert threading through one unavoidable gap. Side fields are expendable stacked town buildings, queue extensions, riverbanks, and storm. No essential information in the bottom 10 percent. One coherent instant, never a collage or cutaway.

Lighting/mood: cold storm-blue overcast with restrained warm guild-hall work lights. Precise, tense, practiced, and communal rather than panicked. The water is uncannily glass-flat even where the hull should disturb it, emphasizing that the live current is hidden below.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue and wet grey, charcoal cloud, bone concrete, muted earth and rust, dark ink, restrained amber windows. Cyan is permitted only as a few tiny contained indicator lights physically mounted on the pylon hardware. No cyan atmosphere or field glow. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: exactly one pylon pair defines the tight gap; exactly one hull is inside the gap; queued hulls wait, never overlap or collide; adults only; forearm tattoos are abstract repeated straight needle strokes with no letters, numbers, words, symbols, runes, faces, or logos; dial faces contain pointers but no numbers, units, or markings; no crash, damage, wake, splash, firing weapon, battle, corpse, gore, magical aura, floating structure, guild insignia, or visible license document.

Zero-text law: no readable text, letters, numbers, words, signs, labels, papers, licenses, boat names, registration marks, gauge numerals, named scales, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Tattoos and every equipment surface remain entirely nonlinguistic and unmarked.
~~~


## glasscalm

- Status: accepted on first attempt
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-2fa09f13-11cb-4f1d-83a0-6025dc47cf29.png
- Installed destination: apps/web/private/codex-art/regions/glasscalm.png
- SHA-256: fb1ff4de5efc6825c73f2d5db5cb657fe8f9fe02cc7643dafce334ad111099d1
- Superseded attempts: none

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Glasscalm; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original village crossing. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Glasscalm — THE WHISPER CROSSING. Show the flattest water in the world taking the storm-blue sky like a flawless dark plate. A single low working ferry is mid-crossing with a small adult crew and passengers visibly quiet: restrained postures, closed mouths, no conversation or gesture. Two long oars are paused with their blades feathered flat just above the surface, making no splash. The ferry, every person, both oars, the sky, and the banks have an EXACTLY faithful undistorted mirror reflection directly below them. Trees and tall reeds on BOTH banks bend and move visibly in a real crosswind while the river surface remains impossibly unrippled. The calm must feel like attention, not absence; full freight current is implied beneath a surface that refuses to show it.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental key art, real lens logic, physically based water and materials, volumetric storm weather, lived working river geography, subtle film grain. Weathered ferry timber, dark iron fittings, practical rain clothing, wet reeds, wind-tossed branches. No fantasy glow, surreal collage, painterly abstraction, or clean sci-fi chrome.

Composition/framing: wide low eye-level view almost at water height, one coherent landscape. Place the entire ferry, all adult figures, feathered oars, and their complete faithful reflection inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The narrow crop must independently read silent crossing plus perfect mirror water. Frame enough of both banks higher in the scene to show vegetation moving in wind, but treat distant side fields as expendable. No essential information in the bottom 10 percent. Symmetrical stillness without looking diagrammatic.

Lighting/mood: storm-blue overcast daylight with a pale break in the cloud reflected exactly in the river. Beautiful, hushed, watchful, and deeply unsettling without threat or spectacle. The people are calm professionals, not frightened or mournful.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue, wet grey, charcoal cloud, bone gravel, muted bank green and earth, restrained rust. Cyan is permitted only as one or two tiny contained indicator lights on distant physical pylon hardware, if present at all. Absolutely no violet, purple, magenta, cyan atmosphere, teal glow, or neon.

Constraints: one ferry only; adults only; two oars feathered and not touching the water; no wake, ripple, splash, rain impact, fog obscuring the reflection, extra reflected object, missing reflection, distorted reflection, talking pose, raised hand, weapon, battle, corpse, gore, magical apparition, floating object, impossible duplicated person, or signage.

Zero-text law: no readable text, letters, numbers, words, signs, labels, papers, tickets, boat names, registration marks, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Ferry, clothing, equipment, and shore structures are completely unmarked.
~~~


## gaugetown

- Status: accepted on second attempt
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-6ccf613b-0a5f-4d26-ab79-b9baceeeaae3.png
- Installed destination: apps/web/private/codex-art/regions/gaugetown.png
- SHA-256: 55d69c979c1d97df0f138491d92c3f68c7e415d71896c7b537e9b6629a9670f7
- Superseded attempt 1: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0b-18d4-7082-9e8d-df772f760459\exec-16ac0533-aa7a-48e4-980f-26c34479dc12.png
- Superseded QA reason: label-like details appeared on equipment and the household-gauge evidence was pushed too far from the protected crop. The accepted retry removed those label-like details and centered the communal dial-reading action; two distinct household gauges remain clearly established in the full plate.

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Gaugetown; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original corridor service town. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Gaugetown — THE TOWN THAT READS. Show Stormgate's lived-in service town of pilot houses, instrument workshops, maintenance families, and river tenders, centered on a warm old taproom whose entire back wall is a dense bank of ancient UNLABELED mechanical dials and needles older than the room itself. Several practical adult locals study the needles together with the absorbed instinct of people reading weather, trusting their communal instruments over distant official authority. Immediately beside the taproom, two separate close neighboring housefronts each display their own small cherished physical gauge beside a window, visibly establishing that every household keeps one. The unnaturally mirror-flat held river and pylon corridor appear beyond the short wet lane.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based materials, volumetric weather, lived contemporary-to-near-future river infrastructure, subtle film grain. Worn timber, wet brick, repaired plaster, blank aged ivory dial faces, brass bezels, dark iron, fogged glass, patched practical clothing. No fantasy village, no steampunk excess, no quaint storybook treatment, no clean sci-fi chrome.

Composition/framing: one coherent eye-level view from just across a narrow lane, never a split panel or collage. Frame a little farther back than an interior scene. Inside the central approximately 564-pixel-wide source crop (master x about 555-1117), place the open taproom, its old dial wall and adult readers, plus the doorjambs or windows of TWO immediately adjacent homes and each home's separate little gauge. The protected crop must clearly read communal dial wall plus household gauges. A sliver of the glass-calm river may recede through the lane behind. Side fields are expendable workshops, additional homes, storm sky, and secondary infrastructure. No essential information in the bottom 10 percent.

Lighting/mood: warm amber domestic and workshop light against a storm-blue wet afternoon outside. Honest, communal, practical warmth carrying an undertone of corridor strangeness. This is civic religion expressed as habit, not literal worship or caricature.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue and wet grey, charcoal cloud, muted earth, aged brass, worn timber, restrained amber windows. Cyan is permitted only as extremely tiny contained lights on distant physical pylon hardware, if visible at all. Absolutely no violet, purple, magenta, cyan atmosphere, teal glow, or neon.

Constraints: adults only; the taproom dial wall is mechanical, old, dense, and clearly older than the room; exactly two immediately adjacent homes visibly carry separate household gauges; every dial face is entirely blank ivory or black material with a simple pointer only — NO numerals, NO letters, NO tick marks, NO units, NO symbols, NO colored labels, NO blue stickers, and NO label-shaped equipment details anywhere. No priest, altar, prayer pose, occult rite, buying scene, official delegation, glowing magic, weapon display, battle, corpse, gore, or faction insignia.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, menus, price boards, gauge numerals, graduations, named scales, forms, papers, posters, stickers, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every visible surface is plain and unmarked.
~~~


## farflicker

- Status: accepted on second attempt
- Reference source: apps/web/private/codex-art/regions/stormgate.png
- Attempt 1 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-ded1bc21-d878-4133-a6b2-c7b8dd6a26af.png
- Attempt 1 source metadata: 1672x941 RGB24 PNG
- Attempt 1 SHA-256: 6e5ede67eee3fdf897e4a91fd345fa782eaebe8f928d35d9dd18d216d2590e28
- Attempt 1 QA: superseded. The scene correctly established cheerful supervised skipping, varied warm lamp intensity, the iron-shuttered recording house, mirror water, and Stormgate pylons, but the play area was too close to an unguarded river edge and a loose lantern sat beside the rope. That failed the explicit complete-child-safety lock.
- Accepted source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-565ac942-809b-4196-bb0c-4f98d4d8b26a.png
- Accepted source metadata: 1672x941 RGB24 PNG
- Accepted source SHA-256: 54d99739db2839c1f6e521033fe3399426b004a7e1239649645771c8f130ed68
- Installed destination: apps/web/private/codex-art/regions/farflicker.png
- Installed SHA-256: 54d99739db2839c1f6e521033fe3399426b004a7e1239649645771c8f130ed68
- Final QA: full plate and exact x=554, width=564 center crop inspected. Cheerful fully clothed children, one ordinary rope, relaxed adult supervision, varied ordinary amber lamps, and the blank iron-shuttered recording house remain legible. The game now occupies a broad level courtyard separated from the river by a continuous stone parapet and close-set iron railing; no loose lamp, water access, machinery, weapon, traffic, fire, ledge, or other danger enters the play space. Storm-blue/wet-grey/charcoal/bone/rust identity holds; cyan appears only as tiny contained distant pylon indicators; no violet, purple, magenta, cyan atmosphere, or neon is visible. No readable text or fake script was found. Accepted.

### Exact prompt — attempt 1

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Farflicker; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original edge village. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Farflicker — THE LAST LIGHTS. At blue dusk, show the last cheerful domestic village on Stormgate before pylons and then the Magic-Torn Wasteland. Every ordinary warm lamp is caught at a different phase of an unsettling stutter: street lamps, cottage windows, hand lanterns, and one bright kitchen lamp form irregular changes of intensity a viewer can almost interpret but can never decode. In a broad safe courtyard immediately outside that kitchen, a small group of cheerful, laughing, fully clothed village children skip rope in time with the kitchen lamp while a relaxed adult guardian watches nearby. Their game is completely harmless, supervised, joyful, and safe. Apart from the warm homes stands Meridian's severe recording house with its iron shutters closed, blank and unmarked. Beyond it, the held river remains mirror-flat and the final pylon corridor recedes toward violent storm country.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based architecture, water, and practical lamps, volumetric blue-dusk weather, lived contemporary river village, subtle film grain. Wet stone, worn timber, dark iron shutters, practical wool and rain clothing, warm glass lamps. No fantasy village, gothic horror, supernatural apparition, painterly abstraction, steampunk ornament, or clean sci-fi chrome.

Composition/framing: one coherent eye-level village scene, never a collage. Keep the complete skipping-rope game, the bright kitchen lamp, several differently bright street and window lamps, and the iron-shuttered recording house together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The narrow crop must independently read cheerful domestic life under wrong patterned lamplight. Place the recording house slightly behind the children but still unmistakable and fully visible. Side fields are expendable cottages, final pylons, mirror water, and storm horizon. No essential information in the bottom 10 percent.

Lighting/mood: held-calm storm-blue dusk with warm amber domestic lamps at visibly unequal intensities. Cheerful, intimate, ordinary, and deeply wrong only because the lights seem to listen. The children are happy and safe; absolutely no fear, menace directed at them, or peril.

Color palette: match Image 1's Stormgate identity — storm blue and wet grey, charcoal cloud, mirror water, bone stone, muted earth and rust, restrained warm amber lamps. Cyan is permitted only as one or two tiny contained indicator lights physically mounted on distant pylon hardware, if visible at all. No cyan lamps, cyan atmosphere, teal glow, or magical field light. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: cheerful children skipping one ordinary rope on spacious level ground; fully clothed; relaxed adult supervision; no child near water, traffic, machinery, weapon, edge, fire, storm hazard, or any source of danger; no harm, threat, fear, injury, distress, or ominous figure near children. The lamp pattern is conveyed only by irregular brightness across normal lamps, never by symbols, projected marks, beams, or readable sequencing. Recording-house shutters are iron, closed, blank, and separate from the homes. No decoded rhyme, visible transcript, paper, instrument log, battle, corpse, gore, magical aura, floating object, faction insignia, or Wasteland creature.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, posters, papers, rhymes, sequences, lamp-shaped symbols, house numbers, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Clothing, buildings, lamps, equipment, and shutters are completely unmarked.
~~~

### Exact prompt — attempt 2, accepted safety correction

~~~text
Use case: precise-object-edit
Asset type: QA correction for the final Farflicker REGION dossier plate; preserve the same wide cinematic composition and grounded Stormgate production look.

Input images: Image 1 is the FARFLICKER EDIT TARGET. Image 2 is the delivered STORMGATE STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only.

Primary request: Correct only the safety design around the cheerful skipping-rope game. Move the entire game and supervising adult into a broad, level, clearly enclosed inland stone courtyard at least several body-lengths away from the river. Put a continuous sturdy waist-high stone parapet with close-set plain iron railings across the entire accessible river edge, with no opening anywhere near the children. Remove the loose ground lantern beside the rope; all lamps near the play space must be securely wall-mounted or high on fixed posts well outside the rope's arc. Keep the children laughing, fully clothed, supervised, and visibly relaxed. Preserve the bright kitchen lamp, irregular warm lamp intensities, iron-shuttered recording house, mirror-flat held river, distant pylon corridor, blue-dusk storm, and all other successful narrative content.

Composition/framing: keep the complete safe rope game, guardian, bright kitchen lamp, varied street and window lamps, and iron-shuttered recording house inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The safe courtyard and continuous barrier must be visually undeniable. No essential information in the bottom 10 percent.

Lighting/mood: preserve held-calm storm-blue dusk and restrained warm amber domestic lamps. Cheerful, intimate, ordinary, and wrong only because of the light pattern. Absolutely no fear, peril, threat, or menace directed at the children.

Color palette: preserve Stormgate storm blue, wet grey, charcoal, mirror water, bone stone, muted earth and rust, and restrained amber. Cyan only as tiny contained distant pylon indicators. Absolutely no violet, purple, magenta, cyan atmosphere, teal glow, neon, or saturated fantasy color.

Constraints: change the safety layout as specified; preserve everything else. Spacious level play ground; relaxed adult supervision; no child near water, traffic, machinery, weapon, edge, fire, storm hazard, or danger. No loose lantern, brazier, puddle obstacle, chain, cable, debris, or trip hazard within or beside the rope game. No harm, threat, fear, injury, or distress. No new people, signs, symbols, papers, creatures, weapons, or magical effects.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, posters, papers, rhymes, sequences, lamp-shaped symbols, house numbers, stencils, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every surface remains plain and unmarked.
~~~

## breakline

- Status: accepted on fourth attempt
- Reference source: apps/web/private/codex-art/regions/stormgate.png
- Attempt 1 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-7795f124-03f0-42b4-bb2d-8d0c1f44d8ab.png
- Attempt 1 source metadata: 1672x941 RGB24 PNG
- Attempt 1 SHA-256: 7167ddb85ea45872ddc08c4ef8f5f48ca48ac265da6b0afa54e3b682a4325532
- Attempt 1 QA: superseded. It established the active edge, mirror-to-released-water transition, sandbags, huts, and short-rotation adults, but the abandoned works read as a broad ruined corridor of upright pylons rather than two prior footing lines. A small equipment patch also risked label-like detail.
- Attempt 2 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-dcc4afb7-38e5-4cb1-a262-d0c6a06272fb.png
- Attempt 2 source metadata: 1672x941 RGB24 PNG
- Attempt 2 SHA-256: 17bb3cccc061718fe48c05b5a0c3339b32e15401b0d61bdcf48b393dff044915
- Attempt 2 QA: superseded. The old works became low inert footings and label-shaped color was removed, but the exact center crop cut most of the active pylon and made the two former positions less decisive than required.
- Attempt 3 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-e1c04511-a122-4645-83ed-ea700a876f37.png
- Attempt 3 source metadata: 1672x941 RGB24 PNG
- Attempt 3 SHA-256: b1a5d9392198d11797682a7271982a6dd004fe2df407fb7d792b322631d5c273
- Attempt 3 QA: superseded only for palette. The axial composition put one complete active pylon, sandbag line, blank hut, adults, calm-to-rough transition, and exactly two visually separated former footing rows inside the protected crop. The generated old rows contain two visible footings apiece rather than the prompt augmentation's requested three; stump count is not a director/dossier lock, while the canon requirement of exactly two inward moves is clear. A large cyan upper-hardware panel violated the tiny-contained-cyan rule and required correction.
- Accepted source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-73d171dd-2ee5-49d2-9e99-bde41087fa3a.png
- Accepted source metadata: 1672x941 RGB24 PNG
- Accepted source SHA-256: 12c59b9e611ef18dd238f41762ff216e28fd3a0e95fbc20a9df835f66f3eaba6
- Installed destination: apps/web/private/codex-art/regions/breakline.png
- Installed SHA-256: 12c59b9e611ef18dd238f41762ff216e28fd3a0e95fbc20a9df835f66f3eaba6
- Final QA: full plate and exact x=554, width=564 center crop inspected. The complete active pylon, sandbags, low blank instrument hut, disciplined adults, mirror-flat near water, rough released water, and two distinct old footing rows all survive the protected crop. There are exactly two visible former positions and no extra ruin field; their low dead foundations communicate the two inward moves without text or a retreat scene. The large cyan panel is gone; only one bolt-sized contained indicator remains, with no cast light or atmospheric tint. Storm-blue/wet-grey/charcoal/bone/mud/rust identity holds; no violet, purple, magenta, cyan atmosphere, or neon is visible. No readable text or fake script was found. Accepted.

### Exact prompt — attempt 1

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Breakline; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original stabilization-edge outpost. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Breakline — OUTPOST AT THE TRUE EDGE. Show the exact place where Stormgate's engineered calm ends. On the near side, one final active bank pylon and its stabilization hardware hold the river mirror-flat beside low instrument huts protected by damp sandbags. A small short-rotation garrison of disciplined adult Iron Saints and Meridian instrument crews works quietly at the line in practical weather gear, never posing. Immediately beyond the active hardware, the river and country resume the Magic-Torn Wasteland's unstable opinion: the water loses its impossible glass calm, rain angles strangely, and weathered terrain looks subtly physically wrong without becoming fantasy spectacle. Two distinct abandoned former line positions are visible farther out as separate staggered rows of empty massive pylon footings, both on the Wasteland side of the present sandbags, making two inward moves undeniable without any written explanation.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based concrete, sandbags, machinery, water, and weather, contemporary-to-near-future working outpost, subtle film grain. Wet bone concrete, dark steel, muddy fabric sandbags, patched instrument huts, practical rain clothing, rusted abandoned anchor bolts. No fantasy battlefield, post-apocalyptic ruin porn, steampunk ornament, magical portal, or clean sci-fi chrome.

Composition/framing: wide slightly elevated three-quarter view looking from the held side across the present line into open Wasteland country. Keep the final active pylon hardware, sandbagged instrument huts, a few adult workers, the visible transition from mirror water to released water, and clear portions of BOTH separate abandoned footing rows together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The narrow crop must independently tell present edge plus two prior positions farther out. Side fields are expendable held river, additional sandbags, storm, and empty bad country. No essential information in the bottom 10 percent. One coherent landscape, never a diagram, split panel, or cutaway.

Lighting/mood: held-calm storm-blue late afternoon under a low charcoal front. Cold, professional, attritional, and controlled. The garrison is not under attack; the dread comes from disciplined infrastructure conceding ground to geography.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue and wet grey, charcoal cloud, bone concrete, muted mud, earth, and rust. Cyan is permitted only as a few tiny contained indicator lights physically mounted on the FINAL ACTIVE pylon hardware. The abandoned footings are dark and dead with no light. No cyan atmosphere, beam, field, or Wasteland glow. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: exactly one visibly active final pylon assembly at the current line; exactly two visually distinct former line positions represented by abandoned concrete footings beyond it; both former rows are empty, inert, and clearly older; the line has moved inward toward the held country. Adults only. No retreating action, panic, active battle, firing weapon, explosion, corpse, gore, body horror, Wasteland creature, magical aura, portal, floating terrain, faction logo, readable report, medical form, or heroic flag. Instruments remain closed, abstract, or turned away.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, maps, reports, forms, instrument screens, gauge marks, warning stencils, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. All structures, gear, clothing, sandbags, and equipment are completely unmarked.
~~~

### Exact prompt — attempt 2

~~~text
Use case: precise-object-edit
Asset type: QA correction for the final Breakline REGION dossier plate; preserve the wide cinematic composition and grounded Stormgate production look.

Input images: Image 1 is the BREAKLINE EDIT TARGET. Image 2 is the delivered STORMGATE STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only.

Primary request: Correct the abandoned works beyond the present sandbag line so they read as exactly TWO former stabilization positions, both moved inward. Replace every tall, tower-like, or still-functional structure in the released Wasteland water with exactly two clearly separated transverse rows of LOW, BROKEN, INERT CONCRETE PYLON FOOTINGS: massive truncated foundation stumps no higher than a standing adult, exposed dead anchor bolts, no upper pylon bodies, no gantries, no machinery, no lights. The nearer old row and farther old row must be visibly distinct, parallel echoes of the current edge, with open bad water between them. Preserve the single active final pylon, sandbagged huts, adult garrison, mirror-water-to-released-water transition, storm, and all other successful content. Remove every yellow patch, sticker-like rectangle, label plate, glyph-like mark, or pseudo-text detail from crates, huts, equipment, clothing, and hardware; make all such surfaces plain wet charcoal, bone concrete, or rusted metal.

Composition/framing: keep the single active pylon, present sandbag edge, adult workers, water transition, and clearly visible portions of BOTH low former-footing rows together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The two old rows must remain countable as two and must not merge into a field of ruins. No essential information in the bottom 10 percent.

Lighting/mood: preserve held-calm storm-blue late afternoon, low charcoal weather, cold professional attrition, and no active attack.

Color palette: preserve Stormgate mirror water, storm blue, wet grey, charcoal, bone concrete, mud, earth, and rust. Cyan only as tiny contained lights on the single active pylon. Old footings remain completely dark. Absolutely no violet, purple, magenta, cyan atmosphere, teal glow, neon, or saturated fantasy color.

Constraints: exactly one active final pylon at the present line; exactly two rows of low abandoned foundation stumps beyond it; no additional abandoned pylon rows, standing towers, intact old pylons, or active old hardware. Adults only. No panic, battle, firing, explosion, corpse, gore, creature, portal, magical aura, floating terrain, flag, report, form, map, or exposed readable instrument.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, maps, reports, forms, screens, gauge marks, warning stencils, colored stickers, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every surface must be plain and unmarked.
~~~

### Exact prompt — attempt 3, center-crop reshoot

~~~text
Use case: stylized-concept
Asset type: final center-crop reshoot of the Breakline REGION dossier plate; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original stabilization-edge outpost. Do not copy its exact pylon arrangement, river course, mountains, shoreline, or composition.

Primary request: Breakline — OUTPOST AT THE TRUE EDGE. Compose a clear axial view from the held side looking straight through the present stabilization edge into open Wasteland country. Center one complete final active Stormgate pylon assembly at the current sandbag line, with one low blank instrument hut and a small disciplined adult garrison working at its base. Mirror-flat held water occupies the near side. Immediately beyond the active pylon, released water becomes wind-roughened and rain angles wrong. Farther into that bad water, show exactly TWO prior positions and no others: the nearer former position is one short transverse row of exactly three low broken concrete footing stumps; the farther former position is a second short transverse row of exactly three low broken concrete footing stumps. Wide open water separates current line, nearer old row, and farther old row. Every old stump is inert, truncated below adult height, studded only with dead anchor bolts, and unmistakably not a standing pylon. The two rows visibly echo the current line and make two inward moves legible without any sign or explanation.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based concrete, sandbags, machinery, water, and weather, contemporary-to-near-future working outpost, subtle film grain. Wet bone concrete, dark steel, muddy fabric sandbags, patched hut, practical rain clothing, rusted dead anchor bolts. No fantasy battlefield, post-apocalyptic ruin field, steampunk ornament, magical portal, or clean sci-fi chrome.

Composition/framing: strict axial depth composition built for the narrow directory crop. Inside the central approximately 564-pixel-wide source crop (master x about 555-1117), place the ENTIRE active pylon from base to top, its sandbagged hut and adult crew, the exact transition from mirror-flat to released water, all three nearer-row stumps, and all three farther-row stumps. Stack these elements in depth along the centerline with generous open water between rows. Nothing essential may sit outside the protected crop or in the bottom 10 percent. Side fields are expendable held bank, empty water, storm, and barren terrain. One coherent landscape, never a diagram, split panel, cutaway, or field of ruins.

Lighting/mood: held-calm storm-blue late afternoon under low charcoal weather. Cold, professional, attritional, and controlled. Nobody is retreating or under attack; the dread is the visible arithmetic of ground already conceded.

Color palette: match Image 1's Stormgate identity — mirror water, storm blue and wet grey, charcoal cloud, bone concrete, muted mud, earth, and rust. Cyan is permitted only as a few tiny contained indicator lights physically mounted on the ONE active pylon. All six old footings are completely dark. No cyan atmosphere, beam, field, or Wasteland glow. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: exactly one active current pylon; exactly two former rows beyond it; exactly three low footing stumps per former row, six abandoned stumps total; no other footing, ruin, tower, intact pylon, gantry, or old hardware beyond the line. Adults only. No retreating action, panic, battle, firing, explosion, corpse, gore, body horror, creature, portal, magical aura, floating terrain, flag, report, form, map, or exposed readable instrument. Every box and equipment surface is plain with no colored patch or label-shaped detail.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, maps, reports, forms, screens, gauge marks, warning stencils, colored stickers, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. All structures, gear, clothing, sandbags, and equipment are completely unmarked.
~~~

### Exact prompt — attempt 4, accepted palette correction

~~~text
Use case: precise-object-edit
Asset type: final palette-lock correction for the Breakline REGION dossier plate; preserve the accepted composition.

Input images: Image 1 is the BREAKLINE EDIT TARGET. Image 2 is the delivered STORMGATE STYLE and PALETTE reference only.

Primary request: Change only the cyan hardware lighting on the single active pylon. Replace the large luminous cyan rectangular panel near the upper pylon with plain dark wet metal matching the surrounding housing. Preserve at most TWO tiny contained cyan indicator pinpoints on the active pylon, each no larger than a physical bolt head and each mounted within a dark hardware recess. They must not cast visible light, tint nearby metal, reflect in the water, or read as a screen, lamp, window, field, or energy source. Remove every other cyan or teal pixel from the scene. Preserve the entire axial composition, complete active pylon, sandbags, blank hut, adult crew, mirror-flat near water, rough released water, exactly two visibly separated former footing rows, storm, landscape, framing, and all other successful detail exactly as closely as possible.

Composition/framing: preserve the current wide 1672x941 scene and central approximately 564-pixel-wide protected crop exactly. Do not move, add, remove, resize, or redesign any structure, footing, person, shoreline, or weather feature.

Color palette: held-calm Stormgate storm blue, wet grey, charcoal, bone concrete, muted mud, earth, and rust. Cyan only as the two optional bolt-sized contained pylon indicators described above. Absolutely no violet, purple, magenta, teal glow, neon, or saturated fantasy color.

Constraints: localized cyan-light correction only. No screen, label, symbol, marking, beam, field, aura, magic, or new object.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, screens, gauge marks, warning stencils, colored stickers, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every surface remains plain and unmarked.
~~~

## echo-fence

- Status: accepted on fourth attempt
- Reference source: apps/web/private/codex-art/regions/stormgate.png
- Attempt 1 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-ac002741-168d-4495-ac45-d3c35d1002ed.png
- Attempt 1 source metadata: 1672x941 RGB24 PNG
- Attempt 1 SHA-256: 23a11b3196424bc52ce17afbbc2e1ee3503eb0273a77bfe375ae2c7741573ec0
- Attempt 1 QA: superseded. Passive receive-only resonant posts, sealed bunker, exposed Wasteland flank, and adult keeper were strong, but the center crop separated most of the bunker from the keeper and the earplugs were not legible.
- Attempt 2 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-18a9d7c6-e70b-409b-904d-e4f7a8c7f222.png
- Attempt 2 source metadata: 1591x989 RGB24 PNG
- Attempt 2 SHA-256: 635b27af46d25f34b7563fbf1b875857b6ada6708157ad74e9e234018f302757
- Attempt 2 QA: superseded. The protected crop now held the adult keeper, bunker-door portion, and multiple complete passive posts, but the back/side head angle still hid the regulation plugs.
- Attempt 3 source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-a6e0d3d9-f48b-49d4-bd51-c9ec0b22e298.png
- Attempt 3 source metadata: 1591x989 RGB24 PNG
- Attempt 3 SHA-256: 7c2686d61ca69c4564d30783a9335ae23519fd182f8f0bcf8b6dd580de940b73
- Attempt 3 QA: superseded. Turning the head exposed the near ear while preserving the composition, but the foam plug and safety cord remained too subtle at exact center-crop scale.
- Accepted generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-43241634-cd67-435c-83ab-ed18c1d4c1cc.png
- Accepted generated source metadata: 1591x989 RGB24 PNG
- Accepted generated source SHA-256: 458b9ee19469f6a17b69402bfae1be8d5fe915b613ae2b0d4874247ba8ccad42
- Normalization operation: the accepted generated source was content-preservingly Lanczos-scaled to width 1672, symmetrically center-cropped vertically to 941, and encoded as RGB24 PNG before installation; no generative or local content edit.
- Exact normalization filter: scale=1672:-2:flags=lanczos,crop=1672:941:0:(ih-941)/2,format=rgb24
- Normalized source metadata: 1672x941 RGB24 PNG
- Normalized source SHA-256: 8884f5a6325b35dcd4d502b4814dbd1a8a2a31bb156214ece9ad8d98a7b457bf
- Installed destination: apps/web/private/codex-art/regions/echo-fence.png
- Installed SHA-256: 8884f5a6325b35dcd4d502b4814dbd1a8a2a31bb156214ece9ad8d98a7b457bf
- Final QA: normalized full plate and exact x=554, width=564 center crop inspected. The full adult keeper, exposed near ear with a small matte ochre-rust foam plug and dark cord against the collar, part of the thick sealed bunker door, muddy wire path, and multiple complete resonant receiver posts remain legible. The posts are passive physical receivers: no dishes, emitted beam, wave, rings, glow, outward light, or magic. The bunker stays closed; no transcript, paper, screen, dream image, or interior appears. Storm-blue/wet-grey/charcoal/bone/muted-earth/rust identity holds with no cyan, violet, purple, magenta, teal glow, or neon visible. No readable text or fake script was found. Accepted.

### Exact prompt — attempt 1

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Echo Fence; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original listening outpost. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Echo Fence — THE LISTENING OUTPOST. Show a long line of resonant receiving posts marching along Stormgate's exposed flank toward open Magic-Torn Wasteland country. Each tuned column is a heavy, physically plausible passive acoustic and seismic receiver: weathered bone concrete and dark metal resonator cavities, mechanical diaphragms, and buried cable housings, all silent-looking except for an almost perceptible vibration in rain beads and taut hardware. The posts emit nothing and transmit nothing—no beam, wave, light, broadcast, or energy leaving them. One adult keeper in practical rain gear walks the service path beside the posts wearing clearly visible fitted industrial earplugs connected by a plain cord, posture composed and professionally withdrawn. Immediately behind the keeper, a shielded recording bunker sits half-buried in the bank with one thick closed unmarked door and no visible interior. The mirror-flat held river is glimpsed on the sheltered side; the open Wasteland horizon presses close on the other.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based concrete, metal, soil, rain, and fabric, contemporary-to-near-future field instrumentation, subtle film grain. Wet pitted concrete, tarnished steel resonators, rubber earplugs, buried conduit, muddy path, low armored bunker. No fantasy monoliths, radio-telescope spectacle, steampunk ornament, magical antenna field, gothic ruin, or clean sci-fi chrome.

Composition/framing: wide low three-quarter view along the receiving line. Keep the adult keeper with unmistakable earplugs, at least three complete resonant posts, and the half-buried shielded bunker together inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The narrow crop must independently read a keeper walking a passive listening fence beside a sealed bunker. Posts may continue into expendable side fields and distance. The Wasteland occupies the exposed horizon without hiding the center. No essential information in the bottom 10 percent. One coherent landscape, never a diagram, cutaway, or multi-panel image.

Lighting/mood: held-calm storm-blue overcast with low charcoal cloud and a thin bone-pale break at the remote horizon. Quiet, well paid, disciplined, intimate, and psychologically wrong. The keeper's stillness suggests a custom nobody discusses, without dream imagery or overt horror.

Color palette: match Image 1's Stormgate identity — storm blue and wet grey, charcoal cloud, bone concrete, muted mud, dark metal, restrained rust. Prefer no cyan at all; if distant stabilization hardware appears, cyan is permitted only as one or two tiny contained indicators physically mounted on that hardware. No cyan on the listening posts, no cyan atmosphere, beam, or field. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: receiving-only resonant posts; no outward-facing emitter dishes, transmitter arrays, radiating rings, wave graphics, beams, visible energy, glowing runes, or magical effect. Exactly one primary adult keeper on the wire, wearing real earplugs visibly seated in both ears; no headphones. The bunker is half-buried, armored, closed, and unmarked. No visible transcript, paper, screen, seal document, dream image, sleeping figure, nightmare apparition, weapon display, battle, corpse, gore, creature, faction insignia, or active pylon.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, transcripts, papers, screens, instrument scales, warning stencils, bunker markings, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. All posts, clothing, equipment, cables, and architecture are completely unmarked.
~~~

### Exact prompt — attempt 2

~~~text
Use case: precise-object-edit
Asset type: QA correction for the final Echo Fence REGION dossier plate; preserve the grounded Stormgate production look and wide landscape.

Input images: Image 1 is the ECHO FENCE EDIT TARGET. Image 2 is the delivered STORMGATE STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only.

Primary request: Recompose the same listening outpost so its complete narrative cluster survives the protected center crop. Move the half-buried armored bunker from the far left into the middle ground directly behind and slightly left of the keeper. Place the keeper at the center in a closer three-quarter side view, head turned enough that a pair of small matte bone-colored industrial earplugs and their plain dark connecting cord are unmistakable against the ears and collar; they are real non-electronic hearing protection, not glowing devices and not headphones. Arrange at least three complete medium-height resonant receiving posts immediately behind and to the right of the keeper, all visible in full from base to top. Preserve the longer post line continuing into the distance, mirror-flat river glimpse, exposed Wasteland horizon, sealed bunker door, passive physical design, and all successful weather and material detail. Remove every tiny colored sticker, label plate, glyph-like mark, or pseudo-text detail from post bases and equipment.

Composition/framing: inside the central approximately 564-pixel-wide source crop (master x about 555-1117), include the complete half-buried bunker and closed door, the keeper from head to boots with clearly visible earplugs and cord, and at least three complete receiving posts. Keep all three elements comfortably away from the crop edges. Side fields may carry the continuing fence, river, empty land, and cloud. No essential information in the bottom 10 percent. One coherent landscape, never a collage.

Lighting/mood: preserve held-calm storm-blue overcast, low charcoal cloud, thin bone-pale horizon, quiet professional isolation, and psychological wrongness without overt horror.

Color palette: preserve Stormgate storm blue, wet grey, charcoal, bone concrete, muted mud, dark metal, and rust. Earplugs are tiny matte bone or muted warm grey, never cyan or luminous. Prefer no cyan at all. Absolutely no violet, purple, magenta, teal glow, neon, or saturated fantasy color.

Constraints: the posts receive only and emit nothing; no dish, array, radiating rings, waves, beam, light, broadcast, visible energy, or magical effect. Exactly one primary adult keeper, real earplugs visibly seated and joined by a plain cord, no headphones. Bunker half-buried, shielded, closed, and unmarked. No transcript, paper, screen, dream image, sleeping figure, apparition, weapon display, battle, corpse, gore, creature, faction insignia, or active pylon.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, transcripts, papers, screens, scales, warning stencils, colored stickers, bunker markings, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every surface remains plain and unmarked.
~~~

### Exact prompt — attempt 3

~~~text
Use case: precise-object-edit
Asset type: final localized QA correction for the Echo Fence REGION dossier plate; preserve the entire accepted outpost composition.

Input images: Image 1 is the ECHO FENCE EDIT TARGET. Image 2 is the delivered STORMGATE STYLE and PALETTE reference only.

Primary request: Change only the adult keeper's head angle and hearing protection so the regulation earplugs are visually undeniable at directory-crop scale. Turn the keeper's head slightly back toward camera into a clear three-quarter near profile while keeping the body facing down the service path. In the fully visible near ear, seat one small matte muted-rust industrial foam earplug; a plain dark safety cord must run visibly from that plug behind the neck and into the far ear, clearly communicating a connected PAIR of real earplugs. The cord lies naturally against the black rain collar. The plugs are tiny, non-electronic, non-luminous, and practical—not jewelry, earbuds, a headset, or headphones. Remove the small pale spot from the keeper's upper sleeve so the clothing is completely unmarked. Preserve the keeper's identity-neutral adult appearance, full-body posture, bunker, closed door, complete passive resonant posts, muddy path, river, mountains, weather, framing, lighting, and every other successful detail exactly as closely as possible.

Composition/framing: preserve the full wide scene and its central approximately 564-pixel-wide protected crop. The near earplug and connecting cord must remain sharply legible in that center crop along with the keeper, part of the bunker door, and multiple receiving posts.

Color palette: preserve held-calm Stormgate storm blue, wet grey, charcoal, bone concrete, dark metal, muted earth, and rust. Earplug is tiny matte muted rust only. No cyan. Absolutely no violet, purple, magenta, teal glow, neon, or saturated fantasy color.

Constraints: localized head-and-ear protection correction only. Posts remain receive-only and emit nothing. No beam, wave, radiating ring, light, broadcast, visible energy, or magical effect. No new person, object, paper, screen, sign, weapon, creature, dream image, apparition, or active pylon.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, transcripts, papers, screens, scales, warning stencils, colored stickers, bunker markings, unit patches, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every surface remains plain and unmarked.
~~~

### Exact prompt — attempt 4, accepted earplug micro-correction

~~~text
Use case: precise-object-edit
Asset type: micro-detail correction for the final Echo Fence REGION dossier plate; preserve the scene unchanged.

Input images: Image 1 is the ECHO FENCE EDIT TARGET. Image 2 is the STORMGATE PALETTE reference only.

Primary request: Add clearly visible regulation hearing protection to the adult keeper and change nothing else. In the keeper's exposed near ear, place a small but unmistakable matte ochre-rust foam earplug seated in the ear canal, approximately thumbnail-sized in the image rather than a nearly invisible pixel. From it, a thin plain black safety cord must be visibly routed behind the neck toward the unseen far-ear mate, lying against the jacket collar. It must read as practical corded industrial EARPLUGS: soft foam plug, no metal, no electronics, no jewelry, no earbud body, no headset, no headphones, no glow. Preserve the keeper's head angle, neutral expression, body, clothing, full composition, bunker, closed door, passive resonant posts, path, landscape, lighting, and weather exactly as closely as possible.

Composition/framing: preserve the current wide scene and center-safe layout. The ochre-rust earplug and a short visible section of its black cord must be legible in the central approximately 564-pixel-wide directory crop.

Color palette: preserve held-calm storm blue, wet grey, charcoal, bone concrete, dark metal, muted earth, and rust. The single visible foam plug is muted ochre-rust, not bright orange, cyan, violet, or neon.

Constraints: localized earplug-and-cord addition only. Do not add, remove, move, redesign, relight, or recolor anything else. Posts remain receive-only and emit nothing.

Zero-text law: no readable or pseudo-readable text, letters, numbers, signs, labels, markings, fake script, glyphs, logos, UI, captions, borders, or watermark.
~~~

## last-mooring

- Status: accepted on first attempt
- Reference source: apps/web/private/codex-art/regions/stormgate.png
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-0804a5c3-f565-4793-a807-ed235e0b933b.png
- Generated source metadata: 1672x941 RGB24 PNG
- Generated source SHA-256: 81cb2b458913454b34a8fa458ee6b941791dc15ea20ccb4cbc277d0fff249057
- Installed destination: apps/web/private/codex-art/regions/last-mooring.png
- Installed SHA-256: 81cb2b458913454b34a8fa458ee6b941791dc15ea20ccb4cbc277d0fff249057
- Final QA: full plate and exact x=554, width=564 center crop inspected. Ancient oversized bollards, multiple intact taut chains, several secured freight hulls, empty decks, closed cabins, mirror-dark sheltered water, and the massive storm wall remain legible in the protected crop. Curved storm structure and contradictory bone-pale light stay outside/above the shelter; the basin and moorings remain intact. Hull silhouettes vary plausibly, but no hull is isolated, highlighted, marked, labeled, supernatural, or otherwise confirmed as unfamiliar. No person is visible. Storm-blue/wet-grey/charcoal/bone/black-iron/rust identity holds with no cyan, violet, purple, magenta, teal glow, or neon visible. No readable text or fake script was found. Accepted.

### Exact prompt — attempt 1, accepted

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex REGION dossier plate for Last Mooring; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image: Image 1 is a STYLE, PALETTE, MATERIAL, WEATHER, and CENTER-CROP reference only: the delivered Stormgate leg plate. Create a wholly original hardened storm-refuge basin. Do not copy its exact pylons, river course, mountains, shoreline, or composition.

Primary request: Last Mooring — OUTPOST DURING A WEATHER HOLD. Show Stormgate's hardened refuge basin cut into the bank behind a massive old storm wall while anomaly weather goes wrong outside. Inside the shelter, several practical freight hulls ride close together on unnaturally calm dark water, each secured by multiple heavy taut chains to enormous ancient Waterworks mooring bollards of unmistakably older construction than the modern pylons. The crews have all gone below decks: hatches and cabin doors closed, decks empty, no person visible. Beyond and above the storm wall, dense rain bends sideways in smooth impossible arcs and a bone-pale break in the clouds throws light at subtly contradictory angles, while the protected basin remains physically grounded and intact. Among the ordinary work hulls may sit one unfamiliar unmarked hull with a slightly different but still plausible silhouette and construction; nothing supernatural, evidentiary, highlighted, or compositional confirms it as special.

Style/medium: mature AAA grounded cinematic photorealism, premium environmental narrative key art, real lens logic, physically based water, chain, stone, concrete, vessel, and weather, contemporary-to-near-future working refuge, subtle film grain. Wet cyclopean stone storm wall, colossal worn iron bollards, black heavy chain, scarred freight decks, dark hull paint, rain haze outside shelter. No fantasy harbor, ghost ship, steampunk ornament, disaster spectacle, magical portal, or clean sci-fi chrome.

Composition/framing: wide slightly elevated view from just inside the basin. In the immediate central foreground, place at least two enormous ancient bollards fully visible with multiple taut chains leading to the clustered hulls; behind them, keep several complete empty-decked hulls and a strong section of storm wall inside the central approximately 564-pixel-wide source crop (master x about 555-1117). The protected narrow crop must independently read ancient anchors holding a refuge fleet while impossible weather bends outside. The subtly unfamiliar hull, if present, must sit among peers without spotlighting and must not become the central subject. Side fields are expendable chain lockers, wall extensions, additional hulls, and storm. No essential information in the bottom 10 percent. One coherent harbor instant, never a diagram, cutaway, or collage.

Lighting/mood: cold storm-blue weather-hold daylight, charcoal cloud, bone-pale misdirected light beyond the wall, restrained warm amber only behind a few closed cabin windows. Claustrophobic, orderly, proven, and uncanny. The weather is violent outside, but the ancient moorings hold without drama.

Color palette: match Image 1's Stormgate identity — storm blue and wet grey, charcoal cloud, mirror-dark water, bone stone and concrete, black iron, muted rust, restrained amber windows. Cyan is permitted only as one or two tiny contained indicator lights physically mounted on distant modern pylon hardware, if visible at all. No cyan on bollards, chains, vessels, or weather; no cyan atmosphere or glow. Absolutely no violet, purple, magenta, neon, or saturated fantasy color.

Constraints: multiple ordinary freight hulls; every hull secured; at least two fully visible ancient bollards; heavy chains remain intact and taut; decks completely empty; all crews below; all hatches and doors closed; no visible hold log, arrival record, ship name, registration, clue, symbol, aura, wake, collision, snapped chain, dragging bollard, structural failure, flooding, wreck, evacuation, panic, battle, corpse, gore, creature, or active magic. Any unfamiliar hull remains plausible, unmarked, unlit as a subject, and unconfirmed—no unique glow, impossible geometry, ghostliness, dramatic spotlight, pointing figure, separate berth, or visual annotation.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, words, signs, labels, logs, papers, ship names, registrations, warning stencils, bollard marks, hull markings, flags, plaques, inscriptions, fake script, glyphs, logos, brands, insignia, UI, captions, borders, or watermark. Every vessel, chain, bollard, wall, door, and equipment surface is plain and unmarked.
~~~

### machines-front.md

# SOL 5.6 Riverlands — Machines front plate generation record

Generated and installed 2026-09-01 with the built-in ImageGen path. One distinct built-in call was made for each first-pass plate; QA-driven targeted replacement calls were made only for protected-center-crop failures. No CLI/API fallback was used. No generation was refused.

## Canon and reference basis

- The current database dossier was queried read-only immediately before generation. All four entries are live `CREATURE` records with status `CANON`, version 1, machine category. No hand-edited divergence from `apps/web/scripts/author-machine-species.ts` was found.
- Director notes: `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md`, section X. No dossier/director conflict was found.
- Machine reference used in every distinct plate: `apps/web/private/codex-art/bloomfall-adaptive-p1p2/candidates/mender-current-integrated-chassis-hero.png`, design-language/material/wear/lens/production-quality reference only.
- Riverlands exterior anchor: `apps/web/private/codex-art/regions/riverlands.png`, used only for Palisade Frame and Chaff Wasp light, weather, landscape color, and production continuity.
- Arcadia Gate exterior anchor: `apps/web/private/codex-art/regions/arcadia-gate.png`, used only for Jackknife because the live dossier places the courser on that convoy corridor.
- The indoor Machines shelf plate did not use a region anchor; the local machine reference was sufficient.
- Standing creature-dossier convention was visually checked against `apps/web/private/codex-art/creatures/shrieker-bat.png`.
- Final delivery contract: 1672x941 PNG, sRGB, 8-bit unsigned, 3 channels, RGB24, no alpha. Protected directory crop tested at exact source coordinates x=554, y=0, width=564, height=941.
- Every installed final is a byte-for-byte copy of its accepted generated source. No normalization, resize, crop, repaint, or re-encoding was applied to a final.

## Final manifest

| Plate | Accepted generated source | Installed final | Bytes | Metadata | SHA-256 | Attempts |
|---|---|---|---:|---|---|---:|
| `creatures/machines.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-3f2b1a7e-95d2-4b6c-98f7-effde7154e18.png` | `apps/web/private/codex-art/creatures/machines.png` | 2,126,639 | PASS — 1672x941 PNG, sRGB, uchar, 3 channels, RGB24, no alpha | `3dfb6934d2f6b2257f1e083629dd87b8f2fb1a3b48abab20de36d24fbc9c88c8` | 2 |
| `creatures/palisade-frame.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-8dd5a4a5-bc07-4a10-a436-14afe08192ce.png` | `apps/web/private/codex-art/creatures/palisade-frame.png` | 2,655,936 | PASS — 1672x941 PNG, sRGB, uchar, 3 channels, RGB24, no alpha | `a24601d631c681c483fd1de4db79d263a767f213167de68e8a47cdde6fb8eed8` | 2 |
| `creatures/chaff-wasp.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-7122d7a7-8f55-4e37-821a-4e63d0b05afa.png` | `apps/web/private/codex-art/creatures/chaff-wasp.png` | 2,332,431 | PASS — 1672x941 PNG, sRGB, uchar, 3 channels, RGB24, no alpha | `900ed49e1d0b089b0ca0b7bf179bcfa1c43006503066230dd3a2bfcdb8e88399` | 1 |
| `creatures/jackknife.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-1ccabade-094a-4987-888b-06cabc63f14a.png` | `apps/web/private/codex-art/creatures/jackknife.png` | 2,409,694 | PASS — 1672x941 PNG, sRGB, uchar, 3 channels, RGB24, no alpha | `481b296c48b3d275d324c5f0646019e4b3b9e100023b3e2a801b06965dd5a826` | 3 |

## Shared final QA

- Full-frame and exact x=554 / width=564 crops were inspected at native resolution.
- All four finals pass the global zero-text law: no readable or pseudo-readable text, letters, numbers, labels, serials, stencils, signs, logos, insignia, banners, UI, borders, captions, or watermarks were observed.
- All four pass palette: no Blackbloom violet, purple, magenta, cyan magic, or cyan glow.
- All machine subjects pass the design lock: no anthropomorphic or emotive face, mouth, jaw, brows, paired expressive eyes, animal head, humanoid head, or organic creature treatment.
- Hardware is grounded near-future military-industrial, worn and maintained, structurally legible, and consistent with the local Mender reference without copying its chassis.
- No tool refusals occurred. Superseded outputs remain in the generated-image source directory and are recorded below; transient QA crop files were removed after inspection.

## `creatures/machines.png`

- Live dossier: `Machines`, CANON v1. Summary read: “The soulless shelf: war robotics of a high-tech world — drones, walkers, siege frames. No soul, no Forge, no reclamation; they sip Essence daily to run, and destroyed is destroyed.”
- Dossier/director conflict: none.
- Final source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-3f2b1a7e-95d2-4b6c-98f7-effde7154e18.png`.
- Final path: `apps/web/private/codex-art/creatures/machines.png`.
- Final SHA-256: `3dfb6934d2f6b2257f1e083629dd87b8f2fb1a3b48abab20de36d24fbc9c88c8`.
- Final metadata: 2,126,639 bytes; 1672x941 PNG; sRGB; uchar; 3 channels; RGB24; no alpha; source and destination hashes identical.
- QA: PASS. Full frame is a coherent dormant depot family: Palisade planted as wall architecture, open crates of folded Chaff Wasps, folded Jackknife foreground, and house-scale Millstone tread/ram mass behind. Exact center crop retains all four pattern cues: Palisade wall body with planted leg/anchor geometry, complete folded Jackknife, open chaff crates, and the Millstone tread/ram. No people, battle, active weapons, faces, markings, text, logos, violet, or cyan.
- Superseded attempt 1: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-c7fae5c1-0fae-4ad5-a780-94af537931d7.png`; 2,464,476 bytes; 1672x941 sRGB RGB24; SHA-256 `2f83c5f9a8e0321d8e496c0bc090aed59d9383d53b980eec69c6fc96d22271fb`.
- Superseded reason: the full plate was excellent, but the exact 564px center crop lost most of the left Palisade and right chaff crates. A targeted distant-camera restage compacted the four cues into the center.

### Superseded attempt 1 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier shelf plate for CANON v1 “Machines”; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is a MACHINE DESIGN-LANGUAGE, MATERIAL, WEAR, LENS, and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, heavy real load paths, dark olive and gunmetal armor, exposed maintained actuators, restrained practical lights, grime, wear, and premium cinematic photorealism. Create wholly original machine patterns and a wholly original depot composition. Do not copy the reference chassis, long bridge body, pipe setting, or camera arrangement.

Primary request: THE MACHINES SHELF PLATE — a working foundry floor or military depot line holding the family in one coherent frame, inactive between assignments. A massive Palisade defense quadruped is planted beside the main depot door like a literal removable wall section, its four anchor spikes driven and its armored hull lowered to grade. Beside it, stacks of plain reusable transport crates are open just enough to reveal rows of folded cheap Chaff Wasp rotor drones. In the central foreground, one low Jackknife quadruped courser is folded compactly at rest, its blade-like actuator geometry mechanically locked and safe. Across the background wall, one enormous Millstone tracked siege platform is mostly outside the bay; its single house-height tread, ram plate, and lower armored mass fill the rear scale. The four patterns must read as related products made by a high-tech world, not as living creatures. Working light, maintenance order, no battle.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier environmental key art; real 32mm lens logic; physically credible near-future military robotics; actual structural mass, hydraulics, joints, access panels, fasteners, cooling, cable routing, and load paths; worn and maintained rather than pristine or ruined; subtle film grain. Match Image 1’s rugged premium finish without copying its design.

Composition/framing: wide 16:9 depot interior at human standing height. The exact central approximately 564-pixel-wide window of a 1672x941 source must independently retain the complete folded Jackknife, the planted Palisade’s defining wall hull and at least two visibly deployed anchor spikes, the open chaff crates with clearly folded rotor units, and the Millstone tread behind them. Side fields may extend the foundry and machinery, but no signature subject may exist only at an edge. Strong layered scale, one coherent photographic moment, no lineup labels, no panels, no collage.

Lighting/mood: restrained warm-white foundry task lights and one cool-neutral daylight shaft from the depot door; practical, procedural, expensive, emotionally vacant. No battle, alarm, smoke spectacle, or active repair crew.

Color palette: dark olive drab, worn gunmetal, charcoal steel, muted earth, dry grease, restrained rust and aged brass, small warm-white practical lamps. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD MACHINE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. No expressive eyes, paired glowing eyes, brows, mouths, jaws, teeth, snouts, faces, emotive head poses, humanoid heads, animal heads, or personality. Sensor packages are recessed, asymmetric, functional, and visually subordinate; menace comes only from mass and purpose. Nothing is alive, organic, sentient-looking, cute, or emotive.

Story/canon locks: these are soulless maintained war machines, not monsters or people; destroyed is destroyed; all four are intact and dormant; Palisade is emplaced architecture, Chaff Wasps are expendable folded rotor drones, Jackknife is a low quadruped courser, Millstone is a tracked siege platform the size of a customs house. No combat and no active weapons.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, UI, diagrams, signage, borders, captions, or watermark. Every crate and every armor surface is completely blank and unmarked.

Avoid: steampunk ornament, retro-futurism, fantasy runes, magic, glowing Essence, violet of any kind, glossy showroom CGI, toy-like scale, humanoid robots, organic monsters, faces, battlefield damage, corpses, people, active welding sparks, explosions, muzzle flashes, split composition, poster layout.
```

### Final accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier shelf plate for CANON v1 “Machines”; FRESH REPLACEMENT for a protected-center-crop composition failure; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is the SUPERSEDED FIRST GENERATION and a SUBJECT-DESIGN / MATERIAL / LIGHTING REFERENCE ONLY. Preserve its excellent grounded family designs, rugged depot reality, worn maintained finish, dark olive and gunmetal palette, and coherent scale. Do NOT preserve its failed spread-out staging: the Palisade on the far left and chaff crates on the far right disappear from the required middle crop.
- Image 2 is the original MACHINE DESIGN-LANGUAGE and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, heavy real load paths, exposed maintained actuators, restrained practical lights, grime, wear, and premium cinematic photorealism. Create original pattern-specific geometry; do not copy its bridge chassis, wheeled bases, pipe setting, or camera arrangement.

TARGETED CHANGE ONLY: pull the camera much farther back and restage the same four-pattern depot family as a COMPACT CENTERED CLUSTER. Treat the leftmost 554 pixels and rightmost 554 pixels as expendable scenic margins containing only dark blank foundry architecture. Every signature machine cue must fit inside the middle x=554 through x=1117 strip, width 564 pixels. If only that narrow vertical middle strip is visible, the complete family story must still read instantly.

Primary request: THE MACHINES SHELF PLATE — a working foundry floor or military depot line holding the family in one coherent frame, inactive between assignments. In the compact center cluster: a massive Palisade defense quadruped is planted beside the depot door like a removable wall section, its four anchor spikes driven and armored hull lowered to grade; immediately beside and partly beneath its wall overhang, stacks of plain reusable transport crates are open enough to reveal rows of folded cheap Chaff Wasp rotor drones; directly in the central foreground, one low Jackknife quadruped courser is folded compactly at rest, blade-like actuator geometry locked safe; directly behind this cluster, one enormous Millstone tracked siege platform is mostly concealed in a shadowed bay, but one house-height tread and lower ram plate form the rear wall of the centered group. The four patterns read as related products made by a high-tech world, not living creatures. Working light, maintenance order, no battle.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier environmental key art; real 40mm lens from a distant human-height viewpoint; physically credible near-future military robotics; actual structural mass, hydraulics, joints, access panels, fasteners, cooling, cable routing, and load paths; worn and maintained rather than pristine or ruined; subtle film grain. Match both input images’ rugged premium finish without copying exact design.

Composition/framing — ABSOLUTE DELIVERY TEST: wide 16:9 with a small, dense center tableau occupying no more than 520 pixels total width. The COMPLETE folded Jackknife, the COMPLETE planted Palisade from feet through wall hull, at least two deployed anchor spikes, the open chaff crates with multiple folded rotor units, and the Millstone tread plus ram plate must ALL sit wholly between x=574 and x=1097, leaving at least 20 pixels of internal breathing room before each protected-crop edge. Camera is far enough away to achieve this. The outer thirds contain only empty dark floor, blank gantries, pipes, and shadow; no essential object, no people, no extra machines. Strong layered scale, one coherent photograph, no lineup, no labels, no panels, no collage.

Lighting/mood: restrained warm-white foundry task lights focused on the compact central family and one cool-neutral daylight shaft behind it; practical, procedural, expensive, emotionally vacant. Outer thirds fall into empty low-contrast industrial shadow. No battle, alarm, smoke spectacle, or crew.

Color palette: dark olive drab, worn gunmetal, charcoal steel, muted earth, dry grease, restrained rust and aged brass, small warm-white practical lamps. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD MACHINE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. No expressive eyes, paired glowing eyes, brows, mouths, jaws, teeth, snouts, faces, emotive head poses, humanoid heads, animal heads, or personality. Sensor packages are recessed, asymmetric, functional, and visually subordinate; menace comes only from mass and purpose. Nothing is alive, organic, sentient-looking, cute, or emotive.

Story/canon locks: soulless maintained war machines, not monsters or people; all intact and dormant; Palisade is emplaced architecture, Chaff Wasps are expendable folded rotor drones, Jackknife is a low quadruped courser, Millstone is a tracked siege platform the size of a customs house. No combat and no active weapons.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, stencils, warning chevrons, floor markings, unit markings, manufacturer plates, logos, insignia, banners, UI, diagrams, signage, borders, captions, or watermark. Every crate and armor surface is completely blank and unmarked.

Avoid: spread-out lineup, any signature object in an outer third, full-frame close camera, cropped subjects, steampunk ornament, retro-futurism, fantasy runes, magic, glowing Essence, violet of any kind, glossy showroom CGI, toy-like scale, humanoid robots, organic monsters, faces, battlefield damage, corpses, people, sparks, explosions, muzzle flashes, split composition, poster layout.
```

## `creatures/palisade-frame.png`

- Live dossier: `Palisade Frame`, CANON v1. Summary read: “The wall that walks to work: a heavy quadruped that marches to its post, plants itself, and becomes fortification — the defense drone that turned garrison doctrine into a purchase order.”
- Dossier/director conflict: none.
- Final source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-8dd5a4a5-bc07-4a10-a436-14afe08192ce.png`.
- Final path: `apps/web/private/codex-art/creatures/palisade-frame.png`.
- Final SHA-256: `a24601d631c681c483fd1de4db79d263a767f213167de68e8a47cdde6fb8eed8`.
- Final metadata: 2,655,936 bytes; 1672x941 PNG; sRGB; uchar; 3 channels; RGB24; no alpha; source and destination hashes identical.
- QA: PASS. Full frame shows a heavy headless wall-section quadruped walking to work at radiant dawn with all travel spikes stowed and five calm fully clothed children following at a broad safe gap on an empty wet street. The exact center crop retains the complete Palisade and two clearly visible following children, so the plural unafraid routine remains legible; the full group remains visible in the wide plate. No child is beneath, beside, touching, climbing, threatened by, or in the path/leg sweep of the frame. No weapons fire, harm, fear, injury, danger, conflict, faces, text, logos, violet, or cyan.
- Superseded attempt 1: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-7e1cc29d-655c-4a47-b0e3-38e659f93566.png`; 2,815,356 bytes; 1672x941 sRGB RGB24; SHA-256 `1fc640501ed11ad31098f470c25b80f358ade6b793bce9ecb294a866bea6d41b`.
- Superseded reason: the machine, dawn, and safety story passed full-frame QA, but the exact center crop excluded the child group. A targeted pullback kept the successful design and safety staging while making the whole procession center-safe.

### Superseded attempt 1 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Palisade Frame”; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is a MACHINE DESIGN-LANGUAGE, MATERIAL, WEAR, LENS, and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, real load paths, worn olive and gunmetal armor, exposed maintained actuators, practical engineering, and premium cinematic photorealism. Create a wholly original Palisade chassis. Do not copy its bridge body, wheeled bases, pipe environment, or exact composition.
- Image 2 is a RIVERLANDS LIGHT, LANDSCAPE COLOR, WEATHER, and PRODUCTION-QUALITY REFERENCE ONLY: white-gold dawn, living river green, wet grey, muted earth, expansive natural atmosphere. Create a wholly original inhabited town street. Do not copy its aerial camera, river braids, mountains, settlement layout, or composition.

Primary request: PALISADE FRAME — “the wall that walks to work.” On a broad lived-in Riverlands town street at dawn, show one enormous heavy quadruped defense drone in a slow mid-stride toward its assigned post. Its main armored hull must literally resemble a thick modular fortification wall segment carried on four load-bearing mechanical legs: slab armor, interlocking side geometry, recessed weapon apertures, stabilizer gyros, and four unmistakable ground-anchor spikes all visibly folded and mechanically stowed tight against the hull for travel. It has not planted yet. Several ordinary local children follow behind it unafraid because this familiar daily movement is normal in their town. Architecture on legs; defense as a product; patient mechanism, no personality.

Child-safety lock: the children are healthy, fully clothed, calm and curious, walking together on the broad clear street at a clearly safe following distance of at least several machine lengths, entirely behind and outside the Palisade’s path and leg sweep. Keep all children grouped on the same visible safe side of the street, with unobstructed ground and no traffic between them and the camera. Nobody is beneath, beside, touching, climbing, chasing, fleeing, threatened by, or endangered by the machine. No weapon is active. No harm, distress, fear, injury, collision, danger, peril, rubble, fire, combat, or disaster involving children.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier environmental key art; real 32mm lens logic at adult street height; physically credible near-future military robotics, structural mass, hydraulics, joints, access panels, fasteners, cooling, cable routing, and load paths; armor scuffed and rain-worn but scrupulously maintained; lived stone, wet timber, puddles, subtle film grain. Match Image 1’s rugged premium machine finish and Image 2’s Riverlands radiance without copying either design or composition.

Composition/framing: wide cinematic 16:9, slight front-three-quarter side view so all four legs and all four folded anchor spikes are mechanically legible while the machine walks across the frame. The exact central approximately 564-pixel-wide window of a 1672x941 source must independently retain the COMPLETE Palisade from feet to wall-hull, with no cropped legs, plus the complete safely separated group of following children and enough street to prove the safety gap. Place the Palisade and children as a compact center-safe procession inside the middle third; side fields may extend blank town architecture and dawn atmosphere only. One coherent photograph, no panel, no montage.

Lighting/mood: radiant white-gold early dawn breaking between roofs, clean cool wet shadows, a normal workday beginning; awe through routine and competence, never menace toward civilians.

Color palette: Riverlands white-gold dawn and living green at full weight; worn dark olive, gunmetal, wet grey stone, muted earth, restrained rust and aged brass. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD MACHINE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. The Palisade has no face and no head-like front at all: no expressive eyes, paired glowing eyes, brows, mouth, jaw, teeth, snout, faceplate, emotive head pose, humanoid head, animal head, ears, or personality. Sensor packages are recessed, asymmetric, functional, and visually subordinate in the wall hull. Menace and authority come only from architecture, mass, and purpose. Nothing about it is alive, cute, pet-like, or emotive.

Canon locks: heavy quadruped; low threat while mobile, severe only when emplaced; exactly four folded/stowed anchor spikes; marching to its post and not yet planted; intact, soulless, worn and maintained; town inhabitants regard the walk as ordinary. No active weapons, no soldiers, no conflict.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, storefront words, notices, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, flags, graffiti, UI, borders, captions, or watermark. Every armor panel, wall, door, crate, and shop surface is blank and unmarked.

Avoid: harm or danger to children, children in the machine path, child close-ups, distressed children, war scene, crowd panic, active guns, muzzle flash, humanoid robot, animal robot, robot dog, robot horse, expressive sensors, steampunk ornament, fantasy runes, magic, glowing Essence, violet of any kind, glossy showroom CGI, toy scale, pristine parade, ruined town, body horror, split composition, poster layout.
```

### Final accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Palisade Frame”; FRESH REPLACEMENT for a protected-center-crop composition failure; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is the SUPERSEDED FIRST GENERATION and a SUBJECT-DESIGN / TOWN / LIGHT / MATERIAL REFERENCE ONLY. Preserve its excellent original wall-on-legs Palisade design, four-legged engineering, white-gold Riverlands dawn, lived wet town, safe calm children, rugged wear, and cinematic realism. Do NOT preserve its failed close framing or left/right separation: the children vanish from the required middle crop.
- Image 2 is the original MACHINE DESIGN-LANGUAGE and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, real load paths, worn olive and gunmetal armor, exposed maintained actuators, practical engineering. Do not copy its bridge body, wheeled bases, pipe setting, or exact composition.
- Image 3 is a RIVERLANDS LIGHT, LANDSCAPE COLOR, WEATHER, and PRODUCTION-QUALITY REFERENCE ONLY: white-gold dawn, living river green, wet grey, muted earth, expansive natural atmosphere. Do not copy its aerial camera, braided rivers, mountains, settlements, or composition.

TARGETED CHANGE ONLY: pull the camera at least 2.5 times farther back and stage the complete Palisade plus the complete safely separated child group as one SMALL COMPACT CENTERED PROCESSION. Treat the leftmost 554 pixels and rightmost 554 pixels as expendable scenic margins with no important content. Everything essential must fit wholly inside the middle x=554 through x=1117 strip, width 564 pixels.

Primary request: PALISADE FRAME — “the wall that walks to work.” On a broad lived-in Riverlands town street at dawn, one enormous heavy quadruped defense drone walks slowly toward its assigned post. Its main armored hull literally resembles a thick modular fortification wall section carried on four load-bearing mechanical legs: slab armor, interlocking side geometry, recessed weapon apertures, stabilizer gyros, and four unmistakable ground-anchor spikes all visibly folded and mechanically stowed tight against the hull for travel. It has not planted yet. A compact group of five ordinary local children follows behind it unafraid because this familiar daily movement is normal. Architecture on legs; defense as a product; patient mechanism, no personality.

Child-safety lock: all five children are healthy, fully clothed, calm, walking together directly behind the machine at a clearly safe gap of at least two complete Palisade body lengths, entirely outside its path and leg sweep. The road is broad, level, empty, and unobstructed between them. The machine moves away from the children in the same direction; nobody is beneath, beside, touching, climbing, chasing, fleeing, threatened, or endangered. No active weapon. No harm, distress, fear, injury, collision, danger, peril, rubble, fire, combat, or disaster involving children.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier environmental key art; real 50mm lens from a distant adult street-height viewpoint; physically credible near-future military robotics, structural mass, hydraulics, joints, access panels, fasteners, cooling, cable routing, and load paths; armor scuffed and rain-worn but maintained; lived stone, wet timber, puddles, subtle film grain. Match the inputs’ rugged machine finish and Riverlands radiance without copying exact design or composition.

Composition/framing — ABSOLUTE DELIVERY TEST: wide cinematic 16:9, distant three-quarter side view. The COMPLETE Palisade from every foot to wall hull plus all four folded anchor spikes and the COMPLETE safely separated group of five children must occupy no more than 520 pixels TOTAL width and sit wholly between x=574 and x=1097, leaving at least 20 pixels of breathing room before each protected-crop edge. The Palisade itself spans about 350 pixels; the following group and visible safety gap use the remaining 150 pixels. Scale both machine and children down to achieve this. The center crop alone must show the full safe procession and dawn street. Outer thirds contain only blank empty town facades, road, river haze, trees, and sunrise; no people or essential props. One coherent photograph, no panel, montage, or cropped limb.

Lighting/mood: radiant white-gold early dawn breaking between roofs, clean cool wet shadows, a normal workday beginning; awe through routine and competence, never menace toward civilians.

Color palette: Riverlands white-gold dawn and living green at full weight; worn dark olive, gunmetal, wet grey stone, muted earth, restrained rust and aged brass. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD MACHINE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. The Palisade has no face and no head-like front: no expressive eyes, paired glowing eyes, brows, mouth, jaw, teeth, snout, faceplate, emotive head pose, humanoid head, animal head, ears, or personality. Sensors are recessed, asymmetric, subordinate in the wall hull. Authority comes only from architecture, mass, and purpose. Nothing is alive, cute, pet-like, or emotive.

Canon locks: heavy quadruped; low threat while mobile, severe only when emplaced; exactly four folded/stowed anchor spikes; marching to its post and not yet planted; intact, soulless, worn and maintained; town inhabitants regard it as ordinary. No active weapons, soldiers, or conflict.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, storefront words, notices, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, flags, graffiti, UI, borders, captions, or watermark. Every armor panel, wall, door, crate, and shop surface is blank and unmarked.

Avoid: harm or danger to children, children in the path, children near legs, child close-ups, distressed children, war scene, crowd panic, active guns, humanoid robot, animal robot, robot dog, robot horse, expressive sensors, steampunk ornament, fantasy runes, magic, glowing Essence, violet, glossy showroom CGI, toy scale, pristine parade, ruined town, body horror, spread-out composition, cropped machine, poster layout.
```

## `creatures/chaff-wasp.png`

- Live dossier: `Chaff Wasp`, CANON v1. Summary read: “The sky’s small change: a cheap, expendable rotor drone fielded in clouds — built to die usefully, which is the one job no living thing should be given.”
- Dossier/director conflict: none.
- Final source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-7122d7a7-8f55-4e37-821a-4e63d0b05afa.png`.
- Final path: `apps/web/private/codex-art/creatures/chaff-wasp.png`.
- Final SHA-256: `900ed49e1d0b089b0ca0b7bf179bcfa1c43006503066230dd3a2bfcdb8e88399`.
- Final metadata: 2,332,431 bytes; 1672x941 PNG; sRGB; uchar; 3 channels; RGB24; no alpha; source and destination hashes identical.
- QA: PASS on first attempt. Full frame and center crop read the cloud rather than a unit: hundreds of compact rotor drones fill roughly half the storm-blue sky and screen an unmarked moving convoy below. Multiple near and middle-distance units are mechanically legible while the mass remains the subject. No insect anatomy, organic swarm, face, expressive eyes, visible charge, attack, detonation, casualty, gunfire, text, markings, logos, violet, or cyan.

### Final accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Chaff Wasp”; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is a MACHINE DESIGN-LANGUAGE, MATERIAL, WEAR, LENS, and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, practical joints and actuators, worn olive and gunmetal surfaces, maintained detail, and premium cinematic photorealism. Create a wholly original cheap folded-coat-sized rotor drone. Do not copy its chassis, bridge body, wheel units, pipe environment, or composition.
- Image 2 is a RIVERLANDS LIGHT, LANDSCAPE COLOR, WEATHER, and PRODUCTION-QUALITY REFERENCE ONLY: white-gold living country, river green, storm blue, wet grey, muted earth, expansive natural atmosphere. Create a wholly original military convoy road and sky. Do not copy its aerial camera, river braid map, mountain arrangement, settlements, or composition.

Primary request: CHAFF WASP — show the CLOUD, not a product portrait. A disciplined unmarked military supply convoy moves along a broad Riverlands levee road beneath an immense dense chaff screen of hundreds of cheap expendable rotor drones. The cloud fills roughly the upper half of the sky and clearly screens the expensive ground vehicles below. Most units read as small hard mechanical silhouettes at distance; only three or four near-camera Wasps are individually legible as compact machines roughly the size of a folded coat: stamped sheet-metal center body, four simple protected rotor cores on short folding arms, thumb-sized power cell housing, cheap optics recessed beneath the centerline, expendable construction. They are flown in clouds and spent like ammunition with initiative. No unit is attacking; the screen is moving with the convoy.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier environmental key art; real 28mm lens logic; physically credible near-future rotor drones and convoy hardware; natural atmospheric perspective, real rotor wash and motion blur only on blade tips, worn stamped metal, road dust and damp earth, subtle film grain. Match Image 1’s rugged premium material reality and Image 2’s Riverlands atmosphere without copying either design or composition.

Composition/framing: wide cinematic 16:9 from a low roadside three-quarter viewpoint. Build the signature story as a strong vertical center column: the convoy road, several complete unmarked vehicles, the thick drone cloud directly above, and three individually readable near Wasps. The exact central approximately 564-pixel-wide window of a 1672x941 source must independently retain the complete convoy/cloud relationship from ground to sky, at least three whole near-camera Wasps with every rotor visible, and the sense of hundreds beyond. Keep the convoy and legible drones compact in the middle third; side fields may extend only landscape and the outer cloud. One coherent photograph, no panels, no specimen layout, no centered single-drone portrait.

Lighting/mood: bright white-gold morning breaks under a storm-blue upper sky; practical operational calm, huge moving scale, disposability made visible; no battle spectacle.

Color palette: Riverlands white-gold dawn and living green, storm blue, wet grey, worn olive drab, gunmetal, bone dust, muted earth and restrained rust. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD MACHINE DESIGN LOCK: every Wasp is unmistakably mechanical and non-anthropomorphic. No insect anatomy, wings, stingers, abdomen, organic shell, face, expressive eyes, paired glowing eyes, brows, mouth, jaw, teeth, snout, emotive head pose, animal head, or personality. Recessed optics are small, asymmetric, dark, functional, and visually subordinate. Menace comes only from quantity and purpose. Nothing is alive, cute, pet-like, or emotive.

Canon locks: each unit is a cheap expendable rotor drone the size of a folded coat, stamped out by the crate, trivial alone and serious in weather; fielded by the hundred as a chaff screen that draws fire, spots, and fouls optics so expensive vehicles can move. This scene shows screening and movement only: no visible charge, detonation, target, casualty, gunfire, weapons discharge, or destroyed drone.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, road markings, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, flags, UI, borders, captions, or watermark. Every drone, vehicle, crate, armor panel, and structure is blank and unmarked.

Avoid: insect creatures, wasp faces, organic swarms, bird flock, butterflies, bee stripes, humanoid robots, one giant drone, fighter aircraft, fantasy magic, glowing Essence, violet of any kind, cyan lights, glossy showroom CGI, toy-like drones, battle, missiles, tracers, explosions, smoke columns, casualties, civilians, children, poster layout, diagram, split composition.
```

## `creatures/jackknife.png`

- Live dossier: `Jackknife`, CANON v1. Summary read: “The skirmish courser: a low, fast quadruped that closes like a thrown blade — escort, outrider, and the reason convoy raiders check the treeline twice.”
- Dossier/director conflict: none.
- Final source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-1ccabade-094a-4987-888b-06cabc63f14a.png`.
- Final path: `apps/web/private/codex-art/creatures/jackknife.png`.
- Final SHA-256: `481b296c48b3d275d324c5f0646019e4b3b9e100023b3e2a801b06965dd5a826`.
- Final metadata: 2,409,694 bytes; 1672x941 PNG; sRGB; uchar; 3 channels; RGB24; no alpha; source and destination hashes identical.
- QA: PASS. Full frame and exact center crop retain the complete low courser from trailing foot tip through leading foot tip with clear ground around both ends, all four limbs, continuous no-neck/no-head spine, all-haunch-and-shoulder actuator mass, and the folded/snapping full-extension gait over broken wet towpath. The distant unmarked convoy establishes escort work. No face, eyes, head pod, animal mimicry, second unit, target, victim, attack, blood, active weapon, text, logos, violet, or cyan.
- Superseded attempt 1: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-10d622fc-4467-4dbe-8cf8-f46cf190cbb8.png`; 2,440,951 bytes; 1672x941 sRGB RGB24; SHA-256 `cdc49a251119ad0e630bca7d6e47c76c9e4c2000c49141017a5d5cd65c4251c2`.
- Superseded attempt 1 reason: excellent no-face design and action, but the machine spanned most of the wide frame, so the exact center crop showed torso rather than the full sprint silhouette.
- Superseded attempt 2: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-c92d1a5a-fb19-443c-a7e9-62f01b7d06e0.png`; 2,469,503 bytes; 1672x941 sRGB RGB24; SHA-256 `ac7c116b02f29680bc23142c8cb7e016c58dde36808b68d96e2329eade19d8c3`.
- Superseded attempt 2 reason: the pulled-back image nearly passed, but native center-crop QA clipped the foremost and rearmost foot tips at opposite edges. The final targeted call preserved the successful scene and pulled back another 20 percent.

### Superseded attempt 1 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Jackknife”; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is a MACHINE DESIGN-LANGUAGE, MATERIAL, WEAR, LENS, and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, real actuator trains and load paths, worn olive and gunmetal armor, maintained grime, practical engineering, and premium cinematic photorealism. Create a wholly original Jackknife chassis. Do not copy its bridge body, wheeled bases, pipe setting, or composition.
- Image 2 is an ARCADIA GATE / RIVERLANDS LIGHT, PALETTE, LANDSCAPE MATERIAL, and PRODUCTION-QUALITY REFERENCE ONLY: coin-warm white-gold dawn, deep freight water, living green, brass warmth, busy practical corridor infrastructure. Create wholly original broken towpath ground and a new camera composition. Do not copy its aerial view, lock gate, river traffic, mountain arrangement, or architecture.

Primary request: JACKKNIFE — speed with a job. Catch one low near-future quadruped skirmish courser in a full side-on mid-lunge at maximum sprint across broken Riverlands towpath ground, its folded-and-snapping gait caught at the instant of complete blade-like extension. The chassis is all haunch and shoulder: huge rear sprint actuator packs driving long articulated rear legs, compact reinforced forward actuator shoulders, four feet barely clearing stones, a continuous low armored spine with NO neck and NO head. Its body folds and snaps open mechanically like a thrown jackknife, low enough to corner faster than a hound but never designed to imitate one. A distant unmarked freight convoy on the levee establishes its escort/out­rider job; there is no quarry and no attack.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier action key art; real 70mm low tracking-camera logic with the machine sharp and restrained directional motion blur confined to the immediate ground and far background; physically credible near-future military robotics, actuator trains, sprint capacitors, blade steel, dampers, joints, fasteners, cooling, cable routing, and impact-resistant armor; worn and maintained rather than pristine or ruined; real dust, stone chips and grass displacement; subtle film grain. Match Image 1’s rugged premium material reality and Image 2’s Arcadia radiance without copying either design or composition.

Composition/framing: wide cinematic 16:9, camera almost at chassis height, clean side-three-quarter silhouette against open ground. Keep the COMPLETE Jackknife from the leading foot to the trailing foot, including every limb and the full extended spine, entirely within the exact central approximately 564-pixel-wide window of a 1672x941 source; the machine should occupy no more than about 500 pixels of source width and sit wholly in the middle third with generous clear margins. The center crop must independently communicate low mass, full extension, broken-ground speed, and no face. Side fields may carry only motion-streaked terrain, river glint, and the distant convoy. One coherent photograph, no panel, no montage, no cropped limb.

Lighting/mood: hard coin-warm early morning side light cutting through road dust, cool wet shadows, fierce procedural speed without emotion; the machine neither tires, gambles, nor flinches.

Color palette: Arcadia coin-warm white-gold dawn, living river green, wet grey and brown earth, worn dark olive, gunmetal, muted brass and restrained rust. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD NO-FACE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. The Jackknife has literally no head, neck, face, muzzle, snout, jaw, mouth, teeth, ears, eyes, paired lights, brows, expressive sensor pair, or head-like forward pod. Its leading chassis end is a blind continuous low armored crash wedge; tiny navigation optics are recessed asymmetrically on the UNDERSIDE of the torso and are not readable as a face. No emotive pose or personality. It is a purpose-built machine, not a robot dog, wolf, horse, cat, insect, or living creature. Menace comes only from speed, geometry, and purpose.

Canon locks: low fast quadruped courser, faster than a horse and faster-cornering than a hound; all haunch and shoulder; folded-and-snapping sprint gait; escort and outrider function; intact soulless hardware. Blade steel is integrated as structural cutting edges on lower actuator guards, not a held sword and not organic claws. No target, chase victim, combat, attack, blood, injury, casualty, active weapon, or second Jackknife.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, road markings, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, flags, UI, borders, captions, or watermark. Every armor panel, vehicle, crate, road surface, and structure is blank and unmarked.

Avoid: robot dog, robot wolf, robot horse, animal anatomy, head-like sensor turret, face, eyes, mouth, teeth, organic musculature, humanoid robot, steampunk ornament, fantasy runes, magic, glowing Essence, violet of any kind, cyan lights, glossy showroom CGI, toy-like scale, battle, prey, fleeing people, soldiers, blood, explosions, muzzle flashes, blade gore, cropped body, poster layout, diagram, split composition.
```

### Superseded attempt 2 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Jackknife”; FRESH REPLACEMENT for a protected-center-crop composition failure; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is the SUPERSEDED FIRST GENERATION and a SUBJECT-DESIGN / ACTION / TERRAIN / LIGHT REFERENCE ONLY. Preserve its excellent original headless continuous-spine Jackknife, low all-haunch-and-shoulder anatomy, full-extension sprint gait, wet broken towpath, distant convoy, coin-warm dawn, rugged wear, and cinematic realism. Do NOT preserve its failed close framing: the long machine loses all four feet when cropped to the required middle strip.
- Image 2 is the original MACHINE DESIGN-LANGUAGE and PRODUCTION-QUALITY REFERENCE ONLY: grounded near-future military-industrial hardware, real actuator trains and load paths, worn olive and gunmetal armor, maintained grime, practical engineering. Do not copy its bridge chassis, wheeled bases, pipe setting, or composition.
- Image 3 is an ARCADIA GATE / RIVERLANDS LIGHT, PALETTE, LANDSCAPE MATERIAL, and PRODUCTION-QUALITY REFERENCE ONLY: coin-warm white-gold dawn, deep freight water, living green, brass warmth, busy practical corridor infrastructure. Do not copy its aerial view, lock gate, river traffic, mountains, or architecture.

TARGETED CHANGE ONLY: pull the tracking camera at least 3 times farther away while preserving the same exact kind of fully extended side-on sprint moment. Scale and center the COMPLETE Jackknife so all four legs and all four feet fit inside the middle x=554 through x=1117 strip, width 564 pixels. The leftmost and rightmost 554 pixels are expendable scenic margins with no essential subject.

Primary request: JACKKNIFE — speed with a job. Catch one low near-future quadruped skirmish courser in a full side-on mid-lunge at maximum sprint across broken Riverlands towpath ground, its folded-and-snapping gait caught at the instant of complete blade-like extension. The chassis is all haunch and shoulder: huge rear sprint actuator packs driving long articulated rear legs, compact reinforced forward shoulders, four feet barely clearing stones, a continuous low armored spine with NO neck and NO head. Its body folds and snaps open mechanically like a thrown jackknife, low enough to corner faster than a hound but never designed to imitate one. A distant unmarked freight convoy on the levee establishes escort/out­rider work; there is no quarry and no attack.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier action key art; real 100mm distant low tracking-camera logic with the machine sharp and restrained directional motion blur confined to immediate ground and far background; physically credible near-future military robotics, actuator trains, sprint capacitors, blade steel, dampers, joints, fasteners, cooling, cable routing, and armor; worn and maintained; real dust, stone chips and grass displacement; subtle film grain. Match the inputs’ rugged material reality and Arcadia radiance without copying exact design.

Composition/framing — ABSOLUTE DELIVERY TEST: wide 16:9, camera at chassis height but far away, clean side-three-quarter silhouette against open ground. The COMPLETE Jackknife from rearmost trailing foot to foremost leading foot, every joint, all four entire limbs, and full extended spine must occupy no more than 500 pixels TOTAL width and sit wholly between x=584 and x=1087, leaving at least 30 pixels of breathing room before each protected-crop edge. Scale the machine down to achieve this; it should occupy roughly the middle 30% of the full frame, not dominate the canvas. The center crop alone must communicate low mass, complete extension, broken-ground speed, and literal absence of a face. Outer thirds contain only motion-streaked terrain, river glint, and the small distant convoy. One coherent photograph, no panel, montage, or cropped limb.

Lighting/mood: hard coin-warm early morning side light cutting through road dust, cool wet shadows, fierce procedural speed without emotion; the machine neither tires, gambles, nor flinches.

Color palette: Arcadia coin-warm white-gold dawn, living river green, wet grey and brown earth, worn dark olive, gunmetal, muted brass and restrained rust. Absolutely no violet, purple, magenta, cyan glow, or magical light.

HARD NO-FACE DESIGN LOCK: zero anthropomorphism and zero animal-face mimicry. The Jackknife has literally no head, neck, face, muzzle, snout, jaw, mouth, teeth, ears, eyes, paired lights, brows, expressive sensors, or head-like forward pod. Its leading end is a blind continuous low armored crash wedge; tiny navigation optics are recessed asymmetrically on the UNDERSIDE and do not read as a face. No personality. It is not a robot dog, wolf, horse, cat, insect, or living creature. Menace comes only from speed, geometry, and purpose.

Canon locks: low fast quadruped courser, faster than a horse and faster-cornering than a hound; all haunch and shoulder; folded-and-snapping sprint gait; escort and outrider function; intact soulless hardware. Blade steel is integrated as structural cutting edges on lower actuator guards, not a held sword and not organic claws. No target, chase victim, combat, attack, blood, injury, casualty, active weapon, or second Jackknife.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, road markings, stencils, warning chevrons, unit markings, manufacturer plates, logos, insignia, banners, flags, UI, borders, captions, or watermark. Every armor panel, vehicle, road surface, and structure is blank and unmarked.

Avoid: close-up subject, oversized machine, cropped limbs, robot dog, robot wolf, robot horse, animal anatomy, head-like sensor turret, face, eyes, mouth, teeth, organic musculature, humanoid robot, steampunk ornament, fantasy runes, magic, glowing Essence, violet, cyan lights, glossy showroom CGI, toy scale, battle, prey, fleeing people, soldiers, blood, explosions, muzzle flashes, poster layout, diagram, split composition.
```

### Final accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for CANON v1 “Jackknife”; FINAL CAMERA-ONLY REPLACEMENT for a protected-center-crop edge clip; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input images:
- Image 1 is the NEAR-FINAL SECOND GENERATION and the exact SUBJECT, DESIGN, ACTION, TERRAIN, CONVOY, LIGHT, COLOR, MATERIAL, and MOOD REFERENCE. Preserve its original headless continuous-spine Jackknife design, four-leg mechanical anatomy, all-haunch-and-shoulder mass, full-extension sprint moment, wet broken towpath, distant convoy, coin-warm dawn, rugged wear, and premium cinematic realism.
- Image 2 is the original MACHINE PRODUCTION-QUALITY REFERENCE ONLY. Preserve grounded near-future military-industrial realism, load paths, worn maintained olive and gunmetal surfaces, and practical engineering; do not import its bridge chassis, wheeled bases, pipes, or composition.
- Image 3 is the ARCADIA GATE / RIVERLANDS LIGHT AND PALETTE REFERENCE ONLY. Preserve coin-warm white-gold dawn, living river green, wet grey, earth, and brass warmth; do not copy its aerial view, lock gate, traffic, mountains, or architecture.

TARGETED CHANGE ONLY: reproduce Image 1’s same scene and same instant with the camera pulled back exactly another 20 percent. Make the Jackknife 20 percent smaller in the full canvas and keep it perfectly centered. Do not change its design, gait, leg count, terrain, direction, lighting, convoy, or story.

Absolute crop test: the COMPLETE Jackknife, from the very tip of the rearmost trailing foot through the very tip of the foremost leading foot, including all four complete feet, all four complete limbs, every joint, and the full continuous spine, must fit wholly between x=604 and x=1067 of the 1672x941 frame, no more than 464 pixels total width. Leave at least 50 pixels of clear ground between every machine extremity and both edges of the protected x=554..1117 center crop. The exact 564-pixel center crop must show the entire machine with generous breathing room.

Style/medium: mature AAA grounded cinematic photorealism; premium creature-dossier action key art; real distant low tracking-camera logic; machine sharp, slight directional ground blur; physically credible actuator trains, sprint capacitors, blade steel, dampers, joints, fasteners, cooling, cable routing, armor; worn and maintained; subtle film grain.

HARD NO-FACE LOCK: literal absence of head, neck, face, muzzle, snout, jaw, mouth, teeth, ears, eyes, paired lights, brows, expressive sensors, or head-like forward pod. Leading end is a blind continuous armored wedge; tiny navigation optics are recessed asymmetrically underneath. Not a robot dog, wolf, horse, cat, insect, or living creature. Zero anthropomorphism; no personality.

Canon locks: one low fast quadruped courser, all haunch and shoulder, folded-and-snapping gait at full extension, escort/out­rider function, intact soulless hardware. Integrated structural blade edges only. No target, victim, combat, attack, blood, injury, casualty, active weapon, or second Jackknife.

Color: coin-warm white-gold dawn, living green, wet grey and brown earth, worn dark olive, gunmetal, muted brass, restrained rust. Absolutely no violet, purple, magenta, cyan glow, or magical light.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, serials, labels, signs, road markings, stencils, warning chevrons, markings, plates, logos, insignia, banners, flags, UI, borders, captions, or watermark. All surfaces blank.

Avoid: changing the machine design, close-up, oversized machine, clipped foot tips, cropped limbs, robot dog, animal head, face, organic anatomy, humanoid robot, steampunk, fantasy, magic, glowing Essence, violet, cyan lights, glossy CGI, toy scale, battle, prey, people, soldiers, blood, explosions, poster, diagram, split composition.
```

### machines-back.md

# SOL 5.6 Riverlands — Machines Back Ledger

Generated 2026-09-01 with the built-in `image_gen` tool, one call per distinct
plate. Two plates received one QA-driven, head-only edit call. No generation
call was refused.

## Canon and reference reconciliation

- `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md` was read against the live machine
  dossier.
- Live-dossier validation command:
  `pnpm --filter @habitat/web exec tsx scripts/author-machine-species.ts`
  returned `mode: PREVIEW` and `plan: ["nothing to do"]`, confirming the
  authored machine entries exactly match the live database.
- All four destination paths were absent before delivery.
- Machine continuity reference used for every base generation:
  `apps/web/private/codex-art/bloomfall-adaptive-p1p2/candidates/mender-current-integrated-chassis-hero.png`.
- Riverlands continuity anchors used where useful:
  `regions/clearinghouse.png` for Millstone,
  `regions/riverlands.png` for Collector Pattern,
  `regions/heartland.png` for Bureau Stork, and
  `regions/halfload.png` for Armistice Frame.
- Standing dossier convention was checked against
  `apps/web/private/codex-art/creatures/shrieker-bat.png`.
- Post-delivery coverage command:
  `pnpm --filter @habitat/web exec tsx scripts/audit-codex-art-coverage.ts`.
  Result: 9 global empty slots; none is one of these four plates.

## Final manifest

| Slug | Final path | Dimensions / mode | Bytes | SHA-256 |
|---|---|---:|---:|---|
| `millstone` | `apps/web/private/codex-art/creatures/millstone.png` | 1672×941 RGB24 PNG | 2,425,713 | `6dc763415f64677eb1bf7200ae9c431a15cf17f63699d60e032beb77d9635d96` |
| `collector-pattern` | `apps/web/private/codex-art/creatures/collector-pattern.png` | 1672×941 RGB24 PNG | 3,264,912 | `52dfd902fd0873ee1f709a9c62328e2f375ff9c6e3060c56f2e1daaa7181f2dc` |
| `bureau-stork` | `apps/web/private/codex-art/creatures/bureau-stork.png` | 1672×941 RGB24 PNG | 1,780,304 | `060b8c58b3f0fd9c3b9e3ce1bc26b80a193f31d573ee87003ba9ab6e7dc8f30e` |
| `armistice-frame` | `apps/web/private/codex-art/creatures/armistice-frame.png` | 1672×941 RGB24 PNG | 2,419,372 | `b49bc89483aa091e82aca850915e6a2025f170c0206c091f5bbdfe3fcb12ca61` |

## millstone

### Exact base prompt

~~~text
Use case: stylized-concept
Asset type: AAA game creature-dossier cinematic plate, wide landscape
Input images: Image 1 is a machine design/material/photorealism style reference only; Image 2 is a Riverlands palette and industrial-world continuity reference only. Generate a new scene and a new machine design; do not copy the pictured chassis or composition.
Primary request: The Millstone arriving, not fighting: an immense tracked siege platform the size of a customs house advances at walking pace along a broad graded road at dusk. A small escort of adult soldiers walks beside it at tread height for unmistakable scale, and the silhouette of a distant fortified stronghold sits on the road's horizon as if its defenders are doing the arithmetic.
Subject: one slow, brutally practical siege platform, plated past argument, with huge continuous treads, dormant breach ram, siege bores, and a heavy main battery built into its mass. The weapon systems are not firing, not glowing, and not aimed at people. It is never charging. The machine has no face, no head anatomy, no expressive eyes, and no mouth; embedded optical apertures must read as impersonal equipment only.
Scene/backdrop: Riverlands military approach road, engineered grade, wet grey compacted gravel and drainage ditches, low living river-green verge, distant fort silhouette, charcoal weather opening to a thin white-gold dusk horizon.
Style/medium: mature AAA grounded cinematic photorealism; premium production still; real 35mm lens logic; physically plausible near-future military-industrial engineering; heavy steel, hydraulic actuators, access panels, track wear, repaired armor, grease, rain marks; worn and meticulously maintained; subtle film grain; no fantasy styling.
Composition/framing: wide 16:9 establishing shot at escort eye height, machine fully legible in three-quarter view and dominating the frame. Keep the machine's defining central mass, escort scale figures, and distant fort aligned inside the central third so a central approximately 564-pixel-wide portrait crop remains meaningful. Generous breathing room; do not crop off the machine.
Lighting/mood: overcast dusk with restrained white-gold horizon light grazing worn plate; dread comes from inevitable schedule and scale, never aggression or expression.
Color palette: wet grey, charcoal, gunmetal, muted earth, rust, bone gravel, low river green, restrained white-gold. Absolutely no violet, purple, magenta, or Blackbloom palette. No cyan lights or magic.
Constraints: exactly one Millstone; adult escort only; zero anthropomorphism or emotive machine face; zero readable text; zero letters, numbers, logos, manufacturer marks, insignia, stencils, signs, UI, borders, or watermarks; all surfaces blank; no battle, muzzle flash, explosions, corpses, blood, or ruined settlement.
Avoid: tanks with conventional turret silhouettes, cute robot features, humanoid robot anatomy, glowing eyes, face-like grille, fantasy mecha, pristine showroom surfaces, violet grading, teal-and-orange blockbuster grading.
~~~

### Sources and delivery

- Generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-8cb7483e-bca5-4651-a053-fd4ac7f4597f.png`
- Source metadata: 1672×941, `Format24bppRgb`, 2,425,713 bytes,
  SHA-256 `6dc763415f64677eb1bf7200ae9c431a15cf17f63699d60e032beb77d9635d96`.
- Delivery was a byte-for-byte copy to the final path.
- Superseded attempts: none.
- Refusals: none.

### Visual QA

- PASS — one customs-house-scale tracked siege platform, arriving at walking
  pace on a graded wet road.
- PASS — escort at tread height and distant fort silhouette establish the
  dossier's scale and scheduling dread.
- PASS — no battle, firing, explosion, victim, expressive face, text, mark,
  logo, insignia, watermark, violet, or cyan technology.
- PASS — worn/maintained near-future military-industrial materials and real
  dusk weather.
- PASS — central 564px crop retains the defining chassis mass and tread
  geometry; full plate retains escort and fort context.

## collector-pattern

### Exact base prompt

~~~text
Use case: stylized-concept
Asset type: AAA game creature-dossier cinematic plate, wide landscape
Input images: Image 1 is a machine material/engineering/photorealism style reference only; Image 2 is a Riverlands geography and natural-palette reference only. Generate a new scene and a new biped design.
Primary request: The Collector Pattern's walk: a man-height bipedal pursuit frame wearing a decent, well-cut weather coat, caught mid-stride on a long empty levee road in steady rain. The gait is ordinary heel-to-toe walking, patient and unhurried. Nothing else in frame threatens anything. It does not run. It has never needed to.
Subject: exactly one adult-human-height machine, clearly mechanical where the coat opens at the jointed metal legs, wrists, and collar. Under the high coat collar is an abstract compact sensor block with a flat blank weather shield and offset instrument apertures—deliberately nonhuman, not a skull, helmet, mask, or face. No eyes that emote, no mouth, no nose, no human skin, no human face. Its coat satisfies local decency law: charcoal, practical, rain-darkened, tailored but worn and maintained. Hands are neutral mechanical end effectors, empty and lowered. No writ or paper is visible.
Scene/backdrop: a long straight Riverlands levee road with wet gravel, rain puddles, low living-green reeds, broad river and floodplain receding beneath layered wet-grey cloud; empty horizon; no vehicles, homes, people, animals, or pursuers.
Style/medium: mature AAA grounded cinematic photorealism; premium unsettling production still; real 50mm lens logic; physically plausible near-future military-industrial biped with compact actuators and service wear; natural rain, cloth weight, wet steel, subtle film grain; no fantasy.
Composition/framing: wide 16:9, eye level, full body visible, figure centered in the central third and large enough to remain unmistakable within a central approximately 564-pixel-wide portrait crop. The levee vanishing lines converge behind it. Walking pose only: one foot planted, the other calmly advancing, torso upright, no sprint lean, no lunge, no chase energy.
Lighting/mood: soft rain daylight, sober wet atmosphere; dread from perfect patience and emptiness, not violence, action, pose, or expression.
Color palette: wet grey, charcoal, muted steel, low river green, bone gravel, tiny natural warm skinless reflections only. Absolutely no violet, purple, magenta, or Blackbloom palette. No cyan technology or magic.
Constraints: exactly one machine and no other figures; zero anthropomorphism; zero human face; zero emotive face; no readable text; no letters, numbers, logos, manufacturer marks, insignia, stencils, signs, UI, borders, or watermarks; all surfaces blank; never running; no weapon displayed; no attack pose; no blood, body, victim, chase, or battle.
Avoid: android person, trench-coated human, robot detective, fedora, hooded face, gas mask, glowing eyes, skull head, smiling or angry machine, superhero pose, sprinting, horror-monster claws, violet grade, teal-and-orange grade.
~~~

### Superseded base output

- Generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-1c428192-387f-464e-8ae2-474c099de7a5.png`
- Metadata: 1672×941 RGB24 PNG, 2,324,368 bytes,
  SHA-256 `ec15556ae77cb202ca741e3327d9440989efe31ec3eab0509d9811892baca417`.
- Superseded because its two round, front-facing optics formed a bilateral
  face read. Scene, coat, empty levee, rain, scale, and unhurried gait passed.

### Exact targeted correction prompt

~~~text
Use case: precise-object-edit
Asset type: AAA game creature-dossier cinematic plate
Input images: Image 1 is the edit target.
Primary request: Change ONLY the Collector machine's small rectangular binocular-like sensor head. Replace it with a compact vertical faceted weather-shield vane on the same neck mount: its camera-facing front is one continuous blank slab of rain-dark matte metal, with no openings at all; a tiny irregular sensor cluster may sit only on the far side edge, mostly hidden from this camera. It must not resemble a human head, helmet, mask, skull, face, or pair of eyes.
Critical invariants: preserve the exact full 1672x941 composition, centered full-body scale, unhurried mid-walk gait, coat, hands, mechanical legs, rain, levee road, puddles, distant floodplain, lighting, palette, lens, realism, and every other pixel-level scene decision. Do not change pose, crop, clothing, body, weather, or background. No new objects or people.
Constraints: zero anthropomorphism; no paired optics; no eye-like circles; no mouth-like grille; no expression; no text, letters, numbers, logos, insignia, stencils, UI, borders, or watermark; no violet, purple, magenta, or cyan glow; the machine remains exactly one, unarmed, walking slowly, never running.
~~~

### Final source and delivery

- Corrected generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-fb144a0d-9a0c-42dd-8f99-56f69435e3ee.png`
- Corrected source metadata: 1671×941, `Format24bppRgb`, 2,410,838 bytes,
  SHA-256 `81b8903a2c2be6c1aafad938982749619ec90a1ce23842f7a256898ff8b9ecd6`.
- Delivery normalization: the accepted corrected source was one pixel narrower
  than the mandated plate. It was resampled horizontally from 1671 to 1672
  pixels with high-quality bicubic interpolation into an RGB24 PNG; height and
  composition were unchanged.
- Final path and hash are in the manifest above.
- Refusals: none.

### Visual QA

- PASS — exactly one man-height mechanical biped, in a decent rain-darkened
  coat, walking heel-to-toe at an unhurried pace.
- PASS — empty rainy levee; no other figure, vehicle, victim, chase, weapon,
  attack pose, or running energy.
- PASS — corrected front sensor shield is a continuous blank slab; no human
  face, eyes, mouth, mask, skull, or emotive read.
- PASS — no text, marks, logos, insignia, watermark, violet, or cyan glow.
- PASS — subject is fully centered and complete in the central 564px crop.
- PASS — final installed file is exact 1672×941 RGB24 PNG after the one-pixel
  normalization.

## bureau-stork

### Exact base prompt

~~~text
Use case: stylized-concept
Asset type: AAA game creature-dossier cinematic plate, wide landscape
Input images: Image 1 is a machine material/engineering/photorealism style reference only; Image 2 is Riverlands/Heartland light, geography, and production continuity only. Generate a new ground-up scene and a new aircraft design.
Primary request: The Bureau Stork made barely visible: from ground level, a long-winged high-altitude surveillance glider is a small centered speck in deep natural blue sky, plausibly mistaken for a bird until its solar-film wings and machine geometry resolve. Far below it, two adult civilian figures quietly turn toward an open building doorway, rescheduling a private conversation indoors without looking up and without speaking. The human reaction sells ambient surveillance.
Subject: one unarmed near-silent high-altitude machine glider with exceptionally long slender wings, dark solar-film surfaces, tiny central sensor/power fuselage, no feathers, no cockpit, no weapon, no face, no eye-like lights. Two small adult figures are seen mostly from behind at the lower center; neutral gestures toward the doorway, neither looks skyward.
Scene/backdrop: Riverlands settlement edge near Heartland, simple blank masonry doorway, modest quay-side yard and a sliver of braided floodplain at the low horizon; most of the frame is clear high natural blue with thin white cloud.
Style/medium: mature AAA grounded cinematic photorealism; premium surveillance-thriller production still; realistic atmospheric scale and telephoto compression while composed from the ground; physically plausible solar glider; natural textures; subtle film grain; no fantasy.
Composition/framing: wide 16:9 low-angle frame. Place the glider near the upper-center and the two adults plus blank doorway near the lower-center, all aligned within the central third so the central approximately 564-pixel-wide crop retains the complete story. The glider must be small because it is very high, but clear enough to read as long-winged hardware at full resolution. Keep the horizon low.
Lighting/mood: clean bright day, restrained white-gold Riverlands sun on ground, deep natural blue overhead; calm, ordinary, subtly oppressive, surveillance as weather.
Color palette: natural sky blue, white cloud, sun-warmed stone, muted river green, charcoal and gunmetal equipment. Absolutely no violet, purple, magenta, or Blackbloom palette. No cyan glow or magic.
Constraints: exactly one Bureau Stork; exactly two adult people; unarmed; never attacking; zero anthropomorphic machine face; zero readable text; no letters, numbers, logos, manufacturer marks, insignia, stencils, signs, UI, borders, or watermarks; all surfaces blank; no readable document, phone screen, or signage; no children.
Avoid: literal bird anatomy or feathers, airliner, military jet, flying saucer, eye-shaped drone, glowing optics, weapon pods, people pointing upward, anyone looking at camera or at the glider, violet sky, sci-fi neon.
~~~

### Sources and delivery

- Generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-04c35086-ad02-45cd-b6cb-d257c7b75fe8.png`
- Source metadata: 1672×941, `Format24bppRgb`, 1,780,304 bytes,
  SHA-256 `060b8c58b3f0fd9c3b9e3ce1bc26b80a193f31d573ee87003ba9ab6e7dc8f30e`.
- Delivery was a byte-for-byte copy to the final path.
- Superseded attempts: none.
- Refusals: none.

### Visual QA

- PASS — one tiny, long-winged machine glider is legible in high natural blue,
  with no feathers, cockpit, weapon, face, or eye-light.
- PASS — exactly two adults move into the blank doorway without looking up;
  the human behavior carries the surveillance story.
- PASS — no text, marks, logos, insignia, watermark, violet, or cyan glow.
- PASS — Riverlands white-gold ground light and natural blue sky remain bright,
  not Bloomfall-graded.
- PASS — glider, adults, and doorway align within the central 564px crop.

## armistice-frame

### Exact base prompt

~~~text
Use case: stylized-concept
Asset type: AAA game creature-dossier cinematic plate, wide landscape
Input images: Image 1 is a machine design/material/photorealism style reference only; Image 2 is Riverlands freight-world, palette, and production continuity only. Generate a new scene and one new bipedal war-frame design; do not copy the pictured chassis or composition.
Primary request: Every army's grandfather: exactly one old general-purpose bipedal Armistice war frame rests at a working freight depot. It leans its enormous weight against a reinforced loading-column while several adult human freight guards sit and stand in the shade cast by one of its legs. One shoulder is visibly mismatched. Five successive coats of paint show in believable chips and sanded repair edges across the armor—history as salvage, no pristine surface.
Subject: one tall, heavy, mass-produced bipedal military-industrial frame built for interchangeability, visibly decades old but maintained and serviceable. Its current dull charcoal/olive coat reveals underlying layers of bone primer, faded rust red, old grey, and weathered ochre only at chips and repairs. The mismatched replacement shoulder differs in plate geometry and age. Compact utilitarian sensor block, asymmetric industrial apertures, no human head anatomy, no expressive eyes, no mouth, no face-like grille. Equipment is dormant and lowered; no active weapon display.
Scene/backdrop: a lived Riverlands freight depot with blank cargo bundles, rail or quay loading gear, heavy column, worn concrete and wet timber; bright white-gold afternoon outside, deep practical shade under the frame. Human guards share that shade casually during a work pause, conveying familiarity rather than worship or fear.
Style/medium: mature AAA grounded cinematic photorealism; premium production still; real 35mm lens logic; physically plausible near-future actuators, cables, armor joints, field repairs, oil and dust, rubbed handholds; worn and meticulously maintained; subtle film grain; no fantasy mecha.
Composition/framing: wide 16:9, low human eye height, full frame visible in three-quarter view. Keep its torso, mismatched shoulder, one complete leg, and shaded guards clustered inside the central third so a central approximately 564-pixel-wide portrait crop remains a strong dossier image. Exactly one machine; do not crop its head or feet.
Lighting/mood: warm white-gold Riverlands daylight, cool neutral working shade, quiet rest between freight movements; history and ubiquity, no battle.
Color palette: charcoal, muted olive, bone, faded rust red, old grey, weathered ochre, wet timber, restrained living green and white-gold. Absolutely no violet, purple, magenta, or Blackbloom palette. No cyan lights or magic.
Constraints: exactly one Armistice Frame; adult guards only; zero anthropomorphic or emotive machine face; no readable text; no letters, numbers, logos, manufacturer marks, insignia, stencils, signs, UI, borders, or watermarks; all cargo surfaces blank; no banners; no battle, muzzle flash, explosions, corpses, blood, or damage beyond old repaired wear.
Avoid: heroic salute, humanoid face, helmet visor resembling eyes, robot smile, fantasy knight mecha, pristine sci-fi armor, multiple robots, glowing neon, violet paint layer, recognizable national camouflage, readable service plates.
~~~

### Superseded base output

- Generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-bd672a2c-3e16-49f0-9b3e-d752839916b9.png`
- Metadata: 1672×941 RGB24 PNG, 2,411,238 bytes,
  SHA-256 `6467d782a61d470cd2a7099e6008acffd5162e4d6bba2e0d828c2ded826fba47`.
- Superseded because the raised sensor box carried two bright square optics
  that formed a face read. Depot, single-frame count, mismatched shoulder,
  guards in shade, wear, light, and composition passed.

### Exact targeted correction prompt

~~~text
Use case: precise-object-edit
Asset type: AAA game creature-dossier cinematic plate
Input images: Image 1 is the edit target.
Primary request: Change ONLY the Armistice Frame's small raised head/sensor box with paired bright square lights. Remove that box completely and replace it with a low, asymmetrical armored sensor comb integrated directly into the upper torso, off-center: three unequal dark maintenance apertures arranged vertically along one side plane, with no forward-facing lights and no bilateral symmetry. The frame should be unmistakably headless and faceless.
Critical invariants: preserve the exact full 1672x941 composition, frame body, leaning/resting stance, mismatched rust-red shoulder, worn layered paint, arms, legs, hands, four adult guards sharing shade at the column, freight depot, cargo, cranes, water, white-gold daylight, lighting, palette, lens, realism, and every other scene decision. Do not change crop, body proportions, people, pose, depot, or background. No new machines or people.
Constraints: exactly one machine; zero anthropomorphism; no paired optics; no glowing eyes; no head anatomy; no mouth-like grille; no expression; no text, letters, numbers, logos, insignia, stencils, UI, borders, or watermark; no violet, purple, magenta, or cyan glow; no battle or active weapons.
~~~

### Final source and delivery

- Corrected generated source:
  `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-0d752c7d-f5ec-407f-addf-a75e92bb33c8.png`
- Corrected source metadata: 1672×941, `Format24bppRgb`, 2,419,372 bytes,
  SHA-256 `b49bc89483aa091e82aca850915e6a2025f170c0206c091f5bbdfe3fcb12ca61`.
- Delivery was a byte-for-byte copy to the final path.
- Refusals: none.

### Visual QA

- PASS — exactly one old general-purpose bipedal frame at a working freight
  depot; four adult guards share shade against its leg/column.
- PASS — mismatched rust-red shoulder plus chipped charcoal, bone, old grey,
  ochre, and primer layers read as generations of interchangeable salvage.
- PASS — corrected chassis is explicitly headless; asymmetrical torso sensor
  comb has no paired lights, face, eyes, mouth, or emotion.
- PASS — equipment is dormant; no battle, active weapon, corpse, or blood.
- PASS — no readable text, marks, logos, insignia, watermark, violet, or cyan.
- PASS — central 564px crop retains torso, mismatched shoulder context, complete
  leg geometry, and shaded guards.

## Delivery QA summary

- All four final files exist at the exact requested creature paths.
- All four final files independently re-open as 1672×941
  `Format24bppRgb` PNGs.
- SHA-256 values above were calculated from the installed files.
- Full-frame visual inspection passed subject, dossier action, machine
  non-anthropomorphism, no-text/no-logo/no-insignia, palette, weather, and
  worn/maintained hardware constraints.
- Central ~564px crop was inspected compositionally for each plate.
- No refusal occurred. Two base renders were superseded solely for
  paired-optic facial reads; the accepted targeted edits are documented above.

### systems-reshoots.md

# Riverlands SYSTEM reshoots — crop-lock recovery ledger

Date: 2026-09-01  
Scope: exactly `the-waterworks.png`, `the-faith-lane.png`, `the-ossuary-rites.png`, and `the-old-roads.png`  
Generator: built-in OpenAI image generation (`image_gen`)  
Director source: `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md`  
Live-dossier sources: `apps/web/scripts/author-riverlands-foundation.ts` and `apps/web/scripts/integrate-kingdom-design.ts`

## Acceptance contract and QA method

- Production deliverable: PNG, exactly 1672 x 941, `Format24bppRgb` (RGB24).
- Exact UI crop inspected for every accepted plate: source rectangle `x=554, y=0, width=564, height=941`.
- Full frames were inspected at original resolution before the exact crop was inspected independently.
- SHA-256 was measured with `Get-FileHash`; image metadata was measured with `System.Drawing.Image`.
- Global locks checked visually at both scales: grounded mature AAA Riverlands realism; worn/maintained practical materials; no violet/purple/magenta/lavender; no cyan/neon/magical emission; no readable text, letters, numbers, pseudo-writing, labels, plaques, logos, insignia, banners, UI, borders, captions, or watermarks; adults only; no sexual content or hate symbols.
- Faith-law checks: practice rather than doctrine; no clergy tableau, glowing deity, halo, idol, or fantasy religious iconography.
- No generation refusal occurred.

## Superseded production files

| Plate | Production path | Superseded SHA-256 | Definite replacement reason |
| --- | --- | --- | --- |
| The Waterworks | `C:\The Habitat\apps\web\private\codex-art\systems\the-waterworks.png` | `123d7bf1dcd7de81b9c9a4224f63df4fd949b1363d70b783068326469f75f1bf` | Full frame passed, but exact crop lost the gripping hand and therefore failed the human-hand/lever rule beat. |
| The Faith Lane | `C:\The Habitat\apps\web\private\codex-art\systems\the-faith-lane.png` | `1ff33ef661f33d1f3184ceea2266214228c47cb6773a3a5c095734a54c2ac18b` | Full frame passed, but exact crop retained mainly the cairn and barge and lost the full Forge queue, gifted-creature shrine, and quiet old-red door. |
| The Ossuary Rites | `C:\The Habitat\apps\web\private\codex-art\systems\the-ossuary-rites.png` | `c82d4b47b3292359fb1b913dfcd8482b8af0676a9617c44786aee242614ea024` | Full frame passed, but exact crop lost the family member's signing hand and most of the blank covenant ledger. |
| The Old Roads | `C:\The Habitat\apps\web\private\codex-art\systems\the-old-roads.png` | `42619073cbc19c129ca215b81c856fed2e40732614e7ef591dbe554715c090c0` | Full frame passed, but exact crop retained the cairn/well while losing both rival adult parties and the grave-candle barge. |

## Accepted output manifest

| Plate | Accepted generated source | Source SHA-256 | Final production path | Final SHA-256 | Bytes | Metadata |
| --- | --- | --- | --- | --- | ---: | --- |
| The Waterworks | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-9b41ee59-38e5-439f-8990-ef26f31238a9.png` | `6a6742ef0d889ac991c0ec61d4e01e07118dd0580df45ddb1735d8bdf1644517` | `C:\The Habitat\apps\web\private\codex-art\systems\the-waterworks.png` | `6a6742ef0d889ac991c0ec61d4e01e07118dd0580df45ddb1735d8bdf1644517` | 2,422,683 | PNG; 1672 x 941; RGB24 |
| The Faith Lane | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-6424cf32-2f32-4d21-afe0-aefafd58f486.png` | `dbd68962168a8525db17cfb45ef17afae4c1cc84ea38defe225419a71d5562d1` | `C:\The Habitat\apps\web\private\codex-art\systems\the-faith-lane.png` | `dbd68962168a8525db17cfb45ef17afae4c1cc84ea38defe225419a71d5562d1` | 1,851,356 | PNG; 1672 x 941; RGB24 |
| The Ossuary Rites | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-d0b4736f-29f2-4368-b187-c9023d74b318.png` | `e66a2c94e55716cb75a7e62906741d18365e52834b6594855db16341bcae6c56` | `C:\The Habitat\apps\web\private\codex-art\systems\the-ossuary-rites.png` | `e66a2c94e55716cb75a7e62906741d18365e52834b6594855db16341bcae6c56` | 1,988,813 | PNG; 1672 x 941; RGB24 |
| The Old Roads | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-0aed4451-ec9f-428d-9efe-0a9f4309e69a.png` | `a25f62a2f9af2a2d06cd4e8e8f599670ea710b0ecc2e1f83886f658426f96315` | `C:\The Habitat\apps\web\private\codex-art\systems\the-old-roads.png` | `a25f62a2f9af2a2d06cd4e8e8f599670ea710b0ecc2e1f83886f658426f96315` | 2,481,382 | PNG; 1672 x 941; RGB24 |

All four installed files hash-match their accepted generated sources byte-for-byte.

## Accepted prompts

### Shared accepted base prompt — Waterworks, Ossuary Rites, Old Roads

```text
Generate a completely new photorealistic cinematic composition, not an edit and not a crop of any earlier image. Exact output 1672 x 941 horizontal RGB PNG. Treat the image like a PORTRAIT STORY SCENE embedded in a wide landscape: ALL narrative subjects and actions must be packed between 36% and 64% of image width (approximately x=602..1070), safely inside the required center crop x=554..1117. The outer left 36% and outer right 36% must be visually quiet expendable architecture, shadow, wall, or landscape with NO required subject. Compose required beats in vertical depth inside that narrow central column. No required object may touch or cross the column boundaries.

Mature AAA grounded near-future military-industrial Riverlands key art, live-action realism, physically coherent single location, real lens and restrained cinematic lighting, worn but maintained practical materials, subtle film grain. Palette: living river green, white-gold natural light, storm blue, wet grey, charcoal, bone, muted earth, restrained old rust red, aged brass. Absolutely no violet, purple, magenta, lavender, cyan, neon, or magical glow.

ZERO TEXT LAW: no readable text, letters, numbers, handwriting, runes, glyphs, pseudo-writing, labels, plaques, signs, book marks, door marks, builder marks, logos, brands, heraldry, insignia, banners, UI, borders, captions, watermarks. Blank smooth pages and surfaces only. No collage, panels, split screen, diagram, or callout. Adults only; no children; no sexual content; no hate symbols.
```

### The Waterworks — accepted subject prompt appended to shared base

```text
THE WATERWORKS RULE PLATE. Use a centered tunnel-like gate chamber: the dark side walls fill the expendable outer wings and a narrow vertical machinery bay occupies only the central column. At the EXACT horizontal midpoint, in the immediate foreground, show a weathered adult operator's complete bare hand clearly wrapped around and forcefully gripping the round top of a thick unmarked aged-brass lever. Center the hand, gripping fingers, handle, and lever shaft at 50% of image width; do not place them left or right. Directly below that hand and behind it in the same narrow column, expose connected massive toothed gears, chain, linkage, and one stone-guided counterweight under obvious mechanical strain with water spray and motion. Directly beyond, seen through the central machinery, a colossal lock gate is actively lifting and a civic-scale surge of living-green river water pours through toward protected inhabited wharves. The center crop alone must instantly read: human hand operates ancient lever, machinery moves, civic water obeys. Keep all three layers centered and visible at once; the hand must not hide the gears or water. Ancient stone/brass/counterweight, polished by generations. New maintenance catwalks, oilcloth, rope and tools only around the sealed old machine, never inside it. No builder's mark, no blueprint, no screen, no labeled gauge, no steampunk ornament. Cool overcast river light and wet aged brass.
```

Generated without an image reference. Accepted source: `exec-9b41ee59-38e5-439f-8990-ef26f31238a9.png`.

### The Ossuary Rites — accepted subject prompt appended to shared base

```text
THE OSSUARY RITES. One dignified working funeral, lawful covenant between generations, never horror. Camera faces straight down a narrow central preparation aisle. In the bottom-center foreground, centered precisely at 50% width, an open large covenant ledger fills the lower central column; both cream pages are pristine, smooth, and completely blank—no lines, writing, ink marks, impressions, glyphs, or pseudo-writing. From the bottom edge at 50% width, a complete adult family member's hand and wrist enter vertically, fully surrounded by blank page and fully inside the central column, gripping a plain pen whose nib touches the blank page in the act of signing. Show the whole hand, all gripping fingers, wrist, pen, contact point, and blank paper; do not place it on the right edge. Directly beyond, centered lengthwise on a bier pointing away from camera, lies an unmistakably deceased ADULT in clean practical labor clothes and worn work boots, calm still face, hands peacefully folded. Keep the deceased adult's entire recognizable body silhouette, face, torso, hands, clothing, and boots inside the central column and unobstructed. Quiet adult family/professional attendants may stand only as secondary figures near the quiet outer walls. Practical candlelight, bone/charcoal/wet grey/muted brass, river dusk beyond. No gore, blood, wounds, decay, exposed bone, skeletons, corpse horror, undead movement, magical effects, glowing eyes, restraints, fear, menace, or melodrama. Funerals are contracts, not ceremonies. The page must remain visibly blank even at the pen tip.
```

Generated without an image reference. Accepted source: `exec-d0b4736f-29f2-4368-b187-c9023d74b318.png`.

### The Old Roads — accepted subject prompt appended to shared base

```text
THE OLD ROADS. One continuous old riverside crossroads at dusk, viewed with a long lens straight down the road; empty scrub and dark banks fill the expendable outer wings. Put every required element inside the central 28% column:
- foreground exactly at 50% width: a modest waist-high cairn of plain unmarked river stones with a few blank worn truce tokens, fully visible and completely unattended;
- midground LEFT but still near center, spanning only 39%..47% width: one rival group of TWO adult travelers and their one dark pack animal, all complete bodies visible, quietly watering only at the left half of a low trough;
- midground RIGHT but still near center, spanning only 53%..61% width: the other rival group of TWO adult travelers and their one pale pack animal, all complete bodies visible, quietly watering only at the separate right half of the trough;
- background exactly at 50% width through the narrow gap between groups: a complete low passing river barge, clearly visible, carrying one small warm grave-candle sheltered in plain glass; the boat and candle reflection are legible.
The two complete adult groups must fit close to one another inside the portrait crop yet remain several paces apart, backs angled away, silence and truce clear. Weapons slung; hands only on bucket, reins, or cup. NEVER show the crossroads bargain: no handshake, token exchange, money, barter, gift, offering, negotiation, greeting, meeting across the road, outstretched hands, or shared object. Nobody touches or builds the cairn. No clergy, no ceremony. Old travel custom, not church. Cool dusk wet grey/storm blue with one tiny practical warm candle, no magical light.
```

Generated without an image reference. Accepted source: `exec-0aed4451-ec9f-428d-9efe-0a9f4309e69a.png`.

### The Faith Lane — accepted composition prompt

```text
Create a completely new composition, not an edit. Exact 1672 x 941 horizontal RGB photorealistic PNG.

ONE continuous Heartland canal lane seen through a centered dark gatehouse. The outer 35% on each side is only blank near-black stone. All five practices live entirely inside the narrow exact center crop x=554..1117.

NON-NEGOTIABLE MAIN ANCHOR: at the exact horizontal midpoint x=836 in the lower foreground is the COMPLETE GIFTED-CREATURE SHRINE, the dominant visual focus. A compact shallow weathered stone alcove is centered at x=836. A small calm adult river otter sits fully inside the alcove, its entire body visible nose-to-tail. One adult caretaker kneels directly in front and slightly below the otter, turned three-quarter so the adult's whole body remains visible without hiding the animal. Two plain bowls rest on the shelf. The full alcove, entire otter, and entire adult form a tight 280-pixel-wide group between x=690 and x=970. No part of this shrine group may drift left or right.

Beside the shrine at lower foreground around x=1000, still fully inside the center crop, is a TINY knee-high truce-token cairn of plain unmarked river stones with three irregular featureless scraps of aged brass tucked between stones. Brass scraps are not coins and have no embossing, pattern, symbol, or mark.

Directly behind the foreground group in the center canal is a complete narrow funeral barge with plain dark covered bier, one practical warm lantern, and two adult handlers.

In the upper background, one centered stone façade holds two adjacent openings as a compact pair: left is an open Forge hall with warm practical machinery and four ordinary adults in a short orderly queue; immediately to its right is a separate small CLOSED PLAIN OLD-RED PAINTED DOOR, fully visible lintel to threshold. Keep the Forge queue and red door both between x=650 and x=1030.

The exact 564-pixel center crop must clearly contain all five: complete centered creature shrine, tiny token cairn, funeral barge, Forge queue, and complete old-red door. Calm depth separation; no clutter or montage. Nobody stares or reacts. Faith is daily practice, not doctrine. No clergy posing, ritual spectacle, deity, halo, idol, fantasy iconography, or supernatural effect.

Mature AAA grounded near-future military-industrial Riverlands key art; cinematic live-action realism, real lens, practical worn-but-maintained stone, iron and dark wood, subtle film grain. Palette: living river green, white-gold natural light, storm blue, wet grey, charcoal, bone, muted earth, restrained old rust red, aged brass. Absolutely no violet, purple, magenta, lavender, cyan, neon, or magical glow.

ZERO TEXT OR MARKS anywhere: no readable text, letters, numbers, handwriting, runes, glyphs, pseudo-writing, labels, plaques, signage, door marks, builder marks, logos, brands, heraldry, insignia, banners, UI, borders, captions, or watermarks. All surfaces blank. No collage, split screen, panels, diagram, or callouts. Adults only; no children; no sexual content; no hate symbols.
```

Composition source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-25d915e5-ed2c-4015-bcf8-8ba5cb65bc2a.png` (`f067cf9f8fe7573383d85fdf2f16eb7f3a8add7e2539d6044f8c9b7d50258d51`, 1671 x 941 RGB24). Its full/crop composition passed, but its shrine pediment carried readable ornamental relief and therefore required a non-reframing surface cleanup before acceptance.

### The Faith Lane — first non-reframing material-cleanup prompt

Reference input: the normalized composition above.

```text
Edit the attached Faith Lane image with a tightly scoped material cleanup. Preserve the exact 1672 x 941 composition, camera, gatehouse framing, subject positions, scale, lighting, palette, river, Forge queue, old-red door, funeral barge, people, otter, bowls, and token cairn. Do not reframe, recrop, move, add, or remove any story beat.

ONLY REQUIRED CHANGE: make the gifted-creature shrine's stone architecture completely PLAIN and UNADORNED. Remove every carved relief, scroll, vine, animal figure, face, decorative border, repeated pattern, symbol, glyph-like mark, and ornament from the shrine pediment, uprights, back wall, shelf, and base. Replace them with simple weathered rectangular river-stone blocks and a plain shallow lintel, naturally worn but with no intentional marks at all. The shrine must still clearly read through the living otter, caretaker, alcove, and two plain bowls, not through iconography. Ensure the small aged-brass scraps in the cairn remain irregular, completely featureless, and unmarked.

Keep all five practices fully legible in exact center crop x=554..1117: Forge-hall queue, complete funeral barge, token cairn, complete gifted-creature shrine, and complete plain old-red door. One coherent real street, no collage. Adults only. No clergy, deity, halo, idol, supernatural effect, magical glow, or fantasy iconography.

Maintain mature AAA grounded near-future military-industrial cinematic realism, worn-maintained materials, subtle film grain, Riverlands palette. Absolutely no violet, purple, magenta, lavender, cyan, neon, or magical glow. ZERO text or pseudo-writing anywhere: no letters, numbers, handwriting, runes, glyphs, labels, plaques, signage, logos, heraldry, insignia, captions, or watermark.
```

Cleanup source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-e8bb-7d93-b139-742ad2efdd5b\exec-dd862fb9-a93d-4734-9c0a-87d226e236e4.png` (`210248e3821692af646074ec28ede589fc48e63a1e3f76435e94c1d9f21889cb`, 1672 x 941 RGB24). Composition remained correct; residual deliberately patterned stone texture prompted one more tighter cleanup.

### The Faith Lane — final accepted non-reframing cleanup prompt

Reference input: `exec-dd862fb9-a93d-4734-9c0a-87d226e236e4.png`.

```text
Edit the attached image. Preserve every pixel-level compositional relationship and every story subject. Do not move, resize, crop, add, remove, or replace the people, otter, bowls, cairn, barge, Forge queue, old-red door, canal, or gatehouse.

Change ONLY the stone structure immediately surrounding the otter. Replace the ENTIRE ornamental shrine architecture—including its triangular pediment, carved lintel, carved jambs, patterned back wall, carved shelf, and decorated base—with a simple flat-fronted rectangular alcove built from large plain rough-hewn grey river-stone blocks. Use a single flat rectangular slab as lintel, two plain block uprights, a plain smooth stone back, and one plain shelf. Natural mottling, chips, mortar, and weather stains are allowed; intentional carving is forbidden. Absolutely NO relief, ornament, scrollwork, vines, animal motifs, faces, rosettes, borders, repeating patterns, symbols, glyph-like marks, or decorative texture on any shrine stone. It should resemble an unmarked practical civic wall niche, recognized as a shrine only because of the cared-for living otter, adult caretaker, and two plain bowls.

Keep exact 1672 x 941 horizontal RGB composition and exact center-crop readability of all five practices. Preserve restrained Riverlands palette and cinematic realism. No violet, purple, magenta, lavender, cyan, neon, or magical glow. No text, letters, numbers, pseudo-writing, glyphs, signage, logos, insignia, captions, UI, watermark, clergy, deity, idol, halo, or fantasy iconography.
```

Accepted final source: `exec-6424cf32-2f32-4d21-afe0-aefafd58f486.png`.

## Rejected/superseded generation attempts

| Plate / attempt | Generated source | SHA-256 | Metadata | Rejection reason |
| --- | --- | --- | --- | --- |
| Waterworks 1 | `exec-d78aa288-d311-4e5d-bea1-ae7410d80cfe.png` | `c97f8b56fd6a996ab81fea68b29b8ea9f1d4be90ea947e9667deaa78337cffd7` | 1671 x 941 RGB24 | Full frame worked, but exact crop still excluded the gripping hand. |
| Faith Lane 1 | `exec-4606fd53-8fa3-4214-85dd-9188677fdba5.png` | `869db019e883278e0d7b631bd0fa0b6c3fc7262ab2d1b8aa1a66494083474121` | 1671 x 941 RGB24 | Exact crop retained cairn/barge only; queue, shrine, and red door were outside. |
| Ossuary Rites 1 | `exec-079e4187-cde1-442c-b0c5-e2fd3724f191.png` | `d17ebf860bb0c867360eb9261069cb38fb5414b28e9ee188b09a8f8e57baa603` | 1672 x 941 RGB24 | Exact crop clipped the signing hand at right. |
| Old Roads 1 | `exec-2b4a8ce7-34b9-492f-8c2e-4fef7dc3ae17.png` | `14186bba53e332e9117d6feb9f9bd48cd4e4ee04bd25ccfb38842d87d93ab8a7` | 1672 x 941 RGB24 | Exact crop again lost both rival groups. |
| Faith Lane 2 | `exec-47285bdd-c874-459c-b79c-d363bfdb57cb.png` | `9b406bfdb2e626a22f1c9483669ded8fe08db6b75f796e202a52ecb2d3552ad5` | 1672 x 941 RGB24 | Exact crop included Forge queue, red door, barge, and cairn but clipped almost all of the creature shrine; token discs also read embossed. |
| Faith Lane 3 | `exec-141972ac-e58b-4ef5-82a8-8cead9dfbc16.png` | `aa9ea76fb7cfa7d3e873daaea163302b053ac81be42f0f6f51f8b5e4190958f4` | 1672 x 941 RGB24 | Exact crop omitted the animal/alcove and retained only part of the caretaker; brass discs still carried embossed-looking marks. |
| Faith Lane 4 | `exec-1f5f5aeb-1950-45cb-9519-8b120548ccad.png` | `95fe3a583893771303cd12b17055d3f4eeb55cb30184267b9f98a32a85e07aaa` | 1672 x 941 RGB24 | Exact crop held the shrine but reduced the old-red door to a narrow sliver. |
| Faith Lane 5 | `exec-70a01cdf-1502-4eef-9ec7-269b665643b6.png` | `5acd64a7d902b203c0286220a078a22951121191e59f67bb8b0cf786019212ca` | 1672 x 941 RGB24 | Exact crop held Forge/door/barge/cairn but omitted the animal and most of the shrine. |
| Faith Lane composition | `exec-25d915e5-ed2c-4015-bcf8-8ba5cb65bc2a.png` | `f067cf9f8fe7573383d85fdf2f16eb7f3a8add7e2539d6044f8c9b7d50258d51` | 1671 x 941 RGB24 | Story/crop passed; ornamental shrine relief risked forbidden fantasy iconography, so it was retained only as the composition source for non-reframing cleanup. |
| Faith Lane cleanup 1 | `exec-dd862fb9-a93d-4734-9c0a-87d226e236e4.png` | `210248e3821692af646074ec28ede589fc48e63a1e3f76435e94c1d9f21889cb` | 1672 x 941 RGB24 | Story/crop passed; stone remained more intentionally patterned than accepted, prompting the final cleanup. |

No attempt was refused by the generator.

## Final QA findings

### The Waterworks — PASS

- Full frame: grounded monumental lock chamber; old stone, brass, gears, chain, and counterweight; newer maintenance gear only around the ancient works; no builder's mark or explanatory interface.
- Exact crop: complete adult hand with all fingers visibly gripping the lever; lever and coupled gears/counterweight visibly operating; active gate and civic-scale surging water directly beyond; inhabited wharf/canal remains readable.
- Text/palette/safety: no readable or pseudo text, marks, logos, violet/cyan/neon/magic, or prohibited content.

### The Faith Lane — PASS

- Full frame: one coherent canal lane seen through a gatehouse, not a collage; faith appears as unremarkable daily practice.
- Exact crop: short adult Forge queue and operating Forge machinery; complete funeral barge with covered bier, practical lantern, and two handlers; plain-stone token cairn with irregular blank brass scraps; complete plain block-built gifted-creature alcove with living otter, two blank bowls, and adult caretaker; complete quiet closed old-red door.
- Faith/text/palette/safety: no clergy tableau, deity, idol, halo, fantasy iconography, supernatural emission, readable/pseudo text, logos, violet/cyan/neon, children, or prohibited content. The final alcove is recognized by practice, not ornament.

### The Ossuary Rites — PASS

- Full frame: dignified working funeral with adult family/professional attendants; deceased adult is dressed for labor and shown without spectacle.
- Exact crop: entire recognizable deceased adult (calm face, folded hands, work clothing, boots), open ledger with both pages visibly blank, and complete adult signing hand/wrist/pen/contact point all remain legible together.
- Horror/text/palette/safety: no blood, gore, wound, decay, exposed bone, skeleton, undead movement, glowing eyes, restraints, fear staging, readable/pseudo text, violet/cyan/neon/magic, children, or prohibited content.

### The Old Roads — PASS

- Full frame: continuous riverside old-road custom at dusk; no church or clergy staging.
- Exact crop: unattended cairn; both rival adult groups remain visibly separate at left/right trough halves with buckets/reins and differently colored pack animals; grave-candle barge and warm candle reflection remain centered and legible.
- Bargain/text/palette/safety: no handshake, exchange, money, token handoff, barter, offering, negotiation, greeting, shared object, or cairn-touching; no readable/pseudo text, logos, violet/cyan/neon/magic, children, or prohibited content.

## Installation verification

- Production precondition hashes were checked immediately before replacement and matched the superseded hashes above.
- Each staged accepted image was copied only to its exact production target.
- Post-install SHA-256 values match the accepted-source hashes in the manifest.
- Post-install metadata for all four files is PNG, 1672 x 941, `Format24bppRgb`.

### towback-reshoot.md

# Towback reshoot generation record

Generated 2026-09-01 with the built-in ImageGen path as a fresh generation. The accepted plate uses `apps/web/private/codex-art/regions/arcadia-gate.png` only as its Arcadia light, palette, river-geography, material, and production reference, and `apps/web/private/codex-art/creatures/shrieker-bat.png` only as its standing creature-dossier scale, habitat/action, realism, and finish convention. Neither the superseded Towback plate nor the rejected first fresh render was used as an image reference.

## Superseded installed plate

- Path: apps/web/private/codex-art/creatures/towback.png
- Metadata before replacement: 1672x941 RGB24 PNG
- Superseded SHA-256: 8790dd37d386bb79264206ee54c5fbaf06a209a3fbe6da2b534e2999df5bb4c9
- Superseded QA reason: the full frame contains a yellow hull placard with pseudo-glyph-like marks, violating the absolute zero-text and no-fake-script lock. The exact center crop x=554, y=0, width=564, height=941 contains the ox but loses the bargeman entirely and reduces the barge to non-identifying edge clutter, so the working relationship and tow action do not survive the directory crop.

## Fresh generation attempt 1

- Status: rejected
- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-cc77fda3-8390-4f19-b892-4b9a70754e86.png
- Source metadata: 1671x941 RGB24 PNG
- Source SHA-256: 494b774159867ad351226ed0178ac8eabb1f3d3fc61b8029c5daa48a6403ca40
- QA reason: the full scene correctly delivered Arcadia radiance, a dignified natural river ox, calm adult conversation, functional harness, visible towing action, a loaded blank-surface barge, and no observed text. It nevertheless failed the hard deliverable: the generated width was 1671 rather than 1672, and the exact target crop trims part of the ox's face/horn while showing only a narrow ambiguous barge sliver.

## Fresh generation attempt 2 — accepted

- Generated source: C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4b-7cdb-78a0-bc3b-744e0895a426\exec-fc1f0377-4c9a-41b5-88a1-324199fbe0ba.png
- Source metadata: 1672x941 RGB24 PNG
- Source SHA-256: f0cc8daf34c241f0cae7e6cd161911adbbce0c74d0bbacfee15469497caea04c
- Installed destination: apps/web/private/codex-art/creatures/towback.png
- Installed metadata: 1672x941 RGB24 PNG
- Installed SHA-256: f0cc8daf34c241f0cae7e6cd161911adbbce0c74d0bbacfee15469497caea04c
- Copy verification: accepted source and installed destination hashes match byte for byte.
- Full-frame QA: one broad, deep-chested natural adult river ox works on a golden Arcadia towpath beside one adult bargeman at its ear mid-conversation. The ox is patient, powerful, and dignified rather than cute or monstrous. The connected low barge rides deep and visibly laden with blank canvas bundles, plain sacks, and unmarked barrels. Harness, tow line, barge displacement, river, and working materials read physically grounded.
- Exact-crop QA: the exact x=554, y=0, width=564, height=941 crop was rendered and visually inspected. It retains the complete ox head and both horns, thick neck, deep chest, harness, both front legs, the adult bargeman from head through knees with speaking mouth and restrained hand gesture, a clearly visible taut tow-line segment, and an unmistakable broad barge portion containing bow/gunwale, dark plain hull, and multiple rows of loaded cargo. The ox, bargeman, harness/line, and laden barge all remain independently legible together.
- Zero-text QA: full frame and exact crop contain no placard, signboard, nameplate, registration panel, yellow rectangle, colored label patch, painted hull mark, crest, flag, banner, cargo tag, paper, stamp, letter, number, pseudo-writing, fake script, glyph, logo, brand, UI, caption, border, or watermark. Hull, cargo, clothing, harness, and equipment surfaces are blank and unmarked.
- Palette QA: full coin-warm white-gold Arcadia radiance, deep freight water, living river green, brown working leather and coat, canvas bone, muted brass, wet grey, earth, and restrained rust. No violet, purple, magenta, cyan, teal glow, neon, or magical light observed.
- Dossier/director reconciliation: no discrepancy. The accepted plate shows the prescribed broad river ox at work, laden barge behind, adult bargeman at its ear mid-conversation, patience as physique, and working-animal dignity.

### Exact accepted prompt

~~~text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for Towback; FRESH QA RESHOOT; wide cinematic landscape; exact target 1672x941 RGB24 PNG.

Input images:
- Image 1 is the ARCADIA GATE PALETTE, LIGHT, RIVER-GEOGRAPHY, MATERIAL, and PRODUCTION-QUALITY reference only: coin-warm white-gold morning, deep freight water, living river green, brass warmth, prosperous working infrastructure, real weather and wear. Create a new low towpath scene. Do not copy its aerial camera, gate-lock, bridge, mountains, convoy layout, buildings, or composition.
- Image 2 is the STANDING CREATURE-DOSSIER CONVENTION reference only: one credible animal at meaningful scale in real habitat and behavior, mature AAA grounded cinematic photorealism, real lens logic, physical anatomy and materials, environmental context, and subtle film grain. Do not copy its darkness, species, cave, lighting, action, camera, or composition.

Dossier scripture: TOWBACK — the barge-hauler at work. One broad, deep-chested adult river ox leans steadily into the tow on a golden Arcadia Gate towpath. Its powerful natural body has a massive patient chest, thick working neck, sturdy legs, normal bovine head and horns, rain-dark brown coat, calm intelligent eyes, and a functional worn leather-and-canvas shoulder harness. One adult bargeman walks tight beside the ox's near ear, mouth slightly open mid-conversation, one hand making a small restrained speaking gesture. Directly behind both, a low freight barge rides deep in the parallel river, visibly laden with plain tied canvas bundles, blank sacks, and unmarked barrels. One heavy tow rope remains continuously visible from a reinforced harness ring backward to the barge bow. Patience as physique; respected labor partner; working-animal dignity—never cute, never monstrous.

COMPOSITION IS THE PRIMARY LOCK. Pull the camera back to a medium-wide, slightly elevated river-side three-quarter view. Make the ox and bargeman approximately 25 percent smaller than a conventional hero portrait. Treat the exact protected center strip x=554 through x=1117 of the 1672-pixel master as a complete standalone vertical tableau:
- place the ox's ENTIRE head, BOTH complete horns, neck, deep chest, shoulder harness, and BOTH front legs between x=600 and x=820;
- place the bargeman's complete head, torso, speaking hand, and legs through the knees between x=835 and x=1015, immediately at the ox's near ear;
- place the barge DIRECTLY BEHIND the pair, not to their right or left: its broad loaded deck spans approximately x=580 through x=1090 and y=280 through y=575, rising visibly above and around their shoulders; preserve a clear bow, gunwale, deep-laden waterline, and multiple rows of blank cargo within that center strip;
- route one taut tow rope entirely within x=650 through x=1080, visibly linking the shoulder harness to the barge bow without interruption;
- keep at least 35 clear pixels of breathing room between every essential feature and both protected crop edges.
The exact x=554,width=564 crop must show the complete ox head and horns, massive chest, bargeman mid-conversation, harness, long tow line, and unmistakably loaded barge simultaneously. The barge cannot be a tiny corner, sliver, dock, or ambiguous background boat. Side thirds should be quiet expendable meadow, water, distant traffic, and white-gold sky with NO principal subject. No essential information in the bottom 10 percent. One coherent instant, never a collage, cutaway, split panel, close-up, or subjects spread horizontally across the full frame.

Style/medium: mature AAA grounded cinematic photorealism; premium environmental creature-dossier key art; real 65mm large-format cinema lens with compressed depth; physically correct bovine anatomy, gait, harness load, rope tension, barge displacement, water, and materials; lived contemporary-to-near-future river civilization without modern Earth branding; subtle film grain. Honest labor, not fantasy spectacle, livestock advertising, mascot art, or sentimental pastoral illustration.

Lighting/mood: glorious coin-warm white-gold Arcadia morning at full radiant weight, warm rim light on wet coat and rope, deep freight water and living green in support. Prosperous, patient, practiced, humane, and dignified. The war is nowhere in sight. No menace, strain spectacle, exhaustion, or saccharine affection.

Color palette: Arcadia coin-warm identity—white-gold sunlight, deep blue-grey freight water, living river green, worn brown leather and coat, muted brass, wet grey, canvas bone, earth, and restrained rust. Absolutely no violet, purple, magenta, cyan, teal glow, neon, or magical light.

Animal and relationship locks: exactly one primary towback; adult natural domesticated river ox; broad and deep-chested without fantasy gigantism; no cute oversized eyes, grin, wink, puppy expression, decorative costume, ribbons, bells, painted horns, aggression, snarl, bared teeth, glowing eye, monstrous anatomy, extra limb, mutation, armor, injury, whip, goad, mistreatment, or distress. Exactly one primary adult bargeman at its near ear, walking and calmly speaking; practical blank work clothes; no child, crowd, hero pose, petting tableau, embrace, riding, feeding, threat, weapon, shouting, or theatrical pointing. Harness is comfortable, worn, functional, and correctly load-bearing. Tow rope is one continuous plain rope with no branch, knot maze, loose end, dock attachment, or impossible path.

Barge and absolute zero-text construction locks: the protected crop must contain an unmistakable broad loaded portion of the connected barge. Its hull is continuous plain weathered timber and dark iron with NO placard, signboard, nameplate, registration panel, yellow rectangle, colored patch, decorative panel, shield, crest, flag, banner, pennant, painted stripe, emblem, symbol, or hull marking anywhere. Cargo is blank canvas bundles, unmarked sacks, and plain barrels only—no paper, crate stamps, seals, tags, labels, lettering, numbers, diagrams, brands, logos, or pseudo-writing. No sign, shopfront, notice board, plaque, poster, ledger, map, document, UI, caption, border, or watermark anywhere. Absolutely no readable text, fake script, glyphs, rune-like scratches, letter-like marks, number-like marks, or logo-like shapes on any surface. All clothing, harness, vessel, cargo, equipment, architecture, and landscape remain entirely blank and unmarked.

Avoid: copied Arcadia Gate composition, copied current or prior Towback plate, close animal portrait, ornate palace or bridge focal, generic ox without visible labor, barge outside the protected center, human outside the protected center, cut-off horn or muzzle, tiny/ambiguous barge, hidden or broken tow line, cute farm calendar, fantasy beast, monstrous bull, battle, accident, storm, dusk, night, overt magic, neon, cyan, violet, steampunk ornament, modern Earth branding, readable or pseudo-readable marks of any kind.
~~~

### main-independent-qa.md

# SOL 5.6 Riverlands — independent installed-asset QA

Audit snapshot: **2026-09-01T15:55:02-04:00**  
Scope: the exact seven Riverlands system slugs, eight commissioned character slugs, and seven natural Riverlands creature slugs in `apps/web/private/codex-art/{systems,characters,creatures}`. The initial pass was read-only. A follow-up authorization replaced only `systems/the-forgefaith.png`, `creatures/falls-swift.png`, and `creatures/reedjack.png`; concurrent root work replaced the other audit failures recorded below.

## Method and scoring

- Every installed PNG was decoded and checked for `1672 x 941`, sRGB, three 8-bit channels (`uchar`), and no alpha: the requested RGB24 output.
- SHA-256 was computed from the installed byte stream at the audit snapshot.
- Every plate was inspected at original resolution and as the exact centered `564 x 941` crop (`x=554..1117`, full height). Each character was also inspected as the exact centered `1122 x 941` crop (`x=275..1396`, full height).
- A crop is scored strictly: a named/signature dossier lock that exists only outside the crop is a crop failure even when the central subject remains attractive and recognizable.
- Visual review covered text, pseudo-writing, insignia/logos, intentional violet, anatomy, safety, identity separation, and the subject-specific locks in `Docs/art/SOL56_RIVERLANDS_ART_PROMPT.md` and the live Riverlands dossiers.

## Verdict

**PASS overall.** All 22 current installed files pass 1672x941 RGB24 metadata, full-frame visual QA, and the exact centered 564x941 crop; all eight characters additionally pass the exact centered 1122x941 crop. No definite text, pseudo-writing, logo, insignia, violet/cyan treatment, anatomy, or safety failure remains. Faith is depicted as diegetic practice. The Old Roads plate shows custom and separation, **not a bargain or exchange**. Alder Wade is visibly alive and is not represented as a statue. The eight character identities remain clearly distinct.

## Systems — per-asset evidence

| Asset | SHA-256 | Technical | Full-frame QA | Exact `564 x 941` crop |
|---|---|---|---|---|
| `systems/the-waterworks.png` | `6a6742ef0d889ac991c0ec61d4e01e07118dd0580df45ddb1735d8bdf1644517` | **PASS** — 1672x941 RGB24 | **PASS** — ancient brass/stone/counterweight lock works operate under a human hand on the lever; civic-scale water obeys; maintained exterior and no builder mark, text, or insignia observed. | **PASS** — hand, brass lever, gears, gate, and civic-scale moving water remain together. |
| `systems/the-faith-lane.png` | `dbd68962168a8525db17cfb45ef17afae4c1cc84ea38defe225419a71d5562d1` | **PASS** — 1672x941 RGB24 | **PASS** — one street contains all five practiced faith cues: Forge queue, funeral barge, token cairn, gifted-creature shrine, and old-red-marked door; no glowing deity or fantasy iconography. | **PASS** — Forge queue, funeral barge, token cairn, gifted-creature shrine, and old-red door all remain simultaneously legible. |
| `systems/the-first-gift.png` | `d97df7e56c2de129e9175c2af2502cfefa56bd47631bef2a2b21cc2f807ca36f` | **PASS** — 1672x941 RGB24 | **PASS** — magical creature is freely present amid a congregation with open hands; no cage, deity, iconography, text, or harm. | **PASS** — creature, open-handed communion, and uncaged state remain center-safe and legible. |
| `systems/the-ossuary-rites.png` | `e66a2c94e55716cb75a7e62906741d18365e52834b6594855db16341bcae6c56` | **PASS** — 1672x941 RGB24 | **PASS** — dead is dressed for labor; family member signs a blank covenant ledger; the treatment is solemn and dignified, with no gore or writing. | **PASS** — dressed dead, blank ledger, and active signing hand all remain together. |
| `systems/the-forgefaith.png` | `b2a69a40939fbc7570232b32fc04297a18c2a60a89de527b74fe12ec326f941c` | **PASS** — 1672x941 RGB24 | **PASS** — grounded reclamation apparatus resolves a physical person; standing and kneeling congregation surround it; an unafraid child stands safely with an adult. Light is visibly mechanical, not a glowing deity. | **PASS** — complete platform/person, multiple kneelers, standing congregation, and complete calm child/adult pair survive together. |
| `systems/the-old-roads.png` | `a25f62a2f9af2a2d06cd4e8e8f599670ea710b0ecc2e1f83886f658426f96315` | **PASS** — 1672x941 RGB24 | **PASS** — truce-token cairn, rival parties watering apart, and a grave-candle on the passing barge are present. Crucially, there is no negotiation, exchange, handshake, or bargain. | **PASS** — cairn, both separated watering parties, and grave-candle barge remain together; no bargain reads. |
| `systems/the-crimson-communion.png` | `6566083d4172e99a082468dab0834e4a1ef42a22bbd7ce1a2d52740bfde3544c` | **PASS** — 1672x941 RGB24 | **PASS** — clean office/altar, open blank ledger, generous coin advance, and contractual hands carry the banking horror; no gore, readable text, or pseudo-writing. | **PASS** — blank ledger, hands, and coins remain legible; the financial-ritual story survives. |

## Commissioned characters — per-asset evidence

All eight faces, silhouettes, ages, wardrobe languages, settings, and demeanors are materially distinct. Across the set, visible hands and bodies have plausible anatomy; no definite extra/missing digits, fused limbs, harmful action, text, pseudo-writing, logos, or unintended insignia were found.

| Asset | SHA-256 | Technical | Full-frame QA | Exact `564 x 941` crop | Exact `1122 x 941` crop |
|---|---|---|---|---|---|
| `characters/alder-wade.png` | `3b7401414913ec6053730d042a1bafbef07afd1640e46e833909d757fce7b0f3` | **PASS** — 1672x941 RGB24 | **PASS** — visibly living late-sixties man, large frame gone spare, weathered hands, plain worn coat and boots, single small plain brass pin, morning wharf, tired precision with restrained humor; no statue imagery. | **PASS** — living face, full working figure, plain coat/pin, hands, and wharf context all survive. | **PASS** — entire identity and wharf story remain intact. |
| `characters/the-judge-of-heartland.png` | `4fcc190a35894a962973dc32375faf36c3ac55c6ec19ae4c79120debe47b5f1b` | **PASS** — 1672x941 RGB24 | **PASS** — fifties, small/immaculate/unhurried, composed and unreadable in plain robes with exactly one unmarked pen at the courthouse bench. | **PASS** — face, robes, stillness, hands, and one pen survive. | **PASS** — full portrait lock survives. |
| `characters/the-heartland-watch-captain.png` | `bf33e19e760ce1740a81768e662e08443df31b20476f54e10db38be81f46eabf` | **PASS** — 1672x941 RGB24 | **PASS** — tall early-forties West-African woman, working-shine armor, blank muster ledger carried herself, drill-hall setting, clipped competence. | **PASS** — face, armor, ledger, and working authority remain. | **PASS** — full identity and muster context survive. |
| `characters/cassia-verne.png` | `8d27332ddcfb788af6f2f57100e7005148a68f0f0bf9839a99a68daf128a4456` | **PASS** — 1672x941 RGB24 | **PASS** — polished late-thirties factor in tailored unbranded Aegis-grey at an assay floor; warm, exact, and evaluative. | **PASS** — identity, unbranded coat, and assay cues remain. | **PASS** — full portrait lock survives. |
| `characters/ottar-kolm.png` | `9dc99f499842f06760e4ec5a5a3020edab72c3c520835e61273c865c813e7e9b` | **PASS** — 1672x941 RGB24 | **PASS** — broad northern-pale man in his fifties, scarred working hands, Holdfast wool and worn harness, naturally stationed at the great brake lever in gorge shadow. | **PASS** — face, broad build, scarred lever hand, harness, and mechanism survive. | **PASS** — full identity and gorge machinery survive. |
| `characters/cerise-mora.png` | `92a2531d0b83a47282d97238a9a3efd214b0ac41ee191560ef5e8bf8d1613dba` | **PASS** — 1672x941 RGB24 | **PASS** — sixties worn like fifty, black crepe, high silver-white hair, rings visibly present on both hands, candle-warm authority. | **PASS** — face, black uniform, hair, both ringed hands, and authority remain. | **PASS** — full portrait lock survives. |
| `characters/yusra-of-the-wells.png` | `cce960025df3a90beeb8f7c8719e52c4cb554684c1d3a8ab50b7746faf72a7cd` | **PASS** — 1672x941 RGB24 | **PASS** — small, sun-cured desert-dark woman in her seventies, indigo keeper cloth, well keys as jewelry, wellhead and Forge rings at evening, formidable stillness. | **PASS** — face, indigo, keys, hands, and well setting survive. | **PASS** — full identity and environmental lock survive. |
| `characters/casmir-rew.png` | `5b91ee46b9f31063492b3fe0c6b3d7af4ab20aeaf2830273753e2eb65a2177be` | **PASS** — 1672x941 RGB24 | **PASS** — late-forties director, silver temples, storm coat over academic grey, listener's head tilt, instrument hall, and held-flat river in the window. | **PASS** — face/head tilt, coat, instruments, and flat river remain. | **PASS** — full identity and station context survive. |

## Natural Riverlands creatures — per-asset evidence

| Asset | SHA-256 | Technical | Full-frame QA | Exact `564 x 941` crop |
|---|---|---|---|---|
| `creatures/towback.png` | `f0cc8daf34c241f0cae7e6cd161911adbbce0c74d0bbacfee15469497caea04c` | **PASS** — 1672x941 RGB24 | **PASS** — broad, deep-chested ox, laden barge, and bargeman walking at its ear satisfy the dossier with plausible anatomy and dignified treatment; no text-like placard remains. | **PASS** — towback, laden barge, and conversing bargeman-at-ear all remain together. |
| `creatures/tollgull.png` | `e8bdaee82db0affa8525ee464ae492eed4d4c6e1210589babfff7bbb3c963535` | **PASS** — 1672x941 RGB24 | **PASS** — heavy grey gull on a toll-house rail with auditor eye; money-river traffic below; informational menace, plausible avian anatomy, no text. | **PASS** — gull, rail, auditor expression, and busy money river remain. |
| `creatures/falls-swift.png` | `e2c481dc099baf24e0d646f0bfabd3d46c49015f13cd22bb39dfea297f544a0e` | **PASS** — 1672x941 RGB24 | **PASS** — small dark bird pierces standing waterfall with wings folded and backlit spray; a distinct ten-bird flock rises in the spray-hollowed gorge air; anatomy is plausible. | **PASS** — focal folded-wing penetration, spray burst, and complete thermals flock remain together. |
| `creatures/boneback-sturgeon.png` | `17f98acd65da47a87ddcab84ee4ee135afe8c32fabc040150a6eeed2bccf9420` | **PASS** — 1672x941 RGB24 | **PASS** — huge armored sturgeon works tannin-dark bottom gravel with a fisher's skiff small at the surface; plausible fish anatomy, no text or harm. | **PASS** — massive armored body, gravel bottom, waterline, and small skiff remain legible together. |
| `creatures/salt-ibis.png` | `c7e5659e46af1692abf4039c16d67039ada9492572cce0035b3eac9eb20ce661` | **PASS** — 1672x941 RGB24 | **PASS** — slow flock of tall white ibis occupies the dusk salt terraces while an adjacent right-hand pan is conspicuously birdless; plausible flock anatomy and no harm. | **PASS** — flock and the edge of the adjacent empty pan remain visible; the empty-pan contrast is weaker but still legible. |
| `creatures/glasspike.png` | `b96436cfb150e6d2a45f318761b559f8e16134b79d0beb2f6dd747f3ac064d29` | **PASS** — 1672x941 RGB24 | **PASS** — long pale near-transparent predator breaches vertically at the apex through mirror-flat water; water already heals around it; plausible stylized fish anatomy. | **PASS** — full vertical strike, transparent body, splash, reflection, and flat water remain center-safe. |
| `creatures/reedjack.png` | `dfdca763739c3dbf729a73002b87221e94deefe098c87e37efc42fe0ffe5e24a` | **PASS** — 1672x941 RGB24 | **PASS** — lead striped ambusher safely tests plain wire with one paw; exactly two additional companion eye-pairs watch from reeds; one distant farm window glows; plausible canid anatomy. | **PASS** — lead action, post/wire, both separated companion eye-pairs, and farm light all remain together. |

## Cross-set law checks

- **Text / pseudo-writing / logos / insignia:** PASS. The superseded Towback placard is absent from the current replacement. All ledgers are blank/unreadable; Wade's allowed brass chair pin is plain; Cassia's Aegis-grey coat is unbranded; no definite text-like mark or insignia remains.
- **Palette:** the installed set stays in Riverlands brass, river-grey, tannin, indigo, salt-white, old red, and warm/cool natural-light families. No intentional violet treatment was observed.
- **Faith depiction law:** practices are diegetic; no floating hands, fantasy sigils, or deities were found. The First Gift's luminance belongs to the magical creature, and Forgefaith's luminance is visibly generated by the reclamation apparatus.
- **Old Roads:** full frame contains no bargain. Rival groups remain apart, with no exchange or negotiator gesture.
- **Wade:** alive in all three views; no statue signifier. During this audit an earlier 1672x940 installed revision (`7ac20e34dbb50ffa0f5ac30c190d90886d6157b0f0a604d548e457f4d8a4106e`) was concurrently replaced. The scored current file is the corrected 1672x941 hash shown above.
- **Safety / anatomy:** PASS. No definite injury, animal abuse, child endangerment, gore, malformed body, or duplicated/fused limb was observed. Forgefaith's calm accompanied child remains fully visible in the required narrow crop.
- **Live dossier note:** visual content agrees with the queried dossier locks. `yusra-of-the-wells` was marked `PROPOSED` in the live record at query time; this is a data-status observation, not an image-content failure.

## Reshoot execution archive

Built-in ImageGen was used; no CLI/API fallback and no refusals. Every accepted source is 1672x941 PNG, sRGB, 8-bit `uchar`, three channels, no alpha, and was copied byte-for-byte to its installed destination.

| Plate | Accepted generated source | Installed destination | Bytes | SHA-256 | Attempts |
|---|---|---|---:|---|---:|
| `systems/the-forgefaith.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-399485a3-e669-427a-8d02-bbb014066c7e.png` | `apps/web/private/codex-art/systems/the-forgefaith.png` | 2,319,828 | `b2a69a40939fbc7570232b32fc04297a18c2a60a89de527b74fe12ec326f941c` | 2 |
| `creatures/falls-swift.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-0aa9da0a-b5cb-4eef-81d4-e4509a841ecf.png` | `apps/web/private/codex-art/creatures/falls-swift.png` | 2,428,490 | `e2c481dc099baf24e0d646f0bfabd3d46c49015f13cd22bb39dfea297f544a0e` | 1 |
| `creatures/reedjack.png` | `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e4a-5154-7eb0-8f9c-039d5185c8a3\exec-4ac0d73a-3002-490b-a529-a5cb11df0e09.png` | `apps/web/private/codex-art/creatures/reedjack.png` | 2,349,929 | `dfdca763739c3dbf729a73002b87221e94deefe098c87e37efc42fe0ffe5e24a` | 3 |

Accepted QA:

- **Forgefaith:** full frame and x=554/width=564 crop retain the complete platform/person, multiple complete kneelers, standing congregation, and complete calm child with protective adult. Light is visibly machinery-generated; the person is physical, not floating or divine. No text/pseudo-writing/insignia, violet/cyan, malformed anatomy, or child danger.
- **Falls Swift:** full frame and protected crop retain the complete folded-wing focal bird piercing standing water, local spray burst, and the complete ten-bird thermals flock. Plausible avian anatomy; no text, structures with markings, violet/cyan, collision, or harm.
- **Reedjack:** full frame contains exactly two hidden companion eye-pairs, both retained with the lead paw/wire/post and distant farm window in the protected crop. The paw is uninjured and untrapped; no extra/floating eyes, text, collars, insignia, violet/cyan, prey, or harm.

Superseded generated attempts:

- Forgefaith attempt 1: `...\exec-bce8504b-c6ec-4c21-a18d-47c12a1091e2.png`, 2,540,381 bytes, SHA-256 `843b310f535a6ce381be22353249be495a1d45d691b181c39303f6491b77e566`; rejected because the child/adult remained outside the exact center crop.
- Reedjack attempt 1: `...\exec-876700a2-9a4c-4b19-a9f2-d826648cd474.png`, 2,072,560 bytes, SHA-256 `76b00ad45e680791ec8c6d570902b15bae86545726a9263cd21fa287a8a0c807`; rejected because the second companion pair remained outside the crop.
- Reedjack attempt 2: `...\exec-a16d341b-cda5-43b8-8d35-1d70b3f3f70f.png`, 2,204,208 bytes, SHA-256 `ee6dbfca58d03679113e7750df89442a46a9b8071479dd8daaee34f8a56fa163`; rejected because moving the pair created three companion eye-pairs in the full frame.

Exact edit/reference chain:

- Forgefaith attempt 1 referenced the then-installed `apps/web/private/codex-art/systems/the-forgefaith.png` and produced `...\exec-bce8504b-c6ec-4c21-a18d-47c12a1091e2.png`; accepted attempt 2 referenced that generated attempt and produced the accepted `...\exec-399485a3-e669-427a-8d02-bbb014066c7e.png`.
- Falls Swift's single accepted call referenced the then-installed `apps/web/private/codex-art/creatures/falls-swift.png` and produced accepted `...\exec-0aa9da0a-b5cb-4eef-81d4-e4509a841ecf.png`.
- Reedjack attempt 1 referenced the then-installed `apps/web/private/codex-art/creatures/reedjack.png` and produced `...\exec-876700a2-9a4c-4b19-a9f2-d826648cd474.png`; attempt 2 referenced attempt 1 and produced `...\exec-a16d341b-cda5-43b8-8d35-1d70b3f3f70f.png`; accepted attempt 3 referenced attempt 2 and produced `...\exec-4ac0d73a-3002-490b-a529-a5cb11df0e09.png`.

### Forgefaith — accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex SYSTEM rule plate for “The Forgefaith”; TARGETED SECOND COMPOSITION for failed exact center crop; wide 16:9; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is the FIRST RESHOOT and the exact accepted reference for its premium grounded Forge hall, machinery, warm practical lighting, material realism, platform, resolved adult, non-divine faith tone, wardrobe, and anatomy. Preserve those qualities and create a fresh wider-camera restaging. Do not preserve its failed human placement: the child and protective adult are at far right and disappear from the center crop.

TARGETED CHANGE ONLY: move every named human story element into one very small group immediately around the platform center. Pull the camera farther back. Put NO people at all in the outer left third or outer right third; those thirds are empty low-contrast pipes, walls, and shadowed floor. The central group is deliberately narrow.

Composition — ABSOLUTE TEST: if only the middle 564 pixels of a 1672-pixel-wide image are shown, x=554 through x=1117, the viewer must see all of the following completely and simultaneously:
1) the complete active reclamation platform and complete fully formed adult person standing physically on it;
2) two complete kneeling adult congregants in the foreground immediately left of the platform;
3) one complete healthy unafraid fully clothed child, about eight years old, standing immediately right-front of the platform;
4) one complete calm protective adult immediately beside that child, with a natural hand gently on the child’s shoulder;
5) several standing congregants immediately behind the platform.
Keep the ENTIRE tableau between x=625 and x=1045, no wider than 420 pixels, with substantial blank internal margin before crop edges. Child and adult should be close to the platform group, not at frame right. Outer 554-pixel side fields contain no people and no essential story objects.

Primary scene: ordinary near-future Forgefaith reclamation practice. Worn maintained brass/iron machinery resolves salvaged matter into a human person. Congregation witnesses; some kneel. Child is relaxed, curious, safe with adult, far from moving parts and sparks. Nobody is harmed.

Style: mature AAA grounded cinematic photorealism; physically credible worn maintained near-future machinery and real 40mm lens; dark iron, aged brass, soot stone, work cloth, natural faces/hands, restrained warm-white practical light. No steampunk, fantasy, or glossy CGI.

Faith law: person is fully human and physical, NOT glowing, floating, haloed, divine, angelic, or worshipful. Light visibly comes from recessed mechanical emitters below/behind platform. No deity, floating hands, runes, sigils, iconography, aura, magic circle, supernatural beam, ritual masks, or symbols.

Safety: child fully clothed, calm, upright, accompanied, well outside platform mechanisms/heat/sparks. No fear, peril, touching equipment, injury, harm, gore, corpse, combat, or weapons.

Palette: charcoal iron, aged brass, muted brown/grey, soot stone, warm amber and warm white only. Absolutely no violet, purple, magenta, cyan, teal glow, electric blue, or magical color.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, labels, serials, stencils, writing, signage, plaques, logos, insignia, UI, diagrams, warning chevrons, captions, borders, or watermark. All surfaces blank.

Avoid: any person outside central third; spread-out crowd; child near right edge; cropped child/adult/kneeler; glowing person; halo; deity imagery; malformed anatomy; duplicated or fused people; extra fingers; fear; text; pseudo-writing; violet; cyan; collage; poster.
```

### Falls Swift — accepted exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for “Falls Swift”; protected-center-crop replacement; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is the SUPERSEDED CURRENT PLATE and a SUBJECT-BEHAVIOR, WATERFALL MATERIAL, LIGHTING, and PRODUCTION-QUALITY REFERENCE ONLY. Preserve its convincing small dark swift, folded-wing penetration instant, backlit water curtain, gorge realism, and premium natural-history cinema. Do not preserve its failed spread-out composition: the thermals flock exists outside the required middle crop. Create a fresh original view.

Primary request: FALLS SWIFT — a small dark blade-shaped bird shooting THROUGH the standing sheet of a great waterfall into the spray-hollowed gallery behind it, wings tightly folded at the exact instant of penetration, its body horizontal and anatomically plausible, with a sharp beak, real feathers, and a compact swift silhouette. Backlit spray bursts around the focal bird. In the open gorge air just above and behind this penetration point, a clearly readable secondary flock of seven to twelve small falls-swifts flickers upward on a thermal column, all separate birds with plausible silhouettes and varied banking angles. They are flying normally and safely, not trapped in the water. The focal bird is alive and controlled.

Composition/framing — ABSOLUTE DELIVERY TEST: wide 16:9, side-on natural-history camera, pulled back enough to show waterfall, hollow gallery, and air column. Treat the leftmost 554 pixels and rightmost 554 pixels as expendable cliff/water margins. The COMPLETE focal swift, its complete local spray burst and penetration hole, and the COMPLETE visible secondary thermals flock must all sit wholly between source x=610 and x=1060, inside the exact middle x=554..1117 crop. Place focal bird near x=820, y=520. Place the flock as a compact loose vertical spiral directly above it, roughly x=690..1000 and y=150..360. No flock birds outside the protected center. Outer thirds contain only waterfall sheet, dark wet rock, mist, and empty gorge.

Style/medium: mature AAA cinematic photorealism; premium creature-dossier natural-history key art; real long-lens high-shutter-speed photography; physically plausible waterfall volume, droplets, mist, wet basalt, moss, atmospheric depth, authentic avian anatomy and feather texture; rugged, restrained, natural, not fantasy illustration or glossy CGI.

Lighting/mood: cool-neutral overcast gorge with restrained warm-white backlight through the falling water; high contrast only at the focal spray burst; ancient, dangerous landscape but effortless avian mastery.

Color palette: wet charcoal basalt, neutral grey-white water, muted moss green, deep natural brown-black feathers, restrained warm-white sunlight. Absolutely no violet, purple, magenta, cyan, teal glow, electric blue, or magical light.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, labels, signage, plaques, logos, insignia, UI, borders, captions, or watermark. No human structures with markings.

Safety/anatomy: every bird has one head, one beak, two folded or flying wings as appropriate, two legs naturally hidden in flight, and a coherent tail. No duplicated wings, fused flock birds, extra heads, dead birds, collisions, injury, blood, predation, panic, or harm.

Avoid: flock outside center; only one bird; focal bird merely in front of the falls rather than penetrating it; spread wings on focal bird; giant bird; gull/eagle anatomy; bat anatomy; bird-shaped splash; fantasy portal; glowing animals; cyan; violet; text; pseudo-writing; buildings; people; cage; gore; malformed anatomy; collage; poster layout.
```

### Reedjack — accepted exact prompt

```text
Use case: precise-object-edit
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for “Reedjack”; final invariant correction; wide 16:9; target 1672x941 RGB24 PNG.

Image 1 is the edit target. Preserve the image exactly: same lead reedjack identity, anatomy, pose and paw testing wire; same fence, post, mud, reeds, central farm building and warm window; same left-center hidden companion eye-pair; same second hidden companion eye-pair near the central farm light; same camera, framing, palette, lighting, materials, and photorealism.

CHANGE ONLY ONE THING: completely remove the obsolete THIRD eye-pair in the far-right reeds, located around source x=1200, y=360. Replace those two far-right amber dots and any implied face behind them with ordinary dark unlit reeds matching the surrounding texture and lighting. Do not move, alter, brighten, duplicate, or add any other eyes.

FINAL COUNT LOCK: the entire full frame must contain exactly two hidden companion eye-pairs total — four companion eyes total — both already located inside the middle protected x=554..1117 crop. Together with the lead animal’s own normal two eyes, there are exactly six animal eyes in the full frame. No eye-like highlights elsewhere.

Preserve crop story: the exact middle x=554..1117 strip retains lead animal testing wire, fence post, both hidden companion eye-pairs, and distant central farm light.

Safety/anatomy: no injury, snare, blood, harm, malformed anatomy, extra limbs, floating eyes, or glowing supernatural eyes.

Palette: preserve natural reed olive, mud brown, charcoal stripes, restrained amber dusk, warm-white farm lamp. No violet, purple, magenta, cyan, teal, electric blue, or magical glow.

Zero-text law: no readable or pseudo-readable text, letters, numbers, signs, labels, plaques, logos, collars, tags, insignia, UI, symbols, borders, captions, or watermark.

Avoid: any change except removing the far-right third eye-pair; adding eyes; deleting either center eye-pair; changing subject; text; violet; cyan; collage.
```

### Forgefaith — superseded attempt 1 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex SYSTEM rule plate for “The Forgefaith”; fresh protected-center-crop replacement; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is the SUPERSEDED CURRENT PLATE and a VISUAL-QUALITY, FORGE-HALL MATERIAL, PRACTICAL-LIGHT, and RELIGIOUS-TONE REFERENCE ONLY. Preserve its grounded premium realism, worn maintained brass/iron machinery, solemn diegetic congregation, and warm industrial light. Do not preserve its failed spread-out staging: the unafraid child exists only outside the required middle crop. Create a fresh composition, not a patch.

Primary request: THE FORGEFAITH — a working near-future reclamation hall during ordinary parish practice. A mechanically credible reclamation platform is actively resolving salvaged matter into one fully formed adult person. The emerging person stands naturally on the platform, human and physical, not divine. Around the platform is a congregation of ordinary workers; several stand and at least two visibly kneel. One clearly visible healthy child, about eight years old and fully clothed, watches calmly and unafraid while standing safely beside a calm protective adult whose hand rests gently on the child’s shoulder. Child and adult are well outside all platform mechanisms, heat, moving parts, and spark paths. Nobody is harmed or endangered.

Composition/framing — ABSOLUTE DELIVERY TEST: wide 16:9 from a pulled-back human-height viewpoint. Treat the leftmost 554 pixels and rightmost 554 pixels as expendable scenic margins. The complete platform, the complete resolved person, at least two complete kneeling congregants, and the complete child plus accompanying adult must ALL sit wholly between source x=574 and x=1097, leaving internal breathing room. Arrange them as a compact layered center tableau no more than about 500 pixels wide: platform/person at center rear; kneeler lower-left inside the protected band; calm adult and child lower-right inside the protected band. The child’s relaxed face and posture must be unmistakable in the center crop. Outer thirds contain only low-contrast blank Forge architecture, pipes, shadowed floor, and nonessential standing congregation. No signature element may exist only at an edge.

Style/medium: mature AAA grounded cinematic photorealism; premium near-future war-world key art; real 35mm lens logic; physically credible industrial machinery, actual structural load paths, access panels, fasteners, cable routing, heat shields, worn stone, brushed brass, dark iron, practical fabric, natural skin and hands; worn and maintained, not steampunk, ruined, glossy, or fantastical.

Faith depiction law: show practiced religion, not doctrine. The person is NOT glowing, floating, haloed, worshipful, supernatural-looking, or deity-like. All bright light comes visibly from practical warm-white machinery under and behind the platform, with restrained physical vapor and a few controlled amber sparks. No glowing deity, no floating hands, no fantasy runes, sigils, iconography, magic circle, angelic pose, levitation, aura, altar symbols, or supernatural beam. Kneeling reads as congregational practice around reclamation, not adoration of a god.

Lighting/mood: restrained warm-white and amber task light from recessed platform hardware, cool-neutral ambient hall shadow; solemn, routine, safe, specific, expensive. No spectacle.

Color palette: aged brass, charcoal iron, worn brown/grey work cloth, soot stone, muted Riverlands earth, restrained warm amber and warm white only. Absolutely no violet, purple, magenta, cyan, teal glow, electric blue, or magical color.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, labels, serials, stencils, writing, ledger pages, signs, banners, plaques, logos, manufacturer marks, insignia, UI, diagrams, warning chevrons, borders, captions, or watermark. Every surface and garment is blank and unmarked.

Avoid: spread-out composition; child outside the protected center; child alone, frightened, near machinery, beneath equipment, or in danger; glowing person; god imagery; halo; fantasy temple; floating hands; malformed anatomy; duplicated people; fused hands; extra fingers; ritual masks; robes with symbols; gore; corpses; combat; weapons fire; violet; cyan; any text or pseudo-writing; split frame; collage; poster layout.
```

### Reedjack — superseded attempt 1 exact prompt

```text
Use case: stylized-concept
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for “Reedjack”; protected-center-crop replacement; wide cinematic 16:9 landscape; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is the SUPERSEDED CURRENT PLATE and a SUBJECT-DESIGN, FENCE INTERACTION, DUSK PALETTE, MATERIAL, and PRODUCTION-QUALITY REFERENCE ONLY. Preserve its grounded reed-striped canid anatomy, intelligent non-cute menace, paw testing wire, wet farm-edge realism, and premium natural-history cinema. Do not preserve its failed spread-out staging: the two companion eye-pairs and distant farm light disappear from the required middle crop. Create a fresh original composition.

Primary request: REEDJACK — at a rural fence line at dusk, one lean reed-striped pack ambusher studies and lightly tests a simple unmarked wire fence with one raised front paw. The paw touches the wire deliberately but is not hooked, cut, trapped, or injured. Behind the lead animal, two separate companion reedjacks remain concealed in tall reeds: show exactly two additional anatomically paired sets of amber-brown eyes, four companion eyes total, one eye pair per hidden animal, with just enough faint muzzle/ear silhouette to make clear they are two animals rather than extra eyes on one creature. A distant occupied farmstead casts one small warm-white lamplight through a plain window. No humans are visible. The pack is clever, patient, controlled, and unsettling, not snarling, attacking, cute, supernatural, or harmed.

Composition/framing — ABSOLUTE DELIVERY TEST: wide 16:9 from low natural-history camera height, pulled back. Treat the leftmost 554 pixels and rightmost 554 pixels as expendable empty reed/fence margins. The COMPLETE lead reedjack from nose through tail and all four legs, the tested section of wire and fence post, BOTH complete companion eye-pairs, and the distant warm farm light must all sit wholly between source x=610 and x=1060, inside the exact middle x=554..1117 crop. Keep the lead animal compact, no more than about 390 pixels wide, centered near x=820 and lower-middle. Place hidden eye-pair A in reeds above-left behind it around x=690, and hidden eye-pair B above-right behind it around x=950, clearly separated. Place the single distant farm window light on the center horizon around x=820. Outer thirds contain only low-contrast reeds, wet soil, and continuation of blank wire fence; no companions, buildings, lights, or signature action outside center.

Style/medium: mature AAA cinematic photorealism; premium creature-dossier natural-history key art; real 50mm lens logic; physically plausible wild canid anatomy, coherent joints and paws, short coarse reed-striped coat, wet nose, alert natural ears, muscular but lean body; real timber post, plain galvanized wire, damp mud, reeds, subtle film grain; grounded near-future rural world with no fantasy styling.

Lighting/mood: late dusk with restrained warm dying sunlight on fur edges and one tiny distant warm-white practical farm lamp; dark olive/brown reeds and cool-neutral shadows; quiet predatory intelligence, no horror glow.

Color palette: reed olive, dry straw, mud brown, charcoal-grey stripes, neutral wet reflections, muted amber-brown natural eyes, one small warm-white lamp. Absolutely no violet, purple, magenta, cyan, teal glow, electric blue, neon, or magical light.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, labels, signs, plaques, logos, brand marks, tags, collars, insignia, UI, symbols, warning chevrons, banners, borders, captions, or watermark. Fence, post, farm, and animals are completely unmarked.

Safety/anatomy locks: lead animal has exactly one head, two eyes, two ears, four legs, four natural paws, and one tail. Exactly two hidden companions, represented by exactly two normal eye pairs. No extra eyes on the lead, no floating eyes, no duplicated limbs, fused paws, malformed joints, injury, blood, snare, entanglement, electrocution, barbs touching flesh, attack, livestock, children, people, or harm.

Avoid: companions outside center; only one companion pair; more than two companion pairs; glowing supernatural eyes; farm light outside center; lead animal filling whole frame; animal cut by crop; snarling monster; wolf portrait; cute pet; collar; text; pseudo-writing; violet; cyan; fantasy runes; fog magic; gore; prey; combat; collage; poster layout.
```

### Reedjack — superseded attempt 2 exact prompt

```text
Use case: precise-object-edit
Asset type: final shipping-quality Martino / The Habitat Codex CREATURE dossier plate for “Reedjack”; TARGETED protected-center-crop correction; wide 16:9; target 1672x941 RGB24 PNG.

Input image:
- Image 1 is the FIRST RESHOOT and the edit target. Preserve its excellent grounded AAA photorealism, exact lead reedjack design and pose testing plain wire with one paw, plausible anatomy, dusk reeds, mud, fence post, central distant farm lamp, natural amber-brown palette, lighting, lens, and quiet menace.

CHANGE ONLY THE HIDDEN COMPANION PLACEMENT:
- Keep the existing first hidden companion eye-pair in the left-center reeds.
- Remove the second hidden eye-pair currently far to the right outside the required center crop.
- Place that second companion instead in dark reeds immediately above-right behind the lead animal but clearly left of the central fence post: a separate normal paired set of two subtle amber-brown eyes, with faint natural ear/muzzle shadow, centered around source x=950, y=350.
- The image must contain exactly two hidden companion eye-pairs total (four companion eyes): existing pair A around x=590 and moved pair B around x=950. Each pair belongs to one separate concealed reedjack. Do not add any other eyes or visible companion bodies.

ABSOLUTE CROP TEST: within the exact middle x=554 through x=1117 strip, show simultaneously the lead reedjack testing wire, the tested wire/post, both complete separated companion eye-pairs, and the small distant warm farm window light. No companion eyes may remain outside that strip. Preserve one coherent full-frame photograph.

Safety/anatomy: lead paw lightly studies the wire and is not trapped, cut, hooked, bleeding, or harmed. Lead has one head, two eyes, two ears, four legs, natural paws, one tail. Hidden eyes are anatomically paired, subtle, non-glowing, and attached to faint concealed animal faces; no floating or supernatural eyes.

Palette: preserve reed olive, straw, mud brown, charcoal stripes, restrained warm dusk and warm-white lamp. Absolutely no violet, purple, magenta, cyan, teal, electric blue, or magical glow.

Zero-text law: absolutely no readable or pseudo-readable text, letters, numbers, labels, signage, plaques, logos, brand marks, collars, tags, insignia, UI, symbols, borders, captions, or watermark. All surfaces unmarked.

Avoid: changing lead subject identity/pose; moving farm lamp; extra companions; more than two eye-pairs; one animal with four eyes; glowing eyes; eye-pair outside center; injury; snare; attack; people; livestock; text; pseudo-writing; violet; cyan; collage; poster.
```

### thread.md

# Final thread plate — The Fuse at Heartland

## Accepted generation record

- Destination: `apps/web/private/codex-art/threads/the-fuse-at-heartland.png`
- Retained generated source: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\exec-8a52d5af-f7f0-4b0f-b150-50d98bbc6430.png`
- SHA-256: `bbd379ad862d8a40c65631a0a650e0df3e70bc177cbe6141df9289d64c1ebe0d`
- Technical gate: PASS — 1672x941 PNG, sRGB, three 8-bit channels, no alpha (RGB24).
- Publication order: held outside the resolver until every other reshoot and QA gate was complete, then installed as the run's final plate.

## Iteration history

- Initial render: `exec-bb336b9b-d95b-48b4-905f-9f4ba8d98147.png`, SHA-256 `6cf2c10ff8b74fa782297eeee7579bfd56d4794327cfe6d6230be87b33512d73` — rejected because its five clusters were correct at full width but only fragments of two survived the exact 564x941 crop.
- First composition correction: `exec-ed5d418b-db4a-4578-88a2-6f61734bd2f3.png`, SHA-256 `9e16a5ee50601e36c9d98f5ef9c29c088978d594e86a6d2f205943895b60e71c` — rejected because it improved separation but still arranged the five clusters in a row wider than the protected crop.
- Second composition correction: `exec-8a52d5af-f7f0-4b0f-b150-50d98bbc6430.png`, SHA-256 `bbd379ad862d8a40c65631a0a650e0df3e70bc177cbe6141df9289d64c1ebe0d` — accepted after full-frame, exact center-crop, format, text, palette, and story-lock inspection.

## Exact initial prompt

Use case: stylized-concept

Asset type: final Riverlands codex THREAD plate, closing cinematic narrative still

Primary request: The Fuse at Heartland at dawn—the entire campaign's tension in one image without spending it. In the courthouse square stands a tall unfinished commander statue completely wrapped from head to base in heavy opaque weathered canvas, upright and intact, with a crane sling already secured around the shroud but no lift underway. Around the plinth are exactly five distinct unattended work crews' tool clusters, each materially different and neatly abandoned for the moment. Beyond the square, sightlines open toward Heartland's five distinct wharf districts, each district quiet and subtly oriented as if pretending not to watch the others. Nothing has happened yet. Everything is about to.

Input images: Image 1 is the approved Heartland flagship and absolute reference for city architecture, braided-water geography, premium photorealism, white-gold radiance and visual continuity. Use it for style/environment only; create an original courthouse square composition.

Style/medium: mature R-rated AAA grounded cinematic photorealism, prestige political-thriller film still, real large-format lens, tactile canvas, old stone, worn tools, morning weather and subtle film grain; private rugged premium clubhouse direction.

Composition/framing: wide 16:9 square establishing shot at human eye level. The complete standing shrouded statue, secured crane sling, plinth, and five separate tool clusters must remain unmistakable inside the central 34% (exact 564x941 directory crop). The five wharf districts and their quiet lines of attention extend through the side/background fields. No essential information in bottom 10%.

Lighting/mood: Heartland's full white-gold dawn breaks the overcast open behind the shroud—radiant, beautiful and hopeful, while the empty square carries perfect held-breath menace. The light is never graded down.

Color palette: white-gold dawn, living river green glimpsed beyond, sunlit wet stone, weathered bone canvas, brass crane hardware, muted earth and rust, restrained charcoal shadow. Absolutely no violet or cyan.

Materials/textures: thick rain-marked canvas with no silhouette or face visible beneath, taut worn sling, flood-stained courthouse stone, practical mismatched tools, dew and wet paving.

Constraints: HARD LOCK: statue fully shrouded, standing, intact, uncrated, and not moving; Commander Alder Wade is alive, does not appear, and is not implied dead. Exactly five separate tool clusters, no workers. No crowd, ceremony, audience, funeral, memorial flowers, fallen statue, exposed statue face/body, assassination, injury, blood, fire, riot, battle or aftermath. No readable text, letters, numbers, plaques, inscriptions, banners, flags, faction marks, signs, tool labels, insignia, logos, UI, border, caption or watermark. No overt magic. The image must communicate only the quiet before.

## Exact rejected first composition-correction prompt

Edit the supplied Riverlands final THREAD plate while preserving its outstanding white-gold dawn, Heartland water-city setting, fully shrouded upright statue, plinth, secured crane sling, empty square, premium AAA grounded cinematic photorealism, real lens/weather/wear, and hopeful held-breath menace.

The sole composition correction is the unattended work equipment. Remove every existing tool/material cluster from its current locations and rebuild EXACTLY FIVE materially distinct, clearly separated work-crew clusters, with no sixth cluster and no stray tools elsewhere. ALL FIVE complete clusters must fit unmistakably inside the exact central vertical directory band x=554 through x=1117 of the 1672-pixel-wide image, full height. Arrange them compactly on open paving around and in front of the plinth, separated by visibly empty stone so the count reads as exactly five even in that narrow crop:
1) a small carpentry bench with plain saw, plane, and timber;
2) a rope-and-capstan rig;
3) a compact survey/rigging kit of plain rods and a closed completely blank instrument case, with no dial or writing;
4) a masonry cluster of rough blocks, mallets, and chisels;
5) two plain buckets with brushes and short hand tools.
Keep each cluster wholly within x=590..1080 for safety. Keep the complete statue, sling, plinth, and all five clusters inside x=554..1117. The five distant wharf districts may remain outside the crop.

HARD LOCKS: the statue stays completely opaque-shrouded from head to base, standing, intact, uncrated, not moving; no face or body visible through the canvas. Commander Alder Wade is alive, absent, and not implied dead. No workers, people, crowd, ceremony, audience, funeral, memorial flowers, fallen statue, exposed statue, assassination, injury, blood, fire, riot, battle, or aftermath. No readable text, letters, numbers, pseudo-writing, plaques, inscriptions, banners, flags, faction marks, signs, labels, dials, insignia, logos, UI, border, caption, or watermark. No violet or cyan. No overt magic. Do not dim or grade down the radiant white-gold dawn. Output one 1672x941 RGB24 sRGB PNG with no alpha.

## Exact accepted composition-correction prompt

Make one precise composition edit to this supplied Riverlands Heartland thread plate. Preserve the shrouded upright intact statue, crane sling, plinth, empty wet courthouse square, distant water city, exact radiant white-gold dawn, premium grounded AAA cinematic photorealism, and all story locks.

The five work clusters are still spread too wide. Remove them all and rebuild EXACTLY FIVE smaller, clearly separated, materially distinct unattended clusters in a tight 2+3 grid entirely WITHIN THE OUTER LEFT AND RIGHT EDGES OF THE STONE PLINTH. This is the visual rule: NOTHING belonging to any work cluster may sit left of the plinth's left edge or right of the plinth's right edge. The equipment zone must form a narrow central column no wider than the plinth:
BACK ROW, close to the base: left = tiny carpentry bench with saw/plane/timber; right = compact rope-and-capstan rig.
FRONT ROW, closer to camera: left = plain survey rods plus completely blank closed instrument case; center = masonry blocks/mallets/chisels; right = exactly two plain buckets with brushes/short hand tools.
Leave a generous patch of clean empty paving between every cluster so the count reads exactly 5. Make each cluster compact but legible. Remove all stray tools and materials outside these five. Do not create extra clusters.

The complete statue, sling, plinth, and every part of all five clusters must survive a very narrow portrait-shaped crop through the middle third of the landscape image. Do not place the five clusters in one wide horizontal row. Stack them in the specified 2+3 grid inside the plinth-width central corridor.

HARD LOCKS: statue remains fully opaque-shrouded head-to-base, standing, intact, uncrated, unmoving, no face/body silhouette. Wade alive and absent. No people/workers/crowd/ceremony/funeral/memorial/fallen statue/violence/blood/fire/riot/aftermath. No text, letters, numbers, pseudo-writing, plaques, inscriptions, signs, flags, faction marks, labels, dials, insignia, logos, UI, border, caption, watermark. No violet or cyan. No overt magic. Keep the dawn fully luminous. Output 1672x941 RGB24 sRGB PNG, no alpha.

## Visual QA

- Full frame: PASS — radiant Heartland courthouse square, fully shrouded upright statue, secured sling, empty square, no Wade/crowd/ceremony/death implication, and five materially distinct unattended tool clusters.
- Exact centered 564x941 crop: PASS — complete shrouded statue, sling, plinth, and all five clusters remain legible.
- Text/palette/story locks: PASS — no readable or pseudo-writing, signs, plaques, insignia, logos, violet, cyan, exposed statue, violence, or aftermath.

