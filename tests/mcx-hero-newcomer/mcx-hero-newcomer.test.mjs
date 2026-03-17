/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

function createFieldRow(document, key, valueBuilder) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  keyCell.textContent = key;
  const valueCell = document.createElement('div');
  valueBuilder(valueCell);
  row.append(keyCell, valueCell);
  return row;
}

function createTextRow(document, key, value) {
  return createFieldRow(document, key, (valueCell) => {
    valueCell.textContent = value;
  });
}

function createLinkRow(document, key, href, label) {
  return createFieldRow(document, key, (valueCell) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    valueCell.append(link);
  });
}

function createAuthoredBlock(document, overrides = {}) {
  const section = document.createElement('div');
  section.className = 'section';

  const block = document.createElement('div');
  block.className = 'mcx-hero-newcomer';

  const rows = [
    createTextRow(document, 'eyebrow', overrides.eyebrow || 'New to Base · Start Here · Active Duty'),
    createTextRow(document, 'heading-line-1', overrides.heading1 || 'WELCOME'),
    createTextRow(document, 'heading-line-2', overrides.heading2 || 'ABOARD'),
    createTextRow(document, 'heading-line-3', overrides.heading3 || 'your exchange, your way'),
    createTextRow(
      document,
      'description',
      overrides.description || 'Tax-free shopping, PCS discounts, and the essentials you need to settle in.',
    ),
    createLinkRow(document, 'primary-cta', overrides.primaryHref || '#get-started', overrides.primaryText || 'Get Started'),
    createLinkRow(document, 'secondary-cta', overrides.secondaryHref || '#explore', overrides.secondaryText || 'Explore Deals'),
    createTextRow(document, 'rank-badge-1', 'NEW TO BASE'),
    createTextRow(document, 'rank-badge-2', 'FIRST DUTY STATION'),
    createTextRow(document, 'rank-badge-3', 'CHECK-IN READY'),
    createTextRow(document, 'quick-link-1-label', 'PCS Deals'),
    createTextRow(document, 'quick-link-1-href', '#pcs-deals'),
    createTextRow(document, 'quick-link-1-icon', overrides.quickIcon || 'deals'),
    createTextRow(document, 'quick-link-1-tone', overrides.quickTone || 'gold'),
    createTextRow(document, 'quick-link-2-label', 'Uniforms'),
    createTextRow(document, 'quick-link-2-href', '#uniforms'),
    createTextRow(document, 'quick-link-2-icon', 'uniforms'),
    createTextRow(document, 'quick-link-2-tone', 'teal'),
    createTextRow(document, 'quick-link-3-label', 'Find Your Store'),
    createTextRow(document, 'quick-link-3-href', '#store-locator'),
    createTextRow(document, 'quick-link-3-icon', 'pin'),
    createTextRow(document, 'quick-link-3-tone', 'red'),
    createTextRow(document, 'intel-1-tag', 'PCS Support'),
    createTextRow(document, 'intel-1-value', '30% Off'),
    createTextRow(document, 'intel-1-sub', 'Welcome savings at your new exchange'),
    createTextRow(document, 'intel-1-progress', overrides.intelProgress || '100'),
    createTextRow(document, 'intel-2-tag', 'Uniform Ready'),
    createTextRow(document, 'intel-2-value', 'Ready Now'),
    createTextRow(document, 'intel-2-sub', 'Grab service basics after check-in'),
    createTextRow(document, 'intel-2-progress', '92'),
    createTextRow(document, 'stat-1-value', overrides.stat1Value || '30%'),
    createTextRow(document, 'stat-1-label', 'PCS Welcome Discount'),
    createTextRow(document, 'stat-2-value', overrides.stat2Value || 'Tax Free'),
    createTextRow(document, 'stat-2-label', 'Every Purchase'),
    createTextRow(document, 'stat-3-value', '127+'),
    createTextRow(document, 'stat-3-label', 'Exchange Locations'),
  ];

  (overrides.extraRows || []).forEach((row) => rows.push(row));
  block.append(...rows);
  section.append(block);
  document.body.append(section);
  return { section, block };
}

