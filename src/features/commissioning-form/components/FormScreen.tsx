import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFormEvaluation } from '../hooks/useFormEvaluation';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { Problem, useProblems } from '../hooks/useProblems';
import { useScrollToField } from '../hooks/useScrollToField';
import { PHOTOS_TAB, useSectionProgress } from '../hooks/useSectionProgress';
import { useToast } from '../hooks/useToast';
import { useVisibleErrors } from '../hooks/useVisibleErrors';
import { useFormStore } from '../store/formStore';
import { ActionBar, Button } from './ActionBar';
import { CompletedCard } from './CompletedCard';
import { FieldRenderer } from './FieldRenderer';
import { ScrollTargetsContext } from './FieldShell';
import { Header, Status } from './Header';
import { PhotoGroup } from './photos/PhotoGroup';
import { ProblemBanner } from './ProblemBanner';
import { ProblemSheet } from './ProblemSheet';
import { SectionTabs } from './SectionTabs';
import { ToastView } from './ToastView';
import { colors } from '@/shared/theme';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Composes the form: header, section tabs, the active section's fields,
 * and the Save / Complete bar. All logic lives in hooks and the engine;
 * this file only wires them together.
 */
export function FormScreen() {
  const def = useFormStore((s) => s.def)!;
  const draft = useFormStore((s) => s.draft)!;
  const restored = useFormStore((s) => s.restored);
  const save = useFormStore((s) => s.save);
  const complete = useFormStore((s) => s.complete);
  const newForm = useFormStore((s) => s.newForm);

  const ev = useFormEvaluation();
  const { shown, errorByPath, showAll } = useVisibleErrors(ev);
  const { tabs, progress } = useSectionProgress(ev, shown, showAll);
  const problems = useProblems(ev, shown, showAll, tabs, def.photoSectionTitle);
  const { scrollRef, contentRef, scrollTargets, scrollTo, scrollToTop } = useScrollToField();
  const { toast, show } = useToast(restored ? { text: 'Your draft was restored', ok: true } : null);
  const keyboardOpen = useKeyboardVisible();

  const [active, setActive] = useState(tabs[0]?.id ?? PHOTOS_TAB);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectSection = (id: string) => {
    setActive(id);
    scrollToTop();
  };
  const goToProblem = (p: Problem) => {
    setSheetOpen(false);
    setActive(p.sectionId);
    scrollTo(p.target, 150); // let the section render before measuring
  };

  const onSave = () => {
    const r = save();
    if (r.canSave) return show('Saved on this phone');
    const n = r.errors.filter((e) => e.kind !== 'required').length;
    show(`Not saved — fix ${n} problem${n > 1 ? 's' : ''} first`, false);
    setSheetOpen(true);
  };
  const onComplete = () => {
    const r = complete();
    if (!r.canComplete) return setSheetOpen(true);
    show('Form completed');
    scrollToTop();
  };
  const onNewForm = () => {
    newForm();
    selectSection(tabs[0]?.id ?? PHOTOS_TAB);
  };

  const isComplete = draft.status === 'complete';
  const status: Status = isComplete
    ? { text: `Completed ${time(draft.saved!.at)}`, icon: 'checkmark-done', tone: 'ok' }
    : draft.status === 'saved'
      ? { text: `Saved ${time(draft.saved!.at)}`, icon: 'checkmark-circle', tone: 'ok' }
      : {
          text: draft.saved ? 'Auto-saved · not re-saved' : 'Auto-saved on phone',
          icon: 'phone-portrait-outline',
          tone: 'neutral',
        };

  const section = ev.sections.find((s) => s.def.id === active);
  const next = tabs[tabs.findIndex((t) => t.id === active) + 1];

  return (
    <ScrollTargetsContext.Provider value={scrollTargets}>
      <View style={styles.screen}>
        <Header title={def.title ?? def.formId} status={status} progress={progress} version={def.version} />
        <SectionTabs tabs={tabs} active={active} onSelect={selectSection} />
        {problems.length > 0 && !isComplete ? (
          <ProblemBanner count={problems.length} onPress={() => setSheetOpen(true)} />
        ) : null}

        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" style={styles.scroll}>
          <View ref={contentRef} collapsable={false} style={styles.content}>
            {isComplete ? <CompletedCard at={time(draft.saved!.at)} /> : null}

            {section?.fields.map((f) => (
              <FieldRenderer
                key={f.path}
                field={f.def}
                path={f.path}
                error={errorByPath[f.path]}
                computedValue={f.def.type === 'computed' ? ev.record[f.def.id] : undefined}
                rows={f.rows}
                errors={f.rows ? errorByPath : undefined}
              />
            ))}

            {active === PHOTOS_TAB
              ? ev.photoGroups.map((g) => <PhotoGroup key={g.id} group={g} highlightMissing={showAll} />)
              : null}

            {!isComplete ? (
              <View style={styles.next}>
                {next ? (
                  <Button
                    label={`Next: ${next.title}`}
                    icon="arrow-forward"
                    variant="secondary"
                    onPress={() => selectSection(next.id)}
                  />
                ) : (
                  <Button label="Review & mark complete" icon="checkmark-done" variant="success" onPress={onComplete} />
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {toast ? <ToastView toast={toast} /> : null}

        {!keyboardOpen ? (
          <ActionBar>
            {isComplete ? (
              <Button label="Start new form" icon="add-circle-outline" onPress={onNewForm} flex={1} />
            ) : (
              <>
                <Button label="Save" icon="save-outline" variant="secondary" onPress={onSave} flex={1} />
                <Button label="Complete" icon="checkmark-done" onPress={onComplete} flex={1.4} />
              </>
            )}
          </ActionBar>
        ) : null}

        <ProblemSheet visible={sheetOpen} problems={problems} onClose={() => setSheetOpen(false)} onGo={goToProblem} />
      </View>
    </ScrollTargetsContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 24 },
  next: { marginHorizontal: 12, marginTop: 4 },
});
