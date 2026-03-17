import { events } from '@dropins/tools/event-bus.js';
import { render as pdpRender } from '@dropins/storefront-pdp/render.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import {
  addProductsToCart,
} from '@dropins/storefront-cart/api.js';
import {
  isProductConfigurationValid,
  setProductConfigurationValues,
} from '@dropins/storefront-pdp/api.js';

import { readBlockConfig } from '../../scripts/aem.js';
import { rootLink } from '../../scripts/commerce.js';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SCHEMA_URL,
  applyImportProfile,
  createInitialState,
  getAwardById,
  getAwardsPage,
  getCategoryOptions,
  getDeviceById,
  getEnabledBranches,
  getEntryById,
  getRackItemsExpanded,
  getRackRows,
  getRackTitle,
  normalizeDataset,
  removeRackItem,
  sanitizeRackName,
  serializeBuilderPayload,
  upsertRackItem,
} from './ez-rack-builder.lib.js';
import {
  buildAddonCartItems,
  createEzRackBuilderCartItem,
  validateCommerceProductContract,
} from './ez-rack-builder.commerce.js';

const DEFAULT_CONFIG = {
  sku: '',
  schemaUrl: DEFAULT_SCHEMA_URL,
  eyebrowText: 'Marine Corps Awards Division',
  title: 'Luxury EZ Rack Builder',
  subtitle: 'Assemble your regulation-aware ribbon rack in a ceremonial configuration studio.',
  primaryCtaLabel: 'Add configured rack to cart',
  secondaryCtaLabel: 'Talk to a specialist',
  secondaryCtaHref: '/contact',
  theme: 'scarlet-gold',
  presentation: 'rack-immersive',
  dd214Mode: 'smart-stub',
};

const STEPS = [
  {
    id: 'welcome',
    label: 'Welcome',
    title: 'Welcome to the EZ Rack Builder',
    description: 'Build your rack with a regulation-aware luxury flow that keeps precedence, presentation, and purchase in sync.',
  },
  {
    id: 'branch',
    label: 'Service',
    title: 'Select Service Profile',
    description: 'Choose the branch ruleset that defines precedence, available awards, and builder context.',
  },
  {
    id: 'rack-type',
    label: 'Rack Type',
    title: 'Select Rack Type',
    description: 'Pick the format you want the builder to shape and preview in real time.',
  },
  {
    id: 'options',
    label: 'Options',
    title: 'Refine Rack Options',
    description: 'Tune spacing, alignment, and assembly without leaving the immersive studio.',
  },
  {
    id: 'awards',
    label: 'Awards',
    title: 'Select Awards and Devices',
    description: 'Search, filter, import, and configure awards while the rack reorders itself by precedence.',
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Review and Add to Cart',
    description: 'Confirm the full configuration, optional rack name, and final payload before checkout.',
  },
];

