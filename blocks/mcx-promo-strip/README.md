# MCX Promo Strip

## Overview

The `mcx-promo-strip` block renders the full-width campaign banner used for large seasonal or clearance messaging on MCX pages. It is intentionally simple: badge, title, description, and one CTA.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-promo-strip | |
| --- | --- |
| badge | Spring 2026 - Limited Time |
| title | EARN MORE, SPEND LESS |
| description | Every purchase supports Marine Corps Community Services. You have earned these benefits - shop smarter, save more, and give back to the community that has your back. |
| cta | [Shop Clearance](/clearance) |

## Authoring Shape

Use a 2-column table.

| Field | Required | Purpose |
| --- | --- | --- |
| `badge` | Yes | Small campaign label |
| `title` | Yes | Large banner headline |
| `description` | Yes | Supporting promo copy |
| `cta` | Yes | Primary CTA, authored as a real link |

## Rendering And Behavior

- The block renders one CTA button with an arrow icon.
- If the CTA cell does not contain a real anchor, the button falls back to `#`.
- Decorative background lines are visual only and not authorable.
- Reveal classes are applied for MCX scroll-in motion when the MCX runtime is active.

## Common Gotchas

- There is no secondary CTA or image slot in this block.
- Keep the description concise. The layout is designed for punchy campaign copy, not dense paragraphs.
- Use a real link for `cta`; plain text will still produce a button, but not the intended destination.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-promo-strip`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx promo strip |
| description | Full-width campaign banner with badge, large headline, supporting copy, and CTA. |
| searchtags | mcx, promo strip, banner, campaign, clearance, marketing, full width |
