import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from '../lib/storage';

/** Reactive access to locally stored progress and preferences. */
export function useAppData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
