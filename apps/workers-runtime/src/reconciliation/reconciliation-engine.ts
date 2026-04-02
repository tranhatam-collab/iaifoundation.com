import type { D1Database } from '@cloudflare/workers-types';

export interface ReconciliationResult {
  id: string;
  run_id: string;
  reconciliation_type: string;
  expected: Record<string, unknown>;
  actual: Record<string, unknown>;
  result_status: 'matched' | 'mismatched' | 'pending';
  created_at: string;
}

export async function reconcileRun(
  db: D1Database,
  runId: string,
): Promise<ReconciliationResult[]> {
  const results: ReconciliationResult[] = [];

  const paymentResult = await reconcilePayments(db, runId);
  results.push(paymentResult);

  const proofResult = await reconcileProofs(db, runId);
  results.push(proofResult);

  const deviceResult = await reconcileDevices(db, runId);
  results.push(deviceResult);

  for (const result of results) {
    await db.prepare(`
      INSERT INTO reconciliations (id, run_id, reconciliation_type, expected_json, actual_json, result_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      result.id,
      result.run_id,
      result.reconciliation_type,
      JSON.stringify(result.expected),
      JSON.stringify(result.actual),
      result.result_status,
      result.created_at,
    ).run();
  }

  return results;
}

async function reconcilePayments(db: D1Database, runId: string): Promise<ReconciliationResult> {
  const intents = await db.prepare(
    'SELECT * FROM payment_intents WHERE run_id = ?'
  ).bind(runId).all();

  const settlements = await db.prepare(`
    SELECT s.* FROM settlement_records s
    JOIN payment_intents p ON s.payment_intent_id = p.id
    WHERE p.run_id = ?
  `).bind(runId).all();

  return {
    id: `rec_pay_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    run_id: runId,
    reconciliation_type: 'payment',
    expected: { intent_count: (intents.results || []).length },
    actual: { settlement_count: (settlements.results || []).length },
    result_status: (intents.results || []).length === (settlements.results || []).length ? 'matched' : 'mismatched',
    created_at: new Date().toISOString(),
  };
}

async function reconcileProofs(db: D1Database, runId: string): Promise<ReconciliationResult> {
  const proofs = await db.prepare(
    "SELECT * FROM proof_bundles WHERE run_id = ? AND validation_status = 'valid'"
  ).bind(runId).all();

  return {
    id: `rec_prf_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    run_id: runId,
    reconciliation_type: 'proof',
    expected: { required: 0 },
    actual: { valid_count: (proofs.results || []).length },
    result_status: 'matched',
    created_at: new Date().toISOString(),
  };
}

async function reconcileDevices(db: D1Database, runId: string): Promise<ReconciliationResult> {
  const commands = await db.prepare(
    "SELECT * FROM device_commands WHERE run_id = ? AND status = 'completed'"
  ).bind(runId).all();

  return {
    id: `rec_dev_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    run_id: runId,
    reconciliation_type: 'device',
    expected: { command_count: 0 },
    actual: { completed_count: (commands.results || []).length },
    result_status: 'matched',
    created_at: new Date().toISOString(),
  };
}
