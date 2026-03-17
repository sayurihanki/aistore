import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  normalizeDataset,
  parseAuthoredDatasetRows,
  resolveMappedValue,
  resolveTechnicalDetails,
  shouldRenderTechnicalDetails,
} from '../../blocks/product-technical-details/product-technical-details.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeDataset preserves section order and opens the first section by default', () => {
  const dataset = normalizeDataset({
    detailsSections: [
      {
        title: 'Dimensions',
        rows: [{ label: 'Height', value: '2,000 mm' }],
      },
      {
        title: 'Power',
        rows: [{ label: 'Current', value: '16 A' }],
      },
    ],
  });

  assert.equal(dataset.detailsSections[0].title, 'Dimensions');
  assert.equal(dataset.detailsSections[0].open, true);
  assert.equal(dataset.detailsSections[1].title, 'Power');
  assert.equal(dataset.detailsSections[1].open, false);
});

test('parseAuthoredDatasetRows converts Google Docs rows into a normalized dataset', () => {
  const dataset = parseAuthoredDatasetRows([
    ['presentation', 'rack-immersive'],
    ['specs-title', 'Technical Specifications'],
    ['spec-card', 'U', 'Rack Height (EIA-310)', 'rack_height', '42', 'U'],
    ['feature', 'Hot-Swap Rails', 'Tool-free slide-rail mounting.'],
    ['detail-section', 'Dimensions and Physical', 'true'],
    ['detail-row', 'External Height', '2,000 mm (78.7 in)'],
    ['detail-row', 'Operating Temperature', '0-45 deg C', 'operating_temperature'],
  ]);

  assert.equal(dataset.specsTitle, 'Technical Specifications');
  assert.equal(dataset.specCards[0].label, 'Rack Height (EIA-310)');
  assert.equal(dataset.specCards[0].fallbackValue, '42');
  assert.equal(dataset.features[0].title, 'Hot-Swap Rails');
  assert.equal(dataset.detailsSections[0].title, 'Dimensions and Physical');
  assert.equal(dataset.detailsSections[0].open, true);
  assert.equal(dataset.detailsSections[0].rows[1].attribute, 'operating_temperature');
});

test('resolveMappedValue prefers product attributes and falls back to authored values', () => {
  const product = {
    attributes: [
      {
        name: 'rack_height',
        value: '48',
      },
    ],
  };

  assert.equal(
    resolveMappedValue(product, {
      attribute: 'rack_height',
      fallbackValue: '42',
    }),
    '48',
  );

  assert.equal(
    resolveMappedValue(product, {
      attribute: 'missing_value',
      value: 'authored',
    }),
    'authored',
  );
});

test('resolveTechnicalDetails maps cards and detail rows from product attributes', () => {
  const product = {
    attributes: [
      {
        name: 'rack_height',
        value: '42',
      },
      {
        name: 'operating_temperature',
        value: '0-45 deg C',
      },
    ],
  };

  const model = resolveTechnicalDetails(product, {
    specCards: [
      {
        label: 'Rack Height',
        attribute: 'rack_height',
        fallbackValue: '24',
        unit: 'U',
      },
    ],
    detailsSections: [
      {
        title: 'Cooling',
        rows: [
          {
            label: 'Operating Temperature',
            attribute: 'operating_temperature',
            value: '5-35 deg C',
          },
        ],
      },
    ],
  });

  assert.equal(model.specCards[0].displayValue, '42');
  assert.equal(model.specCards[0].displayUnit, 'U');
  assert.equal(model.detailsSections[0].rows[0].resolvedValue, '0-45 deg C');
});

test('shouldRenderTechnicalDetails gates immersive mode on the ready payload', () => {
  assert.equal(shouldRenderTechnicalDetails('default', null), true);
  assert.equal(
    shouldRenderTechnicalDetails('rack-immersive', {
      status: 'ready',
      presentation: 'rack-immersive',
    }),
    true,
  );
  assert.equal(
    shouldRenderTechnicalDetails('rack-immersive', {
      status: 'ready',
      presentation: 'default',
    }),
    false,
  );
});
