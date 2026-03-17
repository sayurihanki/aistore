import {
  cellText,
  createLink,
  createTextElement,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';
import { isMcxLibraryPreviewPath } from '../../scripts/mcx-preview.js';

const QUICK_LINK_KEYS = ['1', '2', '3', '4'];
const INTEL_KEYS = ['1', '2', '3', '4'];
const RANK_KEYS = ['1', '2', '3'];
const STAT_KEYS = ['1', '2', '3', '4'];
const PARTICLE_COUNT = 24;
const QUICK_LINK_TONES = new Set(['red', 'gold', 'teal']);
const QUICK_LINK_ICON_ALIASES = {
  clock: 'clock',
  new: 'clock',
  whatsnew: 'clock',
  'whats-new': 'clock',
  deals: 'wallet',
  pcs: 'wallet',
  'pcs-deals': 'wallet',
  wallet: 'wallet',
  card: 'wallet',
  shield: 'shield',
  uniform: 'shield',
  uniforms: 'shield',
  pin: 'pin',
  store: 'pin',
  locator: 'pin',
  location: 'pin',
  'store-locator': 'pin',
};
const QUICK_LINK_ICON_MARKUP = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v10l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
};
const LIBRARY_PREVIEW_DEFAULTS = {
  eyebrow: 'New to Base · Start Here · Active Duty',
  'heading-line-1': 'WELCOME',
  'heading-line-2': 'ABOARD',
  'heading-line-3': 'your exchange, your way',
  description:
    'Just got your orders? Your Marine Corps Exchange is already here for you. Tax-free'
    + ' shopping, PCS discounts, and everything you need to settle in - from uniforms to'
    + ' home essentials. This is day one.',
  'primary-cta': {
    href: '#get-started',
    text: 'Get Started',
  },
  'secondary-cta': {
    href: '#explore',
    text: 'Explore Deals',
  },
  ranks: [
    'NEW TO BASE',
    'FIRST DUTY STATION',
    'CHECK-IN READY',
  ],
  quickLinks: [
    {
      label: "What's New",
      href: '#whats-new',
      icon: 'clock',
      tone: 'red',
    },
    {
      label: 'PCS Deals',
      href: '#pcs-deals',
      icon: 'deals',
      tone: 'gold',
    },
    {
      label: 'Uniforms',
      href: '#uniforms',
      icon: 'shield',
      tone: 'teal',
    },
    {
      label: 'Find Your Store',
      href: '#store-locator',
      icon: 'pin',
      tone: 'red',
    },
  ],
  intel: [
    {
      tag: 'First Stop',
      value: 'Day One',
      sub: 'Base essentials for your first week',
      progress: '78',
    },
    {
      tag: 'PCS Support',
      value: '30% Off',
      sub: 'Welcome savings at your new exchange',
      progress: '100',
    },
    {
      tag: 'Uniform Ready',
      value: 'Ready Now',
      sub: 'Grab service basics after check-in',
      progress: '92',
    },
    {
      tag: 'Your Benefit',
      value: 'Tax Free',
      sub: 'Savings from your first stop on base',
      progress: '100',
    },
  ],
  stats: [
    {
      value: '30%',
      label: 'PCS Welcome Discount',
    },
    {
      value: 'Tax Free',
      label: 'Every Purchase',
    },
    {
      value: '127+',
      label: 'Exchange Locations',
    },
    {
      value: '24hr',
      label: 'Express Pickup',
    },
  ],
};

const isLibraryPreview = () => isMcxLibraryPreviewPath(window.location.pathname);

function createSvgArrow() {
  const wrapper = document.createElement('span');
  wrapper.className = 'btn-arrow';
  wrapper.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>';
  return wrapper;
}

function createFieldCell(text) {
  const cell = document.createElement('div');
  cell.textContent = text;
  return cell;
}

function createLinkCell(href, text) {
  const cell = document.createElement('div');
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  cell.append(link);
  return cell;
}

