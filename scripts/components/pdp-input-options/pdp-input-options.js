import { events } from '@dropins/tools/event-bus.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { loadCSS } from '../../aem.js';

function normalizeLabel(value = '') {
  return String(value).trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInputOptions(product) {
  return Array.isArray(product?.inputOptions)
    ? [...product.inputOptions].sort((first, second) => {
      const firstOrder = toNumber(first?.sortOrder);
      const secondOrder = toNumber(second?.sortOrder);
      return firstOrder - secondOrder;
    })
    : [];
}

export function transformProductInputOptions(product = {}) {
  if (!Array.isArray(product?.inputOptions)) {
    return [];
  }

  return product.inputOptions.map((option) => ({
    id: option?.id || '',
    title: option?.title || option?.label || '',
    label: option?.title || option?.label || '',
    required: Boolean(option?.required),
    type: option?.type || 'text',
    suffix: option?.suffix || '',
    sortOrder: toNumber(option?.sortOrder),
    range: option?.range || null,
    imageSize: option?.imageSize || null,
    fileExtensions: option?.fileExtensions || '',
  }));
}

function normalizeEnteredOptions(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      const uid = entry?.uid || entry?.id || '';
      const value = entry?.value == null ? '' : String(entry.value).trim();

      if (!uid || !value) {
        return null;
      }

      return {
        uid,
        value,
      };
    })
    .filter(Boolean);
}

function filterEnteredOptionsForProduct(product, entries = []) {
  const allowedIds = new Set(getInputOptions(product).map((option) => option.id));

  if (allowedIds.size === 0) {
    return [];
  }

  return normalizeEnteredOptions(entries).filter((entry) => allowedIds.has(entry.uid));
}

function serializeEnteredOptions(entries = []) {
  return JSON.stringify(
    [...entries].sort((first, second) => first.uid.localeCompare(second.uid)),
  );
}

function getEnteredOptionValue(uid, entries = []) {
  return normalizeEnteredOptions(entries).find((entry) => entry.uid === uid)?.value || '';
}

function validateRequiredSelectableOptions(product, selectedOptions) {
  const productOptions = Array.isArray(product?.options) ? product.options : [];
  const optionUIDs = Array.isArray(selectedOptions) ? selectedOptions : [];
  const optionsToValidate = product?.isBundle
    ? productOptions.filter((option) => option.required)
    : productOptions;

  return optionsToValidate.length === 0 || optionUIDs.length >= optionsToValidate.length;
}

function validateRequiredInputOptions(product, enteredOptions) {
  const optionValues = new Map(
    filterEnteredOptionsForProduct(product, enteredOptions)
      .map((entry) => [entry.uid, entry.value]),
  );

  return getInputOptions(product).every((option) => {
    if (!option.required) {
      return true;
    }

    return Boolean(optionValues.get(option.id));
  });
}

export function validateRequiredProductConfiguration(product, values = {}) {
  return validateRequiredSelectableOptions(product, values?.optionsUIDs)
    && validateRequiredInputOptions(product, values?.enteredOptions);
}

export function deriveEnteredOptionsFromCustomizableOptions(
  inputOptions = [],
  customizableOptions = {},
) {
  if (!Array.isArray(inputOptions) || inputOptions.length === 0) {
    return [];
  }

  if (!customizableOptions || typeof customizableOptions !== 'object') {
    return [];
  }

  const optionsByLabel = new Map(
    Object.entries(customizableOptions).map(([label, value]) => [normalizeLabel(label), value]),
  );

  return inputOptions
    .map((option) => {
      const value = optionsByLabel.get(normalizeLabel(option?.title || option?.label || ''));

      if (value == null || String(value).trim() === '') {
        return null;
      }

      return {
        uid: option.id,
        value: String(value).trim(),
      };
    })
    .filter(Boolean);
}

function setEnteredOptionValue(entries, uid, value) {
  const normalizedEntries = normalizeEnteredOptions(entries);
  const nextEntries = normalizedEntries.filter((entry) => entry.uid !== uid);
  const normalizedValue = value == null ? '' : String(value).trim();

  if (!normalizedValue) {
    return nextEntries;
  }

  nextEntries.push({
    uid,
    value: normalizedValue,
  });

  return nextEntries;
}