const FAMILY_BUILDERS = [
  {
    id: 'ez-rack',
    labelTop: 'EZ Rack',
    labelBottom: 'Builder',
    active: true,
    href: '',
  },
  {
    id: 'shadow-box',
    labelTop: 'Shadow Box',
    labelBottom: 'Builder',
    active: false,
    href: '',
  },
  {
    id: 'leather-tag',
    labelTop: 'Leather Tag',
    labelBottom: 'Builder',
    active: false,
    href: '',
  },
  {
    id: 'name-tag',
    labelTop: 'Name Tag',
    labelBottom: 'Builder',
    active: false,
    href: '',
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeText(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = normalizeText(value, fallback).toLowerCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function resolveHref(href) {
  if (!href) return rootLink(DEFAULT_CONFIG.secondaryCtaHref);
  if (href.startsWith('/')) return rootLink(href);
  return href;
}

function resolveSchemaUrl(schemaUrl) {
  if (!schemaUrl) return rootLink(DEFAULT_SCHEMA_URL);
  if (schemaUrl.startsWith('http://') || schemaUrl.startsWith('https://')) return schemaUrl;
  if (schemaUrl.startsWith('/')) return rootLink(schemaUrl);
  return rootLink(`/${schemaUrl.replace(/^\/+/, '')}`);
}

async function loadSchema(schemaUrl) {
  const response = await fetch(resolveSchemaUrl(schemaUrl));
  if (!response.ok) {
    throw new Error(`EZ Rack Builder schema request failed (${response.status}).`);
  }
  return normalizeDataset(await response.json());
}

async function waitForProductData() {
  const current = events.lastPayload('pdp/data');
  if (current) return current;

  return new Promise((resolve, reject) => {
    let subscription;
    const timer = window.setTimeout(() => {
      subscription?.off?.();
      reject(new Error('Product data was not available on this page.'));
    }, 5000);

    subscription = events.on('pdp/data', (payload) => {
      window.clearTimeout(timer);
      subscription?.off?.();
      resolve(payload);
    });
  });
}

function createElement(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function renderLoading(block) {
  block.innerHTML = `
    <div class="ez-rack-builder__loading">
      <span class="ez-rack-builder__loading-pill">Loading EZ Rack Builder</span>
      <strong>Preparing the ceremonial studio.</strong>
      <p>Fetching Commerce options, branch data, and the live rack engine.</p>
    </div>
  `;
}

function renderFailure(block, message, modifier = 'error') {
  block.innerHTML = `
    <div class="ez-rack-builder__fallback ez-rack-builder__fallback--${modifier}" role="status">
      <span class="ez-rack-builder__loading-pill">EZ Rack Builder unavailable</span>
      <strong>${escapeHtml(message)}</strong>
      <p>The standard product details remain available on this page.</p>
    </div>
  `;
}

function pushAnalyticsEvent(eventName, payload = {}) {
  const eventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (window.adobeDataLayer && typeof window.adobeDataLayer.push === 'function') {
    window.adobeDataLayer.push({
      event: eventName,
      eventInfo: eventPayload,
    });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...eventPayload,
    });
  }
}

function buildShell(block, config) {
  const shell = createElement('section', 'ez-rack-builder__shell');
  shell.dataset.theme = config.theme;
  shell.dataset.presentation = config.presentation;
  shell.dataset.summaryOpen = 'false';
  shell.innerHTML = `
    <div class="ez-rack-builder__family" aria-label="Builder family"></div>
    <div class="ez-rack-builder__progress" aria-label="Builder progress"></div>
    <div class="ez-rack-builder__status" role="status" aria-live="polite" hidden></div>
    <div class="ez-rack-builder__layout">
      <div class="ez-rack-builder__main">
        <div class="ez-rack-builder__content"></div>
      </div>
      <aside class="ez-rack-builder__aside">
        <div class="ez-rack-builder__summary">
          <button class="ez-rack-builder__summary-toggle" type="button" data-action="toggle-summary" aria-expanded="false">
            <span>My Rack</span>
            <span class="ez-rack-builder__summary-toggle-icon">+</span>
          </button>
          <div class="ez-rack-builder__summary-inner">
            <div class="ez-rack-builder__summary-top">
              <span class="ez-rack-builder__summary-kicker">Live rack preview</span>
              <h3 class="ez-rack-builder__summary-title">EZ Rack Builder</h3>
              <p class="ez-rack-builder__summary-subtitle">Select a rack type and begin adding awards.</p>
            </div>
            <div class="ez-rack-builder__price"></div>
            <div class="ez-rack-builder__preview"></div>
            <div class="ez-rack-builder__summary-meta"></div>
            <div class="ez-rack-builder__summary-actions"></div>
            <div class="ez-rack-builder__list"></div>
          </div>
        </div>
      </aside>
    </div>
    <div class="ez-rack-builder__overlay" hidden></div>
  `;

  block.replaceChildren(shell);

  return {
    shell,
    family: shell.querySelector('.ez-rack-builder__family'),
    progress: shell.querySelector('.ez-rack-builder__progress'),
    status: shell.querySelector('.ez-rack-builder__status'),
    content: shell.querySelector('.ez-rack-builder__content'),
    summary: shell.querySelector('.ez-rack-builder__summary'),
    summaryToggle: shell.querySelector('.ez-rack-builder__summary-toggle'),
    summaryTitle: shell.querySelector('.ez-rack-builder__summary-title'),
    summarySubtitle: shell.querySelector('.ez-rack-builder__summary-subtitle'),
    price: shell.querySelector('.ez-rack-builder__price'),
    preview: shell.querySelector('.ez-rack-builder__preview'),
    meta: shell.querySelector('.ez-rack-builder__summary-meta'),
    actions: shell.querySelector('.ez-rack-builder__summary-actions'),
    list: shell.querySelector('.ez-rack-builder__list'),
    overlay: shell.querySelector('.ez-rack-builder__overlay'),
  };
}

function renderFamilyRail(refs) {
  refs.family.innerHTML = FAMILY_BUILDERS.map((builder) => {
    if (builder.href) {
      return `
        <a class="ez-rack-builder__family-item${builder.active ? ' is-active' : ''}" href="${escapeHtml(builder.href)}">
          <span>${escapeHtml(builder.labelTop)}</span>
          <small>${escapeHtml(builder.labelBottom)}</small>
        </a>
      `;
    }

    const disabledAttr = builder.active ? '' : ' disabled';
    return `
      <button class="ez-rack-builder__family-item${builder.active ? ' is-active' : ''}" type="button"${disabledAttr}>
        <span>${escapeHtml(builder.labelTop)}</span>
        <small>${escapeHtml(builder.labelBottom)}</small>
      </button>
    `;
  }).join('');
}

function renderStatus(runtime) {
  const { message, type } = runtime.state.status;
  runtime.refs.status.hidden = !message;
  runtime.refs.status.dataset.type = type || 'info';
  runtime.refs.status.textContent = message || '';
}

function setStatus(runtime, message = '', type = 'info') {
  runtime.state.status = {
    message,
    type,
  };
  renderStatus(runtime);
}

function getCurrentStep(runtime) {
  return STEPS[runtime.state.stepIndex] || STEPS[0];
}

function renderProgress(runtime) {
  runtime.refs.progress.innerHTML = `
    <div class="ez-rack-builder__progress-track">
      ${STEPS.map((step, index) => {
    let stateClass = '';
    if (index === runtime.state.stepIndex) {
      stateClass = ' is-active';
    } else if (index < runtime.state.stepIndex) {
      stateClass = ' is-complete';
    }
    return `
          <div class="ez-rack-builder__progress-item${stateClass}">
            <span class="ez-rack-builder__progress-index">${index + 1}</span>
            <span class="ez-rack-builder__progress-copy">
              <strong>${escapeHtml(step.label)}</strong>
              <small>${escapeHtml(step.title)}</small>
            </span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function getPreviewConfig(data, state) {
  return getEntryById(data.rackTypes, state.rackTypeId)?.preview || data.rackTypes[0]?.preview || {
    kind: 'ribbons',
    ribbonHeight: 18,
    ribbonWidth: 68,
    rowOffset: 0,
  };
}

function renderPreviewRows(data, state, { hero = false } = {}) {
  const preview = getPreviewConfig(data, state);
  const width = data.width || 3;
  const expandedItems = getRackItemsExpanded(data, state.rackItems);
  let fallbackItems = expandedItems;
  if (!fallbackItems.length && hero) {
    fallbackItems = data.awards.slice(0, 9).map((award) => ({
      award,
      devices: {},
      deviceSummary: '',
    }));
  }
  const rows = [];

  for (let index = 0; index < fallbackItems.length; index += width) {
    rows.push(fallbackItems.slice(index, index + width));
  }

  if (!rows.length) {
    return `
      <div class="ez-rack-builder__preview-empty">
        <strong>No awards in rack yet</strong>
        <p>Search and add awards to see the rack assemble itself.</p>
      </div>
    `;
  }

  const gap = state.options.spacing === 'padded' ? 8 : 3;
  const justify = state.options.alignment === 'right' ? 'flex-end' : 'center';

  return `
    <div class="ez-rack-builder__rack-rows${hero ? ' is-hero' : ''}" data-kind="${escapeHtml(preview.kind)}">
      ${rows.map((row) => `
        <div class="ez-rack-builder__rack-row" style="justify-content:${justify};gap:${gap}px">
          ${row.map(({ award }) => `
            <span
              class="ez-rack-builder__rack-ribbon"
              style="background:${award.gradient};height:${preview.ribbonHeight}px;width:${preview.ribbonWidth}px"
              title="${escapeHtml(award.label)}"
            ></span>
          `).join('')}
        </div>
      `).join('')}
      ${preview.kind === 'medals' && !hero ? `
        <div class="ez-rack-builder__medal-row">
          ${rows[0].map(({ award }) => `
            <span class="ez-rack-builder__medal-dot" style="background:${award.gradient}" title="${escapeHtml(award.label)}"></span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderStepHeader(step, eyebrow) {
  return `
    <div class="ez-rack-builder__step-header">
      <div>
        <span class="ez-rack-builder__step-kicker">${escapeHtml(eyebrow)}</span>
        <h2 class="ez-rack-builder__step-title">${escapeHtml(step.title)}</h2>
        <p class="ez-rack-builder__step-copy">${escapeHtml(step.description)}</p>
      </div>
    </div>
  `;
}

function renderStepButtons({
  showBack = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  nextAction = 'next-step',
  nextDisabled = false,
} = {}) {
  return `
    <div class="ez-rack-builder__step-actions">
      ${showBack ? `
        <button class="ez-rack-builder__button ez-rack-builder__button--ghost" type="button" data-action="prev-step">
          ${escapeHtml(backLabel)}
        </button>
      ` : '<span></span>'}
      <button
        class="ez-rack-builder__button ez-rack-builder__button--primary"
        type="button"
        data-action="${escapeHtml(nextAction)}"
        ${nextDisabled ? 'disabled' : ''}
      >
        ${escapeHtml(nextLabel)}
      </button>
    </div>
  `;
}

function renderWelcomeStep(runtime) {
  const { data, config } = runtime;
  return `
    ${renderStepHeader(getCurrentStep(runtime), config.eyebrowText)}
    <section class="ez-rack-builder__welcome">
      <div class="ez-rack-builder__welcome-copy">
        <span class="ez-rack-builder__hero-eyebrow">${escapeHtml(config.eyebrowText)}</span>
        <h3 class="ez-rack-builder__hero-title">${escapeHtml(config.title)}</h3>
        <p class="ez-rack-builder__hero-text">${escapeHtml(config.subtitle)}</p>
        <div class="ez-rack-builder__hero-actions">
          <button class="ez-rack-builder__button ez-rack-builder__button--primary ez-rack-builder__button--large" type="button" data-action="start-builder">
            Start New Rack
          </button>
          <a class="ez-rack-builder__button ez-rack-builder__button--secondary" href="${escapeHtml(config.secondaryCtaHref)}">
            ${escapeHtml(config.secondaryCtaLabel)}
          </a>
        </div>
        <div class="ez-rack-builder__hero-highlights">
          <article class="ez-rack-builder__hero-card">
            <strong>Regulation-aware ordering</strong>
            <p>Every added ribbon drops into precedence automatically so the rack preview stays inspection-ready.</p>
          </article>
          <article class="ez-rack-builder__hero-card">
            <strong>Guided DD214 import</strong>
            <p>Start from a curated profile or build manually without leaving the awards catalog.</p>
          </article>
        </div>
      </div>
      <div class="ez-rack-builder__welcome-visual">
        <div class="ez-rack-builder__hero-stage">
          <div class="ez-rack-builder__hero-glow"></div>
          ${renderPreviewRows(data, runtime.state, { hero: true })}
        </div>
      </div>
    </section>
  `;
}

function renderBranchStep(runtime) {
  const enabledBranches = getEnabledBranches(runtime.data);
  return `
    ${renderStepHeader(getCurrentStep(runtime), 'Branch ruleset')}
    <section class="ez-rack-builder__card-grid ez-rack-builder__card-grid--branches">
      ${(runtime.data.branches || []).map((branch) => {
    const selected = branch.id === runtime.state.branchId;
    const disabled = branch.status !== 'enabled';
    return `
          <button
            type="button"
            class="ez-rack-builder__choice-card ez-rack-builder__choice-card--branch${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}"
            data-action="select-branch"
            data-id="${escapeHtml(branch.id)}"
            ${disabled ? 'disabled' : ''}
          >
            <span class="ez-rack-builder__branch-mark">${escapeHtml(branch.watermark)}</span>
            <strong>${escapeHtml(branch.label)}</strong>
            <small>${disabled ? 'Coming soon' : 'Enabled now'}</small>
          </button>
        `;
  }).join('')}
    </section>
    <p class="ez-rack-builder__helper-copy">
      ${enabledBranches.length === 1
    ? 'Marine Corps is enabled in v1. Additional services can be staged later without changing the builder architecture.'
    : 'Only enabled services can be selected in this release.'}
    </p>
    ${renderStepButtons({
    showBack: true,
    nextDisabled: !runtime.state.branchId,
  })}
  `;
}

function renderRackTypePreview(rackType) {
  const preview = rackType.preview || {};
  const ribbonHeight = preview.ribbonHeight || 18;
  const ribbonWidth = preview.ribbonWidth || 68;
  return `
    <div class="ez-rack-builder__type-preview" data-kind="${escapeHtml(preview.kind || 'ribbons')}">
      <span class="ez-rack-builder__type-bar" style="height:${ribbonHeight}px;width:${ribbonWidth}px;background:linear-gradient(90deg,#1a3580 0 30%,#c00018 30% 50%,#fff 50% 70%,#c9a227 70% 100%)"></span>
      <span class="ez-rack-builder__type-bar" style="height:${Math.max(10, ribbonHeight - 2)}px;width:${ribbonWidth}px;background:linear-gradient(90deg,#5a1a6e 0 25%,#c9a227 25% 40%,#5a1a6e 40% 100%)"></span>
      <span class="ez-rack-builder__type-bar" style="height:${Math.max(10, ribbonHeight - 4)}px;width:${Math.max(48, ribbonWidth - 16)}px;background:linear-gradient(90deg,#0a4a0a 0 25%,#c9a227 25% 75%,#0a4a0a 75% 100%)"></span>
    </div>
  `;
}

function renderRackTypeStep(runtime) {
  return `
    ${renderStepHeader(getCurrentStep(runtime), 'Presentation format')}
    <section class="ez-rack-builder__card-grid ez-rack-builder__card-grid--types">
      ${(runtime.data.rackTypes || []).map((rackType) => `
        <button
          type="button"
          class="ez-rack-builder__choice-card ez-rack-builder__choice-card--type${rackType.id === runtime.state.rackTypeId ? ' is-selected' : ''}"
          data-action="select-rack-type"
          data-id="${escapeHtml(rackType.id)}"
        >
          ${renderRackTypePreview(rackType)}
          <strong>${escapeHtml(rackType.label)}</strong>
          <p>${escapeHtml(rackType.description)}</p>
        </button>
      `).join('')}
    </section>
    ${renderStepButtons({
    showBack: true,
    nextDisabled: !runtime.state.rackTypeId,
  })}
  `;
}

function renderOptionCards(title, groupId, options, selectedId) {
  return `
    <section class="ez-rack-builder__option-group">
      <div class="ez-rack-builder__option-header">
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="ez-rack-builder__option-cards">
        ${options.map((option) => `
          <button
            type="button"
            class="ez-rack-builder__option-card${option.id === selectedId ? ' is-selected' : ''}"
            data-action="set-${escapeHtml(groupId)}"
            data-id="${escapeHtml(option.id)}"
          >
            <strong>${escapeHtml(option.label)}</strong>
            <p>${escapeHtml(option.description)}</p>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderOptionsStep(runtime) {
  return `
    ${renderStepHeader(getCurrentStep(runtime), 'Refinement')}
    <div class="ez-rack-builder__options-layout">
      ${renderOptionCards('Spacing', 'spacing', runtime.data.options.spacing || [], runtime.state.options.spacing)}
      ${renderOptionCards('Alignment', 'alignment', runtime.data.options.alignment || [], runtime.state.options.alignment)}
      ${renderOptionCards('Assembly', 'assembly', runtime.data.options.assembly || [], runtime.state.options.assembly)}
      <section class="ez-rack-builder__option-group ez-rack-builder__option-group--note">
        <div class="ez-rack-builder__option-note">
          <strong>Width</strong>
          <p>Standard EZ Rack mounts are fixed at ${runtime.data.width}-wide in v1.</p>
        </div>
      </section>
    </div>
    ${renderStepButtons({
    showBack: true,
  })}
  `;
}

function renderAwardsGrid(runtime) {
  const page = getAwardsPage(runtime.data, {
    branchId: runtime.state.branchId,
    searchQuery: runtime.state.searchQuery,
    selectedCategory: runtime.state.selectedCategory,
    page: runtime.state.page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const selectedAwards = new Set(runtime.state.rackItems.map((item) => item.awardId));
  const categories = getCategoryOptions(runtime.data, runtime.state.branchId);

  return `
    <div class="ez-rack-builder__awards-toolbar">
      <div class="ez-rack-builder__search">
        <input
          class="ez-rack-builder__search-input"
          type="search"
          name="award-search"
          value="${escapeHtml(runtime.state.searchQuery)}"
          placeholder="Search awards"
        />
      </div>
      <div class="ez-rack-builder__toolbar-actions">
        <button class="ez-rack-builder__button ez-rack-builder__button--secondary" type="button" data-action="open-import">
          Upload DD214
        </button>
      </div>
    </div>
    <div class="ez-rack-builder__filters">
      ${categories.map((category) => `
        <button
          type="button"
          class="ez-rack-builder__filter-chip${runtime.state.selectedCategory === category ? ' is-active' : ''}"
          data-action="set-category"
          data-id="${escapeHtml(category)}"
        >
          ${escapeHtml(category === 'all' ? 'All categories' : category)}
        </button>
      `).join('')}
    </div>
    <div class="ez-rack-builder__pagination">
      <button
        type="button"
        class="ez-rack-builder__page-button"
        data-action="set-page"
        data-page="${page.page - 1}"
        ${page.page === 0 ? 'disabled' : ''}
      >
        Prev
      </button>
      <p>
        ${page.total ? `${page.start + 1} - ${page.end}` : '0'} of ${page.total} awards
      </p>
      <button
        type="button"
        class="ez-rack-builder__page-button"
        data-action="set-page"
        data-page="${page.page + 1}"
        ${page.page >= page.pageCount - 1 ? 'disabled' : ''}
      >
        Next
      </button>
    </div>
    <div class="ez-rack-builder__award-grid">
      ${page.items.map((award) => `
        <button
          type="button"
          class="ez-rack-builder__award-card${selectedAwards.has(award.id) ? ' is-in-rack' : ''}"
          data-action="open-award-editor"
          data-id="${escapeHtml(award.id)}"
        >
          <span class="ez-rack-builder__award-swatch" style="background:${award.gradient}"></span>
          <strong>${escapeHtml(award.label)}</strong>
          <small>${escapeHtml(award.category)}</small>
        </button>
      `).join('')}
    </div>
  `;
}

function renderDeviceEditor(runtime) {
  const editor = runtime.state.deviceEditor;
  if (!editor?.awardId) return '';

  const award = getAwardById(runtime.data, editor.awardId);
  if (!award) return '';

  const rackItem = runtime.state.rackItems.find((item) => item.awardId === editor.awardId);
  const selections = editor.draft || rackItem?.devices || {};

  return `
    <section class="ez-rack-builder__device-editor">
      <div class="ez-rack-builder__device-header">
        <div>
          <span class="ez-rack-builder__device-kicker">Device editor</span>
          <h3>${escapeHtml(award.label)}</h3>
        </div>
        <span class="ez-rack-builder__award-swatch" style="background:${award.gradient}"></span>
      </div>
      <div class="ez-rack-builder__device-list">
        ${(award.deviceIds || []).map((deviceId) => {
    const device = getDeviceById(runtime.data, deviceId);
    if (!device) return '';

    if (device.type === 'count') {
      return `
              <label class="ez-rack-builder__device-row">
                <span>${escapeHtml(device.label)}</span>
                <select data-device-id="${escapeHtml(device.id)}">
                  ${Array.from({ length: device.max + 1 }, (_, value) => `
                    <option value="${value}" ${Number(selections[device.id] || 0) === value ? 'selected' : ''}>${value === 0 ? 'None' : value}</option>
                  `).join('')}
                </select>
              </label>
            `;
    }

    if (device.type === 'toggle') {
      return `
              <label class="ez-rack-builder__device-row ez-rack-builder__device-row--toggle">
                <span>${escapeHtml(device.label)}</span>
                <input type="checkbox" data-device-id="${escapeHtml(device.id)}" ${selections[device.id] === true ? 'checked' : ''} />
              </label>
            `;
    }

    return `
            <label class="ez-rack-builder__device-row">
              <span>${escapeHtml(device.label)}</span>
              <input
                type="text"
                data-device-id="${escapeHtml(device.id)}"
                value="${escapeHtml(selections[device.id] || '')}"
                placeholder="${escapeHtml(device.placeholder || 'Enter value')}"
              />
            </label>
          `;
  }).join('')}
      </div>
      <div class="ez-rack-builder__step-actions">
        <button class="ez-rack-builder__button ez-rack-builder__button--ghost" type="button" data-action="cancel-award-editor">
          Cancel
        </button>
        <button class="ez-rack-builder__button ez-rack-builder__button--primary" type="button" data-action="save-award-editor">
          ${rackItem ? 'Save devices' : 'Add to rack'}
        </button>
      </div>
    </section>
  `;
}

function renderAwardsStep(runtime) {
  const importedProfile = getEntryById(
    runtime.data.importProfiles,
    runtime.state.importedProfileId,
  );
  return `
    ${renderStepHeader(getCurrentStep(runtime), 'Awards catalog')}
    ${importedProfile ? `
      <div class="ez-rack-builder__import-banner">
        <strong>Imported profile:</strong>
        <span>${escapeHtml(importedProfile.label)}</span>
      </div>
    ` : ''}
    ${renderAwardsGrid(runtime)}
    ${renderDeviceEditor(runtime)}
    ${renderStepButtons({
    showBack: true,
    nextDisabled: runtime.state.rackItems.length === 0,
  })}
  `;
}

function renderAddons(runtime) {
  if (!runtime.data.addons.length) return '';
  return `
    <section class="ez-rack-builder__review-card">
      <div class="ez-rack-builder__review-head">
        <h3>Optional Add-ons</h3>
      </div>
      <div class="ez-rack-builder__addon-grid">
        ${runtime.data.addons.map((addon) => `
          <button
            type="button"
            class="ez-rack-builder__addon-card${runtime.state.selectedAddonIds.includes(addon.id) ? ' is-selected' : ''}"
            data-action="toggle-addon"
            data-id="${escapeHtml(addon.id)}"
          >
            <strong>${escapeHtml(addon.label)}</strong>
            <p>${escapeHtml(addon.description)}</p>
            <small>${escapeHtml(runtime.data.currency)} ${addon.price}</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderReviewStep(runtime) {
  const branch = getEntryById(runtime.data.branches, runtime.state.branchId);
  const rackType = getEntryById(runtime.data.rackTypes, runtime.state.rackTypeId);
  const importedProfile = getEntryById(
    runtime.data.importProfiles,
    runtime.state.importedProfileId,
  );
  const payloadPreview = serializeBuilderPayload(runtime.data, runtime.state);

  return `
    ${renderStepHeader(getCurrentStep(runtime), 'Final payload')}
    <section class="ez-rack-builder__review-card">
      <div class="ez-rack-builder__review-head">
        <h3>Rack name</h3>
      </div>
      <input
        class="ez-rack-builder__text-input"
        type="text"
        name="rack-name"
        value="${escapeHtml(runtime.state.rackName)}"
        maxlength="64"
        placeholder="Optional ceremonial rack name"
      />
    </section>
    <section class="ez-rack-builder__review-card">
      <div class="ez-rack-builder__review-head">
        <h3>Configuration</h3>
      </div>
      <div class="ez-rack-builder__review-rows">
        <div><span>Service</span><strong>${escapeHtml(branch?.label || 'Not selected')}</strong></div>
        <div><span>Rack Type</span><strong>${escapeHtml(rackType?.label || 'Not selected')}</strong></div>
        <div><span>Spacing</span><strong>${escapeHtml(getEntryById(runtime.data.options.spacing, runtime.state.options.spacing)?.label || '')}</strong></div>
        <div><span>Alignment</span><strong>${escapeHtml(getEntryById(runtime.data.options.alignment, runtime.state.options.alignment)?.label || '')}</strong></div>
        <div><span>Assembly</span><strong>${escapeHtml(getEntryById(runtime.data.options.assembly, runtime.state.options.assembly)?.label || '')}</strong></div>
        <div><span>Imported Profile</span><strong>${escapeHtml(importedProfile?.label || 'Manual build')}</strong></div>
      </div>
      <div class="ez-rack-builder__review-links">
        <button type="button" data-action="jump-step" data-step="2">Edit rack type</button>
        <button type="button" data-action="jump-step" data-step="3">Edit options</button>
        <button type="button" data-action="jump-step" data-step="4">Edit awards</button>
      </div>
    </section>
    ${renderAddons(runtime)}
    <section class="ez-rack-builder__review-card">
      <div class="ez-rack-builder__review-head">
        <h3>Commerce payload preview</h3>
      </div>
      <pre class="ez-rack-builder__payload-preview">${escapeHtml(payloadPreview)}</pre>
    </section>
    <div class="ez-rack-builder__step-actions">
      <button class="ez-rack-builder__button ez-rack-builder__button--ghost" type="button" data-action="prev-step">
        Back
      </button>
      <button class="ez-rack-builder__button ez-rack-builder__button--gold" type="button" data-action="submit-builder" ${runtime.state.isSubmitting ? 'disabled' : ''}>
        ${escapeHtml(runtime.state.isSubmitting ? 'Submitting...' : runtime.config.primaryCtaLabel)}
      </button>
    </div>
  `;
}

function renderContent(runtime) {
  const step = getCurrentStep(runtime);
  const markup = (() => {
    if (step.id === 'welcome') return renderWelcomeStep(runtime);
    if (step.id === 'branch') return renderBranchStep(runtime);
    if (step.id === 'rack-type') return renderRackTypeStep(runtime);
    if (step.id === 'options') return renderOptionsStep(runtime);
    if (step.id === 'awards') return renderAwardsStep(runtime);
    return renderReviewStep(runtime);
  })();

  runtime.refs.content.innerHTML = markup;
}

function renderSummary(runtime) {
  const rackTitle = getRackTitle(runtime.data, runtime.state);
  const rows = getRackRows(runtime.data, runtime.state.rackItems);
  const importedProfile = getEntryById(
    runtime.data.importProfiles,
    runtime.state.importedProfileId,
  );

  runtime.refs.summaryTitle.textContent = rackTitle;
  if (runtime.state.rackItems.length) {
    const awardSuffix = runtime.state.rackItems.length === 1 ? '' : 's';
    const rowSuffix = rows.length === 1 ? '' : 's';
    runtime.refs.summarySubtitle.textContent = `${runtime.state.rackItems.length} award${awardSuffix} across ${rows.length} row${rowSuffix}`;
  } else {
    runtime.refs.summarySubtitle.textContent = 'Select a rack type and begin adding awards.';
  }

  runtime.refs.preview.innerHTML = `
    <div class="ez-rack-builder__preview-frame">
      ${renderPreviewRows(runtime.data, runtime.state)}
    </div>
  `;

  runtime.refs.meta.innerHTML = `
    <div class="ez-rack-builder__meta-chip">
      <span>Service</span>
      <strong>${escapeHtml(getEntryById(runtime.data.branches, runtime.state.branchId)?.label || 'Pending')}</strong>
    </div>
    <div class="ez-rack-builder__meta-chip">
      <span>Rack Type</span>
      <strong>${escapeHtml(getEntryById(runtime.data.rackTypes, runtime.state.rackTypeId)?.label || 'Pending')}</strong>
    </div>
    <div class="ez-rack-builder__meta-chip">
      <span>Profile</span>
      <strong>${escapeHtml(importedProfile?.label || 'Manual')}</strong>
    </div>
  `;

  runtime.refs.actions.innerHTML = `
    <div class="ez-rack-builder__summary-quick-actions">
      <button class="ez-rack-builder__button ez-rack-builder__button--secondary" type="button" data-action="jump-step" data-step="4">
        Edit awards
      </button>
      <button class="ez-rack-builder__button ez-rack-builder__button--secondary" type="button" data-action="jump-step" data-step="5" ${runtime.state.rackItems.length === 0 ? 'disabled' : ''}>
        Review build
      </button>
    </div>
  `;

  const items = getRackItemsExpanded(runtime.data, runtime.state.rackItems);
  runtime.refs.list.innerHTML = items.length
    ? `
      <div class="ez-rack-builder__list-items">
        ${items.map(({ award, deviceSummary }) => `
          <div class="ez-rack-builder__list-item">
            <span class="ez-rack-builder__list-swatch" style="background:${award.gradient}"></span>
            <div class="ez-rack-builder__list-copy">
              <strong>${escapeHtml(award.label)}</strong>
              <small>${escapeHtml(deviceSummary || award.category)}</small>
            </div>
            <div class="ez-rack-builder__list-actions">
              <button type="button" data-action="open-award-editor" data-id="${escapeHtml(award.id)}">Edit</button>
              <button type="button" data-action="remove-award" data-id="${escapeHtml(award.id)}">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>
    `
    : `
      <div class="ez-rack-builder__list-empty">
        <strong>No awards in rack</strong>
        <p>Head to the awards step to start assembling the rack.</p>
      </div>
    `;
}

function renderOverlay(runtime) {
  if (!runtime.state.overlayOpen) {
    runtime.refs.overlay.hidden = true;
    runtime.refs.overlay.innerHTML = '';
    return;
  }

  runtime.refs.overlay.hidden = false;
  runtime.refs.overlay.innerHTML = `
    <div class="ez-rack-builder__overlay-backdrop" data-action="close-import"></div>
    <div class="ez-rack-builder__overlay-panel">
      <div class="ez-rack-builder__overlay-head">
        <div>
          <span class="ez-rack-builder__step-kicker">DD214 smart import</span>
          <h3>Choose a guided import profile</h3>
        </div>
        <button type="button" class="ez-rack-builder__overlay-close" data-action="close-import">✕</button>
      </div>
      <div class="ez-rack-builder__overlay-grid">
        ${(runtime.data.importProfiles || []).map((profile) => `
          <button
            type="button"
            class="ez-rack-builder__import-card"
            data-action="apply-import"
            data-id="${escapeHtml(profile.id)}"
          >
            <strong>${escapeHtml(profile.label)}</strong>
            <p>${escapeHtml(profile.description)}</p>
            <small>${profile.awardIds.length} award seeds</small>
          </button>
        `).join('')}
      </div>
      <div class="ez-rack-builder__step-actions">
        <button class="ez-rack-builder__button ez-rack-builder__button--ghost" type="button" data-action="close-import">
          Cancel
        </button>
        <button class="ez-rack-builder__button ez-rack-builder__button--primary" type="button" data-action="continue-manual">
          Start empty
        </button>
      </div>
    </div>
  `;
}

function syncSummaryToggle(runtime) {
  const expanded = runtime.refs.shell.dataset.summaryOpen === 'true';
  runtime.refs.summaryToggle.setAttribute('aria-expanded', String(expanded));
  runtime.refs.summaryToggle.querySelector('.ez-rack-builder__summary-toggle-icon').textContent = expanded ? '−' : '+';
}

function syncCommerceSelections(runtime) {
  if (!runtime.contractValidation?.valid) return;

  try {
    const cartItem = createEzRackBuilderCartItem({
      sku: runtime.config.sku,
      data: runtime.data,
      state: runtime.state,
      contractIndex: runtime.contractValidation.contractIndex,
    });

    setProductConfigurationValues((previous) => ({
      ...previous,
      quantity: 1,
      optionsUIDs: cartItem.optionsUIDs,
      enteredOptions: cartItem.enteredOptions,
    }));
  } catch (error) {
    console.warn('ez-rack-builder: unable to sync Commerce selections', error);
  }
}

function trackStepView(runtime) {
  if (runtime.state.lastTrackedStep === runtime.state.stepIndex) return;
  const step = getCurrentStep(runtime);
  pushAnalyticsEvent('ez_rack_builder_step_view', {
    builder_id: runtime.data.id,
    builder_version: runtime.data.version,
    product_sku: runtime.config.sku,
    step_id: step.id,
    step_index: runtime.state.stepIndex + 1,
    branch_id: runtime.state.branchId,
  });
  runtime.state.lastTrackedStep = runtime.state.stepIndex;
}

function renderAll(runtime, { syncCommerce = true } = {}) {
  if (syncCommerce) syncCommerceSelections(runtime);
  renderStatus(runtime);
  renderProgress(runtime);
  renderContent(runtime);
  renderSummary(runtime);
  renderOverlay(runtime);
  syncSummaryToggle(runtime);
  trackStepView(runtime);
}

function getValidatableMessage(stepId) {
  if (stepId === 'branch') return 'Select a service profile to continue.';
  if (stepId === 'rack-type') return 'Select a rack type to continue.';
  if (stepId === 'options') return 'Choose rack options before moving forward.';
  if (stepId === 'awards') return 'Add at least one award before review.';
  return '';
}

function isStepComplete(runtime, stepIndex) {
  const step = STEPS[stepIndex];
  if (!step) return true;
  if (step.id === 'welcome') return true;
  if (step.id === 'branch') return Boolean(runtime.state.branchId);
  if (step.id === 'rack-type') return Boolean(runtime.state.rackTypeId);
  if (step.id === 'options') {
    return Boolean(
      runtime.state.options.spacing
      && runtime.state.options.alignment
      && runtime.state.options.assembly,
    );
  }
  if (step.id === 'awards') return runtime.state.rackItems.length > 0;
  return Boolean(
    runtime.state.branchId
    && runtime.state.rackTypeId
    && runtime.state.rackItems.length > 0,
  );
}

function goToStep(runtime, nextStep) {
  runtime.state.stepIndex = Math.max(0, Math.min(nextStep, STEPS.length - 1));
  setStatus(runtime);
  renderAll(runtime);
  window.scrollTo?.(0, 0);
}

function startBuilder(runtime) {
  if (getEnabledBranches(runtime.data).length === 1) {
    goToStep(runtime, 2);
    return;
  }
  goToStep(runtime, 1);
}

function openAwardEditor(runtime, awardId) {
  const current = runtime.state.rackItems.find((item) => item.awardId === awardId);
  runtime.state.deviceEditor = {
    awardId,
    draft: {
      ...(current?.devices || {}),
    },
  };
  renderAll(runtime, { syncCommerce: false });
}

function saveAwardEditor(runtime) {
  if (!runtime.state.deviceEditor?.awardId) return;
  runtime.state.rackItems = upsertRackItem(
    runtime.data,
    runtime.state.deviceEditor.awardId,
    runtime.state.rackItems,
    runtime.state.deviceEditor.draft,
  );
  pushAnalyticsEvent('ez_rack_builder_award_saved', {
    builder_id: runtime.data.id,
    award_id: runtime.state.deviceEditor.awardId,
    rack_count: runtime.state.rackItems.length,
  });
  runtime.state.deviceEditor = null;
  renderAll(runtime);
}

function cancelAwardEditor(runtime) {
  runtime.state.deviceEditor = null;
  renderAll(runtime, { syncCommerce: false });
}

async function submitBuilder(runtime) {
  if (runtime.state.isSubmitting) return;

  if (!isStepComplete(runtime, 5)) {
    setStatus(runtime, 'Complete the full configuration before adding to cart.', 'error');
    return;
  }

  if (!runtime.contractValidation?.valid) {
    setStatus(runtime, runtime.contractValidation.blockerMessage, 'error');
    return;
  }

  runtime.state.isSubmitting = true;
  renderAll(runtime, { syncCommerce: true });
  setStatus(runtime, 'Submitting the configured rack to cart...', 'info');

  try {
    const baseItem = createEzRackBuilderCartItem({
      sku: runtime.config.sku,
      data: runtime.data,
      state: runtime.state,
      contractIndex: runtime.contractValidation.contractIndex,
    });
    const addonItems = buildAddonCartItems(runtime.data, runtime.state.selectedAddonIds);
    const valid = isProductConfigurationValid();

    if (!valid) {
      throw new Error('The Commerce product is missing one or more required option selections.');
    }

    await addProductsToCart([baseItem, ...addonItems]);
    pushAnalyticsEvent('ez_rack_builder_add_to_cart', {
      builder_id: runtime.data.id,
      product_sku: runtime.config.sku,
      rack_count: runtime.state.rackItems.length,
      addon_count: addonItems.length,
    });
    window.location.href = rootLink('/cart');
  } catch (error) {
    runtime.state.isSubmitting = false;
    setStatus(runtime, error?.message || 'Unable to add the configured rack to cart right now.', 'error');
    renderAll(runtime, { syncCommerce: false });
  }
}

function toggleAddon(runtime, addonId) {
  const current = new Set(runtime.state.selectedAddonIds);
  if (current.has(addonId)) current.delete(addonId);
  else current.add(addonId);
  runtime.state.selectedAddonIds = [...current];
  renderAll(runtime, { syncCommerce: false });
}

function handleAction(runtime, actionEl) {
  const { action } = actionEl.dataset;
  const id = actionEl.dataset.id || '';

  if (action === 'toggle-summary') {
    const next = runtime.refs.shell.dataset.summaryOpen !== 'true';
    runtime.refs.shell.dataset.summaryOpen = String(next);
    syncSummaryToggle(runtime);
    return;
  }

  if (action === 'start-builder') {
    startBuilder(runtime);
    return;
  }

  if (action === 'prev-step') {
    goToStep(runtime, runtime.state.stepIndex - 1);
    return;
  }

  if (action === 'next-step') {
    if (!isStepComplete(runtime, runtime.state.stepIndex)) {
      setStatus(runtime, getValidatableMessage(getCurrentStep(runtime).id), 'error');
      return;
    }
    goToStep(runtime, runtime.state.stepIndex + 1);
    return;
  }

  if (action === 'jump-step') {
    goToStep(runtime, Number(actionEl.dataset.step || 0));
    return;
  }

  if (action === 'select-branch') {
    runtime.state.branchId = id;
    runtime.state.searchQuery = '';
    runtime.state.selectedCategory = 'all';
    runtime.state.page = 0;
    runtime.state.rackItems = [];
    runtime.state.importedProfileId = '';
    renderAll(runtime);
    return;
  }

  if (action === 'select-rack-type') {
    runtime.state.rackTypeId = id;
    renderAll(runtime);
    return;
  }

  if (action === 'set-spacing' || action === 'set-alignment' || action === 'set-assembly') {
    const key = action.replace('set-', '');
    runtime.state.options[key] = id;
    renderAll(runtime);
    return;
  }

  if (action === 'set-category') {
    runtime.state.selectedCategory = id;
    runtime.state.page = 0;
    renderAll(runtime, { syncCommerce: false });
    return;
  }

  if (action === 'set-page') {
    runtime.state.page = Number(actionEl.dataset.page || 0);
    renderAll(runtime, { syncCommerce: false });
    return;
  }

  if (action === 'open-import') {
    runtime.state.overlayOpen = true;
    renderOverlay(runtime);
    return;
  }

  if (action === 'close-import' || action === 'continue-manual') {
    runtime.state.overlayOpen = false;
    renderOverlay(runtime);
    return;
  }

  if (action === 'apply-import') {
    runtime.state.rackItems = applyImportProfile(runtime.data, runtime.state.branchId, id);
    runtime.state.importedProfileId = id;
    runtime.state.overlayOpen = false;
    pushAnalyticsEvent('ez_rack_builder_import_profile', {
      builder_id: runtime.data.id,
      profile_id: id,
      rack_count: runtime.state.rackItems.length,
    });
    renderAll(runtime);
    return;
  }

  if (action === 'open-award-editor') {
    openAwardEditor(runtime, id);
    return;
  }

  if (action === 'save-award-editor') {
    saveAwardEditor(runtime);
    return;
  }

  if (action === 'cancel-award-editor') {
    cancelAwardEditor(runtime);
    return;
  }

  if (action === 'remove-award') {
    runtime.state.rackItems = removeRackItem(runtime.state.rackItems, id);
    if (runtime.state.deviceEditor?.awardId === id) runtime.state.deviceEditor = null;
    pushAnalyticsEvent('ez_rack_builder_award_removed', {
      builder_id: runtime.data.id,
      award_id: id,
      rack_count: runtime.state.rackItems.length,
    });
    renderAll(runtime);
    return;
  }

  if (action === 'toggle-addon') {
    toggleAddon(runtime, id);
    return;
  }

  if (action === 'submit-builder') {
    submitBuilder(runtime);
  }
}

function handleInput(runtime, target) {
  if (target.name === 'award-search') {
    runtime.state.searchQuery = target.value;
    runtime.state.page = 0;
    renderAll(runtime, { syncCommerce: false });
    return;
  }

  if (target.name === 'rack-name') {
    runtime.state.rackName = sanitizeRackName(target.value);
    syncCommerceSelections(runtime);
    renderSummary(runtime);
    return;
  }

  const { deviceId } = target.dataset;
  if (!deviceId || !runtime.state.deviceEditor) return;

  const device = getDeviceById(runtime.data, deviceId);
  if (!device) return;

  if (device.type === 'toggle') {
    runtime.state.deviceEditor.draft[deviceId] = target.checked === true;
    return;
  }

  if (device.type === 'count') {
    runtime.state.deviceEditor.draft[deviceId] = Number(target.value || 0);
    return;
  }

  runtime.state.deviceEditor.draft[deviceId] = target.value;
}

function attachDelegatedEvents(runtime) {
  runtime.refs.shell.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    event.preventDefault?.();
    handleAction(runtime, actionEl);
  });

  runtime.refs.shell.addEventListener('input', (event) => {
    handleInput(runtime, event.target);
  });

  runtime.refs.shell.addEventListener('change', (event) => {
    handleInput(runtime, event.target);
  });
}

function normalizeConfig(block) {
  const config = readBlockConfig(block);
  const themes = new Set(['scarlet-gold']);
  const presentations = new Set(['rack-immersive', 'default']);
  const dd214Modes = new Set(['smart-stub']);

  return {
    sku: normalizeText(config.sku, DEFAULT_CONFIG.sku),
    schemaUrl: normalizeText(config['schema-url'], DEFAULT_CONFIG.schemaUrl),
    eyebrowText: normalizeText(config['eyebrow-text'], DEFAULT_CONFIG.eyebrowText),
    title: normalizeText(config.title, DEFAULT_CONFIG.title),
    subtitle: normalizeText(config.subtitle, DEFAULT_CONFIG.subtitle),
    primaryCtaLabel: normalizeText(config['primary-cta-label'], DEFAULT_CONFIG.primaryCtaLabel),
    secondaryCtaLabel: normalizeText(config['secondary-cta-label'], DEFAULT_CONFIG.secondaryCtaLabel),
    secondaryCtaHref: resolveHref(normalizeText(config['secondary-cta-href'], DEFAULT_CONFIG.secondaryCtaHref)),
    theme: normalizeEnum(config.theme, themes, DEFAULT_CONFIG.theme),
    presentation: normalizeEnum(config.presentation, presentations, DEFAULT_CONFIG.presentation),
    dd214Mode: normalizeEnum(config['dd214-mode'], dd214Modes, DEFAULT_CONFIG.dd214Mode),
  };
}

export default async function decorate(block) {
  try {
    const config = normalizeConfig(block);
    if (!config.sku) {
      renderFailure(block, 'Add a parent EZ Rack Commerce SKU to the block authoring before using this builder.');
      return;
    }

    block.classList.add('ez-rack-builder');
    renderLoading(block);

    const [data, product] = await Promise.all([
      loadSchema(config.schemaUrl),
      waitForProductData(),
    ]);

    const contractValidation = validateCommerceProductContract(data, product);
    if (!contractValidation.valid) {
      renderFailure(block, contractValidation.blockerMessage || 'Commerce contract validation failed.', 'warning');
      return;
    }

    const refs = buildShell(block, config);
    renderFamilyRail(refs);

    await pdpRender.render(ProductPrice, {})(refs.price);

    const state = {
      ...createInitialState(data),
      status: {
        message: '',
        type: 'info',
      },
      overlayOpen: false,
      deviceEditor: null,
      isSubmitting: false,
      lastTrackedStep: -1,
    };

    const runtime = {
      block,
      config,
      data,
      product,
      contractValidation,
      refs,
      state,
    };

    attachDelegatedEvents(runtime);
    renderAll(runtime);

    events.emit('pdp/configurator-ready', {
      block: 'ez-rack-builder',
      status: 'ready',
      presentation: config.presentation,
    });
  } catch (error) {
    console.warn('ez-rack-builder:', error);
    renderFailure(block, error?.message || 'Luxury EZ Rack Builder failed to initialize.');
  }
}
