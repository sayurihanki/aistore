/**
 * Promo Popup Spinner Wheel Block
 * Premium glassmorphic pop-up with configurable themes, entry triggers, and spinner wheel.
 *
 * Content Model:
 *   Config rows: key | value (2 cells)
 *   Promo rows: Label | Description/Code | CTA URL (3 cells)
 */

const STORAGE_PREFIX = 'promo_popup_seen_';

/* Muted pastels for Glass Edition */
const GLASS_SEGMENT_COLORS = [
  '#e8e0f7', '#dde9f5', '#e0f0ea', '#f0e8e0',
  '#e8e0f7', '#dde9f5', '#e0f0ea', '#f0e8e0',
];

const SEGMENT_COLORS = {
  purple: GLASS_SEGMENT_COLORS,
  emerald: ['#e0f0ea', '#d1f0e0', '#b8e6d0', '#e0f0ea', '#d1f0e0', '#b8e6d0'],
  sunset: ['#fef3e0', '#fde8d0', '#fcd9b8', '#fef3e0', '#fde8d0', '#fcd9b8'],
  midnight: ['#e8e8f5', '#ddddf0', '#d0d0eb', '#e8e8f5', '#ddddf0', '#d0d0eb'],
  minimal: ['#f0f0f2', '#e5e5e8', '#d8d8dc', '#f0f0f2', '#e5e5e8', '#d8d8dc'],
};

const THEME_TOKENS = {
  purple: {
    accent: '#6d28d9',
    accentLight: '#8b5cf6',
    accentDark: '#4c1d95',
    accentRgb: '109 40 217',
    wheelGlow: '139 92 246',
    orbA: '196 181 253',
    orbB: '125 211 252',
    orbC: '216 180 254',
  },
  emerald: {
    accent: '#0f7a55',
    accentLight: '#34d399',
    accentDark: '#065f46',
    accentRgb: '15 122 85',
    wheelGlow: '16 185 129',
    orbA: '110 231 183',
    orbB: '134 239 172',
    orbC: '187 247 208',
  },
  sunset: {
    accent: '#dd6b20',
    accentLight: '#fb923c',
    accentDark: '#9a3412',
    accentRgb: '221 107 32',
    wheelGlow: '249 115 22',
    orbA: '253 186 116',
    orbB: '252 211 77',
    orbC: '254 215 170',
  },
  midnight: {
    accent: '#1d4ed8',
    accentLight: '#60a5fa',
    accentDark: '#1e3a8a',
    accentRgb: '29 78 216',
    wheelGlow: '59 130 246',
    orbA: '96 165 250',
    orbB: '147 197 253',
    orbC: '191 219 254',
  },
  minimal: {
    accent: '#4b5563',
    accentLight: '#9ca3af',
    accentDark: '#111827',
    accentRgb: '75 85 99',
    wheelGlow: '156 163 175',
    orbA: '229 231 235',
    orbB: '209 213 219',
    orbC: '243 244 246',
  },
};

const CONFIG_KEYS = [
  'trigger', 'triggerdelay', 'triggerscroll', 'storageduration',
  'headline', 'headlinehighlight', 'subheadline', 'pill',
  'spinbuttontext', 'nothankstext',
  'resultheadline', 'ctabuttontext', 'theme', 'showorbbg', 'showconfetti',
  'spinduration',
];

/* ─── Utilities ─────────────────────────────────────────────────── */

function getBlockId(block) {
  const idx = [...document.querySelectorAll('.promo-popup')].indexOf(block);
  return `block_${idx}`;
}

function getStorageKey(blockId) {
  return `${STORAGE_PREFIX}${blockId}`;
}

function hasBeenSeen(blockId, duration) {
  try {
    if (!duration || String(duration).toLowerCase() === 'never' || String(duration).toLowerCase() === 'off') {
      return false; /* always show, never remember */
    }
    if (duration === 'session' || duration === '0') {
      return !!sessionStorage.getItem(getStorageKey(blockId));
    }
    const raw = localStorage.getItem(getStorageKey(blockId));
    if (!raw) return false;
    const { expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem(getStorageKey(blockId));
      return false;
    }
    return true;
  } catch { return false; }
}

