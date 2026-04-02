import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateTemplateInput {
  tenant_id?: string;
  workspace_id?: string;
  name: string;
  slug: string;
  intent_category: string;
  version: string;
  manifest_json: string;
  ui_schema_json?: string;
  policy_requirements_json?: string;
  proof_requirements_json?: string;
}

export async function createTemplateService(
  db: D1Database,
  input: CreateTemplateInput,
  actorId: string,
  requestId: string,
) {
  const existing = await db.prepare(
    'SELECT id FROM intent_templates WHERE tenant_id = ? AND workspace_id = ? AND slug = ? AND version = ?'
  ).bind(input.tenant_id || null, input.workspace_id || null, input.slug, input.version).first();

  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Template with this slug and version already exists');
  }

  const id = `tpl_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO intent_templates (id, tenant_id, workspace_id, name, slug, intent_category, version, manifest_json, ui_schema_json, policy_requirements_json, proof_requirements_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
  `).bind(id, input.tenant_id || null, input.workspace_id || null, input.name, input.slug, input.intent_category, input.version, input.manifest_json, input.ui_schema_json || null, input.policy_requirements_json || null, input.proof_requirements_json || null, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id || null,
    workspace_id: input.workspace_id || null,
    actor_id: actorId,
    action_type: 'template.created',
    resource_type: 'intent_template',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ name: input.name, slug: input.slug, version: input.version }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, name: input.name, slug: input.slug, version: input.version, status: 'draft' };
}

export async function publishTemplateService(
  db: D1Database,
  templateId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const template = await db.prepare('SELECT * FROM intent_templates WHERE id = ?').bind(templateId).first();
  if (!template) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Template not found');
  }

  const t = template as any;
  if (t.status !== 'approved') {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot publish template in status: ${t.status}. Must be approved first.`);
  }

  await db.prepare('UPDATE intent_templates SET status = ?, updated_at = ? WHERE id = ?')
    .bind('published', new Date().toISOString(), templateId).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: t.tenant_id,
    workspace_id: t.workspace_id,
    actor_id: actorId,
    action_type: 'template.published',
    resource_type: 'intent_template',
    resource_id: templateId,
    before_json: JSON.stringify({ status: t.status }),
    after_json: JSON.stringify({ status: 'published' }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
