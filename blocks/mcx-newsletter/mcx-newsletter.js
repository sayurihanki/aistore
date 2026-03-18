import {
  cellText,
  parseFieldRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const fields = parseFieldRows(block);
  const section = document.createElement('div');
  section.className = 'nl';
  section.innerHTML = `
    <div class="nl-box reveal">
      <div class="nl-icon" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C1121F" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
      <span class="sec-label">${cellText(fields.label)}</span>
      <h2 class="nl-title">${cellText(fields.title)}</h2>
      <p class="nl-desc">${cellText(fields.description)}</p>
      <form class="nl-form" data-mcx-newsletter="true">
        <input type="email" class="nl-input" placeholder="${cellText(fields.placeholder)}" aria-label="${cellText(fields.placeholder)}">
        <button class="btn-nl" type="submit">${cellText(fields['button-text']) || 'Subscribe'}</button>
      </form>
      <div class="nl-note">${cellText(fields.note)}</div>
    </div>
  `;

  block.replaceChildren(section);
}
