# Global Storefront Migration Plan

A complete blueprint for deploying this **entire EDS/Adobe Commerce storefront instance** to another environment. Covers design tokens, glassmorphic system, section metadata, blocks, scripts, commerce, fonts, and configuration.

---

## 1. Architecture Overview

| Layer | Purpose |
|-------|---------|
| **Design tokens** | `styles/styles.css` — colors, spacing, typography, glass, shadows |
| **Lazy styles** | `styles/lazy-styles.css` — background orbs, scroll animations |
| **Fonts** | `styles/fonts.css` + `fonts/` — Adobe Clean, Roboto |
| **Scripts** | `scripts/` — AEM, commerce, block loading |
| **Blocks** | `blocks/` — UI components |
| **Models** | `models/` + `component-*.json` — DA.live authoring |
| **Config** | `fstab.yaml` — content mount |

---

## 2. File Checklist — What to Copy

### 2.1 Core (Required)

| Path | Purpose |
|------|---------|
| `styles/styles.css` | Global tokens, base styles, section metadata |
| `styles/lazy-styles.css` | Background orbs, scroll animations |
| `styles/fonts.css` | Font declarations |
| `fonts/*.woff2` | Adobe Clean, Roboto font files |
| `scripts/scripts.js` | Page load, eager/lazy/delayed |
| `scripts/aem.js` | Block loading, RUM, utilities |
| `scripts/commerce.js` | Commerce init, templates, paths |
| `scripts/initializers/index.js` | Dropin initialization |
| `fstab.yaml` | Content mount URL |

### 2.2 Configuration

| Path | Purpose |
|------|---------|
| `component-definition.json` | Block registry (DA.live) |
| `component-models.json` | Model definitions |
| `component-filters.json` | Block hierarchy / nesting |
| `models/_section.json` | Section metadata model |
| `models/_component-definition.json` | Wildcard block loader |

### 2.3 Blocks (Copy All or Subset)

```
blocks/
├── accordion/
├── age-gate/
├── age-verification/
├── blog-post/
├── cards/
├── carousel/
├── columns/
├── commerce-* (login, checkout, cart, etc.)
├── form/
├── form-2/
├── form-3/
├── form-4/
├── fragment/
├── header/
├── hero/
├── hero-3/
├── modal/
├── newsletter/
├── product-details/
├── product-list-page/
├── product-recommendations/
├── product-teaser/
├── promo-popup/
├── promotional-hero/
├── search/
├── search-bar/
├── store-locator/
├── tabs/
├── video/
└── ... (all blocks in component-definition.json)
```

### 2.4 Commerce & Dropins

| Path | Purpose |
|------|---------|
| `scripts/acdl/` | Adobe Client Data Layer |
| `scripts/commerce-events-*.js` | Commerce events |
| `scripts/__dropins__/` | Preact, tools, storefront dropins |

---

## 3. Design Token System

### 3.1 Primary Brand Token

```css
:root, .dropin-design {
  --main-color-accent: #8821f4;  /* CHANGE THIS for new brand */
}
```

**Used by:** Buttons, links, highlights, focus rings, hero gradients, forms, header, product blocks, promo-popup, newsletter, tabs, search-bar, commerce blocks.

### 3.2 Adobe Commerce Dropin Tokens (styles.css)

| Token | Default | Purpose |
|-------|---------|---------|
| `--color-brand-300` … `1000` | Grays | Brand grayscale |
| `--color-neutral-50` … `900` | Neutrals | UI neutrals |
| `--color-positive-*` | Greens | Success states |
| `--color-informational-*` | Blues | Info states |
| `--color-warning-*` | Oranges | Warnings |
| `--color-alert-*` | Reds | Errors |
| `--grid-1-columns` … `--grid-5-*` | Layout | Grid config |
| `--shape-border-radius-1` … `3` | 3px, 8px, 24px | Radii |
| `--shape-shadow-1` … `3` | Shadows | Dropin shadows |
| `--spacing-xxsmall` … `--spacing-xxhuge` | 4px–192px | Spacing scale |
| `--type-*` | Typography | Display, headline, body, button, caption |

### 3.3 Glassmorphic Design System (styles.css)

| Token | Value | Purpose |
|-------|-------|---------|
| `--glass-bg` | rgb(255 255 255 / 52%) | Base glass background |
| `--glass-bg-hover` | rgb(255 255 255 / 68%) | Hover state |
| `--glass-bg-strong` | rgb(255 255 255 / 80%) | Focus/active |
| `--glass-border` | rgb(255 255 255 / 70%) | Glass border |
| `--glass-border-subtle` | rgb(0 0 0 / 8%) | Subtle border |
| `--glass-blur` | blur(24px) | Strong blur |
| `--glass-blur-sm` | blur(12px) | Small blur |
| `--glass-blur-xs` | blur(8px) | Extra small |
| `--glass-saturate` | saturate(160%) | Color saturation |

