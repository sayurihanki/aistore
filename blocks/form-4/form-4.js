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

function svg(paths, extra = {}) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', extra.sw || '2');
  if (extra.className) s.setAttribute('class', extra.className);
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.innerHTML = paths;
  return s;
}

/* ── icon paths ─────────────────────────────── */

const ICONS = {
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>'
    + '<circle cx="12" cy="7" r="4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/>'
    + '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07'
    + 'A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.6 4.88 2 2 0 0 1 3.55'
    + ' 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91'
    + ' 9.91a16 16 0 0 0 6.16 6.16l.86-.86a2 2 0 0 1 2.11-.45c.91.34 1.85'
    + '.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  company: '<rect x="2" y="7" width="20" height="14" rx="2"/>'
    + '<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  globe: '<circle cx="12" cy="12" r="10"/>'
    + '<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10'
    + ' 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/>'
    + '<polyline points="12 5 19 12 12 19"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/>'
    + '<polyline points="12 19 5 12 12 5"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
    + '<polyline points="22 4 12 14.01 9 11.01"/>',
  chevDown: '<polyline points="6 9 12 15 18 9"/>',
};

/* ── step config ────────────────────────────── */

const STEPS = ['Contact', 'Project', 'Message'];

/* ── field builders ─────────────────────────── */

function fieldWrap(id, opts = {}) {
  const field = el('div', { className: 'f4-field' });
  if (opts.span2) field.classList.add('f4-span2');
  field.id = `f4-f-${id}`;

  const lbl = el('div', { className: 'f4-flbl' });
  if (opts.icon) lbl.append(svg(opts.icon, { className: 'f4-fico' }));
  lbl.append(document.createTextNode(opts.label || ''));
  if (opts.required) {
    lbl.append(el('span', { className: 'f4-freq', textContent: ' *' }));
  }
  field.append(lbl);

  const wrap = el('div', { className: 'f4-fwrap' });
  let input;

  if (opts.type === 'textarea') {
    input = el('textarea', {
      className: 'f4-fi',
      id,
      name: id,
      rows: '5',
    });
    if (opts.maxlength) input.maxLength = opts.maxlength;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.required) input.required = true;
  } else if (opts.type === 'select') {
    input = el('select', { className: 'f4-fi', id, name: id });
    if (opts.required) input.required = true;
    (opts.options || []).forEach(([val, text]) => {
      input.append(el('option', { value: val, textContent: text }));
    });
    const chev = el('span', { className: 'f4-fchev' });
    chev.append(svg(ICONS.chevDown, { sw: '2.5' }));
    wrap.append(chev);
  } else if (opts.type === 'date') {
    input = el('input', {
      type: 'date',
      className: 'f4-fi',
      id,
      name: id,
    });
  } else if (opts.type === 'range') {
    input = el('input', {
      type: 'range',
      className: 'f4-fslider',
      id,
      name: id,
      min: String(opts.min || 0),
      max: String(opts.max || 100),
      step: String(opts.step || 1),
      value: String(opts.value || 50),
    });
  } else {
    input = el('input', {
      type: opts.type || 'text',
      className: 'f4-fi',
      id,
      name: id,
    });
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;
    if (opts.required) input.required = true;
    if (opts.trail) {
      input.classList.add('f4-fi--trail');
      const trail = svg(opts.trail, { className: 'f4-ftrail' });
      wrap.append(trail);
    }
  }

  wrap.prepend(input);
  field.append(wrap);
  field.append(el('span', { className: 'f4-fmsg', 'aria-live': 'polite' }));
  return field;
}

function pillGroup(label, name, type, choices, opts = {}) {
  const field = el('div', { className: 'f4-field f4-span2' });
  if (opts.id) field.id = opts.id;
  const lbl = el('div', { className: 'f4-flbl' });
  lbl.append(document.createTextNode(label));
  if (opts.required) {
    lbl.append(el('span', { className: 'f4-freq', textContent: ' *' }));
  }
  field.append(lbl);

  const pills = el('div', { className: 'f4-pills' });
  choices.forEach(([val, text], i) => {
    const pc = el('div', { className: 'f4-pc' });
    const inp = el('input', {
      type,
      name,
      value: val,
      id: `${name}-${i}`,
    });
    if (opts.required && type === 'radio') inp.required = true;
    const lab = el('label', { for: `${name}-${i}`, textContent: text });
    pc.append(inp, lab);
    pills.append(pc);
  });
  field.append(pills);
  field.append(el('span', { className: 'f4-fmsg', 'aria-live': 'polite' }));
  return field;
}

