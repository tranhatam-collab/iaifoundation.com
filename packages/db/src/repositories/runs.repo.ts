import type { D1Database } from '@cloudflare/workers-types';
import { queryOne, queryMany, queryRun } from '../client.js';

export interface RunRow {
  id: string;
  tenant_id: string;
  workspace_id: string;
  intent_instance_id: string;
  template_id: string | null;
  policy_snapshot_id: string | null;
  planner_manifest_ref: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_by_actor_id: string;
  created_at: string;
  updated_at: string;
}

export async function findRunById(db: D1Database, id: string): Promise<RunRow | null> {
  return queryOne<RunRow>(db, 'SELECT * FROM runs WHERE id = ?', [id]);
}

export async function findRunsByTenantWorkspace(
  db: D1Database,
  tenantId: string,
  workspaceId: string,
  status?: string,
  cursor?: string,
  limit: number = 20,
): Promise<{ items: RunRow[]; next_cursor: string | null }> {
  let sql = 'SELECT * FROM runs WHERE tenant_id = ? AND workspace_id = ?';
  const params: unknown[] = [tenantId, workspaceId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (cursor) {
    sql += ' AND created_at < ?';
    params.push(cursor);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit + 1);

  const items = await queryMany<RunRow>(db, sql, params);

  if (items.length > limit) {
    items.pop();
    return { items, next_cursor: items[items.length - 1]?.created_at || null };
  }

  return { items, next_cursor: null };
}

export async function insertRun(db: D1Database, run: {
  id: string;
  tenant_id: string;
  workspace_id: string;
  intent_instance_id: string;
  template_id?: string;
  policy_snapshot_id?: string;
  planner_manifest_ref?: string;
  status: string;
  created_by_actor_id: string;
  created_at: string;
  updated_at: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO runs (id, tenant_id, workspace_id, intent_instance_id, template_id, policy_snapshot_id, planner_manifest_ref, status, started_at, ended_at, created_by_actor_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)
  `, [run.id, run.tenant_id, run.workspace_id, run.intent_instance_id, run.template_id || null, run.policy_snapshot_id || null, run.planner_manifest_ref || null, run.status, run.created_by_actor_id, run.created_at, run.updated_at]);
}

export async function updateRunStatus(db: D1Database, id: string, status: string, updated_at: string): Promise<D1Result> {
  return queryRun(db, 'UPDATE runs SET status = ?, updated_at = ? WHERE id = ?', [status, updated_at, id]);
}

export async function appendRunEvent(db: D1Database, event: {
  id: string;
  run_id: string;
  step_id?: string;
  event_type: string;
  payload_ref?: string;
  event_time: string;
  sequence_no: number;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO run_events (id, run_id, step_id, event_type, payload_ref, event_time, sequence_no)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [event.id, event.run_id, event.step_id || null, event.event_type, event.payload_ref || null, event.event_time, event.sequence_no]);
}
