---
name: MCX EDS Portable Store
overview: "Plan to convert the MCX (Marine Corps Exchange) single-file HTML prototype into a portable, author-first AEM Edge Delivery Services (EDS) store: block-based content authoring, schema-driven blocks, MCX theme, edge delivery, and a path to Commerce and optional AEM preview integration."
todos: []
isProject: false
---

# MCX EDS Portable Store — Implementation Plan

## Vision and principles

**One-line vision:** Ship an **author-first Edge Delivery document authoring site** built from reusable, schema-driven blocks that authors assemble into pages; render at the edge for fast TTFB, with in-place preview (DA.live / Universal Editor), accessibility baked in, and safe deployments.

**Core design principles:**

- **Block-first** — Every UI region is a block with a typed schema (DA.live definitions + models), preview in editor, and a single `decorate(block)` contract. Blocks are reusable and composable.
- **Authoring-first** — Inline and structured authoring via tables (max 4 cells/row), semantic formatting, block variants, and clear content models so authors control content without touching code.
- **Edge-native delivery** — EDS/Franklin serves HTML from the edge; target sub-200ms TTFB where applicable; leverage existing EDS caching and optional purge on publish.
- **Portable and AEM-friendly** — Theme and block set are copyable to other EDS repos; optional future integration with AEM Content Fragments or SPA Editor for unified authoring.
- **Observability and safety** — Lint, tests, accessibility checks (e.g. axe), and security rules applied; no secrets in frontend; sanitize rich text and validate input.

---

## Goal

Produce a **new GitHub repository** that delivers the MCX website experience as an AEM EDS Store: content-driven, theme-portable, and ready to connect to Adobe Commerce. The experience will be **portable** so it can be forked, themed, or consumed as a block/theme package by other EDS repos.

---

## 1. New repo and scaffold

**Create a new repo** (e.g. `mcx-eds-store`) with a minimal EDS scaffold. Do **not** migrate the full jenhankib2bbodea codebase; keep the new repo focused on MCX only.

**Include:**

- Standard EDS layout: `blocks/`, `scripts/`, `styles/`, `models/`, `fonts/`, `icons/`, `head.html`, `package.json`
- Core scripts: `aem.js`, `scripts.js` (eager/lazy/delayed, `buildHeroBlock` only if you use default hero; otherwise remove or keep for fallback), and minimal `commerce.js` stubs if you plan to add Commerce later
- No dropins in the first phase; add Commerce wiring in a later phase when connecting to an Adobe Commerce backend

**Reference:** EDS project layout and load sequence are described in [aem-edge-delivery-services SKILL](.cursor/skills/aem-edge-delivery-services/SKILL.md) and [eds-block-patterns SKILL](.cursor/skills/eds-block-patterns/SKILL.md). Use the existing [scripts/scripts.js](scripts/scripts.js) and [scripts/aem.js](scripts/aem.js) as patterns; do not copy the entire `ui-ux-portability-package` into the new repo — only what’s needed for MCX.

---

## 2. MCX theme layer (portable design tokens)

Extract all `:root` CSS custom properties and global/base styles from the provided HTML into a **single, portable theme file** so the look can be moved or overridden without touching block CSS.

**Deliverables:**

- `**styles/mcx-theme.css`** (or equivalent) containing:
  - All variables from the HTML: `--scarlet`, `--scarlet-dark` / `--scarlet-deep`, `--scarlet-bright`, `--gold`, `--gold-lt`, `--black` / `--void` / `--ink`, `--surface-1`–`--surface-5`, `--border` / `--rim`, `--text-primary/secondary/muted` (or `--text-bright` / `--text-body` / `--text-dim`), `--font-display` / `--font-hero`, `--font-condensed` / `--font-ui`, `--font-body`, `--font-tactical` / `--font-mono`, `--radius-`* / `--r-sm` etc., `--shadow-`*, `--transition` / `--t-fast`, `--t-mid`, `--ease`, and optional `--teal` for accent variants.
  - Base resets and body/typography that depend on those tokens (no block-specific layout).
- `**styles/fonts.css`** (or a section in the theme) loading **primary set**: Bebas Neue, Barlow Condensed, Barlow, Rajdhani from Google Fonts. **Optional alternate set** (design variant): Big Shoulders Display, DM Sans, Barlow Condensed, Share Tech Mono — document as second theme file or variant so the experience can switch between “classic” and “tactical” look.
- **Optional design variants** (document, do not block first release): custom cursor (dot + ring, `cursor: none`; **must be disabled on touch/mobile** via media query or `pointer: coarse`); scroll-reveal utility classes (`.reveal`, `.reveal-delay-1` … with IntersectionObserver); hero refinements (scan-line animation, rank/SYS badge, gold stroke on heading line). Prefer theme or global script so blocks stay portable.
- `**styles/styles.css`** in the new repo: minimal base (e.g. box-sizing, scroll-behavior) and an import of `mcx-theme.css`, so swapping the theme file changes the whole look.

