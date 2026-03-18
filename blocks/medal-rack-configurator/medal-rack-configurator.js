import { readBlockConfig } from '../../scripts/aem.js';
import {
  DEFAULT_BLOCK_CONTENT,
  DEFAULT_DATA_SOURCE,
  MAX_INSCRIPTION_LENGTH,
  createInitialState,
  createPrototypeActionState,
  computePricing,
  formatCurrency,
  getPreviewState,
  getSummaryChips,
  normalizeDataset,
  sanitizeInscriptionValue,
  toggleAddonId,
} from './medal-rack-configurator.lib.js';

const SOURCE_HOSTS = new Set(['da.live', 'www.da.live', 'content.da.live']);

function createElement(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function renderMultilineText(element, text) {
  const lines = String(text || '').split('\n');
  const children = [];

  lines.forEach((line, index) => {
    children.push(document.createTextNode(line));
    if (index < lines.length - 1) {
      children.push(document.createElement('br'));
    }
  });

  element.replaceChildren(...children);
}

function normalizeSingleLine(value, fallback) {
  return String(value || fallback || '').trim();
}

function normalizeMultiline(value, fallback) {
  return normalizeSingleLine(value, fallback).replace(/\\n/g, '\n');
}

function getConfig(block) {
  const config = readBlockConfig(block);

  return {
    dataSource: normalizeSingleLine(config['data-source'], DEFAULT_DATA_SOURCE),
    eyebrow: normalizeSingleLine(config.eyebrow, DEFAULT_BLOCK_CONTENT.eyebrow),
    title: normalizeMultiline(config.title, DEFAULT_BLOCK_CONTENT.title),
    subtitle: normalizeMultiline(config.subtitle, DEFAULT_BLOCK_CONTENT.subtitle),
    primaryCtaLabel: normalizeSingleLine(
      config['primary-cta-label'],
      DEFAULT_BLOCK_CONTENT.primaryCtaLabel,
    ),
    prototypeNote: normalizeMultiline(
      config['prototype-note'],
      DEFAULT_BLOCK_CONTENT.prototypeNote,
    ),
  };
}

function resolveDataSourceUrl(rawSource) {
  const source = normalizeSingleLine(rawSource, DEFAULT_DATA_SOURCE);
  const url = new URL(source, window.location.origin);

  if (!/\.json($|\?)/i.test(url.pathname)) {
    throw new Error('Medal rack configurator data source must point to a JSON file.');
  }

  if (url.origin === window.location.origin) {
    return url.toString();
  }

  if (!SOURCE_HOSTS.has(url.hostname)) {
    throw new Error('Medal rack configurator data source must be repo-relative or hosted on da.live.');
  }

  return url.toString();
}

async function fetchDataset(rawSource) {
  const source = resolveDataSourceUrl(rawSource);
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load medal rack data (${response.status}).`);
  }

  return normalizeDataset(await response.json());
}

function showBlockMessage(block, type, message) {
  const element = createElement('p', 'medal-rack-configurator-block-message');
  element.dataset.type = type;
  element.textContent = message;
  block.replaceChildren(element);
}

function getUid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return `medal-rack-${window.crypto.randomUUID().slice(0, 8)}`;
  }

  return `medal-rack-${Date.now().toString(36)}`;
}

function getPreviewSvgMarkup(uid) {
  return `
    <div class="medal-rack-configurator__svg-wrap" data-preview-size="sm">
      <svg class="medal-rack-configurator__svg" viewBox="0 0 320 380" aria-hidden="true">
        <defs>
          <linearGradient id="${uid}-woodWalnut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#5c3317"></stop>
            <stop offset="30%" stop-color="#7a4520"></stop>
            <stop offset="60%" stop-color="#4e2c10"></stop>
            <stop offset="100%" stop-color="#6b3a18"></stop>
          </linearGradient>
          <linearGradient id="${uid}-woodMahogany" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6b1a1a"></stop>
            <stop offset="30%" stop-color="#8b2525"></stop>
            <stop offset="60%" stop-color="#5a1515"></stop>
            <stop offset="100%" stop-color="#7a2020"></stop>
          </linearGradient>
          <linearGradient id="${uid}-woodEbony" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#17120f"></stop>
            <stop offset="30%" stop-color="#201813"></stop>
            <stop offset="60%" stop-color="#110d0b"></stop>
            <stop offset="100%" stop-color="#1d1713"></stop>
          </linearGradient>
          <linearGradient id="${uid}-woodCherry" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7a2e1e"></stop>
            <stop offset="30%" stop-color="#9c3d28"></stop>
            <stop offset="60%" stop-color="#6b2518"></stop>
            <stop offset="100%" stop-color="#883424"></stop>
          </linearGradient>
          <linearGradient id="${uid}-woodMaple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#d4b896"></stop>
            <stop offset="30%" stop-color="#c8a882"></stop>
            <stop offset="60%" stop-color="#b89070"></stop>
            <stop offset="100%" stop-color="#c8a07a"></stop>
          </linearGradient>
        </defs>
        <rect
          x="8"
          y="8"
          width="304"
          height="364"
          rx="10"
          data-preview="frame"
          fill="url(#${uid}-woodWalnut)"
        ></rect>
        <rect
          x="8"
          y="8"
          width="304"
          height="364"
          rx="10"
          data-preview="frameBorder"
          fill="none"
          stroke="#c9a84c"
          stroke-width="1.3"
        ></rect>
        <rect x="26" y="26" width="268" height="310" rx="4" fill="#090c13"></rect>
        <text
          x="160"
          y="175"
          text-anchor="middle"
          class="medal-rack-configurator__svg-watermark"
          data-preview="branchWatermark"
        >USMC</text>
        <g transform="translate(46 44)">
          <rect x="0" y="0" width="36" height="22" rx="2.5" fill="#8b0000"></rect>
          <rect x="40" y="0" width="36" height="22" rx="2.5" fill="#003580"></rect>
          <rect x="80" y="0" width="36" height="22" rx="2.5" fill="#2e5e2e"></rect>
          <rect x="120" y="0" width="36" height="22" rx="2.5" fill="#7a5020"></rect>
          <rect x="160" y="0" width="36" height="22" rx="2.5" fill="#5a1a5a"></rect>
          <rect x="200" y="0" width="36" height="22" rx="2.5" fill="#005050"></rect>
          <rect x="0" y="28" width="36" height="22" rx="2.5" fill="#1a3a6b"></rect>
          <rect x="40" y="28" width="36" height="22" rx="2.5" fill="#6b3a1a"></rect>
          <rect x="80" y="28" width="36" height="22" rx="2.5" fill="#3a6b3a"></rect>
          <rect x="120" y="28" width="36" height="22" rx="2.5" fill="#6b1a3a"></rect>
          <rect x="160" y="28" width="36" height="22" rx="2.5" fill="#4a4a1a"></rect>
          <rect x="200" y="28" width="36" height="22" rx="2.5" fill="#1a5a3a"></rect>
          <rect x="20" y="56" width="36" height="22" rx="2.5" fill="#4a1a6b"></rect>
          <rect x="60" y="56" width="36" height="22" rx="2.5" fill="#6b4a1a"></rect>
          <rect x="100" y="56" width="36" height="22" rx="2.5" fill="#1a6b4a"></rect>
          <rect x="140" y="56" width="36" height="22" rx="2.5" fill="#6b1a1a"></rect>
          <rect x="180" y="56" width="36" height="22" rx="2.5" fill="#1a1a6b"></rect>
        </g>
        <g transform="translate(46 196)">
          <rect x="13" y="0" width="10" height="28" rx="2" fill="#8b0000"></rect>
          <rect x="63" y="0" width="10" height="28" rx="2" fill="#003580"></rect>
          <rect x="113" y="0" width="10" height="28" rx="2" fill="#2e5e2e"></rect>
          <rect x="163" y="0" width="10" height="28" rx="2" fill="#7a5020"></rect>
          <rect x="213" y="0" width="10" height="28" rx="2" fill="#5a1a5a"></rect>
          <circle cx="18" cy="48" r="20" fill="#c9a84c" stroke="#7a5f25" stroke-width="2"></circle>
          <circle cx="68" cy="48" r="20" fill="#b9c3cd" stroke="#6e7b86" stroke-width="2"></circle>
          <circle cx="118" cy="48" r="20" fill="#c9a84c" stroke="#7a5f25" stroke-width="2"></circle>
          <circle cx="168" cy="48" r="20" fill="#b9c3cd" stroke="#6e7b86" stroke-width="2"></circle>
          <circle cx="218" cy="48" r="20" fill="#c9a84c" stroke="#7a5f25" stroke-width="2"></circle>
        </g>
        <rect
          x="46"
          y="304"
          width="228"
          height="28"
          rx="3"
          data-preview="plate"
          fill="#c9a84c"
        ></rect>
        <text
          x="160"
          y="322"
          text-anchor="middle"
          class="medal-rack-configurator__svg-inscription"
          data-preview="inscription"
        >Semper Fidelis</text>
        <g opacity="0.75">
          <path d="M26 42L26 26L42 26" data-preview="ornament" fill="none" stroke="#c9a84c" stroke-width="2"></path>
          <path d="M278 26L294 26L294 42" data-preview="ornament" fill="none" stroke="#c9a84c" stroke-width="2"></path>
          <path d="M294 338L294 354L278 354" data-preview="ornament" fill="none" stroke="#c9a84c" stroke-width="2"></path>
          <path d="M42 354L26 354L26 338" data-preview="ornament" fill="none" stroke="#c9a84c" stroke-width="2"></path>
        </g>
        <circle cx="80" cy="18" r="4" data-preview="pin" fill="#c9a84c" stroke="#c9a84c"></circle>
        <circle cx="160" cy="18" r="4" data-preview="pin" fill="#c9a84c" stroke="#c9a84c"></circle>
        <circle cx="240" cy="18" r="4" data-preview="pin" fill="#c9a84c" stroke="#c9a84c"></circle>
      </svg>
    </div>
  `;
}

function buildShell(block, runtime) {
  const fragment = document.createRange().createContextualFragment(`
    <section class="medal-rack-configurator__shell">
      <aside class="medal-rack-configurator__preview-column">
        <div class="medal-rack-configurator__preview-card">
          <div class="medal-rack-configurator__preview-copy">
            <p class="medal-rack-configurator__eyebrow"></p>
            <h2 class="medal-rack-configurator__title"></h2>
            <p class="medal-rack-configurator__subtitle"></p>
          </div>
          <div class="medal-rack-configurator__preview-stage">
            <div class="medal-rack-configurator__preview-glow"></div>
            ${getPreviewSvgMarkup(runtime.uid)}
          </div>
          <div class="medal-rack-configurator__preview-readout">
            <span class="medal-rack-configurator__label">Live prototype preview</span>
            <strong class="medal-rack-configurator__preview-detail-title"></strong>
            <p class="medal-rack-configurator__preview-detail-text"></p>
            <div class="medal-rack-configurator__summary-chips"></div>
          </div>
        </div>
      </aside>
      <div class="medal-rack-configurator__config-column">
        <div class="medal-rack-configurator__config-card">
          <div class="medal-rack-configurator__price-row">
            <div class="medal-rack-configurator__price-block">
              <span class="medal-rack-configurator__label">Configured total</span>
              <div class="medal-rack-configurator__price-value" aria-live="polite"></div>
            </div>
            <button
              type="button"
              class="medal-rack-configurator__breakdown-toggle"
              aria-expanded="false"
              aria-controls="${runtime.uid}-breakdown"
            >See breakdown</button>
          </div>
          <div
            class="medal-rack-configurator__breakdown"
            id="${runtime.uid}-breakdown"
            hidden
          >
            <div class="medal-rack-configurator__breakdown-rows"></div>
          </div>
          <div class="medal-rack-configurator__groups"></div>
          <div class="medal-rack-configurator__action-rail">
            <div class="medal-rack-configurator__action-pills">
              <span>Regulation-aware preview</span>
              <span>Hardwood finishes</span>
              <span>Prototype only</span>
            </div>
            <button type="button" class="medal-rack-configurator__cta"></button>
            <p
              class="medal-rack-configurator__prototype-note"
              tabindex="-1"
              role="status"
              aria-live="polite"
              hidden
            ></p>
          </div>
        </div>
      </div>
    </section>
  `);

  const refs = {
    eyebrow: fragment.querySelector('.medal-rack-configurator__eyebrow'),
    title: fragment.querySelector('.medal-rack-configurator__title'),
    subtitle: fragment.querySelector('.medal-rack-configurator__subtitle'),
    previewWrap: fragment.querySelector('.medal-rack-configurator__svg-wrap'),
    previewFrame: fragment.querySelector('[data-preview="frame"]'),
    previewFrameBorder: fragment.querySelector('[data-preview="frameBorder"]'),
    previewPlate: fragment.querySelector('[data-preview="plate"]'),
    previewPins: [...fragment.querySelectorAll('[data-preview="pin"]')],
    previewOrnaments: [...fragment.querySelectorAll('[data-preview="ornament"]')],
    previewWatermark: fragment.querySelector('[data-preview="branchWatermark"]'),
    previewInscription: fragment.querySelector('[data-preview="inscription"]'),
    previewDetailTitle: fragment.querySelector(
      '.medal-rack-configurator__preview-detail-title',
    ),
    previewDetailText: fragment.querySelector(
      '.medal-rack-configurator__preview-detail-text',
    ),
    summaryChips: fragment.querySelector('.medal-rack-configurator__summary-chips'),
    priceValue: fragment.querySelector('.medal-rack-configurator__price-value'),
    breakdownToggle: fragment.querySelector('.medal-rack-configurator__breakdown-toggle'),
    breakdown: fragment.querySelector('.medal-rack-configurator__breakdown'),
    breakdownRows: fragment.querySelector('.medal-rack-configurator__breakdown-rows'),
    groups: fragment.querySelector('.medal-rack-configurator__groups'),
    cta: fragment.querySelector('.medal-rack-configurator__cta'),
    prototypeNote: fragment.querySelector('.medal-rack-configurator__prototype-note'),
    inscriptionPreview: null,
  };

  renderMultilineText(refs.title, runtime.config.title);
  refs.eyebrow.textContent = runtime.config.eyebrow;
  renderMultilineText(refs.subtitle, runtime.config.subtitle);

  block.replaceChildren(fragment);

  return refs;
}

function appendGroupHeader(fieldset, stepLabel, title, helpText) {
  const legend = createElement('legend', 'medal-rack-configurator__group-legend');
  const legendStep = createElement('span', 'medal-rack-configurator__group-step', stepLabel);
  const legendTitle = createElement('span', 'medal-rack-configurator__group-title', title);
  legend.append(legendStep, legendTitle);
  fieldset.append(legend);

  if (helpText) {
    fieldset.append(createElement('p', 'medal-rack-configurator__group-help', helpText));
  }
}

function buildSizeGroup(runtime) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const grid = createElement('div', 'medal-rack-configurator__size-grid');

  appendGroupHeader(
    fieldset,
    '01',
    'Rack Size',
    'Choose a display size based on the number of awards to mount.',
  );

  runtime.data.sizes.forEach((size) => {
    const label = createElement('label', 'medal-rack-configurator__size-option');
    const input = createElement('input');
    const card = createElement('span', 'medal-rack-configurator__size-card');
    const badge = createElement('span', 'medal-rack-configurator__size-badge', size.id.toUpperCase());
    const name = createElement('span', 'medal-rack-configurator__size-name', size.label);
    const dimensions = createElement(
      'span',
      'medal-rack-configurator__size-dimensions',
      size.dimensions,
    );
    const price = createElement(
      'span',
      'medal-rack-configurator__option-price',
      size.cost ? `+${formatCurrency(size.cost, runtime.data.currency)}` : 'Included',
    );

    input.type = 'radio';
    input.name = `${runtime.uid}-size`;
    input.value = size.id;
    input.checked = size.id === runtime.state.sizeId;
    input.dataset.control = 'size';

    card.append(badge, name, dimensions, price);
    label.append(input, card);
    grid.append(label);
  });

  fieldset.append(grid);
  return fieldset;
}

function buildWoodGroup(runtime) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const grid = createElement('div', 'medal-rack-configurator__swatch-grid');

  appendGroupHeader(
    fieldset,
    '02',
    'Wood Finish',
    'All woods are modeled as solid hardwood with hand-rubbed finishing.',
  );

  runtime.data.woods.forEach((wood) => {
    const label = createElement('label', 'medal-rack-configurator__swatch-option');
    const input = createElement('input');
    const card = createElement('span', 'medal-rack-configurator__swatch-card');
    const visual = createElement('span', 'medal-rack-configurator__swatch-visual');
    const name = createElement('span', 'medal-rack-configurator__swatch-name', wood.label);
    const price = createElement(
      'span',
      'medal-rack-configurator__swatch-price',
      wood.cost ? `+${formatCurrency(wood.cost, runtime.data.currency)}` : 'Included',
    );

    input.type = 'radio';
    input.name = `${runtime.uid}-wood`;
    input.value = wood.id;
    input.checked = wood.id === runtime.state.woodId;
    input.dataset.control = 'wood';

    visual.dataset.gradient = wood.gradientId;
    card.append(visual, name, price);
    label.append(input, card);
    grid.append(label);
  });

  fieldset.append(grid);
  return fieldset;
}

function buildHardwareGroup(runtime) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const grid = createElement('div', 'medal-rack-configurator__swatch-grid');

  appendGroupHeader(
    fieldset,
    '03',
    'Hardware Finish',
    'Pins, border accents, and the engraving plate follow the selected metal finish.',
  );

  runtime.data.hardware.forEach((hardware) => {
    const label = createElement('label', 'medal-rack-configurator__swatch-option');
    const input = createElement('input');
    const card = createElement('span', 'medal-rack-configurator__swatch-card');
    const visual = createElement('span', 'medal-rack-configurator__swatch-visual');
    const name = createElement('span', 'medal-rack-configurator__swatch-name', hardware.label);
    const price = createElement(
      'span',
      'medal-rack-configurator__swatch-price',
      hardware.cost
        ? `+${formatCurrency(hardware.cost, runtime.data.currency)}`
        : 'Included',
    );

    input.type = 'radio';
    input.name = `${runtime.uid}-hardware`;
    input.value = hardware.id;
    input.checked = hardware.id === runtime.state.hardwareId;
    input.dataset.control = 'hardware';

    visual.dataset.hardware = hardware.id;
    card.append(visual, name, price);
    label.append(input, card);
    grid.append(label);
  });

  fieldset.append(grid);
  return fieldset;
}

function buildBranchGroup(runtime) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const grid = createElement('div', 'medal-rack-configurator__branch-grid');

  appendGroupHeader(
    fieldset,
    '04',
    'Branch of Service',
    'The watermark and regulation context change with the selected branch.',
  );

  runtime.data.branches.forEach((branch) => {
    const label = createElement('label', 'medal-rack-configurator__branch-option');
    const input = createElement('input');
    const card = createElement('span', 'medal-rack-configurator__branch-card');
    const icon = createElement('span', 'medal-rack-configurator__branch-icon', branch.icon);
    const name = createElement('span', 'medal-rack-configurator__branch-name', branch.label);

    input.type = 'radio';
    input.name = `${runtime.uid}-branch`;
    input.value = branch.id;
    input.checked = branch.id === runtime.state.branchId;
    input.dataset.control = 'branch';

    card.append(icon, name);
    label.append(input, card);
    grid.append(label);
  });

  fieldset.append(grid);
  return fieldset;
}

function buildInscriptionGroup(runtime, refs) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const input = createElement('input', 'medal-rack-configurator__inscription-input');
  const preview = createElement('div', 'medal-rack-configurator__inscription-preview');

  appendGroupHeader(
    fieldset,
    '05',
    'Inscription',
    `Engraved nameplate text. Maximum ${MAX_INSCRIPTION_LENGTH} characters.`,
  );

  input.type = 'text';
  input.maxLength = MAX_INSCRIPTION_LENGTH;
  input.value = runtime.state.inscriptionValue;
  input.placeholder = runtime.data.defaults.inscription;
  input.dataset.control = 'inscription';

  fieldset.append(input, preview);
  refs.inscriptionPreview = preview;

  return fieldset;
}

function buildAddonsGroup(runtime) {
  const fieldset = createElement('fieldset', 'medal-rack-configurator__group');
  const list = createElement('div', 'medal-rack-configurator__addon-list');

  appendGroupHeader(
    fieldset,
    '06',
    'Add-ons',
    'Layer in presentation and archival accessories to complete the display package.',
  );

  runtime.data.addons.forEach((addon) => {
    const label = createElement('label', 'medal-rack-configurator__addon-option');
    const input = createElement('input');
    const card = createElement('span', 'medal-rack-configurator__addon-card');
    const icon = createElement('span', 'medal-rack-configurator__addon-icon', addon.icon);
    const copy = createElement('span', 'medal-rack-configurator__addon-copy');
    const name = createElement('span', 'medal-rack-configurator__addon-name', addon.label);
    const description = createElement(
      'span',
      'medal-rack-configurator__addon-description',
      addon.description,
    );
    const price = createElement(
      'span',
      'medal-rack-configurator__addon-price',
      formatCurrency(addon.price, runtime.data.currency),
    );

    input.type = 'checkbox';
    input.name = `${runtime.uid}-addon-${addon.id}`;
    input.value = addon.id;
    input.checked = runtime.state.addonIds.includes(addon.id);
    input.dataset.control = 'addon';

    copy.append(name, description);
    card.append(icon, copy, price);
    label.append(input, card);
    list.append(label);
  });

  fieldset.append(list);
  return fieldset;
}

function buildGroups(runtime, refs) {
  refs.groups.append(
    buildSizeGroup(runtime),
    buildWoodGroup(runtime),
    buildHardwareGroup(runtime),
    buildBranchGroup(runtime),
    buildInscriptionGroup(runtime, refs),
    buildAddonsGroup(runtime),
  );
}

function renderSummaryChips(container, chips) {
  const nodes = chips.map((chip) => {
    const item = createElement('div', 'medal-rack-configurator__summary-chip');
    item.append(
      createElement('span', 'medal-rack-configurator__summary-chip-label', chip.label),
      createElement('strong', 'medal-rack-configurator__summary-chip-value', chip.value),
    );
    return item;
  });

  container.replaceChildren(...nodes);
}

function renderBreakdown(refs, pricing) {
  const rows = pricing.lines.map((line) => {
    const row = createElement('div', 'medal-rack-configurator__breakdown-row');
    row.append(
      createElement('span', 'medal-rack-configurator__breakdown-label', line.label),
      createElement(
        'strong',
        'medal-rack-configurator__breakdown-value',
        formatCurrency(line.amount, pricing.currency),
      ),
    );
    return row;
  });

  const totalRow = createElement(
    'div',
    'medal-rack-configurator__breakdown-row medal-rack-configurator__breakdown-row--total',
  );
  totalRow.append(
    createElement('span', 'medal-rack-configurator__breakdown-label', 'Total'),
    createElement(
      'strong',
      'medal-rack-configurator__breakdown-value',
      formatCurrency(pricing.total, pricing.currency),
    ),
  );

  refs.breakdownRows.replaceChildren(...rows, totalRow);
}

function renderPreview(runtime, refs) {
  const preview = getPreviewState(runtime.data, runtime.state);
  const chips = getSummaryChips(runtime.data, runtime.state);

  refs.previewWrap.dataset.previewSize = runtime.state.sizeId;
  refs.previewFrame.setAttribute(
    'fill',
    `url(#${runtime.uid}-${preview.woodGradientId})`,
  );
  refs.previewFrameBorder.setAttribute('stroke', preview.borderColor);
  refs.previewPlate.setAttribute('fill', preview.plateColor);
  refs.previewPins.forEach((pin) => {
    pin.setAttribute('fill', preview.pinColor);
    pin.setAttribute('stroke', preview.pinColor);
  });
  refs.previewOrnaments.forEach((ornament) => {
    ornament.setAttribute('stroke', preview.borderColor);
  });
  refs.previewWatermark.textContent = preview.branchWatermark;
  refs.previewInscription.textContent = preview.inscription;
  refs.previewInscription.setAttribute(
    'fill',
    runtime.state.hardwareId === 'pewter' ? '#f5f0e8' : '#120d08',
  );
  refs.previewDetailTitle.textContent = `${preview.sizeLabel} ${preview.sizeDimensions}`;
  refs.previewDetailText.textContent = `${preview.woodLabel} hardwood, ${preview.hardwareLabel} hardware, ${preview.branchLabel} watermark.`;

  if (refs.inscriptionPreview) {
    refs.inscriptionPreview.textContent = preview.inscription;
  }

  renderSummaryChips(refs.summaryChips, chips);
}

function renderPricing(runtime, refs) {
  const pricing = computePricing(runtime.data, runtime.state);
  const actionState = createPrototypeActionState(
    runtime.config,
    runtime.state.prototypeNoteVisible,
  );

  refs.priceValue.textContent = formatCurrency(pricing.total, pricing.currency);
  refs.breakdown.hidden = !runtime.state.breakdownOpen;
  refs.breakdownToggle.setAttribute(
    'aria-expanded',
    String(runtime.state.breakdownOpen),
  );
  refs.breakdownToggle.textContent = runtime.state.breakdownOpen
    ? 'Hide breakdown'
    : 'See breakdown';
  refs.cta.textContent = `${actionState.label} - ${formatCurrency(pricing.total, pricing.currency)}`;
  refs.prototypeNote.hidden = !runtime.state.prototypeNoteVisible;
  refs.prototypeNote.textContent = actionState.message;

  renderBreakdown(refs, pricing);
}

function renderRuntime(runtime, refs) {
  renderPreview(runtime, refs);
  renderPricing(runtime, refs);
}

function bindEvents(runtime, refs) {
  refs.groups.addEventListener('change', (event) => {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;

    switch (target.dataset.control) {
      case 'size':
        runtime.state.sizeId = target.value;
        break;
      case 'wood':
        runtime.state.woodId = target.value;
        break;
      case 'hardware':
        runtime.state.hardwareId = target.value;
        break;
      case 'branch':
        runtime.state.branchId = target.value;
        break;
      case 'addon':
        runtime.state.addonIds = toggleAddonId(
          target.value,
          target.checked,
          runtime.state.addonIds,
        );
        break;
      default:
        return;
    }

    renderRuntime(runtime, refs);
  });

  refs.groups.addEventListener('input', (event) => {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.control !== 'inscription') return;

    const value = sanitizeInscriptionValue(target.value, MAX_INSCRIPTION_LENGTH);
    if (value !== target.value) {
      target.value = value;
    }

    runtime.state.inscriptionValue = value;
    renderRuntime(runtime, refs);
  });

  refs.breakdownToggle.addEventListener('click', () => {
    runtime.state.breakdownOpen = !runtime.state.breakdownOpen;
    renderRuntime(runtime, refs);
  });

  refs.cta.addEventListener('click', () => {
    runtime.state.prototypeNoteVisible = true;
    renderRuntime(runtime, refs);
    refs.prototypeNote.focus();
  });
}

export default async function decorate(block) {
  const config = getConfig(block);

  try {
    const data = await fetchDataset(config.dataSource);
    const runtime = {
      uid: getUid(),
      config,
      data,
      state: createInitialState(data),
    };
    const refs = buildShell(block, runtime);

    buildGroups(runtime, refs);
    bindEvents(runtime, refs);
    renderRuntime(runtime, refs);
  } catch (error) {
    showBlockMessage(
      block,
      'error',
      error?.message || 'Unable to initialize the medal rack configurator.',
    );
  }
}
