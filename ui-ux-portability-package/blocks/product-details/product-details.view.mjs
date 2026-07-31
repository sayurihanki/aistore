const SVG_MARKUP = Object.freeze({
  starFilled: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
  starOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  returns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 14L4 9l5-5"></path><path d="M4 9h11a5 5 0 1 1 0 10h-1"></path></svg>',
});

function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }

  Object.entries(attrs).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(name, value);
    }
  });

  return element;
}

function createIconMarkup(name) {
  return SVG_MARKUP[name] || '';
}

function createStarsMarkup(rating = 0) {
  const rounded = Math.round(Number(rating) || 0);
  let markup = '';

  for (let index = 1; index <= 5; index += 1) {
    markup += index <= rounded ? SVG_MARKUP.starFilled : SVG_MARKUP.starOutline;
  }

  return markup;
}

export function formatCurrency(value, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    return `$${amount.toFixed(2)}`;
  }
}

export function getDisplayedPriceText(priceRoot, experience) {
  if (!priceRoot) {
    return formatCurrency(
      experience?.priceSummary?.currentAmount,
      experience?.priceSummary?.currency,
    );
  }

  const selectors = [
    '.pdp-price__amount-special',
    '.pdp-price__amount',
    '.pdp-price-range',
    '.dropin-price',
  ];

  const text = selectors
    .map((selector) => priceRoot.querySelector(selector)?.textContent?.trim())
    .find(Boolean);

  return text || formatCurrency(
    experience?.priceSummary?.currentAmount,
    experience?.priceSummary?.currency,
  );
}

function renderBreadcrumbs(container, breadcrumbs = []) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  breadcrumbs.forEach((entry, index) => {
    const isLast = index === breadcrumbs.length - 1;
    const node = entry.href && !isLast
      ? createElement('a', 'product-details__breadcrumb-link', { href: entry.href })
      : createElement(
        'span',
        isLast ? 'product-details__breadcrumb-current' : 'product-details__breadcrumb-link',
      );

    node.textContent = entry.label;
    container.append(node);

    if (!isLast) {
      const separator = createElement('span', 'product-details__breadcrumb-separator', {
        'aria-hidden': 'true',
      });
      separator.textContent = '›';
      container.append(separator);
    }
  });
}

function renderBadges(containers = [], badges = []) {
  containers.filter(Boolean).forEach((container) => {
    container.replaceChildren();

    if (!badges.length) {
      container.hidden = true;
      return;
    }

    badges.forEach((badge) => {
      const item = createElement(
        'span',
        `product-details__gallery-badge product-details__gallery-badge--${badge.tone}`,
      );
      item.textContent = badge.label;
      container.append(item);
    });

    container.hidden = false;
  });
}

function renderRatingRow(container, reviews) {
  if (!container) {
    return;
  }

  if (!reviews?.count) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  const stars = createElement('div', 'product-details__rating-stars');
  stars.innerHTML = createStarsMarkup(reviews.rating);

  const copy = createElement('span', 'product-details__rating-text');
  copy.append(`${reviews.rating.toFixed(1)} out of 5 · `);
  const link = createElement('a', 'product-details__rating-link', {
    href: '#reviews',
  });
  link.textContent = `${reviews.count} Reviews`;
  copy.append(link);

  container.replaceChildren(stars, copy);
  container.hidden = false;
}

function renderPromo(container, promo) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!promo?.text && !promo?.code) {
    container.hidden = true;
    return;
  }

  const icon = createElement('span', 'product-details__promo-icon', {
    'aria-hidden': 'true',
  });
  icon.innerHTML = SVG_MARKUP.tag;

  const text = createElement('span', 'product-details__promo-text');
  const [prefix, suffix] = promo.text.split(promo.highlight || '').filter(Boolean);
  if (promo.highlight && promo.text.includes(promo.highlight)) {
    if (prefix) {
      text.append(prefix);
    }

    const highlight = createElement('strong');
    highlight.textContent = promo.highlight;
    text.append(highlight);

    if (suffix) {
      text.append(suffix);
    }
  } else {
    text.textContent = promo.text;
  }

  const code = promo.copyEnabled
    ? createElement('button', 'product-details__promo-code', {
      type: 'button',
    })
    : createElement('span', 'product-details__promo-code');
  code.textContent = promo.code;

  if (promo.copyEnabled) {
    code.addEventListener('click', async () => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(promo.code);
        } catch (error) {
          console.debug('Unable to copy promo code to clipboard:', error);
        }
      }

      const original = promo.code;
      code.textContent = 'Copied!';
      code.classList.add('is-copied');
      window.setTimeout(() => {
        code.textContent = original;
        code.classList.remove('is-copied');
      }, 1500);
    });
  }

  container.append(icon, text, code);
  container.hidden = false;
}

function renderShippingCards(container, cards = []) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  cards.forEach((card) => {
    const article = createElement('article', 'product-details__shipping-card');
    const icon = createElement('span', 'product-details__shipping-card-icon', {
      'aria-hidden': 'true',
    });
    icon.innerHTML = createIconMarkup(card.icon);
    const title = createElement('h3', 'product-details__shipping-card-title');
    title.textContent = card.title;
    const subtitle = createElement('p', 'product-details__shipping-card-subtitle');
    subtitle.textContent = card.subtitle;
    article.append(icon, title, subtitle);
    container.append(article);
  });
}

function renderPriceSavings(container, experience) {
  if (!container) {
    return;
  }

  const savingsAmount = experience?.priceSummary?.savingsAmount || 0;
  if (savingsAmount <= 0) {
    container.hidden = true;
    container.textContent = '';
    return;
  }

  container.textContent = `Save ${formatCurrency(
    savingsAmount,
    experience?.priceSummary?.currency,
  )}`;
  container.hidden = false;
}

