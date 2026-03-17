import { events } from '@dropins/tools/event-bus.js';
import { readBlockConfig } from '../../scripts/aem.js';
import {
  checkIsAuthenticated,
  CUSTOMER_LOGIN_PATH,
  rootLink,
} from '../../scripts/commerce.js';

const ROUTE_CONTEXTS = [
  { match: '/customer/orders', label: 'Orders' },
  { match: '/customer/address', label: 'Addresses' },
  { match: '/customer/returns', label: 'Returns' },
  { match: '/customer/company/credit', label: 'Company Credit' },
  { match: '/customer/company/roles', label: 'Roles & Permissions' },
  { match: '/customer/company/users', label: 'Company Users' },
  { match: '/customer/company/structure', label: 'Company Structure' },
  { match: '/customer/company', label: 'Company Profile' },
  { match: '/customer/negotiable-quote-template', label: 'Quote Templates' },
  { match: '/customer/negotiable-quote', label: 'Quotes' },
  { match: '/customer/requisition-lists', label: 'Requisition Lists' },
  { match: '/customer/purchase-orders', label: 'Purchase Orders' },
  { match: '/customer/approval-rules', label: 'Approval Rules' },
  { match: '/customer/account', label: 'Account Hub' },
];

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (typeof text === 'string') element.textContent = text;
  return element;
}

function safeRequest(callback) {
  return callback().catch((error) => {
    console.warn('commerce-account-header: request failed', error);
    return null;
  });
}

function getRouteContext(pathname = window.location.pathname) {
  return ROUTE_CONTEXTS.find((route) => pathname.includes(route.match))?.label || 'Account';
}

function getCustomerName(customer) {
  if (!customer) return '';
  const firstName = customer.firstName || customer.firstname || '';
  const lastName = customer.lastName || customer.lastname || '';
  return `${firstName} ${lastName}`.trim();
}

function getCustomerInitials(name) {
  if (!name) return 'MC';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MC';
}

