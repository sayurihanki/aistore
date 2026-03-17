# MCX Promo Popup

## Overview

The `mcx-promo-popup` block renders the tactical MCX promotional modal used for short-term campaigns, offer codes, and urgency-driven merchandising moments. It is an MCX-only overlay block, not a generic popup system. Authors provide the campaign ID, visual copy, offer stats, countdown deadline, coupon code, and two CTAs through the same 2-column field-table pattern used by the rest of the MCX block library.

The block mounts its modal overlay onto `document.body`, keeps its behavior self-contained, and shows at most once per browser session for each authored `campaign-id`. On MCX block-library preview routes, the popup ignores session suppression and opens immediately so previews are always visible.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-promo-popup | |
| --- | --- |
| campaign-id | summer-pcs-sale-2026 |
| eyebrow | Summer PCS Sale |
| heading-line-1 | Settle In |
| heading-line-2 | For Less |
| description | New to base? Welcome aboard. Get an <strong>extra 20% off</strong> select home essentials, electronics, and tactical gear - on top of your <strong>tax-free savings</strong>. |
| badge-value | 20% |
| badge-label | Extra Off |
| offer-1-value | 20% |
| offer-1-label | Extra Discount |
| offer-2-value | $0 |
| offer-2-label | Sales Tax |
| offer-3-value | Free |
| offer-3-label | Ship to Store |
| end-datetime | 2026-07-31T23:59:59-07:00 |
| coupon-code | SEMPERFI20 |
| copy-button-text | Copy Code |
| primary-cta | [Shop the Sale](/deals) |
| secondary-cta | [Browse Deals](/clearance) |
| fine-print | * Valid on select categories through July 31, 2026. Cannot be combined with other offers. Available to authorized MCX patrons online and in store. |
| trigger | time |
| trigger-delay | 3 |
| trigger-scroll | 50 |

## Authoring Shape

Use a 2-column table.

| Column | Purpose |
| --- | --- |
| Column 1 | Field name |
| Column 2 | Field value |

Required fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `campaign-id` | Yes | Unique campaign key used for session-based suppression |
| `eyebrow` | Yes | Small campaign overline in the visual band |
| `heading-line-1` | Yes | First display headline line |
| `heading-line-2` | Yes | Second display headline line, rendered in the gold accent |
| `description` | Yes | Main promo copy beneath the hero band |
| `badge-value` | Yes | Large circular badge value, such as `20%` |
| `offer-1-value` to `offer-3-value` | Yes | Highlight values for the three offer cards |
| `offer-1-label` to `offer-3-label` | Yes | Labels paired with the three offer-card values |
| `end-datetime` | Yes | ISO 8601 timestamp with timezone for the live countdown |
| `coupon-code` | Yes | Code rendered in the coupon strip |
| `primary-cta` | Yes | Primary action link |
| `secondary-cta` | Yes | Secondary action link |
| `fine-print` | Yes | Terms and small-print content at the bottom of the modal |

Optional fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `badge-label` | No | Small text under the badge value; defaults to `Extra Off` |
| `copy-button-text` | No | Copy button label; defaults to `Copy Code` |
| `trigger` | No | Show mode: `time`, `scroll`, or `immediate`; defaults to `time` |
| `trigger-delay` | No | Delay in seconds for `time` trigger; defaults to `3` |
| `trigger-scroll` | No | Scroll percentage for `scroll` trigger; defaults to `50` |

## Rendering And Behavior

- The source block hides itself after decoration; the visible modal is rendered as a body-mounted overlay.
- Session suppression is keyed by `campaign-id` using `sessionStorage`, so the same campaign appears once per browser session.
- On MCX block-library preview routes, the block bypasses session suppression and forces the popup open immediately.
- `description` and `fine-print` preserve inline formatting and links from authored rich text.
- The primary and secondary CTAs render with the MCX tactical button styles and arrow icon treatment.
- The countdown updates every second until the authored `end-datetime` is reached, then all units remain at `00` and the label changes to `Offer Ended`.
- The coupon button uses the Clipboard API when available and falls back gracefully if direct copy is unavailable.
- The modal traps focus, closes on `Escape` and backdrop click, restores focus to the previously active element, and respects `prefers-reduced-motion`.

## Common Gotchas

- Always author a stable `campaign-id`. If it changes on every publish, the once-per-session behavior will feel broken to repeat visitors.
- Use a full ISO 8601 timestamp with timezone offset for `end-datetime`. Avoid date-only strings.
- Author `primary-cta` and `secondary-cta` as real links, not plain text.
- Keep the popup in its own authored section when possible. The block itself hides after decoration, so a shared section with unrelated content is not a good fit.
- The block is intentionally modal-only in this first version. Toasts, top banners, and experiment hooks are out of scope.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-promo-popup`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx promo popup |
| description | Tactical promotional modal with countdown, coupon code, offer cards, and two CTAs. |
| searchtags | mcx, popup, promo modal, campaign, countdown, coupon, overlay, tactical |
