import { ComponentType, memo } from 'react';
import { Text } from 'react-native';
import type { FieldDef, ItemFieldDef } from '@/core/form-definition/schema';
import type { FieldProps } from './fields/common';
import { ComputedField } from './fields/ComputedField';
import { DateField } from './fields/DateField';
import { NumberField } from './fields/NumberField';
import { RepeaterField } from './fields/RepeaterField';
import { SelectField } from './fields/SelectField';
import { TextField } from './fields/TextField';
import { YesNoField } from './fields/YesNoField';

/**
 * Field type → component. This is the only list of field types in the UI.
 * A new type (GPS, signature, barcode) = a component here + the zod type in
 * schema.ts + a schemaVersion bump. Everything else is JSON.
 */
type LeafType = Exclude<FieldDef['type'], 'repeater'>;
type Registry = { [K in LeafType]: ComponentType<FieldProps<Extract<FieldDef | ItemFieldDef, { type: K }>>> };

const registry: Registry = {
  date: DateField,
  yesno: YesNoField,
  select: SelectField,
  number: NumberField,
  text: TextField,
  computed: ComputedField,
};

export const FieldRenderer = memo(function FieldRenderer(props: FieldProps) {
  if (props.field.type === 'repeater') return <RepeaterField {...props} Renderer={FieldRenderer} />;
  // The registry is keyed by type, so the component matches props.field; TS can't follow that through the lookup.
  const Component = registry[props.field.type as LeafType] as ComponentType<FieldProps> | undefined;
  if (!Component) return <Text>Unsupported field type: {props.field.type}</Text>;
  return <Component {...props} />;
});