**Portability:** Document in the repo README that “to reuse this experience in another EDS site, copy `styles/mcx-theme.css` and `styles/fonts.css` (and optionally the MCX blocks) and import the theme.” Optionally add a one-page “Portability” doc that lists theme files and block names.

### Style specification (detailed reference)

**Source:** Extract from the provided MCX HTML `<style>` block. When implementing, copy or adapt the rules below into `styles/mcx-theme.css` and each block's `blocks/<name>/<name>.css`, scoping block selectors to `main .block-name` (e.g. `main .mcx-announcement-bar`).

**1. `:root` variables (exact set for tactical variant)**

- **Brand:** `--scarlet: #C1121F`, `--scarlet-deep: #8B000D`, `--scarlet-bright: #E8172A`, `--scarlet-glow: rgba(193,18,31,0.18)`, `--scarlet-glow2: rgba(193,18,31,0.08)`; `--gold: #C9A227`, `--gold-lt: #E4C265`, `--gold-dim: rgba(201,162,39,0.12)`, `--gold-border: rgba(201,162,39,0.22)`; `--teal: #00C4A7`, `--teal-dim: rgba(0,196,167,0.08)`.
- **Surfaces:** `--void: #040810`, `--ink: #06101A`, `--surface-1: #080F1B` through `--surface-5: #1E2F42`, `--rim: rgba(255,255,255,0.055)`, `--rim-gold: rgba(201,162,39,0.18)`.
- **Text:** `--text-bright: #F0EAE0`, `--text-body: #A8B8CA`, `--text-dim: #4A5D72`, `--text-ghost: rgba(255,255,255,0.04)`.
- **Typography:** `--font-hero: 'Big Shoulders Display', sans-serif`, `--font-ui: 'Barlow Condensed', sans-serif`, `--font-body: 'DM Sans', sans-serif`, `--font-mono: 'Share Tech Mono', monospace`.
- **Radii:** `--r-sm: 3px`, `--r-md: 8px`, `--r-lg: 14px`, `--r-xl: 22px`, `--r-pill: 100px`.
- **Motion:** `--ease: cubic-bezier(0.4,0,0.2,1)`, `--ease-spring: cubic-bezier(0.34,1.56,0.64,1)`, `--t-fast: 0.18s`, `--t-mid: 0.32s`, `--t-slow: 0.55s`.
- **Shadows:** `--shadow-card: 0 16px 48px rgba(0,0,0,0.55)`, `--shadow-red: 0 0 32px rgba(193,18,31,0.3), 0 8px 24px rgba(193,18,31,0.15)`, `--shadow-gold: 0 0 24px rgba(201,162,39,0.22)`.

**2. Fonts (Google Fonts)**

- **URL:** `https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Share+Tech+Mono&display=swap`
- **Preconnect:** `<link rel="preconnect" href="https://fonts.googleapis.com">` in `head.html`.

**3. Global / theme (in `styles/mcx-theme.css`)**

- **Reset & base:** `*,*::before,*::after` box-sizing, margin, padding; `html` scroll-behavior smooth, font-size 16px; `body` font-family `var(--font-body)`, background `var(--void)`, color `var(--text-body)`, overflow-x hidden, -webkit-font-smoothing antialiased. (Omit `cursor:none` by default; add only when custom cursor is enabled.)
- **Links, images, buttons, lists:** `a` text-decoration none, color inherit, transition color `var(--t-mid)`; `img` max-width 100%, height auto, display block; `button` border none, background none, font-family inherit; `ul` list-style none; `input,textarea` font-family inherit.
- **Scrollbar:** `::-webkit-scrollbar` width 4px; track `var(--surface-1)`; thumb `var(--scarlet)`, border-radius 2px.
- **Custom cursor (optional, disable on touch):** `#cursor-dot` fixed 8×8, scarlet, rounded, translate -50% -50%, shadow; `#cursor-ring` fixed 36×36 border scarlet 0.55; `.cursor-hover` scale dot 2.2 gold, ring 52×52 gold-border; `.cursor-click` dot scale 0.6. In `@media (max-width: 600px)` (or `(pointer: coarse)`): `#cursor-dot,#cursor-ring { display: none }`, `body { cursor: auto }`, `button { cursor: pointer }`.
- **Scroll reveal:** `.reveal` opacity 0, transform translateY(24px), transition 0.6s; `.reveal.in` opacity 1, transform none; `.reveal-delay-1` … `.reveal-delay-4` transition-delay 0.08s … 0.32s.

**4. CSS section → block / file mapping**


