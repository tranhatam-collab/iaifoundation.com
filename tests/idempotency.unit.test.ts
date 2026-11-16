import { describe, expect, test } from 'vitest';
import {
  checkIdempotency,
  storeIdempotency,
  createIdempotencyTable,
} from '../packages/idempotency/src/guard.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'idem_1',
    idempotency_key: 'k1',
    request_hash: 'hash1',
    response_body: '{"ok":true}',
    response_status: 200,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10000).toISOString(),
    ...overrides,
  };
}

describe('idempotency guard', () => {
  test('returns no replay when no record exists', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(checkIdempotency(db, 'k1', 'hash1')).resolves.toEqual({ replay: false });
  });

  test('replays the stored response when the hash matches', async () => {
    const { db } = makeFakeD1({ first: () => record() });
    await expect(checkIdempotency(db, 'k1', 'hash1')).resolves.toEqual({
      replay: true,
      response: { body: '{"ok":true}', status: 200 },
    });
  });

  test('rejects key reuse with a different payload', async () => {
    const { db } = makeFakeD1({ first: () => record({ request_hash: 'hash-other' }) });
    await expect(checkIdempotency(db, 'k1', 'hash1')).rejects.toMatchObject({
      code: 'IDEMPOTENCY_CONFLICT',
      httpStatus: 409,
    });
  });

  test('storeIdempotency computes an expiry and writes the row', async () => {
    const { db, calls } = makeFakeD1();
    await storeIdempotency(db, 'k1', 'hash1', '{"ok":true}', 200, 24);

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('INSERT OR IGNORE INTO idempotency_keys');
    expect(calls[0].params).toHaveLength(7);
    expect(calls[0].params[1]).toBe('k1');
    expect(calls[0].params[2]).toBe('hash1');

    const createdAt = new Date(calls[0].params[5] as string).getTime();
    const expiresAt = new Date(calls[0].params[6] as string).getTime();
    expect(expiresAt - createdAt).toBeCloseTo(24 * 60 * 60 * 1000, -3);
  });

  test('createIdempotencyTable issues the CREATE TABLE statement', async () => {
    const { db, calls } = makeFakeD1();
    await createIdempotencyTable(db);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('CREATE TABLE IF NOT EXISTS idempotency_keys');
  });
});
