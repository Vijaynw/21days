export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  freeLimit?: number;
  premiumLimit?: number | 'unlimited';
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  period?: string;
  savings?: string;
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

// Premium feature definitions
export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'unlimited_habits',
    name: 'Unlimited Habits',
    description: 'Track as many habits as you want',
    icon: 'infinity',
    freeLimit: 3,
    premiumLimit: 'unlimited',
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights and progress charts',
    icon: 'chart.bar.fill',
  },
  {
    id: 'custom_reminders',
    name: 'Custom Reminders',
    description: 'Set personalized reminder times for each habit',
    icon: 'bell.fill',
  },
  {
    id: 'habit_notes',
    name: 'Habit Notes',
    description: 'Add notes and reflections to your daily completions',
    icon: 'note.text',
  },
  {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export your habit data to CSV or JSON',
    icon: 'square.and.arrow.up',
  },
  {
    id: 'themes',
    name: 'Premium Themes',
    description: 'Access exclusive color themes and icons',
    icon: 'paintpalette.fill',
  },
  {
    id: 'widgets',
    name: 'Home Screen Widgets',
    description: 'Quick access widgets for your home screen',
    icon: 'rectangle.3.group.fill',
  },
  {
    id: 'cloud_backup',
    name: 'Cloud Backup',
    description: 'Sync and backup your data across devices',
    icon: 'icloud.fill',
  },
];

// Pricing plans
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: [
      'Track up to 3 habits',
      'Basic progress tracking',
      '21-day streak counter',
      'Daily reminders',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    currency: 'USD',
    period: 'month',
    features: [
      'Everything in Free',
      'Unlimited habits',
      'Advanced analytics',
      'Custom reminders',
      'Habit notes',
      'Export data',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 29.99,
    currency: 'USD',
    period: 'year',
    savings: 'Save 50%',
    popular: true,
    features: [
      'Everything in Monthly',
      'Premium themes',
      'Home screen widgets',
      'Priority support',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 79.99,
    currency: 'USD',
    features: [
      'All premium features',
      'Cloud backup & sync',
      'Lifetime updates',
      'Early access to new features',
      'One-time payment',
    ],
  },
];

// Free tier limits
export const FREE_TIER_LIMITS = {
  maxHabits: 3,
  hasAdvancedAnalytics: false,
  hasCustomReminders: false,
  hasHabitNotes: false,
  hasExportData: false,
  hasPremiumThemes: false,
  hasWidgets: false,
  hasCloudBackup: false,
};
