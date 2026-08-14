"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { normalizeSeasonThreshold, seasonGoalProblems, seasonGoalWarnings, seasonRuleCopy, seasonRuleTypes, seasonThresholdInputValue, type SeasonRuleType } from "@/lib/season-content";

type GameOption = { value: string; label: string };

export function SeasonGoalFields({
  defaultGame,
  defaultRule,
  defaultThreshold,
  games,
  gameRequired = false,
  measurementLocked = false,
}: {
  defaultGame: string | null;
  defaultRule: SeasonRuleType;
  defaultThreshold: number;
  games: GameOption[];
  gameRequired?: boolean;
  measurementLocked?: boolean;
}) {
  const [ruleType, setRuleType] = useState<SeasonRuleType>(defaultRule);
  const [gameType, setGameType] = useState(defaultGame ?? "ANY");
  const [target, setTarget] = useState(String(seasonThresholdInputValue(defaultRule, defaultThreshold)));
  const numericTarget = Number(target);
  const threshold = Number.isFinite(numericTarget) ? normalizeSeasonThreshold(ruleType, numericTarget) : 0;
  const selectedGame = gameType === "ANY" ? null : gameType;
  const notes = [
    ...seasonGoalProblems({ ruleType, gameType: selectedGame, threshold }),
    ...seasonGoalWarnings({ ruleType, gameType: selectedGame, threshold }),
  ];
  const playtime = ruleType === "PLAY_SECONDS";
  const helpId = useId();

  return <>
    <label>Game
      <select disabled={measurementLocked} name="gameType" onChange={(event) => setGameType(event.target.value)} value={gameType}>
        {!gameRequired ? <option value="ANY">Any Habitat game</option> : null}
        {games.map((game) => <option key={game.value} value={game.value}>{game.label}</option>)}
      </select>
    </label>
    <label>Rule
      <select disabled={measurementLocked} name="ruleType" onChange={(event) => setRuleType(event.target.value as SeasonRuleType)} value={ruleType}>
        {seasonRuleTypes.map((rule) => <option key={rule} value={rule}>{seasonRuleCopy[rule].label} ({seasonRuleCopy[rule].unit})</option>)}
      </select>
    </label>
    <label>Target ({playtime ? "hours" : seasonRuleCopy[ruleType].unit})
      <input aria-describedby={helpId} inputMode="decimal" max={playtime ? 27_777 : 100_000_000} min={playtime ? 0.01 : 1} onChange={(event) => setTarget(event.target.value)} required step={playtime ? "any" : 1} type="number" value={target} />
      <input name="threshold" type="hidden" value={threshold} />
      <small id={helpId}>{seasonRuleCopy[ruleType].measures}{playtime ? ` Stored as ${threshold.toLocaleString()} verified seconds.` : ""}</small>
    </label>
    {notes.length ? <p className="season-build-live-note" role="status">{notes.join(" ")}</p> : null}
  </>;
}

export function SeasonBuilderSubmit({ children, className, disabled = false, pendingLabel }: { children: ReactNode; className?: string; disabled?: boolean; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button aria-disabled={disabled || pending} className={className} disabled={disabled || pending} type="submit">{pending ? <><span aria-hidden="true" className="season-build-spinner" /> {pendingLabel}</> : children}</button>;
}
