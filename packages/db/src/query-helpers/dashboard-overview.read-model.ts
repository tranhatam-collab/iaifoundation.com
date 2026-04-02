import type { D1Database } from '@cloudflare/workers-types';

export interface DashboardOverview {
  runs: {
    active: number;
    stuck_count: number;
    succeeded_today: number;
    failed_today: number;
  };
  approvals: {
    pending: number;
    overdue: number;
  };
  payments: {
    failure_rate_24h: number;
    pending_reconciliation: number;
  };
  devices: {
    offline: number;
    quarantined: number;
  };
  proofs: {
    rejection_rate: number;
  };
  connectors: {
    degraded_count: number;
  };
  usage: {
    plan: string;
    current_period_usage: number;
    limit: number;
  };
}

export async function getDashboardOverview(
  db: D1Database,
  tenantId: string,
  workspaceId: string,
): Promise<DashboardOverview> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const overdueThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    activeRuns,
    succeededToday,
    failedToday,
    pendingApprovals,
    overdueApprovals,
    failedPayments24h,
    pendingReconciliation,
    offlineDevices,
    quarantinedDevices,
    degradedConnectors,
  ] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM runs WHERE tenant_id = ? AND workspace_id = ? AND status IN ('running', 'awaiting_approval', 'waiting_external')").bind(tenantId, workspaceId).first(),
    db.prepare("SELECT COUNT(*) as count FROM runs WHERE tenant_id = ? AND workspace_id = ? AND status = 'succeeded' AND created_at >= ?").bind(tenantId, workspaceId, todayStart).first(),
    db.prepare("SELECT COUNT(*) as count FROM runs WHERE tenant_id = ? AND workspace_id = ? AND status = 'failed' AND created_at >= ?").bind(tenantId, workspaceId, todayStart).first(),
    db.prepare("SELECT COUNT(*) as count FROM approval_requests ar JOIN runs r ON ar.run_id = r.id WHERE r.tenant_id = ? AND r.workspace_id = ? AND ar.status = 'pending'").bind(tenantId, workspaceId).first(),
    db.prepare("SELECT COUNT(*) as count FROM approval_requests ar JOIN runs r ON ar.run_id = r.id WHERE r.tenant_id = ? AND r.workspace_id = ? AND ar.status = 'pending' AND ar.expires_at < ?").bind(tenantId, workspaceId, overdueThreshold).first(),
    db.prepare("SELECT COUNT(*) as count FROM payment_intents pi JOIN runs r ON pi.run_id = r.id WHERE r.tenant_id = ? AND r.workspace_id = ? AND pi.status = 'failed' AND pi.created_at >= ?").bind(tenantId, workspaceId, todayStart).first(),
    db.prepare("SELECT COUNT(*) as count FROM payment_reconciliations pr JOIN payment_intents pi ON pr.payment_intent_id = pi.id JOIN runs r ON pi.run_id = r.id WHERE r.tenant_id = ? AND r.workspace_id = ? AND pr.status = 'pending'").bind(tenantId, workspaceId).first(),
    db.prepare("SELECT COUNT(*) as count FROM devices WHERE workspace_id = ? AND status = 'offline'").bind(workspaceId).first(),
    db.prepare("SELECT COUNT(*) as count FROM devices WHERE workspace_id = ? AND status = 'quarantined'").bind(workspaceId).first(),
    db.prepare("SELECT COUNT(*) as count FROM connectors WHERE tenant_id = ? AND workspace_id = ? AND health_status = 'degraded'").bind(tenantId, workspaceId).first(),
  ]);

  return {
    runs: {
      active: (activeRuns as any)?.count || 0,
      stuck_count: 0,
      succeeded_today: (succeededToday as any)?.count || 0,
      failed_today: (failedToday as any)?.count || 0,
    },
    approvals: {
      pending: (pendingApprovals as any)?.count || 0,
      overdue: (overdueApprovals as any)?.count || 0,
    },
    payments: {
      failure_rate_24h: (failedPayments24h as any)?.count || 0,
      pending_reconciliation: (pendingReconciliation as any)?.count || 0,
    },
    devices: {
      offline: (offlineDevices as any)?.count || 0,
      quarantined: (quarantinedDevices as any)?.count || 0,
    },
    proofs: { rejection_rate: 0 },
    connectors: { degraded_count: (degradedConnectors as any)?.count || 0 },
    usage: { plan: 'free', current_period_usage: 0, limit: 1000 },
  };
}
