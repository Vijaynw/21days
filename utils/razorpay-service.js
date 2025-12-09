/**
 * Razorpay Payment Service (JavaScript)
 * 
 * This module handles Razorpay payment integration for React Native.
 * 
 * IMPORTANT: 
 * - For Expo, you need a development build (not Expo Go)
 * - Run: npx expo prebuild and npx expo run:ios/android
 * - Replace RAZORPAY_KEY_ID with your actual test/live key
 */

import { Platform } from 'react-native';

// Try to import RazorpayCheckout - will fail if not installed
let RazorpayCheckout = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (_error) {
  console.warn('react-native-razorpay not installed. Run: npm install react-native-razorpay');
}

// Configuration - Replace with your actual keys
const RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXX'; // Replace with your test key

/**
 * Check if Razorpay is available
 */
export function isRazorpayAvailable() {
  if (!RazorpayCheckout) {
    console.error('Razorpay: Module not installed');
    return false;
  }
  
  if (typeof RazorpayCheckout.open !== 'function') {
    console.error('Razorpay: .open() method not found');
    return false;
  }
  
  return true;
}

/**
 * Create payment options object
 */
export function createPaymentOptions(params) {
  const amount = params.amount;
  const currency = params.currency || 'INR';
  const orderId = params.orderId;
  const name = params.name || '21Days';
  const description = params.description || 'Premium Subscription';
  const prefill = params.prefill || {};
  const theme = params.theme || {};
  const notes = params.notes || {};

  return {
    key: RAZORPAY_KEY_ID,
    amount: amount,
    currency: currency,
    name: name,
    description: description,
    order_id: orderId,
    prefill: {
      email: prefill.email || '',
      contact: prefill.contact || '',
      name: prefill.name || '',
    },
    theme: {
      color: theme.color || '#1a1a1a',
    },
    notes: Object.assign({ app: '21days-habit-tracker' }, notes),
  };
}

/**
 * Open Razorpay checkout
 */
export function openRazorpayCheckout(options) {
  return new Promise(function(resolve, reject) {
    // Check if Razorpay is available
    if (!isRazorpayAvailable()) {
      reject({
        success: false,
        error: 'Razorpay is not available. Please install react-native-razorpay and rebuild the app.',
        code: 'MODULE_NOT_FOUND',
      });
      return;
    }

    // Validate options
    if (!options || !options.amount) {
      reject({
        success: false,
        error: 'Invalid payment options: amount is required',
        code: 'INVALID_OPTIONS',
      });
      return;
    }

    if (!options.key) {
      reject({
        success: false,
        error: 'Invalid payment options: Razorpay key is required',
        code: 'INVALID_KEY',
      });
      return;
    }

    console.log('Opening Razorpay checkout...');

    RazorpayCheckout.open(options)
      .then(function(data) {
        console.log('Payment success:', data);
        resolve({
          success: true,
          paymentId: data.razorpay_payment_id,
          orderId: data.razorpay_order_id,
          signature: data.razorpay_signature,
        });
      })
      .catch(function(error) {
        console.error('Payment error:', error);
        
        let errorMessage = 'Payment failed';
        let errorCode = 'PAYMENT_FAILED';
        
        if (error.code === 'PAYMENT_CANCELLED' || error.code === 2) {
          errorMessage = 'Payment was cancelled';
          errorCode = 'PAYMENT_CANCELLED';
        } else if (error.description) {
          errorMessage = error.description;
        } else if (error.message) {
          errorMessage = error.message;
        }

        reject({
          success: false,
          error: errorMessage,
          code: errorCode,
          rawError: error,
        });
      });
  });
}

/**
 * Process complete payment flow
 */
export async function processPayment(params) {
  const planId = params.planId;
  const amount = params.amount;
  const planName = params.planName;
  const userEmail = params.userEmail;
  const userName = params.userName;
  const userPhone = params.userPhone;

  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Create payment options
    const options = createPaymentOptions({
      amount: amount * 100, // Convert to paise
      description: 'Premium Plan - ' + (planName || planId),
      prefill: {
        email: userEmail || '',
        name: userName || '',
        contact: userPhone || '',
      },
    });

    // Open checkout
    const paymentResult = await openRazorpayCheckout(options);

    return {
      success: true,
      paymentId: paymentResult.paymentId,
      orderId: paymentResult.orderId,
      message: 'Payment successful!',
    };

  } catch (error) {
    console.error('Process payment error:', error);
    return {
      success: false,
      error: error.error || error.message || 'Payment failed',
      code: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Debug Razorpay setup
 */
export function debugRazorpay() {
  console.log('=== Razorpay Debug ===');
  console.log('Platform:', Platform.OS);
  console.log('RazorpayCheckout loaded:', !!RazorpayCheckout);
  
  if (RazorpayCheckout) {
    console.log('RazorpayCheckout.open exists:', typeof RazorpayCheckout.open === 'function');
    console.log('Available methods:', Object.keys(RazorpayCheckout));
  }
  
  return {
    platform: Platform.OS,
    moduleLoaded: !!RazorpayCheckout,
    openMethodExists: typeof RazorpayCheckout?.open === 'function',
    isAvailable: isRazorpayAvailable(),
  };
}

export default {
  isRazorpayAvailable,
  createPaymentOptions,
  openRazorpayCheckout,
  processPayment,
  debugRazorpay,
};