function toggleRow(name, title, sub, checked = false) {
  const row = el('div', { className: 'f4-trow' });
  const txt = el('div', { className: 'f4-ttxt' });
  txt.append(
    el('div', { className: 'f4-ttitle', textContent: title }),
    el('div', { className: 'f4-tsub', textContent: sub }),
  );
  const sw = el('label', { className: 'f4-tswitch' });
  const inp = el('input', { type: 'checkbox', name });
  if (checked) inp.checked = true;
  const track = el('span', { className: 'f4-ttrack' });
  sw.append(inp, track);
  row.append(txt, sw);
  return row;
}

function colorPicker() {
  const field = el('div', { className: 'f4-field f4-span2' });
  field.append(el('div', { className: 'f4-flbl', textContent: 'Brand color palette' }));
  const picks = el('div', { className: 'f4-colorpicks' });
  const colors = [
    ['Electric Blue', '#2563eb'],
    ['Deep Violet', '#7c3aed'],
    ['Emerald', '#059669'],
    ['Flame', '#dc2626'],
    ['Gold', '#d97706'],
    ['Rose', '#db2777'],
    ['Midnight', '#1e293b'],
  ];
  colors.forEach(([name, hex]) => {
    const cp = el('div', {
      className: 'f4-cpick',
      'data-c': name,
      title: name,
    });
    cp.style.background = hex;
    picks.append(cp);
  });
  const tbd = el('div', {
    className: 'f4-cpick',
    'data-c': 'None / TBD',
    title: 'None / TBD',
  });
  tbd.style.background = 'linear-gradient(135deg,#374151,#6b7280)';
  picks.append(tbd);
  const label = el('span', {
    className: 'f4-cpick-label',
    textContent: 'Choose a palette direction',
  });
  picks.append(label);
  field.append(picks);
  const hidden = el('input', { type: 'hidden', name: 'brandColor', value: '' });
  field.append(hidden);
  return field;
}

function dropzone() {
  const field = el('div', { className: 'f4-field f4-span2' });
  const lbl = el('div', { className: 'f4-flbl' });
  lbl.append(document.createTextNode('Attach brief or references '));
  lbl.append(el('span', {
    className: 'f4-flbl-opt',
    textContent: '(optional)',
  }));
  field.append(lbl);

  const dz = el('div', { className: 'f4-dropzone' });
  const fi = el('input', {
    type: 'file',
    multiple: '',
    accept: '.pdf,.doc,.docx,.jpg,.png,.fig',
  });
  dz.append(fi);
  dz.append(el('div', { className: 'f4-dzico', textContent: '\uD83D\uDCCE' }));
  const title = el('div', { className: 'f4-dztitle' });
  title.append(el('strong', { textContent: 'Click to upload' }));
  title.append(document.createTextNode(' or drag & drop'));
  dz.append(title);
  dz.append(el('div', {
    className: 'f4-dzsub',
    textContent: 'PDF, Word, JPG, PNG, Figma \u2014 up to 25 MB each',
  }));
  dz.append(el('div', { className: 'f4-dzfiles' }));
  field.append(dz);
  return field;
}

function starsField() {
  const field = el('div', { className: 'f4-field f4-span2' });
  field.append(el('div', {
    className: 'f4-flbl',
    textContent: 'How excited are you? \uD83D\uDD25',
  }));
  const wrap = el('div', { className: 'f4-stars' });
  for (let i = 1; i <= 5; i += 1) {
    const btn = el('button', {
      type: 'button',
      className: 'f4-sbtn',
      'data-v': String(i),
      textContent: '\u2605',
    });
    wrap.append(btn);
  }
  field.append(wrap);
  field.append(el('input', {
    type: 'hidden',
    name: 'excitement',
    value: '0',
  }));
  return field;
}

/* ── progress bar builder ───────────────────── */

function buildProgress(container) {
  STEPS.forEach((s, i) => {
    const n = i + 1;
    const item = el('div', { className: `f4-si${n === 1 ? ' f4-si--active' : ''}` });
    item.id = `f4-si${n}`;

    const sw = el('div', { className: 'f4-sw' });
    const sb = el('div', { className: `f4-sb${n === 1 ? ' f4-sb--active' : ''}` });
    sb.id = `f4-sb${n}`;
    sb.append(el('span', { className: 'f4-sn', textContent: String(n) }));
    sb.append(svg(ICONS.check, { sw: '3', className: 'f4-sb-check' }));
    sw.append(sb);
    sw.append(el('div', {
      className: 'f4-slbl',
      id: `f4-sl${n}`,
      textContent: s,
    }));
    item.append(sw);

    if (i < STEPS.length - 1) {
      const line = el('div', { className: 'f4-sl' });
      line.append(el('div', { className: 'f4-slf', id: `f4-lf${n}` }));
      item.append(line);
    }
    container.append(item);
  });
}

/* ── step navigation ────────────────────────── */

