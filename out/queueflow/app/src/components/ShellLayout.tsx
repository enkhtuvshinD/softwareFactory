import { Outlet } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { MainNav } from './MainNav';
import { ShellFooter } from './ShellFooter';
import { Topbar } from './Topbar';

export function ShellLayout() {
  const { user, resetVersion } = useSession();
  return (
    <div className="shell">
      <Topbar />
      <div className="shell-body">
        <MainNav user={user} />
        <main className="content" id="main">
          <Outlet key={`${user.id}-${resetVersion}`} />
        </main>
      </div>
      <ShellFooter />
    </div>
  );
}
