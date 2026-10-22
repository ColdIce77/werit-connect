import { create } from 'zustand';

interface SyncState {
  syncing: boolean;
  /** Zeitpunkt der letzten vollständigen Synchronisation (ms seit 1970) */
  lastSyncAt: number | null;
  /** Anzahl noch nicht gesendeter Aktionen in der Outbox */
  pending: number;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (value: number) => void;
  setPending: (value: number) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  syncing: false,
  lastSyncAt: null,
  pending: 0,
  setSyncing: (syncing) => set({ syncing }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setPending: (pending) => set({ pending }),
  reset: () => set({ syncing: false, lastSyncAt: null, pending: 0 }),
}));
