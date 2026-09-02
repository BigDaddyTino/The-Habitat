# Ability card style — how a talent, spell, or technique reads

Owner ruling, 2026-09-02: the Eight Trees, the 108 spells, the 60 techniques and
the character pages are rewritten so a player can read them the way they read a
Final Fantasy XIV action tooltip. Labeled fields, real numbers, one plain
sentence per field. The evocative one-liners the trees already carry are kept as
**flavor**, printed in italics under the card — they never go in the Effect row.

Every card is a `lib/ability-cards.ts` `AbilityCard`. This document is the law
for writing one.

## The fields

| Field | Rule |
| --- | --- |
| **Type** | `Passive`, `Active`, `Spell`, `Choice`, `Capstone`, `Unlock`, `Corrupted`. A node that opens a spell is `Spell`. A fork half is `Choice`. A ceiling is `Capstone`. Anything that opens a system, slot or surface (a second augment slot, outpost management, a bench) is `Unlock`. Everything else is `Passive` or `Active`. |
| **Cost** | Only for resources beyond talent points. Spells: `2 pool · 1 charge` (Licensed), `4 pool · 2 charges` (Certified), `8 pool · 4 charges` (Master). Actives that spend something: `1 breach charge`, `1 stormglass round`, `1 dose`. Omit when free. |
| **Cooldown** | Every `Active` carries one. Use `8s`, `20s`, `45s`, `90s`, `Once per fight`, `Once per day`, `15 min`. Passives never carry one. |
| **Range** | `Self`, `Melee`, `5m`, `10m`, `25m`, `Rifle range`, `Line of sight`, `Any range`. Every Active and Spell carries one. |
| **Duration** | `Instant`, `5s`, `30s`, `1 hour`, `While channelled`, `Until moved`, `Until you go Down`. Only when something lasts. |
| **Effect** | The whole point. Present tense, second person, one or two sentences, numbers in them. Starts with the verb or the number. No metaphor, no adjective that is not a measurement. |
| **Notes** | Stacking, interactions, what turns it off, which fork it locks, which node it links to. Plain words. Optional. |
| **untested** | `true` when a number was written by hand and the balance campaign has never measured it. The page prints a small tag. |

## The Effect sentence

Good:

- `Increases hit chance by 5%.`
- `Shield check: knocks the target 3m back and staggers it for 2s.`
- `Once per fight, refuse to go Down: you stay at Hit for 10s, then Down applies unless you were healed.`
- `Unlocks Seal (Containment, Licensed): a ward across one door, window or breach that no body or round crosses while you stand within 3m of it.`

Bad:

- `The second round remembers the first.` (flavor — keep it, but as flavor)
- `Much steadier under fire.` (no number)
- `A thing kept where it is.` (no verb, no measurement)

## The numbers must agree with the sims

`lib/talent-effects.ts` is the balance truth. Where a node has an entry there,
the Effect line must state those numbers, using this wording table:

| Effect key | Write it as |
| --- | --- |
| `accuracy: 0.05` | `hit chance +5%` |
| `damageBonus: 0.3` | `damage dealt +30%` |
| `incoming: 0.9` | `damage taken −10%` (above 1 is a cost: `damage taken +12%`) |
| `toughness: 1` | `+1 Hit before Down` |
| `extraPlates: 1` | `+1 plate slot` |
| `dyingClock: 9` | `+9s on your Dying clock` |
| `initiative: 0.1` | `readiness +10% (draw, mount and first shot come sooner)` |
| `castCost: 0.85` | `cast costs −15%` |
| `resourceCap: 4` | `+4 maximum pool / charges` |
| `resourcePerHit: 2.2` | `+2.2 pool or charges per landed hit` |
| `resourcePerWound: 2.5` | `+2.5 pool or charges per Hit taken` |
| `ammo: 0.3` | `ammunition carried +30%` |
| `selfRepair: 0.12` | `one of your wounds closes about every 25s while in combat` (25s = 3 ÷ 0.12) |
| `partyHeal: 1` | `pulls a downed ally back up with 1 wound restored`; below 1: `field-mends nearby allies (0.5 × 20 = 10) wounds' worth a minute` |
| `partyMitigation: 0.1` | `allies within 10m take −10% damage` |
| `extraAction: 0.15` | `action speed +15% (attacks, casts and swaps cycle faster)` |
| `concealment: 0.12` | `12% harder to target and to hit`; negative is a cost |
| `detection: 0.1` | `sees through 10% concealment` |
| `control: 0.1` | `10% chance per attack to strip a plate or stagger` |
| `enemyCastCost: 2` | `enemy casts within 10m cost ×2` |
| `minions: 1` | `+1 bonded body fighting beside you`; 0.5: `your bond strikes on its own every few seconds` |
| `hardenedChrome` | `ELECTRICAL no longer vents your chrome` |
| `chrome` | `counts as chrome: ELECTRICAL can vent it` (a cost) |
| `refuseDown` | `once per fight, refuse to go Down` |
| `burst: 6` | `once per fight, spend everything at once: a 6-charge burst` |
| `world: [...]` | carry each line verbatim or tighter; they are already numbers |

A node with **no** entry in the effects map is narrative today. Write it a real
number anyway (the owner ruled numbers everywhere) and set `untested: true`.

## Vocabulary

Use the world's words and the wound model's states, never hit points:

- Wound states: **Grazed, Hit, Bleeding, Broken, Down, Dying clock, Dead.**
- Armour: **plate** (one plate absorbs one Hit and is gone), **plate slot**.
- Damage types in caps: **PHYSICAL, FIRE, ELECTRICAL, ARCANE, TOXIC.**
- Casting resources: **pool** (born and gifted casters) and **charges** (infused, through a rig). Never "mana".
- Attributes: Conditioning, Coordination, Resilience, Acuity, Composure, Conductivity.
- **Corruption phase** 1–7; **suspicion** (per-institution score); **standing**; **disposition**.
- **Bond** (an Archon's creature, machine or raised body); **emplacement**; **exoframe**; **augment / chrome**; **rig / dose**.
- Near-future words: background not class (for the six doors), licence, species, kit.

## Defaults when inventing

Cooldowns: a small trick `8–12s`, a real move `20–30s`, a big one `60–90s`,
anything that would end a fight on its own `Once per fight`, anything that
rewrites the world `Once per day`. Ranges: melee `2m`, a room `10m`, a street
`25m`, a rifle `Rifle range`. Aura radius is `10m` unless the flavor says
otherwise. Durations: a stagger `2s`, a buff `10–15s`, a ward `While you hold
it`. Spell tiers scale roughly ×1 / ×2 / ×4 in effect.
