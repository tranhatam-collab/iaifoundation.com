import { describe, expect, test } from 'vitest';
import { queryOne, queryMany, queryRun } from '../packages/db/src/client.js';
import { withTransaction } from '../packages/db/src/tx.js';
import { buildPaginatedQuery, paginateResults } from '../packages/db/src/query-helpers/pagination.js';
import { validateTenantScope, validateWorkspaceScope } from '../packages/db/src/query-helpers/scoping.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('db client query helpers', () => {
  test('queryOne returns the first row or null', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'x' }) });
    await expect(queryOne(db, 'SELECT * FROM t')).resolves.toEqual({ id: 'x' });

    const empty = makeFakeD1({ first: () => null });
    await expect(queryOne(empty.db, 'SELECT * FROM t')).resolves.toBeNull();
  });

  test('queryMany returns the results array', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ id: 'a' }, { id: 'b' }] }) });
    await expect(queryMany(db, 'SELECT * FROM t')).resolves.toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  test('queryRun executes with bound parameters', async () => {
    const { db, calls } = makeFakeD1();
    await queryRun(db, 'UPDATE t SET x = ?', [1]);
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual([1]);
  });
});

describe('withTransaction', () => {
  test('commits on success and returns the callback result', async () => {
    const { db, calls } = makeFakeD1();
    const result = await withTransaction(db, async () => 'done');
    expect(result).toBe('done');
    expect(calls.map((c) => c.sql)).toEqual(['BEGIN', 'COMMIT']);
  });

  test('rolls back and rethrows on failure', async () => {
    const { db, calls } = makeFakeD1();
    await expect(
      withTransaction(db, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(calls.map((c) => c.sql)).toEqual(['BEGIN', 'ROLLBACK']);
  });
});

describe('pagination helpers', () => {
  test('buildPaginatedQuery appends cursor and limit+1', () => {
    const base = buildPaginatedQuery('SELECT * FROM t WHERE 1=1', [], { limit: 10 });
    expect(base.sql).toContain('ORDER BY created_at DESC LIMIT ?');
    expect(base.params).toEqual([11]);

    const withCursor = buildPaginatedQuery('SELECT * FROM t WHERE 1=1', [], { cursor: 'c1', limit: 10 });
    expect(withCursor.sql).toContain('AND created_at < ?');
    expect(withCursor.params).toEqual(['c1', 11]);
  });

  test('paginateResults drops the extra row and derives next_cursor', () => {
    const page = [
      { id: '1', created_at: 'a' },
      { id: '2', created_at: 'b' },
      { id: '3', created_at: 'c' },
    ];
    const result = paginateResults(page, 2);
    expect(result.items).toHaveLength(2);
    expect(result.next_cursor).toBe('b');

    const short = paginateResults([{ id: '1', created_at: 'a' }], 2);
    expect(short.next_cursor).toBeNull();
  });
});

describe('scope validation', () => {
  test('validateTenantScope allows a matching tenant and rejects mismatches', () => {
    expect(() => validateTenantScope('t1', 't1')).not.toThrow();
    expect(() => validateTenantScope('t1', 't2')).toThrow('TENANT_SCOPE_MISMATCH');
  });

  test('validateWorkspaceScope allows listed workspaces and rejects others', () => {
    expect(() => validateWorkspaceScope('ws1', ['ws1', 'ws2'])).not.toThrow();
    expect(() => validateWorkspaceScope('ws3', ['ws1', 'ws2'])).toThrow('FORBIDDEN');
  });
});
