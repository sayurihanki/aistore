# MCX Category Page

## Overview

The `mcx-category-page` block is the MCX-specific category landing experience for product discovery pages. It keeps the existing MCX shell, theme, header, and footer, but replaces the generic category body with a tactical layout that includes breadcrumb, hero, authored tabs, sticky Commerce facets, active-filter chips, sort controls, grid or list product views, and Commerce pagination. The page uses real Adobe Commerce product-discovery drop-ins for search state, filtering, sort, pagination, wishlist, and add-to-cart behavior while rendering a custom MCX card layout from the live search payload.

## Live Example

The table below is a real block instance so the block library page or preview page can render the actual authored shape.

| mcx-category-page | | | |
| --- | --- | --- | --- |
| category-id | 19 |  |  |
| urlPath | retail |  |  |
| eyebrow | Retail |  |  |
| title | Retail |  |  |
| description | Live Commerce results styled for the MCX tactical experience, built for training, off-duty, and everyday mission support. |  |  |
| hero-image | ![Apparel and footwear category hero](https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80) |  |  |
| hero-image-alt | Apparel and footwear category hero |  |  |
| tab | All |  |  |
| tab | Men's | categories | Men's |
| tab | Women's | categories | Women's |
| tab | Footwear | categories | Footwear |
| tab | Uniforms | categories | Uniforms & Cammies |

## Authoring Shape

Use a 4-column table.

Top-level config rows:

| Row key | Value location | Notes |
| --- | --- | --- |
| `urlPath` | Column 2 | Use this for a single Commerce category path. Required only when `category-id` is not authored. |
| `category-id` | Column 2 | Optional Commerce category ID for page identity. When `urlPath` is blank, its direct child category paths are resolved before the product search. |
| `eyebrow` | Column 2 | Optional small uppercase label in the hero. |
| `title` | Column 2 | Optional hero headline. Line breaks are preserved. |
| `description` | Column 2 | Optional hero supporting copy. |
| `hero-image` | Column 2 | Optional image cell rendered on the right side of the hero. |
| `hero-image-alt` | Column 2 | Optional alt text override for the hero image. |

Tab rows:

| Column | Purpose |
| --- | --- |
| Column 1 | Literal key `tab` |
| Column 2 | Visible tab label |
| Column 3 | Commerce filter attribute |
| Column 4 | Commerce filter value |

The first `All` tab should usually leave columns 3 and 4 empty so it only applies the base `urlPath` category filter. Additional tabs map to real Commerce filter clauses layered on top of the base category.

## Rendering And Behavior

- The block applies the authored `categoryPath=urlPath` filter when present. If it is blank, it uses the resolved child paths for `category-id`, plus the standard searchable visibility filter.
- Authored tabs are local category shortcuts that trigger a new product-discovery search and stay synchronized with the URL via the `tab` query parameter.
- Commerce facets, sort, and pagination remain real drop-ins; the block restyles them and keeps active filter chips outside the facet rail for the MCX presentation.
- Product cards use live search payload data for image, price, stock, product type, and option highlights. Simple products add directly to cart; complex products route to the PDP.
- Grid or list view is local to the page and is not written into the URL.
- If the Commerce environment cannot return category search results, the block surfaces the discovery error state rather than silently rendering an empty fake grid.

## Common Gotchas

- Use `urlPath` whenever the catalog has a direct searchable path (for example, `retail` for category ID 19). Use `category-id` on its own only for a parent category whose direct child paths should be included.
- Avoid tab filters that duplicate the base `categoryPath` clause. Prefer child category or facet attributes such as `categories`, `brand`, or other searchable attributes exposed by your catalog.
- Keep the block as the main authored body for the page. The MCX shell is supplied by page metadata and fragments, so do not add a second custom header or footer in the page body.
- Because the block uses live drop-ins, sort and facet interactions depend on the configured Commerce search index being available for the current store headers.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-category-page`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx category page |
| description | MCX tactical category page with live Commerce facets, sort, pagination, and custom product cards. |
| searchtags | mcx, category page, plp, product listing, commerce, filters, pagination, sort, hero, tactical |