function getDefaultLibraryFields() {
  const fields = {
    eyebrow: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.eyebrow),
    'heading-line-1': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-1']),
    'heading-line-2': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-2']),
    'heading-line-3': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-3']),
    description: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.description),
    'primary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].text,
    ),
    'secondary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].text,
    ),
  };

  LIBRARY_PREVIEW_DEFAULTS.ranks.forEach((badge, index) => {
    fields[`rank-badge-${index + 1}`] = createFieldCell(badge);
  });

  LIBRARY_PREVIEW_DEFAULTS.quickLinks.forEach((quickLink, index) => {
    const slot = index + 1;
    fields[`quick-link-${slot}-label`] = createFieldCell(quickLink.label);
    fields[`quick-link-${slot}-href`] = createFieldCell(quickLink.href);
    fields[`quick-link-${slot}-icon`] = createFieldCell(quickLink.icon);
    fields[`quick-link-${slot}-tone`] = createFieldCell(quickLink.tone);
  });

  LIBRARY_PREVIEW_DEFAULTS.intel.forEach((intel, index) => {
    const slot = index + 1;
    fields[`intel-${slot}-tag`] = createFieldCell(intel.tag);
    fields[`intel-${slot}-value`] = createFieldCell(intel.value);
    fields[`intel-${slot}-sub`] = createFieldCell(intel.sub);
    fields[`intel-${slot}-progress`] = createFieldCell(intel.progress);
  });

  LIBRARY_PREVIEW_DEFAULTS.stats.forEach((stat, index) => {
    const slot = index + 1;
    fields[`stat-${slot}-value`] = createFieldCell(stat.value);
    fields[`stat-${slot}-label`] = createFieldCell(stat.label);
  });

  return fields;
}

