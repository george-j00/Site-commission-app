import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';
import type { Toast } from '../hooks/useToast';

/** Floating confirmation above the action bar ("Saved on this phone"). */
export function ToastView({ toast }: { toast: Toast }) {
  return (
    <View
      style={[styles.toast, { backgroundColor: toast.ok ? colors.success : colors.danger }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Icon name={toast.ok ? 'checkmark-circle' : 'alert-circle'} size={22} color={colors.primaryText} />
      <Text style={styles.text}>{toast.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: size.radius,
  },
  text: { flex: 1, color: colors.primaryText, fontSize: size.label, fontWeight: '700' },
});