function goTo(n, cur, block) {
  const fromEl = block.querySelector(`.f4-fstep[data-step="${cur}"]`);
  fromEl.style.animation = 'f4-s-out .28s var(--f4-out) both';
  setTimeout(() => {
    fromEl.classList.remove('f4-fstep--active');
    fromEl.style.animation = '';
    block.querySelector(`.f4-fstep[data-step="${n}"]`)
      .classList.add('f4-fstep--active');
  }, 260);

  for (let i = 1; i <= STEPS.length; i += 1) {
    const item = block.querySelector(`#f4-si${i}`);
    const sb = block.querySelector(`#f4-sb${i}`);
    item.className = 'f4-si';
    if (i < n) item.classList.add('f4-si--done');
    else if (i === n) item.classList.add('f4-si--active');
    sb.className = 'f4-sb';
    if (i < n) sb.classList.add('f4-sb--done');
    else if (i === n) sb.classList.add('f4-sb--active');
    const lf = block.querySelector(`#f4-lf${i}`);
    if (lf) lf.style.transform = i < n ? 'scaleX(1)' : 'scaleX(0)';
  }
  return n;
}

/* ── validation ─────────────────────────────── */

function vField(inp, field) {
  if (!inp.checkValidity()) {
    field.classList.remove('f4-field--ok');
    field.classList.add('f4-field--err');
    const m = field.querySelector('.f4-fmsg');
    if (m) {
      if (inp.validity.valueMissing) m.textContent = 'Required.';
      else if (inp.validity.typeMismatch) m.textContent = `Valid ${inp.type} needed.`;
      else m.textContent = inp.validationMessage;
    }
    return false;
  }
  if (inp.value) {
    field.classList.remove('f4-field--err');
    field.classList.add('f4-field--ok');
  }
  const m = field.querySelector('.f4-fmsg');
  if (m) m.textContent = '';
  return true;
}

/* ── success screen ─────────────────────────── */

function buildSuccess(block, data, redirectUrl) {
  const succ = el('div', { className: 'f4-success' });

  const burst = el('div', { className: 'f4-sburst' });
  for (let i = 0; i < 3; i += 1) burst.append(el('div', { className: 'f4-sbring' }));
  const sico = el('div', { className: 'f4-sico' });
  sico.append(svg(ICONS.checkCircle, { sw: '2.5', className: 'f4-sico-svg' }));
  burst.append(sico);
  succ.append(burst);

  succ.append(el('h2', { className: 'f4-sh', textContent: "You're all set!" }));
  succ.append(el('p', {
    className: 'f4-ssb',
    textContent: "Your message has landed safely. We're already thinking"
      + ' about your project and will be in touch within one business day.',
  }));

  const chips = el('div', { className: 'f4-chips' });
  data.forEach((c) => {
    const chip = el('div', { className: 'f4-chip' });
    chip.append(svg(ICONS.check, { sw: '2.5', className: 'f4-chip-svg' }));
    chip.append(document.createTextNode(`${c.i} ${c.t}`));
    chips.append(chip);
  });
  succ.append(chips);

  if (redirectUrl) {
    const scount = el('div', { className: 'f4-scount' });
    const cring = el('div', { className: 'f4-cring' });
    const ringNs = 'http://www.w3.org/2000/svg';
    const ringSvg = document.createElementNS(ringNs, 'svg');
    ringSvg.setAttribute('viewBox', '0 0 72 72');
    const defs = document.createElementNS(ringNs, 'defs');
    const grad = document.createElementNS(ringNs, 'linearGradient');
    grad.id = 'f4-cg';
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    const s1 = document.createElementNS(ringNs, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#8821f4');
    const s2 = document.createElementNS(ringNs, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', '#6d28d9');
    grad.append(s1, s2);
    defs.append(grad);
    ringSvg.append(defs);

    const cbg = document.createElementNS(ringNs, 'circle');
    cbg.setAttribute('class', 'f4-rbg');
    cbg.setAttribute('cx', '36');
    cbg.setAttribute('cy', '36');
    cbg.setAttribute('r', '33');
    const cfg = document.createElementNS(ringNs, 'circle');
    cfg.setAttribute('class', 'f4-rfg');
    cfg.setAttribute('cx', '36');
    cfg.setAttribute('cy', '36');
    cfg.setAttribute('r', '33');
    ringSvg.append(cbg, cfg);
    cring.append(ringSvg);

    const cnum = el('div', { className: 'f4-cnum', textContent: '5' });
    cring.append(cnum);
    scount.append(cring);
    scount.append(el('div', {
      className: 'f4-clbl',
      textContent: 'Redirecting to thank-you page\u2026',
    }));
    const goBtn = el('button', {
      className: 'f4-bgn',
      textContent: 'Go now \u2192',
    });
    scount.append(goBtn);
    succ.append(scount);

    requestAnimationFrame(() => {
      succ.classList.add('f4-success--visible');
      const circ = 2 * Math.PI * 33;
      cfg.style.strokeDasharray = String(circ);
      cfg.style.strokeDashoffset = '0';
      requestAnimationFrame(() => {
        cfg.style.transition = 'stroke-dashoffset 1s linear';
        cfg.style.strokeDashoffset = String(circ / 5);
      });

      let rem = 5;
      const tick = setInterval(() => {
        rem -= 1;
        cnum.textContent = String(rem);
        cfg.style.strokeDashoffset = String(((5 - rem) / 5) * circ);
        if (rem <= 0) {
          clearInterval(tick);
          window.location.href = redirectUrl;
        }
      }, 1000);

      goBtn.addEventListener('click', () => {
        clearInterval(tick);
        window.location.href = redirectUrl;
      });
    });
  } else {
    requestAnimationFrame(() => succ.classList.add('f4-success--visible'));
  }

  return succ;
}

/* ── budget formatter ───────────────────────── */

function fmtBudget(v) {
  if (v >= 500000) return '$500,000+';
  return `$${Number(v).toLocaleString()}`;
}

/* ── particles (lightweight) ────────────────── */

function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let ps = [];
  const COLS = [
    'rgba(136,33,244,', 'rgba(109,40,217,',
    'rgba(5,150,105,', 'rgba(204,122,46,',
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.5 + 0.1,
      col: COLS[Math.floor(Math.random() * COLS.length)],
      life: Math.random() * 200 + 100,
      age: 0,
    };
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    if (Math.random() < 0.4) ps.push(spawn());
    ps = ps.filter((p) => {
      const pp = p;
      pp.x += pp.vx;
      pp.y += pp.vy;
      pp.age += 1;
      if (pp.x < 0 || pp.x > W) pp.vx *= -1;
      if (pp.y < 0 || pp.y > H) pp.vy *= -1;
      const t = Math.sin((Math.PI * pp.age) / pp.life);
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pp.r, 0, Math.PI * 2);
      ctx.fillStyle = `${pp.col}${pp.a * t})`;
      ctx.fill();
      return pp.age < pp.life;
    });
    if (ps.length > 150) ps.splice(0, 1);
    requestAnimationFrame(loop);
  }
  loop();
}

