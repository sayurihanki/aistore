/* eslint-disable indent */
import { readBlockConfig } from '../../scripts/aem.js';
import {
  AWARDS,
  BRANCHES,
  DEFAULT_BLOCK_CONTENT,
  FAMILY_BUILDERS,
  PAGE_LABELS,
  RACK_TYPES,
  STEP_DEFINITIONS,
  createDefaultDeviceDraft,
  createInitialState,
  getAwardsPage,
  getBranchLabel,
  getRackRows,
  getRackTitle,
  getReviewSummary,
  isAwardInRack,
  normalizeBlockConfig,
  removeRackItem,
  sortRack,
  upsertRackItem,
  applyDd214Profile,
  sanitizeDeviceDraft,
} from './ez-rack-builder-mockup.lib.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function titleToHtml(title = '') {
  const lines = String(title || '').split('\n').filter(Boolean);
  if (lines.length <= 1) return escapeHtml(title || DEFAULT_BLOCK_CONTENT.title);

  const [firstLine, ...rest] = lines;
  return `${escapeHtml(firstLine)}<br><em>${escapeHtml(rest.join(' '))}</em>`;
}

function toConfigKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^0-9a-z]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function readAuthoredConfig(block) {
  const config = {};

  Array.from(block.children).forEach((row) => {
    const columns = Array.from(row.children || []);
    if (columns.length < 2) return;

    const key = toConfigKey(columns[0].textContent);
    if (!key) return;

    const paragraphs = Array.from(columns[1].querySelectorAll('p'));
    if (paragraphs.length > 1) {
      config[key] = paragraphs.map((paragraph) => paragraph.textContent).join('\n');
      return;
    }

    if (paragraphs.length === 1) {
      config[key] = paragraphs[0].textContent;
      return;
    }

    config[key] = columns[1].textContent;
  });

  return config;
}

function getBranchIconMarkup(branch) {
  const icons = {
    army: '<path d="M40 7 53 23 72 26 58 39 61 58 40 47 19 58 22 39 8 26 27 23Z"></path>',
    navy: '<path d="M40 8c9 8 14 19 14 30 0 13-6 24-14 34-8-10-14-21-14-34 0-11 5-22 14-30Zm0 18-7 7 7 23 7-23-7-7Z"></path>',
    usmc: '<path d="M40 8c12 0 22 10 22 22 0 15-10 27-22 42C28 57 18 45 18 30 18 18 28 8 40 8Zm0 13-8 8 8 8 8-8-8-8Zm0 19-6 6 6 6 6-6-6-6Z"></path>',
    airforce: '<path d="M40 10 68 30 52 34 40 24 28 34 12 30 40 10Zm0 22 18 11-18 27-18-27 18-11Z"></path>',
    coastguard: '<path d="M40 10c15 0 26 11 26 26S55 67 40 72C25 67 14 51 14 36S25 10 40 10Zm0 12-10 10 10 24 10-24-10-10Z"></path>',
    spaceforce: '<path d="M40 8 60 60 40 48 20 60 40 8Zm0 18-4 13 4 8 4-8-4-13Z"></path>',
    health: '<path d="M34 14h12v16h16v12H46v16H34V42H18V30h16V14Z"></path>',
    civilair: '<path d="M40 10 66 58H14L40 10Zm0 15-10 18h20L40 25Zm-2 24h4v4h-4v-4Z"></path>',
    youngmarines: '<path d="M40 8 47 25 66 27 52 40 56 59 40 50 24 59 28 40 14 27 33 25Z"></path>',
  };

  return `
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" stroke-width="3"></circle>
      ${icons[branch.icon] || icons.usmc}
    </svg>
  `;
}

function getHeroVisualMarkup() {
  return `
    <svg width="100%" viewBox="0 0 460 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ezrbm-r1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1a3580"></stop>
          <stop offset="28%" stop-color="#c00018"></stop>
          <stop offset="36%" stop-color="#fff"></stop>
          <stop offset="44%" stop-color="#c00018"></stop>
          <stop offset="100%" stop-color="#1a3580"></stop>
        </linearGradient>
        <linearGradient id="ezrbm-r2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5a1a6e"></stop>
          <stop offset="38%" stop-color="#c9a227"></stop>
          <stop offset="100%" stop-color="#5a1a6e"></stop>
        </linearGradient>
        <linearGradient id="ezrbm-r3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1a4a1a"></stop>
          <stop offset="35%" stop-color="#c9a227"></stop>
          <stop offset="100%" stop-color="#1a4a1a"></stop>
        </linearGradient>
        <radialGradient id="ezrbm-gold" cx="40%" cy="35%">
          <stop offset="0%" stop-color="#e2c261"></stop>
          <stop offset="60%" stop-color="#c9a227"></stop>
          <stop offset="100%" stop-color="#8b6000"></stop>
        </radialGradient>
        <radialGradient id="ezrbm-silver" cx="40%" cy="35%">
          <stop offset="0%" stop-color="#d0d8e0"></stop>
          <stop offset="60%" stop-color="#9ba3a8"></stop>
          <stop offset="100%" stop-color="#5a6070"></stop>
        </radialGradient>
      </defs>
      <g transform="translate(22 28)">
        <g transform="translate(0 56)" opacity="0.5">
          <rect x="0" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="64" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r2)"></rect>
          <rect x="128" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r3)"></rect>
          <rect x="192" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="256" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r2)"></rect>
          <rect x="320" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r3)"></rect>
        </g>
        <g transform="translate(0 28)" opacity="0.74">
          <rect x="0" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r3)"></rect>
          <rect x="64" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="128" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r2)"></rect>
          <rect x="192" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r3)"></rect>
          <rect x="256" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="320" y="0" width="60" height="18" rx="2.5" fill="url(#ezrbm-r2)"></rect>
        </g>
        <g transform="translate(0 0)">
          <rect x="0" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r2)"></rect>
          <rect x="64" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="128" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r3)"></rect>
          <rect x="192" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r2)"></rect>
          <rect x="256" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r1)"></rect>
          <rect x="320" y="0" width="60" height="22" rx="2.5" fill="url(#ezrbm-r3)"></rect>
        </g>
      </g>
      <g transform="translate(34 146)">
        <rect x="0" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r1)"></rect>
        <rect x="68" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r2)"></rect>
        <rect x="136" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r3)"></rect>
        <rect x="204" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r1)"></rect>
        <rect x="272" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r2)"></rect>
        <rect x="340" y="0" width="10" height="28" rx="2" fill="url(#ezrbm-r3)"></rect>
        <circle cx="5" cy="52" r="22" fill="url(#ezrbm-gold)"></circle>
        <circle cx="73" cy="52" r="22" fill="url(#ezrbm-silver)"></circle>
        <circle cx="141" cy="52" r="22" fill="url(#ezrbm-gold)"></circle>
        <circle cx="209" cy="52" r="22" fill="url(#ezrbm-silver)"></circle>
        <circle cx="277" cy="52" r="22" fill="url(#ezrbm-gold)"></circle>
        <circle cx="345" cy="52" r="22" fill="url(#ezrbm-silver)"></circle>
      </g>
    </svg>
  `;
}

