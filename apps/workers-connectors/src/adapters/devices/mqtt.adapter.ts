import type { DeviceGatewayAdapter } from '../payment-adapter.js';

export interface MqttConfig {
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
  caCert?: string;
}

export class MqttAdapter implements DeviceGatewayAdapter {
  private config: MqttConfig;

  constructor(config: MqttConfig) {
    this.config = config;
  }

  async discoverDevices(): Promise<Array<{ id: string; type: string; status: string }>> {
    // TODO: Discover MQTT devices via topic scanning
    return [];
  }

  async sendCommand(params: {
    device_id: string;
    command_type: string;
    payload: Record<string, unknown>;
    idempotency_key: string;
  }): Promise<{ command_id: string; acknowledged: boolean }> {
    // TODO: Publish command to MQTT topic
    // Topic: devices/{device_id}/commands/{command_type}
    return {
      command_id: `mqtt_cmd_${params.idempotency_key.slice(0, 12)}`,
      acknowledged: true,
    };
  }

  async getState(deviceId: string): Promise<{ status: string; last_seen: string; state_json: string }> {
    // TODO: Get last retained state from MQTT topic
    return {
      status: 'online',
      last_seen: new Date().toISOString(),
      state_json: '{}',
    };
  }

  normalizeEvent(raw: Record<string, unknown>): Record<string, unknown> {
    return {
      event_type: raw.topic ? `mqtt.${raw.topic}` : 'unknown',
      device_id: raw.device_id || raw.clientId || '',
      timestamp: raw.timestamp || new Date().toISOString(),
      qos: raw.qos || 0,
      retained: raw.retained || false,
      data: raw.payload || {},
    };
  }
}
