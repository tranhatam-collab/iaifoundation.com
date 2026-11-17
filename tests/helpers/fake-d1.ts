import type { D1Database } from '@cloudflare/workers-types';

export interface FakeD1Call {
  sql: string;
  params: unknown[];
}

export interface FakeD1Options {
  first?: (sql: string, params: unknown[]) => unknown;
  all?: (sql: string, params: unknown[]) => { results: unknown[] };
  run?: (sql: string, params: unknown[]) => void;
}

/**
 * Minimal in-memory D1Database fake. It records every statement execution
 * (both `prepare(sql).bind(...)` and direct `prepare(sql).run()`/`.first()`
 * /`.all()` chains) and lets a test route responses by SQL.
 */
export function makeFakeD1(options: FakeD1Options = {}) {
  const calls: FakeD1Call[] = [];

  const makeResult = (sql: string, params: unknown[]) => ({
    async first<T>(): Promise<T | null> {
      calls.push({ sql, params });
      return ((options.first ? options.first(sql, params) : null) ?? null) as T | null;
    },
    async all<T>(): Promise<{ results: T[] }> {
      calls.push({ sql, params });
      return (options.all ? options.all(sql, params) : { results: [] }) as { results: T[] };
    },
    async run(): Promise<unknown> {
      calls.push({ sql, params });
      if (options.run) options.run(sql, params);
      return { success: true };
    },
  });

  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          return makeResult(sql, params);
        },
        async first<T>() {
          return makeResult(sql, []).first<T>();
        },
        async all<T>() {
          return makeResult(sql, []).all<T>();
        },
        async run() {
          return makeResult(sql, []).run();
        },
      };
    },
  };

  return { db: db as unknown as D1Database, calls };
}
