import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import { validateBranch } from '../../shared/validation';
import type { FieldErrors } from '../../shared/validation';
import type { BranchInput, BranchView, Service } from '../../shared/types';
import { useAction } from '../hooks/useAction';
import { Field } from './Field';
import { FormError } from './FormError';

interface BranchFormProps {
  branch: BranchView | null;
  branches: BranchView[];
  services: Service[];
  onSaved: () => void;
  onCancel: () => void;
}

export function BranchForm({ branch, branches, services, onSaved, onCancel }: BranchFormProps) {
  const [name, setName] = useState(branch?.name ?? '');
  const [code, setCode] = useState(branch?.code ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [openTime, setOpenTime] = useState(branch?.openTime ?? '09:00');
  const [closeTime, setCloseTime] = useState(branch?.closeTime ?? '17:00');
  const [counterCount, setCounterCount] = useState(String(branch?.counterCount ?? 1));
  const [serviceIds, setServiceIds] = useState<string[]>(branch?.serviceIds ?? []);
  const [isActive, setIsActive] = useState(branch?.isActive ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const action = useAction();

  function toggleService(serviceId: string) {
    setServiceIds((current) => (current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input: BranchInput = {
      name: name.trim(),
      code,
      address: address.trim(),
      openTime,
      closeTime,
      counterCount: counterCount.trim() === '' ? Number.NaN : Number(counterCount),
      serviceIds,
      isActive,
    };
    const found = validateBranch(input, branches, services.map((s) => s.id), branch?.id ?? null);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const saved = await action.run(() => (branch ? api.updateBranch(branch.id, input) : api.createBranch(input)));
    if (saved) onSaved();
  }

  const serverFields = action.error?.fields ?? {};
  const fieldError = (key: string) => errors[key] ?? serverFields[key];
  const generalMessage = Object.keys(serverFields).length === 0 ? action.error?.message : undefined;

  return (
    <form data-testid="branch-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <FormError message={generalMessage} />
      <Field name="name" label="Name" error={fieldError('name')}>
        <input data-testid="branch-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field name="code" label="Code" error={fieldError('code')}>
        <input
          data-testid="branch-code"
          type="text"
          value={code}
          maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </Field>
      <Field name="address" label="Address" error={fieldError('address')}>
        <input data-testid="branch-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="field-pair">
        <Field name="openTime" label="Opens" error={fieldError('openTime')}>
          <input data-testid="branch-open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
        </Field>
        <Field name="closeTime" label="Closes">
          <input data-testid="branch-close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
        </Field>
      </div>
      <Field name="counterCount" label="Counters" error={fieldError('counterCount')}>
        <input
          data-testid="branch-counters"
          type="number"
          min={1}
          max={20}
          value={counterCount}
          onChange={(e) => setCounterCount(e.target.value)}
        />
      </Field>
      <fieldset className="field">
        <legend>Services offered</legend>
        {services.map((service) => (
          <label key={service.id} className="checkbox">
            <input
              type="checkbox"
              data-testid={`branch-service-${service.id}`}
              checked={serviceIds.includes(service.id)}
              onChange={() => toggleService(service.id)}
            />
            {service.name}
          </label>
        ))}
        {fieldError('serviceIds') && (
          <p className="field-error" data-testid="field-error-serviceIds">
            {fieldError('serviceIds')}
          </p>
        )}
      </fieldset>
      <label className="checkbox">
        <input data-testid="branch-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <div className="button-row">
        <button type="submit" className="btn btn-primary" data-testid="branch-save" disabled={action.busy}>
          {action.busy ? '…' : 'Save branch'}
        </button>
        <button type="button" className="btn btn-secondary" data-testid="branch-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
