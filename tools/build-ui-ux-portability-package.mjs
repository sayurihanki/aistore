#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const outputDir = join(repoRoot, 'ui-ux-portability-package');
const archivePath = join(repoRoot, 'ui-ux-portability-package.tar.gz');
const checksumPath = join(repoRoot, 'ui-ux-portability-package.sha256');

const sourcePackageJson = JSON.parse(
  readFileSync(join(repoRoot, 'package.json'), 'utf-8'),
);

const dependencyVersionMap = {
  ...(sourcePackageJson.dependencies || {}),
  ...(sourcePackageJson.devDependencies || {}),
};

const coreCopyEntries = [
  'head.html',
  'styles',
  'fonts',
  'icons',
  'blocks',
  'models',
  'component-definition.json',
  'component-models.json',
  'component-filters.json',
];

const runtimeScriptFiles = [
  'aem.js',
  'scripts.js',
  'experiment-loader.js',
  'commerce.js',
  'delayed.js',
  'ue.js',
  'ue-utils.js',
  'commerce-events-sdk.js',
  'commerce-events-collector.js',
];

const runtimeScriptDirs = [
  'initializers',
  'components',
  'acdl',
];

function normalizePath(filePath) {
  return filePath.split('\\').join('/');
}

function relFromRepo(absPath) {
  return normalizePath(relative(repoRoot, absPath));
}

function ensureDir(absPath) {
  mkdirSync(absPath, { recursive: true });
}

function resetOutput() {
  if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true });
  if (existsSync(archivePath)) rmSync(archivePath, { force: true });
  if (existsSync(checksumPath)) rmSync(checksumPath, { force: true });
  ensureDir(outputDir);
}

function copyCoreFiles() {
  coreCopyEntries.forEach((entry) => {
    cpSync(join(repoRoot, entry), join(outputDir, entry), { recursive: true });
  });
}

function copyRuntimeScripts() {
  const scriptsSourceDir = join(repoRoot, 'scripts');
  const scriptsTargetDir = join(outputDir, 'scripts');
  ensureDir(scriptsTargetDir);

  runtimeScriptFiles.forEach((fileName) => {
    cpSync(join(scriptsSourceDir, fileName), join(scriptsTargetDir, fileName));
  });

  runtimeScriptDirs.forEach((dirName) => {
    cpSync(join(scriptsSourceDir, dirName), join(scriptsTargetDir, dirName), { recursive: true });
  });
}

function copyExperimentationPluginSource() {
  const experimentationSourceDir = join(repoRoot, 'plugins', 'experimentation', 'src');
  const experimentationTargetDir = join(outputDir, 'plugins', 'experimentation', 'src');

  ensureDir(dirname(experimentationTargetDir));
  cpSync(experimentationSourceDir, experimentationTargetDir, { recursive: true });
}

function walkFiles(absDir, matcher) {
  const files = [];

  function walk(currentDir) {
    readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        return;
      }
      if (!matcher || matcher(fullPath)) files.push(fullPath);
    });
  }

  if (!existsSync(absDir)) return files;
  walk(absDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function safeRead(absPath) {
  return existsSync(absPath) ? readFileSync(absPath, 'utf-8') : '';
}

function extractReadmeMetadata(readmeContent) {
  if (!readmeContent) return { title: '', overview: '' };
  const lines = readmeContent.split('\n').map((line) => line.trim());

  const titleLine = lines.find((line) => line.startsWith('# ')) || '';
  const title = titleLine.replace(/^#\s+/, '').trim();

  const overviewIdx = lines.findIndex((line) => /^##\s+overview/i.test(line));
  let overview = '';

  if (overviewIdx >= 0) {
    for (let i = overviewIdx + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || line.startsWith('#') || line.startsWith('|') || line.startsWith('---')) continue;
      overview = line;
      break;
    }
  }

  if (!overview) {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line || line.startsWith('#') || line.startsWith('|') || line.startsWith('---')) continue;
      overview = line;
      break;
    }
  }

  return { title, overview };
}

