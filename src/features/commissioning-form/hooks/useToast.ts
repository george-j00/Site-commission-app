import { useCallback, useEffect, useState } from 'react';

export type Toast = { text: string; ok: boolean };

/** A short message that clears itself after a few seconds. */
export function useToast(initial: Toast | null = null, ms = 2800) {
  const [toast, setToast] = useState<Toast | null>(initial);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast, ms]);
  const show = useCallback((text: string, ok = true) => setToast({ text, ok }), []);
  return { toast, show };
}
