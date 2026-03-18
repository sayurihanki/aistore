import {
  getEntryById,
  getRackPayload,
  serializeBuilderPayload,
  serializeRackSummary,
} from './ez-rack-builder.lib.js';

export const COMMERCE_SELECTABLE_OPTION_TITLES = Object.freeze({
  rackType: 'Rack Type',
  spacing: 'Spacing',
  alignment: 'Alignment',
  assembly: 'Assembly',
});

export const COMMERCE_ENTERED_OPTION_TITLES = Object.freeze({
  rackName: 'Rack Name',
  serviceBranch: 'Service Branch',
  awardsSummary: 'Awards Summary',
  builderPayload: 'Builder Payload',
});

export function normalizeCommerceKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replaceAll('⅛', ' 1 8 ')
    .replaceAll('¼', ' 1 4 ')
    .replaceAll('⅜', ' 3 8 ')
    .replaceAll('½', ' 1 2 ')
    .replaceAll('⅝', ' 5 8 ')
    .replaceAll('¾', ' 3 4 ')
    .replaceAll('⅞', ' 7 8 ')
    .replaceAll('–', '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getOptionTitle(option = {}) {
  return option?.title || option?.label || '';
}

function getOptionValues(option = {}) {
  if (Array.isArray(option?.items)) return option.items;
  if (Array.isArray(option?.values)) return option.values;
  return [];
}

function getOptionValueLabel(optionValue = {}) {
  return optionValue?.title || optionValue?.label || optionValue?.value || '';
}

function getOptionValueUid(optionValue = {}) {
  return optionValue?.uid || optionValue?.id || optionValue?.value || '';
}

function getInputOptionTitle(option = {}) {
  return option?.title || option?.label || '';
}

function getInputOptionId(option = {}) {
  return option?.uid || option?.id || '';
}

function buildSelectableValuesIndex(option = {}) {
  const values = new Map();

  getOptionValues(option).forEach((optionValue) => {
    const label = getOptionValueLabel(optionValue);
    const key = normalizeCommerceKey(label);
    const uid = getOptionValueUid(optionValue);

    if (!key || !uid || values.has(key)) return;

    values.set(key, {
      uid,
      label,
      value: optionValue,
    });
  });

  return values;
}

function getSelectedOptionValue(data, state, collection, optionId) {
  const selected = getEntryById(collection, optionId);
  return selected?.commerceValue || selected?.label || '';
}

export function buildEzRackCommerceContract(data) {
  const mapOptionValues = (options = []) => options.map((option) => (
    option.commerceValue || option.label
  ));

  return {
    selectableOptions: [
      {
        title: COMMERCE_SELECTABLE_OPTION_TITLES.rackType,
        values: mapOptionValues(data?.rackTypes || []),
      },
      {
        title: COMMERCE_SELECTABLE_OPTION_TITLES.spacing,
        values: mapOptionValues(data?.options?.spacing || []),
      },
      {
        title: COMMERCE_SELECTABLE_OPTION_TITLES.alignment,
        values: mapOptionValues(data?.options?.alignment || []),
      },
      {
        title: COMMERCE_SELECTABLE_OPTION_TITLES.assembly,
        values: mapOptionValues(data?.options?.assembly || []),
      },
    ],
    enteredOptions: [
      COMMERCE_ENTERED_OPTION_TITLES.rackName,
      COMMERCE_ENTERED_OPTION_TITLES.serviceBranch,
      COMMERCE_ENTERED_OPTION_TITLES.awardsSummary,
      COMMERCE_ENTERED_OPTION_TITLES.builderPayload,
    ],
  };
}

export function buildCommerceContractIndex(product = {}) {
  const selectable = new Map();
  const entered = new Map();

  const selectableOptions = Array.isArray(product?.options) ? product.options : [];
  const enteredOptions = Array.isArray(product?.inputOptions) ? product.inputOptions : [];

  selectableOptions.forEach((option) => {
    const title = getOptionTitle(option);
    const key = normalizeCommerceKey(title);
    if (!key || selectable.has(key)) return;

    selectable.set(key, {
      id: option?.id || '',
      title,
      values: buildSelectableValuesIndex(option),
    });
  });

  enteredOptions.forEach((option) => {
    const title = getInputOptionTitle(option);
    const key = normalizeCommerceKey(title);
    const id = getInputOptionId(option);

    if (!key || !id || entered.has(key)) return;
    entered.set(key, {
      id,
      title,
    });
  });

  return {
    selectable,
    entered,
  };
}

function formatMissingValues(values = []) {
  return values
    .map((value) => `${value.title}: ${value.value}`)
    .join(', ');
}

