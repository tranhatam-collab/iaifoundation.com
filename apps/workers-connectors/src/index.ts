import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { handlePaymentWebhook as paymentWebhookHandler } from './inbound-webhooks/payment-webhook.js';
import { handleDeviceWebhook as deviceWebhookHandler } from './inbound-webhooks/device-webhook.js';

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  WEBHOOK_SECRET: string;
  ENVIRONMENT?: string;
  CONNECTORS_MODE?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const isExplicitLocalDev = env.ENVIRONMENT === 'development'
      && env.CONNECTORS_MODE === 'unsafe-local-development';
    if (!isExplicitLocalDev) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Connector runtime is disabled in the public foundation project',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith('/webhooks/payments/')) {
      const provider = url.pathname.split('/').pop() || 'unknown';
      return paymentWebhookHandler({
        db: env.DB,
        artifacts: env.ARTIFACTS,
        webhookSecret: env.WEBHOOK_SECRET,
      }, provider, request);
    }

    if (url.pathname.startsWith('/webhooks/device/')) {
      const gatewayId = url.pathname.split('/').pop() || 'unknown';
      return deviceWebhookHandler({
        db: env.DB,
        artifacts: env.ARTIFACTS,
        webhookSecret: env.WEBHOOK_SECRET,
      }, gatewayId, request);
    }

    if (url.pathname.startsWith('/webhooks/connectors/')) {
      return handleConnectorWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleConnectorWebhook(request: Request, env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    ok: false,
    error: 'Generic connector webhooks are not implemented',
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
