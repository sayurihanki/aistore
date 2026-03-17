/* eslint-env node */
/* global globalThis */
/* eslint-disable max-classes-per-file, class-methods-use-this */
import test from 'node:test';
import assert from 'node:assert/strict';

import decorate from '../../blocks/form-mccs-preferences-next/form-mccs-preferences-next.js';

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const existing = this.listeners.get(type) || [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  dispatchEvent(event) {
    const evt = event;
    evt.target ??= this;
    (this.listeners.get(evt.type) || []).forEach((listener) => listener(evt));
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

  toggle(token, force) {
    if (force === true) {
      this.add(token);
      return true;
    }

    if (force === false) {
      this.remove(token);
      return false;
    }

    if (this.contains(token)) {
      this.remove(token);
      return false;
    }

    this.add(token);
    return true;
  }

  contains(token) {
    return this.element.className.split(/\s+/).filter(Boolean).includes(token);
  }
}

function matchesSelector(element, selector) {
  const normalized = selector.trim();

  if (!normalized) return false;
  if (normalized.startsWith('#')) return element.id === normalized.slice(1);
  if (normalized.startsWith('.')) return element.classList.contains(normalized.slice(1));
  return element.tagName === normalized.toUpperCase();
}

class FakeElement extends FakeEventTarget {
  constructor(tagName, ownerDocument) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.className = '';
    this.id = '';
    this.value = '';
    this.name = '';
    this.type = '';
    this.placeholder = '';
    this.disabled = false;
    this.required = false;
    this.checked = false;
    this.rows = 0;
    this.maxLength = undefined;
    this.href = '';
    this.style = new FakeStyle();
    this.classList = new FakeClassList(this);
    this.attributes = new Map();
    this.childNodes = [];
    this._textContent = '';
  }

  get children() {
    return this.childNodes.filter((child) => child instanceof FakeElement);
  }

  get textContent() {
    if (this.childNodes.length) {
      return this.childNodes.map((child) => child.textContent || '').join('');
    }
    return this._textContent;
  }

  set textContent(value) {
    this.childNodes = [];
    this._textContent = value;
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    const child = typeof node === 'string' ? new FakeTextNode(node) : node;
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
  }

  getAttribute(name) {
    if (name === 'id') return this.id;
    if (name === 'class') return this.className;
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map((entry) => entry.trim()).filter(Boolean);
    const results = [];

    const walk = (node) => {
      node.children.forEach((child) => {
        if (selectors.some((entry) => matchesSelector(child, entry))) {
          results.push(child);
        }
        walk(child);
      });
    };

    walk(this);
    return results;
  }

  focus() {
    this.ownerDocument.activeElement = this;
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

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.body.querySelectorAll(selector);
  }
}

class FakeWindow extends FakeEventTarget {
  constructor(document) {
    super();
    this.document = document;
    this.location = { href: '' };
  }
}

function createRow(document, text) {
  const row = document.createElement('div');
  row.textContent = text;
  return row;
}

function createLinkRow(document, href) {
  const row = document.createElement('div');
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = href;
  row.append(anchor);
  return row;
}

function createBlock(document, redirectUrl = '') {
  const block = document.createElement('div');
  block.className = 'form-mccs-preferences-next';
  block.append(
    createRow(document, 'Personalize\nyour MCCS experience'),
    createRow(document, 'Tailor MCCS recommendations around military life, shopping, and communication preferences.'),
    redirectUrl ? createLinkRow(document, redirectUrl) : document.createElement('div'),
  );
  return block;
}

async function withFakeDom(fn) {
  const document = new FakeDocument();
  const window = new FakeWindow(document);
  const globals = {
    document: globalThis.document,
    window: globalThis.window,
    setTimeout: globalThis.setTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };

  globalThis.document = document;
  globalThis.window = window;
  globalThis.setTimeout = (callback) => {
    callback();
    return 1;
  };
  globalThis.setInterval = () => 1;
  globalThis.clearInterval = () => {};

  try {
    await fn({ document, window });
  } finally {
    globalThis.document = globals.document;
    globalThis.window = globals.window;
    globalThis.setTimeout = globals.setTimeout;
    globalThis.setInterval = globals.setInterval;
    globalThis.clearInterval = globals.clearInterval;
  }
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}