/* ── init interactive features ──────────────── */

function initBudgetSlider(block) {
  const slider = block.querySelector('#f4-budget');
  const valEl = block.querySelector('.f4-sval');
  if (!slider || !valEl) return;
  function update() {
    const v = +slider.value;
    valEl.textContent = fmtBudget(v);
    const pct = ((v - 5000) / 495000) * 100;
    slider.style.background = `linear-gradient(to right,#8821f4 ${pct}%,`
      + `rgba(0,0,0,.08) ${pct}%)`;
  }
  slider.addEventListener('input', update);
  update();
}

function initStars(block) {
  let sv = 0;
  const hidden = block.querySelector('input[name="excitement"]');
  const btns = block.querySelectorAll('.f4-sbtn');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sv = +btn.dataset.v;
      if (hidden) hidden.value = String(sv);
      btns.forEach((s, i) => {
        s.style.color = i < sv ? '#fbbf24' : '';
        if (i < sv) {
          s.style.transform = 'scale(1.1)';
          setTimeout(() => { s.style.transform = ''; }, 200);
        }
      });
    });
    btn.addEventListener('mouseenter', () => {
      const hv = +btn.dataset.v;
      btns.forEach((s, i) => {
        s.style.color = i < hv ? '#fbbf24' : '';
      });
    });
  });

  const wrap = block.querySelector('.f4-stars');
  if (wrap) {
    wrap.addEventListener('mouseleave', () => {
      btns.forEach((s, i) => {
        s.style.color = i < sv ? '#fbbf24' : '';
      });
    });
  }
}

function initCharCounter(block) {
  const ta = block.querySelector('#f4-message');
  const ctr = block.querySelector('.f4-counter');
  if (!ta || !ctr) return;
  ta.addEventListener('input', () => {
    const n = ta.value.length;
    ctr.textContent = `${n} / 1200`;
    ctr.className = 'f4-counter';
    if (n > 1000) ctr.classList.add('f4-counter--warn');
    if (n > 1200) ctr.classList.add('f4-counter--over');
  });
}

function initColorPicker(block) {
  const picks = block.querySelectorAll('.f4-cpick');
  const label = block.querySelector('.f4-cpick-label');
  const hidden = block.querySelector('input[name="brandColor"]');
  picks.forEach((cp) => {
    cp.addEventListener('click', () => {
      picks.forEach((c) => c.classList.remove('f4-cpick--sel'));
      cp.classList.add('f4-cpick--sel');
      if (hidden) hidden.value = cp.dataset.c;
      if (label) {
        label.textContent = cp.dataset.c;
        label.style.color = 'var(--f4-a)';
      }
    });
  });
}

