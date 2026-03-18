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
  const group = el('div', { className: 'f2-group f2-group--float' });
  if (required) group.classList.add('f2-group--required');
  if (extra.span2) group.classList.add('f2-span-2');

  const wrap = el('div', { className: 'f2-input-wrap' });
  const lbl = el('label', { for: id, className: 'f2-label' });
  lbl.append(document.createTextNode(`${label} `));
  if (required) {
    lbl.append(el('span', {
      className: 'f2-req',
      'aria-hidden': 'true',
      textContent: '*',
    }));
  }

  let field;
  if (type === 'textarea') {
    field = el('textarea', {
      id,
      name: id,
      className: 'f2-input f2-textarea',
      rows: '4',
    });
    if (extra.placeholder) field.placeholder = extra.placeholder;
    if (required) field.required = true;
  } else if (type === 'select') {
    field = el('select', { id, name: id, className: 'f2-input' });
    if (required) field.required = true;
    (extra.options || []).forEach(([val, text]) => {
      const opt = el('option', { value: val, textContent: text });
      if (val === '') opt.disabled = true;
      field.append(opt);
    });
    field.value = '';
    const chevron = el('span', { className: 'f2-select-chevron' });
    chevron.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
      + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
      + '<polyline points="6 9 12 15 18 9"/></svg>';
    wrap.append(chevron);
  } else {
    field = el('input', {
      type,
      id,
      name: id,
      className: 'f2-input',
    });
    if (extra.autocomplete) field.autocomplete = extra.autocomplete;
    if (required) field.required = true;
  }

  wrap.prepend(lbl, field);
  const msg = el('span', {
    className: 'f2-msg',
    'aria-live': 'polite',
  });
  group.append(wrap, msg);
  return group;
}

function choiceGroup(label, name, type, choices, extra = {}) {
  const group = el('div', { className: 'f2-group f2-span-2' });
  group.append(el('span', { className: 'f2-legend', textContent: label }));
  const container = el('div', { className: 'f2-choices' });

  choices.forEach(([val, text]) => {
    const choice = el('label', { className: 'f2-choice' });
    const input = el('input', { type, name, value: val });
    if (extra.required) input.required = true;
    choice.append(input, document.createTextNode(` ${text}`));
    container.append(choice);
  });

  group.append(container);
  return group;
}

function consentGroup() {
  const group = el('div', { className: 'f2-group f2-span-2' });
  const container = el('div', { className: 'f2-choices' });
  const choice = el('label', { className: 'f2-choice' });
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
    className: 'f2-link',
    textContent: 'privacy policy',
  }));
  choice.append(document.createTextNode(' and consent to being contacted.'));
  container.append(choice);
  const msg = el('span', {
    className: 'f2-msg',
    'aria-live': 'polite',
  });
  group.append(container, msg);
  return group;
}

function submitButton() {
  const wrap = el('div', { className: 'f2-span-2' });
  const btn = el('button', {
    type: 'submit',
    className: 'f2-submit',
  });
  const span = el('span', { textContent: 'Send Message' });
  const arrow = el('span', { className: 'f2-submit-icon' });
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
  const group = input.closest('.f2-group');
  if (!group) return input.validity.valid;
  const msg = group.querySelector('.f2-msg');

  if (!input.validity.valid) {
    group.classList.add('f2-group--error');
    group.classList.remove('f2-group--success');
    if (msg) {
      if (input.validity.valueMissing) msg.textContent = 'This field is required.';
      else if (input.validity.typeMismatch) msg.textContent = `Please enter a valid ${input.type}.`;
      else msg.textContent = input.validationMessage;
    }
    return false;
  }

  if (input.value) {
    group.classList.remove('f2-group--error');
    group.classList.add('f2-group--success');
    if (msg) msg.textContent = '';
  }
  return true;
}

/* ---------- floating label behavior ---------- */

function initFloatingLabels(form) {
  form.querySelectorAll('.f2-group--float .f2-input').forEach((input) => {
    const group = input.closest('.f2-group');
    const update = () => {
      group.classList.toggle('f2-group--filled', input.value.length > 0);
    };
    input.addEventListener('input', update);
    input.addEventListener('blur', () => validateField(input));
    update();
  });
}

/* ---------- success screen ---------- */

function showSuccess(block, formEl) {
  const success = el('div', { className: 'f2-success' });
  const icon = el('div', { className: 'f2-success-icon' });
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
    + '<polyline points="22 4 12 14.01 9 11.01"/></svg>';

  success.append(
    icon,
    el('h3', { textContent: 'Message received!' }),
    el('p', { textContent: "We'll get back to you within one business day." }),
  );

  formEl.style.opacity = '0';
  formEl.style.transform = 'scale(0.97)';

  setTimeout(() => {
    formEl.replaceWith(success);
    requestAnimationFrame(() => success.classList.add('f2-success--visible'));
  }, 300);
}

/* ---------- entrance animation ---------- */

function animateEntrance(form) {
  form.querySelectorAll('.f2-group, .f2-span-2').forEach((g, i) => {
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

  const form = el('form', { className: 'f2-element', novalidate: '' });

  const header = el('div', { className: 'f2-header' });
  header.append(
    el('h2', { className: 'f2-title', textContent: title }),
    el('p', { className: 'f2-subtitle', textContent: subtitle }),
  );
  form.append(header);

  const grid = el('div', { className: 'f2-fields f2-fields--two-col' });

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

    form.querySelectorAll('.f2-input').forEach((input) => {
      if (!validateField(input)) valid = false;
    });

    const consentInput = form.querySelector('[name="consent"]');
    if (consentInput && !consentInput.checked) {
      const g = consentInput.closest('.f2-group');
      const m = g?.querySelector('.f2-msg');
      if (m) m.textContent = 'Please accept to continue.';
      if (g) g.classList.add('f2-group--error');
      valid = false;
    }

    if (!valid) {
      form.querySelector('.f2-group--error .f2-input,'
        + ' .f2-group--error input')?.focus();
      return;
    }

    const btn = form.querySelector('.f2-submit');
    btn.classList.add('f2-submit--loading');
    btn.disabled = true;

    await new Promise((r) => { setTimeout(r, 1400); });

    showSuccess(block, form);
  });
}
