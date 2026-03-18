import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import { fetchProductData, setEndpoint } from '@dropins/storefront-pdp/api.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { CS_FETCH_GRAPHQL, rootLink } from '../../scripts/commerce.js';
import { submitJson } from '../../scripts/submit-json.js';
import {
  DEFAULT_DATA_SOURCE,
  MEASUREMENT_ORDER,
  RUSH_EXTRA_ID,
  buildLineItems,
  computeTotal,
  createInitialState,
  createSubmitPayload,
  escapeHtml,
  formatCurrency,
  getRushExtra,
  getStepLabels,
  getSelectedMedalPackage,
  getSelectedRank,
  mapRankPreview,
  normalizeDataset,
  toIdSegment,
  validateStepsUpTo,
} from './uniform-configurator.lib.js';
import {
  buildCommerceContractIndex,
  createUniformCommerceCartItem,
  mergeCommerceContractProduct,
  shouldAttemptCoreCustomizableFallback,
  validateCommerceProductContract,
} from './uniform-configurator.commerce.js';
import { fetchCoreCustomizableCommerceProduct } from './uniform-configurator.commerce-core.js';

const SOURCE_HOSTS = new Set(['da.live', 'www.da.live', 'content.da.live']);

const DEFAULT_CONFIG = {
  eyebrow: 'Marine Corps Uniform Division',
  title: 'Officer Dress Blues\nPackage Builder',
  subtitle: 'Configure your complete male officer blue dress uniform to USMC regulation standards with real-time pricing and a live visual preview.',
  dataSource: DEFAULT_DATA_SOURCE,
  sku: '',
  submitUrl: '',
  successTitle: 'Order Submitted',
  successMessage: 'Your Blue Dress Package is now in production. Our veteran uniform team will review your specifications and reach out within 24 hours to confirm details.',
  analyticsId: 'marine-officer-dress-blues',
};

function getStepMeta(commerceMode = false) {
  return [
    {
      step: 1,
      title: 'Select Your Garments',
      subtitle: 'Choose the core components of your officer dress blues package.',
    },
    {
      step: 2,
      title: 'Footwear, Belt & Cover',
      subtitle: 'Select optional add-ons and sizes for your remaining components.',
    },
    {
      step: 3,
      title: 'Rank & Insignia',
      subtitle: 'Select your rank to update the live preview and required hardware.',
    },
    {
      step: 4,
      title: 'Medals, Ribbons & Badges',
      subtitle: 'Toggle the awards and insignia needed for this uniform package.',
    },
    {
      step: 5,
      title: commerceMode ? 'Measurements & Notes' : 'Contact & Measurements',
      subtitle: commerceMode
        ? 'Provide optional measurements and tailoring instructions for the Commerce order item.'
        : 'Provide order details and optional fit measurements for tailoring.',
    },
    {
      step: 6,
      title: commerceMode ? 'Review & Cart' : 'Order Review',
      subtitle: commerceMode
        ? 'Review your package and add it directly to your Adobe Commerce cart.'
        : 'Review your package and submit the full configuration to our team.',
    },
  ];
}

function showBlockMessage(block, type, message) {
  const messageEl = document.createElement('p');
  messageEl.className = 'uniform-configurator-block-message';
  messageEl.dataset.type = type;
  messageEl.textContent = message;
  block.replaceChildren(messageEl);
}

function getConfig(block) {
  const config = readBlockConfig(block);
  const normalizeMultiline = (value, fallback) => (value || fallback || '').trim().replace(/\\n/g, '\n');
  const normalizeSingleLine = (value, fallback) => (value || fallback || '').trim();

  return {
    eyebrow: normalizeSingleLine(config.eyebrow, DEFAULT_CONFIG.eyebrow),
    title: normalizeMultiline(config.title, DEFAULT_CONFIG.title),
    subtitle: normalizeMultiline(config.subtitle, DEFAULT_CONFIG.subtitle),
    dataSource: normalizeSingleLine(config['data-source'], DEFAULT_CONFIG.dataSource),
    sku: normalizeSingleLine(config.sku, DEFAULT_CONFIG.sku),
    submitUrl: normalizeSingleLine(config['submit-url'], DEFAULT_CONFIG.submitUrl),
    successTitle: normalizeSingleLine(config['success-title'], DEFAULT_CONFIG.successTitle),
    successMessage: normalizeMultiline(config['success-message'], DEFAULT_CONFIG.successMessage),
    analyticsId: normalizeSingleLine(config['analytics-id'], DEFAULT_CONFIG.analyticsId),
  };
}

function resolveDataSourceUrl(rawSource) {
  const source = (rawSource || DEFAULT_DATA_SOURCE).trim();
  const url = new URL(source, window.location.origin);

  if (!/\.json($|\?)/i.test(url.pathname)) {
    throw new Error('Uniform configurator data source must point to a JSON file.');
  }

  if (url.origin === window.location.origin) {
    return url.toString();
  }

  if (!SOURCE_HOSTS.has(url.hostname)) {
    throw new Error('Uniform configurator data source must be repo-relative or hosted on da.live.');
  }

  return url.toString();
}

