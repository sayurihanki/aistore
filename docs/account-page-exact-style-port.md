# Account Page Exact Styling Port Guide

This document captures the exact styling and state hooks used to produce the current B2B account page look in the screenshot (`/customer/account`), and how to reproduce it in another block.

## Source commits

- `d21e4fefe8fab7ddfdc1d8a416fa2a797ebc5884` (2026-03-03 23:03:19 -0800)
  - Updated account nav visuals and nav rendering logic:
    - `blocks/commerce-account-nav/commerce-account-nav.css`
    - `blocks/commerce-account-nav/commerce-account-nav.js`
  - Added account-page authoring composition:
    - `docs/customer-account-hub-authoring.md`
- `0b59e8d995a9d5edf3ec2ff42d4cb08bcc8c911f` (2026-03-03 22:52:34 -0800)
  - Added `commerce-account-hub` block files (related page system work).

## What visually creates the page

### 1) Left account navigation look

The following exact styles are the main visual change:

- Glass panel shell with subtle border and blur.
- Two-row item layout (`title` + `description`) plus right chevron.
- Optional icon layout (`--has-icon` state).
- Active item gradient background + 3px left accent bar.
- Hover/focus micro-motion (`translateX(2px)`).
- Chevron color/motion shift on active/hover/focus.

Exact selectors and values are in `blocks/commerce-account-nav/commerce-account-nav.css`.

### 2) Left nav behavioral states required by CSS

`blocks/commerce-account-nav/commerce-account-nav.js` adds state classes required by the CSS:

- `.commerce-account-nav__item--active`
  - Applied when `new URL(link).pathname === window.location.pathname`.
- `.commerce-account-nav__item--has-icon`
  - Applied only when an icon value exists.
- Child structure required per item:
  - `.commerce-account-nav__item__icon`
  - `.commerce-account-nav__item__title`
  - `.commerce-account-nav__item__description`
  - `.commerce-account-nav__item__chevron`

Without these classes/children, the exact look will not render.

### 3) Right-side card look (Recent orders + Addresses)

The screenshot card skin comes from these block styles:

- `blocks/commerce-orders-list/commerce-orders-list.css`
- `blocks/commerce-addresses/commerce-addresses.css`

Common visual treatment:

- `border: 1px solid var(--glass-border-subtle);`
- `border-radius: calc(var(--shape-border-radius-2) + 2px);`
- `background: var(--glass-bg-strong);`
- `backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);`
- `box-shadow: 0 6px 18px rgb(0 0 0 / 7%);`
- Hover lift for actionable cards: `translateY(-1px)` + stronger shadow.

### 4) Page layout + tokens required

The look depends on global tokens and column layout in `styles/styles.css`:

- Token roots: `:root, .dropin-design` (accent, glass, typography, spacing, motion).
- Two-column page layout on desktop:
  - `body.columns main` becomes row flex at `@media (min-width: 900px)`.
- Exact `/customer/account` composition rules are defined in:
  - `docs/customer-account-hub-authoring.md`

## Exact token values used by this look

From `styles/styles.css`:

```css
:root {
  --main-color-accent: var(--green-400);
  --green-400: #26a067;
  --green-500: #1f7a4d;
  --gold: #c9a84c;

  --shape-border-radius-2: 8px;
  --spacing-xsmall: 8px;
  --spacing-small: 16px;
  --spacing-medium: 24px;

  --type-body-1-strong-font: normal normal 600 1.8rem/2.88rem var(--type-base-font-family);
  --type-body-2-default-font: normal normal 500 1.6rem/2.56rem var(--type-base-font-family);
  --type-body-2-strong-font: normal normal 600 1.6rem/2.56rem var(--type-base-font-family);
  --type-details-caption-2-font: normal normal 500 1.4rem/2.1rem var(--type-base-font-family);
  --type-headline-2-strong-font: normal normal 700 2rem/2.2rem var(--type-display-font-family);

  --shadow-glass: 0 8px 32px rgb(0 0 0 / 10%);
  --glass-bg: rgb(255 255 255 / 58%);
  --glass-bg-strong: rgb(255 255 255 / 84%);
  --glass-border-subtle: rgb(15 61 36 / 12%);
  --glass-blur-sm: blur(12px);
  --glass-blur-xs: blur(8px);
  --glass-saturate: saturate(160%);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-fast: 0.2s;
}
```

## Copy-ready CSS to recreate exact visual style in another block

Use this only after your block outputs the same class structure and state classes.

