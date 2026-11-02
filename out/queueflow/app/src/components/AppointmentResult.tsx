import { formatCounter } from '../../shared/labels';
import type { AppointmentView } from '../../shared/types';

interface AppointmentResultProps {
  appointment: AppointmentView;
}

export function AppointmentResult({ appointment }: AppointmentResultProps) {
  return (
    <section className="result-panel" data-testid="appointment-result" aria-label="Appointment booked">
      <h2 className="card-title">Appointment booked</h2>
      <p>
        {appointment.serviceName} · {appointment.branchName}
      </p>
      <p>
        Date <strong data-testid="appointment-date">{appointment.date}</strong>
      </p>
      <p>
        Time <strong data-testid="appointment-time">{appointment.startTime}</strong>
      </p>
      <p>
        <strong data-testid="appointment-counter">{formatCounter(appointment.counterNumber)}</strong>
      </p>
    </section>
  );
}
