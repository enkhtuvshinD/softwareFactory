import { isValidTime, timeToMinutes } from './time';
import type { Branch, BranchInput, Service, ServiceInput, StaffInput, User } from './types';

export type FieldErrors = Record<string, string>;

const BRANCH_CODE_PATTERN = /^[A-Z]{2,4}$/;
const SERVICE_CODE_PATTERN = /^[A-Z]{2,3}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_COUNTERS = 20;
const MAX_SERVICE_MINUTES = 240;

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function validateBranch(
  input: Partial<BranchInput>,
  existing: Branch[],
  knownServiceIds: string[],
  editingId: string | null,
): FieldErrors {
  const errors: FieldErrors = {};
  const others = existing.filter((b) => b.id !== editingId);
  if (!isNonEmpty(input.name)) errors.name = 'Name is required';
  else if (others.some((b) => sameText(b.name, input.name as string))) errors.name = 'Name is already used';
  if (typeof input.code !== 'string' || !BRANCH_CODE_PATTERN.test(input.code)) {
    errors.code = 'Code must be 2–4 uppercase letters';
  } else if (others.some((b) => b.code === input.code)) errors.code = 'Code is already used';
  if (!isNonEmpty(input.address)) errors.address = 'Address is required';
  if (!isValidTime(input.openTime) || !isValidTime(input.closeTime)) {
    errors.openTime = 'Opening and closing times must be HH:MM';
  } else if (timeToMinutes(input.openTime) >= timeToMinutes(input.closeTime)) {
    errors.openTime = 'Opening time must be before closing time';
  }
  if (!isIntegerInRange(input.counterCount, 1, MAX_COUNTERS)) {
    errors.counterCount = `Counters must be a whole number from 1 to ${MAX_COUNTERS}`;
  }
  const serviceIds = input.serviceIds;
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) errors.serviceIds = 'Select at least one service';
  else if (serviceIds.some((id) => !knownServiceIds.includes(id))) errors.serviceIds = 'Unknown service selected';
  return errors;
}

export function validateService(
  input: Partial<ServiceInput>,
  existing: Service[],
  editingId: string | null,
): FieldErrors {
  const errors: FieldErrors = {};
  const others = existing.filter((s) => s.id !== editingId);
  if (!isNonEmpty(input.name)) errors.name = 'Name is required';
  else if (others.some((s) => sameText(s.name, input.name as string))) errors.name = 'Name is already used';
  if (typeof input.code !== 'string' || !SERVICE_CODE_PATTERN.test(input.code)) {
    errors.code = 'Code must be 2–3 uppercase letters';
  } else if (others.some((s) => s.code === input.code)) errors.code = 'Code is already used';
  if (!isIntegerInRange(input.durationMinutes, 1, MAX_SERVICE_MINUTES)) {
    errors.durationMinutes = `Duration must be a whole number from 1 to ${MAX_SERVICE_MINUTES}`;
  }
  if (!isNonEmpty(input.category)) errors.category = 'Category is required';
  return errors;
}

export function validateStaff(
  input: Partial<StaffInput>,
  users: User[],
  branches: Branch[],
  editingId: string | null,
): FieldErrors {
  const errors: FieldErrors = {};
  const others = users.filter((u) => u.id !== editingId);
  if (!isNonEmpty(input.name)) errors.name = 'Name is required';
  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Enter a valid e-mail address';
  } else if (others.some((u) => sameText(u.email, input.email as string))) errors.email = 'E-mail is already used';
  const branch = branches.find((b) => b.id === input.branchId);
  if (!branch) errors.branchId = 'Select a branch';
  const counter = input.counterNumber;
  if (counter !== null && counter !== undefined) {
    if (!branch || !isIntegerInRange(counter, 1, branch.counterCount)) {
      errors.counterNumber = 'Counter does not exist at this branch';
    }
  }
  return errors;
}
