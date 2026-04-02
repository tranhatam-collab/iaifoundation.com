import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts', 'apps/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@intent-os/contracts': resolve(rootDir, 'packages/contracts/src'),
      '@intent-os/db': resolve(rootDir, 'packages/db/src'),
      '@intent-os/policy-engine': resolve(rootDir, 'packages/policy-engine/src'),
      '@intent-os/audit-sdk': resolve(rootDir, 'packages/audit-sdk/src'),
      '@intent-os/idempotency': resolve(rootDir, 'packages/idempotency/src'),
      '@intent-os/observability': resolve(rootDir, 'packages/observability/src'),
    },
  },
});
