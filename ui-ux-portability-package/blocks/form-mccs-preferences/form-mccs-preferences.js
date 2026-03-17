const STEP_LABELS = ['Military Life', 'Interests', 'Communication'];

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
  return `mp-${key}`;
}

function fieldId(key) {
  return `mp-field-${key}`;
}

function messageId(key) {
  return `mp-msg-${key}`;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'className') node.className = value;
    else if (key === 'textContent') node.textContent = value;
    else if (key === 'htmlFor') node.setAttribute('for', value);
    else if (key === 'ariaLive') node.setAttribute('aria-live', value);
    else if (key === 'html') node.innerHTML = value;
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
    if (typeof child === 'string') node.append(child);
    else node.append(child);
  });

  return node;
}

function buildFieldLabel(label, { required = false, optional = false } = {}) {
  const labelNode = el('div', { className: 'mp-flbl' }, label);

  if (required) {
    labelNode.append(el('span', { className: 'mp-freq', textContent: '*' }));
  } else if (optional) {
    labelNode.append(el('span', {
      className: 'mp-flbl-opt',
      textContent: '(optional)',
    }));
  }

  return labelNode;
}

function buildMessage(key) {
  return el('span', {
    className: 'mp-fmsg',
    id: messageId(key),
    ariaLive: 'polite',
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
    className: `mp-field${span2 ? ' mp-span2' : ''}`,
    id: fieldId(key),
  });
  const wrap = el('div', { className: 'mp-fwrap' });
  let input;

  field.append(buildFieldLabel(label, { required, optional }));

  if (type === 'textarea') {
    input = el('textarea', {
      className: 'mp-fi',
      id: controlId(key),
      name,
      rows: 4,
      placeholder,
      required,
      maxLength,
    });
  } else if (type === 'select') {
    input = el('select', {
      className: 'mp-fi',
      id: controlId(key),
      name,
      required,
    });
    options.forEach(([value, text]) => {
      input.append(el('option', { value, textContent: text }));
    });
    wrap.append(input, el('span', {
      className: 'mp-fchev',
      textContent: '▾',
    }));
  } else {
    input = el('input', {
      className: 'mp-fi',
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
    className: `mp-field${span2 ? ' mp-span2' : ''}`,
    id: fieldId(key),
  });
  const pills = el('div', { className: 'mp-pills' });

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

    pills.append(el('div', { className: 'mp-pc' }, [
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

  return el('div', { className: 'mp-trow' }, [
    el('div', { className: 'mp-ttxt' }, [
      el('div', { className: 'mp-ttitle', textContent: title }),
      el('div', { className: 'mp-tsub', textContent: subtitle }),
    ]),
    el('label', { className: 'mp-tswitch' }, [
      input,
      el('span', { className: 'mp-ttrack' }),
    ]),
  ]);
}

function createDivider(text) {
  return el('div', { className: 'mp-divider' }, [
    el('span', { textContent: text }),
  ]);
}

function createProgress() {
  const progress = el('div', { className: 'mp-progress' });

  STEP_LABELS.forEach((label, index) => {
    const step = index + 1;
    const item = el('div', {
      className: `mp-si${step === 1 ? ' mp-si--active is-current' : ''}`,
      id: `mp-progress-${step}`,
    });
    const badge = el('div', {
      className: `mp-sb${step === 1 ? ' mp-sb--active' : ''}`,
    }, [
      el('span', { className: 'mp-sn', textContent: String(step) }),
      el('span', { className: 'mp-sb-check', textContent: '✓' }),
    ]);

    item.append(el('div', { className: 'mp-sw' }, [
      badge,
      el('div', { className: 'mp-slbl', textContent: label }),
    ]));

    if (step < STEP_LABELS.length) {
      item.append(el('div', { className: 'mp-sl' }, [
        el('div', {
          className: 'mp-slf',
          id: `mp-progress-line-${step}`,
        }),
      ]));
    }

    progress.append(item);
  });

  return progress;
}

function buildStepOne() {
  const step = el('section', {
    className: 'mp-step-panel mp-fstep is-active mp-fstep--active',
    id: 'mp-step-1',
    attributes: { 'data-step': '1' },
  });
  const grid = el('div', { className: 'mp-grid' });

  step.append(
    el('div', { className: 'mp-stitle', textContent: 'Your military life' }),
    el('div', {
      className: 'mp-ssub',
      textContent: 'Help us understand your connection to MCCS so we can personalize your experience across every installation.',
    }),
  );

  grid.append(
    createPillGroup({
      key: 'service-status',
      name: 'serviceStatus',
      label: 'Service status',
      type: 'radio',
      choices: [
        ['active_duty', 'Active Duty'],
        ['spouse_dependent', 'Spouse / Dependent'],
        ['veteran_retiree', 'Veteran / Retiree'],
        ['dod_civilian', 'DoD / Coast Guard Civilian'],
      ],
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
    el('div', { className: 'mp-nav' }, [
      el('div'),
      el('button', {
        className: 'mp-bnx',
        id: 'mp-next-1',
        type: 'button',
      }, [
        el('span', { textContent: 'Continue' }),
        '→',
      ]),
    ]),
  );

  return step;
}

function buildStepTwo() {
  const step = el('section', {
    className: 'mp-step-panel mp-fstep',
    id: 'mp-step-2',
    attributes: { 'data-step': '2' },
  });
  const grid = el('div', { className: 'mp-grid' });
  const toggles = el('div', {
    className: 'mp-field mp-span2',
    id: fieldId('services'),
  });
  const toggleList = el('div', { className: 'mp-toggles' });

  step.append(
    el('div', { className: 'mp-stitle', textContent: 'Shopping & recreation' }),
    el('div', {
      className: 'mp-ssub',
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
    el('div', { className: 'mp-nav' }, [
      el('button', {
        className: 'mp-bbk',
        id: 'mp-back-2',
        type: 'button',
      }, ['←', 'Back']),
      el('button', {
        className: 'mp-bnx',
        id: 'mp-next-2',
        type: 'button',
      }, [
        el('span', { textContent: 'Continue' }),
        '→',
      ]),
    ]),
  );

  return step;
}

function buildStepThree() {
  const step = el('section', {
    className: 'mp-step-panel mp-fstep',
    id: 'mp-step-3',
    attributes: { 'data-step': '3' },
  });
  const grid = el('div', { className: 'mp-grid' });
  const consentField = el('div', {
    className: 'mp-field mp-span2',
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
    el('div', { className: 'mp-stitle', textContent: 'Communication preferences' }),
    el('div', {
      className: 'mp-ssub',
      textContent: 'Tell us how and when you would like to hear from MCCS. You can update these anytime from your dashboard.',
    }),
  );

  consentField.append(
    el('div', { className: 'mp-pills' }, [
      el('div', { className: 'mp-pc mp-pc--wide' }, [
        consentInput,
        el('label', {
          className: 'mp-consent-label',
          htmlFor: controlId('consent'),
        }, [
          'I consent to MCCS using my preferences to personalize my experience per the ',
          el('a', {
            className: 'mp-link',
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
    el('div', { className: 'mp-nav' }, [
      el('button', {
        className: 'mp-bbk',
        id: 'mp-back-3',
        type: 'button',
      }, ['←', 'Back']),
      el('button', {
        className: 'mp-bnx mp-bsub',
        id: 'mp-submit',
        type: 'button',
      }, [
        el('span', { textContent: 'Save my preferences' }),
        '✦',
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
    field.classList.add('mp-field--err');
    field.classList.remove('mp-field--ok');
  }
  if (messageNode) messageNode.textContent = message;
}

function clearError(block, key) {
  const field = block.querySelector(`#${fieldId(key)}`);
  const messageNode = block.querySelector(`#${messageId(key)}`);
  if (field) field.classList.remove('mp-field--err');
  if (messageNode) messageNode.textContent = '';
}

function markValid(block, key) {
  const field = block.querySelector(`#${fieldId(key)}`);
  if (field) {
    field.classList.remove('mp-field--err');
    field.classList.add('mp-field--ok');
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

function setStep(block, nextStep) {
  [...block.querySelectorAll('.mp-step-panel')].forEach((panel, index) => {
    const active = index + 1 === nextStep;
    panel.classList.toggle('is-active', active);
    panel.classList.toggle('mp-fstep--active', active);
  });

  STEP_LABELS.forEach((_, index) => {
    const step = index + 1;
    const item = block.querySelector(`#mp-progress-${step}`);
    const badge = item?.querySelector('.mp-sb');
    const line = block.querySelector(`#mp-progress-line-${step}`);

    if (!item || !badge) return;

    item.className = 'mp-si';
    badge.className = 'mp-sb';

    if (step < nextStep) {
      item.classList.add('mp-si--done', 'is-complete');
      badge.classList.add('mp-sb--done');
      if (line) line.style.transform = 'scaleX(1)';
    } else if (step === nextStep) {
      item.classList.add('mp-si--active', 'is-current');
      badge.classList.add('mp-sb--active');
      if (line) line.style.transform = 'scaleX(0)';
    } else if (line) {
      line.style.transform = 'scaleX(0)';
    }
  });
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

function initParticles(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return;
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  const colors = [
    'rgba(196,30,58,',
    'rgba(197,164,78,',
    'rgba(26,39,68,',
    'rgba(158,24,48,',
  ];

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    width = rect.width;
    height = rect.height;
    canvas.width = width;
    canvas.height = height;
  }

  function spawn() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: Math.random() * 200 + 100,
      age: 0,
    };
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    if (Math.random() < 0.4) particles.push(spawn());
    if (particles.length > 150) particles = particles.slice(-150);

    particles = particles.filter((particle) => {
      const item = particle;
      item.x += item.vx;
      item.y += item.vy;
      item.age += 1;

      if (item.x < 0 || item.x > width) item.vx *= -1;
      if (item.y < 0 || item.y > height) item.vy *= -1;

      const t = Math.sin((Math.PI * item.age) / item.life);
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${item.color}${item.alpha * t})`;
      ctx.fill();

      return item.age < item.life;
    });

    window.requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  loop();
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

  const success = el('div', { className: 'mp-success' });
  const burst = el('div', { className: 'mp-sburst' });
  const chipsWrap = el('div', { className: 'mp-chips' });

  burst.append(
    el('div', { className: 'mp-sbring' }),
    el('div', { className: 'mp-sbring' }),
    el('div', { className: 'mp-sbring' }),
    el('div', { className: 'mp-sico' }, [
      el('div', { className: 'mp-sico-svg', textContent: '✓' }),
    ]),
  );

  chips.forEach((chip) => {
    chipsWrap.append(el('div', { className: 'mp-chip mp-success__chip' }, [
      el('span', { className: 'mp-chip-svg', textContent: '✓' }),
      chip,
    ]));
  });

  success.append(
    burst,
    el('h2', { className: 'mp-sh mp-success__title', textContent: 'Preferences saved' }),
    el('p', {
      className: 'mp-ssbody',
      textContent: 'Your profile has been updated. We will use your preferences to personalize your MCCS experience across shopping, events, and family programs.',
    }),
    chipsWrap,
  );

  if (redirectUrl) {
    const countdown = el('div', { className: 'mp-scount' });
    const ring = el('div', { className: 'mp-cring' });
    const number = el('div', { className: 'mp-cnum', textContent: '5' });
    const label = el('div', {
      className: 'mp-clbl',
      textContent: 'Redirecting to your personalized experience...',
    });
    const goNow = el('button', {
      className: 'mp-bgn',
      type: 'button',
      textContent: 'Go now →',
    });

    ring.innerHTML = '<svg viewBox="0 0 72 72">'
      + '<circle class="mp-rbg" cx="36" cy="36" r="33"></circle>'
      + '<circle class="mp-rfg" cx="36" cy="36" r="33"></circle>'
      + '</svg>';
    ring.append(number);

    countdown.append(ring, label, goNow);
    success.append(countdown);

    runNextFrame(() => {
      success.classList.add('mp-success--visible');
    });

    let remaining = 5;
    const interval = setInterval(() => {
      remaining -= 1;
      number.textContent = String(Math.max(remaining, 0));
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
      success.classList.add('mp-success--visible');
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
          return;
        }

        if (input.value) markValid(block, key);
        else clearError(block, key);
      });

      input.addEventListener('input', () => {
        const key = input.getAttribute('data-error-key');
        if (!key) return;
        if (input.value) markValid(block, key);
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

  const canvas = el('canvas', { className: 'mp-pcanvas' });
  const bgCanvas = el('div', { className: 'mp-bg-canvas' });
  const outer = el('div', { className: 'mp-outer' });
  const badge = el('div', { className: 'mp-badge' }, [
    el('span', {}, [
      el('span', { className: 'mp-dot' }),
      'MCCS Patron Preferences · Personalization',
    ]),
  ]);
  const card = el('div', { className: 'mp-card' });
  const hero = el('div', { className: 'mp-hero' });
  const heading = el('h1', { className: 'mp-h1' }, titleLineOne);
  const panels = el('div', { className: 'mp-panels mp-fbody' });
  const successWrap = el('div', { className: 'mp-success-wrap' });

  if (titleAccent) {
    heading.append(el('br'), el('em', {
      className: 'mp-hero__accent',
      textContent: titleAccent,
    }));
  }

  hero.append(
    el('div', { className: 'mp-eyebrow', textContent: 'My preferences' }),
    heading,
    el('p', { className: 'mp-hero-p', textContent: subtitle }),
    createProgress(),
  );

  panels.append(
    buildStepOne(),
    buildStepTwo(),
    buildStepThree(),
  );
  card.append(hero, panels, successWrap);

  outer.append(badge, card);
  bgCanvas.append(
    el('div', { className: 'mp-orb' }),
    el('div', { className: 'mp-orb' }),
    el('div', { className: 'mp-orb' }),
    el('div', { className: 'mp-orb' }),
  );

  block.append(
    canvas,
    bgCanvas,
    el('div', { className: 'mp-bg-grid' }),
    el('div', { className: 'mp-bg-noise' }),
    outer,
  );

  attachErrorResetHandlers(block);
  initParticles(canvas);

  let currentStep = 1;

  block.querySelector('#mp-next-1').addEventListener('click', () => {
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

  block.querySelector('#mp-back-2').addEventListener('click', () => {
    currentStep = 1;
    setStep(block, currentStep);
  });

  block.querySelector('#mp-next-2').addEventListener('click', () => {
    currentStep = 3;
    setStep(block, currentStep);
  });

  block.querySelector('#mp-back-3').addEventListener('click', () => {
    currentStep = 2;
    setStep(block, currentStep);
  });

  block.querySelector('#mp-submit').addEventListener('click', async () => {
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

    const button = block.querySelector('#mp-submit');
    const label = button.querySelector('span');

    button.disabled = true;
    button.classList.add('mp-bnx--ld');
    if (label) label.textContent = 'Saving...';

    await wait(900);

    panels.style.display = 'none';
    successWrap.append(buildSuccessCard(block, redirectUrl));
  });
}
