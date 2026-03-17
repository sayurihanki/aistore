/* eslint-env node */
/* global globalThis */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

function createValueCell(document, value) {
  const cell = document.createElement('div');

  if (value && typeof value === 'object' && value.type === 'html') {
    cell.innerHTML = value.html;
    return cell;
  }

  if (value && typeof value === 'object' && value.type === 'link') {
    const link = document.createElement('a');
    link.setAttribute('href', value.href);
    link.textContent = value.text;
    cell.append(link);
    return cell;
  }

  cell.textContent = value;
  return cell;
}

function createFieldRow(document, key, value) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  keyCell.textContent = key;
  row.append(keyCell, createValueCell(document, value));
  return row;
}

function createPopupBlock(document, overrides = {}) {
  const block = document.createElement('div');
  block.className = 'mcx-promo-popup';

  const fields = {
    'campaign-id': 'summer-pcs-sale-2026',
    eyebrow: 'Summer PCS Sale',
    'heading-line-1': 'Settle In',
    'heading-line-2': 'For Less',
    description: 'New to base? Welcome aboard.',
    'badge-value': '20%',
    'badge-label': 'Extra Off',
    'offer-1-value': '20%',
    'offer-1-label': 'Extra Discount',
    'offer-2-value': '$0',
    'offer-2-label': 'Sales Tax',
    'offer-3-value': 'Free',
    'offer-3-label': 'Ship to Store',
    'end-datetime': '2026-07-31T23:59:59-07:00',
    'coupon-code': 'SEMPERFI20',
    'copy-button-text': 'Copy Code',
    'primary-cta': { type: 'link', href: '/deals', text: 'Shop the Sale' },
    'secondary-cta': { type: 'link', href: '/clearance', text: 'Browse Deals' },
    'fine-print': 'Valid on select categories.',
    trigger: 'immediate',
    'trigger-delay': '3',
    'trigger-scroll': '50',
    ...overrides,
  };

  Object.entries(fields).forEach(([key, value]) => {
    block.append(createFieldRow(document, key, value));
  });

  return block;
}

function withNavigator(clipboardImpl, callback) {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: clipboardImpl ? { clipboard: clipboardImpl } : {},
  });

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      if (previousDescriptor) {
        Object.defineProperty(globalThis, 'navigator', previousDescriptor);
      } else {
        delete globalThis.navigator;
      }
    });
}

test('mcx-promo-popup renders rich content, CTA links, and coupon copy actions', async () => {
  await withFakeDom(async ({ document }) => withNavigator({
    writeText: async (value) => {
      globalThis.__copiedCoupon = value;
    },
  }, async () => {
    const { default: decorate } = await import('../../blocks/mcx-promo-popup/mcx-promo-popup.js');
    const block = createPopupBlock(document, {
      description: {
        type: 'html',
        html: 'Welcome <strong>aboard</strong>. <a href="/offers">See terms</a>.',
      },
      'fine-print': {
        type: 'html',
        html: 'Read the <a href="/terms">full terms</a> before checkout.',
      },
    });

    document.body.append(block);
    decorate(block);

    const overlay = document.body.querySelector('.mpp-overlay');
    const copyButton = overlay.querySelector('.mpp-copy');

    assert.ok(overlay);
    assert.equal(document.body.classList.contains('mcx-promo-popup-open'), true);
    assert.equal(overlay.querySelector('.mpp-heading .accent')?.textContent, 'For Less');
    assert.equal(overlay.querySelector('.mpp-description strong')?.textContent, 'aboard');
    assert.equal(overlay.querySelector('.mpp-description a')?.getAttribute('href'), '/offers');
    assert.equal(overlay.querySelector('.mpp-fine-print a')?.getAttribute('href'), '/terms');
    assert.equal(overlay.querySelector('.mpp-btn-primary')?.getAttribute('href'), '/deals');
    assert.equal(overlay.querySelector('.mpp-coupon-code')?.textContent, 'SEMPERFI20');

    copyButton.dispatchEvent({ type: 'click' });
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(globalThis.__copiedCoupon, 'SEMPERFI20');
    delete globalThis.__copiedCoupon;
  }));
});

