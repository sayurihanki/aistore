const CART_STORAGE_KEY = 'mcx-demo-cart';

function getProductData(card) {
  return {
    brand: card.dataset.brand || '',
    category: card.dataset.cat || 'all',
    chip: card.dataset.chip || '',
    emoji: card.dataset.emoji || '◆',
    flags: (card.dataset.flags || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    name: card.dataset.name || '',
    original: card.dataset.original || '',
    price: Number.parseFloat(card.dataset.price || '0'),
    rating: card.dataset.rating || '5',
    reviews: card.dataset.reviews || '0',
    sizes: (card.dataset.sizes || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    image: card.querySelector('.prod-img img, .prod-img')?.getAttribute('src') || '',
  };
}

function getCards() {
  return [...document.querySelectorAll('.mcx-product-cards .prod-card')];
}

function readCart(cards) {
  try {
    const saved = window.sessionStorage.getItem(CART_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    // Ignore storage failures and use the seeded demo cart instead.
  }

  const seeded = cards.slice(0, 3).map((card) => {
    const product = getProductData(card);
    return { ...product, qty: 1 };
  });

  return seeded;
}

function persistCart(cart) {
  try {
    window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    // Ignore storage failures in local/demo mode.
  }
}

function createToastStack() {
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  stack.id = 'mcx-toast-stack';
  document.body.append(stack);
  return stack;
}

function showToast(title, subtitle = '', type = 'green') {
  const stack = document.getElementById('mcx-toast-stack') || createToastStack();
  const toast = document.createElement('div');
  toast.className = 'toast';

  const icon = document.createElement('div');
  icon.className = `t-ico ${type}`;
  icon.textContent = type === 'green' ? '✓' : '♥';

  const copy = document.createElement('div');
  const heading = document.createElement('div');
  heading.className = 't-title';
  heading.textContent = title;
  const sub = document.createElement('div');
  sub.className = 't-sub';
  sub.textContent = subtitle;
  copy.append(heading, sub);

  toast.append(icon, copy);
  stack.append(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function createBackToTopButton() {
  const button = document.createElement('button');
  button.className = 'b2t';
  button.type = 'button';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"></path></svg>';
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.append(button);
  return button;
}

function updateCartCount(cart) {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('[data-mcx-cart-count]').forEach((node) => {
    node.textContent = String(totalQty);
    node.style.transform = 'scale(1.7)';
    window.setTimeout(() => {
      node.style.transform = '';
    }, 300);
  });
}

function updateCart(cartRef, product) {
  const existing = cartRef.items.find((item) => item.name === product.name);
  if (existing) {
    existing.qty += 1;
  } else {
    cartRef.items.push({ ...product, qty: 1 });
  }

  persistCart(cartRef.items);
  updateCartCount(cartRef.items);
}

function initScrollEffects(backToTop) {
  const header = document.querySelector('header .header');
  const heroGrid = document.querySelector('.mcx-hero .hero-grid');

  const handleScroll = () => {
    const offset = window.scrollY;
    header?.classList.toggle('scrolled', offset > 20);
    backToTop.classList.toggle('on', offset > 500);
    if (heroGrid) heroGrid.style.transform = `translateY(${offset * 0.25}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function initRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
}

function initCountdown() {
  document.querySelectorAll('.mcx-deal-countdown .deal-strip').forEach((strip) => {
    const end = strip.dataset.countdownEnd ? new Date(strip.dataset.countdownEnd) : null;
    if (!end || Number.isNaN(end.getTime())) return;

    const targets = {
      days: strip.querySelector('[data-countdown-days]'),
      hours: strip.querySelector('[data-countdown-hours]'),
      minutes: strip.querySelector('[data-countdown-minutes]'),
      seconds: strip.querySelector('[data-countdown-seconds]'),
    };
    const cta = strip.querySelector('.btn-deal');
    const note = strip.querySelector('.deal-cta p');

    const update = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        Object.values(targets).forEach((node) => {
          if (node) node.textContent = '00';
        });
        if (note) note.textContent = strip.dataset.endedText || 'Ended';
        if (cta && strip.dataset.hideCtaWhenEnded === 'true') cta.style.display = 'none';
        return;
      }

      const values = {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };

      Object.entries(values).forEach(([key, value]) => {
        const nextValue = String(value).padStart(2, '0');
        if (targets[key] && targets[key].textContent !== nextValue) {
          targets[key].style.transform = 'translateY(-4px)';
          targets[key].style.opacity = '0.4';
          targets[key].textContent = nextValue;
          window.setTimeout(() => {
            targets[key].style.transform = '';
            targets[key].style.opacity = '';
          }, 180);
        }
      });
    };

    update();
    window.setInterval(update, 1000);
  });
}

function initSearchShortcut() {
  const input = document.querySelector('[data-mcx-search-input]');
  if (!input) return;
  const searchWrap = input.closest('.hdr-search');

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input.focus();
      searchWrap?.classList.add('expanded');
    }
  });

  input.addEventListener('focus', () => {
    searchWrap?.classList.add('expanded');
  });

  input.addEventListener('blur', () => {
    searchWrap?.classList.remove('expanded');
  });
}

function initNavState() {
  document.querySelectorAll('.mcx-header .nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.mcx-header .nav-link').forEach((node) => node.classList.remove('on'));
      link.classList.add('on');
    });
  });
}

function initNewsletter() {
  document.querySelectorAll('[data-mcx-newsletter]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      showToast('Subscribed!', 'You are now on the MCX insider list.', 'green');
      form.reset();
    });
  });
}

function initProductInteractions(cartRef) {
  const cards = getCards();
  cartRef.items = readCart(cards);
  persistCart(cartRef.items);
  updateCartCount(cartRef.items);

  document.addEventListener('click', (event) => {
    const loveButton = event.target.closest('.prod-love');
    if (loveButton) {
      event.preventDefault?.();
      loveButton.classList.toggle('loved');
      const card = loveButton.closest('.prod-card');
      showToast(
        loveButton.classList.contains('loved') ? 'Saved to Wishlist ♥' : 'Removed from Wishlist',
        card?.dataset.name || '',
        loveButton.classList.contains('loved') ? 'red' : 'green',
      );
      return;
    }

    const addButton = event.target.closest('.prod-atc');
    if (addButton) {
      event.preventDefault?.();
      const card = addButton.closest('.prod-card');
      if (!card) return;
      const product = getProductData(card);
      const originalText = addButton.dataset.originalLabel || addButton.textContent;
      addButton.dataset.originalLabel = originalText;
      addButton.textContent = '✓ Added!';
      addButton.classList.add('is-added');
      updateCart(cartRef, product);
      showToast('Added to Cart!', product.name);
      window.setTimeout(() => {
        addButton.textContent = originalText;
        addButton.classList.remove('is-added');
      }, 2200);
    }
  });
}

export default function initMcxUi() {
  if (!document.body.classList.contains('mcx')) return;

  const cartRef = { items: [] };
  const backToTop = createBackToTopButton();
  createToastStack();

  initRevealObserver();
  initScrollEffects(backToTop);
  initCountdown();
  initSearchShortcut();
  initNavState();
  initNewsletter();
  initProductInteractions(cartRef);
}
