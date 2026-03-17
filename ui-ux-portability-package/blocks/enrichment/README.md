# Enrichment Block

## Overview

The `enrichment` block injects one or more fragment experiences based on product or category context.
It reads enrichment mappings from the `enrichment/enrichment` index and inserts matching fragment sections into the current page.

## Integration

### Block Configuration

| Configuration Key | Type | Default | Description | Required | Side Effects |
|---|---|---|---|---|---|
| `type` | string | `""` | Matching mode: `product` or `category` | Yes | Controls which filter key is used against enrichment index |
| `position` | string | `""` | Optional placement discriminator | No | Narrows matches by `positions` column in index |

### URL Parameters

None directly (product context depends on PDP SKU resolution from commerce helpers).

### Local Storage

None.

### Events

No direct event subscriptions or emissions.

## Behavior Patterns

### Page Context Detection

- **Product mode**: uses `getProductSku()` and matches against `products` in enrichment index.
- **Category mode**: locates `.block.product-list-page` and reads `data-category` (fallback block config), matching against `categories` in enrichment index.

### User Interaction Flows

1. Block reads `type`/`position` from authored config.
2. Index `enrichment/enrichment` is fetched.
3. Matching fragment paths are resolved and loaded.
4. Single-section fragment: block section inherits classes and content is inlined.
5. Multi-section fragment: sections are inserted after the current block section.
6. Enrichment wrapper is removed after processing.

### Error Handling

- Throws/logs descriptive errors for missing SKU, missing PLP block, or missing category.
- Catches all runtime errors and logs to console.
- Always removes enrichment wrapper in `finally` to avoid broken placeholders.