function initDropzone(block) {
  const dz = block.querySelector('.f4-dropzone');
  if (!dz) return;
  const fi = dz.querySelector('input[type="file"]');
  const filesEl = dz.querySelector('.f4-dzfiles');

  function showFiles(files) {
    filesEl.textContent = '';
    [...files].forEach((f) => {
      filesEl.append(el('div', {
        className: 'f4-dzpill',
        textContent: `\u2713 ${f.name}`,
      }));
    });
  }

  fi.addEventListener('change', () => showFiles(fi.files));
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('f4-dropzone--over');
  });
  dz.addEventListener('dragleave', () => {
    dz.classList.remove('f4-dropzone--over');
  });
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('f4-dropzone--over');
    showFiles(e.dataTransfer.files);
  });
}

function initFieldValidation(block) {
  block.querySelectorAll('.f4-fi').forEach((inp) => {
    inp.addEventListener('blur', () => {
      const f = inp.closest('.f4-field');
      if (f) vField(inp, f);
    });
    inp.addEventListener('input', () => {
      const f = inp.closest('.f4-field');
      if (f && f.classList.contains('f4-field--err')) vField(inp, f);
    });
  });
}

/* ── build step 1 ───────────────────────────── */

function buildStep1() {
  const step = el('div', {
    className: 'f4-fstep f4-fstep--active',
    'data-step': '1',
  });
  step.append(el('div', { className: 'f4-stitle', textContent: 'Who are you?' }));
  step.append(el('div', {
    className: 'f4-ssub',
    textContent: "Start with the basics \u2014 we want to know who we're collaborating with.",
  }));

  const grid = el('div', { className: 'f4-grid' });

  grid.append(fieldWrap('f4-fname', {
    label: 'First name',
    required: true,
    icon: ICONS.user,
    placeholder: 'Alex',
    autocomplete: 'given-name',
    trail: ICONS.user,
  }));
  grid.append(fieldWrap('f4-lname', {
    label: 'Last name',
    required: true,
    placeholder: 'Jordan',
    autocomplete: 'family-name',
  }));
  grid.append(fieldWrap('f4-email', {
    label: 'Email address',
    required: true,
    type: 'email',
    icon: ICONS.mail,
    placeholder: 'alex@studio.com',
    autocomplete: 'email',
    span2: true,
    trail: ICONS.mail,
  }));
  grid.append(fieldWrap('f4-phone', {
    label: 'Phone',
    icon: ICONS.phone,
    type: 'tel',
    placeholder: '+1 (555) 000-0000',
    autocomplete: 'tel',
  }));
  grid.append(fieldWrap('f4-company', {
    label: 'Company',
    icon: ICONS.company,
    placeholder: 'Studio Inc.',
    autocomplete: 'organization',
  }));
  grid.append(fieldWrap('f4-website', {
    label: 'Website URL',
    icon: ICONS.globe,
    type: 'url',
    placeholder: 'https://yourstudio.com',
    span2: true,
  }));
  grid.append(fieldWrap('f4-role', {
    label: 'Your role',
    type: 'select',
    span2: true,
    options: [
      ['', 'Select your role\u2026'],
      ['Founder / CEO', 'Founder / CEO'],
      ['Product Manager', 'Product Manager'],
      ['Marketing Director', 'Marketing Director'],
      ['Designer', 'Designer'],
      ['Developer', 'Developer'],
      ['Creative Director', 'Creative Director'],
      ['Agency / Consultant', 'Agency / Consultant'],
      ['Other', 'Other'],
    ],
  }));

  step.append(grid);

  const nav = el('div', { className: 'f4-nav' });
  nav.append(el('div'));
  const nxBtn = el('button', {
    type: 'button',
    className: 'f4-bnx',
    id: 'f4-n1',
  });
  nxBtn.append(el('span', { textContent: 'Continue' }));
  nxBtn.append(svg(ICONS.arrowRight, { sw: '2.5' }));
  nav.append(nxBtn);
  step.append(nav);
  return step;
}

/* ── build step 2 ───────────────────────────── */

