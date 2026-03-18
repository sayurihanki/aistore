import {
  createLink,
  createPictureFromCell,
  createTextElement,
  extractLink,
  parseFieldRows,
  cellText,
} from '../../scripts/mcx-block-utils.js';
import { isMcxLibraryPreviewPath } from '../../scripts/mcx-preview.js';

const STAT_KEYS = ['1', '2', '3', '4'];
const HERO_AUTOPLAY_INTERVAL = 4500;
const HERO_IMAGE_BREAKPOINTS = [
  { media: '(min-width: 900px)', width: '1600' },
  { width: '900' },
];
const EXTRA_IMAGE_FIELD_REGEX = /^image-(\d+)$/;
const LIBRARY_PREVIEW_DEFAULTS = {
  eyebrow: 'Spring Collection - 2026 - Tax-Free',
  'heading-line-1': 'OUTFITTED',
  'heading-line-2': 'FOR THE',
  'heading-line-3': 'mission & beyond',
  description:
    'Serving Marines and their families since 1897. Premium brands, exclusive savings, and'
    + ' tax-free shopping - exclusively for those who serve.',
  images: [
    {
      key: 'image',
      src: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80',
      alt: 'Marine Corps collection hero',
    },
    {
      key: 'image-2',
      src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
      alt: 'Tactical collection apparel',
    },
    {
      key: 'image-3',
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
      alt: 'Performance training essentials',
    },
  ],
  'primary-cta': {
    href: '#products',
    text: 'Shop Now',
  },
  'secondary-cta': {
    href: '#deals',
    text: 'View Deals',
  },
  'stat-1-value': '20%+',
  'stat-1-label': 'Average Savings',
  'stat-2-value': '33M+',
  'stat-2-label': 'Yearly Transactions',
  'stat-3-value': 'Tax Free',
  'stat-3-label': 'Exclusive Benefit',
  'stat-4-value': '127+',
  'stat-4-label': 'Store Locations',
};

const isLibraryPreview = () => isMcxLibraryPreviewPath(window.location.pathname);

function createSvgArrow() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', 'M5 12h14');

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M12 5l7 7-7 7');

  svg.append(line, arrow);
  return svg;
}

function createImageCell(src, alt) {
  const cell = document.createElement('div');
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;
  cell.append(image);
  return cell;
}

function createLinkCell(href, text) {
  const cell = document.createElement('div');
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;
  cell.append(link);
  return cell;
}

function createFieldCell(text) {
  const cell = document.createElement('div');
  cell.textContent = text;
  return cell;
}

function getDefaultLibraryFields() {
  return {
    eyebrow: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.eyebrow),
    'heading-line-1': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-1']),
    'heading-line-2': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-2']),
    'heading-line-3': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['heading-line-3']),
    description: createFieldCell(LIBRARY_PREVIEW_DEFAULTS.description),
    ...LIBRARY_PREVIEW_DEFAULTS.images.reduce((acc, image) => {
      acc[image.key] = createImageCell(image.src, image.alt);
      return acc;
    }, {}),
    'primary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['primary-cta'].text,
    ),
    'secondary-cta': createLinkCell(
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].href,
      LIBRARY_PREVIEW_DEFAULTS['secondary-cta'].text,
    ),
    'stat-1-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-1-value']),
    'stat-1-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-1-label']),
    'stat-2-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-2-value']),
    'stat-2-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-2-label']),
    'stat-3-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-3-value']),
    'stat-3-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-3-label']),
    'stat-4-value': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-4-value']),
    'stat-4-label': createFieldCell(LIBRARY_PREVIEW_DEFAULTS['stat-4-label']),
  };
}

function createCta(linkData, className) {
  const link = createLink(className, linkData.href, linkData.text);
  const label = document.createElement('span');
  label.textContent = linkData.text;
  link.replaceChildren(label, createSvgArrow());
  return link;
}

function appendHeadingLine(heading, className, text) {
  if (!text) return;
  const line = document.createElement('span');
  line.className = className;
  line.textContent = text;
  heading.append(line);
}

function createEyebrow(text) {
  if (!text) return null;

  const eyebrow = document.createElement('div');
  eyebrow.className = 'hero-eyebrow';

  const pip = document.createElement('div');
  pip.className = 'eyebrow-pip';

  for (let index = 0; index < 3; index += 1) {
    pip.append(document.createElement('span'));
  }

  const label = document.createElement('span');
  label.className = 'hero-eyebrow-txt';
  label.textContent = text;

  eyebrow.append(pip, label);
  return eyebrow;
}

function createStats(fields) {
  const stats = document.createElement('div');
  stats.className = 'hero-stats';

  STAT_KEYS.forEach((index) => {
    const value = cellText(fields[`stat-${index}-value`]);
    const label = cellText(fields[`stat-${index}-label`]);
    if (!value || !label) return;

    const item = document.createElement('div');
    item.className = 'h-stat';

    item.append(
      createTextElement('div', 'h-stat-num', value),
      createTextElement('div', 'h-stat-lbl', label),
    );

    stats.append(item);
  });

  return stats.children.length ? stats : null;
}

