export function normalizeKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatMoney(amount, currency = 'USD', locale = 'en-US') {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${currency} ${parsed.toFixed(2)}`;
  }
}

export function extractDisplayPrice(product = {}) {
  const liveAmount = product?.prices?.final?.amount;
  const liveCurrency = product?.prices?.final?.currency;
  if (Number.isFinite(liveAmount)) {
    return { amount: liveAmount, currency: liveCurrency || 'USD' };
  }

  const rawAmount = product?.price?.final?.amount?.value;
  const rawCurrency = product?.price?.final?.amount?.currency;
  if (Number.isFinite(rawAmount)) {
    return { amount: rawAmount, currency: rawCurrency || 'USD' };
  }

  const rangedAmount = product?.priceRange?.minimum?.final?.amount?.value;
  const rangedCurrency = product?.priceRange?.minimum?.final?.amount?.currency;
  if (Number.isFinite(rangedAmount)) {
    return { amount: rangedAmount, currency: rangedCurrency || 'USD' };
  }

  return { amount: 0, currency: 'USD' };
}

export function normalizeProductOptions(product = {}, selectedUIDs = []) {
  const selected = Array.isArray(selectedUIDs) ? selectedUIDs : [];
  const productOptions = Array.isArray(product?.options) ? product.options : [];

  return productOptions.map((option) => {
    let values = [];
    if (Array.isArray(option?.values)) {
      values = option.values;
    } else if (Array.isArray(option?.items)) {
      values = option.items;
    }

    return {
      id: option?.id || '',
      label: option?.title || option?.label || '',
      required: Boolean(option?.required),
      multiple: Boolean(option?.multi || option?.multiple),
      items: values.map((item) => ({
        id: item?.id || '',
        label: item?.title || item?.label || '',
        inStock: item?.inStock !== false,
        selected: selected.includes(item?.id) || Boolean(item?.selected),
        productSku: item?.product?.sku || '',
      })),
    };
  });
}

export function findOptionByLabel(options = [], label = '') {
  const target = normalizeKey(label);
  return options.find((option) => normalizeKey(option.label) === target) || null;
}

export function findOptionValue(option, valueId) {
  const items = Array.isArray(option?.items) ? option.items : [];
  return items.find((item) => item.id === valueId) || null;
}

export function evaluateConditions(conditions = [], selections = {}) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const selected = selections[condition.controlId];

    if (Array.isArray(condition.includes) && condition.includes.length > 0) {
      return condition.includes.includes(selected);
    }

    if (Array.isArray(condition.excludes) && condition.excludes.length > 0) {
      return !condition.excludes.includes(selected);
    }

    if (condition.equals !== undefined) {
      return selected === condition.equals;
    }

    if (condition.notEquals !== undefined) {
      return selected !== condition.notEquals;
    }

    return true;
  });
}

function getProductType(product = {}) {
  return product?.__typename || product?.productType || '';
}

function getAllSchemaControls(schema = {}) {
  return (schema?.steps || []).flatMap((step) => (
    Array.isArray(step?.controls) ? step.controls : []
  ));
}

export function getConfiguratorCompatibility(schema = {}, product = {}, options = []) {
  const hasSelectableOptions = Array.isArray(product?.options) && product.options.length > 0;
  const hasInputOptions = Array.isArray(product?.inputOptions) && product.inputOptions.length > 0;

  if (!hasSelectableOptions && !hasInputOptions) {
    return {
      compatible: false,
      code: 'no-configurable-inputs',
      message: 'This product does not expose configurable PDP options.',
    };
  }

  const allowedProductTypes = Array.isArray(schema?.productTypes) ? schema.productTypes : [];
  if (allowedProductTypes.length > 0 && !allowedProductTypes.includes(getProductType(product))) {
    return {
      compatible: false,
      code: 'product-type-mismatch',
      message: `This configurator expects ${allowedProductTypes.join(', ')} products.`,
    };
  }

  const missingOptions = getAllSchemaControls(schema)
    .filter((control) => control?.source === 'commerce-option' && control?.required)
    .map((control) => control?.commerceOptionLabel)
    .filter(Boolean)
    .filter((label) => !findOptionByLabel(options, label));

  if (missingOptions.length > 0) {
    return {
      compatible: false,
      code: 'missing-commerce-options',
      missingOptions,
      message: `Missing Commerce option(s): ${missingOptions.join(', ')}.`,
    };
  }

  return {
    compatible: true,
    code: 'compatible',
    message: '',
  };
}

export function buildCartItems(values = {}, selectedAddons = [], quantity = 1) {
  const baseQuantity = Number.isFinite(Number(quantity)) && Number(quantity) > 0
    ? Number(quantity)
    : 1;

  const baseItem = {
    sku: values?.sku || '',
    quantity: baseQuantity,
  };

  if (Array.isArray(values?.optionsUIDs) && values.optionsUIDs.length > 0) {
    baseItem.optionsUIDs = values.optionsUIDs;
  }

  if (Array.isArray(values?.enteredOptions) && values.enteredOptions.length > 0) {
    baseItem.enteredOptions = values.enteredOptions;
  }

  const addonItems = (Array.isArray(selectedAddons) ? selectedAddons : [])
    .filter((addon) => addon?.sku)
    .map((addon) => ({
      sku: addon.sku,
      quantity: addon.quantityStrategy === 'fixed-1' ? 1 : baseQuantity,
      customFields: {
        configuratorAddon: true,
        configuratorSource: addon.id || addon.sku,
      },
    }));

  return [baseItem, ...addonItems];
}
