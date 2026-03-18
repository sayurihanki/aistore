# MCX Hero

## Overview

The `mcx-hero` block is the flagship MCX homepage hero. It supports a multi-line headline, tactical eyebrow, an image-only hero carousel, two CTAs, legacy status badge rows, and up to four KPI stats. On MCX block-library preview URLs, the block can fall back to built-in demo content when no authored 2-column table is present so the preview still renders.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-hero | |
| --- | --- |
| eyebrow | Spring Collection - 2026 - Tax-Free |
| heading-line-1 | OUTFITTED |
| heading-line-2 | FOR THE |
| heading-line-3 | mission & beyond |
| description | Serving Marines and their families since 1897. Premium brands, exclusive savings, and tax-free shopping - exclusively for those who serve. |
| image | ![Marine Corps collection hero](https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80) |
| image-2 | ![Tactical collection apparel](https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80) |
| image-3 | ![Performance training essentials](https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80) |
| primary-cta | [Shop Now](#products) |
| secondary-cta | [View Deals](#deals) |
| status-badge-1 | SYS: MCX-2026 |
| status-badge-2 | STATUS: ACTIVE |
| status-badge-3 | PATRON: AUTHORIZED |
| stat-1-value | 20%+ |
| stat-1-label | Average Savings |
| stat-2-value | 33M+ |
| stat-2-label | Yearly Transactions |
| stat-3-value | Tax Free |
| stat-3-label | Exclusive Benefit |
| stat-4-value | 127+ |
| stat-4-label | Store Locations |

## Authoring Shape

Use a 2-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Field name |
| Column 2 | Field value |

Supported fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `eyebrow` | Yes | Small tactical eyebrow above the headline |
| `heading-line-1` | Yes | First headline line |
| `heading-line-2` | Yes | Second headline line |
| `heading-line-3` | Yes | Third headline line |
| `description` | Yes | Supporting body copy |
| `image` | Yes | First hero image / slide |
| `image-2` to `image-N` | No | Additional hero carousel images in numeric order |
| `primary-cta` | Yes | Primary CTA link |
| `secondary-cta` | Yes | Secondary CTA link |
| `status-badge-1` to `status-badge-3` | No | Legacy rows tolerated for backward compatibility but not rendered |
| `stat-1-value` to `stat-4-value` | No | KPI values |
| `stat-1-label` to `stat-4-label` | No | KPI labels paired with the values |

## Rendering And Behavior

- The block adds `mcx-hero-section` to the containing section for MCX-specific styling.
- If the page is an MCX block-library preview URL and no authored `heading-line-1` exists, the block swaps in built-in demo field values.
- The `image` row becomes the first slide and any `image-2` to `image-N` rows become additional slides.
- Each authored hero image is converted into a responsive `picture` before rendering.
- When more than one image is authored, the block crossfades between slides, auto-rotates every 4.5 seconds, and lets users jump with the dot navigation.
- When only one image is authored, no dot navigation or autoplay is rendered.
- CTA rows are resolved as links; if a link is missing, the block falls back to the default CTA text and an empty destination.
- Legacy `status-badge-*` rows are still accepted in author content but are not rendered by the redesigned hero.
- KPI stats only render when both the value and matching label are present.

## Common Gotchas

- The `image` and any `image-2+` cells must contain real images, not pasted plain text.
- CTA cells should contain real links, not just URL text.
- If the hero preview appears empty outside the dedicated MCX library preview route, verify that the authored content is a true 2-column table. The fallback content only activates on the MCX library preview URL pattern.
- Keep additional carousel rows sequential when possible. `image`, `image-2`, and `image-3` is the clearest authoring pattern.
- Keep each stat as a matched value/label pair. A value without a label, or a label without a value, is skipped.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-hero`.
Do not paste the hero field rows into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx hero |
| description | Tactical MCX homepage hero with eyebrow, multi-line heading, image, two CTAs, status badges, and KPI stats. |
| searchtags | mcx, hero, tactical, homepage, military exchange, savings, tax free, kpi, banner, campaign |
