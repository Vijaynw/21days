/**
 * Icon Symbol iOS Component (JavaScript)
 */

import { SymbolView } from 'expo-symbols';

export function IconSymbol(props) {
  const name = props.name;
  const size = props.size || 24;
  const color = props.color;
  const style = props.style;
  const weight = props.weight || 'regular';

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
