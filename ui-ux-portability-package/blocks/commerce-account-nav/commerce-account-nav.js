import { provider as UI, Icon } from '@dropins/tools/components.js';
import { events } from '@dropins/tools/event-bus.js';

import '../../scripts/initializers/auth.js';

/**
 * Parse a permission string into normalized keys.
 * Supports comma- and newline-delimited ACL IDs.
 * @param {string | undefined} raw
 * @returns {string[]}
 */
function parsePermissionKeys(raw) {
  if (!raw) return [];

  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Build permission decision for one nav item.
 * @param {object} permissions
 * @param {string[]} keys
 * @returns {{ isGranted: boolean, isExplicitlyDisabled: boolean }}
 */
function evaluatePermissions(permissions, keys) {
  const safePermissions = permissions && typeof permissions === 'object' ? permissions : {};
  const normalizedKeys = keys.length > 0 ? keys : ['all'];

  const isExplicitlyDisabled = normalizedKeys.some((key) => safePermissions[key] === false);

  const isGranted = normalizedKeys.includes('all')
    || safePermissions.admin
    || safePermissions.all
    || normalizedKeys.some((key) => safePermissions[key] === true);

  return { isGranted: Boolean(isGranted), isExplicitlyDisabled };
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (typeof text === 'string') element.textContent = text;
  return element;
}

function normalizePath(pathname = '') {
  if (!pathname || pathname === '/') return pathname || '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function renderIcon(target, source, size = 20) {
  if (!source) return;
  UI.render(Icon, { source, size })(target);
}

function getCell(item, columnIndex) {
  if (!columnIndex) return null;
  return item.querySelector(`:scope > div:nth-child(${columnIndex})`);
}

export default async function decorate(block) {
  /** Get rows data */
  const [keys, ...$items] = [...block.children].map((child, index) => {
    if (index === 0) return [...child.children].map((c) => c.textContent.trim().toLowerCase());
    return child;
  });

  /** Create nav */
  const $nav = document.createElement('nav');
  $nav.classList.add('commerce-account-nav');
  $nav.setAttribute('aria-label', 'Account navigation');

  /** Get rows indexes */
  const rows = {
    label: Math.max(0, keys.indexOf('label') + 1),
    icon: Math.max(0, keys.indexOf('icon') + 1),
    group: Math.max(0, keys.indexOf('group') + 1),
    permission: Math.max(0, keys.indexOf('permission') + 1),
  };

  const hasGroups = rows.group > 0;
  const currentPath = normalizePath(window.location.pathname);

  /** Get permissions */
  events.on('auth/permissions', (permissions) => {
    /** Clear nav */
    $nav.innerHTML = '';
    const groupMap = new Map();

    /** Create items */
    $items.forEach(($item) => {
      /**
       * Permissions
       * Skip rendering if the user lacks permission for this item.
       * Default permission is 'all'.
       * Note: permissions can be explicitly set to false (disabled feature),
       * which should hide the item even for admins.
       */
      const permissionRaw = getCell($item, rows.permission)?.textContent?.trim() || 'all';
      const permissionKeys = parsePermissionKeys(permissionRaw);
      const { isGranted, isExplicitlyDisabled } = evaluatePermissions(permissions, permissionKeys);

      // Skip if permission is explicitly disabled (false)
      if (isExplicitlyDisabled) {
        return;
      }

      // Skip if permission is not granted
      if (!isGranted) {
        return;
      }

      /** Content */
      const $content = getCell($item, rows.label)?.children;
      const link = $content?.[0]?.querySelector('a')?.href;
      if (!link) return;

      const titleText = $content?.[0]?.textContent?.trim() || '';
      const descriptionText = $content?.[1]?.textContent?.trim() || '';
      const groupLabel = hasGroups
        ? (getCell($item, rows.group)?.textContent?.trim() || '')
        : '';

      let $groupItems = groupMap.get(groupLabel);
      if (!$groupItems) {
        const $group = createElement('section', 'commerce-account-nav__group');
        if (groupLabel) {
          $group.append(createElement('p', 'commerce-account-nav__group-label', groupLabel));
        }

        $groupItems = createElement('div', 'commerce-account-nav__group-items');
        $group.append($groupItems);
        $nav.append($group);
        groupMap.set(groupLabel, $groupItems);
      }

      const $link = createElement('a', 'commerce-account-nav__item');
      const $icon = createElement('span', 'commerce-account-nav__item__icon');
      const $title = createElement('span', 'commerce-account-nav__item__title', titleText);
      const $description = createElement(
        'span',
        'commerce-account-nav__item__description',
        descriptionText,
      );
      const $chevron = createElement('span', 'commerce-account-nav__item__chevron');
      $chevron.setAttribute('aria-hidden', 'true');

      /** Link */
      const isActive = normalizePath(new URL(link).pathname) === currentPath;
      $link.classList.toggle('commerce-account-nav__item--active', isActive);
      $link.href = link;
      if (isActive) {
        $link.setAttribute('aria-current', 'page');
      }

      /** Icon */
      const icon = getCell($item, rows.icon)?.textContent?.trim();

      if (icon) {
        $link.classList.add('commerce-account-nav__item--has-icon');
        renderIcon($icon, icon, 22);
      }

      renderIcon($chevron, 'ChevronRight', 18);

      /** Add link to nav */
      $link.append($icon, $title, $description, $chevron);
      $groupItems.append($link);
    });
  }, { eager: true });

  block.replaceWith($nav);
}
