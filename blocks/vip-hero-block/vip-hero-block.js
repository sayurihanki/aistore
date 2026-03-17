/**
 * VIP Hero Block
 *
 * Authoring contract (1 column, 26 rows after block name):
 *  0 memberName
 *  1 memberTagline
 *  2 heroNumber
 *  3 headlineLine1
 *  4 headlineLine2Emphasis
 *  5 headlineLine3Outline
 *  6 postscript
 *  7 description (rich text)
 *  8 ctaPrimary (link)
 *  9 ctaSecondary (link)
 * 10 perk1 (value | label)
 * 11 perk2 (value | label)
 * 12 perk3 (value | label)
 * 13 perk4 (value | label)
 * 14 dashboardEyebrow
 * 15 dashboardSubline
 * 16 metric1 (value | label | delta)
 * 17 metric2 (value | label | delta)
 * 18 metric3 (value | label | delta)
 * 19 order1 (po | meta | status | amount | tone)
 * 20 order2 (po | meta | status | amount | tone)
 * 21 order3 (po | meta | status | amount | tone)
 * 22 footerItem1 (icon | text)
 * 23 footerItem2 (icon | text)
 * 24 footerItem3 (icon | text)
 * 25 footerRightText
 */

/**
 * @param {HTMLElement} block
 * @param {number} rowIndex
 * @returns {HTMLElement | null}
 */
function rowCell(block, rowIndex) {
  const row = block.children[rowIndex];
  if (!row) return null;
  return row.querySelector('div') || row;
}

/**
 * @param {HTMLElement} block
 * @param {number} rowIndex
 * @returns {string}
 */
function rowText(block, rowIndex) {
  const cell = rowCell(block, rowIndex);
  return cell ? cell.innerText.trim() : '';
}

/**
 * @param {HTMLElement} block
 * @param {number} rowIndex
 * @returns {string}
 */
function rowHTML(block, rowIndex) {
  const cell = rowCell(block, rowIndex);
  return cell ? cell.innerHTML : '';
}

/**
 * @param {HTMLElement} block
 * @param {number} rowIndex
 * @returns {HTMLAnchorElement | null}
 */
function rowAnchor(block, rowIndex) {
  return block.children[rowIndex]?.querySelector('a') || null;
}

/**
 * @param {string} tag
 * @param {string} className
 * @param {Record<string,string>} attrs
 * @param {Array<HTMLElement | SVGElement | Text | null | undefined>} children
 * @returns {HTMLElement}
 */
function el(tag, className = '', attrs = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  children.forEach((child) => {
    if (child) node.append(child);
  });
  return node;
}

/**
 * @param {HTMLAnchorElement | null} anchor
 * @param {string} className
 * @param {string} icon
 * @returns {HTMLAnchorElement | null}
 */
function decorateCta(anchor, className, icon) {
  if (!anchor) return null;
  anchor.className = className;

  if (anchor.target === '_blank') {
    const rel = anchor.getAttribute('rel') || '';
    if (!rel.includes('noopener')) {
      anchor.setAttribute('rel', `${rel} noopener noreferrer`.trim());
    }
  }

  if (!anchor.querySelector('.vip-cta-icon')) {
    anchor.append(el('span', 'vip-cta-icon', { 'aria-hidden': 'true' }, [document.createTextNode(icon)]));
  }

  return anchor;
}

/**
 * @param {string} raw
 * @returns {HTMLElement | null}
 */
function buildPerk(raw) {
  const [value = '', label = ''] = raw.split('|').map((part) => part.trim());
  if (!value && !label) return null;

  return el('div', 'vip-perk', {}, [
    el('div', 'vip-perk-value', {}, [document.createTextNode(value)]),
    el('div', 'vip-perk-label', {}, [document.createTextNode(label)]),
  ]);
}

/**
 * @param {string} raw
 * @returns {HTMLElement | null}
 */
function buildMetric(raw) {
  const [value = '', label = '', delta = ''] = raw.split('|').map((part) => part.trim());
  if (!value && !label && !delta) return null;

  const children = [
    el('div', 'vip-metric-value', {}, [document.createTextNode(value)]),
    el('div', 'vip-metric-label', {}, [document.createTextNode(label)]),
  ];

  if (delta) {
    children.push(el('div', 'vip-metric-delta', {}, [document.createTextNode(delta)]));
  }

  return el('div', 'vip-metric', {}, children);
}

/**
 * @param {string} rawTone
 * @param {number} index
 * @returns {string}
 */
function resolveTone(rawTone, index) {
  const normalized = (rawTone || '').toLowerCase();
  if (['green', 'amber', 'blue'].includes(normalized)) return normalized;
  return ['green', 'amber', 'blue'][index % 3];
}

