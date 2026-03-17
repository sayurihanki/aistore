/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import initMcxUi from '../../scripts/mcx-ui.js';
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

test('initMcxUi wires search, cart badge updates, wishlist, and newsletter feedback on MCX pages', async () => {
  await withFakeDom(async ({
    document,
    setFetchImplementation,
  }) => {
    document.body.classList.add('mcx');

    const headerHost = document.createElement('header');
    const headerBlock = document.createElement('div');
    headerBlock.className = 'mcx-header';
    headerHost.append(headerBlock);
    document.body.append(headerHost);

    const main = document.createElement('main');
    const productBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-product-cards.table.txt');
    const newsletterBlock = await createBlockFromTable(document, 'docs/mcx-examples/mcx-newsletter.table.txt');
    main.append(productBlock, newsletterBlock);
    document.body.append(main);

    const navHtml = await readFile(resolve(repoRoot, 'fragments/mcx-nav.plain.html'), 'utf8');
    appendMeta(document, 'nav', '/fragments/mcx-nav');
    setFetchImplementation(async (url) => ({
      ok: String(url).includes('/fragments/mcx-nav'),
      text: async () => navHtml,
    }));

    const { default: decorateHeader } = await import('../../blocks/mcx-header/mcx-header.js');
    const { default: decorateProducts } = await import('../../blocks/mcx-product-cards/mcx-product-cards.js');
    const { default: decorateNewsletter } = await import('../../blocks/mcx-newsletter/mcx-newsletter.js');

    await decorateHeader(headerBlock);
    decorateProducts(productBlock);
    decorateNewsletter(newsletterBlock);

    initMcxUi();

    const cartCount = document.querySelector('[data-mcx-cart-count]');
    assert.equal(cartCount?.textContent, '3');
    assert.equal(document.querySelector('.cart-drawer'), null);
    assert.equal(document.querySelector('.modal-bg'), null);

    const drawer = document.querySelector('.cart-drawer');
    assert.equal(drawer, null);

    const searchInput = document.querySelector('[data-mcx-search-input]');
    let prevented = false;
    document.dispatchEvent({
      type: 'keydown',
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    assert.equal(document.activeElement, searchInput);
    assert.equal(searchInput.closest('.hdr-search')?.classList.contains('expanded'), true);

    const wishlistButton = document.querySelector('.prod-love');
    document.dispatchEvent({ type: 'click', target: wishlistButton, preventDefault() {} });
    assert.equal(wishlistButton?.classList.contains('loved'), true);

    const addToCartButton = document.querySelector('.prod-atc');
    document.dispatchEvent({ type: 'click', target: addToCartButton, preventDefault() {} });
    assert.equal(document.querySelector('[data-mcx-cart-count]')?.textContent, '4');
    assert.equal(addToCartButton?.classList.contains('is-added'), true);
    assert.equal(addToCartButton?.textContent, '✓ Added!');

    const newsletterInput = document.querySelector('.nl-input');
    newsletterInput.value = 'marine@example.com';
    const form = document.querySelector('[data-mcx-newsletter]');
    form.dispatchEvent({
      type: 'submit',
      target: form,
      preventDefault() {},
    });
    assert.equal(newsletterInput.value, '');
    const toastTitles = [...document.querySelectorAll('#mcx-toast-stack .t-title')]
      .map((node) => node.textContent);
    assert.equal(toastTitles.includes('Saved to Wishlist ♥'), true);
    assert.equal(toastTitles.includes('Added to Cart!'), true);
    assert.equal(toastTitles.includes('Subscribed!'), true);
  }, {
    window: {
      matchMedia: (query) => ({
        matches: query.includes('pointer: coarse'),
      }),
      setTimeout: () => 1,
    },
  });
});
