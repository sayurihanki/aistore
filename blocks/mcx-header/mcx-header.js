import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

import { getMetadata, toClassName } from '../../scripts/aem.js';
import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
  ORDER_STATUS_PATH,
  fetchPlaceholders,
  getProductLink,
  getSearchContext,
  rootLink,
} from '../../scripts/commerce.js';

const LIVE_SEARCH_PAGE_SIZE = 5;
const LIVE_SEARCH_MIN_QUERY_LENGTH = 2;
const LIVE_SEARCH_DEBOUNCE_MS = 90;
const REGISTRATION_PATH = '/customer/create';
const COMPANY_ACCOUNT_CREATE_PATH = '/customer/company/create';
const CART_PATH = '/cart';
const SEARCH_PATH = '/search';
const WISHLIST_PATH = '/wishlist';

const STORE_SWITCHER_OPTIONS = [
  {
    id: 'jenhankib2bapple',
    label: 'jenhankib2bapple',
    href: 'https://main--jenhankib2bapple--sayurihanki.aem.live/',
    matchToken: 'jenhankib2bapple',
  },
  {
    id: 'jenhankib2bbodea',
    label: 'jenhankib2bbodea',
    href: 'https://main--jenhankib2bbodea--sayurihanki.aem.live/',
    matchToken: 'jenhankib2bbodea',
  },
  {
    id: 'usmccsmymcx',
    label: 'usmccsmymcx',
    href: 'https://main--usmccsmymcx--sayurihanki.aem.live/',
    matchToken: 'usmccsmymcx',
  },
  {
    id: 'aistore',
    label: 'aistore',
    href: 'https://main--aistore--sayurihanki.aem.live/',
    matchToken: 'aistore',
  },
];

let liveSearchCounter = 0;

function iconMarkup(name) {
  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  };

  return icons[name] || '';
}

function normalizePath(value = '/') {
  try {
    const url = new URL(value, window.location.origin);
    const path = url.pathname.replace(/\/+$/, '');
    return path || '/';
  } catch {
    const path = String(value).trim().replace(/\/+$/, '');
    return path || '/';
  }
}

function resolveHref(value = '#') {
  if (!value || value === '#') {
    return '#';
  }

  if (value.startsWith('mailto:') || value.startsWith('tel:')) {
    return value;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin) {
      return rootLink(`${url.pathname}${url.search}${url.hash}`);
    }
    return url.href;
  } catch {
    return value;
  }
}

function getCookieValue(name) {
  const cookieString = document.cookie || '';
  return cookieString
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split('='))
    .find(([key]) => key === name)?.[1]
    ? decodeURIComponent(
      cookieString
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split('='))
        .find(([key]) => key === name)
        ?.slice(1)
        .join('=') || '',
    )
    : '';
}

function getAuthSnapshot() {
  const eventState = typeof events?.lastPayload === 'function'
    ? events.lastPayload('authenticated')
    : undefined;
  const firstName = getCookieValue('auth_dropin_firstname');
  const hasToken = Boolean(getCookieValue('auth_dropin_user_token'));

  return {
    firstName,
    isAuthenticated: typeof eventState === 'boolean' ? eventState : hasToken || Boolean(firstName),
  };
}

function getSafeAemAlias(product) {
  const rawAlias = product?.urlKey || product?.sku || 'product-image';
  return encodeURIComponent(rawAlias);
}

function getUniqueId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  liveSearchCounter += 1;
  return `${prefix}-${liveSearchCounter}`;
}

function getUniqueLiveSearchScope() {
  return getUniqueId('mcx-header-live');
}

function resolveActiveIndex(navItems) {
  const currentPath = normalizePath(window.location.pathname);
  const matchIndex = navItems.findIndex(({ url }) => {
    const itemPath = normalizePath(url);
    return itemPath !== '/' && currentPath.startsWith(itemPath);
  });

  return matchIndex >= 0 ? matchIndex : 0;
}

function createLogo() {
  const link = document.createElement('a');
  link.className = 'logo';
  link.href = rootLink('/');
  link.setAttribute('aria-label', 'MCX home');
  link.innerHTML = `
    <div class="logo-emblem" aria-hidden="true">
      <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="23" cy="23" r="22" fill="#C1121F" opacity="0.15"></circle>
        <circle cx="23" cy="23" r="22" stroke="#C1121F" stroke-width="1" opacity="0.4"></circle>
        <path d="M23 6L10 12V22C10 29.73 15.8 37.04 23 39C30.2 37.04 36 29.73 36 22V12L23 6Z" fill="rgba(193,18,31,0.25)" stroke="rgba(193,18,31,0.7)" stroke-width="1.2"></path>
        <path d="M23 13L17 16V21C17 24.87 19.7 28.48 23 29.5C26.3 28.48 29 24.87 29 21V16L23 13Z" fill="white" fill-opacity="0.85"></path>
        <circle cx="23" cy="21" r="4" fill="#C1121F"></circle>
        <circle cx="23" cy="21" r="1.5" fill="white"></circle>
      </svg>
    </div>
    <div class="logo-text">
      <div class="logo-mcx">MCX</div>
      <div class="logo-tagline">Marine Corps Exchange</div>
    </div>
  `;
  return link;
}