/**
 * @param {string} raw
 * @param {number} index
 * @returns {HTMLElement | null}
 */
function buildOrder(raw, index) {
  const [po = '', meta = '', status = '', amount = '', toneRaw = ''] = raw.split('|').map((part) => part.trim());
  if (!po && !meta && !status && !amount) return null;

  const tone = resolveTone(toneRaw, index);

  return el('div', 'vip-order-row', {}, [
    el('div', `vip-order-indicator vip-order-indicator-${tone}`, { 'aria-hidden': 'true' }),
    el('div', 'vip-order-info', {}, [
      el('div', 'vip-order-id', {}, [document.createTextNode(po)]),
      el('div', 'vip-order-meta', {}, [document.createTextNode(meta)]),
    ]),
    el('div', 'vip-order-right', {}, [
      el('div', `vip-order-status vip-order-status-${tone}`, {}, [document.createTextNode(status)]),
      el('div', 'vip-order-amount', {}, [document.createTextNode(amount)]),
    ]),
  ]);
}

/**
 * @param {string} raw
 * @returns {HTMLElement | null}
 */
function buildFooterItem(raw) {
  const [icon = '', text = ''] = raw.split('|').map((part) => part.trim());
  if (!icon && !text) return null;

  return el('div', 'vip-footer-item', {}, [
    el('div', 'vip-footer-item-icon', { 'aria-hidden': 'true' }, [document.createTextNode(icon || '◆')]),
    el('div', 'vip-footer-item-text', {}, [document.createTextNode(text)]),
  ]);
}

/**
 * @param {string} raw
 * @returns {HTMLElement}
 */
function buildFooterRightSegment(raw) {
  const segment = el('span', 'vip-footer-right-segment');
  const parts = raw.split(/(\b\d{4}\b|\b\d[\d,+-]*\b)/).filter(Boolean);

  parts.forEach((part) => {
    const className = /^\d[\d,+-]*$/.test(part)
      ? 'vip-footer-right-segment-emphasis'
      : 'vip-footer-right-segment-text';
    segment.append(el('span', className, {}, [document.createTextNode(part)]));
  });

  return segment;
}

/**
 * @param {string} raw
 * @returns {HTMLElement | null}
 */
function buildFooterRight(raw) {
  const normalized = raw.trim();
  if (!normalized) return null;

  const segments = normalized.split(/\s*[·•|]\s*/).filter(Boolean);
  if (!segments.length) return null;

  const children = [];

  segments.forEach((segment, index) => {
    if (index > 0) {
      children.push(
        el('span', 'vip-footer-right-separator', { 'aria-hidden': 'true' }, [
          document.createTextNode('·'),
        ]),
      );
    }

    children.push(buildFooterRightSegment(segment));
  });

  return el('div', 'vip-footer-right-copy', {}, children);
}

/**
 * @returns {SVGElement}
 */
