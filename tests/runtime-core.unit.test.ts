import { describe, expect, test } from 'vitest';
import { handleIntake } from '../packages/runtime-core/src/orchestration/index.js';
import {
  requestApproval,
  decideApproval,
  getPendingApprovals,
} from '../packages/runtime-core/src/approvals/index.js';
import { makeFakeD1 } from './helpers/fake-d1.js';
import type { IntakeInput } from '../packages/runtime-core/src/types/index.js';

const intake: IntakeInput = {
  tenant_id: 'tenant_1',
  workspace_id: 'ws_1',
  template_id: 'tpl_1',
  inputs: {},
  actor_id: 'usr_1',
};

function intakeDb(pendingApprovals: unknown[] = []) {
  return makeFakeD1({
    first: (sql, params) => {
      if (sql.includes('intent_templates') && params.length === 2 && params[1] === 'published') {
        return { id: 'tpl_1' };
      }
      if (sql.includes('manifest_json')) {
        return { manifest_json: JSON.stringify({ steps: [{ type: 'payment', name: 'Pay vendor' }] }) };
      }
      if (sql.includes('SELECT status FROM runs')) {
        return { status: pendingApprovals.length ? 'awaiting_approval' : 'succeeded' };
      }
      return null;
    },
    all: (sql) => {
      if (sql.includes('approval_requests')) {
        return { results: pendingApprovals };
      }
      return { results: [] };
    },
  });
}

describe('handleIntake', () => {
  test('runs a clean intake through to succeeded', async () => {
    const { db, calls } = intakeDb();
    const result = await handleIntake(db, {} as never, intake);

    expect(result.run_id).toMatch(/^run_/);
    expect(result.initial_status).toBe('succeeded');
    expect(result.requires_approval).toBe(false);
    expect(result.next_action).toBe('complete');
    expect(calls.some((c) => c.sql.includes('INSERT INTO runs'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('run.created'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO run_steps'))).toBe(true);
  });

  test('parks the run in awaiting_approval when approvals are pending', async () => {
    const { db } = intakeDb([{ id: 'apr_1' }]);
    const result = await handleIntake(db, {} as never, intake);

    expect(result.initial_status).toBe('awaiting_approval');
    expect(result.requires_approval).toBe(true);
    expect(result.next_action).toBe('approve');
  });

  test('marks the run failed when template resolution fails', async () => {
    const { db, calls } = makeFakeD1({
      first: (sql) => {
        if (sql.includes('SELECT status FROM runs')) return { status: 'failed' };
        return null;
      },
      all: () => ({ results: [] }),
    });

    const result = await handleIntake(db, {} as never, intake);

    expect(result.initial_status).toBe('failed');
    expect(result.requires_approval).toBe(false);
    expect(result.next_action).toBe('investigate');
    expect(calls.some((c) => c.sql.includes('run.failed'))).toBe(true);
  });
});

describe('approvals', () => {
  test('requestApproval inserts a pending approval and returns its id', async () => {
    const { db, calls } = makeFakeD1();
    const id = await requestApproval(
      { db, runId: 'run_1', stepId: 'stp_1' },
      'usr_approver',
      '2099-01-01T00:00:00Z',
    );
    expect(id).toMatch(/^apr_/);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('INSERT INTO approval_requests');
    expect(calls[0].params[1]).toBe('run_1');
    expect(calls[0].params[3]).toBe('usr_approver');
  });

  test('decideApproval updates only a pending approval', async () => {
    const { db, calls } = makeFakeD1();
    await decideApproval({ db, runId: 'run_1', stepId: 'stp_1' }, 'apr_1', 'approved', 'ok');
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("status = 'pending'");
    expect(calls[0].params[0]).toBe('approved');
  });

  test('getPendingApprovals returns the pending rows', async () => {
    const rows = [{ id: 'apr_1' }, { id: 'apr_2' }];
    const { db } = makeFakeD1({ all: () => ({ results: rows }) });
    await expect(getPendingApprovals(db, 'run_1')).resolves.toEqual(rows);
  });
});
