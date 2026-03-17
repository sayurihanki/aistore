/* eslint-disable object-curly-newline */
const DEVICE_TEXT_LIMIT = 120;

export const DEFAULT_BLOCK_CONTENT = Object.freeze({
  eyebrowText: 'MarineShop · Awards Division',
  title: 'Welcome to the\nEZ Rack Builder',
  subtitle: 'Assemble your ribbon rack, medal display, or full awards package in minutes. Our system automatically applies regulation precedence. Prototype mode keeps everything local to the block.',
  primaryCtaLabel: 'Start New Rack',
  secondaryCtaLabel: 'Prototype Login',
  reviewCtaLabel: 'Save Prototype Rack',
  prototypeNote: 'Prototype mode only. This block recreates the full luxury builder experience without connecting to Commerce, cart, or PDP configuration.',
});

export const PAGE_LABELS = Object.freeze([
  'Welcome',
  'Select Branch',
  'Rack Type',
  'Rack Options',
  'Select Awards',
  'Review',
]);

export const STEP_DEFINITIONS = Object.freeze([
  { id: 'welcome', title: 'Welcome to the EZ Rack Builder' },
  { id: 'branch', title: 'Select Branch' },
  { id: 'rack-type', title: 'Select Rack Type' },
  { id: 'options', title: 'Rack Options' },
  { id: 'awards', title: 'Select Awards' },
  { id: 'review', title: 'Review' },
]);

export const FAMILY_BUILDERS = Object.freeze([
  { id: 'ez-rack', top: 'EZ Rack', bottom: 'Builder', active: true },
  { id: 'shadow-box', top: 'Shadow Box', bottom: 'Builder', active: false },
  { id: 'leather-tag', top: 'Leather Tag', bottom: 'Builder', active: false },
  { id: 'name-tag', top: 'Name Tag', bottom: 'Builder', active: false },
  { id: 'dog-tag', top: 'Dog Tag', bottom: 'Builder', active: false },
  { id: 'navy-cap', top: 'Navy Cap', bottom: 'Builder', active: false },
  { id: 'uswag', top: 'USWAG', bottom: 'Builder', active: false },
]);

export const BRANCHES = Object.freeze([
  { id: 'ARMY', label: 'Army', watermark: 'ARMY', icon: 'army' },
  { id: 'NAVY', label: 'Navy', watermark: 'NAVY', icon: 'navy' },
  { id: 'USMC', label: 'Marine Corps', watermark: 'USMC', icon: 'usmc' },
  { id: 'AIR_FORCE', label: 'Air Force', watermark: 'USAF', icon: 'airforce' },
  { id: 'COAST_GUARD', label: 'Coast Guard', watermark: 'USCG', icon: 'coastguard' },
  { id: 'SPACE_FORCE', label: 'Space Force', watermark: 'USSF', icon: 'spaceforce' },
  { id: 'PUBLIC_HEALTH', label: 'Public Health', watermark: 'USPHS', icon: 'health' },
  { id: 'CIVIL_AIR', label: 'Civil Air Patrol', watermark: 'CAP', icon: 'civilair' },
  { id: 'YOUNG_MARINES', label: 'Young Marines', watermark: 'YM', icon: 'youngmarines' },
]);

