/* eslint-disable import/no-unresolved */

// Tools and initializers
import { Button, provider as UI } from '@dropins/tools/components.js';
import { initializers } from '@dropins/tools/initializer.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { events } from '@dropins/tools/event-bus.js';

// Recommendations and wishlist
import * as cartApi from '@dropins/storefront-cart/api.js';
import {
  getRecommendations,
  publishRecsItemAddToCartClick,
} from '@dropins/storefront-recommendations/api.js';
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';

// Order Dropin API
import * as orderApi from '@dropins/storefront-order/api.js';
import { render as OrderProvider } from '@dropins/storefront-order/render.js';
import OrderHeader from '@dropins/storefront-order/containers/OrderHeader.js';
import OrderStatus from '@dropins/storefront-order/containers/OrderStatus.js';
import ShippingStatus from '@dropins/storefront-order/containers/ShippingStatus.js';
import CustomerDetails from '@dropins/storefront-order/containers/CustomerDetails.js';
import OrderCostSummary from '@dropins/storefront-order/containers/OrderCostSummary.js';
import OrderProductList from '@dropins/storefront-order/containers/OrderProductList.js';

// Checkout API/utils used for header and DOM
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import { createFragment, createScopedSelector } from '@dropins/storefront-checkout/lib/utils.js';

// Cart (for gift options within order confirmation)
import { render as CartProvider } from '@dropins/storefront-cart/render.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';

// Auth (for sign-up modal in header)
import { render as AuthProvider } from '@dropins/storefront-auth/render.js';
import SignUp from '@dropins/storefront-auth/containers/SignUp.js';

// Commerce helpers
import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
  SUPPORT_PATH,
  UPS_TRACKING_URL,
  authPrivacyPolicyConsentSlot,
  fetchPlaceholders,
  getConsent,
  getProductLink,
  rootLink,
} from '../../scripts/commerce.js';

// Initialize dropins
import '../../scripts/initializers/auth.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/checkout.js';
import '../../scripts/initializers/order.js';
import '../../scripts/initializers/recommendations.js';
import '../../scripts/initializers/wishlist.js';

// Local modal helper
import createModal from '../modal/modal.js';
import { loadCSS } from '../../scripts/aem.js';

const SHIPPING_STATUS_ID = 'order-confirmation-shipping-status';
const RECOMMENDATIONS_SECTION_ID = 'order-confirmation-recommendations';

const selectors = Object.freeze({
  orderConfirmation: {
    header: '.order-confirmation__header',
    heroKicker: '.order-confirmation__hero-kicker',
    heroMetrics: '.order-confirmation__hero-metrics',
    heroActions: '.order-confirmation__hero-actions',
    fulfillment: '.order-confirmation__fulfillment',
    orderStatus: '.order-confirmation__order-status',
    shippingStatus: '.order-confirmation__shipping-status',
    customerDetails: '.order-confirmation__customer-details',
    orderCostSummary: '.order-confirmation__order-cost-summary',
    giftOptions: '.order-confirmation__gift-options',
    orderProductList: '.order-confirmation__order-product-list',
    recommendations: '.order-confirmation__recommendations',
    recommendationsTitle: '.order-confirmation__recommendations-title',
    recommendationsDescription: '.order-confirmation__recommendations-description',
    recommendationsList: '.order-confirmation__recommendations-list',
    mission: '.order-confirmation__mission',
    footer: '.order-confirmation__footer',
    continueButton: '.order-confirmation-footer__continue-button',
  },
});

