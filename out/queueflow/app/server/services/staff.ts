import { readDb, writeDb } from '../db';
import { fail, failValidation } from '../http';
import { validateStaff } from '../../shared/validation';
import type { Db, StaffInput, User } from '../../shared/types';
import { nextEntityId } from './ticketViews';

export function listUsers(): User[] {
  return readDb<Db>().users;
}

export function listStaff(): User[] {
  return readDb<Db>().users.filter((u) => u.role === 'staff');
}

function assertCounterFree(db: Db, branchId: string, counterNumber: number | null, editingId: string | null) {
  if (counterNumber === null) return;
  const holder = db.users.find(
    (u) => u.role === 'staff' && u.id !== editingId && u.branchId === branchId && u.counterNumber === counterNumber,
  );
  if (holder) fail(409, 'COUNTER_TAKEN', `Counter ${counterNumber} is already assigned to ${holder.name}`);
}

function normalizeCounter(input: Partial<StaffInput>): number | null {
  return input.counterNumber === undefined ? null : input.counterNumber;
}

export function createStaff(input: Partial<StaffInput>): User {
  const db = readDb<Db>();
  const errors = validateStaff({ ...input, counterNumber: normalizeCounter(input) }, db.users, db.branches, null);
  if (Object.keys(errors).length > 0) failValidation(errors);
  const branchId = input.branchId as string;
  const counterNumber = normalizeCounter(input);
  assertCounterFree(db, branchId, counterNumber, null);
  const staff: User = {
    id: nextEntityId('usr', db.users.filter((u) => u.role === 'staff').map((u) => u.id)),
    name: (input.name as string).trim(),
    email: (input.email as string).trim(),
    role: 'staff',
    branchId,
    counterNumber,
  };
  db.users.push(staff);
  writeDb(db);
  return staff;
}

export function updateStaff(id: string, input: Partial<StaffInput>): User {
  const db = readDb<Db>();
  const staff = db.users.find((u) => u.id === id && u.role === 'staff');
  if (!staff) return fail(404, 'NOT_FOUND', 'Staff member not found');
  const merged: Partial<StaffInput> = {
    name: staff.name,
    email: staff.email,
    branchId: staff.branchId ?? undefined,
    counterNumber: staff.counterNumber,
    ...input,
  };
  const errors = validateStaff(merged, db.users, db.branches, id);
  if (Object.keys(errors).length > 0) failValidation(errors);
  const counterNumber = normalizeCounter(merged);
  assertCounterFree(db, merged.branchId as string, counterNumber, id);
  staff.name = (merged.name as string).trim();
  staff.email = (merged.email as string).trim();
  staff.branchId = merged.branchId as string;
  staff.counterNumber = counterNumber;
  writeDb(db);
  return staff;
}
