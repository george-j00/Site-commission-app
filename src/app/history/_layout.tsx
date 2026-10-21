import { Stack } from 'expo-router';
import { colors } from '@/shared/theme';

/** History screens use the native header (title + back button) in the app's dark header colour. */
export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
