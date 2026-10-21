import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormScreen } from '@/features/commissioning-form/components/FormScreen';
import { colors } from '@/shared/theme';

/** The commissioning form. Top inset takes the dark header colour; the action bar handles the bottom inset. */
export default function FormRoute() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <FormScreen />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.header },
  body: { flex: 1, backgroundColor: colors.bg },
});
