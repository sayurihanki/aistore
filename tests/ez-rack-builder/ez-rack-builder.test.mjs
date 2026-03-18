import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyImportProfile,
  createInitialState,
  getAwardsPage,
  getRackPayload,
  getRackRows,
  getDeviceSummary,
  normalizeDataset,
  normalizeDeviceSelections,
  serializeBuilderPayload,
  sortRackItems,
  upsertRackItem,
} from '../../blocks/ez-rack-builder/ez-rack-builder.lib.js';
import {
  buildCommerceContractIndex,
  createEzRackBuilderCartItem,
  validateCommerceProductContract,
} from '../../blocks/ez-rack-builder/ez-rack-builder.commerce.js';

function createSampleDataset() {
  return normalizeDataset({
    id: 'ez-rack-builder-usmc',
    version: '1.0.0',
    currency: 'USD',
    width: 3,
    branches: [
      {
        id: 'usmc',
        label: 'Marine Corps',
        status: 'enabled',
        icon: 'EGA',
        watermark: 'USMC',
      },
    ],
    rackTypes: [
      {
        id: 'standard-ribbons',
        label: 'Standard Ribbons',
        commerceValue: 'Standard Ribbons',
        description: 'Standard',
      },
      {
        id: 'thin-ribbons',
        label: 'Thin Ribbons',
        commerceValue: 'Thin Ribbons',
        description: 'Thin',
      },
    ],
    options: {
      spacing: [
        { id: 'flush', label: 'Flush', commerceValue: 'Flush' },
        { id: 'padded', label: 'Padded', commerceValue: 'Padded' },
      ],
      alignment: [
        { id: 'centered', label: 'Centered', commerceValue: 'Centered' },
        { id: 'right', label: 'Right', commerceValue: 'Right' },
      ],
      assembly: [
        { id: 'assembled', label: 'Assembled', commerceValue: 'Assembled' },
        { id: 'unassembled', label: 'Unassembled', commerceValue: 'Unassembled' },
      ],
    },
    devices: [
      {
        id: 'bronze-star',
        label: 'Bronze Star',
        type: 'count',
        max: 5,
        symbol: '*',
      },
      {
        id: 'gold-v',
        label: 'Gold V',
        type: 'toggle',
        max: 1,
        symbol: 'V',
      },
      {
        id: 'numerals',
        label: 'Numerals',
        type: 'text',
        max: 3,
        symbol: 'N',
      },
    ],
    awards: [
      {
        id: 'air-medal',
        branchId: 'usmc',
        label: 'Air Medal',
        precedence: 10,
        gradient: 'linear-gradient(red, blue)',
        category: 'Personal Decorations',
        searchTokens: ['air medal'],
        deviceIds: ['bronze-star', 'gold-v', 'numerals'],
      },
      {
        id: 'combat-action',
        branchId: 'usmc',
        label: 'Combat Action Ribbon',
        precedence: 15,
        gradient: 'linear-gradient(green, gold)',
        category: 'Combat and Valor',
        searchTokens: ['combat action'],
        deviceIds: [],
      },
      {
        id: 'natl-defense',
        branchId: 'usmc',
        label: 'National Defense',
        precedence: 20,
        gradient: 'linear-gradient(white, red)',
        category: 'Service Awards',
        searchTokens: ['national defense'],
        deviceIds: ['bronze-star'],
      },
    ],
    importProfiles: [
      {
        id: 'combat-tour',
        label: 'Combat Tour',
        description: 'Sample profile',
        awardIds: ['natl-defense', 'air-medal'],
      },
    ],
  });
}

function createSampleProduct() {
  return {
    options: [
      {
        id: 'rack-type',
        title: 'Rack Type',
        values: [
          { id: 'uid-standard', title: 'Standard Ribbons' },
          { id: 'uid-thin', title: 'Thin Ribbons' },
        ],
      },
      {
        id: 'spacing',
        title: 'Spacing',
        values: [
          { id: 'uid-flush', title: 'Flush' },
          { id: 'uid-padded', title: 'Padded' },
        ],
      },
      {
        id: 'alignment',
        title: 'Alignment',
        values: [
          { id: 'uid-centered', title: 'Centered' },
          { id: 'uid-right', title: 'Right' },
        ],
      },
      {
        id: 'assembly',
        title: 'Assembly',
        values: [
          { id: 'uid-assembled', title: 'Assembled' },
          { id: 'uid-unassembled', title: 'Unassembled' },
        ],
      },
    ],
    inputOptions: [
      { id: 'uid-rack-name', title: 'Rack Name' },
      { id: 'uid-service-branch', title: 'Service Branch' },
      { id: 'uid-awards-summary', title: 'Awards Summary' },
      { id: 'uid-builder-payload', title: 'Builder Payload' },
    ],
  };
}

test('normalizeDataset sorts awards by precedence and preserves rack contract values', () => {
  const dataset = createSampleDataset();

  assert.equal(dataset.rackTypes[0].commerceValue, 'Standard Ribbons');
  assert.deepEqual(dataset.awards.map((award) => award.id), [
    'air-medal',
    'combat-action',
    'natl-defense',
  ]);
});

