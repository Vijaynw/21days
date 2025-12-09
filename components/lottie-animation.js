import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Lottie Animation Component (JavaScript)
 * 
 * Usage:
 * <LottieAnimation
 *   source={require('../assets/animations/success.json')}
 *   autoPlay={true}
 *   loop={false}
 *   style={{ width: 200, height: 200 }}
 *   onAnimationFinish={() => console.log('Done!')}
 * />
 */
export function LottieAnimation(props) {
  const source = props.source;
  const autoPlay = props.autoPlay !== undefined ? props.autoPlay : true;
  const loop = props.loop !== undefined ? props.loop : true;
  const speed = props.speed || 1;
  const style = props.style;
  const onAnimationFinish = props.onAnimationFinish;
  const onAnimationLoaded = props.onAnimationLoaded;
  const onAnimationFailure = props.onAnimationFailure;

  const animationRef = useRef(null);

  useEffect(function() {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  // Web platform fallback - lottie-react-native doesn't work on web
  if (Platform.OS === 'web') {
    console.warn('LottieAnimation: Web platform detected. Use lottie-react for web support.');
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.fallback, style]} />
      </View>
    );
  }

  return (
    <LottieView
      ref={animationRef}
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      style={[styles.animation, style]}
      onAnimationFinish={onAnimationFinish}
      onAnimationLoaded={onAnimationLoaded}
      onAnimationFailure={onAnimationFailure}
    />
  );
}

/**
 * Play animation imperatively
 * @param {React.RefObject} ref - Reference to LottieView
 */
export function playAnimation(ref) {
  if (ref && ref.current) {
    ref.current.play();
  }
}

/**
 * Pause animation imperatively
 * @param {React.RefObject} ref - Reference to LottieView
 */
export function pauseAnimation(ref) {
  if (ref && ref.current) {
    ref.current.pause();
  }
}

/**
 * Reset animation imperatively
 * @param {React.RefObject} ref - Reference to LottieView
 */
export function resetAnimation(ref) {
  if (ref && ref.current) {
    ref.current.reset();
  }
}

/**
 * Play animation from a specific frame
 * @param {React.RefObject} ref - Reference to LottieView
 * @param {number} startFrame - Start frame
 * @param {number} endFrame - End frame
 */
export function playFromFrame(ref, startFrame, endFrame) {
  if (ref && ref.current) {
    ref.current.play(startFrame, endFrame);
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  fallback: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
  },
});

export default LottieAnimation;
