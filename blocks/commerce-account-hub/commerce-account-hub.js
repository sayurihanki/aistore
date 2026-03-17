import { events } from '@dropins/tools/event-bus.js';
import { readBlockConfig } from '../../scripts/aem.js';
import {
  checkIsAuthenticated,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_ADDRESS_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_NEGOTIABLE_QUOTE_PATH,
  CUSTOMER_NEGOTIABLE_QUOTE_TEMPLATE_PATH,
  CUSTOMER_ORDERS_PATH,
  CUSTOMER_REQUISITION_LISTS_PATH,
  CUSTOMER_RETURNS_PATH,
  rootLink,
} from '../../scripts/commerce.js';

const CUSTOMER_COMPANY_PROFILE_PATH = '/customer/company';
const CUSTOMER_COMPANY_STRUCTURE_PATH = '/customer/company/structure';
const CUSTOMER_COMPANY_USERS_PATH = '/customer/company/users';
const CUSTOMER_COMPANY_ROLES_PATH = '/customer/company/roles';
const CUSTOMER_COMPANY_CREDIT_PATH = '/customer/company/credit';

const COMPANY_VIEW_PERMISSION_KEYS = ['Magento_Company::view'];
const COMPANY_USERS_PERMISSION_KEYS = ['Magento_Company::users_view'];
const COMPANY_ROLES_PERMISSION_KEYS = ['Magento_Company::roles_view'];
const COMPANY_CREDIT_PERMISSION_KEYS = ['Magento_CompanyCredit::view'];
const REQUISITION_PERMISSION_KEYS = [
  'Magento_RequisitionList::requisition_list',
  'Magento_RequisitionList::view',
];
const QUOTE_PERMISSION_KEYS = [
  'Magento_NegotiableQuote::all',
  'Magento_NegotiableQuote::view_quotes',
  'Magento_NegotiableQuote::manage',
];
const TEMPLATE_PERMISSION_KEYS = [
  'Magento_NegotiableQuoteTemplate::all',
  'Magento_NegotiableQuoteTemplate::view_template',
  'Magento_NegotiableQuoteTemplate::manage',
];

const MODULE_CARD_DEFINITIONS = [
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Manage company settings and buyers',
    href: CUSTOMER_COMPANY_PROFILE_PATH,
    permissionKeys: COMPANY_VIEW_PERMISSION_KEYS,
    tone: 'primary',
  },
  {
    id: 'company-structure',
    title: 'Company Structure',
    description: 'Review departments and reporting lines',
    href: CUSTOMER_COMPANY_STRUCTURE_PATH,
    permissionKeys: COMPANY_VIEW_PERMISSION_KEYS,
    tone: 'neutral',
  },
  {
    id: 'company-users',
    title: 'Company Users',
    description: 'Invite, edit, and manage company users',
    href: CUSTOMER_COMPANY_USERS_PATH,
    permissionKeys: COMPANY_USERS_PERMISSION_KEYS,
    countKey: 'usersCount',
    tone: 'primary',
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    description: 'Control approver and buyer access',
    href: CUSTOMER_COMPANY_ROLES_PATH,
    permissionKeys: COMPANY_ROLES_PERMISSION_KEYS,
    countKey: 'rolesCount',
    tone: 'neutral',
  },
  {
    id: 'credit',
    title: 'Company Credit',
    description: 'View available credit and account status',
    href: CUSTOMER_COMPANY_CREDIT_PATH,
    permissionKeys: COMPANY_CREDIT_PERMISSION_KEYS,
    countKey: 'creditAvailable',
    tone: 'gold',
  },
  {
    id: 'quotes',
    title: 'Quotes',
    description: 'Review active negotiable quotes',
    href: CUSTOMER_NEGOTIABLE_QUOTE_PATH,
    permissionKeys: QUOTE_PERMISSION_KEYS,
    countKey: 'quoteCount',
    tone: 'primary',
  },
  {
    id: 'quote-templates',
    title: 'Quote Templates',
    description: 'Reuse template-based quote requests',
    href: CUSTOMER_NEGOTIABLE_QUOTE_TEMPLATE_PATH,
    permissionKeys: TEMPLATE_PERMISSION_KEYS,
    countKey: 'templateCount',
    tone: 'neutral',
  },
  {
    id: 'requisition-lists',
    title: 'Requisition Lists',
    description: 'Stage repeat buys for faster ordering',
    href: CUSTOMER_REQUISITION_LISTS_PATH,
    permissionKeys: REQUISITION_PERMISSION_KEYS,
    countKey: 'requisitionCount',
    tone: 'gold',
  },
];

