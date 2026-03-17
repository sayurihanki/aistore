# Form 2

A luxury dark/gold contact form with floating labels, inline validation, a simulated submission loading state, and an animated success screen.

## Configuration

The block reads up to two rows from the authored table:

| Row | Purpose | Default |
|-----|---------|---------|
| 1 | Form title | Get in touch |
| 2 | Subtitle text | Send us a message and we'll respond within one business day. |

Both rows are optional — sensible defaults are used when omitted.

## Fields

All fields are built-in (no external JSON required):

- **First name** — text, required, floating label
- **Last name** — text, required, floating label
- **Email address** — email, required, floating label
- **Phone number** — tel, optional, floating label
- **Topic** — select dropdown (General inquiry, Partnership, Press & media, Technical support, Careers)
- **How did you find us?** — radio pill group (Search engine, Social media, Referral, Event / Conference, Other)
- **Message** — textarea, required
- **Privacy consent** — checkbox, required
- **Send Message** — submit button with arrow icon

## Behavior

1. Fields animate in with a staggered entrance on load.
2. Floating labels rise and shrink on focus or when the field has a value.
3. On blur, each field is validated — invalid fields show a red border and error message; valid filled fields show a green border.
4. On submit, all fields are validated. If any fail, the first error is focused.
5. The submit button enters a loading state (spinner icon, reduced opacity) for ~1.4 seconds to simulate a network request.
6. The form fades out and is replaced by an animated success screen with a checkmark icon.

## Error Handling

- Required fields show "This field is required." on blur if empty.
- Email fields show "Please enter a valid email." on type mismatch.
- The consent checkbox shows "Please accept to continue." if unchecked on submit.
- No real backend call is made — submission is simulated client-side.

## Design Tokens

All colors and transitions are controlled via CSS custom properties on `.form-2`, including `--f2-gold`, `--f2-bg`, `--f2-surface`, `--f2-border`, `--f2-text`, and validation colors.
