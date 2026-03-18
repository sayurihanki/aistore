import { readBlockConfig } from '../../scripts/aem.js';
import {
  buildStorageKeys,
  getMinimumSelections,
  getPreviewDataset,
  getProfileForAnswers,
  getProfileTags,
  getSelectedValues,
  isGuidedSellingLibraryPreview,
  isStepValid,
  normalizeConfig,
  normalizeDataset,
  rankResultItems,
  resolveDataSourceUrl,
  sanitizeAnswers,
} from './guided-selling.lib.js';

function createElement(tag, className = '', attributes = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(name, value);
  });

  return element;
}

function setMultilineText(element, value) {
  element.textContent = value;
  return element;
}

function createArrow() {
  const arrow = createElement('span', 'gs-arrow', { 'aria-hidden': 'true' });
  arrow.textContent = '→';
  return arrow;
}

function createButton(label, className, { arrow = false, type = 'button' } = {}) {
  const button = createElement('button', className, { type });
  const text = createElement('span', 'gs-button-label');
  text.textContent = label;
  button.append(text);
  if (arrow) button.append(createArrow());
  return button;
}

function createLink(label, href, className, { arrow = false } = {}) {
  const link = createElement('a', className, { href });
  const text = createElement('span', 'gs-button-label');
  text.textContent = label;
  link.append(text);
  if (arrow) link.append(createArrow());
  return link;
}

function createMedia(image, fallbackText, className) {
  const media = createElement('div', className);
  if (image?.src) {
    const img = createElement('img', 'gs-media-image', {
      src: image.src,
      alt: image.alt || fallbackText,
      loading: 'lazy',
    });
    media.append(img);
    return media;
  }

  media.classList.add('is-emoji');
  media.textContent = image?.emoji || fallbackText;
  return media;
}

function showBlockMessage(block, message) {
  const messageEl = createElement('p', 'guided-selling-message');
  messageEl.textContent = message;
  block.replaceChildren(messageEl);
}

function track(runtime, eventName, payload = {}) {
  const eventInfo = {
    analyticsId: runtime.config.analyticsId,
    experienceId: runtime.dataset.id,
    experienceVersion: runtime.dataset.version,
    ...payload,
  };

  if (window.adobeDataLayer && typeof window.adobeDataLayer.push === 'function') {
    window.adobeDataLayer.push({
      event: eventName,
      eventInfo,
    });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...eventInfo,
    });
  }
}

function getSessionPayload(runtime) {
  return {
    screen: runtime.state.screen === 'loading' ? 'results' : runtime.state.screen,
    stepIndex: runtime.state.stepIndex,
    completed: runtime.state.completed,
    answers: runtime.state.answers,
    updatedAt: new Date().toISOString(),
  };
}

function persistSession(runtime) {
  try {
    window.sessionStorage.setItem(
      runtime.storageKeys.session,
      JSON.stringify(getSessionPayload(runtime)),
    );
  } catch {
    // ignore storage failures
  }
}

function clearSession(runtime) {
  try {
    window.sessionStorage.removeItem(runtime.storageKeys.session);
  } catch {
    // ignore storage failures
  }
}

function restoreSession(runtime) {
  try {
    const raw = window.sessionStorage.getItem(runtime.storageKeys.session);
    if (!raw) return;

    const saved = JSON.parse(raw);
    const answers = sanitizeAnswers(runtime.dataset, saved.answers);
    runtime.state.answers = answers;
    runtime.state.completed = Boolean(saved.completed);

    if (saved.screen === 'results' && getSelectedValues(answers).length) {
      runtime.state.screen = 'results';
      runtime.state.stepIndex = runtime.dataset.steps.length - 1;
      return;
    }

    if (saved.screen === 'step') {
      const stepIndex = Math.max(
        0,
        Math.min(Number(saved.stepIndex) || 0, runtime.dataset.steps.length - 1),
      );
      runtime.state.screen = 'step';
      runtime.state.stepIndex = stepIndex;
    }
  } catch {
    runtime.state.answers = sanitizeAnswers(runtime.dataset, {});
  }
}

