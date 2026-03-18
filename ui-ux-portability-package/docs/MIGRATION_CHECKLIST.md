# Migration Checklist

Use this checklist to track a zero-regression transfer.

## Scope Validation

- [ ] Confirm this package path is immutable in target repo.
- [ ] Confirm static paths for `/fonts` and `/icons`.
- [ ] Confirm runtime dependency install plan.

## Theme and Tokens

- [ ] Import `styles/import-order.css`.
- [ ] Verify typography renders (adobe-clean, roboto variants).
- [ ] Verify accent token and gradient text styles.
- [ ] Verify button hover/focus and reduced-motion behavior.

## Layout and Section System

- [ ] Validate section transitions and `.appear` behavior.
- [ ] Validate all `data-padding` and `data-margin` values.
- [ ] Validate glass surfaces in both light and dark sections.

## Components

- [ ] Migrate shell blocks first.
- [ ] Migrate content blocks.
- [ ] Migrate commerce core flows.
- [ ] Migrate commerce B2B flows.
- [ ] Validate each block against its local `README.md`.

## Runtime and Dependency Integration

- [ ] Confirm all `@dropins/*` imports resolve.
- [ ] Confirm `@adobe/*` event collector setup.
- [ ] Confirm analytics initialization and event bus behavior.
- [ ] Confirm no missing import-map assumptions in non-EDS runtimes.

## QA

- [ ] Desktop and mobile visual parity.
- [ ] Keyboard-only navigation for nav/search/cart/auth.
- [ ] Screen reader landmarks and heading order.
- [ ] High contrast and reduced-motion checks.
- [ ] Smoke test cart/checkout/login/order/search routes.
