/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';

import { withFakeDom } from '../helpers/fake-dom.js';

async function loadDecorate() {
  return (await import('../../blocks/mcx-header/mcx-header.js')).default;
}

test('mcx-header renders the live-search scaffold on the visible search bar', async () => {
  await withFakeDom(async ({ document, fetchCalls }) => {
    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    await decorate(block);

    const searchForm = block.querySelector('.hdr-search');
    const searchInput = block.querySelector('[data-mcx-search-input]');
    const resultsPanel = block.querySelector('[data-mcx-live-search]');
    const liveRegion = block.querySelector('.hdr-search-status');

    assert.ok(searchForm);
    assert.ok(searchInput);
    assert.ok(resultsPanel);
    assert.ok(liveRegion);

    assert.equal(fetchCalls.length, 1);
    assert.equal(searchForm.getAttribute('action'), '/search');
    assert.equal(searchForm.dataset.searchStatus, 'idle');
    assert.equal(searchForm.getAttribute('aria-expanded'), 'false');
    assert.equal(searchInput.getAttribute('autocomplete'), 'off');
    assert.equal(searchInput.getAttribute('spellcheck'), 'false');
    assert.equal(searchInput.getAttribute('aria-expanded'), 'false');
    assert.equal(searchInput.getAttribute('aria-controls'), resultsPanel.id);
    assert.equal(resultsPanel.getAttribute('role'), 'region');
    assert.equal(resultsPanel.getAttribute('aria-hidden'), 'true');
    assert.equal(resultsPanel.getAttribute('aria-busy'), 'false');
    assert.equal(liveRegion.getAttribute('role'), 'status');
    assert.equal(liveRegion.getAttribute('aria-live'), 'polite');
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});

test('mcx-header renders the storefront switcher and guest account shortcut menu', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    await decorate(block);

    assert.equal(block.querySelector('.store-switcher-toggle-label')?.textContent, 'aistore');
    assert.equal(block.querySelector('.hdr-signin-label')?.textContent, 'Sign In');

    const accountButton = block.querySelector('.hdr-signin');
    accountButton?.dispatchEvent({ type: 'click' });

    const shortcutLabels = [...block.querySelectorAll('.hdr-account-item')]
      .map((item) => item.textContent.trim());

    assert.deepEqual(shortcutLabels, [
      'Log in',
      'Registration',
      'My Account',
      'Create New Company Account',
      'Combined Auth',
      'Search Order',
    ]);
    assert.equal(block.querySelector('.hdr-account-panel')?.hidden, false);
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});

test('mcx-header recognizes the usmccsmymcx storefront in the site switcher', async () => {
  await withFakeDom(async ({ document }) => {
    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    await decorate(block);

    const optionLabels = [...block.querySelectorAll('.store-switcher-option')]
      .map((item) => item.textContent.trim());

    assert.equal(block.querySelector('.store-switcher-toggle-label')?.textContent, 'usmccsmymcx');
    assert.equal(optionLabels.includes('usmccsmymcx'), true);
  }, {
    window: {
      location: {
        href: 'https://main--usmccsmymcx--sayurihanki.aem.live/',
        pathname: '/',
        search: '',
        hostname: 'main--usmccsmymcx--sayurihanki.aem.live',
      },
    },
  });
});

test('mcx-header renders the authenticated account shortcut menu when auth cookies exist', async () => {
  await withFakeDom(async ({ document }) => {
    document.cookie = 'auth_dropin_firstname=Alex; auth_dropin_user_token=token';

    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    await decorate(block);

    assert.equal(block.querySelector('.hdr-signin-label')?.textContent, 'My Account');

    const accountButton = block.querySelector('.hdr-signin');
    accountButton?.dispatchEvent({ type: 'click' });

    const shortcutLabels = [...block.querySelectorAll('.hdr-account-item')]
      .map((item) => item.textContent.trim());

    assert.deepEqual(shortcutLabels, [
      'My Account',
      'Create New Company Account',
      'Search Order',
      'Logout',
    ]);
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});

test('mcx-header removes Account and Search Order from the primary nav and reuses authored links in the account menu', async () => {
  await withFakeDom(async ({ document, setFetchImplementation }) => {
    const decorate = await loadDecorate();
    const block = document.createElement('div');
    block.className = 'mcx-header';
    document.body.append(block);

    setFetchImplementation(async () => ({
      ok: true,
      text: async () => `
        <div class="mcx-nav-data">
          <div><div>item</div><div></div><div>Shop All</div><div>/shop</div></div>
          <div><div>item</div><div></div><div>Account</div><div>/customer/account-authored</div></div>
          <div><div>link</div><div>Account > Links</div><div>Log in</div><div>/customer/login-authored</div></div>
          <div><div>link</div><div>Account > Links</div><div>Registration</div><div>/customer/register-authored</div></div>
          <div><div>link</div><div>Account > Links</div><div>Create New Company Account</div><div>/customer/company-authored</div></div>
          <div><div>link</div><div>Account > Links</div><div>Combined Auth</div><div>/customer/combined-authored</div></div>
          <div><div>item</div><div></div><div>Search Order</div><div>/order-status-authored</div></div>
        </div>
      `,
    }));

    await decorate(block);

    const navLabels = [...block.querySelectorAll('.nav-link')].map((item) => item.textContent.trim());
    assert.deepEqual(navLabels, ['Shop All']);

    block.querySelector('.hdr-signin')?.dispatchEvent({ type: 'click' });

    const accountLink = block.querySelector('.hdr-account-item[href="/customer/account-authored"]');
    const loginLink = block.querySelector('.hdr-account-item[href="/customer/login-authored"]');
    const registrationLink = block.querySelector('.hdr-account-item[href="/customer/register-authored"]');
    const companyLink = block.querySelector('.hdr-account-item[href="/customer/company-authored"]');
    const orderLink = block.querySelector('.hdr-account-item[href="/order-status-authored"]');
    const combinedAuthButton = [...block.querySelectorAll('.hdr-account-item')]
      .find((item) => item.textContent.trim() === 'Combined Auth');

    assert.ok(accountLink);
    assert.ok(loginLink);
    assert.ok(registrationLink);
    assert.ok(companyLink);
    assert.ok(orderLink);
    assert.ok(combinedAuthButton);
  }, {
    window: {
      location: {
        href: 'https://example.com/',
        pathname: '/',
        search: '',
        hostname: 'example.com',
      },
    },
  });
});
