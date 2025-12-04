import { storage } from '@/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FREE_TIER_LIMITS, SubscriptionPlan, UserSubscription } from '../types/premium';

interface PremiumContextType {
  subscription: UserSubscription;
  isPremium: boolean;
  canAddMoreHabits: (currentCount: number) => boolean;
  hasFeature: (feature: keyof typeof FREE_TIER_LIMITS) => boolean;
  getHabitLimit: () => number | 'unlimited';
  upgradeToPlan: (plan: SubscriptionPlan) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isLoading: boolean;
}

const defaultSubscription: UserSubscription = {
  plan: 'free',
  isActive: true,
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const SUBSCRIPTION_KEY = '@user_subscription';

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription>(defaultSubscription);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await storage.getItem(SUBSCRIPTION_KEY);
      if (data) {
        const parsed = JSON.parse(data) as UserSubscription;
        // Check if subscription is still valid
        if (parsed.endDate && new Date(parsed.endDate) < new Date()) {
          // Subscription expired
          setSubscription({ ...defaultSubscription });
          await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
        } else {
          setSubscription(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = subscription.plan !== 'free' && subscription.isActive;

  const canAddMoreHabits = useCallback(
    (currentCount: number) => {
      if (isPremium) return true;
      return currentCount < FREE_TIER_LIMITS.maxHabits;
    },
    [isPremium]
  );

  const hasFeature = useCallback(
    (feature: keyof typeof FREE_TIER_LIMITS) => {
      if (isPremium) return true;
      if (feature === 'maxHabits') return true; // Always has some limit
      return FREE_TIER_LIMITS[feature] as boolean;
    },
    [isPremium]
  );

  const getHabitLimit = useCallback(() => {
    if (isPremium) return 'unlimited';
    return FREE_TIER_LIMITS.maxHabits;
  }, [isPremium]);

  const upgradeToPlan = async (plan: SubscriptionPlan) => {
    // In a real app, this would integrate with App Store / Google Play
    // For now, we'll simulate the purchase
    const now = new Date();
    let endDate: Date | undefined;

    if (plan === 'monthly') {
      endDate = new Date(now.setMonth(now.getMonth() + 1));
    } else if (plan === 'yearly') {
      endDate = new Date(now.setFullYear(now.getFullYear() + 1));
    }
    // Lifetime has no end date

    const newSubscription: UserSubscription = {
      plan,
      startDate: new Date().toISOString(),
      endDate: endDate?.toISOString(),
      isActive: true,
    };

    await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
    setSubscription(newSubscription);
  };

  const restorePurchases = async () => {
    // In a real app, this would verify purchases with App Store / Google Play
    // For demo purposes, we'll just reload from storage
    setIsLoading(true);
    await loadSubscription();
    setIsLoading(false);
  };

  return (
    <PremiumContext.Provider
      value={{
        subscription,
        isPremium,
        canAddMoreHabits,
        hasFeature,
        getHabitLimit,
        upgradeToPlan,
        restorePurchases,
        isLoading,
      }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