function renderStockTag(container, product, experience) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  const message = product?.inStock ? experience.stockMessage : 'Out of Stock';
  container.classList.toggle('is-out-of-stock', !product?.inStock);

  const dot = createElement('span', 'product-details__stock-dot', {
    'aria-hidden': 'true',
  });
  const copy = createElement('span', 'product-details__stock-copy');
  copy.textContent = message;
  container.append(dot, copy);
}

function renderAccordionCopy(container, html) {
  if (container) {
    container.innerHTML = html;
  }
}

function createReviewCard(review) {
  const card = createElement('article', 'product-details__review-card');
  const top = createElement('div', 'product-details__review-card-top');
  const avatar = createElement('div', 'product-details__review-avatar');
  avatar.textContent = review.initials;
  const meta = createElement('div', 'product-details__review-meta');
  const name = createElement('div', 'product-details__review-name');
  name.textContent = review.name;
  const date = createElement('div', 'product-details__review-date');
  date.textContent = review.date;
  meta.append(name, date);
  top.append(avatar, meta);

  const stars = createElement('div', 'product-details__review-stars');
  stars.innerHTML = createStarsMarkup(review.rating);

  card.append(top, stars);

  if (review.verified) {
    const verified = createElement('div', 'product-details__review-verified');
    const icon = createElement('span', 'product-details__review-verified-icon', {
      'aria-hidden': 'true',
    });
    icon.innerHTML = SVG_MARKUP.check;
    const text = createElement('span');
    text.textContent = 'Verified Purchase';
    verified.append(icon, text);
    card.append(verified);
  }

  const body = createElement('p', 'product-details__review-body');
  body.textContent = review.body;
  card.append(body);

  return card;
}

function renderReviewsSection(section, experience) {
  if (!section) {
    return;
  }

  const reviews = experience?.reviews;
  section.replaceChildren();

  if (!reviews?.count) {
    section.hidden = true;
    return;
  }

  const label = createElement('div', 'product-details__section-label');
  label.textContent = 'Customer Reviews';

  const title = createElement('h2', 'product-details__section-title');
  title.innerHTML = 'What People<br>Are Saying';

  const summary = createElement('div', 'product-details__review-summary');
  const big = createElement('div', 'product-details__review-big');
  const bigNum = createElement('div', 'product-details__review-big-num');
  bigNum.textContent = reviews.rating.toFixed(1);
  const bigStars = createElement('div', 'product-details__review-big-stars');
  bigStars.innerHTML = createStarsMarkup(reviews.rating);
  const bigCount = createElement('div', 'product-details__review-big-count');
  bigCount.textContent = `${reviews.count} Reviews`;
  big.append(bigNum, bigStars, bigCount);

  const bars = createElement('div', 'product-details__review-bars');
  const total = reviews.distribution.reduce((sum, count) => sum + count, 0) || reviews.count;
  reviews.distribution.forEach((count, index) => {
    const row = createElement('div', 'product-details__review-bar-row');
    const labelNode = createElement('span', 'product-details__review-bar-label');
    labelNode.textContent = String(5 - index);
    const track = createElement('div', 'product-details__review-bar-track');
    const fill = createElement('div', 'product-details__review-bar-fill');
    fill.style.width = `${Math.round((count / total) * 100)}%`;
    track.append(fill);
    const countNode = createElement('span', 'product-details__review-bar-count');
    countNode.textContent = String(count);
    row.append(labelNode, track, countNode);
    bars.append(row);
  });

  summary.append(big, bars);

  const cards = createElement('div', 'product-details__review-cards');
  reviews.items.forEach((review) => {
    cards.append(createReviewCard(review));
  });

  section.append(label, title, summary, cards);
  section.hidden = false;
}

export function renderProductDetailsExperience(nodes = {}, { experience } = {}) {
  renderBreadcrumbs(nodes.breadcrumb, experience?.breadcrumbs || []);
  if (nodes.eyebrow) {
    nodes.eyebrow.textContent = experience?.eyebrow || '';
  }

  renderBadges(nodes.badgeContainers, experience?.badges || []);
  renderRatingRow(nodes.ratingRow, experience?.reviews);
  renderPromo(nodes.promo, experience?.promo);
  renderShippingCards(nodes.shippingCards, experience?.shippingCards || []);
  renderAccordionCopy(nodes.shippingPanel, experience?.accordion?.shippingHtml || '');
  renderAccordionCopy(nodes.returnsPanel, experience?.accordion?.returnsHtml || '');
  renderReviewsSection(nodes.reviewsSection, experience);

  if (nodes.priceTax) {
    nodes.priceTax.innerHTML = `${SVG_MARKUP.shield}<span>${experience?.taxMessage || ''}</span>`;
  }
}

export function syncProductDetailsCommerceUi(nodes = {}, { product, experience } = {}) {
  renderPriceSavings(nodes.priceSavings, experience);
  renderStockTag(nodes.stockTag, product, experience);

  if (nodes.stickyName) {
    nodes.stickyName.textContent = nodes.header?.querySelector('.pdp-header__title')
      ?.textContent?.trim() || experience?.stickyName || '';
  }

  if (nodes.stickyPrice) {
    nodes.stickyPrice.textContent = getDisplayedPriceText(nodes.priceRoot, experience);
  }

  if (nodes.stickyAtc) {
    nodes.stickyAtc.classList.toggle('is-hidden', !product);
  }
}
