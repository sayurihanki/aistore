import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as discoveryRender } from '@dropins/storefront-product-discovery/render.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import { events } from '@dropins/tools/event-bus.js';
import {
  cellText,
  createPictureFromCell,
  getRows,
} from '../../scripts/mcx-block-utils.js';
import {
  fetchPlaceholders,
  getProductLink,
  getSearchContext,
} from '../../scripts/commerce.js';
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';
import {
  ALL_TAB_ID,
  CATEGORY_PAGE_SIZE,
  escapeHtml,
  findActiveTab,
  formatFilterLabel,
  formatNumber,
  getBaseCategoryFilters,
  getProductActionMode,
  getProductFlags,
  getProductOptionHighlights,
  getProductPriceSummary,
  getVisibleFilters,
  parseCategoryPageConfig,
  parseSearchState,
  serializeSearchState,
  textToHtml,
  titleFromUrlPath,
} from './mcx-category-page.lib.js';

function getDefaultSort() {
  return [{
    attribute: 'position',
    direction: 'DESC',
  }];
}

function createScope() {
  return `mcx-category-page-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRowKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getHeroPicture(rows, heroImageAlt) {
  const heroRow = rows.find((row) => normalizeRowKey(cellText(row[0])) === 'hero-image');
  if (!heroRow) {
    return null;
  }

  const picture = createPictureFromCell(heroRow[1], true, [
    { media: '(min-width: 1200px)', width: '1400' },
    { media: '(min-width: 768px)', width: '900' },
    { width: '600' },
  ]);

  if (!picture) {
    return null;
  }

  picture.className = 'mcx-category-page__hero-image';
  const image = picture.querySelector('img');
  if (image) {
    image.loading = 'eager';
    image.alt = heroImageAlt || image.alt || '';
  }

  return picture;
}

function buildScaffold(config) {
  const sectionTitle = escapeHtml(config.eyebrow || titleFromUrlPath(config.urlPath));
  const breadcrumbTitle = escapeHtml(config.eyebrow || config.title || sectionTitle);
  const tabsMarkup = config.tabs.map((tab) => `
    <button
      class="cat-tab${tab.id === ALL_TAB_ID ? ' on' : ''}"
      type="button"
      data-tab-id="${escapeHtml(tab.id)}"
    >
      ${escapeHtml(tab.label)}
    </button>
  `).join('');

  return document.createRange()
    .createContextualFragment(`
      <div class="mcx-category-page__breadcrumb">
        <div class="mcx-category-page__breadcrumb-inner">
          <a class="bc-item" href="/">Home</a>
          <span class="bc-sep">›</span>
          <span class="bc-current">${breadcrumbTitle}</span>
        </div>
      </div>
      <section class="mcx-category-page__hero cat-hero">
        <div class="cat-hero-bg"></div>
        <div class="cat-hero-grid"></div>
        <div class="cat-hero-fade"></div>
        <div class="cat-hero-content">
          <div class="cat-hero-eyebrow">${sectionTitle}</div>
          <h1 class="cat-hero-title">${textToHtml(config.title)}</h1>
          <div class="cat-hero-meta">
            <span class="cat-hero-count" data-role="hero-count">Loading products...</span>
          </div>
          ${config.description ? `<p class="mcx-category-page__hero-description">${escapeHtml(config.description)}</p>` : ''}
          <div class="cat-hero-tabs" data-role="tab-list">${tabsMarkup}</div>
        </div>
        <div class="mcx-category-page__hero-media" data-role="hero-media"></div>
      </section>
      <div class="shop-wrap mcx-category-page__shop">
        <div class="mcx-category-page__drawer-scrim" data-role="drawer-scrim"></div>
        <aside class="filter-panel mcx-category-page__filters-panel" data-role="filters-panel">
          <div class="fp-head">
            <h3>Filters</h3>
            <div class="mcx-category-page__filters-head-actions">
              <button class="fp-clear" type="button" data-role="clear-filters">Clear All</button>
              <button
                class="mcx-category-page__filters-close"
                type="button"
                data-role="close-filters"
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
          </div>
          <div class="mcx-category-page__facets" data-role="facets"></div>
        </aside>
        <div class="shop-main mcx-category-page__main">
          <div class="sort-bar mcx-category-page__toolbar">
            <button class="mcx-category-page__filters-toggle" type="button" data-role="open-filters">
              Filters
              <span class="mcx-category-page__filters-count" data-role="filters-count"></span>
            </button>
            <span class="sort-count" data-role="toolbar-count"><b>0</b> products</span>
            <span class="sort-label">Sort:</span>
            <div class="mcx-category-page__sort" data-role="sort"></div>
            <div class="view-btns">
              <button class="view-btn on" id="viewGrid" type="button" data-view="grid" aria-label="Grid view">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button class="view-btn" id="viewList" type="button" data-view="list" aria-label="List view">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="active-filters" data-role="active-filters"></div>
          <div class="mcx-category-page__status" data-role="status"></div>
          <div class="prod-grid grid-3" data-role="products"></div>
          <div class="pagination mcx-category-page__pagination" data-role="pagination"></div>
        </div>
      </div>
    `);
}

function getRefs(block) {
  return {
    heroCount: block.querySelector('[data-role="hero-count"]'),
    heroMedia: block.querySelector('[data-role="hero-media"]'),
    tabList: block.querySelector('[data-role="tab-list"]'),
    filtersPanel: block.querySelector('[data-role="filters-panel"]'),
    drawerScrim: block.querySelector('[data-role="drawer-scrim"]'),
    facets: block.querySelector('[data-role="facets"]'),
    sort: block.querySelector('[data-role="sort"]'),
    toolbarCount: block.querySelector('[data-role="toolbar-count"]'),
    filtersCount: block.querySelector('[data-role="filters-count"]'),
    activeFilters: block.querySelector('[data-role="active-filters"]'),
    status: block.querySelector('[data-role="status"]'),
    products: block.querySelector('[data-role="products"]'),
    pagination: block.querySelector('[data-role="pagination"]'),
    viewGrid: block.querySelector('#viewGrid'),
    viewList: block.querySelector('#viewList'),
  };
}

function createState(config, labels, initialState) {
  const { tabs } = config;
  const activeTab = findActiveTab(tabs, initialState.tabId);

  return {
    scope: createScope(),
    config,
    labels,
    tabs,
    activeTab,
    viewMode: 'grid',
    errorMessage: '',
    loading: false,
    currentRequest: {
      currentPage: initialState.page,
      sort: initialState.sort,
      filter: [
        ...getBaseCategoryFilters(config.urlPath, activeTab),
        ...initialState.filters,
      ],
      pageSize: CATEGORY_PAGE_SIZE,
    },
    currentResult: {
      items: [],
      totalCount: 0,
      facets: [],
    },
    visibleFilters: initialState.filters,
  };
}

async function renderDiscoveryControls(state, refs) {
  await Promise.all([
    discoveryRender.render(Facets, {
      scope: state.scope,
    })(refs.facets),
    discoveryRender.render(SortBy, {
      scope: state.scope,
    })(refs.sort),
    discoveryRender.render(Pagination, {
      scope: state.scope,
      onPageChange: () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      },
    })(refs.pagination),
  ]);
}

function bindUi(block, refs, state) {
  const filterToggle = block.querySelector('[data-role="open-filters"]');
  const clearFilters = block.querySelector('[data-role="clear-filters"]');
  const closeFilters = block.querySelector('[data-role="close-filters"]');
  const viewButtons = block.querySelectorAll('[data-view]');

  filterToggle?.addEventListener('click', () => {
    block.classList.add('mcx-category-page--filters-open');
  });

  clearFilters?.addEventListener('click', () => {
    runSearch(state, {
      page: 1,
      sort: state.currentRequest?.sort || getDefaultSort(),
      filters: [],
      tabId: state.activeTab.id,
    });
  });

  closeFilters?.addEventListener('click', () => {
    block.classList.remove('mcx-category-page--filters-open');
  });

  refs.drawerScrim?.addEventListener('click', () => {
    block.classList.remove('mcx-category-page--filters-open');
  });

  refs.tabList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab-id]');
    if (!button) {
      return;
    }

    const nextTab = findActiveTab(state.tabs, button.dataset.tabId);
    state.activeTab = nextTab;
    syncTabButtons(refs, state);

    runSearch(state, {
      page: 1,
      sort: state.currentRequest?.sort || getDefaultSort(),
      filters: state.visibleFilters,
      tabId: nextTab.id,
    });
  });

  refs.activeFilters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter-index]');
    if (!button) {
      return;
    }

    const nextFilters = removeVisibleFilterChip(state.visibleFilters, {
      filterIndex: Number(button.dataset.filterIndex),
      value: button.dataset.filterValue || '',
    });

    runSearch(state, {
      page: 1,
      sort: state.currentRequest?.sort || getDefaultSort(),
      filters: nextFilters,
      tabId: state.activeTab.id,
    });
  });

  refs.facets?.addEventListener('click', (event) => {
    const header = event.target.closest('.product-discovery-facet__header');
    if (!header) {
      return;
    }

    const facet = header.closest('.product-discovery-facet');
    facet?.classList.toggle('is-open');
  });

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.viewMode = button.dataset.view === 'list' ? 'list' : 'grid';
      syncViewMode(refs, state);
      renderProducts(refs, state);
    });
  });

  window.addEventListener('popstate', () => {
    const nextState = parseSearchState(window.location.search, state.tabs);
    state.activeTab = findActiveTab(state.tabs, nextState.tabId);
    syncTabButtons(refs, state);
    runSearch(state, nextState);
  });
}

function bindSearchEvents(block, refs, state) {
  events.on('search/loading', (loading) => {
    state.loading = Boolean(loading);
    block.classList.toggle('mcx-category-page--loading', state.loading);

    if (state.loading && !state.currentResult.items?.length) {
      renderSkeletons(refs.products, state.viewMode);
    }
  }, { eager: true, scope: state.scope });

  events.on('search/error', (message) => {
    state.errorMessage = message || 'Unable to load products right now.';
    renderStatus(refs, state);
  }, { eager: true, scope: state.scope });

  events.on('search/result', (payload) => {
    state.currentRequest = payload.request || state.currentRequest;
    state.currentResult = payload.result || state.currentResult;
    state.visibleFilters = getVisibleFilters(payload.request?.filter || [], {
      urlPath: state.config.urlPath,
      activeTab: state.activeTab,
    });

    if ((payload.result?.items || []).length > 0 || (payload.result?.totalCount || 0) > 0) {
      state.errorMessage = '';
    }

    syncTabButtons(refs, state);
    syncViewMode(refs, state);
    syncFacetSections(refs.facets);
    renderSummary(refs, state);
    renderActiveFilters(refs, state);
    renderStatus(refs, state);
    renderProducts(refs, state);
    syncUrl(state);
  }, { eager: true, scope: state.scope });
}

async function runSearch(state, nextState) {
  const activeTab = findActiveTab(state.tabs, nextState.tabId || state.activeTab.id);
  state.activeTab = activeTab;

  const request = {
    phrase: '',
    currentPage: nextState.page || 1,
    pageSize: CATEGORY_PAGE_SIZE,
    sort: nextState.sort?.length ? nextState.sort : getDefaultSort(),
    filter: [
      ...getBaseCategoryFilters(state.config.urlPath, activeTab),
      ...(nextState.filters || []),
    ],
    context: getSearchContext(),
  };

  await search(request, {
    scope: state.scope,
  }).catch(() => {
    // search/error and fallback search/result are emitted by the discovery API
  });
}

function syncTabButtons(refs, state) {
  refs.tabList?.querySelectorAll('[data-tab-id]').forEach((button) => {
    button.classList.toggle('on', button.dataset.tabId === state.activeTab.id);
  });
}

function syncViewMode(refs, state) {
  const isListView = state.viewMode === 'list';
  refs.products.classList.toggle('list-view', isListView);
  refs.products.classList.toggle('grid-3', !isListView);

  refs.viewGrid?.classList.toggle('on', !isListView);
  refs.viewList?.classList.toggle('on', isListView);
}

function syncFacetSections(facetRoot) {
  facetRoot?.querySelectorAll('.product-discovery-facet').forEach((facet) => {
    if (!facet.classList.contains('is-open')) {
      facet.classList.add('is-open');
    }
  });
}

function getFacetTitle(attribute, facets = []) {
  return facets.find((facet) => facet.attribute === attribute)?.title || '';
}

function getFilterChips(filters = [], facets = []) {
  return filters.flatMap((filter, filterIndex) => {
    if (filter.range) {
      return [{
        filterIndex,
        value: '',
        label: formatFilterLabel(filter, facets),
      }];
    }

    const title = getFacetTitle(filter.attribute, facets);
    const prefix = title ? `${title}: ` : '';
    return (filter.in || []).map((value) => ({
      filterIndex,
      value,
      label: `${prefix}${value}`,
    }));
  });
}

function removeVisibleFilterChip(filters, chip = {}) {
  const sourceFilters = filters || [];

  return sourceFilters.reduce((nextFilters, filter, index) => {
    if (index !== chip.filterIndex) {
      nextFilters.push(filter);
      return nextFilters;
    }

    if (filter.range || !Array.isArray(filter.in) || filter.in.length === 1) {
      return nextFilters;
    }

    const nextValues = filter.in.filter((value) => value !== chip.value);
    if (nextValues.length) {
      nextFilters.push({
        ...filter,
        in: nextValues,
      });
    }

    return nextFilters;
  }, []);
}

function renderSummary(refs, state) {
  const totalCount = state.currentResult?.totalCount || 0;
  const currentPage = state.currentRequest?.currentPage || 1;
  const pageSize = state.currentRequest?.pageSize || CATEGORY_PAGE_SIZE;
  const itemCount = state.currentResult?.items?.length || 0;
  const firstIndex = totalCount ? ((currentPage - 1) * pageSize) + 1 : 0;
  const lastIndex = totalCount ? Math.min(firstIndex + itemCount - 1, totalCount) : 0;
  const heroText = totalCount
    ? `Showing ${formatNumber(firstIndex)}-${formatNumber(lastIndex)} of ${formatNumber(totalCount)} items`
    : 'No items found';

  refs.heroCount.textContent = heroText;
  refs.toolbarCount.innerHTML = `<b>${formatNumber(totalCount)}</b> products`;
}

function renderActiveFilters(refs, state) {
  const chips = getFilterChips(state.visibleFilters, state.currentResult?.facets || []);

  refs.activeFilters.replaceChildren();
  refs.filtersCount.textContent = chips.length ? String(chips.length) : '';
  refs.filtersCount.hidden = chips.length === 0;

  chips.forEach((chip) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'af-chip';
    button.dataset.filterIndex = String(chip.filterIndex);
    button.dataset.filterValue = chip.value;
    button.innerHTML = `
      <span>${escapeHtml(chip.label)}</span>
      <span class="af-x" aria-hidden="true">✕</span>
    `;
    refs.activeFilters.append(button);
  });
}

function renderStatus(refs, state) {
  refs.status.replaceChildren();

  if (state.errorMessage) {
    refs.status.innerHTML = `
      <div class="mcx-category-page__message mcx-category-page__message--error">
        ${escapeHtml(state.errorMessage)}
      </div>
    `;
    return;
  }

  if (!state.loading && (state.currentResult?.totalCount || 0) === 0) {
    refs.status.innerHTML = `
      <div class="mcx-category-page__message">
        No products matched the current filters.
      </div>
    `;
  }
}

function renderSkeletons(container, viewMode) {
  container.replaceChildren();
  container.classList.toggle('list-view', viewMode === 'list');
  container.classList.toggle('grid-3', viewMode !== 'list');

  Array.from({ length: 6 }).forEach(() => {
    const card = document.createElement('article');
    card.className = 'prod-card prod-card--skeleton';
    card.innerHTML = `
      <div class="prod-img-zone"></div>
      <div class="prod-info">
        <div class="mcx-category-page__skeleton-line mcx-category-page__skeleton-line--short"></div>
        <div class="mcx-category-page__skeleton-line"></div>
        <div class="mcx-category-page__skeleton-line"></div>
        <div class="mcx-category-page__skeleton-line mcx-category-page__skeleton-line--short"></div>
      </div>
    `;
    container.append(card);
  });
}

function renderProducts(refs, state) {
  refs.products.replaceChildren();

  if (state.errorMessage || !(state.currentResult?.items || []).length) {
    return;
  }

  state.currentResult.items.forEach((product) => {
    refs.products.append(createProductCard(product, state));
  });
}

function createProductCard(product, state) {
  const productUrl = getProductLink(product.urlKey, product.sku);
  const actionMode = getProductActionMode(product);
  const pricing = getProductPriceSummary(product);
  const optionHighlights = getProductOptionHighlights(product);
  const flags = getProductFlags(product);
  const imageUrl = product.images?.[0]?.url;
  const imageAlt = product.images?.[0]?.label || product.name || product.sku || '';
  const card = document.createElement('article');

  card.className = 'prod-card';
  card.dataset.sku = product.sku || '';
  card.dataset.productType = product.typename || '';

  const imageZone = document.createElement('div');
  imageZone.className = 'prod-img-zone';

  if (imageUrl) {
    const imageLink = document.createElement('a');
    imageLink.href = productUrl;
    imageLink.className = 'prod-img-link';

    const image = document.createElement('img');
    image.className = 'prod-img';
    image.src = imageUrl;
    image.alt = imageAlt;
    image.loading = 'lazy';
    imageLink.append(image);
    imageZone.append(imageLink);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'prod-img-ph';
    placeholder.textContent = '◆';
    imageZone.append(placeholder);
  }

  if (flags.length) {
    const flagWrap = document.createElement('div');
    flagWrap.className = 'prod-flags';
    flags.forEach((flagData) => {
      const flag = document.createElement('span');
      flag.className = `flag ${flagData.variant}`;
      flag.textContent = flagData.label;
      flagWrap.append(flag);
    });
    imageZone.append(flagWrap);
  }

  const wishlistHost = document.createElement('div');
  wishlistHost.className = 'prod-love';
  wishlistRender.render(WishlistToggle, {
    product,
    variant: 'tertiary',
  })(wishlistHost);
  imageZone.append(wishlistHost);

  imageZone.append(createActionButton(product, state.labels, productUrl, actionMode));
  card.append(imageZone);

  const info = document.createElement('div');
  info.className = 'prod-info';

  if (product.sku) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'prod-brand';
    eyebrow.textContent = product.sku;
    info.append(eyebrow);
  }

  const name = document.createElement('a');
  name.className = 'prod-name';
  name.href = productUrl;
  name.textContent = product.name || product.sku || 'Product';
  info.append(name);

  if (optionHighlights.swatches.length) {
    const swatches = document.createElement('div');
    swatches.className = 'prod-colors-mini';
    optionHighlights.swatches.forEach((swatch) => {
      const dot = document.createElement('span');
      dot.className = 'pcolor-dot';
      dot.title = swatch.label;
      dot.style.background = swatch.value;
      swatches.append(dot);
    });
    info.append(swatches);
  }

  const stock = document.createElement('div');
  stock.className = 'prod-stars-row';
  stock.innerHTML = `
    <span class="stars">${product.inStock ? 'In Stock' : 'Out of Stock'}</span>
    <span class="stars-ct">${product.typename === 'ComplexProductView' ? 'Select options for availability' : ''}</span>
  `;
  info.append(stock);

  const pricingWrap = document.createElement('div');
  pricingWrap.className = 'prod-pricing';
  pricingWrap.innerHTML = `
    <span class="p-now">${escapeHtml(pricing.current)}</span>
    ${pricing.original ? `<span class="p-was">${escapeHtml(pricing.original)}</span>` : ''}
    ${pricing.discounted ? '<span class="p-chip">Sale</span>' : ''}
  `;
  info.append(pricingWrap);

  if (optionHighlights.sizes.length) {
    const sizes = document.createElement('div');
    sizes.className = 'prod-sizes-mini';
    optionHighlights.sizes.forEach((size) => {
      const pill = document.createElement('span');
      pill.className = 'psz';
      pill.textContent = size;
      sizes.append(pill);
    });
    info.append(sizes);
  }

  card.append(info);
  return card;
}

function createActionButton(product, labels, productUrl, actionMode) {
  const addLabel = labels.Global?.AddProductToCart || 'Add to Cart';

  if (actionMode === 'link') {
    const link = document.createElement('a');
    link.className = 'prod-quick';
    link.href = productUrl;
    link.textContent = 'View Details';
    return link;
  }

  const button = document.createElement('button');
  button.className = 'prod-quick';
  button.type = 'button';

  if (actionMode === 'disabled') {
    button.disabled = true;
    button.textContent = 'Out of Stock';
    return button;
  }

  button.textContent = addLabel;
  button.addEventListener('click', async () => {
    try {
      await cartApi.addProductsToCart([{
        sku: product.sku,
        quantity: 1,
      }]);
      button.textContent = 'Added';
      button.classList.add('is-added');
      window.setTimeout(() => {
        button.textContent = addLabel;
        button.classList.remove('is-added');
      }, 1800);
    } catch {
      button.textContent = 'Try Again';
      window.setTimeout(() => {
        button.textContent = addLabel;
      }, 1800);
    }
  });

  return button;
}

function syncUrl(state) {
  const params = serializeSearchState({
    page: state.currentRequest?.currentPage || 1,
    sort: state.currentRequest?.sort || [],
    filters: state.visibleFilters,
    tabId: state.activeTab.id,
  });
  const searchString = params.toString();
  const nextUrl = `${window.location.pathname}${searchString ? `?${searchString}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, '', nextUrl);
  }
}

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const rows = getRows(block);
  const config = parseCategoryPageConfig(rows.map((row) => row.map(cellText)));

  if (!config.urlPath) {
    block.innerHTML = `
      <div class="mcx-category-page__message mcx-category-page__message--error">
        Missing required category page configuration: urlPath
      </div>
    `;
    return;
  }

  block.dataset.category = config.urlPath;

  const fragment = buildScaffold(config);
  block.replaceChildren(fragment);

  const refs = getRefs(block);
  const heroPicture = getHeroPicture(rows, config.heroImageAlt);
  if (heroPicture) {
    refs.heroMedia.append(heroPicture);
  }

  const initialState = parseSearchState(window.location.search, config.tabs);
  const state = createState(config, labels, initialState);

  bindUi(block, refs, state);
  bindSearchEvents(block, refs, state);
  syncTabButtons(refs, state);
  syncViewMode(refs, state);
  renderSkeletons(refs.products, state.viewMode);
  await renderDiscoveryControls(state, refs);
  await runSearch(state, initialState);
}
