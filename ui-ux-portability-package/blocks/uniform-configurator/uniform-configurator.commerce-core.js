import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { CORE_FETCH_GRAPHQL } from '../../scripts/commerce.js';
import { normalizeCoreCustomizableProduct } from './uniform-configurator.commerce.js';

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

function buildCoreCustomizableError(message, endpoint = '') {
  const suffix = endpoint ? ` Endpoint: ${endpoint}` : '';
  return new Error(`${message}${suffix}`);
}

function getErrorMessage(errors = []) {
  return errors
    .map((error) => error?.message)
    .filter(Boolean)
    .join('; ');
}

export async function fetchCoreCustomizableCommerceProduct(sku) {
  const coreEndpoint = String(await getConfigValue('commerce-core-endpoint') || '').trim();

  if (!coreEndpoint) {
    return {
      product: null,
      error: buildCoreCustomizableError(
        `The configured commerce-endpoint resolves "${sku}" as a SimpleProductView without customizable option metadata. `
        + 'This package uses Magento Admin customizable options on a simple product, so the site also needs a real '
        + 'commerce-core-endpoint to load the option UIDs required for add-to-cart.',
      ),
    };
  }

  CORE_FETCH_GRAPHQL.setEndpoint(coreEndpoint);
  CORE_FETCH_GRAPHQL.setFetchGraphQlHeaders((prev) => ({
    ...prev,
    ...getHeaders('all'),
  }));

  let payload;
  try {
    payload = await CORE_FETCH_GRAPHQL.fetchGraphQl(CORE_CUSTOMIZABLE_PRODUCT_QUERY, {
      method: 'GET',
      cache: 'no-cache',
      variables: { sku },
    });
  } catch (error) {
    return {
      product: null,
      error: buildCoreCustomizableError(
        error?.message || 'Unable to query the configured commerce-core-endpoint.',
        coreEndpoint,
      ),
    };
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return {
      product: null,
      error: buildCoreCustomizableError(
        getErrorMessage(payload.errors)
        || 'The configured commerce-core-endpoint rejected the customizable options query.',
        coreEndpoint,
      ),
    };
  }

  const product = payload?.data?.products?.items?.[0];

  if (!product?.sku) {
    return {
      product: null,
      error: buildCoreCustomizableError(
        `The commerce-core-endpoint did not return a customizable product payload for SKU "${sku}".`,
        coreEndpoint,
      ),
    };
  }

  return {
    product: normalizeCoreCustomizableProduct(product),
    error: null,
  };
}
