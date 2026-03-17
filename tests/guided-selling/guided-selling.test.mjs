/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildStorageKeys,
  DEFAULT_CONFIG,
  getPreviewDataset,
  normalizeDataset,
  rankResultItems,
  sanitizeAnswers,
} from '../../blocks/guided-selling/guided-selling.lib.js';
import { cloneGuidedSellingSample } from '../../blocks/guided-selling/guided-selling.sample.js';
import { withFakeDom } from '../helpers/fake-dom.js';

async function loadDecorate() {
  return (await import('../../blocks/guided-selling/guided-selling.js')).default;
}

function appendConfigRow(document, block, key, value, asLink = false) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  const valueCell = document.createElement('div');
  keyCell.textContent = key;

  if (asLink) {
    const link = document.createElement('a');
    link.setAttribute('href', value);
    link.textContent = value;
    valueCell.append(link);
  } else {
    valueCell.textContent = value;
  }

  row.append(keyCell, valueCell);
  block.append(row);
}

function createBlock(document, entries = []) {
  const section = document.createElement('div');
  section.className = 'section';
  const wrapper = document.createElement('div');
  const block = document.createElement('div');
  block.className = 'guided-selling';
  const originalQuerySelectorAll = block.querySelectorAll.bind(block);
  block.querySelectorAll = (selector) => {
    if (selector === ':scope > div') {
      return [...block.children];
    }
    return originalQuerySelectorAll(selector);
  };
  entries.forEach(([key, value, asLink = false]) => {
    appendConfigRow(document, block, key, value, asLink);
  });
  wrapper.append(block);
  section.append(wrapper);
  document.body.append(section);
  return { section, block };
}

function click(target) {
  target.dispatchEvent({
    type: 'click',
    target,
    preventDefault() {},
    stopPropagation() {},
  });
}

test('rankResultItems enforces matchAll and sorts by score then matchAny hits', () => {
  const ranked = rankResultItems([
    {
      id: 'alpha',
      title: 'Alpha',
      score: 90,
      matchAll: ['a'],
      matchAny: ['b', 'c'],
    },
    {
      id: 'beta',
      title: 'Beta',
      score: 96,
      matchAll: [],
      matchAny: ['b'],
    },
    {
      id: 'gamma',
      title: 'Gamma',
      score: 96,
      matchAll: [],
      matchAny: ['b', 'c'],
    },
  ], ['a', 'b', 'c']);

  assert.deepEqual(ranked.map((item) => item.id), ['gamma', 'beta', 'alpha']);
});

test('sanitizeAnswers removes invalid option values and normalizes single-select steps', () => {
  const dataset = normalizeDataset(cloneGuidedSellingSample());
  const sanitized = sanitizeAnswers(dataset, {
    identity: ['active-duty', 'veteran'],
    lifestyle: ['athletic', 'bogus', 'athletic'],
  });

  assert.deepEqual(sanitized.identity, ['active-duty']);
  assert.deepEqual(sanitized.lifestyle, ['athletic']);
});

test('guided-selling falls back to preview sample data in the DA library preview', async () => {
  await withFakeDom(async ({ document, fetchCalls }) => {
    const decorate = await loadDecorate();
    const { section, block } = createBlock(document, [
      ['eyebrow', 'Preview'],
      ['title', 'PREVIEW'],
    ]);

    await decorate(block);

    assert.equal(fetchCalls.length, 0);
    assert.ok(section.classList.contains('guided-selling-section'));
    assert.equal(block.querySelector('.gs-intro-title').textContent, 'PREVIEW');
    assert.ok(block.querySelector('.gs-header'));
  }, {
    window: {
      location: {
        pathname: '/.da/library/blocks/guided-selling',
      },
    },
  });
});

