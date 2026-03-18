/* eslint-env node */
/* global globalThis */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendMeta,
  withFakeDom,
} from '../helpers/fake-dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

function splitTableRow(line) {
  const cells = line.split(/\s\|\s/).map((cell) => cell.trim());
  if (/\s\|\s*$/.test(line)) cells.push('');
  return cells;
}

async function loadTable(relativePath) {
  const text = await readFile(resolve(repoRoot, relativePath), 'utf8');
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return {
    title: lines[0],
    rows: lines.slice(1).map(splitTableRow),
  };
}

function createCell(document, rawValue) {
  const value = rawValue.trim();
  const cell = document.createElement('div');
  if (!value) return cell;

  const imageMatch = value.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (imageMatch) {
    const [, alt, src] = imageMatch;
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    cell.append(image);
    return cell;
  }

  const linkMatch = value.match(/^\[(.+?)\]\((.+?)\)$/);
  if (linkMatch) {
    const [, text, href] = linkMatch;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    cell.append(link);
    return cell;
  }

  cell.textContent = value.replace(/<br\s*\/?>/gi, '\n');
  return cell;
}

function createCloudCell(document, value) {
  const cell = document.createElement('div');
  if (!value) return cell;

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (index > 0) cell.append(document.createElement('br'));
      cell.append(entry);
    });
    return cell;
  }

  if (value.type === 'picture') {
    const picture = document.createElement('picture');
    const image = document.createElement('img');
    image.src = value.src;
    image.alt = value.alt || '';
    picture.append(image);
    cell.append(picture);
    return cell;
  }

  cell.textContent = value;
  return cell;
}

function appendCloudRows(document, block, rows) {
  rows.forEach((cells) => {
    const row = document.createElement('div');
    cells.forEach((cellValue) => row.append(createCloudCell(document, cellValue)));
    block.append(row);
  });
}

async function createBlockFromTable(document, relativePath) {
  const { title, rows } = await loadTable(relativePath);
  const block = document.createElement('div');
  block.className = title;

  rows.forEach((rowValues) => {
    const row = document.createElement('div');
    rowValues.forEach((cellValue) => row.append(createCell(document, cellValue)));
    block.append(row);
  });

  return block;
}

test('mcx announcement, benefits, brands, and ticker blocks render their example content', async () => {
  await withFakeDom(async ({ document }) => {
    const announcementBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-announcement-bar.table.txt');
    const benefitsBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-benefits.table.txt');
    const brandsBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-brands.table.txt');
    const tickerBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-ticker.table.txt');

    const announcementSection = document.createElement('div');
    announcementSection.className = 'section';
    announcementSection.append(announcementBlock);
    document.body.append(announcementSection, benefitsBlock, brandsBlock, tickerBlock);

    const { default: decorateAnnouncement } = await import('../../blocks/mcx-announcement-bar/mcx-announcement-bar.js');
    const { default: decorateBenefits } = await import('../../blocks/mcx-benefits/mcx-benefits.js');
    const { default: decorateBrands } = await import('../../blocks/mcx-brands/mcx-brands.js');
    const { default: decorateTicker } = await import('../../blocks/mcx-ticker/mcx-ticker.js');

    decorateAnnouncement(announcementBlock);
    decorateBenefits(benefitsBlock);
    decorateBrands(brandsBlock);
    decorateTicker(tickerBlock);

    assert.equal(announcementBlock.querySelectorAll('.ann-item').length, 5);
    assert.equal(announcementBlock.querySelectorAll('.ann-dot').length, 4);
    assert.equal(announcementBlock.querySelector('.ann-close')?.textContent, '✕');
    announcementBlock.querySelector('.ann-close')?.dispatchEvent({ type: 'click' });
    assert.equal(document.body.querySelector('.mcx-announcement-bar'), null);

    assert.equal(benefitsBlock.querySelectorAll('.ben-item').length, 4);
    assert.equal(benefitsBlock.querySelector('.ben-title')?.textContent, 'Tax-Free Shopping');

    assert.equal(brandsBlock.querySelector('.brands-hd')?.textContent, 'Trusted Brands Available at Every MCX Location');
    assert.equal(brandsBlock.querySelectorAll('.brand-pill').length, 7);

    assert.equal(tickerBlock.querySelectorAll('.ticker-item').length, 12);
    assert.equal(tickerBlock.querySelector('.ticker-item b')?.textContent, 'Free Shipping');
  });
});

