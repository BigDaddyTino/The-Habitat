# Bloomfall Reach Regional Simulation Canon and Gameplay Architecture

Status: **AUTHORITATIVE SYSTEM CANON AND FUTURE RUNTIME CONTRACT**

Date: 2026-08-26

Scope: Bloomfall Reach only. Rules and data architecture, not runtime implementation.

Codex home: the existing **Systems** area.

Naming authority: [`BLOOMFALL_REACH_CANON.md`](./BLOOMFALL_REACH_CANON.md)

Regional authority: [`BLOOMFALL_REACH_CANON_ARCHITECTURE.md`](./BLOOMFALL_REACH_CANON_ARCHITECTURE.md)

This phase performed a read-only production Codex audit and authored repository documentation only.

```text
production writes         = 0
production migrations     = 0
production config changes = 0
production Codex changes  = 0
production Atlas changes  = 0
runtime implementation    = 0
new creature assignments  = 0
new creature imagery      = 0
```

## 1. Final principle

Bloomfall is not a collection of scripted gimmicks. It is a dangerous regional ecology governed by understandable rules:

```text
REACTOR
  -> ESSENCE
  -> ENVIRONMENT
  -> LIFE
  -> PLAYER INTERFERENCE
  -> CONSEQUENCES
```

Adaptive Mutation is the centerpiece, but it receives its meaning from the systems around it. A creature changes because a source created pressure, the environment carried or absorbed that pressure, the creature was eligible to respond, and the player altered the conditions or allowed them to continue. No major outcome begins with an unexplained random roll.

The player's desired learning curve is:

1. recognize evidence;
2. infer the current rule state;
3. anticipate likely consequences;
4. choose whether to exploit, avoid, or redirect them;
5. return later and find a legible result.

The system may use bounded randomness to select among already-valid outcomes. Randomness never invents a cause.

## 2. Current Codex audit and required refinement

The production Codex was queried read-only on 2026-08-26. All 28 requested records were found, including Bloomfall Reach, its three subregions, the Bloomfall, Southreach Complex, the nine preliminary Bloomfall Systems records, the relevant global rules/systems, and all four named Aberrants.

### Existing Systems structure

| Existing record | Current role | This phase's ruling |
| --- | --- | --- |
| `blackbloom-exposure` | Environmental contamination/adaptation parent under Environment | Retain as the regional boundary and state-ownership rule. Do not turn it into a player corruption meter. |
| `essence-saturation` | Four-band regional pressure concept | Upgrade in place as centerpiece page 1. |
| `reactor-cycles` | Seven observed Southreach states | Upgrade in place as centerpiece page 2. |
| `adaptive-mutation` | Bounded mutation-family concept | Upgrade in place as centerpiece page 3. |
| `blackbloom-overcharge` | Saturation-driven spell instability under Magic | Retain as a supporting consumer of Saturation. |
| `marsh-absorption` | Living Marsh containment ecology | Retain as the principal stabilizing feedback and a dependency of Saturation and Harvesting. |
| `harvesting-consequences` | Regional extension of Gathering & Harvest | Upgrade in place as centerpiece page 5. |
| `bloomfall-environmental-hazards` | Regional hazard sheet | Retain as the damage/traversal consumer. Bloomstorms link to it but do not hide inside it. |
| `aberrant-escalation` | Rare exceptional-individual designation | Upgrade in place to cover escalation, persistence, and roaming as centerpiece page 6. Preserve the stable slug. |

One future Systems record is justified:

| Future record | Parent | Why it is not a duplicate |
| --- | --- | --- |
| `bloomstorms` | `weather` | A Bloomstorm has its own causal threshold, warning/onset/peak/decay/aftermath state machine, risk/reward window, and Atlas footprint. Weather remains the global parent; Environmental Hazards remains the damage-expression sheet. |

The six centerpiece pages in the Systems area are therefore:

1. Essence Saturation;
2. Reactor Cycles;
3. Adaptive Mutation;
4. Bloomstorms;
5. Bloomfall Harvesting Consequences;
6. Aberrant Escalation and Regional Threats (existing `aberrant-escalation` slug).

Blackbloom Exposure, Marsh Absorption, Blackbloom Spell Instability, and Bloomfall Environmental Hazards remain separate supporting pages. This keeps ownership clear and avoids replacing one useful hierarchy with six disconnected mechanics.

### Canon already strong enough to preserve

- Bloomfall is a former strategic Essence district whose surviving infrastructure still cycles.
- The Shattercore is source-dominant, volatile industrial ruin.
- The Mutation Belt is the strongest expression ground for finite adaptive families.
- The Living Marsh binds, moves, transforms, and sacrifices contaminated material; it does not erase or manufacture Essence.
- Blackbloom Exposure is environmental and biological. Infusion Corruption is soul-level and governed by the Seven Phases.
- Ordinary taxonomy remains authoritative. Aberrant is an orthogonal Bloomfall designation, not a race.
- The four named Aberrants have distinct ecological and spatial identities.
- Bloomstorms are vent/saturation-driven regional weather, not Magic-Torn reality failure.
- Resources have functional origins, and removing the material can remove the function.
- Regional stories already support `Nobody Came` outcomes and persistent access/ecology consequences.

### What this architecture refines

- exact state ownership and bounded cell scale;
- numeric internals versus player-facing bands;
- legal saturation sources and sinks;
- the seven-state reactor machine and its frequency classes;
- mutation eligibility, states, triggers, combat adaptation, inheritance, and persistence;
- Bloomstorm formation and five-stage progression;
- harvesting classes, pressure, recovery, and delayed consequence;
- promoted survivor and named Aberrant threat behavior;
- authority, save data, overlays, route classes, art matrices, and Prompt B/C contracts.

## 3. Canon boundaries that cannot blur

### Blackbloom Exposure versus Infusion Corruption

These are separate state owners.

| State | Owner | Cause | Progression | End state |
| --- | --- | --- | --- | --- |
| Blackbloom Exposure | Environment, habitat, population, or eligible entity | Ambient/reservoir Essence pressure and organism-specific response | Exposure load plus authored adaptive rules | Adaptation, injury, integration, or exceptional Aberrant expression |
| Infusion Corruption | Character/soul ledger | Infusing another being's refined soul Essence | The fixed Seven Phases with irreversible phase floors | Abomination at Completion |

A person or creature may be Blackbloom-exposed, Seven-Phase corrupted, both, or neither. The two systems may affect the same body and create authored interactions, but they do not share a value, phase, cure, icon, color treatment, or save field.

### Bloomstorm versus Magic-Torn storm

A Bloomstorm is energized contaminated material moving through real weather and terrain. Physics remains coherent. Wind, rain, drainage, vegetation, conductors, and structures carry the event.

A Magic-Torn event is reality/physics failure belonging to another region. Floating terrain, broken gravity, spatial rupture, and universal purple fracture language do not belong to Bloomstorms.

### Aberrant versus race, Monstrosity, or Abomination

Aberrant is a regional threat designation layered on an existing origin/taxonomy. Switchmother may be Monstrosity plus Aberrant. Bellwether remains Beasts-lineage plus Aberrant. The Last Shift retains Human origin plus Aberrant without resolving personhood. No runtime enum may replace the base taxonomy with `ABERRANT`.

### Bloomfall uniqueness

The six-system network is owned by Bloomfall Reach. Global systems may expose extension points for regional weather, resource pressure, persistent damage, or creature variants, but no other Martino region receives Adaptive Mutation or Bloomfall's causal graph merely by using those extension points.

## 4. Complete feedback loop

```text
SOUTHREACH SOURCE CONDITION
  -> REACTOR CYCLE STATE
  -> CELL ESSENCE SATURATION
  -> BLOOMSTORM FORMATION / LOCAL HAZARDS
  -> ADAPTIVE MUTATION PRESSURE
  -> CREATURE AND ECOLOGY EXPRESSION
  -> ABERRANT ACTIVITY OR SURVIVOR PROMOTION
  -> ROUTE, RESOURCE, AND ENCOUNTER CONSEQUENCES

PLAYER HARVEST / COMBAT / INFRASTRUCTURE INTERFERENCE
  -> LOCAL DISTURBANCE OR SINK LOSS
  -> LOWER ABSORPTION / ALTERED FLOW
  -> HIGHER OR RELOCATED SATURATION
  -> CHANGED LIFE, WEATHER, AND THREAT ACTIVITY

LIVING MARSH ABSORPTION
  -> BOUND OR REDISTRIBUTED LOAD
  -> LOWER FREE SATURATION
  -> LOCAL CONTAINMENT
  -> STORED COST AND RECOVERY NEED
```

