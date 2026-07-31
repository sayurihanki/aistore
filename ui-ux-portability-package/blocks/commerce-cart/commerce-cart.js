import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { events } from '@dropins/tools/event-bus.js';
import { render as provider } from '@dropins/storefront-cart/render.js';
import * as Cart from '@dropins/storefront-cart/api.js';
import {
  getRecommendations,
  publishRecsItemAddToCartClick,
} from '@dropins/storefront-recommendations/api.js';
import { h } from '@dropins/tools/preact.js';
import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Dropin Containers
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import OrderSummary from '@dropins/storefront-cart/containers/OrderSummary.js';
import EstimateShipping from '@dropins/storefront-cart/containers/EstimateShipping.js';
import Coupons from '@dropins/storefront-cart/containers/Coupons.js';
import GiftCards from '@dropins/storefront-cart/containers/GiftCards.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { render as quoteManagementRender } from '@dropins/storefront-quote-management/render.js';
import { RequestNegotiableQuoteForm } from '@dropins/storefront-quote-management/containers/RequestNegotiableQuoteForm.js';

// API
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';

// Modal and Mini PDP
import createMiniPDP from '../../scripts/components/commerce-mini-pdp/commerce-mini-pdp.js';
import createModal from '../modal/modal.js';

// Initializers
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';
import '../../scripts/initializers/quote-management.js';
import '../../scripts/initializers/recommendations.js';

import { readBlockConfig } from '../../scripts/aem.js';
import {
  fetchPlaceholders,
  rootLink,
  getProductLink,
  ACCEPTED_FILE_TYPES,
  getConsent,
} from '../../scripts/commerce.js';

function getPriceValue(price) {
  return typeof price?.value === 'number' ? price.value : null;
}

