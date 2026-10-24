# Verification record — 2026-10-24 (Asia/Bangkok)

## Results

- `npm test`: 21 tests passed, zero failures, on local Node.js 22.11.0.
- [Hosted CI](https://github.com/guatom999/github-greenlantern/actions/runs/39995104269): passed on Ubuntu and Windows, Node.js 22 and 24.
- [Generation and publication](https://github.com/guatom999/github-greenlantern/actions/runs/39995166812): both jobs passed; real GraphQL contribution data published to `output`.
- Local live generation succeeded using both the public contribution page and authenticated GraphQL for `guatom999`.
- All three synthetic example SVGs parsed as XML, with exactly seven rows and 53 columns.
- An independent code reviewer ran the suite and reviewed the complete implementation; no Critical, Important or Minor issues were found.

## Browser inspection using real public data

| Time | Observed result |
| --- | --- |
| 0 s | Original contribution intensities; 96 active cells; no logo |
| 5 s | Outer columns darkened; 58 contribution cells still visible |
| 10 s | Complete centered 22-cell reference symbol, all seven rows |
| 14 s | Original contributions returning at opacity 0.333333; logo at 0.666667 |
| 16 s | Original contributions at opacity 1; logo at 0; loop matches start |

Dark and light palettes were visually checked. The local viewer supports play,
pause and scrubbing. Reduced-motion rules are covered by renderer verification;
the inspection browser used its normal motion preference.

## Implementation decisions

- Work took place directly in the requested new project folder. It contained no
  previous Git checkout or user code, so a second worktree was unnecessary.
- SVG is the delivered animation format, as approved; GIF/video export remains
  outside this release.
- Earlier `gh` login errors resulted from network sandbox isolation. The
  existing credential worked when the network request was authorized; no
  credential changes were required.

The independent reviewer left hosted publication for the executor to verify.
The successful workflow run linked above closes that remaining check.

## TypeScript migration and project flow — 2026-10-24

The user requested two subagents: one to migrate the source and review
readability, and one to draw the execution flow. Their work was integrated in the
same checkout with separate source/config and diagram/documentation ownership.

- All authored modules, browser player, build script and tests are TypeScript.
- `npm run typecheck` passes with strict NodeNext and separate classic-browser
  compiler configurations.
- `npm test` builds the project and passes all 21 compiled tests on Node 22.11.0.
- Clean `npm ci`, demo generation and package installation were verified.
- A packed-package consumer imported the public functions/types, compiled and
  ran, and used the installed CLI from a different working directory. The
  installed package has zero runtime dependencies.
- All three fixture SVGs and `calendar.json` have identical SHA-256 hashes before
  and after migration.
- Runtime JSON validation remains present; TypeScript contracts are defined in
  `src/types.ts` and shared guards in `src/validation.ts`.
- Browser smoke on the compiled preview passed: scrubbing to 10 seconds shows
  all 22 logo cells and zero contribution lights across exactly seven rows;
  switching themes retains the selected time, with no console errors.
- [Project flow](project-flow.md) covers CLI, data sources, date normalization,
  timing, SVG layers, browser preview, Actions and build/type boundaries. Its
  offline HTML diagram has 16 selectable nodes, with role details for each.
- The flow diagram's file selection was verified in the browser; exactly one
  node remains selected and the role panel updates without horizontal overflow.

On this Windows environment, `npm.ps1` consumes the argument separator when
forwarding CLI options. The README uses the direct compiled CLI as its primary
command and documents `npm.cmd run generate -- ...` for PowerShell users.
