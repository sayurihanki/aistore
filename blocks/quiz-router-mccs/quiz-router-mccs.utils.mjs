export const BLOCK_NAME = 'quiz-router-mccs';
export const DEFAULT_THEME = 'welcome';
export const DEFAULT_RESULT_MODE = 'fragment';
export const NEXT_STEP = '#next';
export const STEP_PREFIX = '#step:';

const THEMES = new Set(['default', 'welcome', 'neutral']);
const RESULT_MODES = new Set(['fragment', 'page']);

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function toSlug(value, fallback = BLOCK_NAME) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

export function humanizeToken(value, fallback = 'Question') {
  const text = String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!text) return fallback;

  return text
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function splitAuthoredLines(value = '') {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeQuizConfig(rawConfig = {}, context = {}) {
  const pathSlug = toSlug(context.pathSlug || 'arrival-guide', 'arrival-guide');
  const themeValue = String(rawConfig.theme || rawConfig['quizrouter-theme'] || DEFAULT_THEME)
    .trim()
    .toLowerCase();
  const resultModeValue = String(
    rawConfig.resultMode || rawConfig['quizrouter-result-mode'] || DEFAULT_RESULT_MODE,
  )
    .trim()
    .toLowerCase();
  const progressValue = rawConfig.progress ?? rawConfig['quizrouter-progress'] ?? 'true';

  return {
    quizId: toSlug(rawConfig.quizId || rawConfig['quizrouter-id'] || pathSlug, pathSlug),
    progress: String(progressValue).trim().toLowerCase() !== 'false',
    theme: THEMES.has(themeValue) ? themeValue : DEFAULT_THEME,
    resultMode: RESULT_MODES.has(resultModeValue) ? resultModeValue : DEFAULT_RESULT_MODE,
    base: String(rawConfig.base || rawConfig['quizrouter-base'] || '').trim(),
    journey: String(rawConfig.journey || rawConfig['quizrouter-journey'] || '').trim(),
  };
}

export function parseRowType(rawType) {
  const normalized = String(rawType || '').trim().toLowerCase();

  if (normalized === 'landing') {
    return { kind: 'landing', stepId: '' };
  }

  if (normalized === 'question') {
    return { kind: 'question', stepId: '' };
  }

  if (normalized.startsWith('question:')) {
    const stepId = toSlug(normalized.slice('question:'.length), '');
    if (!stepId) {
      return { kind: 'unsupported', stepId: '' };
    }
    return { kind: 'question', stepId };
  }

  if (normalized === 'option') {
    return { kind: 'option', stepId: '' };
  }

  return { kind: 'unsupported', stepId: '' };
}

export function isFragmentPath(href) {
  const normalized = String(href || '').trim();
  if (!normalized.startsWith('/')) return false;
  return normalized.startsWith('/fragments/') || normalized.includes('/fragments/');
}

export function sanitizeDestination(rawDestination, context = {}) {
  const raw = String(rawDestination || '').trim();
  if (!raw) return '';

  const lower = raw.toLowerCase();
  if (lower === NEXT_STEP) return NEXT_STEP;

  if (lower.startsWith(STEP_PREFIX)) {
    const targetId = toSlug(raw.slice(STEP_PREFIX.length), '');
    return targetId ? `${STEP_PREFIX}${targetId}` : '';
  }

  if (raw.startsWith('#')) {
    return '';
  }

  if (raw.startsWith('//')) {
    return '';
  }

  const origin = context.origin || 'https://example.com';
  const pathname = context.pathname || '/';
  const baseUrl = new URL(pathname, `${origin}/`);

  if (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('?')) {
    try {
      const parsed = new URL(raw, baseUrl);
      if (parsed.origin !== origin) return '';
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return '';
    }
  }

  try {
    const parsed = new URL(raw, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (parsed.origin !== origin) return '';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '';
  }
}

export function parseLandingParts(parts = []) {
  const normalized = parts.map((part) => String(part || '').trim()).filter(Boolean);
  return {
    title: normalized[0] || '',
    subtitle: normalized[1] || '',
    tagline: normalized[2] || '',
  };
}

export function parseQuestionParts(parts = []) {
  const normalized = parts.map((part) => String(part || '').trim()).filter(Boolean);
  return {
    title: normalized[0] || '',
    subtitle: normalized[1] || '',
  };
}

export function parseOptionParts(parts = []) {
  const normalized = parts.map((part) => String(part || '').trim()).filter(Boolean);

  if (normalized.length >= 3) {
    return {
      badge: normalized[0],
      title: normalized[1],
      description: normalized[2],
    };
  }

  if (normalized.length === 2) {
    return {
      badge: '',
      title: normalized[0],
      description: normalized[1],
    };
  }

  return {
    badge: '',
    title: normalized[0] || '',
    description: '',
  };
}

export function buildLongestPathByStepId(steps = []) {
  const stepMap = new Map(steps.map((step) => [step.stepId, step]));
  const memo = new Map();

  function walk(stepId, visited = new Set()) {
    if (!stepMap.has(stepId)) return 0;
    if (memo.has(stepId)) return memo.get(stepId);
    if (visited.has(stepId)) return 1;

    const nextVisited = new Set(visited);
    nextVisited.add(stepId);

    const step = stepMap.get(stepId);
    let best = 1;

    step.options.forEach((option) => {
      if (!['next', 'step'].includes(option.action)) return;
      if (!option.targetStepId || !stepMap.has(option.targetStepId)) return;
      best = Math.max(best, 1 + walk(option.targetStepId, nextVisited));
    });

    memo.set(stepId, best);
    return best;
  }

  steps.forEach((step) => {
    walk(step.stepId);
  });

  return Object.fromEntries(memo.entries());
}

export function getProgressState(stepId, questionDepth, longestPathByStepId = {}) {
  const current = Math.max(1, Number(questionDepth) || 1);
  const remaining = Math.max(1, Number(longestPathByStepId[stepId]) || 1);

  return {
    current,
    total: current + remaining - 1,
  };
}

export function buildAnalyticsDetail(config, payload = {}) {
  const detail = {
    quizId: config.quizId,
    base: config.base,
    journey: config.journey,
    event: payload.event,
  };

  if (hasValue(payload.stepId)) {
    detail.stepId = String(payload.stepId).trim();
  }

  if (hasValue(payload.optionTitle)) {
    detail.optionTitle = String(payload.optionTitle).trim();
  }

  if (Number.isInteger(payload.optionIndex)) {
    detail.optionIndex = payload.optionIndex;
  }

  if (hasValue(payload.dest)) {
    detail.dest = String(payload.dest).trim();
  }

  return detail;
}

export function parseTypedRows(rows = [], context = {}) {
  const warnings = [];
  const rawSteps = [];
  let landing = null;
  let currentStep = null;
  let autoStepCount = 0;

  rows.forEach((row, index) => {
    const rowNum = row.rowNum || index + 1;
    const parsedType = parseRowType(row.type);

    if (parsedType.kind === 'landing') {
      const landingParts = parseLandingParts(row.parts);
      if (!landingParts.title) {
        warnings.push(`quiz-router-mccs: row ${rowNum} landing screen has no title.`);
        return;
      }

      landing = {
        ...landingParts,
        startLabel: String(row.destination || '').trim() || 'Start your arrival guide',
      };
      return;
    }

    if (parsedType.kind === 'question') {
      const questionParts = parseQuestionParts(row.parts);
      if (!questionParts.title) {
        warnings.push(`quiz-router-mccs: row ${rowNum} question has no title.`);
        return;
      }

      autoStepCount += parsedType.stepId ? 0 : 1;
      currentStep = {
        rowNum,
        stepId: parsedType.stepId || `q${autoStepCount}`,
        title: questionParts.title,
        subtitle: questionParts.subtitle,
        options: [],
      };
      rawSteps.push(currentStep);
      return;
    }

    if (parsedType.kind === 'option') {
      if (!currentStep) {
        warnings.push(`quiz-router-mccs: row ${rowNum} option has no preceding question.`);
        return;
      }

      const optionParts = parseOptionParts(row.parts);
      if (!optionParts.title) {
        warnings.push(`quiz-router-mccs: row ${rowNum} option has no title.`);
        return;
      }

      currentStep.options.push({
        rowNum,
        optionIndex: currentStep.options.length,
        optionId: `${currentStep.stepId}-o${currentStep.options.length + 1}`,
        ...optionParts,
        destinationRaw: String(row.destination || '').trim(),
      });
      return;
    }

    warnings.push(`quiz-router-mccs: row ${rowNum} has unsupported type "${row.type}".`);
  });

  rawSteps.forEach((step) => {
    if (step.options.length === 0) {
      warnings.push(`quiz-router-mccs: row ${step.rowNum} question "${step.title}" has no options and will be skipped.`);
    }
  });

  const steps = rawSteps.filter((step) => step.options.length > 0);
  const stepMap = new Map(steps.map((step) => [step.stepId, step]));

  steps.forEach((step, stepIndex) => {
    const nextStepId = steps[stepIndex + 1]?.stepId || '';

    step.options = step.options.map((option) => {
      const hasDestinationInput = option.destinationRaw !== '';
      const sanitized = sanitizeDestination(option.destinationRaw, context);

      if (!hasDestinationInput || sanitized === NEXT_STEP) {
        if (!nextStepId) {
          warnings.push(`quiz-router-mccs: row ${option.rowNum} uses "${NEXT_STEP}" but there is no following question.`);
        }

        return {
          ...option,
          action: 'next',
          targetStepId: nextStepId,
          href: '',
        };
      }

      if (sanitized.startsWith(STEP_PREFIX)) {
        const targetStepId = sanitized.slice(STEP_PREFIX.length);
        if (!stepMap.has(targetStepId)) {
          warnings.push(`quiz-router-mccs: row ${option.rowNum} points to unknown step "${targetStepId}".`);
          return {
            ...option,
            action: 'disabled',
            targetStepId: '',
            href: '',
          };
        }

        return {
          ...option,
          action: 'step',
          targetStepId,
          href: '',
        };
      }

      if (!sanitized) {
        warnings.push(`quiz-router-mccs: row ${option.rowNum} has blocked destination "${option.destinationRaw || '(empty)'}".`);
        return {
          ...option,
          action: 'disabled',
          targetStepId: '',
          href: '',
        };
      }

      return {
        ...option,
        action: isFragmentPath(sanitized) ? 'fragment' : 'page',
        targetStepId: '',
        href: sanitized,
      };
    });
  });

  return {
    landing,
    rootStepId: steps[0]?.stepId || '',
    steps,
    warnings,
    longestPathByStepId: buildLongestPathByStepId(steps),
  };
}
