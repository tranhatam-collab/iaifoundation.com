import { describe, expect, test } from 'vitest';
import {
  findTenantById,
  findTenantBySlug,
  insertTenant,
  updateTenantStatus,
} from '../packages/db/src/repositories/tenants.repo.js';
import {
  findRunById,
  findRunsByTenantWorkspace,
  insertRun,
  updateRunStatus,
  appendRunEvent,
} from '../packages/db/src/repositories/runs.repo.js';
import {
  findPaymentIntentById,
  findPaymentIntentsByRunId,
  insertPaymentIntent,
  updatePaymentIntentStatus,
  insertSettlement,
} from '../packages/db/src/repositories/payments.repo.js';
import {
  findDeviceById,
  findDevicesByWorkspace,
  insertDevice,
  updateDeviceStatus,
  insertDeviceCommand,
  insertDeviceEvent,
} from '../packages/db/src/repositories/devices.repo.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('tenants repository', () => {
  test('findTenantById queries by id', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'ten_1' }) });
    await expect(findTenantById(db, 'ten_1')).resolves.toEqual({ id: 'ten_1' });
    expect(calls[0].sql).toContain('WHERE id = ?');
    expect(calls[0].params).toEqual(['ten_1']);
  });

  test('findTenantBySlug queries by slug', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    await expect(findTenantBySlug(db, 'acme')).resolves.toBeNull();
    expect(calls[0].sql).toContain('WHERE slug = ?');
  });

  test('insertTenant coalesces optional fields to null', async () => {
    const { db, calls } = makeFakeD1();
    await insertTenant(db, { id: 'ten_1', type: 'org', name: 'Acme', slug: 'acme', created_at: 'c', updated_at: 'u' });
    expect(calls[0].sql).toContain('INSERT INTO tenants');
    expect(calls[0].params[3]).toBe('acme');
    expect(calls[0].params[4]).toBeNull();
    expect(calls[0].params[8]).toBe('c');
  });

  test('updateTenantStatus writes status and timestamp', async () => {
    const { db, calls } = makeFakeD1();
    await updateTenantStatus(db, 'ten_1', 'suspended', 'u2');
    expect(calls[0].sql).toContain('UPDATE tenants SET status = ?');
    expect(calls[0].params).toEqual(['suspended', 'u2', 'ten_1']);
  });
});

describe('runs repository', () => {
  test('findRunById queries by id', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'run_1' }) });
    await expect(findRunById(db, 'run_1')).resolves.toEqual({ id: 'run_1' });
    expect(calls[0].params).toEqual(['run_1']);
  });

  test('findRunsByTenantWorkspace applies status, cursor, and pagination', async () => {
    const rows = [
      { id: 'r1', created_at: '2026-01-03' },
      { id: 'r2', created_at: '2026-01-02' },
      { id: 'r3', created_at: '2026-01-01' },
    ];
    const { db, calls } = makeFakeD1({ all: () => ({ results: rows }) });
    const result = await findRunsByTenantWorkspace(db, 't1', 'ws1', 'running', 'c1', 2);
    expect(calls[0].sql).toContain('AND status = ?');
    expect(calls[0].sql).toContain('AND created_at < ?');
    expect(calls[0].params).toEqual(['t1', 'ws1', 'running', 'c1', 3]);
    expect(result.items).toHaveLength(2);
    expect(result.next_cursor).toBe('2026-01-02');
  });

  test('insertRun coalesces optional fields and writes nulls for lifecycle timestamps', async () => {
    const { db, calls } = makeFakeD1();
    await insertRun(db, {
      id: 'run_1',
      tenant_id: 't1',
      workspace_id: 'ws1',
      intent_instance_id: 'ii_1',
      status: 'created',
      created_by_actor_id: 'usr_1',
      created_at: 'c',
      updated_at: 'u',
    });
    expect(calls[0].sql).toContain('INSERT INTO runs');
    expect(calls[0].params[4]).toBeNull(); // template_id
    expect(calls[0].params[7]).toBe('created'); // status
  });

  test('updateRunStatus writes status and timestamp', async () => {
    const { db, calls } = makeFakeD1();
    await updateRunStatus(db, 'run_1', 'failed', 'u2');
    expect(calls[0].sql).toContain('UPDATE runs SET status = ?');
    expect(calls[0].params).toEqual(['failed', 'u2', 'run_1']);
  });

  test('appendRunEvent coalesces optional refs to null', async () => {
    const { db, calls } = makeFakeD1();
    await appendRunEvent(db, {
      id: 'evt_1',
      run_id: 'run_1',
      event_type: 'run.created',
      event_time: 't',
      sequence_no: 1,
    });
    expect(calls[0].sql).toContain('INSERT INTO run_events');
    expect(calls[0].params[2]).toBeNull(); // step_id
    expect(calls[0].params[4]).toBeNull(); // payload_ref
  });
});

