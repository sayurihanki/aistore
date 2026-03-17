# EZ Rack Builder

`ez-rack-builder` is a PDP-native luxury configurator block for regulation-aware ribbon rack builds.

It is designed to sit directly on an EZ Rack product detail page, sync to live Adobe Commerce product options, and replace the generic configuration experience with a guided ceremonial build flow.

## Authoring

This is a DA key-value block.

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `sku` | string | Yes |  | Parent/product Commerce SKU used for cart submission |
| `schema-url` | string | Yes | `/data/configurators/ez-rack-builder-usmc.json` | Repo-relative JSON schema for branches, awards, rack types, devices, and import profiles |
| `eyebrow-text` | string | No | `Marine Corps Awards Division` | Overline shown on the welcome and step views |
| `title` | string | No | `Luxury EZ Rack Builder` | Welcome hero headline |
| `subtitle` | string | No | built-in subtitle | Welcome hero supporting copy |
| `primary-cta-label` | string | No | `Add configured rack to cart` | Review-step submit label |
| `secondary-cta-label` | string | No | `Talk to a specialist` | Secondary support CTA copy |
| `secondary-cta-href` | string | No | `/contact` | Secondary support CTA destination |
| `theme` | string | No | `scarlet-gold` | Visual theme for the block shell |
| `presentation` | string | No | `rack-immersive` | Emits immersive-ready payload for `product-details` |
| `dd214-mode` | string | No | `smart-stub` | Guided import mode for the DD214 affordance |

## Schema Contract

The linked JSON schema supports:

- `id`, `version`, `currency`, `width`
- `branches[]`: `id`, `label`, `status`, `icon`, `watermark`
- `rackTypes[]`: `id`, `label`, `description`, `commerceValue`, `preview`
- `options.spacing[]`, `options.alignment[]`, `options.assembly[]`
- `awards[]`: `id`, `branchId`, `label`, `precedence`, `gradient`, `category`, `searchTokens`, `deviceIds`
- `devices[]`: `id`, `label`, `type`, `max`, `symbol`
- `importProfiles[]`: `id`, `label`, `description`, `awardIds`
- `addons[]`: `id`, `label`, `description`, `sku`, `price`

Seed data is provided at `/data/configurators/ez-rack-builder-usmc.json`.

## Commerce Contract

The builder validates these exact selectable option titles on the Commerce product:

- `Rack Type`
- `Spacing`
- `Alignment`
- `Assembly`

It also validates these exact text/input option titles:

- `Rack Name`
- `Service Branch`
- `Awards Summary`
- `Builder Payload`

## Runtime Behavior

1. Waits for PDP product data from the current page.
2. Loads and normalizes the authored schema.
3. Validates the Commerce product contract before activating immersive mode.
4. Syncs selected rack options and entered payload fields into the PDP state.
5. Emits `pdp/configurator-ready` with `presentation: rack-immersive` once the builder is fully ready.
6. Adds the configured rack to cart through `@dropins/storefront-cart/api.js`.

## DD214 Smart Stub

The DD214 entry point is intentionally non-OCR in v1.

- Users can pick an authored import profile.
- Or close the sheet and continue with a manual build.
- Importing only pre-seeds awards into the rack; it does not parse files or call external services.

## Files

```text
blocks/ez-rack-builder/
├── README.md
├── _ez-rack-builder.json
├── ez-rack-builder.css
├── ez-rack-builder.js
├── ez-rack-builder.lib.js
└── ez-rack-builder.commerce.js
```
