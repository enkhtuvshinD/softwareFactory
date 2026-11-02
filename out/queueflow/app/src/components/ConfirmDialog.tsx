import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    keepRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    if (!buttons || buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="overlay" onKeyDown={handleKeyDown}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        data-testid="confirm-dialog"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="button-row">
          <button type="button" className="btn btn-danger" data-testid="confirm-yes" disabled={busy} onClick={onConfirm}>
            {busy ? '…' : 'Confirm'}
          </button>
          <button ref={keepRef} type="button" className="btn btn-secondary" data-testid="confirm-no" onClick={onCancel}>
            Keep
          </button>
        </div>
      </div>
    </div>
  );
}
