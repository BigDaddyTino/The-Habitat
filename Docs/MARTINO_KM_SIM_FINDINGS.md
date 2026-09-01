# Kingdom Management — sim findings (pass 1)

Seed 20260901 · model `apps/web/scripts/lib/kingdom-sim.ts` · runner `scripts/sim-kingdom-balance.ts`
· raw log `Docs/MARTINO_KM_SIM_RESULTS.md` · spec: "Holding Ground" rev 8.

Model scope: five Great Powers (equal-start normalized, shaped by axis identity),
a 14-site neutral belt, four institution seats with an influence auction, a
six-site Free Powers bloc that only defends (and answers as one), sacred sites
with the unkeepable/grievance law, sieges as Forge clocks using the CANON
reclamation curve (35 + 11.7/level), faith pressure + morale with the secular
crown, Court Day every 30 world-days, kingdom XP with ceilings every third level,
holdings capped by kingdom level. 420 world-days ≈ 28 real days of server time.

## CONFIRMED — the design holds where it promised to

1. **The equal start does not snowball.** Across 48 seeds the max/min spread
   among Great Powers stays 1.3–1.5x through 420 days, with ~6–7 lead changes
   per run. No world produced a runaway; no power was ever eliminated (the
   story-shielded capitals also function as an elimination floor, which reads
   as intended).
2. **The coalition instinct works as an anti-meta valve.** With balance-of-power
   coalitions ON, the strongest personality's winrate drops from 60% to 35%
   and the field flattens. Worlds need the rule; keep it canon that powers gang
   up on a runaway leader.
3. **The Free Powers law holds.** The bloc finished 100% of runs intact. "The
   whole desert comes" — modeled as the entire bloc reinforcing on any seizure —
   is sufficient deterrent all by itself.
4. **The secular crown's price is real and His manipulation clause works.**
   A secular crown over a devout population bleeds morale (100 → 82 over two
   world-years) while the population visibly secularizes under pressure
   (5% → 27%). Faith-matched crowns hold 92–94 morale. The knob does exactly
   what the ruling asked.
5. **The Court Day incentive ladder is correctly ordered — and funny.**
   Present ruler 771 coin EV / 14 months · good governor 542 · auto-doctrine
   313 · poor governor 192. A bad governor is WORSE than no governor: doctrine
   doesn't improvise. That is a feature, a story, and a warning label on the
   governor pool all at once.
