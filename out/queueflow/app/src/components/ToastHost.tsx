interface ToastHostProps {
  message: string | null;
}

export function ToastHost({ message }: ToastHostProps) {
  return (
    <div className="toast-region" aria-live="polite">
      {message && (
        <div className="toast" role="status" data-testid="toast">
          <span aria-hidden="true">✓</span> {message}
        </div>
      )}
    </div>
  );
}
