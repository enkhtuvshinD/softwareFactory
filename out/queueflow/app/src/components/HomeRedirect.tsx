import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { LANDING_PATHS } from '../navItems';

export function HomeRedirect() {
  const { user } = useSession();
  return <Navigate to={LANDING_PATHS[user.role]} replace />;
}
