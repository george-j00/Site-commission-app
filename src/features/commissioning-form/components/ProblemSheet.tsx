import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Problem } from '../hooks/useProblems';
import { Icon, IconName } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

const KIND: Record<Problem['kind'], { icon: IconName; color: string; bg: string }> = {
  rule: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerSoft },
  invalid: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerSoft },
  required: { icon: 'create-outline', color: colors.warning, bg: colors.warningSoft },
  photo: { icon: 'camera-outline', color: colors.warning, bg: colors.warningSoft },
};

/** Bottom sheet listing every problem: which rule broke and where. Tap one to jump to it. */
export function ProblemSheet({
  visible,
  problems,
  onClose,
  onGo,
}: {
  visible: boolean;
  problems: Problem[];
  onClose: () => void;
  onGo: (p: Problem) => void;
}) {
  const insets = useSafeAreaInsets();
  const blocking = problems.filter((p) => p.kind === 'rule' || p.kind === 'invalid').length;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close problem list" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grip} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {problems.length} thing{problems.length === 1 ? '' : 's'} to fix
            </Text>
            {blocking ? (
              <Text style={styles.sub}>{blocking} must be fixed before you can Save</Text>
            ) : (
              <Text style={styles.sub}>Needed before Mark complete</Text>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {problems.map((p) => {
            const k = KIND[p.kind];
            return (
              <Pressable
                key={p.key}
                onPress={() => onGo(p)}
                accessibilityRole="link"
                accessibilityLabel={`${p.text}, in ${p.where}. Go to it`}
                style={({ pressed }) => [styles.item, { backgroundColor: k.bg }, pressed && { opacity: 0.7 }]}
              >
                <Icon name={k.icon} size={24} color={k.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{p.text}</Text>
                  <Text style={styles.where}>{p.where}</Text>
                </View>
                <Icon name="arrow-forward" size={22} color={colors.muted} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8 },
  grip: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: size.title, fontWeight: '800', color: colors.text },
  sub: { fontSize: size.small, color: colors.muted, marginTop: 2 },
  close: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: size.radius - 2,
    minHeight: size.touch + 8,
  },
  itemText: { fontSize: size.label, fontWeight: '700', color: colors.text },
  where: { fontSize: size.small - 1, color: colors.muted, marginTop: 2 },
});
