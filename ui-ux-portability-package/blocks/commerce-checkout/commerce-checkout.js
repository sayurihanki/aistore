/* eslint-disable import/no-unresolved */

// Dropin Tools
import { events } from '@dropins/tools/event-bus.js';
import { initReCaptcha } from '@dropins/tools/recaptcha.js';

// Order Dropin Modules
import * as orderApi from '@dropins/storefront-order/api.js';

// Checkout Dropin Libraries
import {
  createScopedSelector,
  isVirtualCart,
  setMetaTags,
  validateForms,
} from '@dropins/storefront-checkout/lib/utils.js';

// Payment Services Dropin
import { PaymentMethodCode } from '@dropins/storefront-payment-services/api.js';

// Block Utilities
import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { buildOrderDetailsUrl, displayOverlaySpinner, removeOverlaySpinner } from './utils.js';

// Fragment functions
import { createCheckoutFragment, selectors } from './fragments.js';

// Container functions
import {
  renderAddressForm,
  renderBillingAddressFormSkeleton,
  renderBillToShippingAddress,
  renderCartSummaryList,
  renderCheckoutHeader,
  renderCustomerBillingAddresses,
  renderCustomerShippingAddresses,
  renderGiftOptions,
  renderLoginForm,
  renderMergedCartBanner,
  renderOrderSummary,
  renderOutOfStock,
  renderPaymentMethods,
  renderPlaceOrder,
  renderServerError,
  renderShippingAddressFormSkeleton,
  renderShippingMethods,
  renderTermsAndConditions,
} from './containers.js';

// Constants
import {
  BILLING_ADDRESS_DATA_KEY,
  BILLING_FORM_NAME,
  LOGIN_FORM_NAME,
  PURCHASE_ORDER_FORM_NAME,
  SHIPPING_ADDRESS_DATA_KEY,
  SHIPPING_FORM_NAME,
  TERMS_AND_CONDITIONS_FORM_NAME,
} from './constants.js';
import { rootLink, CUSTOMER_PO_DETAILS_PATH } from '../../scripts/commerce.js';

// Initializers
import '../../scripts/initializers/account.js';
import '../../scripts/initializers/checkout.js';
import '../../scripts/initializers/order.js';
import '../../scripts/initializers/payment-services.js';

// Checkout success block import and CSS preload
import { renderCheckoutSuccess, preloadCheckoutSuccess } from '../commerce-checkout-success/commerce-checkout-success.js';

preloadCheckoutSuccess();

const STAGE_ORDER = ['shipping', 'payment', 'review'];

const STEP_COPY = Object.freeze({
  shipping: {
    eyebrow: 'Step 1 of 3',
    title: 'Set Your <span>Drop Point</span>',
    copy: 'Confirm the delivery route for this order. APO and FPO support, tax-free pricing, and the real Commerce checkout stay intact.',
  },
  contact: {
    eyebrow: 'Step 1 of 3',
    title: 'Confirm Your <span>Contact</span>',
    copy: 'Virtual carts skip delivery, so we only need your contact and billing details before payment.',
  },
  payment: {
    eyebrow: 'Step 2 of 3',
    title: 'Lock In <span>Payment</span>',
    copy: 'Use the live MCX payment services flow with a tighter layout, clearer hierarchy, and a cleaner decision path.',
  },
  review: {
    eyebrow: 'Step 3 of 3',
    title: 'Final <span>Review</span>',
    copy: 'Inspect the mission summary one more time, accept the terms, and send the order through.',
  },
});

function redirectToCartIfEmpty(cartData) {
  const isOrderPlaced = events.lastPayload('order/placed') !== undefined;

  if (!isOrderPlaced && (cartData === null || cartData?.items?.length === 0)) {
    window.location.href = rootLink('/cart');
  }
}

function formatCurrency(amount) {
  if (!amount || typeof amount.value !== 'number') {
    return 'Pending';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: amount.currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount.value);
}

function hasAddress(address) {
  if (!address) return false;

  const street = Array.isArray(address.street) ? address.street.filter(Boolean) : [];

  return Boolean(
    street.length
    || address.id
    || address.uid
    || address.customerAddressUid
    || address.firstName
    || address.lastName
    || address.postCode,
  );
}

function getRegionLabel(region) {
  if (!region) return '';
  return region.name || region.label || region.code || '';
}

