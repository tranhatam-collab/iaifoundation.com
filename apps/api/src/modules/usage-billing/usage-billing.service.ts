import type { D1Database } from '@cloudflare/workers-types';

export interface UsageMeter {
  id?: string;
  meter_key: string;
  quantity: number;
  period_start: string;
  period_end: string;
}

export async function recordUsage(
  db: D1Database,
  tenantId: string,
  workspaceId: string,
  meterKey: string,
  quantity: number = 1,
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const existing = await db.prepare(`
    SELECT * FROM usage_meters WHERE tenant_id = ? AND workspace_id = ? AND meter_key = ? AND period_start = ?
  `).bind(tenantId, workspaceId, meterKey, periodStart).first<UsageMeter>();

  if (existing) {
    await db.prepare(`
      UPDATE usage_meters SET quantity = quantity + ? WHERE id = ?
    `).bind(quantity, existing.id).run();
  } else {
    await db.prepare(`
      INSERT INTO usage_meters (id, tenant_id, workspace_id, meter_key, quantity, period_start, period_end, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `meter_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      tenantId,
      workspaceId,
      meterKey,
      quantity,
      periodStart,
      periodEnd,
      now.toISOString(),
    ).run();
  }
}

export async function getUsageSummary(db: D1Database, tenantId: string, workspaceId: string): Promise<UsageMeter[]> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const result = await db.prepare(`
    SELECT * FROM usage_meters WHERE tenant_id = ? AND workspace_id = ? AND period_start = ? ORDER BY meter_key ASC
  `).bind(tenantId, workspaceId, periodStart).all();

  return (result.results || []) as unknown as UsageMeter[];
}
