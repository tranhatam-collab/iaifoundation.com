import type { D1Database } from '@cloudflare/workers-types';
import { findPaymentIntentById, findPaymentIntentsByRunId, insertPaymentIntent, updatePaymentIntentStatus, insertSettlement } from '@intent-os/db/repositories/payments.repo';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { emitAuditEvent, createAuditEvent } from '@intent-os/audit-sdk/emit';

export interface CreatePaymentIntentInput {
  run_id: string;
  step_id: string;
  payment_type: string;
  amount: number;
  currency_or_asset: string;
  beneficiary_id: string;
  funding_source_id?: string;
}

export async function createPaymentIntentService(
  db: D1Database,
  input: CreatePaymentIntentInput,
  actorId: string,
  requestId: string,
) {
  const id = `pay_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  await insertPaymentIntent(db, {
    id,
    run_id: input.run_id,
    step_id: input.step_id,
    payment_type: input.payment_type,
    amount: input.amount,
    currency_or_asset: input.currency_or_asset,
    beneficiary_id: input.beneficiary_id,
    funding_source_id: input.funding_source_id,
    status: 'created',
    created_at: now,
    updated_at: now,
  });

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'payment.intent_created',
    resource_type: 'payment_intent',
    resource_id: id,
    before_json: null,
    after_json: JSON.stringify(input),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));

  return findPaymentIntentById(db, id);
}

export async function authorizePaymentService(
  db: D1Database,
  paymentIntentId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const intent = await findPaymentIntentById(db, paymentIntentId);
  if (!intent) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Payment intent not found');
  }

  if (intent.status !== 'created') {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot authorize payment in status: ${intent.status}`);
  }

  const now = new Date().toISOString();
  await updatePaymentIntentStatus(db, paymentIntentId, 'authorized', now);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'payment.authorized',
    resource_type: 'payment_intent',
    resource_id: paymentIntentId,
    before_json: JSON.stringify({ status: intent.status }),
    after_json: JSON.stringify({ status: 'authorized' }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}

export async function capturePaymentService(
  db: D1Database,
  paymentIntentId: string,
  actorId: string,
  requestId: string,
): Promise<void> {
  const intent = await findPaymentIntentById(db, paymentIntentId);
  if (!intent) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, 'Payment intent not found');
  }

  if (intent.status !== 'authorized') {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Cannot capture payment in status: ${intent.status}`);
  }

  const now = new Date().toISOString();
  await updatePaymentIntentStatus(db, paymentIntentId, 'captured', now);

  await emitAuditEvent(db, createAuditEvent({
    tenant_id: null,
    workspace_id: null,
    actor_id: actorId,
    action_type: 'payment.captured',
    resource_type: 'payment_intent',
    resource_id: paymentIntentId,
    before_json: JSON.stringify({ status: intent.status }),
    after_json: JSON.stringify({ status: 'captured' }),
    reason: null,
    request_id: requestId,
    source_ip: null,
    session_id: null,
  }));
}
