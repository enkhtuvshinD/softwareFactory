import { readDb, writeDb } from '../db';
import { fail, failValidation } from '../http';
import { waitingTickets } from '../../shared/queue';
import { validateBranch } from '../../shared/validation';
import type { Branch, BranchInput, BranchView, Db, User } from '../../shared/types';

function toBranchView(db: Db, branch: Branch): BranchView {
  return {
    ...branch,
    staff: db.users
      .filter((u) => u.role === 'staff' && u.branchId === branch.id)
      .map((u) => ({ id: u.id, name: u.name, counterNumber: u.counterNumber })),
    waitingCount: waitingTickets(db.tickets, branch.id).length,
  };
}

export function listBranches(viewer: User | null): BranchView[] {
  const db = readDb<Db>();
  const seesInactive = viewer?.role === 'admin' || viewer?.role === 'staff';
  return db.branches.filter((b) => seesInactive || b.isActive).map((b) => toBranchView(db, b));
}

function pickBranchFields(input: Partial<BranchInput>): BranchInput {
  return {
    name: (input.name ?? '').trim(),
    code: input.code ?? '',
    address: (input.address ?? '').trim(),
    openTime: input.openTime ?? '',
    closeTime: input.closeTime ?? '',
    counterCount: input.counterCount as number,
    serviceIds: input.serviceIds ?? [],
    isActive: input.isActive !== false,
  };
}

function assertCountersStillCovered(db: Db, branchId: string, counterCount: number) {
  const holder = db.users.find(
    (u) => u.role === 'staff' && u.branchId === branchId && u.counterNumber !== null && u.counterNumber > counterCount,
  );
  if (holder) {
    fail(409, 'COUNTER_IN_USE', `Counter ${holder.counterNumber} is assigned to ${holder.name}; reassign them first`);
  }
}

export function createBranch(input: Partial<BranchInput>): BranchView {
  const db = readDb<Db>();
  const errors = validateBranch(input, db.branches, db.services.map((s) => s.id), null);
  if (Object.keys(errors).length > 0) failValidation(errors);
  const fields = pickBranchFields(input);
  const branch: Branch = { id: `br_${fields.code.toLowerCase()}`, ...fields };
  db.branches.push(branch);
  writeDb(db);
  return toBranchView(db, branch);
}

export function updateBranch(id: string, input: Partial<BranchInput>): BranchView {
  const db = readDb<Db>();
  const branch = db.branches.find((b) => b.id === id);
  if (!branch) return fail(404, 'NOT_FOUND', 'Branch not found');
  const merged = { ...branch, ...input };
  const errors = validateBranch(merged, db.branches, db.services.map((s) => s.id), id);
  if (Object.keys(errors).length > 0) failValidation(errors);
  const fields = pickBranchFields(merged);
  assertCountersStillCovered(db, id, fields.counterCount);
  Object.assign(branch, fields);
  writeDb(db);
  return toBranchView(db, branch);
}
