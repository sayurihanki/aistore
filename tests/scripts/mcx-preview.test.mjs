/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMcxLibraryPreviewBlockName,
  isMcxLibraryPreviewPath,
} from '../../scripts/mcx-preview.js';

test('mcx preview helpers recognize directory and .plain.html library routes', () => {
  assert.equal(isMcxLibraryPreviewPath('/.da/library/blocks/mcx-hero'), true);
  assert.equal(isMcxLibraryPreviewPath('/library/blocks/mcx-header/'), true);
  assert.equal(isMcxLibraryPreviewPath('/.da/library/blocks/mcx-product-cards.plain.html'), true);
  assert.equal(isMcxLibraryPreviewPath('/blocks/mcx-hero.plain.html'), true);

  assert.equal(getMcxLibraryPreviewBlockName('/.da/library/blocks/mcx-hero.plain.html'), 'mcx-hero');
  assert.equal(getMcxLibraryPreviewBlockName('/library/blocks/mcx-product-cards/'), 'mcx-product-cards');
  assert.equal(getMcxLibraryPreviewBlockName('/blocks/mcx-header.plain.html'), 'mcx-header');
  assert.equal(getMcxLibraryPreviewBlockName('/library/blocks/product-list-page.plain.html'), null);
});