function createSearchForm(placeholder) {
  const search = document.createElement('form');
  search.className = 'hdr-search';
  search.setAttribute('role', 'search');
  search.setAttribute('action', rootLink(SEARCH_PATH));
  search.setAttribute('method', 'get');
  search.setAttribute('aria-expanded', 'false');
  search.dataset.searchStatus = 'idle';

  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = iconMarkup('search');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.setAttribute('aria-label', 'Search products');
  input.setAttribute('data-mcx-search-input', 'true');
  input.placeholder = placeholder;

  const shortcut = document.createElement('span');
  shortcut.className = 'search-shortcut';
  shortcut.setAttribute('aria-hidden', 'true');
  shortcut.textContent = 'Ctrl K';

  const results = document.createElement('div');
  results.className = 'hdr-search-results';
  results.setAttribute('aria-hidden', 'true');
  results.setAttribute('aria-busy', 'false');
  results.setAttribute('data-mcx-live-search', 'true');
  results.setAttribute('hidden', '');

  const liveRegion = document.createElement('div');
  liveRegion.className = 'hdr-search-status';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');

  search.append(icon, input, shortcut, results, liveRegion);
  return search;
}

function getDefaultAccountLinks() {
  return {
    account: CUSTOMER_ACCOUNT_PATH,
    combinedAuth: '#combined-auth',
    companyAccount: COMPANY_ACCOUNT_CREATE_PATH,
    login: CUSTOMER_LOGIN_PATH,
    registration: REGISTRATION_PATH,
    searchOrder: ORDER_STATUS_PATH,
  };
}

function getDefaultData() {
  return {
    configs: {
      hotLabel: 'Deals & Offers',
      hotUrl: '/deals',
      searchPlaceholder: 'Search products, brands, gear...',
      signInLabel: 'Sign In',
    },
    navItems: [
      {
        label: 'Shop All',
        url: '/shop',
        groups: [],
        features: [],
      },
      {
        label: 'Apparel & Footwear',
        url: '/apparel-footwear',
        groups: [
          { label: "Men's", links: ['Uniforms & Cammies', 'T-Shirts & Polos', 'Athletic Wear', 'Outerwear', 'Pants & Shorts', 'Dress Attire'].map((text) => ({ text, url: '/apparel-footwear' })) },
          { label: "Women's", links: ['Uniforms', 'Activewear', 'Casual Wear', 'Outerwear', 'Loungewear', 'Accessories'].map((text) => ({ text, url: '/apparel-footwear' })) },
          { label: 'Footwear', links: ['Tactical Boots', 'Athletic Shoes', 'Dress Shoes', 'Sandals & Slides', 'Work & Safety'].map((text) => ({ text, url: '/apparel-footwear' })) },
        ],
        features: [
          { text: 'Clearance Apparel', url: '/clearance' },
          { text: 'Top Rated Boots', url: '/boots' },
          { text: 'New Arrivals', url: '/new' },
        ],
      },
      {
        label: 'Electronics',
        url: '/electronics',
        groups: [
          { label: 'Computers', links: ['MacBooks & Laptops', 'Tablets & iPads', 'Monitors', 'Accessories'].map((text) => ({ text, url: '/electronics' })) },
          { label: 'Mobile & Audio', links: ['Smartphones', 'Headphones', 'Earbuds', 'Speakers', 'Smart Watches'].map((text) => ({ text, url: '/electronics' })) },
          { label: 'Gaming', links: ['Consoles', 'Games & Software', 'Controllers', 'Gaming Chairs'].map((text) => ({ text, url: '/electronics' })) },
        ],
        features: [
          { text: 'Apple Products', url: '/electronics/apple' },
          { text: 'Gaming Deals', url: '/electronics/gaming' },
        ],
      },
      {
        label: 'Home & Living',
        url: '/home',
        groups: [
          { label: 'Furniture', links: ['Bedroom', 'Living Room', 'Office', 'Outdoor Living'].map((text) => ({ text, url: '/home' })) },
          { label: 'Kitchen', links: ['Appliances', 'Cookware', 'Dining', 'Food Storage'].map((text) => ({ text, url: '/home' })) },
          { label: 'Bedding & Bath', links: ['Bed Sheets', 'Comforters', 'Pillows', 'Towels'].map((text) => ({ text, url: '/home' })) },
        ],
        features: [],
      },
      {
        label: 'Sports & Outdoors',
        url: '/sports-outdoors',
        groups: [],
        features: [],
      },
      {
        label: 'Uniforms',
        url: '/uniforms',
        groups: [],
        features: [],
      },
      {
        label: 'Kids & Toys',
        url: '/kids-toys',
        groups: [],
        features: [],
      },
    ],
  };
}

