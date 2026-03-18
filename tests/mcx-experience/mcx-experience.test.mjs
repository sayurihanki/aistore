import test from 'node:test';
import assert from 'node:assert/strict';

import { appendMeta, FakeDocument } from '../helpers/fake-dom.js';
import {
  applyMcxExperienceFallback,
  hasMcxContentBlock,
} from '../../scripts/mcx-experience.js';

function createPageWithBlock(className) {
  const document = new FakeDocument();
  const main = document.createElement('main');
  const section = document.createElement('div');
  const block = document.createElement('div');

  block.className = className;
  section.append(block);
  main.append(section);
  document.body.append(main);

  return { document, main };
}

test('hasMcxContentBlock detects authored MCX block roots', () => {
  const { main } = createPageWithBlock('mcx-hero');

  assert.equal(hasMcxContentBlock(main), true);
});

test('hasMcxContentBlock includes the MCX category page block', () => {
  const { main } = createPageWithBlock('mcx-category-page');

  assert.equal(hasMcxContentBlock(main), true);
});

test('hasMcxContentBlock includes the MCX promo popup block', () => {
  const { main } = createPageWithBlock('mcx-promo-popup');

  assert.equal(hasMcxContentBlock(main), true);
});

test('hasMcxContentBlock ignores MCX helper data nodes', () => {
  const { main } = createPageWithBlock('mcx-nav-data');

  assert.equal(hasMcxContentBlock(main), false);
});

test('applyMcxExperienceFallback enables the MCX body class and theme metadata', () => {
  const { document } = createPageWithBlock('mcx-product-cards');

  const ensureMetadata = (name, content) => {
    if (document.head.querySelector(`meta[name="${name}"]`)) return;
    appendMeta(document, name, content);
  };

  const applied = applyMcxExperienceFallback(document, ensureMetadata);

  assert.equal(applied, true);
  assert.equal(document.body.classList.contains('mcx'), true);
  assert.equal(document.head.querySelector('meta[name="theme"]')?.content, 'mcx');
});
