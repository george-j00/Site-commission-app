import type { ResolvedPhotoGroup, ResolvedSlot } from './resolve';

export type Photos = Record<string, { capturedAt: string }>;

/** Visible photo slots that have not been captured yet. Hidden groups/slots never count. */
export function outstandingSlots(groups: ResolvedPhotoGroup[], photos: Photos): ResolvedSlot[] {
  return groups.flatMap((g) => g.slots.filter((s) => !photos[s.id]));
}

/** Captures for visible slots only — what goes into the saved record. */
export function visiblePhotos(groups: ResolvedPhotoGroup[], photos: Photos): Photos {
  const out: Photos = {};
  for (const g of groups) for (const s of g.slots) if (photos[s.id]) out[s.id] = photos[s.id];
  return out;
}
