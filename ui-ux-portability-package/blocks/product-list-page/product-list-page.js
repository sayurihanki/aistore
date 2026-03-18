// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getProductLink,
  getSearchContext,
} from '../../scripts/commerce.js';

// Initializers
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';

const IMPLICIT_FILTER_ATTRIBUTES = new Set(['categoryPath', 'visibility']);

function getSafeAemAlias(product) {
  const rawAlias = product?.urlKey || product?.sku || 'product-image';
  return encodeURIComponent(rawAlias);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtml(value = '') {
  if (!value) {
    return '';
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');
  return doc.documentElement.textContent || '';
}

function titleCase(value = '') {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function humanizeAttribute(attribute = '') {
  return titleCase(String(attribute).replace(/[-_]+/g, ' '));
}

function getCategoryLabel(config = {}) {
  const rawPath = config.urlpath || config.urlPath || '';
  const tail = rawPath.split('/').filter(Boolean).pop() || 'search results';
  return titleCase(tail.replace(/[-_]+/g, ' '));
}

function getItemCopy(count = 0) {
  return count === 1 ? 'item' : 'items';
}

function formatMoney(value = 0, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `$${Number(value).toFixed(2)}`;
  }
}

function formatMoneyRange(minimum, maximum, currency = 'USD') {
  if (minimum === undefined && maximum === undefined) {
    return formatMoney(0, currency);
  }

  if (minimum === undefined || maximum === undefined || Number(minimum) === Number(maximum)) {
    return formatMoney(minimum ?? maximum ?? 0, currency);
  }

  return `${formatMoney(minimum, currency)} - ${formatMoney(maximum, currency)}`;
}

function isColorValue(value = '') {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    || /^(rgb|hsl)a?\(/i.test(value)
    || /^[a-z]{3,}$/i.test(value);
}

function isDiscounted(product = {}) {
  const finalAmount = product?.price?.final?.amount?.value;
  const regularAmount = product?.price?.regular?.amount?.value;

  if (finalAmount !== undefined && regularAmount !== undefined) {
    return finalAmount < regularAmount;
  }

  const minimumFinal = product?.priceRange?.minimum?.final?.amount?.value;
  const minimumRegular = product?.priceRange?.minimum?.regular?.amount?.value;
  const maximumFinal = product?.priceRange?.maximum?.final?.amount?.value;
  const maximumRegular = product?.priceRange?.maximum?.regular?.amount?.value;

  const hasDiscountedMinimum = minimumFinal !== undefined
    && minimumRegular !== undefined
    && minimumFinal < minimumRegular;
  const hasDiscountedMaximum = maximumFinal !== undefined
    && maximumRegular !== undefined
    && maximumFinal < maximumRegular;

  return hasDiscountedMinimum || hasDiscountedMaximum;
}

function getProductFlags(product = {}) {
  const flags = [];

  if (!product.inStock) {
    flags.push({
      label: 'Out of stock',
      variant: 'product-discovery-product-badge--muted',
    });
  } else if (isDiscounted(product)) {
    flags.push({
      label: 'Sale',
      variant: 'product-discovery-product-badge--sale',
    });
  }

  if (product.typename === 'ComplexProductView') {
    flags.push({
      label: 'Options',
      variant: 'product-discovery-product-badge--accent',
    });
  }

  return flags.slice(0, 2);
}

function getProductTitle(product = {}) {
  return decodeHtml(product.name || '') || product.sku || 'MCX Product';
}

function getProductEyebrow(product = {}) {
  return String(product?.sku || 'MCX Official')
    .trim()
    .replace(/[_-]+/g, ' ')
    .slice(0, 32);
}

function getProductAvailabilityCopy(product = {}) {
  if (!product.inStock) {
    return {
      label: 'Out of Stock',
      detail: product.typename === 'ComplexProductView' ? 'Check product details for options' : '',
    };
  }

  if (product.typename === 'ComplexProductView') {
    return {
      label: 'Select Options',
      detail: 'Choose size or color on the product page',
    };
  }

  return {
    label: 'In Stock',
    detail: '',
  };
}

function getProductPriceSummary(product = {}) {
  if (product.typename === 'ComplexProductView') {
    const currency = product?.priceRange?.minimum?.regular?.amount?.currency
      || product?.priceRange?.minimum?.final?.amount?.currency
      || 'USD';
    const minimumFinal = product?.priceRange?.minimum?.final?.amount?.value;
    const minimumRegular = product?.priceRange?.minimum?.regular?.amount?.value;
    const maximumFinal = product?.priceRange?.maximum?.final?.amount?.value;
    const maximumRegular = product?.priceRange?.maximum?.regular?.amount?.value;
    const discounted = minimumFinal !== undefined
      && minimumRegular !== undefined
      && maximumFinal !== undefined
      && maximumRegular !== undefined
      && (minimumFinal < minimumRegular || maximumFinal < maximumRegular);

    return {
      current: formatMoneyRange(
        minimumFinal ?? minimumRegular,
        maximumFinal ?? maximumRegular,
        currency,
      ),
      original: discounted
        ? formatMoneyRange(minimumRegular, maximumRegular, currency)
        : '',
      discounted,
    };
  }

  const currency = product?.price?.regular?.amount?.currency
    || product?.price?.final?.amount?.currency
    || 'USD';
  const current = product?.price?.final?.amount?.value
    ?? product?.price?.regular?.amount?.value;
  const original = product?.price?.regular?.amount?.value;
  const discounted = current !== undefined
    && original !== undefined
    && Number(current) < Number(original);

  return {
    current: formatMoney(current ?? original ?? 0, currency),
    original: discounted ? formatMoney(original, currency) : '',
    discounted,
  };
}

function getProductSwatches(product = {}) {
  const optionGroups = Array.isArray(product.inputOptions) ? product.inputOptions : [];
  const seen = new Set();

  return optionGroups.flatMap((group) => {
    const values = Array.isArray(group?.values) ? group.values : [];

    return values.map((value) => {
      const swatchType = String(value?.type || value?.__typename || '').toLowerCase();
      const swatchValue = value?.value || value?.swatch?.value || value?.title || '';
      const normalizedValue = String(swatchValue).trim();

      if (!normalizedValue || (!swatchType.includes('swatch') && !isColorValue(normalizedValue))) {
        return null;
      }

      const dedupeKey = normalizedValue.toLowerCase();
      if (seen.has(dedupeKey)) {
        return null;
      }

      seen.add(dedupeKey);
      return {
        label: value?.title || normalizedValue,
        value: normalizedValue,
      };
    }).filter(Boolean);
  }).slice(0, 4);
}

function getVisibleFilters(filters = []) {
  return filters.filter(
    (filter) => filter?.attribute && !IMPLICIT_FILTER_ATTRIBUTES.has(filter.attribute),
  );
}

function getImplicitFilters(filters = []) {
  return filters.filter(
    (filter) => filter?.attribute && IMPLICIT_FILTER_ATTRIBUTES.has(filter.attribute),
  );
}

function getFacetTitle(attribute, facets = []) {
  return facets.find((facet) => facet.attribute === attribute)?.title
    || humanizeAttribute(attribute);
}

function getFacetBucketLabel(attribute, value, facets = []) {
  const facet = facets.find((item) => item.attribute === attribute);
  const bucket = facet?.buckets?.find((item) => String(item?.title) === String(value));

  if (!bucket) {
    return value;
  }

  const bucketTitle = String(bucket.title || value);
  if (bucketTitle.toLowerCase() === 'yes') {
    return facet?.title || value;
  }

  if (bucketTitle.toLowerCase() === 'no') {
    return facet?.title ? `Not ${facet.title}` : value;
  }

  return bucketTitle;
}

function formatFilterChipLabel(filter, facets = [], specificValue = null) {
  const facetTitle = getFacetTitle(filter.attribute, facets);

  if (filter.range) {
    if (filter.attribute === 'price') {
      return `${formatMoney(filter.range.from)} - ${formatMoney(filter.range.to)}`;
    }

    return `${facetTitle}: ${filter.range.from} - ${filter.range.to}`;
  }

  const value = specificValue || filter.eq || filter.in?.[0] || '';
  if (!value) {
    return facetTitle;
  }

  const bucketLabel = getFacetBucketLabel(filter.attribute, value, facets);

  if (/categor/i.test(facetTitle)) {
    return bucketLabel;
  }

  return `${facetTitle}: ${bucketLabel}`;
}

function flattenFilterChips(filters = [], facets = []) {
  return getVisibleFilters(filters).flatMap((filter) => {
    if (filter.range) {
      return [{
        attribute: filter.attribute,
        type: 'range',
        from: String(filter.range.from),
        to: String(filter.range.to),
        label: formatFilterChipLabel(filter, facets),
      }];
    }

    const values = filter.in || (filter.eq ? [filter.eq] : []);
    return values.map((value) => ({
      attribute: filter.attribute,
      type: 'value',
      value: String(value),
      label: formatFilterChipLabel(filter, facets, String(value)),
    }));
  });
}

function removeFilterChip(chip, filters = []) {
  return filters.flatMap((filter) => {
    if (filter.attribute !== chip.attribute) {
      return [filter];
    }

    if (chip.type === 'range') {
      const matchesRange = filter.range
        && Number(filter.range.from) === Number(chip.from)
        && Number(filter.range.to) === Number(chip.to);

      return matchesRange ? [] : [filter];
    }

    if (filter.eq !== undefined) {
      return String(filter.eq) === chip.value ? [] : [filter];
    }

    if (Array.isArray(filter.in)) {
      const nextValues = filter.in.filter((value) => String(value) !== chip.value);
      return nextValues.length ? [{ ...filter, in: nextValues }] : [];
    }

    return [filter];
  });
}

function buildBadgeNode(flag) {
  const badge = document.createElement('span');
  badge.className = `product-discovery-product-badge ${flag.variant}`;
  badge.textContent = flag.label;
  return badge;
}

function createImageFallback(label = 'MCX') {
  const fallback = document.createElement('span');
  fallback.className = 'product-discovery-product-image-fallback';
  fallback.textContent = label.slice(0, 3).toUpperCase();
  return fallback;
}

function renderResultInfo(target, payload, config) {
  const phrase = payload.request?.phrase?.trim();
  const totalCount = payload.result?.totalCount || 0;
  const categoryLabel = getCategoryLabel(config);
  const prefix = phrase ? 'Results for' : 'Explore';
  const title = phrase ? `"${phrase}"` : categoryLabel;
  const inlineCount = phrase
    ? `${totalCount} ${getItemCopy(totalCount)} found`
    : `${totalCount} ${getItemCopy(totalCount)} available`;
  const helper = phrase
    ? `${totalCount} ${getItemCopy(totalCount)} found across current MCX results`
    : `${totalCount} ${getItemCopy(totalCount)} available in ${categoryLabel}`;
  const legacySummary = phrase
    ? `${totalCount} results found for "${phrase}".`
    : `${totalCount} results found in ${categoryLabel}.`;

  target.innerHTML = `
    <div class="search__hero-heading-wrap">
      <div class="search__hero-heading">
        <span class="search__hero-prefix">${escapeHtml(prefix)}</span>
        <span class="search__hero-query">${escapeHtml(title)}</span>
      </div>
      <span class="search__hero-inline-count">${escapeHtml(inlineCount)}</span>
    </div>
    <p class="search__hero-count">${escapeHtml(helper)}</p>
    <p class="search__legacy-summary">${escapeHtml(legacySummary)}</p>
  `;
}

function renderToolbarSummary(target, payload, config) {
  const phrase = payload.request?.phrase?.trim();
  const totalCount = payload.result?.totalCount || 0;
  const categoryLabel = getCategoryLabel(config);
  const pillLabel = phrase ? `"${phrase}"` : categoryLabel;

  target.innerHTML = `
    <span class="search__toolbar-count"><strong>${totalCount}</strong> ${escapeHtml(getItemCopy(totalCount))}</span>
    <span class="search__toolbar-query">${escapeHtml(pillLabel)}</span>
  `;
}

function renderActiveFilters(target, payload) {
  const chips = flattenFilterChips(payload.request?.filter || [], payload.result?.facets || []);

  if (!chips.length) {
    target.hidden = true;
    target.innerHTML = '';
    return;
  }

  target.hidden = false;
  target.innerHTML = `
    <div class="search__active-filters-row">
      ${chips.map((chip) => `
        <button
          class="search__active-filter"
          type="button"
          data-filter-action="remove"
          data-filter-type="${chip.type}"
          data-attribute="${escapeHtml(chip.attribute)}"
          ${chip.value ? `data-value="${escapeHtml(chip.value)}"` : ''}
          ${chip.from ? `data-from="${escapeHtml(chip.from)}"` : ''}
          ${chip.to ? `data-to="${escapeHtml(chip.to)}"` : ''}
        >
          <span>${escapeHtml(chip.label)}</span>
          <span class="search__active-filter-remove" aria-hidden="true">×</span>
        </button>
      `).join('')}
    </div>
    <button class="search__active-filters-clear" type="button" data-filter-action="clear">
      Clear all
    </button>
  `;
}

function syncFiltersButton(button, payload) {
  const count = flattenFilterChips(
    payload.request?.filter || [],
    payload.result?.facets || [],
  ).length;

  if (count > 0) {
    button.setAttribute('data-count', count);
  } else {
    button.removeAttribute('data-count');
  }
}

function setUrlFromPayload(payload) {
  const url = new URL(window.location.href);

  if (payload.request?.phrase) {
    url.searchParams.set('q', payload.request.phrase);
  } else {
    url.searchParams.delete('q');
  }

  if (payload.request?.currentPage && payload.request.currentPage > 1) {
    url.searchParams.set('page', payload.request.currentPage);
  } else {
    url.searchParams.delete('page');
  }

  if (payload.request?.sort?.length) {
    url.searchParams.set('sort', getParamsFromSort(payload.request.sort));
  } else {
    url.searchParams.delete('sort');
  }

  const filterParam = getParamsFromFilter(getVisibleFilters(payload.request?.filter || []));
  if (filterParam) {
    url.searchParams.set('filter', filterParam);
  } else {
    url.searchParams.delete('filter');
  }

  window.history.pushState({}, '', url.toString());
}

function syncFacetSections(facetRoot) {
  facetRoot?.querySelectorAll('.product-discovery-facet').forEach((facet) => {
    if (!facet.classList.contains('is-open')) {
      facet.classList.add('is-open');
    }
  });
}

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const config = readBlockConfig(block);
  const panelId = `product-list-page-facets-${Math.random().toString(36).slice(2, 10)}`;
  const state = {
    currentRequest: null,
    currentResult: null,
    viewMode: 'grid',
  };

  const fragment = document.createRange()
    .createContextualFragment(`
      <div class="search__wrapper">
        <section class="search__hero">
          <div class="search__hero-inner">
            <div class="search__hero-copy">
              <div class="search__hero-eyebrow">
                <span class="search__hero-line"></span>
                <span>Live Search Results</span>
              </div>
              <div class="search__hero-meta">
                <div class="search__result-info"></div>
              </div>
              <div class="search__active-filters" hidden></div>
            </div>
            <div class="search__hero-actions">
              <div class="search__sort-group">
                <span class="search__sort-label">Sort By</span>
                <div class="search__product-sort"></div>
              </div>
              <div class="search__view-toggle" role="group" aria-label="Results view">
                <button class="search__view-button is-active" type="button" data-view="grid" aria-pressed="true" aria-label="Grid view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button class="search__view-button" type="button" data-view="list" aria-pressed="false" aria-label="List view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="4" y1="7" x2="20" y2="7"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="17" x2="20" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
        <div class="search__layout">
          <div class="search__facets-scrim" data-role="facets-scrim"></div>
          <aside class="search__sidebar" id="${panelId}">
            <div class="search__sidebar-inner">
              <div class="search__sidebar-header">
                <span class="search__sidebar-title">Filters</span>
                <button class="search__facets-close" type="button" aria-label="Close filters" data-role="close-facets">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div class="search__facets"></div>
            </div>
          </aside>
          <div class="search__main">
            <div class="search__toolbar">
              <div class="search__toolbar-summary"></div>
              <div class="search__view-facets">
                <button class="search__filters-button" type="button" aria-expanded="false" aria-controls="${panelId}" data-role="open-facets">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="10" y1="18" x2="14" y2="18"></line>
                  </svg>
                  <span>${escapeHtml(labels.Global?.Filters || 'Filters')}</span>
                </button>
              </div>
            </div>
            <div class="search__product-list"></div>
            <div class="search__pagination"></div>
          </div>
        </div>
      </div>
    `);

  const refs = {
    resultInfo: fragment.querySelector('.search__result-info'),
    activeFilters: fragment.querySelector('.search__active-filters'),
    toolbarSummary: fragment.querySelector('.search__toolbar-summary'),
    viewButtons: [...fragment.querySelectorAll('.search__view-button')],
    productSort: fragment.querySelector('.search__product-sort'),
    facets: fragment.querySelector('.search__facets'),
    productList: fragment.querySelector('.search__product-list'),
    pagination: fragment.querySelector('.search__pagination'),
    filtersButton: fragment.querySelector('[data-role="open-facets"]'),
    filtersClose: fragment.querySelector('[data-role="close-facets"]'),
    facetsScrim: fragment.querySelector('[data-role="facets-scrim"]'),
  };

  block.innerHTML = '';
  block.appendChild(fragment);

  if (config.urlpath) {
    block.dataset.category = config.urlpath;
  }

  const syncViewMode = () => {
    block.classList.toggle('product-list-page--list', state.viewMode === 'list');

    refs.viewButtons.forEach((button) => {
      const active = button.dataset.view === state.viewMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active);
    });
  };

  const openFilters = () => {
    block.classList.add('product-list-page--filters-open');
    refs.filtersButton?.setAttribute('aria-expanded', 'true');
  };

  const closeFilters = () => {
    block.classList.remove('product-list-page--filters-open');
    refs.filtersButton?.setAttribute('aria-expanded', 'false');
  };

  refs.viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.viewMode = button.dataset.view || 'grid';
      syncViewMode();
    });
  });

  refs.filtersButton?.addEventListener('click', () => {
    if (block.classList.contains('product-list-page--filters-open')) {
      closeFilters();
    } else {
      openFilters();
    }
  });

  refs.filtersClose?.addEventListener('click', closeFilters);
  refs.facetsScrim?.addEventListener('click', closeFilters);
  refs.facets?.addEventListener('click', (event) => {
    const header = event.target.closest('.product-discovery-facet__header');
    if (!header) {
      return;
    }

    const facet = header.closest('.product-discovery-facet');
    facet?.classList.toggle('is-open');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && block.classList.contains('product-list-page--filters-open')) {
      closeFilters();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && block.classList.contains('product-list-page--filters-open')) {
      closeFilters();
    }
  });

  refs.activeFilters?.addEventListener('click', async (event) => {
    const clearButton = event.target.closest('[data-filter-action="clear"]');
    const removeButton = event.target.closest('[data-filter-action="remove"]');

    if (!state.currentRequest) {
      return;
    }

    let nextFilters = [];

    if (clearButton) {
      nextFilters = getImplicitFilters(state.currentRequest.filter || []);
    } else if (removeButton) {
      nextFilters = removeFilterChip({
        attribute: removeButton.dataset.attribute,
        type: removeButton.dataset.filterType,
        value: removeButton.dataset.value,
        from: removeButton.dataset.from,
        to: removeButton.dataset.to,
      }, state.currentRequest.filter || []);
    } else {
      return;
    }

    if (window.innerWidth < 768) {
      closeFilters();
    }

    await search({
      ...state.currentRequest,
      currentPage: 1,
      filter: nextFilters,
    }).catch(() => {
      console.error('Error updating product list page filters');
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const {
    q,
    page,
    sort,
    filter,
  } = Object.fromEntries(urlParams.entries());

  await performInitialSearch(config, {
    q,
    page,
    sort,
    filter,
  });

  const getAddToCartButton = (product) => {
    if (product.typename === 'ComplexProductView') {
      const button = document.createElement('div');
      UI.render(Button, {
        children: labels.Global?.AddProductToCart,
        icon: Icon({ source: 'Cart' }),
        href: getProductLink(product.urlKey, product.sku),
        variant: 'primary',
      })(button);
      return button;
    }

    const button = document.createElement('div');
    UI.render(Button, {
      children: labels.Global?.AddProductToCart,
      icon: Icon({ source: 'Cart' }),
      onClick: () => cartApi.addProductsToCart([{
        sku: product.sku,
        quantity: 1,
      }]),
      variant: 'primary',
    })(button);
    return button;
  };

  await Promise.all([
    provider.render(SortBy, {})(
      refs.productSort,
    ),
    provider.render(Pagination, {
      onPageChange: () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      },
    })(refs.pagination),
    provider.render(Facets, {})(refs.facets),
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const {
            product,
            defaultImageProps,
          } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.className = 'product-discovery-product-media';
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);

          const flags = getProductFlags(product);
          if (flags.length) {
            const badges = document.createElement('div');
            badges.className = 'product-discovery-product-badges';
            flags.forEach((flag) => badges.append(buildBadgeNode(flag)));
            anchorWrapper.append(badges);
          }

          if (!defaultImageProps?.src) {
            anchorWrapper.classList.add('product-discovery-product-media--empty');
            anchorWrapper.append(createImageFallback('MCX'));
            ctx.replaceWith(anchorWrapper);
            return;
          }

          tryRenderAemAssetsImage(ctx, {
            alias: getSafeAemAlias(product),
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });

          const image = anchorWrapper.querySelector('img');
          if (image) {
            image.addEventListener('error', () => {
              if (!anchorWrapper.querySelector('.product-discovery-product-image-fallback')) {
                anchorWrapper.classList.add('product-discovery-product-media--empty');
                image.remove();
                anchorWrapper.append(createImageFallback('MCX'));
              }
            }, { once: true });
          }
        },
        ProductName: (ctx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'product-discovery-product-title';

          const eyebrow = document.createElement('div');
          eyebrow.className = 'product-discovery-product-title__eyebrow';
          eyebrow.textContent = getProductEyebrow(ctx.product);
          wrapper.append(eyebrow);

          const title = document.createElement('a');
          title.className = 'product-discovery-product-title__link';
          title.href = getProductLink(ctx.product.urlKey, ctx.product.sku);
          title.textContent = getProductTitle(ctx.product);
          wrapper.append(title);

          const swatches = getProductSwatches(ctx.product);
          if (swatches.length) {
            const swatchRow = document.createElement('div');
            swatchRow.className = 'product-discovery-product-swatches';

            swatches.forEach((swatch) => {
              const swatchNode = document.createElement('span');
              swatchNode.className = 'product-discovery-product-swatch';
              swatchNode.title = swatch.label;
              swatchNode.setAttribute('aria-hidden', 'true');
              swatchNode.style.background = swatch.value;
              swatchRow.append(swatchNode);
            });

            wrapper.append(swatchRow);
          }

          ctx.replaceWith(wrapper);
        },
        ProductPrice: (ctx) => {
          const pricing = getProductPriceSummary(ctx.product);
          const availability = getProductAvailabilityCopy(ctx.product);
          const wrapper = document.createElement('div');
          wrapper.className = 'product-discovery-product-pricing';

          const stock = document.createElement('div');
          stock.className = 'product-discovery-product-pricing__stock';
          stock.textContent = availability.label;
          wrapper.append(stock);

          if (availability.detail) {
            const stockDetail = document.createElement('div');
            stockDetail.className = 'product-discovery-product-pricing__stock-detail';
            stockDetail.textContent = availability.detail;
            wrapper.append(stockDetail);
          }

          const priceRow = document.createElement('div');
          priceRow.className = 'product-discovery-product-pricing__row';

          const current = document.createElement('span');
          current.className = 'product-discovery-product-price-current';
          current.textContent = pricing.current;
          priceRow.append(current);

          if (pricing.original) {
            const original = document.createElement('span');
            original.className = 'product-discovery-product-price-original';
            original.textContent = pricing.original;
            priceRow.append(original);
          }

          if (pricing.discounted) {
            const pill = document.createElement('span');
            pill.className = 'product-discovery-product-price-pill';
            pill.textContent = 'Sale';
            priceRow.append(pill);
          }

          wrapper.append(priceRow);
          ctx.replaceWith(wrapper);
        },
        ProductActions: async (ctx) => {
          const actionsWrapper = document.createElement('div');
          actionsWrapper.className = 'product-discovery-product-actions';

          const primaryAction = document.createElement('div');
          primaryAction.className = 'product-discovery-product-actions__primary';

          const addToCartBtn = getAddToCartButton(ctx.product);
          addToCartBtn.className = 'product-discovery-product-actions__add-to-cart';
          primaryAction.append(addToCartBtn);
          actionsWrapper.append(primaryAction);

          const utilityRail = document.createElement('div');
          utilityRail.className = 'product-discovery-product-actions__utility-rail';

          const wishlistToggle = document.createElement('div');
          wishlistToggle.classList.add(
            'product-discovery-product-actions__wishlist-toggle',
            'product-discovery-product-actions__utility',
          );
          wishlistRender.render(WishlistToggle, {
            product: ctx.product,
            variant: 'tertiary',
          })(wishlistToggle);

          utilityRail.append(wishlistToggle);

          try {
            const { initializeRequisitionList } = await import('./requisition-list.js');
            const reqListContainer = await initializeRequisitionList({
              product: ctx.product,
              labels,
            });

            reqListContainer.classList.add(
              'product-discovery-product-actions__requisition-list-names',
              'product-discovery-product-actions__utility',
            );
            utilityRail.append(reqListContainer);
          } catch (error) {
            console.warn('Requisition list module not available:', error);
          }

          actionsWrapper.append(utilityRail);
          ctx.replaceWith(actionsWrapper);
        },
      },
    })(refs.productList),
  ]);

  events.on('search/result', (payload) => {
    state.currentRequest = payload.request || {};
    state.currentResult = payload.result || {};

    syncFacetSections(refs.facets);
    renderResultInfo(refs.resultInfo, payload, config);
    renderToolbarSummary(refs.toolbarSummary, payload, config);
    renderActiveFilters(refs.activeFilters, payload);
    syncFiltersButton(refs.filtersButton, payload);

    block.classList.toggle('product-list-page--empty', (payload.result?.totalCount || 0) === 0);
  }, { eager: true });

  events.on('search/result', (payload) => {
    setUrlFromPayload(payload);
  }, { eager: false });

  syncViewMode();
}

