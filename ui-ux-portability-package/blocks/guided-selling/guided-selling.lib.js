import { cloneGuidedSellingSample } from './guided-selling.sample.js';

const SOURCE_HOSTS = new Set(['da.live', 'www.da.live', 'content.da.live']);
const ALLOWED_THEMES = new Set(['dark', 'light']);
const PREVIEW_PATTERN = /\/(?:\.da\/library\/blocks|library\/blocks)\/guided-selling\/?$/;

export const DEFAULT_CONFIG = {
  eyebrow: 'AI-Powered Style Match',
  title: 'FIND YOUR\nPERFECT\nGEAR',
  subtitle: 'Answer 7 quick questions and we will build a personalized shopping list matched to your life, mission, and style.',
  startCtaLabel: 'Start Finding My Style',
  resultsCtaLabel: 'Shop All Recommendations',
  resultsCtaUrl: '#shop-all',
  theme: 'dark',
  analyticsId: 'mcx-guided-selling',
  dataSource: '',
};

function toText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function toMultilineText(value, fallback = '') {
  return toText(value, fallback).replace(/\\n/g, '\n');
}

function toSlug(value, fallback = 'guided-selling') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => toText(entry))
    .filter(Boolean);
}

function normalizeImage(image) {
  if (!image) return { src: '', alt: '', emoji: '' };
  if (typeof image === 'string') return { src: image.trim(), alt: '', emoji: '' };

  return {
    src: toText(image.src),
    alt: toText(image.alt),
    emoji: toText(image.emoji),
  };
}

function normalizeOption(option, index) {
  return {
    value: toText(option?.value, `option-${index + 1}`),
    icon: toText(option?.icon),
    label: toText(option?.label),
    description: toText(option?.description),
    tag: toText(option?.tag),
    profileTag: toText(option?.profileTag),
  };
}

export function getMinimumSelections(step) {
  if (step.required === false) {
    return Math.max(0, Number(step.minSelections) || 0);
  }

  if (step.selectionMode === 'multi') {
    return Math.max(1, Number(step.minSelections) || 1);
  }

  return 1;
}

function normalizeStep(step, index) {
  const selectionMode = toText(step?.selectionMode, 'single').toLowerCase() === 'multi'
    ? 'multi'
    : 'single';
  const layout = ['card', 'slim', 'image'].includes(toText(step?.layout, 'card').toLowerCase())
    ? toText(step?.layout, 'card').toLowerCase()
    : 'card';
  const options = Array.isArray(step?.options)
    ? step.options.map(normalizeOption).filter((option) => option.label && option.value)
    : [];
  const required = step?.required !== false;
  const normalized = {
    id: toText(step?.id, `step-${index + 1}`),
    category: toText(step?.category, `Step ${index + 1}`),
    question: toMultilineText(step?.question),
    description: toText(step?.description),
    selectionMode,
    layout,
    required,
    minSelections: Number(step?.minSelections) || undefined,
    options,
  };

  normalized.minSelections = getMinimumSelections(normalized);
  return normalized;
}

function normalizeResultItem(item, index) {
  return {
    id: toText(item?.id, `result-${index + 1}`),
    matchAny: normalizeArray(item?.matchAny),
    matchAll: normalizeArray(item?.matchAll),
    score: Number(item?.score) || 0,
    badge: toText(item?.badge),
    title: toText(item?.title),
    description: toText(item?.description),
    href: toText(item?.href),
    ctaLabel: toText(item?.ctaLabel, 'View Details'),
    price: toText(item?.price),
    compareAt: toText(item?.compareAt),
    saving: toText(item?.saving),
    sku: toText(item?.sku),
    tags: normalizeArray(item?.tags),
    icon: toText(item?.icon),
    image: normalizeImage(item?.image),
  };
}

export function normalizeConfig(rawConfig = {}) {
  const theme = toText(rawConfig.theme, DEFAULT_CONFIG.theme).toLowerCase();

  return {
    eyebrow: toText(rawConfig.eyebrow, DEFAULT_CONFIG.eyebrow),
    title: toMultilineText(rawConfig.title, DEFAULT_CONFIG.title),
    subtitle: toMultilineText(rawConfig.subtitle, DEFAULT_CONFIG.subtitle),
    startCtaLabel: toText(rawConfig['start-cta-label'], DEFAULT_CONFIG.startCtaLabel),
    resultsCtaLabel: toText(rawConfig['results-cta-label'], DEFAULT_CONFIG.resultsCtaLabel),
    resultsCtaUrl: toText(rawConfig['results-cta-url'], DEFAULT_CONFIG.resultsCtaUrl),
    theme: ALLOWED_THEMES.has(theme) ? theme : DEFAULT_CONFIG.theme,
    analyticsId: toText(rawConfig['analytics-id'], DEFAULT_CONFIG.analyticsId),
    dataSource: toText(rawConfig['data-source']),
  };
}

export function isGuidedSellingLibraryPreview(pathname = window.location.pathname) {
  return PREVIEW_PATTERN.test(pathname);
}

function getCurrentOrigin() {
  if (window.location.origin) return window.location.origin;
  return new URL(window.location.href).origin;
}