function getCountryLabel(country) {
  if (!country) return '';
  return country.label || country.name || country.code || '';
}

function getDisplayName(address) {
  if (!address) return '';

  const fullName = [address.firstName, address.lastName].filter(Boolean).join(' ').trim();
  return fullName;
}

function getAddressLines(address) {
  if (!address) return [];

  const street = Array.isArray(address.street) ? address.street.filter(Boolean) : [];
  const locality = [
    address.city,
    getRegionLabel(address.region),
    address.postCode,
  ].filter(Boolean).join(', ');
  const country = getCountryLabel(address.country);

  return [...street, locality, country].filter(Boolean);
}

function getCheckoutValues() {
  return events.lastPayload('checkout/values') || {};
}

function getPrimaryShippingAddress(checkoutData) {
  return checkoutData?.shippingAddresses?.[0] || null;
}

function getSelectedShippingMethod(checkoutData) {
  return getCheckoutValues().selectedShippingMethod
    || getPrimaryShippingAddress(checkoutData)?.selectedShippingMethod
    || null;
}

function getSelectedPaymentMethod(checkoutData) {
  return getCheckoutValues().selectedPaymentMethod
    || checkoutData?.selectedPaymentMethod
    || null;
}

function getCompletionState(checkoutData) {
  if (!checkoutData) {
    return {
      shipping: false,
      payment: false,
    };
  }

  const values = getCheckoutValues();
  const shippingAddress = getPrimaryShippingAddress(checkoutData);
  const shippingComplete = checkoutData.isVirtual
    ? (!checkoutData.isGuest || Boolean(checkoutData.email))
    : (
      (!checkoutData.isGuest || Boolean(checkoutData.email))
      && hasAddress(shippingAddress)
      && Boolean(getSelectedShippingMethod(checkoutData))
    );

  const isBillToShipping = checkoutData.isVirtual ? false : values.isBillToShipping === true;
  const paymentComplete = Boolean(getSelectedPaymentMethod(checkoutData))
    && (isBillToShipping || hasAddress(checkoutData.billingAddress));

  return {
    shipping: shippingComplete,
    payment: paymentComplete,
  };
}

