import type { D1Database } from '@cloudflare/workers-types';
import { findTenantById, findTenantBySlug, insertTenant, updateTenantStatus, type TenantRow } from '@intent-os/db/repositories/tenants.repo';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateTenantInput {
  type: string;
  name: string;
  slug: string;
  owner_user_id?: string;
  timezone?: string;
  locale?: string;
  country_code?: string;
}

export async function createTenantService(
  db: D1Database,
  input: CreateTenantInput,
  actorId: string,
  requestId: string,
): Promise<TenantRow> {
  const existing = await findTenantBySlug(db, input.slug);
  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Tenant slug already exists');
  }

  const now = new Date().toISOString();
  const id = `ten_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  await insertTenant(db, {
    id,
    type: input.type,
    name: input.name,
    slug: input.slug,
    owner_user_id: input.owner_user_id,
    timezone: input.timezone,
    locale: input.locale,
    country_code: input.country_code,
    created_at: now,
    updated_at: now,
  });

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: id,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'tenant.created',
    resource_type: 'tenant',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify(input),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  const tenant = await findTenantById(db, id);
  if (!tenant) throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Failed to retrieve created tenant');

  return tenant;
}

export async function getTenantService(db: D1Database, id: string): Promise<TenantRow> {
  const tenant = await findTenantById(db, id);
  if (!tenant) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Tenant not found');
  }
  return tenant;
}

export async function updateTenantStatusService(
  db: D1Database,
  id: string,
  status: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const existing = await findTenantById(db, id);
  if (!existing) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Tenant not found');
  }

  const now = new Date().toISOString();
  await updateTenantStatus(db, id, status, now);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: id,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'tenant.status_updated',
    resource_type: 'tenant',
    resource_id: id,
    before_json: JSON.stringify({ status: existing.status }),
    after_json: JSON.stringify({ status }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
