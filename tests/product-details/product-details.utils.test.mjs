import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  PRODUCT_DETAILS_PRESENTATIONS,
  normalizeProductDetailsPresentation,
  shouldActivateConfigurator,
  shouldActivateImmersivePresentation,
} from '../../blocks/product-details/product-details.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeProductDetailsPresentation falls back to default', () => {
  assert.equal(
    normalizeProductDetailsPresentation('AUTO-IMMERSIVE'),
    PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE,
  );
  assert.equal(
    normalizeProductDetailsPresentation('something-else'),
    PRODUCT_DETAILS_PRESENTATIONS.DEFAULT,
  );
});

test('shouldActivateConfigurator only responds to ready payloads', () => {
  assert.equal(shouldActivateConfigurator({ status: 'ready' }), true);
  assert.equal(shouldActivateConfigurator({ status: 'loading' }), false);
  assert.equal(shouldActivateConfigurator(null), false);
});

test('shouldActivateImmersivePresentation requires auto-immersive and rack payload', () => {
  assert.equal(
    shouldActivateImmersivePresentation('auto-immersive', {
      status: 'ready',
      presentation: 'rack-immersive',
    }),
    true,
  );

  assert.equal(
    shouldActivateImmersivePresentation('default', {
      status: 'ready',
      presentation: 'rack-immersive',
    }),
    false,
  );

  assert.equal(
    shouldActivateImmersivePresentation('auto-immersive', {
      status: 'ready',
      presentation: 'default',
    }),
    false,
  );
});