async function fetchFragmentDocument(path) {
  const response = await fetch(`${path}.plain.html`);
  if (!response.ok) throw new Error(`Unable to load fragment: ${path}`);
  const main = document.createElement('main');
  main.innerHTML = await response.text();
  return main;
}

function normalizeConfigKey(key) {
  const aliasMap = {
    'hot-label': 'hotLabel',
    'hot-url': 'hotUrl',
    'search-placeholder': 'searchPlaceholder',
    'sign-in-label': 'signInLabel',
  };

  return aliasMap[key] || key;
}

function upsertNavItem(items, label, url = '') {
  let item = items.find((entry) => entry.label === label);
  if (!item) {
    item = {
      label,
      url: url || '#',
      groups: [],
      features: [],
    };
    items.push(item);
  }
  if (url) item.url = url;
  return item;
}

function upsertGroup(item, label) {
  let group = item.groups.find((entry) => entry.label === label);
  if (!group) {
    group = {
      label,
      links: [],
    };
    item.groups.push(group);
  }
  return group;
}

function normalizeAccountLinkKey(label = '') {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  if (['log in', 'login', 'sign in'].includes(normalized)) return 'login';
  if (['registration', 'register', 'sign up', 'create account'].includes(normalized)) return 'registration';
  if (['account', 'my account'].includes(normalized)) return 'account';
  if (['create new company account', 'create company account', 'company account'].includes(normalized)) return 'companyAccount';
  if (['combined auth', 'combined authentication'].includes(normalized)) return 'combinedAuth';
  if (['search order', 'order status'].includes(normalized)) return 'searchOrder';
  return '';
}

function normalizeHiddenNavKey(label = '') {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (['account', 'my account'].includes(normalized)) return 'account';
  if (['search order', 'order status'].includes(normalized)) return 'searchOrder';
  return '';
}

function flattenNavItemLinks(item) {
  const links = [{ text: item.label, url: item.url }];
  item.groups.forEach((group) => {
    group.links.forEach((link) => links.push(link));
  });
  item.features.forEach((feature) => {
    links.push({ text: feature.text, url: feature.url });
  });
  return links;
}

function mergeAccountLinks(accountLinks, links) {
  links.forEach(({ text, url }) => {
    const key = normalizeAccountLinkKey(text);
    if (key && url) {
      accountLinks[key] = url;
    }
  });
}

function normalizeHeaderData(data) {
  const accountLinks = getDefaultAccountLinks();
  const navItems = [];

  data.navItems.forEach((item) => {
    const hiddenKey = normalizeHiddenNavKey(item.label);

    if (hiddenKey === 'account') {
      mergeAccountLinks(accountLinks, flattenNavItemLinks(item));
      return;
    }

    if (hiddenKey === 'searchOrder') {
      accountLinks.searchOrder = item.url || accountLinks.searchOrder;
      mergeAccountLinks(accountLinks, flattenNavItemLinks(item));
      return;
    }

    navItems.push(item);
  });

  return {
    ...data,
    accountLinks,
    navItems,
  };
}

