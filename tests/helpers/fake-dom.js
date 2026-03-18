/* eslint-env node */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-classes-per-file, class-methods-use-this, no-use-before-define */
import { parseFragment } from 'parse5';

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

    return true;
  }
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = value;
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

  clear() {
    this.values.clear();
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  _tokens() {
    return this.element.className.split(/\s+/).filter(Boolean);
  }

  add(...tokens) {
    const classes = new Set(this._tokens());
    tokens.forEach((token) => classes.add(token));
    this.element.className = [...classes].join(' ');
  }

  remove(...tokens) {
    const classes = new Set(this._tokens());
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
    return this._tokens().includes(token);
  }
}

class FakeTextNode {
  constructor(text, ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.nodeType = 3;
    this._textContent = text;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  cloneNode() {
    return new FakeTextNode(this.textContent, this.ownerDocument);
  }
}

class FakeDocumentFragment extends FakeEventTarget {
  constructor(ownerDocument) {
    super();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.nodeType = 11;
    this.childNodes = [];
  }

  get children() {
    return this.childNodes.filter((child) => child instanceof FakeElement);
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    const child = normalizeNode(node, this.ownerDocument);
    if (child.parentNode) child.parentNode.removeChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) {
      this.childNodes.splice(index, 1);
      node.parentNode = null;
    }
    return node;
  }
}

