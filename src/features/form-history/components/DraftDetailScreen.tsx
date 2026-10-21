import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getIn } from '@/core/form-engine/paths';
import type { ResolvedField } from '@/core/form-engine/resolve';
import { ActionBar, Button } from '@/features/commissioning-form/components/ActionBar';
import { useFormStore } from '@/features/commissioning-form/store/formStore';
import { Icon } from '@/shared/components/Icon';
import { formatDateTime, shortId } from '@/shared/format';
import { colors, shadow, size } from '@/shared/theme';
import { formatValue } from '../formatValue';
import { useDraftView } from '../hooks/useDraftView';
import { ProgressBar } from './ProgressBar';
import { StatusPill } from './StatusPill';

/**
 * Read-only view of one stored form: what was entered (visible fields only),
 * photo status, and — unless it's complete — a button to continue editing it.
 */
export function DraftDetailScreen({ id }: { id: string | undefined }) {
  const view = useDraftView(id);
  const currentId = useFormStore((s) => s.draft?.id);
  const openDraft = useFormStore((s) => s.openDraft);
  const insets = useSafeAreaInsets();

  if (view === undefined) return <View style={styles.screen} />;
  if (view === null) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.muted}>This form no longer exists.</Text>
      </View>
    );
  }

  const { draft, ev, progress } = view;
  const editable = draft.status !== 'complete';
  const isCurrent = draft.id === currentId;

  const onContinue = () => {
    if (openDraft(draft.id)) router.dismissTo('/');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingBottom: editable ? 24 : insets.bottom + 24 }}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>Form {shortId(draft.id)}</Text>
            <View style={{ flex: 1 }} />
            <StatusPill status={draft.status} />
          </View>
          <Meta label="Last updated" value={formatDateTime(draft.updatedAt)} />
          {draft.saved ? (
            <Meta
              label={draft.status === 'complete' ? 'Completed' : 'Last saved'}
              value={formatDateTime(draft.saved.at)}
            />
          ) : null}
          <Meta label="Form version" value={`v${draft.formVersion}`} />
          <View style={styles.progressRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar ratio={progress.ratio} />
            </View>
            <Text style={styles.pct}>{Math.round(progress.ratio * 100)}%</Text>
          </View>
        </View>

        {ev.sections.map((s) => (
          <View key={s.def.id} style={styles.card}>
            <Text style={styles.section}>{s.def.title}</Text>
            {s.fields.map((f) => (
              <FieldRow key={f.path} field={f} values={draft.values} record={ev.record} />
            ))}
          </View>
        ))}

        {ev.photoGroups.length ? (
          <View style={styles.card}>
            <Text style={styles.section}>
              {view.def.photoSectionTitle} · {progress.photosDone}/{progress.photosTotal}
            </Text>
            {ev.photoGroups.map((g) => (
              <View key={g.id} style={styles.photoGroup}>
                <Text style={styles.label}>{g.label}</Text>
                <View style={styles.slots}>
                  {g.slots.map((slot) => {
                    const ok = !!draft.photos[slot.id];
                    return (
                      <View key={slot.id} style={[styles.slot, ok ? styles.slotOk : styles.slotMissing]}>
                        <Icon
                          name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={ok ? colors.success : colors.danger}
                        />
                        <Text style={[styles.slotText, { color: ok ? colors.success : colors.danger }]}>
                          {slot.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {editable ? (
        <ActionBar>
          <Button
            label={isCurrent ? 'Back to this form' : 'Continue editing'}
            icon="create-outline"
            onPress={onContinue}
            flex={1}
          />
        </ActionBar>
      ) : null}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

/** One field as label → value; repeaters list each block. Computed values come from the engine's record. */
function FieldRow({ field, values, record }: { field: ResolvedField; values: object; record: object }) {
  if (field.rows) {
    return (
      <View>
        {field.rows.map((r) => (
          <View key={r.index} style={styles.block}>
            <Text style={styles.blockTitle}>{r.label}</Text>
            {r.fields.map((f) => (
              <FieldRow key={f.path} field={f} values={values} record={record} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  const raw = field.def.type === 'computed' ? getIn(record, field.def.id) : getIn(values, field.path);
  const shown = formatValue(field.def, raw);
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>{field.def.label}</Text>
      <Text style={shown ? styles.value : styles.empty}>{shown ?? 'Not filled'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: size.radius,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    gap: 8,
    ...shadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: size.title, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaValue: { fontSize: size.small, fontWeight: '700', color: colors.text },
  muted: { fontSize: size.small, color: colors.muted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  pct: { fontSize: size.small, fontWeight: '800', color: colors.text, minWidth: 40, textAlign: 'right' },
  section: { fontSize: size.text + 1, fontWeight: '800', color: colors.text, marginBottom: 2 },
  fieldRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.readOnlyBg, gap: 2 },
  label: { fontSize: size.small, color: colors.muted, fontWeight: '600' },
  value: { fontSize: size.text, color: colors.text, fontWeight: '700' },
  empty: { fontSize: size.label, color: colors.subtle, fontStyle: 'italic' },
  block: { borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 10, marginVertical: 6 },
  blockTitle: { fontSize: size.label, fontWeight: '800', color: colors.primary, marginBottom: 2 },
  photoGroup: { gap: 6, paddingTop: 6 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  slotOk: { backgroundColor: colors.successSoft },
  slotMissing: { backgroundColor: colors.dangerSoft },
  slotText: { fontSize: size.small, fontWeight: '700' },
});
