import {
  cellText,
  createLink,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const fields = parseFieldRows(block);
  const banner = document.createElement('div');
  banner.className = 'promo-banner';
  banner.innerHTML = `
    <div class="promo-lines"></div>
    <div class="promo-inner">
      <div class="reveal">
        <div class="promo-badge">${cellText(fields.badge)}</div>
        <div class="promo-title">${cellText(fields.title)}</div>
        <div class="promo-sub">${cellText(fields.description)}</div>
      </div>
    </div>
  `;

  const ctaData = extractLink(fields.cta, 'Shop Clearance');
  const cta = createLink(
    'btn-promo reveal',
    ctaData.href,
    ctaData.text || 'Shop Clearance',
  );
  cta.innerHTML = `
    <span>${cta.textContent}</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  `;
  banner.querySelector('.promo-inner').append(cta);
  block.replaceChildren(banner);
}