function normalizeToken(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeQuickLinkTone(value = '') {
  const tone = normalizeToken(value);
  return QUICK_LINK_TONES.has(tone) ? tone : 'red';
}

function normalizeQuickLinkIcon(value = '') {
  const icon = normalizeToken(value).replace(/-/g, '');
  const normalized = QUICK_LINK_ICON_ALIASES[normalizeToken(value)]
    || QUICK_LINK_ICON_ALIASES[icon];
  return normalized || 'clock';
}

function normalizeProgress(value) {
  const numeric = Number.parseFloat(String(value || '').trim().replace(/%$/, ''));
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function getCellHref(cell) {
  const anchor = cell?.querySelector('a[href]');
  if (anchor?.href) return anchor.href;
  return cellText(cell);
}

function createQuickLinkIcon(iconName) {
  const wrapper = document.createElement('span');
  wrapper.innerHTML = QUICK_LINK_ICON_MARKUP[iconName] || QUICK_LINK_ICON_MARKUP.clock;
  return wrapper.children[0];
}

function createCta(linkData, className, includeShine = false) {
  const link = createLink(`btn ${className}`, linkData.href, linkData.text);
  const label = document.createElement('span');
  label.textContent = linkData.text;

  if (includeShine) {
    const shine = document.createElement('span');
    shine.className = 'btn-shine';
    link.replaceChildren(shine, label, createSvgArrow());
    return link;
  }

  link.replaceChildren(label, createSvgArrow());
  return link;
}

function appendHeadingLine(heading, className, text) {
  if (!text) return;
  const line = document.createElement('span');
  line.className = className;
  line.textContent = text;
  heading.append(line);
}

function createEyebrow(text) {
  if (!text) return null;

  const eyebrow = document.createElement('div');
  eyebrow.className = 'hero-eyebrow';

  const pip = document.createElement('div');
  pip.className = 'eyebrow-pip';
  for (let index = 0; index < 3; index += 1) {
    pip.append(document.createElement('span'));
  }

  eyebrow.append(
    pip,
    createTextElement('span', 'hero-eyebrow-txt', text),
  );

  return eyebrow;
}

function createCorner(className, delay) {
  const corner = document.createElement('div');
  corner.className = `corner ${className}`;
  corner.style.setProperty('--d', delay);
  return corner;
}

function createRankBadges(fields) {
  const badges = document.createElement('div');
  badges.className = 'hero-rank';

  RANK_KEYS.forEach((index) => {
    const text = cellText(fields[`rank-badge-${index}`]);
    if (!text) return;
    badges.append(createTextElement('span', '', text));
  });

  return badges.children.length ? badges : null;
}

function createQuickLinks(fields) {
  const quickLinks = document.createElement('div');
  quickLinks.className = 'quick-links';

  QUICK_LINK_KEYS.forEach((index) => {
    const label = cellText(fields[`quick-link-${index}-label`]);
    const href = getCellHref(fields[`quick-link-${index}-href`]);

    if (!label || !href) return;

    const tone = normalizeQuickLinkTone(cellText(fields[`quick-link-${index}-tone`]));
    const iconName = normalizeQuickLinkIcon(cellText(fields[`quick-link-${index}-icon`]));
    const link = document.createElement('a');
    link.className = 'ql';
    link.href = href;
    link.setAttribute('data-icon', iconName);
    link.setAttribute('data-tone', tone);

    const iconWrap = document.createElement('span');
    iconWrap.className = `ql-icon ${tone}`;
    iconWrap.append(createQuickLinkIcon(iconName));

    const arrow = document.createElement('span');
    arrow.className = 'ql-arrow';
    arrow.append(createSvgArrow());

    link.append(
      iconWrap,
      createTextElement('span', 'ql-label', label),
      arrow,
    );
    quickLinks.append(link);
  });

  return quickLinks.children.length ? quickLinks : null;
}

function createIntelPanels(fields) {
  const intel = document.createElement('div');
  intel.className = 'intel';

  INTEL_KEYS.forEach((index, listIndex) => {
    const tag = cellText(fields[`intel-${index}-tag`]);
    const value = cellText(fields[`intel-${index}-value`]);
    const sub = cellText(fields[`intel-${index}-sub`]);

    if (!tag || !value || !sub) return;

    const panel = document.createElement('div');
    panel.className = 'ip';
    panel.style.setProperty('--d', `${0.45 + (listIndex * 0.15)}s`);

    const tagWrap = document.createElement('span');
    tagWrap.className = 'ip-tag';
    const dot = document.createElement('span');
    dot.className = 'ip-dot';
    tagWrap.append(dot, document.createTextNode(tag));

    const fill = document.createElement('div');
    fill.className = 'ip-bar-fill';
    fill.style.width = `${normalizeProgress(cellText(fields[`intel-${index}-progress`]))}%`;

    const bar = document.createElement('div');
    bar.className = 'ip-bar';
    bar.append(fill);

    panel.append(
      tagWrap,
      createTextElement('div', 'ip-val', value),
      createTextElement('div', 'ip-sub', sub),
      bar,
    );
    intel.append(panel);
  });

  return intel.children.length ? intel : null;
}

function parseCounterValue(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, numericPart, suffix] = match;
  const target = Number.parseFloat(numericPart);
  if (!Number.isFinite(target)) return null;

  return {
    prefix,
    suffix,
    target,
    decimals: numericPart.includes('.') ? numericPart.split('.')[1].length : 0,
  };
}

function formatCounterValue(prefix, value, suffix, decimals) {
  const formatted = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return `${prefix}${formatted}${suffix}`;
}

function createStats(fields) {
  const stats = document.createElement('div');
  stats.className = 'stats-row';

  STAT_KEYS.forEach((index) => {
    const value = cellText(fields[`stat-${index}-value`]);
    const label = cellText(fields[`stat-${index}-label`]);

    if (!value || !label) return;

    const stat = document.createElement('div');
    stat.className = 'stat';

    const valueEl = document.createElement('div');
    valueEl.className = 'stat-val';
    const counterValue = parseCounterValue(value);

    if (counterValue) {
      valueEl.dataset.counterTarget = String(counterValue.target);
      valueEl.dataset.counterPrefix = counterValue.prefix;
      valueEl.dataset.counterSuffix = counterValue.suffix;
      valueEl.dataset.counterDecimals = String(counterValue.decimals);
      valueEl.textContent = formatCounterValue(
        counterValue.prefix,
        0,
        counterValue.suffix,
        counterValue.decimals,
      );
    } else {
      valueEl.textContent = value;
    }

    stat.append(
      valueEl,
      createTextElement('div', 'stat-lbl', label),
    );
    stats.append(stat);
  });

  return stats.children.length ? stats : null;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function startCounters(container) {
  container.querySelectorAll('.stat-val[data-counter-target]').forEach((counter) => {
    const target = Number.parseFloat(counter.dataset.counterTarget || '');
    const decimals = Number.parseInt(counter.dataset.counterDecimals || '0', 10);
    const prefix = counter.dataset.counterPrefix || '';
    const suffix = counter.dataset.counterSuffix || '';

    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') {
      counter.textContent = formatCounterValue(prefix, target, suffix, decimals);
      return;
    }

    let frame = 0;
    const frameCount = 24;

    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / frameCount, 1);
      const eased = 1 - ((1 - progress) ** 3);
      counter.textContent = formatCounterValue(prefix, target * eased, suffix, decimals);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  });
}

function buildParticle(index) {
  const particle = document.createElement('span');
  const colors = ['var(--text-dim)', 'var(--scarlet)', 'var(--gold)'];
  const color = colors[index % colors.length];
  const size = 1 + ((index % 3) * 0.5);
  const left = (index * 17) % 100;
  const top = 60 + ((index * 11) % 40);
  const duration = 8 + (index % 7);
  const delay = (index % 5) * 0.65;
  const travel = 200 + ((index * 29) % 240);
  const peak = 0.18 + ((index % 4) * 0.06);

  particle.className = 'particle';
  particle.style.left = `${left}%`;
  particle.style.top = `${top}%`;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.background = color;
  particle.style.setProperty('--dur', `${duration}s`);
  particle.style.setProperty('--delay', `${delay}s`);
  particle.style.setProperty('--travel', `${travel}px`);
  particle.style.setProperty('--peak', String(peak));
  return particle;
}

