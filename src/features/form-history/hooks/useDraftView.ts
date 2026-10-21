import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { draftRepository } from '@/data/repositories/draftRepository';
import { flush } from '@/features/commissioning-form/store/autosave';
import { DraftView, loadDraftView } from '../loadDraftView';

/** One stored form for the detail screen; null if it doesn't exist. */
export function useDraftView(id: string | undefined): DraftView | null | undefined {
  const [view, setView] = useState<DraftView | null | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      flush();
      const d = id ? draftRepository.get(id) : null;
      setView(d ? loadDraftView(d) : null);
    }, [id]),
  );
  return view;
}
