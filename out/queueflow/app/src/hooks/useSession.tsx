import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { USER_STORAGE_KEY, api } from '../api/client';
import type { User } from '../../shared/types';
import { AsyncView } from '../components/AsyncView';
import { usePolling } from './usePolling';

const DEFAULT_USER_ID = 'usr_201';

interface Session {
  users: User[];
  user: User;
  resetVersion: number;
  selectUser: (userId: string) => void;
  markDemoReset: () => void;
}

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is missing');
  return session;
}

function initialUserId(users: User[]): string {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (stored && users.some((u) => u.id === stored)) return stored;
  return users.some((u) => u.id === DEFAULT_USER_ID) ? DEFAULT_USER_ID : users[0].id;
}

interface ProviderBodyProps {
  users: User[];
  children: ReactNode;
}

function SessionProviderBody({ users, children }: ProviderBodyProps) {
  const [userId, setUserId] = useState(() => initialUserId(users));
  const [resetVersion, setResetVersion] = useState(0);

  const selectUser = useCallback((nextId: string) => {
    localStorage.setItem(USER_STORAGE_KEY, nextId);
    setUserId(nextId);
  }, []);
  const markDemoReset = useCallback(() => setResetVersion((v) => v + 1), []);

  const value = useMemo<Session>(() => {
    const user = users.find((u) => u.id === userId) ?? users[0];
    return { users, user, resetVersion, selectUser, markDemoReset };
  }, [users, userId, resetVersion, selectUser, markDemoReset]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const state = usePolling(api.users, [], 5000);
  return (
    <AsyncView state={state} label="demo accounts">
      {(users) => <SessionProviderBody users={users}>{children}</SessionProviderBody>}
    </AsyncView>
  );
}
