import type { BranchView, User } from '../../shared/types';

interface StaffRowProps {
  staff: User;
  branches: BranchView[];
  onEdit: (staff: User) => void;
}

export function StaffRow({ staff, branches, onEdit }: StaffRowProps) {
  const branch = branches.find((b) => b.id === staff.branchId);
  return (
    <li className="data-row staff-admin-row" data-testid="staff-row" data-id={staff.id}>
      <span className="cell cell-strong" data-testid="staff-row-name">
        {staff.name}
      </span>
      <span className="cell" data-testid="staff-row-email">
        {staff.email}
      </span>
      <span className="cell" data-testid="staff-row-branch">
        {branch?.name ?? '—'}
      </span>
      <span className="cell" data-testid="staff-row-counter">
        {staff.counterNumber === null ? 'Unassigned' : `Counter ${staff.counterNumber}`}
      </span>
      <span className="cell">
        <button type="button" className="btn btn-secondary btn-sm" data-testid="staff-edit" onClick={() => onEdit(staff)}>
          Edit
        </button>
      </span>
    </li>
  );
}
