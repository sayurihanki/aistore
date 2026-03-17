const MCX_CONTENT_BLOCKS = new Set([
  'mcx-announcement-bar',
  'mcx-benefits',
  'mcx-brands',
  'mcx-category-page',
  'mcx-category-grid',
  'mcx-deal-countdown',
  'mcx-editorial-cards',
  'mcx-featured-collections',
  'mcx-hero',
  'mcx-newsletter',
  'mcx-promo-popup',
  'mcx-product-cards',
  'mcx-promo-strip',
  'mcx-ticker',
]);

function getPrimaryClassName(element) {
  return (element?.className || '').split(/\s+/).find(Boolean) || '';
}

export function hasMcxContentBlock(root) {
  if (!root?.querySelectorAll) return false;

  return [...root.querySelectorAll('div')].some((node) => {
    const className = getPrimaryClassName(node);
    return MCX_CONTENT_BLOCKS.has(className);
  });
}

export function applyMcxExperienceFallback(doc, ensureMetadata) {
  const main = doc?.querySelector?.('main');
  if (!hasMcxContentBlock(main)) return false;

  doc.body?.classList?.add('mcx');
  if (typeof ensureMetadata === 'function') {
    ensureMetadata('theme', 'mcx');
  }

  return true;
}

export { MCX_CONTENT_BLOCKS };
