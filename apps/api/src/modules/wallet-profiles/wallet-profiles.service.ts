import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreateWalletProfileInput {
  tenant_id: string;
  workspace_id: string;
  wallet_type: string;
  provider: string;
  custody_mode: string;
  supported_assets: string[];
  settlement_currency?: string;
}

export async function createWalletProfileService(
  db: D1Database,
  input: CreateWalletProfileInput,
  actorId: string,
  requestId: string,
) {
  const id = `wal_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO wallet_profiles (id, tenant_id, workspace_id, wallet_type, provider, custody_mode, supported_assets_json, settlement_currency, status, policy_profile_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?)
  `).bind(id, input.tenant_id, input.workspace_id, input.wallet_type, input.provider, input.custody_mode, JSON.stringify(input.supported_assets), input.settlement_currency || null, now, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id,
    actor_id: actorId,
    action_type: 'wallet_profile.created',
    resource_type: 'wallet_profile',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ type: input.wallet_type, provider: input.provider }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, ...input };
}

export interface CreateBeneficiaryInput {
  tenant_id: string;
  type: string;
  name: string;
  country_code?: string;
  payout_method_ref?: string;
  wallet_address_ref?: string;
}

export async function createBeneficiaryService(
  db: D1Database,
  input: CreateBeneficiaryInput,
  actorId: string,
  requestId: string,
) {
  const id = `ben_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO beneficiaries (id, tenant_id, type, name, country_code, payout_method_ref, wallet_address_ref, verification_status, risk_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
  `).bind(id, input.tenant_id, input.type, input.name, input.country_code || null, input.payout_method_ref || null, input.wallet_address_ref || null, now).run();

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'beneficiary.created',
    resource_type: 'beneficiary',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ name: input.name, type: input.type }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return { id, ...input, verification_status: 'pending' };
}
