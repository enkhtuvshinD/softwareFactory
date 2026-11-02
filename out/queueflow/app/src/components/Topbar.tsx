import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ROLE_LABELS, formatClockTime } from '../../shared/labels';
import type { User } from '../../shared/types';
import { usePolling } from '../hooks/usePolling';
import { useSession } from '../hooks/useSession';
import { LANDING_PATHS } from '../navItems';

export function Topbar() {
  const { users, user, selectUser } = useSession();
  const navigate = useNavigate();
  const clock = usePolling(api.clock);

  function handleSelect(userId: string) {
    const next: User | undefined = users.find((u) => u.id === userId);
    if (!next) return;
    selectUser(next.id);
    navigate(LANDING_PATHS[next.role]);
  }

  return (
    <header className="topbar">
      <span className="brand">QueueFlow</span>
      <span className="topbar-clock" data-testid="clock-now">
        {clock.data ? `UTC ${formatClockTime(clock.data.now)}` : 'UTC --:--'}
      </span>
      <div className="persona">
        <label htmlFor="persona-switcher">Demo account</label>
        <select
          id="persona-switcher"
          data-testid="persona-switcher"
          value={user.id}
          onChange={(event) => handleSelect(event.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {ROLE_LABELS[u.role]}
            </option>
          ))}
        </select>
        <span className="current-user" data-testid="current-user">
          {user.name} · {ROLE_LABELS[user.role]}
        </span>
      </div>
    </header>
  );
}