### 3.4 Motion & Easing

| Token | Value | Purpose |
|-------|-------|---------|
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy interactions |
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Smooth deceleration |
| `--transition-fast` | 0.2s | Quick transitions |
| `--transition-medium` | 0.4s | Medium |
| `--transition-slow` | 0.6s | Slow |

### 3.5 Accent & Shadow Tokens

| Token | Purpose |
|-------|---------|
| `--accent-1` | var(--main-color-accent) — primary accent |
| `--accent-2` | #6d28d9 — secondary (gradient end) |
| `--accent-3` | #059669 — tertiary (success/CTA) |
| `--shadow-glass` | Glass panel shadow |
| `--shadow-glass-hover` | Hover glass shadow |
| `--shadow-button` | Primary button shadow |
| `--shadow-button-hover` | Button hover shadow |
| `--shadow-focus` | Focus ring |

### 3.6 Additional Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--background-color` | #f7f6f4 | Page background |
| `--nav-height` | 6.4rem | Header height |
| `--type-base-font-family` | adobe-clean, roboto, … | Base font stack |
| `--type-fixed-font-family` | Monospace stack | Code/fixed width |

---

## 4. Section Metadata System

### 4.1 Section Styles (CSS Classes)

Sections get classes from metadata `style` (multiselect). Supported values:

| Class | Effect |
|-------|--------|
| `.light` | Glass background, blur, top/bottom border |
| `.highlight` | Same as light |
| `.glass` | Strong glass panel, rounded, shadow, gradient top line |
| `.dark-glass` | Dark glass (black 75%), light text |

### 4.2 Section Padding

`data-padding` attribute: `default`, `small`, `medium`, `large`, `big`, `xbig`, `xxbig`, `huge`, `xhuge`, `xxhuge`

### 4.3 Section Margin

`data-margin` attribute: same options as padding

### 4.4 Section Model (models/_section.json)

```json
{
  "style": ["highlight"],
  "padding": "medium",
  "margin": "default"
}
```

**To add `light`, `glass`, `dark-glass`:** Add to `style` options in `_section.json`.

---

## 5. Global Base Styles (styles.css)

### 5.1 Layout

- `html` font-size: 62.5%
- `body`: grid (header | main | footer), `--background-color`, `--type-body-1-default-font`
- `main > .section`: max-width 1200px, centered, padding
- Sections: opacity/transform until `.appear` (scroll-triggered)

### 5.2 Typography

- `h1`–`h6`: type tokens, gradient on main h1/h2
- `main > .section > div > h1, h2`: gradient text (accent-1 → accent-2 → accent-3)
- `a`: accent-1, underline animation on hover
- `code`, `pre`: fixed font

### 5.3 Buttons

- `.button`: gradient (accent-1 → accent-2), shadow-button, spring hover
- `.button.secondary`: glass bg, accent border
- `.button.disabled`: neutral gray

### 5.4 Form Inputs (main, non-dropin)

- Glass bg, blur, subtle border
- Hover: glass-bg-hover
- Focus: glass-bg-strong, accent border, shadow-focus

### 5.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 6. Lazy Styles (lazy-styles.css)

### 6.1 Background System

- `body::before`: Floating gradient orbs (purple, violet, green, yellow), blur, drift animation
- `body::after`: Subtle grid overlay, radial mask

### 6.2 Scroll Animations

- `main > .section.appear > div > *`: fadeInUp, staggered by nth-child
- Keyframes: `drift`, `fadeInUp`, `fadeInLeft`, `fadeInRight`, `scaleIn`, `shimmer`

### 6.3 Load Order

Loaded post-LCP via `loadCSS(…/lazy-styles.css)` in `scripts.js` `loadLazy()`.

---

## 7. Fonts

### 7.1 Font Files (fonts/)

- `adobe-clean-normal-400.woff2`
- `adobe-clean-italic-400.woff2`
- `adobe-clean-normal-700.woff2`
- `roboto-regular.woff2`, `roboto-medium.woff2`, `roboto-bold.woff2`
- `roboto-condensed-bold.woff2`

### 7.2 Load Strategy

- `styles/fonts.css` loaded in `loadFonts()` (eager if desktop or cached)
- Session storage flag `fonts-loaded` to skip repeat loads

---

## 8. Scripts Architecture

### 8.1 Load Phases

| Phase | Scripts | Purpose |
|-------|---------|---------|
| Eager | aem, commerce init, decorateMain, loadCommerceEager | LCP, first paint |
| Lazy | loadHeader, loadSections, loadFooter, loadCommerceLazy, lazy-styles.css | Below fold |
| Delayed | delayed.js (3s) | Non-critical |

### 8.2 Key Scripts

