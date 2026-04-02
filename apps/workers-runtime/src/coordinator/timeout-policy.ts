export interface TimeoutPolicy {
  default_timeout_ms: number;
  step_type_overrides?: Record<string, number>;
}

export function getTimeoutForStep(stepType: string, policy: TimeoutPolicy): number {
  return policy.step_type_overrides?.[stepType] || policy.default_timeout_ms;
}

export function isTimedOut(timeoutAt: string | null, now: Date): boolean {
  if (!timeoutAt) return false;
  return now > new Date(timeoutAt);
}
