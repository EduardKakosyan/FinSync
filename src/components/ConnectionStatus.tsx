import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { connectionMonitor } from '../utils/connectionMonitor';

export default function ConnectionStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [message, setMessage] = useState('');
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = connectionMonitor.subscribe((state) => {
      const offline = !state.isOnline || !state.isFirestoreConnected;
      setIsOffline(offline);
      
      if (!state.isOnline) {
        setMessage('No internet connection');
      } else if (!state.isFirestoreConnected) {
        setMessage('Syncing data...');
      } else {
        setMessage('');
      }

      // Animate the banner
      Animated.timing(fadeAnim, {
        toValue: offline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return unsubscribe;
  }, []);

  if (!isOffline && !message) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.indicator} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.warning,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.inverse,
    marginRight: 8,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
});