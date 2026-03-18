# Form 3

Glassmorphic dark/gold luxury contact form for AEM Edge Delivery Services Document Authoring.

## Overview

Single-page contact form with floating labels, real-time field validation, staggered entrance animations, and an optional countdown redirect after successful submission. Built with a dark theme, gold accent colors, and glassmorphic (frosted glass) surfaces using `backdrop-filter`.

## Content Model

| Form 3 |
|---|
| Title text (optional, defaults to "Get in touch") |
| Subtitle text (optional) |
| Link to redirect page after submit (optional) |

- **Row 1**: Form heading
- **Row 2**: Subtitle / description
- **Row 3** (optional): A link (`<a>` tag) whose `href` becomes the post-submit redirect URL

When a redirect URL is present, the success screen displays a 4-second countdown ring before navigating. A "Go now" button allows skipping the wait.

## Fields

| Field | Type | Required |
|---|---|---|
| First name | text | Yes |
| Last name | text | Yes |
| Email address | email | Yes |
| Phone number | tel | No |
| Topic | select | Yes |
| How did you find us? | radio | No |
| Message | textarea | Yes |
| Privacy consent | checkbox | Yes |

## Configuration (DA.live)

The `_form-3.json` model exposes three sidebar fields:

- **Form Title** — heading text
- **Form Subtitle** — description text
- **Redirect URL** — post-submit destination page

## Behavior

- **Floating labels** rise and shrink on focus/fill with gold color transition
- **Validation** runs on blur per field; submit validates all fields and focuses the first error
- **Entrance animation** staggers fields upward with fade-in (respects `prefers-reduced-motion`)
- **Submit** shows a loading spinner, then transitions to a success screen
- **Redirect countdown** (when configured) drains a circular ring over 4 seconds, then navigates

## Error Handling

- Required fields show "This field is required."
- Email type mismatch shows "Please enter a valid email."
- Consent checkbox shows "Please accept to continue."
- First invalid field receives focus on submit attempt
