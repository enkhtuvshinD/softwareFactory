import { readDb, writeDb } from '../db';
import { fail, failValidation } from '../http';
import { validateService } from '../../shared/validation';
import type { Db, Service, ServiceInput, User } from '../../shared/types';

export function listServices(viewer: User | null): Service[] {
  const db = readDb<Db>();
  const seesInactive = viewer?.role === 'admin' || viewer?.role === 'staff';
  return db.services.filter((s) => seesInactive || s.isActive);
}

function pickServiceFields(input: Partial<ServiceInput>): ServiceInput {
  return {
    name: (input.name ?? '').trim(),
    code: input.code ?? '',
    description: (input.description ?? '').trim(),
    durationMinutes: input.durationMinutes as number,
    category: (input.category ?? '').trim(),
    isActive: input.isActive !== false,
  };
}

export function createService(input: Partial<ServiceInput>): Service {
  const db = readDb<Db>();
  const errors = validateService(input, db.services, null);
  if (Object.keys(errors).length > 0) failValidation(errors);
  const fields = pickServiceFields(input);
  const service: Service = { id: `svc_${fields.code.toLowerCase()}`, ...fields };
  db.services.push(service);
  writeDb(db);
  return service;
}

export function updateService(id: string, input: Partial<ServiceInput>): Service {
  const db = readDb<Db>();
  const service = db.services.find((s) => s.id === id);
  if (!service) return fail(404, 'NOT_FOUND', 'Service not found');
  const merged = { ...service, ...input };
  const errors = validateService(merged, db.services, id);
  if (Object.keys(errors).length > 0) failValidation(errors);
  Object.assign(service, pickServiceFields(merged));
  writeDb(db);
  return service;
}