function buildHeader(runtime) {
  const header = createElement('div', 'gs-header');
  const brand = createElement('a', 'gs-brand', { href: runtime.config.resultsCtaUrl });
  const seal = createElement('span', 'gs-brand-seal', { 'aria-hidden': 'true' });
  seal.textContent = 'MCX';
  const brandCopy = createElement('span', 'gs-brand-copy');
  const brandTitle = createElement('span', 'gs-brand-title');
  brandTitle.textContent = 'MCX';
  const brandSub = createElement('span', 'gs-brand-subtitle');
  brandSub.textContent = 'Marine Corps Exchange';
  brandCopy.append(brandTitle, brandSub);
  brand.append(seal, brandCopy);

  const center = createElement('div', 'gs-header-center');
  const title = createElement('div', 'gs-header-title');
  title.textContent = 'Find Your Perfect Gear';
  const trackEl = createElement('div', 'gs-progress-track');
  const fill = createElement('div', 'gs-progress-fill');
  trackEl.append(fill);
  const labels = createElement('div', 'gs-progress-labels');
  runtime.dataset.progressSteps.forEach((step, index) => {
    const label = createElement('span', 'gs-progress-step');
    label.textContent = step.label;
    label.dataset.stepIndex = String(index);
    labels.append(label);
  });
  center.append(title, trackEl, labels);

  const exitLink = createLink('Exit', runtime.config.resultsCtaUrl, 'gs-exit-link');

  runtime.refs.headerTitle = title;
  runtime.refs.progressFill = fill;
  runtime.refs.progressSteps = [...labels.children];

  header.append(brand, center, exitLink);
  return header;
}

function buildIntro(runtime) {
  const screen = createElement('section', 'gs-screen gs-screen-intro', {
    'data-screen': 'intro',
  });

  const background = createElement('div', 'gs-intro-background');
  const grid = createElement('div', 'gs-intro-grid');
  const content = createElement('div', 'gs-intro-content');
  const badge = createElement('div', 'gs-intro-badge');
  badge.textContent = runtime.config.eyebrow;
  const title = setMultilineText(createElement('h1', 'gs-intro-title', { tabindex: '-1' }), runtime.config.title);
  const subtitle = createElement('p', 'gs-intro-subtitle');
  subtitle.textContent = runtime.config.subtitle;
  const features = createElement('div', 'gs-intro-features');
  ['Personalized Picks', 'Tax-Free Prices', 'Under 2 Minutes', 'Save 20%+'].forEach((feature) => {
    const pill = createElement('span', 'gs-feature-pill');
    pill.textContent = feature;
    features.append(pill);
  });
  const start = createButton(runtime.config.startCtaLabel, 'gs-button gs-button-primary gs-start-button', {
    arrow: true,
  });
  start.addEventListener('click', () => {
    runtime.state.screen = 'step';
    runtime.state.stepIndex = 0;
    persistSession(runtime);
    setScreen(runtime, 'step', 0);
    track(runtime, 'guided_selling_start');
  });
  const note = createElement('p', 'gs-intro-note');
  note.textContent = 'Takes less than 2 minutes · No account required';

  content.append(badge, title, subtitle, features, start, note);
  screen.append(background, grid, content);

  runtime.refs.focusTargets.intro = title;
  runtime.refs.screens.intro = screen;
  return screen;
}

