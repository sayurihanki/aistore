import { events } from '@dropins/tools/event-bus.js';
import { render as pdpRender } from '@dropins/storefront-pdp/render.js';
import {
  getProductConfigurationValues,
  isProductConfigurationValid,
  setProductConfigurationValues,
} from '@dropins/storefront-pdp/api.js';
import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';

import { readBlockConfig } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  getProductLink,
  rootLink,
} from '../../scripts/commerce.js';
import '../../scripts/initializers/cart.js';
import { performCatalogServiceQuery } from '../product-teaser/product-teaser-utils.js';
/* eslint-disable import/extensions */
import {
  buildCartItems,
  evaluateConditions,
  extractDisplayPrice,
  findOptionByLabel,
  findOptionValue,
  formatMoney,
  getConfiguratorCompatibility,
  normalizeKey,
  normalizeProductOptions,
} from './product-configurator-luxe.utils.mjs';
/* eslint-enable import/extensions */

const DEFAULTS = {
  eyebrowText: 'Bodea Configurator',
  title: 'Build your enclosure in guided steps.',
  subtitle: 'Select footprint, access, airflow, and operations choices with a real-time Bodea luxury summary.',
  primaryCtaLabel: 'Add configured build',
  secondaryCtaLabel: 'Talk to a Bodea specialist',
  secondaryCtaHref: '/contact',
  theme: 'emerald',
  presentation: 'default',
};

const THEMES = new Set(['emerald', 'gold']);
const PRESENTATIONS = new Set(['default', 'rack-immersive']);
const U_SLOT_MAP = {
  '6u': 1,
  '12u': 2,
  '24u': 4,
  '42u': 7,
};

const ADDON_QUERY = `query productConfiguratorLuxeAddons($skus: [String!]) {
  products(skus: $skus) {
    sku
    name
    urlKey
    __typename
    ... on SimpleProductView {
      price {
        regular {
          amount {
            value
            currency
          }
        }
        final {
          amount {
            value
            currency
          }
        }
      }
    }
    ... on ComplexProductView {
      priceRange {
        minimum {
          regular {
            amount {
              value
              currency
            }
          }
          final {
            amount {
              value
              currency
            }
          }
        }
        maximum {
          regular {
            amount {
              value
              currency
            }
          }
          final {
            amount {
              value
              currency
            }
          }
        }
      }
    }
  }
}`;

function resolveHref(href) {
  if (!href) return rootLink(DEFAULTS.secondaryCtaHref);
  if (href.startsWith('/')) return rootLink(href);
  return href;
}

function getAddonId(addon) {
  return addon?.id || addon?.sku;
}

function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attrs).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(name, value);
  });
  return element;
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

function getAllControls(schema) {
  return (schema?.steps || []).flatMap((step) => (
    Array.isArray(step.controls)
      ? step.controls.map((control) => ({
        ...control,
        stepId: step.id,
        stepLabel: step.label,
      }))
      : []
  ));
}

function getCurrentValues() {
  return getProductConfigurationValues() || {
    sku: '',
    quantity: 1,
    optionsUIDs: [],
  };
}

