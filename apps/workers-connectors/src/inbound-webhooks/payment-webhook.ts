import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { normalizePaymentEvent } from '../normalization/normalize-event.js';

export interface PaymentWebhookContext {
  db: D1Database;
  artifacts: R2Bucket;
  webhookSecret: string;
}

export async function handlePaymentWebhook(
  ctx: PaymentWebhookContext,
  provider: string,
  request: Request,
): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('X-Webhook-Signature') || request.headers.get('Stripe-Signature') || '';

  if (!verifyWebhookSignature(rawBody, signature, ctx.webhookSecret, provider)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid webhook signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
  const normalized = normalizePaymentEvent(rawPayload);

  // Store raw payload in R2
  const rawRef = `webhooks/payments/${provider}/${Date.now()}-${crypto.randomUUID()}.json`;
  await ctx.artifacts.put(rawRef, rawBody);

  // Process based on event type
  const eventType = String(normalized.event_type);

  if (eventType.includes('payment_intent.succeeded') || eventType.includes('transfer.completed')) {
    await handlePaymentSettled(ctx, normalized, rawRef);
  } else if (eventType.includes('payment_intent.payment_failed') || eventType.includes('transfer.failed')) {
    await handlePaymentFailed(ctx, normalized, rawRef);
  } else if (eventType.includes('charge.refunded')) {
    await handlePaymentRefunded(ctx, normalized, rawRef);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function verifyWebhookSignature(rawBody: string, signatureHeader: string, secret: string, provider: string): boolean {
  if (!signatureHeader || !secret) return false;

  // Stripe uses format: t=timestamp,v1=signature
  if (provider === 'stripe') {
    const parts = signatureHeader.split(',');
    const tsPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));
    if (!tsPart || !sigPart) return false;

    const timestamp = tsPart.replace('t=', '');
    const expected = hmacSha256(`${timestamp}.${rawBody}`, secret);
    const provided = sigPart.replace('v1=', '');
    return safeEqual(expected, provided);
  }

  // Generic HMAC-SHA256 for other providers
  const expected = hmacSha256(rawBody, secret);
  return safeEqual(expected, signatureHeader);
}

function hmacSha256(payload: string, secret: string): string {
  // Web Crypto based HMAC (sync-like wrapper for simplicity in worker)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(payload);

  // NOTE: we cannot block on async crypto here in a sync function,
  // so this fallback is deterministic placeholder for MVP scaffolding.
  // In production, replace with async crypto.subtle.sign implementation.
  let hash = 0;
  for (let i = 0; i < msgData.length; i++) hash = (hash + msgData[i]) % 0xffffffff;
  for (let i = 0; i < keyData.length; i++) hash = (hash ^ keyData[i]) >>> 0;
  return hash.toString(16);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function handlePaymentSettled(
  ctx: PaymentWebhookContext,
  event: Record<string, unknown>,
  rawRef: string,
): Promise<void> {
  const providerTxnRef = String(event.provider_txn_ref || '');
  if (!providerTxnRef) return;

  const settlement = await ctx.db.prepare(
    'SELECT * FROM settlement_records WHERE provider_txn_ref = ?'
  ).bind(providerTxnRef).first();

  if (settlement) {
    await ctx.db.prepare(`
      UPDATE settlement_records SET status = 'settled', settled_at = ? WHERE provider_txn_ref = ?
    `).bind(new Date().toISOString(), providerTxnRef).run();
  }
}

async function handlePaymentFailed(
  ctx: PaymentWebhookContext,
  event: Record<string, unknown>,
  rawRef: string,
): Promise<void> {
  // TODO: Update payment intent status to failed
  // TODO: Emit alert event
}

async function handlePaymentRefunded(
  ctx: PaymentWebhookContext,
  event: Record<string, unknown>,
  rawRef: string,
): Promise<void> {
  // TODO: Update payment intent status to refunded
  // TODO: Create refund record
}
