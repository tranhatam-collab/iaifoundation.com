import type { DeviceGatewayAdapter } from '../payment-adapter.js';

export interface MatterConfig {
  fabricId: string;
  nodeId: string;
  commissioningData: string;
}

export class MatterAdapter implements DeviceGatewayAdapter {
  private config: MatterConfig;

  constructor(config: MatterConfig) {
    this.config = config;
  }

  async discoverDevices(): Promise<Array<{ id: string; type: string; status: string }>> {
    // TODO: Implement Matter device discovery via Thread/Wi-Fi
    return [];
  }

  async sendCommand(params: {
    device_id: string;
    command_type: string;
    payload: Record<string, unknown>;
    idempotency_key: string;
  }): Promise<{ command_id: string; acknowledged: boolean }> {
    // TODO: Send Matter cluster command to device
    return {
      command_id: `matter_cmd_${params.idempotency_key.slice(0, 12)}`,
      acknowledged: true,
    };
  }

  async getState(deviceId: string): Promise<{ status: string; last_seen: string; state_json: string }> {
    // TODO: Read Matter attributes from device
    return {
      status: 'online',
      last_seen: new Date().toISOString(),
      state_json: '{}',
    };
  }

  normalizeEvent(raw: Record<string, unknown>): Record<string, unknown> {
    return {
      event_type: raw.ClusterId ? `matter.${raw.ClusterId}.${raw.CommandId}` : 'unknown',
      device_id: raw.NodeId || '',
      fabric_id: this.config.fabricId,
      timestamp: raw.Timestamp || new Date().toISOString(),
      data: raw.Attributes || raw.Payload || {},
    };
  }
}
