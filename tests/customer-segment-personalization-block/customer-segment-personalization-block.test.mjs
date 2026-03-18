import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  MISSING_CUSTOMER_SEGMENTS_WARNING,
  evaluateSegmentVisibility,
  parseCustomerSegments,
} from '../../blocks/customer-segment-personalization-block/customer-segment-personalization-block.utils.js';
/* eslint-enable import/extensions */

test('parseCustomerSegments trims whitespace, ignores empty values, and base64-encodes ids', () => {
  const segments = parseCustomerSegments(' 12 , , 44,customer-vip  ');

  assert.deepEqual(segments, ['MTI=', 'NDQ=', 'Y3VzdG9tZXItdmlw']);
});

test('evaluateSegmentVisibility treats multiple authored segments as OR conditions', () => {
  const visibility = evaluateSegmentVisibility(
    parseCustomerSegments('12,44,88'),
    ['NDQ=', 'OTk='],
  );

  assert.equal(visibility.visible, true);
  assert.equal(visibility.matches, true);
  assert.equal(visibility.misconfigured, false);
});

test('evaluateSegmentVisibility keeps the block hidden when no runtime segment matches', () => {
  const visibility = evaluateSegmentVisibility(
    parseCustomerSegments('12,44'),
    ['OTk=', 'MTAw'],
  );

  assert.equal(visibility.visible, false);
  assert.equal(visibility.matches, false);
  assert.equal(visibility.misconfigured, false);
});

test('evaluateSegmentVisibility keeps the block hidden and returns a warning when no segments are authored', () => {
  const visibility = evaluateSegmentVisibility(parseCustomerSegments(' , , '), ['MTI=']);

  assert.deepEqual(visibility, {
    visible: false,
    matches: false,
    misconfigured: true,
    warning: MISSING_CUSTOMER_SEGMENTS_WARNING,
  });
});
