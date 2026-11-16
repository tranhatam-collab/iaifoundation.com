import { describe, expect, test } from 'vitest';
import { approveRunService, rejectRunService, listApprovalsService } from '../apps/api/src/modules/approvals/approvals.service.js';
import { handleGetMe, handleLogin } from '../apps/api/src/modules/auth/auth.controller.js';
import { createDeviceService, sendDeviceCommandService, quarantineDeviceService } from '../apps/api/src/modules/devices/devices.service.js';
import { createPaymentIntentService, authorizePaymentService, capturePaymentService } from '../apps/api/src/modules/payments/payments.service.js';
import { evaluatePolicyService } from '../apps/api/src/modules/policy-packs/policy-evaluate.service.js';
import { createPolicyPackService, publishPolicyPackService } from '../apps/api/src/modules/policy-packs/policy-packs.service.js';
import { createRoleBindingService, listRolesService } from '../apps/api/src/modules/roles/roles.service.js';
import { cancelRunService, retryRunService } from '../apps/api/src/modules/runs/run-actions.service.js';
import { executeIntentService } from '../apps/api/src/modules/runs/runs.service.js';
import { createTemplateService, publishTemplateService } from '../apps/api/src/modules/templates/templates.service.js';
import { recordUsage, getUsageSummary } from '../apps/api/src/modules/usage-billing/usage-billing.service.js';
import { createWalletProfileService, createBeneficiaryService } from '../apps/api/src/modules/wallet-profiles/wallet-profiles.service.js';
import { createWorkspaceService, listWorkspacesService } from '../apps/api/src/modules/workspaces/workspaces.service.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('approvals service', () => {
  test('approveRunService throws when the approval is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(approveRunService(db, 'run_1', 'apr_1', 'usr_1', 'req_1', 'ok')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  test('approveRunService rejects an already-decided approval', async () => {
    const { db } = makeFakeD1({ first: () => ({ status: 'approved' }) });
    await expect(approveRunService(db, 'run_1', 'apr_1', 'usr_1', 'req_1', 'ok')).rejects.toMatchObject({
      code: 'APPROVAL_ALREADY_DECIDED',
    });
  });

  test('approveRunService updates and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ status: 'pending' }) });
    await approveRunService(db, 'run_1', 'apr_1', 'usr_1', 'req_1', 'ok');
    expect(calls.some((c) => c.sql.includes('UPDATE approval_requests SET status') && c.params[0] === 'approved')).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('rejectRunService updates and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ status: 'pending' }) });
    await rejectRunService(db, 'run_1', 'apr_1', 'usr_1', 'req_1', 'no');
    expect(calls.some((c) => c.sql.includes('UPDATE approval_requests SET status') && c.params[0] === 'rejected')).toBe(true);
  });

  test('listApprovalsService applies run and status filters', async () => {
    const { db, calls } = makeFakeD1({ all: () => ({ results: [{ id: 'apr_1' }] }) });
    await listApprovalsService(db, 'run_1', 'pending');
    expect(calls[0].sql).toContain('AND run_id = ?');
    expect(calls[0].sql).toContain('AND status = ?');
  });
});

describe('auth controller', () => {
  test('handleGetMe returns the auth context', async () => {
    const json = (body: unknown, status?: number) => ({ body, status });
    const c = { get: (k: string) => (k === 'auth' ? { userId: 'u1' } : 'req_1'), json } as never;
    const res = await handleGetMe(c);
    expect((res as any).body.data.userId).toBe('u1');
  });

  test('handleLogin returns 500 for a non-AppError failure', async () => {
    const json = (body: unknown, status?: number) => ({ body, status });
    const c = {
      req: { json: async () => ({ email: 'a@b.com' }) },
      get: () => 'req_1',
      env: { DB: {} },
      json,
    } as never;
    const res = await handleLogin(c);
    expect((res as any).status).toBe(503);
    expect((res as any).body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('devices service', () => {
  test('sendDeviceCommandService rejects a missing device', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(
      sendDeviceCommandService(db, { device_id: 'dev_1', command_type: 'unlock', payload_json: '{}', issued_by_actor_id: 'usr_1', idempotency_key: 'k' }, 'req_1'),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  test('sendDeviceCommandService rejects a quarantined device', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'dev_1', status: 'quarantined' }) });
    await expect(
      sendDeviceCommandService(db, { device_id: 'dev_1', command_type: 'unlock', payload_json: '{}', issued_by_actor_id: 'usr_1', idempotency_key: 'k' }, 'req_1'),
    ).rejects.toMatchObject({ code: 'DEVICE_QUARANTINED' });
  });

  test('sendDeviceCommandService enqueues a command and audits', async () => {
    const { db, calls } = makeFakeD1({
      first: () => ({ id: 'dev_1', status: 'online', tenant_id: 't1', workspace_id: 'ws1' }),
    });
    const result = await sendDeviceCommandService(db, { device_id: 'dev_1', command_type: 'unlock', payload_json: '{}', issued_by_actor_id: 'usr_1', idempotency_key: 'k' }, 'req_1');
    expect(result.accepted).toBe(true);
    expect(result.command_id).toMatch(/^cmd_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO device_commands'))).toBe(true);
  });

  test('quarantineDeviceService updates and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'dev_1', status: 'online', tenant_id: 't1', workspace_id: 'ws1' }) });
    await quarantineDeviceService(db, 'dev_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE devices SET status') && c.params[0] === 'quarantined')).toBe(true);
  });

  test('createDeviceService inserts and returns the device', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'dev_1', status: 'online' }) });
    const result = await createDeviceService(db, { tenant_id: 't1', workspace_id: 'ws1', gateway_id: 'gw_1', device_type: 'lock' }, 'usr_1', 'req_1');
    expect(result!.id).toBe('dev_1');
    expect(calls.some((c) => c.sql.includes('INSERT INTO devices'))).toBe(true);
  });
});

