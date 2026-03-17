import {
  cellText,
  createPictureFromCell,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'ed-grid';

  getRows(block).forEach((row, index) => {
    const [imageCell, indexCell, tagCell, contentCell] = row;
    const lines = cellText(contentCell).split('\n').map((entry) => entry.trim()).filter(Boolean);
    const [title, ...descriptionParts] = lines;
    const card = document.createElement('article');
    card.className = `ed-card reveal reveal-delay-${(index % 4) + 1}`;

    const picture = createPictureFromCell(imageCell, false, [{ media: '(min-width: 900px)', width: '900' }, { width: '600' }]);
    if (picture) {
      picture.className = 'ed-photo';
      card.append(picture);
    }

    const shade = document.createElement('div');
    shade.className = 'ed-shade';
    card.append(shade);

    const body = document.createElement('div');
    body.className = 'ed-body';
    body.innerHTML = `
      <div class="ed-idx">${cellText(indexCell)}</div>
      <div class="ed-tag">${cellText(tagCell)}</div>
      <div class="ed-title">${title || ''}</div>
      <div class="ed-desc">${descriptionParts.join(' ')}</div>
    `;
    card.append(body);
    grid.append(card);
  });

  block.replaceChildren(grid);
}
