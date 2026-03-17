/* eslint-disable import/no-unresolved */

import { events } from '@dropins/tools/event-bus.js';

import PurchaseOrderConfirmation from '@dropins/storefront-purchase-order/containers/PurchaseOrderConfirmation.js';
import { render as POProvider } from '@dropins/storefront-purchase-order/render.js';

import { createFragment, createScopedSelector } from '@dropins/storefront-checkout/lib/utils.js';

import {
  rootLink,
  CUSTOMER_PO_DETAILS_PATH,
  CUSTOMER_PO_LIST_PATH,
  SUPPORT_PATH,
} from '../../scripts/commerce.js';
import { loadCSS } from '../../scripts/aem.js';

import '../../scripts/initializers/purchase-order.js';

const selectors = Object.freeze({
  poConfirmation: {
    content: '.po-confirmation__content',
    metrics: '.po-confirmation__metrics',
    actions: '.po-confirmation__hero-actions',
    spotlight: '.po-confirmation__spotlight',
    timeline: '.po-confirmation__timeline',
    summary: '.po-confirmation__summary',
    nextSteps: '.po-confirmation__next-steps',
    footer: '.po-confirmation__footer',
  },
});

const STATUS_META = Object.freeze({
  PENDING: {
    tone: 'warning',
    eyebrow: 'Approval workflow active',
    title: 'Your request is moving through approval.',
    summary: 'The purchase order is submitted and waiting for reviewer action.',
    step: 1,
  },
  APPROVAL_REQUIRED: {
    tone: 'warning',
    eyebrow: 'Approval workflow active',
    title: 'Your request is moving through approval.',
    summary: 'The purchase order is submitted and waiting for reviewer action.',
    step: 1,
  },
  APPROVED: {
    tone: 'positive',
    eyebrow: 'Approval secured',
    title: 'Approval is complete and the order can advance.',
    summary: 'The request has been approved and is ready for the next fulfillment step.',
    step: 2,
  },
  APPROVED_PENDING_PAYMENT: {
    tone: 'warning',
    eyebrow: 'Approval complete',
    title: 'Approval is complete and payment is pending.',
    summary: 'The request is approved and waiting for payment clearance before order placement.',
    step: 2,
  },
  ORDER_IN_PROGRESS: {
    tone: 'positive',
    eyebrow: 'Order handoff started',
    title: 'The approved purchase order is being converted to an order.',
    summary: 'Your request is approved and actively processing.',
    step: 2,
  },
  ORDER_PLACED: {
    tone: 'positive',
    eyebrow: 'Order created',
    title: 'The purchase order completed approval and has been placed.',
    summary: 'Your request finished the approval lane and generated a sales order.',
    step: 3,
  },
  REJECTED: {
    tone: 'critical',
    eyebrow: 'Approval decision recorded',
    title: 'This purchase order was not approved.',
    summary: 'Review the PO details and history to understand the decision and next steps.',
    step: 1,
  },
  CANCELED: {
    tone: 'critical',
    eyebrow: 'Request closed',
    title: 'This purchase order has been canceled.',
    summary: 'The request is no longer active. Review the details page if you need follow-up.',
    step: 0,
  },
  ORDER_FAILED: {
    tone: 'critical',
    eyebrow: 'Order placement issue',
    title: 'Approval completed, but order placement failed.',
    summary: 'Review the purchase order details and history to determine the next action.',
    step: 2,
  },
  DEFAULT: {
    tone: 'neutral',
    eyebrow: 'Purchase order submitted',
    title: 'Your request is recorded.',
    summary: 'You can use the purchase order details page to monitor approval progress.',
    step: 0,
  },
});

const TIMELINE_STEPS = Object.freeze([
  'Submitted',
  'Approval',
  'Processing',
  'Sales Order',
]);

function createPOConfirmationFragment() {
  return createFragment(`
    <div class="po-confirmation">
      <section class="po-confirmation__hero po-confirmation__block">
        <div class="po-confirmation__hero-main">
          <div class="po-confirmation__content"></div>
          <div class="po-confirmation__metrics"></div>
        </div>
        <aside class="po-confirmation__hero-aside">
          <div class="po-confirmation__hero-actions"></div>
          <div class="po-confirmation__spotlight"></div>
        </aside>
      </section>
      <section class="po-confirmation__timeline po-confirmation__block"></section>
      <div class="po-confirmation__body">
        <section class="po-confirmation__summary po-confirmation__block"></section>
        <section class="po-confirmation__next-steps po-confirmation__block"></section>
      </div>
      <section class="po-confirmation__footer po-confirmation__block"></section>
    </div>
  `);
}

