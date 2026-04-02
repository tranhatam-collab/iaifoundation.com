export const RUN_STATUS = {
  CREATED: 'created',
  RESOLVED: 'resolved',
  PLANNED: 'planned',
  RUNNING: 'running',
  AWAITING_APPROVAL: 'awaiting_approval',
  WAITING_EXTERNAL: 'waiting_external',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  QUARANTINED: 'quarantined',
} as const;

export type RunStatus = (typeof RUN_STATUS)[keyof typeof RUN_STATUS];
