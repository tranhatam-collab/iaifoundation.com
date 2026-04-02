import type { RunRow } from '@intent-os/db/repositories/runs.repo';

export interface RunListItemDto {
  id: string;
  template_name: string | null;
  status: string;
  created_by: string;
  started_at: string | null;
  duration_ms: number | null;
  approval_state: string;
  tenant_id: string;
  workspace_id: string;
}

export interface RunDetailDto {
  run: {
    id: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    created_by_actor_id: string;
    created_at: string;
    updated_at: string;
  };
  template: {
    id: string | null;
    name: string | null;
    version: string | null;
  };
  summary: {
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    pending_approvals: number;
    linked_payments: number;
    linked_proofs: number;
    linked_devices: number;
  };
  steps: Array<{
    id: string;
    name: string;
    type: string;
    state: string;
    order: number;
    attempts: number;
  }>;
  approvals: Array<{
    id: string;
    status: string;
    requested_at: string;
    expires_at: string | null;
    approver: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    beneficiary: string;
  }>;
  proofs: Array<{
    id: string;
    type: string;
    validation_status: string;
    confidence: number | null;
  }>;
}

export function mapRunListItem(row: RunRow, templateName?: string): RunListItemDto {
  return {
    id: row.id,
    template_name: templateName || null,
    status: row.status,
    created_by: row.created_by_actor_id,
    started_at: row.started_at,
    duration_ms: row.started_at && row.ended_at
      ? new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()
      : null,
    approval_state: 'none',
    tenant_id: row.tenant_id,
    workspace_id: row.workspace_id,
  };
}