| Prototype section (class prefix)                                                                                                                                                                                                                                                                                                        | EDS destination                                                       | Notes                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `.ann-bar`, `.ann-scroll`, `.ann-item`, `.ann-close`                                                                                                                                                                                                                                                                                    | `blocks/mcx-announcement-bar/mcx-announcement-bar.css`                | Keyframe `annRoll` 28s translateX -50%                                                                  |
| `.header`, `.hdr-main`, `.logo`, `.logo-emblem`, `.logo-mcx`, `.logo-tagline`, `.hdr-search`, `.hdr-actions`, `.hdr-act`, `.cart-dot`, `.hdr-signin`, `.nav-bar`, `.nav-inner`, `.nav-link`, `.nav-hot`, `.mega`, `.mega-cols`, `.mega-col`, `.mega-ft`, `.mega-ft-tag`                                                                 | `blocks/mcx-header/mcx-header.css`                                    | Header + nav + mega; sticky, backdrop-filter, scrolled shadow                                           |
| `.hero`, `.hero-canvas`, `.hero-grid`, `.hero-scan`, `.hero-photo`, `.hero-photo-fade`, `.hero-rank`, `.hero-content`, `.hero-eyebrow`, `.eyebrow-pip`, `.hero-h1` (.l1/.l2/.l3), `.hero-desc`, `.hero-ctas`, `.btn-hero`, `.btn-ghost`, `.hero-stats`, `.h-stat`, `.h-dot`, `.hero-nav`, `.hero-scroll`, `.scroll-line`, `.scroll-txt` | `blocks/mcx-hero/mcx-hero.css`                                        | Keyframes `scanLine` 5s, `fadeUp`; hero-canvas radial + linear gradients; grid 80px; gold stroke on .l2 |
| `.ticker-wrap`, `.ticker-track`, `.ticker-item`, `.ticker-gem`                                                                                                                                                                                                                                                                          | `blocks/mcx-ticker/mcx-ticker.css`                                    | Keyframe `ticker` 35s translateX -50%; ::before/::after fade edges 100px                                |
| `.benefits`, `.ben-grid`, `.ben-item`, `.ben-ico`, `.ben-title`, `.ben-sub`                                                                                                                                                                                                                                                             | `blocks/mcx-benefits/mcx-benefits.css`                                | 4-col grid, rim borders                                                                                 |
| `.sec`, `.sec-dark`, `.sec-mid`, `.sec-label`, `.sec-title`, `.sec-head`, `.view-link`                                                                                                                                                                                                                                                  | Theme or shared `styles/mcx-theme.css`                                | Section layout utilities; reuse in multiple blocks                                                      |
| `.cat-grid`, `.cat-tile`, `.cat-emoji`, `.cat-name`, `.cat-count`                                                                                                                                                                                                                                                                       | `blocks/mcx-category-grid/mcx-category-grid.css`                      | 6-col grid, hover scale + scarlet                                                                       |
| `.prod-grid`, `.prod-card`, `.prod-img-zone`, `.prod-img`, `.prod-flags`, `.flag` (.f-new/.f-sale/.f-excl/.f-hot), `.prod-love`, `.prod-quick`, `.prod-info`, `.prod-brand`, `.prod-name`, `.prod-stars`, `.prod-pricing`, `.p-current`, `.p-orig`, `.p-chip`, `.prod-tabs`, `.ptab`                                                    | `blocks/mcx-product-cards/mcx-product-cards.css`                      | 4-col; hover slide-up ATC; filter tabs pill + .on state                                                 |
| `.deal-strip`, `.deal-inner`, `.deal-label`, `.deal-title`, `.deal-desc`, `.countdown`, `.cd-unit`, `.cd-num`, `.cd-lbl`, `.cd-sep`, `.deal-cta`, `.btn-deal`                                                                                                                                                                           | `blocks/mcx-deal-countdown/mcx-deal-countdown.css`                    | 3-col layout; countdown digits with ::after line                                                        |
| `.promo-banner`, `.promo-lines`, `.promo-inner`, `.promo-badge`, `.promo-title`, `.promo-sub`, `.btn-promo`                                                                                                                                                                                                                             | `blocks/mcx-promo-strip/mcx-promo-strip.css` or promo banner block    | Gradient bg; ::before "MARINES" watermark                                                               |
| `.feat-layout`, `.feat-card`, `.feat-veil`, `.feat-body`, `.feat-cat`, `.feat-name`, `.feat-link`, `.feat-main`, `.feat-right`                                                                                                                                                                                                          | `blocks/mcx-featured-collections/mcx-featured-collections.css`        | Grid 1.15fr 0.85fr; overlay gradient                                                                    |
| `.brands-sect`, `.brands-inner`, `.brands-hd`, `.brands-row`, `.brand-pill`, `.brand-nm`                                                                                                                                                                                                                                                | `blocks/mcx-brands/mcx-brands.css`                                    | 7-col grid                                                                                              |
| `.ed-grid`, `.ed-card`, `.ed-photo`, `.ed-shade`, `.ed-body`, `.ed-idx`, `.ed-tag`, `.ed-title`, `.ed-desc`                                                                                                                                                                                                                             | `blocks/mcx-editorial-cards/mcx-editorial-cards.css` or cards variant | 3-col; large index number                                                                               |
| `.nl`, `.nl-box`, `.nl-icon`, `.nl-title`, `.nl-desc`, `.nl-form`, `.nl-input`, `.btn-nl`, `.nl-note`                                                                                                                                                                                                                                   | `blocks/mcx-newsletter/mcx-newsletter.css`                            | Centered form                                                                                           |
| `.footer`, `.foot-inner`, `.foot-top`, `.foot-brand`, `.foot-socials`, `.soc`, `.foot-col`, `.foot-line`, `.foot-bot`, `.foot-legal`, `.foot-flag`                                                                                                                                                                                      | `blocks/mcx-footer/mcx-footer.css` or footer block                    | 5-col grid                                                                                              |
| `.drawer-overlay`, `.cart-drawer`, `.drawer-head`, `.drawer-close`, `.drawer-items`, `.cart-line`, `.cart-thumb`, `.cart-meta`, `.cart-qty`, `.qty-btn`, `.drawer-foot`, `.btn-checkout`, `.btn-continue`                                                                                                                               | Global `styles/mcx-theme.css` or `blocks/mcx-cart-drawer`             | Drawer right -440px → 0, overlay fade                                                                   |
| `.modal-bg`, `.modal-box`, `.modal-img`, `.modal-close`, `.modal-content`, `.modal-sizes`, `.size-btn`, `.modal-atc`                                                                                                                                                                                                                    | Global theme or script-injected                                       | Modal scale + translateY transition                                                                     |
| `.b2t`, `.toast-stack`, `.toast`, `.t-ico`, `.t-title`, `.t-sub`                                                                                                                                                                                                                                                                        | Global in theme / scripts                                             | Back to top; toast stack slide-in                                                                       |


