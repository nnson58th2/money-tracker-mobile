/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#0B0F19',
    background: '#F8FAFC',
    tint: '#7C3AED',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#7C3AED',
    surface: '#FFFFFF',
    primary: '#7C3AED',
    secondary: '#DB2777',
    success: '#10B981',
    border: '#E2E8F0',
    card: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#050B14',
    tint: '#A78BFA',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#A78BFA',
    surface: '#121826',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    success: '#34D399',
    border: 'rgba(255, 255, 255, 0.1)',
    card: 'rgba(30, 41, 59, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
