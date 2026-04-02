export interface PolicyPack {
  id: string;
  tenant_id: string;
  workspace_id: string | null;
  name: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'deprecated' | 'archived';
  policy_json: string;
  checksum: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyEvaluateRequest {
  actor: { id: string; role: string };
  resource: { type: string; id: string };
  action: string;
  context: Record<string, unknown>;
}

export interface PolicyEvaluateResponse {
  decision: string;
  policy_pack_id: string;
  reason?: string;
  required_approvals?: number;
  limits?: Record<string, unknown>;
}