function getRibbonStackMarkup(type = 'standard') {
  const variants = {
    thin: [
      'width:12rem;background:linear-gradient(90deg,#1a3580 0 28%,#c00018 28% 36%,#fff 36% 44%,#c00018 44% 52%,#1a3580 52% 100%)',
      'width:12rem;background:linear-gradient(90deg,#5a1a6e 0 30%,#c9a227 30% 38%,#5a1a6e 38% 100%)',
      'width:8rem;background:linear-gradient(90deg,#8b0000 0 20%,#fff 20% 25%,#c00018 25% 75%,#fff 75% 80%,#8b0000 80% 100%)',
    ],
    standard: [
      'width:14rem;height:1.9rem;background:linear-gradient(90deg,#1a3580 0 25%,#c00018 25% 33%,#fff 33% 40%,#c00018 40% 47%,#1a3580 47% 53%,#c00018 53% 60%,#fff 60% 67%,#c00018 67% 75%,#1a3580 75% 100%)',
      'width:14rem;height:1.9rem;background:linear-gradient(90deg,#1a3580 0 30%,#c9a227 30% 50%,#b8d0e8 50% 70%,#c9a227 70% 100%)',
      'width:14rem;height:1.9rem;background:linear-gradient(90deg,#8b0000 0 15%,#fff 15% 20%,#c00018 20% 28%,#1a3580 28% 72%,#c00018 72% 80%,#fff 80% 85%,#8b0000 85% 100%)',
    ],
    tiny: [
      'width:9rem;height:1.3rem;background:linear-gradient(90deg,#1a3580 0 28%,#c00018 28% 36%,#fff 36% 64%,#c00018 64% 72%,#1a3580 72% 100%)',
      'width:9rem;height:1.3rem;background:linear-gradient(90deg,#5a1a6e 0 35%,#c9a227 35% 65%,#5a1a6e 65% 100%)',
      'width:6rem;height:1.3rem;background:linear-gradient(90deg,#c9a227 0 20%,#000 20% 35%,#c00018 35% 65%,#000 65% 80%,#c9a227 80% 100%)',
    ],
  };

  return `
    <div class="ez-rack-builder-mockup__ribbon-stack">
      ${(variants[type] || variants.standard).map((style) => (
        `<div class="ez-rack-builder-mockup__ribbon-bar" style="${style}"></div>`
      )).join('')}
    </div>
  `;
}

function getMedalPreviewMarkup(anodized = false, mini = false) {
  const size = mini ? '2.4rem' : '3.2rem';
  const medalStyleA = anodized
    ? 'radial-gradient(circle at 35% 30%, #f8e88a, #e2c261, #c9a227, #a07820)'
    : 'radial-gradient(circle at 40% 35%, #e2c261, #c9a227, #8b6000)';
  const medalStyleB = anodized
    ? 'radial-gradient(circle at 35% 30%, #e8f0f8, #c0c8d8, #8090a8)'
    : 'radial-gradient(circle at 40% 35%, #d0d8e0, #9ba3a8, #5a6070)';

  return `
    <div>
      <div class="ez-rack-builder-mockup__ribbon-bar" style="width:14rem;height:${mini ? '1.4rem' : '1.6rem'};margin-bottom:4px;background:linear-gradient(90deg,#1a3580 0 25%,#c00018 25% 33%,#fff 33% 67%,#c00018 67% 75%,#1a3580 75% 100%)"></div>
      <div class="ez-rack-builder-mockup__medal-row-preview">
        <div class="ez-rack-builder-mockup__medal-circle" style="width:${size};height:${size};background:${medalStyleA}"></div>
        <div class="ez-rack-builder-mockup__medal-circle" style="width:${size};height:${size};background:${medalStyleB}"></div>
        <div class="ez-rack-builder-mockup__medal-circle" style="width:${size};height:${size};background:${medalStyleA}"></div>
        ${mini ? `<div class="ez-rack-builder-mockup__medal-circle" style="width:${size};height:${size};background:${medalStyleB}"></div>` : ''}
      </div>
    </div>
  `;
}

