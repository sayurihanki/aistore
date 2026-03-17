export const STEP_LABELS = [
  'Garments',
  'Sizing',
  'Rank & Insignia',
  'Accessories',
  'Contact',
  'Review',
];

export const COMMERCE_STEP_LABELS = [
  'Garments',
  'Sizing',
  'Rank & Insignia',
  'Accessories',
  'Measurements',
  'Review',
];

export const STEP_ONE_FIELDS = [
  'coatLength',
  'coatSize',
  'trouserWaist',
  'trouserInseam',
  'shirtNeck',
  'shirtSleeve',
  'collarStrip',
];

export const STEP_THREE_FIELDS = ['rank'];
export const STEP_FIVE_FIELDS = ['firstName', 'lastName', 'email'];
export const SHIPPING_FIELDS = ['shippingAddress', 'shippingCity', 'shippingState', 'shippingZip'];
export const RUSH_EXTRA_ID = 'rush-tailoring';
export const DEFAULT_DATA_SOURCE = '/data/configurators/marine-officer-dress-blues.json';

export const MEASUREMENT_ORDER = [
  'chest',
  'waist',
  'hip',
  'shoulder',
  'sleeve',
  'inseam',
  'neck',
  'height',
  'weight',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}(?:-\d{4})?$/;
const VALID_PREVIEW_TYPES = new Set(['pips', 'bars', 'stars']);

const DEFAULT_MEASUREMENTS = {
  chest: {
    label: 'Chest',
    min: 28,
    max: 65,
    step: 0.5,
    placeholder: '42',
    unit: 'in',
  },
  waist: {
    label: 'Waist',
    min: 24,
    max: 58,
    step: 0.5,
    placeholder: '34',
    unit: 'in',
  },
  hip: {
    label: 'Hip',
    min: 28,
    max: 60,
    step: 0.5,
    placeholder: '38',
    unit: 'in',
  },
  shoulder: {
    label: 'Shoulder Width',
    min: 12,
    max: 24,
    step: 0.25,
    placeholder: '18',
    unit: 'in',
  },
  sleeve: {
    label: 'Sleeve Length',
    min: 24,
    max: 40,
    step: 0.5,
    placeholder: '33',
    unit: 'in',
  },
  inseam: {
    label: 'Inseam',
    min: 24,
    max: 40,
    step: 0.5,
    placeholder: '32',
    unit: 'in',
  },
  neck: {
    label: 'Neck',
    min: 12,
    max: 22,
    step: 0.5,
    placeholder: '16',
    unit: 'in',
  },
  height: {
    label: 'Height',
    min: 56,
    max: 84,
    step: 1,
    placeholder: '70',
    unit: 'in',
  },
  weight: {
    label: 'Weight',
    min: 100,
    max: 350,
    step: 1,
    placeholder: '185',
    unit: 'lbs',
  },
};

const DEFAULT_NOTICES = {
  coat: {
    title: 'USMC MCO P1020.34H',
    text: 'Officer blue dress coat features standing collar, gold-bordered sleeve cuffs, and shoulder boards.',
  },
  rank: {
    title: 'Regulation Note',
    text: 'Rank insignia hardware includes shoulder board devices, collar insignia, and sleeve ornamentation.',
  },
  fulfillment: {
    title: '100% Regulation Guarantee',
    text: 'Every package is reviewed by our veteran uniform team before shipment.',
  },
};

const DEFAULT_DATASET = {
  id: 'marine-officer-dress-blues',
  version: '1.0.0',
  currency: 'USD',
  baseItems: [
    {
      id: 'coat', label: 'Dress Coat', summaryLabel: 'Blue Dress Coat', price: 395,
    },
    {
      id: 'trouser', label: 'Trousers', summaryLabel: 'Blue Dress Trousers', price: 215,
    },
    {
      id: 'shirt', label: 'Dress Shirt', summaryLabel: 'Dress Shirt', price: 68,
    },
  ],
  options: {
    coat: {
      length: [],
      size: [],
    },
    trouser: {
      waist: [],
      inseam: [],
    },
    shirt: {
      neck: [],
      sleeve: [],
      collarStrip: [],
    },
    shoes: {
      label: 'Oxford Dress Shoes',
      price: 89,
      size: [],
      width: [],
    },
    belt: {
      label: 'Belt & Buckle',
      price: 34,
      size: [],
      buckleStyles: [
        {
          id: 'ega',
          label: 'EGA',
          price: 0,
          icon: '⚓',
          description: 'Included',
        },
      ],
    },
    cover: {
      label: 'Officer Service Cover',
      price: 78,
      size: [],
    },
    frame: {
      label: 'Cover Frame',
      price: 42,
      size: [],
    },
  },
  ranks: [],
  medalPackages: [
    {
      id: 'none',
      label: 'None',
      previewCount: 0,
      price: 0,
    },
  ],
  extras: [],
  measurements: DEFAULT_MEASUREMENTS,
  shippingStates: [],
  notices: DEFAULT_NOTICES,
};