function classifyBlock(blockName) {
  if (blockName.startsWith('commerce-b2b-')) return { category: 'commerce', subcategory: 'b2b' };
  if (blockName.startsWith('commerce-')) return { category: 'commerce', subcategory: 'core' };
  if (['header', 'footer', 'top-banner', 'search', 'search-bar'].includes(blockName)) {
    return { category: 'shell', subcategory: 'navigation-and-layout' };
  }
  if (blockName.startsWith('form')) return { category: 'forms', subcategory: 'authorable-forms' };
  if (['accordion', 'tabs', 'modal', 'carousel', 'circle-carousel', 'video', 'embed', 'table', 'quiz-router', 'quiz-router-mccs'].includes(blockName)) {
    return { category: 'interactive-content', subcategory: 'engagement' };
  }
  return { category: 'content', subcategory: 'general' };
}

function buildBlockInventory() {
  const blocksDir = join(repoRoot, 'blocks');
  const blockDirs = readdirSync(blocksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const blocks = blockDirs.map((blockName) => {
    const absBlockDir = join(blocksDir, blockName);
    const blockFiles = walkFiles(absBlockDir);
    const css = [];
    const js = [];
    const json = [];
    let readme = '';

    blockFiles.forEach((absFile) => {
      const rel = relFromRepo(absFile);
      const extension = extname(absFile).toLowerCase();
      if (extension === '.css') css.push(rel);
      if (extension === '.js') js.push(rel);
      if (extension === '.json') json.push(rel);
      if (absFile.endsWith('README.md')) readme = rel;
    });

    const readmeContent = readme ? safeRead(join(repoRoot, readme)) : '';
    const readmeMeta = extractReadmeMetadata(readmeContent);
    const classMeta = classifyBlock(blockName);

    return {
      name: blockName,
      ...classMeta,
      title: readmeMeta.title || blockName,
      overview: readmeMeta.overview,
      sourcePath: `blocks/${blockName}`,
      files: {
        css,
        js,
        json,
        readme,
      },
      hasStyles: css.length > 0,
      hasRuntime: js.length > 0,
      fileCount: blockFiles.length,
    };
  });

  const byCategory = {};
  blocks.forEach((block) => {
    byCategory[block.category] = (byCategory[block.category] || 0) + 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalBlocks: blocks.length,
      withStyles: blocks.filter((block) => block.hasStyles).length,
      withRuntime: blocks.filter((block) => block.hasRuntime).length,
      byCategory,
    },
    blocks,
  };
}

function buildDesignTokenManifest() {
  const cssRoots = [
    join(repoRoot, 'styles'),
    join(repoRoot, 'blocks'),
    join(repoRoot, 'scripts/components'),
  ];

  const cssFiles = cssRoots.flatMap((root) => walkFiles(root, (file) => file.endsWith('.css')));
  const defined = new Map();
  const used = new Map();

  cssFiles.forEach((absFile) => {
    const rel = relFromRepo(absFile);
    const content = safeRead(absFile);
    const defRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
    const useRegex = /var\(\s*(--[a-z0-9-]+)\b/gi;

    let match = defRegex.exec(content);
    while (match) {
      const token = match[1];
      const value = match[2].trim();
      if (!defined.has(token)) {
        defined.set(token, {
          value,
          files: new Set([rel]),
        });
      } else {
        defined.get(token).files.add(rel);
      }
      match = defRegex.exec(content);
    }

    match = useRegex.exec(content);
    while (match) {
      const token = match[1];
      if (!used.has(token)) {
        used.set(token, {
          count: 1,
          files: new Set([rel]),
        });
      } else {
        const current = used.get(token);
        current.count += 1;
        current.files.add(rel);
      }
      match = useRegex.exec(content);
    }
  });

  const allTokens = [...new Set([...defined.keys(), ...used.keys()])].sort((a, b) => a.localeCompare(b));

  const tokens = allTokens.map((token) => {
    const def = defined.get(token);
    const use = used.get(token);
    const prefix = token.replace(/^--/, '').split('-')[0] || 'misc';
    return {
      name: token,
      prefix,
      value: def ? def.value : null,
      definedIn: def ? [...def.files].sort((a, b) => a.localeCompare(b)) : [],
      usageCount: use ? use.count : 0,
      usedIn: use ? [...use.files].sort((a, b) => a.localeCompare(b)) : [],
      status: def ? 'defined' : 'referenced-without-definition',
    };
  });

  const byPrefix = {};
  tokens.forEach((token) => {
    byPrefix[token.prefix] = (byPrefix[token.prefix] || 0) + 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalTokens: tokens.length,
      definedTokens: tokens.filter((token) => token.status === 'defined').length,
      unresolvedTokens: tokens.filter((token) => token.status !== 'defined').length,
      byPrefix,
    },
    tokens,
  };
}

function parsePackageSpecifier(specifier) {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split('/')[0];
}

function isExternalUrlSpecifier(specifier) {
  return /^(https?:|data:|blob:|file:)/i.test(specifier);
}

function buildDependencyManifest() {
  const jsRoots = [
    join(repoRoot, 'scripts'),
    join(repoRoot, 'blocks'),
  ];

  const jsFiles = jsRoots.flatMap((root) => walkFiles(root, (file) => file.endsWith('.js')));
  const imports = new Map();

  jsFiles.forEach((absFile) => {
    if (absFile.includes(`${join('scripts', '__dropins__')}`)) return;

    const rel = relFromRepo(absFile);
    const content = safeRead(absFile);
    const importRegex = /\b(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match = importRegex.exec(content);
    while (match) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        match = importRegex.exec(content);
        continue;
      }
      if (isExternalUrlSpecifier(specifier)) {
        match = importRegex.exec(content);
        continue;
      }
      const packageName = parsePackageSpecifier(specifier);
      if (!imports.has(packageName)) {
        imports.set(packageName, {
          package: packageName,
          version: dependencyVersionMap[packageName] || null,
          importSpecifiers: new Set([specifier]),
          importedBy: new Set([rel]),
          importCount: 1,
          source: Object.hasOwn(dependencyVersionMap, packageName) ? 'declared' : 'undeclared',
        });
      } else {
        const entry = imports.get(packageName);
        entry.importSpecifiers.add(specifier);
        entry.importedBy.add(rel);
        entry.importCount += 1;
      }
      match = importRegex.exec(content);
    }

    match = dynamicImportRegex.exec(content);
    while (match) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        match = dynamicImportRegex.exec(content);
        continue;
      }
      if (isExternalUrlSpecifier(specifier)) {
        match = dynamicImportRegex.exec(content);
        continue;
      }
      const packageName = parsePackageSpecifier(specifier);
      if (!imports.has(packageName)) {
        imports.set(packageName, {
          package: packageName,
          version: dependencyVersionMap[packageName] || null,
          importSpecifiers: new Set([specifier]),
          importedBy: new Set([rel]),
          importCount: 1,
          source: Object.hasOwn(dependencyVersionMap, packageName) ? 'declared' : 'undeclared',
        });
      } else {
        const entry = imports.get(packageName);
        entry.importSpecifiers.add(specifier);
        entry.importedBy.add(rel);
        entry.importCount += 1;
      }
      match = dynamicImportRegex.exec(content);
    }
  });

  const packages = [...imports.values()]
    .map((entry) => ({
      package: entry.package,
      version: entry.version,
      source: entry.source,
      importCount: entry.importCount,
      importSpecifiers: [...entry.importSpecifiers].sort((a, b) => a.localeCompare(b)),
      importedBy: [...entry.importedBy].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.package.localeCompare(b.package));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPackages: packages.length,
      undeclaredPackages: packages.filter((pkg) => pkg.source === 'undeclared').map((pkg) => pkg.package),
    },
    packages,
  };
}

