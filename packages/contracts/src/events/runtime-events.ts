export const RUN_EVENTS = {
  CREATED: 'run.created',
  STATE_CHANGED: 'run.state_changed',
  STEP_STARTED: 'run.step_started',
  STEP_COMPLETED: 'run.step_completed',
  STEP_FAILED: 'run.step_failed',
  SUCCEEDED: 'run.succeeded',
  FAILED: 'run.failed',
  CANCELLED: 'run.cancelled',
  QUARANTINED: 'run.quarantined',
} as const;

export const APPROVAL_EVENTS = {
  REQUESTED: 'approval.requested',
  APPROVED: 'approval.approved',
  REJECTED: 'approval.rejected',
  EXPIRED: 'approval.expired',
} as const;

export const PAYMENT_EVENTS = {
  INTENT_CREATED: 'payment.intent_created',
  AUTHORIZED: 'payment.authorized',
  CAPTURED: 'payment.captured',
  PAYOUT_SENT: 'payment.payout_sent',
  SETTLED: 'payment.settled',
  FAILED: 'payment.failed',
  RECONCILIATION_COMPLETED: 'payment.reconciliation_completed',
} as const;

export const DEVICE_EVENTS = {
  COMMAND_SENT: 'device.command_sent',
  COMMAND_ACKNOWLEDGED: 'device.command_acknowledged',
  COMMAND_COMPLETED: 'device.command_completed',
  COMMAND_FAILED: 'device.command_failed',
  STATE_CONFIRMED: 'device.state.confirmed',
  QUARANTINED: 'device.quarantined',
} as const;

export const PROOF_EVENTS = {
  CREATED: 'proof.created',
  VERIFIED: 'proof.verified',
  REJECTED: 'proof.rejected',
} as const;
