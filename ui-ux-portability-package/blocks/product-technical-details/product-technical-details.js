import { events } from '@dropins/tools/event-bus.js';

import { readBlockConfig } from '../../scripts/aem.js';
/* eslint-disable import/extensions */
import {
  normalizeBooleanValue,
  normalizeTechnicalDetailsPresentation,
  parseAuthoredDatasetRows,
  resolveTechnicalDetails,
  shouldRenderTechnicalDetails,
  TECHNICAL_DETAILS_PRESENTATIONS,
} from './product-technical-details.utils.mjs';
/* eslint-enable import/extensions */

const DEFAULT_DATA_SOURCE = '';
const SOURCE_HOSTS = new Set(['da.live', 'www.da.live', 'content.da.live']);
const VIEWPORT_BREAKPOINT = 900;

function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;

  Object.entries(attrs).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(name, value);
    }
  });

  return element;
}

function createSectionHeader(title) {
  const header = createElement('div', 'product-technical-details__section-header');
  const heading = createElement('h2', 'product-technical-details__section-title');
  heading.textContent = title;
  const line = createElement('span', 'product-technical-details__section-line', {
    'aria-hidden': 'true',
  });

  header.append(heading, line);
  return header;
}

function readCellText(cell) {
  const paragraphs = [...cell.querySelectorAll(':scope > p')];

  if (paragraphs.length > 0) {
    return paragraphs.map((paragraph) => paragraph.textContent.trim()).join(' ').trim();
  }

  return cell.textContent.trim();
}

function readAuthoredRows(block) {
  return [...block.children].map((row) => [...row.children].map((cell) => readCellText(cell)));
}

function resolveDataSourceUrl(rawSource) {
  const source = String(rawSource || DEFAULT_DATA_SOURCE).trim();

  if (!source) {
    throw new Error('Product technical details requires a data-source or inline authored rows.');
  }

  const url = new URL(source, window.location.origin);

  if (!/\.json($|\?)/i.test(url.pathname)) {
    throw new Error('Product technical details data source must point to a JSON file.');
  }

  if (url.origin === window.location.origin || SOURCE_HOSTS.has(url.hostname)) {
    return url.toString();
  }

  throw new Error('Product technical details data source must be repo-relative or hosted on da.live.');
}

