import type { D1Database } from '@cloudflare/workers-types';

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
  _db: D1Database,
  _input: NotificationInput,
  _actorId: string,
  _requestId: string,
): Promise<string> {
  throw new Error('Notification delivery is not implemented in the public foundation project');
}