**5. Responsive breakpoints (implement in theme and per-block)**

- **max-width: 1200px:** prod-grid 3 col; cat-grid 4 col; foot-top 3 col; brands-row 4 col; deal-inner 1 col, countdown and deal-cta centered.
- **max-width: 900px:** hdr-main padding 0 20px; hero height 540px; prod-grid 2 col; sec padding 60px 20px; feat-layout 1 col; ed-grid 1 col; ben-grid 2 col gap 20px; cart-drawer max-width 400px; modal-box 1 col.
- **max-width: 600px:** hero-h1 font-size 64px; hero-photo display none; prod-grid 1 col; cat-grid 3 col; foot-top 1 col; nl-form flex-direction column; h-stat-num 30px; hide cursor, body cursor auto, button cursor pointer.

**6. Keyframes to include**

- `annRoll`: from translateX(0) to translateX(-50%).
- `scanLine`: 0% top -2px opacity 0 → 5% opacity 1 → 95% opacity 0.3 → 100% top 100% opacity 0.
- `fadeUp`: from opacity 0 translateY(30px) to opacity 1 translateY(0).
- `ticker`: from translateX(0) to translateX(-50%).

**7. CSS source for implementation**

Implementation should extract the full `<style>` content from the provided MCX HTML and split it as above: `:root` + global reset, scrollbar, optional cursor, and reveal → `styles/mcx-theme.css`; each component's rules → the corresponding `blocks/<name>/<name>.css` with selectors scoped under `main .block-name` (and optionally under section for layout utilities). Preserve all variable references, gradients, and transitions so the EDS site matches the prototype visually.

---

## 3. Block decomposition (section → block mapping)

Map each section of the MCX HTML to an EDS block: either **new MCX block** or **reuse** of an existing pattern (e.g. Block Collection). Prefer reusing when the structure and behavior match; otherwise create a new block and keep content models author-friendly (max 4 cells per row, semantic formatting).