test('mcx category, featured collections, and editorial cards render cards and links from the example tables', async () => {
  await withFakeDom(async ({ document }) => {
    const categoryBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-category-grid.table.txt');
    const featuredBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-featured-collections.table.txt');
    const editorialBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-editorial-cards.table.txt');
    document.body.append(categoryBlock, featuredBlock, editorialBlock);

    const { default: decorateCategory } = await import('../../blocks/mcx-category-grid/mcx-category-grid.js');
    const { default: decorateFeatured } = await import('../../blocks/mcx-featured-collections/mcx-featured-collections.js');
    const { default: decorateEditorial } = await import('../../blocks/mcx-editorial-cards/mcx-editorial-cards.js');

    decorateCategory(categoryBlock);
    decorateFeatured(featuredBlock);
    decorateEditorial(editorialBlock);

    assert.equal(categoryBlock.querySelector('.sec-label')?.textContent, 'Browse the Exchange');
    assert.equal(categoryBlock.querySelector('.sec-title')?.textContent, 'SHOP YOUR WAY');
    assert.equal(categoryBlock.querySelectorAll('.cat-tile').length, 12);
    assert.equal(categoryBlock.querySelector('.view-link'), null);

    assert.equal(featuredBlock.querySelector('.sec-title')?.textContent, 'SHOP THE LOOK');
    assert.equal(featuredBlock.querySelectorAll('.feat-card').length, 3);
    assert.equal(featuredBlock.querySelectorAll('.feat-main').length, 1);
    assert.equal(featuredBlock.querySelector('.view-link')?.href, '/collections');
    assert.equal(featuredBlock.querySelector('.feat-link')?.href, '/collections/mens');

    assert.equal(editorialBlock.querySelectorAll('.ed-card').length, 3);
    assert.equal(editorialBlock.querySelector('.ed-title')?.textContent, 'Everything You Need for Inspection-Ready Dress Blues');
  });
});

test('mcx deal countdown, newsletter, and promo strip expose the authored data needed by the MCX runtime', async () => {
  await withFakeDom(async ({ document }) => {
    const countdownBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-deal-countdown.table.txt');
    const newsletterBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-newsletter.table.txt');
    const popupBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-promo-popup.table.txt');
    const promoBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-promo-strip.table.txt');
    document.body.append(countdownBlock, newsletterBlock, popupBlock, promoBlock);

    const { default: decorateCountdown } = await import('../../blocks/mcx-deal-countdown/mcx-deal-countdown.js');
    const { default: decorateNewsletter } = await import('../../blocks/mcx-newsletter/mcx-newsletter.js');
    const { default: decoratePopup } = await import('../../blocks/mcx-promo-popup/mcx-promo-popup.js');
    const { default: decoratePromo } = await import('../../blocks/mcx-promo-strip/mcx-promo-strip.js');

    const previousNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          writeText: async () => {},
        },
      },
    });

    try {
      decorateCountdown(countdownBlock);
      decorateNewsletter(newsletterBlock);
      decoratePopup(popupBlock);
      decoratePromo(promoBlock);
    } finally {
      if (previousNavigatorDescriptor) {
        Object.defineProperty(globalThis, 'navigator', previousNavigatorDescriptor);
      } else {
        delete globalThis.navigator;
      }
    }

    const strip = countdownBlock.querySelector('.deal-strip');
    assert.equal(strip?.dataset.countdownEnd, '2026-04-01T23:59:59-07:00');
    assert.equal(strip?.dataset.hideCtaWhenEnded, 'false');
    assert.equal(countdownBlock.querySelector('.btn-deal')?.href, '/deals');
    assert.equal(countdownBlock.querySelector('.deal-cta p')?.textContent, 'Do not miss out - deals expire when the timer hits zero.');

    assert.equal(newsletterBlock.querySelector('[data-mcx-newsletter]')?.tagName, 'FORM');
    assert.equal(newsletterBlock.querySelector('.btn-nl')?.textContent, 'Subscribe');
    assert.equal(newsletterBlock.querySelector('.nl-input')?.placeholder, 'Your military email address...');

    const popupOverlay = document.querySelector('.mpp-overlay');
    assert.ok(popupOverlay);
    assert.equal(popupOverlay.querySelector('.mpp-heading')?.textContent.includes('Settle In'), true);
    assert.equal(popupOverlay.querySelector('.mpp-coupon-code')?.textContent, 'SEMPERFI20');
    assert.equal(popupOverlay.querySelector('.mpp-btn-primary')?.getAttribute('href'), '/deals');
    assert.equal(popupOverlay.querySelector('.mpp-countdown')?.dataset.status, 'active');

    assert.equal(promoBlock.querySelector('.promo-title')?.textContent, 'EARN MORE, SPEND LESS');
    assert.equal(promoBlock.querySelector('.btn-promo')?.href, '/clearance');
  });
});

