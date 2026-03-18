const STEP_LABELS = ['Military Life', 'Interests', 'Communication'];

const STEP_BRIEFS = [
  {
    kicker: 'Step 01',
    title: 'Map your MCCS profile',
    body: 'Ground the experience in installation, household, and service context so the recommendations feel mission-ready from the first session.',
  },
  {
    kicker: 'Step 02',
    title: 'Tune shopping and recreation',
    body: 'Shape merchandising, MWR, and life-services highlights around the routines, programs, and events that matter most to your household.',
  },
  {
    kicker: 'Step 03',
    title: 'Set communication rules',
    body: 'Lock in channel, cadence, and fulfillment preferences so the follow-up feels useful, precise, and never noisy.',
  },
];

const SERVICE_STATUS_OPTIONS = [
  ['active_duty', 'Active Duty'],
  ['spouse_dependent', 'Spouse / Dependent'],
  ['veteran_retiree', 'Veteran / Retiree'],
  ['dod_civilian', 'DoD / Coast Guard Civilian'],
];

const INSTALLATION_OPTIONS = [
  ['', 'Select your primary installation'],
  ['camp_pendleton', 'Camp Pendleton, CA'],
  ['camp_lejeune', 'Camp Lejeune, NC'],
  ['quantico', 'Marine Corps Base Quantico, VA'],
  ['twentynine_palms', 'MCAGCC Twentynine Palms, CA'],
  ['camp_butler', 'MCB Camp Butler, Okinawa'],
  ['cherry_point', 'MCAS Cherry Point, NC'],
  ['miramar', 'MCAS Miramar, CA'],
  ['parris_island', 'MCRD Parris Island, SC'],
  ['san_diego', 'MCRD San Diego, CA'],
  ['iwakuni', 'MCAS Iwakuni, Japan'],
  ['kaneohe_bay', 'MCB Hawaii (Kaneohe Bay)'],
  ['albany', 'MCLB Albany, GA'],
  ['barstow', 'MCLB Barstow, CA'],
  ['new_river', 'MCAS New River, NC'],
  ['beaufort', 'MCAS Beaufort, SC'],
  ['henderson_hall', 'Henderson Hall, VA'],
  ['other', 'Other / Not listed'],
];

const BRANCH_OPTIONS = [
  ['', 'Select branch'],
  ['usmc', 'U.S. Marine Corps'],
  ['navy', 'U.S. Navy'],
  ['army', 'U.S. Army'],
  ['air_force', 'U.S. Air Force'],
  ['space_force', 'U.S. Space Force'],
  ['coast_guard', 'U.S. Coast Guard'],
  ['civilian', 'Civilian / N/A'],
];

const RANK_OPTIONS = [
  ['', 'Select rank category'],
  ['enlisted_junior', 'Enlisted (E1-E3)'],
  ['enlisted_nco', 'NCO (E4-E5)'],
  ['enlisted_snco', 'SNCO (E6-E9)'],
  ['warrant', 'Warrant Officer'],
  ['officer_company', 'Company Grade Officer (O1-O3)'],
  ['officer_field', 'Field Grade Officer (O4-O6)'],
  ['officer_general', 'General / Flag Officer (O7+)'],
  ['civilian', 'Civilian / N/A'],
];

const HOUSEHOLD_OPTIONS = [
  ['', 'Select household size'],
  ['1', 'Just me'],
  ['2', '2 people'],
  ['3', '3 people'],
  ['4', '4 people'],
  ['5', '5 people'],
  ['6+', '6+ people'],
];

const SPOUSE_OPTIONS = [
  ['', 'Select one'],
  ['yes', 'Yes'],
  ['no', 'No'],
  ['na', 'N/A'],
];

const SERVICE_STATUS_LABELS = Object.fromEntries(SERVICE_STATUS_OPTIONS);
const FREQUENCY_LABELS = {
  realtime: 'Real-time',
  weekly: 'Weekly',
  monthly: 'Monthly',
  minimal: 'Minimal',
};

function controlId(key) {
  return `mpn-${key}`;
}

function fieldId(key) {
  return `mpn-field-${key}`;
}

function messageId(key) {
  return `mpn-msg-${key}`;
}

