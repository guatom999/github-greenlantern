# GitHub Green Lantern

**English** | [ภาษาไทย](README.th.md)

Turn your GitHub contribution calendar into a glowing Green Lantern animation for your profile README. The 16-second loop fades the contribution lights inward, reveals the symbol, and restores the original calendar.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern.svg">
  <img alt="GitHub contributions forming an animated Green Lantern symbol" src="https://raw.githubusercontent.com/guatom999/github-greenlantern/output/greenlantern-dark.svg">
</picture>

[Use on your profile](#use-on-your-profile) · [Run locally](#run-locally) · [Action options](#action-options) · [Development](#development)

## Use on your profile

### 1. Add a workflow to your profile repository

Your profile repository must be public and named after your username, for example `guatom999/guatom999`. See [GitHub's profile README guide](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme).

Create `.github/workflows/greenlantern.yml` in that repository. You can call this Action directly without forking this project:

```yaml
name: Green Lantern

on:
  schedule:
    - cron: '17 0 * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: greenlantern-output

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Generate animations
        uses: guatom999/github-greenlantern@v1
        with:
          github_user_name: ${{ github.repository_owner }}
          output_directory: dist

      - name: Publish animations
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
          keep_history: true
          allow_empty_commit: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The first step creates the images; the second commits them to the `output` branch of **your profile repository**. `keep_history: true` preserves that branch's commit history. The workflow uses GitHub's automatic token; you do not need to create a personal token for this example.

**Version note:** `@v1` currently points to the earlier release, which also creates `greenlantern-logo.svg`, `preview.html`, and `calendar.json`. To use the newer version that generates only the two animated SVGs, replace `@v1` above with `@ad0005c06f35a421edb40355edb42aa9fd73c2fa`. Updating `main` does not automatically move `v1`.

### 2. Run it once

Commit the workflow, then open **Actions → Green Lantern → Run workflow** in your profile repository. Wait for the run to succeed and check that the `output` branch contains the SVGs.

After that, it runs daily at **00:17 UTC / 07:17 Thailand time**. Scheduled runs may start later than the scheduled time.

### 3. Show the animation in your README

Add this HTML to the root `README.md` of your profile repository. Replace **both** occurrences of `YOUR_USERNAME` in each URL with your GitHub username:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern-dark.svg">
  <source media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern.svg">
  <img alt="My GitHub contributions — Green Lantern animation"
    src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/greenlantern-dark.svg">
</picture>
```

Commit your README and open your GitHub profile. If you publish from a different repository, use that repository's owner and name in the image URLs instead.

## Run locally

Requires **Node.js 22 or later**.

```sh
git clone https://github.com/guatom999/github-greenlantern.git
cd github-greenlantern
npm ci
npm run build
node build/src/cli.js --user YOUR_USERNAME --output dist
```

Replace `YOUR_USERNAME`, then open either generated SVG in a browser:

| File | Theme |
| --- | --- |
| `dist/greenlantern.svg` | Light |
| `dist/greenlantern-dark.svg` | Dark |

Each SVG contains its own animation and logo. The current CLI creates only these two files. On a successful rerun, it removes the three retired exports from the output directory and preserves files with other names.

To build and generate in one command:

```sh
npm run generate -- --user YOUR_USERNAME --output dist
```

On Windows PowerShell, use `npm.cmd run generate -- --user YOUR_USERNAME --output dist` to forward the options reliably. The direct `node build/src/cli.js` command above also works.

## Action options

| Input | Default | Purpose |
| --- | --- | --- |
| `github_user_name` | Repository owner | GitHub account whose contributions to read |
| `github_token` | `${{ github.token }}` | Read contributions through GitHub GraphQL; pass `''` to use public calendar HTML |
| `output_directory` | `dist` | Directory receiving the generated files |

The Action returns file paths through the `svg` and `svg_dark` outputs. It generates files; your workflow handles publishing.

For the local CLI, `GITHUB_TOKEN` is optional. Without it, the program reads public contribution color levels; with it, it uses GraphQL. It reads only data available to that token and does not write the token into images. The animation does not modify your GitHub contribution statistics.

To generate images for a different account, set `github_user_name` explicitly. In a fork of this repository, the built-in [generation workflow](.github/workflows/generate.yml) also accepts a username when you run it manually; scheduled runs use the repository owner.

## Development

After `npm ci`:

```sh
npm run demo
npm run typecheck
npm test
```

`npm run demo` uses synthetic data from `test/fixtures/demo.json`, works offline, and writes SVGs into `dist/demo/`. This data does not represent a real GitHub account.

| Location | Purpose |
| --- | --- |
| `src/cli.ts` | Read options, load data, and write the SVGs |
| `src/github.ts` | Fetch GitHub contributions |
| `src/calendar.ts` | Normalize dates into a seven-row grid |
| `src/animation.ts` | Define the 16-second animation and 5 × 7 symbol |
| `src/svg.ts` | Render self-contained SVGs |
| `src/index.ts` | Public library functions and TypeScript types |
| `test/` | Automated tests and demo data |
| `.github/workflows/generate.yml` | Generate and publish this repository's images |

`build/` contains compiled JavaScript and type declarations; `dist/` contains generated SVGs. Both directories and `node_modules/` are ignored by Git. The library exports `normalizeDays`, `fetchContributions`, `sampleFrame`, `renderSvg`, and other helpers through `build/src/index.js`.

The SVG renderer requires no browser or runtime dependencies. It preserves the calendar's week columns, uses seven rows, and displays a still contribution calendar when reduced motion is enabled. GIF and MP4 export are not included.

## Credits and license

Inspired by [Platane/snk](https://github.com/Platane/snk). This project implements its own data reader, animation timeline, and renderer.

Code is licensed under [MIT](LICENSE). This is a fan project, unaffiliated with the owners of the Green Lantern name or symbol.
