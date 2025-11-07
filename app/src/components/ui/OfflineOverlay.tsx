import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { useNetwork } from '../../contexts/NetworkContext';

const OfflineOverlay: React.FC = () => {
  const { isConnected, checkConnection } = useNetwork();
  const [isChecking, setIsChecking] = React.useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    // Small delay to show loading state
    setTimeout(() => {
      setIsChecking(false);
    }, 500);
  };

  // Don't show overlay if connected
  if (isConnected) {
    return null;
  }

  return (
    <Modal
      visible={!isConnected}
      transparent={false}
      animationType="fade"
      hardwareAccelerated
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <WifiOff size={64} color={COLORS.gray} />
          </View>

          {/* Title */}
          <Text style={styles.title}>No Internet Connection</Text>

          {/* Message */}
          <Text style={styles.message}>
            Please check your connection and try again.
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
            onPress={handleRetry}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <RefreshCw size={20} color={COLORS.white} style={styles.retryIcon} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default OfflineOverlay;