function counterId(key) {
  return `mpn-counter-${key}`;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'className') node.className = value;
    else if (key === 'textContent') node.textContent = value;
    else if (key === 'htmlFor') node.setAttribute('for', value);
    else if (key === 'ariaLive') node.setAttribute('aria-live', value);
    else if (key === 'attributes') {
      Object.entries(value).forEach(([attr, attrValue]) => {
        node.setAttribute(attr, attrValue);
      });
    } else {
      node[key] = value;
    }
  });

  const childList = Array.isArray(children) ? children : [children];
  childList.forEach((child) => {
    if (child === undefined || child === null) return;
    if (typeof child === 'string') {
      node.append(child);
      return;
    }
    node.append(child);
  });

  return node;
}

function buildFieldLabel(label, { required = false, optional = false } = {}) {
  const labelNode = el('div', { className: 'mpn-field-label' }, label);

  if (required) {
    labelNode.append(el('span', { className: 'mpn-field-required', textContent: '*' }));
  } else if (optional) {
    labelNode.append(el('span', {
      className: 'mpn-field-optional',
      textContent: 'Optional',
    }));
  }

  return labelNode;
}

function buildMessage(key) {
  return el('span', {
    className: 'mpn-field-message',
    id: messageId(key),
    ariaLive: 'polite',
  });
}

function buildCounter(key, maxLength) {
  return el('div', {
    className: 'mpn-field-counter',
    id: counterId(key),
    textContent: `0 / ${maxLength}`,
  });
}

function createField({
  key,
  name,
  label,
  type = 'text',
  options = [],
  placeholder = '',
  required = false,
  optional = false,
  span2 = false,
  maxLength,
}) {
  const field = el('div', {
    className: `mpn-field${span2 ? ' mpn-span2' : ''}`,
    id: fieldId(key),
  });
  const wrap = el('div', { className: 'mpn-input-wrap' });
  let input;

  field.append(buildFieldLabel(label, { required, optional }));

  if (type === 'textarea') {
    input = el('textarea', {
      className: 'mpn-input',
      id: controlId(key),
      name,
      rows: 4,
      placeholder,
      required,
      maxLength,
    });
  } else if (type === 'select') {
    input = el('select', {
      className: 'mpn-input',
      id: controlId(key),
      name,
      required,
    });

    options.forEach(([value, text]) => {
      input.append(el('option', { value, textContent: text }));
    });

    wrap.append(input, el('span', {
      className: 'mpn-select-chevron',
      textContent: 'v',
    }));
  } else {
    input = el('input', {
      className: 'mpn-input',
      id: controlId(key),
      name,
      type,
      placeholder,
      required,
    });
  }

  input.setAttribute('data-error-key', key);

  if (type !== 'select') {
    wrap.append(input);
  }

  field.append(wrap, buildMessage(key));

  if (type === 'textarea' && maxLength) {
    field.append(buildCounter(key, maxLength));
  }

  return field;
}

function createPillGroup({
  key,
  name,
  label,
  type,
  choices,
  required = false,
  optional = false,
  span2 = true,
}) {
  const field = el('div', {
    className: `mpn-field${span2 ? ' mpn-span2' : ''}`,
    id: fieldId(key),
  });
  const pills = el('div', { className: 'mpn-pills' });

  field.append(buildFieldLabel(label, { required, optional }));

  choices.forEach(([value, text], index) => {
    const id = `${controlId(key)}-${index}`;
    const control = el('input', {
      id,
      name,
      type,
      value,
    });

    control.setAttribute('data-error-key', key);

    pills.append(el('div', { className: 'mpn-pill-cell' }, [
      control,
      el('label', { htmlFor: id, textContent: text }),
    ]));
  });

  field.append(pills, buildMessage(key));
  return field;
}

function createToggleRow(name, title, subtitle) {
  const input = el('input', {
    type: 'checkbox',
    name,
  });

  return el('div', { className: 'mpn-toggle-row' }, [
    el('div', { className: 'mpn-toggle-copy' }, [
      el('div', { className: 'mpn-toggle-title', textContent: title }),
      el('div', { className: 'mpn-toggle-subtitle', textContent: subtitle }),
    ]),
    el('label', { className: 'mpn-toggle-switch' }, [
      input,
      el('span', { className: 'mpn-toggle-track' }),
    ]),
  ]);
}