function parseNavData(main) {
  const dataBlock = main.querySelector('.mcx-nav-data');
  if (!dataBlock) return normalizeHeaderData(getDefaultData());

  const data = {
    configs: {
      hotLabel: 'Deals & Offers',
      hotUrl: '/deals',
      searchPlaceholder: 'Search products, brands, gear...',
      signInLabel: 'Sign In',
    },
    navItems: [],
  };

  [...dataBlock.children].forEach((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    const [type, parent, label, value] = cells;
    if (!type) return;

    const normalizedType = toClassName(type);

    if (normalizedType === 'config') {
      data.configs[normalizeConfigKey(toClassName(label))] = value;
      return;
    }

    if (normalizedType === 'hot') {
      data.configs.hotLabel = label;
      data.configs.hotUrl = value;
      return;
    }

    if (normalizedType === 'item') {
      upsertNavItem(data.navItems, label, value);
      return;
    }

    if (normalizedType === 'group') {
      const item = upsertNavItem(data.navItems, parent);
      upsertGroup(item, label);
      return;
    }

    if (normalizedType === 'link') {
      const [itemLabel, groupLabel] = parent.split('>').map((entry) => entry.trim());
      const item = upsertNavItem(data.navItems, itemLabel);
      const group = upsertGroup(item, groupLabel);
      group.links.push({ text: label, url: value || '#' });
      return;
    }

    if (normalizedType === 'feature') {
      const item = upsertNavItem(data.navItems, parent);
      item.features.push({ text: label, url: value || '#' });
    }
  });

  return data.navItems.length ? normalizeHeaderData(data) : normalizeHeaderData(getDefaultData());
}

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
  wrapper.className = 'hdr-storefront store-switcher-wrapper';

  const currentStore = getStoreById(getCurrentStoreId());
  const menuId = getUniqueId('mcx-store-switcher');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'store-switcher-toggle';
  toggle.setAttribute('aria-controls', menuId);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'menu');
  toggle.setAttribute('aria-label', 'Choose storefront');

  const label = document.createElement('span');
  label.className = 'store-switcher-toggle-label';
  label.textContent = currentStore.label;

  const caret = document.createElement('span');
  caret.className = 'store-switcher-toggle-caret';
  caret.setAttribute('aria-hidden', 'true');
  caret.innerHTML = iconMarkup('chevron');

  const menu = document.createElement('ul');
  menu.className = 'store-switcher-menu';
  menu.id = menuId;
  menu.hidden = true;
  menu.setAttribute('role', 'menu');

  const setStoreOpenState = (open) => {
    wrapper.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
  };

  const closeMenu = () => setStoreOpenState(false);

  STORE_SWITCHER_OPTIONS.forEach(({ id, href, label: optionLabel }) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');

    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'store-switcher-option';
    option.setAttribute('role', 'menuitemradio');
    option.setAttribute('aria-checked', id === currentStore.id ? 'true' : 'false');
    option.textContent = optionLabel;
    option.addEventListener('click', () => {
      if (id === currentStore.id) {
        closeMenu();
        return;
      }

      window.location.href = href;
    });

    item.append(option);
    menu.append(item);
  });

  toggle.addEventListener('click', () => {
    setStoreOpenState(!wrapper.classList.contains('is-open'));
  });

  toggle.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setStoreOpenState(true);
      requestAnimationFrame(() => {
        menu.querySelector('.store-switcher-option')?.focus();
      });
    }
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      closeMenu();
    }
  });

  wrapper.append(toggle);
  toggle.append(label, caret);
  wrapper.append(menu);

  return {
    closeMenu,
    element: wrapper,
  };
}

function createActionLink(kind, href, label = '') {
  const element = document.createElement('a');
  element.className = `hdr-act hdr-act-${kind}`;
  element.href = resolveHref(href);
  element.setAttribute('aria-label', label || kind);

  let icon = kind;
  if (kind === 'wishlist') icon = 'heart';

  element.innerHTML = `${iconMarkup(icon)}${label ? `<span>${label}</span>` : ''}`;

  let badge = null;
  if (kind === 'cart') {
    badge = document.createElement('span');
    badge.className = 'cart-dot';
    badge.dataset.mcxCartCount = 'true';
    badge.setAttribute('hidden', '');
    element.append(badge);
  }

  return {
    badge,
    element,
  };
}

function focusAccountMenuItem(list, delta) {
  const items = [...list.querySelectorAll('a, button:not([disabled])')];
  if (!items.length) {
    return;
  }

  const currentIndex = items.indexOf(document.activeElement);
  const fallbackIndex = delta > 0 ? 0 : items.length - 1;
  const nextIndex = currentIndex === -1
    ? fallbackIndex
    : (currentIndex + delta + items.length) % items.length;
  items[nextIndex].focus();
}

