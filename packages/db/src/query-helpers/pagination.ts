export interface PaginationOptions {
  cursor?: string;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  next_cursor: string | null;
}

export function buildPaginatedQuery(
  baseSql: string,
  params: unknown[],
  options: PaginationOptions,
): { sql: string; params: unknown[] } {
  let sql = baseSql;

  if (options.cursor) {
    sql += ' AND created_at < ?';
    params.push(options.cursor);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(options.limit + 1);

  return { sql, params };
}

export function paginateResults<T>(items: T[], limit: number): PaginatedResult<T> {
  if (items.length > limit) {
    items.pop();
    return { items, next_cursor: (items[items.length - 1] as any)?.created_at || null };
  }
  return { items, next_cursor: null };
}
