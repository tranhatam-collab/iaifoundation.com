import { describe, expect, test } from 'vitest';
import { createAuditEvent, emitAuditEvent } from '../packages/audit-sdk/src/emit.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

const base = {
  tenant_id: 'tenant_1',
  workspace_id: 'ws_1',
  actor_id: 'usr_1',
  action_type: 'run.created',
  resource_type: 'run',
  resource_id: 'run_1',
  before_json: null,
  after_json: null,
  reason: null,
  request_id: 'req_1',
  source_ip: null,
  session_id: null,
};

describe('audit-sdk', () => {
  test('createAuditEvent stamps an aud_ id and ISO timestamp', () => {
    const event = createAuditEvent(base);
    expect(event.id).toMatch(/^aud_[0-9a-f]{16}$/);
    expect(Number.isNaN(Date.parse(event.created_at))).toBe(false);
    expect(event.action_type).toBe('run.created');
  });

  test('emitAuditEvent inserts all columns in order', async () => {
    const { db, calls } = makeFakeD1();
    const event = createAuditEvent(base);

    await emitAuditEvent(db, event);

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('INSERT INTO audit_events');
    expect(calls[0].params).toHaveLength(14);
    expect(calls[0].params[0]).toBe(event.id);
    expect(calls[0].params[4]).toBe('run.created');
    expect(calls[0].params[5]).toBe('run');
  });
});
