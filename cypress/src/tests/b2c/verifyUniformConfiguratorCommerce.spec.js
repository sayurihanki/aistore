/* global cy, Cypress, describe, expect, it */

import {
  checkTermsAndConditions,
  placeOrder,
  setGuestEmail,
  setGuestShippingAddress,
  setPaymentMethod,
  signInUser,
} from '../../actions';
import {
  assertOrderConfirmationCommonDetails,
  assertOrderConfirmationShippingDetails,
  assertOrderConfirmationShippingMethod,
} from '../../assertions';
import {
  checkMoneyOrder,
  customerShippingAddress,
} from '../../fixtures/index';
import userInfo from '../../fixtures/userInfo.json';
import * as fields from '../../fields';

const DEMO_PATH = '/uniform-configurator-demo.html';
const EXPECTED_TOTAL = '$1,126.00';
const PACKAGE_SKU = 'USMC-OFFICER-BLUES-PACKAGE';
const SPECIAL_INSTRUCTIONS = 'Ceremony date in six weeks.';

function configureUniformPackage() {
  cy.visit(DEMO_PATH);

  cy.get('.uniform-configurator__shell', { timeout: 30000 }).should('be.visible');
  cy.get('#uc-contract-error').should('have.attr', 'hidden');

  cy.get('#uc-coat-length').select('regular');
  cy.get('#uc-coat-size').select('40');
  cy.get('#uc-trouser-waist').select('34');
  cy.get('#uc-trouser-inseam').select('32');
  cy.get('#uc-shirt-neck').select('16');
  cy.get('#uc-shirt-sleeve').select('34');
  cy.get('#uc-collar-strip').select('16');
  cy.get('[data-go-step="2"]').click();

  cy.get('#uc-shoe-size').select('10');
  cy.get('#uc-shoe-width').select('W');
  cy.get('#uc-belt-size').select('36');
  cy.contains('.card-opt__name', 'Sword').click();
  cy.get('#uc-cover-size').select('7¼');
  cy.get('#uc-frame-size').select('XL');
  cy.get('[data-go-step="3"]').click();

  cy.contains('.rank-card__title', 'Captain').click();
  cy.get('[data-go-step="4"]').click();

  cy.contains('.card-opt__name', 'Starter (3)').click();
  cy.get('[data-extra-id="marksmanship-badge"]').check({ force: true });
  cy.get('[data-extra-id="naval-aviator-wings"]').check({ force: true });
  cy.get('[data-go-step="5"]').click();

  cy.get('#uc-measure-chest').type('41.5');
  cy.get('#uc-measure-height').type('70');
  cy.get('#uc-notes').type(SPECIAL_INSTRUCTIONS);
  cy.get('[data-go-step="6"]').click();

  cy.get('#uc-summary-total').should('contain', '$1,126');
  cy.get('#uc-rush-toggle').check({ force: true });
  cy.get('#uc-summary-total').should('contain', '$1,211');
  cy.get('#uc-rush-toggle').uncheck({ force: true });
  cy.get('#uc-summary-total').should('contain', '$1,126');
}

function interceptAddToCart() {
  cy.intercept('POST', '**/graphql*', (req) => {
    if (req.body?.query?.includes('addProductsToCart')) {
      req.alias = 'uniformAddToCart';
    }
  });
}

function assertPackageLineInCart() {
  cy.get('.commerce-cart', { timeout: 30000 }).should('exist');
  cy.contains('.dropin-cart-item__sku', PACKAGE_SKU, { timeout: 30000 })
    .closest('.dropin-cart-item')
    .as('uniformCartItem');

  cy.get('@uniformCartItem').should('contain', 'Coat Length');
  cy.get('@uniformCartItem').should('contain', 'Regular');
  cy.get('@uniformCartItem').should('contain', 'Rank');
  cy.get('@uniformCartItem').should('contain', 'Captain');
  cy.get('@uniformCartItem').should('contain', 'Measurement Chest');
  cy.get('@uniformCartItem').should('contain', '41.5');
  cy.get('@uniformCartItem').should('contain', 'Special Instructions');
  cy.get('@uniformCartItem').should('contain', SPECIAL_INSTRUCTIONS);
  cy.get('@uniformCartItem').find('.dropin-cart-item__total').should('contain', EXPECTED_TOTAL);
}

function continueThroughCheckout() {
  cy.visit('/checkout');
  cy.get('body', { timeout: 30000 }).then(($body) => {
    if ($body.find(fields.shippingFormGuestEmail).length > 0) {
      setGuestEmail(customerShippingAddress.email);
    } else if ($body.find('[name="signIn_form"]').length > 0) {
      signInUser(userInfo.sign_in.email, userInfo.sign_in.password);
    }
  });

  setGuestShippingAddress(customerShippingAddress, true);
  setPaymentMethod(checkMoneyOrder);
  checkTermsAndConditions();
  placeOrder();

  assertOrderConfirmationCommonDetails(customerShippingAddress, checkMoneyOrder);
  assertOrderConfirmationShippingDetails(customerShippingAddress);
  assertOrderConfirmationShippingMethod(customerShippingAddress);
}

describe('Verify Commerce uniform configurator flow', () => {
  it('adds the configured package to cart and preserves expected custom options', () => {
    interceptAddToCart();
    configureUniformPackage();

    cy.contains('[data-submit-order]', 'Add Package to Cart').click();
    cy.wait('@uniformAddToCart');
    cy.url({ timeout: 30000 }).should('include', '/cart');

    assertPackageLineInCart();
  });

  it('places an order from the configurator package and verifies order-item options in Admin when credentials are configured', () => {
    interceptAddToCart();
    configureUniformPackage();

    cy.contains('[data-submit-order]', 'Add Package to Cart').click();
    cy.wait('@uniformAddToCart');
    cy.url({ timeout: 30000 }).should('include', '/cart');

    assertPackageLineInCart();
    continueThroughCheckout();

    cy.contains('p', /ORDER #\d+/, { timeout: 30000 })
      .invoke('text')
      .then((orderText) => {
        const match = orderText.match(/ORDER #(\d+)/i);
        expect(match, orderText).to.not.equal(null);

        const hasAdminVerification = Boolean(
          Cypress.env('uniformAdminBaseUrl')
          && (
            Cypress.env('uniformAdminToken')
            || (
              Cypress.env('uniformAdminUsername')
              && Cypress.env('uniformAdminPassword')
            )
          ),
        );

        if (!hasAdminVerification) {
          cy.log('Admin verification credentials not configured; skipping post-order Admin API assertion.');
          return;
        }

        cy.task('verifyUniformOrderItem', {
          orderNumber: match[1],
          sku: PACKAGE_SKU,
          expectedOptions: {
            'Measurement Chest': '41.5',
            'Measurement Height': '70',
            'Special Instructions': SPECIAL_INSTRUCTIONS,
          },
        }).then((result) => {
          expect(result?.ok, JSON.stringify(result)).to.equal(true);
        });
      });
  });
});