The network obeys four conservation rules:

1. Reactor/source systems create or release pressure.
2. Weather and mobile organisms mainly move pressure; they do not invent it.
3. Sinks bind or transform pressure; they do not make it vanish for free.
4. Harvesting usually changes a source, sink, or carrier; it does not directly add an arbitrary penalty number.

## 5. Runtime ownership model

The recommended implementation is an event-driven zonal simulation with a coarse authoritative tick. It is not a continuous per-square-meter ecology.

### Ownership levels

| Level | Owns | Does not own |
| --- | --- | --- |
| Region | simulation version/clock, active reactor program, Bloomstorm director, promoted-threat cap, cross-subregion transfers | individual ambient creatures or presentation particles |
| Subregion | baseline saturation floor, volatility, absorption tendency, mutation responsiveness, allowed weather carriers | rapidly changing local values duplicated from cells |
| Local cell | current saturation value/band, source output, sink capacity/integrity, harvest pressure, disturbance, storm phase/aftermath, population expression weights, route conditions | full AI populations or arbitrary terrain voxels |
| POI | authored tags, source/sink definitions, resource classes, route gates, encounter/event bindings | a second independent copy of cell state |
| Persistent threat | identity, eligibility, mutation family/state, wounds/stress imprint, home/current cell, activity, life state | global ecology values |
| Player/party knowledge | discovered bands, forecasts, samples, route reports, Aberrant intel quality/freshness | authoritative world truth |

### Cell recommendation

MVP should use roughly 18-24 authored cells across the three subregions. Cells should follow POI catchments, major drainage/industrial corridors, and route decision spaces rather than a uniform grid. A cell is large enough for one readable local condition and small enough that Blackweir can be stressed while Lantern Pools remain locally stable.

The simulation advances on:

- discrete events immediately (reactor transition, extraction, storm phase, threat movement);
- a coarse server/world tick for accumulation, absorption, recovery, and transfers;
- bounded catch-up after downtime rather than replaying every missed tick.

Recommended MVP tuning begins at one authoritative calculation every five real minutes, with presentation interpolated locally. This is a tuning value, not lore.

## 6. Essence Saturation architecture

### Recommendation: numeric inside, four bands outside

Use a clamped internal `0-100` scalar per local cell and expose only four canonical bands to players. The number makes transfers, hysteresis, tuning, saves, and multiplayer reconciliation buildable. It is not a player stat and should not normally be shown.

| Band | Internal range | Transition hysteresis |
| --- | ---: | --- |
| `RESIDUAL` | 0-24 | Enter below 22; leave above 27 |
| `ACTIVE` | 25-54 | Enter 27-52; leave below 22 or above 57 |
| `SURGE` | 55-79 | Enter above 57; leave below 52 or above 82 |
| `BLOOMSTORM` | 80-100 | Enter above 82; leave below 76 after storm/critical conditions decay |

The overlap prevents a cell from flickering between labels. `BLOOMSTORM` is a critical environmental pressure band. It makes a storm possible or sustains one; the separate Bloomstorm state machine says whether a storm is warning, active, or aftermath.

### Legal saturation inputs

Every increase has one owning system.

| Input | Owner | Rule |
| --- | --- | --- |
| reactor sector output | Reactor Cycles | Primary regional source. State and affected sector determine magnitude/direction. |
| active vent or damaged reserve bank | Authored POI/cell source | Background emission described by a fixed source profile; reactor state can multiply it. |
| contaminated water transfer | Cell adjacency/flow graph | Moves existing load downstream; no creation. |
| Bloomstorm passage | Bloomstorms | Redistributes and temporarily re-energizes existing load. Net regional creation is zero except material released by its source event. |
| destroyed/stripped sink | Harvesting or authored world event | Raises free saturation by reducing absorption; catastrophic extraction may also release stored load. |
| damaged infrastructure | Persistent Damage plus POI source profile | Adds output only if the damaged object canonically contained/carried Essence. |
| special world event | Authored event | Must name its source, amount/profile, destination cells, and expiry. |
| Aberrant activity | Aberrant profile | Normally redistributes or exposes load. It increases total local load only when the named profile disturbs an authored store/sink. |

Combat, proximity, quest importance, and generic enemy spawning do not directly raise saturation.

The cell calculation is deliberately small:

```text
nextSaturation = clamp(
  subregionFloor,
  100,
  currentSaturation
    + ownedSourceOutput
    + declaredInboundTransfer
    - availableSinkAbsorption
    - boundedSettling
)
```

Harvest pressure changes `availableSinkAbsorption` or an authored source/seal state. It is not appended as a free-floating punishment term.

### Legal saturation reductions

| Reduction | Owner | Rule |
| --- | --- | --- |
| healthy Marsh absorption | Marsh Absorption/cell sink | Binds free load up to remaining capacity and may transfer stored cost into tissue/resin. |
| intact filtration ecology | POI/cell sink | Applies a steady bounded reduction. |
| reactor stabilization | Reactor Cycles | Reduces new output; it does not magically remove downstream contamination. |
| controlled purge/redirection | Reactor Cycles | Lowers one source/sector while moving a declared load elsewhere. Regional net loss is limited. |
| natural settling over time | Cell baseline rule | Moves a cell toward, never below, its subregion floor. |
| regional intervention | Authored event | Repairs a sink, closes a source, or safely relocates load. It cannot permanently cleanse Bloomfall. |

### Subregion tendencies

| Subregion | Baseline tendency | Mechanical identity |
| --- | --- | --- |
| Shattercore | Active floor, highest volatility, sharp source-driven spikes | Forecast the machine. Quiet can be a false-safe Dormant Interval; transitions are fast and routes/resources are power-gated. |
| Mutation Belt | Active tendency, moderate volatility, highest mutation responsiveness | Read life. A smaller saturation change produces larger creature/ecology expression than it does elsewhere. |
| Living Marsh | Residual/low-Active free saturation in healthy cells, very high throughput and sink capacity | Protect the filter. Healthy ground can be locally safer despite carrying the greatest bound load; damaged sinks create delayed, steep spikes. |

The recommended initial tuning floors are approximately 30-40 for Shattercore, 25-35 for Mutation Belt, and 15-25 for healthy Living Marsh cells. These values are tuning starts, not player-facing canon. POIs override them: Crown Break trends higher; Lantern Pools lower; Blackweir can be low-free/high-bound.

### Band behavior contract

| Surface | Residual | Active | Surge | Bloomstorm |
| --- | --- | --- | --- | --- |
| Environment | old stains, mineral grain, stable water/air | directional root response, mild conductive activity, visible contaminated runoff | accelerated growth, charged mist/rain, active vents, sink strain | storm-capable critical load, violent transport, sacrifice/overflow behavior |
| Sound | ordinary biome with faint industrial/root undertone | intermittent wire hum, root creak, glasswing ringing | persistent pressure tone, distant discharges, animals calling/withdrawing | layered wind/metal/root roar; intelligible warning pulses remain audible |
| Creature behavior | baseline regional behavior | saturation-seeking/avoiding routes become obvious | aggression, migration, feeding and group behavior change | shelter, frenzy, coordinated movement, rare escalation windows |
| Mutation pressure | none beyond established regional baseline | exposure accumulation begins for eligible entities | adapted-state expression weighted strongly | Bloom-evolved expression/promotion can qualify; never automatic for all |
| Resources | ordinary salvage and shed material | regional resources available at normal risk | higher-grade deposits/tissue but stressed sources | rare storm/vent deposits and aftermath opportunities; hard caps prevent a loot fountain |
| Spells | normal regional casting risk | subtle optional overcharge tell | strong optional benefit plus known backlash class | severe instability; safe casting requires mitigation or abstention |
| Hazards | chronic contamination precautions | exposure and local conductive/biological hazards | serious exposure, traversal, structural and spell danger | lethal without preparation; Lasting Wound risk is explicitly telegraphed |
| Atlas | no automatic color wash | optional discovered cell hatch | warning boundary and forecast arrow if known | storm/critical footprint only while relevant; never a permanent red dashboard |
| Player warning | field instruments remain quiet | instrument ticks, guide remarks, creature indicators | alarm cadence, visibly reacting equipment, NPC evacuation language | formal Bloomstorm warning, shelter/route choice, unmistakable environmental cues |