function buildStep(runtime, step, index) {
  const screen = createElement('section', 'gs-screen gs-screen-step', {
    'data-screen': 'step',
    'data-step-id': step.id,
  });
  const body = createElement('div', 'gs-step-shell');
  const stepNumber = createElement('div', 'gs-step-number');
  stepNumber.textContent = String(index + 1).padStart(2, '0');
  const meta = createElement('div', 'gs-step-meta');
  const category = createElement('span', 'gs-step-category');
  category.textContent = step.category;
  const counter = createElement('span', 'gs-step-counter');
  counter.textContent = `Question ${index + 1} of ${runtime.dataset.steps.length}`;
  meta.append(category, counter);

  const title = setMultilineText(createElement('h2', 'gs-step-title', { tabindex: '-1' }), step.question);
  const description = createElement('p', 'gs-step-description');
  description.textContent = step.description;
  const optionsHint = createElement('div', 'gs-step-hint');
  optionsHint.textContent = step.selectionMode === 'multi'
    ? 'Select all that apply'
    : 'Choose one';
  if (step.selectionMode !== 'multi') optionsHint.classList.add('is-hidden');

  const optionsGrid = createElement(
    'div',
    `gs-options gs-options-${step.layout}`,
    {
      role: 'group',
      'aria-label': step.question,
    },
  );

  const optionButtons = step.options.map((option) => {
    const button = createElement('button', `gs-option gs-option-${step.layout}`, {
      type: 'button',
      'data-value': option.value,
      'aria-pressed': 'false',
    });
    const check = createElement('span', 'gs-option-check', { 'aria-hidden': 'true' });
    check.textContent = '✓';
    const visual = createElement('div', 'gs-option-visual');
    visual.textContent = option.icon;
    const copy = createElement('div', 'gs-option-copy');
    const label = createElement('div', 'gs-option-label');
    label.textContent = option.label;
    const copyDescription = createElement('div', 'gs-option-description');
    copyDescription.textContent = option.description;
    copy.append(label, copyDescription);

    if (step.layout === 'image') {
      const media = createElement('div', 'gs-option-image-visual');
      media.textContent = option.icon;
      button.append(media);
      const imageBody = createElement('div', 'gs-option-image-body');
      imageBody.append(copy);
      button.append(imageBody, check);
    } else if (step.layout === 'slim') {
      button.append(check, visual, copy);
    } else {
      button.append(check, visual, copy);
      if (option.tag) {
        const tag = createElement('span', 'gs-option-tag');
        tag.textContent = option.tag;
        button.append(tag);
      }
    }

    button.addEventListener('click', () => {
      updateSelection(runtime, step, button);
    });

    return button;
  });

  optionButtons.forEach((button) => optionsGrid.append(button));
  optionsGrid.addEventListener('keydown', (event) => {
    const supported = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!supported.includes(event.key)) return;

    const buttons = optionButtons.filter((button) => !button.disabled);
    const current = document.activeElement;
    const currentIndex = buttons.indexOf(current);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = buttons.length - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = Math.max(0, currentIndex - 1);
    }

    if (nextIndex === currentIndex) return;
    event.preventDefault?.();
    buttons[nextIndex].focus?.();
  });

  const navigation = createElement('div', 'gs-step-navigation');
  const backButton = createButton('Back', 'gs-button gs-button-secondary');
  backButton.addEventListener('click', () => {
    if (index === 0) {
      setScreen(runtime, 'intro');
      return;
    }

    runtime.state.stepIndex = index - 1;
    setScreen(runtime, 'step', index - 1);
  });

  const navRight = createElement('div', 'gs-step-navigation-right');
  const selectionLabel = createElement('span', 'gs-selection-label');
  const nextButton = createButton(
    index === runtime.dataset.steps.length - 1 ? 'Build My Profile' : 'Continue',
    'gs-button gs-button-primary',
    { arrow: true },
  );
  nextButton.disabled = getMinimumSelections(step) > 0;
  nextButton.addEventListener('click', () => {
    if (!isStepValid(step, runtime.state.answers)) return;
    if (index === runtime.dataset.steps.length - 1) {
      setScreen(runtime, 'loading');
      return;
    }
    runtime.state.stepIndex = index + 1;
    setScreen(runtime, 'step', index + 1);
  });

  if (step.selectionMode === 'multi' || getMinimumSelections(step) === 0) {
    navRight.append(selectionLabel);
  }
  navRight.append(nextButton);
  navigation.append(backButton, navRight);

  body.append(stepNumber, meta, title, description, optionsHint, optionsGrid, navigation);
  screen.append(body);

  runtime.refs.stepScreens[step.id] = {
    screen,
    title,
    options: optionButtons,
    nextButton,
    selectionLabel,
    step,
  };
  runtime.refs.focusTargets[step.id] = title;
  runtime.refs.screens[`step:${step.id}`] = screen;
  return screen;
}

