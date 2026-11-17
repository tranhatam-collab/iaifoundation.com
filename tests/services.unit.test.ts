import { describe, expect, test } from 'vitest';
import {
  createTenantService,
  getTenantService,
  updateTenantStatusService,
} from '../apps/api/src/modules/tenants/tenants.service.js';
import { makeFakeD1 } from './helpers/fake-d1.js';

describe('tenants service', () => {
  test('createTenantService rejects a duplicate slug', async () => {
    const { db } = makeFakeD1({
      first: (sql) => (sql.includes('WHERE slug = ?') ? { id: 'ten_existing' } : null),
    });
    await expect(
      createTenantService(db, { type: 'org', name: 'Acme', slug: 'acme' }, 'usr_1', 'req_1'),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('createTenantService inserts, audits, and returns the created tenant', async () => {
    const created: any = { id: 'ten_x', type: 'org', name: 'Acme', slug: 'acme', status: 'active' };
    const { db, calls } = makeFakeD1({
      first: (sql) => {
        if (sql.includes('WHERE slug = ?')) return null;
        if (sql.includes('WHERE id = ?') && sql.includes('FROM tenants')) return created;
        return null;
      },
    });

    const tenant = await createTenantService(db, { type: 'org', name: 'Acme', slug: 'acme' }, 'usr_1', 'req_1');

    expect(tenant).toBe(created);
    expect(calls.some((c) => c.sql.includes('INSERT INTO tenants'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('getTenantService throws RESOURCE_NOT_FOUND when missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(getTenantService(db, 'ten_missing')).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  test('getTenantService returns an existing tenant', async () => {
    const { db } = makeFakeD1({ first: () => ({ id: 'ten_1', status: 'active' }) });
    const tenant = await getTenantService(db, 'ten_1');
    expect(tenant.id).toBe('ten_1');
    expect(tenant.status).toBe('active');
  });

  test('updateTenantStatusService updates status and emits an audit event', async () => {
    const { db, calls } = makeFakeD1({ first: () => ({ id: 'ten_1', status: 'active' }) });
    await updateTenantStatusService(db, 'ten_1', 'suspended', 'usr_1', 'req_1');
    expect(calls.some((c) => c.sql.includes('UPDATE tenants SET status'))).toBe(true);
    expect(calls.some((c) => c.sql.includes('INSERT INTO audit_events'))).toBe(true);
  });

  test('updateTenantStatusService throws when the tenant is missing', async () => {
    const { db } = makeFakeD1({ first: () => null });
    await expect(updateTenantStatusService(db, 'ten_1', 'suspended', 'usr_1', 'req_1')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });
});
