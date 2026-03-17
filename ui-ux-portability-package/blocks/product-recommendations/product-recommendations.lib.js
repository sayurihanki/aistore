export function getCartSkus(shoppingCartContext) {
  if (!shoppingCartContext || shoppingCartContext.totalQuantity === 0) {
    return [];
  }

  return (shoppingCartContext.items || [])
    .map(({ product }) => product?.sku)
    .filter(Boolean);
}

export function getRecommendationBootstrapContext({
  authoredCurrentSku,
  adobeDataLayer,
} = {}) {
  const getState = typeof adobeDataLayer?.getState === 'function'
    ? adobeDataLayer.getState.bind(adobeDataLayer)
    : null;

  const productContext = getState?.('productContext') || {};

  // The recommendations drop-in requires a product SKU, so avoid bootstrapping
  // category pages unless authoring explicitly provides one.
  const currentSku = authoredCurrentSku || productContext.sku;
  if (!currentSku) {
    return {};
  }

  const pageContext = getState?.('pageContext') || {};
  const categoryContext = getState?.('categoryContext') || {};
  const shoppingCartContext = getState?.('shoppingCartContext') || {};

  return {
    currentSku,
    pageType: pageContext.pageType,
    category: categoryContext.name,
    cartSkus: getCartSkus(shoppingCartContext),
  };
}
