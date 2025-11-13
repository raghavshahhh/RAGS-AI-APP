import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useVoiceRecording } from './src/hooks/useVoiceRecording';
import { useCamera } from './src/hooks/useCamera';
import CameraScreen from './src/components/CameraScreen';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showCamera, setShowCamera] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [lastResponse, setLastResponse] = useState('');

  // Voice recording hook
  const {
    isRecording,
    isProcessing,
    recordAndProcess,
    hasPermission: hasAudioPermission,
  } = useVoiceRecording();

  // Camera hook
  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCamera();

  useEffect(() => {
    // Pulse animation for the orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleVoicePress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!hasAudioPermission) {
      Alert.alert(
        'Microphone Permission',
        'Please grant microphone permission to use voice features.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await recordAndProcess();

      if (result && result.response) {
        setLastResponse(result.response);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to process voice input');
    }
  };

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to connect to backend
        const response = await fetch('http://localhost:3000/health');
        setIsConnected(response.ok);
      } catch (error) {
        // If localhost fails, try network IP (for testing on device)
        try {
          const response = await fetch('http://192.168.1.100:3000/health');
          setIsConnected(response.ok);
        } catch (err) {
          setIsConnected(false);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0e27', '#1a1f3a', '#0a0e27']}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>RAGS AI</Text>
        <Text style={styles.subtitle}>Your Personal AI Assistant</Text>
      </View>

      {/* AI Orb */}
      <View style={styles.orbContainer}>
        <Animated.View
          style={[
            styles.orbGlow,
            {
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['#00d9ff', '#7000ff', '#00d9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.orb,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#00d9ff', '#7000ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbInner}
          />
        </Animated.View>

        {isRecording && (
          <View style={styles.listeningIndicator}>
            <Text style={styles.listeningText}>🎤 Recording...</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.listeningIndicator}>
            <Text style={styles.listeningText}>🧠 Processing...</Text>
          </View>
        )}
      </View>

      {/* Voice Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isRecording ? ['#ff0080', '#7000ff'] : isProcessing ? ['#ffa500', '#ff6b00'] : ['#00d9ff', '#7000ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.voiceButtonGradient}
          >
            <Text style={styles.voiceButtonText}>
              {isProcessing ? '⏳ Processing...' : isRecording ? '⏹️ Stop' : '🎤 Speak'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Last Response */}
      {lastResponse && (
        <View style={styles.responseBox}>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </View>
      )}

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActions}
        contentContainerStyle={styles.quickActionsContent}
      >
        <QuickActionCard
          icon="📷"
          title="Camera"
          subtitle="Capture photo"
          onPress={() => setShowCamera(true)}
        />
        <QuickActionCard
          icon="📝"
          title="Content"
          subtitle="Generate posts"
        />
        <QuickActionCard
          icon="✅"
          title="Habits"
          subtitle="Track progress"
        />
        <QuickActionCard
          icon="🤖"
          title="Automate"
          subtitle="Smart tasks"
        />
        <QuickActionCard
          icon="📊"
          title="Analytics"
          subtitle="View insights"
        />
      </ScrollView>

      {/* Status */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00ff88' : '#ff4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'AI Ready • Connected' : 'Offline Mode'}
        </Text>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavButton icon="🏠" label="Home" active={currentScreen === 'home'} onPress={() => setCurrentScreen('home')} />
        <NavButton icon="💬" label="Chat" active={currentScreen === 'chat'} onPress={() => setCurrentScreen('chat')} />
        <NavButton icon="⚡" label="Auto" active={currentScreen === 'auto'} onPress={() => setCurrentScreen('auto')} />
        <NavButton icon="⚙️" label="Settings" active={currentScreen === 'settings'} onPress={() => setCurrentScreen('settings')} />
      </View>

      {/* Camera Modal */}
      {showCamera && (
        <CameraScreen
          onClose={() => setShowCamera(false)}
          onCapture={(photo) => {
            console.log('📷 Photo captured:', photo.uri);
            Alert.alert('Success', 'Photo captured! Analyzing...');
            setShowCamera(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const NavButton = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.navButton}
    activeOpacity={0.7}
  >
    <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const QuickActionCard = ({ icon, title, subtitle, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={onPress}>
    <BlurView intensity={20} style={styles.actionCardBlur}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </BlurView>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00d9ff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b92b0',
    marginTop: 8,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    marginBottom: 40,
  },
  orbGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.5,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orbInner: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  listeningIndicator: {
    position: 'absolute',
    bottom: 20,
  },
  listeningText: {
    color: '#00d9ff',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceButton: {
    alignSelf: 'center',
    marginBottom: 30,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceButtonActive: {
    shadowColor: '#ff0080',
  },
  voiceButtonGradient: {
    paddingHorizontal: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  actionCard: {
    width: 140,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  actionCardBlur: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 31, 58, 0.6)',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: '#8b92b0',
    fontSize: 12,
  },
  statusBar: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 31, 58, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#8b92b0',
    fontSize: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 31, 58, 0.95)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 217, 255, 0.1)',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#8b92b0',
    fontSize: 10,
  },
  navLabelActive: {
    color: '#00d9ff',
  },
  responseBox: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(26, 31, 58, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  responseText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
});

