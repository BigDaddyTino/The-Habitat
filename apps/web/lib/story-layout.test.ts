import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const codexCss = readFileSync(join(process.cwd(), "app/codex.css"), "utf8");
const workspaceCss = readFileSync(join(process.cwd(), "app/codex-workspace.css"), "utf8");

test("every Story Codex scrollbar inherits the brass theme", () => {
  assert.match(codexCss, /html:has\(\.codex-shell\).*scrollbar-color:/, "the document scrollbar must be themed on Story pages");
  assert.match(codexCss, /html:has\(\.codex-board-shell\)/, "the full-height arc board must not miss the document theme");
  assert.match(codexCss, /:is\(\.codex-shell, \.codex-board-shell\) \*.*scrollbar-color:/, "nested board panes and editors must inherit the same theme");
  assert.match(codexCss, /:is\(\.codex-shell, \.codex-board-shell\) \*::-webkit-scrollbar-thumb/, "Chromium needs the dark-gold thumb, not its default white one");
  assert.match(codexCss, /scrollbar-gutter: stable/, "scrolling panes should not shift when their rail appears");
});

test("the canon navigator gives titles room instead of silently cutting them off", () => {
  assert.match(codexCss, /\.canon-workspace \{[^}]*grid-template-columns: 286px minmax\(0, 1fr\)/);
  const titleRule = codexCss.match(/\.canon-nav-arc > span \{([^}]*)\}/)?.[1] ?? "";
  assert.match(titleRule, /overflow-wrap: anywhere/);
  assert.doesNotMatch(titleRule, /text-overflow|white-space:\s*nowrap/);
});

test("the region atlas reads as a responsive hierarchy rather than three squeezed columns", () => {
  assert.match(workspaceCss, /\.region-atlas\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(workspaceCss, /\.region-atlas-card\{[^}]*grid-template-columns:minmax\(320px,\.78fr\) minmax\(0,1\.22fr\)/);
  assert.match(workspaceCss, /\.region-atlas-places>ul\{[^}]*repeat\(auto-fit,minmax\(min\(100%,260px\),1fr\)\)/);
  assert.match(workspaceCss, /@media\(max-width:1050px\)\{\.region-atlas-card\{grid-template-columns:minmax\(0,1fr\)\}/);
});
