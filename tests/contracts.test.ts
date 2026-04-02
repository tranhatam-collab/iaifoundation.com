import { describe, expect, test } from 'vitest';
import { evaluatePolicy } from '../packages/policy-engine/src/evaluator.js';
import { createRule } from '../packages/policy-engine/src/rules.js';
import { isValidTransition, isTerminalState } from '../packages/contracts/src/enums/run-state-machine.js';

describe('policy-engine', () => {
  test('deny by default when no rules match', () => {
    const pack = { id: 'pol_1', name: 'test', version: '1.0', rules: [] };
    const result = evaluatePolicy(pack, {
      actor: { id: 'usr_1', role: 'operator' },
      resource: { type: 'payment', id: 'pay_1' },
      action: 'payments.payout',
      context: {},
    });
    expect(result.decision).toBe('deny');
  });

  test('allow when rule matches', () => {
    const pack = {
      id: 'pol_1',
      name: 'test',
      version: '1.0',
      rules: [
        createRule({ action_pattern: 'payments.payout', decision: 'allow', priority: 10 }),
      ],
    };
    const result = evaluatePolicy(pack, {
      actor: { id: 'usr_1', role: 'operator' },
      resource: { type: 'payment', id: 'pay_1' },
      action: 'payments.payout',
      context: {},
    });
    expect(result.decision).toBe('allow');
  });

  test('wildcard pattern matches sub-actions', () => {
    const pack = {
      id: 'pol_1',
      name: 'test',
      version: '1.0',
      rules: [
        createRule({ action_pattern: 'payments.*', decision: 'allow_with_approval', priority: 10 }),
      ],
    };
    const result = evaluatePolicy(pack, {
      actor: { id: 'usr_1', role: 'operator' },
      resource: { type: 'payment', id: 'pay_1' },
      action: 'payments.payout',
      context: {},
    });
    expect(result.decision).toBe('allow_with_approval');
  });
});

describe('run-state-machine', () => {
  test('valid transition from created to resolved', () => {
    expect(isValidTransition('created', 'resolved')).toBe(true);
  });

  test('invalid transition from created to succeeded', () => {
    expect(isValidTransition('created', 'succeeded')).toBe(false);
  });

  test('terminal states have no transitions', () => {
    expect(isTerminalState('succeeded')).toBe(true);
    expect(isTerminalState('failed')).toBe(true);
    expect(isTerminalState('cancelled')).toBe(true);
    expect(isTerminalState('running')).toBe(false);
  });
});
