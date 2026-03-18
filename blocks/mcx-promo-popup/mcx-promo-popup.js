import {
  cellText,
  createLink,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';
import { isMcxLibraryPreviewPath } from '../../scripts/mcx-preview.js';

const STORAGE_PREFIX = 'mcx_promo_popup_seen_';
const DEFAULTS = {
  badgeLabel: 'Extra Off',
  copyButtonText: 'Copy Code',
  primaryCta: 'Shop the Sale',
  secondaryCta: 'Browse Deals',
  trigger: 'time',
  triggerDelay: 3,
  triggerScroll: 50,
};

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTrigger(value) {
  const normalized = (value || '').toString().trim().toLowerCase();
  return ['time', 'scroll', 'immediate'].includes(normalized) ? normalized : DEFAULTS.trigger;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat((value || '').toString().trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('//')) return '';

  if (['#', '/', './', '../', '?'].some((token) => trimmed.startsWith(token))) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
}

function getCampaignId(fields, block) {
  const authoredId = slugify(cellText(fields['campaign-id']));
  if (authoredId) return authoredId;

  const derivedId = slugify([
    cellText(fields['heading-line-1']),
    cellText(fields['heading-line-2']),
    cellText(fields['coupon-code']),
  ].filter(Boolean).join('-'));
  if (derivedId) return derivedId;

  const blockIndex = [...document.querySelectorAll('.mcx-promo-popup')].indexOf(block);
  return `mcx-promo-popup-${blockIndex}`;
}

function getStorageKey(campaignId) {
  return `${STORAGE_PREFIX}${campaignId}`;
}

function hasBeenSeen(campaignId) {
  try {
    return window.sessionStorage.getItem(getStorageKey(campaignId)) === '1';
  } catch {
    return false;
  }
}

function markSeen(campaignId) {
  try {
    window.sessionStorage.setItem(getStorageKey(campaignId), '1');
  } catch {
    // Ignore storage failures.
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cloneCellContent(cell, target) {
  if (!cell || !target) return target;

  if (cell.childNodes?.length) {
    [...cell.childNodes].forEach((node) => {
      target.append(node.cloneNode ? node.cloneNode(true) : document.createTextNode(node.textContent || ''));
    });
  } else {
    const text = cellText(cell);
    if (text) target.textContent = text;
  }

  return target;
}

function createArrowSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', 'M5 12h14');
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M12 5l7 7-7 7');
  svg.append(line, arrow);
  return svg;
}

function buildCtaLink(className, linkData, fallbackText) {
  const href = sanitizeUrl(linkData.href) || '#';
  const text = linkData.text || fallbackText;
  const link = createLink(className, href, text);
  const label = document.createElement('span');
  label.textContent = text;
  link.replaceChildren(label, createArrowSvg());
  return link;
}

function createOfferCards(fields) {
  const cards = document.createElement('div');
  cards.className = 'mpp-offers';

  [1, 2, 3].forEach((index) => {
    const value = cellText(fields[`offer-${index}-value`]);
    const label = cellText(fields[`offer-${index}-label`]);
    if (!value && !label) return;

    const card = document.createElement('div');
    card.className = `mpp-offer reveal reveal-delay-${index}`;
    card.innerHTML = `
      <div class="mpp-offer-value">${value}</div>
      <div class="mpp-offer-label">${label}</div>
    `;
    cards.append(card);
  });

  return cards;
}

function setCountdownValues(targets, values) {
  Object.entries(values).forEach(([key, value]) => {
    const target = targets[key];
    if (!target) return;
    target.textContent = String(value).padStart(2, '0');
  });
}

function startCountdown(endDate, countdown) {
  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    countdown.dataset.status = 'invalid';
    return null;
  }

  const targets = {
    days: countdown.querySelector('[data-countdown-days]'),
    hours: countdown.querySelector('[data-countdown-hours]'),
    minutes: countdown.querySelector('[data-countdown-minutes]'),
    seconds: countdown.querySelector('[data-countdown-seconds]'),
  };
  const label = countdown.querySelector('.mpp-countdown-label-text');

  const update = () => {
    const diff = endDate.getTime() - Date.now();
    if (diff <= 0) {
      setCountdownValues(targets, {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      countdown.dataset.status = 'ended';
      if (label) label.textContent = 'Offer Ended';
      return false;
    }

    setCountdownValues(targets, {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    });
    countdown.dataset.status = 'active';
    if (label) label.textContent = 'Ends In';
    return true;
  };

  if (!update()) return null;

  const intervalId = window.setInterval(() => {
    if (!update()) window.clearInterval(intervalId);
  }, 1000);

  return intervalId;
}

function setCopyFeedback(button, text, state) {
  button.textContent = text;
  button.dataset.copyState = state;
}

async function copyCoupon(code, button, defaultText) {
  let copied = false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      copied = true;
    } else if (typeof document.execCommand === 'function') {
      const field = document.createElement('textarea');
      field.value = code;
      field.setAttribute('aria-hidden', 'true');
      document.body.append(field);
      if (typeof field.select === 'function') field.select();
      copied = document.execCommand('copy');
      field.remove();
    }
  } catch {
    copied = false;
  }

  if (copied) {
    setCopyFeedback(button, 'Copied!', 'success');
  } else {
    setCopyFeedback(button, code, 'fallback');
  }

  window.setTimeout(() => {
    setCopyFeedback(button, defaultText, '');
  }, 1800);
}

function getFocusableElements(root) {
  return [...root.querySelectorAll('button, a[href]')].filter((node) => !node.disabled);
}

function buildOverlay(fields, block, isPreview) {
  const campaignId = getCampaignId(fields, block);
  const headingLineOne = cellText(fields['heading-line-1']);
  const headingLineTwo = cellText(fields['heading-line-2']);
  const eyebrow = cellText(fields.eyebrow);
  const badgeValue = cellText(fields['badge-value']);
  const badgeLabel = cellText(fields['badge-label']) || DEFAULTS.badgeLabel;
  const couponCode = cellText(fields['coupon-code']);
  const copyButtonText = cellText(fields['copy-button-text']) || DEFAULTS.copyButtonText;
  const trigger = isPreview ? 'immediate' : normalizeTrigger(cellText(fields.trigger));
  const triggerDelay = parsePositiveNumber(cellText(fields['trigger-delay']), DEFAULTS.triggerDelay);
  const triggerScroll = clamp(
    parsePositiveNumber(cellText(fields['trigger-scroll']), DEFAULTS.triggerScroll),
    0,
    100,
  );

  const primaryLink = extractLink(fields['primary-cta'], DEFAULTS.primaryCta);
  const secondaryLink = extractLink(fields['secondary-cta'], DEFAULTS.secondaryCta);
  const headingId = `mpp-heading-${campaignId}`;
  const descId = `mpp-description-${campaignId}`;

  const overlay = document.createElement('div');
  overlay.className = 'mpp-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', headingId);
  overlay.setAttribute('aria-describedby', descId);
  overlay.dataset.campaignId = campaignId;

  const modal = document.createElement('div');
  modal.className = 'mpp-modal';

  const close = document.createElement('button');
  close.className = 'mpp-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close promotional offer');
  close.innerHTML = '<span></span>';

  const visual = document.createElement('div');
  visual.className = 'mpp-visual';
  visual.innerHTML = `
    <div class="mpp-scan"></div>
    <div class="mpp-corner mpp-corner-tl"></div>
    <div class="mpp-corner mpp-corner-tr"></div>
  `;

  const badge = document.createElement('div');
  badge.className = 'mpp-badge';
  badge.innerHTML = `
    <span class="mpp-badge-value">${badgeValue}</span>
    <span class="mpp-badge-label">${badgeLabel}</span>
  `;
  visual.append(badge);

  const visualCopy = document.createElement('div');
  visualCopy.className = 'mpp-visual-copy';
  visualCopy.innerHTML = `
    <div class="mpp-eyebrow">${eyebrow}</div>
    <h2 id="${headingId}" class="mpp-heading">
      <span>${headingLineOne}</span>
      <span class="accent">${headingLineTwo}</span>
    </h2>
  `;
  visual.append(visualCopy);

  const body = document.createElement('div');
  body.className = 'mpp-body';

  const description = document.createElement('div');
  description.className = 'mpp-description';
  description.id = descId;
  cloneCellContent(fields.description, description);

  const countdown = document.createElement('div');
  countdown.className = 'mpp-countdown';
  countdown.innerHTML = `
    <div class="mpp-countdown-label">
      <span class="mpp-countdown-dot"></span>
      <span class="mpp-countdown-label-text">Ends In</span>
    </div>
    <div class="mpp-countdown-units">
      <div class="mpp-countdown-unit"><div class="mpp-countdown-num" data-countdown-days>00</div><div class="mpp-countdown-txt">Days</div></div>
      <div class="mpp-countdown-sep">:</div>
      <div class="mpp-countdown-unit"><div class="mpp-countdown-num" data-countdown-hours>00</div><div class="mpp-countdown-txt">Hrs</div></div>
      <div class="mpp-countdown-sep">:</div>
      <div class="mpp-countdown-unit"><div class="mpp-countdown-num" data-countdown-minutes>00</div><div class="mpp-countdown-txt">Min</div></div>
      <div class="mpp-countdown-sep">:</div>
      <div class="mpp-countdown-unit"><div class="mpp-countdown-num" data-countdown-seconds>00</div><div class="mpp-countdown-txt">Sec</div></div>
    </div>
  `;

  const coupon = document.createElement('div');
  coupon.className = 'mpp-coupon-row';
  coupon.innerHTML = `
    <div class="mpp-coupon-box"><span class="mpp-coupon-code">${couponCode}</span></div>
  `;

  const copyButton = document.createElement('button');
  copyButton.className = 'mpp-copy';
  copyButton.type = 'button';
  copyButton.textContent = copyButtonText;
  copyButton.addEventListener('click', () => copyCoupon(couponCode, copyButton, copyButtonText));
  coupon.append(copyButton);

  const ctas = document.createElement('div');
  ctas.className = 'mpp-ctas';
  ctas.append(
    buildCtaLink('mpp-btn mpp-btn-primary', primaryLink, DEFAULTS.primaryCta),
    buildCtaLink('mpp-btn mpp-btn-secondary', secondaryLink, DEFAULTS.secondaryCta),
  );

  const finePrint = document.createElement('div');
  finePrint.className = 'mpp-fine-print';
  cloneCellContent(fields['fine-print'], finePrint);

  body.append(
    description,
    createOfferCards(fields),
    countdown,
    coupon,
    ctas,
    finePrint,
  );

  modal.append(close, visual, body);
  overlay.append(modal);

  const endDateRaw = cellText(fields['end-datetime']);
  const endDate = endDateRaw ? new Date(endDateRaw) : null;

  return {
    campaignId,
    copyButtonText,
    endDate,
    overlay,
    trigger,
    triggerDelay,
    triggerScroll,
  };
}