function buildLoading(runtime) {
  const screen = createElement('section', 'gs-screen gs-screen-loading', {
    'data-screen': 'loading',
  });
  const shell = createElement('div', 'gs-loading-shell');
  const ring = createElement('div', 'gs-loading-ring');
  const title = setMultilineText(createElement('h2', 'gs-loading-title', { tabindex: '-1' }), 'BUILDING YOUR\nSTYLE PROFILE');
  const subtitle = createElement('p', 'gs-loading-subtitle');
  subtitle.textContent = 'Analyzing your answers and matching you with the best MCX products.';
  const items = createElement('ul', 'gs-loading-items');
  const itemRefs = runtime.dataset.loadingMessages.map((message) => {
    const item = createElement('li', 'gs-loading-item');
    const mark = createElement('span', 'gs-loading-item-mark');
    mark.textContent = '○';
    const text = createElement('span', 'gs-loading-item-text');
    text.textContent = message;
    item.append(mark, text);
    items.append(item);
    return { item, mark };
  });

  shell.append(ring, title, subtitle, items);
  screen.append(shell);

  runtime.refs.loadingItems = itemRefs;
  runtime.refs.focusTargets.loading = title;
  runtime.refs.screens.loading = screen;
  return screen;
}

function createEmptyState(message) {
  const state = createElement('p', 'gs-empty-state');
  state.textContent = message;
  return state;
}

function buildResults(runtime) {
  const screen = createElement('section', 'gs-screen gs-screen-results', {
    'data-screen': 'results',
  });
  const shell = createElement('div', 'gs-results-shell');
  const header = createElement('div', 'gs-results-header');
  const headerCopy = createElement('div', 'gs-results-copy');
  const badge = createElement('div', 'gs-results-badge');
  const title = setMultilineText(createElement('h2', 'gs-results-title', { tabindex: '-1' }), 'YOUR PERFECT\nGEAR LIST\nIS READY');
  const description = createElement('p', 'gs-results-description');
  headerCopy.append(badge, title, description);

  const profileCard = createElement('aside', 'gs-profile-card');
  const profileLabel = createElement('div', 'gs-profile-label');
  profileLabel.textContent = 'Your Style Profile';
  const profileAvatar = createElement('div', 'gs-profile-avatar');
  const profileName = createElement('div', 'gs-profile-name');
  const profileSub = createElement('div', 'gs-profile-subtitle');
  const profileTags = createElement('div', 'gs-profile-tags');
  profileCard.append(profileLabel, profileAvatar, profileName, profileSub, profileTags);

  header.append(headerCopy, profileCard);

  const cardsSection = createElement('section', 'gs-results-section');
  const cardsIntro = createElement('div', 'gs-results-section-intro');
  const cardsLabel = createElement('span', 'gs-results-section-label');
  const cardsTitle = createElement('h3', 'gs-results-section-title');
  cardsTitle.textContent = 'TOP PICKS';
  cardsIntro.append(cardsLabel, cardsTitle);
  const cardsGrid = createElement('div', 'gs-results-grid');
  cardsSection.append(cardsIntro, cardsGrid);

  const categoriesSection = createElement('section', 'gs-results-section');
  const categoriesIntro = createElement('div', 'gs-results-section-intro');
  const categoriesLabel = createElement('span', 'gs-results-section-label');
  categoriesLabel.textContent = 'Based on your lifestyle';
  const categoriesTitle = createElement('h3', 'gs-results-section-title');
  categoriesTitle.textContent = 'SHOP BY NEED';
  categoriesIntro.append(categoriesLabel, categoriesTitle);
  const categoriesGrid = createElement('div', 'gs-band-grid');
  categoriesSection.append(categoriesIntro, categoriesGrid);

  const bundlesSection = createElement('section', 'gs-results-section');
  const bundlesIntro = createElement('div', 'gs-results-section-intro');
  const bundlesLabel = createElement('span', 'gs-results-section-label');
  bundlesLabel.textContent = 'Save More, Buy Together';
  const bundlesTitle = createElement('h3', 'gs-results-section-title');
  bundlesTitle.textContent = 'CURATED BUNDLES';
  bundlesIntro.append(bundlesLabel, bundlesTitle);
  const bundlesGrid = createElement('div', 'gs-bundle-grid');
  bundlesSection.append(bundlesIntro, bundlesGrid);

  const actions = createElement('div', 'gs-results-actions');
  const restart = createButton('Retake Quiz', 'gs-button gs-button-ghost');
  restart.addEventListener('click', () => {
    runtime.state.answers = sanitizeAnswers(runtime.dataset, {});
    runtime.state.stepIndex = 0;
    runtime.state.completed = false;
    clearSession(runtime);
    syncAllSelections(runtime);
    setScreen(runtime, 'intro');
    track(runtime, 'guided_selling_restart');
  });
  const shopAll = createLink(
    runtime.config.resultsCtaLabel,
    runtime.config.resultsCtaUrl,
    'gs-button gs-button-primary gs-results-primary-link',
    { arrow: true },
  );
  shopAll.addEventListener('click', () => {
    track(runtime, 'guided_selling_results_cta_click');
  });
  const save = createButton('Save My Profile', 'gs-button gs-button-outline');
  save.addEventListener('click', () => {
    try {
      window.localStorage.setItem(runtime.storageKeys.saved, JSON.stringify({
        savedAt: new Date().toISOString(),
        answers: runtime.state.answers,
        analyticsId: runtime.config.analyticsId,
        experienceId: runtime.dataset.id,
      }));
      showToast(runtime, 'Profile Saved', 'We saved your guided-selling profile on this device.');
      track(runtime, 'guided_selling_profile_save');
    } catch {
      showToast(runtime, 'Save Failed', 'Your browser blocked local storage for this experience.');
    }
  });

  actions.append(restart, shopAll, save);
  shell.append(header, cardsSection, categoriesSection, bundlesSection, actions);
  screen.append(shell);

  runtime.refs.results = {
    screen,
    badge,
    description,
    cardsLabel,
    profileAvatar,
    profileName,
    profileSub,
    profileTags,
    cardsGrid,
    categoriesGrid,
    bundlesGrid,
    title,
  };
  runtime.refs.focusTargets.results = title;
  runtime.refs.screens.results = screen;
  return screen;
}