export const RACK_TYPES = Object.freeze([
  {
    id: 'thin_ribbons',
    label: 'Thin Ribbons',
    description: 'A lightweight alternative to standard military ribbons for everyday uniforms.',
    preview: 'thin',
  },
  {
    id: 'standard_ribbons',
    label: 'Standard Ribbons',
    description: 'Standard ribbons can be slid on to metal racks or displayed on their own.',
    preview: 'standard',
  },
  {
    id: 'tiny_ribbons',
    label: 'Tiny Ribbons',
    description: 'Miniature sized versions of your full-size ribbon rack for hats, shirts, and jackets.',
    preview: 'tiny',
  },
  {
    id: 'sticky_racks',
    label: 'Sticky Racks',
    description: 'Full-size sticker versions of your rack for mock displays and concept boards.',
    preview: 'sticky',
  },
  {
    id: 'standard_medals',
    label: 'Standard Medals',
    description: 'Official full-size medals presented to military personnel when an award is received.',
    preview: 'medal',
  },
  {
    id: 'anodized_medals',
    label: 'Anodized Medals',
    description: 'Standard medals with a glossy anodized finish to render them bright and gold.',
    preview: 'anodized',
  },
  {
    id: 'mini_medals',
    label: 'Mini Medals',
    description: 'Miniature medals with the same ceremonial hierarchy and a compact presentation.',
    preview: 'mini-medal',
  },
  {
    id: 'mini_anodized',
    label: 'Mini Anodized',
    description: 'Gloss-finished miniature medals for dress-forward mock presentations.',
    preview: 'mini-anodized',
  },
]);

export const DEVICE_DEFINITIONS = Object.freeze([
  { id: 'bronze', label: '3/16″ Bronze Star', type: 'count', max: 5, symbol: '✦' },
  { id: 'gold', label: '5/16″ Gold Star', type: 'count', max: 3, symbol: '★' },
  { id: 'silver', label: '5/16″ Silver Star', type: 'count', max: 3, symbol: '☆' },
  { id: 'bronzeC', label: 'Bronze C', type: 'toggle', symbol: 'C' },
  { id: 'goldV', label: 'Gold V', type: 'toggle', symbol: 'V' },
  { id: 'goldNumerals', label: 'Gold Numerals', type: 'text', symbol: '1' },
  { id: 'numerals', label: 'Numerals', type: 'text', symbol: '1' },
  { id: 'note', label: 'Special Instructions', type: 'textarea', symbol: '…' },
]);

