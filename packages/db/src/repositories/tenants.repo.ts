import type { D1Database } from '@cloudflare/workers-types';
import { queryOne, queryMany, queryRun } from '../client.js';

export interface TenantRow {
  id: string;
  type: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  billing_plan_id: string | null;
  status: string;
  timezone: string | null;
  locale: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export async function findTenantById(db: D1Database, id: string): Promise<TenantRow | null> {
  return queryOne<TenantRow>(db, 'SELECT * FROM tenants WHERE id = ?', [id]);
}

export async function findTenantBySlug(db: D1Database, slug: string): Promise<TenantRow | null> {
  return queryOne<TenantRow>(db, 'SELECT * FROM tenants WHERE slug = ?', [slug]);
}

export async function insertTenant(db: D1Database, tenant: {
  id: string;
  type: string;
  name: string;
  slug: string;
  owner_user_id?: string;
  timezone?: string;
  locale?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}): Promise<D1Result> {
  return queryRun(db, `
    INSERT INTO tenants (id, type, name, slug, owner_user_id, timezone, locale, country_code, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `, [tenant.id, tenant.type, tenant.name, tenant.slug, tenant.owner_user_id || null, tenant.timezone || null, tenant.locale || null, tenant.country_code || null, tenant.created_at, tenant.updated_at]);
}

export async function updateTenantStatus(db: D1Database, id: string, status: string, updated_at: string): Promise<D1Result> {
  return queryRun(db, 'UPDATE tenants SET status = ?, updated_at = ? WHERE id = ?', [status, updated_at, id]);
}
