# Kingdom Management — sim results (seed 20260901, 2026-09-01)

## A · The race — equal start, 420 world-days, 48 seeds
  coalition=ON  | winrates: ndd 58% · aegis 13% · pearl 6% · floating 2% · ossuary 21%
    spread max/min: day105 1.3x · day210 1.3x · day420 1.3x
    leader changes/run 8.0 · eliminations/run 0.0 · free bloc intact 100% · institution seats held by powers 0.7/4
  coalition=OFF | winrates: ndd 54% · aegis 19% · pearl 0% · floating 0% · ossuary 27%
    spread max/min: day105 1.4x · day210 1.5x · day420 1.5x
    leader changes/run 5.8 · eliminations/run 0.0 · free bloc intact 100% · institution seats held by powers 0.2/4

## B · Sieges as Forge clocks
  STORM vs WAIT (owner ruling): reserve in sustained-days × posture, garrison 160 @ walls 1.5, attacker 260:
    clock  2d: storm: 11.2d, supply 184 (100% intact, 0% no-fall)  |  wait: 23.3d, supply 242 (100% intact, 0% no-fall)
    clock  6d: storm: 16.3d, supply 229 (100% intact, 0% no-fall)  |  wait: 34.8d, supply 308 (100% intact, 0% no-fall)
    clock 12d: storm: 34.2d, supply 288 (13% intact, 88% no-fall)  |  wait: fails (0% intact, 100% no-fall)
  HYBRID WALLS (owner ruling: soulless machines — daily Essence sip, no reclamation, destroyed is destroyed):
  fixed 160 total defense on a 6-day clock, attacker 260 — living/machine mix:
    living 160 + machines   0: storm: 16.3d (100% intact, reserve left 0)  |  wait: 34.8d (100% intact, reserve left 0)
    living 110 + machines  50: storm: 15.7d (100% intact, reserve left 138)  |  wait: 33.5d (100% intact, reserve left 120)
    living  60 + machines 100: storm: 15.0d (100% intact, reserve left 127)  |  wait: 31.5d (100% intact, reserve left 95)
  the economics of the sip vs the gulp: one full 6-day-clock siege burns ~11856 Essence in reclamations;
     50 machines idle cost 2.5 Essence/day — the siege's burn equals 4742 days of upkeep (158.1 months)
    100 machines idle cost 5.0 Essence/day — the siege's burn equals 2371 days of upkeep (79.0 months)
    400 machines idle cost 20.0 Essence/day — the siege's burn equals 593 days of upkeep (19.8 months)
    (a destroyed machine is replaced with coin and materials, never Essence — the Forge never held it)
  garrison LEVEL vs the clock (6-day clock, garrison 160, wait posture):
    level  4 (reclaim 82/body): falls in 34.6d (100% intact)
    level 10 (reclaim 152/body): falls in 34.8d (100% intact)
    level 20 (reclaim 269/body): falls in 34.8d (100% intact)
    level 30 (reclaim 386/body): falls in 34.8d (100% intact)

## C · Faith, morale, and the secular crown
  one realm (ossuary home cluster), crown choice held 720 days (24.0 months):
    crown=rites      pop-share 40% → 75% · morale 100.0 → 96.6
    crown=secular    pop-share 5% → 58% · morale 100.0 → 89.4
    crown=forgefaith pop-share 25% → 72% · morale 100.0 → 99.6
    conversion pace: a crown pushing a new faith moves its people halfway to majority in ~464 days (15.5 months / 30.9 real days of server time)

## D · Court Day, absence, and leveling pace (420 days)
  Court Day over 14 months (coin EV per realm): present 771 · good governor 542 · poor governor 192 · auto-doctrine 313
    the gap between present and auto is the attendance incentive: ~458 coin/14 months (33/month)
  leveling over 420 days: ndd L5(1c) · aegis L5(1c) · pearl L5(1c) · floating L5(1c) · ossuary L5(1c)
    first ceiling broken: ndd d149 · aegis d109 · pearl d104 · floating d139 · ossuary d114
