# EZ Rack Builder Mockup

`ez-rack-builder-mockup` is a prototype-only luxury wizard block that recreates the cinematic EZ Rack builder flow without referencing a real product.

It is safe to place on any page, including a PDP, because it does not:

- call Commerce APIs,
- mutate PDP product configuration,
- emit immersive product-detail events,
- or add anything to cart.

## Authoring

This is a DA key-value block.

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `eyebrow-text` | string | No | `MarineShop · Awards Division` | Overline above the welcome title |
| `title` | string | No | `Welcome to the\nEZ Rack Builder` | Welcome headline. Newlines render as line breaks |
| `subtitle` | string | No | built-in subtitle | Supporting copy below the welcome title |
| `primary-cta-label` | string | No | `Start New Rack` | Primary welcome CTA label |
| `secondary-cta-label` | string | No | `Prototype Login` | Secondary welcome CTA label |
| `review-cta-label` | string | No | `Save Prototype Rack` | Final review CTA label |
| `prototype-note` | string | No | built-in note | Prototype-only note revealed from the welcome helper CTA and review CTA |

## Default Example

| ez-rack-builder-mockup | |
| --- | --- |
| eyebrow-text | MarineShop · Awards Division |
| title | Welcome to the\nEZ Rack Builder |
| subtitle | Assemble your ribbon rack, medal display, or full awards package in minutes. Our system automatically applies regulation precedence. Prototype mode keeps everything local to the block. |
| primary-cta-label | Start New Rack |
| secondary-cta-label | Prototype Login |
| review-cta-label | Save Prototype Rack |
| prototype-note | Prototype mode only. This block recreates the full luxury builder experience without connecting to Commerce, cart, or PDP configuration. |

## Behavior

- Renders a six-step mockup wizard:
  1. Welcome
  2. Branch
  3. Rack Type
  4. Rack Options
  5. Awards + Devices
  6. Review
- Uses local demo data for all branches, rack types, awards, devices, DD214 preload behavior, and review state.
- Keeps the experience self-contained inside the block with scoped CSS and local JS state.
- Reveals a prototype-only message on the final CTA instead of calling cart or PDP APIs.

## Copy-Paste Table

Use [`ez-rack-builder-mockup-table.txt`](ez-rack-builder-mockup-table.txt) as a starter DA block.
