/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Activity, ArrowRight, Network, Route, ShieldAlert, Sprout } from "lucide-react";
import {
  bloomfallHarvestClasses,
  bloomfallHarvestPressureBands,
  bloomfallIntelStates,
  bloomfallMobilityClasses,
  bloomfallMutationTiers,
  bloomfallReactorStates,
  bloomfallRelationshipDiagram,
  bloomfallRouteClasses,
  bloomfallRouteKnowledgeStates,
  bloomfallRouteRecords,
  bloomfallSaturationBands,
  bloomfallStormStages,
  bloomfallSystemPageBySlug,
  bloomfallSystemPages,
  type BloomfallSystemPage,
} from "@/lib/bloomfall-codex-integration";
import { bloomfallCreatureEnhancements } from "@/lib/bloomfall-creature-enhancements";
import { bloomfallV3Assets, bloomfallV3Package } from "@/lib/bloomfall-v3-art";

/**
 * The Bloomfall systems presentation.
 *
 * The stored prose explains each system in full and ships wherever the record
 * ships. This panel is the comparative layer on top of it: the band, state,
 * tier, class, and route tables a reader wants side by side, plus the causal
 * diagram and the Adaptive Mutation creature index. It renders from the same
 * reviewed manifest the prose is generated from, so the two can never disagree.
 *
 * Development only, on purpose. The Prompt E package is a review candidate;
 * production keeps exactly what the owner has already approved until a
 * promotion phase says otherwise.
 */

const stormHero = bloomfallV3Assets.find((asset) => asset.id === "bloomstorm");

function isDevelopment(environment: Readonly<Record<string, string | undefined>>) {
  return environment.HABITAT_ENVIRONMENT === "development";
}

function Cards({ children, columns }: { children: React.ReactNode; columns: 4 | 5 }) {
  return <div className={`bloomfall-card-grid is-${columns}`}>{children}</div>;
}

function Card({ eyebrow, title, rows, lead }: { eyebrow: string; title: string; lead?: string; rows: Array<[string, string]> }) {
  return <article className="bloomfall-card">
    <p className="eyebrow">{eyebrow}</p>
    <h4>{title}</h4>
    {lead ? <p className="bloomfall-card-lead">{lead}</p> : null}
    <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </article>;
}

function SaturationBands() {
  return <Cards columns={4}>
    {bloomfallSaturationBands.map((band, index) => <Card
      eyebrow={`Band ${index + 1} of 4`}
      key={band.key}
      lead={band.shortRead}
      rows={[["Environment", band.environment], ["Creatures", band.creatures], ["Mutation pressure", band.mutation], ["Resources", band.resources], ["Travel", band.travel], ["Risk", band.risk]]}
      title={band.name}
    />)}
  </Cards>;
}

const reactorClassLabels = {
  NORMAL_CYCLE: "Normal cycle",
  RARE_CONTROLLED: "Rare controlled state",
  FAILURE: "Failure state",
} as const;

function ReactorStates() {
  const groups = (["NORMAL_CYCLE", "RARE_CONTROLLED", "FAILURE"] as const).map((frequencyClass) => ({
    frequencyClass,
    states: bloomfallReactorStates.filter((state) => state.frequencyClass === frequencyClass),
  }));
  return <div className="bloomfall-groups">
    {groups.map((group) => <section key={group.frequencyClass}>
      <h3 className="bloomfall-group-heading">{reactorClassLabels[group.frequencyClass]} <span>{group.states.length}</span></h3>
      <Cards columns={4}>
        {group.states.map((state) => <Card
          eyebrow={reactorClassLabels[group.frequencyClass]}
          key={state.key}
          rows={[["Enters when", state.entry], ["Regional effect", state.regionalEffect], ["What it opens", state.opportunity]]}
          title={state.name}
        />)}
      </Cards>
    </section>)}
  </div>;
}

const eligibilityLabels: Record<string, string> = {
  NONE: "None", MINOR_ADAPTIVE: "Minor", FUNCTIONAL_ADAPTIVE: "Functional", ADVANCED_ADAPTIVE: "Advanced",
};

