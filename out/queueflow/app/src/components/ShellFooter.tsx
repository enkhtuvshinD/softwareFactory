import { useState } from 'react';
import { api } from '../api/client';
import { useAction } from '../hooks/useAction';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from './ConfirmDialog';
import { FormError } from './FormError';

export function ShellFooter() {
  const [confirming, setConfirming] = useState(false);
  const { markDemoReset } = useSession();
  const showToast = useToast();
  const action = useAction();

  async function resetDemo() {
    const result = await action.run(api.resetDemo);
    if (!result) {
      setConfirming(false);
      return;
    }
    setConfirming(false);
    markDemoReset();
    showToast('Demo data reset');
  }

  return (
    <footer className="shell-footer">
      <p className="muted">Demo accounts – no passwords. Times are shown in UTC.</p>
      <FormError message={action.error?.message} />
      <button type="button" className="btn btn-secondary" data-testid="demo-reset" onClick={() => setConfirming(true)}>
        Reset demo data
      </button>
      {confirming && (
        <ConfirmDialog
          title="Reset demo data?"
          message="All tickets, appointments and changes return to the seeded demo state."
          busy={action.busy}
          onConfirm={() => void resetDemo()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </footer>
  );
}
