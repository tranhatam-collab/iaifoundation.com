import { Hono } from 'hono';
import type { Env } from '../index.js';
import type { AuthContext } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { tenantScopeMiddleware } from '../middleware/tenant-scope.js';
import { workspaceScopeMiddleware } from '../middleware/workspace-scope.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { okResponse } from '../common/response/envelope.js';
import { handleLogin, handleLogout, handleGetMe } from '../modules/auth/auth.controller.js';
import { createTenantService } from '../modules/tenants/tenants.service.js';
import { createWorkspaceService, listWorkspacesService } from '../modules/workspaces/workspaces.service.js';
import { createRoleBindingService, listRolesService } from '../modules/roles/roles.service.js';
import { createPolicyPackService, publishPolicyPackService } from '../modules/policy-packs/policy-packs.service.js';
import { evaluatePolicyService } from '../modules/policy-packs/policy-evaluate.service.js';
import { createTemplateService, publishTemplateService } from '../modules/templates/templates.service.js';
import { createConnectorService, testConnectorService } from '../modules/connectors/connectors.service.js';
import { executeIntentService } from '../modules/runs/runs.service.js';
import { cancelRunService, retryRunService } from '../modules/runs/run-actions.service.js';
import { approveRunService, rejectRunService } from '../modules/approvals/approvals.service.js';
import { createPaymentIntentService, authorizePaymentService, capturePaymentService } from '../modules/payments/payments.service.js';
import { createDeviceService, sendDeviceCommandService, quarantineDeviceService } from '../modules/devices/devices.service.js';
import { createWalletProfileService, createBeneficiaryService } from '../modules/wallet-profiles/wallet-profiles.service.js';
import { createGatewayService, testGatewayService } from '../modules/gateways/gateways.service.js';
import { getUsageSummary } from '../modules/usage-billing/usage-billing.service.js';

const v1 = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

// Public auth route
v1.post('/auth/login', handleLogin);

// Protected routes
v1.use('*', authMiddleware);
v1.use('*', tenantScopeMiddleware);
v1.use('*', workspaceScopeMiddleware);

// Auth
v1.post('/auth/logout', handleLogout);
v1.get('/auth/me', handleGetMe);

// Tenants
v1.get('/tenants', (c) => {
  const auth = c.get('auth');
  return c.json(okResponse({ tenant_id: auth.tenantId }, c.get('requestId') || ''));
});
v1.post('/tenants', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createTenantService(c.env.DB, body, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});

// Workspaces
v1.get('/workspaces', async (c) => {
  const auth = c.get('auth');
  const items = await listWorkspacesService(c.env.DB, auth.tenantId);
  return c.json(okResponse({ items, next_cursor: null }, c.get('requestId') || ''));
});
v1.post('/workspaces', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createWorkspaceService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});

// Roles
v1.get('/roles', async (c) => {
  const auth = c.get('auth');
  const items = await listRolesService(c.env.DB, auth.tenantId, auth.workspaceIds[0]);
  return c.json(okResponse({ items, next_cursor: null }, c.get('requestId') || ''));
});
v1.post('/role-bindings', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createRoleBindingService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.delete('/role-bindings/:id', (c) => c.json(okResponse({ deleted: true }, c.get('requestId') || '')));

// Policy
v1.get('/policy-packs', (c) => c.json(okResponse({ items: [], next_cursor: null }, c.get('requestId') || '')));
v1.post('/policy-packs', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createPolicyPackService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/policy-evaluate', async (c) => {
  const body = await c.req.json();
  const result = await evaluatePolicyService(c.env.DB, body, body.policy_pack_id, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''));
});
v1.post('/policy-publish', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  await publishPolicyPackService(c.env.DB, body.policy_pack_id, auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ published: true }, c.get('requestId') || ''));
});

// Templates
v1.get('/templates', (c) => c.json(okResponse({ items: [], next_cursor: null }, c.get('requestId') || '')));
v1.post('/templates', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createTemplateService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.patch('/templates/:id', (c) => c.json(okResponse({ updated: true }, c.get('requestId') || '')));
v1.post('/templates/:id/publish', async (c) => {
  const auth = c.get('auth');
  await publishTemplateService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ published: true }, c.get('requestId') || ''));
});

