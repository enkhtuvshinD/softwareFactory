import { cloneElement } from 'react';
import type { ReactElement } from 'react';

interface FieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactElement<Record<string, unknown>>;
}

export function Field({ name, label, error, children }: FieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="field-error" data-testid={`field-error-${name}`}>
          {error}
        </p>
      )}
    </div>
  );
}
