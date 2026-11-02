import { formatDuration } from '../../shared/labels';
import type { Service } from '../../shared/types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="card" data-testid="service-card" data-id={service.id}>
      <h2 className="card-title" data-testid="service-name">
        {service.name}
      </h2>
      <p className="muted" data-testid="service-description">
        {service.description}
      </p>
      <p>
        <span data-testid="service-duration">{formatDuration(service.durationMinutes)}</span>
      </p>
      <span className="chip" data-testid="service-category">
        {service.category}
      </span>
    </article>
  );
}
