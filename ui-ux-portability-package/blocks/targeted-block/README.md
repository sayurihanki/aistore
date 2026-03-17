# Targeted Block

## Overview

The `targeted-block` displays authored content only when the current shopper matches the block's targeting rules.

It supports customer-group targeting, customer-segment targeting, optional cart-rule targeting, and a `type` key that prevents multiple matching blocks of the same type from showing at once. When several matching blocks share the same `type`, only the first matching block in document order is shown.

Content can be authored inline or loaded from a fragment path.

## Authoring Model

The DA.live model exposes these primary fields:

| Field | Purpose |
|-------|---------|
| `content` | Inline content rendered inside the block when no fragment is configured |
| `customerGroups` | Comma-separated list of customer-group IDs |
| `customerSegments` | Comma-separated list of customer-segment IDs |
| `type` | Optional grouping key used to enforce "first visible match wins" behavior |
| `fragment` | Optional fragment path to load instead of inline content |

The implementation also supports a `cart-rules` config key when authored in the block config.

## Configuration Rules

### `customerGroups`

- Provide a comma-separated list of group identifiers.
- Values are trimmed, empty entries are ignored, and each ID is base64-encoded before matching.
- Group matching succeeds when either:
  - the hashed `auth/group-uid` event payload matches one of the authored groups, or
  - the runtime personalization `groups` array contains one of the authored groups.

### `customerSegments`

- Provide a comma-separated list of segment identifiers.
- Values are trimmed, empty entries are ignored, and each ID is base64-encoded before matching.
- If at least one authored segment matches the runtime personalization `segments` array, the segment condition passes.

### `cart-rules`

- Optional comma-separated list of cart-rule identifiers.
- Values are normalized the same way as segments and groups.
- If present, at least one authored rule must match the runtime personalization `cartRules` array.

### `type`

- Optional deduplication key for related targeted experiences.
- Blocks with different `type` values do not affect each other.
- Blocks with the same `type` are evaluated in DOM order, and only the first eligible block remains visible.

### `fragment`

- When set, the block loads content from the fragment path using the fragment block loader.
- When not set, the block uses the last authored child inside the block as its content source.

## Runtime Integration

The block reevaluates visibility whenever personalization state changes.

### Runtime sources

| Source | Usage |
|--------|-------|
| `getPersonalizationData()` | Reads runtime `groups`, `segments`, and `cartRules` |
| `events.lastPayload('auth/group-uid')` | Reads the latest hashed group identifier |
| `authenticated` event | Triggers a visibility refresh |
| `auth/group-uid` event | Triggers a visibility refresh when the shopper's group becomes known |
| `personalization/updated` event | Triggers a visibility refresh when personalization data changes |

The block updates visibility by toggling:

- the native `hidden` property
- `aria-hidden`

## Visibility Logic

A block is eligible when all configured targeting conditions pass:

1. Customer groups match, or no groups are configured.
2. Customer segments match, or no segments are configured.
3. Cart rules match, or no cart rules are configured.

After eligibility is calculated, `type`-based deduplication is applied. If an earlier eligible block with the same `type` is already visible, later matching blocks of that `type` are hidden.

## Behavior Notes

- Empty or whitespace-only IDs are ignored during normalization.
- Group hashes are normalized to lowercase before comparison.
- The block keeps authored content in the DOM and only changes visibility; it does not rerender through the storefront personalization container.
- If a fragment is configured, the loaded fragment content is wrapped in a container and replaces the block's original children.

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| Block never appears | No authored targeting values match runtime personalization data | Verify the authored IDs and confirm the expected `authenticated`, `auth/group-uid`, or `personalization/updated` events are firing |
| Later targeted block with same `type` stays hidden | An earlier matching block with the same `type` is already visible | Use unique `type` values when blocks should be able to appear together |
| Fragment content does not show | Fragment path is missing or fails to load | Verify the fragment path and publish/accessibility of the fragment content |
| Group targeting does not match | Auth payload hash does not correspond to authored group IDs | Confirm the source group IDs are correct and encoded from the expected raw values |

## Testing Checklist

- Verify inline-content rendering when `fragment` is not set.
- Verify fragment rendering when `fragment` is set.
- Verify a shopper with no matching criteria does not see the block.
- Verify a shopper with matching group, segment, or cart-rule data sees the block.
- Verify only the first eligible block per shared `type` is shown.
- Verify visibility updates after `authenticated`, `auth/group-uid`, and `personalization/updated` events.
