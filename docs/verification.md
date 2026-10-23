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
