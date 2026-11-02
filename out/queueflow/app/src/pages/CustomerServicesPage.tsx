import { api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { ServiceCard } from '../components/ServiceCard';
import { usePolling } from '../hooks/usePolling';

export function CustomerServicesPage() {
  const state = usePolling(api.services, [], 10000);
  return (
    <>
      <h1 className="page-title">Services</h1>
      <AsyncView state={state} label="services">
        {(services) =>
          services.length === 0 ? (
            <p className="card state-card">No services available</p>
          ) : (
            <div className="grid-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )
        }
      </AsyncView>
    </>
  );
}
