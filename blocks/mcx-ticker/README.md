# MCX Ticker

## Overview

The `mcx-ticker` block renders the animated merchandising ticker used for short, repeatable highlights such as offers, brands, and service promises. Authors provide one line per ticker item, and the block duplicates those items to create a continuous scrolling track.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-ticker |
| --- |
| Free Shipping\|on $50+ |
| Tax-Free\|Shopping |
| Under Armour\|featured this week |
| New Arrivals\|every week |
| Apple\|products available |
| Save 20%+\|vs retail |

## Authoring Shape

Use a 1-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Ticker copy |

Formatting rule:

- If a row contains `A|B`, the text before the first pipe is emphasized in bold and the remainder is appended as regular text.
- If a row contains no pipe, the whole row is treated as the emphasized lead segment.

## Rendering And Behavior

- The block duplicates authored items so the scroll loop looks continuous.
- Empty rows are filtered out before rendering.
- The first pipe-delimited segment is wrapped in `<b>`.
- Remaining segments after the first pipe are joined back together with spaces.
- The scrolling motion is CSS-driven, and the track pauses on hover in the current stylesheet.

## Common Gotchas

- Use pipes only for emphasis splits, not for arbitrary separators.
- Links and rich text are not supported. The block reads plain text only.
- Because duplicated content is intentional, screen and visual QA should expect each item to appear twice in the rendered DOM.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-ticker`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx ticker |
| description | Animated merchandising ticker for rotating offers, featured brands, and service highlights. |
| searchtags | mcx, ticker, marquee, offers, brands, promo, scrolling text, utility |
