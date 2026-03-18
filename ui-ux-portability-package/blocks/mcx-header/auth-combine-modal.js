import { getCookie } from '@dropins/tools/lib.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { AuthCombine } from '@dropins/storefront-auth/containers/AuthCombine.js';

import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  CUSTOMER_LOGIN_PATH,
  rootLink,
} from '../../scripts/commerce.js';

function getFocusableElements(container) {
  return [...container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute('disabled'));
}

export default function openAuthCombineModal({ triggerElement } = {}) {
  if (getCookie('auth_dropin_firstname') || getCookie('auth_dropin_user_token')) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return null;
  }

  const overlay = document.createElement('div');
  overlay.className = 'mcx-auth-combine-modal-overlay';
  overlay.setAttribute('role', 'presentation');

  const dialog = document.createElement('div');
  dialog.className = 'mcx-auth-combine-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Account access');

  const chrome = document.createElement('div');
  chrome.className = 'mcx-auth-combine-modal-chrome';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'mcx-auth-combine-modal-eyebrow';
  eyebrow.textContent = 'Account Access';

  const title = document.createElement('h2');
  title.className = 'mcx-auth-combine-modal-title';
  title.textContent = 'Sign in or create your account';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'mcx-auth-combine-modal-close';
  close.setAttribute('aria-label', 'Close account access dialog');
  close.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `;

  const mount = document.createElement('div');
  mount.className = 'mcx-auth-combine-modal-body';
  mount.setAttribute('data-mcx-auth-combine', 'true');

  const restoreOverflow = document.body.style.overflow;
  const previousActiveElement = document.activeElement;

  const trapFocus = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(dialog);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  function closeModal() {
    document.body.style.overflow = restoreOverflow;
    window.removeEventListener('keydown', trapFocus);
    overlay.remove();
    if (triggerElement) {
      triggerElement.focus();
    } else if (previousActiveElement?.focus) {
      previousActiveElement.focus();
    }
  }

  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  chrome.append(eyebrow, title);
  dialog.append(chrome, close, mount);
  overlay.append(dialog);
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', trapFocus);

  requestAnimationFrame(() => {
    close.focus();
  });

  authRenderer.render(AuthCombine, {
    signInFormConfig: {
      renderSignUpLink: true,
      routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
    },
    signUpFormConfig: {
      routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
      routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
      isAutoSignInEnabled: false,
    },
    resetPasswordFormConfig: {
      routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
    },
  })(mount);

  return {
    close: closeModal,
    element: overlay,
  };
}