function createDivider(text) {
  return el('div', { className: 'mpn-divider' }, [
    el('span', { textContent: text }),
  ]);
}

function createProgress() {
  const progress = el('div', { className: 'mpn-progress' });

  STEP_LABELS.forEach((label, index) => {
    const step = index + 1;
    const item = el('div', {
      className: `mpn-progress-item${step === 1 ? ' is-current' : ''}`,
      id: `mpn-progress-${step}`,
    });
    const badge = el('div', {
      className: `mpn-progress-badge${step === 1 ? ' is-current' : ''}`,
    }, [
      el('span', { className: 'mpn-progress-number', textContent: String(step) }),
      el('span', { className: 'mpn-progress-check', textContent: 'OK' }),
    ]);
    const copy = el('div', { className: 'mpn-progress-copy' }, [
      el('div', { className: 'mpn-progress-kicker', textContent: STEP_BRIEFS[index].kicker }),
      el('div', { className: 'mpn-progress-label', textContent: label }),
      el('div', { className: 'mpn-progress-body', textContent: STEP_BRIEFS[index].body }),
    ]);

    item.append(
      el('div', { className: 'mpn-progress-head' }, [badge, copy]),
    );

    if (step < STEP_LABELS.length) {
      item.append(el('div', { className: 'mpn-progress-line' }, [
        el('div', {
          className: 'mpn-progress-line-fill',
          id: `mpn-progress-line-${step}`,
        }),
      ]));
    }

    progress.append(item);
  });

  return progress;
}

function createBriefingPanel(titleLineOne, titleAccent, subtitle) {
  const aside = el('aside', { className: 'mpn-aside' });
  const heading = el('h1', { className: 'mpn-title' }, titleLineOne);
  const missionMeta = STEP_BRIEFS[0];

  if (titleAccent) {
    heading.append(el('br'), el('span', {
      className: 'mpn-title-accent',
      textContent: titleAccent,
    }));
  }

  aside.append(
    el('div', { className: 'mpn-badge' }, 'MCCS Personalization Intake'),
    heading,
    el('p', { className: 'mpn-subtitle', textContent: subtitle }),
    el('div', { className: 'mpn-mission' }, [
      el('div', {
        className: 'mpn-mission-kicker',
        id: 'mpn-mission-kicker',
        textContent: missionMeta.kicker,
      }),
      el('div', {
        className: 'mpn-mission-title',
        id: 'mpn-mission-title',
        textContent: missionMeta.title,
      }),
      el('p', {
        className: 'mpn-mission-body',
        id: 'mpn-mission-body',
        textContent: missionMeta.body,
      }),
    ]),
    createProgress(),
    el('div', { className: 'mpn-trust' }, [
      el('div', { className: 'mpn-trust-item' }, [
        el('span', { className: 'mpn-trust-dot' }),
        'Client-side demo flow. No backend profile mutation in this build.',
      ]),
      el('div', { className: 'mpn-trust-item' }, [
        el('span', { className: 'mpn-trust-dot' }),
        'Preference names stay stable for future downstream mapping.',
      ]),
      el('div', { className: 'mpn-trust-item' }, [
        el('span', { className: 'mpn-trust-dot' }),
        'Reduced motion is respected across all non-essential effects.',
      ]),
    ]),
  );

  return aside;
}

function createStageHeader() {
  return el('div', { className: 'mpn-stage-header' }, [
    el('div', { className: 'mpn-stage-eyebrow', textContent: 'Command Form / Tactical Luxury' }),
    el('div', { className: 'mpn-stage-pill', id: 'mpn-top-step', textContent: 'Step 1 of 3' }),
  ]);
}