## 7. Reactor Cycles state machine

The seven canonical observations are not equal-frequency random modes.

### Frequency classes

| Class | States | Meaning |
| --- | --- | --- |
| Normal cycle | Dormant Interval, Stabilization, Sector Restart, Venting | The ruin's recurring operating pattern. Dangerous, forecastable, and sometimes useful. |
| Rare controlled state | Purge | A planned or automatically selected pressure-clearing/redirection window with exceptional access and downstream cost. |
| Failure state | Overflow, Containment Breach | Escalation caused by unresolved load, failed routing, damaged containment, or authored interference. Never selected as ordinary weather. |

### Legal transitions

```text
DORMANT_INTERVAL
  -> STABILIZATION
  -> SECTOR_RESTART
  -> VENTING
  -> DORMANT_INTERVAL

STABILIZATION or VENTING
  -> PURGE
  -> DORMANT_INTERVAL

SECTOR_RESTART or VENTING or PURGE
  -> OVERFLOW
  -> CONTAINMENT_BREACH

OVERFLOW
  -> STABILIZATION        (successful automatic/player/faction intervention)

CONTAINMENT_BREACH
  -> PURGE                (contained recovery)
  -> DORMANT_INTERVAL     (authored shutdown after the cost resolves)
```

No state chooses a destination without an explicit affected sector/cell set and a forecast reason. Small bounded variance controls precise duration and which valid sector wakes, not whether causality applies.

### State definitions

Durations below are target real-time play windows for future tuning. They are not historical lore and may scale for server mode.

| State | Entry | Target duration | Exit | Regional effect and opportunity |
| --- | --- | ---: | --- | --- |
| Dormant Interval | previous cycle completes or emergency shutdown holds | 30-90 min | scheduled stabilization, source pressure, or authored interference | Shattercore output falls; some automated defenses and powered predators retreat; manual doors/tunnels may be usable; unpowered salvage is safer but live systems are inaccessible. |
| Stabilization | dormant sector begins balancing or overflow is brought under control | 10-20 min | balance succeeds to Restart/Purge or fails to Overflow | Readable warning window. Maintenance routes, control points, and instruments matter. Mutation Belt receives little immediate load. Marsh gains recovery time. |
| Sector Restart | stabilization successfully energizes one authored sector | 15-30 min | controlled Venting/Dormant or failed Overflow | Power-gated doors, lifts, archives, defense grids, and high-grade salvage activate. Creature routes avoid or exploit heat/charge. The player can trade safety for access. |
| Venting | restart sheds expected pressure or a sector exceeds its preferred operating envelope | 8-15 min | Dormant/Purge or Overflow if blocked | Crown Break and declared vents raise/transfer saturation. Vent deposits become available; exposed routes close; downwind cells receive warnings before load. |
| Purge | forecast control program, successful intervention, or breach recovery selects a clearing path | 10-20 min | Dormant if successful; Overflow if the path/sink cannot accept load | Rare opportunity: sealed areas open, defenses can shut down, rare salvage/records become reachable, and source saturation drops. The downstream route and marsh pay the bill. |
| Overflow | restart/vent/purge load exceeds available routing or a containment/sink path is damaged | 8-20 min | Stabilization if caught; Breach if not | Multiple cells rise sharply; powered infrastructure behaves unpredictably; emergency resources appear only where physically exposed. Evacuation/redirection is often wiser than extraction. |
| Containment Breach | Overflow crosses an authored failure threshold or a story action breaks containment | 20-60 min or until authored resolution | Purge/recovery or costly shutdown | Failure state, not a routine event. New persistent damage, a strong storm source, route loss, displacement, and Lasting Wound risk. The world/factions/marsh resolve it even if players do not. |

### State impact by subregion

| State | Shattercore | Mutation Belt | Living Marsh |
| --- | --- | --- | --- |
| Dormant | local source reduction; manual access | migrations relax; some grid-adapted predators withdraw | absorption catches up; bound load remains |
| Stabilization | warning lights, control objectives, defenses uncertain | glasswings/harts provide early tells | channels begin pre-emptive redistribution if evidence reaches them |
| Restart | powered routes and rare live salvage; defense/Last Shift activity | Splicefield and conductive fauna respond; mutation pressure rises near feeds | delayed unless old drainage or Drowned Intake pumps wake |
| Venting | Crown Break/sector vents, stormglass opportunity | downwind saturation line and rapid creature movement | receives declared downstream transfer later |
| Purge | maximum access/reward window with strict timer | evacuation/migration corridor crosses the Belt | Blackweir/Heartfen absorb, redirect, or sacrifice ground |
| Overflow | multi-sector hazard and structural damage | widespread Surge; routes become expensive | sink capacity drains quickly; low-free cells can spike |
| Breach | authored persistent wound to the Complex | Bloomstorm and advanced-expression pressure | containment crisis; oceanward route may close rather than contamination automatically escaping |

### POI, route, resource, and enemy bindings

- Southreach Complex owns the reactor controller and sector definitions.
- Crown Break is the principal atmospheric vent source.
- Reserve Vault Twelve binds access, reserve pressure, Essence, and Reserve Glass to cycle gates.
- Ashline Exchange and Redline Shelter Six are evacuation/archive routes affected by power and structure, not random locks.
- Splicefield can receive restart current and return a fault only through authored grid adjacency.
- Blackweir is a declared downstream sink for specific purge paths.
- Drowned Intake may receive old cooling/intake flow and can alter the conditional sea route.
- The Last Shift activity weights toward Restart/Purge and emergency routines.
- Latchhounds and Sump Eels weight toward energized infrastructure; they do not spawn merely because the state name changed.

### Per-state operational matrix

| State | Saturation/source effect | POI and route change | Resource window | Creature/enemy and special event | Atlas cue |
| --- | --- | --- | --- | --- | --- |
| Dormant Interval | source output falls toward authored minimum; no cleansing below floors | unpowered manual/service paths may open; powered lifts, locks, and defenses remain unavailable | dead/loose salvage safest; live Reserve Glass/Gridcore systems inaccessible | grid-feeding creatures retreat or forage elsewhere; quiet investigation/recovery events favored | gray dormant sector outline with forecast confidence/age if known |
| Stabilization | source remains low but transfer risk builds in selected sector | control rooms, sensor points, and evacuation routes become relevant; no arbitrary door churn | instrumentation and repair access, not a high-yield loot state | glasswings, harts, equipment, Tomas/NDD warnings provide tells; intervention can change next legal branch | amber preparing sector plus one or more valid forecast arrows |
| Sector Restart | selected cell source rises in a known curve; linked grid cells may receive charge | powered doors/lifts/archives open; defenses and live rails return; Splicefield feeds can wake | high-grade live Gridcore, records, and powered salvage become accessible | Last Shift emergency routines, Latchhound/Sump Eel activity, defense wake, `Mender's Work`-type incidents | energized sector and affected infrastructure, never a region-wide alarm without evidence |
| Venting | source cell sheds load to declared air/drainage neighbors; Crown Break may become a storm source | downwind/downslope crossings become hazardous; some pressure locks release | vent deposits/stormglass and newly exposed material available under caps | creatures evacuate or follow the plume; Bloomstorm warning can qualify; salvage/rescue race event | directional plume/transfer arrow and expiry window |
| Purge | source drops sharply while a larger declared load is exported | selected sealed sectors and reserve spines open; defenses may shut down; downstream routes gain timers | rare records, Reserve Glass, finite Essence stores, and containment parts at maximum opportunity/risk | industrial creatures retreat from shutdown areas while marsh/Belt migration events begin; `The Purge Window` | explicit affected-source, transfer corridor, downstream sink, and countdown |
| Overflow | several linked sources/transfers exceed capacity and cells rise rapidly | multiple doors/rails/structures enter unsafe state; previously safe corridors become costly or close | exposed material exists because containment is failing, not as a bonus table | defensive/aggressive behavior, rapid migration, Switchmother/grid response, rescue/containment events | red critical sectors with cause and valid escape/containment information where discovered |
| Containment Breach | authored source release pushes one or more cells toward critical/Bloomstorm range and creates Persistent Damage | breach footprint, collapse, lost route, or emergency opening persists after the event | finite breached stores/debris may be recoverable only after immediate survival/containment | storm formation, displacement, promoted-threat opportunity, Last Shift emergency behavior, faction/marsh Nobody Came resolution | breach origin, observed/forecast footprint, evacuation routes, then a persistent scar marker |

