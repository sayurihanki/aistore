const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const BLOCK_TEXT_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);
const MEDIA_TAGS = new Set(['PICTURE', 'IMG']);

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function cloneContentNode(node, document) {
  if (typeof node.cloneNode === 'function') return node.cloneNode(true);
  return document.createTextNode(node?.textContent || '');
}

function flushLine(lines, nodes) {
  const text = normalizeText(nodes.map((node) => node.textContent || '').join(''));
  if (text) {
    lines.push({ text, nodes });
  }
}

function splitNodesIntoLines(nodes, document) {
  const lines = [];
  let currentNodes = [];

  const flush = () => {
    if (!currentNodes.length) return;
    flushLine(lines, currentNodes);
    currentNodes = [];
  };

  nodes.forEach((node) => {
    if (!node) return;

    if (node.nodeType === ELEMENT_NODE && node.tagName === 'BR') {
      flush();
      return;
    }

    if (node.nodeType === TEXT_NODE) {
      const parts = String(node.textContent || '').split(/\r?\n/);
      parts.forEach((part, index) => {
        if (part) currentNodes.push(document.createTextNode(part));
        if (index < parts.length - 1) flush();
      });
      return;
    }

    currentNodes.push(cloneContentNode(node, document));
  });

  flush();
  return lines;
}

function extractRichLines(cell) {
  const document = cell.ownerDocument;
  const wrappedChildren = [...cell.children].filter((child) => !MEDIA_TAGS.has(child.tagName));

  if (wrappedChildren.length) {
    return wrappedChildren.flatMap((child) => (
      BLOCK_TEXT_TAGS.has(child.tagName)
        ? splitNodesIntoLines([...child.childNodes], document)
        : splitNodesIntoLines([child], document)
    ));
  }

  return splitNodesIntoLines([...cell.childNodes], document);
}

function extractLabel(cell) {
  return normalizeText(cell?.textContent || '');
}

function extractImage(cell) {
  const picture = cell.querySelector('picture');
  if (picture) {
    const clone = picture.cloneNode(true);
    const image = clone.querySelector('img');
    if (image && !image.getAttribute('loading')) image.setAttribute('loading', 'lazy');
    return {
      alt: image?.getAttribute('alt') || '',
      node: clone,
    };
  }

  const image = cell.querySelector('img');
  if (!image) return null;

  const clone = cell.ownerDocument.createElement('img');
  ['src', 'srcset', 'sizes', 'alt', 'width', 'height'].forEach((attribute) => {
    const value = image.getAttribute(attribute);
    if (value) clone.setAttribute(attribute, value);
  });
  clone.setAttribute('loading', image.getAttribute('loading') || 'lazy');

  return {
    alt: clone.getAttribute('alt') || '',
    node: clone,
  };
}

function isEmptyChapter(chapter) {
  return !chapter.taglineLines.length
    && !chapter.captionLabel
    && !chapter.captionLines.length
    && !chapter.imageA
    && !chapter.imageB;
}

function readChapterRow(row) {
  const document = row.ownerDocument;
  const cells = [...row.children];

  while (cells.length < 5) {
    cells.push(document.createElement('div'));
  }

  return {
    taglineLines: extractRichLines(cells[0]),
    captionLabel: extractLabel(cells[1]),
    captionLines: extractRichLines(cells[2]),
    imageA: extractImage(cells[3]),
    imageB: extractImage(cells[4]),
  };
}

function appendLineNodes(target, line) {
  line.nodes.forEach((node) => target.append(node));
}

function buildAnimatedLines(document, lines, outerClassName, innerClassName, baseDelay, stepDelay) {
  const fragment = document.createDocumentFragment();

  lines.forEach((line, index) => {
    const outer = document.createElement('span');
    outer.className = outerClassName;

    const inner = document.createElement('span');
    inner.className = innerClassName;
    inner.style.transitionDelay = `${baseDelay + (stepDelay * index)}ms`;
    appendLineNodes(inner, line);

    outer.append(inner);
    fragment.append(outer);
  });

  return fragment;
}

function buildTagline(document, lines) {
  if (!lines.length) return null;

  const heading = document.createElement('h2');
  heading.className = 'scroll-story__tagline';
  heading.setAttribute('aria-label', lines.map((line) => line.text).join(' '));
  heading.append(buildAnimatedLines(
    document,
    lines,
    'scroll-story__tagline-line',
    'scroll-story__tagline-inner',
    60,
    110,
  ));
  return heading;
}

function buildCaption(document, label, lines) {
  if (!label && !lines.length) return null;

  const caption = document.createElement('div');
  caption.className = 'scroll-story__caption';

  if (label) {
    const captionLabel = document.createElement('p');
    captionLabel.className = 'scroll-story__caption-label';

    const captionLabelInner = document.createElement('span');
    captionLabelInner.textContent = label;
    captionLabel.append(captionLabelInner);

    caption.append(captionLabel);
  }

  if (lines.length) {
    const body = document.createElement('div');
    body.className = 'scroll-story__caption-body';
    body.append(buildAnimatedLines(
      document,
      lines,
      'scroll-story__caption-line',
      'scroll-story__caption-inner',
      520,
      90,
    ));
    caption.append(body);
  }

  return caption;
}

