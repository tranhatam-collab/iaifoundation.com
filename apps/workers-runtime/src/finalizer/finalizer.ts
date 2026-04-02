import type { D1Database } from '@cloudflare/workers-types';
import { RUN_STATUS } from '@intent-os/contracts/enums';

export async function finalizeRun(
  db: D1Database,
  runId: string,
  finalStatus: typeof RUN_STATUS[keyof typeof RUN_STATUS],
): Promise<void> {
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE runs SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?
  `).bind(finalStatus, now, now, runId).run();

  await db.prepare(`
    INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
    SELECT
      'evt_' || hex(randomblob(8)),
      ?,
      NULL,
      CASE ?
        WHEN 'succeeded' THEN 'run.succeeded'
        WHEN 'failed' THEN 'run.failed'
        WHEN 'cancelled' THEN 'run.cancelled'
        WHEN 'quarantined' THEN 'run.quarantined'
        ELSE 'run.state_changed'
      END,
      NULL,
      ?,
      COALESCE((SELECT MAX(sequence_no) FROM run_events WHERE run_id = ?), 0) + 1
  `).bind(runId, finalStatus, now, runId).run();
}
