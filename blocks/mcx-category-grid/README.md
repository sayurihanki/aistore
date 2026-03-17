# MCX Category Grid

## Overview

The `mcx-category-grid` block renders the browseable merchandising grid used to send shoppers into major storefront categories. It supports an optional section header plus a grid of icon-led category tiles.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-category-grid | | | |
| --- | --- | --- | --- |
| label | Browse the Exchange |  |  |
| title | SHOP YOUR WAY |  |  |
| 👕 | Apparel | 2,400+ items | [Shop Apparel](/apparel) |
| 👟 | Footwear | 890+ styles | [Shop Footwear](/footwear) |
| 💻 | Electronics | 1,200+ items | [Shop Electronics](/electronics) |
| 🏠 | Home & Living | 3,100+ items | [Shop Home](/home) |
| 🏋️ | Sports | 760+ items | [Shop Sports](/sports-outdoors) |
| 💄 | Beauty | 940+ items | [Shop Beauty](/beauty) |
| 🎮 | Gaming | 520+ items | [Shop Gaming](/gaming) |
| 🎒 | Tactical Gear | 380+ items | [Shop Tactical](/tactical) |
| 🧸 | Kids & Baby | 1,500+ items | [Shop Kids](/kids) |
| ⛺ | Outdoors | 670+ items | [Shop Outdoors](/sports-outdoors) |
| 🐾 | Pets | 290+ items | [Shop Pets](/pets) |
| 🎁 | Gifts | 800+ ideas | [Shop Gifts](/gifts) |

## Authoring Shape

Use a 4-column table.

| Column | Purpose for tile rows |
| --- | --- |
| Column 1 | Category icon or emoji |
| Column 2 | Category name |
| Column 3 | Supporting count text |
| Column 4 | Destination link |

Supported config rows:

| Config row key | Where the value goes | Notes |
| --- | --- | --- |
| `label` | Column 2 | Optional eyebrow above the section title |
| `title` | Column 2 | Optional section headline |
| `view-link` | Column 2 | Must be authored as a real link in column 2 |

Section framing is expected to come from section metadata, not extra wrapper blocks. The repo example uses:

| section-metadata | |
| --- | --- |
| style | sec, sec-mid |

## Rendering And Behavior

- Rows whose first cell is `label`, `title`, or `view-link` are treated as configuration and are not rendered as tiles.
- The optional section header only appears if `label` or `title` is authored.
- `view-link` only renders when column 2 contains an actual anchor.
- Each content row becomes an anchor tile. If the link cell does not contain a real link, the tile falls back to `#`.
- The block adds staggered reveal classes based on row order.

## Common Gotchas

- Keep config rows in four columns even though only the first two columns are used.
- Do not author the `view-link` URL as plain text. Use a proper link in column 2.
- Use section metadata for spacing and background treatment. The block itself only handles the section head plus tiles.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-category-grid`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx category grid |
| description | Merchandising grid of shop categories with icon, title, count, and destination link. |
| searchtags | mcx, category grid, browse, navigation, merchandising, icon cards, storefront |
