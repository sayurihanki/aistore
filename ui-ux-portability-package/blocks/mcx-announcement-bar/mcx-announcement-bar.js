import {
  cellText,
  getRows,
} from '../../scripts/mcx-block-utils.js';

export default function decorate(block) {
  const rows = getRows(block);
  let dismissible = true;

  const items = rows.reduce((acc, row) => {
    const [firstCell, secondCell] = row;
    if (secondCell && cellText(firstCell).toLowerCase() === 'dismissible') {
      dismissible = cellText(secondCell).toLowerCase() !== 'false';
      return acc;
    }

    const value = cellText(firstCell);
    if (value) acc.push(value);
    return acc;
  }, []);

  const bar = document.createElement('div');
  bar.className = 'ann-bar';

  const inner = document.createElement('div');
  inner.className = 'ann-inner';

  items.forEach((item, index) => {
    const node = document.createElement('span');
    node.className = 'ann-item';
    node.textContent = item;
    inner.append(node);

    if (index < items.length - 1) {
      const dot = document.createElement('span');
      dot.className = 'ann-dot';
      dot.setAttribute('aria-hidden', 'true');
      inner.append(dot);
    }
  });

  bar.append(inner);

  if (dismissible) {
    const close = document.createElement('button');
    close.className = 'ann-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close announcement bar');
    close.textContent = '✕';
    close.addEventListener('click', () => {
      const section = block.closest('.section');
      if (section) section.remove();
    });
    bar.append(close);
  }

  block.replaceChildren(bar);
}