function createAccountMenu({
  accountLinks,
  signInLabel = 'Sign In',
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'hdr-account';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hdr-act hdr-signin';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-haspopup', 'menu');

  const buttonLabel = document.createElement('span');
  buttonLabel.className = 'hdr-signin-label';

  const buttonCaret = document.createElement('span');
  buttonCaret.className = 'hdr-signin-caret';
  buttonCaret.setAttribute('aria-hidden', 'true');
  buttonCaret.innerHTML = iconMarkup('chevron');

  button.innerHTML = iconMarkup('user');
  button.append(buttonLabel, buttonCaret);

  const panel = document.createElement('div');
  panel.className = 'hdr-account-panel';
  panel.hidden = true;

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hdr-account-eyebrow';

  const title = document.createElement('h3');
  title.className = 'hdr-account-title';

  const description = document.createElement('p');
  description.className = 'hdr-account-copy';

  const list = document.createElement('ul');
  list.className = 'hdr-account-list';
  list.setAttribute('role', 'menu');

  const closeMenu = () => {
    wrapper.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  };

  const openMenu = () => {
    wrapper.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  };

  const setAccountOpenState = (open, { focusFirst = false } = {}) => {
    if (open) {
      openMenu();
      if (focusFirst) {
        requestAnimationFrame(() => {
          list.querySelector('a, button')?.focus();
        });
      }
      return;
    }

    closeMenu();
  };

  async function handleLogout() {
    const authApi = await import('@dropins/storefront-auth/api.js');
    await authApi.revokeCustomerToken();

    if (window.location.pathname.includes('/checkout')) {
      window.location.href = rootLink(CART_PATH);
      return;
    }

    if (window.location.pathname.includes('/customer')) {
      window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
      return;
    }

    if (window.location.pathname.includes('/order-details')) {
      window.location.href = rootLink('/');
      return;
    }

    if (typeof window.location.reload === 'function') {
      window.location.reload();
    } else {
      window.location.href = `${window.location.pathname}${window.location.search || ''}`;
    }
  }

  function buildMenuItem({
    action,
    href,
    kind = 'link',
    label,
    tone = 'default',
  }) {
    const item = document.createElement('li');
    item.setAttribute('role', 'none');

    const control = document.createElement(kind === 'button' ? 'button' : 'a');
    control.className = `hdr-account-item${tone !== 'default' ? ` is-${tone}` : ''}`;
    control.setAttribute('role', 'menuitem');
    control.textContent = label;

    if (kind === 'button') {
      control.type = 'button';
    } else {
      control.href = resolveHref(href);
    }

    control.addEventListener('click', async (event) => {
      if (kind === 'button') {
        event.preventDefault();
      }

      closeMenu();

      if (action) {
        await action();
      }
    });

    item.append(control);
    return item;
  }

  function sync(nextState = getAuthSnapshot()) {
    const state = nextState || getAuthSnapshot();

    buttonLabel.textContent = state.isAuthenticated ? 'My Account' : signInLabel;
    eyebrow.textContent = state.isAuthenticated ? 'Mission Profile' : 'Account Access';
    if (state.isAuthenticated) {
      title.textContent = state.firstName
        ? `Welcome back, ${state.firstName}`
        : 'Manage your account';
    } else {
      title.textContent = 'Sign in, register, or track an order';
    }
    description.textContent = state.isAuthenticated
      ? 'Quick links for your account, orders, and company access.'
      : 'Open the login flow, create an account, or jump straight to order lookup.';

    list.replaceChildren();

    const menuItems = state.isAuthenticated
      ? [
        { label: 'My Account', href: accountLinks.account },
        { label: 'Create New Company Account', href: accountLinks.companyAccount },
        { label: 'Search Order', href: accountLinks.searchOrder },
        {
          label: 'Logout',
          kind: 'button',
          tone: 'danger',
          action: handleLogout,
        },
      ]
      : [
        { label: 'Log in', href: accountLinks.login },
        { label: 'Registration', href: accountLinks.registration },
        { label: 'My Account', href: accountLinks.account },
        { label: 'Create New Company Account', href: accountLinks.companyAccount },
        {
          label: 'Combined Auth',
          kind: 'button',
          tone: 'accent',
          action: async () => {
            const { default: openAuthCombineModal } = await import('./auth-combine-modal.js');
            openAuthCombineModal({ triggerElement: button });
          },
        },
        { label: 'Search Order', href: accountLinks.searchOrder },
      ];

    menuItems.forEach((item) => {
      list.append(buildMenuItem(item));
    });
  }

  button.addEventListener('click', () => {
    setAccountOpenState(!wrapper.classList.contains('is-open'));
  });

  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAccountOpenState(true, { focusFirst: true });
    }
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      button.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAccountMenuItem(list, 1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAccountMenuItem(list, -1);
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      closeMenu();
    }
  });

  wrapper.addEventListener('focusout', (event) => {
    if (!wrapper.contains(event.relatedTarget)) {
      closeMenu();
    }
  });

  panel.append(eyebrow, title, description, list);
  wrapper.append(button, panel);

  return {
    closeMenu,
    element: wrapper,
    sync,
  };
}

function buildMegaMenu(item) {
  if (!item.groups.length) return null;

  const mega = document.createElement('div');
  mega.className = 'mega';
  mega.setAttribute('role', 'group');
  mega.setAttribute('aria-label', `${item.label} categories`);

  const columns = document.createElement('div');
  columns.className = 'mega-cols';

  item.groups.forEach((group) => {
    const column = document.createElement('div');
    column.className = 'mega-col';

    const title = document.createElement('h4');
    title.textContent = group.label;
    column.append(title);

    const list = document.createElement('ul');
    group.links.forEach((linkData) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = resolveHref(linkData.url);
      link.textContent = linkData.text;
      listItem.append(link);
      list.append(listItem);
    });

    column.append(list);
    columns.append(column);
  });

  mega.append(columns);

  if (item.features.length) {
    const featureRow = document.createElement('div');
    featureRow.className = 'mega-ft';
    item.features.forEach((feature) => {
      const link = document.createElement('a');
      link.className = 'mega-ft-tag';
      link.href = resolveHref(feature.url);
      link.textContent = feature.text;
      featureRow.append(link);
    });
    mega.append(featureRow);
  }

  return mega;
}

