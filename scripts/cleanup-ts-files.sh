#!/bin/bash

# Cleanup TypeScript files after JavaScript conversion
# Run from project root: bash scripts/cleanup-ts-files.sh

echo "Removing old TypeScript files..."

# Remove old .tsx files (we have .jsx versions now)
rm -f ./app/_layout.tsx
rm -f ./app/settings.tsx
rm -f ./app/\(tabs\)/_layout.tsx
rm -f ./app/\(tabs\)/index.tsx
rm -f ./app/\(tabs\)/premium.tsx
rm -f ./app/\(tabs\)/progress.tsx
rm -f ./app/\(tabs\)/profile.tsx
rm -f ./app/\(tabs\)/explore.tsx
rm -f ./app/\(tabs\)/\[id\].tsx
rm -f ./app/\(tabs\)/index-old.tsx
rm -f ./app/\(tabs\)/index-old-backup.tsx

# Remove old component .tsx files
rm -f ./components/themed-text.tsx
rm -f ./components/themed-view.tsx
rm -f ./components/external-link.tsx
rm -f ./components/haptic-tab.tsx
rm -f ./components/hello-wave.tsx
rm -f ./components/parallax-scroll-view.tsx
rm -f ./components/ui/collapsible.tsx
rm -f ./components/ui/icon-symbol.tsx
rm -f ./components/ui/icon-symbol.ios.tsx

# Remove old context .tsx files
rm -f ./contexts/PremiumContext.tsx

# Remove old .ts files
rm -f ./types/habit.ts
rm -f ./types/premium.ts
rm -f ./utils/storage.ts
rm -f ./utils/streaks.ts
rm -f ./utils/premium-features.ts
rm -f ./hooks/use-color-scheme.ts
rm -f ./hooks/use-color-scheme.web.ts
rm -f ./hooks/use-theme-color.ts
rm -f ./hooks/use-premium-features.ts
rm -f ./constants/theme.ts

# Remove TypeScript config (optional - keep if you want to keep TS support)
# rm -f ./tsconfig.json
# rm -f ./expo-env.d.ts

echo "Done! Old TypeScript files removed."
echo ""
echo "Next steps:"
echo "1. Run: npm uninstall typescript @types/react"
echo "2. Run: npx expo start --clear"