function getRackTypePreviewMarkup(rackType) {
  switch (rackType.preview) {
    case 'thin':
      return `<div style="transform:perspective(60px) rotateY(-8deg)">${getRibbonStackMarkup('thin')}</div>`;
    case 'tiny':
      return getRibbonStackMarkup('tiny');
    case 'sticky':
      return `
        <div class="ez-rack-builder-mockup__sticky-preview">
          ${getRibbonStackMarkup('standard')}
          <div class="ez-rack-builder-mockup__sticky-badge">Sticker</div>
        </div>
      `;
    case 'medal':
      return getMedalPreviewMarkup(false, false);
    case 'anodized':
      return getMedalPreviewMarkup(true, false);
    case 'mini-medal':
      return getMedalPreviewMarkup(false, true);
    case 'mini-anodized':
      return getMedalPreviewMarkup(true, true);
    default:
      return getRibbonStackMarkup('standard');
  }
}

function renderFamilyRail() {
  return `
    <nav class="ez-rack-builder-mockup__builder-nav" aria-label="Builder family">
      <div class="ez-rack-builder-mockup__builder-nav-inner">
        ${FAMILY_BUILDERS.map((builder) => `
          <button
            class="ez-rack-builder-mockup__builder-tab${builder.active ? ' is-active' : ''}"
            type="button"
            ${builder.active ? '' : 'disabled'}
          >
            <span class="ez-rack-builder-mockup__builder-tab-top">${escapeHtml(builder.top)}</span>
            <span class="ez-rack-builder-mockup__builder-tab-bottom">${escapeHtml(builder.bottom)}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;
}

function renderBranchCards(state) {
  return BRANCHES.map((branch) => `
    <button
      class="ez-rack-builder-mockup__branch-card${state.branch === branch.id ? ' is-selected' : ''}"
      type="button"
      data-action="select-branch"
      data-branch="${branch.id}"
    >
      <span class="ez-rack-builder-mockup__branch-emblem">${getBranchIconMarkup(branch)}</span>
      <span class="ez-rack-builder-mockup__branch-label">${escapeHtml(branch.label)}</span>
    </button>
  `).join('');
}

function renderRackTypeCards(state) {
  return RACK_TYPES.map((rackType) => `
    <button
      class="ez-rack-builder-mockup__rack-type-card${state.rackType === rackType.id ? ' is-selected' : ''}"
      type="button"
      data-action="select-rack-type"
      data-rack-type="${rackType.id}"
    >
      <span class="ez-rack-builder-mockup__rack-type-preview">${getRackTypePreviewMarkup(rackType)}</span>
      <span class="ez-rack-builder-mockup__rack-type-content">
        <span class="ez-rack-builder-mockup__rack-type-name">${escapeHtml(rackType.label)}</span>
        <span class="ez-rack-builder-mockup__rack-type-desc">${escapeHtml(rackType.description)}</span>
        <span class="ez-rack-builder-mockup__rack-type-btn">Build Now</span>
      </span>
    </button>
  `).join('');
}

