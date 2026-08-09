export const colors = {
  canvas: '#FFF9EA',
  ink: '#20201C',
  likhaYellow: '#F4C542',
  golden: '#E5A91A',
  terracotta: '#D96B45',
  warmBrown: '#6B4F2A',
  softGray: '#E8E4DA',
  white: '#FFFFFF',
} as const;

export const fonts = {
  heading: 'InstrumentSerif_400Regular',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 46 },
  h1: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 38 },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
