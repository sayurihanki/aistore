import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
/* eslint-disable import/extensions */
import {
  BLOCK_NAME,
  buildAnalyticsDetail,
  getProgressState,
  humanizeToken,
  normalizeQuizConfig,
  parseTypedRows,
  splitAuthoredLines,
} from './quiz-router-mccs.utils.mjs';
/* eslint-enable import/extensions */

const KEY_ARROW_RIGHT = 'ArrowRight';
const KEY_ARROW_LEFT = 'ArrowLeft';
const KEY_ARROW_DOWN = 'ArrowDown';
const KEY_ARROW_UP = 'ArrowUp';
const KEY_HOME = 'Home';
const KEY_END = 'End';

function createElement(tag, className = '', attributes = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(name, value);
  });

  return element;
}

function toCamelCase(metadataKey) {
  return metadataKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function getConfigValue(block, key, fallback = '') {
  const section = block.closest('.section');
  const sectionValue = section?.dataset?.[toCamelCase(key)];
  if (sectionValue !== undefined && sectionValue !== '') {
    return sectionValue;
  }

  const pageValue = getMetadata(key);
  if (pageValue !== undefined && pageValue !== '') {
    return pageValue;
  }

  return fallback;
}

function getPathSlug() {
  if (window.location.pathname === '/') return 'home';
  return window.location.pathname.split('/').filter(Boolean).pop() || 'arrival-guide';
}

function readConfig(block) {
  return normalizeQuizConfig({
    quizId: getConfigValue(block, 'quizrouter-id'),
    progress: getConfigValue(block, 'quizrouter-progress', 'true'),
    theme: getConfigValue(block, 'quizrouter-theme', 'welcome'),
    resultMode: getConfigValue(block, 'quizrouter-result-mode', 'fragment'),
    base: getConfigValue(block, 'quizrouter-base'),
    journey: getConfigValue(block, 'quizrouter-journey'),
  }, {
    pathSlug: getPathSlug(),
  });
}

function getCellParts(cell) {
  const rawText = cell?.innerText || cell?.textContent || '';
  const rawHtml = cell?.innerHTML || '';

  if (/<br\s*\/?>/i.test(rawHtml) || /<\/p>\s*<p/i.test(rawHtml)) {
    const htmlAsLines = rawHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    return splitAuthoredLines(htmlAsLines);
  }

  return splitAuthoredLines(rawText);
}

function getRowDestination(typeValue, cell) {
  const type = String(typeValue || '').trim().toLowerCase();
  if (type === 'landing') {
    return cell?.textContent?.trim() || '';
  }

  const anchor = cell?.querySelector('a[href]');
  if (anchor) {
    return anchor.getAttribute('href')?.trim() || '';
  }

  return cell?.textContent?.trim() || '';
}

function extractRows(block) {
  return [...block.children]
    .filter((row) => row.tagName === 'DIV')
    .map((row, index) => {
      const cells = [...row.children];
      const type = cells[0]?.textContent?.trim() || '';

      return {
        rowNum: index + 1,
        type,
        parts: getCellParts(cells[1]),
        destination: getRowDestination(type, cells[2]),
      };
    });
}

function dispatchAnalytics(config, payload) {
  document.dispatchEvent(new CustomEvent(BLOCK_NAME, {
    detail: buildAnalyticsDetail(config, payload),
  }));
}

function attachOptionKeyboardNavigation(container) {
  container.addEventListener('keydown', (event) => {
    const validKeys = [
      KEY_ARROW_RIGHT,
      KEY_ARROW_LEFT,
      KEY_ARROW_DOWN,
      KEY_ARROW_UP,
      KEY_HOME,
      KEY_END,
    ];

    if (!validKeys.includes(event.key)) return;

    const active = document.activeElement;
    if (!active || !active.classList.contains('quiz-router-mccs-option')) return;

    const enabledOptions = [...container.querySelectorAll('.quiz-router-mccs-option:not(:disabled)')];
    const currentIndex = enabledOptions.indexOf(active);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;

    if (event.key === KEY_HOME) nextIndex = 0;
    if (event.key === KEY_END) nextIndex = enabledOptions.length - 1;
    if (event.key === KEY_ARROW_RIGHT || event.key === KEY_ARROW_DOWN) {
      nextIndex = Math.min(enabledOptions.length - 1, currentIndex + 1);
    }
    if (event.key === KEY_ARROW_LEFT || event.key === KEY_ARROW_UP) {
      nextIndex = Math.max(0, currentIndex - 1);
    }

    if (nextIndex === currentIndex) return;

    event.preventDefault();
    enabledOptions[nextIndex].focus();
  });
}

function inferPreviewIcon(option) {
  const label = `${option.badge} ${option.title} ${option.description}`.toLowerCase();
  if (label.includes('lodg') || label.includes('housing') || label.includes('stay')) return 'HO';
  if (label.includes('school') || label.includes('child') || label.includes('kid')) return 'ED';
  if (label.includes('health') || label.includes('tricare') || label.includes('medical')) return 'HC';
  if (label.includes('spouse') || label.includes('support') || label.includes('community')) return 'SP';
  if (label.includes('shop') || label.includes('grocery') || label.includes('admin') || label.includes('paperwork')) return 'MC';
  if (label.includes('guide') || label.includes('full') || label.includes('overview')) return 'GD';
  return '+';
}

function getQuestionEyebrow(stepId, isRoot) {
  if (isRoot) return 'Your arrival, your way';

  const specialLabels = {
    lodge: 'Lodging timeline',
    family: 'Family focus',
    ess: 'Day-one priorities',
    essentials: 'Day-one priorities',
    admin: 'Administrative focus',
    health: 'Healthcare focus',
  };

  return specialLabels[stepId] || `${humanizeToken(stepId)} focus`;
}

function getResultEyebrow(step, config) {
  const label = humanizeToken(step?.stepId || config.journey || 'arrival guide', 'Arrival guide');
  return config.base ? `${label} - ${config.base}` : label;
}

function focusHeading(surface) {
  const heading = surface.querySelector('[data-qrm-focus-target="true"]');
  if (heading && typeof heading.focus === 'function') {
    window.requestAnimationFrame(() => {
      heading.focus();
    });
  }
}

function createBackButton(label, onClick, disabled = false) {
  const button = createElement('button', 'quiz-router-mccs-back', {
    type: 'button',
  });
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function createProgress(progressState) {
  const wrap = createElement('div', 'quiz-router-mccs-progress', {
    role: 'status',
    'aria-live': 'polite',
  });
  const dots = createElement('div', 'quiz-router-mccs-progress-dots');

  for (let index = 0; index < progressState.total; index += 1) {
    const dot = createElement('span', 'quiz-router-mccs-progress-dot');
    if (index + 1 < progressState.current) {
      dot.classList.add('is-done');
    } else if (index + 1 === progressState.current) {
      dot.classList.add('is-current');
    }
    dots.append(dot);
  }

  const label = createElement('span', 'quiz-router-mccs-progress-label');
  label.textContent = `Step ${progressState.current} of ${progressState.total}`;
  wrap.append(dots, label);
  return wrap;
}

function createOptionButton(step, option, selectedOptionId, disabled, onSelect) {
  const button = createElement('button', 'quiz-router-mccs-option', {
    type: 'button',
    'aria-pressed': selectedOptionId === option.optionId ? 'true' : 'false',
    'aria-label': option.description ? `${option.title}. ${option.description}` : option.title,
  });

  if (selectedOptionId === option.optionId) {
    button.classList.add('is-selected');
  }

  if (disabled || option.action === 'disabled') {
    button.disabled = true;
    button.classList.add('is-disabled');
  }

  const badge = option.badge
    ? createElement('span', 'quiz-router-mccs-option-badge')
    : null;

  if (badge) {
    badge.textContent = option.badge;
    button.append(badge);
  }

  const title = createElement('span', 'quiz-router-mccs-option-title');
  title.textContent = option.title;
  button.append(title);

  if (option.description) {
    const description = createElement('span', 'quiz-router-mccs-option-desc');
    description.textContent = option.description;
    button.append(description);
  }

  const arrow = createElement('span', 'quiz-router-mccs-option-arrow', {
    'aria-hidden': 'true',
  });
  arrow.textContent = option.action === 'page' ? '/>' : '->';
  button.append(arrow);

  button.addEventListener('click', () => {
    if (button.disabled) return;
    onSelect(step, option);
  });

  return button;
}

function buildMasthead(config) {
  const masthead = createElement('div', 'quiz-router-mccs-masthead');
  const brand = createElement('div', 'quiz-router-mccs-brand');

  const mark = createElement('div', 'quiz-router-mccs-brand-mark', {
    'aria-hidden': 'true',
  });
  mark.textContent = 'M';

  const copy = createElement('div', 'quiz-router-mccs-brand-copy');
  const title = createElement('div', 'quiz-router-mccs-brand-title');
  title.textContent = 'MCCS';

  const subtitle = createElement('div', 'quiz-router-mccs-brand-subtitle');
  subtitle.textContent = 'Marine Corps Community Services';

  copy.append(title, subtitle);
  brand.append(mark, copy);

  const meta = createElement('div', 'quiz-router-mccs-meta');
  const metaParts = [config.base, config.journey].filter(Boolean);
  meta.textContent = metaParts.join(' - ') || 'Arrival Guide';

  masthead.append(brand, meta);
  return masthead;
}

function buildLandingView(model, config, onStart) {
  const { landing } = model;
  const rootStep = model.steps.find((step) => step.stepId === model.rootStepId);
  const view = createElement('div', 'quiz-router-mccs-view quiz-router-mccs-landing');

  const hero = createElement('section', 'quiz-router-mccs-hero');
  const eyebrow = createElement('div', 'quiz-router-mccs-hero-eyebrow');
  eyebrow.textContent = [config.base, 'Marine Corps Community Services'].filter(Boolean).join(' - ');

  const title = createElement('h1', 'quiz-router-mccs-hero-title', {
    tabindex: '-1',
    'data-qrm-focus-target': 'true',
  });
  title.textContent = landing.title;

  const body = createElement('p', 'quiz-router-mccs-hero-copy');
  body.textContent = landing.subtitle;

  hero.append(eyebrow, title, body);
  view.append(hero);

  const pills = createElement('div', 'quiz-router-mccs-pill-row');
  ['MCCS - your base life hub', 'MCX - tax-free shopping', 'MWR - recreation & family programs']
    .forEach((label, index) => {
      const pill = createElement('span', `quiz-router-mccs-pill is-${index + 1}`);
      pill.textContent = label;
      pills.append(pill);
    });
  view.append(pills);

  if (landing.tagline) {
    const intro = createElement('p', 'quiz-router-mccs-intro');
    intro.textContent = landing.tagline;
    view.append(intro);
  }

  if (rootStep?.options?.length) {
    const previewGrid = createElement('div', 'quiz-router-mccs-preview-grid');
    rootStep.options.slice(0, 4).forEach((option) => {
      const card = createElement('article', 'quiz-router-mccs-preview-card');
      const icon = createElement('div', 'quiz-router-mccs-preview-icon', {
        'aria-hidden': 'true',
      });
      icon.textContent = inferPreviewIcon(option);

      const cardTitle = createElement('h2', 'quiz-router-mccs-preview-title');
      cardTitle.textContent = option.title;

      const copy = createElement('p', 'quiz-router-mccs-preview-copy');
      copy.textContent = option.description || option.badge || 'Guided support for this part of your arrival.';

      card.append(icon, cardTitle, copy);
      previewGrid.append(card);
    });
    view.append(previewGrid);
  }

  const button = createElement('button', 'quiz-router-mccs-primary', {
    type: 'button',
  });
  button.textContent = `${landing.startLabel} ->`;
  button.addEventListener('click', onStart);
  view.append(button);

  return view;
}

function buildQuestionView(model, config, step, questionDepth, state, onBack, onSelect) {
  const progressState = getProgressState(step.stepId, questionDepth, model.longestPathByStepId);
  const view = createElement('div', 'quiz-router-mccs-view quiz-router-mccs-question-view');
  const top = createElement('div', 'quiz-router-mccs-question-top');
  const canGoBack = state.history.length > 0;
  top.append(createBackButton('<- Back', onBack, !canGoBack));

  if (config.progress) {
    top.append(createProgress(progressState));
  }

  const eyebrow = createElement('div', 'quiz-router-mccs-question-eyebrow');
  eyebrow.textContent = getQuestionEyebrow(step.stepId, step.stepId === model.rootStepId);

  const title = createElement('h2', 'quiz-router-mccs-question-title', {
    tabindex: '-1',
    'data-qrm-focus-target': 'true',
  });
  title.textContent = step.title;

  const subtitle = step.subtitle
    ? createElement('p', 'quiz-router-mccs-question-copy')
    : null;

  if (subtitle) {
    subtitle.textContent = step.subtitle;
  }

  const options = createElement('div', 'quiz-router-mccs-options');
  const selectedOptionId = state.answers[step.stepId] || '';
  step.options.forEach((option) => {
    const button = createOptionButton(step, option, selectedOptionId, state.isBusy, onSelect);
    options.append(button);
  });
  attachOptionKeyboardNavigation(options);

  view.append(top, eyebrow, title);
  if (subtitle) view.append(subtitle);
  view.append(options);
  return view;
}

function buildResultView(config, viewState, onBack, onRestart) {
  const view = createElement('div', 'quiz-router-mccs-view quiz-router-mccs-result-view');
  const top = createElement('div', 'quiz-router-mccs-result-top');
  const canGoBack = viewState.historyDepth > 0;
  top.append(createBackButton('<- Back', onBack, !canGoBack));
  view.append(top);

  const hero = createElement('section', 'quiz-router-mccs-result-hero');
  const eyebrow = createElement('div', 'quiz-router-mccs-result-eyebrow');
  eyebrow.textContent = getResultEyebrow(viewState.step, config);

  const title = createElement('h2', 'quiz-router-mccs-result-title', {
    tabindex: '-1',
    'data-qrm-focus-target': 'true',
  });
  title.textContent = viewState.option.title;

  hero.append(eyebrow, title);

  if (viewState.option.description) {
    const copy = createElement('p', 'quiz-router-mccs-result-copy');
    copy.textContent = viewState.option.description;
    hero.append(copy);
  }

  view.append(hero);

  const body = createElement('div', 'quiz-router-mccs-result-body');
  const stack = createElement('div', 'quiz-router-mccs-result-stack');
  viewState.fragmentSections.forEach((section) => {
    stack.append(section);
  });
  body.append(stack);
  view.append(body);

  const actions = createElement('div', 'quiz-router-mccs-result-actions');
  const restart = createElement('button', 'quiz-router-mccs-secondary', {
    type: 'button',
  });
  restart.textContent = 'Start over';
  restart.addEventListener('click', onRestart);
  actions.append(restart);
  view.append(actions);

  return view;
}

function navigateTo(href) {
  window.location.assign(href);
}

export default async function decorate(block) {
  const config = readConfig(block);
  const model = parseTypedRows(extractRows(block), {
    origin: window.location.origin,
    pathname: window.location.pathname,
  });

  model.warnings.forEach((warning) => {
    // eslint-disable-next-line no-console
    console.warn(warning);
  });

  if (!model.steps.length) {
    const message = createElement('p', 'quiz-router-mccs-empty');
    message.textContent = 'Configure quiz-router-mccs with at least one question and one option.';
    block.replaceChildren(message);
    return;
  }

  block.classList.add(`qrm-theme-${config.theme}`);

  const shell = createElement('section', 'quiz-router-mccs-shell');
  const masthead = buildMasthead(config);
  const surface = createElement('div', 'quiz-router-mccs-surface');
  shell.append(masthead, surface);
  block.replaceChildren(shell);

  const stepMap = new Map(model.steps.map((step) => [step.stepId, step]));
  const initialView = model.landing
    ? { type: 'landing' }
    : { type: 'question', stepId: model.rootStepId };

  const state = {
    answers: {},
    history: [],
    isBusy: false,
    view: initialView,
  };

  function render({ track = true } = {}) {
    surface.replaceChildren();
    shell.classList.toggle('is-loading', state.isBusy);

    if (state.view.type === 'landing') {
      const landingView = buildLandingView(model, config, () => {
        state.history.push(state.view);
        state.view = { type: 'question', stepId: model.rootStepId };
        render();
      });
      surface.append(landingView);
      if (track) {
        dispatchAnalytics(config, { event: 'landing-view' });
      }
      focusHeading(surface);
      return;
    }

    if (state.view.type === 'question') {
      const step = stepMap.get(state.view.stepId);
      if (!step) {
        const message = createElement('p', 'quiz-router-mccs-empty');
        message.textContent = 'This quiz step could not be found. Check the authored #step destination values.';
        surface.append(message);
        return;
      }
      const questionDepth = state.history.filter((entry) => entry.type === 'question').length + 1;
      const questionView = buildQuestionView(
        model,
        config,
        step,
        questionDepth,
        state,
        () => {
          if (!state.history.length || state.isBusy) return;
          state.view = state.history.pop();
          render();
        },
        async (selectedStep, option) => {
          if (state.isBusy) return;

          state.answers[selectedStep.stepId] = option.optionId;

          dispatchAnalytics(config, {
            event: 'option-select',
            stepId: selectedStep.stepId,
            optionTitle: option.title,
            optionIndex: option.optionIndex,
            dest: option.href || option.targetStepId || '',
          });

          if (option.action === 'disabled') return;

          if (option.action === 'next' || option.action === 'step') {
            if (!option.targetStepId || !stepMap.has(option.targetStepId)) return;
            state.history.push(state.view);
            state.view = { type: 'question', stepId: option.targetStepId };
            render();
            return;
          }

          if (option.action === 'fragment' && config.resultMode === 'fragment') {
            state.isBusy = true;
            render({ track: false });

            try {
              const fragment = await loadFragment(option.href);
              if (fragment) {
                const fragmentSections = [...fragment.children]
                  .filter((child) => child.nodeType === Node.ELEMENT_NODE);

                state.isBusy = false;
                state.history.push(state.view);
                state.view = {
                  type: 'result',
                  stepId: selectedStep.stepId,
                  optionId: option.optionId,
                  fragmentSections,
                };
                render();
                return;
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn(`quiz-router-mccs: fragment load failed for "${option.href}". Falling back to navigation.`, error);
            }

            state.isBusy = false;
            dispatchAnalytics(config, {
              event: 'result-navigate',
              stepId: selectedStep.stepId,
              optionTitle: option.title,
              optionIndex: option.optionIndex,
              dest: option.href,
            });
            navigateTo(option.href);
            return;
          }

          dispatchAnalytics(config, {
            event: 'result-navigate',
            stepId: selectedStep.stepId,
            optionTitle: option.title,
            optionIndex: option.optionIndex,
            dest: option.href,
          });
          navigateTo(option.href);
        },
      );

      surface.append(questionView);
      if (track) {
        dispatchAnalytics(config, {
          event: 'step-view',
          stepId: step.stepId,
        });
      }
      focusHeading(surface);
      return;
    }

    if (state.view.type === 'result') {
      const step = stepMap.get(state.view.stepId);
      const option = step?.options.find((entry) => entry.optionId === state.view.optionId);
      if (!step || !option) {
        const message = createElement('p', 'quiz-router-mccs-empty');
        message.textContent = 'This quiz result could not be rendered. Check the authored destinations for this option.';
        surface.append(message);
        return;
      }
      const resultView = buildResultView(config, {
        step,
        option,
        fragmentSections: state.view.fragmentSections,
        historyDepth: state.history.length,
      }, () => {
        if (!state.history.length || state.isBusy) return;
        state.view = state.history.pop();
        render();
      }, () => {
        state.answers = {};
        state.history = [];
        state.view = model.landing
          ? { type: 'landing' }
          : { type: 'question', stepId: model.rootStepId };
        render();
      });
      surface.append(resultView);
      if (track) {
        dispatchAnalytics(config, {
          event: 'result-view',
          stepId: step.stepId,
          optionTitle: option.title,
          optionIndex: option.optionIndex,
          dest: option.href,
        });
      }
      focusHeading(surface);
    }
  }

  render();
}