test('mcx product cards render the reference product grid and ignore legacy tab config rows', async () => {
  await withFakeDom(async ({ document }) => {
    const block = await createBlockFromTable(document, 'docs/mcx-examples/mcx-product-cards.table.txt');
    document.body.append(block);

    const { default: decorate } = await import('../../blocks/mcx-product-cards/mcx-product-cards.js');
    decorate(block);

    const cards = block.querySelectorAll('.prod-card');
    const firstCard = cards[0];

    assert.equal(block.querySelector('.sec-title')?.textContent, 'NEW ARRIVALS');
    assert.equal(block.querySelectorAll('.ptab').length, 0);
    assert.equal(cards.length, 8);
    assert.equal(firstCard?.dataset.cat, 'footwear');
    assert.equal(firstCard?.dataset.brand, 'Danner');
    assert.equal(firstCard?.dataset.price, '189.99');
    assert.equal(firstCard?.querySelector('.p-current')?.textContent, '$189.99');
    assert.equal(firstCard?.querySelector('.p-chip')?.textContent, 'Save $50');
    assert.equal(firstCard?.querySelector('.prod-atc')?.textContent, '+ Add to Cart');
  });
});

test('mcx product cards tolerate legacy tab rows without rendering tab UI', async () => {
  await withFakeDom(async ({ document }) => {
    const block = document.createElement('div');
    block.className = 'mcx-product-cards';

    [
      ['label', 'Curated For You', '', ''],
      ['title', 'NEW ARRIVALS', '', ''],
      ['tabs', 'All Items|all, Footwear|footwear', '', ''],
      ['default-tab', 'footwear', '', ''],
      [
        '![Tactical boot](https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=75)',
        'Danner<br>Tachyon 8 Tactical Boot GTX',
        'rating: 5<br>reviews: 248<br>price: 189.99<br>original: 239.99<br>chip: Save $50',
        'category: footwear<br>flags: New<br>emoji: 🥾<br>sizes: 8, 9, 10, 11, 12',
      ],
    ].forEach((cells) => {
      const row = document.createElement('div');
      cells.forEach((cellValue) => row.append(createCell(document, cellValue)));
      block.append(row);
    });

    document.body.append(block);

    const { default: decorate } = await import('../../blocks/mcx-product-cards/mcx-product-cards.js');
    decorate(block);

    assert.equal(block.querySelectorAll('.ptab').length, 0);
    assert.equal(block.querySelectorAll('.prod-card').length, 1);
    assert.equal(block.querySelector('.prod-card')?.dataset.cat, 'footwear');
  });
});

