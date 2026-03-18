# Portability Scope

## Included (Copied Into Package)

- `head.html` for bootstrapping import maps and script-loading order.
- `styles/` for global token, theme, and motion layers.
- `fonts/` and `icons/` for all visual assets referenced by CSS/blocks.
- `blocks/` for all `135` authored UI blocks.
- `scripts/` runtime files needed by the UI layer:
  - core files (`aem.js`, `scripts.js`, `commerce.js`, delayed and analytics files)
  - `initializers/`
  - `components/`
  - `acdl/`
- `models/`, `component-definition.json`, `component-models.json`, `component-filters.json` for authoring metadata.
- `manifests/` generated portability metadata.
- `docs/` migration and integration playbooks.

## Excluded by Design

- `scripts/__dropins__` generated build artifacts are excluded.
  - Reason: these are environment-specific outputs generated from `@dropins/*` dependencies.
  - Action in target repo: install required packages and generate/fetch equivalents in your runtime setup.
- Environment-specific config files (`config.json`, `default-site.json`) are excluded.
  - Reason: these contain endpoint/store wiring that should be target-repo specific.

## Category and Block Coverage

- `commerce/b2b`: 18 blocks -> `commerce-b2b-negotiable-quote`, `commerce-b2b-negotiable-quote-template`, `commerce-b2b-po-approval-flow`, `commerce-b2b-po-approval-rule-details`, `commerce-b2b-po-approval-rule-form`, `commerce-b2b-po-approval-rules-list`, `commerce-b2b-po-checkout-success`, `commerce-b2b-po-comment-form`, `commerce-b2b-po-comments-list`, `commerce-b2b-po-company-purchase-orders`, `commerce-b2b-po-customer-purchase-orders`, `commerce-b2b-po-header`, `commerce-b2b-po-history-log`, `commerce-b2b-po-require-approval-purchase-orders`, `commerce-b2b-po-status`, `commerce-b2b-quote-checkout`, `commerce-b2b-requisition-list`, `commerce-b2b-requisition-list-view`
- `commerce/core`: 37 blocks -> `commerce-account-header`, `commerce-account-hub`, `commerce-account-nav`, `commerce-account-sidebar`, `commerce-addresses`, `commerce-cart`, `commerce-checkout`, `commerce-checkout-success`, `commerce-company-accept-invitation`, `commerce-company-create`, `commerce-company-credit`, `commerce-company-profile`, `commerce-company-roles-permissions`, `commerce-company-structure`, `commerce-company-users`, `commerce-confirm-account`, `commerce-create-account`, `commerce-create-password`, `commerce-create-return`, `commerce-customer-company`, `commerce-customer-details`, `commerce-customer-information`, `commerce-forgot-password`, `commerce-gift-options`, `commerce-login`, `commerce-mini-cart`, `commerce-order-cost-summary`, `commerce-order-header`, `commerce-order-product-list`, `commerce-order-returns`, `commerce-order-status`, `commerce-orders-list`, `commerce-return-header`, `commerce-returns-list`, `commerce-search-order`, `commerce-shipping-status`, `commerce-wishlist`
- `content/general`: 59 blocks -> `age-gate`, `age-verification`, `blog-post`, `cards`, `cards-list`, `catalog-highlights`, `columns`, `customer-segment-personalization-block`, `enrichment`, `ez-rack-builder`, `ez-rack-builder-mockup`, `features-grid`, `fragment`, `guided-selling`, `hero`, `hero-3`, `hero-5`, `hero-6`, `hero-cta`, `how-it-works-stats`, `how-it-works-stats-2`, `live-block`, `live-block-premium`, `luxury-configurator`, `mcx-announcement-bar`, `mcx-benefits`, `mcx-brands`, `mcx-category-grid`, `mcx-category-page`, `mcx-deal-countdown`, `mcx-editorial-cards`, `mcx-featured-collections`, `mcx-footer`, `mcx-header`, `mcx-hero`, `mcx-newsletter`, `mcx-product-cards`, `mcx-promo-strip`, `mcx-ticker`, `medal-rack-configurator`, `newsletter`, `product-configurator-luxe`, `product-details`, `product-highlights`, `product-list-page`, `product-recommendations`, `product-teaser`, `product-technical-details`, `promo-popup`, `promo-strip`, `promotional-hero`, `quote`, `store-locator`, `targeted-block`, `uniform-configurator`, `vip-hero-block`, `vip-hero-mccs`, `vip-member-block`, `vip-member-block-real-v2`
- `forms/authorable-forms`: 6 blocks -> `form`, `form-2`, `form-3`, `form-4`, `form-mccs-preferences`, `form-mccs-preferences-next`
- `interactive-content/engagement`: 10 blocks -> `accordion`, `carousel`, `circle-carousel`, `embed`, `modal`, `quiz-router`, `quiz-router-mccs`, `table`, `tabs`, `video`
- `shell/navigation-and-layout`: 5 blocks -> `footer`, `header`, `search`, `search-bar`, `top-banner`
