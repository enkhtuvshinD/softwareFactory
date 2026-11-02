import { describe, expect, it } from 'vitest';
import { deriveStaffActions } from './staffActions';

describe('staff action availability', () => {
  it('enables only Call Next when idle with waiting customers', () => {
    expect(deriveStaffActions(true, null, 2)).toMatchObject({ callNext: true, start: false, complete: false, noShow: false, cancel: false });
  });

  it('explains an empty queue', () => {
    const state = deriveStaffActions(true, null, 0);
    expect(state.callNext).toBe(false);
    expect(state.reason).toBe('No waiting customers');
  });

  it('allows start, no-show and cancel for a called ticket', () => {
    expect(deriveStaffActions(true, 'called', 3)).toMatchObject({ callNext: false, start: true, complete: false, noShow: true, cancel: true });
  });

  it('allows complete and cancel while serving and blocks calling next', () => {
    const state = deriveStaffActions(true, 'serving', 3);
    expect(state).toMatchObject({ callNext: false, start: false, complete: true, noShow: false, cancel: true });
    expect(state.reason).toBe('Finish the current customer before calling next.');
  });

  it('blocks Call Next without a counter', () => {
    expect(deriveStaffActions(false, null, 4).callNext).toBe(false);
  });
});
