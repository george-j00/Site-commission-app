import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { formatDateTime, shortId } from '@/shared/format';
import { colors, shadow, size } from '@/shared/theme';
import { formatValue } from '../formatValue';
import type { DraftView } from '../loadDraftView';
import { ProgressBar } from './ProgressBar';
import { StatusPill } from './StatusPill';

/** One form in the history list: status, when, how far along, and its computed results (e.g. PV capacity). */
export function DraftCard({ view, current, onPress }: { view: DraftView; current: boolean; onPress: () => void }) {
  const { draft, ev, progress } = view;
  // Computed fields are the form's "headline numbers" — shown here without knowing which form this is.
  const highlights = ev.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.def.type === 'computed')
    .map((f) => ({ label: f.def.label, value: formatValue(f.def, ev.record[f.def.id]) }))
    .filter((h) => h.value);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Form ${shortId(draft.id)}, ${draft.status}, ${Math.round(progress.ratio * 100)} percent. Open details`}
      style={({ pressed }) => [styles.card, current && styles.current, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.row}>
        <Text style={styles.title}>Form {shortId(draft.id)}</Text>
        {current ? <Text style={styles.currentTag}>OPEN NOW</Text> : null}
        <View style={{ flex: 1 }} />
        <StatusPill status={draft.status} />
      </View>

      <Text style={styles.meta}>Last updated {formatDateTime(draft.updatedAt)}</Text>

      <View style={styles.progressRow}>
        <View style={{ flex: 1 }}>
          <ProgressBar ratio={progress.ratio} />
        </View>
        <Text style={styles.pct}>{Math.round(progress.ratio * 100)}%</Text>
      </View>
      <Text style={styles.meta}>
        {progress.fieldsDone}/{progress.fieldsTotal} fields · {progress.photosDone}/{progress.photosTotal} photos
        {highlights.map((h) => `  ·  ${h.label}: ${h.value}`).join('')}
      </Text>

      <View style={styles.chevron}>
        <Icon name="chevron-forward" size={22} color={colors.subtle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: size.radius,
    padding: 16,
    paddingRight: 40,
    marginHorizontal: 12,
    marginBottom: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  current: { borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: size.text + 1, fontWeight: '800', color: colors.text },
  currentTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  meta: { fontSize: size.small, color: colors.muted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  pct: { fontSize: size.small, fontWeight: '800', color: colors.text, minWidth: 40, textAlign: 'right' },
  chevron: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' },
});