export function resolveDataSourceUrl(rawSource, origin = getCurrentOrigin()) {
  const source = toText(rawSource);
  if (!source) {
    throw new Error('Guided selling requires a JSON data source.');
  }

  const url = new URL(source, origin);
  if (!/\.json($|\?)/i.test(url.pathname)) {
    throw new Error('Guided selling data source must point to a JSON file.');
  }

  if (url.origin === origin) {
    return url.toString();
  }

  if (!SOURCE_HOSTS.has(url.hostname)) {
    throw new Error('Guided selling data source must be repo-relative or hosted on da.live.');
  }

  return url.toString();
}

export function normalizeDataset(dataset) {
  const steps = Array.isArray(dataset?.steps)
    ? dataset.steps.map(normalizeStep).filter((step) => step.options.length)
    : [];

  if (!steps.length) {
    throw new Error('Guided selling dataset requires at least one step with options.');
  }

  const hasCustomProgressSteps = Array.isArray(dataset?.progressSteps)
    && dataset.progressSteps.length === steps.length;
  const progressSteps = hasCustomProgressSteps
    ? dataset.progressSteps.map((step, index) => ({
      id: toText(step?.id, steps[index].id),
      label: toText(step?.label, steps[index].category),
    }))
    : steps.map((step) => ({
      id: step.id,
      label: step.category,
    }));

  return {
    id: toText(dataset?.id, 'guided-selling'),
    version: toText(dataset?.version, '1.0.0'),
    progressSteps,
    profiles: typeof dataset?.profiles === 'object' && dataset?.profiles
      ? dataset.profiles
      : {},
    steps,
    loadingMessages: normalizeArray(dataset?.loadingMessages),
    results: {
      summaryScore: Number(dataset?.results?.summaryScore) || 0,
      totalMatches: Number(dataset?.results?.totalMatches) || 0,
      cards: Array.isArray(dataset?.results?.cards)
        ? dataset.results.cards.map(normalizeResultItem).filter((item) => item.title)
        : [],
      categories: Array.isArray(dataset?.results?.categories)
        ? dataset.results.categories.map(normalizeResultItem).filter((item) => item.title)
        : [],
      bundles: Array.isArray(dataset?.results?.bundles)
        ? dataset.results.bundles.map(normalizeResultItem).filter((item) => item.title)
        : [],
    },
  };
}

export function getPreviewDataset() {
  return normalizeDataset(cloneGuidedSellingSample());
}

export function buildStorageKeys(config, dataset, pathname = window.location.pathname) {
  const slug = toSlug(config.analyticsId || dataset.id || pathname);
  return {
    session: `guided-selling:${slug}:session`,
    saved: `guided-selling:${slug}:saved-profile`,
  };
}

export function sanitizeAnswers(dataset, answers = {}) {
  return dataset.steps.reduce((acc, step) => {
    const validValues = new Set(step.options.map((option) => option.value));
    const raw = Array.isArray(answers[step.id]) ? answers[step.id] : [];
    const selected = [
      ...new Set(
        raw
          .map((value) => toText(value))
          .filter((value) => validValues.has(value)),
      ),
    ];

    acc[step.id] = step.selectionMode === 'single'
      ? selected.slice(0, 1)
      : selected;

    return acc;
  }, {});
}

export function getSelectedValues(answers = {}) {
  return Object.values(answers).flat();
}

export function isStepValid(step, answers = {}) {
  return (answers[step.id] || []).length >= getMinimumSelections(step);
}

export function getOptionLookup(dataset) {
  const lookup = new Map();
  dataset.steps.forEach((step) => {
    step.options.forEach((option) => {
      lookup.set(option.value, {
        ...option,
        stepId: step.id,
        stepCategory: step.category,
      });
    });
  });
  return lookup;
}

export function getProfileForAnswers(dataset, answers = {}) {
  const firstStep = dataset.steps[0];
  const selected = firstStep ? answers[firstStep.id]?.[0] : '';
  return dataset.profiles[selected] || dataset.profiles.default || {
    avatar: '🛍️',
    name: 'Marine Shopper',
    subtitle: 'Personalized recommendations are ready.',
  };
}

export function getProfileTags(dataset, answers = {}, limit = 4) {
  const optionLookup = getOptionLookup(dataset);
  const tags = [];

  getSelectedValues(answers).forEach((value) => {
    const option = optionLookup.get(value);
    if (option?.profileTag && !tags.includes(option.profileTag)) {
      tags.push(option.profileTag);
    }
  });

  return tags.slice(0, limit);
}

function matchItem(item, selectedSet) {
  if (item.matchAll.length && item.matchAll.some((value) => !selectedSet.has(value))) {
    return null;
  }

  const matchedAnyCount = item.matchAny.reduce(
    (count, value) => count + (selectedSet.has(value) ? 1 : 0),
    0,
  );

  if (item.matchAny.length && matchedAnyCount === 0) {
    return null;
  }

  return {
    ...item,
    matchedAnyCount,
  };
}

function compareRankedItems(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.matchedAnyCount !== a.matchedAnyCount) return b.matchedAnyCount - a.matchedAnyCount;
  return a.title.localeCompare(b.title);
}

export function rankResultItems(items = [], selectedValues = [], limit = Infinity) {
  const selectedSet = new Set(selectedValues);
  const matches = items
    .map((item) => matchItem(item, selectedSet))
    .filter(Boolean)
    .sort(compareRankedItems);

  if (matches.length) {
    return matches.slice(0, limit);
  }

  return [...items]
    .map((item) => ({
      ...item,
      matchedAnyCount: 0,
    }))
    .sort(compareRankedItems)
    .slice(0, limit);
}