function setupTrigger(config, showPopup) {
  if (config.trigger === 'immediate') {
    showPopup();
    return;
  }

  if (config.trigger === 'scroll') {
    const check = () => {
      const maxScroll = (document.body.scrollHeight || 0) - window.innerHeight;
      if (maxScroll <= 0) {
        window.removeEventListener('scroll', check);
        showPopup();
        return;
      }

      if ((window.scrollY / maxScroll) * 100 >= config.triggerScroll) {
        window.removeEventListener('scroll', check);
        showPopup();
      }
    };

    window.addEventListener('scroll', check, { passive: true });
    check();
    return;
  }

  window.setTimeout(showPopup, config.triggerDelay * 1000);
}

export default function decorate(block) {
  const fields = parseFieldRows(block);
  if (!Object.keys(fields).length) {
    block.hidden = true;
    return;
  }

  const isPreview = isMcxLibraryPreviewPath(window.location.pathname);
  const popup = buildOverlay(fields, block, isPreview);
  let hasShown = false;

  block.closest('.section')?.classList.add('mcx-promo-popup-section');
  block.replaceChildren();
  block.hidden = true;

  function showPopup() {
    if (hasShown) return;
    if (!isPreview && hasBeenSeen(popup.campaignId)) return;

    hasShown = true;
    if (!isPreview) markSeen(popup.campaignId);

    const previousActiveElement = document.activeElement;
    let countdownTimer = null;

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closePopup();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(popup.overlay);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function closePopup() {
      document.removeEventListener('keydown', handleKeydown);
      if (countdownTimer) window.clearInterval(countdownTimer);
      popup.overlay.remove();
      document.body.classList.remove('mcx-promo-popup-open');
      previousActiveElement?.focus?.();
    }

    popup.overlay.querySelector('.mpp-close')?.addEventListener('click', closePopup);
    popup.overlay.addEventListener('click', (event) => {
      if (event.target === popup.overlay) closePopup();
    });

    popup.overlay.querySelectorAll('.mpp-ctas a[href]').forEach((link) => {
      link.addEventListener('click', () => {
        document.body.classList.remove('mcx-promo-popup-open');
      });
    });

    document.body.append(popup.overlay);
    document.body.classList.add('mcx-promo-popup-open');
    document.addEventListener('keydown', handleKeydown);

    const countdown = popup.overlay.querySelector('.mpp-countdown');
    countdownTimer = startCountdown(popup.endDate, countdown);

    requestAnimationFrame(() => {
      popup.overlay.classList.add('is-visible');
      if (prefersReducedMotion()) {
        getFocusableElements(popup.overlay)[0]?.focus();
      } else {
        window.setTimeout(() => {
          getFocusableElements(popup.overlay)[0]?.focus();
        }, 80);
      }
    });
  }

  setupTrigger(popup, showPopup);
}
