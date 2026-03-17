import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  createPrototypeActionState,
  computePricing,
  getInscriptionText,
  getPreviewState,
  normalizeDataset,
  sanitizeInscriptionValue,
} from '../../blocks/medal-rack-configurator/medal-rack-configurator.lib.js';

test('normalizeDataset fills defaults and resolves missing authored defaults', () => {
  const dataset = normalizeDataset({
    pricing: {
      base: '510',
      engraving: '65',
    },
    sizes: [
      {
        id: 'travel',
        label: 'Travel',
        dimensions: '7" x 9"',
        cost: '15',
      },
    ],
    defaults: {
      size: 'does-not-exist',
      inscription: '  <b>Always Faithful</b>  ',
    },
  });

  assert.equal(dataset.pricing.base, 510);
  assert.equal(dataset.pricing.engraving, 65);
  assert.equal(dataset.pricing.mountKit, 140);
  assert.equal(dataset.sizes[0].id, 'travel');
  assert.equal(dataset.defaults.size, 'travel');
  assert.equal(dataset.defaults.inscription, 'Always Faithful');
});

test('computePricing totals size, wood, hardware, and selected add-ons', () => {
  const dataset = normalizeDataset();
  const state = createInitialState(dataset);

  state.sizeId = 'lg';
  state.woodId = 'ebony';
  state.hardwareId = 'brass';
  state.addonIds = ['shadowbox', 'gift'];

  const pricing = computePricing(dataset, state);

  assert.equal(pricing.total, 1145);
  assert.deepEqual(
    pricing.lines.map((line) => [line.id, line.amount]),
    [
      ['base', 495],
      ['size', 120],
      ['wood', 80],
      ['hardware', 20],
      ['engraving', 60],
      ['mountKit', 140],
      ['addons', 230],
    ],
  );
});

test('inscription helpers sanitize markup, truncate, and fall back cleanly', () => {
  const longValue = 'Honor '.repeat(12);
  const sanitized = sanitizeInscriptionValue('  <em>Semper Fidelis</em>  ');

  assert.equal(sanitized, 'Semper Fidelis');
  assert.ok(sanitizeInscriptionValue(longValue).length <= 48);
  assert.equal(getInscriptionText('', 'Semper Fidelis'), 'Semper Fidelis');
});

test('getPreviewState returns branch watermark and finish tokens for the SVG', () => {
  const dataset = normalizeDataset();
  const state = createInitialState(dataset);

  state.woodId = 'mahogany';
  state.hardwareId = 'pewter';
  state.branchId = 'navy';

  const preview = getPreviewState(dataset, state);

  assert.equal(preview.woodGradientId, 'woodMahogany');
  assert.equal(preview.pinColor, '#667387');
  assert.equal(preview.plateColor, '#566171');
  assert.equal(preview.branchWatermark, 'NAVY');
});

test('prototype action state is always non-transactional', () => {
  const hidden = createPrototypeActionState(
    {
      primaryCtaLabel: 'Review prototype pricing',
      prototypeNote: 'Prototype only.',
    },
    false,
  );
  const shown = createPrototypeActionState(
    {
      primaryCtaLabel: 'Review prototype pricing',
      prototypeNote: 'Prototype only.',
    },
    true,
  );

  assert.equal(hidden.transactional, false);
  assert.equal(hidden.message, '');
  assert.equal(shown.transactional, false);
  assert.equal(shown.message, 'Prototype only.');
});