| Section in HTML                                       | Block approach                                                             | Content model                                                               | Notes                                                                                                                                                                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Announcement bar                                      | **New** `mcx-announcement-bar`                                             | Standalone: 1 row, multiple cells (items + optional close)                  | Author: list of short lines; close button optional.                                                                                                                                                                                         |
| Header (logo, search, nav, mega menu)                 | **New** `mcx-header`                                                       | Configuration + fragment or nav table                                       | Logo, search placeholder, nav links; mega menu content as table (e.g. 3 columns: Men’s / Women’s / Footwear). Register in shell so it loads with header.                                                                                    |
| Hero (eyebrow, H1, gold line, desc, CTAs, KPIs, dots) | **New** `mcx-hero`                                                         | Standalone: rows for eyebrow, heading, description, buttons, KPIs           | Reuse semantic structure (H1, paragraph, links). KPIs as 2-column rows (label / value).                                                                                                                                                     |
| Ticker                                                | **New** `mcx-ticker`                                                       | Collection: 1 column, each row = one ticker item                            | Simple list of strings; JS duplicates for infinite scroll.                                                                                                                                                                                  |
| Benefits (4 icons + text)                             | **New** `mcx-benefits`                                                     | Collection: 2–3 cells per row (icon optional, title, subtitle)              | 4 rows. Icon can be emoji or reference; prefer semantic markup.                                                                                                                                                                             |
| Category grid (12 cards)                              | **New** `mcx-category-grid`                                                | Collection: icon/emoji, name, count per row                                 | 3 cells per row; 12 rows. Section heading via section metadata or first row.                                                                                                                                                                |
| Product grid (8 cards)                                | Reuse **cards** or **New** `mcx-product-cards`                             | Collection: image, brand, name, rating, price, was-price, badge             | If reusing Block Collection `cards`, add a variant for “product” layout and map to MCX product card markup. Else implement `mcx-product-cards` with Collection model; later wire to Commerce (product-list-page / product-teaser).          |
| Promo strip (red gradient, CTA)                       | **New** `mcx-promo-strip`                                                  | Standalone: tag, title, description, button label + URL                     | 1–2 rows.                                                                                                                                                                                                                                   |
| **Deal countdown strip**                              | **New** `mcx-deal-countdown`                                               | Standalone + config: label, title, description, end date/duration, CTA      | **Countdown ticker**: Days : Hours : Mins : Secs; JS updates every second; optional digit flip animation. Author provides end datetime (ISO or “7 days from publish”) or duration. Max 4 cells for copy; end date via block config/sidebar. |
| Featured collections (1 large + 2 small)              | **New** `mcx-featured-collections`                                         | Standalone: 3 rows (main image+text, side1 image+text, side2 image+text)    | Image, tag, title, CTA per area.                                                                                                                                                                                                            |
| Brands row                                            | **New** `mcx-brands`                                                       | Collection: 1 column, each row = brand name                                 | 7 rows.                                                                                                                                                                                                                                     |
| Editorial (3 cards)                                   | Reuse **cards** with variant or **New** `mcx-editorial-cards`              | Collection: image, number, category, title, description                     | 3 rows.                                                                                                                                                                                                                                     |
| Newsletter                                            | Reuse **newsletter** if present in scaffold, else **New** `mcx-newsletter` | Configuration or Standalone: heading, description, placeholder, button text | Match existing EDS newsletter pattern if available.                                                                                                                                                                                         |
| Footer                                                | Reuse **footer** with MCX theme, or **New** `mcx-footer`                   | Same as Block Collection footer: columns of links + brand block             | Styled by MCX theme.                                                                                                                                                                                                                        |
| Back to top                                           | **Global script** in `scripts/scripts.js` or small **delayed** block       | N/A                                                                         | Single button; show after scroll threshold.                                                                                                                                                                                                 |
| Toast (“Added to Cart”)                               | **Global** (e.g. in `scripts/scripts.js` or a tiny block loaded once)      | N/A                                                                         | Triggered by Add to Cart / wishlist; support toast stack (multiple toasts). No author content.                                                                                                                                              |
| Cart drawer                                           | **Global** or `mcx-cart-drawer` (shell)                                    | N/A                                                                         | Slide-out drawer: line items, qty +/-, subtotal, Checkout, Continue Shopping. Wire to header cart icon; Phase 3 / Commerce.                                                                                                                 |
| Quick view modal                                      | **Global** (triggered from product card)                                   | N/A                                                                         | Modal from card data or Commerce; size selector for apparel/footwear; Add to Cart; focus trap and ARIA. Phase 3.                                                                                                                            |


**Product grid extras:** Filter tabs above the grid (All Items, Apparel, Electronics, Footwear, Tactical, Sports): author-defined labels + category keys via section metadata or block config; client-side filter. Quick View on card click opens modal with image, brand, name, price, optional size selector, Add to Cart.

**Content model rules (EDS):**

- Max 4 cells per row; use semantic formatting (headings, bold) for meaning.
- Prefer block variants (e.g. `mcx-hero (dark)`) over extra config columns.
- Document each block in a short `README.md` and a `_block-name.json` with `definitions` and `models` for DA.live (and `component-definition.json` registration).

### Block contract (EDS alignment)

Each block fulfills a minimal contract so it fits the authoring and delivery pipeline:


| Contract piece    | EDS implementation                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**            | Block name = folder and `data-block-name` (e.g. `mcx-hero`).                                                                                                          |
| **schema**        | `_block-name.json` → `definitions` (table shape, rows/columns) + `models` (sidebar fields, types). Optionally add a JSON Schema or examples in README for validation. |
| **preview**       | DA.live / Universal Editor render block in place; same `decorate(block)` produces final DOM.                                                                          |
| **client**        | `blocks/<name>/<name>.js` (and optional lazy/delayed behavior). No framework in critical path.                                                                        |
| **accessibility** | Per-block checklist in README; ARIA where needed (mega menu, ticker, modals); axe in Storybook/CI.                                                                    |
| **metadata**      | `_block-name.json` title, plugins.da; version/deprecation via docs or model fields.                                                                                   |


