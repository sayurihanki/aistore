/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';
import {
  applyDd214Profile,
  createInitialState,
  getAwardsPage,
  getDeviceSummary,
  getRackRows,
  normalizeBlockConfig,
  sanitizeDeviceDraft,
  upsertRackItem,
} from '../../blocks/ez-rack-builder-mockup/ez-rack-builder-mockup.lib.js';

async function loadDecorate() {
  return (await import('../../blocks/ez-rack-builder-mockup/ez-rack-builder-mockup.js')).default;
}

function buildConfigRow(document, name, value) {
  const row = document.createElement('div');
  const key = document.createElement('div');
  const text = document.createElement('p');
  text.textContent = name;
  key.append(text);

  const val = document.createElement('div');
  const valueText = document.createElement('p');
  valueText.textContent = value;
  val.append(valueText);

  row.append(key, val);
  return row;
}

function buildMockupBlock(document) {
  const block = document.createElement('div');
  block.className = 'block';
  block.append(
    buildConfigRow(document, 'eyebrow-text', 'MarineShop · Awards Division'),
    buildConfigRow(document, 'title', 'Welcome to the\nEZ Rack Builder'),
    buildConfigRow(document, 'subtitle', 'Prototype subtitle'),
    buildConfigRow(document, 'primary-cta-label', 'Start New Rack'),
    buildConfigRow(document, 'secondary-cta-label', 'Prototype Login'),
    buildConfigRow(document, 'review-cta-label', 'Save Prototype Rack'),
    buildConfigRow(document, 'prototype-note', 'Prototype mode only.'),
  );
  return block;
}

test('normalizeBlockConfig fills default authoring copy', () => {
  const config = normalizeBlockConfig({
    title: 'Custom Title',
    'primary-cta-label': 'Launch',
  });

  assert.equal(config.title, 'Custom Title');
  assert.equal(config.primaryCtaLabel, 'Launch');
  assert.equal(config.reviewCtaLabel, 'Save Prototype Rack');
});

test('createInitialState starts on welcome with standard ribbons selected', () => {
  const state = createInitialState();

  assert.equal(state.step, 0);
  assert.equal(state.branch, 'USMC');
  assert.equal(state.rackType, 'standard_ribbons');
  assert.equal(state.options.spacing, 'flush');
});

test('award paging filters by search and returns one page for small result sets', () => {
  const page = getAwardsPage({
    searchQuery: 'air medal',
    page: 0,
    perPage: 12,
  });

  assert.equal(page.total, 1);
  assert.equal(page.items[0].id, 'air-medal');
  assert.equal(page.pageCount, 1);
});

test('device sanitizing clamps counts and creates readable summaries', () => {
  const draft = sanitizeDeviceDraft({
    bronze: 8,
    goldV: true,
    numerals: '  12  ',
  });

  assert.deepEqual(draft, {
    bronze: 5,
    gold: 0,
    silver: 0,
    bronzeC: false,
    goldV: true,
    goldNumerals: '',
    numerals: '12',
    note: '',
  });
  assert.match(getDeviceSummary(draft), /Bronze Star x5/);
  assert.match(getDeviceSummary(draft), /Gold V/);
});

test('rack helpers sort awards by precedence, group rows, and preload DD214 awards', () => {
  let rack = [];
  rack = upsertRackItem(rack, 'natl-defense');
  rack = upsertRackItem(rack, 'air-medal');
  rack = upsertRackItem(rack, 'combat-action');

  assert.deepEqual(rack.map((award) => award.id), [
    'air-medal',
    'combat-action',
    'natl-defense',
  ]);
  assert.equal(getRackRows(rack, 3).length, 1);
  assert.equal(applyDd214Profile([]).length, 5);
});

test('decorate renders the welcome state and advances into the branch step', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = buildMockupBlock(document);
    document.body.append(block);

    await decorate(block);

    assert.equal(block.querySelector('.ez-rack-builder-mockup__welcome-eyebrow')?.textContent, 'MarineShop · Awards Division');
    assert.equal(block.querySelector('.ez-rack-builder-mockup__screen.is-active')?.dataset.screen, '0');

    block.querySelector('[data-action="goto-step"][data-step="1"]')?.dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('.ez-rack-builder-mockup__screen.is-active')?.dataset.screen, '1');
  });
});

