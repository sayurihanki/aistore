export const CATEGORY_PAGE_SIZE = 12;

export const ALL_TAB_ID = 'all';

const VISIBILITY_VALUES = ['Search', 'Catalog, Search'];

function normalizeToken(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function dedupeTabId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}-${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeRangeValue(value) {
  if (!value.includes('-')) {
    return null;
  }

  const [from, to] = value.split('-');
  const parsedFrom = Number(from);
  const parsedTo = Number(to);

  if (Number.isNaN(parsedFrom) || Number.isNaN(parsedTo)) {
    return null;
  }

  return {
    from: parsedFrom,
    to: parsedTo,
  };
}

function normalizeFilterShape(filter = {}) {
  const normalized = {
    attribute: String(filter.attribute || '').trim(),
  };

  if (filter.range) {
    normalized.range = {
      from: Number(filter.range.from),
      to: Number(filter.range.to),
    };
  } else if (filter.eq !== undefined && filter.eq !== null && filter.eq !== '') {
    normalized.eq = String(filter.eq).trim();
  } else if (Array.isArray(filter.in)) {
    normalized.in = [...filter.in]
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .sort();
  }

  return normalized;
}

function filtersMatch(left, right) {
  const a = normalizeFilterShape(left);
  const b = normalizeFilterShape(right);

  if (a.attribute !== b.attribute) {
    return false;
  }

  if (a.range || b.range) {
    return a.range?.from === b.range?.from && a.range?.to === b.range?.to;
  }

  if (a.eq !== undefined || b.eq !== undefined) {
    return a.eq === b.eq;
  }

  const aValues = a.in || [];
  const bValues = b.in || [];

  return aValues.length === bValues.length
    && aValues.every((value, index) => value === bValues[index]);
}

function pickCurrency(...values) {
  const currency = values.find(Boolean) || 'USD';
  return Intl.supportedValuesOf('currency').includes(currency) ? currency : 'USD';
}

function isColorValue(value = '') {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    || /^(rgb|hsl)a?\(/i.test(value)
    || /^[a-z]{3,}$/i.test(value);
}

function humanizeAttribute(attribute = '') {
  return titleCase(String(attribute).replace(/[-_]+/g, ' '));
}

export function toTabId(value) {
  return normalizeToken(value) || ALL_TAB_ID;
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function textToHtml(value = '') {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export function titleFromUrlPath(urlPath = '') {
  const lastSegment = String(urlPath)
    .split('/')
    .filter(Boolean)
    .pop();

  return titleCase((lastSegment || '').replace(/[-_]+/g, ' '));
}

export function normalizeTabs(tabs = []) {
  const usedIds = new Set([ALL_TAB_ID]);
  const normalizedTabs = tabs
    .map((tab) => {
      const label = String(tab?.label || '').trim();
      const attribute = String(tab?.attribute || '').trim();
      const value = String(tab?.value || '').trim();
      const inferredId = toTabId(tab?.id || label || value || attribute);

      if (!label) {
        return null;
      }

      const isAllTab = inferredId === ALL_TAB_ID || (!attribute && !value);

      return {
        id: isAllTab ? ALL_TAB_ID : dedupeTabId(inferredId, usedIds),
        label,
        attribute: isAllTab ? '' : attribute,
        value: isAllTab ? '' : value,
      };
    })
    .filter(Boolean);

  const authoredAllTab = normalizedTabs.find((tab) => tab.id === ALL_TAB_ID);
  const remainingTabs = normalizedTabs.filter((tab) => tab.id !== ALL_TAB_ID);

  return [
    {
      id: ALL_TAB_ID,
      label: authoredAllTab?.label || 'All',
      attribute: '',
      value: '',
    },
    ...remainingTabs,
  ];
}

export function parseCategoryPageConfig(rows = []) {
  const config = {
    urlPath: '',
    eyebrow: '',
    title: '',
    description: '',
    heroImageAlt: '',
    tabs: [],
  };

  rows.forEach((row) => {
    const [rawKey = '', rawValue = '', rawThird = '', rawFourth = ''] = row;
    const key = normalizeToken(rawKey);
    const value = String(rawValue || '').trim();
    const third = String(rawThird || '').trim();
    const fourth = String(rawFourth || '').trim();

    if (!key) {
      return;
    }

    if (key === 'tab') {
      config.tabs.push({
        label: value,
        attribute: third,
        value: fourth,
      });
      return;
    }

    if (key === 'urlpath') {
      config.urlPath = value.replace(/^\/+|\/+$/g, '');
      return;
    }

    if (key === 'eyebrow') {
      config.eyebrow = value;
      return;
    }

    if (key === 'title') {
      config.title = value;
      return;
    }

    if (key === 'description') {
      config.description = value;
      return;
    }

    if (key === 'hero-image-alt') {
      config.heroImageAlt = value;
    }
  });

  config.eyebrow = config.eyebrow || titleFromUrlPath(config.urlPath);
  config.title = config.title || config.eyebrow;
  config.tabs = normalizeTabs(config.tabs);

  return config;
}

export function getTabFilter(tab) {
  if (!tab?.attribute || !tab?.value) {
    return null;
  }

  return {
    attribute: tab.attribute,
    in: [tab.value],
  };
}

export function findActiveTab(tabs = [], tabId = ALL_TAB_ID) {
  return tabs.find((tab) => tab.id === tabId) || tabs[0] || {
    id: ALL_TAB_ID,
    label: 'All',
    attribute: '',
    value: '',
  };
}

export function getSortFromParams(sortParam) {
  if (!sortParam) {
    return [];
  }

  return String(sortParam)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.lastIndexOf('_');
      if (separatorIndex === -1) {
        return {
          attribute: entry,
          direction: 'DESC',
        };
      }

      return {
        attribute: entry.slice(0, separatorIndex),
        direction: entry.slice(separatorIndex + 1).toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      };
    });
}

export function getParamsFromSort(sort = []) {
  return sort
    .filter((item) => item?.attribute)
    .map((item) => `${item.attribute}_${item.direction || 'DESC'}`)
    .join(',');
}

export function getFilterFromParams(filterParam) {
  if (!filterParam) {
    return [];
  }

  const parts = decodeURIComponent(filterParam)
    .split(/[;|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return parts.reduce((filters, entry) => {
    const [attribute, ...rawValue] = entry.split(':');
    const value = rawValue.join(':').trim();

    if (!attribute || !value) {
      return filters;
    }

    const range = normalizeRangeValue(value);
    if (range) {
      filters.push({
        attribute,
        range,
      });
      return filters;
    }

    const values = attribute === 'visibility'
      ? [value]
      : value.split(/,(?!\s)/).map((item) => item.trim()).filter(Boolean);

    filters.push({
      attribute,
      in: values,
    });

    return filters;
  }, []);
}

export function getParamsFromFilter(filters = []) {
  return filters
    .map((filter) => {
      if (!filter?.attribute) {
        return null;
      }

      if (filter.range) {
        return `${filter.attribute}:${filter.range.from}-${filter.range.to}`;
      }

      if (filter.eq !== undefined && filter.eq !== null && filter.eq !== '') {
        return `${filter.attribute}:${filter.eq}`;
      }

      if (Array.isArray(filter.in) && filter.in.length) {
        return `${filter.attribute}:${filter.in.join(',')}`;
      }

      return null;
    })
    .filter(Boolean)
    .join(';');
}

export function getBaseCategoryFilters(urlPath, activeTab) {
  const filters = [];

  if (urlPath) {
    filters.push({
      attribute: 'categoryPath',
      eq: String(urlPath).replace(/^\/+|\/+$/g, ''),
    });
  }

  const tabFilter = getTabFilter(activeTab);
  if (tabFilter) {
    filters.push(tabFilter);
  }

  filters.push({
    attribute: 'visibility',
    in: VISIBILITY_VALUES,
  });

  return filters;
}

export function getVisibleFilters(filters = [], options = {}) {
  const internalFilters = getBaseCategoryFilters(options.urlPath, options.activeTab);
  return filters.filter((filter) => (
    !internalFilters.some((candidate) => filtersMatch(filter, candidate))
  ));
}

export function parseSearchState(searchString = '', tabs = []) {
  const params = new URLSearchParams(String(searchString).replace(/^\?/, ''));
  const parsedPage = Number(params.get('page') || 1);
  const tabId = toTabId(params.get('tab') || ALL_TAB_ID);
  const activeTab = findActiveTab(tabs, tabId);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    sort: getSortFromParams(params.get('sort')),
    filters: getFilterFromParams(params.get('filter')),
    tabId: activeTab.id,
  };
}

export function serializeSearchState(state = {}) {
  const params = new URLSearchParams();
  const page = Number(state.page || 1);
  const sort = getParamsFromSort(state.sort || []);
  const filters = getParamsFromFilter(state.filters || []);
  const tabId = state.tabId || ALL_TAB_ID;

  if (page > 1) {
    params.set('page', String(page));
  }

  if (sort) {
    params.set('sort', sort);
  }

  if (filters) {
    params.set('filter', filters);
  }

  if (tabId && tabId !== ALL_TAB_ID) {
    params.set('tab', tabId);
  }

  return params;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatMoney(value, currency = 'USD') {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: pickCurrency(currency),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function getProductPriceSummary(product = {}) {
  const isComplex = product.typename === 'ComplexProductView' || Boolean(product.priceRange);
  const simpleFinal = product.price?.final?.amount?.value;
  const simpleRegular = product.price?.regular?.amount?.value;
  const simpleCurrency = product.price?.final?.amount?.currency
    || product.price?.regular?.amount?.currency;
  const minimumFinal = product.priceRange?.minimum?.final?.amount?.value;
  const maximumFinal = product.priceRange?.maximum?.final?.amount?.value;
  const minimumRegular = product.priceRange?.minimum?.regular?.amount?.value;
  const maximumRegular = product.priceRange?.maximum?.regular?.amount?.value;
  const rangeCurrency = product.priceRange?.minimum?.final?.amount?.currency
    || product.priceRange?.minimum?.regular?.amount?.currency
    || product.priceRange?.maximum?.final?.amount?.currency
    || product.priceRange?.maximum?.regular?.amount?.currency;

  if (!isComplex) {
    const currentValue = Number(simpleFinal ?? simpleRegular ?? 0);
    const regularValue = Number(simpleRegular ?? currentValue);
    const currency = pickCurrency(simpleCurrency);
    const discounted = regularValue > currentValue;

    return {
      isRange: false,
      currency,
      current: formatMoney(currentValue, currency),
      original: discounted ? formatMoney(regularValue, currency) : '',
      discounted,
    };
  }

  const currentMin = Number(minimumFinal ?? minimumRegular ?? 0);
  const currentMax = Number(maximumFinal ?? maximumRegular ?? currentMin);
  const regularMin = Number(minimumRegular ?? currentMin);
  const regularMax = Number(maximumRegular ?? currentMax);
  const currency = pickCurrency(rangeCurrency);
  const discounted = regularMin > currentMin || regularMax > currentMax;
  const current = currentMin === currentMax
    ? formatMoney(currentMin, currency)
    : `${formatMoney(currentMin, currency)} - ${formatMoney(currentMax, currency)}`;
  const original = regularMin === regularMax
    ? formatMoney(regularMin, currency)
    : `${formatMoney(regularMin, currency)} - ${formatMoney(regularMax, currency)}`;

  return {
    isRange: true,
    currency,
    current,
    original: discounted ? original : '',
    discounted,
  };
}

export function getProductOptionHighlights(product = {}) {
  let rawOptions = [];
  if (Array.isArray(product.inputOptions) && product.inputOptions.length) {
    rawOptions = product.inputOptions;
  } else if (Array.isArray(product.options)) {
    rawOptions = product.options;
  }

  const swatches = [];
  const sizes = [];

  rawOptions.forEach((option) => {
    const title = String(option?.title || option?.label || '').toLowerCase();
    const values = Array.isArray(option?.values) ? option.values : [];

    if (/color|colour/.test(title)) {
      values.forEach((value) => {
        const swatchValue = String(value?.value || '').trim();
        if (isColorValue(swatchValue)) {
          swatches.push({
            label: String(value?.title || value?.label || swatchValue).trim(),
            value: swatchValue,
          });
        }
      });
    }

    if (/size|waist|inseam|shoe/.test(title)) {
      values.forEach((value) => {
        const size = String(value?.title || value?.label || value?.value || '').trim();
        if (size) {
          sizes.push(size);
        }
      });
    }
  });

  return {
    swatches: swatches
      .filter((swatch, index, list) => (
        list.findIndex((entry) => entry.value === swatch.value) === index
      ))
      .slice(0, 4),
    sizes: sizes
      .filter((size, index, list) => list.indexOf(size) === index)
      .slice(0, 5),
  };
}

export function getProductActionMode(product = {}) {
  if (!product.inStock) {
    return 'disabled';
  }

  if (product.typename === 'ComplexProductView') {
    return 'link';
  }

  return 'cart';
}

export function getProductFlags(product = {}) {
  const price = getProductPriceSummary(product);
  const flags = [];

  if (!product.inStock) {
    flags.push({
      label: 'Out of Stock',
      variant: 'f-excl',
    });
  } else if (price.discounted) {
    flags.push({
      label: 'Sale',
      variant: 'f-sale',
    });
  }

  if (product.typename === 'ComplexProductView') {
    flags.push({
      label: 'Options',
      variant: 'f-hot',
    });
  }

  return flags.slice(0, 2);
}

export function formatFilterLabel(filter, facets = []) {
  const facet = facets.find((entry) => entry.attribute === filter.attribute);
  const title = facet?.title || humanizeAttribute(filter.attribute);

  if (filter.range) {
    if (filter.attribute === 'price') {
      return `${title}: ${formatMoney(filter.range.from)} - ${formatMoney(filter.range.to)}`;
    }

    return `${title}: ${filter.range.from} - ${filter.range.to}`;
  }

  const values = filter.in || (filter.eq ? [filter.eq] : []);

  return `${title}: ${values.join(', ')}`;
}