async function performInitialSearch(config, urlParams) {
  const {
    q,
    page,
    sort,
    filter,
  } = urlParams;
  const context = getSearchContext();

  if (config.urlpath) {
    await search({
      phrase: '',
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: sort ? getSortFromParams(sort) : [{
        attribute: 'position',
        direction: 'DESC',
      }],
      filter: [
        {
          attribute: 'categoryPath',
          eq: config.urlpath,
        },
        {
          attribute: 'visibility',
          in: ['Search', 'Catalog, Search'],
        },
        ...getFilterFromParams(filter),
      ],
      context,
    }).catch(() => {
      console.error('Error searching for products');
    });
  } else {
    await search({
      phrase: q || '',
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: getSortFromParams(sort),
      filter: [
        {
          attribute: 'visibility',
          in: ['Search', 'Catalog, Search'],
        },
        ...getFilterFromParams(filter),
      ],
      context,
    }).catch(() => {
      console.error('Error searching for products');
    });
  }
}

function getSortFromParams(sortParam) {
  if (!sortParam) {
    return [];
  }

  return sortParam.split(',')
    .map((item) => {
      const [attribute, direction] = item.split('_');
      return {
        attribute,
        direction,
      };
    });
}

function getParamsFromSort(sort) {
  return sort.map((item) => `${item.attribute}_${item.direction}`)
    .join(',');
}

