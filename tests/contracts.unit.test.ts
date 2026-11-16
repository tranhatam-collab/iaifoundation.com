import { describe, expect, test } from 'vitest';
import { AppError, ERROR_CODES } from '../packages/contracts/src/api/errors.js';
import {
  RUN_STATUSES,
  isValidTransition,
  getValidTransitions,
  isTerminalState,
} from '../packages/contracts/src/enums/run-state-machine.js';
import { RUN_STATUS } from '../packages/contracts/src/enums/run-status.js';
import { STEP_STATUS } from '../packages/contracts/src/enums/step-status.js';
import { POLICY_DECISION } from '../packages/contracts/src/enums/policy-decision.js';
import { PAYMENT_STATUS } from '../packages/contracts/src/enums/payment-status.js';
import { DEVICE_STATUS } from '../packages/contracts/src/enums/device-status.js';
import {
  RUN_EVENTS,
  APPROVAL_EVENTS,
  PAYMENT_EVENTS,
  DEVICE_EVENTS,
  PROOF_EVENTS,
} from '../packages/contracts/src/events/runtime-events.js';

describe('AppError / ERROR_CODES', () => {
  test('carries code, message, details, and httpStatus', () => {
    const err = new AppError(ERROR_CODES.POLICY_DENIED, 'blocked', { rule: 'r1' }, 403);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
    expect(err.code).toBe('POLICY_DENIED');
    expect(err.message).toBe('blocked');
    expect(err.details).toEqual({ rule: 'r1' });
    expect(err.httpStatus).toBe(403);
  });

  test('defaults httpStatus to 400', () => {
    const err = new AppError(ERROR_CODES.VALIDATION_ERROR, 'bad input');
    expect(err.httpStatus).toBe(400);
  });

  test('exposes the full expected error code surface', () => {
    expect(ERROR_CODES).toMatchObject({
      UNAUTHORIZED: 'UNAUTHORIZED',
      FORBIDDEN: 'FORBIDDEN',
      TENANT_SCOPE_MISMATCH: 'TENANT_SCOPE_MISMATCH',
      RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      POLICY_DENIED: 'POLICY_DENIED',
      APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
      IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
      CONNECTOR_UNAVAILABLE: 'CONNECTOR_UNAVAILABLE',
      RATE_LIMITED: 'RATE_LIMITED',
      INTERNAL_ERROR: 'INTERNAL_ERROR',
      RUN_STATE_INVALID: 'RUN_STATE_INVALID',
      DEVICE_QUARANTINED: 'DEVICE_QUARANTINED',
      PAYMENT_PROVIDER_DEGRADED: 'PAYMENT_PROVIDER_DEGRADED',
      APPROVAL_ALREADY_DECIDED: 'APPROVAL_ALREADY_DECIDED',
    });
  });
});

describe('run status constants', () => {
  test('RUN_STATUS and RUN_STATUSES agree on canonical values', () => {
    expect(RUN_STATUS.CREATED).toBe('created');
    expect(RUN_STATUS.SUCCEEDED).toBe('succeeded');
    expect(RUN_STATUSES.SUCCEEDED).toBe('succeeded');
    expect(Object.values(RUN_STATUS).sort()).toEqual(Object.values(RUN_STATUSES).sort());
  });
});

describe('run state machine', () => {
  test('allows created -> resolved and created -> failed', () => {
    expect(isValidTransition(RUN_STATUSES.CREATED, RUN_STATUSES.RESOLVED)).toBe(true);
    expect(isValidTransition(RUN_STATUSES.CREATED, RUN_STATUSES.FAILED)).toBe(true);
  });

  test('rejects illegal transitions and unknown states', () => {
    expect(isValidTransition(RUN_STATUSES.CREATED, RUN_STATUSES.SUCCEEDED)).toBe(false);
    expect(isValidTransition(RUN_STATUSES.SUCCEEDED, RUN_STATUSES.RUNNING)).toBe(false);
    expect(isValidTransition('nonsense' as never, RUN_STATUSES.RUNNING)).toBe(false);
  });

  test('getValidTransitions returns the full transition set', () => {
    expect(getValidTransitions(RUN_STATUSES.RUNNING)).toEqual([
      RUN_STATUSES.AWAITING_APPROVAL,
      RUN_STATUSES.WAITING_EXTERNAL,
      RUN_STATUSES.SUCCEEDED,
      RUN_STATUSES.FAILED,
    ]);
    expect(getValidTransitions(RUN_STATUSES.SUCCEEDED)).toEqual([]);
    expect(getValidTransitions('nonsense' as never)).toEqual([]);
  });

  test('isTerminalState is true only for terminal states', () => {
    expect(isTerminalState(RUN_STATUSES.SUCCEEDED)).toBe(true);
    expect(isTerminalState(RUN_STATUSES.FAILED)).toBe(true);
    expect(isTerminalState(RUN_STATUSES.CANCELLED)).toBe(true);
    expect(isTerminalState(RUN_STATUSES.RUNNING)).toBe(false);
    expect(isTerminalState(RUN_STATUSES.QUARANTINED)).toBe(false);
  });
});

describe('domain enums', () => {
  test('STEP_STATUS covers all runtime step states', () => {
    expect(STEP_STATUS).toEqual({
      PENDING: 'pending',
      RUNNING: 'running',
      SUCCEEDED: 'succeeded',
      FAILED: 'failed',
      SKIPPED: 'skipped',
      WAITING_APPROVAL: 'waiting_approval',
      WAITING_EXTERNAL: 'waiting_external',
      RETRYING: 'retrying',
    });
  });

  test('POLICY_DECISION covers the full decision ladder', () => {
    expect(POLICY_DECISION.ALLOW).toBe('allow');
    expect(POLICY_DECISION.DENY).toBe('deny');
    expect(POLICY_DECISION.ALLOW_WITH_APPROVAL).toBe('allow_with_approval');
    expect(POLICY_DECISION.ALLOW_WITH_LIMITS).toBe('allow_with_limits');
    expect(POLICY_DECISION.QUARANTINE).toBe('quarantine');
  });

  test('PAYMENT_STATUS and DEVICE_STATUS expose canonical states', () => {
    expect(PAYMENT_STATUS.SETTLED).toBe('settled');
    expect(PAYMENT_STATUS.RECONCILIATION_MISMATCH).toBe('reconciliation_mismatch');
    expect(DEVICE_STATUS.ONLINE).toBe('online');
    expect(DEVICE_STATUS.QUARANTINED).toBe('quarantined');
  });
});

describe('event constants', () => {
  test('runtime, approval, payment, device, and proof events are stable', () => {
    expect(RUN_EVENTS.CREATED).toBe('run.created');
    expect(RUN_EVENTS.FAILED).toBe('run.failed');
    expect(APPROVAL_EVENTS.REQUESTED).toBe('approval.requested');
    expect(PAYMENT_EVENTS.PAYOUT_SENT).toBe('payment.payout_sent');
    expect(DEVICE_EVENTS.COMMAND_ACKNOWLEDGED).toBe('device.command_acknowledged');
    expect(PROOF_EVENTS.VERIFIED).toBe('proof.verified');
  });
});