function buildSectionConventionManifest() {
  const stylesContent = safeRead(join(repoRoot, 'styles', 'styles.css'));
  const headerContent = safeRead(join(repoRoot, 'blocks', 'header', 'header.css'));

  const sectionVariantRegex = /main\s+\.section\.([a-z0-9-]+)/gi;
  const paddingRegex = /main\s+\.section\[data-padding="([a-z0-9-]+)"\]/gi;
  const marginRegex = /main\s+\.section\[data-margin="([a-z0-9-]+)"\]/gi;
  const breakpointRegex = /@media\s*\(min-width:\s*([0-9]+)px\)/gi;
  const navTokenRegex = /(--nav-[a-z0-9-]+)\s*:/gi;

  const collectUnique = (regex, content) => {
    const values = new Set();
    let match = regex.exec(content);
    while (match) {
      values.add(match[1]);
      match = regex.exec(content);
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  };

  return {
    generatedAt: new Date().toISOString(),
    sectionStyleVariants: collectUnique(sectionVariantRegex, stylesContent),
    sectionDataPaddingValues: collectUnique(paddingRegex, stylesContent),
    sectionDataMarginValues: collectUnique(marginRegex, stylesContent),
    globalBreakpointsPx: collectUnique(breakpointRegex, `${stylesContent}\n${headerContent}`),
    headerNavigationTokens: collectUnique(navTokenRegex, headerContent),
    hasReducedMotionSupport:
      stylesContent.includes('prefers-reduced-motion') || safeRead(join(repoRoot, 'styles', 'lazy-styles.css')).includes('prefers-reduced-motion'),
  };
}

function buildAssetManifest() {
  const fontFiles = walkFiles(join(repoRoot, 'fonts'));
  const iconFiles = walkFiles(join(repoRoot, 'icons'));

  return {
    generatedAt: new Date().toISOString(),
    fonts: {
      count: fontFiles.length,
      files: fontFiles.map((file) => relFromRepo(file)),
    },
    icons: {
      count: iconFiles.length,
      files: iconFiles.map((file) => relFromRepo(file)),
    },
  };
}

function writeJson(absPath, data) {
  ensureDir(dirname(absPath));
  writeFileSync(absPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function writePackageFiles(manifests) {
  const portabilityPackageJson = {
    name: '@jenhanki/ui-ux-portability-package',
    version: '1.0.0',
    description: 'Portable UI/UX package extracted from jenhankib2bbodea',
    type: 'module',
    sideEffects: ['**/*.css'],
    files: [
      'head.html',
      'styles',
      'fonts',
      'icons',
      'blocks',
      'scripts',
      'models',
      'component-definition.json',
      'component-models.json',
      'component-filters.json',
      'manifests',
      'docs',
      'tools',
      'index.js',
    ],
    exports: {
      '.': './index.js',
      './styles': './styles/import-order.css',
      './manifest/tokens': './manifests/design-tokens.json',
      './manifest/blocks': './manifests/block-inventory.json',
      './manifest/dependencies': './manifests/dropin-dependencies.json',
      './manifest/sections': './manifests/section-conventions.json',
      './manifest/assets': './manifests/assets.json',
    },
  };

  writeJson(join(outputDir, 'package.json'), portabilityPackageJson);

  const indexJsContent = [
    "export const styleEntry = 'styles/import-order.css';",
    "export const blockInventoryPath = 'manifests/block-inventory.json';",
    "export const tokenManifestPath = 'manifests/design-tokens.json';",
    "export const dependencyManifestPath = 'manifests/dropin-dependencies.json';",
    "export const sectionConventionManifestPath = 'manifests/section-conventions.json';",
    "export const assetManifestPath = 'manifests/assets.json';",
    '',
  ].join('\n');
  writeFileSync(join(outputDir, 'index.js'), indexJsContent, 'utf-8');

  const cssImportOrder = [
    "@import './fonts.css';",
    "@import './styles.css';",
    "@import './lazy-styles.css';",
    '',
  ].join('\n');
  writeFileSync(join(outputDir, 'styles', 'import-order.css'), cssImportOrder, 'utf-8');

  writeJson(join(outputDir, 'manifests', 'block-inventory.json'), manifests.blockInventory);
  writeJson(join(outputDir, 'manifests', 'design-tokens.json'), manifests.designTokens);
  writeJson(join(outputDir, 'manifests', 'dropin-dependencies.json'), manifests.dependencies);
  writeJson(join(outputDir, 'manifests', 'section-conventions.json'), manifests.sectionConventions);
  writeJson(join(outputDir, 'manifests', 'assets.json'), manifests.assets);
}

function writeDocs(manifests) {
  const { blockInventory, designTokens, dependencies, sectionConventions, assets } = manifests;
  const dependencyList = dependencies.packages
    .map((pkg) => `- \`${pkg.package}\` ${pkg.version ? `(source version: ${pkg.version})` : '(version not declared in source package.json)'}`)
    .join('\n');
  const blocksByCategory = blockInventory.blocks.reduce((acc, block) => {
    const key = `${block.category}/${block.subcategory}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(block.name);
    return acc;
  }, {});
  const blockCategoryLines = Object.entries(blocksByCategory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, names]) => `- \`${category}\`: ${names.length} blocks -> ${names.map((name) => `\`${name}\``).join(', ')}`)
    .join('\n');
  const fullBlockTable = blockInventory.blocks
    .map((block) => `| \`${block.name}\` | \`${block.category}\` | \`${block.subcategory}\` | ${block.files.css.length} | ${block.files.js.length} |`)
    .join('\n');

  const readme = `# UI/UX Portability Package

This package is a portable extraction of the site UI/UX layer from \`jenhankib2bbodea\`.

## What This Contains

- Global design system CSS: tokens, typography, layout, section variants, motion, and accessibility fallbacks.
- All authored block implementations (\`${blockInventory.summary.totalBlocks}\` blocks) including styles, runtime JS, and per-block README docs.
- UI runtime scripts (AEM + commerce + initializers + analytics glue) excluding generated \`scripts/__dropins__\`.
- Font and icon assets (\`${assets.fonts.count}\` font files, \`${assets.icons.count}\` icon files).
- Machine-readable manifests for tokens, component catalog, dependencies, and section conventions.

## Quick Import in Another Repo

1. Copy this folder into your target repo (for example under \`vendor/ui-ux-portability-package\`).
   or run:

\`\`\`bash
node ui-ux-portability-package/tools/install-into-repo.mjs /absolute/path/to/target-repo --dest vendor/ui-ux-portability-package --force
\`\`\`

2. Import global styles in your app entry:

\`\`\`css
@import './vendor/ui-ux-portability-package/styles/import-order.css';
\`\`\`

3. Copy static assets to your app public path:
- \`fonts/*\` -> \`/fonts/*\`
- \`icons/*\` -> \`/icons/*\`

4. Port blocks incrementally by copying from \`blocks/<block-name>\`.
5. Install required runtime dependencies from \`manifests/dropin-dependencies.json\`.

## Included Manifests

- \`manifests/block-inventory.json\`
- \`manifests/design-tokens.json\`
- \`manifests/dropin-dependencies.json\`
- \`manifests/section-conventions.json\`
- \`manifests/assets.json\`

## Notes

- Generated \`scripts/__dropins__\` files are intentionally excluded for portability.
- Rebuild/generated artifacts are expected in the target environment during install.
- See \`docs/IMPORT_GUIDE.md\` and \`docs/MIGRATION_CHECKLIST.md\` for detailed setup.
`;

  const importGuide = `# Import Guide

This guide explains how to apply the package in another repository with minimal drift.

## 1) Install Package Into Target Repo

Option A: copy the folder directly.

Option B: install tarball directly:

\`\`\`bash
npm install /absolute/path/to/ui-ux-portability-package.tar.gz
\`\`\`

Option C: use the installer helper included in this package:

\`\`\`bash
node node_modules/@jenhanki/ui-ux-portability-package/tools/install-into-repo.mjs /absolute/path/to/target-repo --dest vendor/ui-ux-portability-package --force
\`\`\`

## 2) Wire Global Styles

In your target app entry CSS:

\`\`\`css
@import '@jenhanki/ui-ux-portability-package/styles';
\`\`\`

If your bundler cannot import CSS from package exports, import the file path directly:

\`\`\`css
@import '../node_modules/@jenhanki/ui-ux-portability-package/styles/import-order.css';
\`\`\`

## 3) Serve Static Assets

Ensure these directories are publicly served:

- \`fonts/\`
- \`icons/\`

If your framework rewrites static paths, update font/icon URLs in:
- \`styles/fonts.css\`
- block CSS files that reference \`../../icons/*\`

## 4) Install Runtime Dependencies

Install packages used by UI runtime and commerce blocks:

${dependencyList}

## 5) Migrate Blocks Incrementally

Use \`manifests/block-inventory.json\` to choose a migration order.

Suggested order:

1. Shell blocks (\`header\`, \`footer\`, \`top-banner\`, \`search\`, \`search-bar\`)
2. Global content blocks (\`hero\`, \`cards\`, \`tabs\`, \`accordion\`, \`modal\`)
3. Commerce flows (cart, checkout, account, order tracking)
4. B2B workflows (quote, purchase order, requisition lists)

## 6) Keep Design Token Compatibility

All tokens are cataloged in \`manifests/design-tokens.json\`.
Token summary:

- Total tokens detected: \`${designTokens.summary.totalTokens}\`
- Defined tokens: \`${designTokens.summary.definedTokens}\`
- Unresolved references: \`${designTokens.summary.unresolvedTokens}\`

When adapting brand:

1. Start with \`--main-color-accent\`.
2. Validate contrast and focus styles.
3. Update section treatments (\`.section.light\`, \`.section.glass\`, \`.section.dark-glass\`) last.

## 7) Reconcile Section Metadata Conventions

This package expects section metadata attributes used by EDS pages:

- \`data-padding\`: ${sectionConventions.sectionDataPaddingValues.map((value) => `\`${value}\``).join(', ')}
- \`data-margin\`: ${sectionConventions.sectionDataMarginValues.map((value) => `\`${value}\``).join(', ')}
- section style classes: ${sectionConventions.sectionStyleVariants.map((value) => `\`${value}\``).join(', ')}

