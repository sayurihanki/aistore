import {
  cellText,
  createLink,
  createTextElement,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';

const THEMES = new Set([
  'scarlet-gold',
  'midnight-gold',
  'coyote-tan',
  'marine-teal',
  'steel-scarlet',
]);

function createIcon() {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2.25');
  icon.setAttribute('aria-hidden', 'true');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', 'M5 12h14');
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M12 5l7 7-7 7');

  icon.append(line, arrow);
  return icon;
}

function appendText(parent, tagName, className, value) {
  const text = value?.trim();
  if (!text) return null;

  const element = createTextElement(tagName, className, text);
  parent.append(element);
  return element;
}

export default function decorate(block) {
  const fields = parseFieldRows(block);
  const badge = cellText(fields.badge);
  const title = cellText(fields.title);
  const description = cellText(fields.description);
  const theme = cellText(fields.theme).toLowerCase();
  const ctaSource = fields.cta;
  const hasCta = Boolean(ctaSource || cellText(ctaSource));

  if (THEMES.has(theme)) {
    block.dataset.theme = theme;
  }

  const surface = document.createElement('div');
  surface.className = 'promo-strip__surface';

  const wash = document.createElement('div');
  wash.className = 'promo-strip__wash';
  wash.setAttribute('aria-hidden', 'true');

  const grid = document.createElement('div');
  grid.className = 'promo-strip__grid';
  grid.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'promo-strip__content';

  const copy = document.createElement('div');
  copy.className = 'promo-strip__copy';
  appendText(copy, 'p', 'promo-strip__badge', badge);
  appendText(copy, 'h2', 'promo-strip__title', title);
  appendText(copy, 'p', 'promo-strip__description', description);

  content.append(copy);

  if (hasCta) {
    const ctaData = extractLink(ctaSource, 'Learn More');
    const cta = createLink('promo-strip__cta', ctaData.href, ctaData.text || 'Learn More');
    const label = document.createElement('span');
    label.textContent = cta.textContent;
    cta.textContent = '';
    cta.append(label, createIcon());
    content.append(cta);
  }

  surface.append(wash, grid, content);
  block.replaceChildren(surface);
}
