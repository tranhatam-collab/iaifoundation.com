import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface LoginInput {
  email: string;
  password_or_assertion: string;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  tenant_id: string;
  workspace_ids: string[];
}

export async function loginService(
  _db: D1Database,
  _input: LoginInput,
  _requestId: string,
): Promise<LoginResult> {
  throw new AppError(
    ERROR_CODES.UNAUTHORIZED,
    'Interactive authentication is not implemented in the public foundation project',
    undefined,
    503,
  );
}

export async function logoutService(
  db: D1Database,
  userId: string,
  requestId: string,
): Promise<void> {
  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: userId,
    action_type: 'auth.logout',
    resource_type: 'user',
    resource_id: userId,
    before_json: null,
    after_json: null,
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