function extractSimpleSelectorParts(selector) {
  const normalized = selector.trim();
  const attrMatches = [...normalized.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)]
    .map(([, name, value]) => ({ name, value }));
  const withoutAttrs = normalized.replace(/\[[^\]]+\]/g, '');
  const idMatch = withoutAttrs.match(/#([A-Za-z0-9_-]+)/);
  const classMatches = [...withoutAttrs.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
  const tag = withoutAttrs.replace(/[#.][A-Za-z0-9_-]+/g, '').trim();

  return {
    tag: tag || '',
    id: idMatch?.[1] || '',
    classes: classMatches,
    attrs: attrMatches,
  };
}

function matchesSimpleSelector(element, selector) {
  if (!(element instanceof FakeElement)) return false;
  const normalized = selector.trim();
  if (!normalized) return false;

  const {
    tag,
    id,
    classes,
    attrs,
  } = extractSimpleSelectorParts(normalized);

  if (tag && element.tagName !== tag.toUpperCase()) return false;
  if (id && element.id !== id) return false;
  if (classes.some((token) => !element.classList.contains(token))) return false;

  return attrs.every(({ name, value }) => {
    const attrValue = element.getAttribute(name);
    if (value === undefined) return attrValue !== null;
    return attrValue === value;
  });
}

function matchesSelectorChain(element, selector) {
  const tokens = selector.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  const matchesFrom = (node, index) => {
    if (!(node instanceof FakeElement)) return false;
    if (!matchesSimpleSelector(node, tokens[index])) return false;
    if (index === 0) return true;

    let current = node.parentNode;
    while (current) {
      if (matchesFrom(current, index - 1)) return true;
      current = current.parentNode;
    }

    return false;
  };

  return matchesFrom(element, tokens.length - 1);
}

function normalizeNode(node, ownerDocument) {
  if (
    node instanceof FakeElement
    || node instanceof FakeDocumentFragment
    || node instanceof FakeTextNode
  ) {
    return node;
  }

  if (typeof node === 'string') return new FakeTextNode(node, ownerDocument);
  return node;
}

function appendNode(target, node) {
  const child = normalizeNode(node, target.ownerDocument);

  if (child instanceof FakeDocumentFragment) {
    [...child.childNodes].forEach((fragmentChild) => {
      child.removeChild(fragmentChild);
      target.appendChild(fragmentChild);
    });
    return child;
  }

  if (child.parentNode) child.parentNode.removeChild(child);
  target.childNodes.push(child);
  child.parentNode = target;
  return child;
}

function convertParse5Node(node, ownerDocument) {
  if (node.nodeName === '#text') {
    return new FakeTextNode(node.value, ownerDocument);
  }

  if (!node.tagName) {
    const fragment = new FakeDocumentFragment(ownerDocument);
    (node.childNodes || []).forEach((child) => {
      fragment.appendChild(convertParse5Node(child, ownerDocument));
    });
    return fragment;
  }

  const element = ownerDocument.createElement(node.tagName);
  (node.attrs || []).forEach(({ name, value }) => {
    element.setAttribute(name, value);
  });
  (node.childNodes || []).forEach((child) => {
    element.appendChild(convertParse5Node(child, ownerDocument));
  });
  return element;
}

function createDatasetProxy(element) {
  const store = {};
  const proxy = new Proxy(store, {
    get(target, property) {
      return target[property];
    },
    set(target, property, value) {
      const normalized = String(value);
      target[property] = normalized;
      const attrName = `data-${String(property).replace(/[A-Z]/g, '-$&').toLowerCase()}`;
      element.attributes.set(attrName, normalized);
      return true;
    },
  });

  return { store, proxy };
}

export class FakeElement extends FakeEventTarget {
  constructor(tagName, ownerDocument) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.nodeType = 1;
    this.className = '';
    this.id = '';
    this.attributes = new Map();
    const { store, proxy } = createDatasetProxy(this);
    this._datasetStore = store;
    this.dataset = proxy;
    this.style = new FakeStyle();
    this.classList = new FakeClassList(this);
    this.hidden = false;
    this.disabled = false;
    this.href = '';
    this.src = '';
    this.alt = '';
    this.loading = '';
    this.type = '';
    this.value = '';
    this.name = '';
    this.placeholder = '';
    this.checked = false;
    this.childNodes = [];
    this._textContent = '';
  }

  _readBoxValue(value) {
    const numeric = Number.parseFloat(String(value || '0'));
    return Number.isFinite(numeric) ? numeric : 0;
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
    this._textContent = String(value);
  }

  get innerHTML() {
    return this.childNodes.map((child) => child.textContent || '').join('');
  }

  set innerHTML(value) {
    this.childNodes = [];
    this._textContent = '';
    const fragment = parseFragment(String(value));
    (fragment.childNodes || []).forEach((child) => {
      this.appendChild(convertParse5Node(child, this.ownerDocument));
    });
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  prepend(...nodes) {
    [...nodes].reverse().forEach((node) => {
      const child = normalizeNode(node, this.ownerDocument);
      if (child.parentNode) child.parentNode.removeChild(child);
      this.childNodes.unshift(child);
      child.parentNode = this;
    });
  }

  appendChild(node) {
    return appendNode(this, node);
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) {
      this.childNodes.splice(index, 1);
      node.parentNode = null;
    }
    return node;
  }

  replaceChildren(...nodes) {
    this.childNodes.forEach((child) => {
      child.parentNode = null;
    });
    this.childNodes = [];
    this._textContent = '';
    this.append(...nodes);
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  setAttribute(name, value) {
    const normalized = String(value);
    this.attributes.set(name, normalized);

    if (name === 'id') this.id = normalized;
    if (name === 'class') this.className = normalized;
    if (name === 'href') this.href = normalized;
    if (name === 'src') this.src = normalized;
    if (name === 'alt') this.alt = normalized;
    if (name === 'type') this.type = normalized;
    if (name === 'name') this.name = normalized;
    if (name === 'placeholder') this.placeholder = normalized;
    if (name === 'value') this.value = normalized;

    if (name.startsWith('data-')) {
      const key = name
        .slice(5)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this._datasetStore[key] = normalized;
    }
  }

  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    if (name === 'href') return this.href || null;
    if (name === 'src') return this.src || null;
    if (name === 'alt') return this.alt || null;
    if (name === 'type') return this.type || null;
    if (name === 'name') return this.name || null;
    if (name === 'placeholder') return this.placeholder || null;
    if (name === 'value') return this.value || null;
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map((entry) => entry.trim()).filter(Boolean);
    const matches = [];

    const walk = (node) => {
      node.children.forEach((child) => {
        if (selectors.some((entry) => matchesSelectorChain(child, entry))) {
          matches.push(child);
        }
        walk(child);
      });
    };

    walk(this);
    return matches;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (matchesSelectorChain(current, selector)) return current;
      current = current.parentNode;
    }
    return null;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  matches(selector) {
    return matchesSelectorChain(this, selector);
  }

  getBoundingClientRect() {
    const width = this._readBoxValue(this.style.width);
    const height = this._readBoxValue(this.style.height);

    return {
      width,
      height,
      top: 0,
      right: width,
      bottom: height,
      left: 0,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    };
  }

  reset() {
    this.querySelectorAll('input, textarea, select').forEach((field) => {
      field.value = '';
      if ('checked' in field) field.checked = false;
    });
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName, this.ownerDocument);
    clone.className = this.className;
    clone.id = this.id;
    clone.attributes = new Map(this.attributes);
    clone.href = this.href;
    clone.src = this.src;
    clone.alt = this.alt;
    clone.loading = this.loading;
    clone.type = this.type;
    clone.value = this.value;
    clone.name = this.name;
    clone.placeholder = this.placeholder;
    clone.checked = this.checked;
    clone._textContent = this._textContent;
    Object.entries(this._datasetStore).forEach(([key, value]) => {
      clone.dataset[key] = value;
    });

    if (deep) {
      this.childNodes.forEach((child) => {
        clone.appendChild(child.cloneNode ? child.cloneNode(true) : child);
      });
    }

    return clone;
  }
}

export class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.head = new FakeElement('head', this);
    this.body = new FakeElement('body', this);
    this.activeElement = null;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createElementNS(_namespace, tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(text) {
    return new FakeTextNode(text, this);
  }

  createDocumentFragment() {
    return new FakeDocumentFragment(this);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    if (selector === 'head') return [this.head];
    if (selector === 'body') return [this.body];
    return [
      ...this.head.querySelectorAll(selector),
      ...this.body.querySelectorAll(selector),
    ];
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }
}

function createLocation(overrides = {}) {
  const seedHref = overrides.href || 'https://example.com/';
  const resolvedUrl = new URL(seedHref);
  const location = {
    href: resolvedUrl.href,
    pathname: resolvedUrl.pathname,
    search: resolvedUrl.search,
    hostname: resolvedUrl.hostname,
    origin: resolvedUrl.origin,
    toString() {
      return this.href;
    },
    [Symbol.toPrimitive]() {
      return this.href;
    },
    ...overrides,
  };

  return location;
}

export class FakeWindow extends FakeEventTarget {
  constructor(document, overrides = {}) {
    super();
    this.document = document;
    this.location = createLocation(overrides.location);
    this.innerHeight = overrides.innerHeight || 900;
    this.scrollY = overrides.scrollY || 0;
    this.setTimeout = overrides.setTimeout || ((callback) => {
      callback();
      return 1;
    });
    this.clearTimeout = overrides.clearTimeout || (() => {});
    this.setInterval = overrides.setInterval || ((callback) => {
      callback();
      return 1;
    });
    this.clearInterval = overrides.clearInterval || (() => {});
    this.scrollTo = overrides.scrollTo || (() => {});
    this.requestAnimationFrame = overrides.requestAnimationFrame || ((callback) => {
      callback();
      return 1;
    });
    this.localStorage = overrides.localStorage || new FakeStorage();
    this.sessionStorage = overrides.sessionStorage || new FakeStorage();
    this.IntersectionObserver = overrides.IntersectionObserver || class {
      constructor(callback) {
        this.callback = callback;
      }

      observe(target) {
        this.callback([{ isIntersecting: true, target }], this);
      }

      unobserve() {}

      disconnect() {}
    };
    this._matchMedia = overrides.matchMedia;
  }

  matchMedia(query) {
    if (typeof this._matchMedia === 'function') return this._matchMedia(query);
    return { matches: false };
  }
}

export async function withFakeDom(fn, options = {}) {
  const document = new FakeDocument();
  const window = new FakeWindow(document, options.window || {});
  const fetchCalls = [];
  const previousGlobals = {
    document: globalThis.document,
    window: globalThis.window,
    fetch: globalThis.fetch,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    IntersectionObserver: globalThis.IntersectionObserver,
  };

  let fetchImpl = options.fetch
    || (async () => ({
      ok: false,
      text: async () => '',
    }));

  globalThis.document = document;
  globalThis.window = window;
  globalThis.fetch = async (...args) => {
    fetchCalls.push(args);
    return fetchImpl(...args);
  };
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.setTimeout = window.setTimeout;
  globalThis.clearTimeout = window.clearTimeout;
  globalThis.setInterval = window.setInterval;
  globalThis.clearInterval = window.clearInterval;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.IntersectionObserver = window.IntersectionObserver;

  try {
    await fn({
      document,
      window,
      fetchCalls,
      setFetchImplementation(nextFetchImpl) {
        fetchImpl = nextFetchImpl;
      },
    });
  } finally {
    globalThis.document = previousGlobals.document;
    globalThis.window = previousGlobals.window;
    globalThis.fetch = previousGlobals.fetch;
    globalThis.requestAnimationFrame = previousGlobals.requestAnimationFrame;
    globalThis.setTimeout = previousGlobals.setTimeout;
    globalThis.clearTimeout = previousGlobals.clearTimeout;
    globalThis.setInterval = previousGlobals.setInterval;
    globalThis.clearInterval = previousGlobals.clearInterval;
    globalThis.localStorage = previousGlobals.localStorage;
    globalThis.sessionStorage = previousGlobals.sessionStorage;
    globalThis.IntersectionObserver = previousGlobals.IntersectionObserver;
  }
}

export function appendMeta(document, name, content) {
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.content = content;
  document.head.append(meta);
  return meta;
}