async function fetchDataset(rawSource) {
  const source = resolveDataSourceUrl(rawSource);
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load configurator data (${response.status}).`);
  }

  return normalizeDataset(await response.json());
}

function track(runtime, eventName, payload = {}) {
  const basePayload = {
    analyticsId: runtime.config.analyticsId || runtime.data.id,
    configuratorId: runtime.data.id,
    configuratorVersion: runtime.data.version,
    stepIndex: runtime.state.step,
    stepLabel: runtime.stepLabels[runtime.state.step - 1],
  };

  if (window.adobeDataLayer && typeof window.adobeDataLayer.push === 'function') {
    window.adobeDataLayer.push({
      event: eventName,
      eventInfo: {
        ...basePayload,
        ...payload,
      },
    });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...basePayload,
      ...payload,
    });
  }
}

function emitRuntimeEvent(runtime, eventName, payload = {}) {
  track(runtime, eventName, payload);
  runtime.block.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail: payload,
  }));
}

function formatHeading(title) {
  const lines = String(title || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return '';
  }

  return lines.map((line, index) => {
    const accentClass = lines.length > 1 && index === lines.length - 1
      ? ' cfg-hero__title-line--accent'
      : '';
    return `<span class="cfg-hero__title-line${accentClass}">${escapeHtml(line)}</span>`;
  }).join('');
}

function createMonogram(label, maxLetters = 2) {
  const words = String(label || '')
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  if (!words.length) {
    return '';
  }

  if (words.length === 1) {
    return words[0].slice(0, maxLetters).toUpperCase();
  }

  return words
    .slice(0, maxLetters)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function renderHeroHighlights(commerceMode) {
  const items = [
    'Regulation Ready',
    'Live Package Total',
    commerceMode ? 'Cart-Ready Checkout' : 'Tailoring Review',
  ];

  return items.map((item) => (
    `<span class="cfg-hero__chip">${escapeHtml(item)}</span>`
  )).join('');
}

function renderPanelLead(meta, label) {
  return `
    <div class="cfg-panel__meta">
      <span class="cfg-panel__step">Step ${meta.step}</span>
      <span class="cfg-panel__kicker">${escapeHtml(label)}</span>
    </div>
  `;
}

function renderSelectOptions(options, selectedValue = '') {
  const emptyOption = '<option value="">— Select —</option>';
  const optionMarkup = options.map((option) => `
    <option value="${escapeHtml(option.value)}"${option.value === selectedValue ? ' selected' : ''}>
      ${escapeHtml(option.label)}
    </option>
  `);

  return [emptyOption, ...optionMarkup].join('');
}

function renderStepButtons(labels, state) {
  return labels.map((label, index) => {
    const step = index + 1;
    const activeClass = step === state.step ? ' active' : '';
    return `
      <button
        class="step-btn${activeClass}"
        type="button"
        data-step="${step}"
        aria-selected="${step === state.step ? 'true' : 'false'}"
      >
        <span class="step-btn__num">${step}</span>
        <span class="step-btn__label">${escapeHtml(label)}</span>
      </button>
    `;
  }).join('');
}

function renderNotice(notice, icon) {
  return `
    <div class="reg-notice">
      <span class="reg-notice__icon">${icon}</span>
      <div class="reg-notice__text">
        <strong>${escapeHtml(notice.title)}</strong>
        ${escapeHtml(notice.text)}
      </div>
    </div>
  `;
}

function renderFieldError(key) {
  return `<p class="field__error" data-error-for="${escapeHtml(key)}" hidden></p>`;
}

function renderSelectField({
  key,
  id,
  label,
  options,
  value,
  hint = '',
  note = '',
}) {
  return `
    <div class="field" data-field="${escapeHtml(key)}">
      <label class="field__label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
      ${hint ? `<span class="field__hint">${escapeHtml(hint)}</span>` : ''}
      <select id="${escapeHtml(id)}" data-state-key="${escapeHtml(key)}">
        ${renderSelectOptions(options, value)}
      </select>
      ${note ? `<span class="field__note">${escapeHtml(note)}</span>` : ''}
      ${renderFieldError(key)}
    </div>
  `;
}

function renderInputField({
  key,
  id,
  label,
  type = 'text',
  value = '',
  placeholder = '',
  maxLength = '',
}) {
  const maxLengthAttr = maxLength ? ` maxlength="${escapeHtml(maxLength)}"` : '';

  return `
    <div class="field" data-field="${escapeHtml(key)}">
      <label class="field__label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
      <input
        id="${escapeHtml(id)}"
        type="${escapeHtml(type)}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}"
        data-state-key="${escapeHtml(key)}"${maxLengthAttr}
      >
      ${renderFieldError(key)}
    </div>
  `;
}

function renderTextareaField({
  key, id, label, value = '', placeholder = '',
}) {
  return `
    <div class="field field--full" data-field="${escapeHtml(key)}">
      <label class="field__label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
      <textarea
        id="${escapeHtml(id)}"
        data-state-key="${escapeHtml(key)}"
        placeholder="${escapeHtml(placeholder)}"
      >${escapeHtml(value)}</textarea>
      ${renderFieldError(key)}
    </div>
  `;
}

function renderBuckleCards(data, state) {
  return data.options.belt.buckleStyles.map((style) => {
    const selected = state.selections.buckleStyle === style.id;
    return `
      <label class="card-opt${selected ? ' selected' : ''}">
        <input
          type="radio"
          name="buckleStyle"
          value="${escapeHtml(style.id)}"
          ${selected ? 'checked' : ''}
        >
        <span class="card-opt__icon card-opt__icon--metric">${escapeHtml(createMonogram(style.label, style.label.length <= 3 ? 3 : 2))}</span>
        <span class="card-opt__name">${escapeHtml(style.label)}</span>
        <span class="card-opt__price">
          ${style.price ? `+${formatCurrency(style.price, data.currency)}` : escapeHtml(style.description)}
        </span>
      </label>
    `;
  }).join('');
}

function renderRankGlyph(rank) {
  if (rank.preview.type === 'stars') {
    return `<span class="star-insignia">${escapeHtml('★'.repeat(rank.preview.count))}</span>`;
  }

  if (rank.preview.type === 'bars') {
    return Array.from({ length: rank.preview.count }).map(() => '<span class="bar"></span>').join('');
  }

  return Array.from({ length: rank.preview.count }).map(() => '<span class="pip"></span>').join('');
}

function renderRankCards(data, state) {
  return data.ranks.map((rank) => {
    const selected = state.selections.rank === rank.id;
    return `
      <label class="rank-card${selected ? ' selected' : ''}" data-rank-id="${escapeHtml(rank.id)}">
        <input
          type="radio"
          name="rank"
          value="${escapeHtml(rank.id)}"
          ${selected ? 'checked' : ''}
        >
        <div class="rank-card__insignia">${renderRankGlyph(rank)}</div>
        <div class="rank-card__title">${escapeHtml(rank.label)}</div>
        <div class="rank-card__abbr">${escapeHtml(rank.payGrade)}</div>
      </label>
    `;
  }).join('');
}

function renderMedalCards(data, state) {
  return data.medalPackages.map((pkg) => {
    const selected = state.selections.medalPackage === pkg.id;
    const displayPrice = pkg.price ? formatCurrency(pkg.price, data.currency) : '$0';
    const previewLabel = pkg.previewCount ? String(pkg.previewCount).padStart(2, '0') : '00';

    return `
      <label class="card-opt${selected ? ' selected' : ''}">
        <input
          type="radio"
          name="medalPackage"
          value="${escapeHtml(pkg.id)}"
          ${selected ? 'checked' : ''}
        >
        <span class="card-opt__icon card-opt__icon--metric">${escapeHtml(previewLabel)}</span>
        <span class="card-opt__name">${escapeHtml(pkg.label)}</span>
        <span class="card-opt__price">${escapeHtml(displayPrice)}</span>
      </label>
    `;
  }).join('');
}

function renderExtraToggles(data, state) {
  return data.extras
    .filter((extra) => extra.id !== RUSH_EXTRA_ID)
    .map((extra) => `
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-info__title">${escapeHtml(extra.label)}</div>
          <div class="toggle-info__sub">${escapeHtml(extra.description)}</div>
          <div class="toggle-info__price">+${formatCurrency(extra.price, data.currency)}</div>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            data-extra-id="${escapeHtml(extra.id)}"
            ${state.selections.extras[extra.id] ? 'checked' : ''}
          >
          <span class="toggle-track"></span>
        </label>
      </div>
    `)
    .join('');
}

function renderMeasurementFields(data, state) {
  return MEASUREMENT_ORDER.map((key) => {
    const measurement = data.measurements[key];

    return `
      <div class="measure-field" data-field="${escapeHtml(key)}">
        <label class="measure-field__label" for="uc-measure-${escapeHtml(key)}">
          ${escapeHtml(measurement.label)}
        </label>
        <div class="measure-field__input-wrap">
          <input
            id="uc-measure-${escapeHtml(key)}"
            type="number"
            min="${measurement.min}"
            max="${measurement.max}"
            step="${measurement.step}"
            value="${escapeHtml(state.measurements[key])}"
            placeholder="${escapeHtml(measurement.placeholder)}"
            data-measurement-key="${escapeHtml(key)}"
          >
          <span class="measure-field__unit">${escapeHtml(measurement.unit)}</span>
        </div>
        ${renderFieldError(key)}
      </div>
    `;
  }).join('');
}

function renderShippingStateOptions(data, state) {
  return renderSelectOptions(data.shippingStates, state.selections.shippingState);
}

function renderUniformFigure() {
  const medalSlots = Array.from({ length: 12 }).map((_, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const x = 72 + (col * 10);
    const y = 148 + (row * 8);
    return `
      <rect
        class="svg-medal"
        data-medal-slot="${index + 1}"
        x="${x}"
        y="${y}"
        width="8"
        height="6"
        rx="1"
        opacity="0"
      />
    `;
  }).join('');

  return `
    <svg class="uniform-svg" viewBox="0 0 180 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="svg-cover-group">
        <ellipse class="svg-cover" cx="90" cy="35" rx="38" ry="10"/>
        <rect class="svg-cover" x="52" y="25" width="76" height="14" rx="2"/>
        <rect class="svg-cover-peak" x="50" y="36" width="80" height="4" rx="1"/>
        <line x1="52" y1="28" x2="128" y2="28" stroke="#c9a84c" stroke-width="1.5" opacity="0.7"/>
      </g>
      <ellipse class="svg-skin" cx="90" cy="60" rx="22" ry="26"/>
      <rect class="svg-skin" x="82" y="82" width="16" height="12"/>
      <path class="svg-shirt" d="M74 90 L90 86 L106 90 L106 95 L90 91 L74 95 Z"/>
      <path class="svg-coat" d="M50 92 Q45 100 42 130 L38 230 L60 235 L60 300 L120 300 L120 235 L142 230 L138 130 Q135 100 130 92 L106 90 L90 100 L74 90 Z"/>
      <path class="svg-shirt" d="M74 90 L90 108 L90 145 L74 145 L68 92 Z" opacity="0.9"/>
      <path class="svg-shirt" d="M106 90 L90 108 L90 145 L106 145 L112 92 Z" opacity="0.9"/>
      <rect class="svg-gold-trim" x="42" y="217" width="18" height="5" rx="1"/>
      <rect class="svg-gold-trim" x="120" y="217" width="18" height="5" rx="1"/>
      <line x1="60" y1="90" x2="55" y2="235" stroke="#c9a84c" stroke-width="1.2" opacity="0.5"/>
      <line x1="120" y1="90" x2="125" y2="235" stroke="#c9a84c" stroke-width="1.2" opacity="0.5"/>
      <g id="svg-rank-group">
        <rect class="svg-rank-bar" id="r-bar-l1" x="46" y="96" width="16" height="3" rx="1" opacity="0"/>
        <rect class="svg-rank-bar" id="r-bar-l2" x="46" y="101" width="16" height="3" rx="1" opacity="0"/>
        <rect class="svg-rank-bar" id="r-bar-l3" x="46" y="106" width="16" height="3" rx="1" opacity="0"/>
        <rect class="svg-rank-bar" id="r-bar-r1" x="118" y="96" width="16" height="3" rx="1" opacity="0"/>
        <rect class="svg-rank-bar" id="r-bar-r2" x="118" y="101" width="16" height="3" rx="1" opacity="0"/>
        <rect class="svg-rank-bar" id="r-bar-r3" x="118" y="106" width="16" height="3" rx="1" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-l1" cx="52" cy="97" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-l2" cx="60" cy="97" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-l3" cx="52" cy="105" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-l4" cx="60" cy="105" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-r1" cx="122" cy="97" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-r2" cx="130" cy="97" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-r3" cx="122" cy="105" r="3.5" opacity="0"/>
        <circle class="svg-rank-pip" id="r-pip-r4" cx="130" cy="105" r="3.5" opacity="0"/>
        <text id="r-stars-left" class="rank-label-svg" x="45" y="106" opacity="0">★</text>
        <text id="r-stars-right" class="rank-label-svg" x="115" y="106" opacity="0">★</text>
      </g>
      <g id="svg-medals-group">
        <rect id="medal-row-bg" x="70" y="144" width="46" height="26" rx="4" fill="#8b7355" opacity="0"/>
        ${medalSlots}
      </g>
      <rect class="svg-belt" id="svg-belt" x="58" y="196" width="64" height="9" rx="2"/>
      <rect x="82" y="197" width="16" height="7" rx="1" fill="#c9a84c"/>
      <rect x="84" y="199" width="12" height="3" rx="0.5" fill="#0e1410"/>
      <path class="svg-trouser" d="M60 298 L60 390 L82 390 L90 345 L98 390 L120 390 L120 298 Z"/>
      <line x1="65" y1="300" x2="65" y2="388" stroke="#c9a84c" stroke-width="2" opacity="0.7"/>
      <line x1="115" y1="300" x2="115" y2="388" stroke="#c9a84c" stroke-width="2" opacity="0.7"/>
      <ellipse class="svg-shoes" cx="73" cy="395" rx="16" ry="7"/>
      <ellipse class="svg-shoes" cx="107" cy="395" rx="16" ry="7"/>
      <path class="svg-coat" d="M42 92 Q28 110 26 160 L26 222 L44 222 L44 160 Q46 115 50 94 Z"/>
      <path class="svg-coat" d="M138 92 Q152 110 154 160 L154 222 L136 222 L136 160 Q134 115 130 94 Z"/>
      <ellipse cx="35" cy="228" rx="9" ry="8" fill="#d4a574"/>
      <ellipse cx="145" cy="228" rx="9" ry="8" fill="#d4a574"/>
      <circle cx="90" cy="150" r="2.5" fill="#c9a84c"/>
      <circle cx="90" cy="162" r="2.5" fill="#c9a84c"/>
      <circle cx="90" cy="174" r="2.5" fill="#c9a84c"/>
      <circle cx="90" cy="186" r="2.5" fill="#c9a84c"/>
    </svg>
  `;
}

function renderRushToggle(data, state) {
  const rushExtra = getRushExtra(data);
  if (!rushExtra) return '';

  return `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-info__title">${escapeHtml(rushExtra.label)}</div>
        <div class="toggle-info__sub">${escapeHtml(rushExtra.description)}</div>
        <div class="toggle-info__price">+${formatCurrency(rushExtra.price, data.currency)}</div>
      </div>
      <label class="toggle-switch">
        <input
          type="checkbox"
          id="uc-rush-toggle"
          ${state.selections.rushTailoring ? 'checked' : ''}
        >
        <span class="toggle-track"></span>
      </label>
    </div>
  `;
}

function createShell(runtime) {
  const {
    config,
    data,
    state,
    commerceMode,
    stepLabels,
    stepMeta,
  } = runtime;
  const stepFourCta = commerceMode ? 'Measurements →' : 'Contact Info →';
  const stepFiveCta = commerceMode ? 'Review Package →' : 'Review Order →';
  const submitLabel = commerceMode ? 'Add Package to Cart' : 'Place Order';
  const contactSection = commerceMode ? '' : `
            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">CT</span> Contact Information</div>
              <div class="field-grid field-grid--2">
                ${renderInputField({
    key: 'firstName',
    id: 'uc-first-name',
    label: 'First Name',
    value: state.selections.firstName,
    placeholder: 'John',
  })}
                ${renderInputField({
    key: 'lastName',
    id: 'uc-last-name',
    label: 'Last Name',
    value: state.selections.lastName,
    placeholder: 'Smith',
  })}
                ${renderInputField({
    key: 'email',
    id: 'uc-email',
    label: 'Email',
    type: 'email',
    value: state.selections.email,
    placeholder: 'j.smith@marines.mil',
  })}
                ${renderInputField({
    key: 'phone',
    id: 'uc-phone',
    label: 'Phone',
    type: 'tel',
    value: state.selections.phone,
    placeholder: '(760) 555-0100',
  })}
              </div>

              <div class="toggle-row toggle-row--shipping">
                <div class="toggle-info">
                  <div class="toggle-info__title">Override Shipping Address</div>
                  <div class="toggle-info__sub">Ship to a different address than billing (base, BOQ, or ceremony location).</div>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    id="uc-shipping-toggle"
                    ${state.selections.shippingOverride ? 'checked' : ''}
                  >
                  <span class="toggle-track"></span>
                </label>
              </div>

              <div class="shipping-section" id="uc-shipping-section">
                <div class="field-grid field-grid--2">
                  ${renderInputField({
    key: 'shippingAddress',
    id: 'uc-shipping-address',
    label: 'Street Address / Unit',
    value: state.selections.shippingAddress,
    placeholder: 'Building 1234, MCB Quantico',
  })}
                  ${renderInputField({
    key: 'shippingCity',
    id: 'uc-shipping-city',
    label: 'City',
    value: state.selections.shippingCity,
    placeholder: 'Quantico',
  })}
                  <div class="field" data-field="shippingState">
                    <label class="field__label" for="uc-shipping-state">State</label>
                    <select id="uc-shipping-state" data-state-key="shippingState">
                      ${renderShippingStateOptions(data, state)}
                    </select>
                    ${renderFieldError('shippingState')}
                  </div>
                  ${renderInputField({
    key: 'shippingZip',
    id: 'uc-shipping-zip',
    label: 'ZIP Code',
    value: state.selections.shippingZip,
    placeholder: '22134',
    maxLength: '10',
  })}
                </div>
              </div>
            </div>
  `;
  const successSection = commerceMode ? '' : `
          <div class="cfg-success" id="uc-success" hidden>
            <div class="success-icon">✓</div>
            <h2 class="success-title">${escapeHtml(config.successTitle)}</h2>
            <p class="success-sub">${escapeHtml(config.successMessage)}</p>
            <button class="btn btn-primary" type="button" data-reset-configurator>Build Another Package</button>
          </div>
  `;

  return `
    <div class="uniform-configurator__shell">
      <header class="cfg-hero">
        <div class="cfg-hero__eyebrow">${escapeHtml(config.eyebrow)}</div>
        <h1 class="cfg-hero__title">${formatHeading(config.title)}</h1>
        <p class="cfg-hero__sub">${escapeHtml(config.subtitle)}</p>
        <div class="cfg-hero__highlights" aria-label="Configurator highlights">
          ${renderHeroHighlights(commerceMode)}
        </div>
      </header>

      <nav class="cfg-steps-nav" aria-label="Configuration steps">
        <div class="steps-track" role="tablist">
          ${renderStepButtons(stepLabels, state)}
        </div>
      </nav>

      <div class="cfg-layout">
        <aside class="cfg-preview" aria-label="Live uniform preview">
          <div class="cfg-preview__header">
            <h3>Live Preview</h3>
            <span class="cfg-preview__badge" id="uc-rank-label">Select Rank</span>
          </div>
          <figure class="cfg-preview__figure" aria-hidden="true">
            ${renderUniformFigure()}
          </figure>
          <div class="cfg-preview__price">
            <div class="price-label">Package Total</div>
            <div class="price-total">
              <span id="uc-price-total">$0</span>
            </div>
            <div class="price-breakdown" id="uc-price-breakdown"></div>
          </div>
        </aside>

        <div class="cfg-form-area" role="region" aria-label="Uniform configurator form">
          <div class="cfg-fatal-error" id="uc-contract-error" hidden></div>

          <section class="cfg-panel active" data-panel="1" role="tabpanel">
            ${renderPanelLead(stepMeta[0], stepLabels[0])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[0].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[0].subtitle)}</p>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">DC</span> Dress Coat</div>
              <div class="field-grid field-grid--2">
                ${renderSelectField({
    key: 'coatLength',
    id: 'uc-coat-length',
    label: 'Coat Length',
    options: data.options.coat.length,
    value: state.selections.coatLength,
  })}
                ${renderSelectField({
    key: 'coatSize',
    id: 'uc-coat-size',
    label: 'Coat Size',
    options: data.options.coat.size,
    value: state.selections.coatSize,
  })}
              </div>
              ${renderNotice(data.notices.coat, '!')}
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">DT</span> Dress Trousers</div>
              <div class="field-grid field-grid--2">
                ${renderSelectField({
    key: 'trouserWaist',
    id: 'uc-trouser-waist',
    label: 'Waist',
    options: data.options.trouser.waist,
    value: state.selections.trouserWaist,
  })}
                ${renderSelectField({
    key: 'trouserInseam',
    id: 'uc-trouser-inseam',
    label: 'Inseam',
    options: data.options.trouser.inseam,
    value: state.selections.trouserInseam,
  })}
              </div>
              <div class="toggle-row toggle-row--locked">
                <div class="toggle-info">
                  <div class="toggle-info__title">Scarlet Blood Stripe</div>
                  <div class="toggle-info__sub">Required for officer dress trousers and included in the base package.</div>
                  <div class="toggle-info__price">Included</div>
                </div>
                <span class="cfg-static-chip">Regulation</span>
              </div>
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">SC</span> Dress Shirt &amp; Collar</div>
              <div class="field-grid field-grid--3">
                ${renderSelectField({
    key: 'shirtNeck',
    id: 'uc-shirt-neck',
    label: 'Neck (inches)',
    options: data.options.shirt.neck,
    value: state.selections.shirtNeck,
  })}
                ${renderSelectField({
    key: 'shirtSleeve',
    id: 'uc-shirt-sleeve',
    label: 'Sleeve (inches)',
    options: data.options.shirt.sleeve,
    value: state.selections.shirtSleeve,
  })}
                ${renderSelectField({
    key: 'collarStrip',
    id: 'uc-collar-strip',
    label: 'Collar Strip',
    options: data.options.shirt.collarStrip,
    value: state.selections.collarStrip,
  })}
              </div>
            </div>

            <div class="cfg-actions">
              <span></span>
              <button class="btn btn-primary" type="button" data-go-step="2">Continue to Sizing →</button>
            </div>
          </section>

          <section class="cfg-panel" data-panel="2" role="tabpanel" hidden>
            ${renderPanelLead(stepMeta[1], stepLabels[1])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[1].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[1].subtitle)}</p>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">OX</span> Oxford Dress Shoes</div>
              <div class="field-grid field-grid--2">
                ${renderSelectField({
    key: 'shoeSize',
    id: 'uc-shoe-size',
    label: 'Shoe Size',
    options: data.options.shoes.size,
    value: state.selections.shoeSize,
  })}
                ${renderSelectField({
    key: 'shoeWidth',
    id: 'uc-shoe-width',
    label: 'Width',
    options: data.options.shoes.width,
    value: state.selections.shoeWidth,
  })}
              </div>
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">BB</span> Belt &amp; Buckle</div>
              <div class="field-grid field-grid--2">
                ${renderSelectField({
    key: 'beltSize',
    id: 'uc-belt-size',
    label: 'Belt Size',
    options: data.options.belt.size,
    value: state.selections.beltSize,
    note: 'Black web belt with gold-finish USMC EGA buckle',
  })}
                <div class="field">
                  <span class="field__label">Buckle Style</span>
                  <div class="card-selector card-selector--split">
                    ${renderBuckleCards(data, state)}
                  </div>
                </div>
              </div>
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">CV</span> Officer Service Cover</div>
              <div class="field-grid field-grid--2">
                ${renderSelectField({
    key: 'coverSize',
    id: 'uc-cover-size',
    label: 'Cover Size',
    options: data.options.cover.size,
    value: state.selections.coverSize,
  })}
                ${renderSelectField({
    key: 'frameSize',
    id: 'uc-frame-size',
    label: 'Frame Size',
    options: data.options.frame.size,
    value: state.selections.frameSize,
    hint: 'Interior support frame for proper cover shape',
  })}
              </div>
            </div>

            <div class="cfg-actions">
              <button class="btn btn-secondary" type="button" data-go-step="1">← Back</button>
              <button class="btn btn-primary" type="button" data-go-step="3">Rank &amp; Insignia →</button>
            </div>
          </section>

          <section class="cfg-panel" data-panel="3" role="tabpanel" hidden>
            ${renderPanelLead(stepMeta[2], stepLabels[2])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[2].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[2].subtitle)}</p>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">RK</span> Officer Rank</div>
              <div class="rank-grid" data-field="rank">
                ${renderRankCards(data, state)}
              </div>
              ${renderFieldError('rank')}
              ${renderNotice(data.notices.rank, '§')}
            </div>

            <div class="cfg-actions">
              <button class="btn btn-secondary" type="button" data-go-step="2">← Back</button>
              <button class="btn btn-primary" type="button" data-go-step="4">Accessories →</button>
            </div>
          </section>

          <section class="cfg-panel" data-panel="4" role="tabpanel" hidden>
            ${renderPanelLead(stepMeta[3], stepLabels[3])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[3].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[3].subtitle)}</p>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">MD</span> Medal Package</div>
              <div class="card-selector card-selector--medals">
                ${renderMedalCards(data, state)}
              </div>
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">AI</span> Additional Insignia</div>
              ${renderExtraToggles(data, state)}
            </div>

            <div class="cfg-actions">
              <button class="btn btn-secondary" type="button" data-go-step="3">← Back</button>
              <button class="btn btn-primary" type="button" data-go-step="5">${escapeHtml(stepFourCta)}</button>
            </div>
          </section>

          <section class="cfg-panel" data-panel="5" role="tabpanel" hidden>
            ${renderPanelLead(stepMeta[4], stepLabels[4])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[4].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[4].subtitle)}</p>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">MT</span> Body Measurements</div>
              <p class="cfg-inline-copy">Measurements are optional in v1, but any values entered must be within the allowed range.</p>
              <div class="measure-grid">
                ${renderMeasurementFields(data, state)}
              </div>
            </div>

            ${contactSection}

            ${renderTextareaField({
    key: 'notes',
    id: 'uc-notes',
    label: 'Special Instructions',
    value: state.selections.notes,
    placeholder: 'Ceremony date, tailoring notes, or fulfillment details...',
  })}

            <div class="cfg-actions">
              <button class="btn btn-secondary" type="button" data-go-step="4">← Back</button>
              <button class="btn btn-primary" type="button" data-go-step="6">${escapeHtml(stepFiveCta)}</button>
            </div>
          </section>

          <section class="cfg-panel" data-panel="6" role="tabpanel" hidden>
            ${renderPanelLead(stepMeta[5], stepLabels[5])}
            <h2 class="cfg-panel__title">${escapeHtml(stepMeta[5].title)}</h2>
            <p class="cfg-panel__sub">${escapeHtml(stepMeta[5].subtitle)}</p>

            <div class="order-summary">
              <div class="order-summary__header">
                <h3>Officer Blue Dress Package</h3>
                <p>${commerceMode ? 'Ready to add to your Commerce cart' : 'Custom-tailored to your specifications'}</p>
              </div>
              <div class="order-summary__items" id="uc-summary-items"></div>
              <div class="summary-total-row">
                <span class="label">Package Total</span>
                <span class="amount" id="uc-summary-total">$0</span>
              </div>
            </div>

            <div class="cfg-section">
              <div class="cfg-section__title"><span class="cfg-section__icon">QA</span> Fulfillment</div>
              <div class="toggle-row toggle-row--locked">
                <div class="toggle-info">
                  <div class="toggle-info__title">Standard Processing</div>
                  <div class="toggle-info__sub">4–6 weeks with final quality assurance and regulation review.</div>
                  <div class="toggle-info__price">Included</div>
                </div>
                <span class="cfg-static-chip">Standard</span>
              </div>
              ${renderRushToggle(data, state)}
            </div>

            ${renderNotice(data.notices.fulfillment, '✦')}

            <p class="cfg-submit-error" id="uc-submit-error" hidden></p>

            <div class="cfg-actions">
              <button class="btn btn-secondary" type="button" data-go-step="5">← Back</button>
              <button class="btn btn-gold" type="button" data-submit-order>${escapeHtml(submitLabel)}</button>
            </div>
          </section>

          ${successSection}
        </div>
      </div>
    </div>
  `;
}

function updateStepUi(runtime) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');
  const stepButtons = root.querySelectorAll('.step-btn');
  const panels = root.querySelectorAll('.cfg-panel');
  const success = root.querySelector('#uc-success');
  const trackEl = root.querySelector('.steps-track');

  stepButtons.forEach((button, index) => {
    const step = index + 1;
    const completed = runtime.state.submissionState === 'success'
      ? true
      : step < runtime.state.step;

    button.classList.toggle('active', runtime.state.submissionState !== 'success' && step === runtime.state.step);
    button.classList.toggle('completed', completed);
    button.setAttribute('aria-selected', step === runtime.state.step ? 'true' : 'false');
  });

  if (trackEl) {
    const totalSteps = stepButtons.length || 1;
    const progressStep = runtime.state.submissionState === 'success'
      ? totalSteps
      : runtime.state.step;
    trackEl.style.setProperty('--uc-progress', `${(progressStep / totalSteps) * 100}%`);
  }

  panels.forEach((panel) => {
    const panelStep = Number(panel.dataset.panel);
    const isActive = runtime.state.submissionState !== 'success' && panelStep === runtime.state.step;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });

  if (success) {
    success.hidden = runtime.state.submissionState !== 'success';
    success.classList.toggle('active', runtime.state.submissionState === 'success');
  }
  root.querySelector('.cfg-steps-nav').classList.toggle(
    'cfg-steps-nav--muted',
    Boolean(success) && runtime.state.submissionState === 'success',
  );
}

function updateSelectableCards(runtime) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');

  root.querySelectorAll('.rank-card').forEach((card) => {
    const input = card.querySelector('input');
    const selected = input.value === runtime.state.selections.rank;
    input.checked = selected;
    card.classList.toggle('selected', selected);
  });

  root.querySelectorAll('input[name="medalPackage"]').forEach((input) => {
    const selected = input.value === runtime.state.selections.medalPackage;
    input.checked = selected;
    input.closest('.card-opt')?.classList.toggle('selected', selected);
  });

  root.querySelectorAll('input[name="buckleStyle"]').forEach((input) => {
    const selected = input.value === runtime.state.selections.buckleStyle;
    input.checked = selected;
    input.closest('.card-opt')?.classList.toggle('selected', selected);
  });

  root.querySelectorAll('[data-extra-id]').forEach((input) => {
    input.checked = !!runtime.state.selections.extras[input.dataset.extraId];
  });
}

function updateErrors(runtime) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');

  root.querySelectorAll('[data-error-for]').forEach((errorEl) => {
    const key = errorEl.dataset.errorFor;
    const message = runtime.state.errors[key];
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  });

  root.querySelectorAll('[data-field]').forEach((field) => {
    field.classList.toggle('field--invalid', !!runtime.state.errors[field.dataset.field]);
  });
}

function updateReview(runtime, lineItems, total) {
  const summaryItems = runtime.block.querySelector('#uc-summary-items');
  const summaryTotal = runtime.block.querySelector('#uc-summary-total');

  summaryItems.innerHTML = lineItems.map((item) => `
    <div class="summary-item">
      <div>
        <div class="summary-item__name">${escapeHtml(item.label)}</div>
        <div class="summary-item__detail">${escapeHtml(item.detail || 'Included')}</div>
      </div>
      <div class="summary-item__price">${escapeHtml(formatCurrency(item.price, runtime.data.currency))}</div>
    </div>
  `).join('');

  summaryTotal.textContent = formatCurrency(total, runtime.data.currency);
}

function updatePriceBreakdown(runtime, lineItems, total) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');
  const priceBreakdown = root.querySelector('#uc-price-breakdown');
  const priceTotal = root.querySelector('#uc-price-total');

  priceBreakdown.innerHTML = lineItems.map((item) => `
    <div class="price-row active">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(formatCurrency(item.price, runtime.data.currency))}</strong>
    </div>
  `).join('');

  if (runtime.previousTotal !== null && runtime.previousTotal !== total) {
    priceTotal.classList.remove('price-pulse');
    window.requestAnimationFrame(() => {
      priceTotal.classList.add('price-pulse');
    });
  }

  priceTotal.textContent = formatCurrency(total, runtime.data.currency);
  runtime.previousTotal = total;
}

function updatePreview(runtime, lineItems, total) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');
  const preview = mapRankPreview(getSelectedRank(runtime.data, runtime.state));
  const medalPackage = getSelectedMedalPackage(runtime.data, runtime.state);

  root.querySelector('#uc-rank-label').textContent = preview.shortLabel;

  root.querySelectorAll('[id^="r-pip"]').forEach((element) => {
    element.style.opacity = '0';
  });
  root.querySelectorAll('[id^="r-bar"]').forEach((element) => {
    element.style.opacity = '0';
  });

  const leftStars = root.querySelector('#r-stars-left');
  const rightStars = root.querySelector('#r-stars-right');
  leftStars.style.opacity = '0';
  rightStars.style.opacity = '0';

  if (preview.type === 'pips') {
    for (let index = 1; index <= preview.count; index += 1) {
      root.querySelector(`#r-pip-l${index}`)?.style.setProperty('opacity', '1');
      root.querySelector(`#r-pip-r${index}`)?.style.setProperty('opacity', '1');
    }
  }

  if (preview.type === 'bars') {
    for (let index = 1; index <= preview.count; index += 1) {
      root.querySelector(`#r-bar-l${index}`)?.style.setProperty('opacity', '1');
      root.querySelector(`#r-bar-r${index}`)?.style.setProperty('opacity', '1');
    }
  }

  if (preview.type === 'stars') {
    const stars = '★'.repeat(preview.count || 1);
    leftStars.textContent = stars;
    rightStars.textContent = stars;
    leftStars.style.opacity = '1';
    rightStars.style.opacity = '1';
  }

  const medalSlots = root.querySelectorAll('[data-medal-slot]');
  medalSlots.forEach((slot, index) => {
    slot.style.opacity = medalPackage && index < medalPackage.previewCount ? '1' : '0';
  });

  root.querySelector('#medal-row-bg').style.opacity = medalPackage && medalPackage.previewCount ? '1' : '0';
  root.querySelector('#svg-cover-group').style.opacity = runtime.state.selections.coverSize ? '1' : '0.18';
  root.querySelector('#svg-belt').style.opacity = runtime.state.selections.beltSize ? '1' : '0.18';

  updatePriceBreakdown(runtime, lineItems, total);
}