function getFileExtensions(option) {
  return String(option?.fileExtensions || '')
    .split(',')
    .map((extension) => extension.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}

function getAcceptValue(option) {
  const extensions = getFileExtensions(option);
  return extensions.map((extension) => `.${extension}`).join(',');
}

function getOptionHelperText(option) {
  const details = [];

  if (option?.type === 'file') {
    const extensions = getFileExtensions(option);
    const width = option?.imageSize?.width;
    const height = option?.imageSize?.height;

    if (extensions.length > 0) {
      details.push(`Accepted file types: ${extensions.join(', ')}`);
    }

    if (width || height) {
      details.push(`Max image size: ${width || '?'} x ${height || '?'} px`);
    }
  }

  return details.join(' ');
}

function createImageBitmapDimensions(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected image.'));
    };

    image.src = objectUrl;
  });
}

async function validateSelectedFile(file, option) {
  if (!file) {
    return '';
  }

  const extensions = getFileExtensions(option);
  const selectedExtension = file.name.includes('.')
    ? file.name.split('.').pop().trim().toLowerCase()
    : '';

  if (extensions.length > 0 && !extensions.includes(selectedExtension)) {
    return `Unsupported file type. Use: ${extensions.join(', ')}.`;
  }

  const width = option?.imageSize?.width;
  const height = option?.imageSize?.height;
  const shouldValidateImageSize = file.type.startsWith('image/') && (width || height);

  if (!shouldValidateImageSize) {
    return '';
  }

  try {
    const dimensions = await createImageBitmapDimensions(file);

    if ((width && dimensions.width > width) || (height && dimensions.height > height)) {
      return `Image exceeds the allowed size of ${width || '?'} x ${height || '?'} px.`;
    }
  } catch (error) {
    return error.message || 'Unable to validate the selected image.';
  }

  return '';
}

function getInputType(option) {
  switch (option?.type) {
    case 'area':
      return 'textarea';
    case 'date':
      return 'date';
    case 'date_time':
      return 'datetime-local';
    case 'time':
      return 'time';
    case 'file':
      return 'file';
    default:
      return 'text';
  }
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent != null) {
    element.textContent = textContent;
  }

  return element;
}

function getCurrentProduct(scope) {
  return events.lastPayload('pdp/data', { scope }) ?? null;
}