function createOrderConfirmationFragment() {
  return createFragment(`
    <div class="order-confirmation">
      <section class="order-confirmation__hero order-confirmation__block">
        <div class="order-confirmation__hero-copy">
          <p class="order-confirmation__hero-kicker">Order confirmed</p>
          <div class="order-confirmation__header"></div>
          <div class="order-confirmation__hero-metrics"></div>
        </div>
        <div class="order-confirmation__hero-actions"></div>
      </section>
      <section class="order-confirmation__fulfillment order-confirmation__block"></section>
      <div class="order-confirmation__content">
        <div class="order-confirmation__main">
          <div class="order-confirmation__order-status order-confirmation__block"></div>
          <div class="order-confirmation__shipping-status order-confirmation__block" id="${SHIPPING_STATUS_ID}"></div>
          <div class="order-confirmation__customer-details order-confirmation__block"></div>
        </div>
        <div class="order-confirmation__aside">
          <div class="order-confirmation__order-cost-summary order-confirmation__block"></div>
          <div class="order-confirmation__gift-options order-confirmation__block"></div>
          <div class="order-confirmation__order-product-list order-confirmation__block"></div>
        </div>
      </div>
      <section class="order-confirmation__recommendations order-confirmation__block" id="${RECOMMENDATIONS_SECTION_ID}" hidden>
        <div class="order-confirmation-section__header">
          <p class="order-confirmation-section__eyebrow">Post-purchase recommendations</p>
          <h2 class="order-confirmation-section__title order-confirmation__recommendations-title">Continue the mission</h2>
          <p class="order-confirmation-section__description order-confirmation__recommendations-description">
            We will surface mission-ready gear based on the order you just placed.
          </p>
        </div>
        <div class="order-confirmation__recommendations-list"></div>
      </section>
      <section class="order-confirmation__mission order-confirmation__block"></section>
      <section class="order-confirmation__footer order-confirmation__block"></section>
    </div>
  `);
}

function createOrderConfirmationFooter(supportPath) {
  return `
    <div class="order-confirmation-footer__copy">
      <p class="order-confirmation-footer__eyebrow">Marine Corps Exchange</p>
      <h2 class="order-confirmation-footer__title">Keep your next mission moving.</h2>
      <p class="order-confirmation-footer__description">
        Explore more apparel, electronics, tactical essentials, and home goods with tax-free MCX pricing.
      </p>
    </div>
    <div class="order-confirmation-footer__actions">
      <div class="order-confirmation-footer__continue-button"></div>
      <p class="order-confirmation-footer__contact-support">
        Need help?
        <a
          href="${supportPath}"
          rel="noreferrer"
          class="order-confirmation-footer__contact-support-link"
          data-testid="order-confirmation-footer__contact-support-link"
        >
          Contact us
        </a>
      </p>
    </div>
  `;
}

function createMissionMarkup() {
  return `
    <div class="order-confirmation-mission">
      <div class="order-confirmation-mission__copy">
        <p class="order-confirmation-section__eyebrow">Marine Corps Community Services impact</p>
        <h2 class="order-confirmation-section__title">Every MCX purchase reinforces the Marine Corps community.</h2>
        <p class="order-confirmation-section__description">
          MCX profits return to Marine Corps Community Services, helping fund family readiness, fitness,
          recreation, and quality-of-life programs for Marines and their families.
        </p>
        <div class="order-confirmation-mission__callout">
          <strong>MCX is mission support.</strong>
          <span class="order-confirmation-mission__callout-text">
            Tax-free shopping is only part of the value. The exchange also reinvests in the community it serves.
          </span>
        </div>
      </div>
      <div class="order-confirmation-mission__stats">
        <article class="order-confirmation-mission__stat">
          <strong>100%</strong>
          <span class="order-confirmation-mission__stat-copy">Of MCX profits support MCCS programs</span>
        </article>
        <article class="order-confirmation-mission__stat">
          <strong>127+</strong>
          <span class="order-confirmation-mission__stat-copy">Exchange locations serving Marines worldwide</span>
        </article>
        <article class="order-confirmation-mission__stat">
          <strong>33M+</strong>
          <span class="order-confirmation-mission__stat-copy">
            Transactions completed across the exchange network each year
          </span>
        </article>
        <article class="order-confirmation-mission__stat">
          <strong>$2.4B</strong>
          <span class="order-confirmation-mission__stat-copy">
            Annual exchange buying power supporting competitive military pricing
          </span>
        </article>
      </div>
    </div>
  `;
}

function swatchImageSlot(ctx) {
  const { imageSwatchContext, defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: imageSwatchContext.label,
    imageProps: defaultImageProps,
    wrapper: document.createElement('span'),
    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  });
}

