# GitHub Green Lantern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Generate a seven-row contribution animation that fades inward into the supplied Green Lantern symbol.

**Architecture:** Original dependency-free ES modules acquire GitHub data, normalize dates, evaluate a shared timeline, and render SVG. A CLI emits light/dark animated assets, a still logo, and a local preview; a composite Action and scheduled workflow publish assets.

**Tech Stack:** Node.js >=22, JavaScript ES modules, node:test, SVG/CSS, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-24-greenlantern-design.md` (approved).

## Global Constraints

- Exactly seven grid rows; Sunday is row zero; retain every returned week.
- Center bitmap: 11111 / 01110 / 10001 / 10001 / 10001 / 01110 / 11111.
- Sixteen-second loop: calendar 0–2, inward fade 2–8, logo reveal 6–10, pulse 10–13, restore 13–16.
- Node.js 22 or newer; no production dependencies or browser-side token storage.
- Original implementation, credit snk; animated SVG first release, no GIF/video.
- Light and dark palettes, offline fixture, reduced-motion still calendar.

## Review Focus

- HTML attribute ordering and partial weeks: parse attributes independently, align dates to Sunday (Task 1 tests).
- API failures and malformed responses: fail clearly without leaking a token (Task 1 tests).
- All-zero contributions: reveal the complete 22-cell logo regardless (Task 2 tests).
- Loop boundary and overlap: preserve all original levels at t=0/16 and only logo cells at t=10 (Task 2 tests).
- Untrusted strings and workflow paths: escape SVG/HTML and pass Action inputs via environment variables (Task 3 tests/review).

## File map

- `src/calendar.js`: strict date and cell normalization into `{width,height:7,cells,from,to}`.
- `src/github.js`: public HTML parsing and injectable-fetch GraphQL/public data client.
- `src/animation.js`: logo coordinates, source fade timing, symbol timing, `sampleFrame`.
- `src/svg.js`: escaped, self-contained animated/static SVG rendering.
- `src/preview.js`: local HTML preview with paused/scrubbable inline SVGs.
- `src/index.js`: public exports; `bin/greenlantern.js`: CLI and safe file output.
- `fixtures/demo.json`: deterministic 365-day synthetic example, explicitly labeled.
- `test/*.test.js`: meaningful data, animation, SVG, and CLI verification.
- `action.yml`, `.github/workflows/{ci,generate}.yml`: reusable generation, validation, publication.
- `README.md`, `docs/how-it-works.md`, `LICENSE`, `.gitignore`, `package.json`: usage and project metadata.

### Task 1: Calendar and GitHub data

**Interfaces:** `normalizeDays(days)` returns the grid above. Days have `{date,level,count?}`. `parseContributionHtml(html)` returns days. `fetchContributions(username,{token,fetchImpl,timeoutMs})` returns `{days,source}`.

- [x] Write `test/calendar.test.js` and `test/github.test.js`: Saturday/Sunday column change, leap day, duplicate/invalid dates, levels outside 0–4, HTML attribute reordering, no cells, 404/429, GraphQL error/null-user, aborted requests, and no token leakage.
- [x] Run `node --test test/calendar.test.js test/github.test.js`; expect module-not-found failure.
- [x] Implement the three interfaces, username validation, bounded fetch timeout, strict API shape checking, and actionable errors without raw response/token output.
- [x] Run the same tests; expect all passing.
- [x] Commit data acquisition and normalization.

### Task 2: Timeline and SVG renderer

**Interfaces:** `logoCells(width)` returns 22 `{x,y}` positions. `sourceOpacity(cell,width,time)`, `logoOpacity(index,time)`, and `sampleFrame(grid,time)` share timing with the renderer. `renderSvg(grid,{username,theme,mode})` supports `animated`, `logo`, and `calendar`.

- [x] Write `test/animation.test.js`, `test/svg.test.js`: exact 5×7 mask, all-zero grid, initial/final/reset frames, outside-in timing, finite opacity, exactly width×7 base cells, deterministic SVG, escaping, no scripts/remote dependencies, reduced-motion behavior, both palettes.
- [x] Run `node --test test/animation.test.js test/svg.test.js`; expect failure before implementation.
- [x] Implement deterministic timing functions and SVG layers: inactive grid, original contribution overlay, center symbol overlay. Generate CSS keyframes from the same timing helpers. Keep the SVG viewBox to seven rows plus small pixel padding.
- [x] Run all tests; expect passing.
- [x] Commit timeline and SVG renderer.

### Task 3: CLI, preview, workflow, and delivery

**Interfaces:** `node bin/greenlantern.js --user NAME [--fixture FILE] [--output DIR]` emits `greenlantern.svg`, `greenlantern-dark.svg`, `greenlantern-logo.svg`, `preview.html`, and safe provenance JSON. `--help` documents token and fixture behavior.

- [x] Write CLI integration tests for fixture generation, real-file outputs, invalid arguments/unsafe metadata, missing input, and no accidental live fetch in fixture mode. Run and confirm failure.
- [x] Implement CLI and preview controls for playback, 0–16 s scrubbing, theme, and logo close-up. Include an explicit synthetic-data label where applicable.
- [x] Create deterministic fixture and generate committed example assets. Add reusable composite Action using env-passed inputs, Node 22, and no installation requirement.
- [x] Add CI tests and two-job daily generation/publication workflow; only publish gets contents:write. Publish via an isolated temporary Git repository, touching only the output branch.
- [x] Write README in Thai with runnable commands, profile image embed, workflow setup, real versus fixture data, GraphQL/public behavior, and attribution; document architecture in `docs/how-it-works.md`.
- [x] Run `npm test`, fixture CLI, malformed-input CLI, and XML parsing. Verify preview in browser at 0, 5, 10, 14, 16 s and reduced motion.
- [x] Attempt live generation for `guatom999`; if sandbox network is the cause, use a narrowly scoped approved network command. Verify available authentication before remote publication.
- [x] Request independent final code review; fix actionable findings and rerun affected checks.
- [x] Initialize/commit local repository; if GitHub authentication works, create and push `guatom999/github-greenlantern`, verify remote assets/workflow. Otherwise deliver local repo and precise remaining authentication requirement.

## Self-review

Spec coverage maps to Tasks 1–3. All interfaces use normalized day records and the same grid shape. The five review-focus cases have owning tests. Native execution in the current workspace is appropriate: the directory is a new dedicated project and tasks share interfaces; one final independent review checks the completed implementation.