async function fetchDataset(dataSource) {
  const url = resolveDataSourceUrl(dataSource);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load technical details data (${response.status}).`);
  }

  return response.json();
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

function showBlockMessage(block, type, message) {
  const text = createElement('p', 'product-technical-details-block-message');
  text.dataset.type = type;
  text.textContent = message;
  block.hidden = false;
  block.replaceChildren(text);
}

function renderSpecCards(cards = []) {
  const grid = createElement('div', 'product-technical-details__spec-grid');

  cards.forEach((card, index) => {
    const article = createElement('article', 'product-technical-details__spec-card product-technical-details__reveal');
    article.style.setProperty('--product-technical-details-reveal-index', String(index));

    const icon = createElement('span', 'product-technical-details__spec-icon');
    icon.textContent = card.icon || card.label.slice(0, 1).toUpperCase();

    const value = createElement('div', 'product-technical-details__spec-value');
    const valueText = createElement('span', 'product-technical-details__spec-value-text');
    valueText.textContent = card.displayValue || card.fallbackValue || '-';
    value.append(valueText);

    if (card.displayUnit) {
      const unit = createElement('span', 'product-technical-details__spec-unit');
      unit.textContent = card.displayUnit;
      value.append(unit);
    }

    const label = createElement('p', 'product-technical-details__spec-label');
    label.textContent = card.label;

    article.append(icon, value, label);
    grid.append(article);
  });

  return grid;
}

function renderFeatures(features = []) {
  const grid = createElement('div', 'product-technical-details__feature-grid');

  features.forEach((feature, index) => {
    const article = createElement('article', 'product-technical-details__feature product-technical-details__reveal');
    article.style.setProperty('--product-technical-details-reveal-index', String(index));

    const marker = createElement('span', 'product-technical-details__feature-marker', {
      'aria-hidden': 'true',
    });
    marker.textContent = '+';

    const copy = createElement('div', 'product-technical-details__feature-copy');
    const title = createElement('strong', 'product-technical-details__feature-title');
    title.textContent = feature.title;
    const description = createElement('p', 'product-technical-details__feature-description');
    description.textContent = feature.description;

    copy.append(title, description);
    article.append(marker, copy);
    grid.append(article);
  });

  return grid;
}

function renderAccordion(sections = []) {
  const accordion = createElement('div', 'product-technical-details__accordion');
  const items = sections.map((section, index) => {
    const item = createElement('section', 'product-technical-details__accordion-item product-technical-details__reveal');
    item.style.setProperty('--product-technical-details-reveal-index', String(index));

    const headerId = `product-technical-details-heading-${section.id}`;
    const panelId = `product-technical-details-panel-${section.id}`;

    const button = createElement('button', 'product-technical-details__accordion-button', {
      type: 'button',
      id: headerId,
      'aria-expanded': section.open ? 'true' : 'false',
      'aria-controls': panelId,
    });
    const title = createElement('span', 'product-technical-details__accordion-title');
    title.textContent = section.title;
    const icon = createElement('span', 'product-technical-details__accordion-icon', {
      'aria-hidden': 'true',
    });
    icon.textContent = '+';
    button.append(title, icon);

    const panel = createElement('div', 'product-technical-details__accordion-panel', {
      id: panelId,
      role: 'region',
      'aria-labelledby': headerId,
    });
    if (!section.open) panel.hidden = true;

    const content = createElement('div', 'product-technical-details__accordion-content');
    const table = createElement('table', 'product-technical-details__table');
    const body = createElement('tbody');

    section.rows.forEach((row) => {
      const tr = createElement('tr');
      const label = createElement('td', 'product-technical-details__table-label');
      label.textContent = row.label;
      const value = createElement('td', 'product-technical-details__table-value');
      value.textContent = row.resolvedValue || row.value || '-';
      tr.append(label, value);
      body.append(tr);
    });

    table.append(body);
    content.append(table);
    panel.append(content);
    item.append(button, panel);

    return { item, button, panel };
  });

  const setActiveIndex = (targetIndex) => {
    items.forEach(({ item, button, panel }, index) => {
      const isActive = index === targetIndex;
      item.classList.toggle('is-open', isActive);
      button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      panel.hidden = !isActive;
    });
  };

  const initiallyOpen = sections.findIndex((section) => section.open);
  const activeIndex = initiallyOpen >= 0 ? initiallyOpen : 0;
  setActiveIndex(activeIndex);

  items.forEach(({ item, button }, index) => {
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      setActiveIndex(isExpanded ? -1 : index);
    });
    accordion.append(item);
  });

  return accordion;
}

function setupRevealAnimation(block) {
  const nodes = [...block.querySelectorAll('.product-technical-details__reveal')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  nodes.forEach((node) => observer.observe(node));
}

function setupParallax(block, enabled) {
  if (!enabled) return;

  const update = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = window.innerWidth < VIEWPORT_BREAKPOINT;

    if (reduceMotion || isNarrow) {
      block.style.setProperty('--product-technical-details-plane-shift', '0px');
      block.style.setProperty('--product-technical-details-grid-shift', '0px');
      return;
    }

    const rect = block.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)),
    );
    const planeShift = (progress - 0.5) * 64;
    const gridShift = (progress - 0.5) * -28;

    block.style.setProperty('--product-technical-details-plane-shift', `${planeShift.toFixed(2)}px`);
    block.style.setProperty('--product-technical-details-grid-shift', `${gridShift.toFixed(2)}px`);
  };

  let frame = 0;
  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

function normalizeConfig(block) {
  const config = readBlockConfig(block);

  return {
    dataSource: String(config['data-source'] || DEFAULT_DATA_SOURCE).trim() || DEFAULT_DATA_SOURCE,
    presentation: normalizeTechnicalDetailsPresentation(config.presentation),
    enableParallax: normalizeBooleanValue(config['enable-parallax'], true),
  };
}

function buildShell(model) {
  const shell = createElement('section', 'product-technical-details__shell');
  const ambient = createElement('div', 'product-technical-details__ambient', {
    'aria-hidden': 'true',
  });
  ambient.append(
    createElement('span', 'product-technical-details__ambient-orb product-technical-details__ambient-orb--primary'),
    createElement('span', 'product-technical-details__ambient-orb product-technical-details__ambient-orb--secondary'),
    createElement('span', 'product-technical-details__ambient-grid'),
  );
  shell.append(ambient);

  if (model.specCards.length > 0) {
    const section = createElement('section', 'product-technical-details__section');
    section.append(createSectionHeader(model.specsTitle), renderSpecCards(model.specCards));
    shell.append(section);
  }

  if (model.features.length > 0) {
    const section = createElement('section', 'product-technical-details__section');
    section.append(createSectionHeader(model.featuresTitle), renderFeatures(model.features));
    shell.append(section);
  }

  if (model.detailsSections.length > 0) {
    const section = createElement('section', 'product-technical-details__section');
    section.append(createSectionHeader(model.detailsTitle), renderAccordion(model.detailsSections));
    shell.append(section);
  }

  return shell;
}

async function initialize(block, config, authoredDataset = null) {
  if (block.dataset.initialized === 'true') return;
  block.dataset.initialized = 'true';

  try {
    const [dataset, product] = await Promise.all([
      authoredDataset ? Promise.resolve(authoredDataset) : fetchDataset(config.dataSource),
      waitForProductData(),
    ]);

    const model = resolveTechnicalDetails(product, dataset);
    const shell = buildShell(model);

    block.replaceChildren(shell);
    block.hidden = false;
    block.dataset.presentation = config.presentation;
    setupRevealAnimation(block);
    setupParallax(block, config.enableParallax);
  } catch (error) {
    block.dataset.initialized = 'false';
    showBlockMessage(
      block,
      'error',
      error?.message || 'Unable to render product technical details.',
    );
  }
}

export default function decorate(block) {
  const config = normalizeConfig(block);
  const authoredDataset = parseAuthoredDatasetRows(readAuthoredRows(block));
  const hasInlineDataset = authoredDataset.specCards.length > 0
    || authoredDataset.features.length > 0
    || authoredDataset.detailsSections.length > 0;
  const lastReadyPayload = events.lastPayload('pdp/configurator-ready');

  if (shouldRenderTechnicalDetails(config.presentation, lastReadyPayload)) {
    initialize(block, config, hasInlineDataset ? authoredDataset : null);
    return;
  }

  if (config.presentation === TECHNICAL_DETAILS_PRESENTATIONS.RACK_IMMERSIVE) {
    block.hidden = true;
    const subscription = events.on('pdp/configurator-ready', (payload) => {
      if (!shouldRenderTechnicalDetails(config.presentation, payload)) {
        return;
      }

      subscription?.off?.();
      initialize(block, config, hasInlineDataset ? authoredDataset : null);
    });
  }
}
