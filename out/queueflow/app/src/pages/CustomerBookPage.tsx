import { useState } from 'react';
import { api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { BookingForm } from '../components/BookingForm';
import { BranchCard } from '../components/BranchCard';
import { usePolling } from '../hooks/usePolling';

function loadBookingData() {
  return Promise.all([api.branches(), api.services(), api.clock()]).then(([branches, services, clock]) => ({
    branches,
    services,
    today: clock.businessDate,
  }));
}

export function CustomerBookPage() {
  const state = usePolling(loadBookingData);
  const [branchId, setBranchId] = useState('');

  return (
    <>
      <h1 className="page-title">Book a visit</h1>
      <AsyncView state={state} label="branches">
        {({ branches, services, today }) => (
          <div className="book-layout">
            <div className="book-form-column">
              <BookingForm
                branches={branches}
                services={services}
                branchId={branches.some((b) => b.id === branchId) ? branchId : ''}
                today={today}
                onBranchChange={setBranchId}
              />
            </div>
            <div className="branch-list">
              {branches.length === 0 && <p className="card state-card">No branches available</p>}
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  services={services}
                  selected={branch.id === branchId}
                  onSelect={setBranchId}
                />
              ))}
            </div>
          </div>
        )}
      </AsyncView>
    </>
  );
}