6. **Elite garrisons bankrupt their own clock.** Higher-level defenders make a
   siege SHORTER (level 30 falls in 15.5d vs level 4's 17.8d) because every
   reclaimed veteran costs 386 Essence against a finite reserve. "A fortress
   of veterans is a fortress with an expensive clock" — emergent, canon-true,
   and worth writing into the codex when this integrates.

## DECISIONS RAISED — five, in the talent-sim tradition

1. **Aggression is the only scoring meta as modeled.** NDD and the Covenant
   (the two expand-personalities) take 66% of wins; Floating City (consolidate,
   tech) wins 8%. Points flow almost entirely from holdings, so conquest is the
   only engine. **Decide:** non-conquest engines that score — trade routes
   compounding Wealth, research compounding Tech, faith reach scoring for the
   Covenant — so tall, rich, or learned play can win a world without out-
   soldiering the soldiers.
2. **The Forge clock drains too fast to be the siege's story.** Reserve size
   barely moved outcomes (12x the reserve bought ~2 extra days) because
   reclaim costs dwarf wartime regen; every fallen site fell reserve-dry
   (100% "intact"), so the intact-vs-stormed premium never engaged. **Decide:**
   (a) size reserves in sustained-days (reserve ≈ garrison × cost × target
   days) so the clock is the siege's real dial, and (b) make STORM vs WAIT an
   attacker choice — storm early for speed with burn risk, wait out the clock
   for the intact prize. The choice is currently implied by the spec and
   absent from the model.
3. **Faith conversion is ~6–8x too slow to ever matter.** Half-life to majority
   ≈ 93 world-months (about 186 real days of server time) at the default drift.
   **Decide:** target pace — recommended half-life 12–18 world-months (roughly
   3–4 real weeks), with shrines, the Faith tree, and suppression as the
   accelerators that pull it faster.
4. **Conquest XP dominates kingdom leveling.** The most aggressive power hit
   L7 while consolidators sat at L4 — levels are supposed to reward "doing
   more and growing more," not only taking more. **Decide:** governance XP
   weights (projects finished, Court Day handled, trade volume, ceilings) so a
   tall realm levels on par with a wide one.
5. **Institution seats were never contested by NPC powers.** All four seats
   finished institution-held in every run (the influence auction runs; conquest
   of seats effectively never fires at NPC appetite levels). **Decide:** is
   that the intended norm — city-states endure, and seizing one is a
   player-grade transgression — or should late-game NPC wars swallow seats too?

## TUNING PASS — the owner's five rulings, applied and measured

Rulings of 2026-09-01: (1) NO alternate victory engines — dominance is taken,
not accumulated; (2) YES sustained-days reserves + storm-vs-wait; (3) YES
faster faith; (4) YES governance XP, real work only, very steep curve; (5) YES
late-game wars swallow institution seats.

1. **The Forge clock is now the siege's dial.** Reserves sized in
   sustained-days: a 2-day clock falls in 11d (storm) / 23d (wait); a 6-day
   clock in 16d / 35d; a 12-day capital-grade clock defeats a standard army
   outright — wait starves the attacker first, storm succeeds rarely and
   usually burned. **Emergent doctrine, worth codexing:** against a shallow
   clock, storm — you cannot outrun it and it dies before your assault does,
   so the prize comes intact anyway; against a deep clock, storming is the
   only road and you take it burned or not at all. Deep clocks are what make
   capitals a different tier of war. (Pass 1's "elite garrisons bankrupt their
   own clock" survives as a gameplay tip: it bites any fort that promotes its
   garrison without deepening its reserve.)
2. **Faith pace on target.** Conversion half-life 464 world-days = 15.5
   world-months (~31 real days of server time), inside the ruled 12–18 band,
   before shrine / Faith-tree / suppression accelerators. The secular
   manipulation clause is now visible in the data: a secular crown's people
   secularize 5% → 56% over two world-years while morale climbs back from the
   early penalty (82 → 89).
3. **The steep curve works.** All five powers converge at L5 over 420 days
   (was L7 warmonger vs L4 builders); each level costs 1.6x the last; first
   ceilings land day 99–144. Governance XP (Court Day handled, sieges stood,
   influence won) levels tall realms at the pace of wide ones — from real
   work only, per the ruling.
4. **Late-game wars now swallow seats** — 0.7 of 4 seats fall by day 420 with
   the coalition wars spilling into them (was 0.0). City-states endure the
   early game and become prizes in the late one, exactly as ruled.
5. **The aggression meta stands, kept honest by the coalition.** Per ruling 1
   there are no alternate engines, and the war-shaped power (NDD) is the
   house favorite at 58% of worlds — but the sharpened coalition instinct
   (powers turn on a leader at 1.18x) holds the spread at 1.3x with eight
   lead changes per run. Every world stays contested; none is scripted. The
   favorite's edge is personality, not points — and the personalities are the
   balancing surface if the favorite ever needs shaving. **The player is the
   missing variable:** these are worlds with no player crown in them, and the
   earn-the-seat entrant is designed to be exactly the history-breaker these
   numbers leave room for.

## ADDENDUM — the soulless garrison (owner ruling, simmed same day)

Machines defend without souls: no Forge, no reclamation, destroyed is
destroyed — and they sip the same Essence daily as upkeep (0.05/unit/day in
the model; "very very small unless you have a huge robot army just sitting
around").

- **Hybrid walls trade a little hold-time for a living Forge.** At fixed 160
  total defense on a 6-day clock: pure living holds 16.3d (storm) / 34.8d
  (wait) and ends with the reserve at ZERO; 100 machines + 60 living holds
  15.0d / 31.5d and ends with reserve alive (~95–127). Machines don't hold
  longer — they hold cheaper, and the town that falls a day sooner still has
  a working Forge for the relief and the retaking.
- **The sip is absurdly good insurance at modest scale.** One full 6-day-clock
  siege burns ~11,856 Essence in reclamations; 100 machines cost 5/day — the
  siege's burn equals 79 MONTHS of their upkeep. The drain only bites at
  vanity scale (400 machines = 20/day), exactly per the owner's framing.
- **A pure-machine wall abolishes the clock** — there is nothing for a WAIT
  siege to starve, so storming becomes the attacker's only road. The far end
  of the doctrine is a fortress that must be paid for in blood or left alone,
  and that is a real strategic identity, not an exploit.
- **Class hooks:** Cypherist builds the machines; the Procurator's existing
  supply/logistics lane is the natural home for realm-scale upkeep efficiency
  (extend existing nodes at integration; the trees are final).

## Model debts (mine, not the design's)

- The influence auction's patron-swapping isn't reported as a metric yet.
- Diplomacy is pact-only; no tribute, marriages, or trade agreements yet.
- The player crown / earn-the-seat threshold and the Mourning are unmodeled —
  the natural next pass, now that the five decisions are ruled and tuned.
