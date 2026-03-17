# MCX Block Cookbook

## Purpose

This cookbook lists the reusable MCX storefront blocks, their authoring shape, and the example file that can be copied into DA.live.

## Block Inventory

| Block | Columns | Required content | Optional content | Example |
| --- | --- | --- | --- | --- |
| `mcx-announcement-bar` | 1 or 2 | announcement rows | `dismissible` config row | `docs/mcx-examples/mcx-announcement-bar.table.txt` |
| `mcx-hero` | 2 | eyebrow, heading lines, description, `image`, CTAs, KPI rows | `image-2+` carousel rows; legacy `status-badge-*` rows are tolerated but deprecated | `docs/mcx-examples/mcx-hero.table.txt` |
| `mcx-hero-newcomer` | 2 | eyebrow, heading lines, description, two CTAs | rank badges, quick links, intel panels, and KPI rows | `docs/mcx-examples/mcx-hero-newcomer.table.txt` |
| `mcx-ticker` | 1 | ticker items | `A|B` emphasis split per row | `docs/mcx-examples/mcx-ticker.table.txt` |
| `mcx-benefits` | 3 | icon key, title, subtitle | none | `docs/mcx-examples/mcx-benefits.table.txt` |
| `mcx-category-grid` | 4 | icon, name, count, link | leading `label` and `title` config rows | `docs/mcx-examples/mcx-category-grid.table.txt` |
| `mcx-product-cards` | 4 | image, brand/name cell, pricing cell, config cell | section label, title, view-link; legacy `tabs` and `default-tab` rows are tolerated but deprecated | `docs/mcx-examples/mcx-product-cards.table.txt` |
| `mcx-deal-countdown` | 2 | label, title, description, end-datetime, CTA | ended state text, hide CTA toggle | `docs/mcx-examples/mcx-deal-countdown.table.txt` |
| `mcx-promo-popup` | 2 | campaign-id, eyebrow, two heading lines, description, three offer pairs, end-datetime, coupon-code, two CTAs, fine-print | badge label, copy button label, trigger rows | `docs/mcx-examples/mcx-promo-popup.table.txt` |
| `mcx-promo-strip` | 2 | badge, title, description, CTA | none | `docs/mcx-examples/mcx-promo-strip.table.txt` |
| `mcx-featured-collections` | 4 | image, tag, title, CTA | label, title, view-link config rows | `docs/mcx-examples/mcx-featured-collections.table.txt` |
| `mcx-brands` | 1 | brand rows | none | `docs/mcx-examples/mcx-brands.table.txt` |
| `mcx-editorial-cards` | 4 | image, index, tag, title/description | none | `docs/mcx-examples/mcx-editorial-cards.table.txt` |
| `mcx-newsletter` | 2 | label, title, description, placeholder, button-text | note | `docs/mcx-examples/mcx-newsletter.table.txt` |

## Shell Fragments

| Fragment | Shape | Example |
| --- | --- | --- |
| `mcx-header` via `/fragments/mcx-nav` | 4 columns: `type`, `parent`, `label`, `value` | `docs/mcx-examples/mcx-nav.fragment.table.txt` |
| `mcx-footer` via `/fragments/mcx-footer` | 4 columns: `type`, `group`, `label`, `value` | `docs/mcx-examples/mcx-footer.fragment.table.txt` |

## Content Rules

- Shared storefront styling now follows the guided-selling conventions: dark-first surfaces, scoped custom properties on block roots, scarlet and gold token mapping, and tactical condensed and display typography.
- Keep rows to the declared shape. Do not add a fifth column.
- For `mcx-product-cards`, the fourth column is newline-delimited config: `category`, `flags`, `emoji`, `sizes`.
- For `mcx-product-cards`, the third column is newline-delimited pricing/rating config: `rating`, `reviews`, `price`, `original`, `chip`.
- For `mcx-hero`, `primary-cta` and `secondary-cta` should be authored as links in the value cell.
- For `mcx-hero`, `image` is the first slide and any additional carousel slides should be authored as `image-2`, `image-3`, and so on.
- For `mcx-promo-popup`, `campaign-id` should stay stable for the full life of the campaign so session suppression behaves predictably.
- For `mcx-promo-popup`, `description` and `fine-print` may contain inline formatting, but `end-datetime` still needs a full ISO 8601 timestamp with timezone offset.
- For `mcx-hero`, do not author `status-badge-*` rows for new content. Older content can keep them safely until cleanup.
- For `mcx-hero-newcomer`, `primary-cta` and `secondary-cta` should be authored as links in the value cell.
- For `mcx-hero-newcomer`, each quick-link or intel slot should be authored as a complete matched row set. Partial groups are skipped.
- For `mcx-hero-newcomer`, the ticker and benefits from the newcomer concept remain separate blocks, not bundled hero rows.
- For `mcx-product-cards`, do not author `tabs` or `default-tab` rows for new content. Older content can keep them safely until cleanup.
- For `mcx-category-grid`, `mcx-product-cards`, and `mcx-featured-collections`, section framing is handled by section metadata, not extra wrapper blocks.
- For `mcx-header` and `mcx-footer`, edit the fragments instead of the page body.
