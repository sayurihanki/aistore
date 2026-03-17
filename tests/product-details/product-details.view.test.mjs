/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

/* eslint-disable import/extensions */
import {
  buildExperienceModel,
  resolveExperienceOverridesForProduct,
} from '../../blocks/product-details/product-details.experience.mjs';
import {
  renderProductDetailsExperience,
  syncProductDetailsCommerceUi,
} from '../../blocks/product-details/product-details.view.mjs';
/* eslint-enable import/extensions */

function createExperienceNodes(document) {
  const header = document.createElement('div');
  const priceRoot = document.createElement('div');

  return {
    sectionNodes: {
      breadcrumb: document.createElement('div'),
      eyebrow: document.createElement('div'),
      badgeContainers: [
        document.createElement('div'),
        document.createElement('div'),
      ],
      ratingRow: document.createElement('div'),
      promo: document.createElement('div'),
      shippingCards: document.createElement('div'),
      shippingPanel: document.createElement('div'),
      returnsPanel: document.createElement('div'),
      reviewsSection: document.createElement('section'),
      priceTax: document.createElement('div'),
    },
    commerceNodes: {
      priceSavings: document.createElement('span'),
      stockTag: document.createElement('div'),
      header,
      priceRoot,
      stickyName: document.createElement('div'),
      stickyPrice: document.createElement('div'),
      stickyAtc: document.createElement('div'),
    },
  };
}

