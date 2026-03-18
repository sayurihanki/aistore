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

function createImageRow(document, key, src, alt) {
  return createFieldRow(document, key, (valueCell) => {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    valueCell.append(image);
  });
}

function createAuthoredBlock(document, options = {}) {
  const section = document.createElement('div');
  section.className = 'section';

  const block = document.createElement('div');
  block.className = 'mcx-hero';

  block.append(
    createTextRow(document, 'eyebrow', 'Spring Collection - 2026 - Tax-Free'),
    createTextRow(document, 'heading-line-1', 'OUTFITTED'),
    createTextRow(document, 'heading-line-2', 'FOR THE'),
    createTextRow(document, 'heading-line-3', 'mission & beyond'),
    createTextRow(
      document,
      'description',
      'Serving Marines and their families since 1897. Premium brands, exclusive savings, and tax-free shopping - exclusively for those who serve.',
    ),
    createImageRow(
      document,
      'image',
      'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80',
      'Marine Corps collection hero',
    ),
  );

  (options.extraImages || []).forEach((image, index) => {
    block.append(createImageRow(document, `image-${index + 2}`, image.src, image.alt));
  });

  block.append(
    createLinkRow(document, 'primary-cta', '#products', 'Shop Now'),
    createLinkRow(document, 'secondary-cta', '#deals', 'View Deals'),
    createTextRow(document, 'status-badge-1', 'SYS: MCX-2026'),
    createTextRow(document, 'status-badge-2', 'STATUS: ACTIVE'),
    createTextRow(document, 'status-badge-3', 'PATRON: AUTHORIZED'),
    createTextRow(document, 'stat-1-value', '20%+'),
    createTextRow(document, 'stat-1-label', 'Average Savings'),
    createTextRow(document, 'stat-2-value', '33M+'),
    createTextRow(document, 'stat-2-label', 'Yearly Transactions'),
    createTextRow(document, 'stat-3-value', 'Tax Free'),
    createTextRow(document, 'stat-3-label', 'Exclusive Benefit'),
    createTextRow(document, 'stat-4-value', '127+'),
    createTextRow(document, 'stat-4-label', 'Store Locations'),
  );

  section.append(block);
  document.body.append(section);
  return { section, block };
}

function createTimerControls() {
  const callbacks = new Map();
  let nextId = 1;

  return {
    window: {
      setInterval(callback) {
        const id = nextId;
        nextId += 1;
        callbacks.set(id, callback);
        return id;
      },
      clearInterval(id) {
        callbacks.delete(id);
      },
      setTimeout(callback) {
        callback();
        return nextId;
      },
      clearTimeout() {},
    },
    tick() {
      [...callbacks.values()].forEach((callback) => callback());
    },
    intervalCount() {
      return callbacks.size;
    },
  };
}

function getActiveHeroAlt(hero) {
  return hero.querySelector('.hero-photo.is-active img')?.alt || '';
}

test('mcx-hero renders single-image authored content without carousel navigation', async () => {
  const timers = createTimerControls();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    const { section, block } = createAuthoredBlock(document);

    decorate(block);

    assert.equal(section.classList.contains('mcx-hero-section'), true);

    const hero = block.children[0];
    assert.equal(hero.className, 'hero');
    assert.equal(hero.querySelector('.hero-eyebrow-txt')?.textContent, 'Spring Collection - 2026 - Tax-Free');
    assert.equal(hero.querySelectorAll('.h-stat').length, 4);
    assert.equal(hero.querySelector('.hero-nav'), null);
    assert.equal(hero.querySelectorAll('.hero-photo').length, 1);
    assert.equal(hero.querySelectorAll('.hero-photo.is-active').length, 1);
    assert.equal(hero.querySelector('.btn-hero')?.href, '#products');
    assert.equal(hero.querySelector('.btn-ghost')?.href, '#deals');
    assert.equal(getActiveHeroAlt(hero), 'Marine Corps collection hero');
    assert.equal(hero.textContent.includes('SYS: MCX-2026'), false);
    assert.equal(timers.intervalCount(), 0);

    const heading = hero.querySelector('.hero-h1');
    assert.equal(heading?.children.length, 3);
    assert.equal(heading?.children[0]?.textContent, 'OUTFITTED');
    assert.equal(heading?.children[1]?.textContent, 'FOR THE');
    assert.equal(heading?.children[2]?.textContent, 'mission & beyond');
  }, {
    window: timers.window,
  });
});