### Block categories (MCX set)

Organize the MCX block set for discoverability and future growth:

- **Shell:** mcx-announcement-bar, mcx-header, mcx-footer
- **Hero / Above-fold:** mcx-hero
- **Content / Marketing:** mcx-ticker, mcx-benefits, mcx-promo-strip, **mcx-deal-countdown** (countdown ticker), mcx-featured-collections, mcx-editorial-cards (or cards)
- **Navigation / Discovery:** mcx-category-grid, mcx-brands
- **Product / Commerce:** mcx-product-cards (or cards variant; includes filter tabs + Quick View), cart drawer, quick view modal (global/shell)
- **Utility:** mcx-newsletter, back-to-top, toast stack (global)

**Deal countdown (`mcx-deal-countdown`):** Promotional strip with a **countdown ticker** (Days : Hours : Mins : Secs). Author provides label, title, description, CTA, and **end datetime** (ISO 8601 or “7 days from publish”) via block config or sidebar; client JS updates every second. Optional: digit flip animation on change; when diff ≤ 0, show “Ended” or hide CTA. Use for flash sales, event deadlines, or offer expiration.

---

## 4. Block implementation order and dependencies

Implement in an order that minimizes rework and allows early visual validation:

1. **Theme** — `styles/mcx-theme.css` + `styles/fonts.css` + base `styles/styles.css` so that default content and one hero already “look like MCX.”
2. **Shell and global UI** — `mcx-announcement-bar`, `mcx-header`, then footer (reuse or `mcx-footer`). Ensures every page has the same chrome.
3. **Above-the-fold** — `mcx-hero` (and remove or adapt auto hero in `scripts.js` if it conflicts).
4. **Mid-page** — `mcx-ticker`, `mcx-benefits`, `mcx-category-grid`.
5. **Commerce and marketing** — `mcx-product-cards` (or cards variant) with filter tabs and Quick View wiring, `**mcx-deal-countdown`** (countdown ticker: Days : Hours : Mins : Secs, JS every second, optional digit flip), `mcx-promo-strip`, `mcx-featured-collections`, `mcx-brands`, editorial (cards or `mcx-editorial-cards`), newsletter.
6. **Global behavior** — Back-to-top, toast stack, and (Phase 3) cart drawer + quick view modal in `scripts/scripts.js` or small shell blocks.

Each block follows the standard EDS pattern: `decorate(block)` in `blocks/<name>/<name>.js`, scoped CSS in `blocks/<name>/<name>.css`, and `_<name>.json` for DA.live. Reuse `createOptimizedPicture`, `readBlockConfig`, and other helpers from `aem.js`; no `innerHTML` with unsanitized input; external links use `rel="noopener noreferrer"`.

---

## 5. Data and schema strategy

- **Canonical schema per block** — Store structure in `_block-name.json` (definitions + models). Optionally add `schema.json` or documented examples in README for validation and tooling.
- **Validation** — Client-side: DA.live/UE enforces model fields. Optional: CI job that validates block config or sample content against expected shape.
- **Content model** — Page = ordered sections; each section = optional section metadata + one or more blocks. Block data lives in authoring source (Google Doc, SharePoint, DA.live) as tables; EDS converts to DOM and `decorate(block)` runs.
- **Fragments** — Reuse content across pages via EDS fragments (e.g. header/footer) or links to shared docs; no separate GraphQL in initial scope.

---

## 6. Content and authoring

- **Test content:** Add at least one authoring source (e.g. Google Doc or local `.plain.html`) that represents the homepage so you can validate all blocks. Use the CDD workflow: design content model → create test content → implement → validate.
- **Local preview:** Use `aem up --html-folder drafts --no-open` (or equivalent) and serve a `drafts/tmp/mcx-home.plain.html` that includes section metadata and one instance of each MCX block in order.
- **Documentation:** In the new repo, add a short “Authoring guide” that lists each block, its table shape (rows × columns), and example content (e.g. “Row 1: eyebrow text | optional line label”).
- **Authoring UX (EDS):** DA.live / Universal Editor provide the edit surface. Ensure block titles and model labels are author-friendly; support block presets or templates in docs if useful. Optional later: AEM Content Fragments or SPA Editor integration and publish webhook for cache invalidation.

---

## 7. Edge delivery and caching

- **Delivery** — EDS (Franklin) serves pages from edge; no extra edge runtime in scope unless you add a custom layer.
- **TTFB** — Aim for fast first paint; keep eager block and LCP content minimal; lazy-load remaining sections and blocks.
- **Cache invalidation** — If content is published from AEM or another CMS, trigger revalidation or purge via webhook (e.g. on publish) so updated pages appear within agreed TTL. Document in an optional `EDGE-DEPLOY.md`.

