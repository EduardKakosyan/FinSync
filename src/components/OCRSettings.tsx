import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Colors, Typography } from '../constants/colors';
import { SPACING } from '../constants/dimensions';
import { ocrService } from '../services/ocr';
import { NETWORK_SETUP_INSTRUCTIONS } from '../config/ocr';
import { debugLogger } from '../utils/debugLogger';

interface OCRSettingsProps {
  onClose?: () => void;
}

const OCRSettings: React.FC<OCRSettingsProps> = ({ onClose }) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    endpoint?: string;
    availableEndpoints?: string[];
    error?: string;
  } | null>(null);
  
  const [laptopIP, setLaptopIP] = useState('192.168.4.48');
  const [port, setPort] = useState('1234');
  const [autoDetect, setAutoDetect] = useState(true);
  const [customEndpoint, setCustomEndpoint] = useState('');

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = () => {
    const config = ocrService.getConfig();
    setLaptopIP(config.network.laptopIP);
    setPort(config.network.port.toString());
    setAutoDetect(config.network.autoDetect);
    
    if (config.detected) {
      setConnectionStatus({
        success: true,
        endpoint: config.detected
      });
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Update network config before testing
      ocrService.updateNetworkConfig({
        laptopIP: laptopIP.trim(),
        port: parseInt(port) || 1234,
        autoDetect
      });

      const result = await ocrService.testConnection();
      setConnectionStatus(result);

      if (result.success) {
        Alert.alert(
          'Connection Successful! 🎉',
          `Connected to OCR service at:\n${result.endpoint}\n\nFound ${result.availableEndpoints?.length || 0} available endpoints.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Connection Failed ❌',
          result.error || 'Unable to connect to OCR service',
          [
            { text: 'Show Setup Guide', onPress: showSetupGuide },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      debugLogger.error('OCR connection test failed', error);
      setConnectionStatus({
        success: false,
        error: error.message || 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const showSetupGuide = () => {
    const instructions = NETWORK_SETUP_INSTRUCTIONS;
    Alert.alert(
      'LM Studio Setup Guide',
      `${instructions.lmStudio.steps.join('\n')}\n\n${instructions.troubleshooting.tips.join('\n')}`,
      [{ text: 'Got it' }]
    );
  };

  const testCustomEndpoint = async () => {
    if (!customEndpoint.trim()) {
      Alert.alert('Error', 'Please enter a custom endpoint URL');
      return;
    }

    setIsTestingConnection(true);
    
    try {
      ocrService.updateConfig({ baseURL: customEndpoint.trim() });
      const result = await ocrService.testConnection();
      setConnectionStatus(result);

      if (result.success) {
        Alert.alert('Success', `Connected to custom endpoint:\n${customEndpoint}`);
      } else {
        Alert.alert('Failed', result.error || 'Custom endpoint test failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Custom endpoint test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const refreshEndpoint = async () => {
    setIsTestingConnection(true);
    try {
      const endpoint = await ocrService.refreshEndpoint();
      if (endpoint) {
        setConnectionStatus({
          success: true,
          endpoint
        });
        Alert.alert('Success', `Refreshed endpoint:\n${endpoint}`);
      } else {
        Alert.alert('No Endpoint Found', 'Unable to detect any OCR services');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to refresh endpoint');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OCR Service Settings</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connection Status */}
      {connectionStatus && (
        <View style={[
          styles.statusContainer,
          connectionStatus.success ? styles.statusSuccess : styles.statusError
        ]}>
          <Text style={styles.statusTitle}>
            {connectionStatus.success ? '✅ Connected' : '❌ Connection Failed'}
          </Text>
          {connectionStatus.endpoint && (
            <Text style={styles.statusText}>Endpoint: {connectionStatus.endpoint}</Text>
          )}
          {connectionStatus.error && (
            <Text style={styles.statusText}>Error: {connectionStatus.error}</Text>
          )}
          {connectionStatus.availableEndpoints && connectionStatus.availableEndpoints.length > 1 && (
            <Text style={styles.statusText}>
              {connectionStatus.availableEndpoints.length} endpoints available
            </Text>
          )}
        </View>
      )}

      {/* Auto Detection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Detection</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Automatically find OCR service</Text>
          <Switch
            value={autoDetect}
            onValueChange={setAutoDetect}
            trackColor={{ false: Colors.disabled, true: Colors.accent }}
            thumbColor={autoDetect ? Colors.primary : Colors.text.light}
          />
        </View>
        <Text style={styles.helpText}>
          When enabled, the app will automatically search for OCR services on your network
        </Text>
      </View>

      {/* Network Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Laptop IP Address</Text>
          <TextInput
            style={styles.input}
            value={laptopIP}
            onChangeText={setLaptopIP}
            placeholder="192.168.4.48"
            placeholderTextColor={Colors.text.light}
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>
            Your laptop's IP address (currently detected: 192.168.4.48)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LM Studio Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="1234"
            placeholderTextColor={Colors.text.light}
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>
            LM Studio server port (default: 1234)
          </Text>
        </View>
      </View>

      {/* Custom Endpoint */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Endpoint</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={customEndpoint}
            onChangeText={setCustomEndpoint}
            placeholder="http://192.168.1.100:1234"
            placeholderTextColor={Colors.text.light}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testCustomEndpoint}
            disabled={isTestingConnection}
          >
            <Text style={styles.secondaryButtonText}>Test Custom Endpoint</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testConnection}
          disabled={isTestingConnection}
        >
          {isTestingConnection ? (
            <ActivityIndicator color={Colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={refreshEndpoint}
          disabled={isTestingConnection}
        >
          <Text style={styles.secondaryButtonText}>Refresh Endpoint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={showSetupGuide}
        >
          <Text style={styles.secondaryButtonText}>Setup Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Available Endpoints */}
      {connectionStatus?.availableEndpoints && connectionStatus.availableEndpoints.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Endpoints</Text>
          {connectionStatus.availableEndpoints.map((endpoint, index) => (
            <View key={endpoint} style={styles.endpointItem}>
              <Text style={[
                styles.endpointText,
                index === 0 && styles.primaryEndpointText
              ]}>
                {index === 0 ? '🎯 ' : '• '}{endpoint}
              </Text>
              {index === 0 && (
                <Text style={styles.endpointLabel}>Primary</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  statusContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  statusError: {
    backgroundColor: Colors.danger + '20',
    borderColor: Colors.danger,
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: SPACING.xs,
  },
  section: {
    margin: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: SPACING.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    marginBottom: SPACING.sm,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  button: {
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  endpointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  endpointText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  primaryEndpointText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  endpointLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default OCRSettings;