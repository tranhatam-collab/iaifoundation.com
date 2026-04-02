import type { D1Database } from '@cloudflare/workers-types';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface NotificationInput {
  tenant_id: string;
  workspace_id: string;
  channel: 'email' | 'webhook' | 'sms';
  recipient: string;
  subject: string;
  body: string;
  run_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export async function sendNotification(
  db: D1Database,
  input: NotificationInput,
  actorId: string,
  requestId: string,
): Promise<string> {
  const id = `notif_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  // TODO: Implement actual notification delivery via provider
  // - Email: SendGrid, AWS SES
  // - Webhook: POST to configured endpoint
  // - SMS: Twilio

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: input.tenant_id,
    workspace_id: input.workspace_id,
    actor_id: actorId,
    action_type: 'notification.sent',
    resource_type: 'notification',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify({ channel: input.channel, recipient: input.recipient, subject: input.subject }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return id;
}