function getFilterFromParams(filterParam) {
  if (!filterParam) {
    return [];
  }

  const decodedParam = decodeURIComponent(filterParam);
  const results = [];
  const filters = decodedParam.split(/[|;]/);

  filters.forEach((filter) => {
    const separatorIndex = filter.indexOf(':');
    if (separatorIndex < 0) {
      return;
    }

    const attribute = filter.slice(0, separatorIndex);
    const value = filter.slice(separatorIndex + 1).trim();
    if (!attribute || !value) {
      return;
    }

    const values = value.split(',').map((item) => item.trim()).filter(Boolean);
    const rangeMatch = value.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);

    if (values.length > 1) {
      results.push({
        attribute,
        in: values,
      });
    } else if (rangeMatch) {
      const [, from, to] = rangeMatch;
      results.push({
        attribute,
        range: {
          from: Number(from),
          to: Number(to),
        },
      });
    } else {
      results.push({
        attribute,
        in: [value],
      });
    }
  });

  return results;
}

function getParamsFromFilter(filter) {
  if (!filter || filter.length === 0) {
    return '';
  }

  return filter.map(({
    attribute,
    in: inValues,
    range,
  }) => {
    if (inValues) {
      return `${attribute}:${inValues.join(',')}`;
    }

    if (range) {
      return `${attribute}:${range.from}-${range.to}`;
    }

    return null;
  })
    .filter(Boolean)
    .join('|');
}
