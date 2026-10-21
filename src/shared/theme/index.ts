import { StyleSheet } from 'react-native';

/**
 * Field-first design: used outdoors in sunlight, often with gloves, on a
 * low-end phone. High-contrast text, 56dp+ targets, no animations.
 */
export const colors = {
  header: '#0F172A',
  headerText: '#FFFFFF',
  headerMuted: '#CBD5E1',
  bg: '#EEF2F6',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#475569',
  subtle: '#94A3B8',
  border: '#CBD5E1',
  borderStrong: '#64748B',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  primaryText: '#FFFFFF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  readOnlyBg: '#F1F5F9',
};

export const size = {
  touch: 56, // min height of anything tappable (dp)
  radius: 14,
  text: 17,
  label: 16,
  small: 14,
  title: 20,
};

export const shadow = StyleSheet.create({
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}).card;
