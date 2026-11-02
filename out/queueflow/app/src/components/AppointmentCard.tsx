import type { AppointmentView } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface AppointmentCardProps {
  appointment: AppointmentView;
  onCancel: (appointment: AppointmentView) => void;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  return (
    <article className="card appointment-card" data-testid="appointment-card" data-id={appointment.id}>
      <div className="ticket-head">
        <p className="appointment-when" data-testid="appointment-datetime">
          {appointment.date} {appointment.startTime}
        </p>
        <StatusBadge kind="appointment" status={appointment.status} testId="appointment-status" />
      </div>
      <p>
        <span data-testid="appointment-service">{appointment.serviceName}</span> ·{' '}
        <span data-testid="appointment-branch">{appointment.branchName}</span>
      </p>
      <button
        type="button"
        className="btn btn-danger-outline"
        data-testid="appointment-cancel"
        onClick={() => onCancel(appointment)}
      >
        Cancel Appointment
      </button>
    </article>
  );
}
