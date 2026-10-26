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
    throw new Error('MQTT discovery is not implemented');
  }

  async sendCommand(params: {
    device_id: string;
    command_type: string;
    payload: Record<string, unknown>;
    idempotency_key: string;
  }): Promise<{ command_id: string; acknowledged: boolean }> {
    throw new Error('MQTT commands are not implemented');
  }

  async getState(deviceId: string): Promise<{ status: string; last_seen: string; state_json: string }> {
    throw new Error('MQTT state reads are not implemented');
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
