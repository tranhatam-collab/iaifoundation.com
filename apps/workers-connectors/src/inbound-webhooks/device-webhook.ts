import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { normalizeDeviceEvent } from '../normalization/normalize-event.js';

export interface DeviceWebhookContext {
  db: D1Database;
  artifacts: R2Bucket;
}

export async function handleDeviceWebhook(
  ctx: DeviceWebhookContext,
  gatewayId: string,
  request: Request,
): Promise<Response> {
  const rawBody = await request.text();
  const rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
  const normalized = normalizeDeviceEvent(rawPayload);

  const rawRef = `webhooks/devices/${gatewayId}/${Date.now()}-${crypto.randomUUID()}.json`;
  await ctx.artifacts.put(rawRef, rawBody);

  const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const deviceId = String(normalized.device_id || '');
  const eventTime = String(normalized.timestamp || new Date().toISOString());

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

  return new Response(JSON.stringify({ ok: true, event_id: eventId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