test('decorate renders the tactical MCCS block and enforces validation', async () => {
  await withFakeDom(async ({ document }) => {
    const block = createBlock(document);
    document.body.appendChild(block);

    decorate(block);

    assert.equal(block.querySelectorAll('.mpn-step-panel').length, 3);
    assert.equal(block.querySelector('#mpn-step-1').classList.contains('is-active'), true);
    assert.equal(block.querySelector('.mpn-title-accent').textContent, 'your MCCS experience');

    block.querySelector('#mpn-next-1').dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('#mpn-msg-service-status').textContent, 'Please select your service status.');
    assert.equal(block.querySelector('#mpn-msg-installation').textContent, 'Please select your primary installation.');

    const serviceStatus = block.querySelector('#mpn-service-status-0');
    const installation = block.querySelector('#mpn-installation');
    serviceStatus.checked = true;
    serviceStatus.dispatchEvent({ type: 'change' });
    installation.value = 'camp_pendleton';
    installation.dispatchEvent({ type: 'change' });

    block.querySelector('#mpn-next-1').dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('#mpn-step-2').classList.contains('is-active'), true);
    assert.equal(block.querySelector('#mpn-progress-1').classList.contains('is-complete'), true);

    block.querySelector('#mpn-next-2').dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('#mpn-step-3').classList.contains('is-active'), true);

    block.querySelector('#mpn-submit').dispatchEvent({ type: 'click' });

    assert.equal(block.querySelector('#mpn-msg-channels').textContent, 'Please choose at least one preferred channel.');
    assert.equal(block.querySelector('#mpn-msg-consent').textContent, 'Please accept to continue.');

    const channel = block.querySelector('#mpn-channels-0');
    const consent = block.querySelector('#mpn-consent');
    channel.checked = true;
    channel.dispatchEvent({ type: 'change' });
    consent.checked = true;
    consent.dispatchEvent({ type: 'change' });

    block.querySelector('#mpn-submit').dispatchEvent({ type: 'click' });
    await flushAsyncWork();

    assert.equal(block.querySelector('.mpn-panels').style.display, 'none');
    assert.equal(block.querySelector('.mpn-success__title').textContent, 'Preferences saved');
    assert.equal(block.querySelectorAll('.mpn-success__chip').length, 5);
  });
});

test('success state exposes redirect affordance when a redirect URL is authored', async () => {
  await withFakeDom(async ({ document, window }) => {
    const block = createBlock(document, 'https://example.com/thank-you');
    document.body.appendChild(block);

    decorate(block);

    const serviceStatus = block.querySelector('#mpn-service-status-0');
    const installation = block.querySelector('#mpn-installation');
    const channel = block.querySelector('#mpn-channels-0');
    const consent = block.querySelector('#mpn-consent');

    serviceStatus.checked = true;
    serviceStatus.dispatchEvent({ type: 'change' });
    installation.value = 'camp_pendleton';
    installation.dispatchEvent({ type: 'change' });
    block.querySelector('#mpn-next-1').dispatchEvent({ type: 'click' });
    block.querySelector('#mpn-next-2').dispatchEvent({ type: 'click' });

    channel.checked = true;
    channel.dispatchEvent({ type: 'change' });
    consent.checked = true;
    consent.dispatchEvent({ type: 'change' });

    block.querySelector('#mpn-submit').dispatchEvent({ type: 'click' });
    await flushAsyncWork();

    assert.equal(block.querySelector('#mpn-go-now').textContent, 'Go now ->');

    block.querySelector('#mpn-go-now').dispatchEvent({ type: 'click' });
    assert.equal(window.location.href, 'https://example.com/thank-you');
  });
});
