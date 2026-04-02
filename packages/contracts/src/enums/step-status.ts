export const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  WAITING_APPROVAL: 'waiting_approval',
  WAITING_EXTERNAL: 'waiting_external',
  RETRYING: 'retrying',
} as const;

export type StepStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS];
