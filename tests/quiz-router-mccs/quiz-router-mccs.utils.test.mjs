import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  BLOCK_NAME,
  buildAnalyticsDetail,
  getProgressState,
  normalizeQuizConfig,
  parseTypedRows,
  splitAuthoredLines,
} from '../../blocks/quiz-router-mccs/quiz-router-mccs.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeQuizConfig applies MCCS defaults and slugs the quiz id', () => {
  const config = normalizeQuizConfig({
    quizId: 'New To Base',
  }, {
    pathSlug: 'camp-pendleton-arrival',
  });

  assert.deepEqual(config, {
    quizId: 'new-to-base',
    progress: true,
    theme: 'welcome',
    resultMode: 'fragment',
    base: '',
    journey: '',
  });
});

test('splitAuthoredLines supports both literal <br> tokens and normal new lines', () => {
  assert.deepEqual(
    splitAuthoredLines('Welcome.<br>Let us get your family settled.<br />Marine Corps Community Services'),
    ['Welcome.', 'Let us get your family settled.', 'Marine Corps Community Services'],
  );

  assert.deepEqual(
    splitAuthoredLines('Line one\nLine two\n\nLine three'),
    ['Line one', 'Line two', 'Line three'],
  );
});

test('parseTypedRows resolves landing, named steps, next actions, fragment results, and page routes', () => {
  const parsed = parseTypedRows([
    {
      rowNum: 1,
      type: 'landing',
      parts: ['Welcome to Camp Pendleton', 'We will guide your family through arrival.', 'Programs, shopping, and support all in one place.'],
      destination: 'Start your arrival guide',
    },
    {
      rowNum: 2,
      type: 'question',
      parts: ['What matters most right now?', 'Choose the area where you need support first.'],
      destination: '',
    },
    {
      rowNum: 3,
      type: 'option',
      parts: ['Arriving soon', 'We need a safe place to land', 'Temporary lodging and first-night essentials.'],
      destination: '#step:lodge',
    },
    {
      rowNum: 4,
      type: 'option',
      parts: ['Big picture', 'We want the full welcome guide', 'A complete 30-day overview of programs and resources.'],
      destination: '/camp-pendleton/welcome',
    },
    {
      rowNum: 5,
      type: 'question:lodge',
      parts: ['How soon does your family need housing?', 'Temporary and permanent housing follow different timelines.'],
      destination: '',
    },
    {
      rowNum: 6,
      type: 'option',
      parts: ['Urgent', 'Tonight or this week', 'We need somewhere to stay right now.'],
      destination: '/fragments/camp-pendleton/temporary-lodging',
    },
    {
      rowNum: 7,
      type: 'option',
      parts: ['Planning ahead', 'Within the next month', 'We are working through PCS orders before arrival.'],
      destination: '#next',
    },
    {
      rowNum: 8,
      type: 'question:admin',
      parts: ['What paperwork comes first?', 'We will point you to the must-do appointments.'],
      destination: '',
    },
    {
      rowNum: 9,
      type: 'option',
      parts: ['Admin', 'ID cards and enrollment', 'Which offices to visit and what to bring.'],
      destination: '/fragments/camp-pendleton/admin-essentials',
    },
  ], {
    origin: 'https://example.com',
    pathname: '/camp-pendleton/arrival-guide',
  });

  assert.equal(parsed.rootStepId, 'q1');
  assert.equal(parsed.landing.startLabel, 'Start your arrival guide');
  assert.equal(parsed.steps.length, 3);

  assert.equal(parsed.steps[0].options[0].action, 'step');
  assert.equal(parsed.steps[0].options[0].targetStepId, 'lodge');
  assert.equal(parsed.steps[0].options[1].action, 'page');
  assert.equal(parsed.steps[1].options[0].action, 'fragment');
  assert.equal(parsed.steps[1].options[1].action, 'next');
  assert.equal(parsed.steps[1].options[1].targetStepId, 'admin');
  assert.deepEqual(parsed.longestPathByStepId, {
    q1: 3,
    lodge: 2,
    admin: 1,
  });
});

test('parseTypedRows emits warnings for invalid authoring and blocked destinations', () => {
  const parsed = parseTypedRows([
    {
      rowNum: 1,
      type: 'option',
      parts: ['Broken option'],
      destination: '/off-base',
    },
    {
      rowNum: 2,
      type: 'question',
      parts: ['Valid question'],
      destination: '',
    },
    {
      rowNum: 3,
      type: 'option',
      parts: ['External', 'Invalid destination', 'Should be disabled.'],
      destination: 'https://offsite.example.org/page',
    },
    {
      rowNum: 4,
      type: 'question:missing',
      parts: [''],
      destination: '',
    },
    {
      rowNum: 5,
      type: 'mystery',
      parts: ['Unknown row'],
      destination: '',
    },
  ], {
    origin: 'https://example.com',
    pathname: '/camp-pendleton/arrival-guide',
  });

  assert.equal(parsed.steps.length, 1);
  assert.equal(parsed.steps[0].options[0].action, 'disabled');
  assert.ok(parsed.warnings.some((warning) => warning.includes('option has no preceding question')));
  assert.ok(parsed.warnings.some((warning) => warning.includes('blocked destination')));
  assert.ok(parsed.warnings.some((warning) => warning.includes('question has no title')));
  assert.ok(parsed.warnings.some((warning) => warning.includes('unsupported type')));
});

test('buildAnalyticsDetail includes MCCS quiz metadata and optional routing details', () => {
  const detail = buildAnalyticsDetail({
    quizId: 'new-to-base',
    base: 'camp-pendleton',
    journey: 'arrival',
  }, {
    event: 'result-view',
    stepId: 'lodge',
    optionTitle: 'Tonight or this week',
    optionIndex: 0,
    dest: '/fragments/camp-pendleton/temporary-lodging',
  });

  assert.deepEqual(detail, {
    quizId: 'new-to-base',
    base: 'camp-pendleton',
    journey: 'arrival',
    event: 'result-view',
    stepId: 'lodge',
    optionTitle: 'Tonight or this week',
    optionIndex: 0,
    dest: '/fragments/camp-pendleton/temporary-lodging',
  });
  assert.equal(BLOCK_NAME, 'quiz-router-mccs');
});

test('getProgressState uses the current question depth plus the remaining reachable path', () => {
  const progress = getProgressState('lodge', 2, {
    q1: 3,
    lodge: 2,
  });

  assert.deepEqual(progress, {
    current: 2,
    total: 3,
  });
});
