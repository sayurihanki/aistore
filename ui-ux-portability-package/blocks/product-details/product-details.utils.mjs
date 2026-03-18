export const PRODUCT_DETAILS_PRESENTATIONS = Object.freeze({
  DEFAULT: 'default',
  AUTO_IMMERSIVE: 'auto-immersive',
});

export function normalizeProductDetailsPresentation(value = '') {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE) {
    return PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE;
  }

  return PRODUCT_DETAILS_PRESENTATIONS.DEFAULT;
}

export function shouldActivateConfigurator(payload = {}) {
  return payload?.status === 'ready';
}

export function shouldActivateImmersivePresentation(
  presentation = PRODUCT_DETAILS_PRESENTATIONS.DEFAULT,
  payload = {},
) {
  return (
    normalizeProductDetailsPresentation(presentation)
      === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE
    && payload?.status === 'ready'
    && payload?.presentation === 'rack-immersive'
  );
}
