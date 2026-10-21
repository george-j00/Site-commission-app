import { Stack, useLocalSearchParams } from 'expo-router';
import { DraftDetailScreen } from '@/features/form-history/components/DraftDetailScreen';

export default function DraftDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Form details' }} />
      <DraftDetailScreen id={id} />
    </>
  );
}
