# VIP Hero Block

## Overview

The `vip-hero-block` renders a premium members-only hero with two primary regions:
- left: headline, description, CTAs, and perks
- right: dashboard card and recent orders

It also includes a footer strip with three highlights and a right-side membership line.

All styles are mapped to the global premium green design tokens from `styles/styles.css`.

## DA.live Authoring Model

Author with a one-column table named `vip-hero-block` and 26 rows.

| Row | Field | Expected Value |
|---|---|---|
| 0 | Member Name | `David` |
| 1 | Member Tagline | `Private Member Access · Est. 1994` |
| 2 | Hero Number | `30` |
| 3 | Headline Line 1 | `Infrastructure` |
| 4 | Headline Line 2 Emphasis | `reserved` |
| 5 | Headline Line 3 Outline | `for few.` |
| 6 | Postscript | `Yours, exclusively.` |
| 7 | Description | Rich text |
| 8 | Primary CTA | Link |
| 9 | Secondary CTA | Link |
| 10 | Perk 1 | `value | label` |
| 11 | Perk 2 | `value | label` |
| 12 | Perk 3 | `value | label` |
| 13 | Perk 4 | `value | label` |
| 14 | Dashboard Eyebrow | Text |
| 15 | Dashboard Subline | Text |
| 16 | Metric 1 | `value | label | delta` |
| 17 | Metric 2 | `value | label | delta` |
| 18 | Metric 3 | `value | label | delta` |
| 19 | Order 1 | `po | meta | status | amount | tone` |
| 20 | Order 2 | `po | meta | status | amount | tone` |
| 21 | Order 3 | `po | meta | status | amount | tone` |
| 22 | Footer Item 1 | `icon | text` |
| 23 | Footer Item 2 | `icon | text` |
| 24 | Footer Item 3 | `icon | text` |
| 25 | Footer Right Text | `Member since 1994 · Enterprise Infrastructure Program · Dedicated concierge · Priority inventory access` |

`tone` values: `green`, `amber`, `blue` (falls back by row order if missing).

## Behavior

- Rows are parsed in order and transformed into a custom VIP layout.
- Rich text is supported for description and CTA authored links.
- Pipe-delimited values are parsed for perks, metrics, orders, and footer items.
- The decorative right-side SVG uses CSS class styling so token colors remain centralized in CSS.
- Reduced motion users get transition-free rendering.

## DA Library Metadata Table

Use this table in DA content for the block variant:

| library metadata | |
|---|---|
| name | vip hero block |
| description | Members-only enterprise hero with concierge perks, dashboard metrics, recent orders, and VIP footer highlights. |
| searchtags | vip, hero, b2b, private member, member dashboard, enterprise procurement, concierge service, priority inventory, account portal, premium access, key account, reserved sku |
