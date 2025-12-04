import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { usePremium } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PREMIUM_FEATURES, PRICING_PLANS, PricingPlan } from '@/types/premium';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PremiumScreen() {
  const colorScheme = useColorScheme();
  const { subscription, isPremium, upgradeToPlan, restorePurchases, isLoading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(
    PRICING_PLANS.find(p => p.popular) || PRICING_PLANS[2]
  );
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    if (selectedPlan.id === 'free') return;
    
    setProcessing(true);
    try {
      await upgradeToPlan(selectedPlan.id);
      Alert.alert(
        '🎉 Welcome to Premium!',
        `You've successfully upgraded to ${selectedPlan.name}. Enjoy all premium features!`,
        [{ text: 'Awesome!' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    try {
      await restorePurchases();
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
    } catch {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  // Show current subscription status if premium
  if (isPremium) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.premiumHeader}>
            <View style={[styles.crownBadge, { backgroundColor: '#FFD700' }]}>
              <IconSymbol name="crown.fill" size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={styles.premiumTitle}>
              You&apos;re Premium! 👑
            </ThemedText>
            <ThemedText style={styles.premiumSubtitle}>
              {subscription.plan === 'lifetime' 
                ? 'Lifetime access to all features'
                : `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} subscription`
              }
            </ThemedText>
            {subscription.endDate && (
              <ThemedText style={styles.expiryText}>
                Renews on {new Date(subscription.endDate).toLocaleDateString()}
              </ThemedText>
            )}
          </View>

          <View style={styles.featuresSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Premium Features
            </ThemedText>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                  <IconSymbol name={feature.icon as any} size={20} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                <View style={styles.featureInfo}>
                  <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                  <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
                </View>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#4ECDC4" />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <ThemedText style={styles.restoreText}>Restore Purchases</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.crownBadge, { backgroundColor: '#FFD700' }]}>
            <IconSymbol name="crown.fill" size={40} color="#fff" />
          </View>
          <ThemedText type="title" style={styles.title}>
            Unlock Premium
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Build better habits with powerful features
          </ThemedText>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresPreview}>
          {PREMIUM_FEATURES.slice(0, 4).map((feature) => (
            <View key={feature.id} style={styles.featurePreviewItem}>
              <IconSymbol name={feature.icon as any} size={24} color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.featurePreviewText}>{feature.name}</ThemedText>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Choose Your Plan
          </ThemedText>
          
          {PRICING_PLANS.filter(p => p.id !== 'free').map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.pricingCard,
                selectedPlan.id === plan.id && styles.pricingCardSelected,
                plan.popular && styles.pricingCardPopular,
                { borderColor: selectedPlan.id === plan.id ? Colors[colorScheme ?? 'light'].tint : '#E0E0E0' }
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  <ThemedText style={styles.popularText}>MOST POPULAR</ThemedText>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <ThemedText type="subtitle" style={styles.planName}>{plan.name}</ThemedText>
                  {plan.savings && (
                    <View style={styles.savingsBadge}>
                      <ThemedText style={styles.savingsText}>{plan.savings}</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <ThemedText style={styles.currency}>$</ThemedText>
                  <ThemedText type="title" style={styles.price}>
                    {plan.price.toFixed(2).split('.')[0]}
                  </ThemedText>
                  <ThemedText style={styles.cents}>
                    .{plan.price.toFixed(2).split('.')[1]}
                  </ThemedText>
                  {plan.period && (
                    <ThemedText style={styles.period}>/{plan.period}</ThemedText>
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.planFeatureRow}>
                    <IconSymbol name="checkmark" size={16} color="#4ECDC4" />
                    <ThemedText style={styles.planFeatureText}>{feature}</ThemedText>
                  </View>
                ))}
              </View>

              {selectedPlan.id === plan.id && (
                <View style={[styles.selectedIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* All Features List */}
        <View style={styles.allFeaturesSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            All Premium Features
          </ThemedText>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                <IconSymbol name={feature.icon as any} size={20} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View style={styles.featureInfo}>
                <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <ThemedText style={styles.restoreText}>Restore Purchases</ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Purchase Button */}
      <View style={[styles.purchaseContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={handlePurchase}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedText style={styles.purchaseButtonText}>
                Get {selectedPlan.name} - ${selectedPlan.price.toFixed(2)}
                {selectedPlan.period ? `/${selectedPlan.period}` : ''}
              </ThemedText>
              <IconSymbol name="arrow.right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        <ThemedText style={styles.termsText}>
          Cancel anytime • Secure payment
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  crownBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  featuresPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  featurePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  featurePreviewText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pricingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  pricingCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  pricingCardSelected: {
    borderWidth: 2,
  },
  pricingCardPopular: {
    paddingTop: 32,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  cents: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  period: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 12,
  },
  planFeatures: {
    gap: 6,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 13,
    opacity: 0.8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allFeaturesSection: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    opacity: 0.6,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 14,
    opacity: 0.6,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 120,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
  // Premium user styles
  premiumHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  expiryText: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 24,
  },
});
