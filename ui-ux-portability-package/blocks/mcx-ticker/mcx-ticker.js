import {
  cellText,
  duplicateItems,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const items = getRows(block)
    .map(([firstCell, secondCell]) => {
      const firstText = cellText(firstCell);
      const secondText = cellText(secondCell);
      if (firstText && secondText && !firstText.includes('|')) {
        return `${firstText}|${secondText}`;
      }
      return firstText || secondText;
    })
    .filter(Boolean);

  const wrap = document.createElement('div');
  wrap.className = 'ticker-wrap';

  const track = document.createElement('div');
  track.className = 'ticker-track';

  duplicateItems(items).forEach((itemText) => {
    const item = document.createElement('span');
    item.className = 'ticker-item';
    const [emphasis, ...rest] = itemText.split('|').map((entry) => entry.trim());
    item.innerHTML = `<span class="ticker-gem">&#9670;</span> <b>${emphasis}</b>${rest.length ? ` ${rest.join(' ')}` : ''}`;
    track.append(item);
  });

  wrap.append(track);
  block.replaceChildren(wrap);
}