function buildStepOne() {
  const step = el('section', {
    className: 'mpn-step-panel is-active',
    id: 'mpn-step-1',
    attributes: { 'data-step': '1' },
  });
  const grid = el('div', { className: 'mpn-grid' });

  step.append(
    el('div', { className: 'mpn-step-kicker', textContent: 'Military Life' }),
    el('div', { className: 'mpn-step-title', textContent: 'Your military life' }),
    el('div', {
      className: 'mpn-step-subtitle',
      textContent: 'Help us understand your connection to MCCS so we can personalize your experience across every installation.',
    }),
  );

  grid.append(
    createPillGroup({
      key: 'service-status',
      name: 'serviceStatus',
      label: 'Service status',
      type: 'radio',
      choices: SERVICE_STATUS_OPTIONS,
      required: true,
    }),
    createField({
      key: 'installation',
      name: 'installation',
      label: 'Primary installation',
      type: 'select',
      required: true,
      span2: true,
      options: INSTALLATION_OPTIONS,
    }),
    createField({
      key: 'branch',
      name: 'branch',
      label: 'Branch',
      type: 'select',
      optional: true,
      options: BRANCH_OPTIONS,
    }),
    createField({
      key: 'rank-category',
      name: 'rankCategory',
      label: 'Rank category',
      type: 'select',
      optional: true,
      options: RANK_OPTIONS,
    }),
    createDivider('Household'),
    createPillGroup({
      key: 'children-ages',
      name: 'childrenAges',
      label: 'Children in household',
      type: 'checkbox',
      optional: true,
      choices: [
        ['infant', 'Infant / Toddler (0-2)'],
        ['preschool', 'Preschool (3-4)'],
        ['school_age', 'School Age (5-12)'],
        ['teen', 'Teen (13-17)'],
        ['none', 'No children'],
      ],
    }),
    createField({
      key: 'household-size',
      name: 'householdSize',
      label: 'Household size',
      type: 'select',
      optional: true,
      options: HOUSEHOLD_OPTIONS,
    }),
    createField({
      key: 'spouse-service',
      name: 'spouseService',
      label: 'Spouse on active duty?',
      type: 'select',
      optional: true,
      options: SPOUSE_OPTIONS,
    }),
    createDivider('Life events'),
    createPillGroup({
      key: 'milestones',
      name: 'milestones',
      label: 'Upcoming milestones',
      type: 'checkbox',
      optional: true,
      choices: [
        ['pcs', 'PCS / Relocation'],
        ['deployment', 'Deployment'],
        ['new_baby', 'New Baby'],
        ['rank_change', 'Promotion / Rank Change'],
        ['retirement', 'Retirement / Transition'],
        ['back_to_school', 'Back to School'],
        ['none', 'None right now'],
      ],
    }),
  );

  step.append(
    grid,
    el('div', { className: 'mpn-nav' }, [
      el('div'),
      el('button', {
        className: 'mpn-button mpn-button--primary',
        id: 'mpn-next-1',
        type: 'button',
      }, [
        el('span', { textContent: 'Continue' }),
        '->',
      ]),
    ]),
  );

  return step;
}

