import {
  Button, Icon, InLineAlert, provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';

// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Libs
import {
  buildBlock, decorateBlock, loadBlock, readBlockConfig,
} from '../../scripts/aem.js';
import {
  fetchPlaceholders, getProductLink, rootLink, setJsonLd,
} from '../../scripts/commerce.js';
import {
  mountProductInputOptions,
  deriveEnteredOptionsFromCustomizableOptions,
} from '../../scripts/components/pdp-input-options/pdp-input-options.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';
/* eslint-disable import/extensions */
import {
  PRODUCT_DETAILS_PRESENTATIONS,
  normalizeProductDetailsPresentation,
  shouldActivateConfigurator,
  shouldActivateImmersivePresentation,
} from './product-details.utils.mjs';
import {
  buildExperienceModel,
  fetchExperienceOverrides,
  resolveExperienceOverridesForProduct,
} from './product-details.experience.mjs';
import {
  renderProductDetailsExperience,
  syncProductDetailsCommerceUi,
} from './product-details.view.mjs';
/* eslint-enable import/extensions */

const PDP_CONFIGURATOR_FALLBACKS = Object.freeze({
  'USMC-OFFICER-BLUES-PACKAGE': {
    sku: 'USMC-OFFICER-BLUES-PACKAGE',
    dataSource: '/data/configurators/marine-officer-dress-blues.json',
    layout: 'immersive',
  },
});

function getAddToCartButtonText(labels, inCart) {
  return inCart
    ? labels.Global?.UpdateProductInCart || 'Update Cart'
    : labels.Global?.AddProductToCart || 'Add to Cart';
}

function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

async function waitForProductData() {
  const current = events.lastPayload('pdp/data');
  if (current) {
    return current;
  }

  return new Promise((resolve, reject) => {
    let subscription;
    const timer = window.setTimeout(() => {
      subscription?.off?.();
      reject(new Error('Product data was not available on this page.'));
    }, 5000);

    subscription = events.on('pdp/data', (payload) => {
      window.clearTimeout(timer);
      subscription?.off?.();
      resolve(payload);
    });
  });
}

async function getInitialEnteredOptions(itemUid, inputOptions) {
  if (!itemUid || !Array.isArray(inputOptions) || inputOptions.length === 0) {
    return [];
  }

  try {
    const { getCartData } = await import('@dropins/storefront-cart/api.js');
    const cartData = await getCartData();
    const cartItem = cartData?.items?.find((item) => item.uid === itemUid);

    return deriveEnteredOptionsFromCustomizableOptions(
      inputOptions,
      cartItem?.customizableOptions,
    );
  } catch (error) {
    console.warn('Could not resolve entered options from cart item:', error);
    return [];
  }
}

function getConfiguratorFallback(product) {
  const fallback = PDP_CONFIGURATOR_FALLBACKS[product?.sku];

  if (!fallback) {
    return null;
  }

  const hasSelectableOptions = Array.isArray(product?.options) && product.options.length > 0;
  const hasInputOptions = Array.isArray(product?.inputOptions) && product.inputOptions.length > 0;

  if (hasSelectableOptions || hasInputOptions) {
    return null;
  }

  return fallback;
}

function syncConfiguratorLayoutVariant(block, product) {
  const layout = PDP_CONFIGURATOR_FALLBACKS[product?.sku]?.layout;
  block.classList.toggle('product-details--configurator-immersive', layout === 'immersive');
}

async function mountConfiguratorFallback(container, block, product) {
  const fallback = getConfiguratorFallback(product);

  if (!container || !fallback) {
    return false;
  }

  const fallbackBlock = buildBlock('uniform-configurator', [
    ['sku', fallback.sku],
    ['data-source', fallback.dataSource],
  ]);

  container.replaceChildren(fallbackBlock);
  decorateBlock(fallbackBlock);
  block.classList.add('product-details--configurator-active');
  await loadBlock(fallbackBlock);

  const didRenderConfigurator = Boolean(
    fallbackBlock.querySelector('.uniform-configurator__shell')
    || fallbackBlock.querySelector('.uniform-configurator-block-message'),
  );

  if (!didRenderConfigurator) {
    block.classList.remove('product-details--configurator-active');
    container.replaceChildren();
    return false;
  }

  return true;
}

function setupAccordion(root) {
  const buttons = [...root.querySelectorAll('[data-accordion-button]')];
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.product-details__accordion-item');
      const isOpen = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
}

function imageSlotConfig(ctx) {
  const {
    data,
    defaultImageProps,
  } = ctx;

  return {
    alias: data.sku,
    imageProps: defaultImageProps,
    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  };
}

export default async function decorate(block) {
  let product = events.lastPayload('pdp/data') ?? null;
  if (!product) {
    try {
      product = await waitForProductData();
    } catch (error) {
      console.warn('Product details rendered before product data was ready:', error);
    }
  }

  const labels = await fetchPlaceholders();
  const blockConfig = readBlockConfig(block);
  const presentation = normalizeProductDetailsPresentation(blockConfig.presentation);
  const experienceSource = blockConfig['experience-data-source'];
  let experienceOverrides = {};

  if (experienceSource) {
    try {
      experienceOverrides = await fetchExperienceOverrides(experienceSource);
    } catch (error) {
      console.warn('Could not load PDP experience overrides:', error);
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');
  let isUpdateMode = false;
  let experience = buildExperienceModel(
    product,
    resolveExperienceOverridesForProduct(product, experienceOverrides),
  );

  const fragment = document.createRange()
    .createContextualFragment(`
      <div class="product-details__alert"></div>
      <nav class="product-details__breadcrumb" aria-label="Breadcrumb">
        <div class="product-details__breadcrumb-inner" data-role="breadcrumb"></div>
      </nav>
      <div class="product-details__wrapper">
        <div class="product-details__left-column">
          <div class="product-details__gallery-shell product-details__gallery-shell--desktop">
            <div class="product-details__gallery-badges" data-role="gallery-badges-desktop"></div>
            <div class="product-details__gallery-wishlist"></div>
            <div class="product-details__gallery"></div>
          </div>
        </div>
        <div class="product-details__right-column">
          <div class="product-details__gallery-shell product-details__gallery-shell--mobile">
            <div class="product-details__gallery-badges" data-role="gallery-badges-mobile"></div>
            <div class="product-details__gallery-wishlist"></div>
            <div class="product-details__gallery product-details__gallery--mobile"></div>
          </div>
          <div class="product-details__info-brand" data-role="eyebrow"></div>
          <div class="product-details__header"></div>
          <div class="product-details__rating-row" data-role="rating-row"></div>
          <div class="product-details__price-card">
            <div class="product-details__price-row">
              <div class="product-details__price"></div>
              <span class="product-details__price-save-pill" data-role="price-save-pill"></span>
            </div>
            <div class="product-details__price-tax" data-role="price-tax"></div>
          </div>
          <div class="product-details__promo" data-role="promo"></div>
          <div class="product-details__gift-card-options"></div>
          <div class="product-details__configurator-fallback"></div>
          <div class="product-details__configuration">
            <div class="product-details__options"></div>
            <div class="product-details__input-options"></div>
            <div class="product-details__quantity-row">
              <div class="product-details__quantity"></div>
              <div class="product-details__stock-tag" data-role="stock-tag"></div>
            </div>
            <div class="product-details__buttons">
              <div class="product-details__buttons__add-to-cart"></div>
              <div class="product-details__buttons__add-to-req-list"></div>
            </div>
          </div>
          <div class="product-details__shipping-cards" data-role="shipping-cards"></div>
          <div class="product-details__accordion" data-role="accordion">
            <section class="product-details__accordion-item product-details__accordion-item--details is-open">
              <button class="product-details__accordion-header" type="button" aria-expanded="true" data-accordion-button>
                <span class="product-details__accordion-title">Product Details</span>
                <span class="product-details__accordion-arrow" aria-hidden="true">▾</span>
              </button>
              <div class="product-details__accordion-body">
                <div class="product-details__short-description"></div>
                <div class="product-details__description"></div>
                <div class="product-details__attributes"></div>
              </div>
            </section>
            <section class="product-details__accordion-item">
              <button class="product-details__accordion-header" type="button" aria-expanded="false" data-accordion-button>
                <span class="product-details__accordion-title">Shipping &amp; Pickup</span>
                <span class="product-details__accordion-arrow" aria-hidden="true">▾</span>
              </button>
              <div class="product-details__accordion-body" data-role="shipping-panel"></div>
            </section>
            <section class="product-details__accordion-item">
              <button class="product-details__accordion-header" type="button" aria-expanded="false" data-accordion-button>
                <span class="product-details__accordion-title">Returns &amp; Exchange</span>
                <span class="product-details__accordion-arrow" aria-hidden="true">▾</span>
              </button>
              <div class="product-details__accordion-body" data-role="returns-panel"></div>
            </section>
          </div>
        </div>
      </div>
      <section class="product-details__reviews-section" id="reviews"></section>
      <div class="product-details__sticky-atc">
        <div class="product-details__sticky-atc-info">
          <div class="product-details__sticky-atc-name" data-role="sticky-name"></div>
          <div class="product-details__sticky-atc-price" data-role="sticky-price"></div>
        </div>
        <button class="product-details__sticky-atc-button" type="button" data-role="sticky-atc-button">Add to Cart</button>
      </div>
    `);

  const $alert = fragment.querySelector('.product-details__alert');
  const $breadcrumb = fragment.querySelector('[data-role="breadcrumb"]');
  const $gallery = fragment.querySelector('.product-details__left-column .product-details__gallery');
  const $galleryMobile = fragment.querySelector('.product-details__gallery--mobile');
  const $desktopBadges = fragment.querySelector('[data-role="gallery-badges-desktop"]');
  const $mobileBadges = fragment.querySelector('[data-role="gallery-badges-mobile"]');
  const [$desktopWishlist, $mobileWishlist] = fragment.querySelectorAll('.product-details__gallery-wishlist');
  const $eyebrow = fragment.querySelector('[data-role="eyebrow"]');
  const $header = fragment.querySelector('.product-details__header');
  const $ratingRow = fragment.querySelector('[data-role="rating-row"]');
  const $price = fragment.querySelector('.product-details__price');
  const $priceSavings = fragment.querySelector('[data-role="price-save-pill"]');
  const $priceTax = fragment.querySelector('[data-role="price-tax"]');
  const $promo = fragment.querySelector('[data-role="promo"]');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $options = fragment.querySelector('.product-details__options');
  const $inputOptions = fragment.querySelector('.product-details__input-options');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $stockTag = fragment.querySelector('[data-role="stock-tag"]');
  const $giftCardOptions = fragment.querySelector('.product-details__gift-card-options');
  const $configuratorFallback = fragment.querySelector('.product-details__configurator-fallback');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $requisitionListSelector = fragment.querySelector('.product-details__buttons__add-to-req-list');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');
  const $shippingCards = fragment.querySelector('[data-role="shipping-cards"]');
  const $accordion = fragment.querySelector('[data-role="accordion"]');
  const $shippingPanel = fragment.querySelector('[data-role="shipping-panel"]');
  const $returnsPanel = fragment.querySelector('[data-role="returns-panel"]');
  const $reviewsSection = fragment.querySelector('.product-details__reviews-section');
  const $stickyAtc = fragment.querySelector('.product-details__sticky-atc');
  const $stickyName = fragment.querySelector('[data-role="sticky-name"]');
  const $stickyPrice = fragment.querySelector('[data-role="sticky-price"]');
  const $stickyAtcButton = fragment.querySelector('[data-role="sticky-atc-button"]');
  const experienceSectionNodes = {
    breadcrumb: $breadcrumb,
    eyebrow: $eyebrow,
    badgeContainers: [$desktopBadges, $mobileBadges],
    ratingRow: $ratingRow,
    promo: $promo,
    shippingCards: $shippingCards,
    shippingPanel: $shippingPanel,
    returnsPanel: $returnsPanel,
    reviewsSection: $reviewsSection,
    priceTax: $priceTax,
  };
  const experienceCommerceNodes = {
    priceSavings: $priceSavings,
    stockTag: $stockTag,
    header: $header,
    priceRoot: $price,
    stickyName: $stickyName,
    stickyPrice: $stickyPrice,
    stickyAtc: $stickyAtc,
  };

  block.replaceChildren(fragment);
  block.classList.toggle(
    'product-details--presentation-auto-immersive',
    presentation === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE,
  );
  syncConfiguratorLayoutVariant(block, product);
  setupAccordion($accordion);

  const gallerySlots = {
    CarouselThumbnail: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
        wrapper: document.createElement('span'),
      });
    },

    CarouselMainImage: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
      });
    },
  };

  let inlineAlert = null;
  const routeToWishlist = '/wishlist';
  let syncFrame = 0;
  let addToCartButton = null;
  const resolveCurrentExperience = () => buildExperienceModel(
    product,
    resolveExperienceOverridesForProduct(product, experienceOverrides),
  );

  const scheduleDecoratedSync = () => {
    if (syncFrame) {
      window.cancelAnimationFrame(syncFrame);
    }

    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = 0;
      syncProductDetailsCommerceUi(experienceCommerceNodes, {
        product,
        experience,
      });
    });
  };

  const renderExperience = () => {
    experience = resolveCurrentExperience();
    renderProductDetailsExperience(experienceSectionNodes, {
      experience,
    });
    syncProductDetailsCommerceUi(experienceCommerceNodes, {
      product,
      experience,
    });
    scheduleDecoratedSync();
  };

  const getSelectedOptionUIDs = (configValues) => {
    const urlOptionsUIDs = urlParams.get('optionsUIDs');
    const hasConfigOptions = configValues?.optionsUIDs
      && Array.isArray(configValues.optionsUIDs)
      && configValues.optionsUIDs.length > 0;

    if (hasConfigOptions) {
      return configValues.optionsUIDs;
    }

    if (urlOptionsUIDs === '') {
      return null;
    }

    return null;
  };

  const wishlistToggleInstances = [];
  const syncWishlistToggles = () => {
    const configValues = pdpApi.getProductConfigurationValues();
    const optionUIDs = getSelectedOptionUIDs(configValues);
    const enteredOptions = configValues?.enteredOptions;

    wishlistToggleInstances.forEach((instance) => {
      instance?.setProps?.((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
          enteredOptions,
        },
      }));
    });
  };

  const setCtaState = ({
    text,
    disabled = false,
    processing = false,
  }) => {
    addToCartButton?.setProps?.((prev) => ({
      ...prev,
      children: text,
      disabled,
    }));
    $stickyAtcButton.textContent = text;
    $stickyAtcButton.disabled = disabled;
    $stickyAtcButton.classList.toggle('is-loading', processing);
    $stickyAtcButton.setAttribute('aria-busy', processing ? 'true' : 'false');
  };

  const syncPrimaryCta = (valid = pdpApi.isProductConfigurationValid()) => {
    setCtaState({
      text: getAddToCartButtonText(labels, isUpdateMode),
      disabled: !valid,
    });
  };

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    desktopWishlistToggle,
    mobileWishlistToggle,
  ] = await Promise.all([
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },
      slots: gallerySlots,
    })($galleryMobile),

    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsRow',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },
      slots: gallerySlots,
    })($gallery),

    pdpRendered.render(ProductHeader, {})($header),

    pdpRendered.render(ProductPrice, {})($price),

    pdpRendered.render(ProductShortDescription, {})($shortDescription),

    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: (ctx) => {
          tryRenderAemAssetsImage(ctx, {
            ...imageSlotConfig(ctx),
            wrapper: document.createElement('span'),
          });
        },
      },
    })($options),

    pdpRendered.render(ProductQuantity, {})($quantity),

    pdpRendered.render(ProductGiftCardOptions, {})($giftCardOptions),

    pdpRendered.render(ProductDescription, {})($description),

    pdpRendered.render(ProductAttributes, {})($attributes),

    wishlistRender.render(WishlistToggle, {
      product,
    })($desktopWishlist),

    wishlistRender.render(WishlistToggle, {
      product,
    })($mobileWishlist),
  ]);

  if (desktopWishlistToggle) {
    wishlistToggleInstances.push(desktopWishlistToggle);
  }

  if (mobileWishlistToggle) {
    wishlistToggleInstances.push(mobileWishlistToggle);
  }

  const initialEnteredOptions = await getInitialEnteredOptions(
    itemUidFromUrl,
    product?.inputOptions,
  );

  await mountProductInputOptions($inputOptions, {
    initialEnteredOptions,
  });

  const priceObserver = new MutationObserver(() => scheduleDecoratedSync());
  priceObserver.observe($price, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const headerObserver = new MutationObserver(() => scheduleDecoratedSync());
  headerObserver.observe($header, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  let configuratorFallbackMount = null;
  const ensureConfiguratorFallback = (nextProduct = product) => {
    if (configuratorFallbackMount) {
      return configuratorFallbackMount;
    }

    configuratorFallbackMount = mountConfiguratorFallback($configuratorFallback, block, nextProduct)
      .then((mounted) => {
        if (!mounted) {
          configuratorFallbackMount = null;
        }

        return mounted;
      })
      .catch((error) => {
        configuratorFallbackMount = null;
        console.error('Could not mount PDP configurator fallback:', error);
        return false;
      });

    return configuratorFallbackMount;
  };

  const handleAddToCart = async () => {
    const buttonActionText = isUpdateMode
      ? labels.Global?.UpdatingInCart || 'Updating...'
      : labels.Global?.AddingToCart || 'Adding...';

    try {
      setCtaState({
        text: buttonActionText,
        disabled: true,
        processing: true,
      });

      const values = pdpApi.getProductConfigurationValues();
      const valid = pdpApi.isProductConfigurationValid();

      if (valid) {
        if (isUpdateMode) {
          const { updateProductsFromCart } = await import('@dropins/storefront-cart/api.js');

          await updateProductsFromCart([{
            ...values,
            uid: itemUidFromUrl,
          }]);

          const updatedSku = values?.sku;
          if (updatedSku) {
            const cartRedirectUrl = new URL(
              rootLink('/cart'),
              window.location.origin,
            );
            cartRedirectUrl.searchParams.set('itemUid', itemUidFromUrl);
            window.location.href = cartRedirectUrl.toString();
          } else {
            console.warn(
              'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
            );
            window.location.href = rootLink('/cart');
          }
          return;
        }

        const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');
        await addProductsToCart([{ ...values }]);
      }

      inlineAlert?.remove();
    } catch (error) {
      inlineAlert = await UI.render(InLineAlert, {
        heading: 'Error',
        description: error.message,
        icon: h(Icon, { source: 'Warning' }),
        'aria-live': 'assertive',
        role: 'alert',
        onDismiss: () => {
          inlineAlert.remove();
        },
      })($alert);

      $alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } finally {
      syncPrimaryCta();
      setCtaState({
        text: getAddToCartButtonText(labels, isUpdateMode),
        disabled: !pdpApi.isProductConfigurationValid(),
        processing: false,
      });
      scheduleDecoratedSync();
    }
  };

  addToCartButton = await UI.render(Button, {
    children: getAddToCartButtonText(labels, isUpdateMode),
    icon: h(Icon, { source: 'Cart' }),
    onClick: handleAddToCart,
  })($addToCart);

  $stickyAtcButton.addEventListener('click', handleAddToCart);

  renderExperience();
  syncWishlistToggles();
  syncPrimaryCta();
  scheduleDecoratedSync();

  events.on('pdp/data', (nextProduct) => {
    product = nextProduct;
    syncConfiguratorLayoutVariant(block, nextProduct);
    ensureConfiguratorFallback(nextProduct);
    renderExperience();
    syncWishlistToggles();
  }, { eager: true });

  events.on('pdp/valid', (valid) => {
    syncPrimaryCta(valid);
  }, { eager: true });

  events.on('pdp/values', () => {
    syncWishlistToggles();
    scheduleDecoratedSync();
  }, { eager: true });

  events.on('wishlist/alert', ({
    action,
    item,
  }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($alert);

    setTimeout(() => {
      $alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      $alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  });

  try {
    const { initializeRequisitionList } = await import('./requisition-list.js');
    await initializeRequisitionList({
      $alert,
      $requisitionListSelector,
      product,
      labels,
      urlParams,
    });
  } catch (error) {
    console.warn('Requisition list module not available:', error);
  }

  events.on(
    'cart/data',
    (cartData) => {
      let itemIsInCart = false;
      if (itemUidFromUrl && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUidFromUrl,
        );
      }

      isUpdateMode = itemIsInCart;
      syncPrimaryCta();
      scheduleDecoratedSync();
    },
    { eager: true },
  );

  events.on('aem/lcp', () => {
    const prerendered = isProductPrerendered();
    if (product && !prerendered) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  events.on('pdp/configurator-ready', (payload) => {
    block.classList.toggle(
      'product-details--configurator-active',
      shouldActivateConfigurator(payload) || block.classList.contains('product-details--configurator-active'),
    );
    block.classList.toggle(
      'product-details--immersive-active',
      shouldActivateImmersivePresentation(presentation, payload),
    );
  }, { eager: true });

  return Promise.resolve();
}

async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            inStock
            images(roles: ["image"]) {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }

  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }

    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }

  if (!content) {
    return;
  }

  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}
