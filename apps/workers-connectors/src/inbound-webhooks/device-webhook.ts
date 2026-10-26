import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { normalizeDeviceEvent } from '../normalization/normalize-event.js';
import { hmacSha256 } from './payment-webhook.js';

export interface DeviceWebhookContext {
  db: D1Database;
  artifacts: R2Bucket;
  webhookSecret: string;
}

const MAX_WEBHOOK_BYTES = 1_048_576;

export async function handleDeviceWebhook(
  ctx: DeviceWebhookContext,
  gatewayId: string,
  request: Request,
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(gatewayId)) {
    return jsonResponse({ ok: false, error: 'Invalid gateway identifier' }, 400);
  }

  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return jsonResponse({ ok: false, error: 'Payload too large' }, 413);
  }

  const signature = request.headers.get('X-Webhook-Signature') || '';
  if (!signature || !ctx.webhookSecret) {
    return jsonResponse({ ok: false, error: 'Missing webhook signature' }, 401);
  }
  const expected = await hmacSha256(rawBody, ctx.webhookSecret);
  if (!timingSafeEqual(expected, signature)) {
    return jsonResponse({ ok: false, error: 'Invalid webhook signature' }, 401);
  }

  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload' }, 400);
  }
  const normalized = normalizeDeviceEvent(rawPayload);

  const rawRef = `webhooks/devices/${gatewayId}/${Date.now()}-${crypto.randomUUID()}.json`;
  await ctx.artifacts.put(rawRef, rawBody);

  const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const deviceId = String(normalized.device_id || '');
  const eventTime = String(normalized.timestamp || new Date().toISOString());
  if (!deviceId || String(normalized.event_type || 'unknown') === 'unknown') {
    return jsonResponse({ ok: false, error: 'device_id and event type are required' }, 400);
  }

  await ctx.db.prepare(`
    INSERT INTO device_events (id, device_id, gateway_id, event_type, raw_payload_ref, normalized_payload_json, event_time, trust_score, ingested_at, dedupe_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId,
    deviceId,
    gatewayId,
    String(normalized.event_type || 'unknown'),
    rawRef,
    JSON.stringify(normalized),
    eventTime,
    normalized.trust_score as number | null,
    new Date().toISOString(),
    `${deviceId}-${eventTime}-${normalized.event_type}`,
  ).run();

  await ctx.db.prepare(`
    UPDATE devices SET last_seen_at = ?, updated_at = ? WHERE id = ?
  `).bind(eventTime, new Date().toISOString(), deviceId).run();

  return jsonResponse({ ok: true, event_id: eventId });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function jsonResponse(payload: Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
