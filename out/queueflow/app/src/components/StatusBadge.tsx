import { APPOINTMENT_STATUS_LABELS, TICKET_STATUS_ICONS, TICKET_STATUS_LABELS } from '../../shared/labels';
import type { AppointmentStatus, TicketStatus } from '../../shared/types';

type BadgeProps =
  | { kind?: 'ticket'; status: TicketStatus; testId?: string }
  | { kind: 'appointment'; status: AppointmentStatus; testId?: string };

const APPOINTMENT_ICONS: Record<AppointmentStatus, string> = { scheduled: '◔', cancelled: '✕', converted: '✓' };
const APPOINTMENT_TONES: Record<AppointmentStatus, string> = {
  scheduled: 'waiting',
  cancelled: 'cancelled',
  converted: 'completed',
};

export function StatusBadge(props: BadgeProps) {
  const testId = props.testId ?? 'status-badge';
  if (props.kind === 'appointment') {
    return (
      <span className={`badge badge-${APPOINTMENT_TONES[props.status]}`} data-testid={testId}>
        <span aria-hidden="true">{APPOINTMENT_ICONS[props.status]}</span> {APPOINTMENT_STATUS_LABELS[props.status]}
      </span>
    );
  }
  return (
    <span className={`badge badge-${props.status.replace('_', '-')}`} data-testid={testId}>
      <span aria-hidden="true">{TICKET_STATUS_ICONS[props.status]}</span> {TICKET_STATUS_LABELS[props.status]}
    </span>
  );
}
