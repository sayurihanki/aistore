import {
  cellText,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const section = document.createElement('div');
  section.className = 'brands-sect';
  section.innerHTML = `
    <div class="brands-inner">
      <div class="brands-hd">Trusted Brands Available at Every MCX Location</div>
      <div class="brands-row"></div>
    </div>
  `;

  const row = section.querySelector('.brands-row');
  getRows(block).forEach(([cell]) => {
    const pill = document.createElement('div');
    pill.className = 'brand-pill';
    pill.innerHTML = `<span class="brand-nm">${cellText(cell)}</span>`;
    row.append(pill);
  });

  block.replaceChildren(section);
}
