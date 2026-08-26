import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BloomfallSystemPanel } from "../components/bloomfall-system-panel";
import { StoryProse } from "../components/story-prose";
import { bloomfallIntegrationRecords } from "../lib/bloomfall-codex-integration";

/**
 * Builds the standalone desktop/mobile QA harness for the Bloomfall systems
 * package.
 *
 * The dossier itself lives behind the Codex sign-in, so the harness renders
 * the real components with the real compiled stylesheet from the last
 * production build and measures itself in the browser. What it proves is
 * layout: whether anything overflows the viewport, whether the wide tables and
 * the diagram scroll inside their own boxes, and whether the touch targets
 * survive at 390 x 844.
 */

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(repositoryRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(repositoryRoot, ".env.local"), override: true, quiet: true });
if (process.env.HABITAT_ENVIRONMENT !== "development") throw new Error("The Bloomfall systems QA harness is development-only.");

// The app compiles JSX through Next with the automatic runtime; this harness
// renders the same components under the classic one, so React has to be in
// scope for the modules it pulls in.
Object.assign(globalThis, { React });

const webRoot = process.cwd();
const outputDirectory = path.join(webRoot, "private", "codex-art", "bloomfall-systems", "review");
const evidenceDirectory = path.join(webRoot, "private", "codex-art", "bloomfall-systems", "evidence");

function compiledStylesheet() {
  const chunks = path.join(webRoot, ".next", "static", "chunks");
  const candidates = readdirSync(chunks).filter((file) => file.endsWith(".css"));
  const match = candidates
    .map((file) => ({ file, css: readFileSync(path.join(chunks, file), "utf8") }))
    .find((entry) => entry.css.includes(".bloomfall-card-grid"));
  if (!match) throw new Error("No compiled stylesheet carries the Bloomfall rules; run the production build first.");
  return match;
}

const resolve = (slug: string) => ({ title: slug.replaceAll("-", " "), href: `#${slug}` });

function harness() {
  const { css } = compiledStylesheet();
  const sections = ["bloomfall-reach", ...bloomfallIntegrationRecords.map((record) => record.slug)].map((slug) => {
    const record = bloomfallIntegrationRecords.find((entry) => entry.slug === slug);
    const prose = record ? renderToStaticMarkup(<StoryProse body={record.body} resolve={resolve} />) : "";
    const panel = renderToStaticMarkup(<BloomfallSystemPanel entrySlug={slug} />);
    return `<section id="${slug}" class="qa-section">
      <h1>${record?.title ?? "Bloomfall Reach"}</h1>
      ${record ? `<div class="entity-profile-layout"><article class="entity-profile-narrative">${prose}</article><aside class="entity-connections"><section><p class="eyebrow">World connections</p></section></aside></div>` : ""}
      ${panel}
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bloomfall systems QA harness</title>
<style>${css}</style>
<style>
  :root{--font-serif:Georgia,"Times New Roman",serif;--font-sans:system-ui,-apple-system,"Segoe UI",sans-serif;--font-mono:"Cascadia Mono",Consolas,monospace}
  html,body{margin:0;background:#0b0f0c;color:#c8cfc6;font-family:var(--font-sans)}
  .qa-shell{max-width:1220px;margin:0 auto;padding:20px}
  .qa-section{margin-bottom:48px}
  .qa-section>h1{color:#f0e2bd;font:600 30px/1.05 var(--font-serif)}
  #qa-report{white-space:pre-wrap;border:1px solid #4a5548;padding:14px;background:#111612;color:#cfe0c6;font:11px/1.5 var(--font-mono)}
</style>
</head><body><div class="qa-shell">
<pre id="qa-report">measuring…</pre>
${sections}
</div>
<script>
(function(){
  // ?only=<slug> isolates one section so a capture frames it from the top;
  // headless screenshots ignore a fragment scroll.
  var only = new URLSearchParams(location.search).get("only");
  if (only) {
    var all = document.querySelectorAll(".qa-section");
    for (var k = 0; k < all.length; k++) if (all[k].id !== only) all[k].style.display = "none";
  }
  function run(){
    var root = document.documentElement;
    var overflowing = [];
    var tiny = [];
    var els = document.querySelectorAll(".bloomfall-system-panel *");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var box = el.getBoundingClientRect();
      if (box.width > 0 && box.right > root.clientWidth + 1) {
        var parent = el.closest(".bloomfall-index-scroll, .bloomfall-diagram-canvas");
        if (!parent) overflowing.push((el.tagName + "." + (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className)).slice(0, 70));
      }
      if (el.tagName === "A" && box.height > 0 && box.height < 24) tiny.push((el.textContent || "").trim().slice(0, 40));
    }
    var scrollers = document.querySelectorAll(".bloomfall-index-scroll, .bloomfall-diagram-canvas");
    var contained = 0;
    for (var s = 0; s < scrollers.length; s++) if (scrollers[s].getBoundingClientRect().right <= root.clientWidth + 1) contained++;
    var images = document.querySelectorAll(".bloomfall-system-panel img");
    var missingAlt = 0;
    for (var m = 0; m < images.length; m++) if (!images[m].getAttribute("alt")) missingAlt++;
    var report = {
      viewport: window.innerWidth + " x " + window.innerHeight,
      documentClientWidth: root.clientWidth,
      documentScrollWidth: root.scrollWidth,
      horizontalOverflow: root.scrollWidth - root.clientWidth,
      panels: document.querySelectorAll(".bloomfall-system-panel").length,
      cards: document.querySelectorAll(".bloomfall-card").length,
      tables: document.querySelectorAll(".bloomfall-index").length,
      scrollContainers: scrollers.length,
      scrollContainersContained: contained,
      diagrams: document.querySelectorAll(".bloomfall-diagram svg").length,
      proseHeadings: document.querySelectorAll(".entity-profile-narrative .prose-heading").length,
      images: images.length,
      imagesMissingAlt: missingAlt,
      elementsOverflowingViewport: overflowing.length,
      overflowingSample: overflowing.slice(0, 5),
      linksUnder24px: tiny.length,
      tinyLinkSample: tiny.slice(0, 5)
    };
    document.getElementById("qa-report").textContent = "QA_REPORT " + JSON.stringify(report);
  }
  if (document.readyState === "complete") run(); else window.addEventListener("load", run);
})();
</script>
</body></html>`;
}

/**
 * Headless Chrome clamps its window to a minimum width well above a phone, so
 * the mobile pass runs the same harness inside an exactly 390 x 844 frame and
 * reads the measurement the harness took of its own viewport.
 */
function mobileFrame() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Bloomfall systems QA — 390 x 844</title>
<style>html,body{margin:0;background:#070a08}#frame{display:block;width:390px;height:844px;border:0}#qa-report{white-space:pre-wrap;color:#cfe0c6;font:11px/1.5 monospace}</style>
</head><body>
<pre id="qa-report">measuring…</pre>
<iframe id="frame" src="index.html" title="Bloomfall systems harness at 390 by 844"></iframe>
<script>
  window.addEventListener("load", function () {
    setTimeout(function () {
      var frame = document.getElementById("frame");
      var inner = frame.contentDocument && frame.contentDocument.getElementById("qa-report");
      document.getElementById("qa-report").textContent = inner ? inner.textContent : "QA_REPORT {\\"error\\":\\"frame unreadable\\"}";
    }, 600);
  });
</script>
</body></html>`;
}

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findBrowser() {
  return chromeCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

function fileUrl(target: string) {
  return `file:///${target.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
}

/** Drives the harness in headless Chromium and returns what it measured. */
function measure(browser: string, url: string, width: number, height: number, extra: string[] = []) {
  const dom = execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--window-size=${width},${height}`, "--virtual-time-budget=12000", "--dump-dom", ...extra, url,
  ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  const report = /QA_REPORT (\{[^<]*\})/.exec(dom);
  if (!report) throw new Error(`The harness did not report a measurement for ${url}.`);
  return JSON.parse(report[1]!) as Record<string, unknown>;
}

function capture(browser: string, url: string, width: number, height: number, target: string, extra: string[] = []) {
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--window-size=${width},${height}`, "--virtual-time-budget=12000", `--screenshot=${target}`, ...extra, url,
  ], { stdio: "ignore" });
}