test('product-details experience view swaps authored content when the product changes', async () => {
  await withFakeDom(async ({ document }) => {
    const { sectionNodes, commerceNodes } = createExperienceNodes(document);
    const experienceSource = {
      defaults: {
        promo: {
          text: 'Extra savings with code',
          highlight: 'savings',
          code: 'DEFAULT20',
        },
        shippingCards: [
          {
            icon: 'truck',
            title: 'Shared Delivery',
            subtitle: '3-5 business days',
          },
        ],
        accordion: {
          shippingHtml: '<p>Shared shipping guidance.</p>',
          returnsHtml: '<p>Shared return guidance.</p>',
        },
        reviews: {
          rating: 4.2,
          count: 1,
          distribution: [1, 0, 0, 0, 0],
          items: [
            {
              name: 'Shared Reviewer',
              date: 'Jan 1, 2026',
              rating: 5,
              verified: true,
              body: 'Shared review copy.',
            },
          ],
        },
        stockMessage: 'Shared stock message',
      },
      bySku: {
        'SKU-ALPHA': {
          promo: {
            code: 'ALPHA30',
          },
          shippingCards: [
            {
              icon: 'store',
              title: 'Alpha Pickup',
              subtitle: 'Ready tomorrow',
            },
          ],
          accordion: {
            shippingHtml: '<p>Alpha shipping copy.</p>',
          },
          reviews: {
            rating: 4.9,
            count: 1,
            distribution: [1, 0, 0, 0, 0],
            items: [
              {
                name: 'Alpha Reviewer',
                date: 'Feb 2, 2026',
                rating: 5,
                verified: true,
                body: 'Alpha-specific review.',
              },
            ],
          },
        },
      },
      byUrlKey: {
        'beta-jacket': {
          promo: {
            code: 'BETA15',
          },
          shippingCards: [
            {
              icon: 'returns',
              title: 'Beta Returns',
              subtitle: 'Easy exchanges',
            },
          ],
          accordion: {
            shippingHtml: '<p>Beta shipping copy.</p>',
          },
          reviews: {
            rating: 4.1,
            count: 1,
            distribution: [0, 1, 0, 0, 0],
            items: [
              {
                name: 'Beta Reviewer',
                date: 'Mar 3, 2026',
                rating: 4,
                verified: false,
                body: 'Beta-specific review.',
              },
            ],
          },
          stockMessage: 'Beta stock message',
        },
      },
    };

    const productAlpha = {
      sku: 'sku-alpha',
      urlKey: 'alpha-hoodie',
      name: 'Alpha Hoodie',
      inStock: true,
      prices: {
        regular: {
          amount: 60,
          currency: 'USD',
        },
        final: {
          amount: 45,
          currency: 'USD',
        },
      },
    };
    const productBeta = {
      sku: 'sku-missing',
      urlKey: 'beta-jacket',
      name: 'Beta Jacket',
      inStock: false,
      prices: {
        regular: {
          amount: 90,
          currency: 'USD',
        },
        final: {
          amount: 70,
          currency: 'USD',
        },
      },
    };

    commerceNodes.header.innerHTML = '<h1 class="pdp-header__title">Alpha Header</h1>';
    commerceNodes.priceRoot.innerHTML = '<span class="pdp-price__amount">$45.00</span>';

    const alphaExperience = buildExperienceModel(
      productAlpha,
      resolveExperienceOverridesForProduct(productAlpha, experienceSource),
    );

    renderProductDetailsExperience(sectionNodes, { experience: alphaExperience });
    syncProductDetailsCommerceUi(commerceNodes, {
      product: productAlpha,
      experience: alphaExperience,
    });

    assert.equal(sectionNodes.promo.querySelector('.product-details__promo-code')?.textContent, 'ALPHA30');
    assert.equal(sectionNodes.shippingCards.querySelector('.product-details__shipping-card-title')?.textContent, 'Alpha Pickup');
    assert.equal(sectionNodes.shippingPanel.textContent, 'Alpha shipping copy.');
    assert.equal(sectionNodes.reviewsSection.querySelector('.product-details__review-name')?.textContent, 'Alpha Reviewer');
    assert.equal(commerceNodes.stockTag.textContent, 'Shared stock message');
    assert.equal(commerceNodes.stickyName.textContent, 'Alpha Header');
    assert.equal(commerceNodes.stickyPrice.textContent, '$45.00');

    commerceNodes.header.innerHTML = '<h1 class="pdp-header__title">Beta Header</h1>';
    commerceNodes.priceRoot.innerHTML = '<span class="pdp-price__amount">$70.00</span>';

    const betaExperience = buildExperienceModel(
      productBeta,
      resolveExperienceOverridesForProduct(productBeta, experienceSource),
    );

    renderProductDetailsExperience(sectionNodes, { experience: betaExperience });
    syncProductDetailsCommerceUi(commerceNodes, {
      product: productBeta,
      experience: betaExperience,
    });

    assert.equal(sectionNodes.promo.querySelector('.product-details__promo-code')?.textContent, 'BETA15');
    assert.equal(sectionNodes.shippingCards.querySelector('.product-details__shipping-card-title')?.textContent, 'Beta Returns');
    assert.equal(sectionNodes.shippingPanel.textContent, 'Beta shipping copy.');
    assert.equal(sectionNodes.reviewsSection.querySelector('.product-details__review-name')?.textContent, 'Beta Reviewer');
    assert.equal(commerceNodes.stockTag.textContent, 'Out of Stock');
    assert.equal(commerceNodes.stickyName.textContent, 'Beta Header');
    assert.equal(commerceNodes.stickyPrice.textContent, '$70.00');
  });
});

test('product-details experience view falls back to experience sticky copy and price summary', async () => {
  await withFakeDom(async ({ document }) => {
    const { commerceNodes } = createExperienceNodes(document);

    syncProductDetailsCommerceUi(commerceNodes, {
      product: {
        inStock: true,
      },
      experience: {
        stickyName: 'Fallback Sticky Name',
        stockMessage: 'Ready for pickup',
        priceSummary: {
          currentAmount: 38.99,
          currency: 'USD',
          savingsAmount: 0,
        },
      },
    });

    assert.equal(commerceNodes.stickyName.textContent, 'Fallback Sticky Name');
    assert.equal(commerceNodes.stickyPrice.textContent, '$38.99');
    assert.equal(commerceNodes.stockTag.textContent, 'Ready for pickup');
    assert.equal(commerceNodes.stickyAtc.classList.contains('is-hidden'), false);
  });
});
