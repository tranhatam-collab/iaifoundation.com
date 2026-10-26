import { describe, expect, test } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import app, { type Env } from '../apps/api/src/index.js';
import runtimeWorker, { type Env as RuntimeEnv } from '../apps/workers-runtime/src/index.js';
import connectorWorker, { type Env as ConnectorEnv } from '../apps/workers-connectors/src/index.js';
import { loginService } from '../apps/api/src/modules/auth/auth.service.js';
import { sendNotification } from '../apps/api/src/integrations/notifications/notification.service.js';
import { testConnectorService } from '../apps/api/src/modules/connectors/connectors.service.js';
import { testGatewayService } from '../apps/api/src/modules/gateways/gateways.service.js';
import { runStep } from '../apps/workers-runtime/src/coordinator/step-runner.js';
import { StripeAdapter } from '../apps/workers-connectors/src/adapters/payments/stripe.adapter.js';
import { StablecoinAdapter } from '../apps/workers-connectors/src/adapters/payments/stablecoin.adapter.js';
import { MatterAdapter } from '../apps/workers-connectors/src/adapters/devices/matter.adapter.js';
import { MqttAdapter } from '../apps/workers-connectors/src/adapters/devices/mqtt.adapter.js';
import {
  hmacSha256,
  verifyWebhookSignature,
} from '../apps/workers-connectors/src/inbound-webhooks/payment-webhook.js';

const disabledEnv = {
  ENVIRONMENT: 'production',
  LOG_LEVEL: 'info',
} as Env;

const localEnv = {
  ENVIRONMENT: 'development',
  LOG_LEVEL: 'debug',
  RUNTIME_API_MODE: 'unsafe-local-development',
  DEV_BEARER_TOKEN: 'local-test-token',
} as Env;