function updateShippingSection(runtime) {
  const shippingSection = runtime.block.querySelector('#uc-shipping-section');
  if (shippingSection) {
    shippingSection.classList.toggle('visible', runtime.state.selections.shippingOverride);
  }
}

function updateContractState(runtime) {
  const contractError = runtime.block.querySelector('#uc-contract-error');

  if (!contractError) {
    return;
  }

  contractError.hidden = true;
  contractError.replaceChildren();
}

function updateSubmitState(runtime) {
  const submitButton = runtime.block.querySelector('[data-submit-order]');
  const submitError = runtime.block.querySelector('#uc-submit-error');
  const contractBlocked = runtime.commerceMode && !runtime.contractValidation?.valid;

  if (submitButton) {
    const isSubmitting = runtime.state.submissionState === 'submitting';
    const defaultLabel = runtime.commerceMode ? 'Add Package to Cart' : 'Place Order';
    const submittingLabel = runtime.commerceMode ? 'Adding Package…' : 'Submitting…';

    submitButton.disabled = runtime.state.submissionState === 'submitting' || contractBlocked;
    submitButton.textContent = isSubmitting ? submittingLabel : defaultLabel;
  }

  submitError.hidden = !runtime.state.submitErrorMessage;
  submitError.textContent = runtime.state.submitErrorMessage;
}

