import type { Env } from '../index.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey: string;
}

export async function sendEmail(env: Env, opts: SendEmailOptions): Promise<void> {
  if (!env.MAIL_API_KEY) return;
  await fetch(`${env.MAIL_API_BASE_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MAIL_API_KEY}`,
      'X-Workspace-Id': env.MAIL_API_WORKSPACE_ID ?? 'iaifoundation.com',
    },
    body: JSON.stringify({
      to: opts.to,
      from: env.EMAIL_FROM,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      message_idempotency_key: opts.idempotencyKey,
    }),
  });
}