```css
/* Left nav shell */
.commerce-account-nav-container:has(> .commerce-account-nav-wrapper) {
  border: 1px solid var(--glass-border-subtle);
  border-radius: calc(var(--shape-border-radius-2) + 4px);
  background: var(--glass-bg-strong);
  backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  box-shadow: var(--shadow-glass);
  overflow: hidden;
}

.commerce-account-nav {
  display: flex;
  flex-direction: column;
}

.commerce-account-nav-wrapper:not(:last-of-type) {
  border-bottom: 1px solid rgb(0 0 0 / 7%);
}

.commerce-account-nav__item {
  align-items: center;
  color: inherit;
  display: grid;
  gap: 0 var(--spacing-small);
  grid-template-areas:
    'title chevron'
    'description chevron';
  grid-template-columns: 1fr auto;
  padding: var(--spacing-small) var(--spacing-medium);
  position: relative;
  text-decoration: none;
  transition: background-color var(--transition-fast) var(--ease-out),
    transform var(--transition-fast) var(--ease-out);
}

.commerce-account-nav__item--has-icon {
  grid-template-areas:
    'icon title chevron'
    'icon description chevron';
  grid-template-columns: auto 1fr auto;
}

.commerce-account-nav__item:hover,
.commerce-account-nav__item:focus-visible {
  background: var(--glass-bg);
  text-decoration: none !important;
  transform: translateX(2px);
}

.commerce-account-nav__item::before {
  content: '';
  inset: 0 auto 0 0;
  position: absolute;
  width: 0;
}

.commerce-account-nav__item--active {
  background: linear-gradient(90deg, rgb(46 190 122 / 12%) 0%, rgb(46 190 122 / 3%) 100%);
}

.commerce-account-nav__item--active::before {
  width: 3px;
  background: var(--main-color-accent);
}

.commerce-account-nav__item__icon {
  align-items: center;
  color: var(--main-color-accent);
  display: inline-flex;
  grid-area: icon;
  justify-content: center;
}

.commerce-account-nav__item__title {
  color: var(--color-neutral-900);
  font: var(--type-body-1-strong-font);
  grid-area: title;
  line-height: 1.2;
}

.commerce-account-nav__item__description {
  color: var(--color-neutral-700);
  font: var(--type-body-2-default-font);
  grid-area: description;
  line-height: 1.25;
  text-decoration: none;
}

.commerce-account-nav__item__chevron {
  color: var(--color-neutral-600);
  font-size: 2rem;
  grid-area: chevron;
  line-height: 1;
  padding-left: var(--spacing-xsmall);
  transition: transform var(--transition-fast) var(--ease-out);
}

.commerce-account-nav__item__chevron::before {
  content: '\203A';
}

.commerce-account-nav__item--active .commerce-account-nav__item__chevron,
.commerce-account-nav__item:hover .commerce-account-nav__item__chevron,
.commerce-account-nav__item:focus-visible .commerce-account-nav__item__chevron {
  color: var(--main-color-accent);
  transform: translateX(2px);
}

@media (max-width: 899px) {
  .commerce-account-nav__item {
    padding: var(--spacing-small);
  }

  .commerce-account-nav__item__title {
    font: var(--type-body-2-strong-font);
  }

  .commerce-account-nav__item__description {
    font: var(--type-details-caption-2-font);
  }
}
```

For right-side card parity:

```css
.commerce-orders-list-wrapper .account-orders-list-card,
.commerce-orders-list-wrapper .account-empty-list .dropin-card,
.commerce-orders-list-wrapper .account-orders-list-action--minifiedView .dropin-card,
.commerce-addresses-wrapper .account-address-card,
.commerce-addresses-wrapper .account-actions-address,
.commerce-addresses-wrapper .account-empty-list .dropin-card {
  border: 1px solid var(--glass-border-subtle);
  border-radius: calc(var(--shape-border-radius-2) + 2px);
  background: var(--glass-bg-strong);
  backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);
  box-shadow: 0 6px 18px rgb(0 0 0 / 7%);
}
```

## Required DOM contract (exact)

Each nav item must render:

```html
<a class="commerce-account-nav__item commerce-account-nav__item--has-icon commerce-account-nav__item--active">
  <span class="commerce-account-nav__item__icon"></span>
  <span class="commerce-account-nav__item__title">My account</span>
  <span class="commerce-account-nav__item__description">Account details</span>
  <span class="commerce-account-nav__item__chevron" aria-hidden="true"></span>
</a>
```

If you rename classes in your new block, update every selector consistently. Any mismatch breaks parity.

## Authoring/data contract used for screenshot

From `docs/customer-account-hub-authoring.md`, `/customer/account` composition:

1. Left column: `commerce-account-nav`
2. Right column:
   1. `commerce-account-header`
   2. `commerce-account-hub`
   3. `commerce-orders-list` with `minified-view=true`
   4. `commerce-addresses` with `minified-view=true`

Canonical left-nav labels include:

- `My account` / `Account details`
- `Orders` / `Track, manage, and return`
- `Addresses` / `Manage your locations`
- `Returns` / `Manage your returns`
- `Requisition Lists` / `Manage your requisition lists`
- `Company Profile` / `Manage company`
- `Company Structure` / `Manage company structure`
- `Company Users` / `Manage company users`
- `Roles and Permissions` / `Manage roles and permissions`
- `Company Credit` / `View company credit history`
- `Quotes` / `Manage negotiable quotes`
- `Quote Templates` / `Manage negotiable quote templates`

## Practical port steps

1. Ensure your target page uses `body.columns` layout (same desktop two-column behavior).
2. Ensure your new block emits the exact nav item DOM and state classes.
3. Copy nav CSS exactly (or apply a full class-prefix rename consistently).
4. Copy card CSS for orders/addresses if you want full right-pane parity.
5. Confirm global token values exist and match `styles/styles.css`.
6. Verify active row class toggles on pathname match.
7. Verify mobile behavior at `max-width: 899px`.