const DEFAULT_CONFIG = {
  title: 'My Account Hub',
  rowsLimit: 3,
  showOrders: true,
  showAddresses: true,
  showModuleCards: false,
  guestCtaLabel: 'Sign in',
  guestCtaHref: CUSTOMER_LOGIN_PATH,
};

const MIN_ROWS = 1;
const MAX_ROWS = 5;
const FALLBACK_TEXT = 'Not available';
const LOADING_TEXT = 'Loading...';

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(MIN_ROWS, Math.min(MAX_ROWS, parsed));
}

function getConfig(block) {
  const config = readBlockConfig(block);

  return {
    title: config.title?.trim() || DEFAULT_CONFIG.title,
    rowsLimit: parseInteger(config['rows-limit'], DEFAULT_CONFIG.rowsLimit),
    showOrders: parseBoolean(config['show-orders'], DEFAULT_CONFIG.showOrders),
    showAddresses: parseBoolean(config['show-addresses'], DEFAULT_CONFIG.showAddresses),
    showModuleCards: parseBoolean(config['show-module-cards'], DEFAULT_CONFIG.showModuleCards),
    guestCtaLabel: config['guest-cta-label']?.trim() || DEFAULT_CONFIG.guestCtaLabel,
    guestCtaHref: config['guest-cta-href']?.trim() || DEFAULT_CONFIG.guestCtaHref,
  };
}

