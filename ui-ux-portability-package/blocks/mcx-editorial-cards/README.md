# MCX Editorial Cards

## Overview

The `mcx-editorial-cards` block renders the large story-driven card grid used for editorial merchandising and supporting content on MCX landing pages. Each row becomes one image card with an index, a tag, a headline, and a description.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-editorial-cards | | | |
| --- | --- | --- | --- |
| ![Uniform guide](https://images.unsplash.com/photo-1565462905350-4a1b2a4b3a8a?w=600&q=80) | 01 | Uniform Guide | Everything You Need for Inspection-Ready Dress Blues<br>A complete guide to proper uniform wear, care, and every authorized item at MCX - from ribbons to shoes. |
| ![Fitness gear](https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80) | 02 | Fitness | Top PT Gear to Crush Your PFT Score This Year<br>Our experts selected the best running shoes and training gear built for the demands of Marine physical training. |
| ![Family home](https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80) | 03 | Family Living | Set Up Your New BAH Home Without Breaking the Bank<br>Smart buys for furnishing and equipping your first home - all tax-free and ready to ship to your nearest MCX. |

## Authoring Shape

Use a 4-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Image |
| Column 2 | Index or sequence label |
| Column 3 | Tag or category label |
| Column 4 | Multi-line content |

Column 4 rules:

- The first line becomes the card title.
- Every later line is joined into one description string.
- A hard line break or copied `<br>` is fine as long as the content becomes multiple text lines in the cell.

## Rendering And Behavior

- Each row becomes one `.ed-card`.
- If column 1 contains an image, it is converted into a responsive `picture`.
- The block does not create links or CTA buttons.
- The index in column 2 is freeform text, so authors can use `01`, `Step 1`, `Guide`, or similar if the design calls for it.

## Common Gotchas

- Do not expect column 4 to preserve rich multi-paragraph structure. Everything after the first line is flattened into a single description.
- If you need clickable cards, extend the block first. No destination URL is supported by default.
- Use real images whenever possible. Text-only cards work, but the design is clearly image-led.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-editorial-cards`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx editorial cards |
| description | Large editorial image cards with index number, tag, headline, and supporting copy. |
| searchtags | mcx, editorial, cards, stories, content, campaign, feature grid |