export const AWARDS = Object.freeze([
  { id: 'silver-star', name: 'Silver Star', prec: 1, bg: 'linear-gradient(90deg,#1a3580 0 25%,#c00018 25% 33%,#fff 33% 40%,#c00018 40% 47%,#1a3580 47% 53%,#c00018 53% 60%,#fff 60% 67%,#c00018 67% 75%,#1a3580 75% 100%)' },
  { id: 'def-sup-svc', name: 'Defense Superior Service', prec: 2, bg: 'linear-gradient(90deg,#1a3580 0 30%,#c9a227 30% 50%,#b8d0e8 50% 70%,#c9a227 70% 100%)' },
  { id: 'lom-officer', name: 'Legion of Merit — Officer', prec: 3, bg: 'linear-gradient(90deg,#8b0000 0 15%,#fff 15% 20%,#c00018 20% 28%,#1a3580 28% 72%,#c00018 72% 80%,#fff 80% 85%,#8b0000 85% 100%)' },
  { id: 'lom', name: 'Legion of Merit', prec: 4, bg: 'linear-gradient(90deg,#8b0000 0 12%,#c00018 12% 88%,#8b0000 88% 100%)' },
  { id: 'navy-mc', name: 'Navy & Marine Corps Medal', prec: 5, bg: 'linear-gradient(90deg,#1a3580 0 18%,#c9a227 18% 26%,#1a3580 26% 74%,#c9a227 74% 82%,#1a3580 82% 100%)' },
  { id: 'bronze-star', name: 'Bronze Star', prec: 6, bg: 'linear-gradient(90deg,#c00018 0 18%,#1a3580 18% 25%,#fff 25% 38%,#1a3580 38% 62%,#fff 62% 75%,#1a3580 75% 82%,#c00018 82% 100%)' },
  { id: 'purple-heart', name: 'Purple Heart', prec: 7, bg: 'linear-gradient(90deg,#5a1a6e 0 20%,#c9a227 20% 28%,#5a1a6e 28% 72%,#c9a227 72% 80%,#5a1a6e 80% 100%)' },
  { id: 'def-mer-svc', name: 'Defense Meritorious Service', prec: 8, bg: 'linear-gradient(90deg,#1a1a8b 0 20%,#c00018 20% 40%,#fff 40% 60%,#c00018 60% 80%,#1a1a8b 80% 100%)' },
  { id: 'mer-svc', name: 'Meritorious Service', prec: 9, bg: 'linear-gradient(90deg,#c00018 0 18%,#fff 18% 25%,#1a3580 25% 75%,#fff 75% 82%,#c00018 82% 100%)' },
  { id: 'air-medal', name: 'Air Medal', prec: 10, bg: 'linear-gradient(90deg,#1a4a1a 0 25%,#c9a227 25% 45%,#1a4a1a 45% 55%,#c9a227 55% 75%,#1a4a1a 75% 100%)' },
  { id: 'js-commend', name: 'Joint Service Commendation', prec: 11, bg: 'linear-gradient(90deg,#1a3580 0 22%,#c00018 22% 32%,#fff 32% 42%,#c00018 42% 58%,#fff 58% 68%,#c00018 68% 78%,#1a3580 78% 100%)' },
  { id: 'nmc-commend', name: 'Navy & Marine Corps Commendation', prec: 12, bg: 'linear-gradient(90deg,#0a4a0a 0 25%,#fff 25% 35%,#c9a227 35% 65%,#fff 65% 75%,#0a4a0a 75% 100%)' },
  { id: 'js-achieve', name: 'Joint Service Achievement', prec: 13, bg: 'linear-gradient(90deg,#1a3580 0 20%,#c00018 20% 30%,#c9a227 30% 45%,#c00018 45% 55%,#c9a227 55% 70%,#c00018 70% 80%,#1a3580 80% 100%)' },
  { id: 'nmc-achieve', name: 'Navy & Marine Corps Achievement', prec: 14, bg: 'linear-gradient(90deg,#0a4a0a 0 20%,#c9a227 20% 35%,#0a4a0a 35% 65%,#c9a227 65% 80%,#0a4a0a 80% 100%)' },
  { id: 'combat-action', name: 'Combat Action Ribbon', prec: 15, bg: 'linear-gradient(90deg,#c9a227 0 15%,#3a6020 15% 30%,#c00018 30% 70%,#3a6020 70% 85%,#c9a227 85% 100%)' },
  { id: 'navy-unit', name: 'Navy Unit Commendation', prec: 16, bg: 'linear-gradient(90deg,#c9a227 0 20%,#556b2f 20% 80%,#c9a227 80% 100%)' },
  { id: 'mc-unit', name: 'Marine Corps Unit Commendation', prec: 17, bg: 'linear-gradient(90deg,#c00018 0 20%,#c9a227 20% 30%,#c00018 30% 70%,#c9a227 70% 80%,#c00018 80% 100%)' },
  { id: 'mc-good-conduct', name: 'Marine Corps Good Conduct', prec: 18, bg: 'linear-gradient(135deg,#c00018 0 45%,#c9a227 45% 55%,#c00018 55% 100%)' },
  { id: 'mc-expeditionary', name: 'Marine Corps Expeditionary', prec: 19, bg: 'linear-gradient(90deg,#c00018 0 15%,#c9a227 15% 25%,#c00018 25% 75%,#c9a227 75% 85%,#c00018 85% 100%)' },
  { id: 'natl-defense', name: 'National Defense', prec: 20, bg: 'linear-gradient(90deg,#c00018 0 20%,#fff 20% 30%,#1a3580 30% 50%,#fff 50% 70%,#c00018 70% 100%)' },
  { id: 'afg-campaign', name: 'Afghanistan Campaign', prec: 21, bg: 'linear-gradient(90deg,#c00018 0 15%,#000 15% 28%,#c9a227 28% 42%,#c00018 42% 58%,#c9a227 58% 72%,#000 72% 85%,#c00018 85% 100%)' },
  { id: 'iraq-campaign', name: 'Iraq Campaign', prec: 22, bg: 'linear-gradient(90deg,#c9a227 0 15%,#000 15% 28%,#c00018 28% 42%,#000 42% 58%,#c00018 58% 72%,#000 72% 85%,#c9a227 85% 100%)' },
  { id: 'global-war-terr', name: 'Global War on Terrorism Service', prec: 23, bg: 'linear-gradient(90deg,#1a1a8b 0 18%,#c00018 18% 28%,#fff 28% 38%,#c00018 38% 62%,#fff 62% 72%,#c00018 72% 82%,#1a1a8b 82% 100%)' },
  { id: 'gwot-exp', name: 'Global War on Terrorism Expeditionary', prec: 24, bg: 'linear-gradient(90deg,#1a1a8b 0 15%,#c9a227 15% 25%,#1a1a8b 25% 75%,#c9a227 75% 85%,#1a1a8b 85% 100%)' },
]);

