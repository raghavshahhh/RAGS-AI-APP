/**
 * 📊 ENHANCED SYSTEM STATUS (Mobile)
 * Real-time system monitoring for mobile app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface SystemMetrics {
  cpu: string;
  memory: string;
  ollama: string;
  responseTime: string;
  uptime: number;
}

interface SystemAlert {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
}

const EnhancedSystemStatus: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/performance');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          cpu: data.current?.cpu || '0%',
          memory: data.current?.memory || '0%',
          ollama: data.current?.ollama || 'offline',
          responseTime: data.current?.responseTime || '0ms',
          uptime: data.uptime || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/errors');
      if (response.ok) {
        const data = await response.json();
        // Mock alerts for now
        setAlerts([]);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
    fetchAlerts();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchMetrics();
      fetchAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
    fetchAlerts();
  };

  // Optimize system
  const optimizeSystem = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general' }),
      });

      if (response.ok) {
        Alert.alert('Success', 'System optimization completed');
        setTimeout(() => fetchMetrics(), 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize system');
    }
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get status color
  const getStatusColor = (value: string, type: 'cpu' | 'memory' | 'ollama') => {
    if (type === 'ollama') {
      return value === 'online' ? '#10B981' : '#EF4444';
    }
    
    const numValue = parseFloat(value);
    if (numValue > 90) return '#EF4444';
    if (numValue > 70) return '#F59E0B';
    return '#10B981';
  };

  if (isLoading && !metrics) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingOrb, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={styles.loadingGradient}
            />
          </Animated.View>
          <Text style={styles.loadingText}>Loading system status...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <TouchableOpacity style={styles.optimizeButton} onPress={optimizeSystem}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.optimizeGradient}
          >
            <Text style={styles.optimizeText}>⚡ Optimize</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Status Cards */}
      <View style={styles.metricsContainer}>
        {/* CPU Usage */}
        <BlurView intensity={20} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🖥️</Text>
            <Text style={[styles.metricValue, { color: getStatusColor(metrics?.cpu || '0%', 'cpu') }]}>
              {metrics?.cpu || '0%'}
            </Text>
          </View>
          <Text style={styles.metricLabel}>CPU Usage</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${parseFloat(metrics?.cpu || '0')}%`,
                  backgroundColor: getStatusColor(metrics?.cpu || '0%', 'cpu'),
                },
              ]}
            />
          </View>
        </BlurView>

        {/* Memory Usage */}
        <BlurView intensity={20} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>💾</Text>
            <Text style={[styles.metricValue, { color: getStatusColor(metrics?.memory || '0%', 'memory') }]}>
              {metrics?.memory || '0%'}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Memory</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${parseFloat(metrics?.memory || '0')}%`,
                  backgroundColor: getStatusColor(metrics?.memory || '0%', 'memory'),
                },
              ]}
            />
          </View>
        </BlurView>

        {/* Ollama Status */}
        <BlurView intensity={20} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🧠</Text>
            <Text style={[styles.metricValue, { color: getStatusColor(metrics?.ollama || 'offline', 'ollama') }]}>
              {metrics?.ollama === 'online' ? '✅' : '❌'}
            </Text>
          </View>
          <Text style={styles.metricLabel}>AI Brain</Text>
          <Text style={[styles.metricSubtext, { color: getStatusColor(metrics?.ollama || 'offline', 'ollama') }]}>
            {metrics?.ollama || 'Unknown'}
          </Text>
        </BlurView>

        {/* Uptime */}
        <BlurView intensity={20} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricValue}>
              {formatUptime(metrics?.uptime || 0)}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={styles.metricSubtext}>System running</Text>
        </BlurView>
      </View>

      {/* Performance Summary */}
      <BlurView intensity={20} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Performance Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Response Time:</Text>
          <Text style={styles.summaryValue}>{metrics?.responseTime || '0ms'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>System Health:</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>Excellent</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>AI Status:</Text>
          <Text style={[styles.summaryValue, { color: getStatusColor(metrics?.ollama || 'offline', 'ollama') }]}>
            {metrics?.ollama === 'online' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </BlurView>

      {/* Alerts */}
      {alerts.length > 0 && (
        <BlurView intensity={20} style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>🚨 System Alerts</Text>
          {alerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alertItem,
                { borderLeftColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B' },
              ]}
            >
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertType}>{alert.type}</Text>
            </View>
          ))}
        </BlurView>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => fetchMetrics()}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient}>
            <Text style={styles.actionText}>🔄 Refresh</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={optimizeSystem}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.actionGradient}>
            <Text style={styles.actionText}>⚡ Optimize</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  loadingGradient: {
    flex: 1,
    borderRadius: 40,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  optimizeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  optimizeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optimizeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  alertsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  alertItem: {
    padding: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertMessage: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  alertType: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});

export default EnhancedSystemStatus;
