# MCX Homepage Authoring Runbook

## Scope

This runbook defines the authored composition for the MCX tactical homepage at `/index`, the shell fragments it depends on, and the copy-paste table files that content authors can use in DA.live.

The shared storefront theme now follows the same guided-selling conventions across MCX and shopper-facing flows: dark-default surfaces, scoped block tokens, scarlet and gold accents, and tactical display and condensed typography.

## Page Metadata For `/index`

Apply this metadata to the homepage document:

```text
metadata
template | mcx-home
theme | mcx
nav | /fragments/mcx-nav
footer | /fragments/mcx-footer
```

## Homepage Composition Order

Author the homepage in this exact order:

1. `mcx-announcement-bar`
2. `mcx-hero`
3. `mcx-ticker`
4. `mcx-benefits`
5. `section-metadata`
6. `mcx-category-grid`
7. `section-metadata`
8. `mcx-product-cards`
9. `mcx-deal-countdown`
10. `mcx-promo-strip`
11. `section-metadata`
12. `mcx-featured-collections`
13. `mcx-brands`
14. `mcx-editorial-cards`
15. `mcx-newsletter`

The shell is loaded separately through metadata:

1. `mcx-header`
2. main content blocks above
3. `mcx-footer`

## Copy-Paste Files

Use these files directly when building the page in DA.live:

- [Google Docs ready block sheet](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-google-docs-copy-paste.html)

- [index metadata](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/index-metadata.table.txt)
- [announcement bar](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-announcement-bar.table.txt)
- [hero](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-hero.table.txt)
- [ticker](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-ticker.table.txt)
- [benefits](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-benefits.table.txt)
- [category section metadata](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-category-grid.section-metadata.table.txt)
- [category grid](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-category-grid.table.txt)
- [product section metadata](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-product-cards.section-metadata.table.txt)
- [product cards](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-product-cards.table.txt)
- [deal countdown](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-deal-countdown.table.txt)
- [promo popup](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-promo-popup.table.txt)
- [promo strip](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-promo-strip.table.txt)
- [featured section metadata](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-featured-collections.section-metadata.table.txt)
- [featured collections](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-featured-collections.table.txt)
- [brands](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-brands.table.txt)
- [editorial cards](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-editorial-cards.table.txt)
- [newsletter](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-newsletter.table.txt)
- [nav fragment](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-nav.fragment.table.txt)
- [footer fragment](/Users/hanki/Jenifer%20GitHub%20repository/usmccsmymcx/docs/mcx-examples/mcx-footer.fragment.table.txt)

## Local Preview Fixtures

The repo now includes a full local preview harness:

- `/index.html` loads the MCX homepage as the local homepage entry.
- `/drafts/index.plain.html` contains the composed block body used by the preview harness.
- `/fragments/mcx-nav.plain.html` contains the MCX header fragment data.
- `/fragments/mcx-footer.plain.html` contains the MCX footer fragment data.

## Authoring Notes

- `mcx-hero` is explicit author content. No synthetic hero auto-blocking runs on MCX pages.
- `theme: mcx` is still the recommended authored switch for the MCX style package and shell.
- As a publish safety net, pages that contain authored `mcx-*` content blocks now auto-activate the MCX experience even if the page metadata missed `theme: mcx`. Keep the metadata on the page anyway so the intent stays explicit in DA.live.
- Generic `promo-strip` blocks are optional authored inserts. They are not part of the required MCX homepage base order and can be placed wherever the page narrative needs an inline promotion.
- `mcx-promo-popup` blocks are also optional authored inserts. They are not part of the required homepage base order and should be used sparingly for high-priority campaigns.
- Section styling for the category, product, and featured rows is controlled by the section metadata example files above.
- `mcx-header` and `mcx-footer` are shell blocks. Authors should edit the fragment docs, not inline blocks on the homepage.
- `mcx-hero` supports an image-only carousel. Author `image` for the first slide, then add `image-2`, `image-3`, and so on for additional slides.
- `mcx-hero` still accepts legacy `status-badge-*` rows for backward compatibility, but the redesigned hero no longer renders them. Do not add them to new docs.
- `mcx-product-cards` still accepts legacy `tabs` and `default-tab` rows for backward compatibility, but the redesigned product grid no longer renders tabs. Do not add them to new docs.
