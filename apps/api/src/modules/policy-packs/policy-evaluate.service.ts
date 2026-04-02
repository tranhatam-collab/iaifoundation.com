import { evaluatePolicy as evaluatePolicyCore, type PolicyPack } from '@intent-os/policy-engine/evaluator';
import type { PolicyEvaluateRequest, PolicyEvaluateResponse } from '@intent-os/contracts/domains';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';
import type { D1Database } from '@cloudflare/workers-types';

export async function evaluatePolicyService(
  db: D1Database,
  input: PolicyEvaluateRequest,
  policyPackId: string,
  requestId: string,
): Promise<PolicyEvaluateResponse> {
  const packRow = await db.prepare(
    'SELECT * FROM policy_packs WHERE id = ? AND status = ?'
  ).bind(policyPackId, 'published').first();

  if (!packRow) {
    throw new Error(`Published policy pack ${policyPackId} not found`);
  }

  const p = packRow as any;
  const policyPack: PolicyPack = {
    id: p.id,
    name: p.name,
    version: p.version,
    rules: JSON.parse(p.policy_json),
  };

  const result = evaluatePolicyCore(policyPack, input);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: input.actor.id,
    action_type: 'policy.evaluated',
    resource_type: 'policy_pack',
    resource_id: policyPackId,
    before_json: null,
    after_json: JSON.stringify({ decision: result.decision, action: input.action }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return result;
}
