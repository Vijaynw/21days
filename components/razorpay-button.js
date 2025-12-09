/**
 * Razorpay Payment Button Component (JavaScript)
 * 
 * Usage:
 * <RazorpayButton
 *   planId="yearly"
 *   amount={999}
 *   planName="Yearly Premium"
 *   userEmail="user@example.com"
 *   onSuccess={(result) => console.log('Success:', result)}
 *   onFailure={(error) => console.log('Failed:', error)}
 * />
 */

import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { debugRazorpay, isRazorpayAvailable, processPayment } from '../utils/razorpay-service';

export function RazorpayButton(props) {
  const planId = props.planId;
  const amount = props.amount;
  const planName = props.planName;
  const userEmail = props.userEmail || '';
  const userName = props.userName || '';
  const userPhone = props.userPhone || '';
  const onSuccess = props.onSuccess;
  const onFailure = props.onFailure;
  const style = props.style;
  const textStyle = props.textStyle;
  const disabled = props.disabled;

  const [loading, setLoading] = useState(false);

  async function handlePress() {
    if (loading || disabled) return;

    // Check if Razorpay is available
    if (!isRazorpayAvailable()) {
      Alert.alert(
        'Payment Not Available',
        'Payment system is not configured. Please contact support.',
        [{ text: 'OK' }]
      );
      
      // Log debug info
      const debugInfo = debugRazorpay();
      console.log('Razorpay debug:', debugInfo);
      
      if (onFailure) {
        onFailure({ error: 'Razorpay not available', code: 'MODULE_NOT_FOUND' });
      }
      return;
    }

    setLoading(true);

    try {
      const result = await processPayment({
        planId: planId,
        amount: amount,
        planName: planName,
        userEmail: userEmail,
        userName: userName,
        userPhone: userPhone,
      });

      if (result.success) {
        Alert.alert(
          'Payment Successful!',
          'Thank you for your purchase. Your payment ID: ' + result.paymentId,
          [{ text: 'OK' }]
        );
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        // Payment failed but not cancelled
        if (result.code !== 'PAYMENT_CANCELLED') {
          Alert.alert('Payment Failed', result.error || 'Please try again.');
        }
        
        if (onFailure) {
          onFailure(result);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // Only show alert if not cancelled
      if (error.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
      
      if (onFailure) {
        onFailure({ error: error.message || 'Unknown error', code: error.code });
      }
    } finally {
      setLoading(false);
    }
  }

  // Format amount for display
  const displayAmount = typeof amount === 'number' ? amount.toFixed(0) : amount;

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={[styles.buttonText, textStyle]}>Processing...</Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, textStyle]}>
          Pay ₹{displayAmount} - {planName || 'Premium'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Simple pay button without plan details
 */
export function SimplePayButton(props) {
  const amount = props.amount;
  const label = props.label || 'Pay Now';
  const onSuccess = props.onSuccess;
  const onFailure = props.onFailure;
  const style = props.style;

  return (
    <RazorpayButton
      planId="custom"
      amount={amount}
      planName={label}
      onSuccess={onSuccess}
      onFailure={onFailure}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default RazorpayButton;