function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function toNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toChoiceOption(item) {
  if (typeof item === 'string' || typeof item === 'number') {
    const value = String(item).trim();
    if (!value) return null;
    return { value, label: value };
  }

  if (!item || typeof item !== 'object') return null;

  const value = toText(item.value ?? item.id ?? item.name ?? item.label);
  if (!value) return null;

  return {
    value,
    label: toText(item.label ?? item.name ?? item.value ?? item.id, value),
  };
}

function normalizeOptions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(toChoiceOption)
    .filter(Boolean);
}

function normalizeBuckleStyles(list) {
  if (!Array.isArray(list) || !list.length) {
    return DEFAULT_DATASET.options.belt.buckleStyles;
  }

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = toText(item.id ?? item.value ?? item.label);
      if (!id) return null;
      return {
        id,
        label: toText(item.label, id),
        price: toNumber(item.price, 0),
        icon: toText(item.icon, '•'),
        description: toText(item.description, item.price ? `+$${toNumber(item.price, 0)}` : 'Included'),
      };
    })
    .filter(Boolean);
}

function normalizeBaseItems(list) {
  if (!Array.isArray(list) || !list.length) return DEFAULT_DATASET.baseItems;

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = toText(item.id);
      if (!id) return null;
      return {
        id,
        label: toText(item.label, id),
        summaryLabel: toText(item.summaryLabel, toText(item.label, id)),
        price: toNumber(item.price, 0),
      };
    })
    .filter(Boolean);
}

function normalizeRanks(list) {
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = toText(item.id);
      if (!id) return null;
      const previewType = toText(item.preview?.type).toLowerCase();
      return {
        id,
        label: toText(item.label, id),
        shortLabel: toText(item.shortLabel, toText(item.label, id)),
        payGrade: toText(item.payGrade),
        price: toNumber(item.price, 0),
        preview: {
          type: VALID_PREVIEW_TYPES.has(previewType) ? previewType : 'pips',
          count: Math.max(0, Math.min(4, Math.round(toNumber(item.preview?.count, 0)))),
        },
      };
    })
    .filter(Boolean);
}

function normalizeMedalPackages(list) {
  if (!Array.isArray(list) || !list.length) return DEFAULT_DATASET.medalPackages;

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = toText(item.id);
      if (!id) return null;
      return {
        id,
        label: toText(item.label, id),
        previewCount: Math.max(0, Math.min(12, Math.round(toNumber(item.previewCount, 0)))),
        price: toNumber(item.price, 0),
      };
    })
    .filter(Boolean);
}

function normalizeExtras(list) {
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = toText(item.id);
      if (!id) return null;
      return {
        id,
        label: toText(item.label, id),
        description: toText(item.description),
        price: toNumber(item.price, 0),
      };
    })
    .filter(Boolean);
}

function normalizeMeasurements(rawMeasurements) {
  const normalized = {};

  MEASUREMENT_ORDER.forEach((key) => {
    const authored = rawMeasurements?.[key];
    const fallback = DEFAULT_MEASUREMENTS[key];
    normalized[key] = {
      label: toText(authored?.label, fallback.label),
      min: toNumber(authored?.min, fallback.min),
      max: toNumber(authored?.max, fallback.max),
      step: toNumber(authored?.step, fallback.step),
      placeholder: toText(authored?.placeholder, fallback.placeholder),
      unit: toText(authored?.unit, fallback.unit),
    };
  });

  return normalized;
}

function normalizeNotice(raw, fallback) {
  return {
    title: toText(raw?.title, fallback.title),
    text: toText(raw?.text, fallback.text),
  };
}

function normalizeNotices(rawNotices) {
  return {
    coat: normalizeNotice(rawNotices?.coat, DEFAULT_NOTICES.coat),
    rank: normalizeNotice(rawNotices?.rank, DEFAULT_NOTICES.rank),
    fulfillment: normalizeNotice(rawNotices?.fulfillment, DEFAULT_NOTICES.fulfillment),
  };
}

