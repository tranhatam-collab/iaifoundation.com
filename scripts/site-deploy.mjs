import { accessSync, constants } from 'node:fs';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DEPLOY_ARGS = [
  'pages',
  'deploy',
  '.wrangler/pages-build',
  '--project-name',
  'iaifoundation-com',
  '--branch',
  'main',
  '--commit-dirty=true',
];

const localWrangler = join(process.cwd(), 'node_modules', '.bin', 'wrangler');
const envConfiguredWrangler = process.env.WRANGLER_BIN;
const pathCandidates = unique(
  (process.env.PATH || '')
    .split(delimiter)
    .filter(Boolean)
    .map((dir) => join(dir, 'wrangler'))
);
const nonLocalPathCandidates = pathCandidates.filter((candidate) => candidate !== localWrangler);

const candidates = unique([
  envConfiguredWrangler,
  ...nonLocalPathCandidates,
  localWrangler,
]).filter(Boolean);

const selectedWrangler = pickWorkingWrangler(candidates);

if (!selectedWrangler) {
  console.error('No working Wrangler binary was found. Set WRANGLER_BIN to a valid executable and retry.');
  process.exit(1);
}

console.log(`Using Wrangler: ${selectedWrangler}`);

const deploy = spawnSync(selectedWrangler, DEPLOY_ARGS, {
  stdio: 'inherit',
  env: process.env,
});

if (deploy.error) {
  console.error(`Wrangler failed to start: ${deploy.error.message}`);
  process.exit(1);
}

process.exit(deploy.status ?? 1);

function pickWorkingWrangler(candidatesList) {
  for (const candidate of candidatesList) {
    if (!isExecutable(candidate)) {
      continue;
    }
    const probe = spawnSync(candidate, ['--version'], {
      encoding: 'utf8',
      env: process.env,
    });
    if (probe.status === 0) {
      return candidate;
    }
  }
  return null;
}

function isExecutable(pathname) {
  try {
    accessSync(pathname, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values)];
}