function buildStep2() {
  const step = el('div', { className: 'f4-fstep', 'data-step': '2' });
  step.append(el('div', { className: 'f4-stitle', textContent: 'About your project' }));
  step.append(el('div', {
    className: 'f4-ssub',
    textContent: "Help us understand the scope, scale, and nature of what you're building.",
  }));

  const grid = el('div', { className: 'f4-grid' });

  grid.append(pillGroup('Project type', 'ptype', 'radio', [
    ['Website', '\uD83C\uDF10 Website'],
    ['Mobile App', '\uD83D\uDCF1 Mobile App'],
    ['Branding', '\u2726 Branding'],
    ['Campaign', '\uD83C\uDFAF Campaign'],
    ['Video', '\uD83C\uDFAC Video'],
    ['E-Commerce', '\uD83D\uDECD E-Commerce'],
    ['SaaS Product', '\u2699\uFE0F SaaS'],
    ['Other', '\u2726 Other'],
  ], { required: true, id: 'f4-f-ptype' }));

  grid.append(fieldWrap('f4-industry', {
    label: 'Industry',
    type: 'select',
    options: [
      ['', 'Choose\u2026'],
      ['Technology', 'Technology'],
      ['Finance & Fintech', 'Finance & Fintech'],
      ['Healthcare', 'Healthcare'],
      ['Retail & E-commerce', 'Retail & E-commerce'],
      ['Media & Entertainment', 'Media & Entertainment'],
      ['Real Estate', 'Real Estate'],
      ['Education', 'Education'],
      ['Non-profit', 'Non-profit'],
      ['Other', 'Other'],
    ],
  }));

  grid.append(fieldWrap('f4-date', {
    label: 'Ideal launch date',
    type: 'date',
  }));

  const budgetField = el('div', { className: 'f4-field f4-span2' });
  budgetField.append(el('div', {
    className: 'f4-flbl',
    textContent: 'Estimated budget',
  }));
  const budgetWrap = el('div', { className: 'f4-fwrap' });
  budgetWrap.append(el('input', {
    type: 'range',
    className: 'f4-fslider',
    id: 'f4-budget',
    name: 'budget',
    min: '5000',
    max: '500000',
    step: '5000',
    value: '50000',
  }));
  budgetField.append(budgetWrap);
  const slabels = el('div', { className: 'f4-slabels' });
  slabels.append(el('span', { textContent: '$5k' }));
  slabels.append(el('span', { textContent: '$500k+' }));
  budgetField.append(slabels);
  budgetField.append(el('div', {
    className: 'f4-sval',
    textContent: '$50,000',
  }));
  grid.append(budgetField);

  grid.append(pillGroup('Services needed', 'services', 'checkbox', [
    ['Strategy', 'Strategy'],
    ['UX Design', 'UX Design'],
    ['Development', 'Development'],
    ['Content', 'Content'],
    ['SEO', 'SEO'],
    ['Analytics', 'Analytics'],
    ['Accessibility', 'Accessibility'],
    ['Maintenance', 'Maintenance'],
  ]));

  grid.append(colorPicker());
  grid.append(dropzone());

  step.append(grid);

  const nav = el('div', { className: 'f4-nav' });
  const bkBtn = el('button', {
    type: 'button',
    className: 'f4-bbk',
    id: 'f4-b2',
  });
  bkBtn.append(svg(ICONS.arrowLeft, { sw: '2.5' }));
  bkBtn.append(document.createTextNode('Back'));
  nav.append(bkBtn);
  const nxBtn = el('button', {
    type: 'button',
    className: 'f4-bnx',
    id: 'f4-n2',
  });
  nxBtn.append(el('span', { textContent: 'Continue' }));
  nxBtn.append(svg(ICONS.arrowRight, { sw: '2.5' }));
  nav.append(nxBtn);
  step.append(nav);
  return step;
}

/* ── build step 3 ───────────────────────────── */

