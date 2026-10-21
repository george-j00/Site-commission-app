import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SectionTab } from '../hooks/useSectionProgress';
import { Icon } from '@/shared/components/Icon';
import { colors, size } from '@/shared/theme';

/** "A — Construction" → { tag: "A", name: "Construction" }; titles without a dash show as-is. */
function split(title: string) {
  const i = title.indexOf(' — ');
  return i > 0 ? { tag: title.slice(0, i), name: title.slice(i + 3) } : { tag: null, name: title };
}

/**
 * One section on screen at a time, so the worker isn't scrolling one huge
 * page on a roof. Each tab shows its own progress or problem count.
 * Scrolls horizontally, so it still works with the real form's eight sections.
 */
export function SectionTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: SectionTab[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((t) => {
          const on = t.id === active;
          const complete = t.total > 0 && t.done === t.total && t.problems === 0;
          const { tag, name } = split(t.title);
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${t.title}, ${t.done} of ${t.total} done${t.problems ? `, ${t.problems} problems` : ''}`}
              style={[styles.tab, on && styles.tabOn]}
            >
              <View
                style={[styles.tag, on && styles.tagOn, complete && styles.tagDone, t.problems > 0 && styles.tagBad]}
              >
                {complete ? (
                  <Icon name="checkmark" size={18} color={colors.primaryText} />
                ) : (
                  <Text style={[styles.tagText, (on || t.problems > 0) && { color: colors.primaryText }]}>
                    {tag ?? '•'}
                  </Text>
                )}
              </View>
              <View>
                <Text style={[styles.name, on && styles.nameOn]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.meta, t.problems > 0 && { color: colors.danger }]}>
                  {t.problems > 0 ? `${t.problems} to fix` : `${t.done}/${t.total} done`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: size.touch,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderRadius: size.radius,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.readOnlyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagOn: { backgroundColor: colors.primary },
  tagDone: { backgroundColor: colors.success },
  tagBad: { backgroundColor: colors.danger },
  tagText: { fontWeight: '800', fontSize: size.label, color: colors.muted },
  name: { fontSize: size.label, fontWeight: '700', color: colors.muted, maxWidth: 150 },
  nameOn: { color: colors.text },
  meta: { fontSize: 12, fontWeight: '700', color: colors.subtle },
});
