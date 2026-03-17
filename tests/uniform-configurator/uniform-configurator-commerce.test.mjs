/* eslint-disable import/extensions */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COMMERCE_ENTERED_OPTION_TITLES,
  COMMERCE_SELECTABLE_OPTION_TITLES,
  buildCommerceContractIndex,
  createUniformCommerceCartItem,
  createUniformCommerceContract,
  mergeCommerceContractProduct,
  normalizeCommerceKey,
  normalizeCoreCustomizableProduct,
  shouldAttemptCoreCustomizableFallback,
  validateCommerceProductContract,
} from '../../blocks/uniform-configurator/uniform-configurator.commerce.js';
import {
  buildLineItems,
  computeTotal,
  createInitialState,
  normalizeDataset,
} from '../../blocks/uniform-configurator/uniform-configurator.lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const datasetPath = resolve(
  __dirname,
  '../../data/configurators/marine-officer-dress-blues.json',
);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('⅛', '-1-8-')
    .replaceAll('¼', '-1-4-')
    .replaceAll('⅜', '-3-8-')
    .replaceAll('½', '-1-2-')
    .replaceAll('⅝', '-5-8-')
    .replaceAll('¾', '-3-4-')
    .replaceAll('⅞', '-7-8-')
    .replaceAll('–', '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadDataset() {
  const raw = JSON.parse(await readFile(datasetPath, 'utf8'));
  return normalizeDataset(raw);
}

function buildMockContractProduct(data) {
  const contract = createUniformCommerceContract(data);

  return {
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    options: contract.selectableOptions.map(({ title, values }) => ({
      id: `option-${slugify(title)}`,
      title,
      required: ![
        COMMERCE_SELECTABLE_OPTION_TITLES.shoeSize,
        COMMERCE_SELECTABLE_OPTION_TITLES.shoeWidth,
        COMMERCE_SELECTABLE_OPTION_TITLES.beltSize,
        COMMERCE_SELECTABLE_OPTION_TITLES.buckleStyle,
        COMMERCE_SELECTABLE_OPTION_TITLES.coverSize,
        COMMERCE_SELECTABLE_OPTION_TITLES.frameSize,
        COMMERCE_SELECTABLE_OPTION_TITLES.medalPackage,
        COMMERCE_SELECTABLE_OPTION_TITLES.additionalInsignia,
        COMMERCE_SELECTABLE_OPTION_TITLES.rushTailoring,
      ].includes(title),
      multi: title === COMMERCE_SELECTABLE_OPTION_TITLES.additionalInsignia,
      values: values.map((value) => ({
        id: `uid-${slugify(title)}-${slugify(value)}`,
        title: value,
      })),
    })),
    inputOptions: contract.enteredOptions.map((title) => ({
      id: `entered-${slugify(title)}`,
      title,
      required: false,
      type: title === COMMERCE_ENTERED_OPTION_TITLES.notes ? 'area' : 'field',
    })),
  };
}

function buildMockCoreCustomizableProduct() {
  return {
    __typename: 'SimpleProduct',
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    name: 'USMC-OFFICER-BLUES-PACKAGE',
    options: [
      {
        __typename: 'CustomizableDropDownOption',
        uid: 'core-option-rank',
        title: 'Rank',
        required: true,
        sort_order: 1,
        value: [
          {
            uid: 'core-value-rank-captain',
            title: 'Captain',
            sort_order: 1,
            price: 32,
            price_type: 'FIXED',
          },
        ],
      },
      {
        __typename: 'CustomizableCheckboxOption',
        uid: 'core-option-additional-insignia',
        title: 'Additional Insignia',
        required: false,
        sort_order: 2,
        value: [
          {
            uid: 'core-value-extra-marksmanship',
            title: 'Marksmanship Badge',
            sort_order: 1,
            price: 14,
            price_type: 'FIXED',
          },
          {
            uid: 'core-value-extra-aviator',
            title: 'Naval Aviator Wings',
            sort_order: 2,
            price: 24,
            price_type: 'FIXED',
          },
        ],
      },
      {
        __typename: 'CustomizableFieldOption',
        uid: 'core-input-chest',
        title: 'Measurement Chest',
        required: false,
        sort_order: 3,
        value: {
          uid: 'core-input-chest-value',
          max_characters: 32,
        },
      },
      {
        __typename: 'CustomizableAreaOption',
        uid: 'core-input-notes',
        title: 'Special Instructions',
        required: false,
        sort_order: 4,
        value: {
          uid: 'core-input-notes-value',
          max_characters: 500,
        },
      },
    ],
  };
}

