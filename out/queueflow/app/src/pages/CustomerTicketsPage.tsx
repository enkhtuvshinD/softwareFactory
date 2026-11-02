import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { isActiveStatus } from '../../shared/queue';
import type { AppointmentView, TicketView } from '../../shared/types';
import { AppointmentCard } from '../components/AppointmentCard';
import { AsyncView } from '../components/AsyncView';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormError } from '../components/FormError';
import { TicketCard } from '../components/TicketCard';
import { useAction } from '../hooks/useAction';
import { usePolling } from '../hooks/usePolling';
import { useStatusAnnouncement } from '../hooks/useStatusAnnouncement';
import { useToast } from '../hooks/useToast';

type Pending = { kind: 'ticket'; ticket: TicketView } | { kind: 'appointment'; appointment: AppointmentView };

function loadTickets() {
  return Promise.all([api.myTickets(), api.myAppointments()]).then(([tickets, appointments]) => ({ tickets, appointments }));
}

export function CustomerTicketsPage() {
  const state = usePolling(loadTickets);
  const [pending, setPending] = useState<Pending | null>(null);
  const action = useAction();
  const showToast = useToast();
  const announcement = useStatusAnnouncement(state.data?.tickets ?? null);

  async function confirmCancel() {
    if (!pending) return;
    const cancelled = await action.run<unknown>(() =>
      pending.kind === 'ticket' ? api.ticketAction(pending.ticket.id, 'cancel') : api.cancelAppointment(pending.appointment.id),
    );
    setPending(null);
    if (!cancelled) return;
    showToast(pending.kind === 'ticket' ? 'Ticket cancelled' : 'Appointment cancelled');
    await state.reload();
  }

  return (
    <>
      <h1 className="page-title">My Tickets</h1>
      <div className="visually-hidden" aria-live="polite" data-testid="ticket-live">
        {announcement}
      </div>
      <FormError message={action.error?.message} />
      <AsyncView state={state} label="tickets">
        {({ tickets, appointments }) => {
          const activeTickets = tickets.filter((t) => isActiveStatus(t.status));
          const upcoming = appointments.filter((a) => a.status === 'scheduled');
          return (
            <>
              <section aria-labelledby="active-heading">
                <h2 id="active-heading" className="section-title">
                  Active tickets
                </h2>
                {activeTickets.length === 0 ? (
                  <div className="card state-card" data-testid="tickets-empty">
                    <p>No tickets yet</p>
                    <Link className="btn btn-primary" to="/customer">
                      Book a visit
                    </Link>
                  </div>
                ) : (
                  <div className="grid-2">
                    {activeTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} onCancel={(t) => setPending({ kind: 'ticket', ticket: t })} />
                    ))}
                  </div>
                )}
              </section>
              <section aria-labelledby="upcoming-heading">
                <h2 id="upcoming-heading" className="section-title">
                  Upcoming appointments
                </h2>
                {upcoming.length === 0 ? (
                  <p className="card state-card">No upcoming appointments</p>
                ) : (
                  <div className="grid-2">
                    {upcoming.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={(a) => setPending({ kind: 'appointment', appointment: a })}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          );
        }}
      </AsyncView>
      {pending && (
        <ConfirmDialog
          title={pending.kind === 'ticket' ? 'Cancel this ticket?' : 'Cancel this appointment?'}
          message={
            pending.kind === 'ticket'
              ? `You will lose your place in the queue for ${pending.ticket.ticketNumber}.`
              : `Your slot on ${pending.appointment.date} at ${pending.appointment.startTime} will be released.`
          }
          busy={action.busy}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
