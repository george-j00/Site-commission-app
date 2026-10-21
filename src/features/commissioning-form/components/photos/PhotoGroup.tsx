import { StyleSheet, Text, View } from 'react-native';
import type { ResolvedPhotoGroup } from '@/core/form-engine/resolve';
import { useFormStore } from '@/features/commissioning-form/store/formStore';
import { colors, shadow, size } from '@/shared/theme';
import { PhotoSlot } from './PhotoSlot';

export function PhotoGroup({ group, highlightMissing }: { group: ResolvedPhotoGroup; highlightMissing: boolean }) {
  const done = useFormStore((s) => group.slots.filter((slot) => s.draft?.photos[slot.id]).length);
  const all = done === group.slots.length;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{group.label}</Text>
        <Text style={[styles.count, all ? styles.countDone : null]}>
          {done}/{group.slots.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {group.slots.map((s) => (
          <PhotoSlot key={s.id} id={s.id} label={s.label} highlight={highlightMissing} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: size.radius,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    ...shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: size.text + 1, fontWeight: '800', color: colors.text },
  count: {
    fontSize: size.small,
    fontWeight: '800',
    color: colors.muted,
    backgroundColor: colors.readOnlyBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countDone: { color: colors.success, backgroundColor: colors.successSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
});
