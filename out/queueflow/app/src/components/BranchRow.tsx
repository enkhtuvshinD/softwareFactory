import type { BranchView, Service } from '../../shared/types';

interface BranchRowProps {
  branch: BranchView;
  services: Service[];
  onEdit: (branch: BranchView) => void;
}

export function BranchRow({ branch, services, onEdit }: BranchRowProps) {
  const offered = services.filter((s) => branch.serviceIds.includes(s.id));
  return (
    <li className="data-row branch-admin-row" data-testid="branch-row" data-id={branch.id}>
      <span className="cell cell-strong" data-testid="branch-row-name">
        {branch.name}
      </span>
      <span className="cell" data-testid="branch-row-code">
        {branch.code}
      </span>
      <span className="cell" data-testid="branch-row-address">
        {branch.address}
      </span>
      <span className="cell" data-testid="branch-row-hours">
        {branch.openTime}–{branch.closeTime}
      </span>
      <span className="cell" data-testid="branch-row-counters">
        {branch.counterCount}
      </span>
      <span className="cell" data-testid="branch-row-services">
        {offered.map((s) => s.name).join(', ')}
      </span>
      <span className="cell" data-testid="branch-row-staff">
        {branch.staff.map((s) => s.name).join(', ') || '—'}
      </span>
      <span className="cell">
        <span className={`badge ${branch.isActive ? 'badge-completed' : 'badge-cancelled'}`} data-testid="branch-row-status">
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </span>
      <span className="cell">
        <button type="button" className="btn btn-secondary btn-sm" data-testid="branch-edit" onClick={() => onEdit(branch)}>
          Edit
        </button>
      </span>
    </li>
  );
}
