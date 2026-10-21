import { Stack } from 'expo-router';
import { HistoryListScreen } from '@/features/form-history/components/HistoryListScreen';

export default function HistoryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'History' }} />
      <HistoryListScreen />
    </>
  );
}