test('createInitialState auto-selects the only enabled branch and seeds option defaults', () => {
  const dataset = createSampleDataset();
  const state = createInitialState(dataset);

  assert.equal(state.branchId, 'usmc');
  assert.equal(state.options.spacing, 'flush');
  assert.equal(state.options.alignment, 'centered');
  assert.equal(state.options.assembly, 'assembled');
});

test('getAwardsPage filters by category and search query while preserving pagination info', () => {
  const dataset = createSampleDataset();
  const page = getAwardsPage(dataset, {
    branchId: 'usmc',
    selectedCategory: 'Service Awards',
    searchQuery: 'national',
    page: 0,
    pageSize: 12,
  });

  assert.equal(page.total, 1);
  assert.equal(page.items[0].id, 'natl-defense');
  assert.equal(page.pageCount, 1);
});

test('upsertRackItem sorts rack items by precedence and getRackRows groups three wide', () => {
  const dataset = createSampleDataset();
  let rackItems = [];

  rackItems = upsertRackItem(dataset, 'natl-defense', rackItems);
  rackItems = upsertRackItem(dataset, 'air-medal', rackItems);
  rackItems = upsertRackItem(dataset, 'combat-action', rackItems);

  assert.deepEqual(sortRackItems(dataset, rackItems).map((item) => item.awardId), [
    'air-medal',
    'combat-action',
    'natl-defense',
  ]);
  assert.equal(getRackRows(dataset, rackItems).length, 1);
});

test('normalizeDeviceSelections clamps counts, keeps toggles, and trims text for summaries', () => {
  const dataset = createSampleDataset();
  const devices = normalizeDeviceSelections(dataset, 'air-medal', {
    'bronze-star': 7,
    'gold-v': true,
    numerals: '  12  ',
  });

  const summary = getDeviceSummary(dataset, {
    awardId: 'air-medal',
    devices,
  });

  assert.deepEqual(devices, {
    'bronze-star': 5,
    'gold-v': true,
    numerals: '12',
  });
  assert.match(summary, /Bronze Star x5/);
  assert.match(summary, /Gold V/);
  assert.match(summary, /Numerals: 12/);
});

test('applyImportProfile seeds rack items in precedence order for the current branch', () => {
  const dataset = createSampleDataset();
  const rackItems = applyImportProfile(dataset, 'usmc', 'combat-tour');

  assert.deepEqual(rackItems.map((item) => item.awardId), ['air-medal', 'natl-defense']);
});

test('serializeBuilderPayload emits a normalized rack payload snapshot', () => {
  const dataset = createSampleDataset();
  const state = createInitialState(dataset);
  state.rackTypeId = 'standard-ribbons';
  state.rackName = '  My Rack  ';
  state.rackItems = upsertRackItem(dataset, 'air-medal', [], {
    'bronze-star': 2,
  });

  const payload = getRackPayload(dataset, state);
  const serialized = JSON.parse(serializeBuilderPayload(dataset, state));

  assert.equal(payload.rackName, 'My Rack');
  assert.equal(payload.awards[0].devices['bronze-star'], 2);
  assert.equal(serialized.rackType.label, 'Standard Ribbons');
});

test('validateCommerceProductContract accepts exact option and text field titles', () => {
  const dataset = createSampleDataset();
  const result = validateCommerceProductContract(dataset, createSampleProduct());

  assert.equal(result.valid, true);
  assert.equal(result.missingOptions.length, 0);
  assert.equal(result.missingEnteredOptions.length, 0);
});

test('buildCommerceContractIndex resolves selectable values and text input ids', () => {
  const index = buildCommerceContractIndex(createSampleProduct());

  assert.equal(index.selectable.get('rack type').values.get('thin ribbons').uid, 'uid-thin');
  assert.equal(index.entered.get('builder payload').id, 'uid-builder-payload');
});

test('createEzRackBuilderCartItem maps rack selections into optionsUIDs and enteredOptions', () => {
  const dataset = createSampleDataset();
  const state = createInitialState(dataset);
  state.rackTypeId = 'thin-ribbons';
  state.options.spacing = 'padded';
  state.options.alignment = 'right';
  state.options.assembly = 'unassembled';
  state.rackName = 'Honor Rack';
  state.rackItems = upsertRackItem(dataset, 'air-medal', [], {
    'bronze-star': 2,
    'gold-v': true,
  });

  const cartItem = createEzRackBuilderCartItem({
    sku: 'USMC-EZ-RACK',
    data: dataset,
    state,
    contractIndex: buildCommerceContractIndex(createSampleProduct()),
  });

  assert.deepEqual(cartItem.optionsUIDs, [
    'uid-thin',
    'uid-padded',
    'uid-right',
    'uid-unassembled',
  ]);
  assert.equal(cartItem.enteredOptions.length, 4);
  assert.equal(cartItem.enteredOptions[0].uid, 'uid-rack-name');
  assert.match(cartItem.enteredOptions[2].value, /Air Medal/);
  assert.match(cartItem.enteredOptions[3].value, /"branch"/);
});
