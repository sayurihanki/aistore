/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

const BLOCK_LINE_BREAK_PATTERN = /<\/(?:article|div|h[1-6]|li|p|section)>/gi;
const BREAK_TAG_PATTERN = /<br\s*\/?>/gi;
const TAG_PATTERN = /<[^>]+>/g;
const ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': '\'',
  '&lt;': '<',
  '&gt;': '>',
};

function decodeHtmlEntities(value) {
  return value.replace(/&(nbsp|amp|quot|#39|lt|gt);/g, (match) => ENTITY_MAP[match] || match);
}

export function parseFullDetailsRows(source) {
  if (!source) return null;

  const normalized = decodeHtmlEntities(
    String(source)
      .replace(BLOCK_LINE_BREAK_PATTERN, '\n')
      .replace(BREAK_TAG_PATTERN, '\n')
      .replace(TAG_PATTERN, '')
      .replace(/\r\n?/g, '\n'),
  )
    .replace(BREAK_TAG_PATTERN, '\n')
    .replace(/\u00a0/g, ' ');

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const rows = lines.map((line) => {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex <= 0 || separatorIndex >= line.length - 1) {
      return null;
    }

    const label = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!label || !value) {
      return null;
    }

    return [label, value];
  });

  return rows.every(Boolean) ? rows : null;
}

function replaceChildren(element, ...nodes) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }

  element.append(...nodes);
}

function buildFullDetailsTable(rows, doc) {
  const table = doc.createElement('table');

  rows.forEach(([label, value]) => {
    const row = doc.createElement('tr');
    const labelCell = doc.createElement('td');
    const valueCell = doc.createElement('td');

    labelCell.textContent = label;
    valueCell.textContent = value;
    row.append(labelCell, valueCell);
    table.append(row);
  });

  return table;
}

function enhanceFullDetailsBody(body, doc) {
  const source = body.innerHTML || body.textContent || '';

  if (/<table[\s>]/i.test(source)) {
    return;
  }

  const rows = parseFullDetailsRows(source);

  if (!rows) {
    return;
  }

  replaceChildren(body, buildFullDetailsTable(rows, doc));
}

function createAccordionItem(row, doc, { fullDetails = false } = {}) {
  // decorate accordion item label
  const label = row.children[0];
  const summary = doc.createElement('summary');
  summary.className = 'accordion-item-label';
  summary.append(...label.childNodes);

  // decorate accordion item body
  const body = row.children[1];
  body.className = 'accordion-item-body';

  if (fullDetails) {
    enhanceFullDetailsBody(body, doc);
  }

  // decorate accordion item
  const details = doc.createElement('details');
  details.className = 'accordion-item';
  details.append(summary, body);

  return details;
}

function bindSingleOpen(items) {
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;

      items.forEach((sibling) => {
        if (sibling !== item) {
          sibling.open = false;
        }
      });
    });
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const doc = block.ownerDocument || document;
  const items = rows.map((row) => createAccordionItem(row, doc, {
    fullDetails: block.classList.contains('full-details'),
  }));

  rows.forEach((row, index) => {
    row.replaceWith(items[index]);
  });

  if (block.classList.contains('single-open')) {
    bindSingleOpen(items);
  }
}
