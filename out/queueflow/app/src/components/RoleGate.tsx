import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '../../shared/types';
import { useSession } from '../hooks/useSession';
import { LANDING_PATHS } from '../navItems';

interface RoleGateProps {
  role: Role;
  children: ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const { user } = useSession();
  if (user.role === role) return <>{children}</>;
  return (
    <div className="card state-card" data-testid="forbidden-state">
      <h1>You don't have access to this page</h1>
      <p className="muted">This page is for {role} accounts.</p>
      <Link className="btn btn-primary" to={LANDING_PATHS[user.role]}>
        Go to your home page
      </Link>
    </div>
  );
}
