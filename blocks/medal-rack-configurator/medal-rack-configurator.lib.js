export const DEFAULT_DATA_SOURCE = '/data/configurators/medal-rack-configurator.json';
export const MAX_INSCRIPTION_LENGTH = 48;

export const DEFAULT_BLOCK_CONTENT = {
  eyebrow: 'Service and Honor Collection',
  title: 'Officer Heritage\nMedal Rack',
  subtitle: 'Solid hardwood, hand-fitted hardware, engraved inscription, and a regulation-aware prototype preview for ceremonial display.',
  primaryCtaLabel: 'Review prototype pricing',
  prototypeNote: 'Prototype mode only. This configurator previews the experience without adding anything to cart. Use the standard PDP purchase controls on this page for live checkout.',
};

export const DEFAULT_DATASET = {
  id: 'medal-rack-configurator',
  version: '1.0.0',
  currency: 'USD',
  pricing: {
    base: 495,
    engraving: 60,
    mountKit: 140,
  },
  defaults: {
    size: 'sm',
    wood: 'walnut',
    hardware: 'gold',
    branch: 'usmc',
    inscription: 'Semper Fidelis',
  },
  sizes: [
    {
      id: 'sm',
      label: 'Standard',
      dimensions: '8" x 10"',
      cost: 0,
    },
    {
      id: 'md',
      label: 'Medium',
      dimensions: '11" x 14"',
      cost: 60,
    },
    {
      id: 'lg',
      label: 'Large',
      dimensions: '14" x 18"',
      cost: 120,
    },
    {
      id: 'xl',
      label: 'Extra Large',
      dimensions: '18" x 24"',
      cost: 200,
    },
  ],
  woods: [
    {
      id: 'walnut',
      label: 'Walnut',
      cost: 0,
      gradientId: 'woodWalnut',
    },
    {
      id: 'mahogany',
      label: 'Mahogany',
      cost: 40,
      gradientId: 'woodMahogany',
    },
    {
      id: 'ebony',
      label: 'Ebony',
      cost: 80,
      gradientId: 'woodEbony',
    },
    {
      id: 'cherry',
      label: 'Cherry',
      cost: 60,
      gradientId: 'woodCherry',
    },
    {
      id: 'maple',
      label: 'Maple',
      cost: 50,
      gradientId: 'woodMaple',
    },
  ],
  hardware: [
    {
      id: 'gold',
      label: 'Gold',
      cost: 0,
      pinColor: '#c9a84c',
      plateColor: '#c9a84c',
    },
    {
      id: 'silver',
      label: 'Silver',
      cost: 0,
      pinColor: '#b0bcc7',
      plateColor: '#b7c0c9',
    },
    {
      id: 'brass',
      label: 'Brass',
      cost: 20,
      pinColor: '#b89040',
      plateColor: '#af8442',
    },
    {
      id: 'pewter',
      label: 'Pewter',
      cost: 15,
      pinColor: '#667387',
      plateColor: '#566171',
    },
  ],
  branches: [
    {
      id: 'usmc',
      label: 'USMC',
      icon: 'EGA',
      watermark: 'USMC',
    },
    {
      id: 'army',
      label: 'Army',
      icon: 'STAR',
      watermark: 'ARMY',
    },
    {
      id: 'navy',
      label: 'Navy',
      icon: 'ANCHOR',
      watermark: 'NAVY',
    },
    {
      id: 'airforce',
      label: 'USAF',
      icon: 'WING',
      watermark: 'USAF',
    },
    {
      id: 'cg',
      label: 'USCG',
      icon: 'COAST',
      watermark: 'USCG',
    },
    {
      id: 'sf',
      label: 'USSF',
      icon: 'ORBIT',
      watermark: 'USSF',
    },
  ],
  addons: [
    {
      id: 'shadowbox',
      label: 'Matching Shadow Box',
      description: 'Solid hardwood shadow box in the selected finish for medals, photos, and keepsakes.',
      price: 195,
      icon: 'FRAME',
    },
    {
      id: 'ribbon-kit',
      label: 'Replacement Ribbon Set',
      description: 'Regulation-aware replacement ribbon bundle for the selected branch.',
      price: 85,
      icon: 'RIBBON',
    },
    {
      id: 'certificate',
      label: 'Certificate of Authenticity',
      description: 'Numbered archival certificate with build details and craftsman signature.',
      price: 48,
      icon: 'CERT',
    },
    {
      id: 'gift',
      label: 'Heirloom Gift Box',
      description: 'Magnetic closure presentation box with tissue wrap and gift card.',
      price: 35,
      icon: 'GIFT',
    },
  ],
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeId(value, fallback) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function normalizeLabel(value, fallback) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeList(source, fallbackList, mapper) {
  const items = Array.isArray(source) && source.length ? source : fallbackList;
  return items.map((item, index) => mapper(item || {}, fallbackList[index] || fallbackList[0]));
}

function resolveDefaultId(value, list, fallbackId) {
  const id = normalizeId(value, fallbackId);
  return list.some((item) => item.id === id) ? id : fallbackId;
}

export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(parsed);
  } catch (error) {
    return `${currency} ${parsed.toFixed(0)}`;
  }
}

