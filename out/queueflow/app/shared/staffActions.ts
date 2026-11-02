import type { TicketStatus } from './types';

export interface StaffActionState {
  callNext: boolean;
  start: boolean;
  complete: boolean;
  noShow: boolean;
  cancel: boolean;
  reason: string | null;
}

export function deriveStaffActions(hasCounter: boolean, currentStatus: TicketStatus | null, waitingCount: number): StaffActionState {
  const called = currentStatus === 'called';
  const serving = currentStatus === 'serving';
  const hasCurrent = called || serving;
  const callNext = hasCounter && !hasCurrent && waitingCount > 0;
  return {
    callNext,
    start: called,
    complete: serving,
    noShow: called,
    cancel: hasCurrent,
    reason: reasonFor(hasCounter, currentStatus, waitingCount),
  };
}

function reasonFor(hasCounter: boolean, currentStatus: TicketStatus | null, waitingCount: number): string | null {
  if (!hasCounter) return 'No counter assigned — ask an admin.';
  if (currentStatus === 'called') return 'Finish the current customer before calling next. Start service first to complete.';
  if (currentStatus === 'serving') return 'Finish the current customer before calling next.';
  if (waitingCount === 0) return 'No waiting customers';
  return 'Call a customer first';
}
