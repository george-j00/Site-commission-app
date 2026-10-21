import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormScreen } from '@/features/commissioning-form/components/FormScreen';
import { useFormStore } from '@/features/commissioning-form/store/formStore';
import { colors } from '@/shared/theme';

/** The commissioning form. Top inset takes the dark header colour; the action bar handles the bottom inset. */
export default function FormRoute() {
  // Remount per form, so switching drafts (history / new form) starts on the first tab, scrolled to top.
  const draftId = useFormStore((s) => s.draft?.id);
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <FormScreen key={draftId} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.header },
  body: { flex: 1, backgroundColor: colors.bg },
});
