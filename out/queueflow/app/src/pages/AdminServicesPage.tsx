import { useState } from 'react';
import { api } from '../api/client';
import type { Service } from '../../shared/types';
import { AsyncView } from '../components/AsyncView';
import { FormError } from '../components/FormError';
import { ServiceForm } from '../components/ServiceForm';
import { ServiceRow } from '../components/ServiceRow';
import { SidePanel } from '../components/SidePanel';
import { useAction } from '../hooks/useAction';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../hooks/useToast';

type PanelState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; service: Service };

export function AdminServicesPage() {
  const state = usePolling(api.services, [], 5000);
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' });
  const action = useAction();
  const showToast = useToast();

  function handleSaved() {
    setPanel({ mode: 'closed' });
    showToast('Service saved');
    void state.reload();
  }

  async function toggle(service: Service) {
    const saved = await action.run(() => api.updateService(service.id, { isActive: !service.isActive }));
    if (!saved) return;
    showToast('Service saved');
    await state.reload();
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Services</h1>
        <button type="button" className="btn btn-primary" data-testid="service-add" onClick={() => setPanel({ mode: 'add' })}>
          Add service
        </button>
      </div>
      <FormError message={action.error?.message} />
      <AsyncView state={state} label="services">
        {(services) => (
          <>
            <ul className="data-list card" aria-label="Services">
              <li className="data-row data-head service-admin-row" aria-hidden="true">
                <span className="cell">Name</span>
                <span className="cell">Code</span>
                <span className="cell">Description</span>
                <span className="cell">Duration</span>
                <span className="cell">Category</span>
                <span className="cell">Status</span>
                <span className="cell" />
              </li>
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  busy={action.busy}
                  onEdit={(s) => setPanel({ mode: 'edit', service: s })}
                  onToggle={(s) => void toggle(s)}
                />
              ))}
            </ul>
            {panel.mode !== 'closed' && (
              <SidePanel title={panel.mode === 'add' ? 'Add service' : 'Edit service'} onClose={() => setPanel({ mode: 'closed' })}>
                <ServiceForm
                  service={panel.mode === 'edit' ? panel.service : null}
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
