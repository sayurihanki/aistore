# Build Architecture Diagram

This repository is an Adobe Edge Delivery Services storefront wired to Adobe Commerce. The main application is served as native ESM modules with dynamic block loading, not as a single webpack or Vite bundle. In practice, the "build" is a mix of mounted content, browser-time module orchestration, generated drop-in assets, and a few repo-side packaging and verification scripts.

## System Diagram

```mermaid
flowchart LR
  subgraph Authoring["Authoring and Content Layer"]
    A1["Mounted content source<br/>fstab.yaml -> content.da.live"]
    A2["Authoring models and schemas<br/>models/*.json -> component-*.json"]
    A3["Pages, fragments, and metadata<br/>head.html, fragments, page docs"]
  end

  subgraph Runtime["Runtime in Browser and Edge Delivery"]
    R1["Page request to AEM Edge Delivery"]
    R2["head.html bootstrap<br/>import map, styles, modulepreload, speculation rules"]
    R3["scripts/scripts.js<br/>eager, lazy, delayed orchestration"]
    R4["scripts/aem.js<br/>RUM, block decoration, section loading, dynamic imports"]
    R5["scripts/commerce.js<br/>config, GraphQL clients, page typing, Adobe Data Layer"]
    R6["scripts/initializers/*.js<br/>global drop-in bootstrap"]
    R7["blocks/*<br/>135 authored block modules"]
    R8["scripts/__dropins__/*<br/>generated storefront runtime packages"]
    R9["plugins/experimentation<br/>conditional audiences, campaigns, experiments"]
    R10["MCX shell and preview layer<br/>MCX theme, header, footer, preview helpers"]
    R11["Native ESM delivery<br/>no main bundler in app runtime"]
  end

  subgraph Services["Commerce and Platform Services"]
    C1["config.json<br/>store headers, endpoints, feature flags"]
    C2["Adobe Commerce Core GraphQL"]
    C3["Catalog Service GraphQL"]
    C4["Adobe Client Data Layer<br/>events SDK and collector"]
    C5["AEM Assets image optimization<br/>optional"]
  end

  subgraph LocalData["Local Authored Data"]
    D1["data/configurators/*.json"]
    D2["data/guided-selling/*.json"]
    D3["data/product-technical-details/*.json"]
    D4["data/quizzes/*.json"]
  end

  subgraph Tooling["Build, Export, and QA Tooling"]
    T1["npm start -> aem up"]
    T2["build.mjs<br/>Drop-in GraphQL overrides"]
    T3["postinstall.js<br/>copy packages into scripts/__dropins__"]
    T4["build:json:*<br/>merge authoring schemas"]
    T5["build:ui-ux-package<br/>portable package, manifests, tarball"]
    T6["tests/**/*.test.mjs<br/>Node unit tests"]
    T7["cypress<br/>optional integration and E2E suite"]
    T8["Verification tools<br/>catalog health and Uniform contract checks"]
  end

  A1 --> R1
  A2 --> A3
  A2 --> R7
  A3 --> R2

  T1 --> R1
  T2 --> T3
  T3 --> R8
  T4 --> A2
  T5 --> R4
  T5 --> R7
  T6 --> R7
  T7 --> R7
  T8 --> C2
  T8 --> C3

  R1 --> R2 --> R3
  R2 --> R11
  R3 --> R4
  R3 --> R5
  R3 --> R9
  R3 --> R10
  R4 --> R7
  R5 --> R6
  R6 --> R8
  R7 --> R8
  R7 --> D1
  R7 --> D2
  R7 --> D3
  R7 --> D4
  R7 --> C5
  C1 --> R5
  R5 --> C2
  R5 --> C3
  R5 --> C4
```

## Runtime Load Sequence

```mermaid
sequenceDiagram
  participant B as Browser
  participant E as Edge Delivery page
  participant H as head bootstrap
  participant S as scripts.js
  participant A as aem.js
  participant C as commerce.js
  participant I as initializers
  participant BL as blocks/*
  participant D as scripts/__dropins__
  participant G as Commerce GraphQL

  B->>E: Request page
  E-->>B: Mounted markup plus head includes
  B->>H: Load import map, CSS, modulepreload, speculation rules
  H->>S: Start page orchestration
  S->>C: initializeCommerce()
  C->>C: Fetch or session-cache config.json
  C->>G: Configure core and catalog GraphQL clients
  C->>I: Initialize auth, cart, account, PDP, checkout, personalization, etc.
  S->>A: Decorate main, sections, links, auto-blocks
  A->>BL: Dynamically import per-block JS and CSS
  BL->>D: Import storefront renderers and APIs
  BL->>G: Fetch live commerce data as needed
  S->>BL: Lazy load header and footer blocks
  S->>S: Optionally load experimentation plugin
  S->>S: Import delayed.js after LCP
```

## Repository Topology

- `blocks/`: the feature surface of the storefront. The generated inventory reports 135 blocks: 55 commerce, 59 content, 10 interactive-content, 6 forms, and 5 shell blocks.
- `scripts/`: the runtime spine. `scripts.js` orchestrates page load, `aem.js` handles block and section infrastructure, `commerce.js` manages store config and data access, and `initializers/` wires Adobe drop-ins.
- `scripts/__dropins__/`: generated runtime assets copied from `node_modules` during `postinstall`; this is the bridge between authored code and Adobe storefront packages.
- `models/` plus `component-definition.json`, `component-models.json`, and `component-filters.json`: the authoring contract for DA and block modeling.
- `data/` and `fragments/`: authored supporting data for configurators, guided selling, technical details, quizzes, and reusable shell content.
- `plugins/experimentation/`: optional experimentation runtime loaded only when experiment or audience metadata is present.
- `tools/` and `ui-ux-portability-package/`: repo-side tooling for verification, metadata generation, and exporting the UI layer as a portable package.
- `tests/` and `cypress/`: split between fast Node-based unit coverage and optional Cypress integration and end-to-end coverage.

## Key Takeaways

- The live storefront is assembled at runtime from mounted content, metadata, block modules, and Adobe drop-ins.
- There is no single compiled application bundle at the root of this repo; the architecture is block-based and import-map-driven.
- Commerce connectivity is centralized in `scripts/commerce.js`, while feature rendering is distributed across blocks and drop-in initializers.
- The portability package under `ui-ux-portability-package/` is a derived export of the design system and runtime layer, not the primary live application entrypoint.
