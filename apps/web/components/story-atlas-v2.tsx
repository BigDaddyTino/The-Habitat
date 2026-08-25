"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Crosshair, Search, X } from "lucide-react";
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
import LineString from "ol/geom/LineString";
import MultiLineString from "ol/geom/MultiLineString";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import type { Geometry } from "ol/geom";
import type { AtlasV2Projection, AtlasV2RegionProjection, StoryAtlasFeature, StoryMapGeometry, StoryMapPoint } from "@habitat/shared";
import { atlasV2Breadcrumbs, atlasV2Hash, isAtlasV2FeatureVisible, parseAtlasV2Hash } from "@/lib/story-atlas-v2-experience";

function mapPoint(point: StoryMapPoint, height: number): [number, number] { return [point[0], height - point[1]]; }

function geometryFor(geometry: StoryMapGeometry | AtlasV2RegionProjection["geometry"], height: number): Geometry {
  if (geometry.type === "POINT") return new Point(mapPoint(geometry.coordinates, height));
  if (geometry.type === "POLYGON") return new Polygon(geometry.coordinates.map((ring) => ring.map((point) => mapPoint(point, height))));
  return new MultiPolygon(geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map((point) => mapPoint(point, height)))));
}

function connectionGeometry(geometry: AtlasV2Projection["connectionPaths"][number]["geometry"], height: number): Geometry {
  if (geometry.type === "LINESTRING") return new LineString(geometry.coordinates.map((point) => mapPoint(point, height)));
  return new MultiLineString(geometry.coordinates.map((line) => line.map((point) => mapPoint(point, height))));
}

function hashSelection() {
  if (typeof window === "undefined") return null;
  return parseAtlasV2Hash(window.location.hash);
}

function atlasLocation(sceneSlug: string, selectedSlug: string | null) {
  const url = new URL(window.location.href);
  if (sceneSlug === "martino-world") url.searchParams.delete("scene");
  else url.searchParams.set("scene", sceneSlug);
  url.hash = atlasV2Hash(selectedSlug);
  return `${url.pathname}${url.search}${url.hash}`;
}

const invisibleHitStyle = new Style({ fill: new Fill({ color: "rgba(0,0,0,0.001)" }), stroke: new Stroke({ color: "rgba(0,0,0,0)", width: 1 }) });

function pointStyle(feature: StoryAtlasFeature, zoom: number, selected: boolean) {
  if (!isAtlasV2FeatureVisible(feature, zoom)) return undefined;
  const quest = feature.layer === "QUEST";
  const settlement = feature.layer === "SETTLEMENT";
  const color = quest ? "#efa455" : settlement ? "#7ed3cb" : "#e7d5a4";
  return new Style({
    image: new CircleStyle({ radius: selected ? 8 : settlement ? 6 : 4.5, fill: new Fill({ color }), stroke: new Stroke({ color: "#101512", width: 2 }) }),
    text: new Text({ text: zoom >= Math.max(feature.minZoom, settlement ? 1.5 : 2.4) ? feature.title : "", font: `${selected ? 700 : 600} 11px Manrope, sans-serif`, fill: new Fill({ color: "#fff8df" }), stroke: new Stroke({ color: "rgba(5,8,7,.96)", width: 4 }), offsetY: -16, overflow: true }),
  });
}

function replaceProjectionFeatures(input: {
  projection: AtlasV2Projection;
  height: number;
  regionSource: VectorSource;
  labelSource: VectorSource;
  pointSource: VectorSource;
  routeSource: VectorSource;
}) {
  input.regionSource.clear(true);
  input.labelSource.clear(true);
  input.pointSource.clear(true);
  input.routeSource.clear(true);
  const roleOrder = (region: AtlasV2RegionProjection) => region.role === "NESTED_GEOGRAPHY" ? 2 : region.role === "MAJOR_WATER" ? 1 : 0;
  const orderedRegions = [...input.projection.regions].sort((left, right) => roleOrder(left) - roleOrder(right));
  for (const region of orderedRegions) {
    input.regionSource.addFeature(new Feature({ geometry: geometryFor(region.geometry, input.height), region, slug: region.slug }));
    input.labelSource.addFeature(new Feature({ geometry: new Point(mapPoint(region.labelAnchor, input.height)), region, slug: region.slug }));
  }
  for (const point of [...input.projection.points, ...input.projection.questNodes]) {
    input.pointSource.addFeature(new Feature({ geometry: geometryFor(point.geometry, input.height), point, slug: point.slug }));
  }
  for (const path of input.projection.connectionPaths) input.routeSource.addFeature(new Feature({ geometry: connectionGeometry(path.geometry, input.height), path, slug: path.connectionId }));
}