export function validateCommerceProductContract(data, product = {}) {
  const contract = buildEzRackCommerceContract(data);
  const index = buildCommerceContractIndex(product);

  const missingOptions = [];
  const missingValues = [];
  const missingEnteredOptions = [];

  contract.selectableOptions.forEach((option) => {
    const key = normalizeCommerceKey(option.title);
    const matched = index.selectable.get(key);
    if (!matched) {
      missingOptions.push(option.title);
      return;
    }

    option.values.forEach((value) => {
      const valueKey = normalizeCommerceKey(value);
      if (!valueKey || matched.values.has(valueKey)) return;
      missingValues.push({
        title: option.title,
        value,
      });
    });
  });

  contract.enteredOptions.forEach((title) => {
    const key = normalizeCommerceKey(title);
    if (!index.entered.has(key)) {
      missingEnteredOptions.push(title);
    }
  });

  const valid = !missingOptions.length && !missingValues.length && !missingEnteredOptions.length;
  let blockerMessage = '';

  if (missingOptions.length) {
    blockerMessage = `Missing Commerce option(s): ${missingOptions.join(', ')}.`;
  } else if (missingValues.length) {
    blockerMessage = `Missing Commerce value(s): ${formatMissingValues(missingValues)}.`;
  } else if (missingEnteredOptions.length) {
    blockerMessage = `Missing Commerce text field(s): ${missingEnteredOptions.join(', ')}.`;
  }

  return {
    valid,
    blockerMessage,
    missingOptions,
    missingValues,
    missingEnteredOptions,
    contractIndex: index,
  };
}

function getSelectableContractValue(index, title, value) {
  const option = index.selectable.get(normalizeCommerceKey(title));
  const optionValue = option?.values?.get(normalizeCommerceKey(value));
  return optionValue?.uid || '';
}

function getEnteredContractId(index, title) {
  return index.entered.get(normalizeCommerceKey(title))?.id || '';
}

function pushSelectableOption(optionUIDs, uid) {
  if (!uid || optionUIDs.includes(uid)) return;
  optionUIDs.push(uid);
}

function pushEnteredOption(enteredOptions, uid, value) {
  const normalizedValue = String(value ?? '').trim();
  if (!uid || !normalizedValue) return;
  enteredOptions.push({
    uid,
    value: normalizedValue,
  });
}

export function createEzRackBuilderCartItem({
  sku,
  data,
  state,
  contractIndex,
}) {
  const index = contractIndex || buildCommerceContractIndex();
  const optionUIDs = [];
  const enteredOptions = [];

  const branch = getEntryById(data?.branches || [], state?.branchId);

  pushSelectableOption(
    optionUIDs,
    getSelectableContractValue(
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.rackType,
      getSelectedOptionValue(data, state, data?.rackTypes || [], state?.rackTypeId),
    ),
  );

  pushSelectableOption(
    optionUIDs,
    getSelectableContractValue(
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.spacing,
      getSelectedOptionValue(data, state, data?.options?.spacing || [], state?.options?.spacing),
    ),
  );

  pushSelectableOption(
    optionUIDs,
    getSelectableContractValue(
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.alignment,
      getSelectedOptionValue(
        data,
        state,
        data?.options?.alignment || [],
        state?.options?.alignment,
      ),
    ),
  );

  pushSelectableOption(
    optionUIDs,
    getSelectableContractValue(
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.assembly,
      getSelectedOptionValue(data, state, data?.options?.assembly || [], state?.options?.assembly),
    ),
  );

  pushEnteredOption(
    enteredOptions,
    getEnteredContractId(index, COMMERCE_ENTERED_OPTION_TITLES.rackName),
    state?.rackName || 'EZ Rack Builder Configuration',
  );

  pushEnteredOption(
    enteredOptions,
    getEnteredContractId(index, COMMERCE_ENTERED_OPTION_TITLES.serviceBranch),
    branch?.label || '',
  );

  pushEnteredOption(
    enteredOptions,
    getEnteredContractId(index, COMMERCE_ENTERED_OPTION_TITLES.awardsSummary),
    serializeRackSummary(data, state?.rackItems || []),
  );

  pushEnteredOption(
    enteredOptions,
    getEnteredContractId(index, COMMERCE_ENTERED_OPTION_TITLES.builderPayload),
    serializeBuilderPayload(data, state),
  );

  return {
    sku,
    quantity: 1,
    optionsUIDs: optionUIDs,
    enteredOptions,
  };
}

export function buildAddonCartItems(data, selectedAddonIds = []) {
  const selected = new Set(Array.isArray(selectedAddonIds) ? selectedAddonIds : []);
  return (data?.addons || [])
    .filter((addon) => selected.has(addon.id) && addon.sku)
    .map((addon) => ({
      sku: addon.sku,
      quantity: 1,
      customFields: {
        configuratorAddon: true,
        configuratorSource: addon.id,
      },
    }));
}

export function getBuilderPayloadPreview(data, state) {
  return getRackPayload(data, state);
}
