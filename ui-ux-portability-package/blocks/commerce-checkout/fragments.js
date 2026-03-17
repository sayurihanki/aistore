// eslint-disable-next-line import/no-unresolved
import { createFragment } from '@dropins/storefront-checkout/lib/utils.js';

import { CHECKOUT_BLOCK } from './constants.js';

/**
 * A frozen, nested object of CSS selectors
 * @readonly
 */
export const selectors = Object.freeze({
  checkout: {
    shell: '.checkout__shell',
    progressSteps: '.checkout__progress-steps',
    heroEyebrow: '.checkout__hero-eyebrow-copy',
    heroTitle: '.checkout__hero-title',
    heroCopy: '.checkout__hero-copy',
    reviewSummary: '.checkout__review-summary',
    content: '.checkout__content',
    loader: '.checkout__loader',
    mergedCartBanner: '.checkout__merged-cart-banner',
    heading: '.checkout__heading',
    serverError: '.checkout__server-error',
    outOfStock: '.checkout__out-of-stock',
    login: '.checkout__login',
    shippingForm: '.checkout__shipping-form',
    billToShipping: '.checkout__bill-to-shipping',
    delivery: '.checkout__delivery',
    paymentMethods: '.checkout__payment-methods',
    billingForm: '.checkout__billing-form',
    orderSummary: '.checkout__order-summary',
    cartSummary: '.checkout__cart-summary',
    placeOrder: '.checkout__place-order',
    giftOptions: '.checkout__gift-options',
    termsAndConditions: '.checkout__terms-and-conditions',
    main: '.checkout__main',
    aside: '.checkout__aside',
  },
});

// =============================================================================
// CHECKOUT
// =============================================================================

/**
 * Creates the main checkout fragment with all checkout blocks.
 * @returns {DocumentFragment} The complete checkout fragment.
 */
export function createCheckoutFragment() {
  return createFragment(`
    <div class="checkout__wrapper checkout__shell">
      <div class="checkout__loader"></div>
      <div class="checkout__chrome">
        <div class="checkout__progress-shell">
          <div class="checkout__progress-brand">
            <span class="checkout__progress-brand-mark">MCX</span>
            <span class="checkout__progress-brand-copy">Marine Corps Exchange</span>
          </div>
          <div class="checkout__progress-steps" aria-label="Checkout progress"></div>
          <div class="checkout__progress-trust">
            <span class="checkout__progress-trust-line">256-bit secured</span>
            <span class="checkout__progress-trust-line">Tax-free patron pricing</span>
          </div>
        </div>
        <div class="checkout__content">
          <div class="checkout__merged-cart-banner"></div>
          <div class="checkout__main-shell">
            <div class="checkout__hero">
              <div class="checkout__hero-eyebrow">
                <span class="checkout__hero-line"></span>
                <span class="checkout__hero-eyebrow-copy"></span>
              </div>
              <div class="checkout__heading ${CHECKOUT_BLOCK}"></div>
              <div class="checkout__hero-title"></div>
              <p class="checkout__hero-copy"></p>
            </div>
            <div class="checkout__server-error ${CHECKOUT_BLOCK}"></div>
            <div class="checkout__out-of-stock ${CHECKOUT_BLOCK}"></div>
            <div class="checkout__main">
              <section class="checkout__stage" data-stage="shipping">
                <div class="checkout__login ${CHECKOUT_BLOCK}"></div>
                <div class="checkout__shipping-form ${CHECKOUT_BLOCK}"></div>
                <div class="checkout__bill-to-shipping ${CHECKOUT_BLOCK}"></div>
                <div class="checkout__delivery ${CHECKOUT_BLOCK}"></div>
                <p class="checkout__stage-feedback" data-feedback-for="shipping" hidden></p>
                <div class="checkout__stage-actions" data-stage-actions="shipping">
                  <span class="checkout__stage-actions-spacer"></span>
                  <button
                    type="button"
                    class="checkout__stage-button checkout__stage-button--next"
                    data-stage-next="shipping"
                  >
                    Continue to Payment
                  </button>
                </div>
              </section>
              <section class="checkout__stage" data-stage="payment">
                <div class="checkout__payment-methods ${CHECKOUT_BLOCK}"></div>
                <div class="checkout__billing-form ${CHECKOUT_BLOCK}"></div>
                <p class="checkout__stage-feedback" data-feedback-for="payment" hidden></p>
                <div class="checkout__stage-actions" data-stage-actions="payment">
                  <button
                    type="button"
                    class="checkout__stage-button checkout__stage-button--back"
                    data-stage-back="payment"
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="button"
                    class="checkout__stage-button checkout__stage-button--next"
                    data-stage-next="payment"
                  >
                    Review Order
                  </button>
                </div>
              </section>
              <section class="checkout__stage" data-stage="review">
                <div class="checkout__review-panel">
                  <div class="checkout__review-summary"></div>
                </div>
                <div class="checkout__stage-actions checkout__stage-actions--review">
                  <button
                    type="button"
                    class="checkout__stage-button checkout__stage-button--back"
                    data-stage-back="review"
                  >
                    Back to Payment
                  </button>
                </div>
              </section>
            </div>
          </div>
          <div class="checkout__aside-shell">
            <div class="checkout__aside">
              <div class="checkout__order-summary ${CHECKOUT_BLOCK}"></div>
              <div class="checkout__review-commit ${CHECKOUT_BLOCK}">
                <div class="checkout__review-commit-head">
                  <div class="checkout__review-commit-eyebrow">Finalize</div>
                  <h2 class="checkout__review-commit-title">Confirm and place the order</h2>
                  <p class="checkout__review-commit-copy">
                    Accept the checkout terms, then send the live order through to confirmation.
                  </p>
                </div>
                <div class="checkout__terms-and-conditions ${CHECKOUT_BLOCK}"></div>
                <div class="checkout__place-order ${CHECKOUT_BLOCK}"></div>
              </div>
              <div class="checkout__gift-options ${CHECKOUT_BLOCK}"></div>
              <div class="checkout__cart-summary ${CHECKOUT_BLOCK}"></div>
              <div class="checkout__benefit">
                <div class="checkout__benefit-badge">Patron Benefit</div>
                <div class="checkout__benefit-title">Tax-free pricing, mission-backed support</div>
                <p class="checkout__benefit-copy">
                  Every eligible purchase helps fund Marine Corps Community Services while keeping checkout protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}
