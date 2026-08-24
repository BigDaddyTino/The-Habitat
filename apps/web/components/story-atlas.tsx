"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Crosshair, Layers3, Search, Swords, X } from "lucide-react";
import OlMap from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import Projection from "ol/proj/Projection";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";
import ImageStatic from "ol/source/ImageStatic";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import MultiPolygon from "ol/geom/MultiPolygon";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import type { Geometry } from "ol/geom";
import type { StoryAtlasFeature, StoryAtlasLayer, StoryAtlasProjection, StoryMapPoint } from "@habitat/shared";

const layerOptions: Array<{ key: StoryAtlasLayer; label: string }> = [
  { key: "REGION", label: "Biomes" },
  { key: "SETTLEMENT", label: "Cities & towns" },
  { key: "POI", label: "Points of interest" },
  { key: "QUEST", label: "Quests" },
  { key: "SYSTEM", label: "Systems" },
];

const palette = { REGION: "#d2a95b", SETTLEMENT: "#72c7c4", POI: "#e7d5a4", SYSTEM: "#b78cff" } as const;

function mapPoint(point: StoryMapPoint, height: number): [number, number] { return [point[0], height - point[1]]; }

function geometryFor(feature: StoryAtlasFeature, height: number): Geometry {
  if (feature.geometry.type === "POINT") return new Point(mapPoint(feature.geometry.coordinates, height));
  if (feature.geometry.type === "POLYGON") return new Polygon(feature.geometry.coordinates.map((ring) => ring.map((point) => mapPoint(point, height))));
  return new MultiPolygon(feature.geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map((point) => mapPoint(point, height)))));
}

function featureStyle(feature: StoryAtlasFeature, zoom: number, enabled: ReadonlySet<StoryAtlasLayer>, selected: boolean) {
  if (!enabled.has(feature.layer) || zoom < feature.minZoom || (feature.maxZoom !== null && zoom > feature.maxZoom)) return undefined;
  const color = palette[feature.layer];
  const labelVisible = feature.layer !== "POI" || zoom >= Math.max(feature.minZoom, 3.3);
  const label = new Text({ text: labelVisible ? feature.title : "", font: `${selected ? "700" : "600"} 11px Manrope, sans-serif`, fill: new Fill({ color: "#fff8df" }), stroke: new Stroke({ color: "rgba(5,8,7,.96)", width: 4 }), offsetY: feature.geometry.type === "POINT" ? -18 : 0, overflow: true });
  const styles = [new Style({
    fill: new Fill({ color: selected ? `${color}42` : `${color}1d` }),
    stroke: new Stroke({ color: selected ? "#fff1b8" : `${color}c7`, width: selected ? 3 : feature.geometry.type === "POINT" ? 2 : 1.4, lineDash: feature.geometry.type === "POINT" ? undefined : [8, 6] }),
    image: new CircleStyle({ radius: selected ? 9 : feature.layer === "SETTLEMENT" ? 7 : 5, fill: new Fill({ color: selected ? "#fff0b0" : color }), stroke: new Stroke({ color: "#08100e", width: 2 }) }),
    text: label,
  })];
  if (enabled.has("QUEST") && feature.quests.length > 0) styles.push(new Style({ image: new CircleStyle({ radius: selected ? 14 : 11, fill: new Fill({ color: "rgba(0,0,0,0)" }), stroke: new Stroke({ color: "#f0a04b", width: 2, lineDash: [2, 3] }) }) }));
  return styles;
}