test('mcx blocks support cloud-authored markdown links, markdown images, and br-delimited cell content', async () => {
  await withFakeDom(async ({ document }) => {
    const heroBlock = document.createElement('div');
    heroBlock.className = 'mcx-hero';
    appendCloudRows(document, heroBlock, [
      ['eyebrow', 'Spring Collection - 2026 - Tax-Free'],
      ['heading-line-1', 'OUTFITTED'],
      ['heading-line-2', 'FOR THE'],
      ['heading-line-3', 'mission & beyond'],
      ['description', 'Serving Marines and their families since 1897. Premium brands, exclusive savings, and tax-free shopping - exclusively for those who serve.'],
      ['image', '![Marine Corps collection hero](https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80)'],
      ['primary-cta', '[Shop Now](#products)'],
      ['secondary-cta', '[View Deals](#deals)'],
      ['stat-1-value', '20%+'],
      ['stat-1-label', 'Average Savings'],
    ]);

    const productBlock = document.createElement('div');
    productBlock.className = 'mcx-product-cards';
    appendCloudRows(document, productBlock, [
      ['label', 'Curated For You', '', ''],
      ['title', 'NEW ARRIVALS', '', ''],
      ['view-link', '[View All Products](/products)', '', ''],
      [
        '![Tactical boot](https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=75)',
        ['Danner', 'Tachyon 8 Tactical Boot GTX'],
        ['rating: 5', 'reviews: 248', 'price: 189.99', 'original: 239.99', 'chip: Save $50'],
        ['category: footwear', 'flags: New', 'emoji: 🥾', 'sizes: 8, 9, 10, 11, 12'],
      ],
    ]);

    const featuredBlock = document.createElement('div');
    featuredBlock.className = 'mcx-featured-collections';
    appendCloudRows(document, featuredBlock, [
      ['label', 'Curated Collections', '', ''],
      ['title', 'SHOP THE LOOK', '', ''],
      ['view-link', '[All Collections](/collections)', '', ''],
      [
        '![Tactical collection](https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80)',
        'Spring 2026 - Men\'s',
        'TACTICAL COLLECTION',
        '[Shop Men\'s](/collections/mens)',
      ],
    ]);

    const countdownBlock = document.createElement('div');
    countdownBlock.className = 'mcx-deal-countdown';
    appendCloudRows(document, countdownBlock, [
      ['label', 'Flash Sale - Limited Time'],
      ['title', 'SPRING CLEARANCE UP TO 40% OFF'],
      ['description', 'Exclusive deals across apparel, electronics, tactical gear, and more.'],
      ['end-datetime', '2026-04-01T23:59:59-07:00'],
      ['cta', '[Shop All Deals](/deals)'],
      ['cta-note', 'Do not miss out - deals expire when the timer hits zero.'],
    ]);

    const promoBlock = document.createElement('div');
    promoBlock.className = 'mcx-promo-strip';
    appendCloudRows(document, promoBlock, [
      ['badge', 'Spring 2026 - Limited Time'],
      ['title', 'EARN MORE, SPEND LESS'],
      ['description', 'Every purchase supports Marine Corps Community Services.'],
      ['cta', '[Shop Clearance](/clearance)'],
    ]);

    document.body.append(heroBlock, productBlock, featuredBlock, countdownBlock, promoBlock);

    const { default: decorateHero } = await import('../../blocks/mcx-hero/mcx-hero.js');
    const { default: decorateProductCards } = await import('../../blocks/mcx-product-cards/mcx-product-cards.js');
    const { default: decorateFeatured } = await import('../../blocks/mcx-featured-collections/mcx-featured-collections.js');
    const { default: decorateCountdown } = await import('../../blocks/mcx-deal-countdown/mcx-deal-countdown.js');
    const { default: decoratePromo } = await import('../../blocks/mcx-promo-strip/mcx-promo-strip.js');

    decorateHero(heroBlock);
    decorateProductCards(productBlock);
    decorateFeatured(featuredBlock);
    decorateCountdown(countdownBlock);
    decoratePromo(promoBlock);

    assert.equal(heroBlock.querySelector('.hero-photo img')?.getAttribute('src'), 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80');
    assert.equal(heroBlock.querySelector('.btn-hero')?.getAttribute('href'), '#products');

    const productCard = productBlock.querySelector('.prod-card');
    assert.equal(productCard?.querySelector('.prod-img img')?.getAttribute('src'), 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=75');
    assert.equal(productCard?.dataset.brand, 'Danner');
    assert.equal(productCard?.dataset.price, '189.99');
    assert.equal(productCard?.querySelector('.prod-name')?.textContent, 'Tachyon 8 Tactical Boot GTX');

    assert.equal(featuredBlock.querySelector('.feat-card picture img')?.getAttribute('src'), 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80');
    assert.equal(featuredBlock.querySelector('.feat-link')?.getAttribute('href'), '/collections/mens');
    assert.equal(countdownBlock.querySelector('.btn-deal')?.getAttribute('href'), '/deals');
    assert.equal(promoBlock.querySelector('.btn-promo')?.getAttribute('href'), '/clearance');
  });
});

test('mcx category grid and ticker support cloud-authored picture icons and split ticker cells', async () => {
  await withFakeDom(async ({ document }) => {
    const categoryBlock = document.createElement('div');
    categoryBlock.className = 'mcx-category-grid';
    appendCloudRows(document, categoryBlock, [
      ['label', 'Browse the Exchange', '', ''],
      ['title', 'SHOP YOUR WAY', '', ''],
      [
        {
          type: 'picture',
          src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=75',
          alt: 'Apparel',
        },
        'Apparel',
        '2,400+ items',
        '[Shop Apparel](/apparel)',
      ],
    ]);

    const tickerBlock = document.createElement('div');
    tickerBlock.className = 'mcx-ticker';
    appendCloudRows(document, tickerBlock, [
      ['Free Shipping', 'on $50+'],
      ['Tax-Free', 'Shopping'],
    ]);

    document.body.append(categoryBlock, tickerBlock);

    const { default: decorateCategory } = await import('../../blocks/mcx-category-grid/mcx-category-grid.js');
    const { default: decorateTicker } = await import('../../blocks/mcx-ticker/mcx-ticker.js');

    decorateCategory(categoryBlock);
    decorateTicker(tickerBlock);

    assert.equal(categoryBlock.querySelector('.cat-emoji picture img')?.getAttribute('src'), 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=75');
    assert.equal(categoryBlock.querySelector('.cat-tile')?.getAttribute('href'), '/apparel');
    assert.equal(tickerBlock.querySelectorAll('.ticker-item').length, 4);
    assert.equal(tickerBlock.querySelector('.ticker-item')?.textContent.includes('on $50+'), true);
  });
});

test('mcx header renders the nav fragment into the shell block', async () => {
  await withFakeDom(async ({
    document,
    fetchCalls,
    setFetchImplementation,
  }) => {
    const navHtml = await readFile(resolve(repoRoot, 'fragments/mcx-nav.plain.html'), 'utf8');
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);
    appendMeta(document, 'nav', '/fragments/mcx-nav');

    setFetchImplementation(async () => ({
      ok: true,
      text: async () => navHtml,
    }));

    const { default: decorate } = await import('../../blocks/mcx-header/mcx-header.js');
    await decorate(block);

    assert.equal(fetchCalls[0]?.[0], '/fragments/mcx-nav.plain.html');
    assert.equal(block.querySelector('.logo-mcx')?.textContent, 'MCX');
    assert.equal(block.querySelector('.store-switcher-toggle-label')?.textContent, 'aistore');
    assert.equal(block.querySelector('.hdr-signin-label')?.textContent, 'Sign In');
    assert.equal(block.querySelector('.nav-hot')?.textContent, 'Deals & Offers');
    assert.equal(block.querySelectorAll('.nav-item').length, 7);
    assert.equal(block.querySelectorAll('.mega-col').length >= 3, true);
    assert.equal(block.querySelector('[data-mcx-cart-count]')?.closest('a')?.href, '/cart');
  });
});

test('mcx footer renders the footer fragment into the shell block', async () => {
  await withFakeDom(async ({
    document,
    fetchCalls,
    setFetchImplementation,
  }) => {
    const footerHtml = await readFile(resolve(repoRoot, 'fragments/mcx-footer.plain.html'), 'utf8');
    const block = document.createElement('div');
    block.className = 'mcx-footer';
    document.body.append(block);
    appendMeta(document, 'footer', '/fragments/mcx-footer');

    setFetchImplementation(async () => ({
      ok: true,
      text: async () => footerHtml,
    }));

    const { default: decorate } = await import('../../blocks/mcx-footer/mcx-footer.js');
    await decorate(block);

    assert.equal(fetchCalls[0]?.[0], '/fragments/mcx-footer.plain.html');
    assert.equal(block.querySelector('.logo-mcx')?.textContent, 'MCX');
    assert.equal(block.querySelectorAll('.foot-col').length, 4);
    assert.equal(block.querySelectorAll('.soc').length, 4);
    assert.equal(block.querySelector('.foot-flag')?.textContent, 'USA Proudly Serving Since 1897');
    assert.equal(block.querySelector('.foot-legal a')?.href, '/privacy');
  });
});
