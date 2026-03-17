# Form 4

Multi-step dark glassmorphic contact form for AEM Edge Delivery Services Document Authoring.

## Overview

Three-step contact form with animated particle background, floating orbs, progress stepper, budget slider, star rating, color picker, drag-and-drop file upload, and a success screen with countdown redirect. Built with a deep-dark theme, blue/purple/green accent gradients, and glassmorphic surfaces using `backdrop-filter`.

## Content Model

| Form 4 |
|---|
| Title text (optional, defaults to "Tell us about / your vision") |
| Subtitle text (optional) |
| Link to redirect page after submit (optional) |

- **Row 1**: Form heading — use a newline to split into two lines; the second line renders with a gradient accent
- **Row 2**: Subtitle / description
- **Row 3** (optional): A link (`<a>` tag) whose `href` becomes the post-submit redirect URL

When a redirect URL is present, the success screen displays a countdown ring before navigating. A "Go now" button allows skipping the wait.

## Steps & Fields

### Step 1 — Contact

| Field | Type | Required |
|---|---|---|
| First name | text | Yes |
| Last name | text | Yes |
| Email address | email | Yes |
| Phone number | tel | No |
| Company | text | No |
| Website | url | No |

### Step 2 — Project

| Field | Type | Required |
|---|---|---|
| Project type | radio pills | Yes |
| Budget range | range slider ($5k–$200k) | No |
| Timeline | select | No |
| Preferred start date | date | No |
| Brand color | color picker swatches | No |
| Priority rating | 5-star rating | No |
| Toggles (responsive, SEO, analytics) | toggle switches | No |

### Step 3 — Message

| Field | Type | Required |
|---|---|---|
| Project description | textarea (500 char limit) | Yes |
| File attachments | drag-and-drop file upload | No |
| How did you hear about us? | checkbox pills | No |
| Newsletter consent | checkbox pill | No |
| Privacy policy consent | checkbox pill | Yes |

## Configuration (DA.live)

The `_form-4.json` model exposes three sidebar fields:

- **Form Title** — heading text (newline splits into two lines with gradient emphasis on the second)
- **Form Subtitle** — description text
- **Redirect URL** — post-submit destination page

## Behavior

- **Particle canvas** renders animated floating particles behind the form
- **Background orbs** drift with blur and color gradients for ambient depth
- **Progress stepper** shows three numbered steps with active/done states and connecting line fills
- **Step transitions** animate with slide-in/slide-out between steps
- **Budget slider** displays a formatted dollar value that updates in real time
- **Star rating** highlights stars on hover and click with color and scale transitions
- **Character counter** on the textarea warns at 80% and shows overflow in red
- **Color picker** swatches scale up with a checkmark and label on selection
- **Drag-and-drop** file upload shows file name pills; supports click-to-browse fallback
- **Validation** runs per step on "Next" click; submit validates step 3 and focuses the first error
- **Submit** shows a loading spinner, then transitions to a success screen with summary chips
- **Redirect countdown** (when configured) drains a circular ring, then navigates
- **Reduced motion** disables all animations and transitions via `prefers-reduced-motion`

## Error Handling

- Required fields show "This field is required."
- Email type mismatch shows "Please enter a valid email."
- Project type (radio) shows "Please select a project type."
- Privacy consent shows "Please accept to continue."
- First invalid field receives focus on step navigation or submit attempt