function MutationTiers() {
  const ranked = ["ADVANCED_ADAPTIVE", "FUNCTIONAL_ADAPTIVE", "MINOR_ADAPTIVE", "NONE"] as const;
  const named = bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT");
  const ordinary = ranked.map((tier) => ({
    tier,
    members: bloomfallCreatureEnhancements.filter((entry) => entry.classification !== "EXCEPTIONAL_ABERRANT" && entry.mutationEligibility === tier),
  })).filter((group) => group.members.length > 0);
  return <>
    <Cards columns={5}>
      {bloomfallMutationTiers.map((tier) => <Card
        eyebrow={tier.axis === "SPECIES_ELIGIBILITY" ? "Species eligibility" : "Individual designation"}
        key={tier.key}
        lead={tier.meaning}
        rows={[["How it shows", tier.expression]]}
        title={tier.name}
      />)}
    </Cards>
    <h3 className="bloomfall-group-heading">Bloomfall species by tier <span>{bloomfallCreatureEnhancements.length}</span></h3>
    <div className="bloomfall-index-scroll">
      <table className="bloomfall-index">
        <caption>Every Bloomfall organism and entity Prompt B classified, with the tier it was given and where it is found.</caption>
        <thead><tr><th scope="col">Tier</th><th scope="col">Dossier</th><th scope="col">Where</th><th scope="col">States</th><th scope="col">Can be promoted</th></tr></thead>
        <tbody>
          {ordinary.map((group) => group.members.map((member, index) => <tr key={member.slug}>
            {index === 0 ? <th rowSpan={group.members.length} scope="rowgroup">{eligibilityLabels[group.tier]}</th> : null}
            <td><Link href={`/codex/bible/${member.slug}`}>{member.title}<ArrowRight aria-hidden="true" size={11} /></Link></td>
            <td>{member.distribution[0]?.replaceAll("_", " ").toLowerCase() ?? "the Reach"}</td>
            <td>{member.states.length}</td>
            <td>{member.promotedThreat.eligible ? "Yes" : "No"}</td>
          </tr>))}
          {named.map((member, index) => <tr className="is-exceptional" key={member.slug}>
            {index === 0 ? <th rowSpan={named.length} scope="rowgroup">Exceptional Aberrant</th> : null}
            <td><Link href={`/codex/bible/${member.slug}`}>{member.title}<ArrowRight aria-hidden="true" size={11} /></Link></td>
            <td>{member.distribution[0]?.replaceAll("_", " ").toLowerCase() ?? "the Reach"}</td>
            <td>{member.states.length}</td>
            <td>Already named canon</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="bloomfall-panel-note">A tier of <strong>None</strong> is a decision, not a gap. Those dossiers show one canonical form and explain the fixed ecology behind it.</p>
  </>;
}

function StormStages() {
  return <>
    {stormHero ? <figure className="bloomfall-hero-figure">
      <img alt="A Bloomstorm front moving out of the Shattercore, with an expedition choosing shelter." src={`/codex-art/${bloomfallV3Package}/${stormHero.filename}`} />
      <figcaption>The owner-approved Bloomfall V3 storm plate. It is the same asset the Codex already carries; nothing new was generated for this page.</figcaption>
    </figure> : null}
    <Cards columns={5}>
      {bloomfallStormStages.map((stage, index) => <Card
        eyebrow={`Stage ${index + 1} of 5`}
        key={stage.key}
        lead={stage.window}
        rows={[["What you see", stage.signs], ["The choice", stage.choice]]}
        title={stage.name}
      />)}
    </Cards>
  </>;
}

function HarvestClasses() {
  return <>
    <Cards columns={5}>
      {bloomfallHarvestClasses.map((harvestClass) => <Card
        eyebrow="Consequence class"
        key={harvestClass.key}
        lead={harvestClass.meaning}
        rows={[["Pressure", harvestClass.pressure], ["Typical of", harvestClass.examples.map((slug) => slug.replaceAll("-", " ")).join(", ")]]}
        title={harvestClass.name}
      />)}
    </Cards>
    <h3 className="bloomfall-group-heading">What worked ground looks like <span>4</span></h3>
    <Cards columns={4}>
      {bloomfallHarvestPressureBands.map((band) => <Card
        eyebrow="Field state"
        key={band.key}
        rows={[["In the field", band.observable], ["Consequence", band.consequence]]}
        title={band.name}
      />)}
    </Cards>
  </>;
}

function AberrantProfiles() {
  return <>
    <h3 className="bloomfall-group-heading">How a named threat moves <span>{bloomfallMobilityClasses.length}</span></h3>
    <Cards columns={4}>
      {bloomfallMobilityClasses.map((mobility) => {
        const holder = bloomfallCreatureEnhancements.find((entry) => entry.slug === mobility.holder);
        return <article className="bloomfall-card" key={mobility.key}>
          <p className="eyebrow">Mobility profile</p>
          <h4>{mobility.name}</h4>
          <p className="bloomfall-card-lead">{mobility.meaning}</p>
          <dl><div><dt>Held by</dt><dd><Link href={`/codex/bible/${mobility.holder}`}>{holder?.title ?? mobility.holder.replaceAll("-", " ")}<ArrowRight aria-hidden="true" size={11} /></Link></dd></div></dl>
        </article>;
      })}
    </Cards>
    <h3 className="bloomfall-group-heading">What the party is allowed to know <span>{bloomfallIntelStates.length}</span></h3>
    <Cards columns={4}>
      {bloomfallIntelStates.map((state) => <Card eyebrow="Information state" key={state.key} rows={[["Means", state.meaning]]} title={state.name} />)}
    </Cards>
    <p className="bloomfall-panel-note">Information decays. A confirmed fix becomes tracked, then lost, unless somebody goes and looks again.</p>
  </>;
}

const routeClassOrder = ["PERMANENT", "CONDITIONAL", "DYNAMIC", "DEFERRED"] as const;

function RouteClasses() {
  return <>
    <Cards columns={4}>
      {bloomfallRouteClasses.map((routeClass) => <Card
        eyebrow="Route class"
        key={routeClass.key}
        lead={routeClass.meaning}
        rows={[["On the Atlas", routeClass.atlas], ["Classified", `${bloomfallRouteRecords.filter((route) => route.classKey === routeClass.key).length} of ${bloomfallRouteRecords.length}`]]}
        title={routeClass.name}
      />)}
    </Cards>
    <h3 className="bloomfall-group-heading">The twelve classified routes <span>{bloomfallRouteRecords.length}</span></h3>
    <div className="bloomfall-index-scroll">
      <table className="bloomfall-index">
        <caption>Every Bloomfall route candidate, in the classes the route review settled on. Four are drawn on the Atlas; eight deliberately are not.</caption>
        <thead><tr><th scope="col">Class</th><th scope="col">Route</th><th scope="col">Between</th><th scope="col">Condition owner</th><th scope="col">On the Atlas</th></tr></thead>
        <tbody>
          {routeClassOrder.map((classKey) => {
            const rows = bloomfallRouteRecords.filter((route) => route.classKey === classKey);
            return rows.map((route, index) => <tr key={route.key}>
              {index === 0 ? <th rowSpan={rows.length} scope="rowgroup">{bloomfallRouteClasses.find((item) => item.key === classKey)?.name}</th> : null}
              <td><strong>{route.name}</strong><span className="bloomfall-index-note">{route.note}</span></td>
              <td>{route.endpoints}</td>
              <td>{route.conditionOwner}</td>
              <td>{route.persisted ? "Drawn" : "Not drawn"}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
    <h3 className="bloomfall-group-heading">What a report is worth <span>{bloomfallRouteKnowledgeStates.length}</span></h3>
    <Cards columns={5}>
      {bloomfallRouteKnowledgeStates.map((state) => <Card eyebrow="Party knowledge" key={state.key} rows={[["Means", state.meaning]]} title={state.name} />)}
    </Cards>
  </>;
}

const laneCount = 3;
const columnCount = 5;
const nodeWidth = 168;
const nodeHeight = 60;
const gapX = 100;
const gapY = 46;
const diagramWidth = columnCount * nodeWidth + (columnCount - 1) * gapX;
const diagramHeight = laneCount * nodeHeight + (laneCount - 1) * gapY;
const nodeX = (column: number) => column * (nodeWidth + gapX);
const nodeY = (lane: number) => lane * (nodeHeight + gapY);

function RelationshipDiagram() {
  const nodes = new Map(bloomfallRelationshipDiagram.nodes.map((node) => [node.key, node]));
  return <figure className="bloomfall-diagram">
    <div className="bloomfall-diagram-canvas">
    <svg aria-labelledby="bloomfall-diagram-title bloomfall-diagram-desc" role="img" viewBox={`-6 -14 ${diagramWidth + 12} ${diagramHeight + 28}`}>
      <title id="bloomfall-diagram-title">How Bloomfall systems feed one another</title>
      <desc id="bloomfall-diagram-desc">
        Southreach reactor cycles release Essence Saturation, which produces Bloomstorms at critical load, which accelerate Adaptive Mutation, which rarely promotes an Aberrant.
        Harvesting removes ecological function, which raises free saturation and changes travel cost. Living Marsh absorption binds the load into containment at a stored cost, lowering saturation without erasing it.
      </desc>
      <defs>
        <marker id="bloomfall-arrow" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3">
          <path d="M0 0 L7 3 L0 6 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="bloomfall-diagram-edges">
        {bloomfallRelationshipDiagram.edges.map((edge) => {
          const from = nodes.get(edge.from);
          const to = nodes.get(edge.to);
          if (!from || !to) return null;
          const sameLane = from.lane === to.lane;
          const forward = to.column > from.column || (to.column === from.column && to.lane > from.lane);
          const x1 = nodeX(from.column) + (sameLane ? (forward ? nodeWidth : 0) : nodeWidth / 2);
          const y1 = nodeY(from.lane) + (sameLane ? nodeHeight / 2 : (to.lane > from.lane ? nodeHeight : 0));
          const x2 = nodeX(to.column) + (sameLane ? (forward ? 0 : nodeWidth) : nodeWidth / 2);
          const y2 = nodeY(to.lane) + (sameLane ? nodeHeight / 2 : (to.lane > from.lane ? 0 : nodeHeight));
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const path = sameLane
            ? `M${x1} ${y1} L${x2} ${y2}`
            : `M${x1} ${y1} C${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`;
          // An edge that jumps two lanes passes straight through the middle
          // row, so its midpoint is somebody else's box. Those keep their
          // wording in the key beneath the drawing rather than on top of it.
          const crowded = Math.abs(to.lane - from.lane) > 1;
          return <g key={`${edge.from}-${edge.to}`}>
            <path d={path} markerEnd="url(#bloomfall-arrow)" />
            {edge.label && !crowded ? <text textAnchor="middle" x={midX} y={midY - 5}>{edge.label}</text> : null}
          </g>;
        })}
      </g>
      <g className="bloomfall-diagram-nodes">
        {bloomfallRelationshipDiagram.nodes.map((node) => <g key={node.key} transform={`translate(${nodeX(node.column)} ${nodeY(node.lane)})`}>
          <rect className={`tone-${node.tone.toLowerCase()}`} height={nodeHeight} rx="3" width={nodeWidth} />
          <text x={nodeWidth / 2} y={nodeHeight / 2 + 4}>{node.label}</text>
        </g>)}
      </g>
    </svg>
    </div>
    <figcaption>{bloomfallRelationshipDiagram.caption}</figcaption>
    <ol className="bloomfall-diagram-key">
      {bloomfallRelationshipDiagram.edges.map((edge) => {
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to) return null;
        return <li key={`key-${edge.from}-${edge.to}`}><strong>{from.label}</strong> {edge.label} <strong>{to.label}</strong></li>;
      })}
    </ol>
  </figure>;
}

function SystemIndex() {
  return <div className="bloomfall-system-index">
    {bloomfallSystemPages.map((page) => <Link href={`/codex/bible/${page.slug}`} key={page.slug}>
      <strong>{page.title}<ArrowRight aria-hidden="true" size={12} /></strong>
      <span>{page.summary}</span>
    </Link>)}
  </div>;
}

const panelHeadings: Record<BloomfallSystemPage["panel"], { eyebrow: string; heading: string; blurb: string }> = {
  SATURATION_BANDS: { eyebrow: "Field reference", heading: "The four saturation bands", blurb: "One band changes the environment, the animals, the resources, the magic, and the road at the same time. This is the comparison a surveyor carries." },
  REACTOR_STATES: { eyebrow: "Field reference", heading: "The seven observed states", blurb: "Four are the ruin's ordinary pattern, one is a rare controlled window, and two are failures. They are not equally likely, and none of them is weather." },
  MUTATION_TIERS: { eyebrow: "Classification", heading: "Eligibility, designation, and who holds what", blurb: "Species eligibility and Aberrant designation are separate axes. Reading them as one ladder is the mistake this table exists to prevent." },
  STORM_STAGES: { eyebrow: "Field reference", heading: "The five stages", blurb: "The warning stage is the design. Everything after it is the consequence of what the party decided while there was still time." },
  HARVEST_CLASSES: { eyebrow: "Field reference", heading: "Five classes, four field states", blurb: "The class says what removing the material costs. The field state says how much the ground has already given." },
  ABERRANT_PROFILES: { eyebrow: "Field reference", heading: "Movement and information", blurb: "How a named threat moves, and how much of that the party is ever allowed to see." },
  ROUTE_CLASSES: { eyebrow: "Field reference", heading: "Four classes, twelve routes", blurb: "A route's identity, its usability, and what anyone currently knows about it are three separate facts." },
};

function panelBody(page: BloomfallSystemPage) {
  switch (page.panel) {
    case "SATURATION_BANDS": return <SaturationBands />;
    case "REACTOR_STATES": return <ReactorStates />;
    case "MUTATION_TIERS": return <MutationTiers />;
    case "STORM_STAGES": return <StormStages />;
    case "HARVEST_CLASSES": return <HarvestClasses />;
    case "ABERRANT_PROFILES": return <AberrantProfiles />;
    case "ROUTE_CLASSES": return <RouteClasses />;
  }
}

const panelIcons = {
  SATURATION_BANDS: Activity, REACTOR_STATES: Activity, MUTATION_TIERS: Sprout,
  STORM_STAGES: Activity, HARVEST_CLASSES: Sprout, ABERRANT_PROFILES: ShieldAlert, ROUTE_CLASSES: Route,
} as const;

export function BloomfallSystemPanel({ entrySlug, environment = process.env }: { entrySlug: string; environment?: Readonly<Record<string, string | undefined>> }) {
  if (!isDevelopment(environment)) return null;

  if (entrySlug === "bloomfall-reach") {
    return <section aria-labelledby="bloomfall-network-title" className="bloomfall-system-panel is-region">
      <div className="bloomfall-panel-heading">
        <div>
          <p className="eyebrow"><Network aria-hidden="true" size={12} /> The Bloomfall system network</p>
          <h2 id="bloomfall-network-title">One region, eight rules</h2>
        </div>
        <span className="bloomfall-status-chip">Canon world rules · future gameplay design</span>
      </div>
      <RelationshipDiagram />
      <SystemIndex />
      <p className="bloomfall-panel-note">Development presentation. The systems described here are canon; the mechanics they describe are design intent, and no runtime simulation of them exists in the game build.</p>
    </section>;
  }

  const page = bloomfallSystemPageBySlug.get(entrySlug);
  if (!page) return null;
  const heading = panelHeadings[page.panel];
  const Icon = panelIcons[page.panel];

  return <section aria-labelledby="bloomfall-panel-title" className={`bloomfall-system-panel panel-${page.panel.toLowerCase().replaceAll("_", "-")}`}>
    <div className="bloomfall-panel-heading">
      <div>
        <p className="eyebrow"><Icon aria-hidden="true" size={12} /> {heading.eyebrow} · {page.title}</p>
        <h2 id="bloomfall-panel-title">{heading.heading}</h2>
      </div>
      <span className="bloomfall-status-chip">Canon world rule</span>
    </div>
    <p className="bloomfall-panel-intro">{heading.blurb}</p>
    {panelBody(page)}
    {page.slug === "essence-saturation" ? <RelationshipDiagram /> : null}
    <p className="bloomfall-panel-note">Development presentation. Everything above is canon; the mechanics it describes are future gameplay design, and no runtime simulation of this system exists in the game build.</p>
  </section>;
}