export function normalizeDataset(raw) {
  const dataset = raw && typeof raw === 'object' ? raw : {};
  const options = dataset.options && typeof dataset.options === 'object' ? dataset.options : {};

  return {
    id: toText(dataset.id, DEFAULT_DATASET.id),
    version: toText(dataset.version, DEFAULT_DATASET.version),
    currency: toText(dataset.currency, DEFAULT_DATASET.currency),
    baseItems: normalizeBaseItems(dataset.baseItems),
    options: {
      coat: {
        length: normalizeOptions(options.coat?.length),
        size: normalizeOptions(options.coat?.size),
      },
      trouser: {
        waist: normalizeOptions(options.trouser?.waist),
        inseam: normalizeOptions(options.trouser?.inseam),
      },
      shirt: {
        neck: normalizeOptions(options.shirt?.neck),
        sleeve: normalizeOptions(options.shirt?.sleeve),
        collarStrip: normalizeOptions(options.shirt?.collarStrip),
      },
      shoes: {
        label: toText(options.shoes?.label, DEFAULT_DATASET.options.shoes.label),
        price: toNumber(options.shoes?.price, DEFAULT_DATASET.options.shoes.price),
        size: normalizeOptions(options.shoes?.size),
        width: normalizeOptions(options.shoes?.width),
      },
      belt: {
        label: toText(options.belt?.label, DEFAULT_DATASET.options.belt.label),
        price: toNumber(options.belt?.price, DEFAULT_DATASET.options.belt.price),
        size: normalizeOptions(options.belt?.size),
        buckleStyles: normalizeBuckleStyles(options.belt?.buckleStyles),
      },
      cover: {
        label: toText(options.cover?.label, DEFAULT_DATASET.options.cover.label),
        price: toNumber(options.cover?.price, DEFAULT_DATASET.options.cover.price),
        size: normalizeOptions(options.cover?.size),
      },
      frame: {
        label: toText(options.frame?.label, DEFAULT_DATASET.options.frame.label),
        price: toNumber(options.frame?.price, DEFAULT_DATASET.options.frame.price),
        size: normalizeOptions(options.frame?.size),
      },
    },
    ranks: normalizeRanks(dataset.ranks),
    medalPackages: normalizeMedalPackages(dataset.medalPackages),
    extras: normalizeExtras(dataset.extras),
    measurements: normalizeMeasurements(dataset.measurements),
    shippingStates: normalizeOptions(dataset.shippingStates),
    notices: normalizeNotices(dataset.notices),
  };
}

export function createInitialState(data) {
  const extras = {};
  data.extras.forEach((extra) => {
    if (extra.id !== RUSH_EXTRA_ID) {
      extras[extra.id] = false;
    }
  });

  const measurements = {};
  MEASUREMENT_ORDER.forEach((key) => {
    measurements[key] = '';
  });

  return {
    step: 1,
    submissionState: 'idle',
    submitErrorMessage: '',
    errors: {},
    selections: {
      coatLength: '',
      coatSize: '',
      trouserWaist: '',
      trouserInseam: '',
      shirtNeck: '',
      shirtSleeve: '',
      collarStrip: '',
      shoeSize: '',
      shoeWidth: '',
      beltSize: '',
      buckleStyle: data.options.belt.buckleStyles[0]?.id || '',
      coverSize: '',
      frameSize: '',
      rank: '',
      medalPackage: data.medalPackages[0]?.id || '',
      extras,
      rushTailoring: false,
      shippingOverride: false,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingZip: '',
      notes: '',
    },
    measurements,
  };
}

export function getStepLabels(commerceMode = false) {
  return commerceMode ? COMMERCE_STEP_LABELS : STEP_LABELS;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toIdSegment(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(toNumber(value, 0));
}

export function getChoiceLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || '—';
}

export function getSelectedRank(data, state) {
  return data.ranks.find((rank) => rank.id === state.selections.rank) || null;
}

export function getSelectedMedalPackage(data, state) {
  return data.medalPackages
    .find((medalPackage) => medalPackage.id === state.selections.medalPackage) || null;
}

export function getSelectedBuckleStyle(data, state) {
  return data.options.belt.buckleStyles
    .find((style) => style.id === state.selections.buckleStyle) || null;
}

export function getRushExtra(data) {
  return data.extras.find((extra) => extra.id === RUSH_EXTRA_ID) || null;
}

export function getSelectedAccessoryExtras(data, state) {
  return data.extras.filter(
    (extra) => extra.id !== RUSH_EXTRA_ID && state.selections.extras[extra.id],
  );
}