## 8. Adaptive Mutation architecture

Adaptive Mutation exists only in Bloomfall Reach. It is finite authored adaptation, not procedural anatomy generation.

### Two-axis eligibility model

Do not combine species capability and Aberrant designation into one enum.

```text
mutationEligibility:
  NONE
  MINOR_ADAPTIVE
  FUNCTIONAL_ADAPTIVE
  ADVANCED_ADAPTIVE

aberrantStatus:
  NONE
  CANDIDATE
  PROMOTED
  NAMED_CANON
```

This preserves taxonomy and prevents `EXCEPTIONAL_ABERRANT` from pretending to be a species capability.

| Eligibility | Allowed expression | Runtime cost |
| --- | --- | --- |
| None | authored baseline/established regional form only; exposure can still injure or repel | no mutation state machine |
| Minor Adaptive | temporary visible/behavioral exposure response; no new combat kit | one optional exposed variant |
| Functional Adaptive | one authored mutation family with one mechanically meaningful adapted state | bounded trait/loadout selection |
| Advanced Adaptive | several allowed families, Bloom-evolved state, population/nest expression, survivor promotion eligibility | highest bounded content and persistence cost |

Prompt B assigns these values. This phase intentionally assigns no new species.

### State model

| State | Availability | Meaning | Regression/persistence |
| --- | --- | --- | --- |
| Baseline | all | The species' canonical Bloomfall baseline, which may already be regionally adapted | stable |
| Exposed | Minor+; optional for Functional/Advanced | acute saturation response: stress behavior, visible tissue activation, temporary tolerance or avoidance | may regress after leaving pressure if the species sheet permits |
| Adapted | Functional+ | one authored functional response that changes play: armor, sensing, mobility, tolerance, charge, feeding, attack, or coordination | persists for the encounter; persistent threats retain it |
| Bloom-evolved | Advanced only | a strong authored phenotype/behavior package tied to habitat and prolonged high pressure | ordinary encounter generation is weighted and temporary; promoted threats retain it |
| Breakpoint | not a universal visual state | promotion event where a qualifying survivor becomes a persistent regional threat or a named profile escalates | persistent; represented by threat data, not mandatory extra spikes/art |

Species may omit Exposed, Adapted, or Bloom-evolved where those stages do not produce a meaningful readable difference. No species receives five states merely to fill a ladder.

### Mutation families

The universal library is a vocabulary, not a promise that every species supports each family:

- vascular/filtration;
- mineralization/armor;
- capacitance/charge storage;
- sensory/range finding;
- aquatic/flow adaptation;
- toxic/contaminant tolerance;
- mobility/rooting/anchoring;
- herd, nest, or pack coordination;
- machine graft/infrastructure integration where the host canonically permits it.

Every family must define:

- a visible structural tell;
- changed behavior;
- one mechanical advantage;
- one cost, tradeoff, or counterplay;
- allowed habitats;
- allowed states;
- resource/ecological effect, if any.

"Extra glow," "more spikes," and generic health/damage inflation are not mutation families.

### Bounded transition inputs

Runtime needs only five inputs:

1. species eligibility and allowed authored families;
2. accumulated exposure dose from cell saturation over time;
3. habitat tag (`VENT`, `GRID`, `BELT_WOODLAND`, `HERD_RANGE`, `SINK`, `MARSH_FLOW`, or another authored finite tag);
4. at most one qualifying recent stress imprint;
5. persistence/promotion status.

Reactor states, Bloomstorms, harvesting, diet, territory, and Aberrant proximity affect mutation through saturation, habitat, disturbance, or an authored profile. They do not each become another independent mutation meter.

Age, diet, and generation remain species-authored weights in MVP rather than per-individual simulation variables.

### Practical combat adaptation

Surviving certain attacks is retained in a bounded form.

- During one encounter, an eligible creature records only the dominant survived damage family: heat, cold, electrical, toxic, kinetic, piercing, or arcane.
- A stress imprint qualifies only if the creature survives a meaningful threshold and escapes or wins the encounter.
- The imprint has no effect unless the species sheet contains an authored response for that family.
- An ordinary disposable creature does not persist the record.
- A promoted survivor may carry one imprint into later encounters and select one authored counter-trait. It can never stack an unlimited resistance history.
- Repeated player use of one damage type can therefore create one memorable counter without requiring generated anatomy or permanent logs for every animal.

This combat input is **Phase 2**. MVP mutation is selected from species family + cell/habitat pressure.

### Individual, population, and inheritance model

Blackbloom adaptation is partly somatic and partly propagated through symbiotic tissue, nesting material, diet, microbiomes, and reproduction. It is not universal instant Lamarckian evolution.

| Scale | Canon behavior | Runtime recommendation |
| --- | --- | --- |
| Individual | acute expression can occur during meaningful exposure; strong established traits may remain | MVP authored encounter variant |
| Herd/nest/colony | material and signaling can bias nearby expression | Phase 2 cell population-trait bias |
| Generational | some stable changes pass through reproduction or persistent symbionts | represented by authored baseline/weights, not simulated family trees |
| Region | repeated conditions make some authored families more common | Phase 2 aggregated cell memory, never per-creature genealogy |

### Persistence and promoted survivors

Ordinary spawned creatures are not individually persistent. Their cell, population profile, and encounter conditions are enough.

A qualifying survivor can be promoted when all mandatory rules pass:

- Functional or Advanced eligibility;
- engaged meaningfully with a player/party and escaped alive or forced the party to withdraw;
- accumulated sufficient exposure/mutation pressure;
- species has an authored persistent-threat profile;
- regional and per-cell promoted-threat caps have space;
- no duplicate identity was created for the same encounter.

Recommended MVP cap: six non-canon promoted threats across Bloomfall, with no more than two resident in one cell. Named Aberrants do not consume this cap.

Persist only:

- stable threat ID and optional earned epithet;
- base taxonomy/species;
- mutation family/state;
- one stress imprint when Phase 2 is active;
- wounds/scars needed for recognition;
- home/current cell and activity state;
- encounter history summary, not raw combat telemetry;
- last confirmed time and life state.

The threat persists across player departure, save/load, and server sessions. Off-screen movement uses the regional threat scheduler. Death archives that individual; it does not respawn. A later promoted replacement is a different individual.

### Image matrix

| Eligibility/designation | Required Codex images | Purpose |
| --- | ---: | --- |
| None | 1 | canonical baseline |
| Minor Adaptive | 2 | baseline + exposed |
| Functional Adaptive | 3 | baseline + exposed + adapted |
| Advanced Adaptive | 4 | baseline + exposed + adapted + Bloom-evolved |
| Named Canon Aberrant | 2 minimum, 4 maximum | canonical hero plus one territory/behavior state; optional wounded/alternate authored state only when gameplay requires it |

The state set is species-specific. If Exposed is omitted, do not create a meaningless intermediate image; Prompt B records the exception and adjusted count.

## 9. Bloomstorms architecture

### Cause

A Bloomstorm is a severe transport event produced when:

```text
critical local saturation
+ a physical release or exposed reservoir
+ a valid atmospheric/water carrier
- available local absorption
>= formation threshold
```

Common valid sources are Crown Break venting, Overflow, Containment Breach, saturated drainage exposed to strong weather, or a sink failure that releases bound load. High saturation alone creates a warning-capable critical cell but not an arbitrary storm on a clear stable day.

The director may use seeded variance to choose onset time and path among valid neighboring cells. It cannot create a storm without a source and carrier.

