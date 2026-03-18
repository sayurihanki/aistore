import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getProductActionMode,
  getProductOptionHighlights,
  getProductPriceSummary,
  getTabFilter,
  getVisibleFilters,
  normalizeTabs,
  parseCategoryPageConfig,
  parseSearchState,
  serializeSearchState,
} from '../../blocks/mcx-category-page/mcx-category-page.lib.js';

test('parseCategoryPageConfig keeps urlPath and normalizes authored tabs', () => {
  const config = parseCategoryPageConfig([
    ['urlPath', 'apparel-footwear', '', ''],
    ['eyebrow', 'Apparel & Footwear', '', ''],
    ['title', 'GEAR UP.\nDRESS RIGHT.', '', ''],
    ['tab', 'Men\'s', 'categories', 'Men\'s'],
    ['tab', 'Footwear', 'categories', 'Footwear'],
  ]);

  assert.equal(config.urlPath, 'apparel-footwear');
  assert.equal(config.eyebrow, 'Apparel & Footwear');
  assert.equal(config.tabs[0].id, 'all');
  assert.equal(config.tabs[0].label, 'All');
  assert.deepEqual(getTabFilter(config.tabs[1]), {
    attribute: 'categories',
    in: ['Men\'s'],
  });
});

test('serializeSearchState and parseSearchState round-trip category state', () => {
  const tabs = normalizeTabs([
    { label: 'Men\'s', attribute: 'categories', value: 'Men\'s' },
    { label: 'Footwear', attribute: 'categories', value: 'Footwear' },
  ]);
  const params = serializeSearchState({
    page: 3,
    sort: [{ attribute: 'price', direction: 'ASC' }],
    filters: [
      { attribute: 'brand', in: ['Nike', 'Under Armour'] },
      { attribute: 'price', range: { from: 50, to: 150 } },
    ],
    tabId: 'footwear',
  });
  const parsed = parseSearchState(`?${params.toString()}`, tabs);

  assert.equal(parsed.page, 3);
  assert.deepEqual(parsed.sort, [{ attribute: 'price', direction: 'ASC' }]);
  assert.equal(parsed.tabId, 'footwear');
  assert.deepEqual(parsed.filters, [
    { attribute: 'brand', in: ['Nike', 'Under Armour'] },
    { attribute: 'price', range: { from: 50, to: 150 } },
  ]);
});

test('getVisibleFilters removes base category, tab, and visibility filters', () => {
  const visibleFilters = getVisibleFilters([
    { attribute: 'categoryPath', eq: 'apparel-footwear' },
    { attribute: 'categories', in: ['Footwear'] },
    { attribute: 'visibility', in: ['Catalog, Search', 'Search'] },
    { attribute: 'brand', in: ['Nike'] },
    { attribute: 'price', range: { from: 75, to: 150 } },
  ], {
    urlPath: 'apparel-footwear',
    activeTab: {
      id: 'footwear',
      label: 'Footwear',
      attribute: 'categories',
      value: 'Footwear',
    },
  });

  assert.deepEqual(visibleFilters, [
    { attribute: 'brand', in: ['Nike'] },
    { attribute: 'price', range: { from: 75, to: 150 } },
  ]);
});

test('getProductPriceSummary handles simple and complex product pricing', () => {
  const simple = getProductPriceSummary({
    typename: 'SimpleProductView',
    price: {
      final: { amount: { value: 64.99, currency: 'USD' } },
      regular: { amount: { value: 79.99, currency: 'USD' } },
    },
  });
  const complex = getProductPriceSummary({
    typename: 'ComplexProductView',
    priceRange: {
      minimum: {
        final: { amount: { value: 129.99, currency: 'USD' } },
        regular: { amount: { value: 149.99, currency: 'USD' } },
      },
      maximum: {
        final: { amount: { value: 189.99, currency: 'USD' } },
        regular: { amount: { value: 219.99, currency: 'USD' } },
      },
    },
  });

  assert.equal(simple.isRange, false);
  assert.equal(simple.current, '$64.99');
  assert.equal(simple.original, '$79.99');
  assert.equal(simple.discounted, true);
  assert.equal(complex.isRange, true);
  assert.equal(complex.current, '$129.99 - $189.99');
  assert.equal(complex.original, '$149.99 - $219.99');
  assert.equal(complex.discounted, true);
});

test('getProductOptionHighlights and action mode support complex and simple products', () => {
  const highlights = getProductOptionHighlights({
    typename: 'ComplexProductView',
    options: [
      {
        title: 'Color',
        values: [
          { title: 'Black', value: '#111111' },
          { title: 'Coyote', value: '#8B7355' },
        ],
      },
      {
        title: 'Size',
        values: [
          { title: '8' },
          { title: '9' },
          { title: '10' },
        ],
      },
    ],
  });

  assert.deepEqual(highlights.swatches, [
    { label: 'Black', value: '#111111' },
    { label: 'Coyote', value: '#8B7355' },
  ]);
  assert.deepEqual(highlights.sizes, ['8', '9', '10']);
  assert.equal(getProductActionMode({ typename: 'ComplexProductView', inStock: true }), 'link');
  assert.equal(getProductActionMode({ typename: 'SimpleProductView', inStock: true }), 'cart');
  assert.equal(getProductActionMode({ typename: 'SimpleProductView', inStock: false }), 'disabled');
});
