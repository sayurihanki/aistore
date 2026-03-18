export const DEFAULT_SCHEMA_URL = '/data/configurators/ez-rack-builder-usmc.json';
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_RACK_NAME_LENGTH = 64;
export const MAX_DEVICE_TEXT_LENGTH = 24;

export const DEFAULT_DATASET = {
  id: 'ez-rack-builder',
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
      description: 'Full-size ribbons for ceremonial presentation.',
      commerceValue: 'Standard Ribbons',
      preview: {
        kind: 'ribbons',
        ribbonHeight: 18,
        ribbonWidth: 68,
        rowOffset: 0,
      },
    },
  ],
  options: {
    spacing: [
      {
        id: 'flush',
        label: 'Flush',
        description: 'Tight, compact spacing.',
        commerceValue: 'Flush',
      },
    ],
    alignment: [
      {
        id: 'centered',
        label: 'Centered',
        description: 'Centered alignment.',
        commerceValue: 'Centered',
      },
    ],
    assembly: [
      {
        id: 'assembled',
        label: 'Assembled',
        description: 'Ready to wear.',
        commerceValue: 'Assembled',
      },
    ],
  },
  awards: [
    {
      id: 'natl-defense',
      branchId: 'usmc',
      label: 'National Defense',
      precedence: 1,
      gradient: 'linear-gradient(90deg,#c00018 0 20%,#fff 20% 30%,#1a3580 30% 50%,#fff 50% 70%,#c00018 70% 100%)',
      category: 'Service Awards',
      searchTokens: ['national defense'],
      deviceIds: [],
    },
  ],
  devices: [
    {
      id: 'bronze-star',
      label: '3/16 in Bronze Star',
      type: 'count',
      max: 5,
      symbol: '✦',
    },
  ],
  importProfiles: [],
  addons: [],
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeId(value, fallback = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function normalizeLabel(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeList(source, fallbackList, mapper) {
  const items = Array.isArray(source) && source.length ? source : fallbackList;
  return items.map((item, index) => mapper(item || {}, fallbackList[index] || fallbackList[0]));
}

function uniqueIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => normalizeId(value))
    .filter(Boolean))];
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean))];
}

function normalizeStatus(value, fallback = 'enabled') {
  const normalized = normalizeId(value, fallback);
  return normalized === 'coming-soon' ? normalized : 'enabled';
}

function normalizeDeviceType(value, fallback = 'toggle') {
  const normalized = normalizeId(value, fallback);
  if (['count', 'toggle', 'text'].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizePreview(source = {}, fallback = {}) {
  return {
    kind: normalizeLabel(source.kind, fallback.kind || 'ribbons'),
    ribbonHeight: toNumber(source.ribbonHeight, fallback.ribbonHeight || 18),
    ribbonWidth: toNumber(source.ribbonWidth, fallback.ribbonWidth || 68),
    rowOffset: toNumber(source.rowOffset, fallback.rowOffset || 0),
  };
}

function normalizeBranches(rawBranches) {
  return normalizeList(rawBranches, DEFAULT_DATASET.branches, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    status: normalizeStatus(item.status, fallback.status),
    icon: normalizeLabel(item.icon, fallback.icon),
    watermark: normalizeLabel(item.watermark, fallback.watermark || fallback.label),
  }));
}

function normalizeRackTypes(rawRackTypes) {
  return normalizeList(rawRackTypes, DEFAULT_DATASET.rackTypes, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    description: normalizeLabel(item.description, fallback.description),
    commerceValue: normalizeLabel(item.commerceValue, fallback.commerceValue || fallback.label),
    preview: normalizePreview(item.preview, fallback.preview),
  }));
}

function normalizeOptionGroup(rawOptions, fallbackOptions) {
  return normalizeList(rawOptions, fallbackOptions, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    description: normalizeLabel(item.description, fallback.description),
    commerceValue: normalizeLabel(item.commerceValue, fallback.commerceValue || fallback.label),
  }));
}

function normalizeOptions(rawOptions = {}) {
  const source = rawOptions && typeof rawOptions === 'object' ? rawOptions : {};
  return {
    spacing: normalizeOptionGroup(source.spacing, DEFAULT_DATASET.options.spacing),
    alignment: normalizeOptionGroup(source.alignment, DEFAULT_DATASET.options.alignment),
    assembly: normalizeOptionGroup(source.assembly, DEFAULT_DATASET.options.assembly),
  };
}

function normalizeAwards(rawAwards) {
  return normalizeList(rawAwards, DEFAULT_DATASET.awards, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    branchId: normalizeId(item.branchId, fallback.branchId),
    label: normalizeLabel(item.label, fallback.label),
    precedence: toNumber(item.precedence, fallback.precedence),
    gradient: normalizeLabel(item.gradient, fallback.gradient),
    category: normalizeLabel(item.category, fallback.category),
    searchTokens: uniqueStrings(item.searchTokens || fallback.searchTokens),
    deviceIds: uniqueIds(item.deviceIds || fallback.deviceIds),
  })).sort((left, right) => left.precedence - right.precedence);
}

