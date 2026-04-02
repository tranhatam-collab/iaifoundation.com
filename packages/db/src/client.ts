import type { D1Database } from '@cloudflare/workers-types';

let dbInstance: D1Database | null = null;

export function getDb(env: { DB: D1Database }): D1Database {
  if (!dbInstance) {
    dbInstance = env.DB;
  }
  return dbInstance;
}

export async function queryOne<T>(db: D1Database, sql: string, params?: unknown[]): Promise<T | null> {
  const result = await db.prepare(sql).bind(...(params || [])).first<T>();
  return result || null;
}

export async function queryMany<T>(db: D1Database, sql: string, params?: unknown[]): Promise<T[]> {
  const result = await db.prepare(sql).bind(...(params || [])).all<T>();
  return result.results || [];
}

export async function queryRun(db: D1Database, sql: string, params?: unknown[]): Promise<D1Result> {
  return db.prepare(sql).bind(...(params || [])).run();
}
