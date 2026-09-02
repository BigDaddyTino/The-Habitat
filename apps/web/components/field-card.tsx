import type { ReactNode } from "react";

/**
 * The labeled-field block for things that are not abilities: a rung of
 * holding, a way to get ground, a faith, a siege posture, a licence gate.
 * Same reading grammar as the ability card — a name, then label/value rows
 * in a fixed order — so the Nation and Trades pages read like the
 * Character page. `tone` colours a row: good is green, bad is red.
 */
export type Field = { label: string; value: ReactNode; tone?: "good" | "bad" | "muted" };

export function FieldCard({
  name,
  eyebrow,
  fields,
  step,
  accent,
  price,
  reserved,
  tag,
  children,
}: {
  name: ReactNode;
  eyebrow?: string;
  fields: Field[];
  /** A small ordinal in the corner, for ladders. */
  step?: number | string;
  accent?: boolean;
  price?: boolean;
  reserved?: boolean;
  /** A dashed ember tag, like the ability card's untested marker. */
  tag?: string;
  children?: ReactNode;
}) {
  return (
    <article className={`field-card${accent ? " is-accent" : ""}${price ? " is-price" : ""}${reserved ? " is-reserved" : ""}${step !== undefined ? " has-step" : ""}`}>
      {step !== undefined ? <span className="field-step">{step}</span> : null}
      <header className="field-head">
        {eyebrow ? <i className="field-eyebrow">{eyebrow}</i> : null}
        <b className="field-name">{name}</b>
      </header>
      <dl className="field-fields">
        {fields.map((field, index) => (
          <FieldRow key={`${field.label}-${index}`} field={field} />
        ))}
      </dl>
      {tag ? <span className="field-tag">{tag}</span> : null}
      {children}
    </article>
  );
}

function FieldRow({ field }: { field: Field }) {
  return (<><dt>{field.label}</dt><dd className={field.tone ? `is-${field.tone}` : undefined}>{field.value}</dd></>);
}