export function sanitizeInscriptionValue(value, maxLength = MAX_INSCRIPTION_LENGTH) {
  const stripped = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.slice(0, maxLength).trim();
}

export function getInscriptionText(value, fallback = DEFAULT_DATASET.defaults.inscription) {
  const sanitized = sanitizeInscriptionValue(value);
  if (sanitized) return sanitized;

  const fallbackText = sanitizeInscriptionValue(fallback);
  return fallbackText || DEFAULT_DATASET.defaults.inscription;
}

function normalizePricing(rawPricing = {}) {
  return {
    base: toNumber(rawPricing.base, DEFAULT_DATASET.pricing.base),
    engraving: toNumber(rawPricing.engraving, DEFAULT_DATASET.pricing.engraving),
    mountKit: toNumber(rawPricing.mountKit, DEFAULT_DATASET.pricing.mountKit),
  };
}

function normalizeSizes(rawSizes) {
  return normalizeList(rawSizes, DEFAULT_DATASET.sizes, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    dimensions: normalizeLabel(item.dimensions, fallback.dimensions),
    cost: toNumber(item.cost, fallback.cost),
  }));
}

function normalizeWoods(rawWoods) {
  return normalizeList(rawWoods, DEFAULT_DATASET.woods, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    cost: toNumber(item.cost, fallback.cost),
    gradientId: normalizeLabel(item.gradientId, fallback.gradientId),
  }));
}

function normalizeHardware(rawHardware) {
  return normalizeList(rawHardware, DEFAULT_DATASET.hardware, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    cost: toNumber(item.cost, fallback.cost),
    pinColor: normalizeLabel(item.pinColor, fallback.pinColor),
    plateColor: normalizeLabel(item.plateColor, fallback.plateColor),
  }));
}

function normalizeBranches(rawBranches) {
  return normalizeList(rawBranches, DEFAULT_DATASET.branches, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    icon: normalizeLabel(item.icon, fallback.icon),
    watermark: normalizeLabel(item.watermark, fallback.watermark),
  }));
}

function normalizeAddons(rawAddons) {
  return normalizeList(rawAddons, DEFAULT_DATASET.addons, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    description: normalizeLabel(item.description, fallback.description),
    price: toNumber(item.price, fallback.price),
    icon: normalizeLabel(item.icon, fallback.icon),
  }));
}

export function normalizeDataset(rawDataset = {}) {
  const source = rawDataset && typeof rawDataset === 'object' ? rawDataset : {};
  const sizes = normalizeSizes(source.sizes);
  const woods = normalizeWoods(source.woods);
  const hardware = normalizeHardware(source.hardware);
  const branches = normalizeBranches(source.branches);
  const addons = normalizeAddons(source.addons);
  const pricing = normalizePricing(source.pricing);

  const fallbackDefaults = DEFAULT_DATASET.defaults;
  const sourceDefaults = source.defaults || {};

  return {
    id: normalizeLabel(source.id, DEFAULT_DATASET.id),
    version: normalizeLabel(source.version, DEFAULT_DATASET.version),
    currency: normalizeLabel(source.currency, DEFAULT_DATASET.currency),
    pricing,
    defaults: {
      size: resolveDefaultId(sourceDefaults.size, sizes, sizes[0].id || fallbackDefaults.size),
      wood: resolveDefaultId(sourceDefaults.wood, woods, woods[0].id || fallbackDefaults.wood),
      hardware: resolveDefaultId(
        sourceDefaults.hardware,
        hardware,
        hardware[0].id || fallbackDefaults.hardware,
      ),
      branch: resolveDefaultId(
        sourceDefaults.branch,
        branches,
        branches[0].id || fallbackDefaults.branch,
      ),
      inscription: getInscriptionText(
        sourceDefaults.inscription,
        fallbackDefaults.inscription,
      ),
    },
    sizes,
    woods,
    hardware,
    branches,
    addons,
  };
}

export function getSelectedEntry(collection = [], selectedId = '', fallbackId = '') {
  const items = Array.isArray(collection) ? collection : [];
  return items.find((item) => item.id === selectedId)
    || items.find((item) => item.id === fallbackId)
    || items[0]
    || null;
}

