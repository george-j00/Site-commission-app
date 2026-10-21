import { useCallback, useMemo, useRef } from 'react';
import type { HostInstance, ScrollViewInstance } from 'react-native';
import type { ScrollTargets } from '../components/FieldShell';

/**
 * Lets any field register its View by path, so the problem sheet can scroll
 * straight to it. `delay` gives a just-switched section time to render.
 */
export function useScrollToField() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<HostInstance>(null);
  const targets = useRef(new Map<string, HostInstance>()).current;

  const scrollTargets = useMemo<ScrollTargets>(
    () => ({ register: (path, v) => (v ? targets.set(path, v) : targets.delete(path)) }),
    [targets],
  );

  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), []);

  const scrollTo = useCallback(
    (path: string, delay = 0) => {
      setTimeout(() => {
        const view = targets.get(path);
        if (!view || !contentRef.current) return;
        view.measureLayout(contentRef.current, (_x, y) =>
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }),
        );
      }, delay);
    },
    [targets],
  );

  return { scrollRef, contentRef, scrollTargets, scrollTo, scrollToTop };
}
