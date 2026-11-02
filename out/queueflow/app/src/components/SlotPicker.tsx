import { api } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { FormError } from './FormError';

interface SlotPickerProps {
  branchId: string;
  serviceId: string;
  date: string;
  selected: string | null;
  refreshKey: number;
  onSelect: (startTime: string) => void;
}

const SLOT_POLL_MS = 3000;

export function SlotPicker({ branchId, serviceId, date, selected, refreshKey, onSelect }: SlotPickerProps) {
  const state = usePolling(() => api.slots(branchId, serviceId, date), [branchId, serviceId, date, refreshKey], SLOT_POLL_MS);

  if (state.data === null && state.error) return <FormError message={state.error.message} />;
  if (state.data === null) {
    return (
      <p className="muted" data-testid="loading-state" aria-busy="true">
        Loading slots…
      </p>
    );
  }
  const anyAvailable = state.data.some((slot) => slot.available);
  return (
    <div>
      {!anyAvailable && (
        <p className="muted" data-testid="slots-empty">
          No available slots
        </p>
      )}
      <div className="slot-grid" role="group" aria-label="Appointment slots">
        {state.data.map((slot) => (
          <button
            key={slot.startTime}
            type="button"
            className={`slot${selected === slot.startTime ? ' slot-selected' : ''}`}
            data-testid="slot"
            data-id={slot.startTime}
            data-available={slot.available ? 'true' : 'false'}
            disabled={!slot.available}
            aria-pressed={selected === slot.startTime}
            onClick={() => onSelect(slot.startTime)}
          >
            {slot.available ? slot.startTime : `${slot.startTime} · Unavailable`}
          </button>
        ))}
      </div>
    </div>
  );
}