export function mapRankPreview(rank) {
  if (!rank) {
    return {
      shortLabel: 'Select Rank',
      type: 'none',
      count: 0,
    };
  }

  return {
    shortLabel: rank.shortLabel,
    type: rank.preview.type,
    count: rank.preview.count,
  };
}

function buildBaseItemDetail(itemId, state, data) {
  switch (itemId) {
    case 'coat':
      return `Size ${state.selections.coatSize || '—'} / ${getChoiceLabel(
        data.options.coat.length,
        state.selections.coatLength,
      )}`;
    case 'trouser':
      return `Waist ${state.selections.trouserWaist || '—'} / ${state.selections.trouserInseam || '—'}″`;
    case 'shirt':
      return [
        `Neck ${state.selections.shirtNeck || '—'}`,
        `Sleeve ${state.selections.shirtSleeve || '—'}`,
        `Collar ${state.selections.collarStrip || '—'}`,
      ].join(' / ');
    default:
      return '';
  }
}

export function buildLineItems(data, state) {
  const items = data.baseItems.map((item) => ({
    id: item.id,
    label: item.summaryLabel || item.label,
    price: item.price,
    detail: buildBaseItemDetail(item.id, state, data),
  }));

  if (state.selections.shoeSize) {
    items.push({
      id: 'shoes',
      label: data.options.shoes.label,
      price: data.options.shoes.price,
      detail: `Size ${state.selections.shoeSize}${state.selections.shoeWidth ? ` / ${getChoiceLabel(data.options.shoes.width, state.selections.shoeWidth)}` : ''}`,
    });
  }

  if (state.selections.beltSize) {
    items.push({
      id: 'belt',
      label: data.options.belt.label,
      price: data.options.belt.price,
      detail: `Size ${state.selections.beltSize}`,
    });
  }

  const buckleStyle = getSelectedBuckleStyle(data, state);
  if (state.selections.beltSize && buckleStyle && buckleStyle.price > 0) {
    items.push({
      id: `belt-style-${buckleStyle.id}`,
      label: `${buckleStyle.label} Buckle Upgrade`,
      price: buckleStyle.price,
      detail: buckleStyle.description,
    });
  }

  if (state.selections.coverSize) {
    items.push({
      id: 'cover',
      label: data.options.cover.label,
      price: data.options.cover.price,
      detail: state.selections.coverSize,
    });
  }

  if (state.selections.coverSize && state.selections.frameSize) {
    items.push({
      id: 'frame',
      label: data.options.frame.label,
      price: data.options.frame.price,
      detail: getChoiceLabel(data.options.frame.size, state.selections.frameSize),
    });
  }

  const rank = getSelectedRank(data, state);
  if (rank) {
    items.push({
      id: 'rank',
      label: 'Rank Insignia Set',
      price: rank.price,
      detail: `${rank.label}${rank.payGrade ? ` (${rank.payGrade})` : ''}`,
    });
  }

  const medalPackage = getSelectedMedalPackage(data, state);
  if (medalPackage && medalPackage.price > 0) {
    items.push({
      id: 'medals',
      label: 'Medal Package',
      price: medalPackage.price,
      detail: medalPackage.label,
    });
  }

  getSelectedAccessoryExtras(data, state).forEach((extra) => {
    items.push({
      id: extra.id,
      label: extra.label,
      price: extra.price,
      detail: extra.description,
    });
  });

  const rushExtra = getRushExtra(data);
  if (rushExtra && state.selections.rushTailoring) {
    items.push({
      id: rushExtra.id,
      label: rushExtra.label,
      price: rushExtra.price,
      detail: rushExtra.description,
    });
  }

  return items;
}

export function computeTotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + toNumber(item.price, 0), 0);
}

function validateRequiredFields(fields, state, messages) {
  const errors = {};

  fields.forEach((field) => {
    if (!toText(state.selections[field])) {
      errors[field] = messages[field];
    }
  });

  return errors;
}

function validateMeasurements(state, data) {
  const errors = {};

  MEASUREMENT_ORDER.forEach((key) => {
    const value = toText(state.measurements[key]);
    if (!value) return;

    const numericValue = Number(value);
    const measurement = data.measurements[key];
    if (!Number.isFinite(numericValue)) {
      errors[key] = `Please enter a valid ${measurement.label.toLowerCase()}.`;
      return;
    }

    if (numericValue < measurement.min || numericValue > measurement.max) {
      errors[key] = `${measurement.label} must be between ${measurement.min} and ${measurement.max} ${measurement.unit}.`;
    }
  });

  return errors;
}

