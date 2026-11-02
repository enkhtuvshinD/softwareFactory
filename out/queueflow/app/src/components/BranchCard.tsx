import type { BranchView, Service } from '../../shared/types';

interface BranchCardProps {
  branch: BranchView;
  services: Service[];
  selected: boolean;
  onSelect: (branchId: string) => void;
}

export function BranchCard({ branch, services, selected, onSelect }: BranchCardProps) {
  const offered = services.filter((s) => branch.serviceIds.includes(s.id));
  return (
    <article
      className={`card branch-card${selected ? ' branch-card-selected' : ''}`}
      data-testid="branch-card"
      data-id={branch.id}
      onClick={() => onSelect(branch.id)}
    >
      <h2 className="card-title" data-testid="branch-name">
        {branch.name}
      </h2>
      <p className="muted">{branch.address}</p>
      <p>
        {branch.openTime}–{branch.closeTime} UTC
      </p>
      <ul className="chips" aria-label="Services offered">
        {offered.map((service) => (
          <li key={service.id} className="chip">
            {service.name}
          </li>
        ))}
      </ul>
      <p className="waiting-count" data-testid="branch-waiting-count">
        {branch.waitingCount} waiting
      </p>
      <button type="button" className="btn btn-secondary" aria-pressed={selected} onClick={() => onSelect(branch.id)}>
        {selected ? 'Selected' : 'Choose this branch'}
      </button>
    </article>
  );
}
