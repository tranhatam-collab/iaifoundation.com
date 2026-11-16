import { describe, expect, test, vi } from 'vitest';
import { processProof, validateProof } from '../apps/workers-runtime/src/proof/proof-processor.js';
import { reconcileRun } from '../apps/workers-runtime/src/reconciliation/reconciliation-engine.js';
import { publishEvent } from '../apps/workers-runtime/src/event-bus/event-publisher.js';
import { resolveRunContext } from '../apps/workers-runtime/src/intake/run-resolver.js';
import { buildRunPlan } from '../apps/workers-runtime/src/planner/planner-service.js';
import { executeRunWorkflow } from '../apps/workers-runtime/src/workflows/run-workflow.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('proof-processor', () => {
  test('processProof stores the artifact and inserts a proof bundle', async () => {
    const put = vi.fn(async (_key: string, _value: ArrayBuffer) => {});
    const { db, calls } = makeFakeD1();
    const id = await processProof(
      { db, artifacts: { put } as never },
      'run_1',
      'stp_1',
      'receipt',
      'upload',
      new ArrayBuffer(8),
      'receipt.png',
    );
    expect(id).toMatch(/^prf_/);
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][0]).toContain('runs/run_1/proofs/');
    expect(calls.some((c) => c.sql.includes('INSERT INTO proof_bundles'))).toBe(true);
  });

  test('validateProof updates the validation status', async () => {
    const { db, calls } = makeFakeD1();
    await validateProof(db, 'prf_1', 'valid', 0.95);
    expect(
      calls.some((c) => c.sql.includes('UPDATE proof_bundles SET validation_status') && c.params[0] === 'valid' && c.params[1] === 0.95),
    ).toBe(true);
  });
});

describe('reconcileRun', () => {
  test('produces matched payment reconciliation when counts match', async () => {
    const { db, calls } = makeFakeD1({
      all: (sql) => {
        if (sql.includes('FROM payment_intents')) return { results: [{}, {}] };
        if (sql.includes('FROM settlement_records')) return { results: [{}, {}] };
        if (sql.includes('proof_bundles')) return { results: [] };
        if (sql.includes('device_commands')) return { results: [] };
        return { results: [] };
      },
    });
    const results = await reconcileRun(db, 'run_1');
    expect(results).toHaveLength(3);
    expect(results[0].result_status).toBe('matched');
    expect(calls.filter((c) => c.sql.includes('INSERT INTO reconciliations'))).toHaveLength(3);
  });

  test('marks payment reconciliation mismatched when counts differ', async () => {
    const { db } = makeFakeD1({
      all: (sql) => {
        if (sql.includes('FROM payment_intents')) return { results: [{}, {}] };
        if (sql.includes('FROM settlement_records')) return { results: [{}] };
        if (sql.includes('proof_bundles')) return { results: [] };
        if (sql.includes('device_commands')) return { results: [] };
        return { results: [] };
      },
    });
    const results = await reconcileRun(db, 'run_1');
    expect(results[0].result_status).toBe('mismatched');
  });
});

describe('publishEvent', () => {
  test('inserts a run event with the next sequence number', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ max_seq: 5 }) });
    const id = await publishEvent({ db }, 'run.state_changed', { a: 1 }, 'run_1', 'stp_1');
    expect(id).toMatch(/^evt_/);
    const insert = calls.find((c) => c.sql.includes('INSERT INTO run_events'));
    expect(insert).toBeTruthy();
    expect(insert!.params[1]).toBe('run_1');
    expect(insert!.params[6]).toBe(6);
  });

  test('sends to the queue when configured', async () => {
    const send = vi.fn(async () => {});
    const { db } = makeFakeD1({ first: () => null });
    await publishEvent({ db, queue: { send } }, 'run.created', {}, 'run_1');
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('skips the DB insert when there is no runId', async () => {
    const { db, calls } = makeFakeD1();
    await publishEvent({ db }, 'custom.event', {});
    expect(calls.some((c) => c.sql.includes('INSERT INTO run_events'))).toBe(false);
  });
});

describe('resolveRunContext', () => {
  test('throws RESOURCE_NOT_FOUND when the template is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(resolveRunContext(db, 'tpl_1', 'usr_1', {})).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  test('resolves template, policy pack, roles, and linked beneficiary', async () => {
    const { db } = makeFakeD1({
      first: (sql) => {
        if (sql.includes('intent_templates')) return { id: 'tpl_1', tenant_id: 't1', workspace_id: 'ws1' };
        if (sql.includes('policy_packs')) return { id: 'pol_1' };
        if (sql.includes('beneficiaries')) return { id: 'ben_1' };
        return null;
      },
      all: () => ({ results: [{ role_key: 'approver' }, { role_key: 'operator' }] }),
    });

    const result = await resolveRunContext(db, 'tpl_1', 'usr_1', { supplier_id: 'ben_1' });

    expect(result.template.id).toBe('tpl_1');
    expect(result.policyPack.id).toBe('pol_1');
    expect(result.actor.roles).toEqual(['approver', 'operator']);
    expect(result.linkedResources.beneficiary).toEqual({ id: 'ben_1' });
  });
});

describe('buildRunPlan', () => {
  test('throws when the template is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(buildRunPlan(db, 'run_1', 'tpl_1')).rejects.toThrow('Template tpl_1 not found');
  });

  test('creates a step per manifest entry and marks the run planned', async () => {
    const { db, calls } = makeFakeD1({
      first: () => ({
        manifest_json: JSON.stringify({ steps: [{ type: 'payment', name: 'Pay' }, { type: 'proof_collection', name: 'Proof' }] }),
      }),
    });
    await buildRunPlan(db, 'run_1', 'tpl_1');
    const stepInserts = calls.filter((c) => c.sql.includes('INSERT INTO run_steps'));
    expect(stepInserts).toHaveLength(2);
    expect(stepInserts[0].params[2]).toBe('payment');
    expect(stepInserts[0].params[4]).toBe(1);
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'planned')).toBe(true);
  });
});

describe('executeRunWorkflow', () => {
  test('finalizes succeeded when there are no steps and no approvals', async () => {
    const { db, calls } = makeFakeD1({
      all: (sql) => (sql.includes('FROM run_steps') ? { results: [] } : { results: [] }),
      first: () => null,
    });
    await executeRunWorkflow({ db }, 'run_1');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'succeeded')).toBe(true);
  });

  test('parks in awaiting_approval when approvals are pending', async () => {
    const { db, calls } = makeFakeD1({
      all: (sql) => {
        if (sql.includes('FROM run_steps')) return { results: [] };
        if (sql.includes('approval_requests')) return { results: [{ id: 'apr_1' }] };
        return { results: [] };
      },
      first: () => null,
    });
    await executeRunWorkflow({ db }, 'run_1');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status'))).toBe(false);
    expect(calls.filter((c) => c.sql.includes('INSERT INTO run_events')).length).toBeGreaterThanOrEqual(2);
  });

  test('fails the run when a step fails', async () => {
    const { db, calls } = makeFakeD1({
      all: (sql) => {
        if (sql.includes('FROM run_steps')) return { results: [{ id: 'stp_1', state: 'pending', type: 'payment' }] };
        return { results: [] };
      },
      first: () => null,
    });
    await executeRunWorkflow({ db }, 'run_1');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'failed')).toBe(true);
  });
});