### Five-stage progression

| Stage | Target window | Player choice and readable evidence |
| --- | ---: | --- |
| Warning | 5-10 min | Glasswings ring/descend, harts abandon gradients, instruments pulse, wind carries metallic/root scent, Atlas forecast cone appears if discovered. Choose shelter, route, equipment, or deliberate entry. |
| Onset | 3-5 min | visibility begins falling, charged rain/fog follows terrain, conductors and growth activate, peripheral routes start closing. Last safe exit is explicit. |
| Peak | 8-15 min | maximum spell instability, exposure, mutation expression, traversal and electronics/magitech disruption; rare reward nodes are exposed. Survival is active play, not a screen tint. |
| Decay | 5-10 min | pressure moves or settles, visibility returns unevenly, hazards remain, creatures leave shelter, new crossings/debris become visible. |
| Aftermath | 20-60 min | rare deposits/carcasses/shed tissue, altered creature states, unstable sinks, fresh Aberrant tracks, and temporary routes. Often the best exploration window. |

### Effects contract

- **Visibility:** particulate rain/fog and real occlusion; high-contrast shelter/route cues remain readable.
- **Creatures:** shelter, migrate, feed on exposed material, express authored states, or follow displaced prey.
- **Mutation:** exposure accumulation accelerates; only eligible creatures use authored states.
- **Spells:** stronger optional overcharge and more severe known backlash classes; no untelegraphed universal fizzle.
- **Resources:** stormglass/vent deposits, shed material, and exposed salvage become temporarily available under authored caps.
- **Traversal:** low ground, conductors, unstable structures, and marsh flow become dangerous; some storm-cleared or aftermath routes open.
- **Electronics/magitech:** sensor noise, false contacts, charge storage, shutdown, or overload based on equipment rating and local conductors.
- **Player injury:** exposure burns, inhalation, electrical injury, contamination, and structural trauma can feed Persistent Damage/Lasting Wounds. It does not add Seven-Phase Corruption.
- **Aberrants:** activity profiles may wake, move, hunt, or become easier to track. No guaranteed boss spawn.
- **POIs:** only POIs within the forecast/path and with relevant tags change.
- **Atlas:** warning cone -> observed footprint -> fading aftermath trace, gated by information quality.

### Why enter intentionally

- collect a capped rare stormglass/Reserve Glass exposure;
- reach a power-opened or storm-cleared route before it reseals;
- sample a mutation or absorption event at its only observable moment;
- rescue/recover before a Nobody Came outcome;
- acquire fresh Aberrant tracks;
- exploit creature retreat from an otherwise occupied site;
- redirect the storm's source or downstream cost.

Rewards are tied to source and aftermath. A storm does not shower generic high-tier loot across every cell.

## 10. Harvesting Consequences architecture

### Resource consequence classes

| Class | Meaning | Typical pressure |
| --- | --- | --- |
| `INERT_SALVAGE` | loose/dead material no longer performing an ecological or containment function | none to low ecological pressure; may create structural/legal hazard |
| `REGENERATIVE_TAKE` | shed, trimmed, sampled, or seasonally renewed material | low pressure within quota; recovers naturally |
| `FUNCTIONAL_HARVEST` | removal weakens an organism, herd role, conductor, predator boundary, or machine ecology | moderate pressure and a local behavior/resource consequence |
| `SINK_HARVEST` | harvested material is actively binding/transforming contamination | high pressure through lost absorption and possible stored-load release |
| `BREACH_EXTRACTION` | removal breaks a seal, live grid, reserve bank, major organism, or containment structure | critical authored event; never an ordinary gather interaction |

Examples are classifications for the later data pass, not final per-node assignments:

- loose Gridcore scrap can be Inert Salvage; live bus extraction is Functional or Breach Extraction;
- shed Rootback mats can be Regenerative Take; killing the carrier is Functional Harvest;
- Sinkroot Fiber can be Regenerative Take when trimmed/shed or Sink Harvest when a bed is stripped;
- Blackweir Resin and Quietwater Culture are normally Sink Harvest beyond tiny licensed samples;
- Reserve Glass varies from loose finite salvage to Breach Extraction at an intact seal;
- Capacitor Tissue varies by whether it came from shed/dead tissue, a living scavenger, or Splicefield's active network.

### Local pressure model

Each cell keeps a clamped internal `harvestPressure` and, where relevant, separate `sinkIntegrity`. Players see qualitative field states, not a moral score.

| Pressure band | Observable state | Consequence |
| --- | --- | --- |
| Light | normal regrowth/animal use; no special warning | ordinary recovery |
| Worked | cut marks, fewer carriers/grazers, changed calls, quotas/signs from NPCs | slightly lower yield/absorption; more defensive behavior |
| Stressed | exposed roots, abandoned nests, unstable channels, repeated equipment warnings | meaningful sink loss, route/creature changes, higher saturation susceptibility |
| Critical | failing bed/seal/network; explicit extraction warning | event-scale release, migration, storm/Aberrant attention, persistent local damage |

The pressure increase comes from the resource class, extraction method, amount relative to local capacity, and current recovery state. One mushroom does not trigger catastrophe. Repeated small takes matter only after crossing the cell's authored capacity.

### Consequence chain

```text
HARVEST
  -> remove material/function
  -> disturbance and/or sink-integrity loss
  -> changed absorption, flow, population, or infrastructure
  -> saturation/route/resource/threat consequence
```

Creature aggression is caused by territory, brood/herd disruption, exposed food, or altered flow. It is not the ecosystem detecting greed as morality.

### Recovery

- Regenerative Take recovers through authored regrowth time and low-harvest intervals.
- Functional Harvest recovers through population return, infrastructure repair, or ecological succession.
- Sink Harvest recovers only while incoming load remains low enough for regrowth; reactor stabilization creates that window but does not itself regrow roots.
- Marsh cells may redirect resources from healthy cells, shifting rather than erasing cost.
- Breach Extraction creates an authored repair/event state. Some scars remain under Persistent Damage.
- Every cell returns only toward its regional baseline. Players cannot permanently cleanse Bloomfall or optimize it into a safe farm.

The design goal is greed versus safety, not a scolding UI. Before a consequential take, environment, tools, companions/NPCs, and resource presentation must make the likely class understandable. The player may knowingly decide the resource is worth the damage.

## 11. Aberrant escalation and regional threat architecture

### Mobility classes

| Class | Rule | Current canon fit |
| --- | --- | --- |
| `RANGE_ROAMER` | moves among a finite cell range according to prey, saturation, and disturbance | Bellwether: Long Graze and Mutation Belt migration network |
| `SITE_ANCHORED` | body/function depends on one POI; activity expands through linked systems rather than free roaming | Switchmother: Splicefield grid ecology |
| `FLOW_TERRITORIAL` | territory is a water/flow system; position changes as channels and load change | Old Drowner: Drowned Intake, Reedless Mile, Living Marsh hydrology |
| `EVENT_MOBILE` | normally site/range bound but moves along authored routes during qualifying reactor/story states | The Last Shift: Southreach emergency routes and procedures |
| `SEASONAL_MIGRANT` | long-cycle movement among authored ranges | available for later species; no current named assignment required |

These are behavior profiles, not teleport rules. Current named mappings are canon-consistent architectural recommendations; Prompt B confirms their creature dossiers and exact allowed cells.

### Activity inputs

Each named or promoted threat has a short weighted profile using only:

- current/neighbor cell saturation;
- reactor state where relevant;
- Bloomstorm stage/path;
- prey/herd/sink/infrastructure condition;
- harvesting or combat disturbance;
- authored story/event flags;
- recent player contact.

"Creature mutation pressure" is not an extra input; it is derived from saturation and ecology. Pure random boss spawning is prohibited.

### World truth versus player information

The server/world knows the threat's actual state. The Atlas exposes an information state:

| Intel state | Meaning |
| --- | --- |
| Rumored | credible NPC/environmental report with broad area and age |
| Tracked | fresh signs support a direction/range, not exact position |
| Confirmed | direct sighting or trusted live instrument gives a short-lived local fix |
| Lost | prior information has expired or behavior contradicted it; last-known evidence remains |

