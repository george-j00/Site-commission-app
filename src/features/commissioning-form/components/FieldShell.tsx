import { createContext, ReactNode, useContext } from 'react';
import { HostInstance, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { colors, shadow, size } from '@/shared/theme';

/** Lets the problem list jump to any field: path → its View. */
export type ScrollTargets = { register: (path: string, view: HostInstance | null) => void };
export const ScrollTargetsContext = createContext<ScrollTargets>({ register: () => {} });

type Props = {
  path: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  filled?: boolean; // shows a green tick so the user sees what's done at a glance
  flat?: boolean; // inside a repeater block: no card of its own
  children: ReactNode;
};

/** Card with label, control, help and inline error. Every field type renders inside one. */
export function FieldShell({ path, label, required, help, error, filled, flat, children }: Props) {
  const targets = useContext(ScrollTargetsContext);
  const done = filled && !error;
  return (
    <View
      ref={(v) => targets.register(path, v)}
      style={[flat ? styles.flat : styles.card, error ? styles.cardError : null]}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.req}> *</Text> : null}
        </Text>
        {done ? <Icon name="checkmark-circle" size={22} color={colors.success} /> : null}
      </View>
      {help ? <Text style={styles.help}>{help}</Text> : null}
      {children}
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: size.radius,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  flat: { paddingVertical: 10, borderRadius: size.radius - 4, borderWidth: 2, borderColor: 'transparent' },
  cardError: { borderColor: colors.danger, backgroundColor: '#FFF7F7' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  label: { fontSize: size.label + 1, fontWeight: '700', color: colors.text, flexShrink: 1 },
  req: { color: colors.danger },
  help: { fontSize: size.small, color: colors.muted, marginTop: -4, marginBottom: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  error: { flex: 1, color: colors.danger, fontSize: size.small + 1, fontWeight: '600' },
});
