/* eslint-disable import/extensions */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildLineItems,
  computeTotal,
  createInitialState,
  createSubmitPayload,
  mapRankPreview,
  normalizeDataset,
  validateStepsUpTo,
} from '../../blocks/uniform-configurator/uniform-configurator.lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const datasetPath = resolve(
  __dirname,
  '../../data/configurators/marine-officer-dress-blues.json',
);

async function loadDataset() {
  const raw = JSON.parse(await readFile(datasetPath, 'utf8'));
  return normalizeDataset(raw);
}

test('normalizeDataset loads the seeded marine dress blues dataset', async () => {
  const data = await loadDataset();

  assert.equal(data.id, 'marine-officer-dress-blues');
  assert.equal(data.currency, 'USD');
  assert.equal(data.ranks.length, 10);
  assert.equal(data.options.belt.buckleStyles.length, 2);
});

test('buildLineItems and computeTotal include optional selections and rush tailoring', async () => {
  const data = await loadDataset();
  const state = createInitialState(data);

  Object.assign(state.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
    shoeSize: '10',
    shoeWidth: 'W',
    beltSize: '36',
    buckleStyle: 'sword',
    coverSize: '7¼',
    frameSize: 'XL',
    rank: 'capt',
    medalPackage: 'basic',
    rushTailoring: true,
  });
  state.selections.extras['marksmanship-badge'] = true;
  state.selections.extras['naval-aviator-wings'] = true;

  const items = buildLineItems(data, state);
  const total = computeTotal(items);

  assert.deepEqual(
    items.map((item) => item.id),
    [
      'coat',
      'trouser',
      'shirt',
      'shoes',
      'belt',
      'belt-style-sword',
      'cover',
      'frame',
      'rank',
      'medals',
      'marksmanship-badge',
      'naval-aviator-wings',
      'rush-tailoring',
    ],
  );
  assert.equal(total, 1126);
});

test('mapRankPreview returns the authored short label and preview count', async () => {
  const data = await loadDataset();
  const rank = data.ranks.find((item) => item.id === 'ltgen');
  const preview = mapRankPreview(rank);

  assert.equal(preview.shortLabel, 'LtGen');
  assert.equal(preview.type, 'stars');
  assert.equal(preview.count, 3);
});

test('validateStepsUpTo catches missing rank and invalid contact info', async () => {
  const data = await loadDataset();
  const state = createInitialState(data);

  Object.assign(state.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
    firstName: 'John',
    lastName: 'Smith',
    email: 'not-an-email',
  });

  const validation = validateStepsUpTo(5, state, data);

  assert.equal(validation.valid, false);
  assert.equal(validation.firstInvalidStep, 3);
  assert.equal(validation.errors.rank, 'Select an officer rank.');
  assert.equal(validation.errors.email, 'Enter a valid email address.');
});

test('createSubmitPayload serializes selected extras, contact, and measurements', async () => {
  const data = await loadDataset();
  const state = createInitialState(data);

  Object.assign(state.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
    rank: 'maj',
    medalPackage: 'standard',
    firstName: 'Jen',
    lastName: 'Hanki',
    email: 'jen@example.com',
    shippingOverride: true,
    shippingAddress: '123 Parade Deck',
    shippingCity: 'Quantico',
    shippingState: 'VA',
    shippingZip: '22134',
    notes: 'Ceremony date in six weeks.',
  });
  state.selections.extras['scuba-diver-badge'] = true;
  state.measurements.chest = '41.5';

  const lineItems = buildLineItems(data, state);
  const payload = createSubmitPayload({
    analyticsId: 'marine-officer-dress-blues',
    data,
    state,
    lineItems,
    total: computeTotal(lineItems),
    pageUrl: 'https://example.com/uniforms',
    referrer: 'https://example.com/start',
  });

  assert.equal(payload.analyticsId, 'marine-officer-dress-blues');
  assert.equal(payload.contact.email, 'jen@example.com');
  assert.equal(payload.shipping.override, true);
  assert.equal(payload.measurements.chest, 41.5);
  assert.deepEqual(payload.selections.accessories.extraIds, ['scuba-diver-badge']);
  assert.equal(payload.lineItems.at(-1).id, 'scuba-diver-badge');
});
