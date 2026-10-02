export const colors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFC',
  primary: '#243B76',
  primaryDark: '#172A54',
  primarySoft: '#EBF0FC',
  accent: '#0F766E',
  accentSoft: '#E7F6F3',
  text: '#14213D',
  textMuted: '#5F6C82',
  placeholder: '#8B97AA',
  border: '#DCE3EE',
  borderStrong: '#C6D0DF',
  disabled: '#E9EDF3',
  error: '#B42318',
  errorSoft: '#FEF0EF',
  warning: '#9A5B13',
  warningSoft: '#FFF7E8',
  success: '#17745A',
  successSoft: '#EAF7F2',
  white: '#FFFFFF',
  shadow: '#0F1D35',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32,
  xxl: 44,
};

export const radii = {
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  small: 13,
  body: 16,
  heading: 22,
  title: 32,
  display: 38,
};

export const shadows = {
  card: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  raised: {
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
};
