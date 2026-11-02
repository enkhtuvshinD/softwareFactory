import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import { addDaysToDate, MAX_BOOKING_DAYS_AHEAD } from '../../shared/time';
import type { AppointmentView, BranchView, Service, TicketView } from '../../shared/types';
import { useAction } from '../hooks/useAction';
import { useToast } from '../hooks/useToast';
import { AppointmentResult } from './AppointmentResult';
import { FormError } from './FormError';
import { SlotPicker } from './SlotPicker';
import { TicketResult } from './TicketResult';

type VisitMode = 'walkin' | 'appointment';

interface BookingFormProps {
  branches: BranchView[];
  services: Service[];
  branchId: string;
  today: string;
  onBranchChange: (branchId: string) => void;
}

export function BookingForm({ branches, services, branchId, today, onBranchChange }: BookingFormProps) {
  const [serviceId, setServiceId] = useState('');
  const [mode, setMode] = useState<VisitMode>('walkin');
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<string | null>(null);
  const [slotRefresh, setSlotRefresh] = useState(0);
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [appointment, setAppointment] = useState<AppointmentView | null>(null);
  const action = useAction();
  const showToast = useToast();

  const branch = branches.find((b) => b.id === branchId);
  const offeredServices = services.filter((s) => s.isActive && branch?.serviceIds.includes(s.id));
  const activeServiceId = offeredServices.some((s) => s.id === serviceId) ? serviceId : '';
  const isAppointment = mode === 'appointment';
  const canSubmit = Boolean(branch && activeServiceId) && (!isAppointment || slot !== null);

  function changeBranch(nextBranchId: string) {
    setSlot(null);
    onBranchChange(nextBranchId);
  }

  async function bookWalkIn() {
    const created = await action.run(() => api.createTicket(branchId, activeServiceId));
    if (created) setTicket(created);
  }

  async function bookAppointment() {
    if (slot === null) return;
    const booked = await action.run(() => api.bookAppointment(branchId, activeServiceId, date, slot));
    if (booked) {
      setAppointment(booked);
      showToast(`Appointment booked for ${booked.date} at ${booked.startTime}`);
    }
    setSlot(null);
    setSlotRefresh((n) => n + 1);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    void (isAppointment ? bookAppointment() : bookWalkIn());
  }

  if (ticket) {
    return <TicketResult ticket={ticket} onBookAnother={() => setTicket(null)} />;
  }

  return (
    <form className="card booking-card" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">Book a visit</h2>
      <FormError message={action.error?.message} />
      {appointment && <AppointmentResult appointment={appointment} />}
      <div className="field">
        <label htmlFor="book-branch">Branch</label>
        <select id="book-branch" data-testid="book-branch" value={branchId} onChange={(e) => changeBranch(e.target.value)}>
          <option value="">Select a branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="book-service">Service</label>
        <select
          id="book-service"
          data-testid="book-service"
          value={activeServiceId}
          disabled={!branch}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSlot(null);
          }}
        >
          <option value="">Select a service</option>
          {offeredServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="field radio-group">
        <legend>Visit type</legend>
        <label className="radio">
          <input
            type="radio"
            name="visit-type"
            data-testid="book-mode-walkin"
            checked={!isAppointment}
            onChange={() => setMode('walkin')}
          />
          Walk-in Queue
        </label>
        <label className="radio">
          <input
            type="radio"
            name="visit-type"
            data-testid="book-mode-appointment"
            checked={isAppointment}
            onChange={() => setMode('appointment')}
          />
          Scheduled Appointment
        </label>
      </fieldset>
      {isAppointment && (
        <>
          <div className="field">
            <label htmlFor="book-date">Date</label>
            <input
              id="book-date"
              type="date"
              data-testid="book-date"
              value={date}
              min={today}
              max={addDaysToDate(today, MAX_BOOKING_DAYS_AHEAD)}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
            />
          </div>
          {branch && activeServiceId && (
            <SlotPicker
              branchId={branchId}
              serviceId={activeServiceId}
              date={date}
              selected={slot}
              refreshKey={slotRefresh}
              onSelect={setSlot}
            />
          )}
        </>
      )}
      <button type="submit" className="btn btn-primary" data-testid="book-submit" disabled={action.busy || !canSubmit}>
        {action.busy ? '…' : isAppointment ? 'Book Appointment' : 'Generate Ticket'}
      </button>
    </form>
  );
}
