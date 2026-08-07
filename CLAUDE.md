# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this project is

An **Adobe Edge Delivery Services (EDS / "Franklin") storefront wired to Adobe Commerce**. It
started as `@adobe/aem-boilerplate-commerce` (v4.0.1, see `package.json`) and has been heavily
customized into the **MCX** (Marine Corps Exchange) storefront experience, currently themed with a
design system the commit history calls **"The Issue Ledger"**.

Two things about the architecture drive almost every decision here:

1. **There is no application bundler.** The site ships as native ES modules loaded directly by the
   browser. `npm start` runs a proxy (`aem up`), not a build. Webpack/Vite/Rollup do not exist in
   the page pipeline — do not introduce a build step for `blocks/`, `scripts/`, or `styles/`.
2. **Content lives outside the repo.** Pages are authored in DA.live and mounted via `fstab.yaml`
   (`https://content.da.live/sayurihanki/aistore/`). The repo holds *code*, and blocks read their
   configuration out of the authored HTML tables that EDS produces. Most "content bugs" are
   authoring-shape bugs, not JS bugs.

`docs/build-architecture-diagram.md` has a full Mermaid diagram of this pipeline — read it before
making structural changes.

## Repository layout

| Path | Purpose |
| --- | --- |
| `blocks/<name>/` | 138 blocks. Each holds `<name>.js`, `<name>.css`, `README.md`, and usually `_<name>.json` (authoring model partial). |
| `scripts/aem.js` | Upstream EDS runtime: RUM, block/section decoration, dynamic imports. Treat as vendored. |
| `scripts/scripts.js` | Page orchestration — the eager → lazy → delayed phases. |
| `scripts/commerce.js` | Commerce config, GraphQL clients, route constants, page-type detection, Adobe Data Layer. |
| `scripts/initializers/` | Per-dropin bootstrap (`cart.js`, `pdp.js`, `auth.js`, …). |
| `scripts/mcx-*.js` | The MCX layer: `mcx-block-utils.js` (authoring-table parsing), `mcx-experience.js` (theme gating), `mcx-ui.js` (shared UI wiring), `mcx-preview.js` (block-library preview paths). |
| `scripts/__dropins__/` | **Generated.** Copied from `node_modules/@dropins/*`. Never hand-edit. |
| `styles/` | Global CSS. `mcx-package.css` is the MCX import chain; `styles.css` holds the base token set. |
| `models/_*.json` | Source partials for the authoring schemas. |
| `component-{models,definition,filters}.json` | **Generated** by merging `models/_*.json` + `blocks/*/_*.json`. |
| `tests/` | Node `node:test` unit tests, one directory per block/subject. |
| `cypress/` | Optional E2E suite with its own `package.json` and its own `npm ci`. |
| `tools/` | Repo-side utilities: catalog health check, commerce-contract verifier, UI/UX package builder. |
| `data/` | Authored JSON for configurators, quizzes, guided selling, technical details. |
| `.da/library/blocks/` | DA block-library preview docs. |
| `docs/` | Authoring cookbooks, runbooks, architecture notes. |
| `config.json` | Live Commerce endpoint, store headers, and feature flags for this storefront. |

## Setup and commands

```bash
npm install            # also runs build.mjs + postinstall.js -> scripts/__dropins__
npm start              # local dev on :3000 (aem up --html-folder .da)
npm run lint           # eslint . && stylelint blocks/**/*.css styles/*.css
npm run lint:fix
npm run build:json     # regenerate component-*.json from the model partials
npm run verify:catalog # live Catalog Service health check (needs network + valid config.json)
npm run verify:uniform-contract
npm run build:ui-ux-package
```

`npm run lint` passes clean on the current tree. **Run it through npm**, not a globally installed
`eslint` — this repo pins eslint 8 with a legacy `.eslintrc.js`, and eslint 9/10 aborts with
"couldn't find an eslint.config.js".

## Testing — read this before running tests

Unit tests are plain `node:test` files (`tests/**/*.test.mjs`) that drive blocks against the
hand-rolled DOM in `tests/helpers/fake-dom.js`.

