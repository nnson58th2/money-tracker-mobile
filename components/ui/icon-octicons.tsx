import Octicons from '@expo/vector-icons/Octicons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

export type IconOcticonsMapping = Record<SymbolViewProps['name'], ComponentProps<typeof Octicons>['name']>;
export type IconOcticonsName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home-fill',
} as IconOcticonsMapping;

export function IconOcticons({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconOcticonsName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <Octicons color={color} size={size} name={MAPPING[name]} style={style} />;
}
