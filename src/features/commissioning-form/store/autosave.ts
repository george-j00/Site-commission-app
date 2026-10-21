import { AppState } from 'react-native';
import { Draft, draftRepository } from '@/data/repositories/draftRepository';
import { useFormStore } from './formStore';

/**
 * Every change is written to SQLite ~300 ms after the last keystroke, and
 * immediately when the app leaves the foreground. On Android you have to
 * leave the app (home / recents) before you can swipe it away, so that flush
 * runs before a force-close. Photo taps, Save/Complete and switching forms
 * write straight away.
 */
const DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: Draft | null = null;

export function flush(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (pending) {
    draftRepository.save(pending);
    pending = null;
  }
}

export function startAutosave(): () => void {
  const unsubscribe = useFormStore.subscribe((state, prev) => {
    if (!state.draft || state.draft === prev.draft) return;
    // Switching forms (history / new form): write the old one first, or an
    // edit still waiting on the debounce would be lost.
    if (prev.draft && prev.draft.id !== state.draft.id) draftRepository.save(prev.draft);
    pending = state.draft;
    const discrete =
      !prev.draft ||
      state.draft.id !== prev.draft.id || // new form
      state.draft.photos !== prev.draft.photos || // photo tap
      state.draft.status !== prev.draft.status; // save / complete
    if (discrete) return flush();
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  });

  const sub = AppState.addEventListener('change', (s) => {
    if (s !== 'active') flush();
  });

  return () => {
    flush();
    unsubscribe();
    sub.remove();
  };
}