function buildToast(runtime) {
  const toast = createElement('div', 'gs-toast', {
    role: 'status',
    'aria-live': 'polite',
  });
  const title = createElement('div', 'gs-toast-title');
  const subtitle = createElement('div', 'gs-toast-subtitle');
  toast.append(title, subtitle);
  runtime.refs.toast = { toast, title, subtitle };
  return toast;
}

function updateHeader(runtime) {
  const totalSteps = runtime.dataset.steps.length;
  let completedSteps = 0;

  if (runtime.state.screen === 'step') {
    completedSteps = runtime.state.stepIndex;
  } else if (runtime.state.screen === 'loading' || runtime.state.screen === 'results') {
    completedSteps = totalSteps;
  }

  runtime.refs.progressFill.style.width = `${(completedSteps / totalSteps) * 100}%`;
  runtime.refs.progressSteps.forEach((stepLabel, index) => {
    stepLabel.classList.remove('is-done', 'is-active');
    if (index < completedSteps) stepLabel.classList.add('is-done');
    if (runtime.state.screen === 'step' && index === runtime.state.stepIndex) {
      stepLabel.classList.add('is-active');
    }
  });

  runtime.refs.headerTitle.textContent = runtime.state.screen === 'results'
    ? 'Your Style Profile'
    : 'Find Your Perfect Gear';
}

function updateSelectionLabel(refs, step, selected) {
  if (!refs.selectionLabel) return;

  if (!selected.length && getMinimumSelections(step) === 0) {
    refs.selectionLabel.textContent = 'Optional — skip if you like';
    return;
  }

  if (!selected.length) {
    refs.selectionLabel.textContent = `Select at least ${getMinimumSelections(step)}`;
    return;
  }

  refs.selectionLabel.textContent = `${selected.length} selected`;
}