- `scripts.js`: loadEager, loadLazy, loadDelayed, initScrollAnimations
- `aem.js`: buildBlock, loadHeader/Footer, decorateBlocks, loadSection/Sections
- `commerce.js`: initializeCommerce, applyTemplates, loadCommerceEager/Lazy
- `initializers/index.js`: Dropin setup

### 8.3 Commerce Paths (commerce.js)

| Constant | Path |
|----------|------|
| `SUPPORT_PATH` | /support |
| `PRIVACY_POLICY_PATH` | /privacy-policy |
| `ORDER_STATUS_PATH` | /order-status |
| `CUSTOMER_PATH` | /customer |
| `PRODUCT_TEMPLATE_PATHS` | ['products/default'] |

---

## 9. Block Integration Pattern

Blocks that use global tokens:

| Block | Tokens Used |
|-------|-------------|
| promo-popup | --main-color-accent, --pp-* (local) |
| hero-3 | --glass-*, --accent-*, --ease-*, --shadow-* |
| form, form-4 | --main-color-accent, --glass-*, --accent-*, --shadow-* |
| header | --main-color-accent, --shadow-glass |
| newsletter | --glass-*, --accent-*, --shadow-* |
| search, search-bar | --glass-*, --accent-*, --ease-* |
| tabs | --glass-*, --accent-* |
| product-* | --glass-*, --accent-*, --ease-* |
| modal, video | --glass-border, --ease-* |
| commerce-* | --accent-*, --ease-* |

---

## 10. fstab.yaml

```yaml
mountpoints:
  /:
    url: https://content.da.live/YOUR_ORG/YOUR_REPO/
    type: markup
```

**Change:** `url` to your DA.live content source.

---

## 11. Component Registration

### 11.1 component-definition.json

Contains all blocks. Promo-popup entry:

```json
{
  "title": "Promo Popup Spinner Wheel",
  "id": "promo-popup",
  "model": "promo-popup",
  "plugins": { "da": { "name": "promo-popup", "rows": 20, "columns": 3 } }
}
```

### 11.2 component-filters.json

Defines block nesting. Section allows: hero, accordion, cards, carousel, columns, fragment, image, text, targeted-block, product-recommendations, promo-popup.

### 11.3 models/_section.json filters

Must include all blocks you want in sections.

---

## 12. Storefront Customization Checklist

| Task | Where | Notes |
|------|-------|-------|
| Brand accent | `styles/styles.css` | `--main-color-accent: #YOUR_COLOR` |
| Accent gradient | `styles/styles.css` | `--accent-2`, `--accent-3` if desired |
| Background color | `styles/styles.css` | `--background-color` |
| Lazy orbs colors | `styles/lazy-styles.css` | `body::before` radial-gradients |
| Grid overlay | `styles/lazy-styles.css` | `body::after` |
| Content URL | `fstab.yaml` | `url` |
| Commerce paths | `scripts/commerce.js` | SUPPORT_PATH, etc. |
| Fonts | `styles/fonts.css`, `fonts/` | Swap or add font files |
| Section styles | `models/_section.json` | Add light, glass, dark-glass to style options |

---

## 13. Build & Deploy Steps

1. **Clone or copy** entire repo to target.
2. **Update fstab.yaml** with content URL.
3. **Set `--main-color-accent`** (and optional accent-2, accent-3) in styles.css.
4. **Update lazy-styles.css** orb colors if desired.
5. **Run build:**
   ```bash
   npm run build:json
   ```
6. **Deploy** to Franklin/EDS (or your hosting).
7. **Verify** header, footer, commerce, blocks load.
8. **Test** scroll animations, reduced motion, DA.live authoring.

---

## 14. Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| 600px | body.columns layout |
| 900px | Main padding, section padding, columns flex |
| 480px | Promo-popup wheel resize |
| (varies) | Block-specific in block CSS |

---

## 15. Accessibility

- `prefers-reduced-motion` respected globally (styles.css, lazy-styles.css)
- Focus styles use `--shadow-focus`
- Semantic HTML, ARIA where needed (e.g. promo-popup dialog)

---

## 16. Quick Reference — Token Dependency Graph

```
--main-color-accent (PRIMARY)
  ├── --accent-1
  ├── --accent-2 (gradient end)
  ├── --accent-3 (tertiary)
  ├── --shadow-button, --shadow-button-hover, --shadow-focus
  └── Blocks: header, form, hero-3, newsletter, product-*, promo-popup, tabs, search-bar

--glass-* (GLASSMORPHIC)
  └── Blocks: hero-3, form, search, tabs, modal, product-*, newsletter, video

--ease-spring, --ease-out (MOTION)
  └── All interactive blocks
```

---

*Use this plan as the single source of truth when migrating the entire storefront to a new instance or environment.*
