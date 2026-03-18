/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

test('header resolution always returns mcx-header while footer resolution keeps shell-specific behavior', async () => {
  await withFakeDom(async ({ document }) => {
    const {
      resolveFooterBlockName,
      resolveHeaderBlockName,
    } = await import('../../scripts/aem.js');

    assert.equal(resolveHeaderBlockName(), 'mcx-header');
    assert.equal(resolveFooterBlockName(), 'footer');

    document.body.matches = (selector) => selector === '.mcx, .mcx-preview';

    assert.equal(resolveHeaderBlockName(), 'mcx-header');
    assert.equal(resolveFooterBlockName(), 'mcx-footer');
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});
