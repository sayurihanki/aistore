import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const blocksRoot = resolve(repoRoot, 'blocks');

const MCX_BLOCKS = [
  'mcx-announcement-bar',
  'mcx-benefits',
  'mcx-brands',
  'mcx-category-grid',
  'mcx-category-page',
  'mcx-deal-countdown',
  'mcx-editorial-cards',
  'mcx-featured-collections',
  'mcx-footer',
  'mcx-header',
  'mcx-hero',
  'mcx-hero-newcomer',
  'mcx-newsletter',
  'mcx-promo-popup',
  'mcx-product-cards',
  'mcx-promo-strip',
  'mcx-ticker',
];

function splitTableRow(line) {
  const cells = line.split(/\s\|\s/).map((cell) => cell.trim());
  if (/\s\|\s*$/.test(line)) cells.push('');
  return cells;
}

async function loadText(relativePath) {
  return readFile(resolve(repoRoot, relativePath), 'utf8');
}

async function loadTable(relativePath) {
  const text = await loadText(relativePath);
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: lines[0],
    rows: lines.slice(1).map(splitTableRow),
  };
}

function hasField(rows, key) {
  return rows.some((row) => row[0] === key);
}

function findValue(rows, key) {
  return rows.find((row) => row[0] === key)?.[1];
}