function buildHeaderDom(data) {
  const shell = document.createElement('div');
  shell.className = 'header';
  const activeIndex = resolveActiveIndex(data.navItems);

  const mainBar = document.createElement('div');
  mainBar.className = 'hdr-main';
  mainBar.append(createLogo());

  const search = createSearchForm(data.configs.searchPlaceholder);
  mainBar.append(search);

  const actions = document.createElement('div');
  actions.className = 'hdr-actions';

  const storefront = createStoreSwitcher();
  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta
    ? new URL(wishlistMeta, window.location).pathname
    : WISHLIST_PATH;
  const wishlist = createActionLink('wishlist', wishlistPath, 'Wishlist');
  const cart = createActionLink('cart', CART_PATH, 'Cart');
  const authMenu = createAccountMenu({
    accountLinks: data.accountLinks,
    signInLabel: data.configs.signInLabel,
  });

  actions.append(
    storefront.element,
    wishlist.element,
    cart.element,
    authMenu.element,
  );
  mainBar.append(actions);
  shell.append(mainBar);

  const nav = document.createElement('nav');
  nav.className = 'nav-bar';
  nav.setAttribute('aria-label', 'Primary');

  const navInner = document.createElement('div');
  navInner.className = 'nav-inner';

  data.navItems.forEach((item, index) => {
    const navItem = document.createElement('div');
    navItem.className = 'nav-item';

    const link = document.createElement('a');
    const isActive = index === activeIndex;
    link.className = `nav-link${isActive ? ' on' : ''}`;
    link.href = resolveHref(item.url);
    link.innerHTML = `${item.label}${item.groups.length ? iconMarkup('chevron') : ''}`;
    if (isActive) link.setAttribute('aria-current', 'page');
    if (item.groups.length) {
      navItem.classList.add('has-mega');
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
    }
    navItem.append(link);

    const mega = buildMegaMenu(item);
    if (mega) navItem.append(mega);

    navInner.append(navItem);
  });

  const spacer = document.createElement('div');
  spacer.className = 'nav-spacer';
  navInner.append(spacer);

  const hotLink = document.createElement('a');
  hotLink.className = 'nav-hot';
  hotLink.href = resolveHref(data.configs.hotUrl);
  hotLink.textContent = data.configs.hotLabel;
  navInner.append(hotLink);

  nav.append(navInner);
  shell.append(nav);

  return {
    authMenu,
    cartCount: cart.badge,
    shell,
  };
}

function syncMegaOffsets(block) {
  const navInner = block.querySelector('.nav-inner');
  if (!navInner) return;

  navInner.querySelectorAll('.nav-item.has-mega').forEach((item) => {
    item.style.setProperty('--mega-shift', `${item.offsetLeft}px`);
  });
}

function syncHeaderShellHeight(block) {
  const siteHeader = block.closest('header');
  const shell = block.querySelector('.header');
  if (!siteHeader || !shell) return;

  const updateHeight = () => {
    const height = Math.ceil(shell.getBoundingClientRect().height);
    if (!height) return;

    document.documentElement.style.setProperty('--mcx-header-shell-height', `${height}px`);
    siteHeader.style.minHeight = `${height}px`;
  };

  updateHeight();
  window.requestAnimationFrame(() => updateHeight());

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateHeight).catch(() => {});
  }

  if (window.ResizeObserver) {
    const resizeObserver = new window.ResizeObserver(() => updateHeight());
    resizeObserver.observe(shell);
  }

  window.addEventListener('resize', updateHeight, { passive: true });
}

function bindMegaState(block) {
  const navItems = [...block.querySelectorAll('.nav-item.has-mega')];

  const setItemOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav-link')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => setItemOpen(item, true));
    item.addEventListener('mouseleave', () => setItemOpen(item, false));
    item.addEventListener('focusin', () => setItemOpen(item, true));
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) {
        setItemOpen(item, false);
      }
    });
  });
}

function setOpenState(searchForm, resultsPanel, isOpen) {
  searchForm.classList.toggle('is-open', isOpen);
  if (isOpen) {
    searchForm.classList.add('expanded');
    searchForm.setAttribute('aria-expanded', 'true');
    resultsPanel.classList.add('is-open');
    resultsPanel.removeAttribute('hidden');
    resultsPanel.setAttribute('aria-hidden', 'false');
    return;
  }

  searchForm.classList.remove('expanded');
  searchForm.setAttribute('aria-expanded', 'false');
  resultsPanel.classList.remove('is-open');
  resultsPanel.setAttribute('hidden', '');
  resultsPanel.setAttribute('aria-hidden', 'true');
}