**`npm test` and `npm run test:unit` do not terminate.** Three test files hang indefinitely:

- `tests/mcx-blocks/mcx-blocks.test.mjs`
- `tests/mcx-header/mcx-header.test.mjs`
- `tests/mcx-ui/mcx-ui.test.mjs`

All three exercise `blocks/mcx-header/mcx-header.js`, which imports `scripts/commerce.js`. The
processes sit near-idle rather than spinning, so this is an unsettled promise / open handle at
import time, not an infinite loop. The other **30 files pass (156 tests)**.

Until that is fixed, run tests per-file or per-directory with a timeout:

```bash
node --test tests/mcx-hero/mcx-hero.test.mjs
for f in tests/*/*.test.mjs; do timeout 20 node --test "$f"; done
```

`npm test` is `npm run lint && npm run test:unit`, so lint still completes before the hang — but the
composite command never returns. There is **no CI workflow that runs lint or tests** — the only workflow
(`.github/workflows/sync-from-upstream.yml`) is gated to a different repository and never fires
here. Verification is entirely local, so actually run the checks.

### Writing tests

Use `withFakeDom` from `tests/helpers/fake-dom.js`. Two behaviors surprise people:

- `setTimeout`, `setInterval`, and `requestAnimationFrame` are **synchronous** — the callback runs
  immediately and the "id" is always `1`. Code that reschedules itself will recurse. Pass an
  override (e.g. `{ setTimeout: () => 1 }`) when testing anything with a self-renewing timer.
- `globalThis.fetch` is stubbed and records calls in `fetchCalls`; the default response is
  `{ ok: false, text: async () => '' }`. Supply `options.fetch` for anything that needs real data.

Integration tests are opt-in: `RUN_INTEGRATION=1 npm run test:integration` (installs Cypress deps
under `cypress/` and needs a running local server).

## Block conventions

A block is a directory whose name matches its files:

```
blocks/mcx-hero/
  mcx-hero.js       # export default function decorate(block) { ... }
  mcx-hero.css
  README.md         # required — the pre-commit hook enforces this
  _mcx-hero.json    # authoring model partial, merged into component-*.json
```

- The default export receives the block element and mutates it in place. 136 of 138 blocks follow
  this exact shape (only `hero` and `modal` differ); match it.
- Blocks read authored content out of table rows. Use the helpers in `scripts/mcx-block-utils.js`
  (`getRows`, `cellText`, `parseFieldRows`, `parseLines`, `createPictureFromCell`, `extractLink`)
  rather than re-parsing cells by hand — they already handle `<br>` splitting, markdown links and
  images from cloud authoring, and optimized-picture generation.
- Document the authoring shape in the block's `README.md`. Use `block-readme-template.md` as the
  skeleton, and keep the "Live Example" table accurate: `tests/mcx-docs/` and `tests/mcx-blocks/`
  parse those markdown tables and assert they still match the code.
- `docs/mcx-block-cookbook.md` is the authoritative inventory of MCX block shapes, column counts,
  and deprecated rows. Update it when you change an MCX block's contract.

Only `blocks/columns`, `blocks/hero`, and `blocks/modal` currently lack a README (they predate the
hook).

## The MCX experience layer

MCX styling is opt-in per page, gated by `scripts/mcx-experience.js`:

- A page is "MCX" if `document.body` has the `mcx` class **or** `main` contains one of the blocks
  listed in `MCX_CONTENT_BLOCKS` (or any `commerce-*` block).
- When it matches, `scripts.js` loads `styles/mcx-package.css` — which chains
  `storefront-reference.css` → `mcx-theme.css` → `mcx-modern.css` → `mcx-issue-ledger.css` →
  `mcx-commerce-ledger.css` — and skips the default `fonts.css` path.
- **If you add a new MCX-styled block, add its name to `MCX_CONTENT_BLOCKS`** or pages containing
  only that block will render unthemed.
- Ledger tokens are scoped to `body:is(.mcx, .mcx-preview)`. Add new tokens there, not to `:root`.
- `/.da/library/blocks/<block>` preview URLs are recognized by `scripts/mcx-preview.js` and get a
  synthetic MCX shell so blocks render standalone in the DA block library.

