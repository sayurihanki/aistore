function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else if (k === 'textContent') node.textContent = v;
    else node.setAttribute(k, v);
  });
  children.forEach((c) => {
    if (typeof c === 'string') node.append(document.createTextNode(c));
    else if (c) node.append(c);
  });
  return node;
}

/* ---------- field builders ---------- */

function floatGroup(id, type, label, required, extra = {}) {
  const group = el('div', { className: 'f3-group f3-group--float' });
  if (required) group.classList.add('f3-group--required');
  if (extra.span2) group.classList.add('f3-span-2');

  const wrap = el('div', { className: 'f3-input-wrap' });
  const lbl = el('label', { for: id, className: 'f3-label' });
  lbl.append(document.createTextNode(`${label} `));
  if (required) {
    lbl.append(el('span', {
      className: 'f3-req',
      'aria-hidden': 'true',
      textContent: '*',
    }));
  }

  let field;
  if (type === 'textarea') {
    field = el('textarea', {
      id,
      name: id,
      className: 'f3-input f3-textarea',
      rows: '4',
    });
    if (extra.placeholder) field.placeholder = extra.placeholder;
    if (required) field.required = true;
  } else if (type === 'select') {
    field = el('select', { id, name: id, className: 'f3-input' });
    if (required) field.required = true;
    (extra.options || []).forEach(([val, text]) => {
      const opt = el('option', { value: val, textContent: text });
      if (val === '') opt.disabled = true;
      field.append(opt);
    });
    field.value = '';
    const chevron = el('span', { className: 'f3-select-chevron' });
    chevron.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
      + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
      + '<polyline points="6 9 12 15 18 9"/></svg>';
    wrap.append(chevron);
  } else {
    field = el('input', {
      type,
      id,
      name: id,
      className: 'f3-input',
    });
    if (extra.autocomplete) field.autocomplete = extra.autocomplete;
    if (required) field.required = true;
  }

  wrap.prepend(lbl, field);
  const msg = el('span', {
    className: 'f3-msg',
    'aria-live': 'polite',
  });
  group.append(wrap, msg);
  return group;
}

function choiceGroup(label, name, type, choices, extra = {}) {
  const group = el('div', { className: 'f3-group f3-span-2' });
  group.append(el('span', { className: 'f3-legend', textContent: label }));
  const container = el('div', { className: 'f3-choices' });

  choices.forEach(([val, text]) => {
    const choice = el('label', { className: 'f3-choice' });
    const input = el('input', { type, name, value: val });
    if (extra.required) input.required = true;
    choice.append(input, document.createTextNode(` ${text}`));
    container.append(choice);
  });

  group.append(container);
  return group;
}

function consentGroup() {
  const group = el('div', { className: 'f3-group f3-span-2' });
  const container = el('div', { className: 'f3-choices' });
  const choice = el('label', { className: 'f3-choice' });
  const input = el('input', {
    type: 'checkbox',
    name: 'consent',
    value: 'yes',
    required: '',
  });
  choice.append(input);
  choice.append(document.createTextNode(' I agree to the '));
  choice.append(el('a', {
    href: '#',
    className: 'f3-link',
    textContent: 'privacy policy',
  }));
  choice.append(document.createTextNode(' and consent to being contacted.'));
  container.append(choice);
  const msg = el('span', {
    className: 'f3-msg',
    'aria-live': 'polite',
  });
  group.append(container, msg);
  return group;
}

function submitButton() {
  const wrap = el('div', { className: 'f3-span-2' });
  const btn = el('button', {
    type: 'submit',
    className: 'f3-submit',
  });
  const span = el('span', { textContent: 'Send Message' });
  const arrow = el('span', { className: 'f3-submit-icon' });
  arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    + '<line x1="5" y1="12" x2="19" y2="12"/>'
    + '<polyline points="12 5 19 12 12 19"/></svg>';
  btn.append(span, arrow);
  wrap.append(btn);
  return wrap;
}

/* ---------- validation ---------- */

function validateField(input) {
  const group = input.closest('.f3-group');
  if (!group) return input.validity.valid;
  const msg = group.querySelector('.f3-msg');

  if (!input.validity.valid) {
    group.classList.add('f3-group--error');
    group.classList.remove('f3-group--success');
    if (msg) {
      if (input.validity.valueMissing) msg.textContent = 'This field is required.';
      else if (input.validity.typeMismatch) msg.textContent = `Please enter a valid ${input.type}.`;
      else msg.textContent = input.validationMessage;
    }
    return false;
  }

  if (input.value) {
    group.classList.remove('f3-group--error');
    group.classList.add('f3-group--success');
    if (msg) msg.textContent = '';
  }
  return true;
}

/* ---------- floating label behavior ---------- */

function initFloatingLabels(form) {
  form.querySelectorAll('.f3-group--float .f3-input').forEach((input) => {
    const group = input.closest('.f3-group');
    const update = () => {
      group.classList.toggle('f3-group--filled', input.value.length > 0);
    };
    input.addEventListener('input', update);
    input.addEventListener('blur', () => validateField(input));
    update();
  });
}

/* ---------- countdown redirect ---------- */

const COUNTDOWN = 4;

