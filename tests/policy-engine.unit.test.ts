import { describe, expect, test } from 'vitest';
import { evaluatePolicy } from '../packages/policy-engine/src/evaluator.js';
import { createRule, DEFAULT_RULES } from '../packages/policy-engine/src/rules.js';
import type { PolicyEvaluateRequest } from '../packages/contracts/src/domains/policy.js';

function request(overrides: Partial<PolicyEvaluateRequest> = {}): PolicyEvaluateRequest {
  return {
    actor: { id: 'usr_1', role: 'operator' },
    resource: { type: 'payment', id: 'pay_1' },
    action: 'payments.payout',
    context: {},
    ...overrides,
  };
}

describe('evaluatePolicy', () => {
  test('returns default deny with reason when nothing matches', () => {
    const result = evaluatePolicy(
      { id: 'pol_1', name: 'p', version: '1', rules: [] },
      request(),
    );
    expect(result.decision).toBe('deny');
    expect(result.policy_pack_id).toBe('pol_1');
    expect(result.reason).toContain('default deny');
  });

  test('matches an exact action pattern', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [createRule({ action_pattern: 'payments.payout', decision: 'allow', priority: 10 })],
    };
    expect(evaluatePolicy(pack, request()).decision).toBe('allow');
  });

  test('matches the full wildcard pattern', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [createRule({ action_pattern: '*', decision: 'deny', priority: 99 })],
    };
    expect(evaluatePolicy(pack, request({ action: 'anything.at.all' })).decision).toBe('deny');
  });

  test('matches a namespace prefix pattern and misses others', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [createRule({ action_pattern: 'device.*', decision: 'allow_with_approval', priority: 5 })],
    };
    expect(evaluatePolicy(pack, request({ action: 'device.actuate' })).decision).toBe('allow_with_approval');
    expect(evaluatePolicy(pack, request({ action: 'payments.payout' })).decision).toBe('deny');
  });

  test('applies condition equality and rejects mismatches', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [
        createRule({
          action_pattern: 'payments.payout',
          condition: { max_amount: 10000 },
          decision: 'allow_with_limits',
          priority: 10,
        }),
      ],
    };
    expect(evaluatePolicy(pack, request({ context: { max_amount: 10000 } })).decision).toBe('allow_with_limits');
    expect(evaluatePolicy(pack, request({ context: { max_amount: 1 } })).decision).toBe('deny');
  });

  test('honors priority ordering (lower number wins)', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [
        createRule({ action_pattern: 'payments.payout', decision: 'allow', priority: 20 }),
        createRule({ action_pattern: 'payments.payout', decision: 'allow_with_approval', priority: 10 }),
      ],
    };
    expect(evaluatePolicy(pack, request()).decision).toBe('allow_with_approval');
  });

  test('propagates required_approvals and limits from the winning rule', () => {
    const pack = {
      id: 'pol_1',
      name: 'p',
      version: '1',
      rules: [
        createRule({
          action_pattern: 'payments.payout',
          decision: 'allow_with_approval',
          priority: 10,
          required_approvals: 2,
          limits: { max_amount: 500 },
        }),
      ],
    };
    const result = evaluatePolicy(pack, request());
    expect(result.required_approvals).toBe(2);
    expect(result.limits).toEqual({ max_amount: 500 });
  });
});

describe('rules', () => {
  test('createRule assigns a stable rule_ id', () => {
    const rule = createRule({ action_pattern: 'x', decision: 'allow', priority: 1 });
    expect(rule.id).toMatch(/^rule_[0-9a-f]{12}$/);
    expect(rule.action_pattern).toBe('x');
  });

  test('DEFAULT_RULES end with the catch-all deny', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0);
    const last = DEFAULT_RULES[DEFAULT_RULES.length - 1];
    expect(last.action_pattern).toBe('*');
    expect(last.decision).toBe('deny');
  });
});
