import { storage } from '@/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FREE_TIER_LIMITS, SubscriptionPlan, UserSubscription } from '../types/premium';

const TRIAL_DURATION_DAYS = 7;

interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startDate: string | null;
  endDate: string | null;
  hasUsedTrial: boolean;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
}

interface PremiumContextType {
  subscription: UserSubscription;
  isPremium: boolean;
  trial: TrialInfo;
  canAddMoreHabits: (currentCount: number) => boolean;
  hasFeature: (feature: keyof typeof FREE_TIER_LIMITS) => boolean;
  getHabitLimit: () => number | 'unlimited';
  upgradeToPlan: (plan: SubscriptionPlan) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  startFreeTrial: () => Promise<PurchaseResult>;
  cancelSubscription: () => Promise<PurchaseResult>;
  isLoading: boolean;
  getPlanDisplayName: () => string;
  getDaysUntilExpiry: () => number | null;
}

const defaultSubscription: UserSubscription = {
  plan: 'free',
  isActive: true,
};

const defaultTrial: TrialInfo = {
  isActive: false,
  daysRemaining: 0,
  startDate: null,
  endDate: null,
  hasUsedTrial: false,
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const SUBSCRIPTION_KEY = '@user_subscription';
const TRIAL_KEY = '@free_trial';
const PURCHASE_HISTORY_KEY = '@purchase_history';

interface TrialData {
  startDate: string;
  endDate: string;
  isUsed: boolean;
}

interface PurchaseRecord {
  plan: SubscriptionPlan;
  transactionId: string;
  purchaseDate: string;
  expiryDate?: string;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription>(defaultSubscription);
  const [trial, setTrial] = useState<TrialInfo>(defaultTrial);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initPremium = async () => {
      try {
        // Load subscription data
        const subData = await storage.getItem(SUBSCRIPTION_KEY);
        if (subData) {
          const parsed = JSON.parse(subData) as UserSubscription;
          if (parsed.plan !== 'lifetime' && parsed.endDate && new Date(parsed.endDate) < new Date()) {
            setSubscription({ ...defaultSubscription });
            await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
          } else {
            setSubscription(parsed);
          }
        }

        // Load trial data
        const trialDataStr = await storage.getItem(TRIAL_KEY);
        if (trialDataStr) {
          const trialData = JSON.parse(trialDataStr) as TrialData;
          const endDate = new Date(trialData.endDate);
          const now = new Date();
          const isActive = !trialData.isUsed && endDate > now;
          const daysRemaining = isActive 
            ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          setTrial({
            isActive,
            daysRemaining,
            startDate: trialData.startDate,
            endDate: trialData.endDate,
            hasUsedTrial: trialData.isUsed || endDate <= now,
          });
        }
      } catch (error) {
        console.error('Error initializing premium:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initPremium();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await storage.getItem(SUBSCRIPTION_KEY);
      if (data) {
        const parsed = JSON.parse(data) as UserSubscription;
        // Check if subscription is still valid
        if (parsed.plan !== 'lifetime' && parsed.endDate && new Date(parsed.endDate) < new Date()) {
          // Subscription expired
          setSubscription({ ...defaultSubscription });
          await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
        } else {
          setSubscription(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const isPremium = (subscription.plan !== 'free' && subscription.isActive) || trial.isActive;

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
      if (feature === 'maxHabits') return true;
      return FREE_TIER_LIMITS[feature] as boolean;
    },
    [isPremium]
  );

  const getHabitLimit = useCallback(() => {
    if (isPremium) return 'unlimited';
    return FREE_TIER_LIMITS.maxHabits;
  }, [isPremium]);

  const getPlanDisplayName = useCallback(() => {
    if (trial.isActive) return `Free Trial (${trial.daysRemaining} days left)`;
    switch (subscription.plan) {
      case 'monthly': return 'Monthly Premium';
      case 'yearly': return 'Yearly Premium';
      case 'lifetime': return 'Lifetime Premium';
      default: return 'Free';
    }
  }, [subscription.plan, trial]);

  const getDaysUntilExpiry = useCallback(() => {
    if (trial.isActive) return trial.daysRemaining;
    if (subscription.plan === 'lifetime') return null;
    if (!subscription.endDate) return null;
    
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [subscription, trial]);

  const startFreeTrial = async (): Promise<PurchaseResult> => {
    try {
      // Check if trial was already used
      const existingTrial = await storage.getItem(TRIAL_KEY);
      if (existingTrial) {
        const trialData = JSON.parse(existingTrial) as TrialData;
        if (trialData.isUsed || new Date(trialData.endDate) <= new Date()) {
          return { success: false, error: 'Free trial has already been used' };
        }
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);

      const trialData: TrialData = {
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isUsed: false,
      };

      await storage.setItem(TRIAL_KEY, JSON.stringify(trialData));
      
      setTrial({
        isActive: true,
        daysRemaining: TRIAL_DURATION_DAYS,
        startDate: trialData.startDate,
        endDate: trialData.endDate,
        hasUsedTrial: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Error starting trial:', error);
      return { success: false, error: 'Failed to start free trial' };
    }
  };

  const upgradeToPlan = async (plan: SubscriptionPlan): Promise<PurchaseResult> => {
    try {
      // Simulate purchase processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      let endDate: Date | undefined;

      if (plan === 'monthly') {
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan === 'yearly') {
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // Lifetime has no end date

      const newSubscription: UserSubscription = {
        plan,
        startDate: now.toISOString(),
        endDate: endDate?.toISOString(),
        isActive: true,
      };

      // Save subscription
      await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
      
      // Save to purchase history
      const purchaseRecord: PurchaseRecord = {
        plan,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: now.toISOString(),
        expiryDate: endDate?.toISOString(),
      };
      
      const historyData = await storage.getItem(PURCHASE_HISTORY_KEY);
      const history: PurchaseRecord[] = historyData ? JSON.parse(historyData) : [];
      history.push(purchaseRecord);
      await storage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(history));

      // Mark trial as used if active
      if (trial.isActive) {
        const trialData = await storage.getItem(TRIAL_KEY);
        if (trialData) {
          const parsed = JSON.parse(trialData) as TrialData;
          parsed.isUsed = true;
          await storage.setItem(TRIAL_KEY, JSON.stringify(parsed));
          setTrial(prev => ({ ...prev, isActive: false, hasUsedTrial: true }));
        }
      }

      setSubscription(newSubscription);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false, error: 'Failed to process purchase' };
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    try {
      setIsLoading(true);
      
      // Simulate restore delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check purchase history for valid purchases
      const historyData = await storage.getItem(PURCHASE_HISTORY_KEY);
      if (historyData) {
        const history: PurchaseRecord[] = JSON.parse(historyData);
        
        // Find the most recent valid purchase
        const validPurchase = history
          .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
          .find(p => {
            if (p.plan === 'lifetime') return true;
            if (!p.expiryDate) return false;
            return new Date(p.expiryDate) > new Date();
          });

        if (validPurchase) {
          const restoredSubscription: UserSubscription = {
            plan: validPurchase.plan,
            startDate: validPurchase.purchaseDate,
            endDate: validPurchase.expiryDate,
            isActive: true,
          };
          
          await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(restoredSubscription));
          setSubscription(restoredSubscription);
          setIsLoading(false);
          return { success: true };
        }
      }

      // Reload current subscription
      await loadSubscription();
      setIsLoading(false);
      return { success: false, error: 'No purchases found to restore' };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      setIsLoading(false);
      return { success: false, error: 'Failed to restore purchases' };
    }
  };

  const cancelSubscription = async (): Promise<PurchaseResult> => {
    try {
      // In production, this would redirect to App Store/Google Play subscription management
      // For now, we'll just mark the subscription as cancelled (won't renew)
      
      if (subscription.plan === 'lifetime') {
        return { success: false, error: 'Lifetime subscriptions cannot be cancelled' };
      }

      if (subscription.plan === 'free') {
        return { success: false, error: 'No active subscription to cancel' };
      }

      // Mark as cancelled but keep active until end date
      const cancelledSubscription: UserSubscription = {
        ...subscription,
        isActive: true, // Still active until end date
      };

      await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(cancelledSubscription));
      
      return { 
        success: true, 
        error: 'Your subscription will remain active until ' + 
          (subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'the end of the billing period')
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        subscription,
        isPremium,
        trial,
        canAddMoreHabits,
        hasFeature,
        getHabitLimit,
        upgradeToPlan,
        restorePurchases,
        startFreeTrial,
        cancelSubscription,
        isLoading,
        getPlanDisplayName,
        getDaysUntilExpiry,
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
