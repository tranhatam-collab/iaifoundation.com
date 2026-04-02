import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { handlePaymentWebhook as paymentWebhookHandler } from './inbound-webhooks/payment-webhook.js';
import { handleDeviceWebhook as deviceWebhookHandler } from './inbound-webhooks/device-webhook.js';

export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  WEBHOOK_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
      }, gatewayId, request);
    }

    if (url.pathname.startsWith('/webhooks/connectors/')) {
      return handleConnectorWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleConnectorWebhook(request: Request, env: Env): Promise<Response> {
  // TODO: Verify webhook signature
  // TODO: Parse connector event
  // TODO: Update connector health status
  // TODO: Notify if degraded
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
