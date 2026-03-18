const axios = require('axios');

function toBaseUrl(value) {
  return String(value || '').replace(/\/$/, '');
}

function buildOrderSearchUrl(baseUrl, orderNumber) {
  const url = new URL(`${toBaseUrl(baseUrl)}/rest/V1/orders`);
  url.searchParams.set(
    'searchCriteria[filter_groups][0][filters][0][field]',
    'increment_id',
  );
  url.searchParams.set(
    'searchCriteria[filter_groups][0][filters][0][value]',
    orderNumber,
  );
  url.searchParams.set(
    'searchCriteria[filter_groups][0][filters][0][condition_type]',
    'eq',
  );
  return url.toString();
}

async function getAdminToken(baseUrl, env = {}) {
  if (env.uniformAdminToken) {
    return env.uniformAdminToken;
  }

  if (!env.uniformAdminUsername || !env.uniformAdminPassword) {
    return '';
  }

  const response = await axios.post(
    `${toBaseUrl(baseUrl)}/rest/V1/integration/admin/token`,
    {
      username: env.uniformAdminUsername,
      password: env.uniformAdminPassword,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry)).join(', ');
  }

  return String(value).trim();
}

function extractCustomOptions(item = {}) {
  const productOption = item.product_option || {};
  const extensionAttributes = productOption.extension_attributes || {};
  const customOptions = extensionAttributes.custom_options
    || productOption.custom_options
    || [];

  return customOptions.map((option) => ({
    label: normalizeValue(option.label || option.option_title),
    value: normalizeValue(option.value || option.print_value || option.option_value),
  }));
}

async function verifyUniformOrderItem(payload = {}, env = {}) {
  const {
    orderNumber,
    sku,
    expectedOptions = {},
  } = payload;
  const baseUrl = env.uniformAdminBaseUrl;

  if (!baseUrl) {
    return {
      ok: false,
      reason: 'Missing uniformAdminBaseUrl.',
    };
  }

  const token = await getAdminToken(baseUrl, env);
  if (!token) {
    return {
      ok: false,
      reason: 'Missing admin token or admin credentials.',
    };
  }

  const response = await axios.get(buildOrderSearchUrl(baseUrl, orderNumber), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const order = response.data?.items?.[0];
  if (!order) {
    return {
      ok: false,
      reason: `Order ${orderNumber} was not found in Admin.`,
    };
  }

  const orderItem = (order.items || []).find((item) => item.sku === sku);
  if (!orderItem) {
    return {
      ok: false,
      reason: `Order ${orderNumber} does not contain SKU ${sku}.`,
    };
  }

  const customOptions = extractCustomOptions(orderItem);
  const optionsByLabel = new Map(customOptions.map((option) => [option.label, option.value]));
  const missing = Object.entries(expectedOptions).filter(
    ([label, value]) => optionsByLabel.get(label) !== normalizeValue(value),
  );

  return {
    ok: missing.length === 0,
    orderId: order.entity_id,
    orderNumber,
    sku,
    customOptions,
    missing,
  };
}

module.exports = {
  verifyUniformOrderItem,
};
