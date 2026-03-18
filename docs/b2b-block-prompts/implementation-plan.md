# Procurement-First Lead Capture Prompt Pack (15 Block Ideas)

## Summary
Create **15 separate markdown files** at `/Users/hanki/Jenifer GitHub repository/jenhankib2bbodea/jenhankib2bbodea/docs/b2b-block-prompts`, each containing one high-conversion B2B block concept and a production-ready prompt pack.
The pack is optimized for:
- Audience: procurement teams
- Goal: lead capture
- Build approach: ship-fast reuse of existing repo block patterns

## Deliverables
1. Create folder: `/Users/hanki/Jenifer GitHub repository/jenhankib2bbodea/jenhankib2bbodea/docs/b2b-block-prompts`.
2. Create these 15 files (exact names):
1. `01-procurement-savings-calculator.md`
2. `02-instant-rfq-qualifier.md`
3. `03-compliance-trust-center.md`
4. `04-volume-pricing-preview.md`
5. `05-approval-readiness-checker.md`
6. `06-vendor-switch-risk-assessment.md`
7. `07-procurement-playbook-download.md`
8. `08-spec-match-advisor.md`
9. `09-implementation-timeline-estimator.md`
10. `10-budget-justification-builder.md`
11. `11-stakeholder-consensus-kit.md`
12. `12-quality-assurance-proof-wall.md`
13. `13-service-sla-configurator.md`
14. `14-priority-account-onboarding-cta.md`
15. `15-category-opportunity-finder.md`

## Per-File Content Spec (decision-complete template)
Each file must follow this exact section order:

1. `# <Idea Title>`
2. `## Why This Wins (Procurement Lens)`
3. `## Conversion Hypothesis`
4. `## Best Placement in Site Journey`
5. `## Block Composition (Reuse-First)`
6. `## Production Prompt Pack`
7. `## Lead Capture Mechanics`
8. `## Metrics + Experiment Plan`
9. `## Acceptance Criteria`
10. `## Risks and Mitigations`

Inside `## Production Prompt Pack`, include exactly three prompts:
1. `### Prompt A — Conversion Copywriter Prompt`
2. `### Prompt B — UX/Content Model Prompt (DA/EDS authoring ready)`
3. `### Prompt C — Implementation Prompt (this repo conventions)`

## Prompt Quality Requirements (applies to all 15 files)
1. Prompts must include explicit inputs, output format, tone constraints, and no-fluff constraints.
2. Copy prompts must demand procurement-proof language: budget control, risk reduction, approval confidence, supplier reliability.
3. UX prompts must output authorable content structures compatible with current block patterns (tabs, accordion, cards, table, form, modal, targeted-block, quote).
4. Implementation prompts must require:
- no regression to existing `blocks/*`
- analytics event naming for lead capture
- accessibility checks
- mobile-first behavior
- graceful fallback states

## Important Changes/Additions to Public Interfaces/Types
No runtime API change is required.
Add a **documentation interface contract** used consistently across all 15 files via YAML frontmatter:

```yaml
id: b2b-block-##
title: <string>
primary_kpi: lead_capture
target_persona: procurement_team
journey_stage: awareness|consideration|decision
reuse_blocks: [list]
new_logic_scope: none|minimal
primary_cta: rfq|download|assessment|consultation
```

This frontmatter becomes the stable interface for future automation/selection of block ideas.

## Test Cases and Validation Scenarios
1. **Structure check**: all 15 files contain all required sections and all 3 prompts.
2. **Positioning check**: each file references procurement pain points and lead capture CTA.
3. **Feasibility check**: each concept maps to existing block primitives available in this repo.
4. **Differentiation check**: no two files duplicate the same core hypothesis.
5. **Conversion check**: each file defines one primary KPI event and one A/B test variable.
6. **Editorial quality check**: prompts are implementation-grade, unambiguous, and output-constrained.

## Assumptions and Defaults
1. Language is US English.
2. Brand voice is premium, confident, and outcome-driven (not hype-heavy).
3. “At least 15” is satisfied by delivering exactly 15 high-quality files.
4. No code or block implementation is executed in this phase; this plan covers the full content artifact build spec.
5. Existing repo block patterns are preferred over introducing net-new complex components.
