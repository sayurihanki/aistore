# MCX Announcement Bar

## Overview

The `mcx-announcement-bar` block renders the slim scrolling utility bar used at the top of the MCX experience for shipping, eligibility, and seasonal campaign messages. It reads plain text rows, duplicates them for a continuous marquee effect, and can optionally add a dismiss button that removes the entire section from the page.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-announcement-bar | |
| --- | --- |
| dismissible | true |
| Free Shipping $50+ |  |
| Tax-Free Shopping - Authorized Patrons Only |  |
| Spring 2026 Collection - Now Live |  |
| Ship to Store: 3-5 Days Stateside |  |
| 100% of Profits Fund Marine Programs |  |

## Authoring Shape

Use a simple message table. Most rows are plain announcement rows. An optional config row can control whether the bar can be closed.

| Row type | Column 1 | Column 2 |
| --- | --- | --- |
| Optional config row | `dismissible` | `true` or `false` |
| Message row | Announcement copy | Leave blank |

Authoring rules:

- Add at least one message row or the marquee will render empty.
- If you use the `dismissible` row, the first cell must be exactly `dismissible`.
- Any `dismissible` value other than the literal string `false` keeps the close button enabled.
- The block uses `textContent`, so links, bold text, and other inline formatting are treated as plain text.

## Rendering And Behavior

- Every authored message is duplicated in the DOM so the marquee can loop without a visible gap.
- When `dismissible` is enabled, the close button removes the closest `.section`, not just the inner block wrapper.
- Empty message rows are ignored.
- The block is display-focused only; it does not persist dismissal state between page loads.

## Common Gotchas

- Do not author rich text expecting clickable links. The block only reads plain text from each cell.
- Keep the config row separate from the message rows. A line such as `dismissible false` in one cell will be treated as a message, not configuration.
- If the close button seems to remove too much content, place the announcement bar in its own section so only that section is removed.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-announcement-bar`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx announcement bar |
| description | Scrolling tactical announcement bar for shipping, savings, eligibility, and campaign messages. |
| searchtags | mcx, announcement, marquee, promo bar, shipping, tax free, eligibility, utility |