describe('payments service', () => {
  test('authorizePaymentService rejects a missing intent', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(authorizePaymentService(db, 'pay_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  test('authorizePaymentService rejects a non-created intent', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'pay_1', status: 'authorized' }) });
    await expect(authorizePaymentService(db, 'pay_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('authorizePaymentService authorizes and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'pay_1', status: 'created' }) });
    await authorizePaymentService(db, 'pay_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE payment_intents SET status') && c.params[0] === 'authorized')).toBe(true);
  });

  test('capturePaymentService rejects a non-authorized intent', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'pay_1', status: 'created' }) });
    await expect(capturePaymentService(db, 'pay_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('capturePaymentService captures and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'pay_1', status: 'authorized' }) });
    await capturePaymentService(db, 'pay_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE payment_intents SET status') && c.params[0] === 'captured')).toBe(true);
  });

  test('createPaymentIntentService inserts and returns the intent', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'pay_1', status: 'created' }) });
    const result = await createPaymentIntentService(
      db,
      { run_id: 'run_1', step_id: 'stp_1', payment_type: 'payout', amount: 100, currency_or_asset: 'USD', beneficiary_id: 'ben_1' },
      'usr_1',
      'req_1',
    );
    expect(result!.id).toBe('pay_1');
    expect(calls.some((c) => c.sql.includes('INSERT INTO payment_intents'))).toBe(true);
  });
});

describe('policy services', () => {
  test('evaluatePolicyService throws when the pack is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(
      evaluatePolicyService(db, { actor: { id: 'u', role: 'op' }, resource: { type: 'r', id: 'r1' }, action: 'x', context: {} }, 'pol_1', 'req_1'),
    ).rejects.toThrow('not found');
  });

  test('evaluatePolicyService evaluates and audits', async () => {
    const { db, calls } = makeFakeD1({
      first: () => ({
        id: 'pol_1',
        name: 'P',
        version: '1',
        policy_json: JSON.stringify([{ id: 'r1', action_pattern: '*', decision: 'deny', priority: 1 }]),
      }),
    });
    const result = await evaluatePolicyService(db, { actor: { id: 'u', role: 'op' }, resource: { type: 'r', id: 'r1' }, action: 'x', context: {} }, 'pol_1', 'req_1');
    expect(result.decision).toBe('deny');
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('createPolicyPackService rejects a duplicate', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'pol_existing' }) });
    await expect(createPolicyPackService(db, { tenant_id: 't1', name: 'P', version: '1', policy_json: '[]' }, 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createPolicyPackService inserts with a checksum', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    const result = await createPolicyPackService(db, { tenant_id: 't1', name: 'P', version: '1', policy_json: '[]' }, 'usr_1', 'req_1');
    expect(result.id).toMatch(/^pol_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO policy_packs'))).toBe(true);
  });

  test('publishPolicyPackService rejects a non-approved pack', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'pol_1', status: 'draft' }) });
    await expect(publishPolicyPackService(db, 'pol_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('publishPolicyPackService publishes an approved pack', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'pol_1', status: 'approved', tenant_id: 't1', workspace_id: null }) });
    await publishPolicyPackService(db, 'pol_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE policy_packs SET status') && c.params[0] === 'published')).toBe(true);
  });
});

describe('roles service', () => {
  test('createRoleBindingService requires user_id or agent_id', async () => {
    const { db } = makeFakeD1();
    await expect(createRoleBindingService(db, { tenant_id: 't1', role_id: 'role_1' }, 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createRoleBindingService inserts and audits', async () => {
    const { db, calls } = makeFakeD1();
    const result = await createRoleBindingService(db, { tenant_id: 't1', role_id: 'role_1', user_id: 'usr_2' }, 'usr_1', 'req_1');
    expect(result.id).toMatch(/^rb_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO role_bindings'))).toBe(true);
  });

  test('listRolesService applies an optional workspace filter', async () => {
    const { db, calls } = makeFakeD1({ all: () => ({ results: [] }) });
    await listRolesService(db, 't1', 'ws1');
    expect(calls[0].sql).toContain('workspace_id');
  });
});

describe('run-actions service', () => {
  test('cancelRunService rejects a terminal run', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'run_1', status: 'succeeded' }) });
    await expect(cancelRunService(db, 'run_1', 'usr_1', 'req_1', 'because')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('cancelRunService cancels and audits', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'run_1', status: 'running', tenant_id: 't1', workspace_id: 'ws1' }) });
    await cancelRunService(db, 'run_1', 'usr_1', 'req_1', 'because');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'cancelled')).toBe(true);
  });

  test('retryRunService rejects a non-failed run', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'run_1', status: 'running' }) });
    await expect(retryRunService(db, 'run_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('retryRunService retries a failed run', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'run_1', status: 'failed', tenant_id: 't1', workspace_id: 'ws1' }) });
    await retryRunService(db, 'run_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE runs SET status') && c.params[0] === 'running')).toBe(true);
  });
});

