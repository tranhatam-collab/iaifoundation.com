import { POLICY_DECISION, type PolicyDecision } from '@intent-os/contracts/enums';
import type { PolicyEvaluateRequest, PolicyEvaluateResponse } from '@intent-os/contracts/domains';

export interface PolicyRule {
  id: string;
  action_pattern: string;
  condition?: Record<string, unknown>;
  decision: PolicyDecision;
  priority: number;
  required_approvals?: number;
  limits?: Record<string, unknown>;
}

export interface PolicyPack {
  id: string;
  name: string;
  version: string;
  rules: PolicyRule[];
}

export function evaluatePolicy(
  pack: PolicyPack,
  request: PolicyEvaluateRequest,
): PolicyEvaluateResponse {
  const matchingRules = pack.rules
    .filter((rule) => matchesAction(rule.action_pattern, request.action))
    .filter((rule) => matchesCondition(rule.condition, request.context))
    .sort((a, b) => a.priority - b.priority);

  if (matchingRules.length === 0) {
    return {
      decision: POLICY_DECISION.DENY,
      policy_pack_id: pack.id,
      reason: 'No matching rule found; default deny',
    };
  }

  const highestPriorityRule = matchingRules[0];

  return {
    decision: highestPriorityRule.decision,
    policy_pack_id: pack.id,
    required_approvals: highestPriorityRule.required_approvals,
    limits: highestPriorityRule.limits,
  };
}

function matchesAction(pattern: string, action: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return action.startsWith(prefix);
  }
  return pattern === action;
}

function matchesCondition(condition: Record<string, unknown> | undefined, context: Record<string, unknown>): boolean {
  if (!condition) return true;
  for (const [key, expected] of Object.entries(condition)) {
    if (context[key] !== expected) return false;
  }
  return true;
}
