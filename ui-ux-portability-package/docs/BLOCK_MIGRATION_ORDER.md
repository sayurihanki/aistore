# Block Migration Order

## Wave Plan

1. Shell and navigation:
   - `header`, `footer`, `top-banner`, `search`, `search-bar`
2. Content and interaction:
   - `hero`, `hero-cta`, `hero-3`, `cards`, `cards-list`, `tabs`, `accordion`, `modal`, `video`, `embed`, `table`
3. Commerce core:
   - cart, checkout, account, authentication, orders, returns, wishlist, product details/list/recommendations
4. Commerce B2B:
   - negotiable quote flows, purchase-order approvals, requisition list flows, company management flows

## Full Block Matrix

| Block | Category | Subcategory | CSS Files | JS Files |
|---|---|---|---:|---:|
| `accordion` | `interactive-content` | `engagement` | 1 | 1 |
| `age-gate` | `content` | `general` | 1 | 1 |
| `age-verification` | `content` | `general` | 1 | 1 |
| `blog-post` | `content` | `general` | 1 | 1 |
| `cards` | `content` | `general` | 1 | 1 |
| `cards-list` | `content` | `general` | 1 | 1 |
| `carousel` | `interactive-content` | `engagement` | 1 | 1 |
| `catalog-highlights` | `content` | `general` | 1 | 1 |
| `circle-carousel` | `interactive-content` | `engagement` | 1 | 1 |
| `columns` | `content` | `general` | 1 | 1 |
| `commerce-account-header` | `commerce` | `core` | 1 | 1 |
| `commerce-account-hub` | `commerce` | `core` | 1 | 1 |
| `commerce-account-nav` | `commerce` | `core` | 1 | 1 |
| `commerce-account-sidebar` | `commerce` | `core` | 1 | 1 |
| `commerce-addresses` | `commerce` | `core` | 1 | 1 |
| `commerce-b2b-negotiable-quote` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-negotiable-quote-template` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-approval-flow` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-approval-rule-details` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-approval-rule-form` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-approval-rules-list` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-checkout-success` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-comment-form` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-comments-list` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-company-purchase-orders` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-customer-purchase-orders` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-header` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-history-log` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-require-approval-purchase-orders` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-po-status` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-quote-checkout` | `commerce` | `b2b` | 1 | 5 |
| `commerce-b2b-requisition-list` | `commerce` | `b2b` | 1 | 1 |
| `commerce-b2b-requisition-list-view` | `commerce` | `b2b` | 1 | 1 |
| `commerce-cart` | `commerce` | `core` | 1 | 1 |
| `commerce-checkout` | `commerce` | `core` | 1 | 5 |
| `commerce-checkout-success` | `commerce` | `core` | 1 | 1 |
| `commerce-company-accept-invitation` | `commerce` | `core` | 1 | 1 |
| `commerce-company-create` | `commerce` | `core` | 1 | 1 |
| `commerce-company-credit` | `commerce` | `core` | 1 | 1 |
| `commerce-company-profile` | `commerce` | `core` | 1 | 1 |
| `commerce-company-roles-permissions` | `commerce` | `core` | 1 | 1 |
| `commerce-company-structure` | `commerce` | `core` | 1 | 1 |
| `commerce-company-users` | `commerce` | `core` | 1 | 1 |
| `commerce-confirm-account` | `commerce` | `core` | 1 | 1 |
| `commerce-create-account` | `commerce` | `core` | 1 | 1 |
| `commerce-create-password` | `commerce` | `core` | 1 | 1 |
| `commerce-create-return` | `commerce` | `core` | 1 | 1 |
| `commerce-customer-company` | `commerce` | `core` | 1 | 1 |
| `commerce-customer-details` | `commerce` | `core` | 1 | 1 |
| `commerce-customer-information` | `commerce` | `core` | 1 | 1 |
| `commerce-forgot-password` | `commerce` | `core` | 1 | 1 |
| `commerce-gift-options` | `commerce` | `core` | 1 | 1 |
| `commerce-login` | `commerce` | `core` | 1 | 1 |
| `commerce-mini-cart` | `commerce` | `core` | 1 | 1 |
| `commerce-order-cost-summary` | `commerce` | `core` | 1 | 1 |
| `commerce-order-header` | `commerce` | `core` | 1 | 1 |
| `commerce-order-product-list` | `commerce` | `core` | 1 | 1 |
| `commerce-order-returns` | `commerce` | `core` | 1 | 1 |
| `commerce-order-status` | `commerce` | `core` | 1 | 1 |
| `commerce-orders-list` | `commerce` | `core` | 1 | 1 |
| `commerce-return-header` | `commerce` | `core` | 1 | 1 |
| `commerce-returns-list` | `commerce` | `core` | 1 | 1 |
| `commerce-search-order` | `commerce` | `core` | 1 | 1 |
| `commerce-shipping-status` | `commerce` | `core` | 1 | 1 |
| `commerce-wishlist` | `commerce` | `core` | 1 | 1 |
| `customer-segment-personalization-block` | `content` | `general` | 1 | 2 |
| `embed` | `interactive-content` | `engagement` | 1 | 1 |
| `enrichment` | `content` | `general` | 1 | 1 |
| `ez-rack-builder` | `content` | `general` | 1 | 3 |
| `ez-rack-builder-mockup` | `content` | `general` | 1 | 2 |
| `features-grid` | `content` | `general` | 1 | 1 |
| `footer` | `shell` | `navigation-and-layout` | 1 | 1 |
| `form` | `forms` | `authorable-forms` | 1 | 2 |
| `form-2` | `forms` | `authorable-forms` | 1 | 1 |
| `form-3` | `forms` | `authorable-forms` | 1 | 1 |
| `form-4` | `forms` | `authorable-forms` | 1 | 1 |
| `form-mccs-preferences` | `forms` | `authorable-forms` | 1 | 1 |
| `form-mccs-preferences-next` | `forms` | `authorable-forms` | 1 | 1 |
| `fragment` | `content` | `general` | 1 | 1 |
| `guided-selling` | `content` | `general` | 1 | 3 |
| `header` | `shell` | `navigation-and-layout` | 1 | 4 |
| `hero` | `content` | `general` | 1 | 1 |
| `hero-3` | `content` | `general` | 1 | 1 |
| `hero-5` | `content` | `general` | 1 | 1 |
| `hero-6` | `content` | `general` | 1 | 1 |
| `hero-cta` | `content` | `general` | 1 | 1 |
| `how-it-works-stats` | `content` | `general` | 1 | 1 |
| `how-it-works-stats-2` | `content` | `general` | 1 | 1 |
| `live-block` | `content` | `general` | 1 | 2 |
| `live-block-premium` | `content` | `general` | 1 | 1 |
| `luxury-configurator` | `content` | `general` | 1 | 1 |
| `mcx-announcement-bar` | `content` | `general` | 1 | 1 |
| `mcx-benefits` | `content` | `general` | 1 | 1 |
| `mcx-brands` | `content` | `general` | 1 | 1 |
| `mcx-category-grid` | `content` | `general` | 1 | 1 |
| `mcx-category-page` | `content` | `general` | 1 | 2 |
| `mcx-deal-countdown` | `content` | `general` | 1 | 1 |
| `mcx-editorial-cards` | `content` | `general` | 1 | 1 |
| `mcx-featured-collections` | `content` | `general` | 1 | 1 |
| `mcx-footer` | `content` | `general` | 1 | 1 |
| `mcx-header` | `content` | `general` | 1 | 2 |
| `mcx-hero` | `content` | `general` | 1 | 1 |
| `mcx-newsletter` | `content` | `general` | 1 | 1 |
| `mcx-product-cards` | `content` | `general` | 1 | 1 |
| `mcx-promo-strip` | `content` | `general` | 1 | 1 |
| `mcx-ticker` | `content` | `general` | 1 | 1 |
| `medal-rack-configurator` | `content` | `general` | 1 | 2 |
| `modal` | `interactive-content` | `engagement` | 1 | 1 |
| `newsletter` | `content` | `general` | 1 | 1 |
| `product-configurator-luxe` | `content` | `general` | 1 | 1 |
| `product-details` | `content` | `general` | 1 | 2 |
| `product-highlights` | `content` | `general` | 1 | 1 |
| `product-list-page` | `content` | `general` | 1 | 2 |
| `product-recommendations` | `content` | `general` | 1 | 2 |
| `product-teaser` | `content` | `general` | 1 | 2 |
| `product-technical-details` | `content` | `general` | 1 | 1 |
| `promo-popup` | `content` | `general` | 1 | 1 |
| `promo-strip` | `content` | `general` | 1 | 1 |
| `promotional-hero` | `content` | `general` | 1 | 1 |
| `quiz-router` | `interactive-content` | `engagement` | 1 | 1 |
| `quiz-router-mccs` | `interactive-content` | `engagement` | 1 | 1 |
| `quote` | `content` | `general` | 1 | 1 |
| `search` | `shell` | `navigation-and-layout` | 1 | 1 |
| `search-bar` | `shell` | `navigation-and-layout` | 1 | 1 |
| `store-locator` | `content` | `general` | 1 | 1 |
| `table` | `interactive-content` | `engagement` | 1 | 1 |
| `tabs` | `interactive-content` | `engagement` | 1 | 1 |
| `targeted-block` | `content` | `general` | 1 | 1 |
| `top-banner` | `shell` | `navigation-and-layout` | 1 | 1 |
| `uniform-configurator` | `content` | `general` | 1 | 4 |
| `video` | `interactive-content` | `engagement` | 1 | 1 |
| `vip-hero-block` | `content` | `general` | 1 | 1 |
| `vip-hero-mccs` | `content` | `general` | 1 | 1 |
| `vip-member-block` | `content` | `general` | 1 | 1 |
| `vip-member-block-real-v2` | `content` | `general` | 1 | 1 |