function startCountdown(success, redirectUrl) {
  const ring = success.querySelector('.f3-ring-fill');
  const numEl = success.querySelector('.f3-countdown-number');
  const goBtn = success.querySelector('.f3-redirect-now');
  let remaining = COUNTDOWN;

  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = '0';
    ring.style.transition = `stroke-dashoffset ${COUNTDOWN}s linear`;
    requestAnimationFrame(() => {
      ring.style.strokeDashoffset = '100';
    });
  });

  function doRedirect() {
    window.location.href = redirectUrl;
  }

  const tick = setInterval(() => {
    remaining -= 1;
    numEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(tick);
      doRedirect();
    }
  }, 1000);

  goBtn.addEventListener('click', () => {
    clearInterval(tick);
    doRedirect();
  });
}

/* ---------- success screen ---------- */

function showSuccess(block, formEl, redirectUrl) {
  const success = el('div', { className: 'f3-success' });
  const icon = el('div', { className: 'f3-success-icon' });
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
    + '<polyline points="22 4 12 14.01 9 11.01"/></svg>';

  success.append(
    icon,
    el('h3', { textContent: 'Message received!' }),
    el('p', { textContent: "We'll get back to you within one business day." }),
  );

  if (redirectUrl) {
    const countdown = el('div', { className: 'f3-countdown' });
    const ringWrap = el('div', { className: 'f3-countdown-ring' });
    ringWrap.innerHTML = '<svg viewBox="0 0 36 36">'
      + '<circle class="f3-ring-track" cx="18" cy="18" r="15.9" pathLength="100"/>'
      + '<circle class="f3-ring-fill" cx="18" cy="18" r="15.9" pathLength="100"/>'
      + '</svg>';
    const num = el('div', {
      className: 'f3-countdown-number',
      textContent: `${COUNTDOWN}`,
    });
    ringWrap.append(num);
    const goBtn = el('button', {
      className: 'f3-redirect-now',
      textContent: 'Go now \u2192',
    });
    countdown.append(ringWrap, goBtn);
    success.append(countdown);
  }

  formEl.style.opacity = '0';
  formEl.style.transform = 'scale(0.97)';

  setTimeout(() => {
    formEl.replaceWith(success);
    requestAnimationFrame(() => {
      success.classList.add('f3-success--visible');
      if (redirectUrl) startCountdown(success, redirectUrl);
    });
  }, 300);
}

/* ---------- entrance animation ---------- */

function animateEntrance(form) {
  form.querySelectorAll('.f3-group, .f3-span-2').forEach((g, i) => {
    g.style.opacity = '0';
    g.style.transform = 'translateY(18px)';
    setTimeout(() => {
      g.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      g.style.opacity = '1';
      g.style.transform = 'translateY(0)';
    }, 120 + i * 55);
  });
}

/* ---------- decorate ---------- */

export default function decorate(block) {
  const rows = [...block.children];
  const title = rows[0]?.textContent?.trim() || 'Get in touch';
  const subtitle = rows[1]?.textContent?.trim()
    || "Send us a message and we'll respond within one business day.";

  const redirectLink = rows[2]?.querySelector('a[href]');
  const redirectUrl = redirectLink ? redirectLink.getAttribute('href') : null;

  const form = el('form', { className: 'f3-element', novalidate: '' });

  const header = el('div', { className: 'f3-header' });
  header.append(
    el('h2', { className: 'f3-title', textContent: title }),
    el('p', { className: 'f3-subtitle', textContent: subtitle }),
  );
  form.append(header);

  const grid = el('div', { className: 'f3-fields f3-fields--two-col' });

  grid.append(floatGroup('firstName', 'text', 'First name', true, {
    autocomplete: 'given-name',
  }));
  grid.append(floatGroup('lastName', 'text', 'Last name', true, {
    autocomplete: 'family-name',
  }));
  grid.append(floatGroup('email', 'email', 'Email address', true, {
    autocomplete: 'email',
  }));
  grid.append(floatGroup('phone', 'tel', 'Phone number', false, {
    autocomplete: 'tel',
  }));
  grid.append(floatGroup('topic', 'select', 'Topic', true, {
    span2: true,
    options: [
      ['', 'Choose a topic\u2026'],
      ['general', 'General inquiry'],
      ['partnership', 'Partnership'],
      ['press', 'Press & media'],
      ['support', 'Technical support'],
      ['careers', 'Careers'],
    ],
  }));
  grid.append(choiceGroup('How did you find us?', 'source', 'radio', [
    ['search', 'Search engine'],
    ['social', 'Social media'],
    ['referral', 'Referral'],
    ['event', 'Event / Conference'],
    ['other', 'Other'],
  ]));
  grid.append(floatGroup('message', 'textarea', 'Message', true, {
    span2: true,
    placeholder: "Tell us what's on your mind\u2026",
  }));
  grid.append(consentGroup());
  grid.append(submitButton());

  form.append(grid);
  block.replaceChildren(form);

  initFloatingLabels(form);
  animateEntrance(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('.f3-input').forEach((input) => {
      if (!validateField(input)) valid = false;
    });

    const consentInput = form.querySelector('[name="consent"]');
    if (consentInput && !consentInput.checked) {
      const g = consentInput.closest('.f3-group');
      const m = g?.querySelector('.f3-msg');
      if (m) m.textContent = 'Please accept to continue.';
      if (g) g.classList.add('f3-group--error');
      valid = false;
    }

    if (!valid) {
      form.querySelector('.f3-group--error .f3-input,'
        + ' .f3-group--error input')?.focus();
      return;
    }

    const btn = form.querySelector('.f3-submit');
    btn.classList.add('f3-submit--loading');
    btn.disabled = true;

    await new Promise((r) => { setTimeout(r, 1400); });

    showSuccess(block, form, redirectUrl);
  });
}