function getCurrentQuantity() {
  const quantity = Number(getCurrentValues().quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getInitialAdvisorySelections(schema) {
  return getAllControls(schema).reduce((acc, control) => {
    if (control.source === 'advisory-select' && control.defaultValue !== undefined) {
      acc[control.id] = control.defaultValue;
    }
    return acc;
  }, {});
}

function getAdvisoryOption(control, value) {
  return (control?.options || []).find((option) => option.value === value) || null;
}

function getCommerceSelection(state, control) {
  const option = findOptionByLabel(state.options, control.commerceOptionLabel);
  const selectedUIDs = getCurrentValues().optionsUIDs || [];
  const selectedValue = option?.items?.find((item) => selectedUIDs.includes(item.id))
    || option?.items?.find((item) => item.selected)
    || null;

  return {
    option,
    selectedValue,
  };
}

function getPresentationMeta(control, itemLabel) {
  const optionMeta = control?.optionMeta;
  if (!optionMeta || typeof optionMeta !== 'object') return {};

  const matchKey = Object.keys(optionMeta)
    .find((key) => normalizeKey(key) === normalizeKey(itemLabel));

  return matchKey ? optionMeta[matchKey] : {};
}

function getSelectedLabelForControl(state, control) {
  if (control.source === 'commerce-option') {
    return getCommerceSelection(state, control).selectedValue?.label || '';
  }

  return getAdvisoryOption(control, state.advisorySelections[control.id])?.label || '';
}

function isControlSatisfied(state, control) {
  if (control.source === 'commerce-option') {
    return Boolean(getCommerceSelection(state, control).selectedValue);
  }

  return Boolean(state.advisorySelections[control.id]);
}

function areRequiredSelectionsComplete(state) {
  return getAllControls(state.schema)
    .every((control) => !control.required || isControlSatisfied(state, control));
}

function getVisibleAddons(state) {
  return state.addonCatalog.filter((addon) => (
    evaluateConditions(addon.conditions, state.advisorySelections)
  ));
}

function syncSelectedAddons(state, { applyDefaults = false } = {}) {
  const visibleMap = new Map(getVisibleAddons(state).map((addon) => [getAddonId(addon), addon]));
  const next = new Set(
    [...state.selectedAddons].filter((addonId) => visibleMap.has(addonId)),
  );

  if (applyDefaults) {
    visibleMap.forEach((addon, addonId) => {
      if (addon.defaultSelected) {
        next.add(addonId);
      }
    });
  }

  state.selectedAddons = next;
}

function getSelectedAddons(state) {
  const visibleMap = new Map(getVisibleAddons(state).map((addon) => [getAddonId(addon), addon]));
  return [...state.selectedAddons]
    .map((addonId) => visibleMap.get(addonId))
    .filter(Boolean);
}

function getAddonTotals(state) {
  const quantity = getCurrentQuantity();
  return getSelectedAddons(state).reduce((sum, addon) => {
    const multiplier = addon.quantityStrategy === 'fixed-1' ? 1 : quantity;
    return sum + ((addon.priceAmount || 0) * multiplier);
  }, 0);
}

function getGrandTotal(state) {
  const quantity = getCurrentQuantity();
  const basePrice = extractDisplayPrice(state.product);
  const baseTotal = (basePrice.amount || 0) * quantity;
  const addonTotal = getAddonTotals(state);

  return {
    quantity,
    currency: basePrice.currency || 'USD',
    baseTotal,
    addonTotal,
    grandTotal: baseTotal + addonTotal,
  };
}

function setStatus(refs, message = '', type = 'info') {
  refs.status.dataset.type = type;
  refs.status.textContent = message;
  refs.status.hidden = !message;
}

function renderLoading(block) {
  block.innerHTML = `
    <div class="product-configurator-luxe__loading">
      <span class="product-configurator-luxe__loading-pill">Loading configurator</span>
      <strong>Preparing the Bodea build studio.</strong>
      <p>Fetching product options, accessory pricing, and preview states.</p>
    </div>
  `;
}

function renderFailure(block, message) {
  block.innerHTML = `
    <div class="product-configurator-luxe__fallback" role="status">
      <span class="product-configurator-luxe__fallback-pill">Configurator unavailable</span>
      <strong>${message}</strong>
      <p>The standard product configuration remains active above.</p>
    </div>
  `;
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

function resolveSchemaUrl(schemaUrl) {
  if (!schemaUrl) return '';
  if (schemaUrl.startsWith('http://') || schemaUrl.startsWith('https://')) return schemaUrl;
  if (schemaUrl.startsWith('/')) return rootLink(schemaUrl);
  return rootLink(`/${schemaUrl.replace(/^\/+/, '')}`);
}

async function loadSchema(schemaUrl) {
  const response = await fetch(resolveSchemaUrl(schemaUrl));
  if (!response.ok) {
    throw new Error(`Schema request failed (${response.status}).`);
  }

  return response.json();
}

function renderIncompatible(block) {
  block.textContent = '';
  block.removeAttribute('data-summary-open');
  block.dataset.presentation = 'incompatible';
}

async function loadAddonCatalog(schema) {
  const skus = [...new Set((schema.addons || []).map((addon) => addon.sku).filter(Boolean))];
  if (!skus.length) return [];

  const data = await performCatalogServiceQuery(ADDON_QUERY, { skus });
  const products = Array.isArray(data?.products) ? data.products : [];
  const productMap = new Map(products.map((product) => [product.sku, product]));

  return (schema.addons || [])
    .map((addon) => {
      const product = productMap.get(addon.sku);
      if (!product) return null;

      const price = extractDisplayPrice(product);
      return {
        ...addon,
        href: product.urlKey ? getProductLink(product.urlKey, product.sku) : '',
        priceAmount: price.amount,
        currency: price.currency,
      };
    })
    .filter(Boolean);
}

function buildShell(state) {
  const fragment = document.createRange().createContextualFragment(`
    <div
      class="product-configurator-luxe__shell"
      data-theme="${state.config.theme}"
      data-presentation="${state.config.presentation}"
    >
      <div class="product-configurator-luxe__intro">
        <span class="product-configurator-luxe__eyebrow">${state.config.eyebrowText}</span>
        <div class="product-configurator-luxe__heading">
          <h2>${state.config.title}</h2>
          <p>${state.config.subtitle}</p>
        </div>
      </div>
      <div class="product-configurator-luxe__layout">
        <aside class="product-configurator-luxe__preview-column">
          <div class="product-configurator-luxe__preview-card">
            <div class="product-configurator-luxe__preview-copy">
              <span class="product-configurator-luxe__preview-label">Visual profile</span>
              <h3 class="product-configurator-luxe__preview-title">Awaiting enclosure posture</h3>
              <p class="product-configurator-luxe__preview-text">Select the rack height and access posture to bring the Bodea rack portrait to life.</p>
            </div>
            <div class="product-configurator-luxe__preview-stage">
              <div class="product-configurator-luxe__preview-halo"></div>
              <div class="product-configurator-luxe__preview-rack" data-u="none" data-depth="balanced" data-security="glass-lock" data-airflow="balanced" data-cable-density="moderate" data-deployment="server-room" data-thermal-kit="passive">
                <div class="product-configurator-luxe__preview-top"></div>
                <div class="product-configurator-luxe__preview-side"></div>
                <div class="product-configurator-luxe__preview-door"></div>
                <div class="product-configurator-luxe__preview-screen"></div>
                <div class="product-configurator-luxe__preview-fans"></div>
                <div class="product-configurator-luxe__preview-cables"></div>
                <div class="product-configurator-luxe__preview-lights"></div>
                <div class="product-configurator-luxe__preview-units"></div>
              </div>
            </div>
            <div class="product-configurator-luxe__preview-specs"></div>
            <ul class="product-configurator-luxe__preview-signals"></ul>
          </div>
        </aside>
        <div class="product-configurator-luxe__flow-column">
          <div class="product-configurator-luxe__wizard">
            <div class="product-configurator-luxe__status" role="status" aria-live="polite" hidden></div>
            <nav class="product-configurator-luxe__steps" aria-label="Configurator steps"></nav>
            <article class="product-configurator-luxe__step-card">
              <div class="product-configurator-luxe__step-copy">
                <span class="product-configurator-luxe__step-kicker"></span>
                <h3 class="product-configurator-luxe__step-title"></h3>
                <p class="product-configurator-luxe__step-description"></p>
              </div>
              <div class="product-configurator-luxe__control-list"></div>
              <div class="product-configurator-luxe__addons" hidden>
                <div class="product-configurator-luxe__addons-copy">
                  <span class="product-configurator-luxe__panel-label">Recommended accessories</span>
                  <h4>Complete the operational package</h4>
                  <p>Add cable runs that match the room profile and cart them together with the cabinet.</p>
                </div>
                <div class="product-configurator-luxe__addon-list"></div>
              </div>
              <div class="product-configurator-luxe__step-actions">
                <button type="button" class="product-configurator-luxe__nav-button is-back">Back</button>
                <button type="button" class="product-configurator-luxe__nav-button is-next">Continue</button>
              </div>
            </article>
          </div>
          <aside class="product-configurator-luxe__summary">
            <button type="button" class="product-configurator-luxe__summary-toggle" aria-expanded="false">
              <span>Build summary</span>
              <strong class="product-configurator-luxe__summary-toggle-total"></strong>
            </button>
            <div class="product-configurator-luxe__summary-card">
              <div class="product-configurator-luxe__summary-header">
                <span class="product-configurator-luxe__panel-label">Live commerce summary</span>
                <h3>${state.product.name}</h3>
                <p>${state.product.sku}</p>
              </div>
              <div class="product-configurator-luxe__summary-price"></div>
              <div class="product-configurator-luxe__summary-total-breakdown">
                <div>
                  <span>Base total</span>
                  <strong class="product-configurator-luxe__base-total"></strong>
                </div>
                <div>
                  <span>Accessories</span>
                  <strong class="product-configurator-luxe__addon-total"></strong>
                </div>
              </div>
              <div class="product-configurator-luxe__quantity-shell">
                <span class="product-configurator-luxe__panel-label">${state.placeholders?.Global?.quantityLabel || 'Quantity'}</span>
                <div class="product-configurator-luxe__summary-quantity"></div>
              </div>
              <div class="product-configurator-luxe__summary-config">
                <span class="product-configurator-luxe__panel-label">Configuration</span>
                <ul class="product-configurator-luxe__summary-list"></ul>
              </div>
              <div class="product-configurator-luxe__summary-addons">
                <span class="product-configurator-luxe__panel-label">Selected accessories</span>
                <ul class="product-configurator-luxe__summary-addon-list"></ul>
              </div>
              <div class="product-configurator-luxe__grand-total">
                <span>Configured total</span>
                <strong class="product-configurator-luxe__grand-total-value"></strong>
              </div>
              <div class="product-configurator-luxe__cta-stack">
                <button type="button" class="product-configurator-luxe__primary-cta">
                  ${state.config.primaryCtaLabel}
                </button>
                <a class="product-configurator-luxe__secondary-cta" href="${resolveHref(state.config.secondaryCtaHref)}">
                  ${state.config.secondaryCtaLabel}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <div class="product-configurator-luxe__mobile-bar">
        <div class="product-configurator-luxe__mobile-total">
          <span>Configured total</span>
          <strong class="product-configurator-luxe__mobile-total-value"></strong>
        </div>
        <button type="button" class="product-configurator-luxe__mobile-cta">
          ${state.config.primaryCtaLabel}
        </button>
      </div>
    </div>
  `);

  const refs = {
    status: fragment.querySelector('.product-configurator-luxe__status'),
    stepNav: fragment.querySelector('.product-configurator-luxe__steps'),
    stepKicker: fragment.querySelector('.product-configurator-luxe__step-kicker'),
    stepTitle: fragment.querySelector('.product-configurator-luxe__step-title'),
    stepDescription: fragment.querySelector('.product-configurator-luxe__step-description'),
    controlList: fragment.querySelector('.product-configurator-luxe__control-list'),
    addonsPanel: fragment.querySelector('.product-configurator-luxe__addons'),
    addonList: fragment.querySelector('.product-configurator-luxe__addon-list'),
    backButton: fragment.querySelector('.product-configurator-luxe__nav-button.is-back'),
    nextButton: fragment.querySelector('.product-configurator-luxe__nav-button.is-next'),
    previewCard: fragment.querySelector('.product-configurator-luxe__preview-card'),
    previewRack: fragment.querySelector('.product-configurator-luxe__preview-rack'),
    previewTitle: fragment.querySelector('.product-configurator-luxe__preview-title'),
    previewText: fragment.querySelector('.product-configurator-luxe__preview-text'),
    previewSpecs: fragment.querySelector('.product-configurator-luxe__preview-specs'),
    previewSignals: fragment.querySelector('.product-configurator-luxe__preview-signals'),
    priceMount: fragment.querySelector('.product-configurator-luxe__summary-price'),
    quantityMount: fragment.querySelector('.product-configurator-luxe__summary-quantity'),
    summaryList: fragment.querySelector('.product-configurator-luxe__summary-list'),
    summaryAddonList: fragment.querySelector('.product-configurator-luxe__summary-addon-list'),
    baseTotal: fragment.querySelector('.product-configurator-luxe__base-total'),
    addonTotal: fragment.querySelector('.product-configurator-luxe__addon-total'),
    grandTotal: fragment.querySelector('.product-configurator-luxe__grand-total-value'),
    summaryToggle: fragment.querySelector('.product-configurator-luxe__summary-toggle'),
    summaryToggleTotal: fragment.querySelector('.product-configurator-luxe__summary-toggle-total'),
    primaryButton: fragment.querySelector('.product-configurator-luxe__primary-cta'),
    secondaryLink: fragment.querySelector('.product-configurator-luxe__secondary-cta'),
    mobileTotal: fragment.querySelector('.product-configurator-luxe__mobile-total-value'),
    mobileButton: fragment.querySelector('.product-configurator-luxe__mobile-cta'),
  };

  const unitRail = refs.previewRack.querySelector('.product-configurator-luxe__preview-units');
  Array.from({ length: 7 }).forEach(() => {
    unitRail.append(createElement('span', 'product-configurator-luxe__preview-unit'));
  });

  return { fragment, refs };
}

function renderStepNavigation(state, refs) {
  const navItems = state.schema.steps.map((step, index) => {
    const button = createElement('button', 'product-configurator-luxe__step-pill', {
      type: 'button',
      'aria-current': index === state.stepIndex ? 'step' : '',
    });

    if (index === state.stepIndex) button.classList.add('is-current');
    if (
      index < state.stepIndex
      || (step.controls || []).every(
        (control) => !control.required || isControlSatisfied(state, control),
      )
    ) {
      button.classList.add('is-complete');
    }

    button.innerHTML = `
      <span>${String(index + 1).padStart(2, '0')}</span>
      <strong>${step.label}</strong>
    `;
    button.addEventListener('click', () => {
      state.stepIndex = index;
      renderAll(state, refs);
    });
    return button;
  });

  refs.stepNav.replaceChildren(...navItems);
}

function renderControlSelection(control, selectedValue) {
  return control.source === 'commerce-option'
    ? selectedValue?.id || ''
    : selectedValue || '';
}

function handleCommerceSelection(state, refs, control, option, item) {
  if (!item?.id) return;

  setProductConfigurationValues((prev) => {
    const currentUIDs = Array.isArray(prev.optionsUIDs) ? prev.optionsUIDs : [];
    const nextUIDs = currentUIDs.filter(
      (uid) => !option.items.some((candidate) => candidate.id === uid),
    );
    return {
      ...prev,
      optionsUIDs: [...nextUIDs, item.id],
    };
  });

  pushAnalyticsEvent('configurator_option_change', {
    configurator_id: state.schema.id,
    step_id: control.stepId,
    control_id: control.id,
    control_label: control.label || control.commerceOptionLabel,
    option_id: item.id,
    option_label: item.label,
    source: control.source,
  });

  window.requestAnimationFrame(() => renderAll(state, refs));
}

function handleAdvisorySelection(state, refs, control, value) {
  state.advisorySelections[control.id] = value;
  syncSelectedAddons(state);

  pushAnalyticsEvent('configurator_option_change', {
    configurator_id: state.schema.id,
    step_id: control.stepId,
    control_id: control.id,
    control_label: control.label || control.id,
    option_id: value,
    option_label: getAdvisoryOption(control, value)?.label || value,
    source: control.source,
  });

  renderAll(state, refs);
}

function buildChoiceButton(state, refs, control, item, selectedToken, onSelect) {
  const button = createElement('button', 'product-configurator-luxe__choice', {
    type: 'button',
  });

  if (selectedToken === renderControlSelection(control, item.id || item.value)) {
    button.classList.add('is-selected');
  }

  if (item.inStock === false) {
    button.classList.add('is-disabled');
    button.disabled = true;
  }

  const meta = getPresentationMeta(control, item.label);
  const badge = meta.badge || item.badge;
  const description = meta.description || item.description;

  if (control.ui === 'segmented') {
    button.classList.add('is-segmented');
  } else if (control.ui === 'chips') {
    button.classList.add('is-chip');
  } else {
    button.classList.add('is-card');
  }

  if (badge) {
    button.append(createElement('span', 'product-configurator-luxe__choice-badge'));
    button.lastElementChild.textContent = badge;
  }

  const title = createElement('strong', 'product-configurator-luxe__choice-title');
  title.textContent = item.label;
  button.append(title);

  if (description && control.ui !== 'chips') {
    const copy = createElement('span', 'product-configurator-luxe__choice-description');
    copy.textContent = description;
    button.append(copy);
  }

  button.addEventListener('click', () => onSelect(item));
  return button;
}

function renderControl(state, refs, control) {
  const wrapper = createElement('section', 'product-configurator-luxe__control');
  wrapper.dataset.controlId = control.id;

  const heading = createElement('div', 'product-configurator-luxe__control-heading');
  const title = createElement('div', 'product-configurator-luxe__control-title');
  const label = createElement('strong');
  label.textContent = control.label || control.summaryLabel || control.id;
  title.append(label);

  if (control.required) {
    const required = createElement('span', 'product-configurator-luxe__required-pill');
    required.textContent = 'Required';
    title.append(required);
  }

  heading.append(title);
  wrapper.append(heading);

  if (control.source === 'commerce-option') {
    const { option, selectedValue } = getCommerceSelection(state, control);
    const selectedToken = renderControlSelection(control, selectedValue);

    if (!option) {
      const empty = createElement('p', 'product-configurator-luxe__control-empty');
      empty.textContent = 'This product does not expose the expected Commerce option.';
      wrapper.append(empty);
      return wrapper;
    }

    if (control.ui === 'dropdown') {
      const select = createElement('select', 'product-configurator-luxe__select', {
        'aria-label': control.label || control.id,
      });
      select.append(new Option(`Select ${control.label || option.label}`, ''));

      option.items.forEach((item) => {
        const optionNode = new Option(item.label, item.id);
        optionNode.disabled = item.inStock === false;
        optionNode.selected = selectedToken === item.id;
        select.append(optionNode);
      });

      select.addEventListener('change', () => {
        const selectedItem = findOptionValue(option, select.value);
        if (selectedItem) handleCommerceSelection(state, refs, control, option, selectedItem);
      });

      wrapper.append(select);
      return wrapper;
    }

    const grid = createElement('div', 'product-configurator-luxe__choice-grid');
    grid.dataset.ui = control.ui;
    option.items.forEach((item) => {
      grid.append(buildChoiceButton(
        state,
        refs,
        control,
        item,
        selectedToken,
        (selectedItem) => handleCommerceSelection(state, refs, control, option, selectedItem),
      ));
    });
    wrapper.append(grid);
    return wrapper;
  }

  const selectedToken = renderControlSelection(control, state.advisorySelections[control.id]);

  if (control.ui === 'dropdown') {
    const select = createElement('select', 'product-configurator-luxe__select', {
      'aria-label': control.label || control.id,
    });
    select.append(new Option(`Select ${control.label || control.id}`, ''));

    (control.options || []).forEach((item) => {
      const optionNode = new Option(item.label, item.value);
      optionNode.selected = selectedToken === item.value;
      select.append(optionNode);
    });

    select.addEventListener('change', () => handleAdvisorySelection(state, refs, control, select.value));
    wrapper.append(select);
    return wrapper;
  }

  const grid = createElement('div', 'product-configurator-luxe__choice-grid');
  grid.dataset.ui = control.ui;
  (control.options || []).forEach((item) => {
    grid.append(buildChoiceButton(
      state,
      refs,
      control,
      item,
      selectedToken,
      (selectedItem) => handleAdvisorySelection(state, refs, control, selectedItem.value),
    ));
  });
  wrapper.append(grid);

  return wrapper;
}

function renderAddons(state, refs) {
  const visibleAddons = getVisibleAddons(state);
  refs.addonsPanel.hidden = state.schema.steps[state.stepIndex].id !== 'review';

  if (refs.addonsPanel.hidden) {
    refs.addonList.replaceChildren();
    return;
  }

  if (!visibleAddons.length) {
    const empty = createElement('p', 'product-configurator-luxe__control-empty');
    empty.textContent = 'No accessories are recommended for the current profile.';
    refs.addonList.replaceChildren(empty);
    return;
  }

  const cards = visibleAddons.map((addon) => {
    const card = createElement('article', 'product-configurator-luxe__addon-card');
    const addonId = getAddonId(addon);
    const isSelected = state.selectedAddons.has(addonId);
    if (isSelected) card.classList.add('is-selected');

    const copy = createElement('div', 'product-configurator-luxe__addon-copy');
    if (addon.badge) {
      const badge = createElement('span', 'product-configurator-luxe__addon-badge');
      badge.textContent = addon.badge;
      copy.append(badge);
    }

    const title = createElement('h5');
    title.textContent = addon.label;
    copy.append(title);

    const desc = createElement('p');
    desc.textContent = addon.description;
    copy.append(desc);

    const footer = createElement('div', 'product-configurator-luxe__addon-footer');
    const price = createElement('strong');
    price.textContent = formatMoney(addon.priceAmount, addon.currency);
    footer.append(price);

    if (addon.href) {
      const detailLink = createElement('a', 'product-configurator-luxe__addon-link', {
        href: addon.href,
      });
      detailLink.textContent = 'View product';
      footer.append(detailLink);
    }

    const button = createElement('button', 'product-configurator-luxe__addon-toggle', {
      type: 'button',
    });
    button.textContent = isSelected ? 'Selected' : 'Add accessory';
    button.addEventListener('click', () => {
      if (state.selectedAddons.has(addonId)) {
        state.selectedAddons.delete(addonId);
      } else {
        state.selectedAddons.add(addonId);
      }

      pushAnalyticsEvent('configurator_addon_toggle', {
        configurator_id: state.schema.id,
        addon_id: addon.id,
        addon_sku: addon.sku,
        selected: state.selectedAddons.has(addonId),
      });

      renderAll(state, refs);
    });

    card.append(copy, footer, button);
    return card;
  });

  refs.addonList.replaceChildren(...cards);
}

function renderCurrentStep(state, refs) {
  const step = state.schema.steps[state.stepIndex];
  refs.stepKicker.textContent = `Step ${state.stepIndex + 1} / ${state.schema.steps.length} · ${step.label}`;
  refs.stepTitle.textContent = step.title || step.label;
  refs.stepDescription.textContent = step.description || '';

  const controls = Array.isArray(step.controls) ? step.controls : [];
  const nodes = controls.map((control) => renderControl(state, refs, {
    ...control,
    stepId: step.id,
    stepLabel: step.label,
  }));
  refs.controlList.replaceChildren(...nodes);

  refs.backButton.hidden = state.stepIndex === 0;
  refs.nextButton.hidden = state.stepIndex === state.schema.steps.length - 1;

  const nextStep = state.schema.steps[state.stepIndex + 1];
  refs.nextButton.textContent = nextStep ? `Continue to ${nextStep.label}` : 'Continue';

  renderAddons(state, refs);
}

function renderPreview(state, refs) {
  const rackUnits = getAllControls(state.schema).find((control) => control.id === 'rack-units');
  const selectedRackUnits = rackUnits ? getSelectedLabelForControl(state, rackUnits) : '';
  const rackKey = normalizeKey(selectedRackUnits);
  const activeUnits = U_SLOT_MAP[rackKey] || 0;

  refs.previewRack.dataset.u = rackKey || 'none';
  refs.previewRack.dataset.depth = state.advisorySelections['depth-profile'] || 'balanced';
  refs.previewRack.dataset.security = state.advisorySelections['security-profile'] || 'glass-lock';
  refs.previewRack.dataset.airflow = state.advisorySelections['airflow-profile'] || 'balanced';
  refs.previewRack.dataset.cableDensity = state.advisorySelections['cable-density'] || 'moderate';
  refs.previewRack.dataset.deployment = state.advisorySelections['deployment-profile'] || 'server-room';
  refs.previewRack.dataset.thermalKit = state.advisorySelections['thermal-kit'] || 'passive';

  [...refs.previewRack.querySelectorAll('.product-configurator-luxe__preview-unit')]
    .forEach((unit, index) => {
      unit.classList.toggle('is-active', index < activeUnits);
    });

  const deployment = getAllControls(state.schema).find((control) => control.id === 'deployment-profile');
  const security = getAllControls(state.schema).find((control) => control.id === 'security-profile');
  const airflow = getAllControls(state.schema).find((control) => control.id === 'airflow-profile');
  const cable = getAllControls(state.schema).find((control) => control.id === 'cable-density');

  refs.previewTitle.textContent = selectedRackUnits
    ? `${selectedRackUnits} luxury enclosure profile`
    : 'Awaiting enclosure posture';
  refs.previewText.textContent = selectedRackUnits
    ? `Configured for ${getSelectedLabelForControl(state, deployment) || 'room planning'}, with ${getSelectedLabelForControl(state, security) || 'access'}, ${getSelectedLabelForControl(state, airflow) || 'airflow'}, and ${getSelectedLabelForControl(state, cable) || 'cable routing'} guidance.`
    : 'Select the rack height and access posture to bring the Bodea rack portrait to life.';

  const specItems = [
    ['Rack height', selectedRackUnits || 'Select height'],
    ['Depth', getSelectedLabelForControl(state, getAllControls(state.schema).find((control) => control.id === 'depth-profile')) || 'Balanced'],
    ['Thermal kit', getSelectedLabelForControl(state, getAllControls(state.schema).find((control) => control.id === 'thermal-kit')) || 'Passive'],
  ];

  const specNodes = specItems.map(([label, value]) => {
    const item = createElement('div', 'product-configurator-luxe__preview-spec');
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    return item;
  });
  refs.previewSpecs.replaceChildren(...specNodes);

  const signalItems = [
    getSelectedLabelForControl(state, deployment) || 'Deployment pending',
    getSelectedLabelForControl(state, security) || 'Access pending',
    getSelectedLabelForControl(state, airflow) || 'Airflow pending',
  ].map((text) => {
    const item = createElement('li');
    item.textContent = text;
    return item;
  });
  refs.previewSignals.replaceChildren(...signalItems);
}

function renderSummary(state, refs) {
  const summaryItems = getAllControls(state.schema)
    .map((control) => ({
      label: control.summaryLabel || control.label || control.id,
      value: getSelectedLabelForControl(state, control),
      required: control.required,
    }))
    .filter((item) => item.value || item.required);

  if (summaryItems.length > 0) {
    const nodes = summaryItems.map((item) => {
      const row = createElement('li');
      row.innerHTML = `<span>${item.label}</span><strong>${item.value || 'Not selected'}</strong>`;
      if (!item.value) row.classList.add('is-pending');
      return row;
    });
    refs.summaryList.replaceChildren(...nodes);
  } else {
    const empty = createElement('li', 'is-pending');
    empty.innerHTML = '<span>No selections yet</span><strong>Start with footprint</strong>';
    refs.summaryList.replaceChildren(empty);
  }

  const selectedAddons = getSelectedAddons(state);
  if (selectedAddons.length > 0) {
    const nodes = selectedAddons.map((addon) => {
      const row = createElement('li');
      row.innerHTML = `<span>${addon.label}</span><strong>${formatMoney(addon.priceAmount, addon.currency)}</strong>`;
      return row;
    });
    refs.summaryAddonList.replaceChildren(...nodes);
  } else {
    const empty = createElement('li', 'is-pending');
    empty.innerHTML = '<span>No accessories selected</span><strong>Optional</strong>';
    refs.summaryAddonList.replaceChildren(empty);
  }

  const totals = getGrandTotal(state);
  refs.baseTotal.textContent = formatMoney(totals.baseTotal, totals.currency);
  refs.addonTotal.textContent = totals.addonTotal
    ? formatMoney(totals.addonTotal, totals.currency)
    : formatMoney(0, totals.currency);
  refs.grandTotal.textContent = formatMoney(totals.grandTotal, totals.currency);
  refs.summaryToggleTotal.textContent = formatMoney(totals.grandTotal, totals.currency);
  refs.mobileTotal.textContent = formatMoney(totals.grandTotal, totals.currency);

  const actionEnabled = areRequiredSelectionsComplete(state) && isProductConfigurationValid();
  const actionLabel = state.isAdding ? 'Adding to cart...' : state.config.primaryCtaLabel;

  [refs.primaryButton, refs.mobileButton].forEach((button) => {
    button.disabled = !actionEnabled || state.isAdding;
    button.textContent = actionLabel;
  });
}

function trackCurrentStep(state) {
  if (state.lastTrackedStep === state.stepIndex) return;
  const step = state.schema.steps[state.stepIndex];

  pushAnalyticsEvent('configurator_step_view', {
    configurator_id: state.schema.id,
    product_sku: state.product.sku,
    step_id: step.id,
    step_index: state.stepIndex + 1,
    step_label: step.label,
  });

  state.lastTrackedStep = state.stepIndex;
}

function renderAll(state, refs) {
  const values = getCurrentValues();
  state.options = normalizeProductOptions(state.product, values.optionsUIDs);
  syncSelectedAddons(state);
  renderStepNavigation(state, refs);
  renderCurrentStep(state, refs);
  renderPreview(state, refs);
  renderSummary(state, refs);
  trackCurrentStep(state);
}

async function handlePrimaryAction(state, refs) {
  if (state.isAdding) return;

  const requiredComplete = areRequiredSelectionsComplete(state);
  const valid = isProductConfigurationValid();

  if (!requiredComplete || !valid) {
    setStatus(refs, 'Select the required build options before adding this configuration to cart.', 'error');
    return;
  }

  const values = getCurrentValues();
  const selectedAddons = getSelectedAddons(state);
  const totals = getGrandTotal(state);
  const items = buildCartItems(values, selectedAddons, totals.quantity).filter((item) => item.sku);

  if (!items[0]?.sku) {
    setStatus(refs, 'The base product SKU could not be resolved for cart submission.', 'error');
    return;
  }

  state.isAdding = true;
  renderSummary(state, refs);
  setStatus(refs, 'Submitting the configured build to cart…', 'info');

  try {
    await addProductsToCart(items);
    setStatus(refs, 'Configured build added to cart.', 'success');

    pushAnalyticsEvent('configurator_add_to_cart', {
      configurator_id: state.schema.id,
      base_sku: values.sku,
      addon_skus: selectedAddons.map((addon) => addon.sku),
      quantity: totals.quantity,
      total_value: totals.grandTotal,
    });
  } catch (error) {
    setStatus(refs, error?.message || 'Unable to add this build to cart right now.', 'error');
  } finally {
    state.isAdding = false;
    renderSummary(state, refs);
  }
}

function attachEventListeners(state, refs, block) {
  refs.backButton.addEventListener('click', () => {
    state.stepIndex = Math.max(0, state.stepIndex - 1);
    renderAll(state, refs);
  });

  refs.nextButton.addEventListener('click', () => {
    state.stepIndex = Math.min(state.schema.steps.length - 1, state.stepIndex + 1);
    renderAll(state, refs);
  });

  refs.summaryToggle.addEventListener('click', () => {
    const nextOpen = block.dataset.summaryOpen !== 'true';
    block.dataset.summaryOpen = nextOpen ? 'true' : 'false';
    refs.summaryToggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  });

  refs.primaryButton.addEventListener('click', () => handlePrimaryAction(state, refs));
  refs.mobileButton.addEventListener('click', () => handlePrimaryAction(state, refs));
  refs.secondaryLink.addEventListener('click', () => {
    pushAnalyticsEvent('configurator_consult_click', {
      configurator_id: state.schema.id,
      product_sku: state.product.sku,
      href: refs.secondaryLink.href,
    });
  });

  block.addEventListener('input', (event) => {
    if (event.target.closest('.product-configurator-luxe__summary-quantity')) {
      window.requestAnimationFrame(() => renderSummary(state, refs));
    }
  });

  block.addEventListener('change', (event) => {
    if (event.target.closest('.product-configurator-luxe__summary-quantity')) {
      window.requestAnimationFrame(() => renderSummary(state, refs));
    }
  });

  events.on('pdp/data', (product) => {
    state.product = product;
    renderAll(state, refs);
  }, { eager: true });

  events.on('pdp/valid', () => {
    renderSummary(state, refs);
  }, { eager: true });
}

function normalizeConfig(block) {
  const config = readBlockConfig(block);
  const themeValue = String(config.theme || block.dataset.configTheme || '').trim().toLowerCase();
  const presentationValue = String(
    config.presentation || block.dataset.configPresentation || '',
  ).trim().toLowerCase();
  const theme = THEMES.has(themeValue)
    ? themeValue
    : DEFAULTS.theme;
  const presentation = PRESENTATIONS.has(presentationValue)
    ? presentationValue
    : DEFAULTS.presentation;

  return {
    eyebrowText: config['eyebrow-text']?.trim() || block.dataset.configEyebrowText || DEFAULTS.eyebrowText,
    title: config.title?.trim() || block.dataset.configTitle || DEFAULTS.title,
    subtitle: config.subtitle?.trim() || block.dataset.configSubtitle || DEFAULTS.subtitle,
    schemaUrl: config['schema-url']?.trim() || block.dataset.configSchemaUrl || '',
    primaryCtaLabel: config['primary-cta-label']?.trim()
      || block.dataset.configPrimaryCtaLabel
      || DEFAULTS.primaryCtaLabel,
    secondaryCtaLabel: config['secondary-cta-label']?.trim()
      || block.dataset.configSecondaryCtaLabel
      || DEFAULTS.secondaryCtaLabel,
    secondaryCtaHref: config['secondary-cta-href']?.trim()
      || block.dataset.configSecondaryCtaHref
      || DEFAULTS.secondaryCtaHref,
    theme,
    presentation,
  };
}

function persistConfig(block, config) {
  block.dataset.configSchemaUrl = config.schemaUrl;
  block.dataset.configEyebrowText = config.eyebrowText;
  block.dataset.configTitle = config.title;
  block.dataset.configSubtitle = config.subtitle;
  block.dataset.configPrimaryCtaLabel = config.primaryCtaLabel;
  block.dataset.configSecondaryCtaLabel = config.secondaryCtaLabel;
  block.dataset.configSecondaryCtaHref = config.secondaryCtaHref;
  block.dataset.configTheme = config.theme;
  block.dataset.configPresentation = config.presentation;
}

export default async function decorate(block) {
  try {
    const config = normalizeConfig(block);
    persistConfig(block, config);
    renderLoading(block);
    if (!config.schemaUrl) {
      throw new Error('A schema-url is required for product-configurator-luxe.');
    }

    const [schema, placeholders, product] = await Promise.all([
      loadSchema(config.schemaUrl),
      fetchPlaceholders('placeholders/pdp.json'),
      waitForProductData(),
    ]);

    const options = normalizeProductOptions(product, getCurrentValues().optionsUIDs);
    const compatibility = getConfiguratorCompatibility(schema, product, options);
    if (!compatibility.compatible) {
      console.info('product-configurator-luxe: skipping incompatible product', compatibility);
      renderIncompatible(block);
      return;
    }

    const addonCatalog = await loadAddonCatalog(schema);
    const state = {
      block,
      config,
      schema,
      placeholders,
      product,
      options,
      addonCatalog,
      advisorySelections: getInitialAdvisorySelections(schema),
      selectedAddons: new Set(),
      stepIndex: 0,
      lastTrackedStep: -1,
      isAdding: false,
    };

    syncSelectedAddons(state, { applyDefaults: true });

    const { fragment, refs } = buildShell(state);
    block.textContent = '';
    block.dataset.summaryOpen = 'false';
    block.dataset.presentation = state.config.presentation;
    block.append(fragment);

    await Promise.all([
      pdpRender.render(ProductPrice, {})(
        refs.priceMount,
      ),
      pdpRender.render(ProductQuantity, {})(
        refs.quantityMount,
      ),
    ]);

    attachEventListeners(state, refs, block);
    renderAll(state, refs);
    events.emit('pdp/configurator-ready', {
      block: 'product-configurator-luxe',
      status: 'ready',
      presentation: state.config.presentation,
    });
  } catch (error) {
    console.warn('product-configurator-luxe:', error);
    renderFailure(block, error?.message || 'Luxury configurator failed to initialize.');
  }
}
