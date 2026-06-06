import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }) {
  const logoScale    = useRef(new Animated.Value(0.3)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Floating animation for emoji
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Entrance sequence
    Animated.sequence([
      // Logo pops in
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      // Name fades in
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(900),
      // Fade out whole screen
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      {/* Logo emoji */}
      <Animated.View style={[styles.emojiWrap, {
        transform: [
          { scale: logoScale },
          { translateY: floatAnim },
        ],
      }]}>
        <Text style={styles.emoji}>💸</Text>
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        Billsy
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        know what you're paying for
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#5B5FEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
    backgroundColor: '#ffffff',
  },
  blob1: { width: 300, height: 300, top: -80,  left: -80 },
  blob2: { width: 220, height: 220, bottom: 60, right: -60 },
  blob3: { width: 160, height: 160, top: height * 0.35, left: -40 },

  emojiWrap: {
    width: 110, height: 110, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: { fontSize: 64 },

  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});