function populateParticles(container) {
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    container.append(buildParticle(index));
  }
}

function bindParallax(hero) {
  if (!window.matchMedia?.('(pointer:fine)')?.matches || prefersReducedMotion()) return;

  const layers = hero.querySelectorAll('.parallax-layer');
  if (!layers.length) return;

  hero.addEventListener('mousemove', (event) => {
    const centerX = (event.clientX / window.innerWidth) - 0.5;
    const centerY = (event.clientY / window.innerHeight) - 0.5;

    layers.forEach((layer) => {
      const depth = Number.parseFloat(layer.dataset.depth || '0.02');
      layer.style.transform = `translate(${(-centerX * depth * 100).toFixed(2)}px, ${(-centerY * depth * 100).toFixed(2)}px)`;
    });
  });
}

export default function decorate(block) {
  let fields = parseFieldRows(block);
  const hasContent = cellText(fields['heading-line-1']).trim();
  if (isLibraryPreview() && !hasContent) {
    fields = getDefaultLibraryFields();
  }

  const section = block.closest('.section');
  if (section) section.classList.add('mcx-hero-newcomer-section');

  const hero = document.createElement('section');
  hero.className = 'hero';

  const canvas = document.createElement('div');
  canvas.className = 'hero-canvas';
  hero.append(canvas);

  const grid = document.createElement('div');
  grid.className = 'hero-grid parallax-layer';
  grid.dataset.depth = '0.02';
  hero.append(grid);

  const scan = document.createElement('div');
  scan.className = 'hero-scan';
  hero.append(scan);

  const vline = document.createElement('div');
  vline.className = 'hero-vline';
  hero.append(vline);

  ['1', '2', '3'].forEach((index) => {
    const ring = document.createElement('div');
    ring.className = `glow-ring glow-ring-${index} parallax-layer`;
    let depth = '0.01';
    if (index === '1') depth = '0.03';
    else if (index === '2') depth = '0.02';
    ring.dataset.depth = depth;
    hero.append(ring);
  });

  const particles = document.createElement('div');
  particles.className = 'particles';
  populateParticles(particles);
  hero.append(particles);

  hero.append(
    createCorner('c-tl', '0.3s'),
    createCorner('c-tr', '0.4s'),
    createCorner('c-bl', '0.5s'),
    createCorner('c-br', '0.6s'),
  );

  const rankBadges = createRankBadges(fields);
  if (rankBadges) hero.append(rankBadges);

  const intel = createIntelPanels(fields);
  if (intel) hero.append(intel);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrow = createEyebrow(cellText(fields.eyebrow));
  if (eyebrow) content.append(eyebrow);

  const heading = document.createElement('h1');
  heading.className = 'hero-h1';
  appendHeadingLine(heading, 'l1', cellText(fields['heading-line-1']));
  appendHeadingLine(heading, 'l2', cellText(fields['heading-line-2']));
  appendHeadingLine(heading, 'l3', cellText(fields['heading-line-3']));
  if (heading.children.length) content.append(heading);

  const description = cellText(fields.description);
  if (description) {
    content.append(createTextElement('p', 'hero-desc', description));
  }

  const quickLinks = createQuickLinks(fields);
  if (quickLinks) content.append(quickLinks);

  const ctas = document.createElement('div');
  ctas.className = 'hero-ctas';
  const primaryCta = fields['primary-cta']
    ? extractLink(fields['primary-cta'], LIBRARY_PREVIEW_DEFAULTS['primary-cta'].text)
    : null;
  const secondaryCta = fields['secondary-cta']
    ? extractLink(fields['secondary-cta'], LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].text)
    : null;

  if (primaryCta?.text || primaryCta?.href) ctas.append(createCta(primaryCta, 'btn-p', true));
  if (secondaryCta?.text || secondaryCta?.href) ctas.append(createCta(secondaryCta, 'btn-s'));
  if (ctas.children.length) content.append(ctas);

  const stats = createStats(fields);
  if (stats) content.append(stats);

  hero.append(content);

  block.replaceChildren(hero);

  bindParallax(hero);
  startCounters(hero);
}
