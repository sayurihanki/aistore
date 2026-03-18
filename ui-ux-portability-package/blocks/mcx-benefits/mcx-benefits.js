import {
  cellText,
  getRows,
} from '../../scripts/mcx-block-utils.js';

function iconMarkup(name) {
  const icons = {
    taxfree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    shipping: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
    quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    givesback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',
  };
  return icons[name] || `<span class="mcx-benefit-emoji">${name}</span>`;
}

export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'benefits';

  const inner = document.createElement('div');
  inner.className = 'ben-grid';

  getRows(block).forEach((row) => {
    const [iconCell, titleCell, subtitleCell] = row;
    const item = document.createElement('div');
    item.className = 'ben-item';
    item.innerHTML = `
      <div class="ben-ico" aria-hidden="true">${iconMarkup(cellText(iconCell).toLowerCase().replace(/[^a-z]/g, ''))}</div>
      <div>
        <div class="ben-title">${cellText(titleCell)}</div>
        <div class="ben-sub">${cellText(subtitleCell)}</div>
      </div>
    `;
    inner.append(item);
  });

  grid.append(inner);
  block.replaceChildren(grid);
}
