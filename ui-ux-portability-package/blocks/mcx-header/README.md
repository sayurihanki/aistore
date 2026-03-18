# MCX Header

## Overview

The `mcx-header` block is the tactical storefront header shell for the MCX experience. Like the footer, authors place the block on the page but manage the real navigation content through a fragment referenced in page metadata. If that fragment cannot be loaded, the block falls back to bundled demo navigation so previews still work.

## Live Example

`mcx-header` is a shell block, so the real authored source of truth is the nav fragment rather than inline block rows. The block preview can still render from built-in fallback data, but the real content shape is the fragment table below.

| mcx-nav-data | | | |
| --- | --- | --- | --- |
| config |  | search-placeholder | Search products, brands, gear... |
| config |  | sign-in-label | Sign In |
| config |  | sign-in-url | /account |
| hot |  | Deals & Offers | /deals |
| item |  | Shop All | /shop |
| item |  | Apparel & Footwear | /apparel-footwear |
| group | Apparel & Footwear | Men's |  |
| group | Apparel & Footwear | Women's |  |
| group | Apparel & Footwear | Footwear |  |
| link | Apparel & Footwear > Men's | Uniforms & Cammies | /mens/uniforms |
| link | Apparel & Footwear > Men's | T-Shirts & Polos | /mens/tops |
| link | Apparel & Footwear > Women's | Activewear | /womens/activewear |
| link | Apparel & Footwear > Footwear | Tactical Boots | /footwear/boots |
| feature | Apparel & Footwear | Clearance Apparel | /clearance/apparel |
| feature | Apparel & Footwear | Top Rated Boots | /boots |
| item |  | Electronics | /electronics |
| group | Electronics | Computers |  |
| link | Electronics > Computers | MacBooks & Laptops | /electronics/computers |
| feature | Electronics | Apple Products | /electronics/apple |

## Authoring Shape

Place one `mcx-header` block on the page, then point page metadata at the header fragment:

| metadata | |
| --- | --- |
| nav | /fragments/mcx-nav |

Author the fragment itself as a 4-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Row type |
| Column 2 | Parent item or group |
| Column 3 | Label |
| Column 4 | Value or URL |

Supported fragment row types:

| Row type | Purpose |
| --- | --- |
| `config` | Header-wide settings such as search placeholder and sign-in copy |
| `hot` | Single promo link displayed at the right side of the nav bar |
| `item` | Top-level nav item |
| `group` | Mega-menu column under a top-level item |
| `link` | Link inside a mega-menu group |
| `feature` | Highlighted tag-style link under a top-level item |

Supported `config` keys:

| Key | Meaning |
| --- | --- |
| `search-placeholder` | Search input placeholder text |
| `sign-in-label` | Sign-in button label |
| `sign-in-url` | Sign-in button destination |
| `hot-label` | Alternative alias supported through key normalization |
| `hot-url` | Alternative alias supported through key normalization |

For `link` rows, the `parent` column must use the exact format `Item > Group`.

## Rendering And Behavior

- The block reads the page metadata key `nav` and fetches `${navPath}.plain.html`.
- It looks for a `.mcx-nav-data` table inside the fragment.
- If the fragment request fails or the fragment does not contain `.mcx-nav-data`, the block uses bundled default nav data.
- Mega menus only render for items that have at least one authored `group`.
- The visible MCX search field now lazy-loads Adobe Commerce live search and shows real product previews, images, and prices directly in the header dropdown.
- The search field participates in the MCX keyboard shortcut from `scripts/mcx-ui.js`: `Ctrl+K` or `Cmd+K` focuses the input on MCX pages and MCX block-library previews.
- The cart button is wired to the demo drawer via `data-mcx-cart-toggle`.
- The first top-level nav item is marked active by default in the current implementation.

## Common Gotchas

- Edit the nav fragment, not the homepage block body.
- Keep `group` rows in place before the `link` rows that depend on them. The code will create missing items on the fly, but clear ordering makes authoring safer.
- Use the exact `Item > Group` parent syntax for `link` rows. Anything else will create the wrong structure.
- The header block is designed for MCX pages and MCX library previews. Search shortcuts, cart drawer behavior, and other shell interactions depend on the MCX runtime being active.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-header`.
Do not paste the fragment authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx header |
| description | Tactical storefront header with logo, search, account actions, cart count, and mega navigation. |
| searchtags | mcx, header, nav, mega menu, search, cart, account, shell |
