# Fragment Block

## Overview

The `fragment` block embeds content from another path by fetching `<path>.plain.html`, decorating it as local page content, and inserting the resulting sections.
It supports reusable cross-page composition patterns for EDS pages.

## Integration

### Block Configuration

No key-value config is required.
Authoring input is the fragment path provided via link href or text content.

### URL Parameters

None.

### Local Storage

None.

### Events

No direct event subscriptions or emissions.

## Behavior Patterns

### Page Context Detection

- Accepts paths starting with `/` and resolves them via `getRootPath()`.

### User Interaction Flows

1. Block resolves fragment path from `<a href>` or raw text.
2. Fetches `path.plain.html` and hydrates into temporary `<main>`.
3. Rewrites relative media references for fragment context.
4. Runs `decorateMain()` and `loadSections()` on fragment content.
5. Applies first fragment section classes to current section.
6. Replaces fragment block wrapper with fragment child nodes.

### Error Handling

- If path is invalid or fetch fails, returns `null` and leaves page stable.
- Null checks prevent replacement attempts when no section is found.