function renderRackRowsMarkup(rack, width, emptyLabel) {
  const rows = getRackRows(rack, width);

  if (!rows.length) {
    return `<div class="ez-rack-builder-mockup__rack-empty">${escapeHtml(emptyLabel)}</div>`;
  }

  return `
    <div class="ez-rack-builder-mockup__rack-rows">
      ${rows.map((row) => `
        <div class="ez-rack-builder-mockup__rack-row">
          ${row.map((award) => `
            <div
              class="ez-rack-builder-mockup__rack-ribbon"
              style="width:66px;height:18px;background:${award.bg}"
            ></div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderRackListItems(rack) {
  if (!rack.length) return '';

  return rack.map((award) => `
    <div class="ez-rack-builder-mockup__rack-list-item">
      <div class="ez-rack-builder-mockup__rack-list-ribbon" style="background:${award.bg}"></div>
      <div class="ez-rack-builder-mockup__rack-list-copy">
        <div class="ez-rack-builder-mockup__rack-list-name">${escapeHtml(award.name)}</div>
        ${award.deviceSummary ? `<div class="ez-rack-builder-mockup__rack-list-devices">${escapeHtml(award.deviceSummary)}</div>` : ''}
      </div>
      <button
        class="ez-rack-builder-mockup__remove-btn"
        type="button"
        data-action="remove-award"
        data-award-id="${award.id}"
      >✕</button>
    </div>
  `).join('');
}

function renderWelcomeScreen(config, state) {
  const prototypeMessage = state.welcomeNoteVisible ? `
    <div class="ez-rack-builder-mockup__prototype-note is-inline">
      <strong>Prototype Notice</strong>
      <p>${escapeHtml(config.prototypeNote)}</p>
    </div>
  ` : '';

  return `
    <section class="ez-rack-builder-mockup__screen${state.step === 0 ? ' is-active' : ''}" data-screen="0">
      <div class="ez-rack-builder-mockup__welcome-hero">
        <div class="ez-rack-builder-mockup__welcome-visual">
          <div class="ez-rack-builder-mockup__welcome-rack-preview">
            ${getHeroVisualMarkup()}
          </div>
        </div>
        <div class="ez-rack-builder-mockup__welcome-content">
          <div class="ez-rack-builder-mockup__welcome-eyebrow">${escapeHtml(config.eyebrowText)}</div>
          <h1 class="ez-rack-builder-mockup__welcome-title">${titleToHtml(config.title)}</h1>
          <p class="ez-rack-builder-mockup__welcome-subtitle">${escapeHtml(config.subtitle)}</p>
          <button
            class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--scarlet ez-rack-builder-mockup__button--lg"
            type="button"
            data-action="goto-step"
            data-step="1"
          >${escapeHtml(config.primaryCtaLabel)} →</button>
        </div>
      </div>
      <div class="ez-rack-builder-mockup__welcome-cards">
        <div class="ez-rack-builder-mockup__welcome-card">
          <div class="ez-rack-builder-mockup__welcome-card-icon is-green">≣</div>
          <div class="ez-rack-builder-mockup__welcome-card-title">Start Here</div>
          <div class="ez-rack-builder-mockup__welcome-card-desc">Build your rack by following a few easy steps. Awards are automatically sorted by precedence.</div>
          <button
            class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--next"
            type="button"
            data-action="goto-step"
            data-step="1"
          >${escapeHtml(config.primaryCtaLabel)}</button>
        </div>
        <div class="ez-rack-builder-mockup__welcome-card">
          <div class="ez-rack-builder-mockup__welcome-card-icon is-blue">◌</div>
          <div class="ez-rack-builder-mockup__welcome-card-title">Prototype Account</div>
          <div class="ez-rack-builder-mockup__welcome-card-desc">This mockup keeps the entire luxury flow local to the block, so supporting actions stay informational only.</div>
          <button
            class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--outline"
            type="button"
            data-action="toggle-welcome-note"
          >${escapeHtml(config.secondaryCtaLabel)}</button>
        </div>
      </div>
      ${prototypeMessage}
    </section>
  `;
}

function renderStepHeader(title, actions = '') {
  return `
    <div class="ez-rack-builder-mockup__step-header">
      <h2 class="ez-rack-builder-mockup__step-title">${escapeHtml(title)}</h2>
      <div class="ez-rack-builder-mockup__step-actions">${actions}</div>
    </div>
  `;
}

function renderOptionsScreen(state) {
  const spacingGap = state.options.spacing === 'padded' ? '6px' : '2px';
  const alignStyle = state.options.alignment === 'right' ? 'flex-end' : 'center';

  return `
    <section class="ez-rack-builder-mockup__screen${state.step === 3 ? ' is-active' : ''}" data-screen="3">
      ${renderStepHeader(
        'Rack Options',
        `
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="goto-step" data-step="2">← Back</button>
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--next" type="button" data-action="goto-step" data-step="4">Next →</button>
        `,
      )}
      <div class="ez-rack-builder-mockup__options-grid">
        <div class="ez-rack-builder-mockup__option-group">
          <div class="ez-rack-builder-mockup__option-preview">
            <div class="ez-rack-builder-mockup__ribbon-stack" style="gap:${spacingGap}">
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:13rem;background:linear-gradient(90deg,#1a3580 25%,#c00018 25% 33%,#fff 33% 67%,#c00018 67% 75%,#1a3580 75%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:13rem;background:linear-gradient(90deg,#5a1a6e 30%,#c9a227 30% 38%,#5a1a6e 38%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:9rem;background:linear-gradient(90deg,#8b0000 15%,#fff 15% 20%,#c00018 20% 80%,#fff 80% 85%,#8b0000 85%)"></div>
            </div>
          </div>
          <div class="ez-rack-builder-mockup__option-name">Spacing</div>
          <div class="ez-rack-builder-mockup__option-desc">Select how your rack will be spaced.</div>
          <div class="ez-rack-builder-mockup__option-select-wrap">
            <select class="ez-rack-builder-mockup__option-select" data-action="set-spacing">
              <option value="flush" ${state.options.spacing === 'flush' ? 'selected' : ''}>Flush</option>
              <option value="padded" ${state.options.spacing === 'padded' ? 'selected' : ''}>Padded</option>
            </select>
          </div>
        </div>
        <div class="ez-rack-builder-mockup__option-group">
          <div class="ez-rack-builder-mockup__option-preview">
            <div class="ez-rack-builder-mockup__ribbon-stack" style="align-items:${alignStyle}">
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:13rem;background:linear-gradient(90deg,#1a3580 25%,#c00018 25% 33%,#fff 33% 67%,#c00018 67% 75%,#1a3580 75%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:13rem;background:linear-gradient(90deg,#5a1a6e 30%,#c9a227 30% 38%,#5a1a6e 38%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:9rem;background:linear-gradient(90deg,#8b0000 15%,#fff 15% 20%,#c00018 20% 80%,#fff 80% 85%,#8b0000 85%)"></div>
            </div>
          </div>
          <div class="ez-rack-builder-mockup__option-name">Alignment</div>
          <div class="ez-rack-builder-mockup__option-desc">Select how your rack will be aligned.</div>
          <div class="ez-rack-builder-mockup__option-select-wrap">
            <select class="ez-rack-builder-mockup__option-select" data-action="set-alignment">
              <option value="centered" ${state.options.alignment === 'centered' ? 'selected' : ''}>Centered</option>
              <option value="right" ${state.options.alignment === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        </div>
        <div class="ez-rack-builder-mockup__option-group">
          <div class="ez-rack-builder-mockup__option-preview">
            <div class="ez-rack-builder-mockup__assembly-preview">
              <div class="ez-rack-builder-mockup__assembly-row">
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#1a3580 25%,#c00018 25% 75%,#1a3580 75%)"></div>
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#5a1a6e 30%,#c9a227 30% 70%,#5a1a6e 70%)"></div>
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#1a4a1a 25%,#c9a227 25% 75%,#1a4a1a 75%)"></div>
              </div>
              <div class="ez-rack-builder-mockup__assembly-row">
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#c00018 20%,#fff 20% 30%,#1a3580 30% 70%,#fff 70% 80%,#c00018 80%)"></div>
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#8b0000 15%,#c9a227 15% 85%,#8b0000 85%)"></div>
                <div class="ez-rack-builder-mockup__ribbon-bar" style="width:5rem;background:linear-gradient(90deg,#1a1a8b 20%,#c00018 20% 50%,#fff 50% 80%,#1a1a8b 80%)"></div>
              </div>
            </div>
          </div>
          <div class="ez-rack-builder-mockup__option-name">Assembly</div>
          <div class="ez-rack-builder-mockup__option-desc">Assembled in-house or shipped in individual ribbon pieces?</div>
          <div class="ez-rack-builder-mockup__option-select-wrap">
            <select class="ez-rack-builder-mockup__option-select" data-action="set-assembly">
              <option value="assembled" ${state.options.assembly === 'assembled' ? 'selected' : ''}>Assembled</option>
              <option value="unassembled" ${state.options.assembly === 'unassembled' ? 'selected' : ''}>Unassembled</option>
            </select>
          </div>
        </div>
      </div>
      <div class="ez-rack-builder-mockup__width-section">
        <div>
          <div class="ez-rack-builder-mockup__option-preview is-short">
            <div class="ez-rack-builder-mockup__width-preview">
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:4.5rem;background:linear-gradient(90deg,#1a3580 20%,#c00018 20% 80%,#1a3580 80%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:4.5rem;background:linear-gradient(90deg,#5a1a6e 20%,#c9a227 20% 80%,#5a1a6e 80%)"></div>
              <div class="ez-rack-builder-mockup__ribbon-bar" style="width:4.5rem;background:linear-gradient(90deg,#1a4a1a 20%,#c9a227 20% 80%,#1a4a1a 80%)"></div>
            </div>
          </div>
          <div class="ez-rack-builder-mockup__option-name">Width</div>
          <div class="ez-rack-builder-mockup__option-desc">Standard ribbon mounts are only three ribbons wide.</div>
        </div>
        <div class="ez-rack-builder-mockup__width-copy">
          <div class="ez-rack-builder-mockup__option-select-wrap" style="max-width:26rem">
            <select class="ez-rack-builder-mockup__option-select" disabled>
              <option>Three Wide</option>
            </select>
          </div>
          <p>Standard ribbon mounts are only three ribbons wide.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDevicePanel(state) {
  if (!state.awardEditor?.awardId) return '';

  const award = AWARDS.find((entry) => entry.id === state.awardEditor.awardId);
  if (!award) return '';

  const draft = sanitizeDeviceDraft(state.awardEditor.draft);
  const actionLabel = isAwardInRack(state.rack, award.id) ? 'Update Award' : 'Add to Rack';

  const countOptions = (max, selected) => (
    Array.from({ length: max + 1 }, (_, index) => (
      `<option value="${index}" ${selected === index ? 'selected' : ''}>${index === 0 ? 'Add' : index}</option>`
    )).join('')
  );

  return `
    <div class="ez-rack-builder-mockup__device-panel is-open">
      <div class="ez-rack-builder-mockup__device-panel-header">
        <div class="ez-rack-builder-mockup__device-ribbon-preview" style="background:${award.bg}"></div>
        <div>
          <div class="ez-rack-builder-mockup__device-panel-title">${escapeHtml(award.name)}</div>
          <div class="ez-rack-builder-mockup__device-panel-subtitle">Select Devices</div>
        </div>
      </div>
      <div class="ez-rack-builder-mockup__device-list">
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon">✦</span>
          <span class="ez-rack-builder-mockup__device-label">3/16″ Bronze Star</span>
          <select class="ez-rack-builder-mockup__device-select" data-action="device-count" data-device="bronze">${countOptions(5, draft.bronze)}</select>
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon is-gold">★</span>
          <span class="ez-rack-builder-mockup__device-label">5/16″ Gold Star</span>
          <select class="ez-rack-builder-mockup__device-select" data-action="device-count" data-device="gold">${countOptions(3, draft.gold)}</select>
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon is-silver">☆</span>
          <span class="ez-rack-builder-mockup__device-label">5/16″ Silver Star</span>
          <select class="ez-rack-builder-mockup__device-select" data-action="device-count" data-device="silver">${countOptions(3, draft.silver)}</select>
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon is-bronze">C</span>
          <span class="ez-rack-builder-mockup__device-label">Bronze C</span>
          <button
            class="ez-rack-builder-mockup__device-toggle${draft.bronzeC ? ' is-added' : ''}"
            type="button"
            data-action="toggle-device"
            data-device="bronzeC"
          >${draft.bronzeC ? 'Added' : 'Add'}</button>
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon is-gold">V</span>
          <span class="ez-rack-builder-mockup__device-label">Gold V</span>
          <button
            class="ez-rack-builder-mockup__device-toggle${draft.goldV ? ' is-added' : ''}"
            type="button"
            data-action="toggle-device"
            data-device="goldV"
          >${draft.goldV ? 'Added' : 'Add'}</button>
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon is-gold">1</span>
          <span class="ez-rack-builder-mockup__device-label">Gold Numerals</span>
          <input
            class="ez-rack-builder-mockup__device-input"
            type="text"
            data-action="device-text"
            data-device="goldNumerals"
            value="${escapeHtml(draft.goldNumerals)}"
            placeholder="Enter number"
          >
        </div>
        <div class="ez-rack-builder-mockup__device-row">
          <span class="ez-rack-builder-mockup__device-icon">1</span>
          <span class="ez-rack-builder-mockup__device-label">Numerals</span>
          <input
            class="ez-rack-builder-mockup__device-input"
            type="text"
            data-action="device-text"
            data-device="numerals"
            value="${escapeHtml(draft.numerals)}"
            placeholder="Enter number"
          >
        </div>
      </div>
      <label class="ez-rack-builder-mockup__device-note-label" for="ez-rack-builder-mockup-note">Special instructions for this award</label>
      <textarea
        id="ez-rack-builder-mockup-note"
        class="ez-rack-builder-mockup__device-note"
        data-action="device-text"
        data-device="note"
        rows="3"
        placeholder="Notes for this award..."
      >${escapeHtml(draft.note)}</textarea>
      <div class="ez-rack-builder-mockup__device-actions">
        <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="close-award">Cancel</button>
        <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--next" type="button" data-action="save-award">${actionLabel}</button>
      </div>
    </div>
  `;
}

function renderAwardsScreen(state) {
  const awardPage = getAwardsPage(state);
  const rackTitle = getRackTitle(state);
  const openIndex = awardPage.items.findIndex((award) => award.id === state.awardEditor?.awardId);
  const rowSize = 3;
  const rowEnd = openIndex >= 0
    ? Math.min(
      (Math.floor(openIndex / rowSize) * rowSize) + rowSize - 1,
      awardPage.items.length - 1,
    )
    : -1;

  const catalogHtml = awardPage.items.map((award, index) => {
    const inRack = isAwardInRack(state.rack, award.id);
    const cardHtml = `
      <button
        class="ez-rack-builder-mockup__award-item${inRack ? ' is-in-rack' : ''}"
        type="button"
        data-action="open-award"
        data-award-id="${award.id}"
      >
        <div class="ez-rack-builder-mockup__ribbon-swatch" style="background:${award.bg}"></div>
        <div class="ez-rack-builder-mockup__award-name">${escapeHtml(award.name)}</div>
      </button>
    `;

    if (index === rowEnd) {
      return `${cardHtml}${renderDevicePanel(state)}`;
    }

    return cardHtml;
  }).join('');

  return `
    <section class="ez-rack-builder-mockup__screen${state.step === 4 ? ' is-active' : ''}" data-screen="4">
      ${renderStepHeader(
        'Select Awards',
        `
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--scarlet is-compact" type="button" data-action="upload-dd214">⬆ Upload DD214</button>
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="goto-step" data-step="3">← Back</button>
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--next" type="button" data-action="goto-step" data-step="5">Next →</button>
        `,
      )}
      <div class="ez-rack-builder-mockup__awards-layout">
        <div class="ez-rack-builder-mockup__awards-left">
          <div class="ez-rack-builder-mockup__awards-search-row">
            <div class="ez-rack-builder-mockup__search-wrap">
              <span class="ez-rack-builder-mockup__search-icon">⌕</span>
              <input
                class="ez-rack-builder-mockup__search-input"
                type="text"
                value="${escapeHtml(state.searchQuery)}"
                placeholder="Search Awards"
                data-action="search-awards"
              >
            </div>
            <button class="ez-rack-builder-mockup__filter-btn" type="button">Filter &amp; Sort</button>
          </div>
          <div class="ez-rack-builder-mockup__awards-pagination">
            <button class="ez-rack-builder-mockup__page-btn" type="button" data-action="change-page" data-direction="-1" ${awardPage.page === 0 ? 'disabled' : ''}>‹</button>
            <div class="ez-rack-builder-mockup__awards-page-info">
              <strong>${awardPage.total ? `${awardPage.start + 1} to ${awardPage.end}` : '0 to 0'}</strong>
              of
              <strong>${awardPage.total}</strong>
              awards for
              <strong>${escapeHtml(getBranchLabel(state.branch))}</strong>
              sorted by <em>${escapeHtml(getBranchLabel(state.branch))} precedence</em>
            </div>
            <button class="ez-rack-builder-mockup__page-btn" type="button" data-action="change-page" data-direction="1" ${awardPage.page >= awardPage.pageCount - 1 ? 'disabled' : ''}>›</button>
          </div>
          <div class="ez-rack-builder-mockup__awards-catalog">${catalogHtml}</div>
        </div>
        <aside class="ez-rack-builder-mockup__summary${(state.step === 4 || state.step === 5) ? '' : ' is-hidden'}${state.summaryExpanded ? ' is-expanded' : ''}">
          <button class="ez-rack-builder-mockup__summary-toggle" type="button" data-action="toggle-summary">
            <span>My Rack</span>
            <span>${state.summaryExpanded ? '−' : '+'}</span>
          </button>
          <div class="ez-rack-builder-mockup__summary-body">
            <div class="ez-rack-builder-mockup__summary-header">
              <div class="ez-rack-builder-mockup__summary-title">${escapeHtml(rackTitle)}</div>
              <div class="ez-rack-builder-mockup__summary-count">${state.rack.length ? `${state.rack.length} award${state.rack.length === 1 ? '' : 's'} total` : 'No award(s) added to rack'}</div>
            </div>
            <div class="ez-rack-builder-mockup__summary-preview">
              ${renderRackRowsMarkup(state.rack, state.options.width, 'No award(s) added to rack')}
            </div>
            <div class="ez-rack-builder-mockup__summary-actions">
              <button class="ez-rack-builder-mockup__rack-actions-btn" type="button">Rack Actions <span>▾</span></button>
            </div>
            <div class="ez-rack-builder-mockup__summary-list">
              ${renderRackListItems(state.rack)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderReviewScreen(config, state) {
  const summary = getReviewSummary(state);

  return `
    <section class="ez-rack-builder-mockup__screen${state.step === 5 ? ' is-active' : ''}" data-screen="5">
      ${renderStepHeader(
        'Review',
        `
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="goto-step" data-step="4">← Back</button>
          <button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--gold ez-rack-builder-mockup__button--lg" type="button" data-action="prototype-submit">${escapeHtml(config.reviewCtaLabel)}</button>
        `,
      )}
      <div class="ez-rack-builder-mockup__review-layout">
        <div>
          <div class="ez-rack-builder-mockup__review-card">
            <div class="ez-rack-builder-mockup__review-label">Customize Rack Name — optional</div>
            <input
              class="ez-rack-builder-mockup__review-name-input"
              type="text"
              value="${escapeHtml(state.reviewName)}"
              placeholder="E.g. My USMC Service Rack"
              data-action="review-name"
            >
          </div>
          <div class="ez-rack-builder-mockup__review-card">
            <div class="ez-rack-builder-mockup__review-options-header">
              <div class="ez-rack-builder-mockup__review-label is-no-margin">Rack Options</div>
              <button class="ez-rack-builder-mockup__edit-link" type="button" data-action="goto-step" data-step="3">Edit Rack</button>
            </div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Branch</span><span class="val">${escapeHtml(summary.branch)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Type</span><span class="val">${escapeHtml(summary.type)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Spacing</span><span class="val">${escapeHtml(summary.spacing)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Alignment</span><span class="val">${escapeHtml(summary.alignment)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Assembly</span><span class="val">${escapeHtml(summary.assembly)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Width</span><span class="val">${escapeHtml(summary.width)}</span></div>
            <div class="ez-rack-builder-mockup__review-option-row"><span class="key">Device Group Type</span><span class="val">Default</span></div>
          </div>
          ${state.prototypeNoteVisible ? `
            <div class="ez-rack-builder-mockup__prototype-note">
              <strong>Prototype saved locally</strong>
              <p>${escapeHtml(config.prototypeNote)}</p>
            </div>
          ` : ''}
        </div>
        <div class="ez-rack-builder-mockup__review-right">
          <div class="ez-rack-builder-mockup__review-rack-card">
            <div class="ez-rack-builder-mockup__review-rack-header">
              <div class="ez-rack-builder-mockup__review-rack-title">${escapeHtml(summary.rackTitle)}</div>
              <div class="ez-rack-builder-mockup__review-rack-count">${summary.awardCount} award${summary.awardCount === 1 ? '' : 's'} total</div>
            </div>
            <div class="ez-rack-builder-mockup__review-rack-preview">
              ${renderRackRowsMarkup(state.rack, state.options.width, 'No award(s) added to rack')}
            </div>
            <div class="ez-rack-builder-mockup__summary-actions">
              <button class="ez-rack-builder-mockup__rack-actions-btn" type="button">Rack Actions <span>▾</span></button>
            </div>
            <div class="ez-rack-builder-mockup__review-awards-list">
              ${state.rack.length ? renderRackListItems(state.rack) : '<div class="ez-rack-builder-mockup__rack-empty">No awards in rack</div>'}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderWizard(config, state) {
  const summaryVisible = state.step >= 4;

  return `
    ${renderFamilyRail()}
    <div class="ez-rack-builder-mockup__wizard" data-step="${state.step}" data-summary-visible="${summaryVisible}">
      ${renderWelcomeScreen(config, state)}
      <section class="ez-rack-builder-mockup__screen${state.step === 1 ? ' is-active' : ''}" data-screen="1">
        ${renderStepHeader(
          'Select Branch',
          '<button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="goto-step" data-step="0">← Back</button>',
        )}
        <div class="ez-rack-builder-mockup__branch-grid">${renderBranchCards(state)}</div>
      </section>
      <section class="ez-rack-builder-mockup__screen${state.step === 2 ? ' is-active' : ''}" data-screen="2">
        ${renderStepHeader(
          'Select Rack Type',
          '<button class="ez-rack-builder-mockup__button ez-rack-builder-mockup__button--back" type="button" data-action="goto-step" data-step="1">← Back</button>',
        )}
        <div class="ez-rack-builder-mockup__rack-type-grid">${renderRackTypeCards(state)}</div>
      </section>
      ${renderOptionsScreen(state)}
      ${renderAwardsScreen(state)}
      ${renderReviewScreen(config, state)}
    </div>
    <div class="ez-rack-builder-mockup__demo-bar">
      <span class="ez-rack-builder-mockup__demo-label">${escapeHtml(PAGE_LABELS[state.step])}</span>
      ${STEP_DEFINITIONS.map((step, index) => `
        <button
          class="ez-rack-builder-mockup__demo-dot${index === state.step ? ' is-active' : ''}"
          type="button"
          title="${escapeHtml(step.title)}"
          data-action="goto-step"
          data-step="${index}"
        ></button>
      `).join('')}
    </div>
  `;
}

function render(runtime) {
  runtime.block.innerHTML = renderWizard(runtime.config, runtime.state);
  bindInteractions(runtime);
}

function setStep(runtime, nextStep) {
  runtime.state.step = Math.max(0, Math.min(nextStep, PAGE_LABELS.length - 1));
  if (runtime.state.step < 4) {
    runtime.state.summaryExpanded = false;
  }
  render(runtime);
  window.scrollTo?.(0, 0);
}

function openAward(runtime, awardId) {
  const current = runtime.state.rack.find((item) => item.id === awardId);
  runtime.state.awardEditor = {
    awardId,
    draft: current ? { ...current.devices } : createDefaultDeviceDraft(),
  };
  render(runtime);
}

function updateAwardDraft(runtime, field, value) {
  if (!runtime.state.awardEditor) return;

  runtime.state.awardEditor.draft = {
    ...runtime.state.awardEditor.draft,
    [field]: value,
  };
}

function handleClick(runtime, target) {
  const actionEl = target.closest('[data-action]');
  if (!actionEl) return;

  const { action } = actionEl.dataset;

  if (action === 'goto-step') {
    setStep(runtime, Number.parseInt(actionEl.dataset.step, 10) || 0);
    return;
  }

  if (action === 'toggle-welcome-note') {
    runtime.state.welcomeNoteVisible = !runtime.state.welcomeNoteVisible;
    render(runtime);
    return;
  }

  if (action === 'select-branch') {
    runtime.state.branch = actionEl.dataset.branch || runtime.state.branch;
    runtime.state.prototypeNoteVisible = false;
    setStep(runtime, 2);
    return;
  }

  if (action === 'select-rack-type') {
    runtime.state.rackType = actionEl.dataset.rackType || runtime.state.rackType;
    runtime.state.prototypeNoteVisible = false;
    setStep(runtime, 3);
    return;
  }

  if (action === 'open-award') {
    openAward(runtime, actionEl.dataset.awardId || '');
    return;
  }

  if (action === 'close-award') {
    runtime.state.awardEditor = null;
    render(runtime);
    return;
  }

  if (action === 'toggle-device') {
    const deviceId = actionEl.dataset.device || '';
    if (!deviceId || !runtime.state.awardEditor) return;
    updateAwardDraft(runtime, deviceId, !runtime.state.awardEditor.draft[deviceId]);
    render(runtime);
    return;
  }

  if (action === 'save-award') {
    if (!runtime.state.awardEditor?.awardId) return;
    runtime.state.rack = upsertRackItem(
      runtime.state.rack,
      runtime.state.awardEditor.awardId,
      runtime.state.awardEditor.draft,
    );
    runtime.state.awardEditor = null;
    render(runtime);
    return;
  }

  if (action === 'remove-award') {
    runtime.state.rack = removeRackItem(runtime.state.rack, actionEl.dataset.awardId || '');
    render(runtime);
    return;
  }

  if (action === 'upload-dd214') {
    runtime.state.rack = applyDd214Profile(runtime.state.rack);
    render(runtime);
    return;
  }

  if (action === 'change-page') {
    const direction = Number.parseInt(actionEl.dataset.direction, 10) || 0;
    const currentPage = getAwardsPage(runtime.state);
    runtime.state.page = Math.max(
      0,
      Math.min(currentPage.page + direction, currentPage.pageCount - 1),
    );
    runtime.state.awardEditor = null;
    render(runtime);
    return;
  }

  if (action === 'prototype-submit') {
    runtime.state.prototypeNoteVisible = true;
    render(runtime);
    return;
  }

  if (action === 'toggle-summary') {
    runtime.state.summaryExpanded = !runtime.state.summaryExpanded;
    render(runtime);
  }
}

function handleChange(runtime, target) {
  const { action } = target.dataset;

  if (action === 'set-spacing') {
    runtime.state.options.spacing = target.value;
    render(runtime);
    return;
  }

  if (action === 'set-alignment') {
    runtime.state.options.alignment = target.value;
    render(runtime);
    return;
  }

  if (action === 'set-assembly') {
    runtime.state.options.assembly = target.value;
    render(runtime);
    return;
  }

  if (action === 'device-count') {
    updateAwardDraft(runtime, target.dataset.device || '', target.value);
    render(runtime);
  }
}

function handleInput(runtime, target) {
  const { action } = target.dataset;

  if (action === 'search-awards') {
    runtime.state.searchQuery = target.value;
    runtime.state.page = 0;
    runtime.state.awardEditor = null;
    render(runtime);
    return;
  }

  if (action === 'device-text') {
    updateAwardDraft(runtime, target.dataset.device || '', target.value);
    return;
  }

  if (action === 'review-name') {
    runtime.state.reviewName = target.value;
  }
}

function bindInteractions(runtime) {
  runtime.block.querySelectorAll('button[data-action]').forEach((element) => {
    element.addEventListener('click', () => {
      handleClick(runtime, element);
    });
  });

  runtime.block.querySelectorAll('select[data-action]').forEach((element) => {
    element.addEventListener('change', () => {
      handleChange(runtime, element);
    });
  });

  runtime.block.querySelectorAll('input[data-action], textarea[data-action]').forEach((element) => {
    element.addEventListener('input', () => {
      handleInput(runtime, element);
    });
  });
}

export default async function decorate(block) {
  const config = normalizeBlockConfig({
    ...readAuthoredConfig(block),
    ...readBlockConfig(block),
  });
  const state = createInitialState();
  const runtime = {
    block,
    config,
    state,
  };

  block.classList.add('ez-rack-builder-mockup');
  runtime.state.rack = sortRack(runtime.state.rack);
  render(runtime);
}