describe('runs service', () => {
  test('executeIntentService returns the run id and initial status', async () => {
    const { db } = makeFakeD1({
      first: (sql) => (sql.includes('SELECT status FROM runs') ? { status: 'failed' } : null),
      all: () => ({ results: [] }),
    });
    const result = await executeIntentService(
      db,
      {} as never,
      { tenant_id: 't1', workspace_id: 'ws1', template_id: 'tpl_1', inputs: {}, actor_id: 'usr_1' },
      'req_1',
    );
    expect(result.run_id).toMatch(/^run_/);
    expect(result.initial_status).toBe('failed');
  });
});

describe('templates service', () => {
  test('createTemplateService rejects a duplicate', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'tpl_existing' }) });
    await expect(
      createTemplateService(db, { name: 'T', slug: 'pay', intent_category: 'payment', version: '1', manifest_json: '{}' }, 'usr_1', 'req_1'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createTemplateService inserts and returns the template', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    const result = await createTemplateService(db, { name: 'T', slug: 'pay', intent_category: 'payment', version: '1', manifest_json: '{}' }, 'usr_1', 'req_1');
    expect(result.id).toMatch(/^tpl_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO intent_templates'))).toBe(true);
  });

  test('publishTemplateService rejects a non-approved template', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'tpl_1', status: 'draft' }) });
    await expect(publishTemplateService(db, 'tpl_1', 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('publishTemplateService publishes an approved template', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'tpl_1', status: 'approved', tenant_id: null, workspace_id: null }) });
    await publishTemplateService(db, 'tpl_1', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE intent_templates SET status') && c.params[0] === 'published')).toBe(true);
  });
});

describe('usage-billing service', () => {
  test('recordUsage increments an existing meter', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'meter_1', meter_key: 'k' }) });
    await recordUsage(db, 't1', 'ws1', 'k', 2);
    expect(calls.some((c) => c.sql.includes('UPDATE usage_meters SET quantity'))).toBe(true);
  });

  test('recordUsage inserts a new meter', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    await recordUsage(db, 't1', 'ws1', 'k', 1);
    expect(calls.some((c) => c.sql.includes('INSERT INTO usage_meters'))).toBe(true);
  });

  test('getUsageSummary returns the rows', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ meter_key: 'k' }] }) });
    await expect(getUsageSummary(db, 't1', 'ws1')).resolves.toEqual([{ meter_key: 'k' }]);
  });
});

describe('wallet-profiles service', () => {
  test('createWalletProfileService inserts and returns the profile', async () => {
    const { db, calls } = makeFakeD1();
    const result = await createWalletProfileService(
      db,
      { tenant_id: 't1', workspace_id: 'ws1', wallet_type: 'fiat', provider: 'stripe', custody_mode: 'api', supported_assets: ['USD'] },
      'usr_1',
      'req_1',
    );
    expect(result.id).toMatch(/^wal_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO wallet_profiles'))).toBe(true);
  });

  test('createBeneficiaryService inserts and returns the beneficiary', async () => {
    const { db, calls } = makeFakeD1();
    const result = await createBeneficiaryService(db, { tenant_id: 't1', type: 'vendor', name: 'Acme' }, 'usr_1', 'req_1');
    expect(result.id).toMatch(/^ben_/);
    expect(result.verification_status).toBe('pending');
    expect(calls.some((c) => c.sql.includes('INSERT INTO beneficiaries'))).toBe(true);
  });
});

describe('workspaces service', () => {
  test('createWorkspaceService rejects a duplicate slug', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'wrk_existing' }) });
    await expect(createWorkspaceService(db, { tenant_id: 't1', name: 'W', slug: 'w' }, 'usr_1', 'req_1')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createWorkspaceService inserts and returns the workspace', async () => {
    const { db, calls } = makeFakeD1({ first: () => null });
    const result = await createWorkspaceService(db, { tenant_id: 't1', name: 'W', slug: 'w' }, 'usr_1', 'req_1');
    expect(result.id).toMatch(/^wrk_/);
    expect(calls.some((c) => c.sql.includes('INSERT INTO workspaces'))).toBe(true);
  });

  test('listWorkspacesService returns rows', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ id: 'wrk_1' }] }) });
    await expect(listWorkspacesService(db, 't1')).resolves.toEqual([{ id: 'wrk_1' }]);
  });
});
