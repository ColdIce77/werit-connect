import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function isOnlineState(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export async function isOnlineNow(): Promise<boolean> {
  return isOnlineState(await NetInfo.fetch());
}

/** true, solange eine Verbindung besteht. Vor der ersten Messung gilt "online". */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => NetInfo.addEventListener((state) => setOnline(isOnlineState(state))), []);

  return online;
}
