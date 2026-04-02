import type { D1Database } from '@cloudflare/workers-types';

export async function withTransaction<T>(
  db: D1Database,
  fn: (tx: D1Database) => Promise<T>,
): Promise<T> {
  await db.prepare('BEGIN').run();
  try {
    const result = await fn(db);
    await db.prepare('COMMIT').run();
    return result;
  } catch (error) {
    await db.prepare('ROLLBACK').run();
    throw error;
  }
}