describe('HTTP application boundaries', () => {
  test('health remains available without enabling the private runtime', async () => {
    const response = await app.request('/health', undefined, disabledEnv);
    const payload = await response.json<{ ok: boolean; timestamp: string }>();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
  });

  test('private runtime routes fail closed in production', async () => {
    const response = await app.request('/v1/tenants', undefined, disabledEnv);
    const payload = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  test('local runtime mode still requires a configured bearer token', async () => {
    const response = await app.request(
      '/v1/tenants',
      { headers: { 'x-tenant-id': 'tenant-local' } },
      localEnv,
    );

    expect(response.status).toBe(401);
  });

  test('explicit local runtime mode accepts only the configured token', async () => {
    const response = await app.request(
      '/v1/tenants',
      {
        headers: {
          authorization: 'Bearer local-test-token',
          'x-tenant-id': 'tenant-local',
        },
      },
      localEnv,
    );
    const payload = await response.json<{ data: { tenant_id: string } }>();

    expect(response.status).toBe(200);
    expect(payload.data.tenant_id).toBe('tenant-local');
  });

  test('login stays unavailable even in local runtime mode', async () => {
    const response = await app.request(
      '/v1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'person@example.com' }),
      },
      localEnv,
    );

    expect(response.status).toBe(503);
  });
});

describe('webhook signature verification', () => {
  test('accepts a valid generic HMAC and rejects a forged signature', async () => {
    const body = JSON.stringify({ event: 'payment.completed' });
    const secret = 'test-secret';
    const signature = await hmacSha256(body, secret);
    const forged = `${signature.slice(0, -1)}${signature.endsWith('0') ? '1' : '0'}`;

    expect(await verifyWebhookSignature(body, signature, secret, 'generic')).toBe(true);
    expect(await verifyWebhookSignature(body, forged, secret, 'generic')).toBe(false);
  });

  test('enforces the Stripe timestamp tolerance', async () => {
    const body = JSON.stringify({ id: 'evt_test' });
    const secret = 'stripe-test-secret';
    const now = 1_800_000_000;
    const currentSignature = await hmacSha256(`${now}.${body}`, secret);
    const staleTimestamp = now - 301;
    const staleSignature = await hmacSha256(`${staleTimestamp}.${body}`, secret);

    expect(
      await verifyWebhookSignature(
        body,
        `t=${now},v1=${currentSignature}`,
        secret,
        'stripe',
        now,
      ),
    ).toBe(true);
    expect(
      await verifyWebhookSignature(
        body,
        `t=${staleTimestamp},v1=${staleSignature}`,
        secret,
        'stripe',
        now,
      ),
    ).toBe(false);
  });
});

describe('future runtime worker boundaries', () => {
  test('execution worker fails closed by default', async () => {
    const response = await runtimeWorker.fetch(
      new Request('https://runtime.invalid/intake', { method: 'POST' }),
      {} as RuntimeEnv,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(503);
  });

  test('execution worker requires authentication in explicit local mode', async () => {
    const response = await runtimeWorker.fetch(
      new Request('https://runtime.invalid/intake', { method: 'POST' }),
      {
        ENVIRONMENT: 'development',
        RUNTIME_WORKER_MODE: 'unsafe-local-development',
        DEV_BEARER_TOKEN: 'local-test-token',
      } as RuntimeEnv,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(401);
  });

  test('connector worker fails closed by default', async () => {
    const response = await connectorWorker.fetch(
      new Request('https://connectors.invalid/webhooks/payments/stripe', { method: 'POST' }),
      {} as ConnectorEnv,
    );

    expect(response.status).toBe(503);
  });

  test('generic connector endpoints remain unavailable in local mode', async () => {
    const response = await connectorWorker.fetch(
      new Request('https://connectors.invalid/webhooks/connectors/example', { method: 'POST' }),
      {
        ENVIRONMENT: 'development',
        CONNECTORS_MODE: 'unsafe-local-development',
      } as ConnectorEnv,
    );

    expect(response.status).toBe(503);
  });
});

describe('unimplemented provider adapters fail closed', () => {
  test('payment adapters never fabricate transfer acceptance', async () => {
    const stripe = new StripeAdapter({ apiKey: 'unused', webhookSecret: 'unused' });
    const stablecoin = new StablecoinAdapter({
      network: 'polygon',
      rpcUrl: 'https://invalid.example',
      contractAddress: '0x0',
      signerKey: 'unused',
    });
    const transfer = {
      amount: 100,
      currency: 'USD',
      beneficiary_id: 'beneficiary-test',
      idempotency_key: 'idempotency-test',
    };

    await expect(stripe.createTransfer(transfer)).rejects.toThrow('not implemented');
    await expect(stablecoin.createTransfer(transfer)).rejects.toThrow('not implemented');
    await expect(stripe.verifyWebhook('{}', 'forged')).resolves.toBe(false);
    await expect(stablecoin.verifyWebhook('{}', 'forged')).resolves.toBe(false);
  });

  test('device adapters never fabricate command acknowledgement', async () => {
    const matter = new MatterAdapter({ fabricId: 'fabric-test', nodeId: 'node-test', commissioningData: 'unused' });
    const mqtt = new MqttAdapter({ brokerUrl: 'https://invalid.example', clientId: 'client-test' });
    const command = {
      device_id: 'device-test',
      command_type: 'activate',
      payload: {},
      idempotency_key: 'idempotency-test',
    };

    await expect(matter.sendCommand(command)).rejects.toThrow('not implemented');
    await expect(mqtt.sendCommand(command)).rejects.toThrow('not implemented');
  });
});

describe('unimplemented private-runtime services never fabricate success', () => {
  test('interactive login and notification delivery reject without side effects', async () => {
    await expect(loginService({} as D1Database, {
      email: 'person@example.com',
      password_or_assertion: 'not-used',
    }, 'request-test')).rejects.toThrow('not implemented');

    await expect(sendNotification({} as D1Database, {
      tenant_id: 'tenant-test',
      workspace_id: 'workspace-test',
      channel: 'webhook',
      recipient: 'https://invalid.example',
      subject: 'test',
      body: 'test',
      priority: 'normal',
    }, 'actor-test', 'request-test')).rejects.toThrow('not implemented');
  });

  test('connector and gateway health checks reject instead of reporting healthy', async () => {
    const lookupDb = {
      prepare: () => ({
        bind: () => ({ first: async () => ({ id: 'resource-test' }) }),
      }),
    } as unknown as D1Database;

    await expect(testConnectorService(lookupDb, 'connector-test')).rejects.toMatchObject({
      code: 'CONNECTOR_UNAVAILABLE',
      httpStatus: 503,
    });
    await expect(testGatewayService(lookupDb, 'gateway-test')).rejects.toMatchObject({
      code: 'CONNECTOR_UNAVAILABLE',
      httpStatus: 503,
    });
  });

  test('runtime steps transition to failed until a real executor exists', async () => {
    const stateUpdates: string[] = [];
    const stateDb = {
      prepare: () => ({
        bind: (state: string) => ({
          run: async () => {
            stateUpdates.push(state);
            return {};
          },
        }),
      }),
    } as unknown as D1Database;

    const result = await runStep({
      db: stateDb,
      runId: 'run-test',
      stepId: 'step-test',
      stepType: 'payment',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not implemented');
    expect(stateUpdates.at(-1)).toBe('failed');
  });
});
