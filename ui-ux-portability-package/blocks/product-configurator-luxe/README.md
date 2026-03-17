# Product Configurator Luxe

## Overview

`product-configurator-luxe` is a product-scoped, PDP-aware luxury configurator for
Bodea enclosure builds.

It keeps the standard product detail shell for gallery, header, and description,
but replaces the default PDP option/cart area once the configurator is ready.

## Authoring

This is a DA key-value block.

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `schema-url` | string | Yes | `/data/configurators/bodea-network-enclosure-luxe.json` | Relative JSON schema path for step structure, advisory controls, and accessory rules |
| `eyebrow-text` | string | No | `Bodea Configurator` | Small label above the heading |
| `title` | string | No | built-in title | Primary heading |
| `subtitle` | string | No | built-in subtitle | Supporting copy |
| `primary-cta-label` | string | No | `Add configured build` | Primary cart CTA text |
| `secondary-cta-label` | string | No | `Talk to a Bodea specialist` | Secondary consult CTA text |
| `secondary-cta-href` | string | No | `/contact` | Secondary CTA destination |
| `theme` | string | No | `emerald` | Accent palette (`emerald`, `gold`) |
| `presentation` | string | No | `default` | Visual/runtime mode (`default`, `rack-immersive`) |

## Runtime Behavior

1. Waits for `pdp/data` so it can map real Commerce options.
2. Loads the linked schema file from `data/configurators/`.
3. Silently skips rendering when the current product is incompatible with the schema.
4. Fetches accessory pricing for configured add-on SKUs.
5. Emits `pdp/configurator-ready` only after successful initialization, allowing `product-details` to hide its default configuration region and activate immersive summary mode when applicable.

## Schema Contract

The linked JSON schema supports:

- `id`
- `productTypes`
- `preview.mode`
- `steps[]`
- `steps[].controls[]`
- `addons[]`

Supported control sources:

- `commerce-option`
- `advisory-select`

Supported UI presentations:

- `card-grid`
- `segmented`
- `dropdown`
- `chips`

## Analytics

The block pushes these events to `adobeDataLayer` and `dataLayer` when available:

- `configurator_step_view`
- `configurator_option_change`
- `configurator_addon_toggle`
- `configurator_add_to_cart`
- `configurator_consult_click`

## Files

```text
blocks/product-configurator-luxe/
├── _product-configurator-luxe.json
├── product-configurator-luxe.css
├── product-configurator-luxe.js
├── product-configurator-luxe.utils.mjs
└── README.md
```
