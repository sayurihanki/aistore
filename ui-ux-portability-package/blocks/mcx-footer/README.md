# MCX Footer

## Overview

The `mcx-footer` block is the tactical MCX footer shell. Authors place the block on the page, but the real content comes from the fragment referenced by page metadata. If the fragment is missing or cannot be loaded, the block falls back to bundled demo footer data so previews still render.

## Live Example

`mcx-footer` is a shell block, so the authored source of truth is the footer fragment rather than inline block rows. The block preview can still render from built-in fallback data, but the real content shape is the fragment table below.

| mcx-footer-data | | | |
| --- | --- | --- | --- |
| config | brand | about | Serving Marines and their families since 1897. Tax-free shopping that returns 100% of profits to the Marine Corps community through MCCS programs and activities. |
| config | site | note | © 2026 Marine Corps Exchange (MCX) / MCCS. All rights reserved. Tax-free shopping for authorized DoD patrons. |
| config | site | flag | Proudly Serving Since 1897 |
| social | facebook | Facebook | https://www.facebook.com/ |
| social | instagram | Instagram | https://www.instagram.com/ |
| social | twitter | Twitter | https://www.x.com/ |
| social | tiktok | TikTok | https://www.tiktok.com/ |
| column | Shop | New Arrivals | /new |
| column | Shop | Men's | /mens |
| column | Shop | Women's | /womens |
| column | Services | Find a Store | /stores |
| column | Services | Gift Cards | /gift-cards |
| column | About MCX | Our Mission | /about |
| column | Support | Help Center | /help |
| legal |  | Privacy Policy | /privacy |
| legal |  | Terms of Use | /terms |
| legal |  | Cookie Policy | /cookies |
| legal |  | Accessibility | /accessibility |

## Authoring Shape

Place one `mcx-footer` block on the page, then point page metadata at the footer fragment:

| metadata | |
| --- | --- |
| footer | /fragments/mcx-footer |

Author the fragment itself as a 4-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Row type |
| Column 2 | Group |
| Column 3 | Label |
| Column 4 | Value or URL |

Supported fragment row types:

| Row type | Group usage | Label usage | Value usage |
| --- | --- | --- | --- |
| `config` | `brand` or `site` | Configuration key | Plain text value |
| `social` | Social icon key | Accessible label | Destination URL |
| `column` | Footer column heading | Link text | Destination URL |
| `legal` | Usually blank | Link text | Destination URL |

Supported `config` combinations:

| Type | Group | Label | Meaning |
| --- | --- | --- | --- |
| `config` | `brand` | `about` | Brand statement paragraph |
| `config` | `site` | `note` | Bottom legal note |
| `config` | `site` | `flag` | Small patriotic flag text appended after `USA` |

## Rendering And Behavior

- The block reads the page metadata key `footer` and fetches `${footerPath}.plain.html`.
- It looks for a `.mcx-footer-data` table inside the fetched fragment.
- If the fragment request fails or the fragment does not contain `.mcx-footer-data`, the block uses built-in default footer data.
- Social icon names are normalized from the `group` column. Supported built-ins are `facebook`, `instagram`, `twitter`, and `tiktok`.
- Unknown social keys fall back to the Facebook SVG icon, so keep the social keys intentional.

## Common Gotchas

- Edit the footer fragment, not the homepage block body. The block body is only a placement hook.
- Keep the fragment rows at four columns. The parser expects `type`, `group`, `label`, and `value`.
- Use actual URLs in column 4 for social, column, and legal rows. Plain text will still render as an `href`, but likely not the one you want.
- If preview content looks stale, double-check the page metadata path and confirm the fragment publishes to `.plain.html`.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-footer`.
Do not paste the fragment authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx footer |
| description | Tactical storefront footer with brand statement, link columns, social links, and legal links. |
| searchtags | mcx, footer, legal, social, links, shell, navigation, brand |