---

## 8. Commerce integration (later phase)

The HTML includes product cards, cart count, and “Add to Cart” / wishlist. For the **first phase**, implement with static or mock data so the experience is complete without a backend.

**Later (separate plan):**

- Add Adobe Commerce fstab/config and `commerce.js` (or copy from existing repo) and Commerce dropins.
- Replace product grid with `product-list-page` / product teasers or keep `mcx-product-cards` and feed it from Commerce APIs; wire **filter tabs** to category/API; feed **Quick View** modal from product API.
- Wire header cart icon to **cart drawer** (slide-out with line items, qty +/-, subtotal, Checkout, Continue Shopping) and optionally `commerce-mini-cart`; search to `search-bar` (Commerce-aware).
- **Deal countdown** block: author sets end datetime (ISO or relative); countdown runs client-side; when zero, optionally hide CTA or show “Ended” state.
- Ensure Add to Cart and wishlist trigger Commerce events and toast stack; keep toast in global script or small block.

Do not implement Commerce API calls or secrets in the initial portable package; only document where to plug them in.

---

## 9. Security and access

- **Workspace rules:** No raw user input in file/command/query usage; no secrets in frontend; validate newsletter and form input; allow only safe URL protocols; use `rel="noopener noreferrer"` for `target="_blank"`.
- **Sanitization:** Sanitize rich text and any author-provided HTML with an allowlist; build DOM with `createElement` / `textContent`; no unsanitized `innerHTML`.
- **Preview:** If authenticated preview is used later, protect preview endpoints with signed tokens (e.g. JWT) with limited TTL and scope; no secrets in builds (use env or vault).
- **Lint and tests:** Run `npm run lint` (and fix lint); add `npm test` for block logic or schema validation where useful.

---

## 10. Storybook and visual QA

- **Role of Storybook** — Each block has stories for default, key variants, and edge cases (minimal data, long text, missing image). Storybook doubles as a block marketplace for authors and developers.
- **Per-block stories** — Minimal state, full state, error/missing-data state; document props/slots that map to authoring table cells.
- **Accessibility in Storybook** — Run axe (or similar) in CI on Storybook build; fix critical/serious issues before merge.
- **Visual regression (optional)** — Chromatic or similar for visual diffs on PRs; snapshot key viewports (mobile, desktop).

---

## 11. Testing and QA

- **Unit** — Jest (or Vitest) for block helpers, config normalizers, and any pure logic; optional tests for `decorate(block)` with fixture DOM.
- **Integration / visual** — Storybook + optional Chromatic; verify blocks render and respond to viewport.
- **E2E** — Playwright for critical paths: load homepage, navigate header, click CTA, submit newsletter (if applicable). Optional: authoring flow in DA.live/UE if preview is in scope.
- **Schema** — CI job to validate `_block-name.json` and optionally sample content or block config against expected structure.
- **Accessibility** — axe in Storybook and/or E2E; manual keyboard and screen-reader check for shell (header, footer, mega menu) and one representative page.

---

## 12. CI/CD

- **CI (per PR):** Lint → Unit test → Build (if applicable) → Storybook build → Accessibility (axe) → Optional visual regression. Block schema/config validation if implemented.
- **CD (on merge to main):** Deploy preview/production (e.g. EDS pipeline or GitHub Actions deploy); optionally publish Storybook; document cache invalidation or content-sync if using publish webhook.
- **AEM sync (optional later):** On publish from AEM, call webhook to revalidate paths or trigger incremental build; document in `AEM-INTEGRATION.md` or `EDGE-DEPLOY.md`.

---

## 13. Performance and media

- **Images** — Use `createOptimizedPicture` from `aem.js`; output `srcset`, `sizes`, and `loading="lazy"` for non-LCP images; LCP image in hero: eager load.
- **Islands** — EDS already lazy-loads blocks after first section; keep interactive blocks (header, search, cart) lightweight; defer heavy or third-party scripts to delayed.
- **Critical CSS** — Inline or eager-load CSS for hero and header; remaining block CSS loaded with block (EDS default).
- **Budgets (optional)** — Lighthouse CI in pipeline with thresholds for LCP, CLS, and bundle size to avoid regressions.

---

## 14. Observability and analytics

- **RUM** — Use EDS/RUM if available; otherwise minimal instrumentation for LCP, FCP, CLS where feasible.
- **Errors** — Front-end errors to logging or Sentry (or equivalent) if the project adopts it.
- **Business events** — Add-to-cart, wishlist, newsletter signup, CTA clicks can be sent to analytics or a server-side event gateway when Commerce and marketing are wired.
- **Edge/cache** — If using custom edge or purge API, monitor cache hit ratio and revalidation errors.

---

## 15. Governance and block registry

