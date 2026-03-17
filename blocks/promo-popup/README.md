# Promo Popup Spinner Wheel Block

A premium glassmorphic pop-up with an animated spinner wheel. Visitors trigger the popup on entry, spin the wheel to reveal a random promotion, and can claim their offer. Features frosted glass surfaces, 5 theme variants, animated gradient orbs, and configurable entry triggers.

---

## DA.live Block Table

### Copy-paste

1. Open [`promo-popup-table.txt`](promo-popup-table.txt)
2. Select all (Cmd/Ctrl+A) and copy (Cmd/Ctrl+C)
3. In DA.live or Google Docs, create a new table (3 columns) or paste into the first cell — tabs become columns, newlines become rows
4. Merge the first row and ensure it contains `promo-popup`

The file uses **tabs** between columns and **newlines** between rows.

**Important:** Paste the **entire** table including all 8 promotion rows (10% Off through Try Again). Fewer rows = fewer wheel segments (e.g. 3 rows = 3 segments).

---

## Content Model

The block has two row types:

### Config Rows (2 cells: key | value)

| Key | Options / Default | Description |
|-----|-------------------|-------------|
| `headline` | Spin to Win! | Modal headline |
| `subheadline` | One spin… | Subheadline |
| `trigger` | `time` / `scroll` / `exit` / `immediate` / `first-interaction` | When to show the popup |
| `trigger-delay` | 3 | Seconds (when trigger is `time`) |
| `trigger-scroll` | 50 | Scroll % (when trigger is `scroll`) |
| `storage-duration` | 1 / session / 0 | Days to remember; `session` or `0` = session only |
| `theme` | `purple` / `emerald` / `sunset` / `midnight` / `minimal` | Visual theme |
| `spin-button-text` | Spin the Wheel | CTA button label |
| `no-thanks-text` | No thanks | Dismiss link text |
| `result-headline` | You won! | Post-spin headline |
| `cta-button-text` | Claim Offer | Default CTA text |
| `show-orb-bg` | true / false | Animated gradient orbs |
| `show-confetti` | true / false | Confetti on win |
| `spin-duration` | 4 | Spin seconds (3–8) |

### Promotion Rows (2–3 cells: Label | Description | CTA URL)

| Cell 1 | Cell 2 | Cell 3 |
|--------|--------|--------|
| 10% Off | Use code SAVE10 | /checkout |
| Free Ship | Free shipping on $50+ | *(optional)* |
| BOGO | Buy one get one free | /sale |

- Cell 1: short wheel label (~12 chars).
- Cell 2: description (HTML allowed, e.g. bold for codes).
- Cell 3: optional CTA URL; omit for no link.

---

## Theme Variants

| Theme | Accent | Style |
|-------|--------|-------|
| `purple` | Purple → violet | Default, brand gradient |
| `emerald` | Teal → green | Fresh, growth |
| `sunset` | Coral → gold | Warm, energetic |
| `midnight` | Indigo → blue | Cool, premium |
| `minimal` | Gray scale | Monochrome, subtle |

---

## Entry Triggers

| Trigger | Behavior |
|---------|----------|
| `time` | Show after N seconds (`trigger-delay`) |
| `scroll` | Show when user scrolls `trigger-scroll`% down |
| `exit` | Show on mouse leaving viewport (desktop) |
| `immediate` | Show as soon as block loads |
| `first-interaction` | Show on first click or scroll anywhere |

---

## DA.live Sidebar

All config options are also available in the block sidebar when editing in DA.live. Model fields map to `data-*` attributes on the block.

---

## Accessibility

- `role="dialog"` and `aria-modal="true"` on overlay
- Focus trapped within modal
- Escape key dismisses
- `aria-live="polite"` on result reveal
- `prefers-reduced-motion` respected — animations shortened or disabled

---

## Registration

The block is auto-registered via the wildcard in `models/_component-definition.json`. Run:

```bash
npm run build:json
```

---

## Files

```
blocks/promo-popup/
├── promo-popup.js       # Decorate, wheel logic, triggers, overlay
├── promo-popup.css      # Glassmorphic styles, themes, animations
├── _promo-popup.json    # DA.live definitions + model
├── promo-popup-table.txt # Copy-paste table for DA.live
└── README.md            # This file
```