export function StoryAtlasV2({ initialProjection }: { initialProjection: AtlasV2Projection }) {
  const [projection, setProjection] = useState(initialProjection);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => hashSelection());
  const [query, setQuery] = useState("");
  const [loadingScene, setLoadingScene] = useState(false);
  const [routesVisible, setRoutesVisible] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef(projection);
  const mapRef = useRef<OlMap | null>(null);
  const hitLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const labelLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const pointLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routesVisibleRef = useRef(routesVisible);
  const selectedRef = useRef(selectedSlug);
  const hoveredRef = useRef<string | null>(null);
  const selectedRegion = projection.regions.find((region) => region.slug === selectedSlug) ?? null;
  const selectedPoint = [...projection.points, ...projection.questNodes].find((point) => point.slug === selectedSlug) ?? null;
  const selected = selectedRegion ?? selectedPoint;
  const searchable = useMemo(() => [...projection.regions, ...projection.points, ...projection.questNodes], [projection]);
  const matches = useMemo(() => query.trim().length < 2 ? [] : searchable.filter((item) => `${item.title} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8), [query, searchable]);
  const sceneKey = [projection.scene.id, projection.scene.imageUrl, projection.scene.coordinateWidth, projection.scene.coordinateHeight, projection.scene.initialCenter[0], projection.scene.initialCenter[1], projection.scene.initialZoom, projection.scene.minZoom, projection.scene.maxZoom].join(":");

  const select = useCallback((slug: string | null, fit = false, navigation: "PUSH" | "NONE" = "PUSH") => {
    selectedRef.current = slug;
    setSelectedSlug(slug);
    if (typeof window !== "undefined" && navigation === "PUSH") {
      const location = atlasLocation(projectionRef.current.scene.slug, slug);
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== location) window.history.pushState({ atlasV2: true, sceneSlug: projectionRef.current.scene.slug, selectedSlug: slug }, "", location);
    }
    highlightLayerRef.current?.changed(); labelLayerRef.current?.changed(); pointLayerRef.current?.changed();
    if (!fit || !slug || !mapRef.current) return;
    const feature = hitLayerRef.current?.getSource()?.getFeatures().find((candidate) => candidate.get("slug") === slug) ?? pointLayerRef.current?.getSource()?.getFeatures().find((candidate) => candidate.get("slug") === slug);
    const geometry = feature?.getGeometry(); if (!geometry) return;
    mapRef.current.getView().fit(geometry.getExtent(), { maxZoom: 2.8, padding: [84, 84, 84, 84], duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520, easing: (value) => 1 - (1 - value) * (1 - value) });
  }, []);

  const openScene = useCallback(async (slug: string, navigation: "PUSH" | "NONE" = "PUSH", selectedAfter: string | null = null) => {
    if (slug === projectionRef.current.scene.slug || loadingScene) {
      if (slug === projectionRef.current.scene.slug) select(selectedAfter, Boolean(selectedAfter), navigation);
      return;
    }
    setLoadingScene(true);
    try {
      const response = await fetch(`/api/codex/maps/${slug}?atlas=v2`, { cache: "no-store" });
      if (response.ok) {
        const next = await response.json() as AtlasV2Projection;
        selectedRef.current = selectedAfter;
        setSelectedSlug(selectedAfter);
        setQuery("");
        setProjection(next);
        if (navigation === "PUSH") window.history.pushState({ atlasV2: true, sceneSlug: next.scene.slug, selectedSlug: selectedAfter }, "", atlasLocation(next.scene.slug, selectedAfter));
      }
    } finally { setLoadingScene(false); }
  }, [loadingScene, select]);

  useEffect(() => { projectionRef.current = projection; }, [projection]);

  useEffect(() => {
    if (!targetRef.current) return;
    const scene = projectionRef.current.scene;
    const { coordinateWidth: width, coordinateHeight: height } = scene;
    const extent: [number, number, number, number] = [0, 0, width, height];
    const pixelProjection = new Projection({ code: `martino-atlas-v2-${scene.id}`, units: "pixels", extent });
    const regionSource = new VectorSource();
    const isNestedVisible = (region: AtlasV2RegionProjection, zoom: number) => region.role !== "NESTED_GEOGRAPHY" || zoom >= region.minZoom && [region.slug, region.parentSlug].includes(selectedRef.current);
    const hitLayer = new VectorLayer({ source: regionSource, style: (feature) => isNestedVisible(feature.get("region") as AtlasV2RegionProjection, mapRef.current?.getView().getZoom() ?? 0) ? invisibleHitStyle : undefined });
    const highlightLayer = new VectorLayer({ source: regionSource, style: (feature) => {
      const region = feature.get("region") as AtlasV2RegionProjection;
      const zoom = mapRef.current?.getView().getZoom() ?? 0;
      if (!isNestedVisible(region, zoom)) return undefined;
      const selectedNow = selectedRef.current === region.slug;
      const hovered = hoveredRef.current === region.slug;
      if (!selectedNow && !hovered) return undefined;
      return new Style({ fill: new Fill({ color: selectedNow ? "rgba(236,209,145,.08)" : "rgba(255,248,220,.035)" }), stroke: new Stroke({ color: selectedNow ? "rgba(255,234,175,.95)" : "rgba(218,207,182,.78)", width: selectedNow ? 2.4 : 1.5, lineDash: region.role === "NESTED_GEOGRAPHY" ? [7, 5] : undefined }) });
    } });
    const labelSource = new VectorSource();
    const labelLayer = new VectorLayer({ source: labelSource, declutter: true, style: (feature) => {
      const region = feature.get("region") as AtlasV2RegionProjection;
      const zoom = mapRef.current?.getView().getZoom() ?? 0;
      if (!isNestedVisible(region, zoom) || zoom < region.minZoom) return undefined;
      const strong = selectedRef.current === region.slug || hoveredRef.current === region.slug;
      return new Style({ text: new Text({ text: region.title, font: `${strong ? 700 : 600} ${region.role === "TOP_LEVEL_LAND" ? 13 : 11}px Manrope, sans-serif`, fill: new Fill({ color: strong ? "#fff3c9" : "rgba(249,240,211,.88)" }), stroke: new Stroke({ color: "rgba(15,18,15,.88)", width: 3 }), overflow: true }) });
    } });
    const pointSource = new VectorSource();
    const pointLayer = new VectorLayer({ source: pointSource, declutter: true, style: (feature) => pointStyle(feature.get("point") as StoryAtlasFeature, mapRef.current?.getView().getZoom() ?? 0, selectedRef.current === feature.get("slug")) });
    const routeSource = new VectorSource();
    const routeLayer = new VectorLayer({ source: routeSource, visible: false, style: (feature) => { const path = feature.get("path") as AtlasV2Projection["connectionPaths"][number]; const zoom = mapRef.current?.getView().getZoom() ?? 0; const contextRoute = selectedRef.current !== null && [path.fromSlug, path.toSlug].includes(selectedRef.current); if ((!routesVisibleRef.current && !contextRoute) || zoom < path.minZoom || (path.maxZoom !== null && zoom > path.maxZoom)) return undefined; return new Style({ stroke: new Stroke({ color: path.type === "RIVER_TRAVEL" ? "rgba(111,190,202,.78)" : path.type === "SEA_ROUTE" ? "rgba(111,162,202,.72)" : path.type === "AIR_ROUTE" ? "rgba(205,178,226,.72)" : "rgba(224,194,126,.72)", width: contextRoute ? 2.7 : 1.7, lineDash: path.type === "ROAD" ? undefined : path.type === "AIR_ROUTE" ? [2, 7] : path.type === "TRAIL" ? [3, 5] : [8, 5] }) }); } });
    const view = new View({ projection: pixelProjection, center: mapPoint(scene.initialCenter, height), zoom: scene.initialZoom, minZoom: scene.minZoom, maxZoom: scene.maxZoom, extent, showFullExtent: true });
    const baseLayer = new ImageLayer({ source: new ImageStatic({ url: scene.imageUrl, projection: pixelProjection, imageExtent: extent }) });
    const map = new OlMap({ target: targetRef.current, layers: [baseLayer, hitLayer, highlightLayer, routeLayer, pointLayer, labelLayer], view, controls: [] });
    mapRef.current = map; hitLayerRef.current = hitLayer; highlightLayerRef.current = highlightLayer; labelLayerRef.current = labelLayer; pointLayerRef.current = pointLayer; routeLayerRef.current = routeLayer;
    const frame = window.requestAnimationFrame(() => { map.updateSize(); const target = targetRef.current; if (target) view.fit(extent, { padding: [26, 26, 26, 26] }); });
    map.on("pointermove", (event) => {
      const hit = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate.get("slug") as string, { hitTolerance: 4, layerFilter: (layer) => layer === hitLayer });
      if (hit !== hoveredRef.current) { hoveredRef.current = hit ?? null; highlightLayer.changed(); labelLayer.changed(); }
      if (targetRef.current) targetRef.current.style.cursor = hit ? "pointer" : "grab";
    });
    map.on("click", (event) => {
      const regionHit = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate.get("slug") as string, { hitTolerance: 7, layerFilter: (layer) => layer === hitLayer });
      const pointHit = regionHit ? null : map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate.get("slug") as string, { hitTolerance: 8, layerFilter: (layer) => layer === pointLayer });
      select(regionHit ?? pointHit ?? null, Boolean(regionHit ?? pointHit));
    });
    map.on("moveend", () => { hitLayer.changed(); highlightLayer.changed(); labelLayer.changed(); pointLayer.changed(); });
    return () => { window.cancelAnimationFrame(frame); map.setTarget(undefined); mapRef.current = null; hitLayerRef.current = null; highlightLayerRef.current = null; labelLayerRef.current = null; pointLayerRef.current = null; routeLayerRef.current = null; };
  }, [sceneKey, select]);

  useEffect(() => {
    const regionSource = hitLayerRef.current?.getSource();
    const labelSource = labelLayerRef.current?.getSource();
    const pointSource = pointLayerRef.current?.getSource();
    const routeSource = routeLayerRef.current?.getSource();
    if (!regionSource || !labelSource || !pointSource || !routeSource) return;
    replaceProjectionFeatures({ projection, height: projection.scene.coordinateHeight, regionSource, labelSource, pointSource, routeSource });
    hitLayerRef.current?.changed();
    highlightLayerRef.current?.changed();
    labelLayerRef.current?.changed();
    pointLayerRef.current?.changed();
    routeLayerRef.current?.changed();
    if (selectedRef.current) window.requestAnimationFrame(() => {
      const slug = selectedRef.current;
      const feature = hitLayerRef.current?.getSource()?.getFeatures().find((candidate) => candidate.get("slug") === slug) ?? pointLayerRef.current?.getSource()?.getFeatures().find((candidate) => candidate.get("slug") === slug);
      const geometry = feature?.getGeometry();
      if (geometry) mapRef.current?.getView().fit(geometry.getExtent(), { maxZoom: 2.8, padding: [84, 84, 84, 84] });
    });
  }, [projection]);

  useEffect(() => { selectedRef.current = selectedSlug; highlightLayerRef.current?.changed(); labelLayerRef.current?.changed(); pointLayerRef.current?.changed(); const contextual = projection.connectionPaths.some((path) => selectedSlug !== null && [path.fromSlug, path.toSlug].includes(selectedSlug)); routeLayerRef.current?.setVisible(routesVisibleRef.current || contextual); routeLayerRef.current?.changed(); }, [projection.connectionPaths, selectedSlug]);
  useEffect(() => { routesVisibleRef.current = routesVisible; const contextual = projection.connectionPaths.some((path) => selectedRef.current !== null && [path.fromSlug, path.toSlug].includes(selectedRef.current)); routeLayerRef.current?.setVisible(routesVisible || contextual); routeLayerRef.current?.changed(); }, [projection.connectionPaths, routesVisible]);
  useEffect(() => { const onPopState = () => { const url = new URL(window.location.href); const sceneSlug = url.searchParams.get("scene") ?? "martino-world"; void openScene(sceneSlug, "NONE", hashSelection()); }; window.addEventListener("popstate", onPopState); return () => window.removeEventListener("popstate", onPopState); }, [openScene]);
  useEffect(() => {
    const stream = new EventSource("/api/codex/stream");
    stream.addEventListener("changed", async () => { const response = await fetch(`/api/codex/maps/${projection.scene.slug}?atlas=v2`, { cache: "no-store" }); if (response.ok) setProjection(await response.json() as AtlasV2Projection); });
    return () => stream.close();
  }, [projection.scene.slug]);

  const focus = (item: AtlasV2RegionProjection | StoryAtlasFeature) => { setQuery(""); select(item.slug, true); };
  const breadcrumbs = atlasV2Breadcrumbs(projection.regions, selectedRegion?.slug ?? null);
  const resetWorld = () => { if (projection.scene.slug !== "martino-world") { void openScene("martino-world"); return; } select(null); const scene = projection.scene; mapRef.current?.getView().fit([0, 0, scene.coordinateWidth, scene.coordinateHeight], { padding: [26, 26, 26, 26], duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420 }); };
  return <section className="atlas-shell atlas-v2-shell" aria-label="Internal Atlas V2 projection">
    <header className="atlas-heading"><div><p className="eyebrow">Internal Atlas V2 · deterministic topology</p><h1>{projection.scene.title}</h1><p>Frozen artwork, invisible geographic hit areas, dynamic Codex labels, and exact shared selection boundaries.</p></div><div className="atlas-counts"><span><strong>{projection.counts.topLevelRegions}</strong> regions</span><span><strong>{projection.counts.nestedRegions}</strong> nested</span><span><strong>{projection.counts.points}</strong> anchors</span></div></header>
    <div className="atlas-stage">
      <div className="atlas-toolbar">
        <nav className="atlas-breadcrumb" aria-label="Atlas location"><button onClick={resetWorld}>World</button>{projection.scene.parentMap ? <span>› {projection.scene.title}</span> : null}{breadcrumbs.map((item) => <button key={item.slug} onClick={() => focus(item)}>› {item.title}</button>)}</nav>
        {projection.connectionPaths.length ? <div className="atlas-filters"><button className={routesVisible ? "active" : ""} aria-pressed={routesVisible} onClick={() => setRoutesVisible((visible) => !visible)}>Authored routes</button></div> : null}
        <label className="atlas-search"><Search aria-hidden="true" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && matches[0]) focus(matches[0]); }} placeholder="Find a region, anchor, or quest" aria-label="Search Atlas V2"/></label>
        {matches.length ? <div className="atlas-search-results">{matches.map((item) => <button key={item.slug} onClick={() => focus(item)}><span>{item.title}</span><small>{"role" in item ? item.role.toLowerCase().replaceAll("_", " ") : item.layer.toLowerCase()}</small></button>)}</div> : null}
      </div>
      <div className="atlas-map" ref={targetRef}/><div className="atlas-map-help"><Crosshair aria-hidden="true" size={13}/> Hover to reveal boundaries · tap/click to select and fit</div>
      {selected ? <aside className="atlas-dossier" aria-live="polite"><button className="atlas-close" onClick={() => select(null)} aria-label="Close map details"><X size={18}/></button><p className="eyebrow">{"role" in selected ? selected.role.toLowerCase().replaceAll("_", " ") : selected.layer.toLowerCase()}</p><h2>{selected.title}</h2>{selected.summary ? <p className="atlas-summary">{selected.summary}</p> : null}{"neighbors" in selected ? <dl className="atlas-facts"><dt>Neighbors</dt><dd>{selected.neighbors.join(", ") || "None"}</dd><dt>Parent</dt><dd>{selected.parentSlug ?? "World"}</dd>{selected.childSlugs.length ? <><dt>Nested</dt><dd>{selected.childSlugs.join(", ")}</dd></> : null}</dl> : null}{"childMap" in selected && selected.childMap ? <button className="atlas-drilldown" disabled={loadingScene} onClick={() => void openScene(selected.childMap!.slug)}><Crosshair aria-hidden="true" size={15}/> Open high-detail map</button> : null}<Link className="atlas-dossier-link" href={"source" in selected && selected.source === "NODE" ? `/codex/arc/${selected.quests[0]?.slug ?? ""}` : `/codex/bible/${selected.slug}`}><BookOpen aria-hidden="true" size={15}/> Open full Codex dossier</Link></aside> : null}
    </div>
  </section>;
}
