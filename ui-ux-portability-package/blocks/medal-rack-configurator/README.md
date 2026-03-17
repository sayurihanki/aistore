# Medal Rack Configurator

`medal-rack-configurator` is a prototype-first luxury configurator block for a ceremonial medal rack PDP experience.

It renders a single two-column shell:

1. a live SVG medal-rack preview,
2. a premium control panel with size, wood, hardware, branch, inscription, and add-ons,
3. live prototype pricing with a detailed breakdown.

The block does **not** replace the native PDP purchase controls in v1 and does **not** submit to cart.

## Authoring

This is a DA key-value block.

| Key | Description |
| --- | --- |
| `data-source` | Repo-relative JSON path or published `da.live` JSON URL |
| `eyebrow` | Small overline above the title |
| `title` | Main heading. Newlines render as line breaks |
| `subtitle` | Supporting copy below the title |
| `primary-cta-label` | Demo CTA label shown above the prototype note |
| `prototype-note` | Inline message revealed when the CTA is clicked |

### Default example

| medal-rack-configurator | |
| --- | --- |
| data-source | /data/configurators/medal-rack-configurator.json |
| eyebrow | Service and Honor Collection |
| title | Officer Heritage\nMedal Rack |
| subtitle | Solid hardwood, hand-fitted hardware, engraved inscription, and a regulation-aware prototype preview for ceremonial display. |
| primary-cta-label | Review prototype pricing |
| prototype-note | Prototype mode only. This configurator previews the experience without adding anything to cart. Use the standard PDP purchase controls on this page for live checkout. |

## Copy-Paste Table

Use [`medal-rack-configurator-table.txt`](medal-rack-configurator-table.txt) for a starter DA block.

## Data Source Contract

The data source is JSON and contains:

- `id`, `version`, `currency`
- `pricing.base`, `pricing.engraving`, `pricing.mountKit`
- `defaults.size`, `defaults.wood`, `defaults.hardware`, `defaults.branch`, `defaults.inscription`
- `sizes[]`: `id`, `label`, `dimensions`, `cost`
- `woods[]`: `id`, `label`, `cost`, `gradientId`
- `hardware[]`: `id`, `label`, `cost`, `pinColor`, `plateColor`
- `branches[]`: `id`, `label`, `icon`, `watermark`
- `addons[]`: `id`, `label`, `description`, `price`, `icon`

Seed data is provided at `/data/configurators/medal-rack-configurator.json`.

## Behavior

- The block fetches authored JSON, normalizes it, and builds a prototype-only configurator.
- Pricing updates live from local block state only.
- The main CTA reveals an inline prototype note and never calls Commerce APIs.
- The block is intended to coexist with native PDP purchase controls elsewhere on the page.

## Failure States

- Invalid or missing `data-source` renders an inline block error.
- Bad JSON payloads fall back to the block-level error state and stop initialization.
