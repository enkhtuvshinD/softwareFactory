import { useState } from 'react';
import { api } from '../api/client';
import type { User } from '../../shared/types';
import { AsyncView } from '../components/AsyncView';
import { SidePanel } from '../components/SidePanel';
import { StaffForm } from '../components/StaffForm';
import { StaffRow } from '../components/StaffRow';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../hooks/useToast';

type PanelState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; staff: User };

function loadStaff() {
  return Promise.all([api.staff(), api.branches(), api.users()]).then(([staff, branches, users]) => ({ staff, branches, users }));
}

export function AdminStaffPage() {
  const state = usePolling(loadStaff, [], 5000);
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' });
  const showToast = useToast();

  function handleSaved() {
    setPanel({ mode: 'closed' });
    showToast('Staff saved');
    void state.reload();
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Staff</h1>
        <button type="button" className="btn btn-primary" data-testid="staff-add" onClick={() => setPanel({ mode: 'add' })}>
          Add staff
        </button>
      </div>
      <AsyncView state={state} label="staff">
        {({ staff, branches, users }) => (
          <>
            <ul className="data-list card" aria-label="Staff">
              <li className="data-row data-head staff-admin-row" aria-hidden="true">
                <span className="cell">Name</span>
                <span className="cell">E-mail</span>
                <span className="cell">Branch</span>
                <span className="cell">Counter</span>
                <span className="cell" />
              </li>
              {staff.map((member) => (
                <StaffRow key={member.id} staff={member} branches={branches} onEdit={(s) => setPanel({ mode: 'edit', staff: s })} />
              ))}
            </ul>
            {panel.mode !== 'closed' && (
              <SidePanel title={panel.mode === 'add' ? 'Add staff' : 'Edit staff'} onClose={() => setPanel({ mode: 'closed' })}>
                <StaffForm
                  staff={panel.mode === 'edit' ? panel.staff : null}
                  users={users}
                  branches={branches}
                  onSaved={handleSaved}
                  onCancel={() => setPanel({ mode: 'closed' })}
                />
              </SidePanel>
            )}
          </>
        )}
      </AsyncView>
    </>
  );
}