function applyRuntimeLayout(runtime) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');
  if (!root) return;

  const layout = root.querySelector('.cfg-layout');
  const preview = root.querySelector('.cfg-preview');
  const previewFigure = root.querySelector('.cfg-preview__figure');
  const formArea = root.querySelector('.cfg-form-area');

  if (!layout || !preview || !previewFigure || !formArea) return;

  const measuredWidth = Math.max(
    root.getBoundingClientRect().width || 0,
    runtime.block.getBoundingClientRect().width || 0,
    0,
  );
  const effectiveWidth = measuredWidth || window.innerWidth || 0;
  const isWideLayout = effectiveWidth >= 1100;

  layout.style.display = 'flex';
  layout.style.flexDirection = isWideLayout ? 'row' : 'column';
  layout.style.flexWrap = 'nowrap';
  layout.style.alignItems = 'flex-start';
  layout.style.gap = isWideLayout ? 'var(--uc-layout-gap-desktop)' : 'var(--uc-layout-gap-mobile)';

  preview.style.order = '0';
  preview.style.position = isWideLayout ? 'sticky' : 'static';
  preview.style.top = isWideLayout ? '2.4rem' : '';
  preview.style.flex = isWideLayout ? '0 0 340px' : '1 1 auto';
  preview.style.width = isWideLayout ? '340px' : '100%';
  preview.style.maxWidth = isWideLayout ? '340px' : '100%';
  preview.style.alignSelf = isWideLayout ? 'flex-start' : 'stretch';

  previewFigure.style.minHeight = isWideLayout ? '29rem' : '22rem';

  formArea.style.order = '1';
  formArea.style.display = 'block';
  formArea.style.flex = isWideLayout ? '1 1 0' : '1 1 auto';
  formArea.style.width = isWideLayout ? 'auto' : '100%';
  formArea.style.maxWidth = 'none';
  formArea.style.minWidth = '0';
  formArea.style.margin = '0';
  formArea.style.padding = '0';

  formArea.querySelectorAll('.cfg-panel').forEach((panel) => {
    panel.style.width = '100%';
    panel.style.maxWidth = 'none';
    panel.style.minWidth = '0';
  });
}