test('all MCX block directories have detailed README coverage', async () => {
  const blockDirs = (await readdir(blocksRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('mcx-'))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(blockDirs, [...MCX_BLOCKS].sort());

  await Promise.all(MCX_BLOCKS.map(async (blockName) => {
    const readmePath = resolve(blocksRoot, blockName, 'README.md');
    await access(readmePath);
    const readme = await readFile(readmePath, 'utf8');

    assert.match(readme, /^# /m, `${blockName} README should have a title`);
    assert.match(readme, /^## Overview$/m, `${blockName} README should have an Overview section`);
    assert.match(readme, /^## Live Example$/m, `${blockName} README should have a Live Example section`);
    assert.match(readme, /^## Authoring Shape$/m, `${blockName} README should have an Authoring Shape section`);
    assert.match(readme, /^## DA Library Metadata Table$/m, `${blockName} README should have a DA Library Metadata Table section`);
    assert.ok(readme.length > 900, `${blockName} README should be detailed enough to guide authors`);
  }));
});

test('MCX homepage metadata example points to the expected shell fragments', async () => {
  const { title, rows } = await loadTable('docs/mcx-examples/index-metadata.table.txt');

  assert.equal(title, 'metadata');
  assert.equal(findValue(rows, 'template'), 'mcx-home');
  assert.equal(findValue(rows, 'theme'), 'mcx');
  assert.equal(findValue(rows, 'nav'), '/fragments/mcx-nav');
  assert.equal(findValue(rows, 'footer'), '/fragments/mcx-footer');
});

test('MCX announcement bar example uses message rows plus optional dismissible config', async () => {
  const { title, rows } = await loadTable('docs/mcx-examples/mcx-announcement-bar.table.txt');

  assert.equal(title, 'mcx-announcement-bar');
  assert.ok(rows.every((row) => row.length === 1 || row.length === 2));
  assert.ok(rows.some((row) => row[0] === 'dismissible' && row[1] === 'true'));
  assert.ok(rows.some((row) => row[0] !== 'dismissible'));
});

test('MCX benefits and brands examples keep their expected simple shapes', async () => {
  const benefits = await loadTable('docs/mcx-examples/mcx-benefits.table.txt');
  const brands = await loadTable('docs/mcx-examples/mcx-brands.table.txt');

  assert.equal(benefits.title, 'mcx-benefits');
  assert.ok(benefits.rows.length >= 4);
  assert.ok(benefits.rows.every((row) => row.length === 3));

  assert.equal(brands.title, 'mcx-brands');
  assert.ok(brands.rows.length >= 4);
  assert.ok(brands.rows.every((row) => row.length === 1));
});

test('MCX category, featured collection, and editorial examples match their card and grid contracts', async () => {
  const category = await loadTable('docs/mcx-examples/mcx-category-grid.table.txt');
  const featured = await loadTable('docs/mcx-examples/mcx-featured-collections.table.txt');
  const editorial = await loadTable('docs/mcx-examples/mcx-editorial-cards.table.txt');

  assert.equal(category.title, 'mcx-category-grid');
  assert.ok(hasField(category.rows, 'label'));
  assert.ok(hasField(category.rows, 'title'));
  category.rows.filter((row) => !['label', 'title', 'view-link'].includes(row[0])).forEach((row) => {
    assert.equal(row.length, 4);
    assert.match(row[3], /^\[.+\]\(.+\)$/);
  });

  assert.equal(featured.title, 'mcx-featured-collections');
  assert.ok(hasField(featured.rows, 'label'));
  assert.ok(hasField(featured.rows, 'title'));
  assert.ok(hasField(featured.rows, 'view-link'));
  const featuredCards = featured.rows.filter((row) => !['label', 'title', 'view-link'].includes(row[0]));
  assert.equal(featuredCards.length, 3);
  featuredCards.forEach((row) => assert.equal(row.length, 4));

  assert.equal(editorial.title, 'mcx-editorial-cards');
  assert.ok(editorial.rows.length >= 3);
  editorial.rows.forEach((row) => assert.equal(row.length, 4));
});

test('MCX hero, deal countdown, newsletter, popup, and promo examples include required field rows', async () => {
  const hero = await loadTable('docs/mcx-examples/mcx-hero.table.txt');
  const countdown = await loadTable('docs/mcx-examples/mcx-deal-countdown.table.txt');
  const newsletter = await loadTable('docs/mcx-examples/mcx-newsletter.table.txt');
  const popup = await loadTable('docs/mcx-examples/mcx-promo-popup.table.txt');
  const promo = await loadTable('docs/mcx-examples/mcx-promo-strip.table.txt');

  assert.equal(hero.title, 'mcx-hero');
  [
    'eyebrow',
    'heading-line-1',
    'heading-line-2',
    'heading-line-3',
    'description',
    'image',
    'primary-cta',
    'secondary-cta',
  ].forEach((field) => assert.ok(hasField(hero.rows, field), `hero example is missing ${field}`));
  assert.ok(hero.rows.every((row) => row.length === 2));
  assert.equal(hero.rows.some((row) => row[0].startsWith('status-badge-')), false);

  assert.equal(countdown.title, 'mcx-deal-countdown');
  ['label', 'title', 'description', 'end-datetime', 'cta'].forEach((field) => {
    assert.ok(hasField(countdown.rows, field), `countdown example is missing ${field}`);
  });
  assert.ok(countdown.rows.every((row) => row.length === 2));

  assert.equal(newsletter.title, 'mcx-newsletter');
  ['label', 'title', 'description', 'placeholder'].forEach((field) => {
    assert.ok(hasField(newsletter.rows, field), `newsletter example is missing ${field}`);
  });
  assert.ok(newsletter.rows.every((row) => row.length === 2));

  assert.equal(popup.title, 'mcx-promo-popup');
  [
    'campaign-id',
    'eyebrow',
    'heading-line-1',
    'heading-line-2',
    'description',
    'badge-value',
    'offer-1-value',
    'offer-1-label',
    'offer-2-value',
    'offer-2-label',
    'offer-3-value',
    'offer-3-label',
    'end-datetime',
    'coupon-code',
    'primary-cta',
    'secondary-cta',
    'fine-print',
  ].forEach((field) => {
    assert.ok(hasField(popup.rows, field), `popup example is missing ${field}`);
  });
  assert.ok(popup.rows.every((row) => row.length === 2));

  assert.equal(promo.title, 'mcx-promo-strip');
  ['badge', 'title', 'description', 'cta'].forEach((field) => {
    assert.ok(hasField(promo.rows, field), `promo example is missing ${field}`);
  });
  assert.ok(promo.rows.every((row) => row.length === 2));
});

test('MCX product cards example keeps config rows and product row key-value cells aligned', async () => {
  const { title, rows } = await loadTable('docs/mcx-examples/mcx-product-cards.table.txt');

  assert.equal(title, 'mcx-product-cards');
  ['label', 'title', 'view-link'].forEach((field) => {
    assert.ok(hasField(rows, field), `product cards example is missing ${field}`);
  });
  assert.equal(hasField(rows, 'tabs'), false);
  assert.equal(hasField(rows, 'default-tab'), false);

  const productRows = rows.filter((row) => !['label', 'title', 'view-link'].includes(row[0]));
  assert.ok(productRows.length >= 4);
  productRows.forEach((row) => {
    assert.equal(row.length, 4);
    assert.match(row[2], /price:/);
    assert.match(row[3], /category:/);
  });
});

test('MCX ticker example uses one-column rows and emphasis splits', async () => {
  const { title, rows } = await loadTable('docs/mcx-examples/mcx-ticker.table.txt');

  assert.equal(title, 'mcx-ticker');
  assert.ok(rows.length >= 4);
  assert.ok(rows.every((row) => row.length === 1));
  assert.ok(rows.some((row) => row[0].includes('|')));
});

test('MCX shell fragment examples cover the supported row types', async () => {
  const nav = await loadTable('docs/mcx-examples/mcx-nav.fragment.table.txt');
  const footer = await loadTable('docs/mcx-examples/mcx-footer.fragment.table.txt');

  assert.equal(nav.title, 'mcx-nav-data');
  assert.ok(nav.rows.every((row) => row.length === 4));
  ['config', 'hot', 'item', 'group', 'link', 'feature'].forEach((rowType) => {
    assert.ok(nav.rows.some((row) => row[0] === rowType), `nav fragment is missing ${rowType} rows`);
  });

  assert.equal(footer.title, 'mcx-footer-data');
  assert.ok(footer.rows.every((row) => row.length === 4));
  ['config', 'social', 'column', 'legal'].forEach((rowType) => {
    assert.ok(footer.rows.some((row) => row[0] === rowType), `footer fragment is missing ${rowType} rows`);
  });
});
