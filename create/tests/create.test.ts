import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SpawnSyncReturns } from 'node:child_process';

/** The built command, as the package publishes it */
const BIN = join(import.meta.dirname, '../build/index.js');

// Folder where each test creates its apps
let sCwd = '';

beforeEach(() => {
  sCwd = mkdtempSync(join(tmpdir(), 'nano-create-'));
});

afterEach(() => rmSync(sCwd, { recursive: true, force: true }));

/** Runs the command in the folder of the test with its arguments */
function create(...aArgs: string[]): SpawnSyncReturns<string> {
  return spawnSync('node', [BIN, ...aArgs], { cwd: sCwd, encoding: 'utf8' });
}

test('creates the app in a folder of its name, with its name and its .gitignore', () => {
  const oRun = create('my-app');
  const sDir = join(sCwd, 'my-app');

  // The command succeeds and says what comes next
  assert.equal(oRun.status, 0);
  assert.match(oRun.stdout, /my-app created/);

  // The backend, the frontend and both Dockerfiles of the template
  for (const sFile of [
    'backend/src/app.ts',
    'backend/Dockerfile',
    'frontend/src/app/page.tsx',
    'frontend/Dockerfile',
    '.env.example',
  ])
    assert.ok(existsSync(join(sDir, sFile)), sFile);

  // The .gitignore comes back, and the root package.json takes the name
  assert.ok(existsSync(join(sDir, '.gitignore')));
  assert.equal(existsSync(join(sDir, 'gitignore')), false);
  assert.equal(JSON.parse(readFileSync(join(sDir, 'package.json'), 'utf8')).name, 'my-app');
});

test('the template comes without what an install writes', () => {
  create('my-app');
  const sDir = join(sCwd, 'my-app');

  // No dependencies, lockfile nor build of the template
  for (const sFile of ['node_modules', 'pnpm-lock.yaml', 'frontend/.next'])
    assert.equal(existsSync(join(sDir, sFile)), false, sFile);
});

test('fails without a valid name, or when its folder exists', () => {
  // Without a name, and with one npm does not accept
  assert.notEqual(create().status, 0);
  assert.match(create('My App').stderr, /Give the name of the app/);

  // A second app of the same name
  create('my-app');
  const oRun = create('my-app');
  assert.notEqual(oRun.status, 0);
  assert.match(oRun.stderr, /The folder my-app already exists/);
});
