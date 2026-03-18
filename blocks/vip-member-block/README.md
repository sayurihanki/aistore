# VIP Member Block

## Overview

`vip-member-block` is a standalone promotional commerce block for VIP or elite member experiences.

It renders a premium account-facing layout with:

1. A headline and summary area.
2. A featured offer card with pricing and CTA links.
3. A benefits grid, spotlight product list, account metrics panel, and proof strip.

The block is fully authored from block rows and does not fetch runtime commerce data.

## Authoring Contract

The implementation reads a single-column authored block and maps rows by fixed index.

| Row | Content |
|---|---|
| `0` | `eyebrowText` |
| `1` | `title` rich text (`<em>` supported for accent text) |
| `2` | `subtitle` |
| `3..5` | Header stats as `value | label` |
| `6` | Featured label |
| `7` | Featured discount as `value | label` |
| `8` | Featured category |
| `9` | Featured title |
| `10` | Featured description |
| `11` | Featured pricing as `member | was | tag` |
| `12` | Featured primary CTA link |
| `13` | Featured secondary CTA link |
| `14..17` | Benefit items as `title | desc | linkText | linkUrl` |
| `18` | Spotlight label |
| `19` | Spotlight count |
| `20..22` | Spotlight items as `name | meta | memberPrice | wasPrice` |
| `23` | Spotlight footer text |
| `24` | Spotlight footer link |
| `25` | Account name |
| `26` | Account org |
| `27..30` | Account metrics as `value | label | delta | green?` |
| `31..33` | Action rows as `label | badge?` |
| `34..36` | Proof items as `title | sub` |
| `37` | Proof CTA link |
| `38` | Proof CTA supporting text |

## Behavior

The block decorates authored rows into a fixed premium layout with responsive breakpoints.

Behavior details:

1. Missing rows fall back to built-in default copy so the block still renders.
2. CTA rows use authored anchor tags when present.
3. Spotlight items and account action rows expose keyboard support for `Enter` and `Space`.
4. The block sets `role="region"` with the label `VIP member offers`.

## Integration Notes

This block does not depend on URL parameters, local storage, or storefront event-bus events.

It is a presentational authored block only:

1. No network requests.
2. No customer-session checks.
3. No persisted client-side state.

## Error Handling and Fallbacks

The implementation is intentionally defensive:

1. Missing authored rows resolve to default text or empty sections.
2. Missing links fall back to placeholder `#` targets or button-style affordances.
3. Empty repeatable rows are skipped instead of throwing.

If the authored structure changes from the expected row order, content may appear in the wrong place because the block relies on row indexes rather than named fields.
