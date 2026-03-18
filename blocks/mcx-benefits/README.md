# MCX Benefits

## Overview

The `mcx-benefits` block renders the compact MCX value-proposition bar that calls out tax-free shopping, shipping perks, quality, and community impact. Each row becomes one benefit item with an icon, a headline, and a supporting subtitle.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-benefits | | |
| --- | --- | --- |
| taxfree | Tax-Free Shopping | Exclusive benefit for authorized patrons |
| shipping | Free Shipping $50+ | Ship to store in 3-5 days stateside |
| quality | Quality Guaranteed | Premium brands below market price |
| givesback | 100% Gives Back | All profits support Marine community |

## Authoring Shape

Use a 3-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Icon key or fallback emoji/text |
| Column 2 | Benefit title |
| Column 3 | Benefit subtitle |

Recognized icon keys:

| Icon key | Rendered icon |
| --- | --- |
| `taxfree` | Credit-card style tax-free icon |
| `shipping` | Delivery truck icon |
| `quality` | Shield icon |
| `givesback` | Gift/community icon |

Anything else in column 1 falls back to a text or emoji badge, so `⭐` or `VIP` will still render.

## Rendering And Behavior

- The icon key is normalized to lowercase letters only before lookup, so values like `Tax Free`, `tax-free`, and `taxfree` all resolve to the same built-in icon.
- Each row becomes one `.ben-item`.
- The block does not enforce an exact item count, but the design is tuned for a short set of benefits, typically four.
- No links or CTA behavior are built into this block.

## Common Gotchas

- Avoid empty rows. Unlike some MCX blocks, this one does not filter them out before rendering.
- Keep the first column short. Long text keys in the icon slot will render as fallback text instead of an SVG.
- If you want clickable cards, this is the wrong block. `mcx-benefits` is informational only.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-benefits`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx benefits |
| description | Four-up benefits bar highlighting tax-free shopping, shipping, quality, and community impact. |
| searchtags | mcx, benefits, value props, shipping, tax free, icons, reassurance, bar |
