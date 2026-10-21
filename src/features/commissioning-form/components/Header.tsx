import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

export type Status = { text: string; icon: IconName; tone: 'ok' | 'neutral' };

/** Dark header: what form this is, whether it's safe on the phone, and how far along it is. */
export function Header({
  title,
  status,
  progress,
  version,
}: {
  title: string;
  status: Status;
  progress: number;
  version: string;
}) {
  const pct = Math.round(progress * 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.offline} accessibilityLabel="Works without signal">
          <Icon name="cloud-offline-outline" size={16} color={colors.headerMuted} />
          <Text style={styles.offlineText}>Offline ready</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.chip, status.tone === 'ok' && styles.chipOk]}>
          <Icon name={status.icon} size={16} color={status.tone === 'ok' ? '#86EFAC' : colors.headerMuted} />
          <Text style={[styles.chipText, status.tone === 'ok' && { color: '#86EFAC' }]}>{status.text}</Text>
        </View>
        <Text style={styles.version}>v{version}</Text>
      </View>
      <View style={styles.progressRow} accessibilityLabel={`${pct} percent complete`}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }, pct === 100 && { backgroundColor: '#22C55E' }]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.header, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: colors.headerText, fontSize: 22, fontWeight: '800' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { color: colors.headerMuted, fontSize: 12, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chipOk: { backgroundColor: '#14532D' },
  chipText: { color: colors.headerMuted, fontSize: size.small - 1, fontWeight: '700' },
  version: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#334155', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#60A5FA' },
  pct: { color: colors.headerText, fontSize: size.small, fontWeight: '800', minWidth: 40, textAlign: 'right' },
});