function buildStepTwo() {
  const step = el('section', {
    className: 'mpn-step-panel',
    id: 'mpn-step-2',
    attributes: { 'data-step': '2' },
  });
  const grid = el('div', { className: 'mpn-grid' });
  const toggles = el('div', {
    className: 'mpn-field mpn-span2',
    id: fieldId('services'),
  });
  const toggleList = el('div', { className: 'mpn-toggles' });

  step.append(
    el('div', { className: 'mpn-step-kicker', textContent: 'Shopping & Recreation' }),
    el('div', { className: 'mpn-step-title', textContent: 'Shopping & recreation' }),
    el('div', {
      className: 'mpn-step-subtitle',
      textContent: 'Select the categories and activities that interest you. We will use these to surface relevant offers, recommendations, and events.',
    }),
  );

  toggles.append(
    buildFieldLabel('Programs you would like to hear about', { optional: true }),
    toggleList,
  );

  [
    ['svc_childcare', 'Childcare & CDC', 'Youth programs, School Age Care, and CDC updates.'],
    ['svc_financial', 'Financial readiness', 'Budgeting, debt management, and financial counseling.'],
    ['svc_education', 'Education & tuition assistance', 'Tuition aid, scholarships, and development resources.'],
    ['svc_career', 'Career transition & employment', 'Transition Readiness, Marine For Life, and spouse employment.'],
    ['svc_relocation', 'Relocation & newcomer support', 'PCS assistance, orientation, and welcome programs.'],
    ['svc_counseling', 'Prevention & counseling', 'Stress management, wellness, and support resources.'],
  ].forEach(([name, title, subtitle]) => {
    toggleList.append(createToggleRow(name, title, subtitle));
  });

  grid.append(
    createPillGroup({
      key: 'shop-categories',
      name: 'shopCategories',
      label: 'MCX shopping interests',
      type: 'checkbox',
      choices: [
        ['uniforms', 'Uniforms & Service Wear'],
        ['electronics', 'Electronics & Gaming'],
        ['outdoor', 'Outdoor & Fitness Gear'],
        ['home', 'Home & Household'],
        ['branded', 'Marine-Branded Merch'],
        ['cosmetics', 'Cosmetics & Personal Care'],
        ['kids', 'Kids & Family'],
        ['firearms', 'Firearms & Accessories'],
      ],
    }),
    createDivider('MWR & Recreation'),
    createPillGroup({
      key: 'mwr-interests',
      name: 'mwrInterests',
      label: 'Recreation interests',
      type: 'checkbox',
      choices: [
        ['bowling', 'Bowling'],
        ['golf', 'Golf'],
        ['fitness', 'Fitness / Gym'],
        ['outdoor_rec', 'Camping & Outdoor'],
        ['marina', 'Marina & Water Sports'],
        ['youth_sports', 'Youth Sports & Activities'],
        ['arts_crafts', 'Arts & Crafts'],
        ['auto_skills', 'Auto Skills'],
      ],
    }),
    createPillGroup({
      key: 'ticket-interests',
      name: 'ticketInterests',
      label: 'Tickets & events',
      type: 'checkbox',
      choices: [
        ['theme_parks', 'Theme Parks'],
        ['sporting_events', 'Sporting Events'],
        ['concerts', 'Concerts & Shows'],
        ['local_attractions', 'Local Attractions'],
        ['travel', 'Leisure Travel'],
      ],
    }),
    createDivider('Life services'),
    toggles,
  );

  step.append(
    grid,
    el('div', { className: 'mpn-nav' }, [
      el('button', {
        className: 'mpn-button mpn-button--secondary',
        id: 'mpn-back-2',
        type: 'button',
      }, ['<-', 'Back']),
      el('button', {
        className: 'mpn-button mpn-button--primary',
        id: 'mpn-next-2',
        type: 'button',
      }, [
        el('span', { textContent: 'Continue' }),
        '->',
      ]),
    ]),
  );

  return step;
}

function buildStepThree() {
  const step = el('section', {
    className: 'mpn-step-panel',
    id: 'mpn-step-3',
    attributes: { 'data-step': '3' },
  });
  const grid = el('div', { className: 'mpn-grid' });
  const consentField = el('div', {
    className: 'mpn-field mpn-span2',
    id: fieldId('consent'),
  });
  const consentInput = el('input', {
    id: controlId('consent'),
    name: 'consent',
    type: 'checkbox',
    value: 'yes',
  });

  consentInput.setAttribute('data-error-key', 'consent');

  step.append(
    el('div', { className: 'mpn-step-kicker', textContent: 'Communication' }),
    el('div', { className: 'mpn-step-title', textContent: 'Communication preferences' }),
    el('div', {
      className: 'mpn-step-subtitle',
      textContent: 'Tell us how and when you would like to hear from MCCS. You can update these anytime from your dashboard.',
    }),
  );

  consentField.append(
    el('div', { className: 'mpn-pills' }, [
      el('div', { className: 'mpn-pill-cell mpn-pill-cell--wide' }, [
        consentInput,
        el('label', {
          className: 'mpn-consent-label',
          htmlFor: controlId('consent'),
        }, [
          'I consent to MCCS using my preferences to personalize my experience per the ',
          el('a', {
            className: 'mpn-inline-link',
            href: '#',
            textContent: 'MCCS Privacy Policy',
          }),
          '.',
        ]),
      ]),
    ]),
    buildMessage('consent'),
  );

  grid.append(
    createPillGroup({
      key: 'channels',
      name: 'channels',
      label: 'Preferred channels',
      type: 'checkbox',
      required: true,
      choices: [
        ['email', 'Email'],
        ['sms', 'SMS / Text'],
        ['push', 'Push'],
        ['inapp', 'In-app notifications'],
      ],
    }),
    createPillGroup({
      key: 'frequency',
      name: 'frequency',
      label: 'Message frequency',
      type: 'radio',
      choices: [
        ['realtime', 'Real-time offers'],
        ['weekly', 'Weekly digest'],
        ['monthly', 'Monthly roundup'],
        ['minimal', 'Essential updates only'],
      ],
      optional: true,
    }),
    createDivider('Fulfillment'),
    createPillGroup({
      key: 'fulfillment',
      name: 'fulfillment',
      label: 'Preferred fulfillment',
      type: 'radio',
      choices: [
        ['bopis', 'Pick up at my base MCX'],
        ['ship_home', 'Ship to my address'],
        ['no_pref', 'No preference'],
      ],
      optional: true,
    }),
    createDivider('Additional'),
    createField({
      key: 'notes',
      name: 'notes',
      label: 'Anything else we should know?',
      type: 'textarea',
      span2: true,
      optional: true,
      placeholder: 'Special interests, accessibility needs, or feedback on your MCCS experience...',
      maxLength: 500,
    }),
    consentField,
  );

  step.append(
    grid,
    el('div', { className: 'mpn-nav' }, [
      el('button', {
        className: 'mpn-button mpn-button--secondary',
        id: 'mpn-back-3',
        type: 'button',
      }, ['<-', 'Back']),
      el('button', {
        className: 'mpn-button mpn-button--accent',
        id: 'mpn-submit',
        type: 'button',
      }, [
        el('span', { textContent: 'Save my preferences' }),
        '*',
      ]),
    ]),
  );

  return step;
}

