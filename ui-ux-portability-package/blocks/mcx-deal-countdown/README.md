# MCX Deal Countdown

## Overview

The `mcx-deal-countdown` block renders the MCX urgency strip for limited-time campaigns. Authors provide the promotional copy, the countdown end time, and the CTA. The timer behavior is activated by `scripts/mcx-ui.js` on MCX pages and MCX block-library previews.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-deal-countdown | |
| --- | --- |
| label | Flash Sale - Limited Time |
| title | SPRING CLEARANCE UP TO 40% OFF |
| description | Exclusive deals across apparel, electronics, tactical gear, and more. Tax-free pricing for all authorized MCX patrons - active duty, veterans, retirees, and families. |
| end-datetime | 2026-04-01T23:59:59-07:00 |
| cta | [Shop All Deals](/deals) |
| cta-note | Do not miss out - deals expire when the timer hits zero. |
| ended-text | Ended |
| hide-cta-when-ended | false |

## Authoring Shape

Use a 2-column table.

| Field | Required | Purpose |
| --- | --- | --- |
| `label` | Yes | Small overline above the title |
| `title` | Yes | Large promotional headline |
| `description` | Yes | Supporting campaign copy |
| `end-datetime` | Yes | ISO 8601 timestamp used by the timer |
| `cta` | Yes | Primary call to action, authored as a real link |
| `cta-note` | No | Supporting note beside the CTA |
| `ended-text` | No | Replacement note after the countdown expires |
| `hide-cta-when-ended` | No | Set to `true` to hide the CTA after expiry |

## Rendering And Behavior

- The block stores `end-datetime`, `ended-text`, and `hide-cta-when-ended` in `data-*` attributes.
- `scripts/mcx-ui.js` finds `.mcx-deal-countdown .deal-strip` nodes and updates the timer every second.
- When the timer expires, all units are set to `00`.
- If `ended-text` is authored, the note text is replaced with that value after expiry.
- The CTA is only hidden when `hide-cta-when-ended` is the literal string `true`.
- If `end-datetime` cannot be parsed into a valid JavaScript `Date`, the timer stays static.

## Common Gotchas

- Always use a full ISO 8601 timestamp with timezone offset. That avoids date drift across preview environments.
- Author the CTA as a real link. Plain text will render a button that points to `#`.
- Remember that the countdown logic only runs when the MCX experience is active, meaning an `.mcx` page or an MCX library preview URL.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-deal-countdown`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx deal countdown |
| description | Promotional countdown strip with sales messaging, end datetime, CTA, and ended state. |
| searchtags | mcx, countdown, flash sale, urgency, deal, promo strip, timer, offer |
