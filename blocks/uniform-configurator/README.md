# Uniform Configurator

Single-block DA.live configurator for a premium, multi-step uniform package flow with live pricing, SVG preview updates, structured lead capture, and a success state.

The block now supports two modes:

- Legacy submit mode: uses `submit-url` and posts a JSON payload through `scripts/submit-json.js`.
- Commerce mode: uses `sku`, validates the live Adobe Commerce option contract, and adds the package directly to cart through the storefront PDP/cart APIs.

## Configuration

Use the block as a DA key-value block with these fields:

| Key | Description |
|---|---|
| `eyebrow` | Small overline above the title |
| `title` | Main heading. Newlines render as line breaks |
| `subtitle` | Supporting copy below the title |
| `data-source` | Repo-relative JSON path or published `da.live` JSON URL |
| `sku` | Commerce package SKU. When set, Commerce mode is enabled and `submit-url` must be empty |
| `submit-url` | Webhook/API endpoint for the final JSON POST |
| `success-title` | Heading shown after successful submission |
| `success-message` | Supporting copy shown after successful submission |
| `analytics-id` | Stable analytics identifier for data layer events |

### Default example

| uniform-configurator | |
|---|---|
| eyebrow | Marine Corps Uniform Division |
| title | Officer Dress Blues\nPackage Builder |
| subtitle | Configure your complete male officer blue dress uniform to USMC regulation standards with real-time pricing and a live visual preview. |
| data-source | /data/configurators/marine-officer-dress-blues.json |
| sku | USMC-OFFICER-BLUES-PACKAGE |
| success-title | Order Submitted |
| success-message | Your Blue Dress Package is now in production. Our veteran uniform team will review your specifications and reach out within 24 hours to confirm details. |
| analytics-id | marine-officer-dress-blues |

## Data Source Contract

The data source is JSON and must contain:

- `id`, `version`, `currency`
- `baseItems[]`: `id`, `label`, `summaryLabel`, `price`
- `options.coat.length[]`, `options.coat.size[]`
- `options.trouser.waist[]`, `options.trouser.inseam[]`
- `options.shirt.neck[]`, `options.shirt.sleeve[]`, `options.shirt.collarStrip[]`
- `options.shoes`: `label`, `price`, `size[]`, `width[]`
- `options.belt`: `label`, `price`, `size[]`, `buckleStyles[]`
- `options.cover`: `label`, `price`, `size[]`
- `options.frame`: `label`, `price`, `size[]`
- `ranks[]`: `id`, `label`, `shortLabel`, `payGrade`, `price`, `preview`
- `medalPackages[]`: `id`, `label`, `previewCount`, `price`
- `extras[]`: `id`, `label`, `description`, `price`
- `measurements`
- `shippingStates[]`
- `notices`

Seed data is provided at `/data/configurators/marine-officer-dress-blues.json`.

## Behavior

- The block owns a fixed 6-step flow: garments, optional sizing add-ons, rank, accessories, measurements/contact, review.
- Step 1 sizing and Step 3 rank are always required.
- In legacy submit mode, Step 5 `first name`, `last name`, and `email` are required.
- In Commerce mode, Step 5 removes contact/shipping capture and keeps only measurements plus special instructions.
- Measurements are optional, but any entered values are range-validated.
- Shipping fields become required only when shipping override is enabled.
- Fit-photo uploads are intentionally deferred in v1.
- Legacy submission uses the shared wrapped/raw JSON POST behavior from `scripts/submit-json.js`.
- Commerce mode loads the authored SKU through `@dropins/storefront-pdp/api.js`, imports `../../scripts/initializers/cart.js`, validates the live option/input contract, and adds `{ sku, quantity: 1, optionsUIDs, enteredOptions }` through `@dropins/storefront-cart/api.js`.
- If the Catalog Service product view resolves as a simple product without customizable option metadata, the block now attempts a fallback core customizable-options query through `commerce-core-endpoint`. Without that endpoint, simple products that rely on Magento Admin customizable options will stay blocked with an inline fatal error.

## Submit Payload

Successful submission posts a JSON payload with:

- `configuratorId`, `configuratorVersion`, `analyticsId`
- `submittedAt`, `pageUrl`, `referrer`
- `currency`, `total`
- `lineItems[]`
- `selections`
- `contact`
- `measurements`
- `shipping`
- `notes`

## Commerce Proofing

- Demo harness: `/uniform-configurator-demo.html`
- Live contract check: `npm run verify:uniform-contract`
- Unit coverage includes Commerce UID mapping, entered option mapping, dependency omission, and price parity cases.

## Analytics

The block pushes these events to both `adobeDataLayer` and `dataLayer`:

- `uniform_configurator_start`
- `uniform_configurator_step_view`
- `uniform_configurator_change`
- `uniform_configurator_submit`
- `uniform_configurator_submit_success`
- `uniform_configurator_submit_error`

## Failure States

- Invalid or missing `data-source` renders an inline block error.
- Missing `submit-url` renders an inline block error and stops initialization.
- Submission errors keep the user on the review step and show an inline error above the CTA.
