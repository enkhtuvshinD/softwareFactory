import { api } from '../api/client';
import { formatDateTime } from '../../shared/labels';
import type { ClockView } from '../../shared/types';
import { useAction } from '../hooks/useAction';
import { useToast } from '../hooks/useToast';
import { FormError } from './FormError';

interface ClockControlsProps {
  clock: ClockView | null;
  onChanged: () => void;
}

const ADVANCE_OPTIONS = [
  { minutes: 15, testId: 'clock-advance-15' },
  { minutes: 60, testId: 'clock-advance-60' },
];

export function ClockControls({ clock, onChanged }: ClockControlsProps) {
  const action = useAction();
  const showToast = useToast();

  async function advance(minutes: number) {
    const result = await action.run(() => api.advanceClock(minutes));
    if (!result) return;
    showToast(`Clock advanced ${minutes} min`);
    onChanged();
  }

  async function reset() {
    const result = await action.run(api.resetClock);
    if (!result) return;
    showToast('Clock reset');
    onChanged();
  }

  return (
    <section className="card clock-controls" aria-labelledby="clock-heading">
      <h2 id="clock-heading" className="card-title">
        Demo clock
      </h2>
      <p className="muted">{clock ? `App time ${formatDateTime(clock.now)} UTC` : 'Loading clock…'}</p>
      <FormError message={action.error?.message} />
      <div className="button-row">
        {ADVANCE_OPTIONS.map((option) => (
          <button
            key={option.minutes}
            type="button"
            className="btn btn-secondary"
            data-testid={option.testId}
            disabled={action.busy}
            onClick={() => void advance(option.minutes)}
          >
            +{option.minutes} min
          </button>
        ))}
        <button type="button" className="btn btn-secondary" data-testid="clock-reset" disabled={action.busy} onClick={() => void reset()}>
          Reset clock
        </button>
      </div>
    </section>
  );
}
