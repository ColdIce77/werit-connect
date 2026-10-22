import { create } from 'zustand';

import type { AppRole, Permission } from '../../shared/permissions';

/**
 * Zustand-Store für den Anmeldezustand. Er hält nur Zustand, keine Tokens.
 * Tokens liegen ausschließlich im SecureStore (siehe Authentifizierungskonzept).
 * Die Anmeldung selbst (Entra ID) setzt den Zustand über die Aktionen unten.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'blocked';

export type BlockReason = 'not_compliant' | 'no_access' | 'revoked';

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  language: string;
}

interface AuthState {
  status: AuthStatus;
  blockReason: BlockReason | null;
  user: SessionUser | null;
  roles: AppRole[];
  permissions: Permission[];
  setSignedIn: (session: {
    user: SessionUser;
    roles: AppRole[];
    permissions: Permission[];
  }) => void;
  setSignedOut: () => void;
  setBlocked: (reason: BlockReason) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  blockReason: null,
  user: null,
  roles: [],
  permissions: [],
  setSignedIn: ({ user, roles, permissions }) =>
    set({ status: 'signedIn', blockReason: null, user, roles, permissions }),
  setSignedOut: () =>
    set({ status: 'signedOut', blockReason: null, user: null, roles: [], permissions: [] }),
  setBlocked: (reason) =>
    set({ status: 'blocked', blockReason: reason, user: null, roles: [], permissions: [] }),
}));

export function useHasPermission(permission: Permission): boolean {
  return useAuthStore((state) => state.permissions.includes(permission));
}
