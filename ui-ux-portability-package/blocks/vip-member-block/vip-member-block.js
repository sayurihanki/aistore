/**
 * VIP Member Block
 *
 * Authoring contract (1 column, 39 rows after block name):
 *  0  eyebrowText
 *  1  title (rich text — use <em> for accent)
 *  2  subtitle
 *  3  stat1 (value | label)
 *  4  stat2 (value | label)
 *  5  stat3 (value | label)
 *  6  featuredLabel
 *  7  featuredDiscount (value | label)
 *  8  featuredCategory
 *  9  featuredTitle
 * 10  featuredDesc
 * 11  featuredPrice (member | was | tag)
 * 12  featuredCtaPrimary (link)
 * 13  featuredCtaSecondary (link)
 * 14  benefit1 (title | desc | linkText | linkUrl)
 * 15  benefit2 (title | desc | linkText | linkUrl)
 * 16  benefit3 (title | desc | linkText | linkUrl)
 * 17  benefit4 (title | desc | linkText | linkUrl)
 * 18  spotlightLabel
 * 19  spotlightCount
 * 20  spotlightItem1 (name | meta | memberPrice | wasPrice)
 * 21  spotlightItem2 (name | meta | memberPrice | wasPrice)
 * 22  spotlightItem3 (name | meta | memberPrice | wasPrice)
 * 23  spotlightFooterText
 * 24  spotlightFooterLink (link)
 * 25  accountName
 * 26  accountOrg
 * 27  metric1 (value | label | delta | green?)
 * 28  metric2 (value | label | delta)
 * 29  metric3 (value | label | delta | green?)
 * 30  metric4 (value | label | delta)
 * 31  action1 (label | badge?)
 * 32  action2 (label | badge?)
 * 33  action3 (label | badge?)
 * 34  proof1 (title | sub)
 * 35  proof2 (title | sub)
 * 36  proof3 (title | sub)
 * 37  proofCtaPrimary (link)
 * 38  proofCtaSub
 */

/**
 * @param {HTMLElement} block
 * @param {number} idx
 * @returns {HTMLElement | null}
 */
function rowCell(block, idx) {
  const row = block.children[idx];
  if (!row) return null;
  return row.querySelector('div') || row;
}

/**
 * @param {HTMLElement} block
 * @param {number} idx
 * @returns {string}
 */
function rowText(block, idx) {
  const cell = rowCell(block, idx);
  return cell ? cell.innerText.trim() : '';
}

/**
 * @param {HTMLElement} block
 * @param {number} idx
 * @returns {string}
 */
function rowHTML(block, idx) {
  const cell = rowCell(block, idx);
  return cell ? cell.innerHTML : '';
}

/**
 * @param {HTMLElement} block
 * @param {number} idx
 * @returns {HTMLAnchorElement | null}
 */
function rowAnchor(block, idx) {
  return block.children[idx]?.querySelector('a') || null;
}

/**
 * @param {string} tag
 * @param {string} cls
 * @param {Record<string,string>} attrs
 * @param {Array<Node | null | undefined>} children
 * @returns {HTMLElement}
 */
function el(tag, cls = '', attrs = {}, children = []) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach((c) => { if (c) node.append(c); });
  return node;
}

function text(str) {
  return document.createTextNode(str);
}

/**
 * Build benefit icon SVGs (reusable set).
 * @param {number} index
 * @returns {SVGElement}
 */
function benefitIcon(index) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');

  const paths = [
    // layers
    '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    // clock
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    // credit card
    '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    // document
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  ];

  svg.innerHTML = paths[index % paths.length];
  return svg;
}

/**
 * Build spotlight item thumb SVG.
 * @param {number} index
 * @returns {SVGElement}
 */
function spotlightIcon(index) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');

  const paths = [
    '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  ];

  svg.innerHTML = paths[index % paths.length];
  return svg;
}

/**
 * Build proof strip icon SVG.
 * @param {number} index
 * @returns {SVGElement}
 */
function proofIcon(index) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');

  const paths = [
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  ];

  svg.innerHTML = paths[index % paths.length];
  return svg;
}

/**
 * Build the decorative rack SVG for the featured card visual.
 * @returns {SVGElement}
 */