export function createInitialState(data) {
  return {
    sizeId: data.defaults.size,
    woodId: data.defaults.wood,
    hardwareId: data.defaults.hardware,
    branchId: data.defaults.branch,
    inscriptionValue: '',
    addonIds: [],
    breakdownOpen: false,
    prototypeNoteVisible: false,
  };
}

export function toggleAddonId(addonId, checked, addonIds = []) {
  const current = new Set(Array.isArray(addonIds) ? addonIds : []);
  if (checked) {
    current.add(addonId);
  } else {
    current.delete(addonId);
  }

  return [...current];
}

export function getSelectionSnapshot(data, state) {
  const size = getSelectedEntry(data.sizes, state.sizeId, data.defaults.size);
  const wood = getSelectedEntry(data.woods, state.woodId, data.defaults.wood);
  const hardware = getSelectedEntry(
    data.hardware,
    state.hardwareId,
    data.defaults.hardware,
  );
  const branch = getSelectedEntry(data.branches, state.branchId, data.defaults.branch);
  const inscription = getInscriptionText(state.inscriptionValue, data.defaults.inscription);
  const addons = data.addons.filter((addon) => state.addonIds.includes(addon.id));

  return {
    size,
    wood,
    hardware,
    branch,
    inscription,
    addons,
  };
}

export function getSummaryChips(data, state) {
  const snapshot = getSelectionSnapshot(data, state);
  return [
    {
      label: 'Size',
      value: snapshot.size?.label || '',
    },
    {
      label: 'Wood',
      value: snapshot.wood?.label || '',
    },
    {
      label: 'Hardware',
      value: snapshot.hardware?.label || '',
    },
    {
      label: 'Branch',
      value: snapshot.branch?.label || '',
    },
    {
      label: 'Engraving',
      value: snapshot.inscription,
    },
  ].filter((chip) => chip.value);
}

export function computePricing(data, state) {
  const snapshot = getSelectionSnapshot(data, state);
  const addonsTotal = snapshot.addons.reduce((sum, addon) => sum + addon.price, 0);
  const sizeCost = snapshot.size?.cost || 0;
  const woodCost = snapshot.wood?.cost || 0;
  const hardwareCost = snapshot.hardware?.cost || 0;
  const total = data.pricing.base
    + sizeCost
    + woodCost
    + hardwareCost
    + data.pricing.engraving
    + data.pricing.mountKit
    + addonsTotal;

  return {
    currency: data.currency,
    lines: [
      {
        id: 'base',
        label: 'Base rack',
        amount: data.pricing.base,
      },
      {
        id: 'size',
        label: 'Size upgrade',
        amount: sizeCost,
      },
      {
        id: 'wood',
        label: 'Wood finish',
        amount: woodCost,
      },
      {
        id: 'hardware',
        label: 'Hardware finish',
        amount: hardwareCost,
      },
      {
        id: 'engraving',
        label: 'Inscription engraving',
        amount: data.pricing.engraving,
      },
      {
        id: 'mountKit',
        label: 'Ribbon mount kit',
        amount: data.pricing.mountKit,
      },
      {
        id: 'addons',
        label: 'Add-ons',
        amount: addonsTotal,
      },
    ],
    total,
  };
}

export function getPreviewState(data, state) {
  const snapshot = getSelectionSnapshot(data, state);

  return {
    sizeLabel: snapshot.size?.label || '',
    sizeDimensions: snapshot.size?.dimensions || '',
    woodLabel: snapshot.wood?.label || '',
    woodGradientId: snapshot.wood?.gradientId || data.woods[0]?.gradientId || '',
    hardwareLabel: snapshot.hardware?.label || '',
    pinColor: snapshot.hardware?.pinColor || data.hardware[0]?.pinColor || '',
    plateColor: snapshot.hardware?.plateColor || data.hardware[0]?.plateColor || '',
    borderColor: snapshot.hardware?.pinColor || data.hardware[0]?.pinColor || '',
    branchLabel: snapshot.branch?.label || '',
    branchWatermark: snapshot.branch?.watermark || snapshot.branch?.label || '',
    inscription: snapshot.inscription,
    addons: snapshot.addons,
  };
}

export function createPrototypeActionState(config = {}, isVisible = false) {
  const label = normalizeLabel(
    config.primaryCtaLabel,
    DEFAULT_BLOCK_CONTENT.primaryCtaLabel,
  );
  const note = normalizeLabel(
    config.prototypeNote,
    DEFAULT_BLOCK_CONTENT.prototypeNote,
  );

  return {
    transactional: false,
    label,
    note,
    message: isVisible ? note : '',
  };
}
