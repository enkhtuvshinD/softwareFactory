import { NavLink } from 'react-router-dom';
import type { User } from '../../shared/types';
import { navItemsFor } from '../navItems';

interface MainNavProps {
  user: User;
}

export function MainNav({ user }: MainNavProps) {
  return (
    <nav className="main-nav" aria-label="Main">
      {navItemsFor(user).map((item) => (
        <NavLink key={item.testId} to={item.to} end={item.end} className="nav-link" data-testid={item.testId}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
