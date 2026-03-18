/* eslint-env node */
/* global globalThis */
import test from 'node:test';
import assert from 'node:assert/strict';

import { runExperimentation } from '../../scripts/experiment-loader.js';

function installNoExperimentEnvironment(t) {
  const listeners = new Map();
  const document = {
    head: {
      querySelector: () => null,
    },
    querySelectorAll: (selector) => {
      assert.equal(selector, '.section-metadata div');
      return [];
    },
  };
  const window = {
    addEventListener: (type, handler) => listeners.set(type, handler),
  };
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;

  globalThis.document = document;
  globalThis.window = window;

  t.after(() => {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }

    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  });

  return { document, listeners };
}

test('runExperimentation returns null when no experimentation metadata is present', async (t) => {
  const { document } = installNoExperimentEnvironment(t);

  const result = await runExperimentation(document, {});

  assert.equal(result, null);
});

test('runExperimentation registers an empty config responder when no metadata is present', async (t) => {
  const { document, listeners } = installNoExperimentEnvironment(t);

  await runExperimentation(document, {});

  const handler = listeners.get('message');
  assert.equal(typeof handler, 'function');

  let response;
  await handler({
    data: { type: 'hlx:experimentation-get-config' },
    source: {
      postMessage: (message, targetOrigin) => {
        response = { message, targetOrigin };
      },
    },
  });

  assert.deepEqual(response, {
    message: {
      type: 'hlx:experimentation-config',
      config: { experiments: [], audiences: [], campaigns: [] },
      source: 'no-experiments',
    },
    targetOrigin: '*',
  });
});
