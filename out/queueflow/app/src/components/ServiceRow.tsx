import { formatDuration } from '../../shared/labels';
import type { Service } from '../../shared/types';

interface ServiceRowProps {
  service: Service;
  busy: boolean;
  onEdit: (service: Service) => void;
  onToggle: (service: Service) => void;
}

export function ServiceRow({ service, busy, onEdit, onToggle }: ServiceRowProps) {
  return (
    <li className="data-row service-admin-row" data-testid="service-row" data-id={service.id}>
      <span className="cell cell-strong" data-testid="service-row-name">
        {service.name}
      </span>
      <span className="cell" data-testid="service-row-code">
        {service.code}
      </span>
      <span className="cell muted">{service.description}</span>
      <span className="cell" data-testid="service-row-duration">
        {formatDuration(service.durationMinutes)}
      </span>
      <span className="cell" data-testid="service-row-category">
        {service.category}
      </span>
      <span className="cell">
        <span className={`badge ${service.isActive ? 'badge-completed' : 'badge-cancelled'}`} data-testid="service-row-status">
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </span>
      <span className="cell button-row">
        <button type="button" className="btn btn-secondary btn-sm" data-testid="service-edit" onClick={() => onEdit(service)}>
          Edit
        </button>
        <button type="button" className="btn btn-secondary btn-sm" data-testid="service-toggle" disabled={busy} onClick={() => onToggle(service)}>
          {service.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </span>
    </li>
  );
}
