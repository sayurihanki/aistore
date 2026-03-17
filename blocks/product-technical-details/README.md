# Product Technical Details

`product-technical-details` renders the lower PDP experience for the immersive rack variant:

1. Technical Specifications card grid
2. Optional Key Features list
3. Full Details accordion with specification tables

## Authoring

This block supports two authoring styles:

1. `data-source` JSON
2. Inline Google Docs-style rows in the block table

| Key | Description |
| --- | --- |
| `data-source` | Optional repo-relative JSON path or published `da.live` JSON URL |
| `presentation` | `default` or `rack-immersive` |
| `enable-parallax` | `true` or `false`; defaults to `true` |

If inline spec/detail rows are authored in the block table, they take precedence over `data-source`.

## Runtime behavior

- In `default` presentation, the block renders as soon as PDP data and the JSON data source are available.
- In `rack-immersive` presentation, the block stays hidden until `pdp/configurator-ready` is emitted with `presentation: rack-immersive`.
- Specification values resolve from Commerce attributes when possible, then fall back to authored values.
- The accordion is single-open and keyboard accessible.
- Parallax and reveal motion are disabled for reduced-motion users and narrow viewports.

## JSON contract

```json
{
  "specsTitle": "Technical Specifications",
  "featuresTitle": "Key Features",
  "detailsTitle": "Full Details",
  "specCards": [
    {
      "icon": "U",
      "label": "Rack Height (EIA-310)",
      "attribute": "rack_height",
      "fallbackValue": "42",
      "unit": "U"
    }
  ],
  "features": [
    {
      "title": "Hot-Swap Rails",
      "description": "Tool-free slide-rail mounting."
    }
  ],
  "detailsSections": [
    {
      "title": "Dimensions and Physical",
      "open": true,
      "rows": [
        {
          "label": "External Height",
          "value": "2,000 mm (78.7 in)"
        }
      ]
    }
  ]
}
```

## Google Docs Table Authoring

You can author the full dataset directly in the block table with rows like this:

```text
| product-technical-details | | | | | |
| presentation | rack-immersive | | | | |
| enable-parallax | true | | | | |
| specs-title | Technical Specifications | | | | |
| spec-card | U | Rack Height (EIA-310) | rack_height | 42 | U |
| spec-card | LOAD | Static Load Capacity | static_load_capacity | 1500 | kg |
| features-title | Key Features | | | | |
| feature | Hot-Swap Rails | Tool-free slide-rail mounting for standard 1U to 4U equipment. | | | |
| feature | Cable Entry Brush Strips | Top, bottom, and rear cable entry points with controlled passthrough. | | | |
| details-title | Full Details | | | | |
| detail-section | Dimensions and Physical | true | | | |
| detail-row | External Height | 2,000 mm (78.7 in) | | | |
| detail-row | External Width | 600 mm (23.6 in) | | | |
| detail-row | Operating Temperature | 0-45 deg C | operating_temperature | | |
| detail-section | Power and Electrical | false | | | |
| detail-row | Max Current (Single Feed) | 16 A at 230 V | | | |
```

Column meaning:

- `spec-card`: `type | icon | label | attribute | fallback value | unit`
- `feature`: `type | title | description`
- `detail-section`: `type | section title | open`
- `detail-row`: `type | label | value | attribute`