function createPlaceholder(document, variant) {
  const placeholder = document.createElement('div');
  placeholder.className = `scroll-story__placeholder scroll-story__placeholder--${variant}`;
  placeholder.setAttribute('aria-hidden', 'true');
  return placeholder;
}

function getPanelVariant(index, slotOffset) {
  return ((index + slotOffset) % 4) + 1;
}

function createMediaPanel(document, image, slot, index, reverse) {
  const panel = document.createElement('div');
  panel.className = `scroll-story__media-panel scroll-story__media-panel--${slot}`;

  let parallaxSpeed = 0.06;
  if (slot === 'a') {
    parallaxSpeed = reverse ? 0.06 : -0.08;
  } else {
    parallaxSpeed = reverse ? -0.08 : 0.06;
  }

  panel.dataset.parallaxSpeed = String(parallaxSpeed);
  panel.style.setProperty('--scroll-story-parallax', '0px');

  if (image?.node) {
    panel.classList.add('has-media');
    panel.append(image.node);
  } else {
    panel.classList.add('is-placeholder');
    panel.append(createPlaceholder(
      document,
      getPanelVariant(index, slot === 'a' ? 0 : 1),
    ));
  }

  return panel;
}

function createChapter(document, chapter, index) {
  const reverse = index % 2 === 1;
  const chapterElement = document.createElement('section');
  chapterElement.className = 'scroll-story__chapter';
  chapterElement.dataset.index = String(index);

  if (reverse) {
    chapterElement.classList.add('scroll-story__chapter--reverse');
  }

  const sticky = document.createElement('div');
  sticky.className = 'scroll-story__chapter-sticky';

  const media = document.createElement('div');
  media.className = 'scroll-story__media';

  const panelA = createMediaPanel(document, chapter.imageA, 'a', index, reverse);
  const panelB = createMediaPanel(document, chapter.imageB, 'b', index, reverse);
  media.append(panelA, panelB);

  const copy = document.createElement('div');
  copy.className = 'scroll-story__copy';

  const tagline = buildTagline(document, chapter.taglineLines);
  if (tagline) copy.append(tagline);

  const caption = buildCaption(document, chapter.captionLabel, chapter.captionLines);
  if (caption) copy.append(caption);

  sticky.append(media, copy);
  chapterElement.append(sticky);

  return {
    chapter: chapterElement,
    panels: [panelA, panelB],
  };
}

function setPanelOffset(panel, value) {
  panel.style.setProperty('--scroll-story-parallax', `${value.toFixed(2)}px`);
}

function updateParallax(records) {
  const viewportHeight = window.innerHeight || 0;
  const viewportCenter = viewportHeight / 2;

  records.forEach(({ chapter, panels }) => {
    if (!chapter.classList.contains('is-in-view')) {
      panels.forEach((panel) => setPanelOffset(panel, 0));
      return;
    }

    const rect = chapter.getBoundingClientRect();
    const centerOffset = (rect.top + (rect.height / 2)) - viewportCenter;

    panels.forEach((panel) => {
      const speed = Number.parseFloat(panel.dataset.parallaxSpeed || '0');
      setPanelOffset(panel, centerOffset * speed);
    });
  });
}

function prefersStaticLayout() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const narrowViewport = window.matchMedia?.('(max-width: 767px)')?.matches;
  return Boolean(reduceMotion || narrowViewport);
}

export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    section.classList.add('scroll-story-section');
  }

  const document = block.ownerDocument;
  const chapters = [...block.children]
    .map(readChapterRow)
    .filter((chapter) => !isEmptyChapter(chapter));

  if (!chapters.length) {
    block.replaceChildren();
    return;
  }

  const chapterRecords = chapters.map((chapter, index) => createChapter(document, chapter, index));
  block.replaceChildren(...chapterRecords.map((record) => record.chapter));

  const staticLayout = prefersStaticLayout();
  if (staticLayout) {
    block.classList.add('is-static');
    chapterRecords.forEach(({ chapter, panels }) => {
      chapter.classList.add('is-in-view');
      panels.forEach((panel) => setPanelOffset(panel, 0));
    });
    return;
  }

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateParallax(chapterRecords);
      ticking = false;
    });
  };

  const observer = typeof window.IntersectionObserver === 'function'
    ? new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
      requestUpdate();
    }, {
      threshold: 0.35,
      rootMargin: '0px 0px -10% 0px',
    })
    : null;

  if (observer) {
    chapterRecords.forEach(({ chapter }) => observer.observe(chapter));
  } else {
    chapterRecords.forEach(({ chapter }) => chapter.classList.add('is-in-view'));
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
}
