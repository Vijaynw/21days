/**
 * Premium Context (JavaScript)
 */

import { storage } from '@/utils/storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FREE_TIER_LIMITS } from '../types/premium';

const TRIAL_DURATION_DAYS = 7;

const defaultSubscription = {
  plan: 'free',
  isActive: true,
};

const defaultTrial = {
  isActive: false,
  daysRemaining: 0,
  startDate: null,
  endDate: null,
  hasUsedTrial: false,
};

const PremiumContext = createContext(undefined);

const SUBSCRIPTION_KEY = '@user_subscription';
const TRIAL_KEY = '@free_trial';
const PURCHASE_HISTORY_KEY = '@purchase_history';

export function PremiumProvider(props) {
  const children = props.children;
  const [subscription, setSubscription] = useState(defaultSubscription);
  const [trial, setTrial] = useState(defaultTrial);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function() {
    const initPremium = async function() {
      try {
        // Load subscription data
        const subData = await storage.getItem(SUBSCRIPTION_KEY);
        if (subData) {
          const parsed = JSON.parse(subData);
          if (parsed.plan !== 'lifetime' && parsed.endDate && new Date(parsed.endDate) < new Date()) {
            setSubscription(Object.assign({}, defaultSubscription));
            await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
          } else {
            setSubscription(parsed);
          }
        }

        // Load trial data
        const trialDataStr = await storage.getItem(TRIAL_KEY);
        if (trialDataStr) {
          const trialData = JSON.parse(trialDataStr);
          const endDate = new Date(trialData.endDate);
          const now = new Date();
          const isActive = !trialData.isUsed && endDate > now;
          const daysRemaining = isActive 
            ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          setTrial({
            isActive: isActive,
            daysRemaining: daysRemaining,
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

  const loadSubscription = async function() {
    try {
      const data = await storage.getItem(SUBSCRIPTION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.plan !== 'lifetime' && parsed.endDate && new Date(parsed.endDate) < new Date()) {
          setSubscription(Object.assign({}, defaultSubscription));
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

  const canAddMoreHabits = useCallback(function(currentCount) {
    if (isPremium) return true;
    return currentCount < FREE_TIER_LIMITS.maxHabits;
  }, [isPremium]);

  const hasFeature = useCallback(function(feature) {
    if (isPremium) return true;
    if (feature === 'maxHabits') return true;
    return FREE_TIER_LIMITS[feature];
  }, [isPremium]);

  const getHabitLimit = useCallback(function() {
    if (isPremium) return 'unlimited';
    return FREE_TIER_LIMITS.maxHabits;
  }, [isPremium]);

  const getPlanDisplayName = useCallback(function() {
    if (trial.isActive) return 'Free Trial (' + trial.daysRemaining + ' days left)';
    switch (subscription.plan) {
      case 'monthly': return 'Monthly Premium';
      case 'yearly': return 'Yearly Premium';
      case 'lifetime': return 'Lifetime Premium';
      default: return 'Free';
    }
  }, [subscription.plan, trial]);

  const getDaysUntilExpiry = useCallback(function() {
    if (trial.isActive) return trial.daysRemaining;
    if (subscription.plan === 'lifetime') return null;
    if (!subscription.endDate) return null;
    
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [subscription, trial]);

  const startFreeTrial = async function() {
    try {
      const existingTrial = await storage.getItem(TRIAL_KEY);
      if (existingTrial) {
        const trialData = JSON.parse(existingTrial);
        if (trialData.isUsed || new Date(trialData.endDate) <= new Date()) {
          return { success: false, error: 'Free trial has already been used' };
        }
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);

      const trialData = {
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

  const upgradeToPlan = async function(plan) {
    try {
      await new Promise(function(resolve) { setTimeout(resolve, 1500); });

      const now = new Date();
      let endDate;

      if (plan === 'monthly') {
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan === 'yearly') {
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const newSubscription = {
        plan: plan,
        startDate: now.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        isActive: true,
      };

      await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
      
      const purchaseRecord = {
        plan: plan,
        transactionId: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        purchaseDate: now.toISOString(),
        expiryDate: endDate ? endDate.toISOString() : undefined,
      };
      
      const historyData = await storage.getItem(PURCHASE_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];
      history.push(purchaseRecord);
      await storage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(history));

      if (trial.isActive) {
        const trialData = await storage.getItem(TRIAL_KEY);
        if (trialData) {
          const parsed = JSON.parse(trialData);
          parsed.isUsed = true;
          await storage.setItem(TRIAL_KEY, JSON.stringify(parsed));
          setTrial(function(prev) {
            return Object.assign({}, prev, { isActive: false, hasUsedTrial: true });
          });
        }
      }

      setSubscription(newSubscription);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false, error: 'Failed to process purchase' };
    }
  };

  const restorePurchases = async function() {
    try {
      setIsLoading(true);
      
      await new Promise(function(resolve) { setTimeout(resolve, 1000); });

      const historyData = await storage.getItem(PURCHASE_HISTORY_KEY);
      if (historyData) {
        const history = JSON.parse(historyData);
        
        const validPurchase = history
          .sort(function(a, b) {
            return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
          })
          .find(function(p) {
            if (p.plan === 'lifetime') return true;
            if (!p.expiryDate) return false;
            return new Date(p.expiryDate) > new Date();
          });

        if (validPurchase) {
          const restoredSubscription = {
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

      await loadSubscription();
      setIsLoading(false);
      return { success: false, error: 'No purchases found to restore' };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      setIsLoading(false);
      return { success: false, error: 'Failed to restore purchases' };
    }
  };

  const cancelSubscription = async function() {
    try {
      if (subscription.plan === 'lifetime') {
        return { success: false, error: 'Lifetime subscriptions cannot be cancelled' };
      }

      if (subscription.plan === 'free') {
        return { success: false, error: 'No active subscription to cancel' };
      }

      const cancelledSubscription = Object.assign({}, subscription, { isActive: true });

      await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(cancelledSubscription));
      
      return { 
        success: true, 
        error: 'Your subscription will remain active until ' + 
          (subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'the end of the billing period'),
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        subscription: subscription,
        isPremium: isPremium,
        trial: trial,
        canAddMoreHabits: canAddMoreHabits,
        hasFeature: hasFeature,
        getHabitLimit: getHabitLimit,
        upgradeToPlan: upgradeToPlan,
        restorePurchases: restorePurchases,
        startFreeTrial: startFreeTrial,
        cancelSubscription: cancelSubscription,
        isLoading: isLoading,
        getPlanDisplayName: getPlanDisplayName,
        getDaysUntilExpiry: getDaysUntilExpiry,
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
