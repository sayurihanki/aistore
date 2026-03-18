/* eslint-env node */
/* global globalThis */
/* eslint-disable max-classes-per-file, class-methods-use-this */
import test from 'node:test';
import assert from 'node:assert/strict';

import decorate from '../../blocks/promo-popup/promo-popup.js';

class FakeEventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, listener, options = {}) {
    const listeners = this._listeners.get(type) || [];
    listeners.push({ listener, once: Boolean(options?.once) });
    this._listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this._listeners.get(type) || [];
    this._listeners.set(type, listeners.filter((entry) => entry.listener !== listener));
  }

  dispatchEvent(event) {
    const evt = event;
    evt.target ??= this;
    const listeners = [...(this._listeners.get(evt.type) || [])];
    listeners.forEach(({ listener, once }) => {
      listener(evt);
      if (once) this.removeEventListener(evt.type, listener);
    });
  }
}

class FakeTextNode {
  constructor(text) {
    this.textContent = text;
    this.parentNode = null;
  }
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = value;
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  add(...tokens) {
    const classes = new Set(this.element.className.split(/\s+/).filter(Boolean));
    tokens.forEach((token) => classes.add(token));
    this.element.className = [...classes].join(' ');
  }

  remove(...tokens) {
    const classes = new Set(this.element.className.split(/\s+/).filter(Boolean));
    tokens.forEach((token) => classes.delete(token));
    this.element.className = [...classes].join(' ');
  }

  contains(token) {
    return this.element.className.split(/\s+/).filter(Boolean).includes(token);
  }
}

function matchesSelector(element, selector) {
  const normalized = selector.trim();

  if (!normalized) return false;
  if (normalized.startsWith('.')) {
    return element.classList.contains(normalized.slice(1));
  }

  if (/^[a-z]+\[href\]$/i.test(normalized)) {
    const tagName = normalized.replace(/\[href\]/i, '').toUpperCase();
    return element.tagName === tagName && element.getAttribute('href') !== null;
  }

  return element.tagName === normalized.toUpperCase();
}

class FakeElement extends FakeEventTarget {
  constructor(tagName, ownerDocument) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.className = '';
    this.dataset = {};
    this.attributes = new Map();
    this.style = new FakeStyle();
    this.classList = new FakeClassList(this);
    this.hidden = false;
    this.disabled = false;
    this._children = [];
    this._textContent = '';
    this._innerHTML = '';
  }

  get children() {
    return this._children.filter((child) => child instanceof FakeElement);
  }

  get childNodes() {
    return [...this._children];
  }

  get textContent() {
    if (this._children.length) {
      return this._children.map((child) => child.textContent || '').join('');
    }

    return this._textContent;
  }

  set textContent(value) {
    this._children = [];
    this._innerHTML = '';
    this._textContent = value;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._children = [];
    this._textContent = '';
    this._innerHTML = value;
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

  remove() {
    this.parentNode?.removeChild(this);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'class') this.className = String(value);
    if (name.startsWith('data-')) {
      const key = name
        .slice(5)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map((entry) => entry.trim()).filter(Boolean);
    const matches = [];

    const walk = (node) => {
      node.children.forEach((child) => {
        if (selectors.some((entry) => matchesSelector(child, entry))) {
          matches.push(child);
        }
        walk(child);
      });
    };

    walk(this);
    return matches;
  }
}

class FakeStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.body = new FakeElement('body', this);
    this.activeElement = null;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(text) {
    return new FakeTextNode(text);
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector) {
    if (selector === 'body') return [this.body];
    return this.body.querySelectorAll(selector);
  }
}

class FakeWindow extends FakeEventTarget {
  constructor(document) {
    super();
    this.document = document;
    this.innerHeight = 900;
    this.scrollY = 0;
  }

  matchMedia() {
    return { matches: false };
  }
}

function createCell(document, text, { html = null } = {}) {
  const cell = document.createElement('div');
  const paragraph = document.createElement('p');

  if (html !== null) {
    cell.innerHTML = html;
  } else {
    paragraph.textContent = text;
    cell.appendChild(paragraph);
  }

  return cell;
}

