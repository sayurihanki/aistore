# Form MCCS Preferences Next

Tactical-luxury sibling block for the MCCS patron preference intake, built as a self-contained DA.live block with the same 3-step behavior and authoring contract as `form-mccs-preferences`.

## Overview

`form-mccs-preferences-next` keeps the existing MCCS preference flow intact while recasting the experience as a darker, more premium two-panel shell. The left rail acts as the briefing panel and progress tracker, while the right rail presents the active form card and success state.

This block is intentionally UI-only in this repo. It does not submit to a backend, mutate Commerce customer data, or dispatch profile events.

## Content Model

| Form MCCS Preferences Next |
| --- |
| Title text (optional, defaults to `Personalize / your MCCS experience`) |
| Subtitle text (optional) |
| Link to redirect page after submit (optional) |

- Row 1: Form heading. Use a newline to split the title across two lines.
- Row 2: Supporting copy beneath the title.
- Row 3: Optional link whose `href` becomes the success redirect destination.

## Steps and Fields

The field set, semantic `name` attributes, and validation rules match `form-mccs-preferences`.

### Step 1 - Military Life

- Service status (required radio pills)
- Primary installation (required select)
- Branch (optional select)
- Rank category (optional select)
- Children in household (optional checkbox pills)
- Household size (optional select)
- Spouse on active duty (optional select)
- Upcoming milestones (optional checkbox pills)

### Step 2 - Shopping and Recreation

- MCX shopping interests (optional checkbox pills)
- Recreation interests (optional checkbox pills)
- Tickets and events (optional checkbox pills)
- Life service toggles for childcare, financial readiness, education, career transition, relocation, and counseling

### Step 3 - Communication

- Preferred channels (required checkbox pills)
- Message frequency (optional radio pills)
- Preferred fulfillment (optional radio pills)
- Additional notes (optional textarea with counter)
- Privacy consent (required checkbox)

## Behavior

- Same step validation copy and progression as `form-mccs-preferences`
- Desktop two-panel shell with briefing rail and active form card
- CSS-only atmospheric treatment with tactical grid, blooms, and glass layers
- Success state with the same summary-chip logic and optional redirect countdown
- `prefers-reduced-motion` disables non-essential motion

## Files

```text
blocks/form-mccs-preferences-next/
|- form-mccs-preferences-next.js
|- form-mccs-preferences-next.css
|- _form-mccs-preferences-next.json
`- README.md
```