function resolveHref(href) {
  if (!href) return rootLink(CUSTOMER_ACCOUNT_PATH);
  if (href.startsWith('/')) return rootLink(href);
  return href;
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (typeof text === 'string') element.textContent = text;
  return element;
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

function isExplicitlyDisabled(permissions, keys) {
  return keys.some((key) => permissions[key] === false);
}

function isPermissionGranted(permissions, keys) {
  if (keys.length === 0 || keys.includes('all')) return true;
  if (permissions.admin || permissions.all) return true;
  return keys.some((key) => permissions[key] === true);
}

function canUsePermissionSet(permissions, keys) {
  if (isExplicitlyDisabled(permissions, keys)) return false;
  return isPermissionGranted(permissions, keys);
}

function getPermissionsSnapshot() {
  const snapshot = events.lastPayload('auth/permissions');
  if (!snapshot || typeof snapshot !== 'object') return {};
  return snapshot;
}

function formatCount(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return FALLBACK_TEXT;
  return value.toLocaleString('en-US');
}

function formatMoney(value, currency) {
  if (typeof value !== 'number' || Number.isNaN(value) || !currency) return FALLBACK_TEXT;

  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function getCustomerName(customer) {
  if (!customer) return 'Customer';
  const firstName = customer.firstName || customer.firstname || '';
  const lastName = customer.lastName || customer.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Customer';
}

function createInitialState(config) {
  return {
    config,
    permissions: {},
    customerName: 'Customer',
    companyName: '',
    orderCount: undefined,
    addressCount: undefined,
    usersCount: undefined,
    rolesCount: undefined,
    creditAvailable: undefined,
    creditCurrency: undefined,
    quoteCount: undefined,
    templateCount: undefined,
    requisitionCount: undefined,
    companyEnabled: false,
    hasCompany: false,
    companyCreditEnabled: false,
    quoteEnabled: false,
    quoteTemplateEnabled: false,
    requisitionEnabled: false,
    isLoadingCritical: true,
    isLoadingTier2: false,
    isLoadingTier3: false,
    hasError: false,
  };
}

function loadingValue({ loading, value }) {
  if (loading) return LOADING_TEXT;
  if (value === undefined || value === null || value === '') return FALLBACK_TEXT;
  return value;
}

function createTopbar(badgeText, badgeTone = 'ready') {
  const topbar = createElement('div', 'commerce-account-hub__topbar');
  const eyebrow = createElement('span', 'commerce-account-hub__eyebrow', 'Account dashboard');
  const badge = createElement(
    'span',
    `commerce-account-hub__badge commerce-account-hub__badge--${badgeTone}`,
    badgeText,
  );

  topbar.append(eyebrow, badge);
  return topbar;
}

function createSectionHeader(titleText, subtitleText) {
  const header = createElement('div', 'commerce-account-hub__section-header');
  const title = createElement('h3', 'commerce-account-hub__section-title', titleText);
  header.append(title);

  if (subtitleText) {
    header.append(createElement('p', 'commerce-account-hub__section-copy', subtitleText));
  }

  return header;
}

function buildSummaryCards(state) {
  const cards = [];

  if (state.config.showOrders) {
    cards.push({
      label: 'Orders',
      value: loadingValue({
        loading: state.isLoadingCritical,
        value: formatCount(state.orderCount),
      }),
      detail: 'Recent orders on file',
      tone: 'primary',
    });
  }

  if (state.config.showAddresses) {
    cards.push({
      label: 'Addresses',
      value: loadingValue({
        loading: state.isLoadingCritical,
        value: formatCount(state.addressCount),
      }),
      detail: 'Saved shipping and billing locations',
      tone: 'neutral',
    });
  }

  if (state.hasCompany && state.companyCreditEnabled) {
    cards.push({
      label: 'Available Credit',
      value: loadingValue({
        loading: state.isLoadingTier2,
        value: formatMoney(state.creditAvailable, state.creditCurrency),
      }),
      detail: 'Current company credit available to spend',
      tone: 'gold',
    });
  }

  if (state.hasCompany) {
    cards.push({
      label: 'Company Users',
      value: loadingValue({
        loading: state.isLoadingTier2,
        value: formatCount(state.usersCount),
      }),
      detail: 'Users tied to this company account',
      tone: 'primary',
    });
  }

  if (state.hasCompany && cards.length < 4) {
    cards.push({
      label: 'Roles',
      value: loadingValue({
        loading: state.isLoadingTier2,
        value: formatCount(state.rolesCount),
      }),
      detail: 'Permission roles available today',
      tone: 'neutral',
    });
  }

  return cards.slice(0, 4);
}

function createSummaryCard(card) {
  const summary = createElement(
    'article',
    `commerce-account-hub__summary commerce-account-hub__summary--${card.tone || 'neutral'}`,
  );
  summary.append(
    createElement('span', 'commerce-account-hub__summary-label', card.label),
    createElement('strong', 'commerce-account-hub__summary-value', card.value),
    createElement('p', 'commerce-account-hub__summary-copy', card.detail),
  );
  return summary;
}

function buildQuickActions(state) {
  const actions = [];

  actions.push({
    title: 'Orders',
    description: 'Track shipments, reorder, and review invoices.',
    href: CUSTOMER_ORDERS_PATH,
    meta: loadingValue({
      loading: state.isLoadingCritical,
      value: typeof state.orderCount === 'number' ? `${formatCount(state.orderCount)} on file` : '',
    }),
    tone: 'primary',
    visible: state.config.showOrders,
  });

  actions.push({
    title: 'Addresses',
    description: 'Update shipping, billing, and default locations.',
    href: CUSTOMER_ADDRESS_PATH,
    meta: loadingValue({
      loading: state.isLoadingCritical,
      value: typeof state.addressCount === 'number' ? `${formatCount(state.addressCount)} saved` : '',
    }),
    tone: 'neutral',
    visible: state.config.showAddresses,
  });

  actions.push({
    title: 'Returns',
    description: 'Review return requests and start new ones.',
    href: CUSTOMER_RETURNS_PATH,
    meta: 'Customer support and return status',
    tone: 'neutral',
    visible: true,
  });

  actions.push({
    title: 'Account Details',
    description: 'Manage your profile, credentials, and preferences.',
    href: CUSTOMER_ACCOUNT_PATH,
    meta: state.hasCompany ? 'Company-aware account access' : 'Personal account access',
    tone: 'gold',
    visible: true,
  });

  if (state.hasCompany && canUsePermissionSet(state.permissions, COMPANY_VIEW_PERMISSION_KEYS)) {
    actions.push({
      title: 'Company Profile',
      description: 'Review company settings, contacts, and policies.',
      href: CUSTOMER_COMPANY_PROFILE_PATH,
      meta: state.companyName || 'Company management',
      tone: 'primary',
      visible: true,
    });
  }

  return actions.filter((action) => action.visible);
}

function createQuickAction(action) {
  const link = createElement(
    'a',
    `commerce-account-hub__action commerce-account-hub__action--${action.tone || 'neutral'}`,
  );
  link.href = resolveHref(action.href);

  const eyebrow = createElement('span', 'commerce-account-hub__action-eyebrow', action.meta);
  const title = createElement('span', 'commerce-account-hub__action-title', action.title);
  const description = createElement(
    'span',
    'commerce-account-hub__action-description',
    action.description,
  );
  const arrow = createElement('span', 'commerce-account-hub__action-arrow', 'Explore');

  link.append(eyebrow, title, description, arrow);
  return link;
}

function buildModuleCards(state) {
  if (!state.config.showModuleCards || !state.hasCompany) return [];

  const filteredCards = MODULE_CARD_DEFINITIONS.filter((card) => {
    if (!canUsePermissionSet(state.permissions, card.permissionKeys || [])) {
      return false;
    }

    if (card.id === 'credit') return state.companyCreditEnabled;
    if (card.id === 'quotes') return state.quoteEnabled;
    if (card.id === 'quote-templates') return state.quoteTemplateEnabled;
    if (card.id === 'requisition-lists') return state.requisitionEnabled;
    return true;
  });

  const maxRows = parseInteger(state.config.rowsLimit, DEFAULT_CONFIG.rowsLimit);
  return filteredCards.slice(0, maxRows * 2);
}

function getModuleCardValue(state, card) {
  if (!card.countKey) {
    return state.companyName || 'Open workspace';
  }

  if (card.countKey === 'creditAvailable') {
    return loadingValue({
      loading: state.isLoadingTier2,
      value: formatMoney(state.creditAvailable, state.creditCurrency),
    });
  }

  const isTier3Metric = ['quoteCount', 'templateCount', 'requisitionCount'].includes(card.countKey);
  return loadingValue({
    loading: isTier3Metric ? state.isLoadingTier3 : state.isLoadingTier2,
    value: formatCount(state[card.countKey]),
  });
}

function createModuleCard(state, card) {
  const link = createElement(
    'a',
    `commerce-account-hub__module commerce-account-hub__module--${card.tone || 'neutral'}`,
  );
  link.href = resolveHref(card.href);
  link.append(
    createElement('span', 'commerce-account-hub__module-title', card.title),
    createElement('span', 'commerce-account-hub__module-description', card.description),
    createElement('span', 'commerce-account-hub__module-value', getModuleCardValue(state, card)),
  );
  return link;
}

function renderGuest(block, config) {
  const shell = createElement(
    'section',
    'commerce-account-hub-shell commerce-account-hub-shell--guest',
  );

  shell.append(createTopbar('Guest', 'neutral'));

  const intro = createElement('div', 'commerce-account-hub__intro');
  const copy = createElement('div', 'commerce-account-hub__intro-copy');
  copy.append(
    createElement('h2', 'commerce-account-hub__title', config.title),
    createElement(
      'p',
      'commerce-account-hub__subtitle',
      'Sign in to load your live orders, saved addresses, and any company tools tied to your account.',
    ),
  );

  const cta = createElement('a', 'commerce-account-hub__cta', config.guestCtaLabel);
  cta.href = resolveHref(config.guestCtaHref);

  intro.append(copy, cta);
  shell.append(intro);
  block.replaceChildren(shell);
}

function renderAuthenticated(block, state) {
  const shell = createElement('section', 'commerce-account-hub-shell commerce-account-hub-shell--auth');

  let badgeText = 'Ready';
  let badgeTone = 'ready';
  if (state.hasError) {
    badgeText = 'Sync issue';
    badgeTone = 'error';
  } else if (state.isLoadingCritical || state.isLoadingTier2 || state.isLoadingTier3) {
    badgeText = 'Loading';
    badgeTone = 'neutral';
  }

  shell.append(createTopbar(badgeText, badgeTone));

  const intro = createElement('div', 'commerce-account-hub__intro');
  const copy = createElement('div', 'commerce-account-hub__intro-copy');
  const subtitleText = state.hasCompany
    ? `${state.customerName} · ${state.companyName}`
    : `${state.customerName} · Individual account`;

  copy.append(
    createElement('h2', 'commerce-account-hub__title', state.config.title),
    createElement('p', 'commerce-account-hub__subtitle', subtitleText),
  );
  intro.append(copy);
  shell.append(intro);

  const summaryCards = buildSummaryCards(state);
  if (summaryCards.length > 0) {
    const summarySection = createElement('section', 'commerce-account-hub__section');
    summarySection.append(
      createSectionHeader('Snapshot', 'Live metrics from your current account context.'),
    );

    const summaryGrid = createElement('div', 'commerce-account-hub__summary-grid');
    summaryCards.forEach((card) => summaryGrid.append(createSummaryCard(card)));
    summarySection.append(summaryGrid);
    shell.append(summarySection);
  }

  const actions = buildQuickActions(state);
  if (actions.length > 0) {
    const actionsSection = createElement('section', 'commerce-account-hub__section');
    actionsSection.append(
      createSectionHeader('Quick Actions', 'Jump to the pages customers use most.'),
    );

    const actionsGrid = createElement('div', 'commerce-account-hub__actions');
    actions.forEach((action) => actionsGrid.append(createQuickAction(action)));
    actionsSection.append(actionsGrid);
    shell.append(actionsSection);
  }

  const moduleCards = buildModuleCards(state);
  if (moduleCards.length > 0) {
    const modulesSection = createElement('section', 'commerce-account-hub__section');
    modulesSection.append(
      createSectionHeader('Company Workspace', 'Live B2B modules available to this account.'),
    );

    const modulesGrid = createElement('div', 'commerce-account-hub__modules');
    moduleCards.forEach((card) => modulesGrid.append(createModuleCard(state, card)));
    modulesSection.append(modulesGrid);
    shell.append(modulesSection);
  }

  if (state.hasError) {
    shell.append(
      createElement(
        'p',
        'commerce-account-hub__error',
        'Some live account data could not be loaded. Refresh the page to try again.',
      ),
    );
  }

  block.replaceChildren(shell);
}

async function safeRequest(callback) {
  try {
    return await callback();
  } catch (error) {
    console.warn('commerce-account-hub: request failed', error);
    return null;
  }
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function isRequisitionListEnabled(storeConfig) {
  if (!storeConfig || typeof storeConfig !== 'object') return false;

  const listEnabled = isTruthyFlag(storeConfig.is_requisition_list_active);
  const companyEnabled = storeConfig.company_enabled === undefined
    ? true
    : isTruthyFlag(storeConfig.company_enabled);

  return listEnabled && companyEnabled;
}

function createRefresh(block, config) {
  let refreshToken = 0;

  return async () => {
    const currentToken = refreshToken + 1;
    refreshToken = currentToken;

    if (!checkIsAuthenticated()) {
      renderGuest(block, config);
      return;
    }

    const state = createInitialState(config);
    state.permissions = getPermissionsSnapshot();
    renderAuthenticated(block, state);

    try {
      await Promise.all([
        import('../../scripts/initializers/auth.js'),
        import('../../scripts/initializers/account.js'),
        import('../../scripts/initializers/company.js'),
      ]);

      if (refreshToken !== currentToken) return;
      if (!checkIsAuthenticated()) {
        renderGuest(block, config);
        return;
      }

      const [accountApi, companyApi] = await Promise.all([
        import('@dropins/storefront-account/api.js'),
        import('@dropins/storefront-company-management/api.js'),
      ]);

      const [customer, orderHistory, addresses, companyEnabled] = await Promise.all([
        safeRequest(() => accountApi.getCustomer()),
        safeRequest(() => accountApi.getOrderHistoryList(1, 'viewAll', 1)),
        safeRequest(() => accountApi.getCustomerAddress()),
        safeRequest(() => companyApi.companyEnabled()),
      ]);

      if (refreshToken !== currentToken) return;

      state.customerName = getCustomerName(customer);
      state.orderCount = orderHistory?.totalCount;
      state.addressCount = Array.isArray(addresses) ? addresses.length : undefined;
      state.companyEnabled = Boolean(companyEnabled);

      if (state.companyEnabled) {
        const companyData = await safeRequest(() => companyApi.getCompany());
        if (companyData && typeof companyData === 'object') {
          state.hasCompany = true;
          state.companyName = companyData.name || '';
        }
      }

      state.permissions = getPermissionsSnapshot();
      state.quoteEnabled = canUsePermissionSet(state.permissions, QUOTE_PERMISSION_KEYS);
      state.quoteTemplateEnabled = canUsePermissionSet(state.permissions, TEMPLATE_PERMISSION_KEYS);
      state.isLoadingCritical = false;
      state.isLoadingTier2 = state.hasCompany;
      state.isLoadingTier3 = state.hasCompany && state.config.showModuleCards;
      renderAuthenticated(block, state);

      if (!state.hasCompany) {
        state.isLoadingTier2 = false;
        state.isLoadingTier3 = false;
        renderAuthenticated(block, state);
        return;
      }

      await waitForNextPaint();
      if (refreshToken !== currentToken) return;

      const [usersResponse, rolesResponse, creditEnabled] = await Promise.all([
        safeRequest(() => companyApi.getCompanyUsers({ pageSize: 1, currentPage: 1 })),
        safeRequest(() => companyApi.getCompanyRoles({ pageSize: 1, currentPage: 1 })),
        safeRequest(() => companyApi.checkCompanyCreditEnabled()),
      ]);

      if (refreshToken !== currentToken) return;

      state.usersCount = usersResponse?.totalCount;
      state.rolesCount = rolesResponse?.totalCount;
      state.companyCreditEnabled = creditEnabled?.creditEnabled === true;

      if (state.companyCreditEnabled) {
        const companyCredit = await safeRequest(() => companyApi.getCompanyCredit());
        const availableCredit = companyCredit?.credit?.available_credit;
        state.creditAvailable = availableCredit?.value;
        state.creditCurrency = availableCredit?.currency;
      }

      state.isLoadingTier2 = false;
      renderAuthenticated(block, state);

      if (!state.config.showModuleCards) {
        state.isLoadingTier3 = false;
        renderAuthenticated(block, state);
        return;
      }

      await waitForNextPaint();
      if (refreshToken !== currentToken) return;

      if (state.quoteEnabled || state.quoteTemplateEnabled) {
        await import('../../scripts/initializers/quote-management.js');
        const quoteApi = await import('@dropins/storefront-quote-management/api.js');
        const quoteRequests = [];

        if (state.quoteEnabled) {
          quoteRequests.push(
            safeRequest(() => quoteApi.negotiableQuotes({ pageSize: 1, currentPage: 1 }))
              .then((result) => {
                state.quoteCount = result?.totalCount;
              }),
          );
        }

        if (state.quoteTemplateEnabled) {
          quoteRequests.push(
            safeRequest(() => quoteApi.getQuoteTemplates({ pageSize: 1, currentPage: 1 }))
              .then((result) => {
                state.templateCount = result?.totalCount;
              }),
          );
        }

        await Promise.all(quoteRequests);
      }

      if (canUsePermissionSet(state.permissions, REQUISITION_PERMISSION_KEYS)) {
        await import('../../scripts/initializers/requisition-list.js');
        const requisitionApi = await import('@dropins/storefront-requisition-list/api.js');
        const requisitionStoreConfig = await safeRequest(() => requisitionApi.getStoreConfig());

        state.requisitionEnabled = isRequisitionListEnabled(requisitionStoreConfig);
        if (state.requisitionEnabled) {
          const requisitionLists = await safeRequest(
            () => requisitionApi.getRequisitionLists(1, 1),
          );
          if (Array.isArray(requisitionLists)) {
            state.requisitionCount = requisitionLists.length;
          }
        }
      }

      if (refreshToken !== currentToken) return;

      state.isLoadingTier3 = false;
      renderAuthenticated(block, state);
    } catch (error) {
      console.error('commerce-account-hub: staged refresh failed', error);
      if (refreshToken !== currentToken) return;

      state.hasError = true;
      state.isLoadingCritical = false;
      state.isLoadingTier2 = false;
      state.isLoadingTier3 = false;
      renderAuthenticated(block, state);
    }
  };
}

function cleanup(subscriptions, observer) {
  subscriptions.forEach((subscription) => {
    subscription?.off?.();
  });

  observer?.disconnect();
}

export default async function decorate(block) {
  const config = getConfig(block);
  const refresh = createRefresh(block, config);
  const subscriptions = [];

  subscriptions.push(events.on('authenticated', () => {
    refresh();
  }, { eager: true }));

  subscriptions.push(events.on('auth/permissions', () => {
    if (checkIsAuthenticated()) refresh();
  }, { eager: true }));

  subscriptions.push(events.on('companyContext/changed', () => {
    if (checkIsAuthenticated()) refresh();
  }, { eager: true }));

  await refresh();

  let disposed = false;
  const observer = new MutationObserver(() => {
    if (disposed) return;

    if (!document.body.contains(block)) {
      disposed = true;
      cleanup(subscriptions, observer);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
