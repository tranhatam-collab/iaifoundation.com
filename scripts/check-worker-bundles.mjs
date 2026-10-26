import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = resolve(import.meta.dirname, '..');
const wrangler = resolve(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
const outputRoot = mkdtempSync(join(tmpdir(), 'iaif-worker-bundles-'));
const configs = [
  ['api', 'apps/api/wrangler.toml'],
  ['runtime', 'apps/workers-runtime/wrangler.toml'],
  ['connectors', 'apps/workers-connectors/wrangler.toml'],
];

try {
  for (const [name, config] of configs) {
    const result = spawnSync(wrangler, [
      'deploy',
      '--config', resolve(rootDir, config),
      '--dry-run',
      '--outdir', resolve(outputRoot, name),
    ], {
      cwd: rootDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: resolve(outputRoot, `${name}.log`),
      },
    });
    if (result.status !== 0) {
      process.stderr.write(`${result.stdout || ''}${result.stderr || ''}`);
      throw new Error(`${name} Worker bundle failed with status ${result.status ?? 'unknown'}`);
    }
    console.log(`Worker bundle PASS: ${name}`);
  }
} finally {
  rmSync(outputRoot, { recursive: true, force: true });
}
