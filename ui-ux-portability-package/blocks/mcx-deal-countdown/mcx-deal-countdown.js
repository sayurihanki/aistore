import {
  cellText,
  createLink,
  extractLink,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const fields = parseFieldRows(block);

  const strip = document.createElement('div');
  strip.className = 'deal-strip';
  strip.dataset.countdownEnd = cellText(fields['end-datetime']);
  strip.dataset.endedText = cellText(fields['ended-text']) || 'Ended';
  strip.dataset.hideCtaWhenEnded = cellText(fields['hide-cta-when-ended']) || 'false';

  const ctaData = extractLink(fields.cta, 'Shop All Deals');
  const cta = createLink('btn-deal', ctaData.href, ctaData.text || 'Shop All Deals');
  cta.innerHTML = `
    <span>${cta.textContent}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  `;

  strip.innerHTML = `
    <div class="deal-inner">
      <div class="reveal">
        <div class="deal-label">${cellText(fields.label)}</div>
        <div class="deal-title">${cellText(fields.title)}</div>
        <div class="deal-desc">${cellText(fields.description)}</div>
      </div>
      <div class="countdown reveal">
        <div class="cd-unit"><div class="cd-num" data-countdown-days="true">00</div><div class="cd-lbl">Days</div></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><div class="cd-num" data-countdown-hours="true">00</div><div class="cd-lbl">Hours</div></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><div class="cd-num" data-countdown-minutes="true">00</div><div class="cd-lbl">Mins</div></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><div class="cd-num" data-countdown-seconds="true">00</div><div class="cd-lbl">Secs</div></div>
      </div>
      <div class="deal-cta reveal">
        <p>${cellText(fields['cta-note']) || 'Do not miss out - deals expire when the timer hits zero.'}</p>
      </div>
    </div>
  `;

  strip.querySelector('.deal-cta').append(cta);
  block.replaceChildren(strip);
}
