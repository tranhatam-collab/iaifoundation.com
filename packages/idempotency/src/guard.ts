import type { D1Database } from '@cloudflare/workers-types';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';

export interface IdempotencyRecord {
  id: string;
  idempotency_key: string;
  request_hash: string;
  response_body: string;
  response_status: number;
  created_at: string;
  expires_at: string;
}

export async function checkIdempotency(
  db: D1Database,
  key: string,
  requestHash: string,
): Promise<{ replay: true; response: { body: string; status: number } } | { replay: false }> {
  const record = await db.prepare(
    'SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND expires_at > ?',
  ).bind(key, new Date().toISOString()).first<IdempotencyRecord>();

  if (!record) {
    return { replay: false };
  }

  if (record.request_hash !== requestHash) {
    throw new AppError(
      ERROR_CODES.IDEMPOTENCY_CONFLICT,
      'Idempotency key reused with different payload',
      { key },
      409,
    );
  }

  return {
    replay: true,
    response: { body: record.response_body, status: record.response_status },
  };
}

export async function storeIdempotency(
  db: D1Database,
  key: string,
  requestHash: string,
  responseBody: string,
  responseStatus: number,
  ttlHours: number = 24,
): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  await db.prepare(`
    INSERT OR IGNORE INTO idempotency_keys (id, idempotency_key, request_hash, response_body, response_status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    `idem_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    key,
    requestHash,
    responseBody,
    responseStatus,
    now.toISOString(),
    expires.toISOString(),
  ).run();
}

export async function createIdempotencyTable(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      request_hash TEXT NOT NULL,
      response_body TEXT NOT NULL,
      response_status INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `).run();
}