function buildEditorialSvg() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'vip-editorial-svg');
  svg.setAttribute('viewBox', '0 0 300 400');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const create = (tag, attrs = {}) => {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  svg.append(
    create('rect', {
      x: '40', y: '20', width: '220', height: '360', rx: '2', class: 'vip-svg-frame',
    }),
  );

  const rows = [40, 72, 104, 136, 168, 200, 232, 264, 296, 328];
  rows.forEach((y, index) => {
    svg.append(
      create('rect', {
        x: '56',
        y: `${y}`,
        width: '188',
        height: '24',
        rx: '1',
        class: index === 4 ? 'vip-svg-row vip-svg-row-active' : 'vip-svg-row',
      }),
    );
  });

  [52, 84, 116, 148, 180, 212].forEach((cy, index) => {
    svg.append(
      create('circle', {
        cx: '224',
        cy: `${cy}`,
        r: '4',
        class: index === 4 ? 'vip-svg-dot vip-svg-dot-active' : 'vip-svg-dot',
      }),
    );
  });

  return svg;
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const memberName = rowText(block, 0) || 'Member';
  const memberTagline = rowText(block, 1) || 'Private Member Access · Strategic Reserve Program';
  const heroNumber = rowText(block, 2) || '';
  const headlineLine1 = rowText(block, 3) || 'Infrastructure';
  const headlineLine2 = rowText(block, 4) || 'reserved';
  const headlineLine3 = rowText(block, 5) || 'for few.';
  const postscript = rowText(block, 6) || 'Yours, on private allocation.';
  const descriptionHTML = rowHTML(block, 7);

  const ctaPrimary = decorateCta(rowAnchor(block, 8), 'vip-cta vip-cta-primary', '→');
  const ctaSecondary = decorateCta(rowAnchor(block, 9), 'vip-cta vip-cta-secondary', '↗');

  const perks = [10, 11, 12, 13]
    .map((rowIndex) => buildPerk(rowText(block, rowIndex)))
    .filter(Boolean);

  const dashboardEyebrow = rowText(block, 14) || 'Private Member Command Center';
  const dashboardSubline = rowText(block, 15) || 'Priority Infrastructure Concierge Desk';

  const metrics = [16, 17, 18]
    .map((rowIndex) => buildMetric(rowText(block, rowIndex)))
    .filter(Boolean);

  const orders = [19, 20, 21]
    .map((rowIndex, index) => buildOrder(rowText(block, rowIndex), index))
    .filter(Boolean);

  const footerItems = [22, 23, 24]
    .map((rowIndex) => buildFooterItem(rowText(block, rowIndex)))
    .filter(Boolean);

  const footerRight = rowText(block, 25) || 'Member since 1994 · Enterprise Infrastructure Program · Dedicated concierge · Priority inventory access';

  const tagline = el('div', 'vip-tagline', {}, [
    el('div', 'vip-tagline-rule', { 'aria-hidden': 'true' }),
    el('span', 'vip-tagline-text', {}, [document.createTextNode(memberTagline)]),
  ]);

  const headingWrap = el('div', 'vip-heading-wrap', {}, [
    el('span', 'vip-heading-pre', {}, [document.createTextNode(`Welcome back, ${memberName}.`)]),
    el('h1', 'vip-heading', {}, [
      el('span', 'vip-heading-line', {}, [document.createTextNode(headlineLine1)]),
      el('span', 'vip-heading-line vip-heading-emphasis', {}, [document.createTextNode(headlineLine2)]),
      el('span', 'vip-heading-line vip-heading-outlined', {}, [document.createTextNode(headlineLine3)]),
    ]),
    el('span', 'vip-heading-post', {}, [document.createTextNode(postscript)]),
  ]);

  const description = el('p', 'vip-description');
  if (descriptionHTML) {
    description.innerHTML = descriptionHTML;
  }

  const ctas = el('div', 'vip-ctas');
  if (ctaPrimary) ctas.append(ctaPrimary);
  if (ctaSecondary) ctas.append(ctaSecondary);

  const perksRow = el('div', 'vip-perks-row', {}, perks);

  const left = el('div', 'vip-left', {}, [
    el('div', 'vip-hero-number', { 'aria-hidden': 'true' }, [document.createTextNode(heroNumber)]),
    tagline,
    headingWrap,
    el('div', 'vip-separator', { 'aria-hidden': 'true' }),
    description,
    ctas,
    perksRow,
  ]);

  const welcomeMetrics = el('div', 'vip-metrics-grid', {}, metrics);

  const welcomeCard = el('div', 'vip-welcome-card', {}, [
    el('div', 'vip-welcome-eyebrow', {}, [
      el('div', 'vip-diamond', { 'aria-hidden': 'true' }),
      el('span', 'vip-welcome-eyebrow-text', {}, [document.createTextNode(dashboardEyebrow)]),
    ]),
    el('div', 'vip-welcome-greeting', {}, [
      document.createTextNode('Good morning, '),
      el('em', '', {}, [document.createTextNode(memberName)]),
      document.createTextNode('.'),
    ]),
    el('div', 'vip-welcome-subline', {}, [document.createTextNode(dashboardSubline)]),
    welcomeMetrics,
  ]);

  const editorial = el('div', 'vip-editorial', {}, [
    el('div', 'vip-editorial-overlay', { 'aria-hidden': 'true' }),
    buildEditorialSvg(),
    welcomeCard,
  ]);

  const orderPanel = el('div', 'vip-order-panel', {}, [
    el('div', 'vip-order-panel-header', {}, [
      el('span', 'vip-order-panel-title', {}, [document.createTextNode('VIP Fulfillment Ledger')]),
      el('span', 'vip-order-panel-meta', {}, [document.createTextNode('Private Operations Feed')]),
    ]),
    ...orders,
  ]);

  const right = el('div', 'vip-right', {}, [editorial, orderPanel]);

  const body = el('div', 'vip-body', {}, [left, right]);

  const footerChildren = [];

  if (footerItems.length) {
    footerChildren.push(el('div', 'vip-footer-left', {}, footerItems));
  }

  if (footerRight) {
    const footerRightNode = buildFooterRight(footerRight);
    if (footerRightNode) {
      footerChildren.push(el('div', 'vip-footer-right', {}, [footerRightNode]));
    }
  }

  const shellChildren = [body];

  if (footerChildren.length) {
    const footerClassName = footerChildren.length === 1 ? 'vip-footer vip-footer-single' : 'vip-footer';
    shellChildren.push(el('div', footerClassName, {}, footerChildren));
  }

  const shell = el('div', 'vip-shell', {}, shellChildren);

  block.textContent = '';
  block.append(shell);
}