Exact permanent GPS boss icons are prohibited. A confirmed marker decays to Tracked/Lost unless the threat is directly observed or deliberately tagged by authored equipment.

### Persistence and life policy

Named Aberrants and promoted threats are world authoritative and persist across sessions.

Possible life states:

```text
DORMANT
ACTIVE
ROAMING
WOUNDED_RETREAT
MISSING
DEAD_OR_RESOLVED
```

- Wounds can change route, aggression, and visible recognition.
- Retreat is preferred over an unexplained despawn.
- Major lore threats do not casually respawn.
- A named death is permanent only when its authored `lifePolicy` allows a lethal resolution.
- Death/resolution triggers an ecological consequence record.
- A successor, offspring, replacement organism, or newly promoted threat is a separate authored/event outcome, never the same boss returning without explanation.
- The four current named threats' final killability and replacement policies remain a genuine Prompt B/content decision.

## 12. Concrete system-interaction scenarios

### 1. The Purge Window reaches Blackweir

Southreach enters Purge after a forecast Stabilization. Reserve Vault Twelve and a control archive open while defenses power down. The source cell drops, but old drainage transfers load south. Mutation Belt harts abandon the flow line, giving the player an early physical warning. Blackweir is already Worked from resin harvest, so its remaining sink capacity cannot accept the full purge. The player can take rare vault salvage, redirect flow, or reach the weir. If nobody comes, the marsh sacrifices one filtration arm and the Atlas later shows a changed safe approach, not a failed quest waiting forever.

### 2. A false-safe Dormant Interval

The Complex falls silent. Latchhounds retreat from an unpowered service corridor and manual access becomes possible. Players enter for Gridcore Alloy. Their extraction damages a live support/feed tagged as Functional Harvest, raising local disturbance but not arbitrary saturation. Stabilization warning lights and Tomas's forecast announce restart. Leaving early preserves the corridor; stripping the last conductor converts the restart into Overflow and a persistent collapse blocks the same route later.

### 3. Splicefield reroutes the cost

Players harvest Capacitor Tissue from Splicefield during Active saturation. Small dead-tissue recovery is safe; continuing into the live network reduces grid integrity. Sector Restart sends current through the altered path. Switchmother, Site Anchored, does not spawn randomly: its activity expands along the powered yard, Latchhounds share the new circuit, and the Complex loses a stabilizing return path. The immediate reward is excellent tissue; the consequence is a harder Venting state and a new hazard on the Southreach service alignment.

### 4. The Hart that learned the party

At Long Graze, an eligible hart survives a prolonged fire-heavy encounter and escapes into Surge ground. In MVP it may later appear as an authored mineralized/heat-tolerant variant selected from cell pressure. In Phase 2, if promotion rules and caps pass, the same scarred individual carries one heat stress imprint and becomes a persistent threat. The Atlas shows fresh herd avoidance, then a Tracked report. The counter is behavioral and anatomical continuity, not immunity or a procedurally generated fire deer.

### 5. Bellwether changes a route without attacking

The Bellwether enters Long Graze because harvest disturbance displaced Rootback Grazers toward a high-mineral Active cell. Its field changes herd direction and expression weights. Cairnwood's surveyed approach becomes a migration corridor; predators follow. The Bellwether never needs to fight the player. Wardens can track and redirect it, exploit the abandoned old range, or kill it and lose a regional warning network. Route safety changes through ecology rather than a scripted gate.

### 6. Lantern Pools after a quiet theft

Repeated tiny unlicensed Quietwater samples finally push the cell from Worked to Stressed. Pool light becomes uneven, grazing organisms stop visiting, and instruments show the bound load becoming mobile. An upstream storm passes nearby; the intact pool would have remained Residual, but reduced sink integrity lets it rise into Surge. The storm aftermath exposes rare samples and dangerous carcasses while destroying the pool's recovery window. No single sample caused a curse; accumulated removal changed the rule.

### 7. Old Drowner closes the sea without a boss fight

A Venting transfer reaches the Living Marsh as the Drowned Intake sea route is open. Old Drowner moves within its Flow Territorial range to anchor a contaminated channel. The navigable water disappears from the intended boat path and the Atlas's permanent alignment becomes conditionally closed. Killing the creature may reopen passage but release stored load toward the ocean. Waiting for flow change, luring it inland, or repairing an intake gate are valid systemic alternatives.

### 8. The Last Shift answers a restart

During Sector Restart, the Last Shift leaves a dormant interior cluster and moves along an authored emergency route toward Redline Shelter Six. It operates a door that opens a rescue/archive shortcut while also sealing another corridor under obsolete procedure. Old credentials and machinery sounds warn players before contact. A wounded-retreat outcome persists its damaged equipment and changes which routine it attempts during the next cycle. Personhood remains unresolved; the system does not reduce it to a respawning patrol boss.

### 9. A Bloomstorm players choose to enter

Crown Break Venting, high Shattercore saturation, and a valid storm front cross the formation threshold. Warning begins with glasswing behavior and forecast instruments. The players enter because Peak pressure will expose stormglass and force a dangerous creature population out of a sealed rail cut. At Decay they can use the temporary crossing, but a promoted threat's fresh track also appears. The storm created a choice window from known conditions, not a random loot event.

### 10. Walking Orchard protects itself by moving the problem

Sinkroot stripping raises harvest pressure near Walking Orchard. With reduced local absorption, Active saturation becomes Surge. The Orchard abandons the gradient and opens the temporary Reedless corridor behind it while its leading mass threatens Cairnwood's supply area. Players can protect the route, redirect the orchard with lower-pressure ground, or finish harvesting and accept camp relocation. If nobody comes, the route closes and the camp abandons stock. The ecology resolves the incident.

## 13. Readability contract

Backend state is never sufficient. Each major mechanic must communicate through several independent channels.

| Mechanic | Environment/sound/creatures | UI/Atlas/Codex | NPC/equipment |
| --- | --- | --- | --- |
| Saturation | root posture, water/air condition, conductor activity, animal absence/calls, band-specific sound | qualitative band on inspection; optional discovered overlay; Codex teaches cues | calibrated meter pulses; guides and researchers describe evidence, not hidden percentages |
| Reactor | lights, machinery cadence, vents, doors/defenses, grid-fauna response | forecast card and affected sectors; cycle overlay only when requested; Codex state table | Tomas/NDD broadcasts; obsolete tools read local controls |
| Mutation | continuous anatomy, gait/feeding/sensing/attack change, group response | creature dossier states and known counters; no generic mutation icon soup | field scopes/samples identify a family; Wardens report behavior |
| Bloomstorm | five-stage sky/terrain progression, readable shelter, creature warning | warning timer/cone when forecast quality allows; stage/aftermath overlay; Codex cause/progression | rated masks, grounding tools, storm sensors, NPC evacuation language |
| Harvesting | visible source condition, shed versus rooted/live material, altered calls/flow | extraction method and qualitative consequence class; optional stress overlay after discovery | tools show load/function; experts warn specifically what the material is doing |
| Aberrants | tracks, displaced prey, infrastructure/hydrology effects, wounds | Rumored/Tracked/Confirmed/Lost intel; Codex mobility and evidence | Wardens, local reports, tags/sensors with freshness limits |

Accessibility requires redundant shape, motion, sound, text, and icon cues. Band recognition cannot depend on color alone.

## 14. Implementation tiers

### MVP

- 18-24 authored cells with numeric saturation and four player-facing bands;
- subregion floors, fixed source/sink profiles, transfers, hysteresis, and bounded recovery;
- one authoritative Southreach reactor controller with seven states and authored sector bindings;
- Bloomstorm five-stage state machine with source/carrier checks and capped rewards;
- resource consequence class, harvest pressure, sink integrity, and qualitative warnings;
- species-authored baseline/exposed/adapted/Bloom-evolved variants selected from cell/habitat pressure;
- no persistent ordinary creature population; up to six promoted threats using authored profiles;
- named Aberrant mobility/activity/life state and separate player intel quality;
- conditional route states and one-at-a-time optional Atlas overlays;
- world-authoritative save data and deterministic bounded catch-up;
- local VFX, sound, animation, and UI driven from replicated qualitative state.

### Phase 2

