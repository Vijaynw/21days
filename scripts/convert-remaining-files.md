# Remaining Files to Convert

The following large files still need TypeScript to JavaScript conversion:

## Files to Convert Manually

1. **`app/(tabs)/index.tsx`** → `app/(tabs)/index.jsx` (963 lines)
2. **`app/(tabs)/premium.tsx`** → `app/(tabs)/premium.jsx` (920 lines)
3. **`app/(tabs)/[id].tsx`** → `app/(tabs)/[id].jsx` (large file)
4. **`app/(tabs)/index-old.tsx`** → Can be deleted (backup file)
5. **`app/(tabs)/index-old-backup.tsx`** → Can be deleted (backup file)

## Conversion Steps for Each File

### Step 1: Rename the file
```bash
mv app/\(tabs\)/index.tsx app/\(tabs\)/index.jsx
```

### Step 2: Remove TypeScript-specific syntax

Replace these patterns:

| TypeScript | JavaScript |
|------------|------------|
| `const [habits, setHabits] = useState<Habit[]>([])` | `const [habits, setHabits] = useState([])` |
| `async function name(): Promise<void>` | `async function name()` |
| `function name(param: Type)` | `function name(param)` |
| `const name: Type = value` | `const name = value` |
| `import { Type } from '@/types/...'` | Remove type-only imports |
| `as Type` | Remove type assertions |
| `interface Props { ... }` | Remove interfaces |
| `type Name = ...` | Remove type definitions |
| `React.FC<Props>` | Just use function component |
| `(param: Type) => ...` | `(param) => ...` or `function(param) { ... }` |

### Step 3: Update imports

Change:
```typescript
import { Habit, HabitCategory } from '@/types/habit';
```

To:
```javascript
// Types are now just for reference, no need to import
```

### Step 4: Convert arrow functions (optional but recommended)

Change:
```typescript
const handlePress = async () => { ... }
```

To:
```javascript
async function handlePress() { ... }
```

## Quick Conversion Commands

For each file, you can use sed to do basic conversions:

```bash
# Remove type annotations from useState
sed -i '' 's/useState<[^>]*>/useState/g' file.jsx

# Remove Promise<void> return types
sed -i '' 's/): Promise<void>/)/g' file.jsx

# Remove : Type from parameters (basic)
sed -i '' 's/: string//g' file.jsx
sed -i '' 's/: number//g' file.jsx
sed -i '' 's/: boolean//g' file.jsx
```

## After Conversion

1. Delete old TypeScript files:
```bash
bash scripts/cleanup-ts-files.sh
```

2. Remove TypeScript dependencies:
```bash
npm uninstall typescript @types/react
```

3. Clear cache and restart:
```bash
npx expo start --clear
```
