export interface RetryPolicy {
  max_attempts: number;
  backoff_ms: number;
  backoff_multiplier?: number;
}

export function calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
  const multiplier = policy.backoff_multiplier || 2;
  return policy.backoff_ms * Math.pow(multiplier, attempt - 1);
}

export function shouldRetry(attempt: number, policy: RetryPolicy): boolean {
  return attempt < policy.max_attempts;
}
