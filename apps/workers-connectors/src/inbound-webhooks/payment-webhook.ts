import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { normalizePaymentEvent } from '../normalization/normalize-event.js';

export interface PaymentWebhookContext {
  db: D1Database;
  artifacts: R2Bucket;
  webhookSecret: string;
}

const MAX_WEBHOOK_BYTES = 1_048_576;
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

export async function handlePaymentWebhook(
  ctx: PaymentWebhookContext,
  provider: string,
  request: Request,
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }
  const signature = request.headers.get('X-Webhook-Signature') || request.headers.get('Stripe-Signature') || '';

  if (!await verifyWebhookSignature(rawBody, signature, ctx.webhookSecret, provider)) {
    return jsonResponse({ ok: false, error: 'Invalid webhook signature' }, 401);
  }

  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload' }, 400);
  }
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

  return jsonResponse({ ok: true });
}

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  provider: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  // Stripe uses format: t=timestamp,v1=signature
  if (provider === 'stripe') {
    const parts = signatureHeader.split(',').map((part) => part.trim());
    const tsPart = parts.find((p) => p.startsWith('t='));
    const signatures = parts.filter((p) => p.startsWith('v1=')).map((part) => part.slice(3));
    if (!tsPart || signatures.length === 0) return false;

    const timestamp = Number(tsPart.slice(2));
    if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
      return false;
    }
    const expected = await hmacSha256(`${timestamp}.${rawBody}`, secret);
    return signatures.some((provided) => safeEqual(expected, provided));
  }

  // Generic HMAC-SHA256 for other providers
  const expected = await hmacSha256(rawBody, secret);
  return safeEqual(expected, signatureHeader);
}

export async function hmacSha256(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function jsonResponse(payload: Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
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
