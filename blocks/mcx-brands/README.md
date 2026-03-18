# MCX Brands

## Overview

The `mcx-brands` block renders the horizontal brand roster used to reinforce assortment and trust on MCX landing pages. Authors only provide the brand names. The heading copy is fixed in the block code.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-brands |
| --- |
| Apple |
| Samsung |
| Under Armour |
| Brooks |
| 5.11 Tactical |
| Garmin |
| Danner |

## Authoring Shape

Use a 1-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Brand name text |

Important authoring details:

- Each row becomes one pill-shaped brand item.
- The block does not support links, logos, or secondary metadata.
- The section title is hard-coded to `Trusted Brands Available at Every MCX Location`.

## Rendering And Behavior

- The block wraps authored brands in `.brand-pill` elements.
- All content is treated as plain text through `textContent`.
- The layout is resilient to different brand counts, but it is visually strongest with a short curated list rather than dozens of rows.

## Common Gotchas

- Avoid blank rows. They will render as empty brand pills because this block does not filter them out.
- If you need actual logo images, use a different block or extend this one. `mcx-brands` is text-only today.
- Do not expect the heading to be authorable from the block table. It is fixed in the JavaScript implementation.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-brands`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx brands |
| description | Horizontal brand roster showing featured labels available through the storefront. |
| searchtags | mcx, brands, logo row, roster, featured brands, trust, merchandising |
