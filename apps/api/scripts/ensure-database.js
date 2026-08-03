#!/usr/bin/env node
/**
 * Ensure @ethio/database is generated + built before Nest compiles.
 * Required on Vercel where `npm run build` alone would skip the workspace package.
 */
const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const repoRoot = join(__dirname, '../../..');
const databasePkg = join(repoRoot, 'packages/database');
const distTypes = join(databasePkg, 'dist/index.d.ts');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(join(databasePkg, 'package.json'))) {
  console.error('packages/database not found. Is the Vercel Root Directory apps/api in a monorepo checkout?');
  process.exit(1);
}

console.log('Ensuring @ethio/database client + dist...');
run('npx', ['prisma', 'generate', '--schema=./prisma/schema.prisma'], databasePkg);
run('npx', ['tsc', '-p', 'tsconfig.json'], databasePkg);

if (!existsSync(distTypes)) {
  console.error('Expected packages/database/dist/index.d.ts after build, but it is missing.');
  process.exit(1);
}

console.log('@ethio/database is ready.');
