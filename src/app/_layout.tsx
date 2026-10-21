import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { startAutosave } from '@/features/commissioning-form/store/autosave';
import { useFormStore } from '@/features/commissioning-form/store/formStore';
import { FORM_ID } from '@/shared/config';
import { colors } from '@/shared/theme';

/**
 * Root layout. Cold start: open SQLite, load the pinned/cached/bundled
 * definition and the open draft — all local and synchronous, nothing
 * touches the network. Routes render only once that's done.
 */
export default function RootLayout() {
  const ready = useFormStore((s) => s.def !== null && s.draft !== null);
  const error = useFormStore((s) => s.initError);

  useEffect(() => {
    const stop = startAutosave();
    useFormStore.getState().init(FORM_ID);
    return stop;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.msg}>Could not open the form: {error}</Text>
        </View>
      ) : ready ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

/**
 * Catches render crashes anywhere below. The draft is already safe in
 * SQLite, so "Try again" re-renders from stored data with nothing lost.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.msg}>Your entries are saved on this phone.</Text>
      <Text style={styles.detail}>{error.message}</Text>
      <Pressable onPress={retry} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  msg: { fontSize: 17, color: colors.text, textAlign: 'center' },
  detail: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  btn: {
    minHeight: 56,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
});
