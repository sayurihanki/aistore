# Import Guide

This guide explains how to apply the package in another repository with minimal drift.

## 1) Install Package Into Target Repo

Option A: copy the folder directly.

Option B: install tarball directly:

```bash
npm install /absolute/path/to/ui-ux-portability-package.tar.gz
```

Option C: use the installer helper included in this package:

```bash
node node_modules/@jenhanki/ui-ux-portability-package/tools/install-into-repo.mjs /absolute/path/to/target-repo --dest vendor/ui-ux-portability-package --force
```

## 2) Wire Global Styles

In your target app entry CSS:

```css
@import '@jenhanki/ui-ux-portability-package/styles';
```

If your bundler cannot import CSS from package exports, import the file path directly:

```css
@import '../node_modules/@jenhanki/ui-ux-portability-package/styles/import-order.css';
```

## 3) Serve Static Assets

Ensure these directories are publicly served:

- `fonts/`
- `icons/`

If your framework rewrites static paths, update font/icon URLs in:
- `styles/fonts.css`
- block CSS files that reference `../../icons/*`

## 4) Install Runtime Dependencies

Install packages used by UI runtime and commerce blocks:

- `@dropins/storefront-account` (source version: ~3.0.0)
- `@dropins/storefront-auth` (source version: ~3.0.0)
- `@dropins/storefront-cart` (source version: ~3.0.0)
- `@dropins/storefront-checkout` (source version: ~3.0.1)
- `@dropins/storefront-company-management` (source version: ~1.0.0)
- `@dropins/storefront-company-switcher` (source version: ~1.0.6)
- `@dropins/storefront-order` (source version: ~3.0.0)
- `@dropins/storefront-payment-services` (source version: ~3.0.0)
- `@dropins/storefront-pdp` (source version: ~3.0.0)
- `@dropins/storefront-personalization` (source version: ~3.0.0)
- `@dropins/storefront-product-discovery` (source version: ~3.0.0)
- `@dropins/storefront-purchase-order` (source version: ~1.0.0)
- `@dropins/storefront-quote-management` (source version: ~1.0.0)
- `@dropins/storefront-recommendations` (source version: ~3.0.0)
- `@dropins/storefront-requisition-list` (source version: 1.0.0)
- `@dropins/storefront-wishlist` (source version: ~3.0.0)
- `@dropins/tools` (source version: ~1.6.0)

## 5) Migrate Blocks Incrementally

Use `manifests/block-inventory.json` to choose a migration order.

Suggested order:

1. Shell blocks (`header`, `footer`, `top-banner`, `search`, `search-bar`)
2. Global content blocks (`hero`, `cards`, `tabs`, `accordion`, `modal`)
3. Commerce flows (cart, checkout, account, order tracking)
4. B2B workflows (quote, purchase order, requisition lists)

## 6) Keep Design Token Compatibility

All tokens are cataloged in `manifests/design-tokens.json`.
Token summary:

- Total tokens detected: `954`
- Defined tokens: `904`
- Unresolved references: `50`

When adapting brand:

1. Start with `--main-color-accent`.
2. Validate contrast and focus styles.
3. Update section treatments (`.section.light`, `.section.glass`, `.section.dark-glass`) last.

## 7) Reconcile Section Metadata Conventions

This package expects section metadata attributes used by EDS pages:

- `data-padding`: `big`, `default`, `huge`, `large`, `medium`, `small`, `xbig`, `xhuge`, `xxbig`, `xxhuge`
- `data-margin`: `big`, `huge`, `large`, `medium`, `small`, `xbig`, `xhuge`, `xxbig`, `xxhuge`
- section style classes: `dark-glass`, `glass`, `highlight`, `light`

If your target environment has no section metadata parser, implement equivalent wrappers/classes in templates.
