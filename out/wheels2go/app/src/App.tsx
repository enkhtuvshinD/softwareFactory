import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { api, DEFAULT_USER_ID, storedUserId, USER_KEY } from './api';
import { LoadState } from './components';
import { SessionContext, ToastProvider, useAsync, useSession } from './hooks';
import {
  CarDetailPage,
  EarningsPage,
  EditListingPage,
  MarketplacePage,
  MyBookingsPage,
  NewListingPage,
  OwnerListingsPage,
  OwnerRequestsPage,
} from './pages';
import './styles/app.css';

function Avatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <span className="avatar avatar-fallback" aria-hidden="true">{name.charAt(0)}</span>;
  }
  return <img className="avatar" src={src} alt="" onError={() => setFailed(true)} />;
}

function Header() {
  const { users, user, switchUser } = useSession();
  const role = user?.role === 'owner' ? 'Owner' : 'Renter';
  const navLinks =
    user?.role === 'owner'
      ? [
          ['/', 'Marketplace', 'nav-marketplace'],
          ['/owner/listings', 'My Listings', 'nav-my-listings'],
          ['/owner/requests', 'Booking Requests', 'nav-booking-requests'],
          ['/owner/earnings', 'Earnings', 'nav-earnings'],
        ]
      : [
          ['/', 'Marketplace', 'nav-marketplace'],
          ['/my-bookings', 'My Bookings', 'nav-my-bookings'],
        ];
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" data-testid="brand-link">Wheels2Go</Link>
        <div className="user-area">
          {user && <Avatar src={user.avatar_url} name={user.name} />}
          <span className="current-user" data-testid="current-user">{user ? `${user.name} · ${role}` : ''}</span>
          <select
            className="switcher"
            data-testid="account-switcher"
            aria-label="Switch account"
            value={user?.id ?? ''}
            onChange={(e) => switchUser(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'owner' ? 'Owner' : 'Renter'})
              </option>
            ))}
          </select>
        </div>
        <nav className="nav" aria-label="Primary">
          {navLinks.map(([to, label, testid]) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link" data-testid={testid}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Shell() {
  const navigate = useNavigate();
  const users = useAsync(() => api.users(), []);
  const [userId, setUserId] = useState(storedUserId());

  const switchUser = useCallback(
    (id: string) => {
      localStorage.setItem(USER_KEY, id);
      setUserId(id);
      navigate('/');
    },
    [navigate],
  );

  const list = users.data ?? [];
  const user = list.find((u) => u.id === userId) ?? list.find((u) => u.id === DEFAULT_USER_ID) ?? list[0] ?? null;
  useEffect(() => {
    if (user && user.id !== userId) {
      localStorage.setItem(USER_KEY, user.id);
      setUserId(user.id);
    }
  }, [user, userId]);

  const session = useMemo(() => ({ users: list, user, switchUser }), [list, user, switchUser]);

  return (
    <SessionContext.Provider value={session}>
      <Header />
      <main className="content">
        {user ? (
          <Routes>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/owner/listings" element={<OwnerListingsPage />} />
            <Route path="/owner/listings/new" element={<NewListingPage />} />
            <Route path="/owner/listings/:id/edit" element={<EditListingPage />} />
            <Route path="/owner/requests" element={<OwnerRequestsPage />} />
            <Route path="/owner/earnings" element={<EarningsPage />} />
            <Route
              path="*"
              element={
                <div className="state" data-testid="not-found">
                  <p>Page not found</p>
                  <Link to="/" className="btn btn-secondary">Back to marketplace</Link>
                </div>
              }
            />
          </Routes>
        ) : (
          <LoadState loading={users.loading} error={users.error} onRetry={users.reload} loadingText="Loading…" />
        )}
      </main>
      <footer className="footer">
        <small data-testid="demo-note">Demo accounts — no real authentication.</small>
      </footer>
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </BrowserRouter>
  );
}
