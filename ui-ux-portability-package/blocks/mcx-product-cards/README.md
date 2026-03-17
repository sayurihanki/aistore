# MCX Product Cards

## Overview

The `mcx-product-cards` block renders the interactive MCX product grid with tabs, price chips, wishlist hearts, quick view, and demo cart behavior. The block itself builds the card markup from the authored table, and `scripts/mcx-ui.js` wires in tabs, modal behavior, wishlist toasts, and session-backed cart interactions on MCX pages and MCX block-library previews.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-product-cards | | | |
| --- | --- | --- | --- |
| label | Curated For You |  |  |
| title | NEW ARRIVALS |  |  |
| view-link | [View All Products](/products) |  |  |
| tabs | All Items\|all, Apparel\|apparel, Electronics\|electronics, Footwear\|footwear, Tactical\|tactical |  |  |
| default-tab | all |  |  |
| ![Tactical boot](https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=75) | Danner<br>Tachyon 8 Tactical Boot GTX | rating: 5<br>reviews: 248<br>price: 189.99<br>original: 239.99<br>chip: Save $50 | category: footwear<br>flags: New<br>emoji: 🥾<br>sizes: 8, 9, 10, 11, 12 |
| ![Sony headphones](https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=75) | Sony<br>WH-1000XM5 Noise Canceling Headphones | rating: 5<br>reviews: 1024<br>price: 279.99<br>original: 349.99<br>chip: Save $70 | category: electronics<br>flags: Sale<br>emoji: 🎧 |
| ![Under Armour Active Hybrid vest](https://underarmour.scene7.com/is/image/Underarmour/V5-1378505-001_FC?bgc=F0F0F0&cache=on%2Con&fmt=jpg&hei=708&qlt=85&resMode=sharp2&rp=standard-0pad%7CpdpMainDesktop&scl=1&size=566%2C708&wid=566) | Under Armour<br>UA Active Hybrid Men's Vest | rating: 5<br>reviews: 37<br>price: 97.97<br>original: 130.00<br>chip: Save $32 | category: apparel<br>flags: Sale, New<br>emoji: 🧥<br>sizes: S, M, L, XL, XXL |
| ![Garmin watch](https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=75) | Garmin<br>Instinct 2X Solar Tactical Edition | rating: 5<br>reviews: 512<br>price: 424.99<br>original: 499.99<br>chip: Save $75 | category: electronics<br>flags: 15% Off<br>emoji: ⌚ |

## Authoring Shape

Use a 4-column table.

Config rows:

| Config key | Value location | Notes |
| --- | --- | --- |
| `label` | Column 2 | Optional eyebrow above the section title |
| `title` | Column 2 | Optional section headline |
| `view-link` | Column 2 | Must be a real link |
| `tabs` | Column 2 | Comma-separated list of `Label\|key` entries |
| `default-tab` | Column 2 | Must match a tab key |

Product rows:

| Column | Purpose |
| --- | --- |
| Column 1 | Product image |
| Column 2 | Brand on line 1, product name on later lines |
| Column 3 | Newline-delimited pricing and rating config |
| Column 4 | Newline-delimited merchandising config |

Column 3 keys:

| Key | Meaning |
| --- | --- |
| `rating` | Star rating, rounded to the nearest whole star |
| `reviews` | Review count text |
| `price` | Current price |
| `original` | Optional strike-through price |
| `chip` | Optional merchandising chip such as `Save $50` |

Column 4 keys:

| Key | Meaning |
| --- | --- |
| `category` | Tab/category key used for filtering |
| `flags` | Comma-separated merchandising flags |
| `emoji` | Placeholder glyph used when no image is available |
| `sizes` | Comma-separated size list for the quick-view modal |

The repo example pairs this block with section metadata:

| section-metadata | |
| --- | --- |
| style | sec, sec-dark |

## Rendering And Behavior

- If no `tabs` row is authored, the block creates a single fallback tab: `All Items`.
- `default-tab` is matched against the tab keys, not the human labels.
- Each product row becomes an `.prod-card` with dataset attributes that feed the interactive MCX UI.
- Clicking the quick-view button or the card body opens the demo modal.
- Clicking the heart toggles wishlist state and shows a toast.
- The cart drawer uses session storage under the key `mcx-demo-cart`.
- Product tabs, modal open/close, add-to-cart, cart drawer quantity controls, and wishlist toasts are all powered by `scripts/mcx-ui.js`.
- If the MCX runtime is not active, the cards still render, but the interactive behavior will not initialize.

## Common Gotchas

- Keep `tabs` entries in the exact `Label|key` format. The display label and filter key are not inferred separately.
- If `default-tab` does not match a tab key, the first tab is used instead.
- Missing numeric prices render as `$0.00`, so treat price rows as required in practice even if the code does not hard-fail.
- Plain-text URLs in `view-link` or product image cells are not enough. Use real links and real images.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-product-cards`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx product cards |
| description | Tactical product card grid with tabs, flags, ratings, pricing, quick view, and demo commerce actions. |
| searchtags | mcx, products, cards, product grid, tabs, quick view, pricing, commerce, teaser |
