import { describe, expect, it } from 'vitest';
import seed from '../server/data/seed.json';
import { validateBranch, validateService, validateStaff } from './validation';
import type { BranchInput, Db, ServiceInput } from './types';

const db = seed as unknown as Db;
const serviceIds = db.services.map((s) => s.id);

const validBranch: BranchInput = {
  name: 'Airport Branch',
  code: 'AIR',
  address: '1 Runway Road',
  openTime: '08:00',
  closeTime: '18:00',
  counterCount: 3,
  serviceIds: ['svc_general'],
  isActive: true,
};

const validService: ServiceInput = {
  name: 'Passport Photos',
  code: 'PP',
  description: '',
  durationMinutes: 5,
  category: 'General',
  isActive: true,
};

describe('branch validation', () => {
  it('accepts a complete branch', () => {
    expect(validateBranch(validBranch, db.branches, serviceIds, null)).toEqual({});
  });

  it('rejects bad code, times, counters and missing services', () => {
    const errors = validateBranch(
      { ...validBranch, code: 'a', openTime: '18:00', closeTime: '09:00', counterCount: 21, serviceIds: [] },
      db.branches,
      serviceIds,
      null,
    );
    expect(Object.keys(errors).sort()).toEqual(['code', 'counterCount', 'openTime', 'serviceIds']);
  });

  it('rejects a duplicate code unless editing the same branch', () => {
    const duplicate = { ...validBranch, code: 'CEN' };
    expect(validateBranch(duplicate, db.branches, serviceIds, null).code).toBe('Code is already used');
    expect(validateBranch({ ...duplicate, name: 'Central Branch' }, db.branches, serviceIds, 'br_central')).toEqual({});
  });
});

describe('service validation', () => {
  it('accepts a complete service', () => {
    expect(validateService(validService, db.services, null)).toEqual({});
  });

  it('rejects 4-letter codes, non-integer and out of range durations', () => {
    expect(validateService({ ...validService, code: 'ABCD' }, db.services, null).code).toBeDefined();
    expect(validateService({ ...validService, durationMinutes: 0 }, db.services, null).durationMinutes).toBeDefined();
    expect(validateService({ ...validService, durationMinutes: 241 }, db.services, null).durationMinutes).toBeDefined();
    expect(validateService({ ...validService, durationMinutes: 1.5 }, db.services, null).durationMinutes).toBeDefined();
  });

  it('rejects duplicate codes', () => {
    expect(validateService({ ...validService, code: 'GC' }, db.services, null).code).toBe('Code is already used');
  });
});

describe('staff validation', () => {
  const input = { name: 'New Person', email: 'new.person@example.com', branchId: 'br_central', counterNumber: 2 };

  it('accepts a counter that exists at the branch', () => {
    expect(validateStaff(input, db.users, db.branches, null)).toEqual({});
  });

  it('rejects a counter beyond the branch counter count and duplicate e-mail', () => {
    expect(validateStaff({ ...input, branchId: 'br_downtown' }, db.users, db.branches, null).counterNumber).toBeDefined();
    expect(validateStaff({ ...input, email: 'SARAH.johnson@example.com' }, db.users, db.branches, null).email).toBeDefined();
  });

  it('allows no counter', () => {
    expect(validateStaff({ ...input, counterNumber: null }, db.users, db.branches, null)).toEqual({});
  });
});
