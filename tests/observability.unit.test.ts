import { afterEach, describe, expect, test, vi } from 'vitest';
import { createLogger } from '../packages/observability/src/logger.js';

describe('createLogger', () => {
  afterEach(() => vi.restoreAllMocks());

  test('filters out levels below the configured minimum', () => {
    const logger = createLogger('development', 'info');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('hidden');
    logger.info('visible');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('visible');
  });

  test('emits JSON with level, message, context, and timestamp in production', () => {
    const logger = createLogger('production', 'info');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('hello', { tenant_id: 't1' });
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.context).toEqual({ tenant_id: 't1' });
    expect(typeof parsed.timestamp).toBe('string');
  });

  test('emits a human-readable prefix outside production', () => {
    const logger = createLogger('development', 'info');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.error('boom');
    expect(spy.mock.calls[0][0]).toMatch(/^\[ERROR\] boom/);
  });
});
