import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api/client';
import { validateStaff } from '../../shared/validation';
import type { FieldErrors } from '../../shared/validation';
import type { BranchView, StaffInput, User } from '../../shared/types';
import { useAction } from '../hooks/useAction';
import { Field } from './Field';
import { FormError } from './FormError';

interface StaffFormProps {
  staff: User | null;
  users: User[];
  branches: BranchView[];
  onSaved: () => void;
  onCancel: () => void;
}

export function StaffForm({ staff, users, branches, onSaved, onCancel }: StaffFormProps) {
  const [name, setName] = useState(staff?.name ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [branchId, setBranchId] = useState(staff?.branchId ?? branches[0]?.id ?? '');
  const [counter, setCounter] = useState(staff?.counterNumber === null || staff === null ? '' : String(staff.counterNumber));
  const [errors, setErrors] = useState<FieldErrors>({});
  const action = useAction();

  const selectedBranch = branches.find((b) => b.id === branchId);
  const counterOptions = Array.from({ length: selectedBranch?.counterCount ?? 0 }, (_, i) => i + 1);

  function changeBranch(nextBranchId: string) {
    setBranchId(nextBranchId);
    setCounter('');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input: StaffInput = {
      name: name.trim(),
      email: email.trim(),
      branchId,
      counterNumber: counter === '' ? null : Number(counter),
    };
    const found = validateStaff(input, users, branches, staff?.id ?? null);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const saved = await action.run(() => (staff ? api.updateStaff(staff.id, input) : api.createStaff(input)));
    if (saved) onSaved();
  }

  const serverFields = action.error?.fields ?? {};
  const fieldError = (key: string) => errors[key] ?? serverFields[key];
  const generalMessage = Object.keys(serverFields).length === 0 ? action.error?.message : undefined;

  return (
    <form data-testid="staff-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <FormError message={generalMessage} />
      <Field name="name" label="Name" error={fieldError('name')}>
        <input data-testid="staff-form-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field name="email" label="E-mail" error={fieldError('email')}>
        <input data-testid="staff-form-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field name="branchId" label="Branch" error={fieldError('branchId')}>
        <select data-testid="staff-form-branch" value={branchId} onChange={(e) => changeBranch(e.target.value)}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
      <Field name="counterNumber" label="Counter" error={fieldError('counterNumber')}>
        <select data-testid="staff-form-counter" value={counter} onChange={(e) => setCounter(e.target.value)}>
          <option value="">Unassigned</option>
          {counterOptions.map((n) => (
            <option key={n} value={String(n)}>
              Counter {n}
            </option>
          ))}
        </select>
      </Field>
      <div className="button-row">
        <button type="submit" className="btn btn-primary" data-testid="staff-form-save" disabled={action.busy}>
          {action.busy ? '…' : 'Save staff'}
        </button>
        <button type="button" className="btn btn-secondary" data-testid="staff-form-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
