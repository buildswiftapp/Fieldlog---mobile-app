export const palette = {
  bg: '#0D0F12',
  bg2: '#13161A',
  bg3: '#1A1D22',
  bg4: '#21252C',

  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',

  tx: '#F0F2F5',
  tx2: '#8A909A',
  tx3: '#565C68',

  orange: '#F59E0B',
  orangeDim: 'rgba(245,158,11,0.15)',
  purple: '#8B5CF6',
  purpleDim: 'rgba(139,92,246,0.15)',
  blue: '#2563EB',
  blueLight: '#3B82F6',
  blueDim: 'rgba(37,99,235,0.15)',
  green: '#10B981',
  greenDim: 'rgba(16,185,129,0.12)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
} as const;

export const radius = { sm: 8, md: 10, lg: 14, xl: 16, pill: 20, round: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export type RoleTheme = {
  accent: string;
  accentDim: string;
  onAccent: string;
  label: string;
};

export const roleThemes: Record<'gc' | 'sub', RoleTheme> = {
  gc: { accent: palette.orange, accentDim: palette.orangeDim, onAccent: '#000000', label: 'General Contractor' },
  sub: { accent: palette.purple, accentDim: palette.purpleDim, onAccent: '#FFFFFF', label: 'Subcontractor' },
};

export const font = {
  family: undefined as string | undefined,
  mono: undefined as string | undefined,
};
