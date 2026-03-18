# Form MCCS Preferences

Three-step patron preference form for MCCS (Marine Corps Community Services), built as a self-contained DA.live block in the same authoring pattern as `form-4`.

## Overview

`form-mccs-preferences` captures military life context, shopping and recreation interests, and communication preferences in a single refined glassmorphic experience. The block uses a scarlet, gold, and navy palette, supports reduced motion, and ends in a client-side success state with an optional redirect countdown.

This block is intentionally UI-only in this repo. It does not post to a backend, mutate Commerce customer data, or dispatch profile events.

## Content Model

| Form MCCS Preferences |
| --- |
| Title text (optional, defaults to `Personalize / your MCCS experience`) |
| Subtitle text (optional) |
| Link to redirect page after submit (optional) |

- Row 1: Form heading. Use a newline to split the title across two lines.
- Row 2: Supporting copy beneath the title.
- Row 3: Optional link whose `href` becomes the success redirect destination.

## Steps and Fields

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

- Three-step progress rail with active and completed states
- Per-step validation before moving forward or submitting
- Step 3 submit button shows a lightweight loading state before success
- Success state summarizes key selections as chips
- Optional redirect countdown appears when a link is authored in row 3
- `prefers-reduced-motion` disables animation-heavy transitions

## Authoring and Mapping Notes

The block keeps semantic field names while using block-scoped DOM ids:

- `serviceStatus`
- `installation`
- `branch`
- `rankCategory`
- `childrenAges`
- `householdSize`
- `spouseService`
- `milestones`
- `shopCategories`
- `mwrInterests`
- `ticketInterests`
- `channels`
- `frequency`
- `fulfillment`
- `notes`

Service toggles use `svc_*` names (`svc_childcare`, `svc_financial`, and so on) so their intent stays easy to map downstream later if real submission is added.

## Files

```text
blocks/form-mccs-preferences/
├── form-mccs-preferences.js
├── form-mccs-preferences.css
├── _form-mccs-preferences.json
└── README.md
```
