import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCartSkus,
  getRecommendationBootstrapContext,
} from '../../blocks/product-recommendations/product-recommendations.lib.js';

test('getCartSkus returns an empty list for empty carts', () => {
  assert.deepEqual(getCartSkus({ totalQuantity: 0, items: [{ product: { sku: 'IGNORED' } }] }), []);
  assert.deepEqual(getCartSkus(undefined), []);
});

test('getCartSkus returns only defined product SKUs', () => {
  assert.deepEqual(getCartSkus({
    totalQuantity: 2,
    items: [
      { product: { sku: 'ADB150' } },
      { product: { sku: 'SKU-2' } },
      { product: {} },
    ],
  }), ['ADB150', 'SKU-2']);
});

test('getRecommendationBootstrapContext prefers the authored SKU on non-PDP pages', () => {
  const adobeDataLayer = {
    getState(path) {
      const state = {
        pageContext: { pageType: 'Category' },
        categoryContext: { name: 'Retail' },
        shoppingCartContext: {
          totalQuantity: 1,
          items: [{ product: { sku: 'CART-1' } }],
        },
      };

      return path ? state[path] : state;
    },
  };

  assert.deepEqual(getRecommendationBootstrapContext({
    authoredCurrentSku: 'ADB150',
    adobeDataLayer,
  }), {
    currentSku: 'ADB150',
    pageType: 'Category',
    category: 'Retail',
    cartSkus: ['CART-1'],
  });
});

test('getRecommendationBootstrapContext falls back to product context SKU', () => {
  const adobeDataLayer = {
    getState(path) {
      const state = {
        pageContext: { pageType: 'Product' },
        productContext: { sku: 'PDP-SKU' },
        shoppingCartContext: { totalQuantity: 0, items: [] },
      };

      return path ? state[path] : state;
    },
  };

  assert.deepEqual(getRecommendationBootstrapContext({
    authoredCurrentSku: '',
    adobeDataLayer,
  }), {
    currentSku: 'PDP-SKU',
    pageType: 'Product',
    category: undefined,
    cartSkus: [],
  });
});

test('getRecommendationBootstrapContext skips bootstrapping when no SKU is available', () => {
  const adobeDataLayer = {
    getState(path) {
      const state = {
        pageContext: { pageType: 'Category' },
        categoryContext: { name: 'Retail' },
      };

      return path ? state[path] : state;
    },
  };

  assert.deepEqual(getRecommendationBootstrapContext({
    authoredCurrentSku: '',
    adobeDataLayer,
  }), {});
});
