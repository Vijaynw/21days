// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

const FALLBACK_ICON: ComponentProps<typeof MaterialIcons>['name'] = 'help-outline';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'xmark': 'close',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'star': 'star-outline',
  'star.fill': 'star',
  'trash': 'delete',
  'calendar': 'calendar-today',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'flame.fill': 'whatshot',
  'trophy.fill': 'emoji-events',
  'quote.bubble': 'format-quote',
  'heart.fill': 'favorite',
  'briefcase.fill': 'work',
  'book.fill': 'book',
  'leaf.fill': 'eco',
  'person.2.fill': 'group',
  'paintbrush.fill': 'brush',
  'staroflife.fill': 'grade',
  'staroflife': 'grade',
  'star.circle.fill': 'stars',
  'star.circle': 'stars',
  'star.square': 'featured-play-list',
  'star.square.fill': 'featured-play-list',
  'arrow.uturn.up': 'undo',
  'crown.fill': 'military-tech',
  'sunrise.fill': 'wb-sunny',
  'checkmark.seal.fill': 'verified',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialIconName = MAPPING[name] ?? FALLBACK_ICON;

  return <MaterialIcons color={color} size={size} name={materialIconName} style={style} />;
}
