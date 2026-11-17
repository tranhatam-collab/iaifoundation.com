import { describe, expect, test } from 'vitest';
import {
  resolveNextStep,
  transitionRunStatus,
  transitionStepStatus,
} from '../apps/workers-runtime/src/coordinator/run-coordinator.js';
import { finalizeRun } from '../apps/workers-runtime/src/finalizer/finalizer.js';
import { compensateRun, quarantineRun } from '../apps/workers-runtime/src/coordinator/run-compensator.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('resolveNextStep', () => {
  test('returns no step when there are no steps', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [] }) });
    await expect(resolveNextStep(db, 'run_1')).resolves.toEqual({ step: null, canProceed: false });
  });

  test('returns the first pending/running step', async () => {
    const { db } = makeFakeD1({
      all: () => ({
        results: [
          { id: 'stp_1', state: 'succeeded' },
          { id: 'stp_2', state: 'pending', type: 'payment' },
        ],
      }),
    });
    const result = await resolveNextStep(db, 'run_1');
    expect(result.canProceed).toBe(true);
    expect(result.step?.id).toBe('stp_2');
  });

  test('signals completion when all steps succeeded or skipped', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ state: 'succeeded' }, { state: 'skipped' }] }) });
    const result = await resolveNextStep(db, 'run_1');
    expect(result.step).toBeNull();
    expect(result.canProceed).toBe(true);
  });

  test('blocks progression when a step is failed', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ state: 'succeeded' }, { state: 'failed' }] }) });
    const result = await resolveNextStep(db, 'run_1');
    expect(result.step).toBeNull();
    expect(result.canProceed).toBe(false);
  });
});

describe('transitionRunStatus', () => {
  test('throws when the run is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(transitionRunStatus(db, 'run_1', 'created', 'resolved', 'now')).rejects.toThrow('not found');
  });

  test('throws on a mismatched current status', async () => {
    const { db } = makeFakeD1({ first: () => ({ status: 'running' }) });
    await expect(transitionRunStatus(db, 'run_1', 'created', 'resolved', 'now')).rejects.toThrow('Invalid state transition');
  });

  test('updates the run when the transition is valid', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ status: 'created' }) });
    await transitionRunStatus(db, 'run_1', 'created', 'resolved', 'now');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status'))).toBe(true);
  });
});

describe('transitionStepStatus', () => {
  test('throws when the step is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(transitionStepStatus(db, 'stp_1', 'pending', 'running', 'now')).rejects.toThrow('not found');
  });

  test('updates the step when valid', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ state: 'pending' }) });
    await transitionStepStatus(db, 'stp_1', 'pending', 'running', 'now');
    expect(calls.some((c) => c.sql.includes('UPDATE run_steps SET state'))).toBe(true);
  });
});

describe('finalizeRun', () => {
  test('updates the run and appends the matching terminal event', async () => {
    const { db, calls } = makeFakeD1();
    await finalizeRun(db, 'run_1', 'succeeded');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status'))).toBe(true);
    const eventCall = calls.find((c) => c.sql.includes('INSERT INTO run_events'));
    expect(eventCall).toBeTruthy();
    expect(eventCall!.params[1]).toBe('succeeded');
  });
});

describe('run-compensator', () => {
  test('compensateRun refunds settled payments and compensates completed commands', async () => {
    const { db, calls } = makeFakeD1({
      all: (sql) => {
        if (sql.includes('FROM payment_intents')) return { results: [{ id: 'pi_1', status: 'settled' }] };
        if (sql.includes('FROM device_commands')) return { results: [{ id: 'dc_1', status: 'completed' }] };
        return { results: [] };
      },
    });
    await compensateRun({ db, runId: 'run_1', actorId: 'usr_1', requestId: 'req_1' });
    expect(
      calls.some((c) => c.sql.includes('UPDATE payment_intents SET status = ?') && c.params[0] === 'refunded'),
    ).toBe(true);
    expect(
      calls.some((c) => c.sql.includes('UPDATE device_commands SET status = ?') && c.params[0] === 'compensated'),
    ).toBe(true);
    expect(calls.filter((c) => c.sql.includes('INSERT INTO audit_events'))).toHaveLength(2);
  });

  test('quarantineRun marks the run quarantined and audits', async () => {
    const { db, calls } = makeFakeD1();
    await quarantineRun({ db, runId: 'run_1', actorId: 'usr_1', requestId: 'req_1' });
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'quarantined')).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });
});
