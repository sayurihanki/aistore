import {
  cellText,
  createPictureFromCell,
  extractLink,
  createLink,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const config = {};
  const grid = document.createElement('div');
  grid.className = 'cat-grid';

  getRows(block).forEach((row, index) => {
    const [iconCell, nameCell, countCell, linkCell] = row;
    const key = cellText(iconCell).toLowerCase();
    if (['label', 'title', 'view-link'].includes(key)) {
      config[key] = key === 'view-link' ? extractLink(nameCell) : cellText(nameCell);
      return;
    }

    const linkData = extractLink(linkCell, `Shop ${cellText(nameCell)}`);
    const link = createLink('cat-tile reveal reveal-delay-1', linkData.href, '');
    link.style.setProperty('--cat-delay', String(index % 4));
    link.className = `cat-tile reveal reveal-delay-${(index % 4) + 1}`;

    const icon = document.createElement('div');
    icon.className = 'cat-emoji';
    const iconPicture = createPictureFromCell(iconCell, false, [{ width: '120' }]);
    if (iconPicture) {
      iconPicture.className = 'cat-emoji-art';
      icon.append(iconPicture);
    } else {
      icon.textContent = cellText(iconCell) || '•';
    }

    const name = document.createElement('div');
    name.className = 'cat-name';
    name.textContent = cellText(nameCell);

    const count = document.createElement('div');
    count.className = 'cat-count';
    count.textContent = cellText(countCell);

    link.replaceChildren(icon, name, count);
    grid.append(link);
  });

  const fragment = document.createDocumentFragment();

  if (config.label || config.title) {
    const head = document.createElement('div');
    head.className = 'sec-head reveal';
    head.innerHTML = `
      <div>
        ${config.label ? `<span class="sec-label">${config.label}</span>` : ''}
        ${config.title ? `<h2 class="sec-title">${config.title}</h2>` : ''}
      </div>
    `;
    if (config['view-link']?.text) {
      const link = createLink('view-link', config['view-link'].href, config['view-link'].text);
      head.append(link);
    }
    fragment.append(head);
  }

  fragment.append(grid);
  block.replaceChildren(fragment);
}
