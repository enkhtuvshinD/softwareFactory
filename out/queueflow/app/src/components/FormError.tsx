interface FormErrorProps {
  message: string | null | undefined;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert" data-testid="form-error">
      <span aria-hidden="true">⚠</span> {message}
    </div>
  );
}