export async function mountProductInputOptions(
  container,
  {
    scope,
    initialEnteredOptions = [],
  } = {},
) {
  if (!container) {
    return null;
  }

  await loadCSS(
    `${window.hlx.codeBasePath}/scripts/components/pdp-input-options/pdp-input-options.css`,
  );

  let product = getCurrentProduct(scope);
  let currentEnteredOptions = [];
  let initialSeed = normalizeEnteredOptions(initialEnteredOptions);
  const errors = new Map();
  let lastExternalValid = true;
  let isSyncingValid = false;

  function computeCombinedValidity(enteredOptions = currentEnteredOptions) {
    const values = pdpApi.getProductConfigurationValues({ scope }) || {};
    const productIsValid = validateRequiredProductConfiguration(product, {
      ...values,
      enteredOptions,
    });

    return Boolean(lastExternalValid) && productIsValid;
  }

  function syncValidation(enteredOptions = currentEnteredOptions) {
    const nextValid = computeCombinedValidity(enteredOptions);
    isSyncingValid = true;
    pdpApi.setProductConfigurationValid(
      () => nextValid,
      { scope },
    );
  }

  function syncEnteredOptions(entries = currentEnteredOptions) {
    const nextEntries = filterEnteredOptionsForProduct(product, entries);
    const currentValues = filterEnteredOptionsForProduct(
      product,
      pdpApi.getProductConfigurationValues({ scope })?.enteredOptions,
    );

    currentEnteredOptions = nextEntries;

    if (serializeEnteredOptions(currentValues) !== serializeEnteredOptions(nextEntries)) {
      pdpApi.setProductConfigurationValues((previous = {}) => ({
        ...previous,
        enteredOptions: nextEntries.length > 0 ? nextEntries : undefined,
      }), { scope });
    }

    syncValidation(nextEntries);
  }

  function updateEnteredOption(uid, value) {
    currentEnteredOptions = setEnteredOptionValue(currentEnteredOptions, uid, value);
    syncEnteredOptions(currentEnteredOptions);
  }

  function seedEnteredOptions() {
    const currentValues = filterEnteredOptionsForProduct(
      product,
      pdpApi.getProductConfigurationValues({ scope })?.enteredOptions,
    );

    if (currentValues.length > 0) {
      currentEnteredOptions = currentValues;
      syncValidation(currentEnteredOptions);
      return;
    }

    currentEnteredOptions = filterEnteredOptionsForProduct(product, initialSeed);

    if (currentEnteredOptions.length > 0) {
      syncEnteredOptions(currentEnteredOptions);
      initialSeed = [];
      return;
    }

    syncValidation(currentEnteredOptions);
  }

  function createField(option) {
    const fieldType = getInputType(option);
    const fieldId = `pdp-input-option-${scope || 'default'}-${option.id}`;
    const fieldWrapper = createElement('div', 'pdp-input-options__field-wrapper');
    const label = createElement('label', 'pdp-input-options__label');
    const labelText = option?.title || option?.label || '';

    label.setAttribute('for', fieldId);
    label.textContent = labelText;

    if (option?.required) {
      label.append(createElement('span', 'pdp-input-options__required', ' *'));
    }

    fieldWrapper.append(label);

    const helperText = getOptionHelperText(option);
    if (helperText) {
      fieldWrapper.append(createElement('p', 'pdp-input-options__helper', helperText));
    }

    if (fieldType === 'file') {
      const currentValue = getEnteredOptionValue(option.id, currentEnteredOptions);
      const input = createElement('input', 'pdp-input-options__control');
      input.type = 'file';
      input.id = fieldId;

      const acceptValue = getAcceptValue(option);
      if (acceptValue) {
        input.accept = acceptValue;
      }

      input.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        const errorMessage = await validateSelectedFile(file, option);

        if (errorMessage) {
          errors.set(option.id, errorMessage);
          render();
          return;
        }

        errors.delete(option.id);
        updateEnteredOption(option.id, file?.name || '');
        render();
      });

      fieldWrapper.append(input);

      if (currentValue) {
        const selectedValue = createElement(
          'div',
          'pdp-input-options__selected-value',
          `Selected file: ${currentValue}`,
        );
        const clearButton = createElement('button', 'pdp-input-options__clear', 'Clear');
        clearButton.type = 'button';
        clearButton.addEventListener('click', () => {
          errors.delete(option.id);
          updateEnteredOption(option.id, '');
          render();
        });

        selectedValue.append(clearButton);
        fieldWrapper.append(selectedValue);
      }
    } else {
      const currentValue = getEnteredOptionValue(option.id, currentEnteredOptions);
      const control = fieldType === 'textarea'
        ? createElement('textarea', 'pdp-input-options__control')
        : createElement('input', 'pdp-input-options__control');

      if (fieldType !== 'textarea') {
        control.type = fieldType;
      }

      control.id = fieldId;
      control.value = currentValue;
      control.placeholder = labelText;

      control.addEventListener('input', (event) => {
        errors.delete(option.id);
        updateEnteredOption(option.id, event.target.value);
      });

      fieldWrapper.append(control);
    }

    const errorMessage = errors.get(option.id);
    if (errorMessage) {
      fieldWrapper.append(createElement('p', 'pdp-input-options__error', errorMessage));
    }

    return fieldWrapper;
  }

  function render() {
    product = getCurrentProduct(scope) ?? product;

    const inputOptions = getInputOptions(product);
    container.replaceChildren();
    container.classList.toggle('pdp-input-options--hidden', inputOptions.length === 0);

    if (inputOptions.length === 0) {
      syncEnteredOptions([]);
      return;
    }

    const wrapper = createElement('div', 'pdp-input-options');
    inputOptions.forEach((option) => {
      wrapper.append(createField(option));
    });
    container.append(wrapper);
  }

  seedEnteredOptions();
  render();

  const valuesListener = events.on('pdp/values', () => {
    currentEnteredOptions = filterEnteredOptionsForProduct(
      product,
      pdpApi.getProductConfigurationValues({ scope })?.enteredOptions,
    );
    syncValidation(currentEnteredOptions);
  }, { scope, eager: true });

  const productListener = events.on('pdp/data', (nextProduct) => {
    product = nextProduct;
    currentEnteredOptions = filterEnteredOptionsForProduct(product, currentEnteredOptions);
    syncEnteredOptions(currentEnteredOptions.length > 0 ? currentEnteredOptions : initialSeed);
    render();
  }, { scope, eager: true });

  const validListener = events.on('pdp/valid', (nextValid) => {
    if (isSyncingValid) {
      isSyncingValid = false;
      return;
    }

    lastExternalValid = nextValid !== false;
    const combinedValid = computeCombinedValidity();

    if (combinedValid !== nextValid) {
      syncValidation();
    }
  }, { scope, eager: true });

  return {
    destroy() {
      valuesListener?.off?.();
      productListener?.off?.();
      validListener?.off?.();
    },
  };
}
