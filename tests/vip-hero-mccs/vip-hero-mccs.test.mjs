import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  BLOCK_NAME,
  buildAnalyticsPayload,
  encodeAudienceKey,
  normalizeBlockConfig,
  normalizeConfigKey,
  resolveHeroState,
  resolveStateContent,
  shouldHideBlock,
} from '../../blocks/vip-hero-mccs/vip-hero-mccs.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeConfigKey handles underscore, spacing, and camel-case authoring keys', () => {
  assert.equal(normalizeConfigKey('qualified_ctaHref'), 'qualified-cta-href');
  assert.equal(normalizeConfigKey('audienceKey'), 'audience-key');
  assert.equal(normalizeConfigKey('Pending Disclaimer'), 'pending-disclaimer');
});

test('normalizeBlockConfig applies default class bundle and fallback mode', () => {
  const config = normalizeBlockConfig({
    audienceKey: 'Registered_Ski_Trip_Participant',
    promoRuleId: 'ski-trip-rule',
    qualified_headline: 'Participant pricing unlocked',
  });

  assert.equal(config.audienceKey, 'Registered_Ski_Trip_Participant');
  assert.equal(config.promoRuleId, 'ski-trip-rule');
  assert.equal(config.fallbackMode, 'seasonal');
  assert.equal(config.classes, 'vip-winter split-left with-proof-bar');
  assert.equal(config.states.qualified.headline, 'Participant pricing unlocked');
});

test('resolveHeroState stays pending until auth or personalization observation settles', () => {
  assert.equal(resolveHeroState({
    authenticated: undefined,
    hasObservedPersonalization: false,
    audienceKey: 'Registered_Ski_Trip_Participant',
    segments: [],
  }), 'pending');

  assert.equal(resolveHeroState({
    authenticated: true,
    hasObservedPersonalization: false,
    audienceKey: 'Registered_Ski_Trip_Participant',
    segments: [],
  }), 'pending');
});

test('resolveHeroState returns anonymous for signed-out shoppers', () => {
  assert.equal(resolveHeroState({
    authenticated: false,
    hasObservedPersonalization: false,
    audienceKey: 'Registered_Ski_Trip_Participant',
    segments: [],
  }), 'anonymous');
});

test('resolveHeroState returns qualified when Commerce segment matches the audience key', () => {
  assert.equal(resolveHeroState({
    authenticated: true,
    hasObservedPersonalization: true,
    audienceKey: 'Registered_Ski_Trip_Participant',
    segments: [encodeAudienceKey('Registered_Ski_Trip_Participant')],
  }), 'qualified');
});

test('resolveHeroState returns non-qualified when Commerce segment does not match', () => {
  assert.equal(resolveHeroState({
    authenticated: true,
    hasObservedPersonalization: true,
    audienceKey: 'Registered_Ski_Trip_Participant',
    segments: [encodeAudienceKey('Another_Segment')],
  }), 'non-qualified');
});

test('resolveStateContent maps the non-qualified state to authored fallback content', () => {
  const config = normalizeBlockConfig({
    fallback_headline: 'Seasonal winter picks',
  });

  assert.equal(resolveStateContent(config, 'non-qualified').headline, 'Seasonal winter picks');
});

test('shouldHideBlock only hides non-qualified shoppers when fallback mode is hide', () => {
  assert.equal(shouldHideBlock('non-qualified', 'hide'), true);
  assert.equal(shouldHideBlock('qualified', 'hide'), false);
  assert.equal(shouldHideBlock('non-qualified', 'seasonal'), false);
});

test('buildAnalyticsPayload includes required metadata and defaults experiment id to null', () => {
  assert.deepEqual(buildAnalyticsPayload({
    resolvedState: 'qualified',
    audienceKey: 'Registered_Ski_Trip_Participant',
    promoRuleId: 'ski-trip-rule',
    ctaSlot: 'primary',
    href: '/winter-gear',
  }), {
    blockId: BLOCK_NAME,
    resolvedState: 'qualified',
    audienceKey: 'Registered_Ski_Trip_Participant',
    promoRuleId: 'ski-trip-rule',
    experimentId: null,
    ctaSlot: 'primary',
    href: '/winter-gear',
  });
});
