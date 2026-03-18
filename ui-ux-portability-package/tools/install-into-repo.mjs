#!/usr/bin/env node

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
    process.stderr.write('Usage: node tools/install-into-repo.mjs <target-repo-path> [--dest <relative/path>] [--force]\n');
    process.exit(1);
  }

  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const targetRoot = resolve(targetRepo);
  const destination = resolve(targetRoot, dest);

  if (destination === packageRoot) {
    process.stderr.write('Refusing to copy package into itself.\n');
    process.exit(1);
  }

  if (existsSync(destination)) {
    if (!force) {
      process.stderr.write(`Destination already exists: ${destination}\nUse --force to replace it.\n`);
      process.exit(1);
    }
    rmSync(destination, { recursive: true, force: true });
  }

  mkdirSync(resolve(destination, '..'), { recursive: true });
  cpSync(packageRoot, destination, { recursive: true });

  process.stdout.write(
    [
      'Installed UI/UX portability package',
      `- destination: ${destination}`,
      'Next steps:',
      `1. Import CSS: @import "./${dest}/styles/import-order.css";`,
      '2. Serve static assets from /fonts and /icons.',
      '3. Install dropins dependencies from manifests/dropin-dependencies.json.',
      '',
    ].join('\n'),
  );
}

main();