test('mcx-hero rotates multiple authored images and supports dot navigation', async () => {
  const timers = createTimerControls();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    const { block } = createAuthoredBlock(document, {
      extraImages: [
        {
          src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
          alt: 'Tactical collection apparel',
        },
        {
          src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
          alt: 'Performance training essentials',
        },
      ],
    });

    decorate(block);

    const hero = block.children[0];
    const dots = hero.querySelectorAll('.h-dot');

    assert.equal(hero.querySelectorAll('.hero-photo').length, 3);
    assert.equal(dots.length, 3);
    assert.equal(dots[0]?.getAttribute('aria-pressed'), 'true');
    assert.equal(getActiveHeroAlt(hero), 'Marine Corps collection hero');
    assert.equal(timers.intervalCount(), 1);

    dots[2].dispatchEvent({ type: 'click' });

    assert.equal(dots[0]?.getAttribute('aria-pressed'), 'false');
    assert.equal(dots[2]?.getAttribute('aria-pressed'), 'true');
    assert.equal(getActiveHeroAlt(hero), 'Performance training essentials');
    assert.equal(timers.intervalCount(), 1);
  }, {
    window: timers.window,
  });
});

test('mcx-hero pauses autoplay on hover and focus, then resumes cleanly', async () => {
  const timers = createTimerControls();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    const { block } = createAuthoredBlock(document, {
      extraImages: [
        {
          src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
          alt: 'Tactical collection apparel',
        },
      ],
    });

    decorate(block);

    const hero = block.children[0];
    const firstDot = hero.querySelector('.h-dot');

    timers.tick();
    assert.equal(getActiveHeroAlt(hero), 'Tactical collection apparel');

    hero.dispatchEvent({ type: 'mouseenter' });
    assert.equal(timers.intervalCount(), 0);

    timers.tick();
    assert.equal(getActiveHeroAlt(hero), 'Tactical collection apparel');

    hero.dispatchEvent({ type: 'mouseleave' });
    assert.equal(timers.intervalCount(), 1);

    firstDot.focus();
    firstDot.dispatchEvent({ type: 'focus' });
    assert.equal(timers.intervalCount(), 0);

    document.activeElement = null;
    firstDot.dispatchEvent({ type: 'blur' });
    assert.equal(timers.intervalCount(), 1);

    timers.tick();
    assert.equal(getActiveHeroAlt(hero), 'Marine Corps collection hero');
  }, {
    window: timers.window,
  });
});

test('mcx-hero falls back to multi-image library preview defaults', async () => {
  const timers = createTimerControls();

  await withFakeDom(async ({ document, window }) => {
    const { default: decorate } = await import('../../blocks/mcx-hero/mcx-hero.js');
    window.location.pathname = '/library/blocks/mcx-hero.plain.html';
    window.location.href = 'https://example.com/library/blocks/mcx-hero.plain.html';

    const section = document.createElement('div');
    section.className = 'section';
    const block = document.createElement('div');
    block.className = 'mcx-hero';
    section.append(block);
    document.body.append(section);

    decorate(block);

    const hero = block.children[0];
    assert.equal(hero.querySelectorAll('.hero-photo').length, 3);
    assert.equal(hero.querySelectorAll('.h-dot').length, 3);
    assert.equal(getActiveHeroAlt(hero), 'Marine Corps collection hero');
    assert.equal(hero.querySelector('.btn-hero')?.textContent.includes('Shop Now'), true);
    assert.equal(hero.querySelectorAll('.h-stat').length, 4);
  }, {
    window: timers.window,
  });
});
