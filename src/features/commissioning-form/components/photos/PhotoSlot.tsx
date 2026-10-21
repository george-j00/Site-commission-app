import { memo, useContext } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFormStore } from '@/features/commissioning-form/store/formStore';
import { ScrollTargetsContext } from '../FieldShell';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

/**
 * Stand-in for the camera: tapping records the slot as captured. In the real
 * app this would store the file path, a SHA-256 of the image (to catch the
 * same photo reused on another site), capture time and GPS.
 */
export const PhotoSlot = memo(function PhotoSlot({
  id,
  label,
  highlight,
}: {
  id: string;
  label: string;
  highlight: boolean;
}) {
  const captured = useFormStore((s) => s.draft?.photos[id]);
  const readOnly = useFormStore((s) => s.draft?.status === 'complete');
  const setPhoto = useFormStore((s) => s.setPhoto);
  const targets = useContext(ScrollTargetsContext);

  const onPress = () => {
    if (!captured) return setPhoto(id, true);
    Alert.alert(label, 'Remove this photo?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPhoto(id, false) },
    ]);
  };

  const time = captured
    ? new Date(captured.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const missing = !captured && highlight;
  return (
    <Pressable
      ref={(v) => targets.register(`photo:${id}`, v)}
      disabled={readOnly}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} photo, ${captured ? `captured at ${time}. Tap to remove` : 'not captured. Tap to capture'}`}
      style={({ pressed }) => [
        styles.slot,
        captured ? styles.done : missing ? styles.missing : null,
        pressed && !captured ? { backgroundColor: colors.primarySoft } : null,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: captured ? colors.success : missing ? colors.danger : colors.primary },
        ]}
      >
        <Icon name={captured ? 'checkmark' : 'camera'} size={26} color={colors.primaryText} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.state, { color: captured ? colors.success : missing ? colors.danger : colors.muted }]}>
        {captured ? `Captured ${time}` : missing ? 'Required — tap' : 'Tap to capture'}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  slot: {
    width: '48.5%',
    minHeight: 132,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: size.radius,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  done: { borderStyle: 'solid', borderColor: colors.success, backgroundColor: colors.successSoft },
  missing: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: size.label, fontWeight: '800', color: colors.text, textAlign: 'center' },
  state: { fontSize: size.small, fontWeight: '700', textAlign: 'center' },
});
