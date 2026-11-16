import { describe, expect, test } from 'vitest';
import { featureFlagMiddleware } from '../apps/api/src/middleware/feature-flag.js';
import { queryAuditEvents } from '../apps/api/src/modules/audit/audit.service.js';
import { mapRunListItem } from '../apps/api/src/modules/runs/runs.dto.js';
import { createUserService, updateUserService } from '../apps/api/src/modules/users/users.service.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

const next = async () => {};

describe('featureFlagMiddleware', () => {
  test('blocks a disabled feature', async () => {
    const mw = featureFlagMiddleware('stablecoin');
    await expect(mw({ env: {} } as never, next)).rejects.toMatchObject({ code: 'FORBIDDEN', httpStatus: 403 });
  });

  test('allows an enabled feature', async () => {
    const mw = featureFlagMiddleware('stablecoin');
    let called = false;
    await mw({ env: { ENABLE_STABLECOIN: 'true' } } as never, async () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});

describe('queryAuditEvents', () => {
  test('applies filters and paginates with a next cursor', async () => {
    const rows = [
      { id: 'a1', created_at: 'c3' },
      { id: 'a2', created_at: 'c2' },
      { id: 'a3', created_at: 'c1' },
    ];
    const { db, calls } = makeFakeD1({ all: () => ({ results: rows }) });
    const result = await queryAuditEvents(db, { tenant_id: 't1', action_type: 'run.created', limit: 2 });

    expect(calls[0].sql).toContain('AND tenant_id = ?');
    expect(calls[0].sql).toContain('AND action_type = ?');
    expect(calls[0].params).toEqual(['t1', 'run.created', 3]);
    expect(result.items).toHaveLength(2);
    expect(result.next_cursor).toBe('c2');
  });
});

describe('mapRunListItem', () => {
  const row: any = {
    id: 'run_1',
    tenant_id: 't1',
    workspace_id: 'ws1',
    status: 'running',
    created_by_actor_id: 'usr_1',
    started_at: '2026-01-01T00:00:00Z',
    ended_at: '2026-01-01T00:00:05Z',
  };

  test('maps a run row and computes duration_ms', () => {
    const dto = mapRunListItem(row, 'Pay vendor');
    expect(dto.template_name).toBe('Pay vendor');
    expect(dto.duration_ms).toBe(5000);
    expect(dto.approval_state).toBe('none');
    expect(dto.tenant_id).toBe('t1');
  });

  test('returns null duration and template when absent', () => {
    const dto = mapRunListItem({ ...row, started_at: null, ended_at: null }, undefined);
    expect(dto.duration_ms).toBeNull();
    expect(dto.template_name).toBeNull();
  });
});

describe('users service', () => {
  test('createUserService rejects a duplicate email', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'usr_existing' }) });
    await expect(
      createUserService(db, { tenant_id: 't1', primary_email: 'a@b.com', auth_subject: 'sub' }, 'usr_1', 'req_1'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createUserService inserts, audits, and returns the user', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    const user = await createUserService(
      db,
      { tenant_id: 't1', primary_email: 'a@b.com', display_name: 'A', auth_subject: 'sub' },
      'usr_1',
      'req_1',
    );
    expect(user.id).toMatch(/^usr_/);
    expect(user.status).toBe('active');
    expect(calls.some((c) => c.sql.includes('INSERT INTO users'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('updateUserService throws when missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(updateUserService(db, 'usr_1', { display_name: 'X' }, 'a', 'r')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  test('updateUserService updates and audits', async () => {
    const { db, calls } = makeFakeD1({
      first: () => ({ id: 'usr_1', tenant_id: 't1', display_name: 'Old', status: 'active' }),
    });
    const result = await updateUserService(db, 'usr_1', { display_name: 'New' }, 'a', 'r');
    expect(result.display_name).toBe('New');
    expect(calls.some((c) => c.sql.includes('UPDATE users SET display_name'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('updateUserService with no updates skips the write', async () => {
    const { db, calls } = makeFakeD1({
      first: () => ({ id: 'usr_1', tenant_id: 't1', display_name: 'Old', status: 'active' }),
    });
    const result = await updateUserService(db, 'usr_1', {}, 'a', 'r');
    expect(result.id).toBe('usr_1');
    expect(calls.some((c) => c.sql.includes('UPDATE users'))).toBe(false);
  });
});
