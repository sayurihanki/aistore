/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

function createCell(document, builder) {
  const cell = document.createElement('div');
  builder(cell);
  return cell;
}

function createParagraphCell(document, paragraphs = []) {
  return createCell(document, (cell) => {
    paragraphs.forEach((html) => {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = html;
      cell.append(paragraph);
    });
  });
}

function createTextCell(document, text = '') {
  return createCell(document, (cell) => {
    cell.textContent = text;
  });
}

function createImageCell(document, src, alt) {
  return createCell(document, (cell) => {
    if (!src) return;
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    cell.append(image);
  });
}

function createChapterRow(document, options) {
  const row = document.createElement('div');
  row.append(
    createParagraphCell(document, options.tagline || []),
    createTextCell(document, options.label || ''),
    createParagraphCell(document, options.caption || []),
    createImageCell(document, options.imageA?.src, options.imageA?.alt),
    createImageCell(document, options.imageB?.src, options.imageB?.alt),
  );
  return row;
}

function createBlock(document, chapters) {
  const section = document.createElement('div');
  section.className = 'section';

  const block = document.createElement('div');
  block.className = 'scroll-story';

  chapters.forEach((chapter) => {
    block.append(createChapterRow(document, chapter));
  });

  section.append(block);
  document.body.append(section);
  return { section, block };
}

function createObserverController() {
  const instances = [];

  class ControlledObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      instances.push(this);
    }

    observe(target) {
      this.targets.push(target);
    }

    unobserve() {}

    disconnect() {}
  }

  return {
    ControlledObserver,
    instances,
  };
}

test('scroll-story renders authored chapters with animated lines and preserved emphasis', async () => {
  const observerControl = createObserverController();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/scroll-story/scroll-story.js');
    const { section, block } = createBlock(document, [
      {
        tagline: ['We go back to', '<em>basics</em>, only <em>real</em>', 'ingredients.'],
        label: 'No additive. No artifice.',
        caption: [
          'In a world of shortcuts, we choose restraint.',
          'No additives. No artifice. Fewer, better elements handled with care.',
          'Letting nature do what it already does best.',
        ],
        imageA: {
          src: 'https://example.com/forest-a.jpg',
          alt: 'Forest canopy',
        },
        imageB: {
          src: 'https://example.com/forest-b.jpg',
          alt: 'Stone creek',
        },
      },
      {
        tagline: ['When nature', '<em>perfects</em> something,', 'we <em>reveal</em> it.'],
        label: 'Distilled, differently.',
        caption: ['Purity is not created.', 'It is preserved.'],
        imageA: {
          src: 'https://example.com/forest-c.jpg',
          alt: 'Mountain lake',
        },
        imageB: {
          src: 'https://example.com/forest-d.jpg',
          alt: 'Moss stones',
        },
      },
    ]);

    decorate(block);

    assert.equal(section.classList.contains('scroll-story-section'), true);
    assert.equal(block.querySelectorAll('.scroll-story__chapter').length, 2);
    assert.equal(block.querySelectorAll('.scroll-story__tagline-line').length, 6);
    assert.equal(block.querySelectorAll('.scroll-story__caption-line').length, 5);
    assert.equal(block.querySelector('.scroll-story__tagline-line em')?.textContent, 'basics');
    assert.equal(block.querySelectorAll('.scroll-story__media-panel').length, 4);
    assert.equal(block.querySelector('.scroll-story__chapter--reverse')?.dataset.index, '1');
    assert.equal(block.querySelector('.scroll-story__chapter--reverse .scroll-story__media-panel--a')?.dataset.parallaxSpeed, '0.06');
    assert.equal(block.querySelector('.scroll-story__chapter .scroll-story__caption-label span')?.textContent, 'No additive. No artifice.');
    assert.equal(observerControl.instances.length, 1);
    assert.equal(observerControl.instances[0].targets.length, 2);
  }, {
    window: {
      IntersectionObserver: observerControl.ControlledObserver,
    },
  });
});

test('scroll-story renders gradient placeholders for missing media cells', async () => {
  const observerControl = createObserverController();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/scroll-story/scroll-story.js');
    const { block } = createBlock(document, [
      {
        tagline: ['Placeholder chapter'],
        label: 'Fallback media',
        caption: ['Images are optional.'],
      },
    ]);

    decorate(block);

    assert.equal(block.querySelectorAll('.scroll-story__media-panel.is-placeholder').length, 2);
    assert.equal(block.querySelectorAll('.scroll-story__placeholder').length, 2);
  }, {
    window: {
      IntersectionObserver: observerControl.ControlledObserver,
    },
  });
});

test('scroll-story toggles in-view state through IntersectionObserver updates', async () => {
  const observerControl = createObserverController();

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/scroll-story/scroll-story.js');
    const { block } = createBlock(document, [
      {
        tagline: ['Observer chapter'],
        label: 'Watch state',
        caption: ['Transitions are chapter scoped.'],
        imageA: {
          src: 'https://example.com/image-a.jpg',
          alt: 'Image A',
        },
        imageB: {
          src: 'https://example.com/image-b.jpg',
          alt: 'Image B',
        },
      },
    ]);

    decorate(block);

    const chapter = block.querySelector('.scroll-story__chapter');
    const observer = observerControl.instances[0];

    assert.equal(chapter.classList.contains('is-in-view'), false);

    observer.callback([{ isIntersecting: true, target: chapter }], observer);
    assert.equal(chapter.classList.contains('is-in-view'), true);

    observer.callback([{ isIntersecting: false, target: chapter }], observer);
    assert.equal(chapter.classList.contains('is-in-view'), false);
  }, {
    window: {
      IntersectionObserver: observerControl.ControlledObserver,
    },
  });
});

test('scroll-story disables motion handling for reduced-motion users', async () => {
  let observerCreations = 0;

  await withFakeDom(async ({ document }) => {
    const { default: decorate } = await import('../../blocks/scroll-story/scroll-story.js');
    const { block } = createBlock(document, [
      {
        tagline: ['Reduced motion chapter'],
        label: 'Static presentation',
        caption: ['The chapter should render fully visible.'],
        imageA: {
          src: 'https://example.com/static-a.jpg',
          alt: 'Static A',
        },
        imageB: {
          src: 'https://example.com/static-b.jpg',
          alt: 'Static B',
        },
      },
    ]);

    decorate(block);

    const chapter = block.querySelector('.scroll-story__chapter');
    assert.equal(block.classList.contains('is-static'), true);
    assert.equal(chapter.classList.contains('is-in-view'), true);
    assert.equal(block.querySelector('.scroll-story__media-panel')?.style['--scroll-story-parallax'], '0.00px');
    assert.equal(observerCreations, 0);
  }, {
    window: {
      matchMedia: (query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }),
      IntersectionObserver: class {
        constructor() {
          observerCreations += 1;
        }
      },
    },
  });
});
