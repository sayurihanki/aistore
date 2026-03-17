# Quiz Router MCCS

## Overview

`quiz-router-mccs` is a guided Marine Corps Community Services arrival block for branching, concierge-style journeys.

It is designed for installation welcome guides where families need quick routing to lodging, admin, school, healthcare, and other base-life resources without learning the underlying org chart first.

## Authoring Contract

Author using a **3-column** `quiz-router-mccs` table.

### Row types

| Row Type | Content column | Destination column |
|---|---|---|
| `landing` | P1 title, P2 subtitle, P3 tagline | Start button label |
| `question` | P1 title, P2 subtitle | Leave empty |
| `question:<id>` | P1 title, P2 subtitle | Leave empty |
| `option` | P1 badge, P2 title, P3 description | `#next`, `#step:<id>`, `/fragments/...`, or `/page` |

### Metadata

Use section metadata above the block, or page metadata as fallback.

| Key | Values | Default | Notes |
|---|---|---|---|
| `quizrouter-id` | any string | path slug | Used in analytics events |
| `quizrouter-progress` | `true` / `false` | `true` | Shows progress dots on question screens |
| `quizrouter-theme` | `welcome` / `neutral` / `default` | `welcome` | `default` and `welcome` share the editorial MCCS theme |
| `quizrouter-result-mode` | `fragment` / `page` | `fragment` | Fragment mode loads `/fragments/...` destinations inline |
| `quizrouter-base` | any string | empty | Example: `Camp Pendleton` |
| `quizrouter-journey` | any string | empty | Example: `Arrival Guide` |

### Destination rules

| Destination | Behavior |
|---|---|
| `#next` or empty | Advances to the next authored question |
| `#step:<id>` | Jumps to a named question step |
| `/fragments/...` | Loads inline when `quizrouter-result-mode: fragment`; otherwise navigates |
| `/path/to/page` | Navigates to the page |
| same-origin absolute URL | Sanitized to its path and treated like `/path` |

Off-origin URLs and unsafe protocols are blocked and rendered as disabled options.

## Camp Pendleton example

### Section metadata

```text
section-metadata
quizrouter-id | new-to-base
quizrouter-progress | true
quizrouter-theme | welcome
quizrouter-result-mode | fragment
quizrouter-base | Camp Pendleton
quizrouter-journey | Arrival Guide
```

### Quiz table

```text
quiz-router-mccs
landing | Welcome.\nLet's get your family settled.\nMCCS connects your family to lodging, family programs, and day-one essentials.\nThese programs work together as one arrival experience. | Start your arrival guide
question | What's most important to your family right now?\nChoose the option that best fits where you are in your arrival. |
option | Arriving soon\nWe need a safe place to land\nTemporary lodging, housing options, and first-night essentials. | #step:lodge
option | Getting settled\nWe need to get the family settled\nSchool enrollment, childcare, spouse support, and family programs. | #step:family
option | First week\nWe need practical essentials\nID cards, enrollment, groceries, and healthcare logistics. | #step:essentials
option | Big picture\nWe want the full welcome guide\nA complete 30-day overview of MCCS programs and resources. | /camp-pendleton/welcome
question:lodge | How soon does your family need housing?\nTemporary and permanent housing use different timelines at Camp Pendleton. |
option | Urgent\nTonight or this week\nWe need somewhere to stay right now while permanent housing is arranged. | /fragments/camp-pendleton/temporary-lodging
option | Planning ahead\nWithin the next month\nWe're working through PCS orders and want to plan housing before arrival. | /fragments/camp-pendleton/permanent-housing
question:family | Who in your family needs the most support right now?\nTell us who to focus on first - you can always come back for the rest. |
option | Children\nKids who need school or childcare\nDoDEA enrollment, CDC waitlists, and youth programs. | /fragments/camp-pendleton/school-and-childcare
option | Spouse / partner\nA spouse who needs community and support\nEmployment resources, events, and ways to plug into base life. | /fragments/camp-pendleton/spouse-support
option | Everyone\nThe whole family needs to plug in\nSchool, healthcare, activities, and community together. | /fragments/camp-pendleton/family-setup
question:essentials | What does your family need most urgently?\nPick the one that would make the biggest difference right now. |
option | MCX\nGroceries and household basics\nThe MCX and Commissary first-week guide. | /fragments/camp-pendleton/mcx-first-week
option | Admin\nID cards, enrollment, and paperwork\nWhich offices to visit first and what to bring. | /fragments/camp-pendleton/admin-essentials
option | Healthcare\nHealthcare and TRICARE enrollment\nConnecting your family to the right providers quickly. | /fragments/camp-pendleton/healthcare
```

## Analytics

The block dispatches `CustomEvent('quiz-router-mccs')` on `document`.

Example payload:

```js
document.addEventListener('quiz-router-mccs', (event) => {
  console.log(event.detail);
  // {
  //   quizId: 'new-to-base',
  //   base: 'Camp Pendleton',
  //   journey: 'Arrival Guide',
  //   event: 'option-select',
  //   stepId: 'lodge',
  //   optionTitle: 'Tonight or this week',
  //   optionIndex: 0,
  //   dest: '/fragments/camp-pendleton/temporary-lodging'
  // }
});
```

Event names:

- `landing-view`
- `step-view`
- `option-select`
- `result-view`
- `result-navigate`

## Notes

- The landing screen previews the first authored question's options so authors do not need to maintain duplicate teaser cards.
- Inline result screens are intended for fragment-based mini guides. Full standalone landing pages should use normal page destinations.
- The block does not map analytics into Adobe Analytics or Launch. It emits only the raw DOM event payload.