If your target environment has no section metadata parser, implement equivalent wrappers/classes in templates.
`;

  const migrationChecklist = `# Migration Checklist

Use this checklist to track a zero-regression transfer.

## Scope Validation

- [ ] Confirm this package path is immutable in target repo.
- [ ] Confirm static paths for \`/fonts\` and \`/icons\`.
- [ ] Confirm runtime dependency install plan.

## Theme and Tokens

- [ ] Import \`styles/import-order.css\`.
- [ ] Verify typography renders (adobe-clean, roboto variants).
- [ ] Verify accent token and gradient text styles.
- [ ] Verify button hover/focus and reduced-motion behavior.

## Layout and Section System

- [ ] Validate section transitions and \`.appear\` behavior.
- [ ] Validate all \`data-padding\` and \`data-margin\` values.
- [ ] Validate glass surfaces in both light and dark sections.

## Components

- [ ] Migrate shell blocks first.
- [ ] Migrate content blocks.
- [ ] Migrate commerce core flows.
- [ ] Migrate commerce B2B flows.
- [ ] Validate each block against its local \`README.md\`.

## Runtime and Dependency Integration

- [ ] Confirm all \`@dropins/*\` imports resolve.
- [ ] Confirm \`@adobe/*\` event collector setup.
- [ ] Confirm analytics initialization and event bus behavior.
- [ ] Confirm no missing import-map assumptions in non-EDS runtimes.

## QA

- [ ] Desktop and mobile visual parity.
- [ ] Keyboard-only navigation for nav/search/cart/auth.
- [ ] Screen reader landmarks and heading order.
- [ ] High contrast and reduced-motion checks.
- [ ] Smoke test cart/checkout/login/order/search routes.
`;

  const architecture = `# Design System and UX Reference

## Design Direction

- Visual style: glassmorphic layers on a warm neutral base.
- Primary accent token: \`--main-color-accent\`.
- Typography stack: Adobe Clean + Roboto variants.
- Motion language: eased lifts, staggered entrance, orb drift background.

## Key Global Conventions

- Root token system in \`styles/styles.css\`.
- Global motion add-ons in \`styles/lazy-styles.css\`.
- Font declarations in \`styles/fonts.css\`.
- Section-level visual controls via classes and metadata attributes.

## Responsive Breakpoints (Detected)

${sectionConventions.globalBreakpointsPx.map((bp) => `- \`${bp}px\``).join('\n')}

