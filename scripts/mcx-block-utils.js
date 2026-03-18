import {
  createOptimizedPicture,
  toClassName,
} from './aem.js';

export function getRows(block) {
  return [...block.children].map((row) => [...row.children]);
}

function collectCellText(node, parts = []) {
  if (!node) return parts;
  const nodeType = node.nodeType ?? (node.tagName ? 1 : 0);

  if (nodeType === 3) {
    parts.push(node.textContent || '');
    return parts;
  }

  if (nodeType !== 1 && nodeType !== 11) {
    return parts;
  }

  if (node.tagName?.toLowerCase() === 'br') {
    parts.push('\n');
    return parts;
  }

  if (!node.childNodes?.length) {
    parts.push(node.textContent || '');
    return parts;
  }

  [...(node.childNodes || [])].forEach((child) => collectCellText(child, parts));
  return parts;
}

export function cellText(cell) {
  return collectCellText(cell, [])
    .join('')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseLines(cell) {
  return cellText(cell)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseKeyValueCell(cell) {
  return parseLines(cell).reduce((acc, line) => {
    const [rawKey, ...rawValue] = line.split(':');
    if (!rawKey || rawValue.length === 0) return acc;
    acc[toClassName(rawKey)] = rawValue.join(':').trim();
    return acc;
  }, {});
}

export function parseFieldRows(block) {
  return getRows(block).reduce((acc, row) => {
    const [keyCell, valueCell] = row;
    if (keyCell && valueCell) {
      acc[toClassName(cellText(keyCell))] = valueCell;
    }
    return acc;
  }, {});
}

export function moveCellContent(cell, target) {
  if (!cell || !target) return target;
  target.append(...[...cell.childNodes]);
  return target;
}

export function createTextElement(tag, className, text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createFallbackPicture(img, eager = false) {
  const picture = document.createElement('picture');
  const clone = img.cloneNode(true);
  clone.loading = eager ? 'eager' : 'lazy';
  picture.append(clone);
  return picture;
}

export function extractMarkdownImage(text = '') {
  const match = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!match) return null;

  const [, alt, src] = match;
  return {
    alt: alt.trim(),
    src: src.trim(),
  };
}

export function extractMarkdownLink(text = '') {
  const match = text.match(/(?:^|[^!])\[([^\]]+)\]\s*\(([^)]+)\)/);
  if (!match) return null;

  const [, label, href] = match;
  return {
    href: href.trim(),
    text: label.trim(),
  };
}

function createImageElement(src, alt = '') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

function createPictureFromImage(img, eager, breakpoints) {
  try {
    const url = new URL(img.src, window.location.href);
    const isLocal = url.origin === window.location.origin
      || img.getAttribute('src')?.startsWith('/media_')
      || img.getAttribute('src')?.startsWith('./media_')
      || img.getAttribute('src')?.startsWith('/');

    return isLocal
      ? createOptimizedPicture(img.src, img.alt || '', eager, breakpoints)
      : createFallbackPicture(img, eager);
  } catch (error) {
    return createFallbackPicture(img, eager);
  }
}

export function createPictureFromCell(
  cell,
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '1400' }, { width: '700' }],
) {
  let img = cell?.querySelector('img');

  if (!img) {
    const markdownImage = extractMarkdownImage(cellText(cell));
    if (markdownImage?.src) {
      img = createImageElement(markdownImage.src, markdownImage.alt);
    }
  }

  if (!img) return null;
  return createPictureFromImage(img, eager, breakpoints);
}

export function extractLink(cell, fallbackText = '') {
  const anchor = cell?.querySelector('a');
  if (anchor) {
    return {
      href: anchor.href,
      text: anchor.textContent.trim(),
    };
  }

  const markdownLink = extractMarkdownLink(cellText(cell));
  if (markdownLink) {
    return markdownLink;
  }

  return {
    href: '',
    text: fallbackText || cellText(cell),
  };
}

export function createLink(className, href, text) {
  const link = document.createElement('a');
  if (className) link.className = className;
  link.href = href || '#';
  link.textContent = text;
  return link;
}

export function duplicateItems(items) {
  return [...items, ...items];
}