function normalizeStatus(status) {
  return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

function getStatusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || STATUS_META.DEFAULT;
}

function getQuote(poData = {}) {
  return poData?.quote || null;
}

function buildPODetailsUrl(poData = {}) {
  const poRef = poData?.uid;

  if (!poRef) {
    return rootLink(CUSTOMER_PO_LIST_PATH);
  }

  return rootLink(`${CUSTOMER_PO_DETAILS_PATH}?poRef=${encodeURIComponent(poRef)}`);
}

function formatMoney(money) {
  if (money?.value == null) {
    return 'Pending';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money?.currency || 'USD',
      maximumFractionDigits: 2,
    }).format(money.value);
  } catch (error) {
    return `${money?.currency || 'USD'} ${money.value}`;
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Pending';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Pending';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatShortDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function humanizeStatus(status) {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    return 'Submitted';
  }

  return normalized
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function flattenApprovalEvents(poData = {}) {
  if (!Array.isArray(poData?.approvalFlow)) {
    return [];
  }

  return poData.approvalFlow.flatMap((rule) => (
    Array.isArray(rule?.events)
      ? rule.events.map((event) => ({ ...event, ruleName: rule?.ruleName || '' }))
      : []
  ));
}

function formatPerson(person = {}) {
  const name = [person?.firstname, person?.lastname].filter(Boolean).join(' ').trim();

  if (name && person?.email) {
    return `${name} · ${person.email}`;
  }

  return name || person?.email || 'Pending';
}

function formatAddress(address = {}) {
  if (!address) {
    return 'Not provided';
  }

  const parts = [
    Array.isArray(address.street) ? address.street.join(', ') : '',
    [address.city, address.region].filter(Boolean).join(', '),
    address.postCode,
    address.country,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'Not provided';
}

function getApprovalStats(poData = {}) {
  const approvalEvents = flattenApprovalEvents(poData);
  const pending = approvalEvents.filter((event) => ['PENDING', 'APPROVAL_REQUIRED'].includes(normalizeStatus(event?.status)));
  const approved = approvalEvents.filter((event) => normalizeStatus(event?.status) === 'APPROVED');
  const rejected = approvalEvents.filter((event) => normalizeStatus(event?.status) === 'REJECTED');
  const nextApprover = pending[0];

  return {
    totalRules: Array.isArray(poData?.approvalFlow) ? poData.approvalFlow.length : 0,
    totalEvents: approvalEvents.length,
    pendingCount: pending.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    nextApprover,
  };
}

function getHeroMetrics(poData = {}, quote = null) {
  const submittedAt = poData?.createdAt || quote?.orderDate;
  const metrics = [];

  if (poData?.number) {
    metrics.push({
      label: 'Request number',
      value: `#${poData.number}`,
      tone: 'accent',
    });
  }

  if (submittedAt) {
    metrics.push({
      label: 'Submitted',
      value: formatDateTime(submittedAt),
    });
  }

  if (quote?.grandTotal?.value != null) {
    metrics.push({
      label: 'Estimated total',
      value: formatMoney(quote.grandTotal),
      tone: 'positive',
    });
  }

  if (Number.isFinite(quote?.totalQuantity)) {
    metrics.push({
      label: 'Items requested',
      value: `${quote.totalQuantity}`,
    });
  }

  return metrics;
}

function getTimelineModel(poData = {}, quote = null) {
  const status = normalizeStatus(poData?.status);
  const meta = getStatusMeta(status);
  const approvalStats = getApprovalStats(poData);
  const lastUpdated = poData?.updatedAt || quote?.orderStatusChangeDate;
  let approvalMeta = 'Waiting for reviewer activity';
  let processingMeta = 'Starts after approval';
  let orderedMeta = 'Issued once approved';

  if (approvalStats.pendingCount) {
    approvalMeta = `${approvalStats.pendingCount} approver${approvalStats.pendingCount === 1 ? '' : 's'} remaining`;
  } else if (approvalStats.approvedCount) {
    approvalMeta = `${approvalStats.approvedCount} approval${approvalStats.approvedCount === 1 ? '' : 's'} recorded`;
  }

  if (['APPROVED', 'APPROVED_PENDING_PAYMENT', 'ORDER_IN_PROGRESS', 'ORDER_PLACED', 'ORDER_FAILED'].includes(status)) {
    processingMeta = lastUpdated ? `Updated ${formatShortDate(lastUpdated)}` : 'Queued after approval';
  }

  if (poData?.order?.orderNumber) {
    orderedMeta = `#${poData.order.orderNumber}`;
  } else if (status === 'ORDER_PLACED') {
    orderedMeta = 'Order placed';
  }

  return {
    meta,
    activeStep: meta.step,
    progressWidth: `${(meta.step / (TIMELINE_STEPS.length - 1)) * 100}%`,
    steps: [
      {
        name: TIMELINE_STEPS[0],
        meta: formatShortDate(poData?.createdAt || quote?.orderDate) || 'Request received',
      },
      {
        name: TIMELINE_STEPS[1],
        meta: approvalMeta,
      },
      {
        name: TIMELINE_STEPS[2],
        meta: processingMeta,
      },
      {
        name: TIMELINE_STEPS[3],
        meta: orderedMeta,
      },
    ],
  };
}

function getNextStepItems(poData = {}, quote = null) {
  const status = normalizeStatus(poData?.status);
  const approvalStats = getApprovalStats(poData);
  const detailsUrl = buildPODetailsUrl(poData);
  const items = [];

  if (['PENDING', 'APPROVAL_REQUIRED'].includes(status)) {
    items.push('Approvers are reviewing this request in the configured PO workflow.');
    items.push(approvalStats.nextApprover?.name
      ? `Next reviewer in line: ${approvalStats.nextApprover.name}.`
      : 'Track reviewer activity and status changes from the purchase order details page.');
    items.push(`Use ${detailsUrl.includes('?poRef=') ? 'the details page' : 'your purchase orders list'} to monitor progress without resubmitting.`);
    return items;
  }

  if (['APPROVED', 'APPROVED_PENDING_PAYMENT', 'ORDER_IN_PROGRESS'].includes(status)) {
    items.push('Approval is complete and the request is advancing toward order placement.');
    items.push(poData?.order?.orderNumber
      ? `A sales order has already been generated as #${poData.order.orderNumber}.`
      : 'A sales order number will appear as soon as the handoff completes.');
    items.push('Keep the PO details page bookmarked for status, history, and approval evidence.');
    return items;
  }

  if (status === 'ORDER_PLACED') {
    items.push('This purchase order has already cleared approval and produced a sales order.');
    items.push(poData?.order?.orderNumber
      ? `Use order #${poData.order.orderNumber} for downstream fulfillment and service follow-up.`
      : 'Use the details page to verify fulfillment and downstream order information.');
    items.push('You can return to purchasing or view the full PO history at any time.');
    return items;
  }

  if (['REJECTED', 'CANCELED', 'ORDER_FAILED'].includes(status)) {
    items.push('Review the purchase order history and comments before taking the next action.');
    items.push('Coordinate with your approver, procurement lead, or finance contact if a resubmission is needed.');
    items.push('Keep this request number for reference when troubleshooting or revising the PO.');
    return items;
  }

  items.push('Your purchase order request is captured and ready for follow-up.');
  items.push(`Total requested value${quote?.grandTotal ? `: ${formatMoney(quote.grandTotal)}.` : ' is available on the details page.'}`);
  items.push('Use the purchase order details page to track approvals, comments, and any downstream order creation.');
  return items;
}

function createMetricCard(metric) {
  const card = document.createElement('div');
  const label = document.createElement('p');
  const value = document.createElement('p');

  card.className = `po-confirmation-metric${metric?.tone ? ` is-${metric.tone}` : ''}`;
  label.className = 'po-confirmation-metric__label';
  label.textContent = metric.label;
  value.className = 'po-confirmation-metric__value';
  value.textContent = metric.value;

  card.append(label, value);

  return card;
}

function createSummaryStat(stat) {
  const card = document.createElement('div');
  const label = document.createElement('p');
  const value = document.createElement('p');

  card.className = `po-confirmation-summary-stat${stat?.tone ? ` is-${stat.tone}` : ''}`;
  label.className = 'po-confirmation-summary-stat__label';
  label.textContent = stat.label;
  value.className = 'po-confirmation-summary-stat__value';
  value.textContent = stat.value;

  card.append(label, value);

  return card;
}

function createDetailRow(labelText, valueText) {
  const row = document.createElement('div');
  const label = document.createElement('dt');
  const value = document.createElement('dd');

  row.className = 'po-confirmation-details__row';
  label.className = 'po-confirmation-details__label';
  label.textContent = labelText;
  value.className = 'po-confirmation-details__value';
  value.textContent = valueText;

  row.append(label, value);

  return row;
}

function appendAction(parent, options) {
  const element = document.createElement(options.href ? 'a' : 'button');
  const classes = ['po-confirmation-action', 'button'];

  if (options.variant) {
    classes.push(options.variant);
  }

  if (options.variant !== 'po-confirmation-action--primary') {
    classes.push('secondary');
  }

  element.className = classes.join(' ');
  element.textContent = options.label;

  if (options.href) {
    element.href = options.href;
  } else {
    element.type = 'button';
  }

  if (options.dataTestId) {
    element.dataset.testid = options.dataTestId;
  }

  if (typeof options.onClick === 'function') {
    element.addEventListener('click', options.onClick);
  }

  parent.append(element);
}

async function renderPOConfirmationContainer(container, poData = {}) {
  return POProvider.render(PurchaseOrderConfirmation, {
    purchaseOrderNumber: poData?.number,
    routePurchaseOrderDetails: () => buildPODetailsUrl(poData),
  })(container);
}

function renderHeroMetrics(container, poData = {}, quote = null) {
  getHeroMetrics(poData, quote).forEach((metric) => {
    container.append(createMetricCard(metric));
  });
}

function renderHeroActions(container, poData = {}) {
  if (poData?.uid) {
    appendAction(container, {
      href: buildPODetailsUrl(poData),
      label: 'View PO Details',
      variant: 'po-confirmation-action--primary',
    });
  }

  appendAction(container, {
    label: 'Print Summary',
    onClick: () => window.print(),
  });

  appendAction(container, {
    href: rootLink('/'),
    label: 'Continue Shopping',
  });
}

function renderSpotlight(container, poData = {}, quote = null) {
  const status = normalizeStatus(poData?.status);
  const meta = getStatusMeta(status);
  const approvalStats = getApprovalStats(poData);
  const submittedAt = poData?.createdAt || quote?.orderDate;
  const spotlight = createFragment(`
    <div class="po-confirmation-spotlight" data-tone="${meta.tone}">
      <p class="po-confirmation-spotlight__eyebrow"></p>
      <h3 class="po-confirmation-spotlight__title"></h3>
      <p class="po-confirmation-spotlight__body"></p>
      <dl class="po-confirmation-spotlight__stats"></dl>
    </div>
  `);
  const heading = spotlight.querySelector('.po-confirmation-spotlight__eyebrow');
  const title = spotlight.querySelector('.po-confirmation-spotlight__title');
  const body = spotlight.querySelector('.po-confirmation-spotlight__body');
  const stats = spotlight.querySelector('.po-confirmation-spotlight__stats');

  heading.textContent = meta.eyebrow;
  title.textContent = humanizeStatus(status);
  body.textContent = meta.title;

  [
    {
      label: 'Requested by',
      value: formatPerson(poData?.createdBy),
    },
    {
      label: 'Submitted',
      value: formatDateTime(submittedAt),
    },
    {
      label: approvalStats.pendingCount ? 'Next approver' : 'Approvals',
      value: approvalStats.pendingCount
        ? (approvalStats.nextApprover?.name || approvalStats.nextApprover?.role || 'Awaiting assignment')
        : `${approvalStats.approvedCount || 0} recorded`,
    },
  ].forEach((item) => {
    const row = document.createElement('div');
    const label = document.createElement('dt');
    const value = document.createElement('dd');

    row.className = 'po-confirmation-spotlight__stat';
    label.textContent = item.label;
    value.textContent = item.value;
    row.append(label, value);
    stats.append(row);
  });

  container.append(spotlight);
}

function renderTimeline(container, poData = {}, quote = null) {
  const model = getTimelineModel(poData, quote);
  const section = createFragment(`
    <div class="po-confirmation-section">
      <div class="po-confirmation-section__header">
        <div>
          <p class="po-confirmation-section__eyebrow">Approval Lane</p>
          <h2 class="po-confirmation-section__title">Track the request from submission to order placement.</h2>
        </div>
        <p class="po-confirmation-status-badge" data-tone="${model.meta.tone}">${humanizeStatus(poData?.status)}</p>
      </div>
      <p class="po-confirmation-section__copy">${model.meta.summary}</p>
      <div class="po-confirmation-timeline">
        <div class="po-confirmation-timeline__track">
          <div class="po-confirmation-timeline__progress"></div>
        </div>
        <div class="po-confirmation-timeline__steps"></div>
      </div>
    </div>
  `);
  const progress = section.querySelector('.po-confirmation-timeline__progress');
  const steps = section.querySelector('.po-confirmation-timeline__steps');

  progress.style.width = model.progressWidth;

  model.steps.forEach((step, index) => {
    const stepElement = document.createElement('div');
    const dot = document.createElement('div');
    const name = document.createElement('p');
    const meta = document.createElement('p');

    stepElement.className = 'po-confirmation-timeline-step';

    if (index < model.activeStep) {
      stepElement.classList.add('is-done');
    } else if (index === model.activeStep) {
      stepElement.classList.add('is-active');
    }

    dot.className = 'po-confirmation-timeline-step__dot';
    dot.textContent = index + 1;
    name.className = 'po-confirmation-timeline-step__name';
    name.textContent = step.name;
    meta.className = 'po-confirmation-timeline-step__meta';
    meta.textContent = step.meta;

    stepElement.append(dot, name, meta);
    steps.append(stepElement);
  });

  container.append(section);
}

function renderSummary(container, poData = {}, quote = null) {
  const approvalStats = getApprovalStats(poData);
  const summary = createFragment(`
    <div class="po-confirmation-section">
      <div class="po-confirmation-section__header">
        <div>
          <p class="po-confirmation-section__eyebrow">Purchase Order Snapshot</p>
          <h2 class="po-confirmation-section__title">The operational details your team will need next.</h2>
        </div>
      </div>
      <div class="po-confirmation-summary-grid"></div>
      <dl class="po-confirmation-details"></dl>
    </div>
  `);
  const grid = summary.querySelector('.po-confirmation-summary-grid');
  const details = summary.querySelector('.po-confirmation-details');
  const payment = Array.isArray(quote?.payments) && quote.payments.length
    ? quote.payments[0]?.name || quote.payments[0]?.code
    : 'Pending';
  const shipping = quote?.isVirtual ? 'Virtual request' : (quote?.shippingMethod || 'To be determined');

  [
    {
      label: 'Current status',
      value: humanizeStatus(poData?.status),
      tone: getStatusMeta(poData?.status).tone,
    },
    {
      label: 'Requested total',
      value: formatMoney(quote?.grandTotal),
      tone: 'accent',
    },
    {
      label: 'Approval rules',
      value: `${approvalStats.totalRules || 0}`,
    },
    {
      label: approvalStats.pendingCount ? 'Approvers left' : 'Approvals logged',
      value: `${approvalStats.pendingCount || approvalStats.approvedCount || approvalStats.totalEvents || 0}`,
    },
  ].forEach((item) => {
    grid.append(createSummaryStat(item));
  });

  [
    ['Requested by', formatPerson(poData?.createdBy)],
    ['Billing email', quote?.email || 'Pending'],
    ['Payment method', payment || 'Pending'],
    ['Shipping method', shipping],
    ['Ship to', formatAddress(quote?.shippingAddress)],
    ['Last updated', formatDateTime(poData?.updatedAt || quote?.orderStatusChangeDate)],
  ].forEach(([label, value]) => {
    details.append(createDetailRow(label, value));
  });

  container.append(summary);
}

function renderNextSteps(container, poData = {}, quote = null) {
  const section = createFragment(`
    <div class="po-confirmation-section">
      <div class="po-confirmation-section__header">
        <div>
          <p class="po-confirmation-section__eyebrow">Next Steps</p>
          <h2 class="po-confirmation-section__title">Keep the request moving without losing context.</h2>
        </div>
      </div>
      <ol class="po-confirmation-step-list"></ol>
      <div class="po-confirmation-link-list"></div>
    </div>
  `);
  const list = section.querySelector('.po-confirmation-step-list');
  const links = section.querySelector('.po-confirmation-link-list');

  getNextStepItems(poData, quote).forEach((item) => {
    const entry = document.createElement('li');
    entry.textContent = item;
    list.append(entry);
  });

  [
    {
      label: 'Open PO Details',
      href: buildPODetailsUrl(poData),
    },
    {
      label: 'All Purchase Orders',
      href: rootLink(CUSTOMER_PO_LIST_PATH),
    },
    {
      label: 'Contact Support',
      href: rootLink(SUPPORT_PATH),
    },
  ].forEach((link) => {
    const anchor = document.createElement('a');
    anchor.className = 'po-confirmation-link-list__item';
    anchor.href = link.href;
    anchor.textContent = link.label;
    links.append(anchor);
  });

  container.append(section);
}

function renderFooter(container, poData = {}) {
  const footer = createFragment(`
    <div class="po-confirmation-footer">
      <div class="po-confirmation-footer__copy">
        <p class="po-confirmation-footer__eyebrow">Mission Support</p>
        <h2 class="po-confirmation-footer__title">Need procurement help after submission?</h2>
        <p class="po-confirmation-footer__body">Keep the request number handy and use the details page for approval updates, history, and downstream order visibility.</p>
      </div>
      <div class="po-confirmation-footer__actions"></div>
    </div>
  `);
  const actions = footer.querySelector('.po-confirmation-footer__actions');

  appendAction(actions, {
    href: rootLink('/'),
    label: 'Continue Shopping',
    variant: 'po-confirmation-action--primary',
    dataTestId: 'po-confirmation-footer__continue-button',
  });

  appendAction(actions, {
    href: buildPODetailsUrl(poData),
    label: 'Review Request',
  });

  container.append(footer);
}

async function renderPOConfirmationContent(container, poData = {}) {
  window.scrollTo(0, 0);

  const poConfirmationFragment = createPOConfirmationFragment();
  const getPOElement = createScopedSelector(poConfirmationFragment);
  const resolvedPOData = poData?.uid ? poData : (events.lastPayload('purchase-order/data') || poData || {});
  const quote = getQuote(resolvedPOData);

  const $poConfirmationContent = getPOElement(selectors.poConfirmation.content);
  const $poConfirmationMetrics = getPOElement(selectors.poConfirmation.metrics);
  const $poConfirmationActions = getPOElement(selectors.poConfirmation.actions);
  const $poConfirmationSpotlight = getPOElement(selectors.poConfirmation.spotlight);
  const $poConfirmationTimeline = getPOElement(selectors.poConfirmation.timeline);
  const $poConfirmationSummary = getPOElement(selectors.poConfirmation.summary);
  const $poConfirmationNextSteps = getPOElement(selectors.poConfirmation.nextSteps);
  const $poConfirmationFooter = getPOElement(selectors.poConfirmation.footer);

  container.replaceChildren(poConfirmationFragment);

  await renderPOConfirmationContainer($poConfirmationContent, resolvedPOData);
  renderHeroMetrics($poConfirmationMetrics, resolvedPOData, quote);
  renderHeroActions($poConfirmationActions, resolvedPOData);
  renderSpotlight($poConfirmationSpotlight, resolvedPOData, quote);
  renderTimeline($poConfirmationTimeline, resolvedPOData, quote);
  renderSummary($poConfirmationSummary, resolvedPOData, quote);
  renderNextSteps($poConfirmationNextSteps, resolvedPOData, quote);
  renderFooter($poConfirmationFooter, resolvedPOData);
}

export async function renderPOSuccess(container, poData) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/commerce-b2b-po-checkout-success/commerce-b2b-po-checkout-success.css`);
  return renderPOConfirmationContent(container, poData);
}

export default async function decorate(block) {
  await renderPOConfirmationContent(block);
}