function normalizeDevices(rawDevices) {
  return normalizeList(rawDevices, DEFAULT_DATASET.devices, (item, fallback) => ({
    id: normalizeId(item.id, fallback.id),
    label: normalizeLabel(item.label, fallback.label),
    type: normalizeDeviceType(item.type, fallback.type),
    max: Math.max(1, toNumber(item.max, fallback.max || 1)),
    symbol: normalizeLabel(item.symbol, fallback.symbol || ''),
    placeholder: normalizeLabel(item.placeholder, fallback.placeholder || ''),
  }));
}

function normalizeImportProfiles(rawProfiles) {
  return (Array.isArray(rawProfiles) ? rawProfiles : []).map((profile, index) => ({
    id: normalizeId(profile.id, `profile-${index + 1}`),
    label: normalizeLabel(profile.label, `Profile ${index + 1}`),
    description: normalizeLabel(profile.description, ''),
    awardIds: uniqueIds(profile.awardIds),
  }));
}

function normalizeAddons(rawAddons) {
  return (Array.isArray(rawAddons) ? rawAddons : []).map((addon, index) => ({
    id: normalizeId(addon.id, `addon-${index + 1}`),
    label: normalizeLabel(addon.label, `Addon ${index + 1}`),
    description: normalizeLabel(addon.description, ''),
    sku: normalizeLabel(addon.sku, ''),
    price: toNumber(addon.price, 0),
  }));
}

export function normalizeDataset(rawDataset = {}) {
  const source = rawDataset && typeof rawDataset === 'object' ? rawDataset : {};
  const branches = normalizeBranches(source.branches);
  const rackTypes = normalizeRackTypes(source.rackTypes);
  const options = normalizeOptions(source.options);
  const awards = normalizeAwards(source.awards);
  const devices = normalizeDevices(source.devices);

  return {
    id: normalizeLabel(source.id, DEFAULT_DATASET.id),
    version: normalizeLabel(source.version, DEFAULT_DATASET.version),
    currency: normalizeLabel(source.currency, DEFAULT_DATASET.currency),
    width: Math.max(1, Math.round(toNumber(source.width, DEFAULT_DATASET.width))),
    branches,
    rackTypes,
    options,
    awards,
    devices,
    importProfiles: normalizeImportProfiles(source.importProfiles),
    addons: normalizeAddons(source.addons),
  };
}

export function getEntryById(collection = [], id = '', fallbackId = '') {
  const items = Array.isArray(collection) ? collection : [];
  return items.find((item) => item.id === id)
    || items.find((item) => item.id === fallbackId)
    || items[0]
    || null;
}

export function getEnabledBranches(data) {
  return (data?.branches || []).filter((branch) => branch.status === 'enabled');
}

export function sanitizeRackName(value, maxLength = MAX_RACK_NAME_LENGTH) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function createInitialState(data) {
  const enabledBranches = getEnabledBranches(data);
  return {
    stepIndex: 0,
    branchId: enabledBranches.length === 1 ? enabledBranches[0].id : '',
    rackTypeId: '',
    options: {
      spacing: data.options.spacing[0]?.id || '',
      alignment: data.options.alignment[0]?.id || '',
      assembly: data.options.assembly[0]?.id || '',
    },
    rackName: '',
    rackItems: [],
    selectedAddonIds: [],
    searchQuery: '',
    selectedCategory: 'all',
    page: 0,
    importedProfileId: '',
  };
}

export function getAwardsForBranch(data, branchId = '') {
  return (data?.awards || []).filter((award) => award.branchId === branchId);
}

export function getAwardById(data, awardId = '') {
  return getEntryById(data?.awards || [], awardId);
}

export function getDeviceById(data, deviceId = '') {
  return getEntryById(data?.devices || [], deviceId);
}

export function getCategoryOptions(data, branchId = '') {
  const categories = new Set(
    getAwardsForBranch(data, branchId)
      .map((award) => award.category)
      .filter(Boolean),
  );
  return ['all', ...[...categories].sort((left, right) => left.localeCompare(right))];
}

export function normalizeDeviceSelections(data, awardId, selections = {}) {
  const award = getAwardById(data, awardId);
  if (!award) return {};

  return award.deviceIds.reduce((acc, deviceId) => {
    const device = getDeviceById(data, deviceId);
    if (!device) return acc;

    const rawValue = selections[device.id];
    if (device.type === 'count') {
      const count = Math.max(0, Math.min(device.max, Math.round(toNumber(rawValue, 0))));
      if (count > 0) acc[device.id] = count;
      return acc;
    }

    if (device.type === 'toggle') {
      if (rawValue === true) acc[device.id] = true;
      return acc;
    }

    const value = String(rawValue || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_DEVICE_TEXT_LENGTH)
      .trim();
    if (value) acc[device.id] = value;
    return acc;
  }, {});
}

export function createRackItem(data, awardId, selections = {}) {
  return {
    awardId,
    devices: normalizeDeviceSelections(data, awardId, selections),
  };
}

export function sortRackItems(data, rackItems = []) {
  return [...(Array.isArray(rackItems) ? rackItems : [])].sort((left, right) => {
    const leftAward = getAwardById(data, left.awardId);
    const rightAward = getAwardById(data, right.awardId);
    return (leftAward?.precedence || 9999) - (rightAward?.precedence || 9999);
  });
}