export function validateStep(step, state, data, options = {}) {
  const commerceMode = Boolean(options?.commerceMode);
  let errors = {};

  if (step === 1) {
    errors = validateRequiredFields(STEP_ONE_FIELDS, state, {
      coatLength: 'Select a coat length.',
      coatSize: 'Select a coat size.',
      trouserWaist: 'Select a trouser waist.',
      trouserInseam: 'Select a trouser inseam.',
      shirtNeck: 'Select a shirt neck size.',
      shirtSleeve: 'Select a shirt sleeve length.',
      collarStrip: 'Select a collar strip size.',
    });
  }

  if (step === 3) {
    errors = validateRequiredFields(STEP_THREE_FIELDS, state, {
      rank: 'Select an officer rank.',
    });
  }

  if (step === 5) {
    if (!commerceMode) {
      errors = validateRequiredFields(STEP_FIVE_FIELDS, state, {
        firstName: 'Enter a first name.',
        lastName: 'Enter a last name.',
        email: 'Enter an email address.',
      });

      if (toText(state.selections.email) && !EMAIL_PATTERN.test(state.selections.email)) {
        errors.email = 'Enter a valid email address.';
      }

      if (state.selections.shippingOverride) {
        SHIPPING_FIELDS.forEach((field) => {
          if (!toText(state.selections[field])) {
            errors[field] = 'Complete the shipping address.';
          }
        });

        if (
          toText(state.selections.shippingZip)
          && !ZIP_PATTERN.test(state.selections.shippingZip)
        ) {
          errors.shippingZip = 'Enter a valid ZIP code.';
        }
      }
    }

    errors = {
      ...errors,
      ...validateMeasurements(state, data),
    };
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStepsUpTo(maxStep, state, data, options = {}) {
  const requiredSteps = [1, 3, 5].filter((step) => step <= maxStep);
  const errors = {};
  let firstInvalidStep = 0;

  requiredSteps.forEach((step) => {
    const validation = validateStep(step, state, data, options);
    if (!validation.valid && !firstInvalidStep) {
      firstInvalidStep = step;
    }
    Object.assign(errors, validation.errors);
  });

  return {
    valid: Object.keys(errors).length === 0,
    firstInvalidStep,
    errors,
  };
}

function normalizeMeasurementPayload(measurements) {
  const payload = {};

  MEASUREMENT_ORDER.forEach((key) => {
    const value = toText(measurements[key]);
    payload[key] = value ? Number(value) : '';
  });

  return payload;
}

export function createSubmitPayload({
  analyticsId,
  data,
  state,
  lineItems,
  total,
  pageUrl,
  referrer = '',
}) {
  return {
    configuratorId: data.id,
    configuratorVersion: data.version,
    analyticsId,
    submittedAt: new Date().toISOString(),
    pageUrl,
    referrer,
    currency: data.currency,
    total,
    lineItems: lineItems.map((item) => ({
      id: item.id,
      label: item.label,
      detail: item.detail,
      price: item.price,
    })),
    selections: {
      garments: {
        coatLength: state.selections.coatLength,
        coatSize: state.selections.coatSize,
        trouserWaist: state.selections.trouserWaist,
        trouserInseam: state.selections.trouserInseam,
        shirtNeck: state.selections.shirtNeck,
        shirtSleeve: state.selections.shirtSleeve,
        collarStrip: state.selections.collarStrip,
      },
      accessories: {
        shoeSize: state.selections.shoeSize,
        shoeWidth: state.selections.shoeWidth,
        beltSize: state.selections.beltSize,
        buckleStyle: state.selections.buckleStyle,
        coverSize: state.selections.coverSize,
        frameSize: state.selections.frameSize,
        medalPackage: state.selections.medalPackage,
        extraIds: getSelectedAccessoryExtras(data, state).map((extra) => extra.id),
        rushTailoring: state.selections.rushTailoring,
      },
      rank: state.selections.rank,
    },
    contact: {
      firstName: state.selections.firstName,
      lastName: state.selections.lastName,
      email: state.selections.email,
      phone: state.selections.phone,
    },
    measurements: normalizeMeasurementPayload(state.measurements),
    shipping: {
      override: state.selections.shippingOverride,
      address: state.selections.shippingAddress,
      city: state.selections.shippingCity,
      state: state.selections.shippingState,
      zip: state.selections.shippingZip,
    },
    notes: state.selections.notes,
  };
}
