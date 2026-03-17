import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  buildExperienceModel,
  getPriceSummary,
  normalizeExperienceOverrides,
  resolveExperienceDataSourceUrl,
  resolveExperienceOverridesForProduct,
} from '../../blocks/product-details/product-details.experience.mjs';
/* eslint-enable import/extensions */

test('resolveExperienceDataSourceUrl accepts repo-relative JSON sources', () => {
  assert.equal(
    resolveExperienceDataSourceUrl('/data/product-details/override.json', 'https://example.com'),
    'https://example.com/data/product-details/override.json',
  );
});

test('resolveExperienceDataSourceUrl rejects unsupported hosts', () => {
  assert.throws(
    () => resolveExperienceDataSourceUrl('https://example.org/override.json', 'https://example.com'),
    /repo-relative or hosted on da\.live/i,
  );
});

test('getPriceSummary calculates savings from regular and final prices', () => {
  const summary = getPriceSummary({
    prices: {
      regular: {
        amount: 47.99,
        currency: 'USD',
      },
      final: {
        amount: 38.99,
        currency: 'USD',
      },
    },
  });

  assert.equal(summary.currentAmount, 38.99);
  assert.equal(summary.regularAmount, 47.99);
  assert.equal(summary.savingsAmount, 9);
  assert.equal(summary.savingsPercent, 19);
});

test('buildExperienceModel falls back to shared defaults when overrides are absent', () => {
  const model = buildExperienceModel({
    name: 'USMC Eagle Globe & Anchor Hoodie',
    prices: {
      regular: {
        amount: 47.99,
        currency: 'USD',
      },
      final: {
        amount: 38.99,
        currency: 'USD',
      },
    },
  });

  assert.deepEqual(model.breadcrumbs, [
    { label: 'Home', href: '/' },
    { label: 'USMC Eagle Globe & Anchor Hoodie' },
  ]);
  assert.equal(model.eyebrow, 'USMC Licensed Collection');
  assert.equal(model.badges[1].label, 'Save 19%');
  assert.equal(model.promo.code, 'SEMPERFI20');
  assert.equal(model.reviews.count, 342);
  assert.equal(model.shippingCards.length, 3);
});

test('buildExperienceModel merges partial authored overrides without dropping defaults', () => {
  const model = buildExperienceModel(
    {
      name: 'USMC Hoodie Blue',
    },
    {
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Apparel', href: '/apparel' },
        { label: 'USMC Hoodie Blue' },
      ],
      promo: {
        code: 'FIELDTEST',
      },
      shippingCards: [
        {
          icon: 'truck',
          title: 'Fleet Delivery',
          subtitle: '2-3 day dispatch',
        },
      ],
      reviews: {
        rating: 4.6,
        items: [
          {
            name: 'Alex Harper',
            body: 'Outstanding fit and finish.',
          },
        ],
      },
      stockMessage: 'Limited issue available',
    },
  );

  assert.equal(model.breadcrumbs[1].label, 'Apparel');
  assert.equal(model.promo.code, 'FIELDTEST');
  assert.equal(model.promo.text, 'Extra 20% off with code');
  assert.equal(model.shippingCards[0].title, 'Fleet Delivery');
  assert.equal(model.reviews.rating, 4.6);
  assert.equal(model.reviews.items[0].initials, 'AH');
  assert.equal(model.stockMessage, 'Limited issue available');
});

test('normalizeExperienceOverrides preserves legacy flat overrides as shared defaults', () => {
  const legacy = {
    eyebrow: 'Legacy Collection',
    promo: {
      code: 'LEGACY15',
    },
  };

  assert.deepEqual(normalizeExperienceOverrides(legacy), {
    defaults: legacy,
    bySku: {},
    byUrlKey: {},
  });
});

test('resolveExperienceOverridesForProduct applies mapped defaults when no product entry matches', () => {
  const resolved = resolveExperienceOverridesForProduct(
    {
      sku: 'UNKNOWN-SKU',
      urlKey: 'unknown-product',
    },
    {
      defaults: {
        eyebrow: 'Shared Collection',
        promo: {
          code: 'DEFAULT20',
        },
      },
      bySku: {
        'MCX-ALPHA': {
          eyebrow: 'Alpha Collection',
        },
      },
    },
  );

  assert.equal(resolved.eyebrow, 'Shared Collection');
  assert.equal(resolved.promo.code, 'DEFAULT20');
});

test('resolveExperienceOverridesForProduct matches SKU entries using trimmed uppercase keys', () => {
  const resolved = resolveExperienceOverridesForProduct(
    {
      sku: '  mcx-alpha  ',
      urlKey: 'alpha-product',
    },
    {
      defaults: {
        promo: {
          text: 'Shared promo',
          code: 'DEFAULT20',
        },
      },
      bySku: {
        'MCX-ALPHA': {
          promo: {
            code: 'ALPHA30',
          },
          stockMessage: 'Ships today',
        },
      },
    },
  );

  assert.equal(resolved.promo.text, 'Shared promo');
  assert.equal(resolved.promo.code, 'ALPHA30');
  assert.equal(resolved.stockMessage, 'Ships today');
});

test('resolveExperienceOverridesForProduct falls back to URL key when SKU does not match', () => {
  const resolved = resolveExperienceOverridesForProduct(
    {
      sku: 'NO-SKU-MATCH',
      urlKey: '  alpha-product  ',
    },
    {
      defaults: {
        stickyName: 'Shared Name',
      },
      bySku: {
        'MCX-OTHER': {
          stickyName: 'Other Name',
        },
      },
      byUrlKey: {
        'alpha-product': {
          stickyName: 'Alpha Name',
          reviews: {
            count: 12,
          },
        },
      },
    },
  );

  assert.equal(resolved.stickyName, 'Alpha Name');
  assert.equal(resolved.reviews.count, 12);
});

test('resolveExperienceOverridesForProduct safely ignores malformed mapped sections', () => {
  const resolved = resolveExperienceOverridesForProduct(
    {
      sku: 'MCX-ALPHA',
      urlKey: 'alpha-product',
    },
    {
      defaults: 'invalid',
      bySku: {
        'MCX-ALPHA': 'invalid',
      },
      byUrlKey: ['invalid'],
    },
  );

  assert.deepEqual(resolved, {});
});