test('buildCommerceContractIndex maps option titles and entered option titles to UIDs', async () => {
  const data = await loadDataset();
  const index = buildCommerceContractIndex(buildMockContractProduct(data));

  const rankOption = index.selectable.get(
    normalizeCommerceKey(COMMERCE_SELECTABLE_OPTION_TITLES.rank),
  );
  const captainValue = rankOption.values.get(normalizeCommerceKey('Captain'));
  const notesOption = index.entered.get(
    normalizeCommerceKey(COMMERCE_ENTERED_OPTION_TITLES.notes),
  );

  assert.equal(rankOption.title, 'Rank');
  assert.equal(captainValue.uid, 'uid-rank-captain');
  assert.equal(notesOption.id, 'entered-special-instructions');
});

test('validateCommerceProductContract catches missing option values from the Commerce contract', async () => {
  const data = await loadDataset();
  const product = buildMockContractProduct(data);

  product.options = product.options.filter((option) => option.title !== 'Cover Frame Size');

  const validation = validateCommerceProductContract(data, product);

  assert.equal(validation.valid, false);
  assert.equal(
    validation.missing.some((issue) => issue.title === 'Cover Frame Size'),
    true,
  );
});

test('normalizeCoreCustomizableProduct adapts Magento customizable options into the configurator contract shape', () => {
  const normalized = normalizeCoreCustomizableProduct(buildMockCoreCustomizableProduct());
  const index = buildCommerceContractIndex(normalized);

  assert.equal(normalized.options.length, 2);
  assert.equal(normalized.inputOptions.length, 2);
  assert.equal(
    index.selectable.get(normalizeCommerceKey('Rank')).values.get(normalizeCommerceKey('Captain')).uid,
    'core-value-rank-captain',
  );
  assert.equal(
    index.entered.get(normalizeCommerceKey('Measurement Chest')).id,
    'core-input-chest',
  );
});

test('mergeCommerceContractProduct prefers fallback selectable options and merges entered options', () => {
  const merged = mergeCommerceContractProduct(
    {
      __typename: 'SimpleProductView',
      sku: 'USMC-OFFICER-BLUES-PACKAGE',
      inputOptions: [
        {
          id: 'catalog-notes',
          title: 'Special Instructions',
          type: 'area',
        },
      ],
    },
    normalizeCoreCustomizableProduct(buildMockCoreCustomizableProduct()),
  );

  assert.equal(merged.options.length, 2);
  assert.equal(merged.inputOptions.length, 2);
  assert.equal(merged.inputOptions.some((option) => option.title === 'Measurement Chest'), true);
  assert.equal(merged.inputOptions.some((option) => option.title === 'Special Instructions'), true);
});

test('shouldAttemptCoreCustomizableFallback identifies thin simple-product ProductView payloads', () => {
  assert.equal(shouldAttemptCoreCustomizableFallback({}), true);
  assert.equal(shouldAttemptCoreCustomizableFallback({
    __typename: 'SimpleProductView',
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    options: [],
    inputOptions: [],
  }), true);
  assert.equal(shouldAttemptCoreCustomizableFallback({
    __typename: 'ComplexProductView',
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    options: [{ id: '1' }],
    inputOptions: [{ id: '2' }],
  }), false);
});

