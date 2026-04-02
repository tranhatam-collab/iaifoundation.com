import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export interface RunResolverResult {
  template: Record<string, unknown>;
  policyPack: Record<string, unknown>;
  actor: { id: string; roles: string[] };
  linkedResources: Record<string, unknown>;
}

export async function resolveRunContext(
  db: D1Database,
  templateId: string,
  actorId: string,
  inputs: Record<string, unknown>,
): Promise<RunResolverResult> {
  const template = await db.prepare(
    'SELECT * FROM intent_templates WHERE id = ? AND status = ?'
  ).bind(templateId, 'published').first();

  if (!template) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, `Published template ${templateId} not found`);
  }

  const t = template as any;

  const policyPack = await db.prepare(
    'SELECT * FROM policy_packs WHERE tenant_id = ? AND workspace_id = ? AND status = ? ORDER BY published_at DESC LIMIT 1'
  ).bind(t.tenant_id, t.workspace_id, 'published').first();

  const actorRoles = await db.prepare(`
    SELECT r.role_key FROM role_bindings rb
    JOIN roles r ON rb.role_id = r.id
    WHERE rb.user_id = ? AND (rb.workspace_id = ? OR rb.workspace_id IS NULL)
  `).bind(actorId, t.workspace_id).all();

  const roles = ((actorRoles.results || []) as Array<{ role_key: string }>).map(r => r.role_key);

  const linkedResources: Record<string, unknown> = {};
  if (inputs.supplier_id) {
    const beneficiary = await db.prepare(
      'SELECT * FROM beneficiaries WHERE id = ?'
    ).bind(inputs.supplier_id as string).first();
    if (beneficiary) linkedResources.beneficiary = beneficiary;
  }

  return {
    template: t,
    policyPack: policyPack || {},
    actor: { id: actorId, roles },
    linkedResources,
  };
}