test('mcx-promo-popup supports scroll trigger and restores focus after close', async () => {
  await withFakeDom(async ({ document, window }) => withNavigator(null, async () => {
    const { default: decorate } = await import('../../blocks/mcx-promo-popup/mcx-promo-popup.js');
    document.body.scrollHeight = 2400;

    const launchButton = document.createElement('button');
    launchButton.textContent = 'Launch';
    document.body.append(launchButton);
    launchButton.focus();

    const block = createPopupBlock(document, {
      trigger: 'scroll',
      'campaign-id': 'scroll-campaign',
    });
    document.body.append(block);

    decorate(block);
    assert.equal(document.body.querySelector('.mpp-overlay'), null);

    window.scrollY = 900;
    window.dispatchEvent({ type: 'scroll' });

    const overlay = document.body.querySelector('.mpp-overlay');
    assert.ok(overlay);

    document.dispatchEvent({ type: 'keydown', key: 'Escape' });

    assert.equal(document.body.querySelector('.mpp-overlay'), null);
    assert.equal(document.body.classList.contains('mcx-promo-popup-open'), false);
    assert.equal(document.activeElement, launchButton);
  }));
});

test('mcx-promo-popup suppresses repeat shows by campaign and bypasses suppression in preview', async () => {
  await withFakeDom(async ({ document, window }) => withNavigator(null, async () => {
    const { default: decorate } = await import('../../blocks/mcx-promo-popup/mcx-promo-popup.js');
    const block = createPopupBlock(document, {
      'campaign-id': 'shared-campaign',
    });
    document.body.append(block);

    decorate(block);
    assert.ok(document.body.querySelector('.mpp-overlay'));
    assert.equal(window.sessionStorage.getItem('mcx_promo_popup_seen_shared-campaign'), '1');

    document.dispatchEvent({ type: 'keydown', key: 'Escape' });

    const blocked = createPopupBlock(document, {
      'campaign-id': 'shared-campaign',
    });
    document.body.append(blocked);
    decorate(blocked);
    assert.equal(document.body.querySelector('.mpp-overlay'), null);

    window.location.pathname = '/blocks/mcx-promo-popup.plain.html';
    window.location.href = 'https://example.com/blocks/mcx-promo-popup.plain.html';

    const previewBlock = createPopupBlock(document, {
      'campaign-id': 'shared-campaign',
      trigger: 'time',
    });
    document.body.append(previewBlock);
    decorate(previewBlock);

    assert.ok(document.body.querySelector('.mpp-overlay'));
  }));
});

test('mcx-promo-popup countdown reaches zero and changes the status label when expired', async () => {
  let intervalCallback = null;
  let now = Date.parse('2026-07-31T23:59:58-07:00');
  const originalDateNow = Date.now;
  Date.now = () => now;

  try {
    await withFakeDom(async ({ document }) => withNavigator(null, async () => {
      const { default: decorate } = await import('../../blocks/mcx-promo-popup/mcx-promo-popup.js');
      const block = createPopupBlock(document, {
        'campaign-id': 'countdown-campaign',
      });
      document.body.append(block);

      decorate(block);

      const overlay = document.body.querySelector('.mpp-overlay');
      const seconds = overlay.querySelector('[data-countdown-seconds]');
      const label = overlay.querySelector('.mpp-countdown-label-text');

      assert.equal(seconds?.textContent, '01');
      assert.equal(label?.textContent, 'Ends In');

      now = Date.parse('2026-08-01T00:00:00-07:00');
      intervalCallback?.();

      assert.equal(seconds?.textContent, '00');
      assert.equal(overlay.querySelector('[data-countdown-days]')?.textContent, '00');
      assert.equal(label?.textContent, 'Offer Ended');
    }), {
      window: {
        setInterval: (callback) => {
          intervalCallback = callback;
          return 1;
        },
        clearInterval: () => {},
      },
    });
  } finally {
    Date.now = originalDateNow;
  }
});
