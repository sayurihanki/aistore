/* eslint-disable max-classes-per-file, class-methods-use-this */
import test from 'node:test';
import assert from 'node:assert/strict';

import decorate, { parseFullDetailsRows } from '../../blocks/accordion/accordion.js';

class FakeTextNode {
  constructor(text) {
    this.textContent = text;
    this.parentNode = null;
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  contains(name) {
    return this.element.className.split(/\s+/).filter(Boolean).includes(name);
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.className = '';
    this.parentNode = null;
    this._children = [];
    this._listeners = new Map();
    this._open = false;
    this.classList = new FakeClassList(this);
  }

  get children() {
    return this._children.filter((child) => child instanceof FakeElement);
  }

  get childNodes() {
    return [...this._children];
  }

  get open() {
    return this._open;
  }

  set open(value) {
    const next = Boolean(value);
    const changed = this._open !== next;
    this._open = next;

    if (changed) {
      this.dispatchEvent({ type: 'toggle', target: this });
    }
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }

    this._children.push(node);
    node.parentNode = this;

    return node;
  }

  removeChild(node) {
    const index = this._children.indexOf(node);

    if (index >= 0) {
      this._children.splice(index, 1);
      node.parentNode = null;
    }

    return node;
  }

  replaceWith(node) {
    if (!this.parentNode) return;

    const siblings = this.parentNode._children;
    const index = siblings.indexOf(this);

    if (index === -1) return;

    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }

    siblings.splice(index, 1, node);
    node.parentNode = this.parentNode;
    this.parentNode = null;
  }

  addEventListener(type, listener) {
    const listeners = this._listeners.get(type) || [];
    listeners.push(listener);
    this._listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    const listeners = this._listeners.get(event.type) || [];
    listeners.forEach((listener) => listener(event));
  }
}

class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(text) {
    return new FakeTextNode(text);
  }
}

function createRow(doc, summaryText, bodyText) {
  const row = doc.createElement('div');
  const label = doc.createElement('div');
  const body = doc.createElement('div');

  label.append(doc.createTextNode(summaryText));
  body.append(doc.createTextNode(bodyText));
  row.append(label, body);

  return row;
}

function createBlock({ singleOpen = false } = {}) {
  const doc = new FakeDocument();
  const block = doc.createElement('div');
  block.className = singleOpen ? 'accordion single-open' : 'accordion';

  block.append(
    createRow(doc, 'Dimensions & Physical', 'External height and width'),
    createRow(doc, 'Power & Electrical', 'Managed PDU and input voltage'),
  );

  return block;
}

test('decorate converts authored rows into semantic accordion items', () => {
  const block = createBlock();

  decorate(block);

  const firstItem = block.children[0];
  const [summary, body] = firstItem.children;

  assert.equal(firstItem.tagName, 'DETAILS');
  assert.equal(firstItem.className, 'accordion-item');
  assert.equal(summary.tagName, 'SUMMARY');
  assert.equal(summary.className, 'accordion-item-label');
  assert.equal(summary.childNodes[0].textContent, 'Dimensions & Physical');
  assert.equal(body.className, 'accordion-item-body');
  assert.equal(body.childNodes[0].textContent, 'External height and width');
});

test('default accordion keeps multi-open behavior', () => {
  const block = createBlock();

  decorate(block);

  const [firstItem, secondItem] = block.children;
  firstItem.open = true;
  secondItem.open = true;

  assert.equal(firstItem.open, true);
  assert.equal(secondItem.open, true);
});

test('single-open accordion closes sibling items when a new item opens', () => {
  const block = createBlock({ singleOpen: true });

  decorate(block);

  const [firstItem, secondItem] = block.children;
  firstItem.open = true;
  secondItem.open = true;

  assert.equal(firstItem.open, false);
  assert.equal(secondItem.open, true);
});

test('single-open accordion still allows the active item to collapse', () => {
  const block = createBlock({ singleOpen: true });

  decorate(block);

  const [firstItem] = block.children;
  firstItem.open = true;
  firstItem.open = false;

  assert.equal(firstItem.open, false);
});

test('parseFullDetailsRows converts simple full-details lines into label/value rows', () => {
  const rows = parseFullDetailsRows(`
    External Height: 2,000 mm (78.7")<br>
    External Width: 600 mm (23.6")<br>
    External Depth: 1,000 mm (39.4")
  `);

  assert.deepEqual(rows, [
    ['External Height', '2,000 mm (78.7")'],
    ['External Width', '600 mm (23.6")'],
    ['External Depth', '1,000 mm (39.4")'],
  ]);
});

test('parseFullDetailsRows handles escaped Docs-style line breaks', () => {
  const rows = parseFullDetailsRows(
    'External Height: 2,000 mm (78.7")&lt;br&gt;External Width: 600 mm (23.6")',
  );

  assert.deepEqual(rows, [
    ['External Height', '2,000 mm (78.7")'],
    ['External Width', '600 mm (23.6")'],
  ]);
});