test('mcx-hero-newcomer renders authored newcomer content with quick links, intel panels, and stats', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero-newcomer/mcx-hero-newcomer.js');
    const { section, block } = createAuthoredBlock(document);

    decorate(block);

    assert.equal(section.classList.contains('mcx-hero-newcomer-section'), true);

    const hero = block.children[0];
    assert.equal(hero.className, 'hero');
    assert.equal(hero.querySelector('.hero-eyebrow-txt')?.textContent, 'New to Base · Start Here · Active Duty');
    assert.equal(hero.querySelector('.btn-p')?.href, '#get-started');
    assert.equal(hero.querySelector('.btn-s')?.href, '#explore');
    assert.equal(hero.querySelectorAll('.ql').length, 3);
    assert.equal(hero.querySelectorAll('.ip').length, 2);
    assert.equal(hero.querySelectorAll('.stat').length, 3);
    assert.equal(hero.querySelector('.hero-rank')?.children.length, 3);
    assert.equal(hero.querySelector('.hero-nav'), null);

    const statValues = [...hero.querySelectorAll('.stat-val')].map((item) => item.textContent.trim());
    assert.deepEqual(statValues, ['30%', 'Tax Free', '127+']);
  });
});

test('mcx-hero-newcomer skips incomplete optional groups and normalizes icon tone and progress fallbacks', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero-newcomer/mcx-hero-newcomer.js');
    const { block } = createAuthoredBlock(document, {
      quickIcon: 'unknown-icon',
      quickTone: 'blue',
      intelProgress: 'not-a-number',
      extraRows: [
        createTextRow(document, 'quick-link-4-label', 'Broken Link'),
        createTextRow(document, 'intel-4-tag', 'Missing Value'),
        createTextRow(document, 'intel-4-sub', 'Should not render'),
      ],
    });

    decorate(block);

    const hero = block.children[0];
    const firstQuickLink = hero.querySelector('.ql');
    const firstQuickIcon = firstQuickLink?.querySelector('.ql-icon');
    const firstIntelFill = hero.querySelector('.ip-bar-fill');

    assert.equal(hero.querySelectorAll('.ql').length, 3);
    assert.equal(hero.querySelectorAll('.ip').length, 2);
    assert.equal(firstQuickLink?.getAttribute('data-icon'), 'clock');
    assert.equal(firstQuickLink?.getAttribute('data-tone'), 'red');
    assert.ok(firstQuickIcon?.classList.contains('red'));
    assert.equal(firstIntelFill?.style.width, '0%');
  });
});

test('mcx-hero-newcomer falls back to newcomer preview defaults on block-library paths', async () => {
  await withFakeDom(async ({ document, window }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero-newcomer/mcx-hero-newcomer.js');
    window.location.pathname = '/library/blocks/mcx-hero-newcomer.plain.html';
    window.location.href = 'https://example.com/library/blocks/mcx-hero-newcomer.plain.html';

    const section = document.createElement('div');
    section.className = 'section';
    const block = document.createElement('div');
    block.className = 'mcx-hero-newcomer';
    section.append(block);
    document.body.append(section);

    decorate(block);

    const hero = block.children[0];
    assert.equal(hero.querySelector('.hero-h1 .l1')?.textContent, 'WELCOME');
    assert.equal(hero.querySelector('.hero-h1 .l2')?.textContent, 'ABOARD');
    assert.equal(hero.querySelectorAll('.ql').length, 4);
    assert.equal(hero.querySelectorAll('.ip').length, 4);
    assert.equal(hero.querySelectorAll('.stat').length, 4);
  });
});

test('mcx-hero-newcomer keeps non-numeric stat values static while animating numeric-prefixed values', async () => {
  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero-newcomer/mcx-hero-newcomer.js');
    const { block } = createAuthoredBlock(document, {
      stat1Value: '24hr',
      stat2Value: 'Tax Free',
    });

    decorate(block);

    const hero = block.children[0];
    const statValues = [...hero.querySelectorAll('.stat-val')].map((item) => item.textContent.trim());
    assert.deepEqual(statValues, ['24hr', 'Tax Free', '127+']);
  });
});
