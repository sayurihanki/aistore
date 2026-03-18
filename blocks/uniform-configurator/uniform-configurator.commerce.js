import {
  MEASUREMENT_ORDER,
  RUSH_EXTRA_ID,
  getChoiceLabel,
  getRushExtra,
  getSelectedBuckleStyle,
  getSelectedMedalPackage,
  getSelectedRank,
} from './uniform-configurator.lib.js';

export const COMMERCE_SELECTABLE_OPTION_TITLES = Object.freeze({
  coatLength: 'Coat Length',
  coatSize: 'Coat Size',
  trouserWaist: 'Trouser Waist',
  trouserInseam: 'Trouser Inseam',
  shirtNeck: 'Shirt Neck',
  shirtSleeve: 'Shirt Sleeve',
  collarStrip: 'Collar Strip',
  rank: 'Rank',
  shoeSize: 'Oxford Dress Shoes Size',
  shoeWidth: 'Oxford Dress Shoes Width',
  beltSize: 'Belt Size',
  buckleStyle: 'Buckle Style',
  coverSize: 'Officer Service Cover Size',
  frameSize: 'Cover Frame Size',
  medalPackage: 'Medal Package',
  additionalInsignia: 'Additional Insignia',
  rushTailoring: 'Rush Tailoring',
});

export const COMMERCE_ENTERED_OPTION_TITLES = Object.freeze({
  chest: 'Measurement Chest',
  waist: 'Measurement Waist',
  hip: 'Measurement Hip',
  shoulder: 'Measurement Shoulder Width',
  sleeve: 'Measurement Sleeve Length',
  inseam: 'Measurement Inseam',
  neck: 'Measurement Neck',
  height: 'Measurement Height',
  weight: 'Measurement Weight',
  notes: 'Special Instructions',
});

const CORE_MULTIPLE_OPTION_TYPES = new Set([
  'CustomizableCheckboxOption',
  'CustomizableMultipleOption',
]);

const CORE_SELECTABLE_OPTION_TYPES = new Set([
  'CustomizableDropDownOption',
  'CustomizableCheckboxOption',
  'CustomizableMultipleOption',
  'CustomizableRadioOption',
]);

const CORE_ENTERED_OPTION_TYPES = new Set([
  'CustomizableFieldOption',
  'CustomizableAreaOption',
]);

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

function uniqueLabels(values = []) {
  const labels = new Map();

  values.forEach((value) => {
    const label = String(value || '').trim();
    const key = normalizeCommerceKey(label);
    if (key && !labels.has(key)) {
      labels.set(key, label);
    }
  });

  return [...labels.values()];
}

function getOptionTitle(option = {}) {
  return option?.title || option?.label || '';
}

function getOptionValues(option = {}) {
  if (Array.isArray(option?.items)) {
    return option.items;
  }

  if (Array.isArray(option?.values)) {
    return option.values;
  }

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

    if (!key || !uid || values.has(key)) {
      return;
    }

    values.set(key, {
      uid,
      label,
      value: optionValue,
    });
  });

  return values;
}

function withOptionalNone(labels = []) {
  return uniqueLabels(['None', ...labels]);
}

