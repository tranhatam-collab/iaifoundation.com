import type { D1Database } from '@cloudflare/workers-types';
import { queryOne, queryMany, queryRun } from '../client.js';

export interface PaymentIntentRow {
  id: string;
  run_id: string;
  step_id: string;
  payment_type: string;
  amount: number;
  currency_or_asset: string;
  beneficiary_id: string;
  funding_source_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function findPaymentIntentById(db: D1Database, id: string): Promise<PaymentIntentRow | null> {
  return queryOne<PaymentIntentRow>(db, 'SELECT * FROM payment_intents WHERE id = ?', [id]);
}

export async function findPaymentIntentsByRunId(db: D1Database, runId: string): Promise<PaymentIntentRow[]> {
  return queryMany<PaymentIntentRow>(db, 'SELECT * FROM payment_intents WHERE run_id = ? ORDER BY created_at DESC', [runId]);
}

export async function insertPaymentIntent(db: D1Database, payment: {
  id: string;
  run_id: string;
  step_id: string;
  payment_type: string;
  amount: number;
  currency_or_asset: string;
  beneficiary_id: string;
  funding_source_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO payment_intents (id, run_id, step_id, payment_type, amount, currency_or_asset, beneficiary_id, funding_source_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [payment.id, payment.run_id, payment.step_id, payment.payment_type, payment.amount, payment.currency_or_asset, payment.beneficiary_id, payment.funding_source_id || null, payment.status, payment.created_at, payment.updated_at]);
}

export async function updatePaymentIntentStatus(db: D1Database, id: string, status: string, updated_at: string): Promise<D1Result> {
  return queryRun(db, 'UPDATE payment_intents SET status = ?, updated_at = ? WHERE id = ?', [status, updated_at, id]);
}

export async function insertSettlement(db: D1Database, settlement: {
  id: string;
  payment_intent_id: string;
  provider: string;
  provider_txn_ref: string;
  network_ref?: string;
  amount: number;
  asset: string;
  status: string;
  fee_amount?: number;
  settled_at?: string;
  created_at: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO settlement_records (id, payment_intent_id, provider, provider_txn_ref, network_ref, amount, asset, status, fee_amount, settled_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [settlement.id, settlement.payment_intent_id, settlement.provider, settlement.provider_txn_ref, settlement.network_ref || null, settlement.amount, settlement.asset, settlement.status, settlement.fee_amount || null, settlement.settled_at || null, settlement.created_at]);
}
