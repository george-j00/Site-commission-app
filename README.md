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
  features/commissioning-form/  React layer
    components/                   FormScreen (composition only), Header, SectionTabs, ProblemSheet,
                                  ActionBar, FieldRenderer (field type → component registry), fields/*, photos/*
    hooks/                        useFormEvaluation, useVisibleErrors, useSectionProgress, useProblems,
                                  useScrollToField, useToast, useKeyboardVisible, useField
    store/                        formStore (zustand, per-field selectors), autosave (debounce + background flush)
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

**Inspecting the database (iOS simulator):**

```bash
DB="$(xcrun simctl get_app_container booted com.georgejose.sitecommissioning data)/Documents/SQLite/commissioning.db"
sqlite3 -readonly "$DB" "SELECT id, status, updated_at FROM drafts ORDER BY updated_at DESC;"
```

## Assumptions (defaults I'd confirm with the team)

1. **Save vs autosave.** Every keystroke autosaves as a draft. The explicit **Save** is a validated commit: it is blocked while any rule is broken (or a value is invalid, e.g. panels = 0). Empty required fields do **not** block Save, so a half-finished form can be saved. **Mark complete** additionally needs every visible required field and every visible photo slot.
2. **Hidden values** (Earthing → No, ESS 5 → 2) stay in the draft so toggling back restores them, but they are stripped from the saved record and are not validated.
3. **Required:** all visible fields except the computed one.
4. **"Future"** means after the device's local date (Asia/Manila on site). Dates are stored and compared as `YYYY-MM-DD` strings, never through `new Date(str)` (UTC).
5. Number of Solar Panels must be a whole number ≥ 1.

## One thing the AI got wrong

The first version of the text inputs was **controlled** (`value={storeValue}`), which is the usual React pattern. On the Android emulator, typing "BYD" into an ESS Make field produced "BBYDO". Every keystroke round-trips through JS (store update → whole-form evaluation → re-render → native input), and fast input races that round trip. On a low-end phone the same thing happens with a real keyboard. Fix: text and number inputs are uncontrolled (`defaultValue`). The native input owns the keystrokes, the store just records them, and the input is keyed by draft id so a new form starts empty. Re-tested: "LGCHEM" typed cleanly.