export function upsertRackItem(data, awardId, rackItems = [], selections = {}) {
  const nextItem = createRackItem(data, awardId, selections);
  const withoutCurrent = (Array.isArray(rackItems) ? rackItems : [])
    .filter((item) => item.awardId !== awardId);
  return sortRackItems(data, [...withoutCurrent, nextItem]);
}

export function removeRackItem(rackItems = [], awardId = '') {
  return (Array.isArray(rackItems) ? rackItems : []).filter((item) => item.awardId !== awardId);
}

export function updateRackItemDevices(data, awardId, rackItems = [], selections = {}) {
  const current = (Array.isArray(rackItems) ? rackItems : [])
    .find((item) => item.awardId === awardId);
  return upsertRackItem(data, awardId, rackItems, {
    ...(current?.devices || {}),
    ...selections,
  });
}

export function applyImportProfile(data, branchId, profileId = '') {
  const profile = getEntryById(data?.importProfiles || [], profileId);
  if (!profile) return [];

  const availableAwards = new Set(getAwardsForBranch(data, branchId).map((award) => award.id));
  const items = profile.awardIds
    .filter((awardId) => availableAwards.has(awardId))
    .map((awardId) => createRackItem(data, awardId));
  return sortRackItems(data, items);
}

export function getDeviceSummary(data, rackItem = {}) {
  const devices = rackItem?.devices && typeof rackItem.devices === 'object' ? rackItem.devices : {};
  return Object.entries(devices)
    .map(([deviceId, value]) => {
      const device = getDeviceById(data, deviceId);
      if (!device) return '';
      if (device.type === 'count') return `${device.label} x${value}`;
      if (device.type === 'toggle') return device.label;
      return `${device.label}: ${value}`;
    })
    .filter(Boolean)
    .join(', ');
}

export function getRackRows(data, rackItems = [], width = data?.width || 3) {
  const rows = [];
  const sorted = sortRackItems(data, rackItems);

  for (let index = 0; index < sorted.length; index += width) {
    rows.push(sorted.slice(index, index + width));
  }

  return rows;
}

export function getRackItemsExpanded(data, rackItems = []) {
  return sortRackItems(data, rackItems)
    .map((item) => {
      const award = getAwardById(data, item.awardId);
      if (!award) return null;
      return {
        ...item,
        award,
        deviceSummary: getDeviceSummary(data, item),
      };
    })
    .filter(Boolean);
}

export function getAwardsPage(data, {
  branchId = '',
  searchQuery = '',
  selectedCategory = 'all',
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const query = String(searchQuery || '').trim().toLowerCase();
  const filtered = getAwardsForBranch(data, branchId)
    .filter((award) => {
      if (selectedCategory !== 'all' && award.category !== selectedCategory) {
        return false;
      }

      if (!query) return true;
      const haystack = [
        award.label,
        award.category,
        ...(award.searchTokens || []),
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const start = safePage * safePageSize;
  const items = filtered.slice(start, start + safePageSize);

  return {
    items,
    total: filtered.length,
    page: safePage,
    pageCount,
    start,
    end: items.length ? start + items.length : 0,
  };
}

export function serializeRackSummary(data, rackItems = []) {
  return getRackItemsExpanded(data, rackItems)
    .map(({ award, deviceSummary }) => (deviceSummary ? `${award.label} (${deviceSummary})` : award.label))
    .join('; ');
}

export function getRackPayload(data, state) {
  const branch = getEntryById(data?.branches || [], state?.branchId);
  const rackType = getEntryById(data?.rackTypes || [], state?.rackTypeId);
  const awards = getRackItemsExpanded(data, state?.rackItems || []).map(({ award, devices }) => ({
    id: award.id,
    label: award.label,
    precedence: award.precedence,
    devices,
  }));

  return {
    builderId: data?.id || DEFAULT_DATASET.id,
    builderVersion: data?.version || DEFAULT_DATASET.version,
    branch: branch ? {
      id: branch.id,
      label: branch.label,
    } : null,
    rackType: rackType ? {
      id: rackType.id,
      label: rackType.label,
      commerceValue: rackType.commerceValue,
    } : null,
    options: {
      spacing: state?.options?.spacing || '',
      alignment: state?.options?.alignment || '',
      assembly: state?.options?.assembly || '',
      width: data?.width || DEFAULT_DATASET.width,
    },
    rackName: sanitizeRackName(state?.rackName || ''),
    importedProfileId: state?.importedProfileId || '',
    awards,
  };
}

export function serializeBuilderPayload(data, state) {
  return JSON.stringify(getRackPayload(data, state));
}

export function getRackTitle(data, state) {
  const branch = getEntryById(data?.branches || [], state?.branchId);
  const rackType = getEntryById(data?.rackTypes || [], state?.rackTypeId);
  const fallback = 'EZ Rack Builder';
  if (!branch && !rackType) return fallback;
  return [branch?.label, rackType?.label].filter(Boolean).join(' ');
}
