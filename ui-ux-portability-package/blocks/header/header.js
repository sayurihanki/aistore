// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { fetchPlaceholders, getProductLink, rootLink } from '../../scripts/commerce.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');
const LIVE_SEARCH_OPEN_EVENT = 'bodea:live-search-open';

const labels = await fetchPlaceholders();

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.classList.remove('active');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">All Categories</h5><hr />';

const CATALOG_CATEGORY_ITEMS = [
  { label: 'Server Racks' },
  { label: 'Network Enclosures' },
  { label: 'Power & Cooling' },
  { label: 'Cable Management' },
  { label: 'Accessories' },
  {
    label: 'VIPs Only Category',
    fallbackPath: '/vips-only-category',
    aliases: ['VIP Category', 'VIPs Only Category.'],
  },
];

function normalizeGroupHash(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readVipGroupAllowlist() {
  const configValue = getConfigValue('navigation.catalog.vipCategory.allowedGroupHashes');
  let values = [];
  if (Array.isArray(configValue)) {
    values = configValue;
  } else if (typeof configValue === 'string') {
    values = configValue.split(',');
  }

  return [...new Set(values.map(normalizeGroupHash).filter(Boolean))];
}

const STORE_SWITCHER_OPTIONS = [
  {
    id: 'jenhankib2bapple',
    label: 'jenhankib2bapple',
    href: 'https://main--jenhankib2bapple--sayurihanki.aem.live/',
    matchToken: 'jenhankib2bapple',
  },
  {
    id: 'aistore',
    label: 'aistore',
    href: 'https://main--aistore--sayurihanki.aem.live/',
    matchToken: 'aistore',
  },
];

function getCurrentStoreId() {
  const currentUrl = `${window.location.hostname}${window.location.pathname}`.toLowerCase();
  return STORE_SWITCHER_OPTIONS
    .find(({ matchToken }) => currentUrl.includes(matchToken))
    ?.id || 'aistore';
}

function getStoreById(storeId) {
  return STORE_SWITCHER_OPTIONS.find(({ id }) => id === storeId) || STORE_SWITCHER_OPTIONS[0];
}

function createStoreSwitcher() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('store-switcher-wrapper', 'nav-tools-wrapper');

  const currentStore = getStoreById(getCurrentStoreId());

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.classList.add('store-switcher-toggle');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Choose storefront');

  const toggleLabel = document.createElement('span');
  toggleLabel.classList.add('store-switcher-toggle-label');
  toggleLabel.textContent = currentStore.label;

  const toggleCaret = document.createElement('span');
  toggleCaret.classList.add('store-switcher-toggle-caret');
  toggleCaret.setAttribute('aria-hidden', 'true');

  const menu = document.createElement('ul');
  menu.classList.add('store-switcher-menu');
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  const isOpen = () => wrapper.classList.contains('is-open');

  const setOpenState = (open) => {
    wrapper.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  };

  const closeMenu = () => setOpenState(false);

  STORE_SWITCHER_OPTIONS.forEach(({ id, label, href }) => {
    const item = document.createElement('li');
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.classList.add('store-switcher-option');
    optionButton.setAttribute('role', 'menuitemradio');
    optionButton.setAttribute('aria-checked', id === currentStore.id ? 'true' : 'false');
    optionButton.textContent = label;

    optionButton.addEventListener('click', () => {
      if (id === currentStore.id) {
        closeMenu();
        return;
      }

      window.location.href = href;
    });

    item.append(optionButton);
    menu.append(item);
  });

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    setOpenState(!isOpen());
  });

  toggle.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowDown' && !isOpen()) {
      event.preventDefault();
      setOpenState(true);
      menu.querySelector('.store-switcher-option')?.focus();
    }
  });

  menu.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      closeMenu();
      toggle.focus();
    }
  });

  toggle.append(toggleLabel, toggleCaret);
  wrapper.append(toggle, menu);

  return {
    closeMenu,
    element: wrapper,
  };
}