function createPromoRow(document, label, description, href) {
  const row = document.createElement('div');
  row.append(
    createCell(document, label),
    createCell(document, '', { html: description }),
    createCell(document, href),
  );
  return row;
}

function createPromoBlock(document, dataset = {}) {
  const block = document.createElement('div');
  block.className = 'promo-popup';
  Object.assign(block.dataset, dataset);
  block.append(
    createPromoRow(document, '10% Off', 'Use code <strong>SAVE10</strong>', '/checkout'),
    createPromoRow(document, 'Free Ship', 'Free shipping on orders over $50', '/shipping'),
  );
  return block;
}

function withFakeDom(fn) {
  const document = new FakeDocument();
  const window = new FakeWindow(document);
  const globals = {
    document: globalThis.document,
    window: globalThis.window,
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    setTimeout: globalThis.setTimeout,
  };

  globalThis.document = document;
  globalThis.window = window;
  globalThis.localStorage = new FakeStorage();
  globalThis.sessionStorage = new FakeStorage();
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.setTimeout = (callback) => {
    callback();
    return 1;
  };

  try {
    fn({ document, window });
  } finally {
    globalThis.document = globals.document;
    globalThis.window = globals.window;
    globalThis.localStorage = globals.localStorage;
    globalThis.sessionStorage = globals.sessionStorage;
    globalThis.requestAnimationFrame = globals.requestAnimationFrame;
    globalThis.setTimeout = globals.setTimeout;
  }
}

test('decorate renders the popup immediately and applies theme/orb settings', () => {
  withFakeDom(({ document }) => {
    const block = createPromoBlock(document, {
      trigger: 'immediate',
      storageDuration: 'never',
      showOrbBg: 'true',
      showConfetti: 'false',
      theme: 'sunset',
      spinButtonText: 'Spin It',
    });

    document.body.appendChild(block);

    decorate(block);

    const overlay = document.body.querySelector('.pp-overlay');
    const orbField = overlay.querySelector('.pp-orb-field');
    const spinButton = overlay.querySelector('.pp-spin-btn');

    assert.ok(overlay);
    assert.equal(overlay.classList.contains('pp-overlay--visible'), true);
    assert.equal(document.body.classList.contains('pp-no-scroll'), true);
    assert.ok(orbField);
    assert.equal(overlay.style['--pp-accent'], '#dd6b20');
    assert.equal(overlay.style['--pp-accent-light'], '#fb923c');
    assert.equal(spinButton.textContent, 'Spin It');
  });
});

test('spin flow reveals a result and close cleanup removes the overlay', () => {
  withFakeDom(({ document }) => {
    const block = createPromoBlock(document, {
      trigger: 'immediate',
      storageDuration: 'never',
      showOrbBg: 'false',
      showConfetti: 'false',
    });

    document.body.appendChild(block);
    decorate(block);

    const overlay = document.body.querySelector('.pp-overlay');
    const spinButton = overlay.querySelector('.pp-spin-btn');
    const wheel = overlay.querySelector('.pp-wheel');
    const resultArea = overlay.querySelector('.pp-result');
    const noThanks = overlay.querySelector('.pp-no-thanks');

    const originalRandom = Math.random;
    Math.random = () => 0;

    spinButton.dispatchEvent({ type: 'click' });
    wheel.dispatchEvent({ type: 'transitionend' });

    Math.random = originalRandom;

    assert.equal(spinButton.disabled, true);
    assert.equal(spinButton.style.display, 'none');
    assert.equal(resultArea.classList.contains('pp-result--visible'), true);
    assert.match(resultArea.innerHTML, /10% Off/);
    assert.equal(noThanks.textContent, 'Close');

    noThanks.dispatchEvent({ type: 'click' });
    overlay.dispatchEvent({ type: 'animationend' });

    assert.equal(document.body.querySelector('.pp-overlay'), null);
    assert.equal(document.body.classList.contains('pp-no-scroll'), false);
  });
});
