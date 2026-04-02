import type { D1Database } from '@cloudflare/workers-types';

export interface EventBusContext {
  db: D1Database;
  queue?: any;
}

export async function publishEvent(
  ctx: EventBusContext,
  eventType: string,
  payload: Record<string, unknown>,
  runId?: string,
  stepId?: string,
): Promise<string> {
  const id = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  if (runId) {
    const seqResult = await ctx.db.prepare(
      'SELECT COALESCE(MAX(sequence_no), 0) as max_seq FROM run_events WHERE run_id = ?'
    ).bind(runId).first<{ max_seq: number }>();

    const nextSeq = (seqResult?.max_seq || 0) + 1;

    const payloadRef = `events/${runId}/${id}.json`;

    await ctx.db.prepare(`
      INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, runId, stepId || null, eventType, payloadRef, now, nextSeq).run();
  }

  if (ctx.queue) {
    await ctx.queue.send({ event_type: eventType, payload, run_id: runId, step_id: stepId, event_id: id });
  }

  return id;
}
