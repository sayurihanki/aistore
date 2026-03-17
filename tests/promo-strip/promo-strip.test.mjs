/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withFakeDom } from '../helpers/fake-dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

function appendCellText(document, cell, value) {
  value.split('\n').forEach((line, index) => {
    if (index > 0) cell.append(document.createElement('br'));
    cell.append(line);
  });
}

function createRow(document, key, value, href = '') {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  const valueCell = document.createElement('div');
  keyCell.textContent = key;

  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = value;
    valueCell.append(link);
  } else {
    appendCellText(document, valueCell, value);
  }

  row.append(keyCell, valueCell);
  return row;
}

function createPromoStripBlock(document, {
  badge = 'Guided Newcomer Experience',
  title = 'NEW TO CAMP PENDLETON? START HERE',
  description = 'Tell us what your first weeks look like and we will tailor shopping picks, family programs, and base-life suggestions to help you settle in faster.',
  ctaLabel = 'Get My Suggestions',
  ctaHref = '/personalize',
  theme = '',
} = {}) {
  const block = document.createElement('div');
  block.className = 'promo-strip';
  const rows = [
    createRow(document, 'badge', badge),
    createRow(document, 'title', title),
    createRow(document, 'description', description),
    createRow(document, 'cta', ctaLabel, ctaHref),
  ];

  if (theme) {
    rows.push(createRow(document, 'theme', theme));
  }

  block.append(...rows);
  return block;
}

test('promo-strip renders author copy and CTA on a non-MCX page', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    const block = createPromoStripBlock(document);
    document.body.append(block);

    decorate(block);

    assert.equal(block.querySelector('.promo-strip__badge')?.textContent, 'Guided Newcomer Experience');
    assert.equal(block.querySelector('.promo-strip__title')?.textContent, 'NEW TO CAMP PENDLETON? START HERE');
    assert.match(block.querySelector('.promo-strip__description')?.textContent || '', /settle in faster/);
    assert.equal(block.querySelector('.promo-strip__cta')?.href, '/personalize');
    assert.equal(block.querySelector('.promo-strip__cta span')?.textContent, 'Get My Suggestions');
    assert.equal(block.querySelectorAll('svg').length, 1);
  });
});

test('promo-strip decorates cleanly when the page already uses the MCX shell', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    document.body.classList.add('mcx');
    const block = createPromoStripBlock(document, {
      badge: 'Preferences Saved',
      title: 'WELCOME BACK TO MCCS',
      description: 'Your tailored experience is ready whenever you return.',
      ctaLabel: 'Return Home',
      ctaHref: '/',
    });
    document.body.append(block);

    decorate(block);

    assert.equal(document.body.classList.contains('mcx'), true);
    assert.equal(block.querySelector('.promo-strip__surface') !== null, true);
    assert.equal(block.querySelector('.promo-strip__grid') !== null, true);
    assert.equal(block.querySelector('.promo-strip__title')?.textContent, 'WELCOME BACK TO MCCS');
    assert.equal(block.querySelector('.promo-strip__cta')?.href, '/');
  });
});

test('promo-strip applies authored theme variants when supported', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    const block = createPromoStripBlock(document, {
      badge: 'Guided Selling Experience',
      title: 'NEW TO BASE START HERE',
      description: 'Guidance tailored around first-week shopping, family programs, and base-life suggestions.',
      ctaLabel: 'Take the AI Recommendations Quiz',
      ctaHref: '/.da/library/blocks/guided-selling',
      theme: 'marine-teal',
    });
    document.body.append(block);

    decorate(block);

    assert.equal(block.dataset.theme, 'marine-teal');
    assert.equal(block.querySelector('.promo-strip__cta')?.href, '/.da/library/blocks/guided-selling');
  });
});

test('promo-strip parses markdown CTA when DA.live wraps the url onto a new line', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    const block = document.createElement('div');
    block.className = 'promo-strip';
    block.append(
      createRow(document, 'badge', 'Guided Selling Experience'),
      createRow(document, 'title', 'NEW TO BASE START HERE'),
      createRow(document, 'description', 'Guidance tailored around first-week shopping, family programs, and base-life suggestions'),
      createRow(document, 'cta', '[Take the AI Recommendations Quiz]\n(https://main--aistore--sayurihanki.aem.live/.da/library/blocks/guided-selling)'),
      createRow(document, 'theme', 'midnight-gold'),
    );
    document.body.append(block);

    decorate(block);

    assert.equal(
      block.querySelector('.promo-strip__cta')?.href,
      'https://main--aistore--sayurihanki.aem.live/.da/library/blocks/guided-selling',
    );
    assert.equal(block.querySelector('.promo-strip__cta span')?.textContent, 'Take the AI Recommendations Quiz');
  });
});

test('promo-strip ignores unsupported theme variants', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/promo-strip/promo-strip.js');
    const block = createPromoStripBlock(document, {
      theme: 'sunset-pink',
    });
    document.body.append(block);

    decorate(block);

    assert.equal(block.dataset.theme, undefined);
  });
});

test('homepage and personalization content point to the new standalone flow', async () => {
  const homepage = await readFile(resolve(repoRoot, 'drafts/index.plain.html'), 'utf8');
  const personalizeDraft = await readFile(resolve(repoRoot, 'drafts/personalize.plain.html'), 'utf8');
  const thankYouDraft = await readFile(resolve(repoRoot, 'drafts/thank-you.plain.html'), 'utf8');
  const personalizePage = await readFile(resolve(repoRoot, 'personalize.html'), 'utf8');
  const thankYouPage = await readFile(resolve(repoRoot, 'thank-you.html'), 'utf8');

  assert.match(homepage, /class="promo-strip"/);
  assert.match(homepage, /href="\/personalize"/);
  assert.match(personalizeDraft, /class="form-mccs-preferences-next"/);
  assert.match(personalizeDraft, /href="\/thank-you"/);
  assert.match(thankYouDraft, /class="promo-strip"/);
  assert.match(personalizePage, /fetch\('\/drafts\/personalize\.plain\.html'\)/);
  assert.match(thankYouPage, /fetch\('\/drafts\/thank-you\.plain\.html'\)/);
});
