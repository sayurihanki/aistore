# MCX Hero Newcomer

## Overview

The `mcx-hero-newcomer` block is a newcomer-focused MCX hero variant. It keeps the tactical scarlet-and-gold visual language, but swaps the image carousel for an abstract command-surface layout with layered background motion, optional rank badges, quick links, right-side intel panels, two CTAs, and up to four stats.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-hero-newcomer | |
| --- | --- |
| eyebrow | New to Base · Start Here · Active Duty |
| heading-line-1 | WELCOME |
| heading-line-2 | ABOARD |
| heading-line-3 | your exchange, your way |
| description | Just got your orders? Your Marine Corps Exchange is already here for you. Tax-free shopping, PCS discounts, and everything you need to settle in - from uniforms to home essentials. This is day one. |
| primary-cta | [Get Started](#get-started) |
| secondary-cta | [Explore Deals](#explore) |
| rank-badge-1 | NEW TO BASE |
| rank-badge-2 | FIRST DUTY STATION |
| rank-badge-3 | CHECK-IN READY |
| quick-link-1-label | What's New |
| quick-link-1-href | #whats-new |
| quick-link-1-icon | clock |
| quick-link-1-tone | red |
| quick-link-2-label | PCS Deals |
| quick-link-2-href | #pcs-deals |
| quick-link-2-icon | deals |
| quick-link-2-tone | gold |
| quick-link-3-label | Uniforms |
| quick-link-3-href | #uniforms |
| quick-link-3-icon | shield |
| quick-link-3-tone | teal |
| quick-link-4-label | Find Your Store |
| quick-link-4-href | #store-locator |
| quick-link-4-icon | pin |
| quick-link-4-tone | red |
| intel-1-tag | First Stop |
| intel-1-value | Day One |
| intel-1-sub | Base essentials for your first week |
| intel-1-progress | 78 |
| intel-2-tag | PCS Support |
| intel-2-value | 30% Off |
| intel-2-sub | Welcome savings at your new exchange |
| intel-2-progress | 100 |
| intel-3-tag | Uniform Ready |
| intel-3-value | Ready Now |
| intel-3-sub | Grab service basics after check-in |
| intel-3-progress | 92 |
| intel-4-tag | Your Benefit |
| intel-4-value | Tax Free |
| intel-4-sub | Savings from your first stop on base |
| intel-4-progress | 100 |
| stat-1-value | 30% |
| stat-1-label | PCS Welcome Discount |
| stat-2-value | Tax Free |
| stat-2-label | Every Purchase |
| stat-3-value | 127+ |
| stat-3-label | Exchange Locations |
| stat-4-value | 24hr |
| stat-4-label | Express Pickup |

## Authoring Shape

Use a 2-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Field name |
| Column 2 | Field value |

Required fields:

| Field | Purpose |
| --- | --- |
| `eyebrow` | Tactical eyebrow above the headline |
| `heading-line-1` | First headline line |
| `heading-line-2` | Second headline line |
| `heading-line-3` | Third headline line |
| `description` | Supporting body copy |
| `primary-cta` | Primary CTA link |
| `secondary-cta` | Secondary CTA link |

Optional fields:

| Field Pattern | Purpose |
| --- | --- |
| `rank-badge-1` to `rank-badge-3` | Right-aligned status badges |
| `quick-link-N-label` | Quick-link title for slot `N` (`1..4`) |
| `quick-link-N-href` | Quick-link destination for slot `N` |
| `quick-link-N-icon` | Built-in icon key for slot `N` |
| `quick-link-N-tone` | Quick-link tone: `red`, `gold`, or `teal` |
| `intel-N-tag` | Small label on intel card `N` |
| `intel-N-value` | Large value on intel card `N` |
| `intel-N-sub` | Supporting intel copy on card `N` |
| `intel-N-progress` | Progress bar width for card `N` from `0` to `100` |
| `stat-N-value` | Stat value for slot `N` (`1..4`) |
| `stat-N-label` | Stat label paired with slot `N` |

Recognized quick-link icon keys:

| Authored value | Rendered icon |
| --- | --- |
| `clock`, `new`, `whats-new` | Clock / new arrivals |
| `deals`, `pcs-deals`, `wallet` | Deals / discount card |
| `shield`, `uniform`, `uniforms` | Shield / uniforms |
| `pin`, `store`, `store-locator`, `locator` | Location pin |

## Rendering And Behavior

- The block adds `mcx-hero-newcomer-section` to the containing section for full-bleed MCX framing.
- On MCX block-library preview URLs, if `heading-line-1` is missing, the block falls back to built-in newcomer demo content.
- Quick-link rows only render when both the matching label and href exist.
- Intel cards only render when the matching `tag`, `value`, and `sub` rows all exist. Progress values are clamped to `0..100` and invalid values fall back to `0`.
- Stat rows only render when both the value and label exist. Values that begin with a number animate from zero while preserving suffixes like `%`, `+`, or `hr`. Non-numeric values such as `Tax Free` stay static.
- Decorative motion is reduced automatically when `prefers-reduced-motion` is enabled.

## Common Gotchas

- Author `primary-cta` and `secondary-cta` as real links, not plain text URLs.
- Keep each optional quick-link or intel slot complete. Partial groups are skipped.
- `quick-link-N-tone` accepts only `red`, `gold`, or `teal`. Anything else falls back to `red`.
- `mcx-hero-newcomer` does not bundle the ticker or benefits bar from the mockup. Compose those separately with `mcx-ticker` and `mcx-benefits`.
- This block does not support `image` or `image-2+` rows.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-hero-newcomer`.
Do not paste the hero field rows into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx hero newcomer |
| description | Newcomer-focused tactical MCX hero with quick links, rank badges, intel panels, CTAs, and stats. |
| searchtags | mcx, hero, newcomer, onboard, tactical, quick links, pcs, active duty, banner |
