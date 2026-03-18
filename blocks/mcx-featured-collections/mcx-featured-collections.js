import {
  cellText,
  createLink,
  createPictureFromCell,
  extractLink,
  getRows,
} from '../../scripts/mcx-block-utils.js';

function buildCard(row, className) {
  const [imageCell, tagCell, titleCell, ctaCell] = row;
  const card = document.createElement('article');
  card.className = `feat-card ${className}`;
  const ctaData = extractLink(ctaCell, 'Shop Now');

  const picture = createPictureFromCell(imageCell, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '700' }]);
  if (picture) card.append(picture);

  const veil = document.createElement('div');
  veil.className = 'feat-veil';
  card.append(veil);

  const body = document.createElement('div');
  body.className = 'feat-body';
  body.innerHTML = `
    <div class="feat-cat">${cellText(tagCell)}</div>
    <div class="feat-name">${cellText(titleCell)}</div>
  `;

  const cta = createLink('feat-link', ctaData.href, ctaData.text || 'Shop Now');
  cta.innerHTML = `${cta.textContent} <span aria-hidden="true">&rarr;</span>`;
  body.append(cta);
  card.append(body);

  return card;
}

export default function decorate(block) {
  const config = {};
  const rows = [];
  getRows(block).forEach((row) => {
    const [firstCell, secondCell] = row;
    const key = cellText(firstCell).toLowerCase();
    if (['label', 'title', 'view-link'].includes(key)) {
      config[key] = key === 'view-link' ? extractLink(secondCell) : cellText(secondCell);
      return;
    }
    if (row.some((cell) => cellText(cell))) rows.push(row);
  });

  const fragment = document.createDocumentFragment();
  if (config.label || config.title) {
    const head = document.createElement('div');
    head.className = 'sec-head reveal';
    head.innerHTML = `
      <div>
        ${config.label ? `<span class="sec-label">${config.label}</span>` : ''}
        ${config.title ? `<h2 class="sec-title">${config.title}</h2>` : ''}
      </div>
    `;
    if (config['view-link']?.text) {
      head.append(createLink('view-link', config['view-link'].href, config['view-link'].text));
    }
    fragment.append(head);
  }

  const layout = document.createElement('div');
  layout.className = 'feat-layout reveal';

  if (rows[0]) layout.append(buildCard(rows[0], 'feat-main'));

  const right = document.createElement('div');
  right.className = 'feat-right';
  rows.slice(1, 3).forEach((row) => right.append(buildCard(row, '')));
  layout.append(right);

  fragment.append(layout);
  block.replaceChildren(fragment);
}
