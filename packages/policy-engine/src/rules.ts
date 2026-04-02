import type { PolicyRule } from './evaluator.js';

export function createRule(rule: Omit<PolicyRule, 'id'>): PolicyRule {
  return { ...rule, id: `rule_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}` };
}

export const DEFAULT_RULES: PolicyRule[] = [
  createRule({
    action_pattern: 'payments.payout',
    condition: { max_amount: 10000 },
    decision: 'allow_with_approval',
    priority: 10,
    required_approvals: 1,
    limits: { max_amount: 10000 },
  }),
  createRule({
    action_pattern: 'payments.payout',
    decision: 'allow',
    priority: 20,
  }),
  createRule({
    action_pattern: 'device.*',
    condition: { risk_class: 'high' },
    decision: 'allow_with_approval',
    priority: 5,
    required_approvals: 1,
  }),
  createRule({
    action_pattern: '*',
    decision: 'deny',
    priority: 999,
  }),
];
