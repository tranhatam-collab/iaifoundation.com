import { describe, expect, test } from 'vitest';
import { calculateRetryDelay, shouldRetry } from '../apps/workers-runtime/src/coordinator/retry-policy.js';
import { getTimeoutForStep, isTimedOut } from '../apps/workers-runtime/src/coordinator/timeout-policy.js';

describe('retry-policy', () => {
  test('calculateRetryDelay grows exponentially with attempt', () => {
    const policy = { max_attempts: 3, backoff_ms: 1000, backoff_multiplier: 2 };
    expect(calculateRetryDelay(1, policy)).toBe(1000);
    expect(calculateRetryDelay(2, policy)).toBe(2000);
    expect(calculateRetryDelay(3, policy)).toBe(4000);
  });

  test('calculateRetryDelay defaults the multiplier to 2', () => {
    expect(calculateRetryDelay(2, { max_attempts: 3, backoff_ms: 500 })).toBe(1000);
  });

  test('shouldRetry is true only before the final attempt', () => {
    const policy = { max_attempts: 3, backoff_ms: 1000 };
    expect(shouldRetry(1, policy)).toBe(true);
    expect(shouldRetry(2, policy)).toBe(true);
    expect(shouldRetry(3, policy)).toBe(false);
  });
});

describe('timeout-policy', () => {
  test('getTimeoutForStep uses the override when present', () => {
    const policy = { default_timeout_ms: 1000, step_type_overrides: { payment: 5000 } };
    expect(getTimeoutForStep('payment', policy)).toBe(5000);
    expect(getTimeoutForStep('proof', policy)).toBe(1000);
  });

  test('isTimedOut compares against now', () => {
    expect(isTimedOut(null, new Date())).toBe(false);
    expect(isTimedOut('2020-01-01T00:00:00Z', new Date('2021-01-01T00:00:00Z'))).toBe(true);
    expect(isTimedOut('2022-01-01T00:00:00Z', new Date('2021-01-01T00:00:00Z'))).toBe(false);
  });
});