## Header/Nav Design Tokens

${sectionConventions.headerNavigationTokens.map((token) => `- \`${token}\``).join('\n')}

## Component Inventory Summary

- Total blocks: \`${blockInventory.summary.totalBlocks}\`
- Blocks with CSS: \`${blockInventory.summary.withStyles}\`
- Blocks with JS runtime: \`${blockInventory.summary.withRuntime}\`

Category distribution:
${Object.entries(blockInventory.summary.byCategory)
    .map(([category, count]) => `- \`${category}\`: ${count}`)
    .join('\n')}

## Token Prefix Distribution

${Object.entries(designTokens.summary.byPrefix)
    .map(([prefix, count]) => `- \`${prefix}\`: ${count}`)
    .join('\n')}
`;

  const portabilityScope = `# Portability Scope

## Included (Copied Into Package)

- \`head.html\` for bootstrapping import maps and script-loading order.
- \`styles/\` for global token, theme, and motion layers.
- \`fonts/\` and \`icons/\` for all visual assets referenced by CSS/blocks.
- \`blocks/\` for all \`${blockInventory.summary.totalBlocks}\` authored UI blocks.
- \`scripts/\` runtime files needed by the UI layer:
  - core files (\`aem.js\`, \`scripts.js\`, \`commerce.js\`, delayed and analytics files)
  - \`initializers/\`
  - \`components/\`
  - \`acdl/\`
- \`models/\`, \`component-definition.json\`, \`component-models.json\`, \`component-filters.json\` for authoring metadata.
- \`manifests/\` generated portability metadata.
- \`docs/\` migration and integration playbooks.

## Excluded by Design

- \`scripts/__dropins__\` generated build artifacts are excluded.
  - Reason: these are environment-specific outputs generated from \`@dropins/*\` dependencies.
  - Action in target repo: install required packages and generate/fetch equivalents in your runtime setup.
- Environment-specific config files (\`config.json\`, \`default-site.json\`) are excluded.
  - Reason: these contain endpoint/store wiring that should be target-repo specific.

## Category and Block Coverage

${blockCategoryLines}
`;

  const blockMigrationOrder = `# Block Migration Order

## Wave Plan

1. Shell and navigation:
   - \`header\`, \`footer\`, \`top-banner\`, \`search\`, \`search-bar\`
2. Content and interaction:
   - \`hero\`, \`hero-cta\`, \`hero-3\`, \`cards\`, \`cards-list\`, \`tabs\`, \`accordion\`, \`modal\`, \`video\`, \`embed\`, \`table\`
3. Commerce core:
   - cart, checkout, account, authentication, orders, returns, wishlist, product details/list/recommendations
4. Commerce B2B:
   - negotiable quote flows, purchase-order approvals, requisition list flows, company management flows

## Full Block Matrix

| Block | Category | Subcategory | CSS Files | JS Files |
|---|---|---|---:|---:|
${fullBlockTable}
`;

  ensureDir(join(outputDir, 'docs'));
  writeFileSync(join(outputDir, 'README.md'), readme, 'utf-8');
  writeFileSync(join(outputDir, 'docs', 'IMPORT_GUIDE.md'), importGuide, 'utf-8');
  writeFileSync(join(outputDir, 'docs', 'MIGRATION_CHECKLIST.md'), migrationChecklist, 'utf-8');
  writeFileSync(join(outputDir, 'docs', 'DESIGN_SYSTEM_REFERENCE.md'), architecture, 'utf-8');
  writeFileSync(join(outputDir, 'docs', 'PORTABILITY_SCOPE.md'), portabilityScope, 'utf-8');
  writeFileSync(join(outputDir, 'docs', 'BLOCK_MIGRATION_ORDER.md'), blockMigrationOrder, 'utf-8');
}

