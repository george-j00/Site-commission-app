import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { draftRepository } from '@/data/repositories/draftRepository';
import { flush } from '@/features/commissioning-form/store/autosave';
import { FORM_ID } from '@/shared/config';
import { DraftView, loadDraftView } from '../loadDraftView';

/** Every form on the phone, newest first. Reloaded each time the screen comes into focus. */
export function useDraftList(): DraftView[] {
  const [items, setItems] = useState<DraftView[]>([]);
  useFocusEffect(
    useCallback(() => {
      flush(); // write any edit still waiting on the autosave debounce, so the list is current
      setItems(draftRepository.list(FORM_ID).map(loadDraftView));
    }, []),
  );
  return items;
}
