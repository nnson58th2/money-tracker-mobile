import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';

const interFont = createInterFont();

const appConfig = createTamagui({
  fonts: {
    heading: interFont,
    body: interFont,
  },
  themes: {
    ...themes,
    // Custom dark fintech theme
    dark_fintech: {
      background: 'rgb(21, 18, 17, 0.5)',
      backgroundHover: '#0A1628',
      backgroundPress: '#121826',
      backgroundFocus: '#121826',
      color: '#F8FAFC',
      colorHover: '#FFFFFF',
      colorPress: '#E2E8F0',
      colorFocus: '#E2E8F0',
      colorBox: 'rgba(65, 54, 48, 0.65)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderColorHover: 'rgba(255, 255, 255, 0.2)',
      borderColorFocus: 'rgba(255, 255, 255, 0.15)',
      borderColorPress: 'rgba(255, 255, 255, 0.15)',
      placeholderColor: '#64748B',
      // Custom tokens
      primary: '#2D281F',
      primaryHover: '#413630',
      secondary: '#413630',
      secondaryHover: '#524336',
      tertiary: 'rgba(255,255,255,0.8)',
      tertiaryHover: 'rgba(255,255,255,0.5)',
      success: '#34D399',
      successHover: '#6EE7B7',
      red: '#EF4444',
      surface: '#121826',
      surfaceHover: '#1E293B',
      muted: '#64748B',
      card: 'rgba(30, 41, 59, 0.7)',
    },
    // Custom light fintech theme
    light_fintech: {
      background: '#F8FAFC',
      backgroundHover: '#F1F5F9',
      backgroundPress: '#E2E8F0',
      backgroundFocus: '#E2E8F0',
      color: '#0B0F19',
      colorHover: '#000000',
      colorPress: '#1E293B',
      colorFocus: '#1E293B',
      colorBox: 'rgba(65, 54, 48, 0.7)',
      borderColor: '#E2E8F0',
      borderColorHover: '#CBD5E1',
      borderColorFocus: 'rgba(45, 40, 31, 0.5)',
      borderColorPress: 'rgba(45, 40, 31, 0.5)',
      placeholderColor: '#94A3B8',
      // Custom tokens
      primary: '#2D281F',
      primaryHover: '#413630',
      secondary: '#413630',
      secondaryHover: '#524336',
      tertiary: 'rgba(0,0,0,0.8)',
      tertiaryHover: 'rgba(0,0,0,0.5)',
      success: '#10B981',
      successHover: '#34D399',
      red: '#EF4444',
      surface: '#FFFFFF',
      surfaceHover: '#F8FAFC',
      muted: '#64748B',
      card: 'rgba(255, 255, 255, 0.9)',
    },
  },
  tokens,
  shorthands,
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
