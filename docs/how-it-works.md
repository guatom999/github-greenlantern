# How it works / แกะแนวคิดจาก snk

## What was investigated

Reviewed [Platane/snk](https://github.com/Platane/snk) on 2026-10-24:

- [`packages/github-user-contribution/index.ts`](https://github.com/Platane/snk/blob/main/packages/github-user-contribution/index.ts) reads GraphQL contribution days with dates, weekday, counts and levels.
- [`fetchContributionHtml.ts`](https://github.com/Platane/snk/blob/main/packages/github-user-contribution/fetchContributionHtml.ts) demonstrates a public-page data source without a token.
- [`generateSnakeAnimation.ts`](https://github.com/Platane/snk/blob/main/packages/generate-snake-animation/generateSnakeAnimation.ts) joins acquisition, grid conversion, route solving and output rendering.
- [`packages/solver/README.md`](https://github.com/Platane/snk/blob/main/packages/solver/README.md) explains how the snake clears contribution colors using traversable routes.
- [`packages/svg-creator`](https://github.com/Platane/snk/tree/main/packages/svg-creator) generates SVG rectangles and CSS timelines from the snake's route.
- [`action.yml`](https://github.com/Platane/snk/blob/main/action.yml) exposes generation as a GitHub Action.

The useful abstraction is **data → grid → timeline → image**. Green Lantern needs an inward fade, so it does not need a snake, collision rules, route optimization or an extra row of eaten cells. No root license file was present in the inspected upstream tree; this repository contains original code and credits the inspiration.

## Pipeline in this repository

```mermaid
flowchart LR
  A[GitHub username] --> B[GraphQL with token / public HTML]
  B --> C[Normalize dates into 7 rows]
  C --> D[Inward fade + 5 by 7 symbol]
  D --> E[Self-contained animated SVG]
  E --> F[README / local preview]
```

`src/github.js` reads and validates days. GraphQL supplies counts and levels; public HTML supplies levels only. HTTP errors, missing users, malformed responses and request timeouts fail clearly without echoing response bodies or credentials. No fallback silently changes a token failure into a successful public-only result.

`src/calendar.js` sorts dates, finds the Sunday before the first date, and computes each position from elapsed UTC days. This avoids shifting columns when the first week starts on a Wednesday or Saturday. Missing source positions are inactive. Leap days work like every other UTC day. Dates, duplicate dates, intensities and counts are validated.

`src/animation.js` defines time/opacity points for the contribution and logo layers. The source cells fade from the outer columns toward the middle. The 22 symbol cells are revealed in row order from 6–10 seconds. `sampleFrame(grid, seconds)` exposes the same timeline for any future raster renderer.

`src/svg.js` draws inactive cells, contribution overlays and symbol overlays. CSS keyframes interpolate the opacity points; it contains no JavaScript or external dependencies. Light/dark palettes are separate SVGs. `prefers-reduced-motion` hides the logo layer and retains original contributions.

`bin/greenlantern.js` reads options, loads contribution days, builds output files,
then writes them to disk. Provenance lives in `calendar.json`; fixture mode never
accesses the network.

The preview source is split by responsibility:

- `src/preview.js` builds the HTML and inserts escaped metadata.
- `src/preview/styles.css` defines the layout and visual styling.
- `src/preview/player.js` handles playback, scrubbing, phases and theme selection.

CSS and player code are embedded into the generated `preview.html`, so the
result remains a single portable file. Tokens never appear in the preview.

## Grid and symbol

Row zero is Sunday. The number of columns follows the source range, including partial weeks. The symbol uses this exact mask, centered using `floor((width - 5) / 2)`:

```text
11111
01110
10001
10001
10001
01110
11111
```

The logo can light even if there are no contributions. It is a visual effect, not a statistical representation of contributions. Source levels are retained unchanged in the initial and restored frames.

## Reproducibility and publishing

Generated files depend on normalized data, username and palette; there is no random seed or generation timestamp in SVG output. Committed `examples/` are explicitly synthetic and can be regenerated with `npm run demo`.

The scheduled workflow generates artifacts with read permission. A separate publish job receives `contents: write`, downloads only those artifacts and updates the `output` branch using a temporary Git repository and the GitHub CLI credential helper. It does not rewrite the source branch or force-push history. Official third-party Actions are pinned to verified release commits.
