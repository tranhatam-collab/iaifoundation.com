import { describe, expect, test } from 'vitest';
import { okResponse, errorResponse } from '../apps/api/src/common/response/envelope.js';
import {
  validateRequired,
  validateEnum,
  validatePositiveNumber,
  validateIdPrefix,
} from '../apps/api/src/common/validation/validators.js';

describe('response envelope', () => {
  test('okResponse wraps data with request id and next cursor', () => {
    expect(okResponse({ id: 'x' }, 'req_1', 'cursor_1')).toEqual({
      ok: true,
      data: { id: 'x' },
      meta: { request_id: 'req_1', next_cursor: 'cursor_1' },
    });
    expect(okResponse({ id: 'x' }, 'req_1').meta.next_cursor).toBeNull();
  });

  test('errorResponse wraps code, message, and details', () => {
    expect(errorResponse('POLICY_DENIED', 'blocked', 'req_1', { rule: 'r1' })).toEqual({
      ok: false,
      error: { code: 'POLICY_DENIED', message: 'blocked', details: { rule: 'r1' } },
      meta: { request_id: 'req_1' },
    });
  });
});

describe('validators', () => {
  test('validateRequired reports missing, null, and empty fields', () => {
    expect(validateRequired({ a: 1, b: '', c: null }, ['a', 'b', 'c', 'd'])).toEqual(['b', 'c', 'd']);
    expect(validateRequired({ a: 1 }, ['a'])).toEqual([]);
  });

  test('validateEnum accepts a known value and rejects others', () => {
    expect(validateEnum('allow', ['allow', 'deny'], 'decision')).toBeNull();
    expect(validateEnum('maybe', ['allow', 'deny'], 'decision')).toContain('must be one of');
  });

  test('validatePositiveNumber rejects non-positive values', () => {
    expect(validatePositiveNumber(10, 'amount')).toBeNull();
    expect(validatePositiveNumber(0, 'amount')).toContain('positive number');
    expect(validatePositiveNumber('abc', 'amount')).toContain('positive number');
  });

  test('validateIdPrefix checks the prefix', () => {
    expect(validateIdPrefix('run_1', 'run_', 'runId')).toBeNull();
    expect(validateIdPrefix('pay_1', 'run_', 'runId')).toContain("must start with 'run_'");
  });
});