function writeInstallerTool() {
  const script = `#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const args = { targetRepo: '', dest: 'vendor/ui-ux-portability-package', force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dest') {
      args.dest = argv[i + 1] || args.dest;
      i += 1;
      continue;
    }
    if (arg === '--force') {
      args.force = true;
      continue;
    }
    if (!args.targetRepo) {
      args.targetRepo = arg;
    }
  }
  return args;
}

function main() {
  const { targetRepo, dest, force } = parseArgs(process.argv.slice(2));
  if (!targetRepo) {
    process.stderr.write('Usage: node tools/install-into-repo.mjs <target-repo-path> [--dest <relative/path>] [--force]\\n');
    process.exit(1);
  }

  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const targetRoot = resolve(targetRepo);
  const destination = resolve(targetRoot, dest);

  if (destination === packageRoot) {
    process.stderr.write('Refusing to copy package into itself.\\n');
    process.exit(1);
  }

  if (existsSync(destination)) {
    if (!force) {
      process.stderr.write(\`Destination already exists: \${destination}\\nUse --force to replace it.\\n\`);
      process.exit(1);
    }
    rmSync(destination, { recursive: true, force: true });
  }

  mkdirSync(resolve(destination, '..'), { recursive: true });
  cpSync(packageRoot, destination, { recursive: true });

  process.stdout.write(
    [
      'Installed UI/UX portability package',
      \`- destination: \${destination}\`,
      'Next steps:',
      \`1. Import CSS: @import "./\${dest}/styles/import-order.css";\`,
      '2. Serve static assets from /fonts and /icons.',
      '3. Install dropins dependencies from manifests/dropin-dependencies.json.',
      '',
    ].join('\\n'),
  );
}

main();
`;

  ensureDir(join(outputDir, 'tools'));
  writeFileSync(join(outputDir, 'tools', 'install-into-repo.mjs'), script, 'utf-8');
}

