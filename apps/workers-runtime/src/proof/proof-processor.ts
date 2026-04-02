import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface ProofProcessorContext {
  db: D1Database;
  artifacts: R2Bucket;
}

export async function processProof(
  ctx: ProofProcessorContext,
  runId: string,
  stepId: string,
  proofType: string,
  sourceType: string,
  artifactData: ArrayBuffer,
  artifactName: string,
): Promise<string> {
  const id = `prf_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const artifactRef = `runs/${runId}/proofs/${id}/${artifactName}`;

  await ctx.artifacts.put(artifactRef, artifactData);

  await ctx.db.prepare(`
    INSERT INTO proof_bundles (id, run_id, step_id, proof_type, source_type, artifact_ref, validation_status, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
  `).bind(id, runId, stepId, proofType, sourceType, artifactRef, new Date().toISOString()).run();

  return id;
}

export async function validateProof(
  db: D1Database,
  proofId: string,
  validationStatus: 'valid' | 'invalid' | 'needs_review',
  confidenceScore: number,
): Promise<void> {
  await db.prepare(`
    UPDATE proof_bundles SET validation_status = ?, confidence_score = ? WHERE id = ?
  `).bind(validationStatus, confidenceScore, proofId).run();
}
