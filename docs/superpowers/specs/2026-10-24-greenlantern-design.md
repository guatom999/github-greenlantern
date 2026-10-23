# GitHub Green Lantern — design for review

Status: approved by the user on 2026-10-24; implementation authorized.

## Intended result

An independent repository named `github-greenlantern` that generates a looping
animation from a GitHub user's actual contribution calendar for the last year.
The contribution lights gradually disappear while the Green Lantern symbol in
the supplied reference lights up at the center. The grid has exactly seven rows
throughout, corresponding to Sunday through Saturday. This is an animation of
the data; it never changes the user's GitHub contributions.

The user requested investigation of https://github.com/Platane/snk and supplied
a reference image. The current workspace is empty and is not a Git repository.
The connected GitHub account is `guatom999`; this is a proposed example username,
not a requirement to limit the tool to that account.

## Exact visual target

The full annual calendar remains the canvas, with one column per returned week
(usually 53). Missing days at the edges are padded as inactive positions; weeks
are never stretched into a fixed 52-column grid. Day positions come from their
calendar dates, with Sunday at row zero.

The center symbol occupies five columns and all seven rows. Its bitmap is
transcribed from the reference, with `1` meaning illuminated:

```text
11111
01110
10001
10001
10001
01110
11111
```

Round square cells, dark charcoal background, GitHub green intensity levels at
the start, and bright neon green symbol cells with restrained glow. The symbol
is centered using integer grid coordinates; an even-width calendar may be half
a cell off its geometric center. No extra rows, snake, text, or decorative
objects below or above the grid. Light and dark output palettes are included.

## Proposed animation (builder's defaults)

One loop lasts 16 seconds:

1. 0–2 s: hold the actual contribution calendar.
2. 2–8 s: contribution lights fade in a staggered sweep from the outer columns
   toward the center. Preserve their original intensity until each fade starts.
3. 6–10 s: the 22 symbol cells light up progressively, so the transitions overlap
   and read as energy collecting at the center. No separate flying particles.
4. 10–13 s: hold the completed symbol with a gentle pulse; other cells are dark.
5. 13–16 s: crossfade back to the original calendar for a continuous loop.

The reference bitmap is always the final pattern, even for an empty calendar.
The logo is a visual effect, not a claim about contribution counts. A reduced
motion preference displays the original calendar as a still image.

## Technical approach (builder's choices)

Use Node.js 22 or newer with JavaScript ES modules and the built-in test runner.
Separate data acquisition, calendar normalization, animation timing, and SVG
rendering. Export a small reusable library plus a command-line interface.

Read the calendar from GitHub GraphQL when `GITHUB_TOKEN` is present. A public
contribution-page parser supports token-free generation using the visible color
levels; it must align columns to the first Sunday's date, rather than assuming
the first returned day is Sunday. Handle unknown users, HTTP errors, GraphQL
errors, empty successful responses, and invalid data with actionable messages.
Tokens stay in the process environment and must never enter generated output.

Generate animated SVG files with embedded CSS and no JavaScript, external fonts,
or remote dependencies. SVG is the first release's output format because it can
be embedded in a GitHub profile README. A static final-symbol SVG and an HTML
preview make visual review straightforward. GIF/video export is outside this
initial scope; the data and animation timing remain usable by later renderers.

Provide a deterministic fixture mode for offline demos and tests. Distinguish
fixture examples from real-user output. The main documentation covers local
generation, specifying any username, and embedding the result in a README.

Include a reusable composite GitHub Action and an example scheduled workflow
that regenerates SVGs daily and publishes generated assets to an `output`
branch. The workflow uses the repository owner's username by default, supports
manual invocation, and gives write permission only to the publish job.

## Relationship to Platane/snk

Investigated sources: `README.md`, `packages/github-user-contribution/index.ts`,
`fetchContributionHtml.ts`, `generateSnakeAnimation.ts`, `packages/solver/README.md`,
`packages/svg-creator/index.ts`, `grid.ts`, and `action.yml` on `main`.

Its pipeline is contribution data -> seven-row grid -> snake route solver ->
SVG/GIF renderer -> GitHub Action. This project uses the data-to-grid-to-animation
idea with a new timeline and renderer; a snake path solver is unnecessary.
No root license file was found during inspection. Write original implementation
code and credit the inspiration with source links rather than importing or
copying upstream code.

## Acceptance and verification

- Correctly normalize partial weeks and Sunday boundaries, including leap days.
- Exactly seven rows and a centered 5-by-7, 22-cell logo in every output.
- Timeline starts with the supplied contribution levels, ends its reveal in the
  exact reference bitmap, and returns continuously to the initial calendar.
- SVG is valid XML, self-contained, deterministic for a given input, and safe
  against malformed usernames or metadata being injected into markup.
- Verify the browser preview at initial, transition, final-symbol, and reset
  times. Test the data pipeline with fixtures and meaningful error cases.
- Attempt live generation for the connected account using the public endpoint.
  Report any network/authentication limitation separately from fixture success.
- Initialize the local repository and deliver runnable source, outputs, tests,
  workflow, and documentation. Remote publication depends on working GitHub
  credentials. Initial sandbox checks reported an invalid `gh` login; a check
  outside network isolation subsequently verified the existing credential and
  successful public and GraphQL generation. Never overwrite credentials or
  claim that a remote repository exists without verification.

## Approved scope

The approved defaults are animated SVG for a profile README, a full-year canvas,
the exact bitmap above, and an inward fade without flying particles. These
choices were confirmed by the user with “ยืนยัน ทำตามแบบนี้เลย”.
