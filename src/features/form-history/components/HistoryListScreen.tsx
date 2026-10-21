import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ActionBar, Button } from '@/features/commissioning-form/components/ActionBar';
import { isBlankDraft, useFormStore } from '@/features/commissioning-form/store/formStore';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';
import { useDraftList } from '../hooks/useDraftList';
import { DraftCard } from './DraftCard';

/** Every form stored on this phone — drafts, saved and complete — newest first. */
export function HistoryListScreen() {
  const items = useDraftList();
  const currentId = useFormStore((s) => s.draft?.id);
  const newForm = useFormStore((s) => s.newForm);

  // The open form stays in the list as it is. If it's still empty, reuse it rather than piling up blank drafts.
  const onNewForm = () => {
    const current = useFormStore.getState().draft;
    if (!current || !isBlankDraft(current)) newForm();
    router.dismissTo('/');
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(v) => v.draft.id}
        style={styles.list}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        ListHeaderComponent={
          items.length ? (
            <Text style={styles.hint}>
              {items.length} form{items.length > 1 ? 's' : ''} stored on this phone. Tap one to see details or continue
              it.
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="document-text-outline" size={48} color={colors.subtle} />
            <Text style={styles.emptyText}>No forms yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <DraftCard
            view={item}
            current={item.draft.id === currentId}
            onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.draft.id } })}
          />
        )}
      />
      <ActionBar>
        <Button label="Start new form" icon="add-circle-outline" onPress={onNewForm} flex={1} />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1 },
  hint: { fontSize: size.small, color: colors.muted, marginHorizontal: 16, marginBottom: 10 },
  empty: { alignItems: 'center', gap: 8, paddingTop: 80 },
  emptyText: { fontSize: size.text, color: colors.muted, fontWeight: '700' },
});
