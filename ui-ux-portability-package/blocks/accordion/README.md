# Accordion Block

## Overview

The Accordion block converts authored rows into semantic `<details>` accordion items with a clickable `<summary>` label and expandable body content.

## Configuration

- **Row structure**: Each row must contain two cells.
- **Cell 1 (label)**: Rendered inside `<summary class="accordion-item-label">`.
- **Cell 2 (content)**: Rendered inside `<div class="accordion-item-body">`.
- **Open state**: Controlled natively by the browser through the `<details open>` attribute.

### Optional block classes

- `full-details`: Applies the tighter PDP-style “Full Details” visual treatment.
- `single-open`: Enhances the block so only one accordion item stays open at a time.

Use the standard Accordion block authoring flow. If your authoring surface supports Franklin block options, the block name can be written as:

```text
accordion (full-details, single-open)
```

If block options are not exposed in your DA/EDS authoring UI, apply the same classes to the rendered block wrapper through the repo’s normal class-setting workflow.

## Integration

- No URL parameter handling.
- No `localStorage` usage.
- No custom event dispatch.
- `single-open` uses internal `toggle` listeners on decorated `<details>` elements.
- Works as a content-only EDS block using `_accordion.json`.

## Behavior Patterns

1. During decoration, each source row is replaced with:
   - `<details class="accordion-item">`
   - `<summary class="accordion-item-label">...</summary>`
   - `<div class="accordion-item-body">...</div>`
2. Users click/tap the summary to expand/collapse each item.
3. Multiple items can be opened at the same time by default.
4. When the block has `single-open`, opening one item closes the other open items in the same block.

## Visual Behavior

- Uses rounded glassmorphism styling to match Tabs:
  - translucent panel background
  - soft blur and border
  - accent hover/open states
  - animated chevron rotation
- `full-details` changes the block to a tighter PDP-style treatment:
  - smaller card radius and spacing
  - boxed plus icon that rotates in the open state
  - lighter spec-table styling inside the content area
  - automatic conversion of simple `Label: Value` lines into a 2-column specs table

## Authoring Example

The block still uses the standard 2-column accordion contract: summary in column 1, rich content in column 2.

```text
| accordion (full-details, single-open) | |
| --- | --- |
| Dimensions & Physical | <table><tr><td>External Height</td><td>2,000 mm (78.7")</td></tr><tr><td>External Width</td><td>600 mm (23.6")</td></tr><tr><td>External Depth</td><td>1,000 mm (39.4")</td></tr></table> |
| Power & Electrical | <p>Managed PDU option supports SNMP v3 / SSH / REST API.</p><table><tr><td>PDU Input Voltage</td><td>100-240 V AC, 50/60 Hz</td></tr><tr><td>Outlet Types</td><td>IEC C13 x 18, IEC C19 x 6</td></tr></table> |
```

Rich body content can include:

- paragraphs
- lists
- links
- inline HTML tables, including 2-column label/value spec tables

### Google Docs-friendly `full-details` shortcut

When the block has the `full-details` class, the body can also be authored as simple lines instead of a nested HTML table:

```text
External Height: 2,000 mm (78.7")<br>
External Width: 600 mm (23.6")<br>
External Depth: 1,000 mm (39.4")<br>
Internal Width: 482.6 mm (19.0" EIA-310)
```

If the body is simple `Label: Value` content separated by `<br>` or paragraph-style line breaks, the block converts it into the same lined 2-column specs layout at runtime.

## Error Handling

- If a row does not have both expected cells, behavior is undefined and may fail during decoration.
- Empty labels or empty body content still render and remain interactable.
