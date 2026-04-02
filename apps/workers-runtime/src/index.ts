import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { handleIntake as orchestrateIntake } from '@intent-os/runtime-core/orchestration';

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  RUN_STATE: DurableObjectNamespace;
  APPROVAL_QUEUE: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/intake') {
      return handleIntake(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleIntake(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json() as Record<string, unknown>;
  const { template_id, inputs, tenant_id, workspace_id, actor_id } = body;

  if (!template_id || !tenant_id || !workspace_id || !actor_id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await orchestrateIntake(env.DB, env.ARTIFACTS, {
    template_id: template_id as string,
    inputs: (inputs as Record<string, unknown>) || {},
    tenant_id: tenant_id as string,
    workspace_id: workspace_id as string,
    actor_id: actor_id as string,
  });

  return new Response(JSON.stringify({
    ok: true,
    data: result,
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