describe('payments repository', () => {
  test('findPaymentIntentById and findPaymentIntentsByRunId query correctly', async () => {
    const byId = makeFakeD1({ first: () => ({ id: 'pi_1' }) });
    await expect(findPaymentIntentById(byId.db, 'pi_1')).resolves.toEqual({ id: 'pi_1' });
    expect(byId.calls[0].sql).toContain('WHERE id = ?');

    const byRun = makeFakeD1({ all: () => ({ results: [{ id: 'pi_1' }] }) });
    await expect(findPaymentIntentsByRunId(byRun.db, 'run_1')).resolves.toEqual([{ id: 'pi_1' }]);
    expect(byRun.calls[0].sql).toContain('WHERE run_id = ?');
  });

  test('insertPaymentIntent coalesces funding_source_id to null', async () => {
    const { db, calls } = makeFakeD1();
    await insertPaymentIntent(db, {
      id: 'pi_1',
      run_id: 'run_1',
      step_id: 'stp_1',
      payment_type: 'payout',
      amount: 100,
      currency_or_asset: 'USD',
      beneficiary_id: 'ben_1',
      status: 'created',
      created_at: 'c',
      updated_at: 'u',
    });
    expect(calls[0].sql).toContain('INSERT INTO payment_intents');
    expect(calls[0].params[7]).toBeNull(); // funding_source_id
  });

  test('updatePaymentIntentStatus writes status', async () => {
    const { db, calls } = makeFakeD1();
    await updatePaymentIntentStatus(db, 'pi_1', 'settled', 'u');
    expect(calls[0].sql).toContain('UPDATE payment_intents SET status = ?');
    expect(calls[0].params).toEqual(['settled', 'u', 'pi_1']);
  });

  test('insertSettlement coalesces optional fields', async () => {
    const { db, calls } = makeFakeD1();
    await insertSettlement(db, {
      id: 'stl_1',
      payment_intent_id: 'pi_1',
      provider: 'stripe',
      provider_txn_ref: 'txn_1',
      amount: 100,
      asset: 'USD',
      status: 'settled',
      created_at: 'c',
    });
    expect(calls[0].sql).toContain('INSERT INTO settlement_records');
    expect(calls[0].params[4]).toBeNull(); // network_ref
    expect(calls[0].params[8]).toBeNull(); // fee_amount
    expect(calls[0].params[9]).toBeNull(); // settled_at
  });
});

describe('devices repository', () => {
  test('findDeviceById queries by id', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'dev_1' }) });
    await expect(findDeviceById(db, 'dev_1')).resolves.toEqual({ id: 'dev_1' });
    expect(calls[0].params).toEqual(['dev_1']);
  });

  test('findDevicesByWorkspace applies an optional status filter', async () => {
    const { db, calls } = makeFakeD1({ all: () => ({ results: [] }) });
    await findDevicesByWorkspace(db, 'ws1', 'online');
    expect(calls[0].sql).toContain('AND status = ?');
    expect(calls[0].params).toEqual(['ws1', 'online']);
  });

  test('insertDevice coalesces optional fields to null', async () => {
    const { db, calls } = makeFakeD1();
    await insertDevice(db, {
      id: 'dev_1',
      tenant_id: 't1',
      workspace_id: 'ws1',
      gateway_id: 'gw_1',
      device_type: 'lock',
      status: 'offline',
      created_at: 'c',
      updated_at: 'u',
    });
    expect(calls[0].sql).toContain('INSERT INTO devices');
    expect(calls[0].params[5]).toBeNull(); // device_protocol
    expect(calls[0].params[12]).toBe('offline'); // status
    expect(calls[0].params[13]).toBe('c'); // created_at
  });

  test('updateDeviceStatus writes status', async () => {
    const { db, calls } = makeFakeD1();
    await updateDeviceStatus(db, 'dev_1', 'quarantined', 'u');
    expect(calls[0].sql).toContain('UPDATE devices SET status = ?');
    expect(calls[0].params).toEqual(['quarantined', 'u', 'dev_1']);
  });

  test('insertDeviceCommand coalesces optional refs', async () => {
    const { db, calls } = makeFakeD1();
    await insertDeviceCommand(db, {
      id: 'dc_1',
      device_id: 'dev_1',
      command_type: 'unlock',
      payload_json: '{}',
      issued_by_actor_id: 'usr_1',
      status: 'queued',
      requested_at: 't',
      idempotency_key: 'idem_1',
    });
    expect(calls[0].sql).toContain('INSERT INTO device_commands');
    expect(calls[0].params[1]).toBeNull(); // run_id
    expect(calls[0].params[2]).toBeNull(); // step_id
    expect(calls[0].params[7]).toBeNull(); // policy_decision_ref
  });

  test('insertDeviceEvent coalesces optional fields', async () => {
    const { db, calls } = makeFakeD1();
    await insertDeviceEvent(db, {
      id: 'de_1',
      device_id: 'dev_1',
      gateway_id: 'gw_1',
      event_type: 'state',
      event_time: 't',
      ingested_at: 'i',
    });
    expect(calls[0].sql).toContain('INSERT INTO device_events');
    expect(calls[0].params[4]).toBeNull(); // raw_payload_ref
    expect(calls[0].params[7]).toBeNull(); // trust_score
    expect(calls[0].params[9]).toBeNull(); // dedupe_key
  });
});