function getNamedInputs(block, name) {
  return [...block.querySelectorAll('input')].filter((input) => input.name === name);
}

function getCheckedValues(block, name) {
  return getNamedInputs(block, name)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getCheckedValue(block, name) {
  return getCheckedValues(block, name)[0] || '';
}

function getSelectText(select) {
  const match = [...select.querySelectorAll('option')].find((option) => option.value === select.value);
  return match ? match.textContent : '';
}

function setError(block, key, message) {
  const field = block.querySelector(`#${fieldId(key)}`);
  const messageNode = block.querySelector(`#${messageId(key)}`);

  if (field) {
    field.classList.add('is-error');
    field.classList.remove('is-valid');
  }

  if (messageNode) messageNode.textContent = message;
}

function clearError(block, key) {
  const field = block.querySelector(`#${fieldId(key)}`);
  const messageNode = block.querySelector(`#${messageId(key)}`);

  if (field) field.classList.remove('is-error');
  if (messageNode) messageNode.textContent = '';
}

function markValid(block, key) {
  const field = block.querySelector(`#${fieldId(key)}`);
  if (field) {
    field.classList.remove('is-error');
    field.classList.add('is-valid');
  }
  clearError(block, key);
}

function validateChoiceRequired(block, key, name, message) {
  if (getCheckedValues(block, name).length === 0) {
    setError(block, key, message);
    return false;
  }

  markValid(block, key);
  return true;
}

function validateSelectRequired(block, key, message) {
  const select = block.querySelector(`#${controlId(key)}`);
  if (!select || !select.value) {
    setError(block, key, message);
    return false;
  }

  markValid(block, key);
  return true;
}

function validateCheckboxRequired(block, key, message) {
  const input = block.querySelector(`#${controlId(key)}`);
  if (!input || !input.checked) {
    setError(block, key, message);
    return false;
  }

  markValid(block, key);
  return true;
}

function updateStepCopy(block, step) {
  const meta = STEP_BRIEFS[step - 1];
  const kicker = block.querySelector('#mpn-mission-kicker');
  const title = block.querySelector('#mpn-mission-title');
  const body = block.querySelector('#mpn-mission-body');
  const topStep = block.querySelector('#mpn-top-step');

  if (kicker) kicker.textContent = meta.kicker;
  if (title) title.textContent = meta.title;
  if (body) body.textContent = meta.body;
  if (topStep) topStep.textContent = `Step ${step} of ${STEP_LABELS.length}`;
}

function setStep(block, nextStep) {
  [...block.querySelectorAll('.mpn-step-panel')].forEach((panel, index) => {
    const active = index + 1 === nextStep;
    panel.classList.toggle('is-active', active);
  });

  STEP_LABELS.forEach((_, index) => {
    const step = index + 1;
    const item = block.querySelector(`#mpn-progress-${step}`);
    const badge = item?.querySelector('.mpn-progress-badge');
    const line = block.querySelector(`#mpn-progress-line-${step}`);

    if (!item || !badge) return;

    item.className = 'mpn-progress-item';
    badge.className = 'mpn-progress-badge';

    if (step < nextStep) {
      item.classList.add('is-complete');
      badge.classList.add('is-complete');
      if (line) line.style.transform = 'scaleY(1)';
    } else if (step === nextStep) {
      item.classList.add('is-current');
      badge.classList.add('is-current');
      if (line) line.style.transform = 'scaleY(0)';
    } else if (line) {
      line.style.transform = 'scaleY(0)';
    }
  });

  updateStepCopy(block, nextStep);
}

function splitHeading(title) {
  const parts = title.split(/\n|<br\s*\/?>/i).map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) return [title.trim(), ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function runNextFrame(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback);
    return;
  }

  callback();
}

