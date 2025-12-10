/**
 * Icon Symbol Component (JavaScript)
 * Fallback for using MaterialIcons on Android and web.
 */

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const FALLBACK_ICON = 'help-outline';

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
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
  'gear': 'settings',
  'xmark.circle': 'cancel',
  'infinity': 'all-inclusive',
  'chart.bar.fill': 'bar-chart',
  'bell.fill': 'notifications',
  'note.text': 'note',
  'square.and.arrow.up': 'share',
  'paintpalette.fill': 'palette',
  'rectangle.3.group.fill': 'widgets',
  'icloud.fill': 'cloud',
  'gift.fill': 'card-giftcard',
  'arrow.right.circle.fill': 'arrow-circle-right',
  'arrow.up.circle.fill': 'arrow-circle-up',
  'arrow.right': 'arrow-forward',
  'clock.fill': 'schedule',
  'person.fill': 'person'
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol(props) {
  const name = props.name;
  const size = props.size || 24;
  const color = props.color;
  const style = props.style;

  const materialIconName = MAPPING[name] || FALLBACK_ICON;

  return <MaterialIcons color={color} size={size} name={materialIconName} style={style} />;
}