function refresh(runtime) {
  let lineItems = [];
  let total = 0;

  try {
    lineItems = buildLineItems(runtime.data, runtime.state);
    total = computeTotal(lineItems);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('uniform-configurator: failed to build line items', error);
  }

  try {
    updateStepUi(runtime);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('uniform-configurator: failed to update step UI', error);
  }

  try {
    applyRuntimeLayout(runtime);
    updateSelectableCards(runtime);
    updateErrors(runtime);
    updatePreview(runtime, lineItems, total);
    updateReview(runtime, lineItems, total);
    updateShippingSection(runtime);
    updateContractState(runtime);
    updateSubmitState(runtime);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('uniform-configurator: refresh failed', error);
  }
}

function scrollToCurrentStep(runtime) {
  const panel = runtime.block.querySelector(`.cfg-panel[data-panel="${runtime.state.step}"]`);
  if (panel) {
    panel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

function focusField(runtime, key) {
  const root = runtime.block.querySelector('.uniform-configurator__shell');
  const input = root.querySelector(`[data-state-key="${key}"]`)
    || root.querySelector(`[data-measurement-key="${key}"]`)
    || root.querySelector(`input[name="${key}"]`)
    || root.querySelector(`#uc-${toIdSegment(key)}`);

  if (input) {
    input.focus();
    if (typeof input.scrollIntoView === 'function') {
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }
}

function navigateToStep(runtime, nextStep, shouldScroll = true) {
  const targetStep = Math.max(1, Math.min(6, nextStep));

  if (targetStep > runtime.state.step) {
    const validation = validateStepsUpTo(
      targetStep - 1,
      runtime.state,
      runtime.data,
      { commerceMode: runtime.commerceMode },
    );
    if (!validation.valid) {
      runtime.state.errors = {
        ...runtime.state.errors,
        ...validation.errors,
      };
      runtime.state.step = validation.firstInvalidStep;
      refresh(runtime);
      focusField(runtime, Object.keys(validation.errors)[0]);
      return;
    }
  }

  if (runtime.state.step !== targetStep) {
    runtime.state.step = targetStep;
    refresh(runtime);
    track(runtime, 'uniform_configurator_step_view', {
      stepIndex: runtime.state.step,
      stepLabel: runtime.stepLabels[runtime.state.step - 1],
    });
  }

  if (shouldScroll) {
    scrollToCurrentStep(runtime);
  }
}

function shouldTrackChange(key) {
  return ![
    'firstName',
    'lastName',
    'email',
    'phone',
    'shippingAddress',
    'shippingCity',
    'shippingState',
    'shippingZip',
    'notes',
    ...MEASUREMENT_ORDER,
  ].includes(key);
}

function clearErrors(runtime, keys) {
  keys.forEach((key) => {
    delete runtime.state.errors[key];
  });
}

function updateSelection(runtime, key, value) {
  runtime.state.selections[key] = value;
  clearErrors(runtime, [key]);

  if (key === 'shoeSize' && !value) {
    runtime.state.selections.shoeWidth = '';
    clearErrors(runtime, ['shoeWidth']);
  }

  if (key === 'coverSize' && !value) {
    runtime.state.selections.frameSize = '';
    clearErrors(runtime, ['frameSize']);
  }
}

function updateMeasurement(runtime, key, value) {
  runtime.state.measurements[key] = value;
  clearErrors(runtime, [key]);
}

async function submit(runtime) {
  const validation = validateStepsUpTo(
    5,
    runtime.state,
    runtime.data,
    { commerceMode: runtime.commerceMode },
  );
  if (!validation.valid) {
    runtime.state.errors = {
      ...runtime.state.errors,
      ...validation.errors,
    };
    runtime.state.step = validation.firstInvalidStep;
    refresh(runtime);
    focusField(runtime, Object.keys(validation.errors)[0]);
    return;
  }

  const lineItems = buildLineItems(runtime.data, runtime.state);
  const total = computeTotal(lineItems);

  runtime.state.submissionState = 'submitting';
  runtime.state.submitErrorMessage = '';
  refresh(runtime);

  try {
    if (runtime.commerceMode) {
      if (!runtime.contractValidation?.valid) {
        throw new Error(
          runtime.contractValidation.blockerMessage
          || 'Commerce contract validation failed. Fix the missing Admin options before launch.',
        );
      }

      const cartItem = createUniformCommerceCartItem({
        sku: runtime.config.sku,
        data: runtime.data,
        state: runtime.state,
        contractIndex: runtime.contractIndex,
      });

      await addProductsToCart([cartItem]);
      emitRuntimeEvent(runtime, 'uniform_configurator_add_to_cart_success', {
        total,
        lineItemCount: lineItems.length,
        sku: runtime.config.sku,
      });
      window.location.href = rootLink('/cart');
      return;
    }

    if (!runtime.config.submitUrl) {
      throw new Error('Configure a submit URL to enable order submission.');
    }

    const payload = createSubmitPayload({
      analyticsId: runtime.config.analyticsId || runtime.data.id,
      data: runtime.data,
      state: runtime.state,
      lineItems,
      total,
      pageUrl: window.location.href,
      referrer: document.referrer,
    });

    track(runtime, 'uniform_configurator_submit', {
      total,
      lineItemCount: lineItems.length,
    });

    await submitJson(runtime.config.submitUrl, payload);
    runtime.state.submissionState = 'success';
    runtime.state.submitErrorMessage = '';
    refresh(runtime);
    track(runtime, 'uniform_configurator_submit_success', {
      total,
      lineItemCount: lineItems.length,
    });
  } catch (error) {
    runtime.state.submissionState = 'idle';
    runtime.state.step = runtime.commerceMode ? 6 : runtime.state.step;
    runtime.state.submitErrorMessage = error?.message
      || (runtime.commerceMode
        ? 'Unable to add this package to cart right now.'
        : 'Something went wrong while submitting. Please try again.');
    refresh(runtime);
    if (runtime.commerceMode) {
      emitRuntimeEvent(runtime, 'uniform_configurator_add_to_cart_error', {
        message: error?.message || 'Unable to add this package to cart right now.',
        sku: runtime.config.sku,
      });
    } else {
      track(runtime, 'uniform_configurator_submit_error', {
        message: error.message,
      });
    }
    // eslint-disable-next-line no-console
    console.warn('uniform-configurator: submission failed', error);
  }
}

function bindEvents(runtime) {
  if (runtime.block.dataset.uniformConfiguratorBound === 'true') return;

  runtime.block.addEventListener('click', (event) => {
    const stepButton = event.target.closest('[data-step]');
    if (stepButton) {
      navigateToStep(runtime, Number(stepButton.dataset.step));
      return;
    }

    const navButton = event.target.closest('[data-go-step]');
    if (navButton) {
      navigateToStep(runtime, Number(navButton.dataset.goStep));
      return;
    }

    if (event.target.closest('[data-submit-order]')) {
      submit(runtime);
      return;
    }

    if (event.target.closest('[data-reset-configurator]')) {
      runtime.state = createInitialState(runtime.data);
      runtime.previousTotal = null;
      runtime.block.innerHTML = createShell(runtime);
      refresh(runtime);
      track(runtime, 'uniform_configurator_start', {
        restarted: true,
      });
    }
  });

  runtime.block.addEventListener('change', (event) => {
    const { target } = event;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

    if (target.dataset.stateKey) {
      updateSelection(runtime, target.dataset.stateKey, target.value);

      if (shouldTrackChange(target.dataset.stateKey)) {
        track(runtime, 'uniform_configurator_change', {
          field: target.dataset.stateKey,
          value: target.value,
        });
      }

      refresh(runtime);
      return;
    }

    if (target.name === 'rank') {
      updateSelection(runtime, 'rank', target.value);
      track(runtime, 'uniform_configurator_change', {
        field: 'rank',
        value: target.value,
      });
      refresh(runtime);
      return;
    }

    if (target.name === 'medalPackage') {
      updateSelection(runtime, 'medalPackage', target.value);
      track(runtime, 'uniform_configurator_change', {
        field: 'medalPackage',
        value: target.value,
      });
      refresh(runtime);
      return;
    }

    if (target.name === 'buckleStyle') {
      updateSelection(runtime, 'buckleStyle', target.value);
      track(runtime, 'uniform_configurator_change', {
        field: 'buckleStyle',
        value: target.value,
      });
      refresh(runtime);
      return;
    }

    if (target.dataset.extraId) {
      runtime.state.selections.extras[target.dataset.extraId] = target.checked;
      track(runtime, 'uniform_configurator_change', {
        field: target.dataset.extraId,
        value: target.checked,
      });
      refresh(runtime);
      return;
    }

    if (target.id === 'uc-shipping-toggle') {
      runtime.state.selections.shippingOverride = target.checked;
      clearErrors(runtime, ['shippingAddress', 'shippingCity', 'shippingState', 'shippingZip']);
      refresh(runtime);
      return;
    }

    if (target.id === 'uc-rush-toggle') {
      runtime.state.selections.rushTailoring = target.checked;
      track(runtime, 'uniform_configurator_change', {
        field: 'rushTailoring',
        value: target.checked,
      });
      refresh(runtime);
    }
  });

  runtime.block.addEventListener('input', (event) => {
    const { target } = event;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    if (target.dataset.stateKey) {
      updateSelection(runtime, target.dataset.stateKey, target.value);
      refresh(runtime);
      return;
    }

    if (target.dataset.measurementKey) {
      updateMeasurement(runtime, target.dataset.measurementKey, target.value);
      refresh(runtime);
    }
  });

  if (runtime.block.dataset.uniformConfiguratorResizeBound !== 'true') {
    const handleResize = () => applyRuntimeLayout(runtime);
    window.addEventListener('resize', handleResize, { passive: true });
    runtime.block.dataset.uniformConfiguratorResizeBound = 'true';
  }

  runtime.block.dataset.uniformConfiguratorBound = 'true';
}

export default async function decorate(block) {
  const config = getConfig(block);
  const commerceMode = Boolean(config.sku);
  const section = block.closest('.section');
  const wrapper = block.parentElement;

  if (section) {
    section.style.setProperty('--column-width', '100%');
    section.style.setProperty('flex-basis', '100%');
    section.style.setProperty('max-width', '100%');
  }

  if (wrapper) {
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '100%';
  }

  showBlockMessage(block, 'info', 'Loading uniform configurator…');

  if (commerceMode && config.submitUrl) {
    showBlockMessage(block, 'error', 'Commerce-authored uniform configurators must use a SKU and must not define a submit URL.');
    return;
  }

  if (!commerceMode && !config.submitUrl) {
    showBlockMessage(block, 'error', 'Configure the block with a submit URL before publishing.');
    return;
  }

  try {
    const data = await fetchDataset(config.dataSource);
    let commerceProduct = null;
    let contractValidation = {
      valid: true,
      missing: [],
      index: buildCommerceContractIndex(),
    };

    if (commerceMode) {
      await import('../../scripts/initializers/cart.js');
      setEndpoint(CS_FETCH_GRAPHQL);
      commerceProduct = await fetchProductData(config.sku);
      let contractProduct = commerceProduct;
      let coreFallbackResult = null;
      let blockerMessage = '';

      const ensureCoreFallback = async () => {
        if (coreFallbackResult !== null) {
          return coreFallbackResult;
        }

        coreFallbackResult = await fetchCoreCustomizableCommerceProduct(config.sku);
        return coreFallbackResult;
      };

      if (shouldAttemptCoreCustomizableFallback(contractProduct)) {
        const coreProductResult = await ensureCoreFallback();
        if (coreProductResult.product?.sku) {
          contractProduct = mergeCommerceContractProduct(
            contractProduct,
            coreProductResult.product,
          );
        } else if (coreProductResult.error) {
          blockerMessage = coreProductResult.error.message;
        }
      }

      if (!contractProduct?.sku) {
        throw new Error(
          blockerMessage || `The Commerce SKU "${config.sku}" could not be loaded from Adobe Commerce.`,
        );
      }

      contractValidation = validateCommerceProductContract(data, contractProduct);

      if (shouldAttemptCoreCustomizableFallback(contractProduct, contractValidation)) {
        const coreProductResult = await ensureCoreFallback();
        if (coreProductResult.product?.sku) {
          contractProduct = mergeCommerceContractProduct(
            contractProduct,
            coreProductResult.product,
          );
          contractValidation = validateCommerceProductContract(data, contractProduct);
        } else if (coreProductResult.error) {
          blockerMessage = coreProductResult.error.message;
        }
      }

      if (blockerMessage && !contractValidation.valid) {
        contractValidation = {
          ...contractValidation,
          blockerMessage,
        };
      }

      commerceProduct = contractProduct;
    }

    const runtime = {
      block,
      config,
      data,
      state: createInitialState(data),
      commerceMode,
      commerceProduct,
      contractValidation,
      contractIndex: contractValidation.index,
      stepLabels: getStepLabels(commerceMode),
      stepMeta: getStepMeta(commerceMode),
      previousTotal: null,
    };

    block.innerHTML = createShell(runtime);
    bindEvents(runtime);
    refresh(runtime);

    track(runtime, 'uniform_configurator_start', {
      stepIndex: runtime.state.step,
      stepLabel: runtime.stepLabels[runtime.state.step - 1],
    });
    track(runtime, 'uniform_configurator_step_view', {
      stepIndex: runtime.state.step,
      stepLabel: runtime.stepLabels[runtime.state.step - 1],
    });
  } catch (error) {
    showBlockMessage(block, 'error', error.message || 'Unable to load the uniform configurator.');
    // eslint-disable-next-line no-console
    console.warn('uniform-configurator: failed to initialize', error);
  }
}
