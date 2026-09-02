import type { ReactNode } from "react";
import { abilityFieldLabel, abilityFieldOrder, abilityKindLabel, type AbilityCard } from "@/lib/ability-cards";

/**
 * The one block every readable power in the codex prints through — talent
 * nodes, the 108 spells, the 60 techniques. Labeled fields in a fixed
 * order (Type · Cost · Cooldown · Range · Duration), then Effect, then
 * Notes, then the flavor line in italics. No hooks, so it renders on the
 * server and inside client tooltips alike.
 *
 * `compact` drops the header row for surfaces that print the name
 * themselves (tooltips, node popouts).
 */
export function AbilityCardView({
  card,
  name,
  eyebrow,
  cost,
  flavor,
  icon,
  compact = false,
  children,
}: {
  card: AbilityCard;
  name?: string;
  /** Small mono line above the name: a branch, a licence, a skill. */
  eyebrow?: string;
  /** Talent-point cost, printed as the first field when given. */
  cost?: number;
  flavor?: string;
  icon?: string | null;
  compact?: boolean;
  children?: ReactNode;
}) {
  const kindClass = `is-kind-${card.kind.toLowerCase()}`;
  return (
    <article className={`ability-card ${kindClass}${compact ? " is-compact" : ""}`}>
      {compact ? null : (
        <header className="ability-head">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="ability-icon" src={icon} />
          ) : (
            <span aria-hidden="true" className="ability-icon is-glyph">{initials(name ?? "")}</span>
          )}
          <div>
            {eyebrow ? <i className="ability-eyebrow">{eyebrow}</i> : null}
            {name ? <b className="ability-name">{name}</b> : null}
          </div>
          {card.untested ? <span className="ability-untested" title="Hand-written numbers the balance sims have not measured yet">untested numbers</span> : null}
        </header>
      )}
      <dl className="ability-fields">
        <dt>Type</dt>
        <dd><span className={`ability-kind ${kindClass}`}>{abilityKindLabel[card.kind]}</span></dd>
        {cost !== undefined ? (<><dt>Points</dt><dd>{cost} talent {cost === 1 ? "point" : "points"}</dd></>) : null}
        {abilityFieldOrder.map((field) => card[field] ? (
          <FieldRow key={field} label={abilityFieldLabel[field]} value={card[field] as string} />
        ) : null)}
        <dt>Effect</dt>
        <dd className="ability-effect">{card.effect}</dd>
        {card.notes ? (<><dt>Notes</dt><dd className="ability-notes">{card.notes}</dd></>) : null}
      </dl>
      {flavor ? <p className="ability-flavor">{flavor}</p> : null}
      {card.untested && compact ? <span className="ability-untested" title="Hand-written numbers the balance sims have not measured yet">untested numbers</span> : null}
      {children}
    </article>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (<><dt>{label}</dt><dd>{value}</dd></>);
}

/** Two letters for the icon slot until Sol delivers the image. */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "·";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