function getImageFieldEntries(fields) {
  return Object.entries(fields)
    .map(([key, valueCell]) => {
      if (key === 'image') return { key, order: 1, valueCell };

      const match = key.match(EXTRA_IMAGE_FIELD_REGEX);
      const order = Number.parseInt(match?.[1] || '', 10);
      if (!match || Number.isNaN(order) || order < 2) return null;

      return { key, order, valueCell };
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order);
}

function createHeroSlides(fields) {
  const imageFields = getImageFieldEntries(fields);
  const media = document.createElement('div');
  media.className = 'hero-media';

  const slides = imageFields.reduce((acc, imageField, index) => {
    const picture = createPictureFromCell(
      imageField.valueCell,
      index === 0,
      HERO_IMAGE_BREAKPOINTS,
    );
    if (!picture) return acc;

    picture.className = 'hero-photo hero-slide';
    picture.dataset.heroSlide = String(acc.length);
    picture.setAttribute('aria-hidden', 'true');
    media.append(picture);
    acc.push(picture);
    return acc;
  }, []);

  return {
    media: slides.length ? media : null,
    slides,
  };
}

function createHeroNavigation(slideCount) {
  if (slideCount < 2) return null;

  const heroNav = document.createElement('nav');
  heroNav.className = 'hero-nav';
  heroNav.setAttribute('aria-label', 'Hero image navigation');

  for (let index = 0; index < slideCount; index += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'h-dot';
    dot.dataset.heroDot = String(index);
    dot.setAttribute('aria-label', `Show hero image ${index + 1} of ${slideCount}`);
    dot.setAttribute('aria-pressed', 'false');
    heroNav.append(dot);
  }

  return heroNav;
}

function isNodeWithin(root, node) {
  let current = node;

  while (current) {
    if (current === root) return true;
    current = current.parentNode;
  }

  return false;
}

function updateCarouselState(hero, slides, dots, activeIndex) {
  hero.dataset.activeSlide = String(activeIndex);

  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle('on', isActive);
    dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function bindHeroCarousel(hero, slides, heroNav) {
  if (!heroNav || slides.length < 2) return;

  const dots = [...heroNav.querySelectorAll('.h-dot')];
  let activeIndex = 0;
  let isHovered = false;
  let hasFocusedControl = false;
  let autoplayId = 0;

  const stopAutoplay = () => {
    if (!autoplayId) return;
    window.clearInterval(autoplayId);
    autoplayId = 0;
  };

  const startAutoplay = () => {
    if (autoplayId || isHovered || hasFocusedControl || slides.length < 2) return;

    autoplayId = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      updateCarouselState(hero, slides, dots, activeIndex);
    }, HERO_AUTOPLAY_INTERVAL);
  };

  const setActiveSlide = (index, resetAutoplay = false) => {
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    updateCarouselState(hero, slides, dots, activeIndex);

    if (resetAutoplay) {
      stopAutoplay();
      startAutoplay();
    }
  };

  hero.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoplay();
  });

  hero.addEventListener('mouseleave', () => {
    isHovered = false;
    startAutoplay();
  });

  hero.querySelectorAll('a, button').forEach((node) => {
    node.addEventListener('focus', () => {
      hasFocusedControl = true;
      stopAutoplay();
    });

    node.addEventListener('blur', () => {
      window.setTimeout(() => {
        hasFocusedControl = isNodeWithin(hero, document.activeElement);
        if (!hasFocusedControl) startAutoplay();
      }, 0);
    });
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      setActiveSlide(index, true);
    });
  });

  updateCarouselState(hero, slides, dots, activeIndex);
  startAutoplay();
}

export default function decorate(block) {
  let fields = parseFieldRows(block);
  const hasContent = fields['heading-line-1'] && cellText(fields['heading-line-1']).trim();
  if (isLibraryPreview() && !hasContent) {
    fields = getDefaultLibraryFields();
  }
  const section = block.closest('.section');
  if (section) section.classList.add('mcx-hero-section');

  const hero = document.createElement('section');
  hero.className = 'hero';

  const canvas = document.createElement('div');
  canvas.className = 'hero-canvas';
  hero.append(canvas);

  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  hero.append(grid);

  const scan = document.createElement('div');
  scan.className = 'hero-scan';
  hero.append(scan);

  const { media, slides } = createHeroSlides(fields);
  if (media) hero.append(media);

  const fade = document.createElement('div');
  fade.className = 'hero-photo-fade';
  hero.append(fade);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const eyebrow = createEyebrow(cellText(fields.eyebrow));
  if (eyebrow) content.append(eyebrow);

  const heading = document.createElement('h1');
  heading.className = 'hero-h1';
  appendHeadingLine(heading, 'l1', cellText(fields['heading-line-1']));
  appendHeadingLine(heading, 'l2', cellText(fields['heading-line-2']));
  appendHeadingLine(heading, 'l3', cellText(fields['heading-line-3']));
  if (heading.children.length) content.append(heading);

  const descriptionText = cellText(fields.description);
  if (descriptionText) {
    content.append(createTextElement('p', 'hero-desc', descriptionText));
  }

  const ctas = document.createElement('div');
  ctas.className = 'hero-ctas';
  const primaryCta = extractLink(fields['primary-cta'], 'Shop Now');
  const secondaryCta = extractLink(fields['secondary-cta'], 'View Deals');
  if (primaryCta.text || primaryCta.href) ctas.append(createCta(primaryCta, 'btn-hero'));
  if (secondaryCta.text || secondaryCta.href) ctas.append(createCta(secondaryCta, 'btn-ghost'));
  if (ctas.children.length) content.append(ctas);

  const stats = createStats(fields);
  if (stats) content.append(stats);
  hero.append(content);

  const heroNav = createHeroNavigation(slides.length);
  if (heroNav) hero.append(heroNav);
  if (slides.length === 1) {
    slides[0].classList.add('is-active');
    slides[0].setAttribute('aria-hidden', 'false');
  }
  bindHeroCarousel(hero, slides, heroNav);

  block.replaceChildren(hero);
}
