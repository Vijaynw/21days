/**
 * Themed View Component (JavaScript)
 */

import { useThemeColor } from '@/hooks/use-theme-color';
import { View } from 'react-native';

export function ThemedView(props) {
  const style = props.style;
  const lightColor = props.lightColor;
  const darkColor = props.darkColor;
  const otherProps = Object.assign({}, props);
  delete otherProps.style;
  delete otherProps.lightColor;
  delete otherProps.darkColor;

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor: backgroundColor }, style]} {...otherProps} />;
}
