/**
 * Haptic Tab Component (JavaScript)
 */

import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={function(ev) {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (props.onPressIn) {
          props.onPressIn(ev);
        }
      }}
    />
  );
}