async function enhanceLiveSearch(block) {
  const searchForm = block.querySelector('.hdr-search');
  const searchInput = searchForm?.querySelector('[data-mcx-search-input]');
  const resultsPanel = searchForm?.querySelector('[data-mcx-live-search]');
  const liveRegion = searchForm?.querySelector('.hdr-search-status');

  if (!searchForm || !searchInput || !resultsPanel || !liveRegion) {
    return;
  }

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery && !searchInput.value) {
    searchInput.value = initialQuery;
  }

  const searchScope = getUniqueLiveSearchScope();
  const resultsId = `${searchScope}-results`;
  resultsPanel.id = resultsId;
  resultsPanel.setAttribute('role', 'region');
  resultsPanel.setAttribute('aria-label', 'Live search results');
  searchInput.setAttribute('aria-controls', resultsId);
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.setAttribute('autocomplete', 'off');
  searchInput.setAttribute('spellcheck', 'false');

  let announceTimer;
  let debounceTimer;
  let latestTypedPhrase = '';
  let dispatchedPhrase = '';
  let latestResultCount = 0;
  let viewAllWrapper;
  let searchApi;
  let initializePromise;

  const announce = (message = '') => {
    if (announceTimer) {
      window.clearTimeout(announceTimer);
    }

    liveRegion.textContent = message;

    if (!message) {
      return;
    }

    announceTimer = window.setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  };

  const syncViewAllVisibility = () => {
    if (!viewAllWrapper) {
      return;
    }

    if (latestResultCount > 0) {
      viewAllWrapper.removeAttribute('hidden');
      return;
    }

    viewAllWrapper.setAttribute('hidden', '');
  };

  const closeResults = (message = '') => {
    resultsPanel.setAttribute('aria-busy', 'false');
    setOpenState(searchForm, resultsPanel, false);
    searchInput.setAttribute('aria-expanded', 'false');

    if (message) {
      announce(message);
    }
  };

  const ensureLiveSearch = async () => {
    if (searchApi) {
      return;
    }

    if (initializePromise) {
      await initializePromise;
      return;
    }

    initializePromise = (async () => {
      searchForm.dataset.searchStatus = 'loading';

      await import('../../scripts/initializers/search.js');

      const [
        { search },
        { render },
        { SearchResults },
        { events: searchEvents },
        labels,
      ] = await Promise.all([
        import('@dropins/storefront-product-discovery/api.js'),
        import('@dropins/storefront-product-discovery/render.js'),
        import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
        import('@dropins/tools/event-bus.js'),
        fetchPlaceholders().catch(() => ({})),
      ]);

      searchApi = search;

      const uiText = {
        noResults: labels.Global?.SearchNoResults || 'No results found',
        resultFound: labels.Global?.SearchResultFound || 'result found',
        resultsClosed: labels.Global?.SearchResultsClosed || 'Search results closed',
        resultsFound: labels.Global?.SearchResultsFound || 'results found',
        searchError: labels.Global?.SearchError || 'Search is temporarily unavailable',
        searchViewAll: labels.Global?.SearchViewAll || 'View all results',
      };

      render.render(SearchResults, {
        imageHeight: 112,
        imageWidth: 112,
        onSearchResult: (results) => {
          if (latestTypedPhrase !== dispatchedPhrase) {
            return;
          }

          latestResultCount = Array.isArray(results) ? results.length : 0;
          resultsPanel.setAttribute('aria-busy', 'false');
          setOpenState(searchForm, resultsPanel, true);
          searchInput.setAttribute('aria-expanded', 'true');
          syncViewAllVisibility();

          if (latestResultCount > 0) {
            announce(`${latestResultCount} ${latestResultCount === 1 ? uiText.resultFound : uiText.resultsFound}`);
            return;
          }

          announce(uiText.noResults);
        },
        routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
        scope: searchScope,
        skeletonCount: LIVE_SEARCH_PAGE_SIZE,
        slots: {
          Footer: (ctx) => {
            viewAllWrapper = document.createElement('div');
            viewAllWrapper.className = 'hdr-search-footer';

            const viewAllLink = document.createElement('a');
            viewAllLink.className = 'hdr-search-view-all';
            viewAllLink.href = rootLink(SEARCH_PATH);
            viewAllLink.textContent = uiText.searchViewAll;

            viewAllWrapper.append(viewAllLink);
            viewAllWrapper.setAttribute('hidden', '');
            ctx.appendChild(viewAllWrapper);

            ctx.onChange((next) => {
              viewAllLink.href = `${rootLink(SEARCH_PATH)}?q=${encodeURIComponent(next.variables?.phrase || '')}`;
            });

            syncViewAllVisibility();
          },
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
              params: {
                height: defaultImageProps.height,
                width: defaultImageProps.width,
              },
              wrapper: anchorWrapper,
            });
          },
        },
      })(resultsPanel);

      searchEvents.on('search/error', () => {
        if (!latestTypedPhrase || latestTypedPhrase.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
          return;
        }

        resultsPanel.setAttribute('aria-busy', 'false');
        setOpenState(searchForm, resultsPanel, true);
        searchInput.setAttribute('aria-expanded', 'true');
        latestResultCount = 0;
        syncViewAllVisibility();
        announce(uiText.searchError);
      }, { scope: searchScope });

      searchForm.dataset.searchStatus = 'ready';
    })().catch((error) => {
      searchForm.dataset.searchStatus = 'fallback';
      closeResults();
      // eslint-disable-next-line no-console
      console.error('mcx-header: live search unavailable. Falling back to submit-only mode.', error);
      throw error;
    });

    await initializePromise;
  };

  const scheduleSearch = async (rawPhrase) => {
    latestTypedPhrase = rawPhrase.trim();

    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    if (!latestTypedPhrase) {
      latestResultCount = 0;
      syncViewAllVisibility();
      if (searchApi) {
        searchApi(null, { scope: searchScope });
      }
      closeResults();
      return;
    }

    if (latestTypedPhrase.length < LIVE_SEARCH_MIN_QUERY_LENGTH) {
      closeResults();
      return;
    }

    try {
      await ensureLiveSearch();
    } catch {
      return;
    }

    debounceTimer = window.setTimeout(() => {
      if (!searchApi) {
        return;
      }

      dispatchedPhrase = latestTypedPhrase;
      latestResultCount = 0;
      syncViewAllVisibility();
      resultsPanel.setAttribute('aria-busy', 'true');
      setOpenState(searchForm, resultsPanel, true);
      searchInput.setAttribute('aria-expanded', 'true');

      searchApi({
        context: getSearchContext(),
        filter: [
          { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
        ],
        pageSize: LIVE_SEARCH_PAGE_SIZE,
        phrase: dispatchedPhrase,
      }, { scope: searchScope });
    }, LIVE_SEARCH_DEBOUNCE_MS);
  };

  searchForm.addEventListener('submit', () => {
    closeResults();
  });

  searchInput.addEventListener('input', (event) => {
    scheduleSearch(event.target.value || '');
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= LIVE_SEARCH_MIN_QUERY_LENGTH) {
      scheduleSearch(searchInput.value);
      return;
    }

    searchForm.classList.add('expanded');
  });

  searchInput.addEventListener('blur', () => {
    if (!searchForm.classList.contains('is-open')) {
      searchForm.classList.remove('expanded');
    }
  });

  document.addEventListener('click', (event) => {
    const targetSearchForm = event.target?.closest?.('.hdr-search');
    if (targetSearchForm === searchForm) {
      return;
    }

    closeResults();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !searchForm.classList.contains('is-open')) {
      return;
    }

    closeResults('Search results closed');
    searchInput.blur();
  });
}

