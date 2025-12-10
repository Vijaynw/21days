/**
 * Small Habit Widget (2x1)
 * Shows today's progress summary
 */

import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function HabitWidgetSmall({ completedToday = 0, totalHabits = 0 }) {
  const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <TextWidget
          text="21 Days"
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#9BA1A6',
          }}
        />
        <TextWidget
          text={`${completedToday}/${totalHabits}`}
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
        <TextWidget
          text="completed"
          style={{
            fontSize: 11,
            color: '#9BA1A6',
          }}
        />
      </FlexWidget>
      
      <FlexWidget
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: progressPercent === 100 ? '#22c55e' : '#0a7ea4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={progressPercent === 100 ? '✓' : `${progressPercent}%`}
          style={{
            fontSize: progressPercent === 100 ? 20 : 14,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default HabitWidgetSmall;