function getRecommendedStage(checkoutData) {
  const completionState = getCompletionState(checkoutData);

  if (!completionState.shipping) {
    return 'shipping';
  }

  if (!completionState.payment) {
    return 'payment';
  }

  return 'review';
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function createReviewCard({
  eyebrow,
  title,
  lines = [],
  meta,
  buttonLabel,
  onEdit,
}) {
  const card = createElement('article', 'checkout-review-card');
  const header = createElement('div', 'checkout-review-card__header');
  const eyebrowElement = createElement('div', 'checkout-review-card__eyebrow', eyebrow);
  const titleElement = createElement('h3', 'checkout-review-card__title', title);

  header.append(eyebrowElement, titleElement);

  if (buttonLabel && typeof onEdit === 'function') {
    const button = createElement('button', 'checkout-review-card__edit', buttonLabel);
    button.type = 'button';
    button.addEventListener('click', onEdit);
    header.append(button);
  }

  card.append(header);

  const body = createElement('div', 'checkout-review-card__body');
  lines.filter(Boolean).forEach((line) => {
    body.append(createElement('p', 'checkout-review-card__line', line));
  });

  if (!body.children.length) {
    body.append(createElement('p', 'checkout-review-card__line checkout-review-card__line--muted', 'Still waiting on this step.'));
  }

  card.append(body);

  if (meta) {
    card.append(createElement('p', 'checkout-review-card__meta', meta));
  }

  return card;
}

function renderReviewSummary(container, checkoutData, cartData, onEditStage) {
  container.replaceChildren();

  const summaryGrid = createElement('div', 'checkout-review-grid');
  const shippingAddress = getPrimaryShippingAddress(checkoutData);
  const selectedShippingMethod = getSelectedShippingMethod(checkoutData);
  const selectedPaymentMethod = getSelectedPaymentMethod(checkoutData);
  const isVirtual = Boolean(checkoutData?.isVirtual);

  const shippingLines = isVirtual
    ? [
      checkoutData?.email || 'Guest email still pending',
      ...(
        hasAddress(checkoutData?.billingAddress)
          ? getAddressLines(checkoutData.billingAddress).slice(0, 2)
          : []
      ),
    ]
    : [
      getDisplayName(shippingAddress),
      ...getAddressLines(shippingAddress).slice(0, 3),
    ];

  let shippingMeta = 'Select a shipping method to lock this in.';
  if (isVirtual) {
    shippingMeta = 'Virtual order · no delivery step required';
  } else if (selectedShippingMethod) {
    shippingMeta = `${selectedShippingMethod.carrier?.title || 'Delivery'} · ${selectedShippingMethod.title || 'Method selected'}`;
  }

  const shippingTitle = isVirtual
    ? 'Guest contact and billing route'
    : (getDisplayName(shippingAddress) || 'Shipping details pending');

  summaryGrid.append(
    createReviewCard({
      eyebrow: isVirtual ? 'Contact' : 'Shipping',
      title: shippingTitle,
      lines: shippingLines,
      meta: shippingMeta,
      buttonLabel: isVirtual ? 'Edit contact' : 'Edit shipping',
      onEdit: () => onEditStage('shipping'),
    }),
  );

  const paymentLines = [];
  if (selectedPaymentMethod?.title) {
    paymentLines.push(selectedPaymentMethod.title);
  } else if (selectedPaymentMethod?.code) {
    paymentLines.push(selectedPaymentMethod.code);
  }

  if (hasAddress(checkoutData?.billingAddress)) {
    paymentLines.push(...getAddressLines(checkoutData.billingAddress).slice(0, 2));
  }

  const isBillToShipping = !isVirtual && getCheckoutValues().isBillToShipping === true;
  let paymentMeta = 'Choose how you want to pay.';
  if (isBillToShipping) {
    paymentMeta = 'Billing matches shipping address';
  } else if (selectedPaymentMethod) {
    paymentMeta = 'Ready for order authorization';
  }

  summaryGrid.append(
    createReviewCard({
      eyebrow: 'Payment',
      title: selectedPaymentMethod?.title || 'Payment selection pending',
      lines: paymentLines,
      meta: paymentMeta,
      buttonLabel: 'Edit payment',
      onEdit: () => onEditStage('payment'),
    }),
  );

  const itemsCard = createElement('article', 'checkout-review-card checkout-review-card--items');
  const itemsHeader = createElement('div', 'checkout-review-card__header');
  itemsHeader.append(
    createElement('div', 'checkout-review-card__eyebrow', 'Order Snapshot'),
    createElement(
      'h3',
      'checkout-review-card__title',
      cartData?.totalQuantity ? `${cartData.totalQuantity} items ready to deploy` : 'Items pending',
    ),
  );
  const editItemsButton = createElement('a', 'checkout-review-card__edit', 'Edit cart');
  editItemsButton.href = rootLink('/cart');
  itemsHeader.append(editItemsButton);
  itemsCard.append(itemsHeader);

  const itemsBody = createElement('div', 'checkout-review-card__body');
  if (cartData?.items?.length) {
    const itemList = createElement('ul', 'checkout-review-items');
    cartData.items.slice(0, 4).forEach((item) => {
      const listItem = createElement('li', 'checkout-review-items__item');
      const content = createElement('div', 'checkout-review-items__content');
      content.append(
        createElement('span', 'checkout-review-items__name', `${item.quantity} × ${item.name}`),
        createElement('span', 'checkout-review-items__meta', item.sku || ''),
      );
      listItem.append(
        content,
        createElement('span', 'checkout-review-items__price', formatCurrency(item.total || item.rowTotal || item.price)),
      );
      itemList.append(listItem);
    });
    itemsBody.append(itemList);
  } else {
    itemsBody.append(createElement('p', 'checkout-review-card__line checkout-review-card__line--muted', 'Cart data is still loading.'));
  }
  itemsCard.append(itemsBody);

  const totalText = cartData?.total?.includingTax
    ? `${formatCurrency(cartData.total.includingTax)} total today`
    : 'Totals will refresh once the cart sync completes.';
  itemsCard.append(createElement('p', 'checkout-review-card__meta', totalText));

  summaryGrid.append(itemsCard);

  const note = createElement('div', 'checkout-review-note');
  note.append(
    createElement('span', 'checkout-review-note__label', 'Mission Check'),
    createElement('p', 'checkout-review-note__copy', 'All review content here is mirrored from the live cart and checkout state. Nothing in this step forks the source of truth.'),
  );

  container.append(summaryGrid, note);
}

function renderProgress(container, checkoutData, activeStage, onNavigate) {
  container.replaceChildren();

  const completionState = getCompletionState(checkoutData);
  const isVirtual = Boolean(checkoutData?.isVirtual);
  const shippingLabel = isVirtual ? 'Contact' : 'Shipping';
  const activeStageIndex = STAGE_ORDER.indexOf(activeStage);
  let shippingState = 'upcoming';
  let paymentState = 'upcoming';

  if (completionState.shipping) {
    shippingState = 'done';
  }
  if (completionState.payment) {
    paymentState = 'done';
  }
  if (activeStage === 'shipping') {
    shippingState = 'active';
  }
  if (activeStage === 'payment') {
    paymentState = 'active';
  }

  const steps = [
    {
      key: 'cart',
      label: 'Cart',
      state: 'done',
      href: rootLink('/cart'),
    },
    {
      key: 'shipping',
      label: shippingLabel,
      state: shippingState,
      enabled: true,
    },
    {
      key: 'payment',
      label: 'Payment',
      state: paymentState,
      enabled: activeStageIndex >= 1 || completionState.shipping,
    },
    {
      key: 'review',
      label: 'Review',
      state: activeStage === 'review' ? 'active' : 'upcoming',
      enabled: activeStageIndex >= 2 || completionState.payment,
    },
    {
      key: 'confirm',
      label: 'Confirm',
      state: 'upcoming',
      enabled: false,
    },
  ];

  const list = createElement('ol', 'checkout-progress');
  list.setAttribute('role', 'list');

  steps.forEach((step, index) => {
    const item = createElement('li', 'checkout-progress__item');
    item.dataset.state = step.state;

    const badge = createElement(
      'span',
      'checkout-progress__badge',
      step.state === 'done' ? '✓' : `${index}`,
    );

    let control;
    if (step.href) {
      control = createElement('a', 'checkout-progress__link');
      control.href = step.href;
    } else if (step.key !== 'confirm') {
      control = createElement('button', 'checkout-progress__link');
      control.type = 'button';
      control.disabled = !step.enabled;
      if (step.enabled) {
        control.addEventListener('click', () => onNavigate(step.key));
      }
    } else {
      control = createElement('span', 'checkout-progress__link');
    }

    if (step.state === 'active') {
      control.setAttribute('aria-current', 'step');
    }

    const copy = createElement('span', 'checkout-progress__copy');
    copy.append(
      createElement('span', 'checkout-progress__kicker', step.key === 'cart' ? 'Start' : `Step ${index}`),
      createElement('span', 'checkout-progress__label', step.label),
    );

    control.prepend(badge);
    control.append(copy);
    item.append(control);
    list.append(item);
  });

  container.append(list);
}

export default async function decorate(block) {
  const isB2BEnabled = getConfigValue('commerce-b2b-enabled');
  const permissions = events.lastPayload('auth/permissions');

  let b2bPoApi = null;
  let b2bIsPoEnabled = false;
  let b2bRenderPoSuccess = null;

  if (isB2BEnabled && permissions) {
    const [
      { renderPOSuccess },
      { PO_PERMISSIONS, ...b2bPurchaseOrderModule },
    ] = await Promise.all([
      import('../commerce-b2b-po-checkout-success/commerce-b2b-po-checkout-success.js'),
      import('@dropins/storefront-purchase-order/api.js'),
    ]);

    b2bPoApi = b2bPurchaseOrderModule;
    b2bIsPoEnabled = permissions[PO_PERMISSIONS.PO_ALL] !== false;
    b2bRenderPoSuccess = renderPOSuccess;
  }

  setMetaTags('Checkout');
  document.title = 'Checkout';

  const initialCartData = events.lastPayload('cart/initialized') || events.lastPayload('cart/data');
  redirectToCartIfEmpty(initialCartData);

  let activeStage = 'shipping';
  let latestCheckoutData = events.lastPayload('checkout/initialized') || null;
  let latestCartData = initialCartData || null;
  let stageInitialized = false;

  let shippingForm;
  let billingForm;
  let shippingAddresses;
  let billingAddresses;

  const shippingFormRef = { current: null };
  const billingFormRef = { current: null };
  const creditCardFormRef = { current: null };
  const loaderRef = { current: null };

  events.on('order/placed', () => {
    setMetaTags('Order Confirmation');
    document.title = 'Order Confirmation';
  });

  const checkoutFragment = createCheckoutFragment();
  const getElement = createScopedSelector(checkoutFragment);

  const $shell = getElement(selectors.checkout.shell);
  const $content = getElement(selectors.checkout.content);
  const $loader = getElement(selectors.checkout.loader);
  const $progressSteps = getElement(selectors.checkout.progressSteps);
  const $heroEyebrow = getElement(selectors.checkout.heroEyebrow);
  const $heroTitle = getElement(selectors.checkout.heroTitle);
  const $heroCopy = getElement(selectors.checkout.heroCopy);
  const $reviewSummary = getElement(selectors.checkout.reviewSummary);
  const $mergedCartBanner = getElement(selectors.checkout.mergedCartBanner);
  const $heading = getElement(selectors.checkout.heading);
  const $serverError = getElement(selectors.checkout.serverError);
  const $outOfStock = getElement(selectors.checkout.outOfStock);
  const $login = getElement(selectors.checkout.login);
  const $shippingForm = getElement(selectors.checkout.shippingForm);
  const $billToShipping = getElement(selectors.checkout.billToShipping);
  const $delivery = getElement(selectors.checkout.delivery);
  const $paymentMethods = getElement(selectors.checkout.paymentMethods);
  const $billingForm = getElement(selectors.checkout.billingForm);
  const $orderSummary = getElement(selectors.checkout.orderSummary);
  const $cartSummary = getElement(selectors.checkout.cartSummary);
  const $placeOrder = getElement(selectors.checkout.placeOrder);
  const $giftOptions = getElement(selectors.checkout.giftOptions);
  const $termsAndConditions = getElement(selectors.checkout.termsAndConditions);

  const stageElements = {
    shipping: checkoutFragment.querySelector('[data-stage="shipping"]'),
    payment: checkoutFragment.querySelector('[data-stage="payment"]'),
    review: checkoutFragment.querySelector('[data-stage="review"]'),
  };

  const feedbackElements = {
    shipping: checkoutFragment.querySelector('[data-feedback-for="shipping"]'),
    payment: checkoutFragment.querySelector('[data-feedback-for="payment"]'),
  };

  const nextButtons = {
    shipping: checkoutFragment.querySelector('[data-stage-next="shipping"]'),
    payment: checkoutFragment.querySelector('[data-stage-next="payment"]'),
  };

  const backButtons = {
    payment: checkoutFragment.querySelector('[data-stage-back="payment"]'),
    review: checkoutFragment.querySelector('[data-stage-back="review"]'),
  };

  block.appendChild(checkoutFragment);

  function setStageFeedback(stageKey, message = '') {
    const feedback = feedbackElements[stageKey];
    if (!feedback) return;

    feedback.textContent = message;
    feedback.hidden = !message;
  }

  function clearStageFeedback(stageKey) {
    setStageFeedback(stageKey, '');
  }

  function updateHeroCopy() {
    const copyKey = latestCheckoutData?.isVirtual && activeStage === 'shipping' ? 'contact' : activeStage;
    const stageCopy = STEP_COPY[copyKey];

    $heroEyebrow.textContent = stageCopy.eyebrow;
    $heroTitle.innerHTML = stageCopy.title;
    $heroCopy.textContent = stageCopy.copy;
  }

  function updateShell() {
    $shell.dataset.activeStage = activeStage;
    updateHeroCopy();
    renderProgress($progressSteps, latestCheckoutData, activeStage, goToStage);
    renderReviewSummary($reviewSummary, latestCheckoutData, latestCartData, goToStage);

    Object.entries(stageElements).forEach(([stageKey, element]) => {
      element.dataset.stageActive = String(stageKey === activeStage);
    });

    const isVirtual = Boolean(latestCheckoutData?.isVirtual);
    const backCopy = isVirtual ? 'Back to Contact' : 'Back to Shipping';
    if (backButtons.payment) {
      backButtons.payment.textContent = backCopy;
    }

    $billToShipping.toggleAttribute('hidden', isVirtual);
  }

  function goToStage(stageKey) {
    if (!STAGE_ORDER.includes(stageKey)) {
      return;
    }

    const allowedStageIndex = STAGE_ORDER.indexOf(getRecommendedStage(latestCheckoutData));
    const targetStageIndex = STAGE_ORDER.indexOf(stageKey);

    if (targetStageIndex > allowedStageIndex) {
      return;
    }

    clearStageFeedback('shipping');
    clearStageFeedback('payment');
    activeStage = stageKey;
    updateShell();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateShippingStage() {
    clearStageFeedback('shipping');

    const forms = [];
    if (latestCheckoutData?.isGuest) {
      forms.push({ name: LOGIN_FORM_NAME });
    }
    if (!latestCheckoutData?.isVirtual) {
      forms.push({ name: SHIPPING_FORM_NAME, ref: shippingFormRef });
    }

    if (forms.length && !validateForms(forms)) {
      return false;
    }

    if (!latestCheckoutData?.isVirtual && !getSelectedShippingMethod(latestCheckoutData)) {
      setStageFeedback('shipping', 'Choose a shipping method before moving on.');
      return false;
    }

    return true;
  }

  function validatePaymentStage() {
    clearStageFeedback('payment');

    const forms = [];
    const isBillToShipping = !latestCheckoutData?.isVirtual
      && getCheckoutValues().isBillToShipping === true;

    if (!isBillToShipping) {
      forms.push({ name: BILLING_FORM_NAME, ref: billingFormRef });
    }

    if (forms.length && !validateForms(forms)) {
      return false;
    }

    const selectedPaymentMethod = getSelectedPaymentMethod(latestCheckoutData);
    if (!selectedPaymentMethod) {
      setStageFeedback('payment', 'Choose a payment method before reviewing the order.');
      return false;
    }

    if (selectedPaymentMethod.code === PaymentMethodCode.CREDIT_CARD) {
      if (!creditCardFormRef.current || !creditCardFormRef.current.validate()) {
        setStageFeedback('payment', 'Check the credit card details before continuing.');
        return false;
      }
    }

    return true;
  }

  function handleNext(stageKey) {
    const valid = stageKey === 'shipping'
      ? validateShippingStage()
      : validatePaymentStage();

    if (!valid) {
      return;
    }

    if (stageKey === 'shipping') {
      goToStage('payment');
    } else if (stageKey === 'payment') {
      goToStage('review');
    }
  }

  nextButtons.shipping?.addEventListener('click', () => handleNext('shipping'));
  nextButtons.payment?.addEventListener('click', () => handleNext('payment'));
  backButtons.payment?.addEventListener('click', () => goToStage('shipping'));
  backButtons.review?.addEventListener('click', () => goToStage('payment'));

  const handleValidation = () => validateForms([
    { name: LOGIN_FORM_NAME },
    { name: SHIPPING_FORM_NAME, ref: shippingFormRef },
    { name: BILLING_FORM_NAME, ref: billingFormRef },
    { name: PURCHASE_ORDER_FORM_NAME },
    { name: TERMS_AND_CONDITIONS_FORM_NAME },
  ]);

  const handlePlaceOrder = async ({ cartId, code }) => {
    await displayOverlaySpinner(loaderRef, $loader);

    try {
      if (code === PaymentMethodCode.CREDIT_CARD) {
        if (!creditCardFormRef.current) {
          console.error('Credit card form not rendered.');
          return;
        }

        if (!creditCardFormRef.current.validate()) {
          return;
        }

        await creditCardFormRef.current.submit();
      }

      const shouldPlacePurchaseOrder = isB2BEnabled && b2bIsPoEnabled && b2bPoApi;

      if (shouldPlacePurchaseOrder) {
        await b2bPoApi.placePurchaseOrder(cartId);
      } else {
        await orderApi.placeOrder(cartId);
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      removeOverlaySpinner(loaderRef, $loader);
    }
  };

  await renderPlaceOrder($placeOrder, { handleValidation, handlePlaceOrder, b2bIsPoEnabled });

  const [
    _mergedCartBanner,
    _header,
    _serverError,
    _outOfStock,
    _loginForm,
    shippingFormSkeleton,
    _billToShipping,
    _shippingMethods,
    _paymentMethods,
    billingFormSkeleton,
    _orderSummary,
    _cartSummary,
    _termsAndConditions,
    _giftOptions,
  ] = await Promise.all([
    renderMergedCartBanner($mergedCartBanner),
    renderCheckoutHeader($heading, 'Checkout'),
    renderServerError($serverError, $content),
    renderOutOfStock($outOfStock),
    renderLoginForm($login),
    renderShippingAddressFormSkeleton($shippingForm),
    renderBillToShippingAddress($billToShipping),
    renderShippingMethods($delivery),
    renderPaymentMethods($paymentMethods, creditCardFormRef),
    renderBillingAddressFormSkeleton($billingForm),
    renderOrderSummary($orderSummary),
    renderCartSummaryList($cartSummary),
    renderTermsAndConditions($termsAndConditions),
    renderGiftOptions($giftOptions),
  ]);

  async function initializeCheckout(data) {
    await initReCaptcha(0);

    if (data.isGuest) {
      await displayGuestAddressForms(data);
    } else {
      removeOverlaySpinner(loaderRef, $loader);
      await displayCustomerAddressForms(data);
    }
  }

  async function displayGuestAddressForms(data) {
    if (isVirtualCart(data)) {
      shippingForm?.remove();
      shippingForm = null;
      $shippingForm.innerHTML = '';
    } else if (!shippingForm) {
      shippingFormSkeleton.remove();
      shippingForm = await renderAddressForm($shippingForm, shippingFormRef, data, 'shipping');
    }

    if (!billingForm) {
      billingFormSkeleton.remove();
      billingForm = await renderAddressForm($billingForm, billingFormRef, data, 'billing');
    }
  }

  async function displayCustomerAddressForms(data) {
    if (isVirtualCart(data)) {
      shippingAddresses?.remove();
      shippingAddresses = null;
      $shippingForm.innerHTML = '';
    } else if (!shippingAddresses) {
      shippingForm?.remove();
      shippingForm = null;
      shippingFormRef.current = null;

      shippingAddresses = await renderCustomerShippingAddresses(
        $shippingForm,
        shippingFormRef,
        data,
      );
    }

    if (!billingAddresses) {
      billingForm?.remove();
      billingForm = null;
      billingFormRef.current = null;

      billingAddresses = await renderCustomerBillingAddresses(
        $billingForm,
        billingFormRef,
        data,
      );
    }
  }

  async function handleCheckoutUpdated(data) {
    if (!data) return;

    latestCheckoutData = data;
    await initializeCheckout(data);

    if (!stageInitialized) {
      activeStage = getRecommendedStage(data);
      stageInitialized = true;
    }

    updateShell();
  }

  function handleAuthenticated(authenticated) {
    if (!authenticated) return;

    const orderData = events.lastPayload('order/placed');
    if (orderData) {
      const url = buildOrderDetailsUrl(orderData);
      window.history.pushState({}, '', url);
    }

    window.location.reload();
  }

  function handleCheckoutValues(payload) {
    const shouldHideBilling = !latestCheckoutData?.isVirtual && payload?.isBillToShipping;
    $billingForm.style.display = shouldHideBilling ? 'none' : '';
    updateShell();
  }

  function handleCartSync(data) {
    latestCartData = data;
    redirectToCartIfEmpty(data);
    updateShell();
  }

  async function handleOrderPlaced(orderData) {
    sessionStorage.removeItem(SHIPPING_ADDRESS_DATA_KEY);
    sessionStorage.removeItem(BILLING_ADDRESS_DATA_KEY);

    const url = buildOrderDetailsUrl(orderData);
    window.history.pushState({}, '', url);

    await renderCheckoutSuccess(block, { orderData });
  }

  async function handlePurchaseOrderPlaced(poData) {
    sessionStorage.removeItem(SHIPPING_ADDRESS_DATA_KEY);
    sessionStorage.removeItem(BILLING_ADDRESS_DATA_KEY);

    const url = rootLink(`${CUSTOMER_PO_DETAILS_PATH}?poRef=${poData?.uid}`);
    window.history.pushState({}, '', url);

    if (b2bRenderPoSuccess) {
      await b2bRenderPoSuccess(block, poData);
    }
  }

  updateShell();

  events.on('authenticated', handleAuthenticated);
  events.on('checkout/initialized', handleCheckoutUpdated, { eager: true });
  events.on('checkout/updated', handleCheckoutUpdated);
  events.on('checkout/values', handleCheckoutValues);
  events.on('order/placed', handleOrderPlaced);
  events.on('cart/initialized', handleCartSync, { eager: true });
  events.on('cart/data', handleCartSync);
  events.on('purchase-order/placed', handlePurchaseOrderPlaced);
}
