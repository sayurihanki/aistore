# MCX Featured Collections

## Overview

The `mcx-featured-collections` block renders the editorial collection layout with one large lead card and two supporting cards. It supports an optional section label, title, and view-all link above the card layout.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-featured-collections | | | |
| --- | --- | --- | --- |
| label | Curated Collections |  |  |
| title | SHOP THE LOOK |  |  |
| view-link | [All Collections](/collections) |  |  |
| ![Tactical collection](https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80) | Spring 2026 - Men's | TACTICAL COLLECTION | [Shop Men's](/collections/mens) |
| ![Performance training](https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80) | Athletics & Training | PERFORMANCE TRAINING | [Shop Gear](/collections/training) |
| ![Home essentials](https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80) | Home & Living | FRESH HOME ESSENTIALS | [Shop Home](/collections/home) |

## Authoring Shape

Use a 4-column table.

Config rows:

| Config row key | Value location | Notes |
| --- | --- | --- |
| `label` | Column 2 | Optional eyebrow above the section title |
| `title` | Column 2 | Optional section headline |
| `view-link` | Column 2 | Must be authored as a real link |

Collection rows:

| Column | Purpose |
| --- | --- |
| Column 1 | Image |
| Column 2 | Collection tag |
| Column 3 | Collection title |
| Column 4 | CTA link |

The repo example also pairs this block with section metadata:

| section-metadata | |
| --- | --- |
| style | sec, sec-dark |

## Rendering And Behavior

- The first content row renders as the large lead card on the left.
- Only the second and third content rows render in the right-hand stack.
- Any authored content rows after the first three are ignored by the current implementation.
- `view-link` is only rendered when column 2 contains a real anchor.
- If a CTA cell does not contain a link, the card falls back to `#`.

## Common Gotchas

- Treat this as a three-card layout, not an unlimited card collection.
- Keep config rows at the top of the table so they are not mistaken for content rows.
- Use real images. The layout is heavily visual, and missing images weaken it quickly.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-featured-collections`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx featured collections |
| description | Editorial collection layout with one large feature card and two supporting cards. |
| searchtags | mcx, collections, featured, editorial, image cards, merchandising, layout |
