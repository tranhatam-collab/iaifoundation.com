export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  QUARANTINED: 'quarantined',
  DEGRADED: 'degraded',
  DISABLED: 'disabled',
} as const;

export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];
