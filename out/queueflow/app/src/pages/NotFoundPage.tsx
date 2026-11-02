import { Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { LANDING_PATHS } from '../navItems';

export function NotFoundPage() {
  const { user } = useSession();
  return (
    <div className="card state-card" data-testid="not-found">
      <h1>Page not found</h1>
      <Link className="btn btn-primary" to={LANDING_PATHS[user.role]}>
        Go to your home page
      </Link>
    </div>
  );
}
