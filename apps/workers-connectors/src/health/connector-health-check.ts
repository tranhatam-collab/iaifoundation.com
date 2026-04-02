import type { D1Database } from '@cloudflare/workers-types';

export interface ConnectorHealthResult {
  connector_id: string;
  provider: string;
  health_status: 'healthy' | 'degraded' | 'failing' | 'disabled' | 'unknown';
  latency_ms: number;
  last_checked_at: string;
  quota_remaining?: number;
  error_message?: string;
}

export async function checkConnectorHealth(
  db: D1Database,
  connectorId: string,
  checkFn: () => Promise<{ latency_ms: number; success: boolean; error?: string }>,
): Promise<ConnectorHealthResult> {
  const connector = await db.prepare(
    'SELECT * FROM connectors WHERE id = ?'
  ).bind(connectorId).first();

  if (!connector) {
    throw new Error(`Connector ${connectorId} not found`);
  }

  const c = connector as any;
  let result: ConnectorHealthResult;

  try {
    const check = await checkFn();
    const healthStatus = check.success ? 'healthy' : 'failing';

    result = {
      connector_id: connectorId,
      provider: c.provider,
      health_status: healthStatus,
      latency_ms: check.latency_ms,
      last_checked_at: new Date().toISOString(),
      error_message: check.error,
    };
  } catch (error) {
    result = {
      connector_id: connectorId,
      provider: c.provider,
      health_status: 'failing',
      latency_ms: 0,
      last_checked_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  await db.prepare(`
    UPDATE connectors SET health_status = ?, last_checked_at = ?, updated_at = ? WHERE id = ?
  `).bind(result.health_status, result.last_checked_at, new Date().toISOString(), connectorId).run();

  return result;
}

export async function checkAllConnectorsHealth(
  db: D1Database,
  checkFn: (connectorId: string) => Promise<ConnectorHealthResult>,
): Promise<ConnectorHealthResult[]> {
  const connectors = await db.prepare(
    "SELECT id FROM connectors WHERE status != 'disabled'"
  ).all();

  const results: ConnectorHealthResult[] = [];
  for (const row of (connectors.results || [])) {
    const r = row as { id: string };
    try {
      results.push(await checkFn(r.id));
    } catch {
      results.push({
        connector_id: r.id,
        provider: 'unknown',
        health_status: 'failing',
        latency_ms: 0,
        last_checked_at: new Date().toISOString(),
        error_message: 'Health check failed',
      });
    }
  }

  return results;
}
