#!/usr/bin/env node
/**
 * Resolve @nestjs/cli whether npm hoisted it to the repo root or kept it
 * under apps/api/node_modules (common in workspaces / Docker).
 */
const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const candidates = [
  join(__dirname, '../node_modules/@nestjs/cli/bin/nest.js'),
  join(__dirname, '../../../node_modules/@nestjs/cli/bin/nest.js'),
];

const nestBin = candidates.find((file) => existsSync(file));

if (!nestBin) {
  console.error(
    'Could not find @nestjs/cli. Run `npm install` from the monorepo root.',
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [nestBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