function updateNotesCounter(block) {
  const notes = block.querySelector(`#${controlId('notes')}`);
  const counter = block.querySelector(`#${counterId('notes')}`);

  if (!notes || !counter || !notes.maxLength) return;
  counter.textContent = `${notes.value.length} / ${notes.maxLength}`;
}

function buildSuccessCard(block, redirectUrl) {
  const installationSelect = block.querySelector(`#${controlId('installation')}`);
  const status = getCheckedValue(block, 'serviceStatus');
  const frequency = getCheckedValue(block, 'frequency');
  const chips = [
    `Service: ${SERVICE_STATUS_LABELS[status] || 'Not set'}`,
    `Installation: ${installationSelect ? getSelectText(installationSelect) : 'Not set'}`,
    `Shopping interests: ${getCheckedValues(block, 'shopCategories').length}`,
    `Recreation interests: ${getCheckedValues(block, 'mwrInterests').length}`,
    `Frequency: ${FREQUENCY_LABELS[frequency] || 'Not set'}`,
  ];

  const success = el('div', { className: 'mpn-success' });
  const chipsWrap = el('div', { className: 'mpn-success-chips' });

  chips.forEach((chip) => {
    chipsWrap.append(el('div', { className: 'mpn-success-chip' }, [
      el('span', { className: 'mpn-success-chip-mark', textContent: '+' }),
      el('span', { className: 'mpn-success__chip', textContent: chip }),
    ]));
  });

  success.append(
    el('div', { className: 'mpn-success-seal' }, [
      el('div', { className: 'mpn-success-seal-ring' }),
      el('div', { className: 'mpn-success-seal-core', textContent: 'OK' }),
    ]),
    el('div', { className: 'mpn-success-kicker', textContent: 'Profile Updated' }),
    el('h2', { className: 'mpn-success__title', textContent: 'Preferences saved' }),
    el('p', {
      className: 'mpn-success-body',
      textContent: 'Your profile has been updated. We will use your preferences to personalize your MCCS experience across shopping, events, and family programs.',
    }),
    chipsWrap,
  );

  if (redirectUrl) {
    const countdown = el('div', { className: 'mpn-redirect' });
    const ring = el('div', { className: 'mpn-count-ring' });
    const number = el('div', { className: 'mpn-count-number', textContent: '5' });
    const label = el('div', {
      className: 'mpn-count-label',
      textContent: 'Redirecting to your personalized experience...',
    });
    const goNow = el('button', {
      className: 'mpn-go-now',
      id: 'mpn-go-now',
      type: 'button',
      textContent: 'Go now ->',
    });

    ring.append(el('div', { className: 'mpn-count-ring-inner' }), number);
    countdown.append(ring, label, goNow);
    success.append(countdown);

    runNextFrame(() => {
      success.classList.add('is-visible');
    });

    let remaining = 5;
    ring.style.setProperty('--mpn-count-progress', '1');

    const interval = setInterval(() => {
      remaining -= 1;
      number.textContent = String(Math.max(remaining, 0));
      ring.style.setProperty('--mpn-count-progress', String(Math.max(remaining, 0) / 5));

      if (remaining <= 0) {
        clearInterval(interval);
        window.location.href = redirectUrl;
      }
    }, 1000);

    goNow.addEventListener('click', () => {
      clearInterval(interval);
      window.location.href = redirectUrl;
    });
  } else {
    runNextFrame(() => {
      success.classList.add('is-visible');
    });
  }

  return success;
}

