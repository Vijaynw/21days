/**
 * Medium Habit Widget (4x2)
 * Shows habit list with completion status
 */

import { FlexWidget, TextWidget } from 'react-native-android-widget';

function HabitItem({ habit, isCompleted }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
      }}
      clickAction="TOGGLE_HABIT"
      clickActionData={{ habitId: habit.id }}
    >
      <FlexWidget
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: isCompleted ? '#22c55e' : 'transparent',
          borderWidth: isCompleted ? 0 : 2,
          borderColor: habit.color || '#9BA1A6',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        {isCompleted && (
          <TextWidget
            text="✓"
            style={{
              fontSize: 14,
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          />
        )}
      </FlexWidget>
      
      <TextWidget
        text={habit.icon || '🎯'}
        style={{
          fontSize: 16,
          marginRight: 8,
        }}
      />
      
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={habit.name}
          style={{
            fontSize: 14,
            color: isCompleted ? '#9BA1A6' : '#FFFFFF',
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}
          truncate="END"
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export function HabitWidgetMedium({ habits = [], todayStr = '' }) {
  const displayHabits = habits.slice(0, 4);
  const completedCount = habits.filter(h => 
    h.completions && h.completions.includes(todayStr)
  ).length;
  
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#333',
        }}
      >
        <TextWidget
          text="Today's Habits"
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
          }}
        />
        <FlexWidget
          style={{
            backgroundColor: completedCount === habits.length ? '#22c55e' : '#0a7ea4',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <TextWidget
            text={`${completedCount}/${habits.length}`}
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>
      
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {displayHabits.length > 0 ? (
          displayHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              isCompleted={habit.completions && habit.completions.includes(todayStr)}
            />
          ))
        ) : (
          <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextWidget text="No habits yet" style={{ fontSize: 14, color: '#9BA1A6' }} />
            <TextWidget text="Tap to add one!" style={{ fontSize: 12, color: '#0a7ea4', marginTop: 4 }} />
          </FlexWidget>
        )}
        
        {habits.length > 4 && (
          <TextWidget
            text={`+${habits.length - 4} more`}
            style={{ fontSize: 11, color: '#9BA1A6', textAlign: 'center', marginTop: 4 }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

export default HabitWidgetMedium;