function syncStepSelection(runtime, step) {
  const refs = runtime.refs.stepScreens[step.id];
  const selected = runtime.state.answers[step.id] || [];

  refs.options.forEach((button) => {
    const isSelected = selected.includes(button.dataset.value);
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  refs.nextButton.disabled = !isStepValid(step, runtime.state.answers);
  updateSelectionLabel(refs, step, selected);
}

function syncAllSelections(runtime) {
  runtime.dataset.steps.forEach((step) => syncStepSelection(runtime, step));
}

function updateSelection(runtime, step, button) {
  const current = runtime.state.answers[step.id] || [];
  let next = current;

  if (step.selectionMode === 'single') {
    next = [button.dataset.value];
  } else if (current.includes(button.dataset.value)) {
    next = current.filter((value) => value !== button.dataset.value);
  } else {
    next = [...current, button.dataset.value];
  }

  runtime.state.answers[step.id] = next;
  syncStepSelection(runtime, step);
  persistSession(runtime);

  track(runtime, 'guided_selling_answer_select', {
    stepId: step.id,
    stepCategory: step.category,
    optionValue: button.dataset.value,
    selectedValues: next,
  });
}

function showToast(runtime, title, subtitle) {
  const { toast, title: titleEl, subtitle: subtitleEl } = runtime.refs.toast;
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  toast.classList.add('is-visible');

  if (runtime.toastTimer && typeof window.clearTimeout === 'function') {
    window.clearTimeout(runtime.toastTimer);
  }

  runtime.toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, runtime.reduceMotion ? 0 : 2800);
}

function clearLoadingTimers(runtime) {
  runtime.loadingTimers.forEach((timer) => {
    if (typeof window.clearTimeout === 'function') {
      window.clearTimeout(timer);
    }
  });
  runtime.loadingTimers = [];
}

function renderCards(runtime, cards) {
  const grid = runtime.refs.results.cardsGrid;
  grid.replaceChildren();

  if (!cards.length) {
    grid.append(createEmptyState('No matching top picks were found for this profile yet.'));
    return;
  }

  cards.forEach((card) => {
    const article = createElement('article', 'gs-card');
    const visual = createMedia(card.image, card.icon || '🛍️', 'gs-card-media');
    const match = createElement('span', 'gs-card-match');
    match.textContent = `${card.score}% Match`;
    visual.append(match);
    const body = createElement('div', 'gs-card-body');
    const badge = createElement('div', 'gs-card-badge');
    badge.textContent = card.badge;
    const title = createElement('h4', 'gs-card-title');
    title.textContent = card.title;
    const reason = createElement('p', 'gs-card-description');
    reason.textContent = card.description;
    const price = createElement('div', 'gs-card-price');
    const current = createElement('span', 'gs-card-price-current');
    current.textContent = card.price;
    price.append(current);
    if (card.compareAt) {
      const compare = createElement('span', 'gs-card-price-compare');
      compare.textContent = card.compareAt;
      price.append(compare);
    }
    if (card.saving) {
      const saving = createElement('span', 'gs-card-saving');
      saving.textContent = card.saving;
      price.append(saving);
    }
    const link = createLink(card.ctaLabel, card.href || runtime.config.resultsCtaUrl, 'gs-card-link', {
      arrow: true,
    });
    link.addEventListener('click', () => {
      track(runtime, 'guided_selling_result_click', {
        resultId: card.id,
        href: card.href,
      });
    });

    body.append(badge, title, reason, price);
    article.append(visual, body, link);
    grid.append(article);
  });
}

function renderBands(runtime, bands) {
  const grid = runtime.refs.results.categoriesGrid;
  grid.replaceChildren();

  if (!bands.length) {
    grid.append(createEmptyState('No category groupings are available for this profile yet.'));
    return;
  }

  bands.forEach((band) => {
    const link = createElement('a', 'gs-band', { href: band.href || runtime.config.resultsCtaUrl });
    const icon = createElement('div', 'gs-band-icon');
    icon.textContent = band.icon || band.image?.emoji || '🧭';
    const title = createElement('div', 'gs-band-title');
    title.textContent = band.title;
    const description = createElement('p', 'gs-band-description');
    description.textContent = band.description;
    const tags = createElement('div', 'gs-band-tags');
    band.tags.forEach((tagText) => {
      const tag = createElement('span', 'gs-band-tag');
      tag.textContent = tagText;
      tags.append(tag);
    });
    const action = createElement('span', 'gs-band-link');
    action.textContent = `${band.ctaLabel} →`;
    link.append(icon, title, description, tags, action);
    link.addEventListener('click', () => {
      track(runtime, 'guided_selling_category_click', {
        resultId: band.id,
        href: band.href,
      });
    });
    grid.append(link);
  });
}

function renderBundles(runtime, bundles) {
  const grid = runtime.refs.results.bundlesGrid;
  grid.replaceChildren();

  if (!bundles.length) {
    grid.append(createEmptyState('No bundles are available for this profile yet.'));
    return;
  }

  bundles.forEach((bundle) => {
    const link = createElement('a', 'gs-bundle', { href: bundle.href || runtime.config.resultsCtaUrl });
    const icon = createElement('div', 'gs-bundle-icon');
    icon.textContent = bundle.icon || bundle.image?.emoji || '🎒';
    const body = createElement('div', 'gs-bundle-body');
    const badge = createElement('div', 'gs-bundle-badge');
    badge.textContent = bundle.badge;
    const title = createElement('div', 'gs-bundle-title');
    title.textContent = bundle.title;
    const description = createElement('p', 'gs-bundle-description');
    description.textContent = bundle.description;
    const pricing = createElement('div', 'gs-bundle-pricing');
    const price = createElement('span', 'gs-bundle-price');
    price.textContent = bundle.price;
    pricing.append(price);
    if (bundle.saving) {
      const saving = createElement('span', 'gs-bundle-saving');
      saving.textContent = bundle.saving;
      pricing.append(saving);
    }
    body.append(badge, title, description, pricing);
    link.append(icon, body);
    link.addEventListener('click', () => {
      track(runtime, 'guided_selling_bundle_click', {
        resultId: bundle.id,
        href: bundle.href,
      });
    });
    grid.append(link);
  });
}

function renderResults(runtime) {
  const selectedValues = getSelectedValues(runtime.state.answers);
  const cards = rankResultItems(runtime.dataset.results.cards, selectedValues, 4);
  const categories = rankResultItems(runtime.dataset.results.categories, selectedValues, 3);
  const bundles = rankResultItems(runtime.dataset.results.bundles, selectedValues, 2);
  const profile = getProfileForAnswers(runtime.dataset, runtime.state.answers);
  const tags = getProfileTags(runtime.dataset, runtime.state.answers, 4);
  const topScore = runtime.dataset.results.summaryScore || cards[0]?.score || 90;
  const totalMatches = runtime.dataset.results.totalMatches || cards.length;

  runtime.refs.results.badge.textContent = `✓ Profile Complete — ${topScore}% Match Score`;
  runtime.refs.results.description.textContent = `We found ${totalMatches} products that match your profile. Here are the strongest inline recommendations and bundles for this journey.`;
  runtime.refs.results.cardsLabel.textContent = `Curated For You — ${topScore}% Match`;
  runtime.refs.results.profileAvatar.textContent = profile.avatar;
  runtime.refs.results.profileName.textContent = profile.name;

  const lifestyleTag = runtime.state.answers.lifestyle?.[0];
  const styleTag = runtime.state.answers.style?.[0];
  const fitTag = runtime.state.answers.fit?.[0];
  const allSelected = new Map();
  runtime.dataset.steps.forEach((step) => {
    step.options.forEach((option) => {
      allSelected.set(option.value, option);
    });
  });
  const profileLines = [profile.subtitle];
  const dynamicLine = [lifestyleTag, styleTag, fitTag]
    .map((value) => allSelected.get(value)?.profileTag)
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
  if (dynamicLine) profileLines.unshift(dynamicLine);
  runtime.refs.results.profileSub.textContent = profileLines.join('\n');
  runtime.refs.results.profileTags.replaceChildren();
  tags.forEach((tagText) => {
    const tag = createElement('span', 'gs-profile-tag');
    tag.textContent = tagText;
    runtime.refs.results.profileTags.append(tag);
  });

  renderCards(runtime, cards);
  renderBands(runtime, categories);
  renderBundles(runtime, bundles);

  runtime.state.completed = true;
  persistSession(runtime);
  track(runtime, 'guided_selling_complete', {
    selectedValues,
    summaryScore: topScore,
  });
}

function resetLoading(runtime) {
  runtime.refs.loadingItems.forEach(({ item, mark }) => {
    item.classList.remove('is-done');
    mark.textContent = '○';
  });
}

function runLoadingSequence(runtime) {
  clearLoadingTimers(runtime);
  resetLoading(runtime);

  const baseDelay = runtime.reduceMotion ? 0 : 450;
  runtime.refs.loadingItems.forEach(({ item, mark }, index) => {
    const timer = window.setTimeout(() => {
      item.classList.add('is-done');
      mark.textContent = '✓';
    }, baseDelay + (index * (runtime.reduceMotion ? 0 : 350)));
    runtime.loadingTimers.push(timer);
  });

  const finalDelay = runtime.reduceMotion
    ? 0
    : baseDelay + (runtime.refs.loadingItems.length * 350) + 700;
  runtime.loadingTimers.push(window.setTimeout(() => {
    renderResults(runtime);
    setScreen(runtime, 'results');
  }, finalDelay));
}

function focusCurrentScreen(runtime, key) {
  const target = runtime.refs.focusTargets[key];
  if (!target || typeof target.focus !== 'function') return;
  window.requestAnimationFrame(() => target.focus());
}

function setScreen(runtime, screen, stepIndex = runtime.state.stepIndex) {
  clearLoadingTimers(runtime);
  runtime.state.screen = screen;
  runtime.state.stepIndex = stepIndex;

  const activeStepKey = `step:${runtime.dataset.steps[stepIndex]?.id}`;
  Object.entries(runtime.refs.screens).forEach(([key, element]) => {
    let isActive = false;
    if (key === 'intro') isActive = screen === 'intro';
    else if (key === 'loading') isActive = screen === 'loading';
    else if (key === 'results') isActive = screen === 'results';
    else if (key === activeStepKey) isActive = screen === 'step';
    element.classList.toggle('is-active', isActive);
  });

  updateHeader(runtime);
  persistSession(runtime);

  if (screen === 'loading') {
    focusCurrentScreen(runtime, 'loading');
    runLoadingSequence(runtime);
  } else if (screen === 'results') {
    focusCurrentScreen(runtime, 'results');
  } else if (screen === 'step') {
    const step = runtime.dataset.steps[stepIndex];
    syncStepSelection(runtime, step);
    focusCurrentScreen(runtime, step.id);
    track(runtime, 'guided_selling_step_view', {
      stepId: step.id,
      stepIndex: stepIndex + 1,
      stepCategory: step.category,
    });
  } else {
    focusCurrentScreen(runtime, 'intro');
  }

  if (typeof runtime.block.scrollIntoView === 'function') {
    runtime.block.scrollIntoView({
      behavior: runtime.reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}

function buildRuntime(block, config, dataset) {
  return {
    block,
    config,
    dataset,
    state: {
      screen: 'intro',
      stepIndex: 0,
      answers: sanitizeAnswers(dataset, {}),
      completed: false,
    },
    storageKeys: buildStorageKeys(config, dataset),
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    refs: {
      screens: {},
      stepScreens: {},
      focusTargets: {},
      toast: null,
      headerTitle: null,
      progressFill: null,
      progressSteps: [],
      results: null,
      loadingItems: [],
    },
    loadingTimers: [],
    toastTimer: null,
  };
}

async function fetchDataset(config) {
  const source = resolveDataSourceUrl(config.dataSource);
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Unable to load guided selling data (${response.status}).`);
  }
  return normalizeDataset(await response.json());
}

async function loadDataset(config) {
  if (!config.dataSource) {
    if (isGuidedSellingLibraryPreview()) {
      return getPreviewDataset();
    }
    throw new Error('Guided selling requires a data-source field outside the DA library preview.');
  }

  try {
    return await fetchDataset(config);
  } catch (error) {
    if (isGuidedSellingLibraryPreview()) {
      return getPreviewDataset();
    }
    throw error;
  }
}

export default async function decorate(block) {
  const section = block.closest('.section');
  if (section) section.classList.add('guided-selling-section');

  const config = normalizeConfig(readBlockConfig(block));
  let dataset;

  try {
    dataset = await loadDataset(config);
  } catch (error) {
    showBlockMessage(block, error.message || 'Unable to load guided selling experience.');
    return;
  }

  const runtime = buildRuntime(block, config, dataset);
  restoreSession(runtime);

  block.textContent = '';
  block.classList.add('guided-selling-block');
  block.dataset.theme = config.theme;

  const shell = createElement('div', 'guided-selling-shell');
  shell.append(buildHeader(runtime));

  const screens = createElement('div', 'gs-screens');
  screens.append(buildIntro(runtime));
  dataset.steps.forEach((step, index) => screens.append(buildStep(runtime, step, index)));
  screens.append(buildLoading(runtime), buildResults(runtime));
  shell.append(screens, buildToast(runtime));
  block.replaceChildren(shell);

  syncAllSelections(runtime);

  if (runtime.state.screen === 'results') {
    renderResults(runtime);
    setScreen(runtime, 'results');
    return;
  }

  if (runtime.state.screen === 'step') {
    setScreen(runtime, 'step', runtime.state.stepIndex);
    return;
  }

  setScreen(runtime, 'intro');
}