export const DD214_PRELOAD = Object.freeze([
  'combat-action',
  'natl-defense',
  'afg-campaign',
  'mc-good-conduct',
  'gwot-exp',
]);

function clampCount(value, max) {
  const numericValue = Number.parseInt(value, 10);
  if (Number.isNaN(numericValue)) return 0;
  return Math.max(0, Math.min(max, numericValue));
}

function sanitizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DEVICE_TEXT_LIMIT)
    .trim();
}

export function normalizeText(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

export function normalizeMultiline(value, fallback = '') {
  return normalizeText(value, fallback).replace(/\\n/g, '\n');
}

export function normalizeBlockConfig(config = {}) {
  return {
    eyebrowText: normalizeText(config['eyebrow-text'], DEFAULT_BLOCK_CONTENT.eyebrowText),
    title: normalizeMultiline(config.title, DEFAULT_BLOCK_CONTENT.title),
    subtitle: normalizeMultiline(config.subtitle, DEFAULT_BLOCK_CONTENT.subtitle),
    primaryCtaLabel: normalizeText(
      config['primary-cta-label'],
      DEFAULT_BLOCK_CONTENT.primaryCtaLabel,
    ),
    secondaryCtaLabel: normalizeText(
      config['secondary-cta-label'],
      DEFAULT_BLOCK_CONTENT.secondaryCtaLabel,
    ),
    reviewCtaLabel: normalizeText(
      config['review-cta-label'],
      DEFAULT_BLOCK_CONTENT.reviewCtaLabel,
    ),
    prototypeNote: normalizeMultiline(
      config['prototype-note'],
      DEFAULT_BLOCK_CONTENT.prototypeNote,
    ),
  };
}

export function createDefaultDeviceDraft() {
  return {
    bronze: 0,
    gold: 0,
    silver: 0,
    bronzeC: false,
    goldV: false,
    goldNumerals: '',
    numerals: '',
    note: '',
  };
}

export function sanitizeDeviceDraft(draft = {}) {
  return {
    bronze: clampCount(draft.bronze, 5),
    gold: clampCount(draft.gold, 3),
    silver: clampCount(draft.silver, 3),
    bronzeC: Boolean(draft.bronzeC),
    goldV: Boolean(draft.goldV),
    goldNumerals: sanitizeText(draft.goldNumerals),
    numerals: sanitizeText(draft.numerals),
    note: sanitizeText(draft.note),
  };
}

export function getDeviceSummary(draft = {}) {
  const devices = sanitizeDeviceDraft(draft);
  const parts = [];

  if (devices.bronze) parts.push(`Bronze Star x${devices.bronze}`);
  if (devices.gold) parts.push(`Gold Star x${devices.gold}`);
  if (devices.silver) parts.push(`Silver Star x${devices.silver}`);
  if (devices.bronzeC) parts.push('Bronze C');
  if (devices.goldV) parts.push('Gold V');
  if (devices.goldNumerals) parts.push(`Gold Numerals: ${devices.goldNumerals}`);
  if (devices.numerals) parts.push(`Numerals: ${devices.numerals}`);

  return parts.join(' · ');
}

export function getBranchById(branchId = 'USMC') {
  return BRANCHES.find((branch) => branch.id === branchId) || BRANCHES[2];
}

export function getBranchLabel(branchId = 'USMC') {
  return getBranchById(branchId).label;
}

export function getRackTypeById(rackTypeId = 'standard_ribbons') {
  return RACK_TYPES.find((rackType) => rackType.id === rackTypeId) || RACK_TYPES[1];
}

export function getRackTypeLabel(rackTypeId = 'standard_ribbons') {
  return getRackTypeById(rackTypeId).label;
}

export function getAwardById(awardId = '') {
  return AWARDS.find((award) => award.id === awardId) || null;
}

export function createInitialState() {
  return {
    step: 0,
    branch: 'USMC',
    rackType: 'standard_ribbons',
    options: {
      spacing: 'flush',
      alignment: 'centered',
      assembly: 'assembled',
      width: 3,
    },
    rack: [],
    page: 0,
    perPage: 12,
    searchQuery: '',
    openAwardId: '',
    awardEditor: null,
    reviewName: '',
    prototypeNoteVisible: false,
    welcomeNoteVisible: false,
    summaryExpanded: false,
  };
}

export function sortRack(rack = []) {
  return [...rack].sort((left, right) => left.prec - right.prec);
}

export function upsertRackItem(rack = [], awardId = '', draft = {}) {
  const award = getAwardById(awardId);
  if (!award) return [...rack];

  const devices = sanitizeDeviceDraft(draft);
  const deviceSummary = getDeviceSummary(devices);
  const nextItem = {
    ...award,
    devices,
    deviceSummary,
  };

  const remaining = rack.filter((item) => item.id !== awardId);
  return sortRack([...remaining, nextItem]);
}

export function removeRackItem(rack = [], awardId = '') {
  return rack.filter((item) => item.id !== awardId);
}

export function applyDd214Profile(rack = []) {
  let nextRack = [...rack];

  DD214_PRELOAD.forEach((awardId) => {
    nextRack = upsertRackItem(nextRack, awardId);
  });

  return sortRack(nextRack);
}

export function getFilteredAwards(searchQuery = '') {
  const normalizedQuery = normalizeText(searchQuery).toLowerCase();
  if (!normalizedQuery) return [...AWARDS];

  return AWARDS.filter((award) => award.name.toLowerCase().includes(normalizedQuery));
}

export function getAwardsPage(state = {}) {
  const filtered = getFilteredAwards(state.searchQuery);
  const pageSize = Math.max(1, Number.parseInt(state.perPage, 10) || 12);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(0, Math.min(Number.parseInt(state.page, 10) || 0, pageCount - 1));
  const start = page * pageSize;
  const end = Math.min(start + pageSize, filtered.length);

  return {
    items: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
    pageCount,
    start,
    end,
  };
}

export function getRackRows(rack = [], width = 3) {
  const rows = [];

  for (let index = 0; index < rack.length; index += width) {
    rows.push(rack.slice(index, index + width));
  }

  return rows;
}

export function getRackTitle(state = {}) {
  return `${getBranchLabel(state.branch)} ${getRackTypeLabel(state.rackType)} Rack`;
}

export function isAwardInRack(rack = [], awardId = '') {
  return rack.some((item) => item.id === awardId);
}

export function getReviewSummary(state = {}) {
  return {
    branch: getBranchLabel(state.branch),
    type: getRackTypeLabel(state.rackType),
    spacing: state.options?.spacing === 'padded' ? 'Padded' : 'Flush',
    alignment: state.options?.alignment === 'right' ? 'Right' : 'Centered',
    assembly: state.options?.assembly === 'unassembled' ? 'Unassembled' : 'Assembled',
    width: String(state.options?.width || 3),
    rackTitle: getRackTitle(state),
    awardCount: state.rack?.length || 0,
  };
}
