import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  normalizePaymentEvent,
  normalizeDeviceEvent,
  normalizeProofArtifact,
} from '../apps/workers-connectors/src/normalization/normalize-event.js';
import {
  checkConnectorHealth,
  checkAllConnectorsHealth,
} from '../apps/workers-connectors/src/health/connector-health-check.js';
import { callConnector } from '../apps/workers-connectors/src/outbound/connector-caller.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('normalizePaymentEvent', () => {
  test('maps provider fields and canonicalizes status', () => {
    expect(
      normalizePaymentEvent({
        type: 'payment.succeeded',
        provider: 'stripe',
        id: 'txn_1',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
      }),
    ).toMatchObject({
      event_type: 'payment.succeeded',
      provider: 'stripe',
      provider_txn_ref: 'txn_1',
      amount: 100,
      currency: 'USD',
      status: 'settled',
    });
    expect(normalizePaymentEvent({ status: 'failed' }).status).toBe('failed');
    expect(normalizePaymentEvent({ status: 'weird' }).status).toBe('unknown');
  });
});

describe('normalizeDeviceEvent', () => {
  test('normalizes device fields with fallbacks', () => {
    expect(
      normalizeDeviceEvent({ type: 'state', device_id: 'dev_1', gateway_id: 'gw_1', state: 'on', trust_score: 0.9 }),
    ).toMatchObject({
      event_type: 'state',
      device_id: 'dev_1',
      gateway_id: 'gw_1',
      state: 'on',
      trust_score: 0.9,
    });
    expect(normalizeDeviceEvent({}).device_id).toBe('');
    expect(normalizeDeviceEvent({}).trust_score).toBe(0.5);
  });
});

describe('normalizeProofArtifact', () => {
  test('normalizes proof metadata with defaults', () => {
    expect(normalizeProofArtifact({ type: 'receipt', source: 'upload', mime_type: 'image/png', size: 123 })).toMatchObject({
      proof_type: 'receipt',
      source_type: 'upload',
      mime_type: 'image/png',
      size_bytes: 123,
    });
    expect(normalizeProofArtifact({}).proof_type).toBe('document');
  });
});

describe('checkConnectorHealth', () => {
  test('throws when the connector is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(checkConnectorHealth(db, 'con_1', async () => ({ latency_ms: 1, success: true }))).rejects.toThrow(
      'not found',
    );
  });

  test('reports healthy on a successful check', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'con_1', provider: 'stripe' }) });
    const result = await checkConnectorHealth(db, 'con_1', async () => ({ latency_ms: 12, success: true }));
    expect(result.health_status).toBe('healthy');
    expect(result.provider).toBe('stripe');
    expect(calls.some((c) => c.sql.includes('UPDATE connectors SET health_status'))).toBe(true);
  });

  test('reports failing when the check returns success false', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'con_1', provider: 'stripe' }) });
    const result = await checkConnectorHealth(db, 'con_1', async () => ({ latency_ms: 0, success: false, error: 'timeout' }));
    expect(result.health_status).toBe('failing');
    expect(result.error_message).toBe('timeout');
  });

  test('catches a throwing check as failing', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'con_1', provider: 'stripe' }) });
    const result = await checkConnectorHealth(db, 'con_1', async () => {
      throw new Error('boom');
    });
    expect(result.health_status).toBe('failing');
    expect(result.error_message).toBe('boom');
  });
});

describe('checkAllConnectorsHealth', () => {
  test('returns failing entries for connectors whose check throws', async () => {
    const { db } = makeFakeD1({ all: () => ({ results: [{ id: 'con_1' }, { id: 'con_2' }] }) });
    const results = await checkAllConnectorsHealth(db, async () => {
      throw new Error('x');
    });
    expect(results).toHaveLength(2);
    expect(results[0].health_status).toBe('failing');
    expect(results[0].error_message).toBe('Health check failed');
  });
});

describe('callConnector', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('returns the parsed response on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ id: 'x' }) })));
    const result = await callConnector('https://example.com', 'POST', {}, { a: 1 });
    expect(result.success).toBe(true);
    expect(result.response).toEqual({ id: 'x' });
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });

  test('returns an HTTP error on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, statusText: 'Server Error' })));
    const result = await callConnector('https://example.com', 'GET', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 500');
  });

  test('returns the error message when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));
    const result = await callConnector('https://example.com', 'GET', {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});
