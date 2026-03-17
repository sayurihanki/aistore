/* eslint-disable no-console */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  describeCommerceContractIssue,
  mergeCommerceContractProduct,
  normalizeCoreCustomizableProduct,
  shouldAttemptCoreCustomizableFallback,
  validateCommerceProductContract,
} from '../../blocks/uniform-configurator/uniform-configurator.commerce.js';
import { normalizeDataset } from '../../blocks/uniform-configurator/uniform-configurator.lib.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const DEFAULT_SKU = 'USMC-OFFICER-BLUES-PACKAGE';

const PRODUCT_QUERY = `
  query UniformConfiguratorProduct($skus: [String]) {
    products(skus: $skus) {
      __typename
      sku
      name
      addToCartAllowed
      inStock
      inputOptions {
        id
        title
        required
        type
        sortOrder
      }
      ... on ComplexProductView {
        options {
          id
          title
          required
          multi
          values {
            id
            title
            __typename
            ... on ProductViewOptionValueSwatch {
              value
              type
            }
            ... on ProductViewOptionValueProduct {
              product {
                sku
                price {
                  regular {
                    amount {
                      value
                      currency
                    }
                  }
                  final {
                    amount {
                      value
                      currency
                    }
                  }
                }
              }
            }
          }
        }
      }
      ... on SimpleProductView {
        price {
          regular {
            amount {
              value
              currency
            }
          }
          final {
            amount {
              value
              currency
            }
          }
        }
      }
    }
  }
`;

const CORE_CUSTOMIZABLE_PRODUCT_QUERY = `
  query UniformConfiguratorCoreProduct($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        __typename
        sku
        name
        ... on CustomizableProductInterface {
          options {
            __typename
            uid
            title
            required
            sort_order
            ... on CustomizableDropDownOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableCheckboxOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableMultipleOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableRadioOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableFieldOption {
              value {
                uid
                price
                price_type
                max_characters
                sku
              }
            }
            ... on CustomizableAreaOption {
              value {
                uid
                price
                price_type
                max_characters
                sku
              }
            }
          }
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
  const headers = {
    'content-type': 'application/json',
  };

  Object.assign(headers, publicConfig.headers?.all || {});
  Object.assign(headers, publicConfig.headers?.cs || {});

  return headers;
}

function getEndpoint(config) {
  return getPublicConfig(config)['commerce-endpoint'];
}

function getCoreEndpoint(config) {
  return getPublicConfig(config)['commerce-core-endpoint'];
}

function extractBasePrice(product = {}) {
  const simpleAmount = product?.price?.final?.amount?.value;
  if (Number.isFinite(simpleAmount)) {
    return simpleAmount;
  }

  const rangedAmount = product?.priceRange?.minimum?.final?.amount?.value;
  if (Number.isFinite(rangedAmount)) {
    return rangedAmount;
  }

  return null;
}

async function fetchProduct(config, sku) {
  const endpoint = getEndpoint(config);
  if (!endpoint) {
    throw new Error('Missing commerce-endpoint in config.json.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaderBag(config),
    body: JSON.stringify({
      query: PRODUCT_QUERY,
      variables: {
        skus: [sku],
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Commerce query failed with ${response.status}.`);
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return payload?.data?.products?.[0] || null;
}

async function fetchCoreCustomizableProduct(config, sku) {
  const endpoint = getCoreEndpoint(config);
  if (!endpoint) {
    return {
      product: null,
      error: `Missing commerce-core-endpoint; the configured commerce-endpoint resolves "${sku}" as a SimpleProductView without customizable option metadata, so Magento Admin custom options cannot be queried for this simple product.`,
    };
  }

  const headers = {
    'content-type': 'application/json',
    ...getPublicConfig(config).headers?.all,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: CORE_CUSTOMIZABLE_PRODUCT_QUERY,
      variables: {
        sku,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    return {
      product: null,
      error: `Core customizable query failed with ${response.status}.`,
    };
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return {
      product: null,
      error: payload.errors.map((error) => error.message).join('; '),
    };
  }

  const product = payload?.data?.products?.items?.[0];
  return {
    product: product?.sku ? normalizeCoreCustomizableProduct(product) : null,
    error: product?.sku ? null : `Core customizable query returned no product for SKU "${sku}".`,
  };
}

async function main() {
  const sku = process.argv[2] || process.env.UNIFORM_CONFIGURATOR_SKU || DEFAULT_SKU;
  const [config, rawDataset] = await Promise.all([
    loadJson('config.json'),
    loadJson('data/configurators/marine-officer-dress-blues.json'),
  ]);
  const data = normalizeDataset(rawDataset);
  const product = await fetchProduct(config, sku);
  let contractProduct = product;
  let coreFallbackMessage = '';

  if (shouldAttemptCoreCustomizableFallback(contractProduct)) {
    const coreResult = await fetchCoreCustomizableProduct(config, sku);
    if (coreResult.product?.sku) {
      contractProduct = mergeCommerceContractProduct(contractProduct, coreResult.product);
    } else if (coreResult.error) {
      coreFallbackMessage = coreResult.error;
    }
  }

  if (!contractProduct?.sku) {
    console.error(`Contract check failed: SKU "${sku}" did not resolve in the R2BTcyPc7knfUJMozF1oQQ environment.`);
    process.exitCode = 1;
    return;
  }

  const validation = validateCommerceProductContract(data, contractProduct);
  const basePrice = extractBasePrice(contractProduct);

  console.log(`Resolved SKU: ${contractProduct.sku}`);
  console.log(`Product type: ${contractProduct.__typename}`);
  console.log(`Base price: ${basePrice === null ? 'unknown' : basePrice}`);
  console.log(`Selectable options exposed: ${Array.isArray(contractProduct.options) ? contractProduct.options.length : 0}`);
  console.log(`Entered options exposed: ${Array.isArray(contractProduct.inputOptions) ? contractProduct.inputOptions.length : 0}`);

  if (basePrice !== null && basePrice !== 678) {
    console.error(`Contract check failed: expected base price 678, received ${basePrice}.`);
    process.exitCode = 1;
    return;
  }

  if (!validation.valid) {
    if (coreFallbackMessage) {
      console.error(`Contract context: ${coreFallbackMessage}`);
    }
    console.error('Contract check failed. Missing Commerce contract items:');
    validation.missing.forEach((issue) => {
      console.error(`- ${describeCommerceContractIssue(issue)}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('Contract check passed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