- **Adding/changing blocks** — PR with implementation, README, content model, and `_block-name.json`; design sign-off and accessibility (axe) pass; Storybook coverage for new blocks.
- **Deprecation** — Mark deprecated blocks in metadata or README; provide migration path (e.g. “use mcx-hero instead of hero”) and optional script or doc to update authoring sources.

---

## 16. Phased milestones

- **Phase 1 (foundation):** Repo scaffold, MCX theme, fonts, base styles; shell blocks (announcement-bar, header, footer); mcx-hero; one test page. Target: recognizable MCX look and chrome.
- **Phase 2 (content blocks):** mcx-ticker, mcx-benefits, mcx-category-grid, **mcx-deal-countdown** (countdown ticker with author-configured end date), mcx-promo-strip, mcx-featured-collections, mcx-brands, editorial (cards or mcx-editorial-cards), mcx-newsletter; back-to-top and toast stack. Target: full homepage from authoring source.
- **Phase 3 (commerce-ready):** mcx-product-cards (or cards variant) with mock data, **filter tabs**, and **Quick View** modal; **cart drawer** (slide-out) wired to header cart icon; document Commerce integration points. Target: product grid, countdown, cart drawer, and CTAs ready for backend hookup.
- **Phase 4 (hardening):** Storybook for all blocks; CI (lint, test, axe, optional visual); Authoring guide and Portability doc; optional EDGE-DEPLOY and AEM-INTEGRATION notes. Target: release-ready portable package.

---

## 17. Risks and mitigations

- **Preview vs. production mismatch** — Mitigate: use same `decorate(block)` and theme in editor preview and edge; add a smoke test or visual check that a known doc renders the same in both.
- **Block schema drift** — Mitigate: document content model in README and `_block-name.json`; optional CI validation of config or sample content; migration note when fields change.
- **Cache staleness after publish** — Mitigate: document and implement publish webhook to revalidate or purge; set sensible TTL and monitor.
- **Author friction** — Mitigate: clear Authoring guide, sensible defaults, block presets/templates in docs, and helpful model labels in DA.live.

---

## 18. Deliverables summary


| Deliverable            | Description                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New GitHub repo        | EDS scaffold + MCX-only blocks and theme.                                                                                                                                                                                                                                                                                               |
| `styles/mcx-theme.css` | All MCX design tokens and base globals; portable.                                                                                                                                                                                                                                                                                       |
| `styles/fonts.css`     | Bebas Neue, Barlow Condensed, Barlow, Rajdhani.                                                                                                                                                                                                                                                                                         |
| 14–16 blocks / globals | mcx-announcement-bar, mcx-header, mcx-hero, mcx-ticker, mcx-benefits, mcx-category-grid, mcx-product-cards (filter tabs + Quick View), **mcx-deal-countdown**, mcx-promo-strip, mcx-featured-collections, mcx-brands, mcx-editorial-cards or cards, newsletter/footer; global: back-to-top, toast stack, cart drawer, quick view modal. |
| Content models         | Each block has `_block-name.json` and optional README with table layout.                                                                                                                                                                                                                                                                |
| Test content           | At least one homepage (e.g. `drafts/tmp/mcx-home.plain.html`) exercising all blocks.                                                                                                                                                                                                                                                    |
| Docs                   | README (run, preview, portability), optional “Portability” and “Authoring” pages.                                                                                                                                                                                                                                                       |


---

**Acceptance criteria (page-level):** Authors can compose a page using blocks, save, preview in full fidelity, and publish. Published page renders with target TTFB (edge; aim <200ms median where applicable). Storybook coverage for all blocks with visual and a11y tests passing; no critical axe violations. Publish webhook (when used) invalidates edge cache and updated content appears within agreed TTL.

---

## 19. Recommended next artifacts

After the plan is approved, the following artifacts can be produced next (pick as needed):

1. **Block spec template** — JSON schema + editor UI hints + acceptance checklist for a single block (e.g. `blocks/mcx-hero/schema.json`) to reuse across MCX blocks.
2. **Hero block implementation** — Full `mcx-hero`: `decorate(block)`, CSS, `_mcx-hero.json`, README, and a Storybook story (and optional unit test) as the reference implementation.
3. **AEM-INTEGRATION.md** — Step-by-step: authoring blocks in DA.live/UE, mapping fields to block schema, optional AEM Content Fragments/SPA Editor and publish webhook.
4. **CI workflow** — GitHub Actions `ci.yml` for lint, unit test, Storybook build, axe, and optional Chromatic and schema validation.
5. **EDGE-DEPLOY.md** — Caching strategy, purge/revalidate webhook, preview tokens, and example config or snippet for cache invalidation on publish.

---

## 20. Out of scope for this plan

- Implementing Adobe Commerce backend or dropins in the first phase.
- Migrating or copying the full jenhankib2bbodea block set into the new repo.
- Building a generic “theme switcher” UI; portability is via file copy and theme import.
- Changes to `aem.js` or Adobe’s core runtime; only project-level scripts and blocks are added or modified.

