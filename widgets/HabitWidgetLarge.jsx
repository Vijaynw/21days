/**
 * Large Habit Widget (4x4)
 * Full dashboard with weekly overview
 */

import { FlexWidget, TextWidget } from 'react-native-android-widget';

function WeekDayIndicator({ day, isCompleted, isToday }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginHorizontal: 2 }}>
      <TextWidget
        text={day}
        style={{ fontSize: 10, color: isToday ? '#0a7ea4' : '#9BA1A6', marginBottom: 4 }}
      />
      <FlexWidget
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: isCompleted ? '#22c55e' : isToday ? '#0a7ea4' : '#333',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isCompleted && (
          <TextWidget text="✓" style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' }} />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

function HabitRow({ habit, isCompleted, streak }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
      }}
      clickAction="TOGGLE_HABIT"
      clickActionData={{ habitId: habit.id }}
    >
      <FlexWidget
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isCompleted ? '#22c55e' : 'transparent',
          borderWidth: isCompleted ? 0 : 2,
          borderColor: habit.color || '#9BA1A6',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        {isCompleted ? (
          <TextWidget text="✓" style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 'bold' }} />
        ) : (
          <TextWidget text={habit.icon || '🎯'} style={{ fontSize: 14 }} />
        )}
      </FlexWidget>
      
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={habit.name}
          style={{ fontSize: 14, color: isCompleted ? '#9BA1A6' : '#FFFFFF', fontWeight: '500' }}
          truncate="END"
          maxLines={1}
        />
        {streak > 0 && (
          <TextWidget text={`🔥 ${streak} day streak`} style={{ fontSize: 11, color: '#f97316', marginTop: 2 }} />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

export function HabitWidgetLarge({ habits = [], todayStr = '', weekData = [], streaks = {} }) {
  const displayHabits = habits.slice(0, 6);
  const completedCount = habits.filter(h => h.completions && h.completions.includes(todayStr)).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 16,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="21 Days" style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }} />
          <TextWidget text="Build lasting habits" style={{ fontSize: 12, color: '#9BA1A6' }} />
        </FlexWidget>
        
        <FlexWidget
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: progressPercent === 100 ? '#22c55e' : '#0a7ea4',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text={progressPercent === 100 ? '🎉' : `${progressPercent}%`}
            style={{ fontSize: progressPercent === 100 ? 24 : 16, fontWeight: 'bold', color: '#FFFFFF' }}
          />
        </FlexWidget>
      </FlexWidget>
      
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: '#222',
          borderRadius: 12,
          padding: 8,
          marginBottom: 12,
        }}
      >
        {days.map((day, index) => (
          <WeekDayIndicator key={index} day={day} isCompleted={weekData[index] || false} isToday={index === today} />
        ))}
      </FlexWidget>
      
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <FlexWidget style={{ flex: 1, height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
          <FlexWidget
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: progressPercent === 100 ? '#22c55e' : '#0a7ea4',
              borderRadius: 3,
            }}
          />
        </FlexWidget>
        <TextWidget text={`${completedCount}/${habits.length}`} style={{ fontSize: 12, color: '#9BA1A6', marginLeft: 8 }} />
      </FlexWidget>
      
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {displayHabits.length > 0 ? (
          displayHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isCompleted={habit.completions && habit.completions.includes(todayStr)}
              streak={streaks[habit.id] || 0}
            />
          ))
        ) : (
          <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextWidget text="🎯" style={{ fontSize: 32, marginBottom: 8 }} />
            <TextWidget text="No habits yet" style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '500' }} />
            <TextWidget text="Tap to create your first habit!" style={{ fontSize: 13, color: '#0a7ea4', marginTop: 4 }} />
          </FlexWidget>
        )}
        
        {habits.length > 6 && (
          <FlexWidget style={{ alignItems: 'center', marginTop: 8 }}>
            <TextWidget text={`View all ${habits.length} habits →`} style={{ fontSize: 12, color: '#0a7ea4' }} />
          </FlexWidget>
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

export default HabitWidgetLarge;