function buildStep3() {
  const step = el('div', { className: 'f4-fstep', 'data-step': '3' });
  step.append(el('div', { className: 'f4-stitle', textContent: 'Your message' }));
  step.append(el('div', {
    className: 'f4-ssub',
    textContent: 'Tell us what you\'re dreaming of. The more context you give,'
      + ' the better we can help.',
  }));

  const grid = el('div', { className: 'f4-grid' });

  const msgField = fieldWrap('f4-message', {
    label: 'Message',
    required: true,
    type: 'textarea',
    span2: true,
    placeholder: 'Describe your project, goals, challenges, and anything else'
      + ' that helps us understand your vision\u2026',
    maxlength: 1200,
  });
  const counterEl = el('span', {
    className: 'f4-counter',
    textContent: '0 / 1200',
  });
  msgField.querySelector('.f4-fwrap').append(counterEl);
  grid.append(msgField);

  grid.append(pillGroup('How did you find us?', 'source', 'radio', [
    ['Search', '\uD83D\uDD0D Search'],
    ['Social', '\uD83D\uDCF2 Social'],
    ['Referral', '\uD83E\uDD1D Referral'],
    ['Event', '\uD83C\uDFA4 Event'],
    ['Podcast', '\uD83C\uDF99 Podcast'],
    ['Press', '\uD83D\uDCF0 Press'],
    ['Other', '\u2726 Other'],
  ]));

  grid.append(fieldWrap('f4-contactPref', {
    label: 'Preferred contact',
    type: 'select',
    options: [
      ['email', '\u2709\uFE0F Email'],
      ['call', '\uD83D\uDCDE Phone call'],
      ['video', '\uD83C\uDFA5 Video call'],
      ['slack', '\uD83D\uDCAC Slack'],
      ['whatsapp', '\uD83D\uDCF1 WhatsApp'],
    ],
  }));

  grid.append(fieldWrap('f4-timezone', {
    label: 'Timezone',
    type: 'select',
    options: [
      ['auto', '\uD83C\uDF0D Auto-detect'],
      ['GMT-8 (PST)', 'GMT-8 (PST)'],
      ['GMT-7 (MST)', 'GMT-7 (MST)'],
      ['GMT-6 (CST)', 'GMT-6 (CST)'],
      ['GMT-5 (EST)', 'GMT-5 (EST)'],
      ['GMT+0 (UTC)', 'GMT+0 (UTC)'],
      ['GMT+1 (CET)', 'GMT+1 (CET)'],
      ['GMT+3 (Moscow)', 'GMT+3 (Moscow)'],
      ['GMT+5:30 (IST)', 'GMT+5:30 (IST)'],
      ['GMT+8 (SGT/HKT)', 'GMT+8 (SGT/HKT)'],
      ['GMT+9 (JST/KST)', 'GMT+9 (JST/KST)'],
      ['GMT+11 (AEDT)', 'GMT+11 (AEDT)'],
    ],
  }));

  grid.append(starsField());

  const toggleWrap = el('div', { className: 'f4-field f4-span2' });
  toggleWrap.append(el('div', {
    className: 'f4-flbl',
    textContent: 'Preferences',
  }));
  const toggleCol = el('div', { className: 'f4-toggles' });
  toggleCol.append(toggleRow(
    'newsletter',
    'Subscribe to newsletter',
    'Monthly insights, case studies & design tips',
    true,
  ));
  toggleCol.append(toggleRow(
    'nda',
    'NDA required before sharing details',
    "We'll send a mutual NDA before our first conversation",
  ));
  toggleCol.append(toggleRow(
    'call',
    'Available for a discovery call this week',
    "We'll try to schedule a 30-min call within 48 hours",
  ));
  toggleCol.append(toggleRow(
    'equity',
    'Open to equity / revenue share arrangements',
    'For the right projects, we sometimes partner differently',
  ));
  toggleWrap.append(toggleCol);
  grid.append(toggleWrap);

  const consentField = el('div', { className: 'f4-field f4-span2' });
  const consentPills = el('div', { className: 'f4-pills' });
  const consentPc = el('div', { className: 'f4-pc f4-pc--wide' });
  const consentInp = el('input', {
    type: 'checkbox',
    id: 'f4-consent',
    name: 'consent',
    value: 'yes',
    required: '',
  });
  const consentLbl = el('label', { for: 'f4-consent', className: 'f4-consent-label' });
  consentLbl.append(document.createTextNode('I agree to the '));
  consentLbl.append(el('a', {
    href: '#',
    className: 'f4-link',
    textContent: 'Privacy Policy',
  }));
  consentLbl.append(document.createTextNode(' and '));
  consentLbl.append(el('a', {
    href: '#',
    className: 'f4-link',
    textContent: 'Terms of Service',
  }));
  consentPc.append(consentInp, consentLbl);
  consentPills.append(consentPc);
  consentField.append(consentPills);
  consentField.append(el('span', {
    className: 'f4-fmsg',
    id: 'f4-consent-msg',
    'aria-live': 'polite',
  }));
  grid.append(consentField);

  step.append(grid);

  const nav = el('div', { className: 'f4-nav' });
  const bkBtn = el('button', {
    type: 'button',
    className: 'f4-bbk',
    id: 'f4-b3',
  });
  bkBtn.append(svg(ICONS.arrowLeft, { sw: '2.5' }));
  bkBtn.append(document.createTextNode('Back'));
  nav.append(bkBtn);
  const subBtn = el('button', {
    type: 'button',
    className: 'f4-bnx f4-bsub',
    id: 'f4-sub',
  });
  subBtn.append(el('span', { textContent: 'Send it off \u2726' }));
  subBtn.append(svg(ICONS.arrowRight, { sw: '2.5' }));
  nav.append(subBtn);
  step.append(nav);
  return step;
}

/* ── decorate ───────────────────────────────── */

