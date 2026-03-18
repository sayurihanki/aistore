/* eslint-disable no-console */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '..');
const DEFAULT_SKU = process.env.CATALOG_HEALTH_SKU || 'USMC-OFFICER-BLUES-PACKAGE';

const DIRECT_PRODUCT_QUERY = `
  query CatalogHealthProducts($skus: [String]) {
    products(skus: $skus) {
      __typename
      sku
      name
      url
      urlKey
      addToCartAllowed
      inStock
    }
  }
`;

const PRODUCT_SEARCH_QUERY = `
  query CatalogHealthSearch {
    productSearch(current_page: 1, page_size: 1, phrase: "") {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        productView {
          sku
          name
          url
          urlKey
        }
      }
    }
  }
`;

async function loadJson(relativePath) {
  const filePath = resolve(repoRoot, relativePath);
  const contents = await readFile(filePath, 'utf8');
  return JSON.parse(contents);
}

function getPublicConfig(config) {
  return config?.public?.default || {};
}

function getHeaderBag(config) {
  const publicConfig = getPublicConfig(config);
  return {
    'content-type': 'application/json',
    ...(publicConfig.headers?.all || {}),
    ...(publicConfig.headers?.cs || {}),
  };
}

function getEndpoint(config) {
  return getPublicConfig(config)['commerce-endpoint'];
}

function getStoreSummary(config) {
  const publicConfig = getPublicConfig(config);
  const analytics = publicConfig.analytics || {};

  return {
    environment: analytics.environment || 'unknown',
    environmentId: analytics['environment-id'] || 'unknown',
    storeCode: analytics['store-code'] || publicConfig.headers?.cs?.['Magento-Store-Code'] || 'unknown',
    storeViewCode: analytics['store-view-code'] || publicConfig.headers?.cs?.['Magento-Store-View-Code'] || 'unknown',
    websiteCode: analytics['website-code'] || publicConfig.headers?.cs?.['Magento-Website-Code'] || 'unknown',
    rootCategory: publicConfig.plugins?.picker?.rootCategory || 'missing',
  };
}

async function postGraphql(config, query, variables = {}) {
  const endpoint = getEndpoint(config);
  if (!endpoint) {
    throw new Error('Missing commerce-endpoint in config.json.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaderBag(config),
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function collectErrorMessages(payload) {
  if (!Array.isArray(payload?.errors) || payload.errors.length === 0) {
    return [];
  }

  return payload.errors.map((error) => error.message || JSON.stringify(error));
}

function formatResultLabel(passed) {
  return passed ? 'PASS' : 'FAIL';
}

async function checkDirectProduct(config, sku) {
  const response = await postGraphql(config, DIRECT_PRODUCT_QUERY, { skus: [sku] });
  const errors = collectErrorMessages(response.payload);
  const product = response.payload?.data?.products?.[0] || null;
  const passed = response.ok && errors.length === 0 && Boolean(product?.sku);

  return {
    id: 'direct-product',
    label: 'Direct product lookup',
    passed,
    detail: passed
      ? `${product.sku} resolved (${product.__typename}, inStock=${String(product.inStock)})`
      : errors[0] || `SKU "${sku}" did not resolve`,
    product,
  };
}

async function checkProductSearch(config) {
  const response = await postGraphql(config, PRODUCT_SEARCH_QUERY);
  const errors = collectErrorMessages(response.payload);
  const search = response.payload?.data?.productSearch || null;
  const firstItem = search?.items?.[0]?.productView || null;
  const passed = response.ok && errors.length === 0 && Number.isFinite(search?.total_count);

  return {
    id: 'product-search',
    label: 'Catalog search index',
    passed,
    detail: passed
      ? `total_count=${search.total_count}${firstItem?.sku ? `, first SKU=${firstItem.sku}` : ''}`
      : errors[0] || 'productSearch did not return data',
    search,
  };
}

async function main() {
  const sku = process.argv[2] || DEFAULT_SKU;
  const config = await loadJson('config.json');
  const summary = getStoreSummary(config);

  console.log('Catalog health check');
  console.log(`Environment: ${summary.environment} (${summary.environmentId})`);
  console.log(`Store: ${summary.storeCode} / ${summary.storeViewCode} / ${summary.websiteCode}`);
  console.log(`Root category: ${summary.rootCategory}`);
  console.log(`Sample SKU: ${sku}`);

  const results = await Promise.all([
    checkDirectProduct(config, sku),
    checkProductSearch(config),
  ]);

  console.log('');
  results.forEach((result) => {
    console.log(`[${formatResultLabel(result.passed)}] ${result.label}: ${result.detail}`);
  });

  const allPassed = results.every((result) => result.passed);

  console.log('');
  if (allPassed) {
    console.log('Catalog status: healthy enough for live product detail and search-backed storefront flows.');
    return;
  }

  console.log('Catalog status: partially connected.');
  console.log('Recommended next steps:');

  const directProduct = results.find((result) => result.id === 'direct-product');
  const productSearch = results.find((result) => result.id === 'product-search');

  if (!directProduct?.passed) {
    console.log('- Fix base Commerce connectivity first: endpoint, store headers, or sample SKU selection are not resolving products.');
  }

  if (!productSearch?.passed) {
    console.log('- Rebuild or attach the Catalog Service search index for this store view; PLP/search/category flows depend on productSearch.');
  }

  console.log('- Keep guided-selling and merchandising data SKU-based so authored experiences can be hydrated from live product data later.');
  console.log('- Make sure each sellable item has a stable URL, image, price, stock state, and category assignment before merchandising it.');

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
