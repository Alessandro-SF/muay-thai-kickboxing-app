import { useCallback, useEffect, useRef, useState } from 'react';

/** Copy text to the clipboard with a legacy fallback. status: idle | copied | error */
export function useCopy(resetMs = 2200) {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text) => {
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }
      setStatus(ok ? 'copied' : 'error');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus('idle'), resetMs);
      return ok;
    },
    [resetMs],
  );

  return { copy, status };
}