// Connectors
v1.get('/connectors', (c) => c.json(okResponse({ items: [], next_cursor: null }, c.get('requestId') || '')));
v1.post('/connectors', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createConnectorService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/connectors/:id/test', async (c) => {
  const result = await testConnectorService(c.env.DB, c.req.param('id'));
  return c.json(okResponse(result, c.get('requestId') || ''));
});
v1.patch('/connectors/:id', (c) => c.json(okResponse({ updated: true }, c.get('requestId') || '')));

// Runtime
v1.post('/intents/execute', idempotencyMiddleware, async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await executeIntentService(
    c.env.DB,
    c.env.ARTIFACTS,
    {
      tenant_id: auth.tenantId,
      workspace_id: auth.workspaceIds[0] || '',
      template_id: body.template_id,
      inputs: body.inputs || {},
      actor_id: auth.userId,
      mode: body.mode || 'template_driven',
    },
    c.get('requestId') || '',
  );
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.get('/runs', (c) => c.json(okResponse({ items: [], next_cursor: null }, c.get('requestId') || '')));
v1.get('/runs/:id', (c) => c.json(okResponse({ id: c.req.param('id'), status: 'running' }, c.get('requestId') || '')));
v1.get('/runs/:id/events', (c) => c.json(okResponse({ items: [], next_cursor: null }, c.get('requestId') || '')));
v1.get('/runs/:id/trace', (c) => c.json(okResponse({ steps: [] }, c.get('requestId') || '')));
v1.post('/runs/:id/cancel', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();
  await cancelRunService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '', body.reason || '');
  return c.json(okResponse({ cancelled: true }, c.get('requestId') || ''));
});
v1.post('/runs/:id/retry', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  await retryRunService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ retried: true }, c.get('requestId') || ''));
});
v1.post('/runs/:id/approve', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();
  await approveRunService(c.env.DB, body.run_id, body.approval_id, auth.userId, c.get('requestId') || '', body.reason || '');
  return c.json(okResponse({ approved: true }, c.get('requestId') || ''));
});
v1.post('/runs/:id/reject', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();
  await rejectRunService(c.env.DB, body.run_id, body.approval_id, auth.userId, c.get('requestId') || '', body.reason || '');
  return c.json(okResponse({ rejected: true }, c.get('requestId') || ''));
});

// Payments
v1.post('/payments/intents', idempotencyMiddleware, async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createPaymentIntentService(c.env.DB, body, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/payments/intents/:id/authorize', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  await authorizePaymentService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ authorized: true }, c.get('requestId') || ''));
});
v1.post('/payments/intents/:id/capture', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  await capturePaymentService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ captured: true }, c.get('requestId') || ''));
});

// Devices
v1.post('/gateways', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createGatewayService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/devices', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createDeviceService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/devices/:id/commands', idempotencyMiddleware, async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await sendDeviceCommandService(c.env.DB, { ...body, issued_by_actor_id: auth.userId }, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/devices/:id/quarantine', idempotencyMiddleware, async (c) => {
  const auth = c.get('auth');
  await quarantineDeviceService(c.env.DB, c.req.param('id'), auth.userId, c.get('requestId') || '');
  return c.json(okResponse({ quarantined: true }, c.get('requestId') || ''));
});

// Wallets + beneficiaries
v1.post('/beneficiaries', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createBeneficiaryService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});
v1.post('/wallet-profiles', async (c) => {
  const body = await c.req.json();
  const auth = c.get('auth');
  const result = await createWalletProfileService(c.env.DB, { ...body, tenant_id: auth.tenantId }, auth.userId, c.get('requestId') || '');
  return c.json(okResponse(result, c.get('requestId') || ''), 201);
});

// Usage
v1.get('/usage', async (c) => {
  const auth = c.get('auth');
  const meters = await getUsageSummary(c.env.DB, auth.tenantId, auth.workspaceIds[0] || '');
  return c.json(okResponse({ meters }, c.get('requestId') || ''));
});

// Placeholder webhook routes (should be moved to connectors worker route)
v1.post('/webhooks/payments/:provider', (c) => c.json(okResponse({ received: true }, c.get('requestId') || '')));
v1.post('/webhooks/connectors/:id', (c) => c.json(okResponse({ received: true }, c.get('requestId') || '')));
v1.post('/webhooks/device/:gateway_id', (c) => c.json(okResponse({ received: true }, c.get('requestId') || '')));

export default v1;
