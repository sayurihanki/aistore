import { initializers } from '@dropins/tools/initializer.js';
import { Image, provider as UI } from '@dropins/tools/components.js';
import { initialize, setEndpoint, fetchProductData } from '@dropins/storefront-pdp/api.js';
import { isAemAssetsEnabled, tryGenerateAemAssetsOptimizedUrl } from '@dropins/tools/lib/aem/assets.js';
import { initializeDropin } from './index.js';
import { transformProductInputOptions } from '../components/pdp-input-options/pdp-input-options.js';
import {
  CS_FETCH_GRAPHQL,
  fetchPlaceholders,
  getOptionsUIDsFromUrl,
  getProductSku,
  getSearchContext,
  loadErrorPage,
  preloadFile,
} from '../commerce.js';
import { getMetadata } from '../aem.js';

export const IMAGES_SIZES = {
  width: 960,
  height: 1191,
};

const URLKEY_TO_SKU_QUERY = `
  query resolveSkuByUrlKey($phrase: String!, $pageSize: Int = 20, $context: QueryContextInput) {
    productSearch(phrase: $phrase, page_size: $pageSize, context: $context) {
      items {
        productView {
          sku
          urlKey
        }
      }
    }
  }
`;

function getUrlKeyFromPath(pathname = window.location.pathname) {
  const result = pathname.match(/\/products\/([\w|-]+)(?:\/[\w|-]+)?$/);
  return result?.[1] || null;
}

async function resolveSkuByUrlKey(urlKey) {
  if (!urlKey) {
    return null;
  }

  try {
    const { data, errors } = await CS_FETCH_GRAPHQL.fetchGraphQl(URLKEY_TO_SKU_QUERY, {
      method: 'GET',
      variables: {
        phrase: urlKey,
        pageSize: 20,
        context: getSearchContext(),
      },
    });

    if (errors?.length) {
      console.warn('Unable to resolve sku from urlKey via productSearch', { urlKey, errors });
      return null;
    }

    const exactMatch = data?.productSearch?.items
      ?.find((item) => item?.productView?.urlKey === urlKey)?.productView;

    if (!exactMatch?.sku) {
      return null;
    }

    return exactMatch.sku;
  } catch (error) {
    console.warn('Error while resolving sku from urlKey', { urlKey, error });
    return null;
  }
}

/**
 * Extracts the main product image URL from JSON-LD or meta tags
 * @returns {string|null} The image URL or null if not found
 */
function extractMainImageUrl() {
  // Cache DOM query to avoid repeated lookups
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return getMetadata('og:image') || getMetadata('image');
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);

    // Verify this is product structured data before extracting image
    if (jsonLd?.['@type'] === 'Product' && jsonLd?.image) {
      return jsonLd.image;
    }

    return getMetadata('og:image') || getMetadata('image');
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return getMetadata('og:image') || getMetadata('image');
  }
}

/**
 * Preloads PDP Dropins assets for optimal performance
 */
function preloadPDPAssets() {
  // Preload PDP Dropins assets
  preloadFile('/scripts/__dropins__/storefront-pdp/api.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/render.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductHeader.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductPrice.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductShortDescription.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductOptions.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductQuantity.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductDescription.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductAttributes.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductGallery.js', 'script');

  // Extract and preload main product image
  const imageUrl = extractMainImageUrl();

  if (imageUrl) {
    preloadFile(imageUrl, 'image');
  } else {
    console.warn('Unable to infer main image from JSON-LD or meta tags');
  }
}

await initializeDropin(async () => {
  // Inherit Fetch GraphQL Instance (Catalog Service)
  setEndpoint(CS_FETCH_GRAPHQL);

  // Preload PDP assets immediately when this module is imported
  preloadPDPAssets();

  // Fetch product data
  let sku = getProductSku();
  const optionsUIDs = getOptionsUIDsFromUrl();
  const urlKey = getUrlKeyFromPath();

  const getProductData = async (targetSku, skipTransform) => {
    const data = await fetchProductData(targetSku, { optionsUIDs, skipTransform })
      .then(preloadImageMiddleware);
    return data;
  };

  const labelsPromise = fetchPlaceholders('placeholders/pdp.json');
  let product = await getProductData(sku, true);

  if (!product?.sku && urlKey) {
    const resolvedSku = await resolveSkuByUrlKey(urlKey);
    if (resolvedSku) {
      sku = resolvedSku;
      product = await getProductData(sku, true);
    }
  }

  const labels = await labelsPromise;

  if (!product?.sku) {
    return loadErrorPage();
  }

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  const models = {
    ProductDetails: {
      initialData: { ...product },
      transformer: (rawProduct) => ({
        inputOptions: transformProductInputOptions(rawProduct),
      }),
    },
  };

  // Initialize Dropins
  return initializers.mountImmediately(initialize, {
    sku,
    optionsUIDs,
    langDefinitions,
    models,
    acdl: true,
    persistURLParams: true,
  });
})();

async function preloadImageMiddleware(data) {
  const image = data?.images?.[0]?.url?.replace(/^https?:/, '');

  if (image) {
    let url = image;
    let imageParams = {
      ...IMAGES_SIZES,
    };
    if (isAemAssetsEnabled) {
      url = tryGenerateAemAssetsOptimizedUrl(image, data.sku, {});
      imageParams = {
        ...imageParams,
        crop: undefined,
        fit: undefined,
        auto: undefined,
      };
    }
    await UI.render(Image, {
      src: url,
      ...IMAGES_SIZES.mobile,
      params: imageParams,
      loading: 'eager',
    })(document.createElement('div'));
  }
  return data;
}
