import { useState } from 'react';
import { api } from '../api/client';
import type { BranchView } from '../../shared/types';
import { AsyncView } from '../components/AsyncView';
import { BranchForm } from '../components/BranchForm';
import { BranchRow } from '../components/BranchRow';
import { SidePanel } from '../components/SidePanel';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../hooks/useToast';

type PanelState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; branch: BranchView };

function loadBranches() {
  return Promise.all([api.branches(), api.services()]).then(([branches, services]) => ({ branches, services }));
}

export function AdminBranchesPage() {
  const state = usePolling(loadBranches, [], 5000);
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' });
  const showToast = useToast();

  function handleSaved() {
    setPanel({ mode: 'closed' });
    showToast('Branch saved');
    void state.reload();
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Branches</h1>
        <button type="button" className="btn btn-primary" data-testid="branch-add" onClick={() => setPanel({ mode: 'add' })}>
          Add branch
        </button>
      </div>
      <AsyncView state={state} label="branches">
        {({ branches, services }) => (
          <>
            <ul className="data-list card" aria-label="Branches">
              <li className="data-row data-head branch-admin-row" aria-hidden="true">
                <span className="cell">Name</span>
                <span className="cell">Code</span>
                <span className="cell">Address</span>
                <span className="cell">Hours (UTC)</span>
                <span className="cell">Counters</span>
                <span className="cell">Services</span>
                <span className="cell">Staff</span>
                <span className="cell">Status</span>
                <span className="cell" />
              </li>
              {branches.map((branch) => (
                <BranchRow key={branch.id} branch={branch} services={services} onEdit={(b) => setPanel({ mode: 'edit', branch: b })} />
              ))}
            </ul>
            {panel.mode !== 'closed' && (
              <SidePanel title={panel.mode === 'add' ? 'Add branch' : 'Edit branch'} onClose={() => setPanel({ mode: 'closed' })}>
                <BranchForm
                  branch={panel.mode === 'edit' ? panel.branch : null}
                  branches={branches}
                  services={services}
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
