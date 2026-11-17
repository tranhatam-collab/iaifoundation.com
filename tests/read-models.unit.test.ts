import { describe, expect, test } from 'vitest';
import { getRunDetailReadModel } from '../packages/db/src/query-helpers/run-detail.read-model.js';
import { getDashboardOverview } from '../packages/db/src/query-helpers/dashboard-overview.read-model.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('getRunDetailReadModel', () => {
  test('returns null when the run does not exist', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(getRunDetailReadModel(db, 'run_missing')).resolves.toBeNull();
  });

  test('assembles a full run detail from related tables', async () => {
    const run = {
      id: 'run_1',
      template_id: 'tpl_1',
      status: 'succeeded',
      started_at: 's',
      ended_at: 'e',
      created_by_actor_id: 'usr_1',
      created_at: 'c',
      updated_at: 'u',
    };
    const { db } = makeFakeD1({
      first: (sql) => {
        if (sql.includes('FROM runs')) return run;
        if (sql.includes('FROM intent_templates')) return { id: 'tpl_1', name: 'Pay vendor', version: '1' };
        return null;
      },
      all: (sql) => {
        if (sql.includes('FROM run_steps')) {
          return { results: [{ state: 'succeeded', step_type: 'payment' }, { state: 'failed', step_type: 'proof' }] };
        }
        if (sql.includes('FROM approval_requests')) return { results: [{ status: 'pending' }] };
        if (sql.includes('payment_intents')) return { results: [{ id: 'pi_1' }] };
        if (sql.includes('proof_bundles')) return { results: [{ id: 'pb_1' }] };
        if (sql.includes('device_commands')) return { results: [{ id: 'dc_1' }] };
        return { results: [] };
      },
    });

    const detail = await getRunDetailReadModel(db, 'run_1');

    expect(detail.run.id).toBe('run_1');
    expect(detail.template.name).toBe('Pay vendor');
    expect(detail.summary.total_steps).toBe(2);
    expect(detail.summary.completed_steps).toBe(1);
    expect(detail.summary.failed_steps).toBe(1);
    expect(detail.summary.pending_approvals).toBe(1);
    expect(detail.summary.linked_payments).toBe(1);
    expect(detail.summary.linked_proofs).toBe(1);
    expect(detail.summary.linked_devices).toBe(1);
    expect(detail.steps).toHaveLength(2);
  });
});

describe('getDashboardOverview', () => {
  test('maps count rows into the overview shape', async () => {
    const { db } = makeFakeD1({
      first: (sql) => {
        if (sql.includes("status IN ('running'")) return { count: 5 };
        if (sql.includes("status = 'succeeded'")) return { count: 3 };
        if (sql.includes("status = 'failed'")) return { count: 2 };
        if (sql.includes("status = 'offline'")) return { count: 4 };
        if (sql.includes("status = 'quarantined'")) return { count: 1 };
        return null;
      },
    });

    const overview = await getDashboardOverview(db, 't1', 'ws1');

    expect(overview.runs.active).toBe(5);
    expect(overview.runs.succeeded_today).toBe(3);
    expect(overview.runs.failed_today).toBe(2);
    expect(overview.devices.offline).toBe(4);
    expect(overview.devices.quarantined).toBe(1);
    expect(overview.approvals.pending).toBe(0);
    expect(overview.usage.plan).toBe('free');
    expect(overview.usage.limit).toBe(1000);
  });
});