- multiple independently damaged reactor sectors under the same regional controller;
- one combat stress imprint for promoted survivors;
- aggregated herd/nest/colony trait bias per cell;
- richer off-screen threat movement and wounded behavior;
- faction forecasts, delayed/biased information, licenses, and recovery interventions;
- more dynamic route corridors and aftermath encounters;
- resource-specific regrowth and ecological succession;
- co-op party intel sharing and deliberate tagging equipment.

### Aspirational

- generational population simulation beyond aggregate weights;
- persistent herd/nest agents moving continuously across the region;
- richer food-web or hydrological solvers;
- long-horizon adaptation to several player strategies;
- cross-server seasonal ecology histories.

Aspirational work is not required to make Bloomfall feel systemic. It should be rejected if it compromises readability, save size, authority, or authored species identity.

## 15. Authority, networking, and save contract

### Server/world authoritative

- simulation clock/version and deterministic seed/epoch;
- reactor state, sector, elapsed time, forecast inputs, and pending transition;
- cell saturation, band, source output, sink integrity/capacity, harvest pressure, disturbance, and recovery timestamp;
- Bloomstorm source, path/footprint, stage, elapsed time, and aftermath expiry;
- route condition/gate state;
- promoted threat and named Aberrant truth;
- population trait bias when Phase 2 exists;
- world event resolutions and Persistent Damage links;
- player/party Atlas discovery and threat-intel records.

Single-player should run the same authoritative world service locally so rules and saves do not fork into a second design.

### Local presentation only

- particles, fog interpolation, color grading, surface wetness, vegetation animation;
- audio layers and camera effects;
- client-side smoothing of replicated band/storm transitions;
- cached labels, forecast animation, and non-authoritative path previews;
- ordinary creature animation and per-frame AI details after spawn authority is established.

### Exact persisted state

```text
BloomfallWorldState
  schemaVersion
  simulationEpoch
  lastAuthoritativeTime
  reactor { state, sectorId, enteredAt, pendingTransition, transitionCause }
  cells[] {
    cellId
    saturationValue
    saturationBand
    sourceOutput
    sinkIntegrity
    boundLoadClass
    harvestPressure
    disturbanceClass
    recoveryStartedAt
    stormAftermathUntil
    populationTraitBias?       // Phase 2
  }
  activeStorm? { id, sourceCellId, pathCellIds, stage, enteredAt, intensityClass }
  routes[] { routeId, condition, cause, changedAt, expiresAt? }
  promotedThreats[] { bounded identity/state record }
  namedAberrants[] { life, activity, home/current range, wounds, lastTransition }
  resolvedRegionalEvents[] { compact authored consequence references }

BloomfallKnowledgeState (per player/party as design decides)
  discoveredCellBands
  knownForecasts
  routeReports and freshness
  Aberrant intel state, area, source, observedAt
  resource/sink discoveries
```

Do not persist ordinary creature instances, raw per-hit histories, VFX/audio state, particles, transient pathfinding, every harvested prop, or full tick logs. Material world scars belong to the existing Persistent Damage architecture, referenced rather than duplicated.

Offline catch-up should integrate elapsed time in bounded steps and stop at authored decision/event boundaries. It must not simulate thousands of missed creature encounters.

## 16. Atlas overlays and route architecture

### Optional overlays

| Overlay | Source | Presentation rule |
| --- | --- | --- |
| Saturation | discovered/forecast cell bands | qualitative hatching/edge treatment; no numeric heatmap by default |
| Reactor cycle | authoritative state plus player forecast knowledge | affected sectors and direction, not a facility telemetry dashboard |
| Bloomstorm | warning cone, observed footprint, aftermath cells | replaces rather than stacks over Saturation while active |
| Hazardous route | route condition records | only changed/at-risk segments; base route remains visible |
| Aberrant tracking | knowledge records | fuzzy areas/arrows with freshness and Rumored/Tracked/Confirmed/Lost state |
| Harvesting stress | discovered pressure/sink evidence | POI/cell warning marks shown only after inspection or trusted report |

Only one analytical ecology overlay should be active at a time, with route/quest markers permitted as a restrained second layer. The Atlas is a map, not a wall of colored telemetry.

### Route classes

| Route/corridor | Class | Ruling |
| --- | --- | --- |
| Riverlands road through Ashline toward Southreach | `PERMANENT` | Canonical authored alignment remains. Local segments may become hazardous/blocked through condition records; topology is not rewritten. |
| Drowned Intake/Ocean sea approach | `CONDITIONAL` | Canonical alignment exists, but navigability depends on hydrology, storm, Old Drowner, and intake state. |
| Cairnwood-Glassroot expedition trail | `CONDITIONAL` | Later author one surveyed alignment only after review; closures/price changes sit in the route overlay. |
| Southreach Complex service/rail alignment | `CONDITIONAL` | Later author after review; reactor power, structure, and Last Shift behavior gate segments. |
| Walking Orchard-Reedless corridor | `DYNAMIC` | Event route generated from an authored corridor set; never promoted to permanent base topology. |
| Long Graze herd corridor | `DYNAMIC` | Ecology/season/threat-informed area or corridor, not a guaranteed player road. |
| Heartfen openings | `DYNAMIC` | Temporary marsh access from authored channel candidates and sink state. |
| Magic-Torn connection | `DEFERRED` | Geographic adjacency only; no route is created by this architecture. |
| Full-world continuation details | `DEFERRED` | No new world-scale path authoring in this phase. |

## 17. Codex content and data architecture

### Future Systems record work

Prompt C should update in place:

- `essence-saturation` with bands, causes/sinks, subregion tendencies, readability, and runtime ownership;
- `reactor-cycles` with frequency classes, legal transitions, state effects, and risk/reward;
- `adaptive-mutation` with two-axis eligibility, states, families, triggers, inheritance, and persistence;
- `harvesting-consequences` with consequence classes, pressure/recovery, and resource function;
- `aberrant-escalation` with promoted survivors, mobility, activity, intel, persistence, and life policy.

Prompt C should create exactly one new SYSTEM record, `bloomstorms`, under `weather`, after confirming no record has been added in the meantime.

Supporting pages should receive links/brief regional refinements, not duplicate bodies:

- Blackbloom Exposure owns the separation from Seven-Phase Corruption.
- Marsh Absorption owns Living Marsh binding/redistribution.
- Blackbloom Spell Instability owns casting effects.
- Bloomfall Environmental Hazards owns exposure/injury/traversal effects.
- Environment, Weather, Nature, Gathering & Harvest, Persistent Damage, and Lasting Wounds remain global parents/consumers.

### Future typed content fields

Do not place runtime truth in prose parsing. When implementation begins, cross-package domain types belong in `packages/shared`.

Recommended creature metadata extension:

```text
bloomfallMutation?: {
  eligibility
  allowedFamilies[]
  allowedStates[]
  stateDefinitions[] {
    key
    displayName
    triggers
    behaviorChanges[]
    combatChanges[]
    ecologicalRole
    counters[]
    permanence
    imageAssetId?
  }
  stressResponses[]
  inheritanceModel
  persistentThreatProfile?
  aberrantStatus
  mobilityProfile?
}
```

Recommended resource metadata extension:

```text
bloomfallHarvest?: {
  consequenceClass
  sourceFunction
  preferredMethod
  pressureCost
  sinkIntegrityCost?
  recoveryProfile
  catastrophicThreshold?
}
```

Recommended POI/cell authoring data:

```text
bloomfallSimulation?: {
  cellId
  habitatTags[]
  sources[]
  sinks[]
  adjacency[]
  reactorBindings[]
  routeBindings[]
  stormCarrierTags[]
  encounterTables[]
}
```

Story/Codex metadata describes canon and authoring. Runtime state lives in a separate world-state payload keyed to stable Codex/Atlas IDs.

### Future creature page presentation

Every adaptive creature page should include one **Adaptive Mutation** section after its base ecology/taxonomy and before harvest/combat detail:

1. eligibility and whether it can become an Aberrant;
2. allowed mutation families and triggering conditions;
3. state strip using consistent same-species images;
4. state-by-state visible tell, behavior, combat function, ecological role, counterplay, and permanence;
5. habitat/reactor/storm interactions;
6. harvesting consequences;
7. persistence/promotion notes where allowed.