function markSeen(blockId, duration) {
  try {
    if (!duration || String(duration).toLowerCase() === 'never' || String(duration).toLowerCase() === 'off') {
      return; /* don't remember */
    }
    if (duration === 'session' || duration === '0') {
      sessionStorage.setItem(getStorageKey(blockId), '1');
    } else {
      const days = parseFloat(duration) || 1;
      const expires = Date.now() + days * 86_400_000;
      localStorage.setItem(getStorageKey(blockId), JSON.stringify({ expires }));
    }
  } catch { /* storage blocked */ }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getTextContent(el) {
  if (!el) return '';
  const p = el.querySelector('p');
  return (p ? p.textContent : el.textContent || '').trim();
}

/* ─── Parse block content ────────────────────────────────────────── */

function parseBlock(block) {
  const config = {
    trigger: 'time',
    triggerDelay: 3,
    triggerScroll: 50,
    storageDuration: '1',
    headline: 'Spin to Win!',
    headlineHighlight: 'Win',
    subheadline: 'One spin, one deal made just for you.',
    pill: 'Exclusive offer',
    spinButtonText: 'Spin the Wheel',
    noThanksText: 'No thanks, I\'ll skip',
    resultHeadline: '🎉',
    ctaButtonText: 'Claim Offer',
    theme: 'purple',
    showOrbBg: true,
    showConfetti: true,
    spinDuration: 4,
  };

  // Read from block.dataset (DA.live model fields)
  const ds = block.dataset;
  if (ds.headline) config.headline = ds.headline;
  if (ds.headlineHighlight !== undefined) config.headlineHighlight = ds.headlineHighlight;
  if (ds.subheadline) config.subheadline = ds.subheadline;
  if (ds.pill !== undefined) config.pill = String(ds.pill || '').trim() || null;
  if (ds.trigger) config.trigger = ds.trigger;
  if (ds.triggerDelay) config.triggerDelay = parseFloat(ds.triggerDelay) || 3;
  if (ds.triggerScroll) config.triggerScroll = parseFloat(ds.triggerScroll) || 50;
  if (ds.storageDuration !== undefined) {
    config.storageDuration = String(ds.storageDuration);
  }
  if (ds.spinButtonText) config.spinButtonText = ds.spinButtonText;
  if (ds.noThanksText) config.noThanksText = ds.noThanksText;
  if (ds.resultHeadline) config.resultHeadline = ds.resultHeadline;
  if (ds.ctaButtonText) config.ctaButtonText = ds.ctaButtonText;
  if (ds.theme) config.theme = ds.theme;
  if (ds.showOrbBg !== undefined) config.showOrbBg = ds.showOrbBg !== 'false';
  if (ds.showConfetti !== undefined) config.showConfetti = ds.showConfetti !== 'false';
  if (ds.spinDuration) {
    const d = parseFloat(ds.spinDuration) || 4;
    config.spinDuration = Math.min(8, Math.max(3, d));
  }

  const promotions = [];
  const rows = [...block.children].filter((el) => el.tagName === 'DIV');

  rows.forEach((row) => {
    const cells = [...row.children].filter((el) => el.tagName === 'DIV');
    if (cells.length === 2) {
      const key = getTextContent(cells[0]).toLowerCase().replace(/[-\s]/g, '');
      if (key === 'promopopup') return; /* skip block name row */
      const val = getTextContent(cells[1]);
      if (CONFIG_KEYS.includes(key)) {
        const map = {
          trigger: 'trigger',
          triggerdelay: 'triggerDelay',
          triggerscroll: 'triggerScroll',
          storageduration: 'storageDuration',
          headline: 'headline',
          headlinehighlight: 'headlineHighlight',
          subheadline: 'subheadline',
          pill: 'pill',
          spinbuttontext: 'spinButtonText',
          nothankstext: 'noThanksText',
          resultheadline: 'resultHeadline',
          ctabuttontext: 'ctaButtonText',
          theme: 'theme',
          showorbbg: 'showOrbBg',
          showconfetti: 'showConfetti',
          spinduration: 'spinDuration',
        };
        const cfgKey = map[key];
        if (cfgKey) {
          const numKeys = ['triggerdelay', 'triggerscroll', 'spinduration'];
          config[cfgKey] = numKeys.includes(key)
            ? parseFloat(val) || config[cfgKey]
            : val;
          if (key === 'showorbbg') config.showOrbBg = val !== 'false';
          if (key === 'showconfetti') config.showConfetti = val !== 'false';
        }
      } else {
        const label = getTextContent(cells[0]).replace(/\s+/g, ' ').trim();
        const descCell = cells[1];
        const description = descCell ? (descCell.innerHTML || descCell.textContent || '').trim() : '';
        if (label) promotions.push({ label, description, cta: null });
      }
    } else if (cells.length >= 2) {
      const key = getTextContent(cells[0]).toLowerCase().replace(/[-\s]/g, '');
      if (key === 'promopopup') return; /* skip block name row */
      if (CONFIG_KEYS.includes(key)) return; /* skip config rows */
      const label = getTextContent(cells[0]).replace(/\s+/g, ' ').trim();
      const descCell = cells[1];
      const description = descCell ? (descCell.innerHTML || descCell.textContent || '').trim() : '';
      const ctaEl = cells[2]?.querySelector('a');
      let cta = null;
      if (ctaEl) {
        const raw = (ctaEl.getAttribute('href') || '').trim();
        const blocked = /^(javascript|data|vbscript):/i.test(raw);
        const allowed = /^(https?:|mailto:|tel:|\/|\.)/i;
        if (raw && !blocked && allowed.test(raw)) {
          cta = { text: ctaEl.textContent.trim() || config.ctaButtonText, href: raw };
        }
      }
      /* Fallback: 3rd cell plain text URL (DA.live may not auto-link) */
      if (!cta && cells[2]) {
        const raw = (cells[2].textContent || '').trim();
        const allowed = /^(https?:|mailto:|tel:|\/|\.)/i;
        if (raw && allowed.test(raw) && !/^(javascript|data|vbscript):/i.test(raw)) {
          cta = { text: config.ctaButtonText, href: raw };
        }
      }
      if (label) promotions.push({ label, description, cta });
    }
  });

  /* Fallback: if no promotions from table, use defaults so popup still works */
  const DEFAULT_PROMOS = [
    { label: '10% Off', description: 'Use code <strong>SAVE10</strong> at checkout', cta: { text: 'Claim Offer', href: '/checkout' } },
    { label: 'Free Ship', description: 'Free shipping on orders over $50', cta: { text: 'Claim Offer', href: '/shipping' } },
    { label: 'BOGO', description: 'Buy one, get one <strong>50% off</strong> — today only', cta: { text: 'Claim Offer', href: '/sale' } },
    { label: '$5 Off', description: '$5 credit on your next order', cta: { text: 'Claim Offer', href: '/promo' } },
    { label: '20% Off', description: 'Use code <strong>TWENTY</strong> — this week only', cta: { text: 'Claim Offer', href: '/checkout' } },
    { label: 'Gift', description: 'Free gift with any purchase over $75', cta: { text: 'Claim Offer', href: '/gifts' } },
    { label: 'VIP Access', description: 'Early access to our next drop', cta: { text: 'Claim Offer', href: '/vip' } },
    { label: '5% Off', description: 'Better luck next time — use code <strong>TRY5</strong> at checkout', cta: { text: 'Claim Offer', href: '/checkout' } },
  ];
  const finalPromos = promotions.length > 0 ? promotions : DEFAULT_PROMOS;
  if (promotions.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[promo-popup] No promotions parsed from table (rows:', rows.length, '). Using defaults. Check your DA.live table has 3-cell promo rows.');
  }
  return { config, promotions: finalPromos };
}

/* ─── Build Wheel DOM ────────────────────────────────────────────── */

function buildWheel(promotions, theme) {
  const n = promotions.length;
  const degPer = 360 / n;
  const colors = SEGMENT_COLORS[theme] || SEGMENT_COLORS.purple;

  const wheel = document.createElement('div');
  wheel.className = 'pp-wheel';

  const stops = promotions.map((_, i) => {
    const color = colors[i % colors.length];
    const s = (i * degPer).toFixed(4);
    const e = ((i + 1) * degPer).toFixed(4);
    return `${color} ${s}deg ${e}deg`;
  }).join(', ');
  wheel.style.background = `conic-gradient(from -90deg, ${stops})`;

  const dividers = document.createElement('div');
  dividers.className = 'pp-dividers';
  for (let i = 0; i < n; i += 1) {
    const line = document.createElement('div');
    line.className = 'pp-divider-line';
    line.style.transform = `rotate(${i * degPer}deg)`;
    dividers.appendChild(line);
  }
  wheel.appendChild(dividers);

  const labelOffset = 72;
  promotions.forEach((promo, i) => {
    const midDeg = (i + 0.5) * degPer;
    const label = document.createElement('div');
    label.className = 'pp-segment-label';
    label.textContent = promo.label;
    label.style.transform = `rotate(${midDeg}deg) translateX(${labelOffset}px)`;
    wheel.appendChild(label);
  });

  const cap = document.createElement('div');
  cap.className = 'pp-wheel-cap';
  cap.innerHTML = `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1L10.5 6.5H16L11.5 9.8L13.2 15.5L9 12.2L4.8 15.5L6.5 9.8L2 6.5H7.5Z" fill="#6d28d9" opacity="0.7"/>
  </svg>`;
  wheel.appendChild(cap);

  return wheel;
}

/* ─── Build Overlay DOM ──────────────────────────────────────────── */

function applyThemeTokens(overlay, themeName) {
  const tokens = THEME_TOKENS[themeName] || THEME_TOKENS.purple;
  overlay.style.setProperty('--pp-accent', tokens.accent);
  overlay.style.setProperty('--pp-accent-light', tokens.accentLight);
  overlay.style.setProperty('--pp-accent-dark', tokens.accentDark);
  overlay.style.setProperty('--pp-accent-rgb', tokens.accentRgb);
  overlay.style.setProperty('--pp-wheel-glow', tokens.wheelGlow);
  overlay.style.setProperty('--pp-orb-a', tokens.orbA);
  overlay.style.setProperty('--pp-orb-b', tokens.orbB);
  overlay.style.setProperty('--pp-orb-c', tokens.orbC);
}

function buildOrbField() {
  const orbField = document.createElement('div');
  orbField.className = 'pp-orb-field';

  for (let i = 1; i <= 3; i += 1) {
    const orb = document.createElement('div');
    orb.className = `pp-orb pp-orb--${i}`;
    orbField.appendChild(orb);
  }

  return orbField;
}

function buildOverlay(config, promotions, blockId) {
  const idSuffix = blockId.replace(/[^a-z0-9_-]/gi, '-');
  const headlineId = `pp-headline-${idSuffix}`;
  const subheadlineId = `pp-subheadline-${idSuffix}`;
  const overlay = document.createElement('div');
  overlay.className = 'pp-overlay';
  overlay.dataset.ppOwner = blockId;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', headlineId);
  overlay.setAttribute('aria-describedby', subheadlineId);
  applyThemeTokens(overlay, config.theme);

  const modal = document.createElement('div');
  modal.className = 'pp-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'pp-close';
  closeBtn.type = 'button';
  closeBtn.innerHTML = '<span class="pp-close-x"></span>';
  closeBtn.setAttribute('aria-label', 'Close popup');

  const headlineHtml = config.headlineHighlight
    ? config.headline.replace(
      new RegExp(`(${config.headlineHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'),
      '<span>$1</span>',
    )
    : config.headline;

  const modalInner = document.createElement('div');
  modalInner.className = 'pp-modal-inner';
  modalInner.innerHTML = `
    <div class="pp-header">
      ${config.pill ? `<div class="pp-pill"><div class="pp-pill-dot"></div>${config.pill}</div>` : ''}
      <h2 id="${headlineId}" class="pp-headline">${headlineHtml}</h2>
      <p id="${subheadlineId}" class="pp-subheadline">${config.subheadline}</p>
    </div>
  `;

  const wheelSection = document.createElement('div');
  wheelSection.className = 'pp-wheel-section';

  const wheelWrap = document.createElement('div');
  wheelWrap.className = 'pp-wheel-wrap';

  const ring = document.createElement('div');
  ring.className = 'pp-wheel-ring';

  const pointer = document.createElement('div');
  pointer.className = 'pp-pointer';
  pointer.innerHTML = `<svg viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 26 L0 0 L18 0 Z" fill="rgba(0,0,0,0.12)"/>
    <path d="M9 22 L1.5 2 L16.5 2 Z" fill="#1f1f2e"/>
  </svg>`;

  const wheel = buildWheel(promotions, config.theme);

  wheelWrap.appendChild(ring);
  wheelWrap.appendChild(pointer);
  wheelWrap.appendChild(wheel);
  wheelSection.appendChild(wheelWrap);

  const bottom = document.createElement('div');
  bottom.className = 'pp-bottom';

  const spinBtn = document.createElement('button');
  spinBtn.className = 'pp-spin-btn';
  spinBtn.type = 'button';
  spinBtn.textContent = config.spinButtonText;

  const resultArea = document.createElement('div');
  resultArea.className = 'pp-result';
  resultArea.setAttribute('aria-live', 'polite');

  const noThanks = document.createElement('button');
  noThanks.className = 'pp-no-thanks';
  noThanks.type = 'button';
  noThanks.textContent = config.noThanksText;

  bottom.appendChild(spinBtn);
  bottom.appendChild(resultArea);
  bottom.appendChild(noThanks);

  if (config.showOrbBg) {
    overlay.appendChild(buildOrbField());
  }
  modal.appendChild(closeBtn);
  modal.appendChild(modalInner);
  modal.appendChild(wheelSection);
  modal.appendChild(bottom);
  overlay.appendChild(modal);

  /* ── Spin Logic ── */
  let hasSpun = false;
  let currentRotation = 0;
  let isClosing = false;
  const duration = config.spinDuration * 1000;
  const previousActiveElement = document.activeElement;

  function doSpin() {
    if (hasSpun) return;
    hasSpun = true;
    spinBtn.disabled = true;
    spinBtn.textContent = 'Spinning…';

    const n = promotions.length;
    const segIdx = Math.floor(Math.random() * n);
    const degPer = 360 / n;
    /* Conic gradient starts at -90deg (9 o'clock); pointer is at 12 o'clock.
       Segment midpoint in gradient coords: (segIdx+0.5)*degPer.
       In standard coords (0=12 o'clock): -90 + midpoint.
       To land that at 12 o'clock: rotate R so that -90 + midpoint + R ≡ 0 → R = 90 - midpoint.
       Add 180deg: pointer was landing on opposite segment. */
    const midpoint = (segIdx + 0.5) * degPer;
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360;
    const needed = (270 - midpoint - (currentRotation % 360) + 720) % 360;
    const targetDeg = currentRotation + extraSpins + (needed === 0 ? 360 : needed);

    const spinDuration = prefersReducedMotion() ? 200 : duration;
    wheel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    wheel.style.transform = `rotate(${targetDeg}deg)`;
    currentRotation = targetDeg;

    const promo = promotions[segIdx];

    const handleEnd = () => {
      wheel.removeEventListener('transitionend', handleEnd);
      revealResult(promo);
    };

    if (prefersReducedMotion()) {
      setTimeout(handleEnd, spinDuration + 50);
    } else {
      wheel.addEventListener('transitionend', handleEnd);
    }
  }

  function revealResult(promo) {
    spinBtn.style.display = 'none';
    noThanks.textContent = 'Close';

    const ctaHtml = promo.cta
      ? `<a class="pp-result-cta" href="${promo.cta.href}" rel="noopener noreferrer">${promo.cta.text}</a>`
      : '';

    resultArea.innerHTML = `
      <div class="pp-result-inner">
        <span class="pp-result-badge">${config.resultHeadline}</span>
        <div class="pp-result-label">${promo.label}</div>
        ${promo.description ? `<div class="pp-result-desc">${promo.description}</div>` : ''}
        ${ctaHtml}
      </div>
    `;
    resultArea.classList.add('pp-result--visible');

    if (config.showConfetti && !prefersReducedMotion()) {
      launchConfetti(modal);
    }
  }

  function closeOverlay() {
    if (isClosing) return;
    isClosing = true;
    document.removeEventListener('keydown', overlay._keyHandler);
    overlay.classList.add('pp-overlay--closing');
    overlay.addEventListener('animationend', () => {
      overlay.remove();
      document.body.classList.remove('pp-no-scroll');
      previousActiveElement?.focus?.();
    }, { once: true });
  }

  spinBtn.addEventListener('click', doSpin);
  closeBtn.addEventListener('click', closeOverlay);
  noThanks.addEventListener('click', closeOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  const focusable = () => [...modal.querySelectorAll('button, a[href]')].filter((el) => !el.disabled);

  function handleKey(e) {
    if (e.key === 'Escape') {
      closeOverlay();
      return;
    }
    if (e.key === 'Tab') {
      const els = focusable();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  overlay._keyHandler = handleKey;

  return { overlay, focusFirst: () => focusable()[0]?.focus() };
}

/* ─── Confetti ───────────────────────────────────────────────────── */

function launchConfetti(container) {
  const colors = ['#a78bfa', '#34d399', '#fb923c', '#6366f1', '#f472b6', '#fde68a'];
  for (let i = 0; i < 60; i += 1) {
    const c = document.createElement('div');
    c.className = 'pp-confetti';
    c.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.5}s;
      animation-duration: ${0.8 + Math.random() * 0.8}s;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      transform: rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(c);
    c.addEventListener('animationend', () => c.remove());
  }
}

/* ─── Entry Triggers ─────────────────────────────────────────────── */

function setupTrigger(config, showFn) {
  const { trigger, triggerDelay, triggerScroll } = config;

  if (trigger === 'immediate') { showFn(); return; }

  if (trigger === 'time') {
    setTimeout(showFn, (triggerDelay || 3) * 1000);
    return;
  }

  if (trigger === 'scroll') {
    const threshold = (triggerScroll || 50) / 100;
    const check = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) { showFn(); return; }
      const scrolled = window.scrollY / maxScroll;
      if (scrolled >= threshold) {
        window.removeEventListener('scroll', check);
        showFn();
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    return;
  }

  if (trigger === 'exit') {
    const check = (e) => {
      if (e.clientY < 10) {
        document.removeEventListener('mouseout', check);
        showFn();
      }
    };
    document.addEventListener('mouseout', check);
    return;
  }

  if (trigger === 'first-interaction') {
    const handler = () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('scroll', handler);
      showFn();
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('scroll', handler, { once: true, passive: true });
    return;
  }

  setTimeout(showFn, (triggerDelay || 3) * 1000);
}

/* ─── Main Decorate ──────────────────────────────────────────────── */

export default function decorate(block) {
  const { config, promotions } = parseBlock(block);
  const debug = block.dataset.debug === 'true' || block.dataset.debug === '';
  let hasShown = false;

  if (!promotions.length) {
    if (debug) console.warn('[promo-popup] No promotions — block hidden.');
    block.hidden = true;
    return;
  }

  const blockId = getBlockId(block);
  block.innerHTML = '';
  block.hidden = true;

  function showPopup() {
    if (hasShown) return;
    if (hasBeenSeen(blockId, config.storageDuration)) {
      if (debug) console.warn('[promo-popup] Blocked by storage (already seen). Use storage-duration: never to test.');
      return;
    }

    const { overlay, focusFirst } = buildOverlay(config, promotions, blockId);
    hasShown = true;
    markSeen(blockId, config.storageDuration);
    document.addEventListener('keydown', overlay._keyHandler);
    document.body.appendChild(overlay);
    document.body.classList.add('pp-no-scroll');

    requestAnimationFrame(() => {
      overlay.classList.add('pp-overlay--visible');
      setTimeout(focusFirst, 100);
    });
  }

  setupTrigger(config, showPopup);
}