function attachErrorResetHandlers(block) {
  [...block.querySelectorAll('input'), ...block.querySelectorAll('select'), ...block.querySelectorAll('textarea')]
    .forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.getAttribute('data-error-key');
        if (!key) return;

        if (input.type === 'checkbox' || input.type === 'radio') {
          if ((input.type === 'checkbox' && getCheckedValues(block, input.name).length > 0)
            || (input.type === 'radio' && getCheckedValue(block, input.name))) {
            markValid(block, key);
          } else {
            clearError(block, key);
          }
        } else if (input.value) {
          markValid(block, key);
        } else {
          clearError(block, key);
        }

        if (input.name === 'notes') updateNotesCounter(block);
      });

      input.addEventListener('input', () => {
        const key = input.getAttribute('data-error-key');
        if (key && input.value) markValid(block, key);
        if (input.name === 'notes') updateNotesCounter(block);
      });
    });
}

export default function decorate(block) {
  const rows = [...block.children];
  const title = rows[0]?.textContent?.trim() || 'Personalize\nyour MCCS experience';
  const subtitle = rows[1]?.textContent?.trim() || 'Tell us about your military life, interests, and preferences. We will tailor your shopping, events, and family programs to fit your world.';
  const redirectUrl = rows[2]?.querySelector('a')?.getAttribute('href') || rows[2]?.textContent?.trim() || '';
  const [titleLineOne, titleAccent] = splitHeading(title);

  block.textContent = '';

  const atmosphere = el('div', { className: 'mpn-atmosphere' }, [
    el('div', { className: 'mpn-bloom mpn-bloom--scarlet' }),
    el('div', { className: 'mpn-bloom mpn-bloom--gold' }),
    el('div', { className: 'mpn-gridwash' }),
    el('div', { className: 'mpn-noise' }),
    el('div', { className: 'mpn-vignette' }),
  ]);
  const shell = el('div', { className: 'mpn-shell' });
  const stage = el('section', { className: 'mpn-stage' });
  const card = el('div', { className: 'mpn-card' });
  const panels = el('div', { className: 'mpn-panels' });
  const successWrap = el('div', { className: 'mpn-success-wrap' });

  panels.append(
    buildStepOne(),
    buildStepTwo(),
    buildStepThree(),
  );

  card.append(
    createStageHeader(),
    panels,
    successWrap,
  );

  stage.append(card);
  shell.append(
    createBriefingPanel(titleLineOne, titleAccent, subtitle),
    stage,
  );

  block.append(atmosphere, shell);

  attachErrorResetHandlers(block);
  updateNotesCounter(block);

  let currentStep = 1;

  block.querySelector('#mpn-next-1').addEventListener('click', () => {
    const serviceOk = validateChoiceRequired(
      block,
      'service-status',
      'serviceStatus',
      'Please select your service status.',
    );
    const installationOk = validateSelectRequired(
      block,
      'installation',
      'Please select your primary installation.',
    );

    if (!serviceOk || !installationOk) return;

    currentStep = 2;
    setStep(block, currentStep);
  });

  block.querySelector('#mpn-back-2').addEventListener('click', () => {
    currentStep = 1;
    setStep(block, currentStep);
  });

  block.querySelector('#mpn-next-2').addEventListener('click', () => {
    currentStep = 3;
    setStep(block, currentStep);
  });

  block.querySelector('#mpn-back-3').addEventListener('click', () => {
    currentStep = 2;
    setStep(block, currentStep);
  });

  block.querySelector('#mpn-submit').addEventListener('click', async () => {
    const channelsOk = validateChoiceRequired(
      block,
      'channels',
      'channels',
      'Please choose at least one preferred channel.',
    );
    const consentOk = validateCheckboxRequired(
      block,
      'consent',
      'Please accept to continue.',
    );

    if (!channelsOk || !consentOk) return;

    const button = block.querySelector('#mpn-submit');
    const label = button.querySelector('span');

    button.disabled = true;
    button.classList.add('is-loading');
    if (label) label.textContent = 'Saving...';

    await wait(900);

    block.classList.add('is-complete');
    panels.style.display = 'none';
    successWrap.append(buildSuccessCard(block, redirectUrl));
  });
}