export default function decorate(block) {
  const rows = [...block.children];
  const title = rows[0]?.textContent?.trim()
    || 'Tell us about your vision';
  const subtitle = rows[1]?.textContent?.trim()
    || 'We craft digital experiences that endure. Share the details below'
    + ' and our team will respond within one business day.';
  const redirectLink = rows[2]?.querySelector('a[href]');
  const redirectUrl = redirectLink
    ? redirectLink.getAttribute('href') : null;

  block.textContent = '';

  const canvas = el('canvas', { className: 'f4-pcanvas' });
  const bgCanvas = el('div', { className: 'f4-bg-canvas' });
  for (let i = 0; i < 4; i += 1) bgCanvas.append(el('div', { className: 'f4-orb' }));
  const bgGrid = el('div', { className: 'f4-bg-grid' });
  const bgNoise = el('div', { className: 'f4-bg-noise' });
  block.append(canvas, bgCanvas, bgGrid, bgNoise);

  const outer = el('div', { className: 'f4-outer' });

  const badge = el('div', { className: 'f4-badge' });
  const badgeSpan = el('span');
  badgeSpan.append(el('span', { className: 'f4-dot' }));
  badgeSpan.append(document.createTextNode(
    'AEM Edge Delivery Services \u00B7 Document Authoring Block',
  ));
  badge.append(badgeSpan);
  outer.append(badge);

  const card = el('div', { className: 'f4-card' });

  const hero = el('div', { className: 'f4-hero' });
  hero.append(el('div', {
    className: 'f4-eyebrow',
    textContent: 'New project inquiry',
  }));
  const h1 = el('h1', { className: 'f4-h1' });
  const titleParts = title.split(/\n|<br>/i);
  if (titleParts.length > 1) {
    h1.append(document.createTextNode(titleParts[0]));
    h1.append(document.createElement('br'));
    const em = el('em', { textContent: titleParts.slice(1).join(' ') });
    h1.append(em);
  } else {
    h1.textContent = title;
  }
  hero.append(h1);
  hero.append(el('p', { className: 'f4-hero-p', textContent: subtitle }));

  const prog = el('div', { className: 'f4-progress' });
  buildProgress(prog);
  hero.append(prog);
  card.append(hero);

  const fbody = el('div', { className: 'f4-fbody' });
  fbody.append(buildStep1());
  fbody.append(buildStep2());
  fbody.append(buildStep3());
  card.append(fbody);

  const succEl = el('div', { className: 'f4-success-wrap' });
  card.append(succEl);

  outer.append(card);
  block.append(outer);

  initParticles(canvas);
  initBudgetSlider(block);
  initStars(block);
  initCharCounter(block);
  initColorPicker(block);
  initDropzone(block);
  initFieldValidation(block);

  let cur = 1;

  block.querySelector('#f4-n1').addEventListener('click', () => {
    let ok = true;
    ['f4-fname', 'f4-lname', 'f4-email'].forEach((id) => {
      const inp = block.querySelector(`#${id}`);
      const f = block.querySelector(`#f4-f-${id}`);
      if (inp && f && !vField(inp, f)) ok = false;
    });
    if (ok) cur = goTo(2, cur, block);
  });

  block.querySelector('#f4-b2').addEventListener('click', () => {
    cur = goTo(1, cur, block);
  });

  block.querySelector('#f4-n2').addEventListener('click', () => {
    const chosen = block.querySelector('input[name="ptype"]:checked');
    const msg = block.querySelector('#f4-f-ptype .f4-fmsg');
    if (!chosen) {
      if (msg) msg.textContent = 'Please select a project type.';
      return;
    }
    if (msg) msg.textContent = '';
    cur = goTo(3, cur, block);
  });

  block.querySelector('#f4-b3').addEventListener('click', () => {
    cur = goTo(2, cur, block);
  });

  block.querySelector('#f4-sub').addEventListener('click', async () => {
    let ok = true;
    const ta = block.querySelector('#f4-message');
    const taField = block.querySelector('#f4-f-f4-message');
    if (ta && taField && !vField(ta, taField)) ok = false;

    const cons = block.querySelector('#f4-consent');
    const cm = block.querySelector('#f4-consent-msg');
    if (cons && !cons.checked) {
      if (cm) cm.textContent = 'You must agree to continue.';
      ok = false;
    } else if (cm) {
      cm.textContent = '';
    }

    if (!ok) {
      block.querySelector('.f4-field--err .f4-fi')?.focus();
      return;
    }

    const btn = block.querySelector('#f4-sub');
    btn.classList.add('f4-bnx--ld');
    const btnSpan = btn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Sending\u2026';

    await new Promise((r) => { setTimeout(r, 1600); });

    const fname = block.querySelector('#f4-fname')?.value || '';
    const email = block.querySelector('#f4-email')?.value || '';
    const ptype = block.querySelector('input[name="ptype"]:checked')?.value || '\u2014';
    const budgetVal = block.querySelector('.f4-sval')?.textContent || '';
    const color = block.querySelector('input[name="brandColor"]')?.value || 'Not chosen';

    const chipData = [
      { i: '\uD83D\uDC64', t: fname },
      { i: '\u2709\uFE0F', t: email },
      { i: '\uD83C\uDFAF', t: ptype },
      { i: '\uD83D\uDCB0', t: budgetVal },
      { i: '\uD83C\uDFA8', t: color },
    ];

    const success = buildSuccess(block, chipData, redirectUrl);
    fbody.style.display = 'none';
    hero.style.borderBottom = 'none';
    succEl.append(success);
  });
}