function syncCartCount(cartCount, cartData) {
  if (!cartCount) {
    return;
  }

  const quantity = Number(cartData?.totalQuantity) || 0;

  if (quantity > 0) {
    cartCount.textContent = String(quantity);
    cartCount.removeAttribute('hidden');
    return;
  }

  cartCount.textContent = '';
  cartCount.setAttribute('hidden', '');
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/fragments/mcx-nav';

  let data = normalizeHeaderData(getDefaultData());
  try {
    const fragment = await fetchFragmentDocument(navPath);
    data = parseNavData(fragment);
  } catch (error) {
    // Fall back to the bundled MCX nav data when the authored fragment is unavailable.
  }

  const refs = buildHeaderDom(data);

  block.replaceChildren(refs.shell);
  refs.authMenu.sync();
  syncCartCount(refs.cartCount);

  bindMegaState(block);
  await enhanceLiveSearch(block);
  syncMegaOffsets(block);
  syncHeaderShellHeight(block);

  events.on('authenticated', (payload) => {
    const snapshot = getAuthSnapshot();
    refs.authMenu.sync(typeof payload === 'boolean'
      ? { ...snapshot, isAuthenticated: payload }
      : snapshot);
  }, { eager: true });

  events.on('cart/data', (cartData) => {
    syncCartCount(refs.cartCount, cartData);
  }, { eager: true });

  window.addEventListener('resize', () => syncMegaOffsets(block), { passive: true });
}