function formatCount(value, singular, plural = singular) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`;
}

function formatMoney(value, currency) {
  if (typeof value !== 'number' || Number.isNaN(value) || !currency) return '';

  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function buildMetrics(state) {
  const metrics = [];

  if (typeof state.orderCount === 'number') {
    metrics.push({
      label: 'Orders',
      value: formatCount(state.orderCount, 'order'),
      accent: 'primary',
    });
  }

  if (typeof state.addressCount === 'number') {
    metrics.push({
      label: 'Addresses',
      value: formatCount(state.addressCount, 'address'),
      accent: 'neutral',
    });
  }

  if (state.hasCompany && state.companyCreditEnabled) {
    const creditValue = formatMoney(state.creditAvailable, state.creditCurrency);
    if (creditValue) {
      metrics.push({
        label: 'Available Credit',
        value: creditValue,
        accent: 'gold',
      });
    }
  }

  if (metrics.length < 3 && state.hasCompany && typeof state.usersCount === 'number') {
    metrics.push({
      label: 'Company Users',
      value: formatCount(state.usersCount, 'user'),
      accent: 'neutral',
    });
  }

  if (metrics.length < 3 && state.hasCompany && typeof state.rolesCount === 'number') {
    metrics.push({
      label: 'Roles',
      value: formatCount(state.rolesCount, 'role'),
      accent: 'neutral',
    });
  }

  return metrics.slice(0, 3);
}

function renderGuest(block, config) {
  const shell = createElement('section', 'commerce-account-header-shell commerce-account-header-shell--guest');
  const eyebrowRow = createElement('div', 'commerce-account-header-shell__topbar');
  const eyebrow = createElement('span', 'commerce-account-header-shell__eyebrow', getRouteContext());
  const badge = createElement('span', 'commerce-account-header-shell__badge', 'Guest');
  eyebrowRow.append(eyebrow, badge);

  const content = createElement('div', 'commerce-account-header-shell__content');
  const copy = createElement('div', 'commerce-account-header-shell__copy');
  const title = createElement('h1', 'commerce-account-header-shell__title', config.title);
  const subtitle = createElement(
    'p',
    'commerce-account-header-shell__subtitle',
    'Sign in to see your live account and company overview.',
  );
  const cta = createElement('a', 'commerce-account-header-shell__cta', 'Sign in');
  cta.href = rootLink(CUSTOMER_LOGIN_PATH);

  copy.append(title, subtitle, cta);
  content.append(copy);
  shell.append(eyebrowRow, content);
  block.replaceChildren(shell);
}

function renderHero(block, config, state) {
  const shell = createElement('section', 'commerce-account-header-shell');
  const topbar = createElement('div', 'commerce-account-header-shell__topbar');
  const eyebrow = createElement('span', 'commerce-account-header-shell__eyebrow', state.routeLabel);
  let badgeText = 'Ready';
  if (state.hasError) {
    badgeText = 'Sync issue';
  } else if (state.isLoading) {
    badgeText = 'Live';
  }
  const badge = createElement(
    'span',
    `commerce-account-header-shell__badge${state.hasError ? ' commerce-account-header-shell__badge--error' : ''}`,
    badgeText,
  );

  topbar.append(eyebrow, badge);

  const content = createElement('div', 'commerce-account-header-shell__content');

  const identity = createElement('div', 'commerce-account-header-shell__identity');
  const avatar = createElement('div', 'commerce-account-header-shell__avatar', getCustomerInitials(state.customerName));
  const copy = createElement('div', 'commerce-account-header-shell__copy');
  const title = createElement('h1', 'commerce-account-header-shell__title', config.title);
  copy.append(title);

  if (state.customerName) {
    copy.append(createElement('p', 'commerce-account-header-shell__name', state.customerName));
  }

  const subtitleParts = [];
  if (state.hasCompany && state.companyName) {
    subtitleParts.push(state.companyName);
    subtitleParts.push('Company account');
  } else if (state.customerName) {
    subtitleParts.push('Individual account');
  }

  if (subtitleParts.length > 0) {
    copy.append(
      createElement(
        'p',
        'commerce-account-header-shell__subtitle',
        subtitleParts.join(' · '),
      ),
    );
  }

  identity.append(avatar, copy);
  content.append(identity);

  const metrics = buildMetrics(state);
  if (metrics.length > 0) {
    const stats = createElement('div', 'commerce-account-header-shell__stats');

    metrics.forEach((metric) => {
      const chip = createElement(
        'article',
        `commerce-account-header-shell__stat commerce-account-header-shell__stat--${metric.accent}`,
      );
      chip.append(
        createElement('span', 'commerce-account-header-shell__stat-label', metric.label),
        createElement('strong', 'commerce-account-header-shell__stat-value', metric.value),
      );
      stats.append(chip);
    });

    content.append(stats);
  }

  if (state.hasError) {
    content.append(
      createElement(
        'p',
        'commerce-account-header-shell__error',
        'Some account data could not be loaded. Refresh to try again.',
      ),
    );
  }

  shell.append(topbar, content);
  block.replaceChildren(shell);
}

function createInitialState() {
  return {
    routeLabel: getRouteContext(),
    customerName: '',
    companyName: '',
    orderCount: undefined,
    addressCount: undefined,
    usersCount: undefined,
    rolesCount: undefined,
    creditAvailable: undefined,
    creditCurrency: undefined,
    companyCreditEnabled: false,
    hasCompany: false,
    isLoading: true,
    hasError: false,
  };
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

    const state = createInitialState();
    renderHero(block, config, state);

    try {
      await Promise.all([
        import('../../scripts/initializers/auth.js'),
        import('../../scripts/initializers/account.js'),
        import('../../scripts/initializers/company.js'),
      ]);

      if (refreshToken !== currentToken) return;

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

      if (companyEnabled) {
        const companyData = await safeRequest(() => companyApi.getCompany());
        if (companyData?.name) {
          state.hasCompany = true;
          state.companyName = companyData.name;
        }
      }

      if (state.hasCompany) {
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
      }

      if (refreshToken !== currentToken) return;

      state.isLoading = false;
      renderHero(block, config, state);
    } catch (error) {
      console.error('commerce-account-header: refresh failed', error);
      if (refreshToken !== currentToken) return;

      state.isLoading = false;
      state.hasError = true;
      renderHero(block, config, state);
    }
  };
}

function cleanup(subscriptions, observer) {
  subscriptions.forEach((subscription) => subscription?.off?.());
  observer?.disconnect();
}

export default async function decorate(block) {
  const {
    title = 'My account',
  } = readBlockConfig(block);

  const refresh = createRefresh(block, { title });
  const subscriptions = [];

  subscriptions.push(events.on('authenticated', () => {
    refresh();
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