mkdirSync(outputDirectory, { recursive: true });
const file = path.join(outputDirectory, "index.html");
const mobile = path.join(outputDirectory, "mobile-390x844.html");
writeFileSync(file, harness(), "utf8");
writeFileSync(mobile, mobileFrame(), "utf8");
process.stdout.write(`${file}\n${mobile}\n`);

if (process.argv.includes("--capture")) {
  const browser = findBrowser();
  if (!browser) throw new Error(`No headless Chromium found. Looked in: ${chromeCandidates.join(", ")}`);
  mkdirSync(evidenceDirectory, { recursive: true });
  const desktop = measure(browser, fileUrl(file), 1500, 900);
  const phone = measure(browser, fileUrl(mobile), 900, 1000, ["--allow-file-access-from-files"]);
  capture(browser, `${fileUrl(file)}?only=bloomfall-reach`, 1500, 900, path.join(evidenceDirectory, "desktop-1500x900-network.png"));
  capture(browser, `${fileUrl(file)}?only=bloomfall-travel`, 1500, 3000, path.join(evidenceDirectory, "desktop-1500x900-travel.png"));
  capture(browser, fileUrl(mobile), 440, 900, path.join(evidenceDirectory, "mobile-390x844.png"), ["--allow-file-access-from-files"]);
  const evidence = {
    contract: "martino-bloomfall-systems-qa",
    contractVersion: 1,
    browser: path.basename(browser),
    stylesheet: compiledStylesheet().file,
    desktop,
    mobile: phone,
    status: desktop.horizontalOverflow === 0 && phone.horizontalOverflow === 0
      && desktop.elementsOverflowingViewport === 0 && phone.elementsOverflowingViewport === 0
      && desktop.linksUnder24px === 0 && phone.linksUnder24px === 0
      && desktop.imagesMissingAlt === 0 && phone.imagesMissingAlt === 0
      && phone.documentClientWidth === 390 && phone.documentScrollWidth === 390
      && desktop.scrollContainers === desktop.scrollContainersContained
      && phone.scrollContainers === phone.scrollContainersContained
      ? "PASS" : "FAIL",
  };
  writeFileSync(path.join(evidenceDirectory, "qa-measurements.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (evidence.status !== "PASS") process.exitCode = 1;
}