export function StoryAtlas({ initialProjection }: { initialProjection: StoryAtlasProjection }) {
  const [projection, setProjection] = useState(initialProjection);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Set<StoryAtlasLayer>>(new Set(["REGION", "SETTLEMENT", "POI", "QUEST", "SYSTEM"]));
  const [query, setQuery] = useState("");
  const targetRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const enabledRef = useRef(enabled);
  const selectedRef = useRef(selectedSlug);
  const viewportRef = useRef<{ center?: number[]; zoom?: number }>({});
  const selected = projection.features.find((feature) => feature.slug === selectedSlug) ?? null;
  const matches = useMemo(() => query.trim().length < 2 ? [] : projection.features.filter((feature) => `${feature.title} ${feature.place?.biome ?? ""} ${feature.quests.map((quest) => quest.title).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8), [projection.features, query]);

  useEffect(() => {
    if (!targetRef.current) return;
    const { coordinateWidth: width, coordinateHeight: height } = projection.scene;
    const extent: [number, number, number, number] = [0, 0, width, height];
    const pixelProjection = new Projection({ code: `martino-atlas-${projection.scene.id}`, units: "pixels", extent });
    const source = new VectorSource();
    for (const item of projection.features) source.addFeature(new Feature({ geometry: geometryFor(item, height), atlas: item, slug: item.slug }));
    const vector = new VectorLayer({ source, declutter: true, style: (olFeature) => {
      const item = olFeature.get("atlas") as StoryAtlasFeature;
      return featureStyle(item, mapRef.current?.getView().getZoom() ?? 0, enabledRef.current, selectedRef.current === item.slug);
    } });
    const view = new View({ projection: pixelProjection, center: viewportRef.current.center ?? mapPoint(projection.scene.initialCenter, height), zoom: viewportRef.current.zoom ?? projection.scene.initialZoom, minZoom: projection.scene.minZoom, maxZoom: projection.scene.maxZoom, extent });
    const map = new OlMap({ target: targetRef.current, layers: [new ImageLayer({ source: new ImageStatic({ url: projection.scene.imageUrl, projection: pixelProjection, imageExtent: extent }) }), vector], view, controls: [] });
    mapRef.current = map;
    layerRef.current = vector;
    if (!viewportRef.current.center) view.fit(extent, { padding: [26, 26, 26, 26], duration: 0 });
    map.on("click", (event) => {
      const hit = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate.get("slug") as string, { hitTolerance: 7 });
      setSelectedSlug(hit ?? null);
    });
    map.on("pointermove", (event) => { if (targetRef.current) targetRef.current.style.cursor = map.hasFeatureAtPixel(event.pixel, { hitTolerance: 5 }) ? "pointer" : "grab"; });
    map.on("moveend", () => { viewportRef.current = { center: view.getCenter(), zoom: view.getZoom() }; vector.changed(); });
    return () => { viewportRef.current = { center: view.getCenter(), zoom: view.getZoom() }; map.setTarget(undefined); mapRef.current = null; layerRef.current = null; };
  }, [projection]);

  useEffect(() => { enabledRef.current = enabled; selectedRef.current = selectedSlug; layerRef.current?.changed(); }, [enabled, selectedSlug]);
  useEffect(() => {
    const stream = new EventSource("/api/codex/stream");
    stream.addEventListener("changed", async () => {
      const response = await fetch(`/api/codex/maps/${projection.scene.slug}`, { cache: "no-store" });
      if (response.ok) setProjection(await response.json() as StoryAtlasProjection);
    });
    return () => stream.close();
  }, [projection.scene.slug]);

  function toggle(layer: StoryAtlasLayer) { setEnabled((current) => { const next = new Set(current); if (next.has(layer)) next.delete(layer); else next.add(layer); return next; }); }
  function focus(feature: StoryAtlasFeature) {
    setSelectedSlug(feature.slug); setQuery("");
    const olFeature = layerRef.current?.getSource()?.getFeatures().find((candidate) => candidate.get("slug") === feature.slug);
    if (!olFeature || !mapRef.current) return;
    const geometry = olFeature.getGeometry(); if (!geometry) return;
    mapRef.current.getView().fit(geometry.getExtent(), { maxZoom: feature.geometry.type === "POINT" ? 4.6 : 2.3, padding: [120, 120, 120, 120], duration: 520 });
  }

  return <section className="atlas-shell" aria-label="Interactive Martino world atlas">
    <header className="atlas-heading">
      <div><p className="eyebrow">The authoritative world surface</p><h1>{projection.scene.title}</h1><p>Codex-backed geography, settlements, POIs, and quest locations over the locked V2 world art.</p></div>
      <div className="atlas-counts"><span><strong>{projection.counts.regions}</strong> biomes</span><span><strong>{projection.counts.settlements}</strong> cities</span><span><strong>{projection.counts.pois}</strong> POIs</span><span><strong>{projection.counts.quests}</strong> quests</span></div>
    </header>
    <div className="atlas-stage">
      <div className="atlas-toolbar">
        <label className="atlas-search"><Search aria-hidden="true" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a region, city, POI, or quest" aria-label="Search the atlas"/></label>
        {matches.length > 0 ? <div className="atlas-search-results">{matches.map((feature) => <button key={feature.slug} onClick={() => focus(feature)}><span>{feature.title}</span><small>{feature.layer.toLowerCase()}{feature.quests.length ? ` · ${feature.quests.length} quest marker${feature.quests.length === 1 ? "" : "s"}` : ""}</small></button>)}</div> : null}
        <div className="atlas-filters" aria-label="Map layers"><span><Layers3 aria-hidden="true" size={14}/> Layers</span>{layerOptions.map((option) => <button className={enabled.has(option.key) ? "active" : ""} aria-pressed={enabled.has(option.key)} key={option.key} onClick={() => toggle(option.key)}>{option.label}</button>)}</div>
      </div>
      <div className="atlas-map" ref={targetRef}/>
      <div className="atlas-map-help"><Crosshair aria-hidden="true" size={13}/> Drag to explore · wheel or pinch to zoom · select highlighted ground or markers</div>
      {selected ? <aside className="atlas-dossier" aria-live="polite">
        <button className="atlas-close" onClick={() => setSelectedSlug(null)} aria-label="Close map details"><X size={18}/></button>
        <p className="eyebrow">{selected.layer === "REGION" ? "Biome dossier" : selected.layer === "SETTLEMENT" ? "Settlement dossier" : "Point of interest"}</p>
        <h2>{selected.title}</h2>
        {selected.summary ? <p className="atlas-summary">{selected.summary}</p> : null}
        {selected.place ? <dl className="atlas-facts">{selected.place.biome ? <><dt>Environment</dt><dd>{selected.place.biome}</dd></> : null}{selected.place.condition ? <><dt>Atlas status</dt><dd>{selected.place.condition}</dd></> : null}{selected.place.control.length ? <><dt>Power</dt><dd>{selected.place.control.map((control) => `${control.title}${control.kind ? ` · ${control.kind}` : ""}`).join(", ")}</dd></> : null}{selected.place.soulForge ? <><dt>Soul Forge</dt><dd>{selected.place.soulForge}</dd></> : null}{selected.place.veilAnchorTier ? <><dt>Veil Anchor</dt><dd>Tier {selected.place.veilAnchorTier}</dd></> : null}</dl> : null}
        {selected.quests.length ? <div className="atlas-quests"><h3><Swords aria-hidden="true" size={15}/> Quest locations</h3>{selected.quests.map((quest) => <Link href={`/codex/arc/${quest.slug}`} key={`${quest.slug}-${quest.nodeKey ?? "pickup"}`}><strong>{quest.title}</strong><span>{quest.nodeKey ? `Step · ${quest.nodeKey}` : "Quest pickup"}</span></Link>)}</div> : null}
        <Link className="atlas-dossier-link" href={`/codex/bible/${selected.slug}`}><BookOpen aria-hidden="true" size={15}/> Open full Codex dossier</Link>
      </aside> : null}
    </div>
  </section>;
}
