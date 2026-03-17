import {
  buildBlock,
  getMetadata,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadBlock,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import {
  loadCommerceEager,
  loadCommerceLazy,
  initializeCommerce,
  applyTemplates,
  decorateLinks,
  loadErrorPage,
  decorateSections,
  IS_UE,
  IS_DA,
} from './commerce.js';
import { runExperimentation } from './experiment-loader.js';
import { applyMcxExperienceFallback, hasMcxContentBlock } from './mcx-experience.js';
import {
  getMcxLibraryPreviewBlockName,
  isMcxLibraryPreviewPath,
} from './mcx-preview.js';

const isMcxPage = () => (
  document.body.classList.contains('mcx')
  || hasMcxContentBlock(document.querySelector('main'))
);
const isMcxLibraryPreview = () => isMcxLibraryPreviewPath(window.location.pathname);
const usesMcxExperience = () => isMcxPage() || isMcxLibraryPreview();

function revealPageShell() {
  if (window.hlx?.pageShellReady) {
    window.hlx.pageShellReady();
    return;
  }

  if (document.body) {
    document.body.classList.add('appear');
  }

  document.documentElement.dataset.pageState = 'ready';
}

function ensureMetadata(name, content) {
  if (!content || getMetadata(name)) return;
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.append(meta);
}

function applyMcxLibraryPreviewShell() {
  if (!isMcxLibraryPreview()) return;

  ensureMetadata('template', 'mcx-home');
  ensureMetadata('theme', 'mcx');
  ensureMetadata('nav', '/fragments/mcx-nav');
  ensureMetadata('footer', '/fragments/mcx-footer');

  document.body.classList.add('mcx', 'mcx-preview', 'mcx-home');
}

/**
 * Build default table rows for mcx-hero when shown on the block library preview
 * and the doc has no block table. Returns a 2D array for buildBlock(blockName, rows).
 * Uses safe DOM creation (no innerHTML) for image and link cells.
 */
function getMcxHeroLibraryPreviewRows() {
  const imgCell = document.createElement('div');
  const img = document.createElement('img');
  img.src = 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&q=80';
  img.alt = 'Marine Corps collection hero';
  imgCell.appendChild(img);
  const primaryCtaCell = document.createElement('div');
  const primaryLink = document.createElement('a');
  primaryLink.href = '#products';
  primaryLink.textContent = 'Shop Now';
  primaryCtaCell.appendChild(primaryLink);
  const secondaryCtaCell = document.createElement('div');
  const secondaryLink = document.createElement('a');
  secondaryLink.href = '#deals';
  secondaryLink.textContent = 'View Deals';
  secondaryCtaCell.appendChild(secondaryLink);
  return [
    ['eyebrow', 'Spring Collection - 2026 - Tax-Free'],
    ['heading-line-1', 'OUTFITTED'],
    ['heading-line-2', 'FOR THE'],
    ['heading-line-3', 'mission & beyond'],
    ['description', 'Serving Marines and their families since 1897. Premium brands, exclusive savings, and tax-free shopping - exclusively for those who serve.'],
    ['image', imgCell],
    ['primary-cta', primaryCtaCell],
    ['secondary-cta', secondaryCtaCell],
    ['stat-1-value', '20%+'],
    ['stat-1-label', 'Average Savings'],
    ['stat-2-value', '33M+'],
    ['stat-2-label', 'Yearly Transactions'],
    ['stat-3-value', 'Tax Free'],
    ['stat-3-label', 'Exclusive Benefit'],
    ['stat-4-value', '127+'],
    ['stat-4-label', 'Store Locations'],
  ];
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  if (usesMcxExperience()) return;
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

async function loadMcxPackage() {
  if (!usesMcxExperience()) return;
  await loadCSS(`${window.hlx.codeBasePath}/styles/mcx-package.css`);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto block `*/fragments/*` references
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment, mountFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            mountFragment(fragment.parentElement, frag);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    if (!usesMcxExperience() && !main.querySelector('.hero')) buildHeroBlock(main);

    // Block library preview: if the doc has no block table, the page has no mcx-hero block.
    // Inject a section with mcx-hero and default content so the preview renders.
    if (usesMcxExperience() && isMcxLibraryPreview()) {
      const blockName = getMcxLibraryPreviewBlockName(window.location.pathname);
      if (blockName === 'mcx-hero' && !main.querySelector('.mcx-hero')) {
        const section = document.createElement('div');
        const heroBlock = buildBlock('mcx-hero', getMcxHeroLibraryPreviewRows());
        section.appendChild(heroBlock);
        main.prepend(section);
      }
    }
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateLinks(main);
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

const experimentationConfig = {
  audiences: {},
  decorateFunction: async (el) => {
    if (el.matches('main')) {
      decorateMain(el);
      await loadSections(el);
      return;
    }

    if (el.matches('.section')) {
      el.dataset.sectionStatus = 'initialized';
      decorateBlocks(el);
      await loadSection(el);
      return;
    }

    const block = el.matches('.block') ? el : el.closest('.block');
    if (block) {
      block.dataset.blockStatus = 'initialized';
      await loadBlock(block);
    }
  },
};

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  applyMcxLibraryPreviewShell();
  applyMcxExperienceFallback(doc, ensureMetadata);
  decorateTemplateAndTheme();
  if (!isMcxPage() && isMcxLibraryPreview()) {
    document.body.classList.add('mcx-preview');
  }
  await loadMcxPackage();
  await runExperimentation(doc, experimentationConfig);

  const main = doc.querySelector('main');
  if (main) {
    try {
      await initializeCommerce();
      decorateMain(main);
      applyTemplates(doc);
      await loadCommerceEager();
    } catch (e) {
      console.error('Error initializing commerce configuration:', e);
      if (!isMcxLibraryPreview()) loadErrorPage(418);
      else decorateMain(main);
    }
    try {
      const firstSection = main.querySelector('.section');
      if (firstSection) {
        await loadSection(firstSection, waitForFirstImage);
      }
    } finally {
      revealPageShell();
    }
  } else {
    revealPageShell();
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (!usesMcxExperience() && (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded'))) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCommerceLazy();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  if (usesMcxExperience()) {
    import('./mcx-ui.js').then(({ default: initMcxUi }) => initMcxUi());
  } else {
    loadFonts();
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  try {
    await loadEager(document);
    await loadLazy(document);
    loadDelayed();
  } finally {
    revealPageShell();
  }
}

// UE Editor support before page load
if (IS_UE) {
  // eslint-disable-next-line import/no-unresolved
  await import(`${window.hlx.codeBasePath}/scripts/ue.js`).then(({ default: ue }) => ue());
}

loadPage();

(async function loadDa() {
  if (!IS_DA) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
