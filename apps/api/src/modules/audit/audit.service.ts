import type { D1Database } from '@cloudflare/workers-types';

export interface AuditQueryParams {
  tenant_id?: string;
  workspace_id?: string;
  actor_id?: string;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export async function queryAuditEvents(db: D1Database, params: AuditQueryParams): Promise<{ items: any[]; next_cursor: string | null }> {
  let sql = 'SELECT * FROM audit_events WHERE 1=1';
  const queryParams: unknown[] = [];

  if (params.tenant_id) { sql += ' AND tenant_id = ?'; queryParams.push(params.tenant_id); }
  if (params.workspace_id) { sql += ' AND workspace_id = ?'; queryParams.push(params.workspace_id); }
  if (params.actor_id) { sql += ' AND actor_id = ?'; queryParams.push(params.actor_id); }
  if (params.action_type) { sql += ' AND action_type = ?'; queryParams.push(params.action_type); }
  if (params.resource_type) { sql += ' AND resource_type = ?'; queryParams.push(params.resource_type); }
  if (params.resource_id) { sql += ' AND resource_id = ?'; queryParams.push(params.resource_id); }
  if (params.from) { sql += ' AND created_at >= ?'; queryParams.push(params.from); }
  if (params.to) { sql += ' AND created_at <= ?'; queryParams.push(params.to); }
  if (params.cursor) { sql += ' AND created_at < ?'; queryParams.push(params.cursor); }

  const limit = params.limit || 50;
  sql += ' ORDER BY created_at DESC LIMIT ?';
  queryParams.push(limit + 1);

  const result = await db.prepare(sql).bind(...queryParams).all();
  const items = result.results || [];

  if (items.length > limit) {
    items.pop();
    return { items, next_cursor: (items[items.length - 1] as any)?.created_at || null };
  }

  return { items, next_cursor: null };
}
