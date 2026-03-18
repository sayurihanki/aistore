# Featured Grid Document Authoring Guide

This guide explains how to author the `features-grid` block in a Google Doc or SharePoint document for AEM Edge Delivery Services (EDS).

## Authoring Model

Create a 2-column table:

- Column A: field label (author helper text)
- Column B: field value (rendered content)

Use this structure:

| **features-grid** | |
|---|---|
| section-tag | Why Bodea |
| title | Commerce built for enterprise scale |
| subtitle | From procurement to maintenance, Bodea unifies every touchpoint of your enterprise IT lifecycle in one platform. |
| cta-label | See all capabilities |
| cta-url | /capabilities |
| card | featured \| * \| Core Platform \| Unified Commerce Portal \| One intelligent dashboard for orders, quotes, invoices, contracts, and returns. \| Explore the portal \| /portal |
| card | default \| * \| Analytics \| Spend Intelligence \| Deep visibility into procurement patterns with recommendations and optimization. \| Learn more \| /analytics |
| card | default \| * \| Compliance \| Enterprise Security \| SOC 2 Type II, ISO 27001, and GDPR compliant with role-based access and audit logs. \| Learn more \| /security |
| card | default \| * \| Support \| Dedicated Success Team \| Named account managers, 24/7 support, and proactive maintenance scheduling. \| Learn more \| /support |
| card | default \| * \| Integration \| ERP and Procurement APIs \| Native connectors for SAP, Oracle, Coupa, and Ariba with REST APIs for custom workflows. \| Learn more \| /api |
| card | wide \| * \| Global \| Deploy Anywhere \| From single-site teams to global enterprises, the platform scales across regions and currencies. \| Explore global capabilities \| /global |

## Row Contract

The block reads rows in this order:

1. `section-tag`
2. `title`
3. `subtitle`
4. `cta-label`
5. `cta-url`
6. and onward: `card` rows

## Card Format

Each `card` row is a pipe-separated value string:

`variant | icon | tag | title | description | cta-label | cta-url | icon-bg(optional)`

Fields:

- `variant`: `featured`, `default`, or `wide`
- `icon`: short icon text (for example `*`, `+`, `!`, or an emoji)
- `tag`: card eyebrow text
- `title`: card heading
- `description`: card body copy
- `cta-label`: link label
- `cta-url`: link URL
- `icon-bg` optional override: `fi-green`, `fi-gold`, `fi-blue`, `fi-dark`

## Layout Behavior

- Desktop: 3-column grid
- `featured` and `wide` cards span 2 columns
- Tablet (`<= 1100px`): 2-column grid, wide cards span full width
- Mobile (`<= 700px`): 1-column stack

## File Locations

- Block JS: `blocks/features-grid/features-grid.js`
- Block CSS: `blocks/features-grid/features-grid.css`