function createArchive() {
  execFileSync('tar', ['-czf', archivePath, '-C', repoRoot, 'ui-ux-portability-package']);
  const archiveBuffer = readFileSync(archivePath);
  const checksum = createHash('sha256').update(archiveBuffer).digest('hex');
  writeFileSync(checksumPath, `${checksum}  ui-ux-portability-package.tar.gz\n`, 'utf-8');
  return checksum;
}

function run() {
  resetOutput();
  copyCoreFiles();
  copyRuntimeScripts();
  copyExperimentationPluginSource();

  const manifests = {
    blockInventory: buildBlockInventory(),
    designTokens: buildDesignTokenManifest(),
    dependencies: buildDependencyManifest(),
    sectionConventions: buildSectionConventionManifest(),
    assets: buildAssetManifest(),
  };

  writePackageFiles(manifests);
  writeDocs(manifests);
  writeInstallerTool();
  const checksum = createArchive();

  const archiveStats = statSync(archivePath);
  const blockCount = manifests.blockInventory.summary.totalBlocks;
  const tokenCount = manifests.designTokens.summary.totalTokens;
  const dependencyCount = manifests.dependencies.summary.totalPackages;

  process.stdout.write(
    [
      'Built UI/UX portability package',
      `- output directory: ${relFromRepo(outputDir)}`,
      `- archive: ${relFromRepo(archivePath)}`,
      `- checksum file: ${relFromRepo(checksumPath)}`,
      `- archive size: ${archiveStats.size} bytes`,
      `- blocks cataloged: ${blockCount}`,
      `- tokens cataloged: ${tokenCount}`,
      `- runtime packages cataloged: ${dependencyCount}`,
      `- sha256: ${checksum}`,
      '',
    ].join('\n'),
  );
}

run();
