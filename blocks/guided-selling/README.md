# Guided Selling

## Overview

`guided-selling` is a dedicated MCX-style guided shopping block with:

- a branded intro screen,
- a multi-step quiz with both single-select and multi-select questions,
- a loading/profile handoff,
- inline recommendation cards, category bands, and curated bundles.

It is intended for immersive DA-authored guided selling journeys where the surrounding visual treatment matters as much as the answer routing.

## Authoring

Use the block as a DA key-value block.

| Key | Purpose |
| --- | --- |
| `eyebrow` | Small intro badge above the hero title |
| `title` | Main intro title. `\n` renders as line breaks |
| `subtitle` | Supporting intro copy |
| `start-cta-label` | Button label on the intro screen |
| `results-cta-label` | Primary results CTA label |
| `results-cta-url` | Primary results CTA destination |
| `theme` | `dark` or `light` |
| `analytics-id` | Stable analytics/storage identifier |
| `data-source` | Repo-relative or `da.live` JSON path |

### Example block

| guided-selling | |
| --- | --- |
| eyebrow | AI-Powered Style Match |
| title | FIND YOUR\nPERFECT\nGEAR |
| subtitle | Answer 7 quick questions and we will build a personalized shopping list matched to your life, mission, and style. |
| start-cta-label | Start Finding My Style |
| results-cta-label | Shop All Recommendations |
| results-cta-url | /apparel |
| theme | dark |
| analytics-id | mcx-guided-selling |
| data-source | /data/guided-selling/mcx-style-match.json |

## Data Contract

Author the experience dataset as JSON under `data/guided-selling/*.json`.

Top-level keys:

- `id`
- `version`
- `progressSteps[]`
- `profiles{}`
- `steps[]`
- `loadingMessages[]`
- `results.cards[]`
- `results.categories[]`
- `results.bundles[]`

### Step shape

Each `steps[]` entry supports:

- `id`
- `category`
- `question`
- `description`
- `selectionMode`: `single` or `multi`
- `layout`: `card`, `slim`, or `image`
- `required`: optional, defaults to `true`
- `minSelections`: optional, mainly useful for optional multi-select steps
- `options[]`

Each option supports:

- `value`
- `icon`
- `label`
- `description`
- `tag`: optional small display chip
- `profileTag`: optional profile summary tag used in the results card

### Result item shape

Cards, categories, and bundles share the same core matching fields:

- `id`
- `matchAny[]`
- `matchAll[]` (optional)
- `score`
- `title`
- `description`
- `badge`
- `href`
- `image`
- `sku` (optional; informational only in v1)

Optional presentation fields used by the block:

- `ctaLabel`
- `price`
- `compareAt`
- `saving`
- `tags[]`
- `icon`

### Matching behavior

- `matchAll[]` must be fully satisfied for an item to qualify.
- `matchAny[]` is then used to score qualified items.
- Results sort by `score` descending, then by number of `matchAny[]` hits.
- If nothing matches, the block falls back to the highest-scoring authored items.

## Preview Fallback

When rendered on the DA library preview path for `guided-selling`, the block falls back to a built-in MCX sample experience if no `data-source` is authored or if the preview fetch fails.

The sample dataset is also published at:

- `/data/guided-selling/mcx-style-match.json`

## Storage

- Session progress: `sessionStorage`
- Saved profile action: `localStorage`

Both keys are namespaced by the authored `analytics-id`.