test('branch and rack type selections auto-advance through the wizard', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = buildMockupBlock(document);
    document.body.append(block);

    await decorate(block);

    block.querySelector('[data-action="goto-step"][data-step="1"]')?.dispatchEvent({ type: 'click' });
    block.querySelector('[data-action="select-branch"][data-branch="NAVY"]')?.dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('.ez-rack-builder-mockup__screen.is-active')?.dataset.screen, '2');

    block.querySelector('[data-action="select-rack-type"][data-rack-type="mini_medals"]')?.dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('.ez-rack-builder-mockup__screen.is-active')?.dataset.screen, '3');
  });
});

test('changing rack options updates review state', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = buildMockupBlock(document);
    document.body.append(block);

    await decorate(block);

    block.querySelector('[data-action="goto-step"][data-step="3"]')?.dispatchEvent({ type: 'click' });

    const spacing = block.querySelector('[data-action="set-spacing"]');
    const alignment = block.querySelector('[data-action="set-alignment"]');
    spacing.value = 'padded';
    spacing.dispatchEvent({ type: 'change' });
    alignment.value = 'right';
    alignment.dispatchEvent({ type: 'change' });

    block.querySelector('[data-action="goto-step"][data-step="4"]')?.dispatchEvent({ type: 'click' });
    block.querySelector('[data-action="goto-step"][data-step="5"]')?.dispatchEvent({ type: 'click' });

    const values = [...block.querySelectorAll('.ez-rack-builder-mockup__review-option-row .val')]
      .map((node) => node.textContent);

    assert.ok(values.includes('Padded'));
    assert.ok(values.includes('Right'));
  });
});

test('award search, device editing, and rack removal all update the mockup', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = buildMockupBlock(document);
    document.body.append(block);

    await decorate(block);

    block.querySelector('[data-action="goto-step"][data-step="4"]')?.dispatchEvent({ type: 'click' });

    const search = block.querySelector('[data-action="search-awards"]');
    search.value = 'air medal';
    search.dispatchEvent({ type: 'input' });

    const awardCard = block.querySelector('[data-action="open-award"][data-award-id="air-medal"]');
    assert.ok(awardCard);
    awardCard.dispatchEvent({ type: 'click' });

    const bronze = block.querySelector('[data-action="device-count"][data-device="bronze"]');
    bronze.value = '2';
    bronze.dispatchEvent({ type: 'change' });
    block.querySelector('[data-action="toggle-device"][data-device="goldV"]')?.dispatchEvent({ type: 'click' });
    block.querySelector('[data-action="save-award"]')?.dispatchEvent({ type: 'click' });

    assert.match(block.querySelector('.ez-rack-builder-mockup__summary-count')?.textContent || '', /1 award/);
    assert.match(block.querySelector('.ez-rack-builder-mockup__rack-list-devices')?.textContent || '', /Bronze Star x2/);

    block.querySelector('[data-action="remove-award"][data-award-id="air-medal"]')?.dispatchEvent({ type: 'click' });

    assert.match(block.querySelector('.ez-rack-builder-mockup__summary-count')?.textContent || '', /No award/);
  });
});

test('DD214 preload seeds awards and review CTA reveals the prototype note', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = buildMockupBlock(document);
    document.body.append(block);

    await decorate(block);

    block.querySelector('[data-action="goto-step"][data-step="4"]')?.dispatchEvent({ type: 'click' });
    block.querySelector('[data-action="upload-dd214"]')?.dispatchEvent({ type: 'click' });

    assert.match(block.querySelector('.ez-rack-builder-mockup__summary-count')?.textContent || '', /5 awards total/);

    block.querySelector('[data-action="goto-step"][data-step="5"]')?.dispatchEvent({ type: 'click' });
    block.querySelector('[data-action="prototype-submit"]')?.dispatchEvent({ type: 'click' });

    assert.equal(
      block.querySelector('.ez-rack-builder-mockup__prototype-note p')?.textContent,
      'Prototype mode only.',
    );
  });
});