test('createUniformCommerceCartItem maps entered options and selectable UIDs', async () => {
  const data = await loadDataset();
  const contractIndex = buildCommerceContractIndex(buildMockContractProduct(data));
  const state = createInitialState(data);

  Object.assign(state.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
    rank: 'capt',
    shoeSize: '10',
    shoeWidth: 'W',
    notes: 'Ceremony date in six weeks.',
  });
  state.measurements.chest = '41.5';
  state.measurements.height = '70';

  const cartItem = createUniformCommerceCartItem({
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    data,
    state,
    contractIndex,
  });

  assert.deepEqual(cartItem.optionsUIDs, [
    'uid-coat-length-regular',
    'uid-coat-size-40',
    'uid-trouser-waist-34',
    'uid-trouser-inseam-32',
    'uid-shirt-neck-16',
    'uid-shirt-sleeve-34',
    'uid-collar-strip-16',
    'uid-rank-captain',
    'uid-oxford-dress-shoes-size-10',
    'uid-oxford-dress-shoes-width-wide-w',
  ]);
  assert.deepEqual(cartItem.enteredOptions, [
    {
      uid: 'entered-measurement-chest',
      value: '41.5',
    },
    {
      uid: 'entered-measurement-height',
      value: '70',
    },
    {
      uid: 'entered-special-instructions',
      value: 'Ceremony date in six weeks.',
    },
  ]);
});

test('dependency omission rules exclude child Commerce options when parent selections are absent', async () => {
  const data = await loadDataset();
  const contractIndex = buildCommerceContractIndex(buildMockContractProduct(data));
  const state = createInitialState(data);

  Object.assign(state.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
    rank: 'capt',
    shoeWidth: 'W',
    buckleStyle: 'sword',
    frameSize: 'XL',
  });

  const cartItem = createUniformCommerceCartItem({
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    data,
    state,
    contractIndex,
  });
  const lineItems = buildLineItems(data, state);
  const shoeWidthUid = contractIndex.selectable
    .get(normalizeCommerceKey(COMMERCE_SELECTABLE_OPTION_TITLES.shoeWidth))
    .values
    .get(normalizeCommerceKey('Wide (W)'))
    .uid;
  const buckleStyleUid = contractIndex.selectable
    .get(normalizeCommerceKey(COMMERCE_SELECTABLE_OPTION_TITLES.buckleStyle))
    .values
    .get(normalizeCommerceKey('Sword'))
    .uid;
  const frameSizeUid = contractIndex.selectable
    .get(normalizeCommerceKey(COMMERCE_SELECTABLE_OPTION_TITLES.frameSize))
    .values
    .get(normalizeCommerceKey('X-Large (7⅛–7¼)'))
    .uid;

  assert.equal(cartItem.optionsUIDs.includes(shoeWidthUid), false);
  assert.equal(cartItem.optionsUIDs.includes(buckleStyleUid), false);
  assert.equal(cartItem.optionsUIDs.includes(frameSizeUid), false);
  assert.equal(lineItems.some((item) => item.id === 'frame'), false);
});

test('price parity holds for base package only and a mixed package scenario', async () => {
  const data = await loadDataset();
  const baseState = createInitialState(data);

  Object.assign(baseState.selections, {
    coatLength: 'regular',
    coatSize: '40',
    trouserWaist: '34',
    trouserInseam: '32',
    shirtNeck: '16',
    shirtSleeve: '34',
    collarStrip: '16',
  });

  const mixedState = createInitialState(data);
  Object.assign(mixedState.selections, {
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
  mixedState.selections.extras['marksmanship-badge'] = true;
  mixedState.selections.extras['naval-aviator-wings'] = true;

  assert.equal(computeTotal(buildLineItems(data, baseState)), 678);
  assert.equal(computeTotal(buildLineItems(data, mixedState)), 1126);
});
