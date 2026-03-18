import {
  cellText,
  createPictureFromCell,
  createLink,
  extractLink,
  getRows,
  parseKeyValueCell,
  parseLines,
} from '../../scripts/mcx-block-utils.js';

function formatPrice(value) {
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return value;
  return amount.toFixed(2);
}

function renderStars(value) {
  const rating = Math.max(0, Math.min(5, Math.round(Number.parseFloat(value) || 0)));
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

function buildCard(row) {
  const [imageCell, infoCell, metricsCell, configCell] = row;
  const details = parseLines(infoCell);
  const metrics = parseKeyValueCell(metricsCell);
  const config = parseKeyValueCell(configCell);
  const [brand = '', ...nameParts] = details;
  const name = nameParts.join(' ') || brand;
  const flags = (config.flags || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const card = document.createElement('article');
  card.className = 'prod-card reveal';
  card.dataset.cat = config.category || 'all';
  card.dataset.brand = brand;
  card.dataset.name = name;
  card.dataset.price = metrics.price || '';
  card.dataset.original = metrics.original || '';
  card.dataset.rating = metrics.rating || '5';
  card.dataset.reviews = metrics.reviews || '';
  card.dataset.emoji = config.emoji || '◆';
  card.dataset.sizes = config.sizes || '';
  card.dataset.chip = metrics.chip || '';
  card.dataset.flags = flags.join(', ');

  const imgZone = document.createElement('div');
  imgZone.className = 'prod-img-zone';
  const picture = createPictureFromCell(imageCell, false, [{ media: '(min-width: 900px)', width: '900' }, { width: '600' }]);
  if (picture) {
    picture.className = 'prod-img';
    imgZone.append(picture);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'prod-img-ph';
    placeholder.textContent = config.emoji || '◆';
    imgZone.append(placeholder);
  }

  const flagWrap = document.createElement('div');
  flagWrap.className = 'prod-flags';
  flags.forEach((flagText) => {
    const flag = document.createElement('span');
    const normalized = flagText.toLowerCase();
    let variant = 'f-new';
    if (normalized.includes('sale') || normalized.includes('off')) variant = 'f-sale';
    if (normalized.includes('exclusive') || normalized.includes('bundle')) variant = 'f-excl';
    if (normalized.includes('rated') || normalized.includes('seller')) variant = 'f-hot';
    flag.className = `flag ${variant}`;
    flag.textContent = flagText;
    flagWrap.append(flag);
  });
  imgZone.append(flagWrap);

  const love = document.createElement('button');
  love.className = 'prod-love';
  love.type = 'button';
  love.setAttribute('aria-label', `Save ${name} to wishlist`);
  love.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
  imgZone.append(love);

  const addToCart = document.createElement('button');
  addToCart.className = 'prod-atc';
  addToCart.type = 'button';
  addToCart.setAttribute('aria-label', `Add ${name} to cart`);
  addToCart.textContent = '+ Add to Cart';
  imgZone.append(addToCart);
  card.append(imgZone);

  const info = document.createElement('div');
  info.className = 'prod-info';
  info.innerHTML = `
    <div class="prod-brand">${brand}</div>
    <div class="prod-name">${name}</div>
    <div class="prod-stars">
      <span class="stars-row">${renderStars(metrics.rating || '5')}</span>
      <span class="stars-ct">(${metrics.reviews || '0'})</span>
    </div>
    <div class="prod-pricing">
      <span class="p-current">$${formatPrice(metrics.price || '0')}</span>
      ${metrics.original ? `<span class="p-orig">$${formatPrice(metrics.original)}</span>` : ''}
      ${metrics.chip ? `<span class="p-chip">${metrics.chip}</span>` : ''}
    </div>
  `;
  card.append(info);

  return card;
}

export default function decorate(block) {
  const rows = getRows(block);
  const config = {};
  const cards = [];

  rows.forEach((row) => {
    const [firstCell, secondCell] = row;
    const key = cellText(firstCell).toLowerCase();
    if (['tabs', 'default-tab', 'label', 'title', 'view-link'].includes(key)) {
      config[key] = key === 'view-link' ? extractLink(secondCell) : cellText(secondCell);
      return;
    }
    if (cellText(firstCell) || cellText(secondCell) || cellText(row[2]) || cellText(row[3])) {
      cards.push(buildCard(row));
    }
  });

  const wrapper = document.createElement('div');

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

    wrapper.append(head);
  }

  const grid = document.createElement('div');
  grid.className = 'prod-grid';
  cards.forEach((card) => grid.append(card));
  wrapper.append(grid);

  block.replaceChildren(wrapper);
}