test('guided-selling enables and disables next buttons correctly for single and multi-select steps', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const { block } = createBlock(document);
    await decorate(block);

    click(block.querySelector('.gs-start-button'));

    const identityRefs = block.querySelector('[data-step-id="identity"]');
    const identityNext = identityRefs.querySelector('.gs-button-primary');
    assert.equal(identityNext.disabled, true);

    const identityOption = identityRefs.querySelector('[data-value="active-duty"]');
    click(identityOption);
    assert.equal(identityNext.disabled, false);

    click(identityNext);

    const lifestyleRefs = block.querySelector('[data-step-id="lifestyle"]');
    const lifestyleNext = lifestyleRefs.querySelector('.gs-button-primary');
    const lifestyleOption = lifestyleRefs.querySelector('[data-value="athletic"]');
    assert.equal(lifestyleNext.disabled, true);

    click(lifestyleOption);
    assert.equal(lifestyleNext.disabled, false);

    click(lifestyleOption);
    assert.equal(lifestyleNext.disabled, true);
  }, {
    window: {
      location: {
        pathname: '/.da/library/blocks/guided-selling',
      },
    },
  });
});

test('guided-selling restores session progress and selected answers', async () => {
  await withFakeDom(async ({ document, window }) => {
    const decorate = await loadDecorate();
    const { block } = createBlock(document);
    const dataset = getPreviewDataset();
    const storageKeys = buildStorageKeys(DEFAULT_CONFIG, dataset, window.location.pathname);

    window.sessionStorage.setItem(storageKeys.session, JSON.stringify({
      screen: 'step',
      stepIndex: 1,
      answers: {
        identity: ['active-duty'],
        lifestyle: ['athletic', 'duty'],
      },
    }));

    await decorate(block);

    const lifestyleScreen = block.querySelector('[data-step-id="lifestyle"]');
    assert.ok(lifestyleScreen.classList.contains('is-active'));
    assert.equal(lifestyleScreen.querySelectorAll('.gs-option.is-selected').length, 2);
    assert.equal(lifestyleScreen.querySelector('.gs-selection-label').textContent, '2 selected');
  }, {
    window: {
      location: {
        pathname: '/.da/library/blocks/guided-selling',
      },
    },
  });
});

test('guided-selling loads real JSON data, transitions through loading, and ranks results deterministically', async () => {
  await withFakeDom(async ({
    document,
    window,
    setFetchImplementation,
  }) => {
    const decorate = await loadDecorate();
    const sample = cloneGuidedSellingSample();
    const { block } = createBlock(document, [
      ['data-source', '/data/guided-selling/mcx-style-match.json'],
      ['analytics-id', 'mcx-guided-selling'],
    ]);

    const dataset = normalizeDataset(sample);
    const storageKeys = buildStorageKeys({
      ...DEFAULT_CONFIG,
      analyticsId: 'mcx-guided-selling',
    }, dataset, window.location.pathname);

    window.sessionStorage.setItem(storageKeys.session, JSON.stringify({
      screen: 'step',
      stepIndex: 6,
      answers: {
        identity: ['active-duty'],
        lifestyle: ['duty', 'athletic'],
        activities: ['pt-gear', 'tactical'],
        style: ['tactical-edge'],
        fit: ['slim-fit'],
        budget: ['50-150'],
        brands: ['under-armour', 'brooks'],
      },
    }));

    setFetchImplementation(async (url) => {
      assert.match(String(url), /mcx-style-match\.json$/);
      return {
        ok: true,
        json: async () => sample,
      };
    });

    await decorate(block);

    const brandScreen = block.querySelector('[data-step-id="brands"]');
    assert.ok(brandScreen.classList.contains('is-active'));

    click(brandScreen.querySelector('.gs-button-primary'));

    const results = block.querySelector('[data-screen="results"]');
    assert.ok(results.classList.contains('is-active'));
    assert.equal(block.querySelector('.gs-results-badge').textContent, '✓ Profile Complete — 94% Match Score');

    const cardTitles = [...block.querySelectorAll('.gs-card-title')].map((node) => node.textContent);
    assert.deepEqual(cardTitles.slice(0, 4), [
      'HeatGear Compression Long Sleeve',
      'Ghost 16 Road Running Shoe',
      'TDU Ripstop Tactical Pants',
      'Tachyon 8" GTX Tactical Boot',
    ]);
  }, {
    window: {
      location: {
        pathname: '/guided-shopping',
      },
    },
  });
});