function buildSelectableContract(data) {
  const rushExtra = getRushExtra(data);

  return [
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.coatLength,
      values: data.options.coat.length.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.coatSize,
      values: data.options.coat.size.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.trouserWaist,
      values: data.options.trouser.waist.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.trouserInseam,
      values: data.options.trouser.inseam.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.shirtNeck,
      values: data.options.shirt.neck.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.shirtSleeve,
      values: data.options.shirt.sleeve.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.collarStrip,
      values: data.options.shirt.collarStrip.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.rank,
      values: data.ranks.map((rank) => rank.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.shoeSize,
      values: withOptionalNone(data.options.shoes.size.map((option) => option.label)),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.shoeWidth,
      values: data.options.shoes.width.map((option) => option.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.beltSize,
      values: withOptionalNone(data.options.belt.size.map((option) => option.label)),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.buckleStyle,
      values: data.options.belt.buckleStyles.map((style) => style.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.coverSize,
      values: withOptionalNone(data.options.cover.size.map((option) => option.label)),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.frameSize,
      values: withOptionalNone(data.options.frame.size.map((option) => option.label)),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.medalPackage,
      values: data.medalPackages.map((medalPackage) => medalPackage.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.additionalInsignia,
      values: data.extras
        .filter((extra) => extra.id !== RUSH_EXTRA_ID)
        .map((extra) => extra.label),
    },
    {
      title: COMMERCE_SELECTABLE_OPTION_TITLES.rushTailoring,
      values: rushExtra ? [rushExtra.label] : [],
    },
  ];
}

function buildEnteredContract() {
  return [
    ...MEASUREMENT_ORDER.map((key) => COMMERCE_ENTERED_OPTION_TITLES[key]),
    COMMERCE_ENTERED_OPTION_TITLES.notes,
  ];
}

export function createUniformCommerceContract(data) {
  return {
    selectableOptions: buildSelectableContract(data),
    enteredOptions: buildEnteredContract(),
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

    if (!key || selectable.has(key)) {
      return;
    }

    selectable.set(key, {
      id: option?.id || '',
      title,
      required: Boolean(option?.required),
      multiple: Boolean(option?.multiple || option?.multi),
      values: buildSelectableValuesIndex(option),
      option,
    });
  });

  enteredOptions.forEach((option) => {
    const title = getInputOptionTitle(option);
    const key = normalizeCommerceKey(title);
    const id = getInputOptionId(option);

    if (!key || !id || entered.has(key)) {
      return;
    }

    entered.set(key, {
      id,
      title,
      required: Boolean(option?.required),
      option,
    });
  });

  return {
    selectable,
    entered,
  };
}

function normalizeCoreCustomizableValues(rawValues) {
  let values = [];
  if (Array.isArray(rawValues)) {
    values = rawValues;
  } else if (rawValues) {
    values = [rawValues];
  }

  return values
    .map((value) => ({
      id: value?.uid || '',
      uid: value?.uid || '',
      title: value?.title || '',
      label: value?.title || '',
      value: value?.title || '',
      sortOrder: value?.sort_order ?? 0,
      price: value?.price ?? 0,
      priceType: value?.price_type || '',
      sku: value?.sku || '',
    }))
    .filter((value) => value.uid && value.title);
}

export function normalizeCoreCustomizableProduct(product = {}) {
  const normalized = {
    __typename: product?.__typename || 'CustomizableProductInterface',
    sku: product?.sku || '',
    name: product?.name || '',
    options: [],
    inputOptions: [],
  };

  const options = Array.isArray(product?.options) ? product.options : [];

  options.forEach((option) => {
    const typename = option?.__typename || '';
    const title = option?.title || '';
    const uid = option?.uid || '';

    if (!title || !uid) {
      return;
    }

    if (CORE_SELECTABLE_OPTION_TYPES.has(typename)) {
      normalized.options.push({
        id: uid,
        uid,
        title,
        label: title,
        required: Boolean(option?.required),
        multi: CORE_MULTIPLE_OPTION_TYPES.has(typename),
        multiple: CORE_MULTIPLE_OPTION_TYPES.has(typename),
        values: normalizeCoreCustomizableValues(option?.value),
      });
      return;
    }

    if (CORE_ENTERED_OPTION_TYPES.has(typename)) {
      normalized.inputOptions.push({
        id: uid,
        uid,
        title,
        label: title,
        required: Boolean(option?.required),
        type: typename === 'CustomizableAreaOption' ? 'area' : 'field',
      });
    }
  });

  return normalized;
}

function mergeEnteredOptions(primary = [], secondary = []) {
  const merged = new Map();

  [...primary, ...secondary].forEach((option) => {
    const title = option?.title || option?.label || '';
    const key = normalizeCommerceKey(title);

    if (!key) {
      return;
    }

    merged.set(key, option);
  });

  return [...merged.values()];
}

export function mergeCommerceContractProduct(primaryProduct = {}, contractProduct = {}) {
  let mergedOptions = [];
  if (Array.isArray(contractProduct?.options) && contractProduct.options.length > 0) {
    mergedOptions = contractProduct.options;
  } else if (Array.isArray(primaryProduct?.options)) {
    mergedOptions = primaryProduct.options;
  }

  return {
    ...primaryProduct,
    ...contractProduct,
    sku: primaryProduct?.sku || contractProduct?.sku || '',
    name: primaryProduct?.name || contractProduct?.name || '',
    options: mergedOptions,
    inputOptions: mergeEnteredOptions(primaryProduct?.inputOptions, contractProduct?.inputOptions),
  };
}

export function shouldAttemptCoreCustomizableFallback(product = {}, validation = null) {
  if (!product?.sku) {
    return true;
  }

  if (product?.__typename !== 'SimpleProductView') {
    return false;
  }

  const hasSelectableOptions = Array.isArray(product?.options) && product.options.length > 0;
  const hasEnteredOptions = Array.isArray(product?.inputOptions) && product.inputOptions.length > 0;

  if (!validation) {
    return !hasSelectableOptions || !hasEnteredOptions;
  }

  return !validation.valid && (!hasSelectableOptions || !hasEnteredOptions);
}

export function describeCommerceContractIssue(issue = {}) {
  if (issue.type === 'selectable-option') {
    return `Selectable option missing: ${issue.title}`;
  }

  if (issue.type === 'selectable-value') {
    return `Selectable value missing: ${issue.title} -> ${issue.value}`;
  }

  if (issue.type === 'entered-option') {
    return `Entered option missing: ${issue.title}`;
  }

  return 'Unknown Commerce contract issue';
}

export function validateCommerceProductContract(data, product = {}) {
  const contract = createUniformCommerceContract(data);
  const index = buildCommerceContractIndex(product);
  const missing = [];

  contract.selectableOptions.forEach(({ title, values }) => {
    const optionKey = normalizeCommerceKey(title);
    const option = index.selectable.get(optionKey);

    if (!option) {
      missing.push({
        type: 'selectable-option',
        title,
      });
      return;
    }

    values.forEach((value) => {
      const valueKey = normalizeCommerceKey(value);

      if (!valueKey || option.values.has(valueKey)) {
        return;
      }

      missing.push({
        type: 'selectable-value',
        title,
        value,
      });
    });
  });

  contract.enteredOptions.forEach((title) => {
    const optionKey = normalizeCommerceKey(title);

    if (index.entered.has(optionKey)) {
      return;
    }

    missing.push({
      type: 'entered-option',
      title,
    });
  });

  return {
    valid: missing.length === 0,
    missing,
    contract,
    index,
  };
}

function getSelectableContractValue(index, title, label, required = false) {
  if (!label) {
    if (required) {
      throw new Error(`Missing required Commerce selection for "${title}".`);
    }

    return null;
  }

  const option = index.selectable.get(normalizeCommerceKey(title));
  if (!option) {
    throw new Error(`Commerce option "${title}" is not available for this product.`);
  }

  const optionValue = option.values.get(normalizeCommerceKey(label));
  if (!optionValue) {
    throw new Error(`Commerce value "${label}" is not available under "${title}".`);
  }

  return optionValue;
}

function getEnteredContractValue(index, title) {
  const option = index.entered.get(normalizeCommerceKey(title));
  if (!option) {
    throw new Error(`Commerce input option "${title}" is not available for this product.`);
  }

  return option;
}

function pushSelectableOption(optionUIDs, seenUIDs, index, title, label, required = false) {
  const optionValue = getSelectableContractValue(index, title, label, required);

  if (!optionValue || seenUIDs.has(optionValue.uid)) {
    return;
  }

  seenUIDs.add(optionValue.uid);
  optionUIDs.push(optionValue.uid);
}

function pushEnteredOption(enteredOptions, seenUIDs, index, title, value) {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) {
    return;
  }

  const option = getEnteredContractValue(index, title);
  if (seenUIDs.has(option.id)) {
    return;
  }

  seenUIDs.add(option.id);
  enteredOptions.push({
    uid: option.id,
    value: normalizedValue,
  });
}

function isNoneLabel(label = '') {
  return normalizeCommerceKey(label) === normalizeCommerceKey('None');
}

export function createUniformCommerceCartItem({
  sku,
  data,
  state,
  contractIndex,
}) {
  const index = contractIndex || buildCommerceContractIndex();
  const optionUIDs = [];
  const enteredOptions = [];
  const selectedOptionUIDs = new Set();
  const selectedEnteredUIDs = new Set();

  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.coatLength,
    getChoiceLabel(data.options.coat.length, state.selections.coatLength),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.coatSize,
    getChoiceLabel(data.options.coat.size, state.selections.coatSize),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.trouserWaist,
    getChoiceLabel(data.options.trouser.waist, state.selections.trouserWaist),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.trouserInseam,
    getChoiceLabel(data.options.trouser.inseam, state.selections.trouserInseam),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.shirtNeck,
    getChoiceLabel(data.options.shirt.neck, state.selections.shirtNeck),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.shirtSleeve,
    getChoiceLabel(data.options.shirt.sleeve, state.selections.shirtSleeve),
    true,
  );
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.collarStrip,
    getChoiceLabel(data.options.shirt.collarStrip, state.selections.collarStrip),
    true,
  );

  const selectedRank = getSelectedRank(data, state);
  pushSelectableOption(
    optionUIDs,
    selectedOptionUIDs,
    index,
    COMMERCE_SELECTABLE_OPTION_TITLES.rank,
    selectedRank?.label || '',
    true,
  );

  if (state.selections.shoeSize) {
    pushSelectableOption(
      optionUIDs,
      selectedOptionUIDs,
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.shoeSize,
      getChoiceLabel(data.options.shoes.size, state.selections.shoeSize),
    );

    if (state.selections.shoeWidth) {
      pushSelectableOption(
        optionUIDs,
        selectedOptionUIDs,
        index,
        COMMERCE_SELECTABLE_OPTION_TITLES.shoeWidth,
        getChoiceLabel(data.options.shoes.width, state.selections.shoeWidth),
      );
    }
  }

  if (state.selections.beltSize) {
    pushSelectableOption(
      optionUIDs,
      selectedOptionUIDs,
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.beltSize,
      getChoiceLabel(data.options.belt.size, state.selections.beltSize),
    );

    const buckleStyle = getSelectedBuckleStyle(data, state);
    if (buckleStyle?.label) {
      pushSelectableOption(
        optionUIDs,
        selectedOptionUIDs,
        index,
        COMMERCE_SELECTABLE_OPTION_TITLES.buckleStyle,
        buckleStyle.label,
      );
    }
  }

  if (state.selections.coverSize) {
    pushSelectableOption(
      optionUIDs,
      selectedOptionUIDs,
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.coverSize,
      getChoiceLabel(data.options.cover.size, state.selections.coverSize),
    );

    if (state.selections.frameSize) {
      pushSelectableOption(
        optionUIDs,
        selectedOptionUIDs,
        index,
        COMMERCE_SELECTABLE_OPTION_TITLES.frameSize,
        getChoiceLabel(data.options.frame.size, state.selections.frameSize),
      );
    }
  }

  const medalPackage = getSelectedMedalPackage(data, state);
  if (medalPackage?.label && !isNoneLabel(medalPackage.label)) {
    pushSelectableOption(
      optionUIDs,
      selectedOptionUIDs,
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.medalPackage,
      medalPackage.label,
    );
  }

  data.extras
    .filter((extra) => extra.id !== RUSH_EXTRA_ID && state.selections.extras[extra.id])
    .forEach((extra) => {
      pushSelectableOption(
        optionUIDs,
        selectedOptionUIDs,
        index,
        COMMERCE_SELECTABLE_OPTION_TITLES.additionalInsignia,
        extra.label,
      );
    });

  const rushExtra = getRushExtra(data);
  if (rushExtra && state.selections.rushTailoring) {
    pushSelectableOption(
      optionUIDs,
      selectedOptionUIDs,
      index,
      COMMERCE_SELECTABLE_OPTION_TITLES.rushTailoring,
      rushExtra.label,
    );
  }

  MEASUREMENT_ORDER.forEach((key) => {
    pushEnteredOption(
      enteredOptions,
      selectedEnteredUIDs,
      index,
      COMMERCE_ENTERED_OPTION_TITLES[key],
      state.measurements[key],
    );
  });

  pushEnteredOption(
    enteredOptions,
    selectedEnteredUIDs,
    index,
    COMMERCE_ENTERED_OPTION_TITLES.notes,
    state.selections.notes,
  );

  return {
    sku,
    quantity: 1,
    optionsUIDs: optionUIDs,
    enteredOptions,
  };
}
