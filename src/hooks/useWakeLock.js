import { useEffect } from 'react';

/** Keep the screen awake while `active` (where the Screen Wake Lock API exists). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release();
      } catch {
        lock = null; // denied or unsupported — the workout still runs
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
