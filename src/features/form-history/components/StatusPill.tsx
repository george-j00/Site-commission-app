import { StyleSheet, Text, View } from 'react-native';
import type { DraftStatus } from '@/data/repositories/draftRepository';
import { Icon, IconName } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

const STATUS: Record<DraftStatus, { label: string; icon: IconName; fg: string; bg: string }> = {
  draft: { label: 'Draft', icon: 'create-outline', fg: colors.warning, bg: colors.warningSoft },
  saved: { label: 'Saved', icon: 'checkmark-circle-outline', fg: colors.primary, bg: colors.primarySoft },
  complete: { label: 'Complete', icon: 'checkmark-done', fg: colors.success, bg: colors.successSoft },
};

export function StatusPill({ status }: { status: DraftStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Icon name={s.icon} size={16} color={s.fg} />
      <Text style={[styles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: { fontSize: size.small - 1, fontWeight: '800' },
});