## Generated files — never edit by hand

- `scripts/__dropins__/**` — regenerate with `npm run postinstall` (i.e. `build.mjs` +
  `postinstall.js`). npm does **not** fire `postinstall` when you install a single package, so
  after `npm install @dropins/storefront-cart@x.y.z` you must run `npm run postinstall` yourself.
- `component-models.json`, `component-definition.json`, `component-filters.json` — edit
  `models/_*.json` or `blocks/<name>/_<name>.json`, then `npm run build:json`. The pre-commit hook
  rebuilds and re-stages these automatically when a `_*.json` partial is staged.
- `ui-ux-portability-package/`, `.tar.gz`, `.sha256` — regenerate with `npm run build:ui-ux-package`.

## Git and commit workflow

- Pre-commit hooks (husky) run two checks:
  1. `.husky/check-block-readme.js` — **blocks the commit** if a changed block has no `README.md`.
  2. `.husky/pre-commit.mjs` — rebuilds and stages `component-*.json` when model partials change.

  `git commit --no-verify` bypasses both; prefer adding the README.
- Commit subjects in this repo are short imperative sentences describing the user-visible effect
  ("Restyle product recommendations carousel", "Raise the header type off the illegibility floor").
  Match that voice.
- `.github/pull_request_template.md` asks for the GitHub issue plus before/after test URLs on
  `*.aem.live`.

## Code style

- ESLint `airbnb-base`, browser env, with the overrides in `.eslintrc.js`: import extensions are
  **required** (`import x from './foo.js'`), default exports are not required, circular imports are
  allowed (browser code), unix linebreaks, and `console` is limited to `warn`/`error`/`info`/`debug`.
- `.editorconfig`: **2-space indent for JS, 4-space for CSS**.
- Stylelint uses `stylelint-config-standard` with `selector-class-pattern` disabled and prefix-style
  media ranges (`(min-width: 900px)`, not `(width >= 900px)`).
- Security guidance lives in `.cursor/rules/security-global/*.mdc` (injection, SSRF, output
  encoding, secrets). Blocks build DOM from authored content, so prefer `textContent` and explicit
  element creation over `innerHTML` for anything derived from author or API input.

## Known rough edges

- **Fork-lineage leftovers.** This tree descends from `jenhankib2bapple`/`jenhankib2bbodea`, and
  stale references remain in `blocks/mcx-header/mcx-header.js` (the store-switcher options),
  `blocks/header/header.js`, `blocks/search-bar/search-bar.js`, `demo-config.json`, and several docs
  (`CATEGORY_PAGES_TROUBLESHOOTING_RUNBOOK.md`, `MASTER_MIRROR_PROMPT.md`, `MCX-SITE-PACKAGE-README.md`).
  The live store is `aistore` per `config.json` and `fstab.yaml`. Treat the "Bodea" values in those
  runbooks as historical, not as the current baseline.
- **`parse5` is undeclared.** `tests/helpers/fake-dom.js` imports it, but it is only present
  transitively via the lockfile — it is not in `devDependencies`. Every test fails with
  `ERR_MODULE_NOT_FOUND` if the dependency tree is installed without it.
- `.hlxignore` keeps `*.md`, dotfiles, `package.json`, `cypress/`, and `tools/pdp-metadata/*` out of
  the published site. Anything that must ship to the browser has to sit outside those patterns.
- The repo root holds a number of one-off demo/preview HTML files and a large
  `mcx-homepage-complete-package.zip`; they are scratch artifacts, not part of the runtime.

## Where to look first

- Page lifecycle / adding a global behavior → `scripts/scripts.js`
- Commerce config, endpoints, route constants, page-type detection → `scripts/commerce.js`
- Authoring-table parsing helpers → `scripts/mcx-block-utils.js`
- MCX theme gating → `scripts/mcx-experience.js`
- Block authoring shapes → `docs/mcx-block-cookbook.md` + the block's own `README.md`
- Empty category pages / catalog wiring → `CATEGORY_PAGES_TROUBLESHOOTING_RUNBOOK.md`
- End-to-end build/runtime picture → `docs/build-architecture-diagram.md`