The image strip defaults to chronological/pressure order: Baseline -> Exposed -> Adapted -> Bloom-evolved. It must label unavailable states rather than implying every species has four. On mobile, images stack vertically with state label and change summary; no horizontal-only carousel may hide the progression.

## 18. AAA visual requirements for later production

### Six system visuals

All are mature 17+, grounded AAA realism, 16:9, with real industrial/ecological function and no UI baked into the art.

| System | Exact scene concept |
| --- | --- |
| Essence Saturation | One Glassroot survey line looking across four adjacent field conditions from stable stained ground to actively reacting vegetation and a critical storm edge; instruments and animals provide scale. Show one ecology under increasing free pressure, not four fantasy biomes. |
| Reactor Cycles | Southreach control gallery during a forecast transition: dormant banks in depth, one sector restarting, purge shutters opening, small technical team choosing a route. Machinery remains spatially intelligible. |
| Adaptive Mutation | Same representative eligible species in a controlled four-state field study, identical camera and anatomy anchors, with each change visibly functional in behavior/habitat. Final species waits for Prompt B. |
| Bloomstorm | Warning-to-onset front moving from Crown Break into the Belt: glasswings dropping, vegetation leaning before charged rain/fog, expedition choosing shelter versus a visible salvage window. No nuclear cloud or broken physics. |
| Harvesting Consequences | Blackweir split-depth scene: careful trimming and healthy flow on one side, stripped sink bed releasing stored load and changing predator/channel behavior on the other. The same valuable tissue is visibly containment infrastructure. |
| Roaming Aberrants | Warden tracking scene at Long Graze: displaced herds, damaged vegetation, uncertain distant Bellwether presence, paper/instrument track evidence, and several plausible directions. Emphasize information quality, not a boss portrait or GPS marker. |

### Mutation state art specification

- identical species, age class, sex/presentation unless the species sheet requires otherwise;
- consistent 3/4 camera, lens, horizon, scale reference, and neutral field-document background;
- stable skeletal landmarks, limb count, joints, silhouette, scars, and identifying markings;
- state change follows the allowed family and habitat;
- behavior/pose changes may communicate function, but the baseline pose remains comparable;
- lighting/color do not carry the mutation by themselves;
- no generic glow, random spikes, arbitrary tentacles, or unrelated armor plating;
- mature biological consequence and body horror are allowed when anatomically causal, never as gore decoration;
- named Aberrant art may use its territory, but lineage continuity must remain readable.

Prompt B supplies the exact species, state names, anatomy invariants, family, mechanical changes, image count, and whether a neutral progression sheet or matched environmental series is required. Prompt C/art production may then generate and review images; this phase generates none.

## 19. Prompt B contract: creature/race/entity audit

Prompt B must not redesign the regional rules. It applies them to current content.

For every Bloomfall creature, race, person-origin entity, construct, colony, and named Aberrant, Prompt B must:

- re-read the live dossier and preserve base taxonomy;
- assign `mutationEligibility` or explicitly `NONE`;
- assign `aberrantStatus` separately;
- select only allowed mutation families;
- define the species-specific subset of Baseline/Exposed/Adapted/Bloom-evolved states;
- define exact environmental and optional combat triggers;
- name every visual, behavioral, combat, and ecological change;
- define counterplay and permanence/regression;
- define individual versus herd/nest/colony propagation;
- decide persistent-survivor eligibility;
- assign image count and anatomy-continuity brief;
- classify named mobility, allowed cells, activity weights, and life policy;
- identify every deliberately non-adaptive creature/entity;
- flag overlaps with harvesting/resource function;
- improve thin Codex detail without inventing runtime implementation.

Prompt B output must include a complete audit matrix and proposed updates. It must not generate images, write production, or globalize Adaptive Mutation.

## 20. Prompt C and later runtime needs

Prompt C should convert this architecture and Prompt B's assignments into reviewed Codex content/data changes in a guarded non-production phase. It should:

- upgrade five existing centerpiece pages in place;
- add the one `bloomstorms` Systems page if still absent;
- refine supporting Systems links/region notes without duplication;
- add typed mutation/resource metadata only after schema review;
- bind state-image requirements without generating or activating images;
- prepare validation for taxonomy separation, finite state counts, and complete mechanical changes;
- preserve stable slugs, IDs, revisions, and existing V3 art bindings.

Later Unreal/runtime work needs:

- a Bloomfall-only world subsystem and data assets;
- stable shared enums/IDs matching exported Codex content;
- authoritative event/tick scheduler and deterministic catch-up;
- cell adjacency/source/sink transfer model;
- reactor and storm state machines;
- encounter variant resolver using authored species data;
- promoted-threat registry and named-threat scheduler;
- harvest consequence hooks and resource-node capacity;
- route condition service;
- save/version migration support;
- replication/relevancy rules for co-op;
- presentation interfaces for environment, audio, AI, spells, injury, equipment, UI, NPC barks, and Atlas;
- telemetry proving transition causes and preventing impossible states;
- simulation/debug views available only to authenticated development tools, never public management endpoints.

## 21. Complexity and risk controls

| Risk | Control |
| --- | --- |
| Over-complexity | authored cells, event-driven deltas, five mutation inputs, finite families/states, strict MVP boundary |
| Save bloat | persist cells and promoted threats, not ordinary creatures, ticks, props, or per-hit logs |
| Multiplayer disagreement | server/world authority for all shared ecology; clients present only replicated state |
| Species explosion | eligibility opt-in, optional states, one family per Functional encounter, no mandatory ladder |
| Art workload | fixed image matrix, omitted meaningless states, matched camera/anatomy, custom named cap |
| Player unreadability | four qualitative bands, hysteresis, five storm stages, multi-channel cues, known causes |
| Random gimmicks | every transition records source/cause/destination; variance selects only valid outcomes |
| Loot farming | source-bound capped rewards, recovery, finite infrastructure, sink consequences |
| Permanent cleansing | subregion floors, stored load, source recurrence, recovery toward baseline only |
| Blackbloom/Corruption confusion | distinct owners, names, fields, phases, icons, copy, and art language |
| Magic-Torn confusion | real weather/biology/industry; no physics failure visual or mechanics |
| Boss-statue design | mobility/activity profiles, ecological effects, intel quality, wounded retreat, no casual respawn |
| Public attack surface | no public simulation control, arbitrary shell/RCON/file endpoints, or exposed game-management API |

## 22. Genuine unresolved decisions

Only these decisions remain open after this architecture:

1. Prompt B's eligibility, state set, families, and image count for each current creature/entity.
2. Exact cell boundaries/count within the recommended 18-24, authored from level/encounter spaces rather than the Atlas alone.
3. Which Southreach sectors are distinct runtime controllers beneath the MVP regional cycle.
4. Final tuning values: tick rate, state durations, deltas, thresholds, recovery, reward caps, and promoted-threat cap after prototypes.
5. Whether Atlas discoveries are individual, party-shared, server-shared, or a layered combination in co-op.
6. The four named Aberrants' killability, permanent-death consequences, and any successor policies.
7. Which spell properties are legal overcharge benefits/backlashes without invalidating authored encounters.
8. Which Lasting Wounds can result from Bloomstorm/Blackbloom exposure for player characters versus companions/NPCs.
9. Whether the first runtime release includes the `bloomstorms` page/art before the full storm mechanic or ships both together under one release gate.

The cause of the Bloomfall, Living Marsh consciousness, main-campaign integration, and Magic-Torn route remain intentionally deferred canon questions, not blockers to this system architecture.

## 23. Acceptance test for the future simulation

The regional simulation is ready only when a test scenario can answer all of the following without a designer inventing a one-off script:

- What source changed the pressure?
- How did the pressure reach this cell?
- What absorbed or failed to absorb it?
- Why was this creature eligible to change?
- What functional adaptation appeared, and what counters it?
- What did harvesting/combat/player interference alter?
- Why did the Aberrant move or become active?
- What did the player perceive before the consequence?
- What world state persists afterward?
- What would have happened if nobody came?

If any answer is "because the encounter rolled it," the implementation has drifted from Bloomfall's canon.