function formatMoney(value, currency = 'USD') {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatDateTime(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function sumDiscounts(orderData) {
  const total = (orderData?.discounts || []).reduce(
    (sum, discount) => sum + Math.abs(discount?.amount?.value || 0),
    0,
  );

  return total > 0 ? total : 0;
}

function humanizeStatus(status = '') {
  return status
    .toString()
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPrimaryTracking(orderData) {
  const shipment = orderData?.shipments?.find((entry) => entry?.tracking?.length);
  const tracking = shipment?.tracking?.find((entry) => entry?.number);

  if (!tracking) return null;

  const carrierLabel = `${tracking.carrier || ''} ${tracking.title || ''}`.toLowerCase();
  const isUps = carrierLabel.includes('ups');
  const href = isUps
    ? `${UPS_TRACKING_URL}?tracknum=${encodeURIComponent(tracking.number)}`
    : `#${SHIPPING_STATUS_ID}`;

  return {
    href,
    isExternal: isUps,
    label: tracking.title || tracking.carrier || 'Tracking available',
    number: tracking.number,
  };
}

function getHeroMetrics(orderData) {
  if (!orderData) return [];

  const metrics = [
    {
      label: 'Order number',
      value: `#${orderData.number}`,
    },
    {
      label: 'Placed',
      value: formatDateTime(orderData.orderDate) || 'Date unavailable',
    },
    {
      label: 'Total paid',
      value: formatMoney(orderData.grandTotal?.value, orderData.grandTotal?.currency),
      isPositive: true,
    },
  ];

  const discountTotal = sumDiscounts(orderData);
  if (discountTotal > 0) {
    metrics.push({
      label: 'Savings applied',
      value: formatMoney(discountTotal, orderData.grandTotal?.currency),
      isAccent: true,
    });
  }

  return metrics.filter((metric) => metric.value);
}

function getFulfillmentModel(orderData) {
  if (!orderData) return null;

  const status = (orderData.status || '').toLowerCase();
  const hasShipments = Boolean(
    orderData.shipments?.some(
      (shipment) => shipment?.tracking?.length || shipment?.number,
    ),
  );
  const tracking = getPrimaryTracking(orderData);
  const currentStatus = humanizeStatus(orderData.status || 'Processing');

  if (orderData.isVirtual) {
    let currentIndex = 0;
    if (status.includes('complete')) currentIndex = 2;
    else if (status.includes('processing')
      || status.includes('pending')
      || status.includes('review')
      || status.includes('hold')) currentIndex = 1;

    const steps = [
      {
        label: 'Confirmed',
        date: formatShortDate(orderData.orderDate),
      },
      {
        label: 'Processing',
        date: currentIndex >= 1 ? formatShortDate(orderData.orderStatusChangeDate) : null,
      },
      {
        label: 'Ready',
        date: currentIndex === 2 ? formatShortDate(orderData.orderStatusChangeDate) : null,
      },
    ];

    return {
      title: 'Your digital order is in motion.',
      detail: 'No shipment is required for this order. Updates will appear as processing completes.',
      status: currentStatus,
      steps,
      currentIndex,
    };
  }

  let currentIndex = 0;
  if (status.includes('complete')) currentIndex = 3;
  else if (hasShipments || status.includes('shipping')) currentIndex = 2;
  else if (status.includes('processing')
    || status.includes('pending')
    || status.includes('review')
    || status.includes('hold')
    || status.includes('fraud')) currentIndex = 1;

  const shippedDate = orderData.shipments?.[0]?.comments?.[0]?.timestamp
    || orderData.orderStatusChangeDate;
  const deliveryDate = status.includes('complete') ? orderData.orderStatusChangeDate : null;
  const shippingMethod = orderData.shippingMethod || 'Shipping method will appear here when available.';
  const trackingCopy = tracking ? `Tracking ${tracking.number}` : shippingMethod;

  return {
    title: 'Your order is moving through fulfillment.',
    detail: trackingCopy,
    status: currentStatus,
    steps: [
      {
        label: 'Ordered',
        date: formatShortDate(orderData.orderDate),
      },
      {
        label: 'Processing',
        date: currentIndex >= 1 ? formatShortDate(orderData.orderStatusChangeDate) : null,
      },
      {
        label: 'Shipped',
        date: currentIndex >= 2 ? formatShortDate(shippedDate) : null,
      },
      {
        label: 'Delivered',
        date: currentIndex === 3 ? formatShortDate(deliveryDate) : null,
      },
    ],
    currentIndex,
  };
}

function getRecommendationSeed(orderData) {
  return (orderData?.items || []).find((item) => item?.product?.sku || item?.productSku) || null;
}

function getProductViewHistory(storeViewCode) {
  try {
    const key = `${storeViewCode}:productViewHistory`;
    return JSON.parse(window.localStorage.getItem(key) || '[]');
  } catch (error) {
    console.error('Error parsing product view history', error);
    return [];
  }
}

function getPurchaseHistory(storeViewCode) {
  try {
    const key = `${storeViewCode}:purchaseHistory`;
    return JSON.parse(window.localStorage.getItem(key) || '[]');
  } catch (error) {
    console.error('Error parsing purchase history', error);
    return [];
  }
}

function createRecommendationPrice(item) {
  if (item?.price?.final?.amount?.value != null) {
    return formatMoney(item.price.final.amount.value, item.price.final.amount.currency);
  }

  const minimum = item?.priceRange?.minimum?.final?.amount;
  const maximum = item?.priceRange?.maximum?.final?.amount;

  if (minimum?.value != null && maximum?.value != null && minimum.value !== maximum.value) {
    return `${formatMoney(minimum.value, minimum.currency)} - ${formatMoney(maximum.value, maximum.currency)}`;
  }

  if (minimum?.value != null) {
    return formatMoney(minimum.value, minimum.currency);
  }

  return null;
}

function buildProductLink(item) {
  return getProductLink(item?.urlKey, item?.sku);
}

function createRecommendationImage(item) {
  const link = document.createElement('a');
  link.className = 'order-confirmation-recommendation__media';
  link.href = buildProductLink(item);
  link.setAttribute('aria-label', item.name || item.sku || 'Recommended product');

  const url = item?.images?.[0]?.url;
  if (url) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = url.startsWith('//') ? `https:${url}` : url;
    img.alt = item?.images?.[0]?.label || item.name || item.sku || '';
    link.append(img);
    return link;
  }

  const placeholder = document.createElement('span');
  placeholder.className = 'order-confirmation-recommendation__placeholder';
  placeholder.textContent = 'MCX';
  link.append(placeholder);
  return link;
}

function createRecommendationCard(item, recommendationUnit, index, labels) {
  const card = document.createElement('article');
  card.className = 'order-confirmation-recommendation';

  const media = document.createElement('div');
  media.className = 'order-confirmation-recommendation__media-wrap';
  media.append(createRecommendationImage(item));

  const wishlistSlot = document.createElement('div');
  wishlistSlot.className = 'order-confirmation-recommendation__wishlist';
  wishlistRender.render(WishlistToggle, { product: item })(wishlistSlot);
  media.append(wishlistSlot);
  card.append(media);

  const body = document.createElement('div');
  body.className = 'order-confirmation-recommendation__body';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'order-confirmation-recommendation__eyebrow';
  eyebrow.textContent = recommendationUnit?.title || 'Recommended for you';

  const title = document.createElement('a');
  title.className = 'order-confirmation-recommendation__title';
  title.href = buildProductLink(item);
  title.textContent = item.name || item.sku;

  const price = document.createElement('p');
  price.className = 'order-confirmation-recommendation__price';
  price.textContent = createRecommendationPrice(item) || 'View pricing';

  const footer = document.createElement('div');
  footer.className = 'order-confirmation-recommendation__actions';

  const ctaSlot = document.createElement('div');
  ctaSlot.className = 'order-confirmation-recommendation__cta';

  if (item.itemType === 'SimpleProductView') {
    UI.render(Button, {
      children: labels?.Global?.AddProductToCart || 'Add to cart',
      onClick: (event) => {
        cartApi.addProductsToCart([{ sku: item.sku, quantity: 1 }]);
        event.stopPropagation();
        publishRecsItemAddToCartClick({
          recommendationUnit,
          pagePlacement: 'order-confirmation',
          yOffsetTop: ctaSlot.getBoundingClientRect().top ?? 0,
          yOffsetBottom: ctaSlot.getBoundingClientRect().bottom ?? 0,
          productId: index,
        });
      },
      variant: 'primary',
    })(ctaSlot);
  } else {
    UI.render(Button, {
      children: labels?.Global?.SelectProductOptions || 'Select options',
      href: buildProductLink(item),
      variant: 'secondary',
    })(ctaSlot);
  }

  footer.append(ctaSlot);
  body.append(eyebrow, title, price, footer);
  card.append(body);

  return card;
}

let signUpModal;

const handleAuthenticated = (authenticated) => {
  if (authenticated) {
    window.location.reload();
  }
};

async function renderOrderHeader(container, options = {}) {
  const handleSignUpClick = async ({ inputsDefaultValueSet, addressesData }) => {
    const signUpForm = document.createElement('div');
    AuthProvider.render(SignUp, {
      inputsDefaultValueSet,
      addressesData,
      routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
      routeRedirectOnEmailConfirmationClose: () => rootLink(CUSTOMER_ACCOUNT_PATH),
      slots: { ...authPrivacyPolicyConsentSlot },
    })(signUpForm);
    signUpModal = await createModal([signUpForm]);
    signUpModal.showModal();
  };

  return OrderProvider.render(OrderHeader, {
    handleEmailAvailability: checkoutApi.isEmailAvailable,
    handleSignUpClick,
    ...options,
  })(container);
}

async function renderOrderStatus(container) {
  return OrderProvider.render(OrderStatus, { slots: { OrderActions: () => null } })(container);
}

async function renderShippingStatus(container) {
  return OrderProvider.render(ShippingStatus)(container);
}

async function renderCustomerDetails(container) {
  return OrderProvider.render(CustomerDetails)(container);
}

async function renderOrderCostSummary(container) {
  return OrderProvider.render(OrderCostSummary)(container);
}

async function renderOrderProductList(container) {
  return OrderProvider.render(OrderProductList, {
    slots: {
      Footer: (ctx) => {
        const giftOptions = document.createElement('div');
        CartProvider.render(GiftOptions, {
          item: ctx.item,
          view: 'product',
          dataSource: 'order',
          isEditable: false,
          slots: {
            SwatchImage: swatchImageSlot,
          },
        })(giftOptions);
        ctx.appendChild(giftOptions);
      },
      CartSummaryItemImage: (ctx) => {
        const { data, defaultImageProps } = ctx;
        tryRenderAemAssetsImage(ctx, {
          alias: data.product.sku,
          imageProps: defaultImageProps,
          params: {
            width: defaultImageProps.width,
            height: defaultImageProps.height,
          },
        });
      },
    },
  })(container);
}

async function renderOrderGiftOptions(container) {
  return CartProvider.render(GiftOptions, {
    view: 'order',
    dataSource: 'order',
    isEditable: false,
    readOnlyFormOrderView: 'secondary',
    slots: {
      SwatchImage: swatchImageSlot,
    },
  })(container);
}

async function renderOrderConfirmationFooterButton(container) {
  return UI.render(Button, {
    children: 'Continue shopping',
    'data-testid': 'order-confirmation-footer__continue-button',
    className: 'order-confirmation-footer__continue-button',
    size: 'medium',
    variant: 'primary',
    type: 'submit',
    href: rootLink('/'),
  })(container);
}

function renderHeroKicker(container, orderData) {
  if (!orderData) return;

  const tracking = getPrimaryTracking(orderData);
  const label = tracking
    ? `Order confirmed · ${humanizeStatus(orderData.status)} · Tracking ready`
    : `Order confirmed · ${humanizeStatus(orderData.status)}`;

  container.textContent = label;
}

function renderHeroMetrics(container, orderData) {
  const metrics = getHeroMetrics(orderData);
  container.replaceChildren();

  if (!metrics.length) {
    container.hidden = true;
    return;
  }

  metrics.forEach((metric) => {
    const pill = document.createElement('article');
    pill.className = 'order-confirmation-metric';
    if (metric.isPositive) pill.classList.add('is-positive');
    if (metric.isAccent) pill.classList.add('is-accent');

    const label = document.createElement('p');
    label.className = 'order-confirmation-metric__label';
    label.textContent = metric.label;

    const value = document.createElement('p');
    value.className = 'order-confirmation-metric__value';
    value.textContent = metric.value;

    pill.append(label, value);
    container.append(pill);
  });

  container.hidden = false;
}

function renderHeroActions(container, orderData) {
  container.replaceChildren();

  const tracking = getPrimaryTracking(orderData);
  const actions = [
    {
      label: 'Continue shopping',
      href: rootLink('/'),
      variant: 'primary',
    },
    {
      label: 'Print receipt',
      onClick: () => window.print(),
      variant: 'secondary',
    },
  ];

  if (tracking) {
    actions.push({
      label: 'Track package',
      href: tracking.href,
      external: tracking.isExternal,
      variant: 'secondary',
    });
  }

  actions.forEach((action) => {
    const element = action.href ? document.createElement('a') : document.createElement('button');
    element.className = `order-confirmation-action order-confirmation-action--${action.variant}`;

    if (action.href) {
      element.href = action.href;
      if (action.external) {
        element.target = '_blank';
        element.rel = 'noreferrer';
      }
    } else {
      element.type = 'button';
      element.addEventListener('click', action.onClick);
    }

    element.textContent = action.label;
    container.append(element);
  });
}

function renderFulfillmentStrip(container, orderData) {
  const model = getFulfillmentModel(orderData);
  container.replaceChildren();

  if (!model) {
    container.hidden = true;
    return;
  }

  const timeline = document.createElement('ol');
  timeline.className = 'order-confirmation-fulfillment__steps';

  model.steps.forEach((step, index) => {
    const item = document.createElement('li');
    item.className = 'order-confirmation-fulfillment__step';
    if (index < model.currentIndex) item.classList.add('is-complete');
    if (index === model.currentIndex) item.classList.add('is-current');

    const dot = document.createElement('span');
    dot.className = 'order-confirmation-fulfillment__dot';
    dot.textContent = index < model.currentIndex ? '✓' : String(index + 1);

    const label = document.createElement('p');
    label.className = 'order-confirmation-fulfillment__step-label';
    label.textContent = step.label;

    const date = document.createElement('p');
    date.className = 'order-confirmation-fulfillment__step-date';
    date.textContent = step.date || 'Status will update here';

    item.append(dot, label, date);
    timeline.append(item);
  });

  container.innerHTML = `
    <div class="order-confirmation-fulfillment">
      <div class="order-confirmation-fulfillment__copy">
        <p class="order-confirmation-section__eyebrow">Fulfillment progress</p>
        <div class="order-confirmation-fulfillment__heading-row">
          <h2 class="order-confirmation-section__title">${model.title}</h2>
          <span class="order-confirmation-fulfillment__status">${model.status}</span>
        </div>
        <p class="order-confirmation-section__description">${model.detail}</p>
      </div>
    </div>
  `;

  container.querySelector('.order-confirmation-fulfillment').append(timeline);
  container.hidden = false;
}

async function renderRecommendations(
  container,
  titleNode,
  descriptionNode,
  listNode,
  orderData,
  labels,
) {
  container.hidden = true;
  listNode.replaceChildren();

  const seedItem = getRecommendationSeed(orderData);
  if (!seedItem || !getConsent('commerce-recommendations')) {
    return;
  }

  const currentSku = seedItem?.product?.sku || seedItem?.productSku;
  if (!currentSku) return;

  const storeViewCode = getConfigValue('headers.cs.Magento-Store-View-Code');
  const userViewHistory = getProductViewHistory(storeViewCode);
  const userPurchaseHistory = getPurchaseHistory(storeViewCode);

  try {
    const units = await getRecommendations({
      currentSku,
      pageType: 'Product',
      userViewHistory,
      userPurchaseHistory,
    });

    const recommendationUnit = units?.find((unit) => unit?.items?.length);
    if (!recommendationUnit?.items?.length) {
      return;
    }

    titleNode.textContent = recommendationUnit.title || 'Continue the mission';
    const seedName = seedItem?.product?.name
      || seedItem?.productName
      || 'your recent order';
    descriptionNode.textContent = `Recommendations inspired by ${seedName}, ready when you are.`;

    recommendationUnit.items.slice(0, 4).forEach((item, index) => {
      listNode.append(createRecommendationCard(item, recommendationUnit, index, labels));
    });

    container.hidden = listNode.children.length === 0;
  } catch (error) {
    console.warn('Unable to render checkout-success recommendations.', error);
  }
}

function renderMission(container) {
  container.innerHTML = createMissionMarkup();
}

async function renderCheckoutSuccessContent(container, { orderData } = {}) {
  events.on('authenticated', handleAuthenticated);
  window.scrollTo(0, 0);

  const orderConfirmationFragment = createOrderConfirmationFragment();
  const getOrderElement = createScopedSelector(orderConfirmationFragment);

  const $heroKicker = getOrderElement(selectors.orderConfirmation.heroKicker);
  const $orderConfirmationHeader = getOrderElement(selectors.orderConfirmation.header);
  const $heroMetrics = getOrderElement(selectors.orderConfirmation.heroMetrics);
  const $heroActions = getOrderElement(selectors.orderConfirmation.heroActions);
  const $fulfillment = getOrderElement(selectors.orderConfirmation.fulfillment);
  const $orderStatus = getOrderElement(selectors.orderConfirmation.orderStatus);
  const $shippingStatus = getOrderElement(selectors.orderConfirmation.shippingStatus);
  const $customerDetails = getOrderElement(selectors.orderConfirmation.customerDetails);
  const $orderCostSummary = getOrderElement(selectors.orderConfirmation.orderCostSummary);
  const $orderGiftOptions = getOrderElement(selectors.orderConfirmation.giftOptions);
  const $orderProductList = getOrderElement(selectors.orderConfirmation.orderProductList);
  const $recommendations = getOrderElement(selectors.orderConfirmation.recommendations);
  const $recommendationsTitle = getOrderElement(selectors.orderConfirmation.recommendationsTitle);
  const $recommendationsDescription = getOrderElement(
    selectors.orderConfirmation.recommendationsDescription,
  );
  const $recommendationsList = getOrderElement(selectors.orderConfirmation.recommendationsList);
  const $mission = getOrderElement(selectors.orderConfirmation.mission);
  const $orderConfirmationFooter = getOrderElement(selectors.orderConfirmation.footer);

  container.replaceChildren(orderConfirmationFragment);

  const labels = await fetchPlaceholders();
  const langDefinitions = { default: { ...labels } };
  const initOptions = orderData ? { langDefinitions, orderData } : { langDefinitions };
  await initializers.mountImmediately(orderApi.initialize, initOptions);

  const resolvedOrderData = orderData || events.lastPayload('order/data');

  await Promise.all([
    renderOrderHeader($orderConfirmationHeader, { orderData: resolvedOrderData }),
    renderOrderStatus($orderStatus),
    renderShippingStatus($shippingStatus),
    renderCustomerDetails($customerDetails),
    renderOrderCostSummary($orderCostSummary),
    renderOrderProductList($orderProductList),
    renderOrderGiftOptions($orderGiftOptions),
  ]);

  renderHeroKicker($heroKicker, resolvedOrderData);
  renderHeroMetrics($heroMetrics, resolvedOrderData);
  renderHeroActions($heroActions, resolvedOrderData);
  renderFulfillmentStrip($fulfillment, resolvedOrderData);
  renderMission($mission);
  await renderRecommendations(
    $recommendations,
    $recommendationsTitle,
    $recommendationsDescription,
    $recommendationsList,
    resolvedOrderData,
    labels,
  );

  $orderConfirmationFooter.innerHTML = createOrderConfirmationFooter(rootLink(SUPPORT_PATH));
  const $continueBtn = $orderConfirmationFooter.querySelector(
    selectors.orderConfirmation.continueButton,
  );
  await renderOrderConfirmationFooterButton($continueBtn);
}

export function preloadCheckoutSuccess() {
  return loadCSS(`${window.hlx.codeBasePath}/blocks/commerce-checkout-success/commerce-checkout-success.css`);
}

export async function renderCheckoutSuccess(container, { orderData } = {}) {
  return renderCheckoutSuccessContent(container, { orderData });
}

export default async function decorate(block) {
  await renderCheckoutSuccessContent(block);
}