function buildRackSvg() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '180');
  svg.setAttribute('height', '200');
  svg.setAttribute('viewBox', '0 0 180 200');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.opacity = '0.35';
  svg.style.position = 'absolute';

  const create = (tag, attrs = {}) => {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  svg.append(create('rect', {
    x: '20', y: '10', width: '140', height: '180', rx: '2', stroke: 'white', 'stroke-width': '1',
  }));

  const ys = [24, 46, 68, 90, 112, 134, 156];
  ys.forEach((y, i) => {
    svg.append(create('rect', {
      x: '32',
      y: `${y}`,
      width: '116',
      height: '16',
      rx: '1',
      fill: i === 2 ? '#26a067' : 'white',
      'fill-opacity': i === 2 ? '0.3' : '0.08',
      stroke: i === 2 ? '#26a067' : 'white',
      'stroke-width': '0.5',
    }));
  });

  [32, 54, 76, 98].forEach((cy) => {
    svg.append(create('circle', {
      cx: '136',
      cy: `${cy}`,
      r: '3',
      fill: '#26a067',
      'fill-opacity': cy === 76 ? '1' : '0.7',
    }));
  });

  return svg;
}

/**
 * @param {string} raw
 * @returns {{ value: string, label: string }}
 */
function parsePair(raw) {
  const [value = '', label = ''] = raw.split('|').map((s) => s.trim());
  return { value, label };
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  /* ── Parse authoring rows ── */
  const eyebrowText = rowText(block, 0) || 'Private Member Offers — Q1 2025';
  const titleHTML = rowHTML(block, 1) || 'Your <em>exclusive</em> catalog access.';
  const subtitle = rowText(block, 2) || 'Member-only pricing, first-access inventory, and concierge procurement — built for enterprise IT operations.';

  const stats = [3, 4, 5].map((i) => parsePair(rowText(block, i))).filter((s) => s.value);

  const featuredLabel = rowText(block, 6) || 'Member Exclusive';
  const featuredDiscount = parsePair(rowText(block, 7) || '15% | Member Rate');
  const featuredCategory = rowText(block, 8) || 'Infrastructure · Server Racks';
  const featuredTitle = rowText(block, 9) || 'Bodea NE Series Network Enclosures';
  const featuredDesc = rowText(block, 10) || 'Enterprise-grade modular enclosures from 6U to 42U.';
  const featuredPriceRaw = rowText(block, 11) || 'From $331.55 | $349.00 | Member Rate';
  const [fpMember = '', fpWas = '', fpTag = ''] = featuredPriceRaw.split('|').map((s) => s.trim());
  const featuredCtaPrimary = rowAnchor(block, 12);
  const featuredCtaSecondary = rowAnchor(block, 13);

  const benefits = [14, 15, 16, 17].map((i) => {
    const raw = rowText(block, i);
    if (!raw) return null;
    const parts = raw.split('|').map((s) => s.trim());
    return {
      title: parts[0] || '', desc: parts[1] || '', linkText: parts[2] || '', linkUrl: parts[3] || '#',
    };
  }).filter(Boolean);

  const spotlightLabel = rowText(block, 18) || 'Member Pricing — Active Deals';
  const spotlightCount = rowText(block, 19) || '6 of 14 categories';

  const spotlightItems = [20, 21, 22].map((i) => {
    const raw = rowText(block, i);
    if (!raw) return null;
    const parts = raw.split('|').map((s) => s.trim());
    return {
      name: parts[0] || '', meta: parts[1] || '', memberPrice: parts[2] || '', wasPrice: parts[3] || '',
    };
  }).filter(Boolean);

  const spotlightFooterText = rowText(block, 23) || 'Member pricing applied at checkout';
  const spotlightFooterLink = rowAnchor(block, 24);

  const accountName = rowText(block, 25) || 'David · Server Savvy Inc.';
  const accountOrg = rowText(block, 26) || 'West Region · Elite Member · Since 1994';

  const metrics = [27, 28, 29, 30].map((i) => {
    const raw = rowText(block, i);
    if (!raw) return null;
    const parts = raw.split('|').map((s) => s.trim());
    return {
      value: parts[0] || '', label: parts[1] || '', delta: parts[2] || '', green: (parts[3] || '').toLowerCase() === 'green',
    };
  }).filter(Boolean);

  const actions = [31, 32, 33].map((i) => {
    const raw = rowText(block, i);
    if (!raw) return null;
    const parts = raw.split('|').map((s) => s.trim());
    return { label: parts[0] || '', badge: parts[1] || '' };
  }).filter(Boolean);

  const proofItems = [34, 35, 36].map((i) => {
    const raw = rowText(block, i);
    if (!raw) return null;
    const parts = raw.split('|').map((s) => s.trim());
    return { title: parts[0] || '', sub: parts[1] || '' };
  }).filter(Boolean);

  const proofCtaAnchor = rowAnchor(block, 37);
  const proofCtaSub = rowText(block, 38) || 'Negotiated catalog · All categories';

  /* ── Build DOM ── */

  // Header
  const header = el('div', 'vmb-header', {}, [
    el('div', 'vmb-header-left', {}, [
      el('div', 'vmb-eyebrow', {}, [
        el('div', 'vmb-eyebrow-diamond', { 'aria-hidden': 'true' }),
        el('span', 'vmb-eyebrow-text', {}, [text(eyebrowText)]),
      ]),
      (() => {
        const h2 = el('h2', 'vmb-title');
        h2.innerHTML = titleHTML;
        return h2;
      })(),
      el('p', 'vmb-sub', {}, [text(subtitle)]),
    ]),
    el('div', 'vmb-header-right', { 'aria-label': 'Account statistics' }, stats.map((s) => el('div', 'vmb-stat', {}, [
      el('div', 'vmb-stat-val', {}, [text(s.value)]),
      el('div', 'vmb-stat-label', {}, [text(s.label)]),
    ]))),
  ]);

  // Featured card
  const featured = el('div', 'vmb-card vmb-featured', {}, [
    el('div', 'vmb-featured-visual', {}, [
      el('div', 'vmb-featured-label', {}, [
        el('div', 'vmb-featured-label-dot', { 'aria-hidden': 'true' }),
        el('span', '', {}, [text(featuredLabel)]),
      ]),
      buildRackSvg(),
      el('div', 'vmb-featured-discount', {}, [
        el('div', 'vmb-featured-discount-pct', {}, [text(featuredDiscount.value)]),
        el('div', 'vmb-featured-discount-label', {}, [text(featuredDiscount.label)]),
      ]),
    ]),
    el('div', 'vmb-featured-body', {}, [
      el('div', 'vmb-featured-category', {}, [text(featuredCategory)]),
      el('h3', 'vmb-featured-title', {}, [text(featuredTitle)]),
      el('div', 'vmb-featured-desc', {}, [text(featuredDesc)]),
      el('div', 'vmb-featured-pricing', {}, [
        el('div', 'vmb-price-member', {}, [text(fpMember)]),
        el('div', 'vmb-price-was', {}, [text(fpWas)]),
        fpTag ? el('div', 'vmb-price-tag', {}, [text(fpTag)]) : null,
      ]),
      el('div', 'vmb-cta-row', {}, [
        (() => {
          if (!featuredCtaPrimary) return el('a', 'vmb-cta vmb-cta-primary', { href: '#' }, [text('Shop Now'), el('span', '', { 'aria-hidden': 'true' }, [text('→')])]);
          featuredCtaPrimary.className = 'vmb-cta vmb-cta-primary';
          return featuredCtaPrimary;
        })(),
        (() => {
          if (!featuredCtaSecondary) return el('button', 'vmb-cta vmb-cta-secondary', {}, [text('Quote')]);
          featuredCtaSecondary.className = 'vmb-cta vmb-cta-secondary';
          return featuredCtaSecondary;
        })(),
      ]),
    ]),
  ]);

  // Benefits card
  const benefitsCard = el(
    'div',
    'vmb-card vmb-benefits',
    { role: 'list', 'aria-label': 'Member benefits' },
    benefits.map((b, i) => el('div', 'vmb-benefit', { role: 'listitem' }, [
      el('div', 'vmb-benefit-icon', { 'aria-hidden': 'true' }, [benefitIcon(i)]),
      el('div', 'vmb-benefit-text', {}, [
        el('div', 'vmb-benefit-title', {}, [text(b.title)]),
        el('div', 'vmb-benefit-desc', {}, [text(b.desc)]),
      ]),
      b.linkText ? el('a', 'vmb-benefit-link', { href: b.linkUrl }, [
        text(b.linkText),
        el('span', '', { 'aria-hidden': 'true' }, [text(' →')]),
      ]) : null,
    ])),
  );

  // Spotlight card
  const spotlightCard = el('div', 'vmb-card vmb-spotlight', {}, [
    el('div', 'vmb-spotlight-header', {}, [
      el('span', 'vmb-spotlight-label', {}, [text(spotlightLabel)]),
      el('span', 'vmb-spotlight-count', {}, [text(spotlightCount)]),
    ]),
    el(
      'div',
      'vmb-spotlight-items',
      { role: 'list', 'aria-label': 'Featured products' },
      spotlightItems.map((item, i) => el('div', 'vmb-spotlight-item', {
        role: 'listitem',
        tabindex: '0',
        'aria-label': `${item.name}, member price ${item.memberPrice}`,
      }, [
        el('div', 'vmb-spotlight-thumb', { 'aria-hidden': 'true' }, [spotlightIcon(i)]),
        el('div', 'vmb-spotlight-info', {}, [
          el('span', 'vmb-spotlight-name', {}, [text(item.name)]),
          el('span', 'vmb-spotlight-meta', {}, [text(item.meta)]),
        ]),
        el('div', 'vmb-spotlight-pricing', {}, [
          el('span', 'vmb-spotlight-price', {}, [text(item.memberPrice)]),
          el('span', 'vmb-spotlight-price-was', {}, [text(item.wasPrice)]),
        ]),
      ])),
    ),
    el('div', 'vmb-spotlight-footer', {}, [
      el('span', 'vmb-spotlight-footer-text', {}, [text(spotlightFooterText)]),
      (() => {
        if (spotlightFooterLink) {
          spotlightFooterLink.className = 'vmb-spotlight-footer-link';
          return spotlightFooterLink;
        }
        return el('a', 'vmb-spotlight-footer-link', { href: '#' }, [
          text('View Full Catalog'),
          el('span', '', { 'aria-hidden': 'true' }, [text(' →')]),
        ]);
      })(),
    ]),
  ]);

  // Account card
  const accountCard = el('div', 'vmb-card vmb-account', {}, [
    el('div', 'vmb-account-header', {}, [
      el('div', 'vmb-account-header-top', {}, [
        el('span', 'vmb-account-header-label', {}, [text('Account Overview')]),
        el('div', 'vmb-account-live', { 'aria-label': 'Account is live' }, [
          el('div', 'vmb-live-dot', { 'aria-hidden': 'true' }),
          text('Live'),
        ]),
      ]),
      el('div', 'vmb-account-name', {}, [text(accountName)]),
      el('div', 'vmb-account-org', {}, [text(accountOrg)]),
    ]),
    el(
      'div',
      'vmb-account-metrics',
      { role: 'list', 'aria-label': 'Account metrics' },
      metrics.map((m) => el('div', 'vmb-metric', { role: 'listitem' }, [
        el('div', `vmb-metric-val${m.green ? ' vmb-green' : ''}`, {}, [text(m.value)]),
        el('div', 'vmb-metric-label', {}, [text(m.label)]),
        m.delta ? el('div', 'vmb-metric-delta', {}, [text(m.delta)]) : null,
      ])),
    ),
    el(
      'div',
      'vmb-account-actions',
      {},
      actions.map((a) => {
        const row = el('div', 'vmb-action-row', {
          tabindex: '0',
          role: 'button',
          'aria-label': `${a.label}${a.badge ? `, ${a.badge}` : ''}`,
        }, [
          el('span', 'vmb-action-label', {}, [text(a.label)]),
          a.badge ? el('span', 'vmb-action-badge', {}, [text(a.badge)]) : null,
          el('span', 'vmb-action-arrow', { 'aria-hidden': 'true' }, [text('→')]),
        ]);

        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            row.click();
          }
        });

        return row;
      }),
    ),
  ]);

  // Grid
  const grid = el('div', 'vmb-grid', {}, [featured, benefitsCard, spotlightCard, accountCard]);

  // Proof strip
  const proofChildren = [];
  proofItems.forEach((p, i) => {
    if (i > 0) {
      proofChildren.push(el('div', 'vmb-proof-sep', { 'aria-hidden': 'true' }));
    }
    proofChildren.push(el('div', 'vmb-proof-item', {}, [
      el('div', 'vmb-proof-icon', { 'aria-hidden': 'true' }, [proofIcon(i)]),
      el('div', 'vmb-proof-text', {}, [
        el('div', 'vmb-proof-title', {}, [text(p.title)]),
        el('div', 'vmb-proof-sub', {}, [text(p.sub)]),
      ]),
    ]));
  });

  const proofCtaText = proofCtaAnchor ? proofCtaAnchor.textContent.trim() : 'Access Full Portal';
  const proofCta = el('a', 'vmb-proof-cta', {
    href: proofCtaAnchor ? proofCtaAnchor.href : '#',
    'aria-label': `${proofCtaText} — ${proofCtaSub}`,
  }, [
    el('div', 'vmb-proof-cta-text', {}, [
      el('div', 'vmb-proof-cta-main', {}, [text(proofCtaText)]),
      el('div', 'vmb-proof-cta-sub', {}, [text(proofCtaSub)]),
    ]),
    el('div', 'vmb-proof-cta-arrow', { 'aria-hidden': 'true' }, [text('→')]),
  ]);

  proofChildren.push(proofCta);

  const proofStrip = el('div', 'vmb-proof', {}, proofChildren);

  // Keyboard support for spotlight items
  block.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('vmb-spotlight-item') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ── Replace block content ── */
  block.textContent = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'VIP member offers');
  block.append(header, grid, proofStrip);
}
