# MCX Newsletter

## Overview

The `mcx-newsletter` block renders the centered email signup panel used for insider deals and community updates. It is intentionally lightweight: the form UI is real, but submission is demo behavior handled by `scripts/mcx-ui.js` unless a backend integration is added later.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only showing field names.

| mcx-newsletter | |
| --- | --- |
| label | Stay in the Loop |
| title | GET EXCLUSIVE DEALS |
| description | Early access to MCX deals, new arrivals, and Marine community news. Reserved for authorized patrons - because you have earned these benefits. |
| placeholder | Your military email address... |
| button-text | Subscribe |
| note | AUTHORIZED PATRONS ONLY - UNSUBSCRIBE ANYTIME - NO SPAM |

## Authoring Shape

Use a 2-column table.

| Field | Required | Purpose |
| --- | --- | --- |
| `label` | Yes | Small section eyebrow |
| `title` | Yes | Main signup headline |
| `description` | Yes | Supporting copy under the title |
| `placeholder` | Yes | Input placeholder text and input `aria-label` |
| `button-text` | No | Submit button text. Defaults to `Subscribe` |
| `note` | No | Small note under the form |

## Rendering And Behavior

- The block turns the authored fields into a form marked with `data-mcx-newsletter="true"`.
- On MCX pages and MCX library previews, `scripts/mcx-ui.js` intercepts submit, shows a success toast, and resets the form.
- No network request, ESP integration, or persistence is built in yet.
- The email input uses browser-native `type="email"` behavior, but there is no custom validation messaging beyond the browser default.

## Common Gotchas

- Treat the current form behavior as demo UX, not production lead capture.
- Because `placeholder` is also used for the input `aria-label`, write it as meaningful instructional text.
- If submit does nothing in a custom environment, verify that the MCX runtime is active. The demo submit handler only initializes on MCX pages and MCX block-library previews.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/mcx-newsletter`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | mcx newsletter |
| description | Centered email capture block for exclusive deals, launch updates, and community messaging. |
| searchtags | mcx, newsletter, signup, email, deals, subscribe, crm, form |
