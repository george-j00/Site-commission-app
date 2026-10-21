# Site Commissioning — offline field capture

Expo (React Native) + TypeScript. Three sections (Construction, Utility, Photos) of a commissioning form that works fully offline, survives force-close, and is defined by one JSON file.

## Run it

```bash
npm install
npx expo start          # Expo Go, or press "a" / "i" for an emulator / simulator
npm test                # engine, store and repository tests
npm run lint            # ESLint + Prettier (eslint-config-expo)
npm run typecheck       # tsc --noEmit
eas build -p android --profile preview   # standalone APK (needed for a true airplane-mode cold start)
```

## How it's structured

**The form is data.** `src/core/form-definition/form.v1.json` describes sections, fields, dropdown options, visibility, computed values, validation rules and photo slots. Anything conditional is a [JSON Logic](https://jsonlogic.com) expression. The code holds only generic field types and an evaluator: nothing outside the JSON knows what "earthing" or "ESS" is.

Layers, with dependencies pointing downwards only:

```
src/
  app/                          Expo Router — routes only
    _layout.tsx                   providers, startup (DB + definition + draft), ErrorBoundary
    index.tsx                     the form route
    history/index.tsx, [id].tsx   list of every form on the phone, and one form's details
  features/commissioning-form/  React layer
    components/                   FormScreen (composition only), Header, SectionTabs, ProblemSheet,
                                  ActionBar, FieldRenderer (field type → component registry), fields/*, photos/*
    hooks/                        useFormEvaluation, useVisibleErrors, useSectionProgress, useProblems,
                                  useScrollToField, useToast, useKeyboardVisible, useField
    store/                        formStore (zustand, per-field selectors), autosave (debounce + background flush)
  features/form-history/        History: list drafts / saved / complete, view details, "Continue editing"
  data/                         persistence — the only code that writes SQL
    db/client.ts                  expo-sqlite connection + versioned migrations (PRAGMA user_version)
    repositories/                 draftRepository, definitionRepository (cached > bundled; refresh() stub)
  core/                         pure TypeScript, no React — all unit-tested
    form-definition/              form.v1.json + zod schema (rejects unknown operators / schemaVersion)
    form-engine/                  logic (JSON Logic + round/unique), visibility, repeat, computed,
                                  validate, resolve, completeness, form.evaluateForm()
  shared/                       theme tokens, Icon, config (FORM_ID)
```

**Why the engine is plain TypeScript.** The rules are business logic, not UI. Keeping them pure means they are tested in milliseconds without a device, survive any UI redesign untouched, and are what makes remote updates possible: the engine evaluates whatever JSON it is given. React only renders the engine's answer to _"given this definition and these values, what is visible, computed and wrong?"_ `evaluateDraft()` in the store is the single place that question is asked, for both the screen and Save/Complete.

**Changing the form = editing JSON**: labels, options, required, order, new sections, new rules using existing operators, new photo slots or groups, repeat counts. **Adding a capability = code + `schemaVersion` bump**: a new field type (GPS, signature) or a new logic operator. An app that doesn't know a `schemaVersion` or operator rejects that file and keeps the previous one, so a bad remote definition can't brick devices in the field.

**Remote updates.** The UI only gets definitions through `definitionRepository`. Cold start reads cached or bundled instantly and never waits on the network. `refresh()` (stub) would fetch in the background, validate with `parseDefinition`, store it as a new row, then mark it current in one transaction. Each draft is pinned to the `formVersion` it was started on. New forms use the newest definition.

**Durability.** Every change goes to the zustand store and on to SQLite through `draftRepository` (300 ms debounce, plus an immediate flush when the app leaves the foreground: on Android you must leave the app before you can swipe it away). Each draft has a device-generated UUID. A sync outbox would sit behind the same repository, and that UUID becomes the idempotency key, so a retried sync can't create a duplicate record.

**Built for the field.** One section on screen at a time with progress per tab, 56 dp+ targets, Yes/No and options as large buttons, a one-tap "Today" on dates, − / + on counts, a problem list that jumps to the field, Save / Complete always at the bottom, and an "offline ready" + save-status chip so the worker knows the data is safe.

**History.** The app always opens straight into the current form. The History button in the header lists every form stored on the phone (draft / saved / complete) with its progress; tapping one shows what was entered and which photos are missing. Unfinished forms can be continued; completed ones are read-only. Switching forms writes the previous one to SQLite first, so nothing waiting on the autosave debounce is lost.