# UI/UX Portability Package

This package is a portable extraction of the site UI/UX layer from `jenhankib2bbodea`.

## What This Contains

- Global design system CSS: tokens, typography, layout, section variants, motion, and accessibility fallbacks.
- All authored block implementations (`135` blocks) including styles, runtime JS, and per-block README docs.
- UI runtime scripts (AEM + commerce + initializers + analytics glue) excluding generated `scripts/__dropins__`.
- Font and icon assets (`8` font files, `18` icon files).
- Machine-readable manifests for tokens, component catalog, dependencies, and section conventions.

## Quick Import in Another Repo

1. Copy this folder into your target repo (for example under `vendor/ui-ux-portability-package`).
   or run:

```bash
node ui-ux-portability-package/tools/install-into-repo.mjs /absolute/path/to/target-repo --dest vendor/ui-ux-portability-package --force
```

2. Import global styles in your app entry:

```css
@import './vendor/ui-ux-portability-package/styles/import-order.css';
```

3. Copy static assets to your app public path:
- `fonts/*` -> `/fonts/*`
- `icons/*` -> `/icons/*`

4. Port blocks incrementally by copying from `blocks/<block-name>`.
5. Install required runtime dependencies from `manifests/dropin-dependencies.json`.

## Included Manifests

- `manifests/block-inventory.json`
- `manifests/design-tokens.json`
- `manifests/dropin-dependencies.json`
- `manifests/section-conventions.json`
- `manifests/assets.json`

## Notes

- Generated `scripts/__dropins__` files are intentionally excluded for portability.
- Rebuild/generated artifacts are expected in the target environment during install.
- See `docs/IMPORT_GUIDE.md` and `docs/MIGRATION_CHECKLIST.md` for detailed setup.
