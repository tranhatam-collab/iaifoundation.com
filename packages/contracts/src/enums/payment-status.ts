export const PAYMENT_STATUS = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  PAYOUT_SENT: 'payout_sent',
  SETTLED: 'settled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  RECONCILIATION_PENDING: 'reconciliation_pending',
  RECONCILIATION_MISMATCH: 'reconciliation_mismatch',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
