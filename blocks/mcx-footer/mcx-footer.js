import { getMetadata, toClassName } from '../../scripts/aem.js';

function socialIcon(name) {
  const icons = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Z"></path><path d="M12 5.838A6.162 6.162 0 1 0 12 18.162 6.162 6.162 0 1 0 12 5.838Z"></path><circle cx="18.406" cy="5.595" r="1.44"></circle></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184A4.92 4.92 0 0 0 11.78 8.288 13.968 13.968 0 0 1 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417A9.867 9.867 0 0 1 .96 19.54a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59Z"></path></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.84 1.55V6.79a4.84 4.84 0 0 1-1.07-.1Z"></path></svg>',
  };

  return icons[name] || icons.facebook;
}

function getDefaultData() {
  return {
    about: 'Serving Marines and their families since 1897. Tax-free shopping that returns 100% of profits to the Marine Corps community through MCCS programs and activities.',
    note: '© 2026 Marine Corps Exchange (MCX) / MCCS. All rights reserved. Tax-free shopping for authorized DoD patrons.',
    flag: 'Proudly Serving Since 1897',
    socials: [
      { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
      { name: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
      { name: 'twitter', label: 'Twitter', url: 'https://www.x.com/' },
      { name: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/' },
    ],
    columns: [
      { title: 'Shop', links: ['New Arrivals', "Men's", "Women's", 'Kids & Baby', 'Electronics', 'Home & Garden', 'Sports & Outdoors', 'Sale & Clearance'].map((text) => ({ text, url: '/shop' })) },
      { title: 'Services', links: ['Find a Store', 'Ship to Store', 'Returns & Exchanges', 'Order Status', 'Military Layaway', 'Gift Cards', 'Price Match'].map((text) => ({ text, url: '/services' })) },
      { title: 'About MCX', links: ['Our Mission', 'MCCS Programs', 'Patron Eligibility', 'Vendor Partnerships', 'Careers at MCX', 'Newsroom'].map((text) => ({ text, url: '/about' })) },
      { title: 'Support', links: ['Help Center', 'Contact Us', 'Feedback', 'Accessibility', 'Security Center'].map((text) => ({ text, url: '/support' })) },
    ],
    legal: [
      { text: 'Privacy Policy', url: '/privacy' },
      { text: 'Terms of Use', url: '/terms' },
      { text: 'Cookie Policy', url: '/cookies' },
      { text: 'Accessibility', url: '/accessibility' },
    ],
  };
}

async function fetchFragmentDocument(path) {
  const response = await fetch(`${path}.plain.html`);
  if (!response.ok) throw new Error(`Unable to load fragment: ${path}`);
  const main = document.createElement('main');
  main.innerHTML = await response.text();
  return main;
}

function parseFooterData(main) {
  const dataBlock = main.querySelector('.mcx-footer-data');
  if (!dataBlock) return getDefaultData();

  const data = getDefaultData();
  data.columns = [];
  data.socials = [];
  data.legal = [];

  [...dataBlock.children].forEach((row) => {
    const [type, group, label, value] = [...row.children].map((cell) => cell.textContent.trim());
    const normalizedType = toClassName(type);

    if (normalizedType === 'config') {
      if (group === 'brand' && label === 'about') data.about = value;
      if (group === 'site' && label === 'note') data.note = value;
      if (group === 'site' && label === 'flag') data.flag = value;
      return;
    }

    if (normalizedType === 'social') {
      data.socials.push({
        name: toClassName(group || label),
        label,
        url: value || '#',
      });
      return;
    }

    if (normalizedType === 'column') {
      let column = data.columns.find((entry) => entry.title === group);
      if (!column) {
        column = { title: group, links: [] };
        data.columns.push(column);
      }
      column.links.push({ text: label, url: value || '#' });
      return;
    }

    if (normalizedType === 'legal') {
      data.legal.push({ text: label, url: value || '#' });
    }
  });

  return data;
}

function createLogoText() {
  const wrapper = document.createElement('div');
  wrapper.className = 'logo-text';
  wrapper.innerHTML = `
    <div class="logo-mcx">MCX</div>
    <div class="logo-tagline">Marine Corps Exchange</div>
  `;
  return wrapper;
}

function buildFooterDom(data) {
  const footer = document.createElement('div');
  footer.className = 'footer';

  const inner = document.createElement('div');
  inner.className = 'foot-inner';

  const top = document.createElement('div');
  top.className = 'foot-top';

  const brand = document.createElement('div');
  brand.className = 'foot-brand';
  brand.append(createLogoText());

  const about = document.createElement('p');
  about.textContent = data.about;
  brand.append(about);

  const socials = document.createElement('div');
  socials.className = 'foot-socials';
  data.socials.forEach((social) => {
    const link = document.createElement('a');
    link.className = 'soc';
    link.href = social.url;
    link.setAttribute('aria-label', social.label);
    link.innerHTML = socialIcon(social.name);
    socials.append(link);
  });
  brand.append(socials);
  top.append(brand);

  data.columns.forEach((columnData) => {
    const column = document.createElement('div');
    column.className = 'foot-col';
    const title = document.createElement('h5');
    title.textContent = columnData.title;
    column.append(title);

    const list = document.createElement('ul');
    columnData.links.forEach((linkData) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = linkData.url;
      link.textContent = linkData.text;
      item.append(link);
      list.append(item);
    });
    column.append(list);
    top.append(column);
  });

  inner.append(top);

  const line = document.createElement('hr');
  line.className = 'foot-line';
  inner.append(line);

  const bottom = document.createElement('div');
  bottom.className = 'foot-bot';

  const note = document.createElement('p');
  note.textContent = data.note;
  bottom.append(note);

  const flag = document.createElement('div');
  flag.className = 'foot-flag';
  flag.textContent = `USA ${data.flag}`;
  bottom.append(flag);

  const legal = document.createElement('div');
  legal.className = 'foot-legal';
  data.legal.forEach((linkData) => {
    const link = document.createElement('a');
    link.href = linkData.url;
    link.textContent = linkData.text;
    legal.append(link);
  });
  bottom.append(legal);

  inner.append(bottom);
  footer.append(inner);

  return footer;
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/fragments/mcx-footer';

  let data = getDefaultData();
  try {
    const fragment = await fetchFragmentDocument(footerPath);
    data = parseFooterData(fragment);
  } catch (error) {
    // Use the built-in MCX footer when the authored fragment is unavailable.
  }

  block.replaceChildren(buildFooterDom(data));
}
