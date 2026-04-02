export function normalizePaymentEvent(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    event_type: raw.type || 'unknown',
    provider: raw.provider || 'unknown',
    provider_txn_ref: raw.id || raw.transaction_id || '',
    amount: raw.amount || 0,
    currency: raw.currency || raw.asset || '',
    status: mapPaymentStatus(raw.status),
    timestamp: raw.created || raw.timestamp || new Date().toISOString(),
    raw_ref: null,
  };
}

export function normalizeDeviceEvent(raw: Record<string, unknown>): Record<string, unknown> {
  const data = (raw.data && typeof raw.data === 'object') ? (raw.data as Record<string, unknown>) : {};
  return {
    event_type: raw.type || raw.event || 'unknown',
    device_id: raw.device_id || raw.deviceId || '',
    gateway_id: raw.gateway_id || raw.gatewayId || '',
    state: raw.state || data.state || null,
    timestamp: raw.timestamp || raw.ts || new Date().toISOString(),
    trust_score: raw.trust_score || 0.5,
    raw_ref: null,
  };
}

export function normalizeProofArtifact(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    proof_type: raw.type || 'document',
    source_type: raw.source || 'upload',
    mime_type: raw.mime_type || raw.content_type || 'application/octet-stream',
    size_bytes: raw.size || raw.size_bytes || 0,
    checksum: raw.checksum || raw.hash || null,
    timestamp: raw.timestamp || new Date().toISOString(),
  };
}

function mapPaymentStatus(rawStatus: unknown): string {
  const statusMap: Record<string, string> = {
    succeeded: 'settled',
    completed: 'settled',
    pending: 'pending',
    processing: 'pending',
    failed: 'failed',
    refunded: 'refunded',
    canceled: 'cancelled',
  };
  return statusMap[String(rawStatus)] || 'unknown';
}
