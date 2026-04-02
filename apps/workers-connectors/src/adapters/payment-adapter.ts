export interface PaymentProviderAdapter {
  createTransfer(params: {
    amount: number;
    currency: string;
    beneficiary_id: string;
    idempotency_key: string;
  }): Promise<{ transfer_id: string; status: string }>;
  getTransferStatus(transferId: string): Promise<{ status: string; settled_at?: string; fee?: number }>;
  refundTransfer(transferId: string, amount: number): Promise<{ refund_id: string; status: string }>;
  verifyWebhook(payload: string, signature: string): Promise<boolean>;
}

export interface DeviceGatewayAdapter {
  discoverDevices(): Promise<Array<{ id: string; type: string; status: string }>>;
  sendCommand(params: {
    device_id: string;
    command_type: string;
    payload: Record<string, unknown>;
    idempotency_key: string;
  }): Promise<{ command_id: string; acknowledged: boolean }>;
  getState(deviceId: string): Promise<{ status: string; last_seen: string; state_json: string }>;
  normalizeEvent(raw: Record<string, unknown>): Record<string, unknown>;
}
