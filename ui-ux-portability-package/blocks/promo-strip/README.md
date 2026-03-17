# Promo Strip

## Overview

`promo-strip` is a theme-agnostic promotional banner block for short campaign moments, guided-selling entry points, and inline conversion nudges.

It is intentionally simple:

- one badge,
- one headline,
- one short description,
- one CTA,
- one optional theme tag for MCX-aligned colorways.

The default styling is neutral enough to work across page themes, while pages already using the MCX shell automatically pick up a more tactical scarlet-and-gold finish without changing the authoring contract.

## Live Example

| promo-strip | |
| --- | --- |
| badge | Guided Newcomer Experience |
| title | NEW TO CAMP PENDLETON? START HERE |
| description | Tell us what your first weeks look like and we will tailor shopping picks, family programs, and base-life suggestions to help you settle in faster. |
| cta | [Get My Suggestions](/personalize) |
| theme | scarlet-gold |

## Authoring Shape

Use a 2-column table.

| Field | Required | Purpose |
| --- | --- | --- |
| `badge` | Yes | Small campaign label above the headline |
| `title` | Yes | Primary promotional headline |
| `description` | Yes | Supporting copy below the headline |
| `cta` | Yes | Primary CTA, authored as a real link |
| `theme` | No | Optional colorway: `scarlet-gold`, `midnight-gold`, `coyote-tan`, `marine-teal`, or `steel-scarlet` |

## Rendering And Behavior

- The block renders inline in normal page flow and does not depend on homepage-specific order.
- The CTA is rendered as a single prominent link button with an arrow icon.
- Newlines in `title` or `description` are preserved.
- On MCX pages, the block keeps the same content model but swaps to `scarlet-gold` automatically when no `theme` row is authored.
- When `theme` is authored, the selected colorway applies on both MCX and non-MCX pages.

## Theme Options

Use the optional `theme` row when you want a specific MCX-style finish:

- `scarlet-gold`: the default MCX campaign look with scarlet, white, and gold.
- `midnight-gold`: deep navy command surface with gold CTA emphasis.
- `coyote-tan`: warm field-tone banner with dark copy and scarlet CTA.
- `marine-teal`: dark marine surface with teal energy and gold hover accents.
- `steel-scarlet`: gunmetal banner with scarlet depth and a bright CTA.

### Copy-Paste Theme Row

Add this extra row anywhere in the block:

| theme | scarlet-gold |

## Common Gotchas

- This is not the same block as `mcx-promo-strip`. Use `promo-strip` when you want a reusable banner that works outside the MCX-only block family.
- Keep description copy concise. The layout is tuned for a short promotional message, not a long paragraph.
- Use a real anchor in the `cta` cell. If no link is authored, the CTA falls back to `#`.
- Unsupported `theme` values are ignored and the block falls back to its page-default styling.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/promo-strip`.

| library metadata | |
| --- | --- |
| name | promo strip |
| description | Inline promo banner with badge, headline, description, CTA, and optional MCX theme variants. |
| searchtags | promo, banner, strip, campaign, cta, guided selling, personalization, mcx, theme, colorway |
