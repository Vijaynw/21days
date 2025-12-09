/**
 * Themed Text Component (JavaScript)
 */

import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, Text } from 'react-native';

export function ThemedText(props) {
  const style = props.style;
  const lightColor = props.lightColor;
  const darkColor = props.darkColor;
  const type = props.type || 'default';
  const rest = Object.assign({}, props);
  delete rest.style;
  delete rest.lightColor;
  delete rest.darkColor;
  delete rest.type;

  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color: color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