function getCategoryFallbackPath(label) {
  return rootLink(`/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
}

function enforceCatalogCategories(navList, { showVipCategory = false } = {}) {
  if (!navList) return;

  const catalogLi = [...navList.querySelectorAll(':scope > li')].find(
    (li) => (li.querySelector(':scope > p, :scope > a')?.textContent || '').trim().toLowerCase() === 'catalog',
  );
  if (!catalogLi) return;

  const submenuWrapper = catalogLi.querySelector(':scope > .submenu-wrapper');
  if (submenuWrapper) {
    // Cleanup any stale direct lists created before submenu wrapping.
    catalogLi.querySelectorAll(':scope > ul').forEach((list) => list.remove());
  }

  let catalogList = submenuWrapper
    ? submenuWrapper.querySelector(':scope > ul')
    : catalogLi.querySelector(':scope > ul');

  if (!catalogList) {
    catalogList = document.createElement('ul');
    if (submenuWrapper) {
      submenuWrapper.appendChild(catalogList);
    } else {
      catalogLi.appendChild(catalogList);
    }
  }

  const existingLinks = new Map(
    [...catalogList.querySelectorAll(':scope > li > a')].map((anchor) => [
      anchor.textContent.trim().toLowerCase(),
      {
        href: anchor.getAttribute('href') || '',
        title: anchor.getAttribute('title') || anchor.textContent.trim(),
      },
    ]),
  );

  const nextCatalogList = document.createElement('ul');
  CATALOG_CATEGORY_ITEMS
    .filter((item) => !item.requiresVipGroup || showVipCategory)
    .forEach((item) => {
      const linkKeys = [item.label, ...(item.aliases || [])].map((value) => value.toLowerCase());
      const linkData = linkKeys
        .map((key) => existingLinks.get(key))
        .find(Boolean) || {};
      const fallbackHref = item.fallbackPath
        ? rootLink(item.fallbackPath)
        : getCategoryFallbackPath(item.label);

      const li = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.textContent = item.label;
      anchor.title = linkData.title || item.label;
      anchor.href = linkData.href || fallbackHref;
      li.appendChild(anchor);
      nextCatalogList.appendChild(li);
    });

  if (submenuWrapper && catalogList.parentElement === submenuWrapper) {
    submenuWrapper.replaceChild(nextCatalogList, catalogList);
  } else {
    catalogLi.replaceChild(nextCatalogList, catalogList);
  }
}

/**
 * Sets up the submenu
 * @param {navSection} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(submenu.cloneNode(true));

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
  }
}

function localizeNavLinks(navSections) {
  if (!navSections) return;

  navSections.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    const normalizedHref = href?.trim().toLowerCase();
    const protocol = normalizedHref?.split(':', 1)[0];
    const isSpecialScheme = protocol === 'mailto'
      || protocol === 'tel'
      || protocol === 'javascript';

    if (!href || href.startsWith('#') || isSpecialScheme) {
      return;
    }

    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      anchor.href = `${rootLink(url.pathname)}${url.search}${url.hash}`;
    } catch {
      // Ignore malformed links from authoring content.
    }
  });
}

function getSafeAemAlias(product) {
  const rawAlias = product?.urlKey || product?.sku || 'product-image';
  return encodeURIComponent(rawAlias);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  let navOpenTimeout;
  const NAV_OPEN_DELAY_MS = 80;
  const cancelOpenNavSection = () => {
    if (navOpenTimeout) {
      window.clearTimeout(navOpenTimeout);
      navOpenTimeout = null;
    }
  };
  const scheduleOpenNavSection = (section) => {
    cancelOpenNavSection();
    if (!navSections) return;
    navOpenTimeout = window.setTimeout(() => {
      toggleAllNavSections(navSections);
      section.setAttribute('aria-expanded', 'true');
      overlay.classList.add('show');
      navOpenTimeout = null;
    }, NAV_OPEN_DELAY_MS);
  };

  if (navSections) {
    localizeNavLinks(navSections);

    const navList = navSections.querySelector('.default-content-wrapper > ul');
    if (navList) {
      const vipGroupAllowlist = new Set(readVipGroupAllowlist());
      let currentGroupHash = normalizeGroupHash(events.lastPayload('auth/group-uid'));
      let isAuthenticated = events.lastPayload('authenticated') === true;

      const shouldShowVipCategory = () => (
        isAuthenticated
        && !!currentGroupHash
        && vipGroupAllowlist.has(currentGroupHash)
      );

      const updateCatalogCategories = () => {
        enforceCatalogCategories(navList, {
          showVipCategory: shouldShowVipCategory(),
        });
      };

      updateCatalogCategories();

      events.on('authenticated', (payload) => {
        isAuthenticated = payload === true;
        updateCatalogCategories();
      }, { eager: true });

      events.on('auth/group-uid', (payload) => {
        currentGroupHash = normalizeGroupHash(payload);
        updateCatalogCategories();
      }, { eager: true });

      const hasAccount = [...navList.querySelectorAll(':scope > li')].some(
        (li) => li.textContent.trim().toLowerCase().includes('account'),
      );
      if (!hasAccount) {
        const accountLi = document.createElement('li');
        accountLi.innerHTML = `
          <p>Account</p>
          <ul>
            <li><a href="${rootLink('/customer/login')}" title="Log in">Log in</a></li>
            <li><a href="${rootLink('/customer/create')}" title="Registration">Registration</a></li>
            <li><a href="${rootLink('/customer/account')}" title="My Account">My Account</a></li>
            <li class="authCombineNavElement"><a href="#">Combined Auth</a></li>
          </ul>`;
        navList.insertBefore(accountLi, navList.children[1] ?? null);
      }
    }
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              cancelOpenNavSection();
              toggleAllNavSections(navSections);
              overlay.classList.remove('show');
              return;
            }
            scheduleOpenNavSection(navSection);
          }
        });
      });
  }

  const navTools = nav.querySelector('.nav-tools');
  const storeSwitcher = createStoreSwitcher();
  navTools.prepend(storeSwitcher.element);

  /** Wishlist */
  const wishlist = document.createRange().createContextualFragment(`
     <div class="wishlist-wrapper nav-tools-wrapper">
       <button type="button" class="nav-wishlist-button" aria-label="Wishlist"></button>
       <div class="wishlist-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(wishlist);

  const wishlistButton = navTools.querySelector('.nav-wishlist-button');

  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta ? new URL(wishlistMeta, window.location).pathname : '/wishlist';

  wishlistButton.addEventListener('click', () => {
    window.location.href = rootLink(wishlistPath);
  });

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  /**
   * Handles loading states for navigation panels with state management
   *
   * @param {HTMLElement} panel - The panel element to manage loading state for
   * @param {HTMLElement} button - The button that triggers the panel
   * @param {Function} loader - Async function to execute during loading
   */
  async function withLoadingState(panel, button, loader) {
    if (panel.dataset.loaded === 'true' || panel.dataset.loading === 'true') return;

    button.setAttribute('aria-busy', 'true');
    panel.dataset.loading = 'true';

    try {
      await loader();
      panel.dataset.loaded = 'true';
    } finally {
      panel.dataset.loading = 'false';
      button.removeAttribute('aria-busy');

      // Execute pending toggle if exists
      if (panel.dataset.pendingToggle === 'true') {
        // eslint-disable-next-line no-nested-ternary
        const pendingState = panel.dataset.pendingState === 'true' ? true : (panel.dataset.pendingState === 'false' ? false : undefined);

        // Clear pending flags
        panel.removeAttribute('data-pending-toggle');
        panel.removeAttribute('data-pending-state');

        // Execute the pending toggle
        const show = pendingState ?? !panel.classList.contains('nav-tools-panel--show');
        panel.classList.toggle('nav-tools-panel--show', show);
      }
    }
  }

  function togglePanel(panel, state) {
    // If loading is in progress, queue the toggle action
    if (panel.dataset.loading === 'true') {
      // Store the pending toggle action
      panel.dataset.pendingToggle = 'true';
      panel.dataset.pendingState = state !== undefined ? state.toString() : '';
      return;
    }

    const show = state ?? !panel.classList.contains('nav-tools-panel--show');
    panel.classList.toggle('nav-tools-panel--show', show);
  }

  // Lazy loading for mini cart fragment
  async function loadMiniCartFragment() {
    await withLoadingState(minicartPanel, cartButton, async () => {
      const miniCartMeta = getMetadata('mini-cart');
      const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
      const miniCartFragment = await loadFragment(miniCartPath);
      minicartPanel.append(miniCartFragment.firstElementChild);
    });
  }

  async function toggleMiniCart(state) {
    if (state) {
      await loadMiniCartFragment();
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }

    togglePanel(minicartPanel, state);
  }

  cartButton.addEventListener('click', () => {
    storeSwitcher.closeMenu();
    toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show'));
  });

  // Cart Item Counter
  events.on('cart/data', (data) => {
    // preload mini cart fragment if user has a cart
    if (data) loadMiniCartFragment();

    if (data?.totalQuantity) {
      cartButton.setAttribute('data-count', data.totalQuantity);
    } else {
      cartButton.removeAttribute('data-count');
    }
  }, { eager: true });

  /** Search */
  const searchFragment = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form id="search-bar-form"></form>
      <div class="search-bar-result" aria-hidden="true"></div>
    </div>
  </div>
  `);

  navTools.append(searchFragment);

  const searchPanel = navTools.querySelector('.nav-search-panel');
  const searchButton = navTools.querySelector('.nav-search-button');
  const searchForm = searchPanel.querySelector('#search-bar-form');
  const searchResult = searchPanel.querySelector('.search-bar-result');

  function setLiveSearchInputValue(query = '', focusInput = true) {
    const input = searchForm?.querySelector('input[name="search"], input');
    if (!input) return;
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (focusInput) input.focus();
  }

  async function toggleSearch(state) {
    const pageSize = 4;

    if (state) {
      await withLoadingState(searchPanel, searchButton, async () => {
        await import('../../scripts/initializers/search.js');

        // Load search components in parallel
        const [
          { search },
          { render },
          { SearchResults },
          { provider: UI, Input, Button },
        ] = await Promise.all([
          import('@dropins/storefront-product-discovery/api.js'),
          import('@dropins/storefront-product-discovery/render.js'),
          import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
          import('@dropins/tools/components.js'),
          import('@dropins/tools/lib.js'),
        ]);

        render.render(SearchResults, {
          skeletonCount: pageSize,
          scope: 'popover',
          routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
          onSearchResult: (results) => {
            const hasResults = results.length > 0;
            searchResult.classList.toggle('is-open', hasResults);
            searchResult.setAttribute('aria-hidden', hasResults ? 'false' : 'true');
          },
          slots: {
            ProductImage: (ctx) => {
              const { product, defaultImageProps } = ctx;
              const anchorWrapper = document.createElement('a');
              anchorWrapper.href = getProductLink(product.urlKey, product.sku);

              if (!defaultImageProps?.src) {
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
            },
            Footer: async (ctx) => {
              // View all results button
              const viewAllResultsWrapper = document.createElement('div');
              viewAllResultsWrapper.classList.add('search-view-all');

              const viewAllResultsButton = await UI.render(Button, {
                children: labels.Global?.SearchViewAll,
                variant: 'secondary',
                href: rootLink('/search'),
              })(viewAllResultsWrapper);

              ctx.appendChild(viewAllResultsWrapper);

              ctx.onChange((next) => {
                viewAllResultsButton?.setProps((prev) => ({
                  ...prev,
                  href: `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`,
                }));
              });
            },
          },
        })(searchResult);

        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = e.target.search.value;
          if (query.length) {
            window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(query)}`;
          }
        });

        UI.render(Input, {
          name: 'search',
          placeholder: labels.Global?.Search,
          onValue: (phrase) => {
            if (!phrase) {
              search(null, { scope: 'popover' });
              return;
            }

            if (phrase.length < 3) {
              return;
            }

            search({
              phrase,
              pageSize,
              filter: [
                { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
              ],
            }, { scope: 'popover' });
          },
        })(searchForm);
      });
    }

    togglePanel(searchPanel, state);
    if (state) searchForm?.querySelector('input')?.focus();
  }

  searchButton.addEventListener('click', () => toggleSearch(!searchPanel.classList.contains('nav-tools-panel--show')));

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    storeSwitcher.closeMenu();
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener(LIVE_SEARCH_OPEN_EVENT, async (event) => {
    const query = event?.detail?.query?.trim?.() || '';
    const focusInput = event?.detail?.focus !== false;
    storeSwitcher.closeMenu();

    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }

    await toggleSearch(true);
    setLiveSearchInputValue(query, focusInput);
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    // Check if undo is enabled for mini cart
    const miniCartElement = document.querySelector(
      '[data-block-name="commerce-mini-cart"]',
    );
    const undoEnabled = miniCartElement
      && (miniCartElement.textContent?.includes('undo-remove-item')
        || miniCartElement.innerHTML?.includes('undo-remove-item'));

    // For mini cart: if undo is enabled, be more restrictive about when to close
    const shouldCloseMiniCart = undoEnabled
      ? !minicartPanel.contains(e.target)
      && !cartButton.contains(e.target)
      && !e.target.closest('header')
      : !minicartPanel.contains(e.target) && !cartButton.contains(e.target);

    if (shouldCloseMiniCart) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }

    if (!storeSwitcher.element.contains(e.target)) {
      storeSwitcher.closeMenu();
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  let navCloseTimeout;
  const NAV_CLOSE_DELAY_MS = 85;
  function scheduleCloseNavSections() {
    navCloseTimeout = window.setTimeout(() => {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
      navCloseTimeout = null;
    }, NAV_CLOSE_DELAY_MS);
  }
  function cancelCloseNavSections() {
    if (navCloseTimeout) {
      window.clearTimeout(navCloseTimeout);
      navCloseTimeout = null;
    }
  }
  navWrapper.addEventListener('mouseout', (e) => {
    if (!isDesktop.matches) return;
    const related = e.relatedTarget;
    if (related && nav.contains(related)) return;
    cancelOpenNavSection();
    scheduleCloseNavSections();
  });
  navWrapper.addEventListener('mouseenter', () => cancelCloseNavSections());
  overlay.addEventListener('mouseenter', () => {
    cancelOpenNavSection();
    scheduleCloseNavSections();
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    storeSwitcher.closeMenu();
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    storeSwitcher.closeMenu();
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);

  /** Company Switcher */
  const isAuthenticated = events.lastPayload('authenticated');
  if (isAuthenticated && getConfigValue('commerce-companies-enabled') === true) {
    await (await import('./renderCompanySwitcher.js')).default(navTools);
  }
}
