import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { handleIntake as orchestrateIntake } from '@intent-os/runtime-core/orchestration';

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  RUN_STATE: DurableObjectNamespace;
  APPROVAL_QUEUE: DurableObjectNamespace;
  ENVIRONMENT?: string;
  RUNTIME_WORKER_MODE?: string;
  DEV_BEARER_TOKEN?: string;
}

const MAX_INTAKE_BYTES = 262_144;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const isExplicitLocalDev = env.ENVIRONMENT === 'development'
      && env.RUNTIME_WORKER_MODE === 'unsafe-local-development';
    if (!isExplicitLocalDev) {
      return jsonResponse({
        ok: false,
        error: 'Runtime execution is disabled in the public foundation project',
      }, 503);
    }

    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!env.DEV_BEARER_TOKEN || !timingSafeEqual(token, env.DEV_BEARER_TOKEN)) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);

    if (url.pathname === '/intake') {
      return handleIntake(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleIntake(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_INTAKE_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_INTAKE_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload' }, 400);
  }
  const { template_id, inputs, tenant_id, workspace_id, actor_id } = body;

  if (!template_id || !tenant_id || !workspace_id || !actor_id) {
    return jsonResponse({ ok: false, error: 'Missing required fields' }, 400);
  }

  const result = await orchestrateIntake(env.DB, env.ARTIFACTS, {
    template_id: template_id as string,
    inputs: (inputs as Record<string, unknown>) || {},
    tenant_id: tenant_id as string,
    workspace_id: workspace_id as string,
    actor_id: actor_id as string,
  });

  return jsonResponse({
    ok: true,
    data: result,
  }, 201);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function jsonResponse(payload: Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
