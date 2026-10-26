import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = resolve(import.meta.dirname, '..');
const wrangler = resolve(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
const persistenceDirectory = mkdtempSync(join(tmpdir(), 'iaif-d1-e2e-'));
const config = resolve(rootDir, 'apps/api/wrangler.toml');
const seed = resolve(rootDir, 'packages/db/seeds/mvp-dev-seed.sql');

try {
  run([
    'd1', 'migrations', 'apply', 'intent-os-db',
    '--config', config,
    '--local',
    '--persist-to', persistenceDirectory,
  ]);

  const seedArgs = [
    'd1', 'execute', 'intent-os-db',
    '--config', config,
    '--local',
    '--persist-to', persistenceDirectory,
    '--file', seed,
  ];
  run(seedArgs);
  run(seedArgs);

  const result = run([
    'd1', 'execute', 'intent-os-db',
    '--config', config,
    '--local',
    '--persist-to', persistenceDirectory,
    '--command', [
      'SELECT',
      '(SELECT COUNT(*) FROM tenants) AS tenants,',
      '(SELECT COUNT(*) FROM workspaces) AS workspaces,',
      '(SELECT COUNT(*) FROM users) AS users,',
      '(SELECT COUNT(*) FROM roles) AS roles,',
      '(SELECT COUNT(*) FROM usage_meters) AS meters;',
    ].join(' '),
  ]);

  const expectedCounts = {
    tenants: 1,
    workspaces: 1,
    users: 1,
    roles: 6,
    meters: 3,
  };
  for (const [name, count] of Object.entries(expectedCounts)) {
    const pattern = new RegExp(`"${name}"\\s*:\\s*${count}(?:,|\\s*})`);
    if (!pattern.test(result)) throw new Error(`Unexpected ${name} seed count; expected ${count}`);
  }

  console.log('D1 E2E passed: 6 migrations applied and the seed remained stable across two runs.');
} finally {
  rmSync(persistenceDirectory, { recursive: true, force: true });
}

function run(args) {
  const result = spawnSync(wrangler, args, {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: resolve(persistenceDirectory, 'wrangler.log'),
    },
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.status !== 0) {
    process.stderr.write(output);
    throw new Error(`Wrangler exited with status ${result.status ?? 'unknown'}`);
  }
  return output;
}