function sumModifierValues(modifiers = []) {
  const values = modifiers
    .map(({ amount }) => getPriceValue(amount))
    .filter((value) => typeof value === 'number');

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function formatMoney(value, currency = 'USD') {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getCartMetrics(cartData) {
  const currency = cartData?.total?.includingTax?.currency
    || cartData?.total?.excludingTax?.currency
    || cartData?.subtotal?.excludingTax?.currency
    || cartData?.subtotal?.includingTax?.currency
    || cartData?.shipping?.currency
    || cartData?.discount?.currency
    || 'USD';

  const rawDiscount = getPriceValue(cartData?.discount);
  const appliedDiscounts = sumModifierValues(cartData?.appliedDiscounts);
  const discount = Math.abs(rawDiscount ?? appliedDiscounts ?? 0);
  const rawTax = getPriceValue(cartData?.totalTax);
  const appliedTaxes = sumModifierValues(cartData?.appliedTaxes);
  const tax = rawTax ?? appliedTaxes;

  return {
    currency,
    discount,
    hasDiscount: discount > 0.009,
    itemCount: cartData?.totalQuantity ?? 0,
    shipping: getPriceValue(cartData?.shipping),
    subtotal: getPriceValue(cartData?.subtotal?.excludingTax)
      ?? getPriceValue(cartData?.subtotal?.includingTax),
    tax,
    total: getPriceValue(cartData?.total?.includingTax)
      ?? getPriceValue(cartData?.total?.excludingTax),
  };
}

function resolveFreeShippingThreshold() {
  const candidates = [
    window?.storeConfig?.freeShippingThreshold,
    window?.storeConfig?.free_shipping_threshold,
    window?.cartConfig?.freeShippingThreshold,
    document.documentElement.dataset.freeShippingThreshold,
    document.body.dataset.freeShippingThreshold,
  ];

  const threshold = candidates
    .map((candidate) => Number.parseFloat(candidate))
    .find((value) => Number.isFinite(value) && value > 0);

  return threshold ?? null;
}

function getProductViewHistory(storeViewCode) {
  try {
    const viewHistory = window.localStorage.getItem(`${storeViewCode}:productViewHistory`) || '[]';
    return JSON.parse(viewHistory);
  } catch (error) {
    window.localStorage.removeItem(`${storeViewCode}:productViewHistory`);
    console.error('Error parsing product view history', error);
    return [];
  }
}

function getPurchaseHistory(storeViewCode) {
  try {
    const purchaseHistory = window.localStorage.getItem(`${storeViewCode}:purchaseHistory`) || '[]';
    return JSON.parse(purchaseHistory);
  } catch (error) {
    window.localStorage.removeItem(`${storeViewCode}:purchaseHistory`);
    console.error('Error parsing purchase history', error);
    return [];
  }
}

function getCartSkus(cartData) {
  return (cartData?.items || [])
    .map((item) => item?.sku || item?.topLevelSku)
    .filter(Boolean);
}

function getRecommendationSeed(cartData) {
  return (cartData?.items || []).find((item) => item?.topLevelSku || item?.sku) || null;
}

function createRecommendationPrice(item) {
  const simplePrice = item?.price?.final?.amount;
  if (simplePrice?.value != null) {
    return formatMoney(simplePrice.value, simplePrice.currency);
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

function buildRecommendationLink(item) {
  return getProductLink(item?.urlKey, item?.sku);
}

function createRecommendationImage(item) {
  const link = document.createElement('a');
  link.className = 'cart__recommendation-media';
  link.href = buildRecommendationLink(item);
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
  placeholder.className = 'cart__recommendation-placeholder';
  placeholder.textContent = 'MCX';
  link.append(placeholder);

  return link;
}

function createRecommendationCard(item, recommendationUnit, index, labels) {
  const card = document.createElement('article');
  card.className = 'cart__recommendation-card';

  const media = document.createElement('div');
  media.className = 'cart__recommendation-media-wrap';
  media.append(createRecommendationImage(item));

  const wishlistSlot = document.createElement('div');
  wishlistSlot.className = 'cart__recommendation-wishlist';
  wishlistRender.render(WishlistToggle, { product: item })(wishlistSlot);
  media.append(wishlistSlot);
  card.append(media);

  const body = document.createElement('div');
  body.className = 'cart__recommendation-body';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'cart__recommendation-eyebrow';
  eyebrow.textContent = recommendationUnit?.title || 'Recommended for you';

  const title = document.createElement('a');
  title.className = 'cart__recommendation-title';
  title.href = buildRecommendationLink(item);
  title.textContent = item.name || item.sku;

  const price = document.createElement('p');
  price.className = 'cart__recommendation-price';
  price.textContent = createRecommendationPrice(item) || 'View pricing';

  const footer = document.createElement('div');
  footer.className = 'cart__recommendation-actions';

  const ctaSlot = document.createElement('div');
  ctaSlot.className = 'cart__recommendation-cta';

  if (item.itemType === 'SimpleProductView') {
    UI.render(Button, {
      children: labels?.Global?.AddProductToCart || 'Add to cart',
      onClick: (event) => {
        Cart.addProductsToCart([{ sku: item.sku, quantity: 1 }]);
        event.stopPropagation();
        publishRecsItemAddToCartClick({
          recommendationUnit,
          pagePlacement: 'cart',
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
      href: buildRecommendationLink(item),
      variant: 'secondary',
    })(ctaSlot);
  }

  footer.append(ctaSlot);
  body.append(eyebrow, title, price, footer);
  card.append(body);

  return card;
}

export default async function decorate(block) {
  const {
    'hide-heading': hideHeading = 'false',
    'max-items': maxItems,
    'hide-attributes': hideAttributes = '',
    'enable-item-quantity-update': enableUpdateItemQuantity = 'false',
    'enable-item-remove': enableRemoveItem = 'true',
    'enable-estimate-shipping': enableEstimateShipping = 'false',
    'start-shopping-url': startShoppingURL = '',
    'checkout-url': checkoutURL = '',
    'enable-updating-product': enableUpdatingProduct = 'false',
    'undo-remove-item': undo = 'false',
  } = readBlockConfig(block);

  const placeholders = await fetchPlaceholders();
  const checkoutHref = checkoutURL ? rootLink(checkoutURL) : rootLink('/checkout');
  const continueShoppingHref = startShoppingURL ? rootLink(startShoppingURL) : rootLink('/');
  const freeShippingThreshold = resolveFreeShippingThreshold();

  const cachedCart = Cart.getCartDataFromCache();

  let minimumTotalForQuoteRequest = 0;
  let minimumTotalForQuoteRequestMessage = placeholders?.NegotiableQuote?.Request?.Button?.insufficientTotalMessage || '';

  let currentModal = null;
  let currentNotification = null;
  let recommendationKey = '';
  let recommendationRequestKey = '';

  const fragment = document.createRange().createContextualFragment(`
    <section class="cart__progress" hidden>
      <div class="cart__progress-inner">
        <div class="cart__progress-brand">
          <span class="cart__progress-brand-mark">MCX</span>
          <span class="cart__progress-brand-copy">Marine Corps Exchange</span>
        </div>
        <ol class="cart__progress-steps" aria-label="Checkout progress">
          <li class="cart__progress-step is-complete">
            <span class="cart__progress-step-icon">1</span>
            <span class="cart__progress-step-copy">
              <span class="cart__progress-step-label">Shopping</span>
              <span class="cart__progress-step-meta">Complete</span>
            </span>
          </li>
          <li class="cart__progress-step is-current">
            <span class="cart__progress-step-icon">2</span>
            <span class="cart__progress-step-copy">
              <span class="cart__progress-step-label">Cart Review</span>
              <span class="cart__progress-step-meta">Current</span>
            </span>
          </li>
          <li class="cart__progress-step">
            <span class="cart__progress-step-icon">3</span>
            <span class="cart__progress-step-copy">
              <span class="cart__progress-step-label">Checkout</span>
              <span class="cart__progress-step-meta">Next</span>
            </span>
          </li>
          <li class="cart__progress-step">
            <span class="cart__progress-step-icon">4</span>
            <span class="cart__progress-step-copy">
              <span class="cart__progress-step-label">Confirmation</span>
              <span class="cart__progress-step-meta">Receipt</span>
            </span>
          </li>
        </ol>
        <div class="cart__progress-security">
          <span class="cart__progress-security-label">Secure checkout</span>
          <span class="cart__progress-security-copy">256-bit encrypted session</span>
        </div>
      </div>
    </section>

    <div class="cart__utility" hidden>
      <div class="cart__savings-banner" hidden>
        <div class="cart__savings-icon" aria-hidden="true"></div>
        <div class="cart__savings-copy">
          <p class="cart__savings-heading">Current savings locked in</p>
          <p class="cart__savings-body"></p>
        </div>
        <p class="cart__savings-amount"></p>
      </div>

      <div class="cart__shipping-progress" hidden>
        <div class="cart__shipping-progress-copy">
          <p class="cart__shipping-progress-label">Free shipping progress</p>
          <p class="cart__shipping-progress-body"></p>
        </div>
        <div class="cart__shipping-progress-rail" aria-hidden="true">
          <span class="cart__shipping-progress-fill"></span>
        </div>
      </div>
    </div>

    <section class="cart__journey" hidden>
      <div class="cart__journey-copy">
        <span class="cart__journey-eyebrow">Cart review</span>
        <h1 class="cart__journey-title">Build the final <span>loadout</span></h1>
        <p class="cart__journey-body"></p>
      </div>
      <div class="cart__journey-panel">
        <div class="cart__journey-stats">
          <article class="cart__journey-stat">
            <p class="cart__journey-stat-label">Items ready</p>
            <p class="cart__journey-stat-value" data-cart-metric="items">0</p>
          </article>
          <article class="cart__journey-stat">
            <p class="cart__journey-stat-label">Merchandise</p>
            <p class="cart__journey-stat-value" data-cart-metric="subtotal">--</p>
          </article>
          <article class="cart__journey-stat">
            <p class="cart__journey-stat-label" data-cart-tertiary-label>Order status</p>
            <p class="cart__journey-stat-value" data-cart-metric="tertiary">Live</p>
          </article>
        </div>
        <div class="cart__journey-actions">
          <a class="cart__journey-link" href="${checkoutHref}">Proceed to checkout</a>
          <a class="cart__journey-secondary" href="${continueShoppingHref}">Continue shopping</a>
        </div>
      </div>
    </section>

    <div class="cart__notification"></div>

    <div class="cart__wrapper">
      <div class="cart__left-column">
        <div class="cart__list"></div>
      </div>
      <div class="cart__right-column">
        <div class="cart__order-summary"></div>
        <div class="cart__gift-options"></div>
        <div class="cart__trust-panel">
          <article class="cart__trust-item">
            <p class="cart__trust-kicker">Security</p>
            <p class="cart__trust-title">Encrypted checkout</p>
            <p class="cart__trust-copy">Live Adobe Commerce handoff</p>
          </article>
          <article class="cart__trust-item">
            <p class="cart__trust-kicker">Cart</p>
            <p class="cart__trust-title">Live pricing</p>
            <p class="cart__trust-copy">Totals update from cart data</p>
          </article>
          <article class="cart__trust-item">
            <p class="cart__trust-kicker">Tools</p>
            <p class="cart__trust-title">Wishlist ready</p>
            <p class="cart__trust-copy">Save items without leaving cart</p>
          </article>
          <article class="cart__trust-item">
            <p class="cart__trust-kicker">Options</p>
            <p class="cart__trust-title">Gift support</p>
            <p class="cart__trust-copy">Product and order gift options</p>
          </article>
        </div>
      </div>
    </div>

    <section class="cart__recommendations" hidden>
      <div class="cart__recommendations-header">
        <p class="cart__recommendations-eyebrow">Frequently bought together</p>
        <h2 class="cart__recommendations-title">Complete your kit</h2>
        <p class="cart__recommendations-description">
          We will surface live recommendations from your current cart mix.
        </p>
      </div>
      <div class="cart__recommendations-list"></div>
    </section>

    <div class="cart__empty-cart" hidden></div>
  `);

  const $progress = fragment.querySelector('.cart__progress');
  const $utility = fragment.querySelector('.cart__utility');
  const $savingsBanner = fragment.querySelector('.cart__savings-banner');
  const $savingsBody = fragment.querySelector('.cart__savings-body');
  const $savingsAmount = fragment.querySelector('.cart__savings-amount');
  const $shippingProgress = fragment.querySelector('.cart__shipping-progress');
  const $shippingProgressBody = fragment.querySelector('.cart__shipping-progress-body');
  const $shippingProgressFill = fragment.querySelector('.cart__shipping-progress-fill');
  const $journey = fragment.querySelector('.cart__journey');
  const $journeyBody = fragment.querySelector('.cart__journey-body');
  const $journeyPrimaryLink = fragment.querySelector('.cart__journey-link');
  const $journeyItems = fragment.querySelector('[data-cart-metric="items"]');
  const $journeySubtotal = fragment.querySelector('[data-cart-metric="subtotal"]');
  const $journeyTertiary = fragment.querySelector('[data-cart-metric="tertiary"]');
  const $journeyTertiaryLabel = fragment.querySelector('[data-cart-tertiary-label]');
  const $notification = fragment.querySelector('.cart__notification');
  const $wrapper = fragment.querySelector('.cart__wrapper');
  const $list = fragment.querySelector('.cart__list');
  const $summary = fragment.querySelector('.cart__order-summary');
  const $emptyCart = fragment.querySelector('.cart__empty-cart');
  const $giftOptions = fragment.querySelector('.cart__gift-options');
  const $rightColumn = fragment.querySelector('.cart__right-column');
  const $recommendations = fragment.querySelector('.cart__recommendations');
  const $recommendationsTitle = fragment.querySelector('.cart__recommendations-title');
  const $recommendationsDescription = fragment.querySelector('.cart__recommendations-description');
  const $recommendationsList = fragment.querySelector('.cart__recommendations-list');

  block.innerHTML = '';
  block.appendChild(fragment);

  const routeToWishlist = '/wishlist';

  function syncUtilityVisibility() {
    $utility.hidden = $savingsBanner.hidden && $shippingProgress.hidden;
  }

  function resetRecommendations() {
    recommendationKey = '';
    recommendationRequestKey = '';
    $recommendations.hidden = true;
    $recommendationsList.replaceChildren();
    $recommendationsTitle.textContent = 'Complete your kit';
    $recommendationsDescription.textContent = 'We will surface live recommendations from your current cart mix.';
  }

  function toggleEmptyCart(cartState) {
    const isEmpty = isCartEmpty(cartState);

    $wrapper.hidden = false;
    $emptyCart.hidden = true;
    $progress.hidden = isEmpty;
    $journey.hidden = isEmpty;
    $rightColumn.style.display = isEmpty ? 'none' : '';
    $giftOptions.style.display = isEmpty ? 'none' : '';

    if (isEmpty) {
      $savingsBanner.hidden = true;
      $shippingProgress.hidden = true;
      syncUtilityVisibility();
      resetRecommendations();
    }
  }

  function updateJourney(metrics) {
    const itemLabel = `${metrics.itemCount} ${metrics.itemCount === 1 ? 'item' : 'items'}`;
    const subtotalText = formatMoney(metrics.subtotal, metrics.currency) || '--';
    const totalText = formatMoney(metrics.total, metrics.currency);

    $journeyItems.textContent = itemLabel;
    $journeySubtotal.textContent = subtotalText;

    if (metrics.hasDiscount) {
      $journeyTertiaryLabel.textContent = 'Savings locked';
      $journeyTertiary.textContent = formatMoney(metrics.discount, metrics.currency) || 'Live';
    } else if (typeof metrics.shipping === 'number') {
      $journeyTertiaryLabel.textContent = 'Shipping';
      $journeyTertiary.textContent = formatMoney(metrics.shipping, metrics.currency) || 'TBD';
    } else if (typeof metrics.tax === 'number') {
      $journeyTertiaryLabel.textContent = 'Tax';
      $journeyTertiary.textContent = formatMoney(metrics.tax, metrics.currency) || 'TBD';
    } else {
      $journeyTertiaryLabel.textContent = 'Cart status';
      $journeyTertiary.textContent = 'Live';
    }

    const bodyParts = [
      `${itemLabel} mission-ready in your cart.`,
      metrics.subtotal != null ? `${subtotalText} in merchandise before checkout.` : '',
      metrics.hasDiscount ? `${formatMoney(metrics.discount, metrics.currency)} currently discounted.` : '',
    ].filter(Boolean);

    $journeyBody.textContent = bodyParts.join(' ');
    $journeyPrimaryLink.textContent = totalText
      ? `Proceed to checkout · ${totalText}`
      : 'Proceed to checkout';
  }

  function updateSavingsBanner(metrics) {
    if (!metrics.hasDiscount) {
      $savingsBanner.hidden = true;
      syncUtilityVisibility();
      return;
    }

    const detailParts = [
      'Discounts are already applied to this cart.',
      typeof metrics.tax === 'number'
        ? `Current tax total: ${formatMoney(metrics.tax, metrics.currency) || '--'}.`
        : '',
      typeof metrics.shipping === 'number'
        ? `Shipping: ${formatMoney(metrics.shipping, metrics.currency) || '--'}.`
        : '',
    ].filter(Boolean);

    $savingsAmount.textContent = formatMoney(metrics.discount, metrics.currency) || '';
    $savingsBody.textContent = detailParts.join(' ');
    $savingsBanner.hidden = false;
    syncUtilityVisibility();
  }

  function updateShippingProgress(metrics) {
    const hasThreshold = Number.isFinite(freeShippingThreshold)
      && freeShippingThreshold > 0
      && metrics.subtotal != null;

    if (!hasThreshold) {
      $shippingProgress.hidden = true;
      syncUtilityVisibility();
      return;
    }

    const progress = Math.min((metrics.subtotal / freeShippingThreshold) * 100, 100);
    const remaining = Math.max(freeShippingThreshold - metrics.subtotal, 0);
    const thresholdText = formatMoney(freeShippingThreshold, metrics.currency) || '';

    if (remaining > 0) {
      $shippingProgressBody.textContent = `${formatMoney(remaining, metrics.currency)} away from a ${thresholdText} free-shipping threshold.`;
    } else {
      $shippingProgressBody.textContent = `Free-shipping threshold unlocked at ${thresholdText}.`;
    }

    $shippingProgressFill.style.width = `${progress}%`;
    $shippingProgress.hidden = false;
    syncUtilityVisibility();
  }

  async function renderRecommendationsForCart(cartData) {
    const seedItem = getRecommendationSeed(cartData);
    const currentSku = seedItem?.topLevelSku || seedItem?.sku;
    const cartSkus = getCartSkus(cartData);

    let consentGranted = false;
    try {
      consentGranted = getConsent('commerce-recommendations');
    } catch (error) {
      consentGranted = false;
    }

    if (!seedItem || !currentSku || !consentGranted) {
      resetRecommendations();
      return;
    }

    const nextKey = `${currentSku}:${cartSkus.join(',')}`;
    if (recommendationKey === nextKey && $recommendationsList.children.length) {
      $recommendations.hidden = false;
      return;
    }

    recommendationRequestKey = nextKey;
    $recommendations.hidden = true;
    $recommendationsList.replaceChildren();

    const storeViewCode = getConfigValue('headers.cs.Magento-Store-View-Code');
    const userViewHistory = getProductViewHistory(storeViewCode);
    const userPurchaseHistory = getPurchaseHistory(storeViewCode);

    try {
      const units = await getRecommendations({
        currentSku,
        pageType: 'Product',
        cartSkus,
        userViewHistory,
        userPurchaseHistory,
      });

      if (recommendationRequestKey !== nextKey) {
        return;
      }

      const recommendationUnit = units?.find((unit) => unit?.items?.length);
      if (!recommendationUnit?.items?.length) {
        resetRecommendations();
        return;
      }

      $recommendationsTitle.textContent = recommendationUnit.title || 'Complete your kit';
      $recommendationsDescription.textContent = `Recommended from ${seedItem.name || 'your current cart'}, `
        + 'ready for checkout when you are.';

      recommendationUnit.items.slice(0, 4).forEach((item, index) => {
        $recommendationsList.append(
          createRecommendationCard(item, recommendationUnit, index, placeholders),
        );
      });

      recommendationKey = nextKey;
      $recommendations.hidden = $recommendationsList.children.length === 0;
    } catch (error) {
      if (recommendationRequestKey === nextKey) {
        resetRecommendations();
      }

      console.warn('Unable to render cart recommendations.', error);
    }
  }

  async function handleEditButtonClick(cartItem) {
    try {
      const miniPDPContent = await createMiniPDP(
        cartItem,
        async () => {
          const productName = cartItem.name
            || cartItem.product?.name
            || placeholders?.Global?.CartUpdatedProductName;
          const message = placeholders?.Global?.CartUpdatedProductMessage?.replace(
            '{product}',
            productName,
          );

          currentNotification?.remove();

          currentNotification = await UI.render(InLineAlert, {
            heading: message,
            type: 'success',
            variant: 'primary',
            icon: h(Icon, { source: 'CheckWithCircle' }),
            'aria-live': 'assertive',
            role: 'alert',
            onDismiss: () => {
              currentNotification?.remove();
            },
          })($notification);

          setTimeout(() => {
            currentNotification?.remove();
          }, 5000);
        },
        () => {
          if (currentModal) {
            currentModal.removeModal();
            currentModal = null;
          }
        },
      );

      currentModal = await createModal([miniPDPContent]);

      if (currentModal.block) {
        currentModal.block.setAttribute('id', 'mini-pdp-modal');
      }

      currentModal.showModal();
    } catch (error) {
      console.error('Error opening mini PDP modal:', error);
      currentNotification?.remove();

      currentNotification = await UI.render(InLineAlert, {
        heading: placeholders?.Global?.ProductLoadError,
        type: 'error',
        variant: 'primary',
        icon: h(Icon, { source: 'AlertWithCircle' }),
        'aria-live': 'assertive',
        role: 'alert',
        onDismiss: () => {
          currentNotification?.remove();
        },
      })($notification);
    }
  }

  async function handleRequestQuoteButtonClick(cartId) {
    if (!cartId) {
      return;
    }

    const content = document.createElement('div');
    content.classList.add('cart__request-quote-content');

    quoteManagementRender.render(RequestNegotiableQuoteForm, {
      cartId,
      acceptedFileTypes: ACCEPTED_FILE_TYPES,
    })(content);

    currentModal = await createModal([content]);
    const modalDialog = currentModal.block.querySelector('dialog');
    modalDialog.classList.add('cart__request-quote-modal-dialog');
    modalDialog.id = 'cart-request-quote-modal-dialog';
    currentModal.showModal();
  }

  const renderRequestQuoteButton = (element) => {
    element.innerHTML = '';

    const { dataset: { cartId, canRequestQuote, cartSubtotal } } = element;
    const minimumTotalNumberForQuoteRequest = parseInt(minimumTotalForQuoteRequest, 10) || 0;

    if (!canRequestQuote) {
      element.setAttribute('hidden', '');
      return;
    }

    element.removeAttribute('hidden');

    const parsedCartSubtotal = parseFloat(cartSubtotal) || 0;
    const isInsufficientTotal = parsedCartSubtotal < minimumTotalNumberForQuoteRequest;
    const isDisabled = !cartId || isInsufficientTotal;
    const message = minimumTotalForQuoteRequestMessage.replace('{count}', minimumTotalNumberForQuoteRequest);

    element.setAttribute('title', isDisabled ? message : '');

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('cart__request-quote-button-wrapper');

    UI.render(Button, {
      children: placeholders?.NegotiableQuote?.Request?.Button.label || 'Request Quote',
      variant: 'secondary',
      size: 'medium',
      onClick: () => {
        handleRequestQuoteButtonClick(cartId);
      },
      disabled: isDisabled,
      className: 'cart__request-quote-button',
    })(buttonWrapper);
    element.appendChild(buttonWrapper);

    if (isInsufficientTotal) {
      const messageWrapper = document.createElement('div');
      messageWrapper.classList.add('cart__request-quote-message-wrapper');

      const quoteRequestMessage = document.createElement('span');
      quoteRequestMessage.classList.add('cart__request-quote-message');
      quoteRequestMessage.textContent = message;
      messageWrapper.appendChild(quoteRequestMessage);
      element.appendChild(messageWrapper);
    }
  };

  const requestQuoteContainer = document.createElement('div');
  requestQuoteContainer.setAttribute('data-cart-id', cachedCart?.id);
  requestQuoteContainer.setAttribute('hidden', '');
  renderRequestQuoteButton(requestQuoteContainer);

  const createCartProductLink = (product) => (
    getProductLink(product.url.urlKey, product.topLevelSku)
  );

  await Promise.all([
    provider.render(CartSummaryList, {
      hideHeading: hideHeading === 'true',
      routeProduct: createCartProductLink,
      routeEmptyCartCTA: startShoppingURL ? () => rootLink(startShoppingURL) : undefined,
      maxItems: parseInt(maxItems, 10) || undefined,
      attributesToHide: hideAttributes
        .split(',')
        .map((attr) => attr.trim().toLowerCase()),
      enableUpdateItemQuantity: enableUpdateItemQuantity === 'true',
      enableRemoveItem: enableRemoveItem === 'true',
      undo: undo === 'true',
      slots: {
        Thumbnail: (ctx) => {
          const { item, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = createCartProductLink(item);

          tryRenderAemAssetsImage(ctx, {
            alias: item.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },

        Footer: (ctx) => {
          if (ctx.item?.itemType === 'ConfigurableCartItem' && enableUpdatingProduct === 'true') {
            const editLink = document.createElement('div');
            editLink.className = 'cart-item-edit-link';

            UI.render(Button, {
              children: placeholders?.Global?.CartEditButton,
              variant: 'tertiary',
              size: 'medium',
              icon: h(Icon, { source: 'Edit' }),
              onClick: () => handleEditButtonClick(ctx.item),
            })(editLink);

            ctx.appendChild(editLink);
          }

          const $wishlistToggle = document.createElement('div');
          $wishlistToggle.classList.add('cart__action--wishlist-toggle');

          wishlistRender.render(WishlistToggle, {
            product: ctx.item,
            size: 'medium',
            labelToWishlist: placeholders?.Global?.CartMoveToWishlist,
            labelWishlisted: placeholders?.Global?.CartRemoveFromWishlist,
            removeProdFromCart: Cart.updateProductsFromCart,
          })($wishlistToggle);

          ctx.appendChild($wishlistToggle);

          const giftOptions = document.createElement('div');

          provider.render(GiftOptions, {
            item: ctx.item,
            view: 'product',
            dataSource: 'cart',
            handleItemsLoading: ctx.handleItemsLoading,
            handleItemsError: ctx.handleItemsError,
            onItemUpdate: ctx.onItemUpdate,
            slots: {
              SwatchImage: swatchImageSlot,
            },
          })(giftOptions);

          ctx.appendChild(giftOptions);
        },
      },
    })($list),

    provider.render(OrderSummary, {
      routeProduct: createCartProductLink,
      routeCheckout: checkoutURL ? () => rootLink(checkoutURL) : undefined,
      slots: {
        EstimateShipping: async (ctx) => {
          if (enableEstimateShipping === 'true') {
            const wrapper = document.createElement('div');
            await provider.render(EstimateShipping, {})(wrapper);
            ctx.replaceWith(wrapper);
          }
        },
        Coupons: (ctx) => {
          const coupons = document.createElement('div');
          provider.render(Coupons)(coupons);
          ctx.appendChild(coupons);
          ctx.prependSibling(requestQuoteContainer);
        },
        GiftCards: (ctx) => {
          const giftCards = document.createElement('div');
          provider.render(GiftCards)(giftCards);
          ctx.appendChild(giftCards);
        },
      },
    })($summary),

    provider.render(GiftOptions, {
      view: 'order',
      dataSource: 'cart',
      slots: {
        SwatchImage: swatchImageSlot,
      },
    })($giftOptions),
  ]);

  toggleEmptyCart(cachedCart);

  let cartViewEventPublished = false;

  events.on(
    'cart/data',
    (cartData) => {
      const cartSubtotal = cartData?.subtotal?.excludingTax?.value || 0;
      const metrics = getCartMetrics(cartData);
      const isEmpty = isCartEmpty(cartData);

      requestQuoteContainer.dataset.cartSubtotal = cartSubtotal;
      requestQuoteContainer.dataset.cartId = cartData?.id;
      renderRequestQuoteButton(requestQuoteContainer);

      toggleEmptyCart(cartData);

      if (!isEmpty) {
        $progress.hidden = false;
        $journey.hidden = false;
        updateJourney(metrics);
        updateSavingsBanner(metrics);
        updateShippingProgress(metrics);
        renderRecommendationsForCart(cartData);
      }

      if (!cartViewEventPublished) {
        cartViewEventPublished = true;
        publishShoppingCartViewEvent();
      }
    },
    { eager: true },
  );

  events.on('quote-management/initialized', (state) => {
    minimumTotalForQuoteRequest = state?.config?.quoteMinimumAmount || 0;
    minimumTotalForQuoteRequestMessage = state?.config?.quoteMinimumAmountMessage || '';
    renderRequestQuoteButton(requestQuoteContainer);
  }, { eager: true });

  events.on('quote-management/permissions', (permissions) => {
    if (permissions?.requestQuote) {
      requestQuoteContainer.dataset.canRequestQuote = true;
    } else {
      requestQuoteContainer.removeAttribute('data-can-request-quote');
    }

    renderRequestQuoteButton(requestQuoteContainer);
  }, { eager: true });

  events.on('quote-management/negotiable-quote-requested', () => {
    Cart.refreshCart();

    setTimeout(() => {
      currentModal?.removeModal();
      currentModal = null;
    }, 3000);
  });

  events.on('wishlist/alert', ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($notification);

    setTimeout(() => {
      $notification.innerHTML = '';
    }, 5000);
  });

  return Promise.resolve();
}

function isCartEmpty(cart) {
  return cart ? cart.totalQuantity < 1 : true;
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
