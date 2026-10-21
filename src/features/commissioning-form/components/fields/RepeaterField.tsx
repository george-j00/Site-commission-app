import { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/shared/components/Icon';
import { colors, shadow, size } from '@/shared/theme';
import type { FieldProps } from './common';

/**
 * One block per row; the row count comes from the definition's count expression (e.g. essCount).
 * FieldRenderer passes itself in as `Renderer` (avoids a circular import).
 */
export function RepeaterField({
  rows = [],
  errors = {},
  Renderer,
}: FieldProps & { Renderer: ComponentType<FieldProps> }) {
  return (
    <View>
      {rows.map((row) => {
        const rowErrors = row.fields.filter((f) => errors[f.path]).length;
        return (
          <View key={row.index} style={[styles.block, rowErrors ? styles.blockError : null]}>
            <View style={styles.head}>
              <View style={styles.num}>
                <Text style={styles.numText}>{row.index + 1}</Text>
              </View>
              <Text style={styles.title}>{row.label}</Text>
              {rowErrors ? <Icon name="alert-circle" size={22} color={colors.danger} /> : null}
            </View>
            {row.fields.map((f) => (
              <Renderer key={f.path} field={f.def} path={f.path} error={errors[f.path]} nested />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: size.radius,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    ...shadow,
  },
  blockError: { borderLeftColor: colors.danger },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.primaryText, fontWeight: '800', fontSize: size.label },
  title: { flex: 1, fontSize: size.text, fontWeight: '800', color: colors.text },
});
