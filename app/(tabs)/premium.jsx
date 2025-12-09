import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { usePremium } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PREMIUM_FEATURES, PRICING_PLANS } from '@/types/premium';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PremiumScreen() {
  const colorScheme = useColorScheme();
  const { 
    subscription, 
    isPremium, 
    trial,
    upgradeToPlan, 
    restorePurchases, 
    startFreeTrial,
    cancelSubscription,
    isLoading,
    getPlanDisplayName,
    getDaysUntilExpiry,
  } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState(
    PRICING_PLANS.find(p => p.popular) || PRICING_PLANS[2]
  );
  const [processing, setProcessing] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const handlePurchase = async () => {
    if (selectedPlan.id === 'free') return;
    
    setProcessing(true);
    const result = await upgradeToPlan(selectedPlan.id);
    setProcessing(false);
    
    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Premium!',
        `You've successfully upgraded to ${selectedPlan.name}. Enjoy all premium features!`,
        [{ text: 'Awesome!' }]
      );
    } else {
      Alert.alert('Purchase Failed', result.error || 'Failed to process purchase. Please try again.');
    }
  };

  const handleStartTrial = async () => {
    setProcessing(true);
    const result = await startFreeTrial();
    setProcessing(false);
    
    if (result.success) {
      Alert.alert(
        '🎉 Trial Started!',
        'Enjoy 7 days of premium features for free. You can upgrade anytime!',
        [{ text: 'Let\'s Go!' }]
      );
    } else {
      Alert.alert('Trial Unavailable', result.error || 'Unable to start free trial.');
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    const result = await restorePurchases();
    setProcessing(false);
    
    if (result.success) {
      Alert.alert('Restore Complete', 'Your purchases have been restored successfully!');
    } else {
      Alert.alert('Restore Failed', result.error || 'No purchases found to restore.');
    }
  };

  const handleManageSubscription = () => {
    // Open platform-specific subscription management
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleCancelSubscription = async () => {
    upgradeToPlan("free")
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: async () => {
            const result = await cancelSubscription();
            if (result.success) {
              Alert.alert('Subscription Cancelled', result.error);
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel subscription.');
            }
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </ThemedView>
    );
  }

  // Show current subscription status if premium
  if (isPremium && !showPricing) {
    const daysLeft = getDaysUntilExpiry();
    const planName = getPlanDisplayName();
    
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.premiumHeader}>
            <View style={[styles.crownBadge, { backgroundColor: trial.isActive ? '#4ECDC4' : '#FFD700' }]}>
              <IconSymbol name={trial.isActive ? 'clock.fill' : 'crown.fill'} size={40} color="#fff" />
            </View>
            <ThemedText type="title" style={styles.premiumTitle}>
              {trial.isActive ? 'Free Trial Active' : 'You\'re Premium! 👑'}
            </ThemedText>
            <ThemedText style={styles.premiumSubtitle}>
              {planName}
            </ThemedText>
            {daysLeft !== null && (
              <View style={[styles.expiryBadge, { backgroundColor: daysLeft <= 3 ? '#FF6B6B20' : '#4ECDC420' }]}>
                <IconSymbol 
                  name="calendar" 
                  size={16} 
                  color={daysLeft <= 3 ? '#FF6B6B' : '#4ECDC4'} 
                />
                <ThemedText style={[styles.expiryBadgeText, { color: daysLeft <= 3 ? '#FF6B6B' : '#4ECDC4' }]}>
                  {daysLeft} days remaining
                </ThemedText>
              </View>
            )}
            {subscription.plan === 'lifetime' && (
              <View style={[styles.expiryBadge, { backgroundColor: '#FFD70020' }]}>
                <IconSymbol name="infinity" size={16} color="#FFD700" />
                <ThemedText style={[styles.expiryBadgeText, { color: '#B8860B' }]}>
                  Lifetime Access
                </ThemedText>
              </View>
            )}
          </View>

          {/* Upgrade from Trial */}
          {trial.isActive && (
            <View style={styles.upgradeFromTrialSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Love Premium? Keep it forever!
              </ThemedText>
              <TouchableOpacity
                style={[styles.upgradeTrialButton, { backgroundColor: '#1a1a1a' }]}
                onPress={() => {
                  setShowPricing(true);
                }}
              >
                <IconSymbol name="arrow.up.circle.fill" size={20} color="#fff" />
                <ThemedText style={styles.upgradeTrialButtonText}>Upgrade Now - Save 50%</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.featuresSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Premium Features
            </ThemedText>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: '#f5f5f5' }]}>
                  <IconSymbol name={feature.icon} size={20} color="#1a1a1a" />
                </View>
                <View style={styles.featureInfo}>
                  <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                  <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
                </View>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#4ECDC4" />
              </View>
            ))}
          </View>

          {/* Subscription Management */}
          <View style={styles.managementSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Manage Subscription
            </ThemedText>
            
            <TouchableOpacity style={styles.managementItem} onPress={handleManageSubscription}>
              <IconSymbol name="gear" size={20} color="#999" />
              <ThemedText style={styles.managementItemText}>Manage in App Store</ThemedText>
              <IconSymbol name="chevron.right" size={16} color="#999" />
            </TouchableOpacity>

            {subscription.plan !== 'lifetime' && subscription.plan !== 'free' && (
              <TouchableOpacity style={styles.managementItem} onPress={handleCancelSubscription}>
                <IconSymbol name="xmark.circle" size={20} color="#FF6B6B" />
                <ThemedText style={[styles.managementItemText, { color: '#FF6B6B' }]}>Cancel Subscription</ThemedText>
                <IconSymbol name="chevron.right" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <ThemedText style={styles.restoreText}>Restore Purchases</ThemedText>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    );
  }

  // Show pricing plans when upgrade is clicked
  if (showPricing) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setShowPricing(false)}
            >
              <IconSymbol name="chevron.left" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Choose Your Plan
            </ThemedText>
          </View>

          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            {PRICING_PLANS.filter(p => p.id !== 'free').map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.pricingCard,
                  selectedPlan.id === plan.id && styles.pricingCardSelected,
                  plan.popular && styles.pricingCardPopular,
                  { borderColor: selectedPlan.id === plan.id ? '#1a1a1a' : '#e0e0e0' }
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: '#1a1a1a' }]}>
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
                  <View style={[styles.selectedIndicator, { backgroundColor: '#1a1a1a' }]}>
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
                <View style={[styles.featureIcon, { backgroundColor: '#f5f5f5' }]}>
                  <IconSymbol name={feature.icon} size={20} color="#1a1a1a" />
                </View>
                <View style={styles.featureInfo}>
                  <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                  <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <ThemedText style={styles.restoreText}>Restore Purchases</ThemedText>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Purchase Button */}
        <View style={[styles.purchaseContainer, { backgroundColor: '#fff' }]}>
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: '#1a1a1a' }]}
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

        {/* Free Trial Banner */}
        {subscription.plan === 'free' && (
          <TouchableOpacity
            style={[styles.trialBanner, { backgroundColor: '#1a1a1a' }]}
            onPress={handleStartTrial}
            disabled={processing}
          >
            <View style={styles.trialBannerContent}>
              <IconSymbol name="gift.fill" size={24} color="#fff" />
              <View style={styles.trialBannerText}>
                <ThemedText style={styles.trialBannerTitle}>Try Premium Free for 7 Days</ThemedText>
                <ThemedText style={styles.trialBannerSubtitle}>No credit card required</ThemedText>
              </View>
            </View>
            <IconSymbol name="arrow.right.circle.fill" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Features Preview */}
        <View style={styles.featuresPreview}>
          {PREMIUM_FEATURES.slice(0, 4).map((feature) => (
            <View key={feature.id} style={styles.featurePreviewItem}>
              <IconSymbol name={feature.icon} size={24} color="#1a1a1a" />
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
                { borderColor: selectedPlan.id === plan.id ? '#1a1a1a' : '#e0e0e0' }
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: '#1a1a1a' }]}>
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
                <IconSymbol name={feature.icon} size={20} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
              <View style={styles.featureInfo}>
                <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* All Premium Features */}
        <View style={styles.allFeaturesSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            All Premium Features
          </ThemedText>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: '#f5f5f5' }]}>
                <IconSymbol name={feature.icon} size={20} color="#1a1a1a" />
              </View>
              <View style={styles.featureInfo}>
                <ThemedText style={styles.featureName}>{feature.name}</ThemedText>
                <ThemedText style={styles.featureDesc}>{feature.description}</ThemedText>
                {feature.freeLimit && (
                  <ThemedText style={styles.limitText}>
                    Free: {feature.freeLimit} • Premium: {feature.premiumLimit === 'unlimited' ? 'Unlimited' : feature.premiumLimit}
                  </ThemedText>
                )}
              </View>
              <IconSymbol name="checkmark.circle.fill" size={24} color="#4ECDC4" />
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
      <View style={[styles.purchaseContainer, { backgroundColor: '#fff' }]}>
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: '#1a1a1a' }]}
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
    backgroundColor: '#fff',
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  featurePreviewText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  pricingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pricingCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pricingCardSelected: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
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
    color: '#1a1a1a',
  },
  savingsBadge: {
    backgroundColor: '#1a1a1a',
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
    color: '#1a1a1a',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
    color: '#1a1a1a',
  },
  cents: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    color: '#1a1a1a',
  },
  period: {
    fontSize: 14,
    color: '#999',
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
    color: '#666',
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
    backgroundColor: '#1a1a1a',
  },
  allFeaturesSection: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#1a1a1a',
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
  },
  limitText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 140,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#1a1a1a',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  // Premium user styles
  premiumHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  expiryText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  expiryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 24,
  },
  upgradeFromTrialSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  upgradeTrialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    backgroundColor: '#1a1a1a',
  },
  upgradeTrialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  managementSection: {
    marginBottom: 24,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  managementItemText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trialBannerText: {
    gap: 2,
  },
  trialBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trialBannerSubtitle: {
    color: '#999',
    fontSize: 13,
  },
});
