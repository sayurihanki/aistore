# Footer Block

## Overview

The Footer block provides the site footer by loading content from a fragment. On multistore setups, it also renders a store switcher button that opens a modal for selecting the active store view. The block uses design tokens for typography, spacing, and colors and supports responsive layout.

## Configuration

- **Fragment path**: Controlled by metadata tag `footer` (default: `/footer`).
- **Store switcher**: Shown only when `isMultistore()` returns true; otherwise only the footer fragment content is rendered.
- **Store switcher fragment**: Loaded from `/store-switcher` for the modal content.

## Integration

### Metadata

- `footer` – Path to the footer fragment (default: `/footer`). Resolved relative to `window.location`.

### URL Parameters

No URL parameters are read directly by the footer block.

### Local Storage

No `localStorage` keys are used by this block.

### Events

No custom events are dispatched or listened to by the footer block. Store selection is handled via navigation (links) within the store switcher modal.

### Dependencies

- `@dropins/tools` – `getRootPath`, `isMultistore`, `Button`, `provider`
- `createModal` from `../modal/modal.js`
- `getMetadata` from `../../scripts/aem.js`
- `loadFragment` from `../fragment/fragment.js`

## Behavior Patterns

### Footer Content

1. The block loads the footer fragment from the path specified by metadata (or `/footer`).
2. Fragment content is appended into a wrapper `div` with class `footer`.
3. The block replaces the block’s inner content with this decorated footer.

### Store Switcher (Multistore Only)

1. **Button**: A store switcher button is rendered before the footer content when multistore is enabled.
2. **Modal**: Clicking the button opens a modal containing the store switcher fragment.
3. **Structure**: The store switcher fragment is expected to have:
   - A store view title section (`.storeview-modal-storeview-title`)
   - A list of stores/regions (`.storeview-modal-storeview-list`)
4. **Single vs multiple stores per region**:
   - Single store per region: Rendered as a direct link (`.storeview-single-store`).
   - Multiple stores per region: Rendered as an accordion (`.storeview-multiple-stores`) with expand/collapse via `aria-expanded`.
5. **Selection**: The current store is determined by matching the current `root` path against store links.
6. **Accessibility**: Keyboard support (Enter/Space) and `tabindex` for focus management on store items.

### Visual Behavior

- Gradient background with green tones and subtle border.
- Typography and spacing use design tokens (`--type-body-2-default-font`, `--spacing-*`, `--ink-*`, `--green-200`).
- Links use hover/focus color transitions.
- Responsive padding: 40px 24px 24px by default; 40px 32px 24px at 900px and above.

## Error Handling

- **Missing footer fragment**: If the footer fragment fails to load, the block may render empty or partially.
- **Missing store switcher fragment**: If multistore is enabled and the store switcher fragment at `/store-switcher` fails to load, the block logs an error and returns early without rendering the footer.
- **Modal errors**: Modal creation and display are delegated to `createModal`; any failures there propagate to the caller.

## Files

- `footer.js` – Block decoration, fragment loading, store switcher setup, and modal integration
- `footer.css` – Footer layout, store switcher modal, and responsive styles
