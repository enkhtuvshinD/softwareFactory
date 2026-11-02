import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import { validateService } from '../../shared/validation';
import type { FieldErrors } from '../../shared/validation';
import type { Service, ServiceInput } from '../../shared/types';
import { useAction } from '../hooks/useAction';
import { Field } from './Field';
import { FormError } from './FormError';

interface ServiceFormProps {
  service: Service | null;
  services: Service[];
  onSaved: () => void;
  onCancel: () => void;
}

export function ServiceForm({ service, services, onSaved, onCancel }: ServiceFormProps) {
  const [name, setName] = useState(service?.name ?? '');
  const [code, setCode] = useState(service?.code ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 15));
  const [category, setCategory] = useState(service?.category ?? '');
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const action = useAction();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input: ServiceInput = {
      name: name.trim(),
      code,
      description: description.trim(),
      durationMinutes: duration.trim() === '' ? Number.NaN : Number(duration),
      category: category.trim(),
      isActive,
    };
    const found = validateService(input, services, service?.id ?? null);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const saved = await action.run(() => (service ? api.updateService(service.id, input) : api.createService(input)));
    if (saved) onSaved();
  }

  const serverFields = action.error?.fields ?? {};
  const fieldError = (key: string) => errors[key] ?? serverFields[key];
  const generalMessage = Object.keys(serverFields).length === 0 ? action.error?.message : undefined;

  return (
    <form data-testid="service-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <FormError message={generalMessage} />
      <Field name="name" label="Name" error={fieldError('name')}>
        <input data-testid="service-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field name="code" label="Code" error={fieldError('code')}>
        <input
          data-testid="service-code"
          type="text"
          value={code}
          maxLength={3}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </Field>
      <Field name="description" label="Description" error={fieldError('description')}>
        <textarea data-testid="service-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field name="durationMinutes" label="Duration (minutes)" error={fieldError('durationMinutes')}>
        <input
          data-testid="service-duration-input"
          type="number"
          min={1}
          max={240}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </Field>
      <Field name="category" label="Category" error={fieldError('category')}>
        <input data-testid="service-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
      </Field>
      <label className="checkbox">
        <input data-testid="service-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <div className="button-row">
        <button type="submit" className="btn btn-primary" data-testid="service-save" disabled={action.busy}>
          {action.busy ? '…' : 'Save service'}
        </button>
        <button type="button" className="btn btn-secondary" data-testid="service-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
